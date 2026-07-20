import { describe, expect, it, vi } from "vitest";
import { Subject, firstValueFrom } from "rxjs";
import { take, toArray } from "rxjs/operators";

import { doBottle } from "../nodelogic/datautils/bottling.js";
import {
  createControlEnvelope,
  createDataEnvelope,
  createRetryEnvelope,
  createTimerEnvelope,
  isRuntimeEnvelope,
  unwrapRuntimeEnvelope,
} from "./eventEnvelope.js";
import {
  POLICY_EXECUTION_DECISIONS,
  driveNodeByRuntimePolicy,
  shouldExecuteByRuntimePolicy,
} from "./policyExecution.js";

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const makeDriver = ({
  policy,
  dataInputs = [flow()],
  control = controlFlow(),
  metaCtrl$,
  transformation,
  traceSink = { emit: vi.fn() },
} = {}) => {
  const output = driveNodeByRuntimePolicy({
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    metaCtrl$,
    context: {
      nodeId: "node-1",
      runtimeTargetKey: "leafelement:test",
    },
    policy,
    transformation,
    observability: {
      traceSink,
    },
  });
  return {
    control,
    dataInputs,
    output,
    traceSink,
  };
};

describe("policy execution helpers", () => {
  it("decides data, control, timer, retry, and manual replay trigger policies", () => {
    const dataEvent = createDataEnvelope("hello", {
      eventId: "data-1",
      graphInstanceId: "graph-1",
    });
    const controlEvent = createControlEnvelope({
      eventId: "control-1",
      graphInstanceId: "graph-1",
      intent: "refresh_config",
    });
    const timerEvent = createTimerEnvelope({
      eventId: "timer-1",
      graphInstanceId: "graph-1",
      timerId: "timer-a",
      sequence: 7,
    });
    const retryEvent = createRetryEnvelope({
      eventId: "retry-1",
      graphInstanceId: "graph-1",
      targetAttemptId: "attempt-1",
    });
    const replayEvent = createControlEnvelope({
      eventId: "replay-1",
      graphInstanceId: "graph-1",
      intent: "replay",
      targetEventId: "data-1",
    });

    expect(
      shouldExecuteByRuntimePolicy({
        event: dataEvent,
        policy: { mode: "policy", trigger: "data" },
      }).decision,
    ).toBe(POLICY_EXECUTION_DECISIONS.EXECUTE);
    expect(
      shouldExecuteByRuntimePolicy({
        event: controlEvent,
        policy: {
          mode: "policy",
          trigger: "control",
          allowedControlIntents: ["refresh_config"],
        },
      }).decision,
    ).toBe(POLICY_EXECUTION_DECISIONS.EXECUTE);
    expect(
      shouldExecuteByRuntimePolicy({
        event: timerEvent,
        policy: { mode: "policy", trigger: "timer" },
      }).decision,
    ).toBe(POLICY_EXECUTION_DECISIONS.EXECUTE);
    expect(
      shouldExecuteByRuntimePolicy({
        event: retryEvent,
        policy: { mode: "policy", trigger: "retry" },
      }).decision,
    ).toBe(POLICY_EXECUTION_DECISIONS.EXECUTE);
    expect(
      shouldExecuteByRuntimePolicy({
        event: replayEvent,
        policy: { mode: "policy", trigger: "manual-replay" },
      }).decision,
    ).toBe(POLICY_EXECUTION_DECISIONS.EXECUTE);
  });

  it("runs a pure data transform without executing on control-only ticks", async () => {
    const driver = makeDriver({
      policy: { mode: "policy", trigger: "data" },
      transformation: {
        leaflogic: ([value]) => value.toUpperCase(),
      },
    });
    const outputPromise = firstValueFrom(driver.output._stream);
    const controlPromise = firstValueFrom(driver.output._control._stream.pipe(take(2), toArray()));

    driver.control._stream.next(
      createControlEnvelope({
        eventId: "ctrl-1",
        graphInstanceId: "graph-1",
        intent: "refresh_config",
      }),
    );
    driver.dataInputs[0]._stream.next("hello");

    expect(await outputPromise).toBe("HELLO");
    expect((await controlPromise).map((event) => event.decision)).toEqual(["skip", "execute"]);
  });

  it("preserves legacy pre, leaflogic, and post ordering with raw bottles", async () => {
    const seen = [];
    const bottle = doBottle("message", { text: "hello" });
    const driver = makeDriver({
      policy: { mode: "policy", trigger: "data" },
      transformation: {
        datalogic: {
          pre: (value) => {
            seen.push(["pre", value._bname]);
            return value._content.text;
          },
          post: (value) => {
            seen.push(["post", value]);
            return doBottle("result", value);
          },
        },
        leaflogic: ([value]) => {
          seen.push(["leaflogic", value]);
          return value.toUpperCase();
        },
      },
    });
    const outputPromise = firstValueFrom(driver.output._stream);

    driver.dataInputs[0]._stream.next(
      createDataEnvelope(bottle, {
        eventId: "data-bottle",
        graphInstanceId: "graph-1",
      }),
    );

    const output = await outputPromise;
    expect(isRuntimeEnvelope(output)).toBe(true);
    expect(unwrapRuntimeEnvelope(output)).toEqual(doBottle("result", "HELLO"));
    expect(output.trace.parentEventIds).toEqual(["data-bottle"]);
    expect(seen).toEqual([
      ["pre", "message"],
      ["leaflogic", "hello"],
      ["post", "HELLO"],
    ]);
  });

  it("supports primary-input, all-inputs, any-input, latest-context, and windowed join shapes", async () => {
    const primaryInputs = [flow(), flow()];
    const primary = makeDriver({
      dataInputs: primaryInputs,
      policy: {
        mode: "policy",
        trigger: "primary-input",
        join: { mode: "primary-input", primaryInputIndex: 1 },
      },
      transformation: {
        leaflogic: ([value]) => `primary:${value}`,
      },
    });
    const primaryPromise = firstValueFrom(primary.output._stream);
    primaryInputs[0]._stream.next("ignored");
    primaryInputs[1]._stream.next("main");
    expect(await primaryPromise).toBe("primary:main");

    const allInputs = [flow(), flow()];
    const all = makeDriver({
      dataInputs: allInputs,
      policy: { mode: "policy", trigger: "all-inputs", join: { mode: "all-inputs" } },
      transformation: {
        leaflogic: (values) => values.join("+"),
      },
    });
    const allPromise = firstValueFrom(all.output._stream);
    allInputs[0]._stream.next("a");
    allInputs[1]._stream.next("b");
    expect(await allPromise).toBe("a+b");

    const any = makeDriver({
      policy: { mode: "policy", trigger: "any-input", join: { mode: "any-input" } },
      transformation: {
        leaflogic: ([value]) => `any:${value}`,
      },
    });
    const anyPromise = firstValueFrom(any.output._stream);
    any.dataInputs[0]._stream.next("x");
    expect(await anyPromise).toBe("any:x");

    const latestInputs = [flow(), flow()];
    const latest = makeDriver({
      dataInputs: latestInputs,
      policy: { mode: "policy", trigger: "data", join: { mode: "latest-context" } },
      transformation: {
        leaflogic: (values) => values.join("|"),
      },
    });
    latestInputs[1]._stream.next("ctx");
    const latestPromise = firstValueFrom(latest.output._stream);
    latestInputs[0]._stream.next("main");
    expect(await latestPromise).toBe("main|ctx");

    const windowed = makeDriver({
      policy: {
        mode: "policy",
        trigger: "data",
        join: { mode: "windowed", windowSize: 2 },
      },
      transformation: {
        leaflogic: ([window]) => window.join(","),
      },
    });
    const windowPromise = firstValueFrom(windowed.output._stream.pipe(take(2), toArray()));
    windowed.dataInputs[0]._stream.next("w1");
    windowed.dataInputs[0]._stream.next("w2");
    expect(await windowPromise).toEqual(["w1", "w1,w2"]);
  });

  it("handles a leafelement-shaped adapter through the legacy flow adapter", async () => {
    const driver = makeDriver({
      policy: { mode: "policy", trigger: "data" },
      transformation: {
        leaflogic: ([value], _control, runtime) => ({
          elementname: "text",
          target: runtime.context.runtimeTargetKey,
          value,
        }),
      },
    });
    const outputPromise = firstValueFrom(driver.output._stream);

    driver.dataInputs[0]._stream.next("render-me");

    expect(await outputPromise).toEqual({
      elementname: "text",
      target: "leafelement:test",
      value: "render-me",
    });
  });

  it("blocks control-only redispatch for legacy-shaped side-effecting adapters in policy mode", async () => {
    const executionSpy = vi.fn((values) => values[0]);
    const driver = makeDriver({
      policy: { mode: "policy", trigger: "data" },
      transformation: {
        leaflogic: executionSpy,
      },
    });
    const outputPromise = firstValueFrom(driver.output._stream);

    driver.dataInputs[0]._stream.next("command-1");
    expect(await outputPromise).toBe("command-1");
    driver.control._stream.next(
      createControlEnvelope({
        eventId: "ctrl-duplicate",
        graphInstanceId: "graph-1",
        intent: "legacy_tick",
      }),
    );

    expect(executionSpy).toHaveBeenCalledTimes(1);
    expect(driver.traceSink.emit.mock.calls.at(-1)[0]).toMatchObject({
      actualExecute: false,
      eventKind: "control",
    });
  });

  it("can explicitly sample latest data for allowed control-driven nodes", async () => {
    const driver = makeDriver({
      policy: {
        mode: "policy",
        trigger: "control",
        allowedControlIntents: ["refresh_config"],
        join: { allowSamplingLatestData: true },
      },
      transformation: {
        leaflogic: (values) => `control:${values[0]}`,
      },
    });
    const outputPromise = firstValueFrom(driver.output._stream);
    driver.dataInputs[0]._stream.next("latest");
    driver.control._stream.next(
      createControlEnvelope({
        eventId: "ctrl-refresh",
        graphInstanceId: "graph-1",
        intent: "refresh_config",
      }),
    );

    expect(unwrapRuntimeEnvelope(await outputPromise)).toBe("control:latest");
  });

  it("keeps metaCtrl traceable without implicitly replaying latest data", async () => {
    const metaCtrl$ = new Subject();
    const executionSpy = vi.fn();
    const driver = makeDriver({
      metaCtrl$,
      policy: { mode: "policy", trigger: "data" },
      transformation: {
        leaflogic: executionSpy,
      },
    });
    const controlPromise = firstValueFrom(driver.output._control._stream.pipe(take(2), toArray()));

    driver.dataInputs[0]._stream.next("data-1");
    metaCtrl$.next(
      createControlEnvelope({
        eventId: "meta-1",
        graphInstanceId: "graph-1",
        intent: "refresh_config",
      }),
    );

    expect(executionSpy).toHaveBeenCalledTimes(1);
    expect((await controlPromise).map((event) => event.decision)).toEqual(["execute", "skip"]);
    expect(driver.traceSink.emit.mock.calls.at(-1)[0]).toMatchObject({
      metaControl: true,
      actualExecute: false,
    });
  });

  it("preserves timer event IDs, sequence numbers, parent IDs, and deterministic output ordering", async () => {
    const driver = makeDriver({
      policy: { mode: "policy", trigger: "timer" },
      transformation: {
        leaflogic: (_values, _control, runtime) => `timer:${runtime.event.eventId}`,
      },
    });
    const outputPromise = firstValueFrom(driver.output._stream.pipe(take(2), toArray()));

    driver.control._stream.next(
      createTimerEnvelope({
        eventId: "timer-1",
        graphInstanceId: "graph-1",
        sequence: 1,
        parentEventIds: ["parent-1"],
        timerId: "timer",
      }),
    );
    driver.control._stream.next(
      createTimerEnvelope({
        eventId: "timer-2",
        graphInstanceId: "graph-1",
        sequence: 2,
        parentEventIds: ["parent-2"],
        timerId: "timer",
      }),
    );

    const outputs = await outputPromise;
    expect(outputs.map((output) => output.payload)).toEqual(["timer:timer-1", "timer:timer-2"]);
    expect(outputs[0].eventId).toBe("timer-1:out");
    expect(outputs[0].sequence).toBe(1);
    expect(outputs[0].trace.parentEventIds).toEqual(["timer-1", "parent-1"]);
    expect(outputs[1].eventId).toBe("timer-2:out");
  });
});

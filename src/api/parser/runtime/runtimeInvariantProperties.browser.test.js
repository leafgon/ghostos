import { Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { createRuntimeEnvelopeFactory, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import { driveNodeByRuntimePolicy } from "./policyExecution.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "./sideEffectMigrationHarness.js";

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const createHarness = (options = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "property-side-effect",
    runtimeTargetKey: "leafelement:property-side-effect",
    executeSideEffect: vi.fn(({ command, attempt }) => ({
      ok: true,
      attemptId: attempt.attemptId,
      command: command.domainCommandId,
    })),
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    ...options,
  });

const createPolicyDriver = ({ policy, transformation, dataInputCount = 1 }) => {
  const dataInputs = Array.from({ length: dataInputCount }, flow);
  const control = controlFlow();
  const metaCtrl$ = new Subject();
  const runtimeSinks = createInMemoryRuntimeSinks();
  const outputs = [];
  const decisions = [];
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId: "property-runtime",
    idFactory: createDeterministicIdFactory(),
  });
  const driver = driveNodeByRuntimePolicy({
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    metaCtrl$,
    context: {
      nodeId: "property-node",
      runtimeTargetKey: "node:property-node",
    },
    policy,
    transformation,
    observability: {
      traceSink: runtimeSinks.traceSink,
    },
  });

  driver._stream.subscribe((output) => {
    outputs.push(unwrapRuntimeEnvelope(output));
  });
  driver._control._stream.subscribe((event) => {
    decisions.push(event);
  });

  const sendLane = (laneIndex, value, eventId = `lane-${laneIndex}-${value}`) => {
    dataInputs[laneIndex]._stream.next(
      eventFactory.data(
        {
          laneIndex,
          value,
          eventId,
        },
        {
          eventId,
          sourceNodeId: `source-${laneIndex}`,
        },
      ),
    );
  };

  const sendControlTick = (eventId = "control-1") => {
    control._stream.next(
      eventFactory.control({
        eventId,
        sourceNodeId: "runtime",
        targetNodeId: "property-node",
        intent: "legacy_tick",
      }),
    );
  };

  const sendConfigRefresh = (eventId = "config-1") => {
    metaCtrl$.next(
      eventFactory.control({
        eventId,
        sourceNodeId: "runtime",
        targetNodeId: "property-node",
        intent: "refresh_config",
      }),
    );
  };

  return {
    dataInputs,
    control,
    metaCtrl$,
    outputs,
    decisions,
    runtimeSinks,
    sendLane,
    sendControlTick,
    sendConfigRefresh,
  };
};

describe("runtime invariant property regressions", () => {
  it.each([
    { controlTicks: 0, configTicks: 0 },
    { controlTicks: 1, configTicks: 0 },
    { controlTicks: 3, configTicks: 2 },
    { controlTicks: 10, configTicks: 5 },
  ])(
    "keeps side-effect count at one for one data event plus $controlTicks control and $configTicks config ticks",
    async ({ controlTicks, configTicks }) => {
      const executeSideEffect = vi.fn(({ command }) => ({ ok: command.domainCommandId }));
      const harness = createHarness({ executeSideEffect });

      await harness.sendDataCommand(harness.createCommand({ domainCommandId: "one-command" }), {
        eventId: "data-1",
      });
      for (let index = 0; index < controlTicks; index += 1) {
        await harness.sendControlTick({ eventId: `control-${index}` });
      }
      for (let index = 0; index < configTicks; index += 1) {
        await harness.sendConfigRefresh({ eventId: `config-${index}` });
      }

      expect(executeSideEffect).toHaveBeenCalledTimes(1);
      expect(harness.snapshot().executions).toHaveLength(1);
      expect(
        harness
          .snapshot()
          .observability.traces.filter((event) => event.event === "policy_driver_decision")
          .filter((event) => event.actualExecute),
      ).toHaveLength(1);
    },
  );

  it.each([1, 3, 5])("executes once for each of %i unique idempotency keys", async (count) => {
    const executeSideEffect = vi.fn(({ command }) => ({ ok: command.domainCommandId }));
    const harness = createHarness({ executeSideEffect });

    for (let index = 0; index < count; index += 1) {
      await harness.sendDataCommand(harness.createCommand({ domainCommandId: `unique-${index}` }), {
        eventId: `data-${index}`,
      });
    }

    expect(executeSideEffect).toHaveBeenCalledTimes(count);
    expect(harness.snapshot().executions.map((event) => event.result.outcome)).toEqual(
      Array.from({ length: count }, () => "succeeded"),
    );
  });

  it.each([2, 5, 9])(
    "suppresses %i duplicate sends with the same idempotency key within TTL",
    async (sendCount) => {
      const executeSideEffect = vi.fn(({ command }) => ({ ok: command.domainCommandId }));
      const harness = createHarness({ executeSideEffect });
      const command = harness.createCommand({ domainCommandId: "duplicate-command" });

      for (let index = 0; index < sendCount; index += 1) {
        await harness.sendDataCommand(command, { eventId: `duplicate-${index}` });
      }

      expect(executeSideEffect).toHaveBeenCalledTimes(1);
      expect(harness.snapshot().executions[0].result.outcome).toBe("succeeded");
      expect(
        harness
          .snapshot()
          .executions.slice(1)
          .every((event) => event.result.outcome === "suppressed"),
      ).toBe(true);
      expect(
        harness
          .snapshot()
          .observability.metrics.some(
            (event) => event.name === "ghostos_side_effect_suppressed_total",
          ),
      ).toBe(true);
    },
  );

  it.each([1, 2, 3])("bounds retryable failure attempts at maxAttempts=%i", async (maxAttempts) => {
    const executeSideEffect = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("timeout"), { code: "timeout" }));
    const harness = createHarness({
      executeSideEffect,
      retry: {
        enabled: true,
        maxAttempts,
        retryableErrors: ["timeout"],
      },
    });

    const result = await harness.sendDataCommand(
      harness.createCommand({ domainCommandId: `retry-${maxAttempts}` }),
      { eventId: `data-retry-${maxAttempts}` },
    );

    expect(executeSideEffect).toHaveBeenCalledTimes(maxAttempts);
    expect(result.executions[0].result.outcome).toBe("failed");
    expect(result.executions[0].result.attempts).toHaveLength(maxAttempts);
  });

  it("does not retry non-retryable failures even when retry policy allows other errors", async () => {
    const executeSideEffect = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("fatal"), { code: "fatal" }));
    const harness = createHarness({
      executeSideEffect,
      retry: {
        enabled: true,
        maxAttempts: 4,
        retryableErrors: ["timeout"],
      },
    });

    const result = await harness.sendDataCommand(
      harness.createCommand({ domainCommandId: "fatal" }),
      { eventId: "data-fatal" },
    );

    expect(executeSideEffect).toHaveBeenCalledTimes(1);
    expect(result.executions[0].result.attempts).toHaveLength(1);
  });

  it("keeps pure transform output deterministic for fixed input/config sequences", () => {
    const runSequence = () => {
      let configSuffix = "alpha";
      const driver = createPolicyDriver({
        policy: { mode: "policy", trigger: "data" },
        transformation: {
          leaflogic: ([value]) => `${value.value}:${configSuffix}`,
        },
      });

      driver.sendLane(0, "first", "data-1");
      configSuffix = "beta";
      driver.sendConfigRefresh("config-beta");
      driver.sendControlTick("control-after-config");
      driver.sendLane(0, "second", "data-2");
      driver.sendLane(0, "third", "data-3");

      return {
        outputs: driver.outputs,
        decisions: driver.decisions.map((event) => [event.decision, event.reason]),
      };
    };

    expect(runSequence()).toEqual(runSequence());
    expect(runSequence().outputs).toEqual(["first:alpha", "second:beta", "third:beta"]);
  });

  it.each([
    {
      sequence: [0, 1],
      expectedOutputs: 1,
    },
    {
      sequence: [0, 0, 1],
      expectedOutputs: 1,
    },
    {
      sequence: [0, 1, 0, 1],
      expectedOutputs: 2,
    },
    {
      sequence: [1, 0, 1, 0],
      expectedOutputs: 2,
    },
  ])(
    "keeps all-input join output count at complete fresh sets for $sequence",
    ({ sequence, expectedOutputs }) => {
      const driver = createPolicyDriver({
        dataInputCount: 2,
        policy: {
          mode: "policy",
          trigger: "all-inputs",
          join: {
            mode: "all-inputs",
          },
        },
        transformation: {
          leaflogic: (values) => values.map((value) => value.value).join("+"),
        },
      });

      sequence.forEach((laneIndex, index) => {
        driver.sendLane(laneIndex, `${laneIndex}:${index}`, `${laneIndex}:${index}`);
      });

      expect(driver.outputs).toHaveLength(expectedOutputs);
      expect(driver.outputs.length).toBeLessThanOrEqual(Math.floor(sequence.length / 2));
    },
  );

  it.each([
    {
      sequence: [0, 0],
      expectedOutputs: 0,
    },
    {
      sequence: [1, 0, 0],
      expectedOutputs: 2,
    },
    {
      sequence: [0, 1, 0],
      expectedOutputs: 1,
    },
    {
      sequence: [1, 1, 0, 1, 0],
      expectedOutputs: 2,
    },
  ])(
    "keeps primary-input output count equal to primary events after context for $sequence",
    ({ sequence, expectedOutputs }) => {
      const driver = createPolicyDriver({
        dataInputCount: 2,
        policy: {
          mode: "policy",
          trigger: "primary-input",
          join: {
            mode: "latest-context",
            primaryInputIndex: 0,
            requiredInputIndexes: [1],
          },
        },
        transformation: {
          leaflogic: (values) => values.map((value) => value.value).join("+"),
        },
      });

      sequence.forEach((laneIndex, index) => {
        driver.sendLane(laneIndex, `${laneIndex}:${index}`, `${laneIndex}:${index}`);
      });

      expect(driver.outputs).toHaveLength(expectedOutputs);
    },
  );
});

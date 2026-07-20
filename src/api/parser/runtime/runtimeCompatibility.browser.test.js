import { Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { createRuntimeEnvelopeFactory, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import { driveNodeWithRuntimeOptions, resolveRuntimeExecutionPolicy } from "./policyExecution.js";
import { GhostRuntimeOptionsError, createInMemoryRuntimeSinks } from "./runtimeOptions.js";

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const createCompatibilityDriver = ({
  runtimeTargetKey = "leafelement:http",
  runtimeConfig,
  runtimeOptions,
  targetPolicy = { trigger: "data" },
  transformation,
  runtimeSinks = createInMemoryRuntimeSinks(),
} = {}) => {
  const dataInput = flow();
  const control = controlFlow();
  const outputs = [];
  const decisions = [];
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId: "compatibility-rollout",
    idFactory: (() => {
      let index = 0;
      return (prefix) => {
        index += 1;
        return `${prefix}-${index}`;
      };
    })(),
  });
  const driver = driveNodeWithRuntimeOptions({
    runtimeTargetKey,
    runtimeConfig,
    runtimeOptions,
    targetPolicy,
    inflowCtrlObj: control,
    dataInflowObjArr: [dataInput],
    transformation: transformation ?? {
      leaflogic: ([value], controlValue, runtime) => ({
        value,
        controlIntent: controlValue?.intent,
        mode: runtime.context.runtimeExecutionMode,
        reason: runtime.decision.reason,
      }),
    },
    observability: {
      traceSink: runtimeSinks.traceSink,
      metricSink: runtimeSinks.metricSink,
    },
  });

  driver._stream.subscribe((output) => {
    outputs.push(unwrapRuntimeEnvelope(output));
  });
  driver._control._stream.subscribe((event) => {
    decisions.push(event);
  });

  const sendData = (value, eventId = "data-1") => {
    dataInput._stream.next(
      eventFactory.data(value, {
        eventId,
        sourceNodeId: "source",
      }),
    );
  };
  const sendControl = (eventId = "control-1") => {
    control._stream.next(
      eventFactory.control({
        eventId,
        sourceNodeId: "runtime",
        targetNodeId: "node",
        intent: "legacy_tick",
      }),
    );
  };

  return {
    dataInput,
    control,
    outputs,
    decisions,
    runtimeSinks,
    sendData,
    sendControl,
  };
};

describe("runtime compatibility rollout", () => {
  it("runs data-oriented targets in policy execution mode by default", () => {
    const driver = createCompatibilityDriver();

    driver.sendData("hello", "data-1");
    driver.sendControl("control-1");

    expect(driver.outputs).toMatchObject([
      {
        mode: "policy",
        reason: "data",
      },
    ]);
    expect(driver.decisions.map((event) => [event.decision, event.reason])).toEqual([
      ["execute", "data"],
      ["skip", "not_meaningful_data"],
    ]);
    expect(driver.runtimeSinks.snapshot().metrics).toEqual([]);
  });

  it("keeps explicit legacy compatibility mode available", () => {
    const driver = createCompatibilityDriver({
      runtimeConfig: {
        featureFlags: {
          enableTriggerPolicy: false,
        },
      },
    });

    driver.sendData("hello", "data-1");
    driver.sendControl("control-1");

    expect(driver.outputs).toMatchObject([
      {
        mode: "legacy",
        reason: "legacy",
      },
      {
        mode: "legacy",
        reason: "legacy",
      },
    ]);
    expect(driver.decisions.map((event) => event.decision)).toEqual(["execute", "execute"]);
  });

  it("uses target-key allow lists for partial rollout and rollback", () => {
    const runtimeConfig = {
      featureFlags: {
        enableTriggerPolicy: true,
        defaultTriggerMode: "legacy",
        dataTriggeredTargets: ["leafelement:http"],
        dualTraceExecution: true,
      },
    };
    const optedIn = createCompatibilityDriver({
      runtimeTargetKey: "leafelement:http",
      runtimeConfig,
    });
    const nonOpted = createCompatibilityDriver({
      runtimeTargetKey: "leafelement:hermes",
      runtimeConfig,
    });

    optedIn.sendData("hello", "data-1");
    optedIn.sendControl("control-1");
    nonOpted.sendControl("legacy-control");

    expect(optedIn.outputs).toHaveLength(1);
    expect(optedIn.outputs[0]).toMatchObject({
      mode: "policy",
      reason: "data",
    });
    expect(optedIn.decisions.map((event) => [event.decision, event.reason])).toEqual([
      ["execute", "data"],
      ["skip", "not_meaningful_data"],
    ]);
    expect(nonOpted.outputs).toMatchObject([
      {
        mode: "legacy",
        reason: "legacy",
      },
    ]);
  });

  it("emits dual trace fields and divergence metrics for opted-in control suppression", () => {
    const driver = createCompatibilityDriver({
      runtimeConfig: {
        featureFlags: {
          enableTriggerPolicy: true,
          dataTriggeredTargets: ["leafelement:http"],
          dualTraceExecution: true,
        },
      },
    });

    driver.sendData("hello", "data-1");
    driver.sendControl("control-1");

    const policyTraces = driver.runtimeSinks
      .snapshot()
      .traces.filter((event) => event.event === "policy_driver_decision");
    expect(policyTraces).toMatchObject([
      {
        compatibilityMode: "policy",
        legacyWouldExecute: true,
        policyWouldExecute: true,
        actualExecute: true,
      },
      {
        compatibilityMode: "policy",
        legacyWouldExecute: true,
        policyWouldExecute: false,
        actualExecute: false,
        reason: "not_meaningful_data",
      },
    ]);
    expect(driver.runtimeSinks.snapshot().metrics).toEqual([
      {
        name: "ghostos_runtime_policy_divergence_total",
        labels: {
          compatibilityMode: "policy",
          trigger: "data",
          reason: "not_meaningful_data",
        },
        value: 1,
      },
    ]);
  });

  it("resolves feature flags by canonical target key and rejects malformed targets before execution", () => {
    expect(
      resolveRuntimeExecutionPolicy({
        runtimeTargetKey: "node:leaflisp",
        runtimeConfig: {
          featureFlags: {
            enableTriggerPolicy: true,
            dataTriggeredTargets: ["node:leaflisp"],
          },
        },
      }),
    ).toMatchObject({
      mode: "policy",
      optedIn: true,
    });
    expect(() =>
      resolveRuntimeExecutionPolicy({
        runtimeTargetKey: "http",
        runtimeConfig: {
          featureFlags: {
            enableTriggerPolicy: true,
          },
        },
      }),
    ).toThrow(GhostRuntimeOptionsError);
    expect(() =>
      resolveRuntimeExecutionPolicy({
        runtimeTargetKey: "leafelement:http",
        runtimeConfig: {
          featureFlags: {
            enableTriggerPolicy: true,
            dataTriggeredTargets: ["http"],
          },
        },
      }),
    ).toThrow(GhostRuntimeOptionsError);
  });

  it("runs with resolved no-op browser sinks and no environment variables", () => {
    const transform = vi.fn(([value]) => value.toUpperCase());
    const driver = createCompatibilityDriver({
      runtimeOptions: resolveRuntimeExecutionPolicy({
        runtimeTargetKey: "node:leaflisp",
      }).runtimeOptions,
      runtimeTargetKey: "node:leaflisp",
      transformation: {
        leaflogic: transform,
      },
    });

    expect(() => driver.sendData("browser", "data-browser")).not.toThrow();
    expect(transform).toHaveBeenCalledWith(
      ["browser"],
      expect.objectContaining({
        eventId: "data-browser",
        eventKind: "data",
      }),
      expect.objectContaining({
        context: expect.objectContaining({
          runtimeExecutionMode: "policy",
        }),
      }),
    );
  });
});

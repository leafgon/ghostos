import { describe, expect, it, vi } from "vitest";

import { createDataEnvelope, createRuntimeEnvelopeFactory } from "./eventEnvelope.js";
import { redactValue } from "./safeLogging.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "./sideEffectMigrationHarness.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

const canonicalJson = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
};

const fingerprintPrefix = (value) => {
  const input = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
};

const createGenericDataWorkflow = ({
  executeAction,
  actionPolicy = { mode: "policy", trigger: "data" },
  retry = {
    enabled: true,
    maxAttempts: 2,
    retryableErrors: ["timeout"],
  },
} = {}) => {
  const graphInstanceId = "generic-data-workflow";
  const sourceFactory = createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });
  const sinkOutputs = [];
  const commandByEventId = new Map();
  let config = {
    version: "config-v1",
    settings: {
      suffix: "alpha",
      priority: 1,
    },
  };

  const resolveConfig = () => ({
    version: config.version,
    fingerprintPrefix: fingerprintPrefix(config.settings),
    settings: config.settings,
  });

  const action = createSideEffectAdapterMigrationHarness({
    adapterName: "generic-action",
    runtimeTargetKey: "leafelement:generic-action",
    graphInstanceId,
    nodeId: "action-node",
    policy: actionPolicy,
    retry,
    executeSideEffect: executeAction,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
  });

  const appendSinkOutputs = (actionResult) => {
    for (const execution of actionResult.executions) {
      const result = execution.result;
      const command =
        result?.value?.command ??
        commandByEventId.get(result?.eventId) ??
        commandByEventId.get(result?.originalEventId) ??
        {};
      const sinkEvent = redactValue({
        type:
          result?.outcome === "failed"
            ? "generic_workflow_action_error"
            : "generic_workflow_sink_output",
        eventId: `sink:${result?.eventId ?? execution.eventId}`,
        parentEventIds: [
          result?.eventId,
          ...(command.parentEventIds ?? []),
          ...(result?.originalEventId && result.originalEventId !== result.eventId
            ? [result.originalEventId]
            : []),
        ].filter(Boolean),
        trigger: execution.executionCause,
        outcome: result?.outcome,
        idempotencyDecision: result?.decision ?? "reserved",
        attemptIds: result?.attempts?.map((attempt) => attempt.attemptId) ?? [],
        attemptEventIds: result?.attempts?.map((attempt) => attempt.eventId) ?? [],
        idempotencyKey: result?.idempotencyKey,
        configVersion: command.configVersion,
        configFingerprintPrefix: command.configFingerprintPrefix,
        transformedValue: command.payload?.transformedValue,
        error: result?.error,
      });
      sinkOutputs.push(sinkEvent);
    }
  };

  const runSource = async ({
    eventId,
    value,
    domainCommandId = `command:${eventId}`,
    secretPayload,
  }) => {
    const sourceEvent = sourceFactory.data(
      {
        value,
        token: secretPayload?.token,
        authorization: secretPayload?.authorization,
        cookie: secretPayload?.cookie,
      },
      {
        eventId,
        sourceNodeId: "source-node",
        trigger: "source",
      },
    );
    const currentConfig = resolveConfig();
    const transformEvent = createDataEnvelope(
      {
        domainCommandId,
        payload: {
          sourceValue: value,
          transformedValue: `${value}:${currentConfig.settings.suffix}`,
          token: secretPayload?.token,
          authorization: secretPayload?.authorization,
          cookie: secretPayload?.cookie,
        },
        sourceEventId: sourceEvent.eventId,
        transformEventId: `transform:${sourceEvent.eventId}`,
        parentEventIds: [sourceEvent.eventId],
        configVersion: currentConfig.version,
        configFingerprintPrefix: currentConfig.fingerprintPrefix,
      },
      {
        eventId: `transform:${sourceEvent.eventId}`,
        sourceNodeId: "transform-node",
        graphInstanceId,
        parentEventIds: [sourceEvent.eventId],
        trigger: "data",
        trace: {
          configVersion: currentConfig.version,
          configFingerprintPrefix: currentConfig.fingerprintPrefix,
        },
      },
    );
    commandByEventId.set(transformEvent.eventId, transformEvent.payload);

    const actionResult = await action.sendDataCommand(transformEvent.payload, {
      eventId: transformEvent.eventId,
      sourceNodeId: transformEvent.sourceNodeId,
      graphInstanceId,
      parentEventIds: transformEvent.trace.parentEventIds,
      trigger: transformEvent.trace.trigger,
      trace: {
        configVersion: currentConfig.version,
        configFingerprintPrefix: currentConfig.fingerprintPrefix,
      },
    });
    appendSinkOutputs(actionResult);
    return {
      sourceEvent,
      transformEvent,
      actionResult,
      sinkOutputs: [...sinkOutputs],
    };
  };

  const sendControlTicks = async (count) => {
    const results = [];
    for (let index = 1; index <= count; index += 1) {
      results.push(await action.sendControlTick({ eventId: `control:${index}` }));
    }
    return results;
  };

  const refreshConfig = async ({ version, settings }) => {
    config = {
      version,
      settings,
    };
    return action.sendConfigRefresh({
      eventId: `config:${version}`,
      configVersion: version,
      trace: {
        configVersion: version,
        configFingerprintPrefix: fingerprintPrefix(settings),
      },
    });
  };

  const replay = async ({ eventId, targetEventId }) => {
    const actionResult = await action.sendReplay({ eventId, targetEventId });
    appendSinkOutputs(actionResult);
    return {
      actionResult,
      sinkOutputs: [...sinkOutputs],
    };
  };

  const snapshot = () =>
    redactValue({
      action: action.snapshot(),
      sinkOutputs,
      config: resolveConfig(),
    });

  return {
    action,
    runSource,
    sendControlTicks,
    refreshConfig,
    replay,
    snapshot,
    sinkOutputs,
  };
};

describe("generic source -> transform -> action -> sink workflow", () => {
  it("executes one action per source event, suppresses control/config ticks, and uses new config on the next source event", async () => {
    const executeAction = vi.fn(({ command, attempt }) => ({
      ok: true,
      attemptId: attempt.attemptId,
      command: {
        parentEventIds: command.parentEventIds,
        configVersion: command.configVersion,
        configFingerprintPrefix: command.configFingerprintPrefix,
        payload: command.payload,
      },
      authorization: "Bearer abc123",
    }));
    const workflow = createGenericDataWorkflow({ executeAction });

    const first = await workflow.runSource({
      eventId: "source-1",
      value: "order",
      domainCommandId: "command-1",
      secretPayload: {
        token: "secret-token",
        authorization: "Bearer abc123",
        cookie: "sessionid=abc",
      },
    });
    await workflow.sendControlTicks(2);
    const configRefresh = await workflow.refreshConfig({
      version: "config-v2",
      settings: {
        priority: 1,
        suffix: "beta",
      },
    });
    const second = await workflow.runSource({
      eventId: "source-2",
      value: "order",
      domainCommandId: "command-2",
    });

    expect(executeAction).toHaveBeenCalledTimes(2);
    expect(first.sourceEvent).toMatchObject({
      eventId: "source-1",
      trace: {
        trigger: "source",
      },
    });
    expect(first.transformEvent.trace.parentEventIds).toEqual(["source-1"]);
    expect(first.actionResult.executions[0]).toMatchObject({
      executionCause: "data",
      result: {
        outcome: "succeeded",
        eventId: "transform:source-1",
        attempts: [
          {
            attemptId: "side-effect-attempt-1",
            eventId: "transform:source-1",
          },
        ],
      },
    });
    expect(workflow.sinkOutputs[0]).toMatchObject({
      eventId: "sink:transform:source-1",
      parentEventIds: ["transform:source-1", "source-1"],
      trigger: "data",
      idempotencyDecision: "reserved",
      configVersion: "config-v1",
      transformedValue: "order:alpha",
    });
    expect(configRefresh.decisions.every((event) => event.decision === "skip")).toBe(true);
    expect(second.actionResult.executions[0]).toMatchObject({
      result: {
        outcome: "succeeded",
        eventId: "transform:source-2",
      },
    });
    expect(workflow.sinkOutputs.map((event) => event.eventId)).toEqual([
      "sink:transform:source-1",
      "sink:transform:source-2",
    ]);
    expect(workflow.sinkOutputs[1]).toMatchObject({
      configVersion: "config-v2",
      transformedValue: "order:beta",
    });
    expect(workflow.sinkOutputs[0].configFingerprintPrefix).not.toBe(
      workflow.sinkOutputs[1].configFingerprintPrefix,
    );
    expect(
      workflow
        .snapshot()
        .action.observability.traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => [event.decision, event.reason]),
    ).toEqual([
      ["execute", "data"],
      ["skip", "not_meaningful_data"],
      ["skip", "not_meaningful_data"],
      ["skip", "not_meaningful_data"],
      ["execute", "data"],
    ]);
    expect(
      workflow
        .snapshot()
        .action.observability.traces.some(
          (event) => event.event === "side_effect_reserve" && event.decision === "reserved",
        ),
    ).toBe(true);
    assertNoSecretLeak(workflow.snapshot());
  });

  it("retries timeout failures under declared policy and emits typed sink errors for non-retryable failures", async () => {
    const timeoutAction = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("timed out"), { code: "timeout" }))
      .mockImplementationOnce(({ command }) => ({
        ok: true,
        command: {
          configVersion: command.configVersion,
          configFingerprintPrefix: command.configFingerprintPrefix,
          payload: command.payload,
          parentEventIds: command.parentEventIds,
        },
      }));
    const retryWorkflow = createGenericDataWorkflow({ executeAction: timeoutAction });

    const retried = await retryWorkflow.runSource({
      eventId: "source-retry",
      value: "retry",
      domainCommandId: "command-retry",
    });

    expect(timeoutAction).toHaveBeenCalledTimes(2);
    expect(retried.actionResult.executions[0]).toMatchObject({
      result: {
        outcome: "succeeded",
        attempts: [
          {
            attemptId: "side-effect-attempt-1",
            eventId: "transform:source-retry",
          },
          {
            attemptId: "side-effect-attempt-2",
            eventId: "transform:source-retry",
          },
        ],
      },
    });
    expect(
      retryWorkflow
        .snapshot()
        .action.observability.traces.filter((event) => event.event === "side_effect_reserve")
        .map((event) => event.decision),
    ).toEqual(["reserved", "retry_reserved"]);

    const fatalAction = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("fatal action"), { code: "fatal" }));
    const fatalWorkflow = createGenericDataWorkflow({ executeAction: fatalAction });
    const failed = await fatalWorkflow.runSource({
      eventId: "source-fatal",
      value: "fatal",
      domainCommandId: "command-fatal",
    });

    expect(fatalAction).toHaveBeenCalledTimes(1);
    expect(failed.actionResult.executions[0]).toMatchObject({
      type: "side_effect_migration_result",
      result: {
        outcome: "failed",
        error: {
          code: "fatal",
        },
      },
    });
    expect(fatalWorkflow.sinkOutputs[0]).toMatchObject({
      type: "generic_workflow_action_error",
      eventId: "sink:transform:source-fatal",
      parentEventIds: ["transform:source-fatal", "source-fatal"],
      trigger: "data",
      outcome: "failed",
      attemptIds: ["side-effect-attempt-1"],
      error: {
        code: "fatal",
      },
    });
  });

  it("requires explicit manual replay and records replay provenance plus duplicate suppression", async () => {
    const executeAction = vi.fn(({ command }) => ({
      ok: true,
      command: {
        parentEventIds: command.parentEventIds,
        configVersion: command.configVersion,
        configFingerprintPrefix: command.configFingerprintPrefix,
        payload: command.payload,
      },
    }));
    const workflow = createGenericDataWorkflow({
      executeAction,
      actionPolicy: {
        mode: "policy",
        trigger: "manual-replay",
        join: {
          allowSamplingLatestData: true,
        },
      },
    });

    await workflow.runSource({
      eventId: "source-replay",
      value: "replay",
      domainCommandId: "command-replay",
    });
    expect(executeAction).not.toHaveBeenCalled();

    const replayed = await workflow.replay({
      eventId: "replay-1",
      targetEventId: "transform:source-replay",
    });
    const duplicateReplay = await workflow.replay({
      eventId: "replay-2",
      targetEventId: "transform:source-replay",
    });

    expect(executeAction).toHaveBeenCalledTimes(1);
    expect(replayed.actionResult.executions[0]).toMatchObject({
      executionCause: "manual-replay",
      result: {
        outcome: "succeeded",
        eventId: "replay-1",
        originalEventId: "transform:source-replay",
      },
    });
    expect(replayed.sinkOutputs[0]).toMatchObject({
      eventId: "sink:replay-1",
      parentEventIds: ["replay-1", "source-replay", "transform:source-replay"],
      trigger: "manual-replay",
      outcome: "succeeded",
    });
    expect(duplicateReplay.actionResult.executions[0]).toMatchObject({
      executionCause: "manual-replay",
      result: {
        outcome: "suppressed",
        decision: "duplicate_succeeded",
        eventId: "replay-2",
        originalEventId: "transform:source-replay",
      },
    });
    expect(duplicateReplay.sinkOutputs[1]).toMatchObject({
      eventId: "sink:replay-2",
      idempotencyDecision: "duplicate_succeeded",
      trigger: "manual-replay",
    });
    expect(
      workflow
        .snapshot()
        .action.observability.traces.some(
          (event) =>
            event.event === "policy_driver_decision" &&
            event.reason === "manual-replay" &&
            event.actualExecute === true,
        ),
    ).toBe(true);
    expect(
      workflow
        .snapshot()
        .action.observability.traces.some((event) => event.event === "side_effect_suppressed"),
    ).toBe(true);
  });
});

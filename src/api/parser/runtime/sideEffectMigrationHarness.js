import { Subject } from "rxjs";

import {
  createRuntimeContext,
  createRuntimeEnvelopeFactory,
  isRuntimeEnvelope,
} from "./eventEnvelope.js";
import { createMemoryIdempotencyStore } from "./idempotencyStore.js";
import { driveNodeByRuntimePolicy } from "./policyExecution.js";
import { createInMemoryRuntimeSinks, validateRuntimeTargetKey } from "./runtimeOptions.js";
import { redactValue } from "./safeLogging.js";
import { createIdempotentSideEffectRunner } from "./sideEffectWrapper.js";

const DEFAULT_GRAPH_INSTANCE_ID = "side-effect-migration-graph";
const DEFAULT_NODE_ID = "side-effect-adapter-node";
const DEFAULT_ADAPTER_NAME = "fake-side-effect-adapter";
const DEFAULT_TENANT_ID = "tenant-1";
const DEFAULT_INTEGRATION_INSTANCE_ID = "integration-1";
const DEFAULT_PRODUCER_ID = "producer-1";

class SideEffectMigrationHarnessError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "SideEffectMigrationHarnessError";
    this.code = "invalid_side_effect_migration_harness";
    this.details = details;
  }
}

const assertFunction = (value, field) => {
  if (typeof value !== "function") {
    throw new SideEffectMigrationHarnessError(`${field} must be a function.`, {
      field,
      value,
    });
  }
  return value;
};

const assertNonEmptyString = (value, field) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SideEffectMigrationHarnessError(`${field} must be a non-empty string.`, {
      field,
      value,
    });
  }
  return value.trim();
};

const createDeterministicIdFactory = () => {
  let index = 0;
  return (prefix = "id") => {
    index += 1;
    return `${prefix}-${index}`;
  };
};

const createFlow = () => ({ _stream: new Subject() });

const createControlFlow = () => ({ _stream: new Subject(), _config: {} });

const getEventField = (event, field) => (isRuntimeEnvelope(event) ? event[field] : undefined);

const defaultResolveCommand = ({ inputValues }) => {
  const command = inputValues[0];
  if (!command || typeof command !== "object" || Array.isArray(command)) {
    throw new SideEffectMigrationHarnessError("side-effect adapter commands must be objects.", {
      field: "command",
      value: command,
    });
  }
  return command;
};

const defaultResolveIdempotency = ({ command, defaults }) => {
  const idempotency = command.idempotency ?? {};
  return {
    required: idempotency.required ?? true,
    key: idempotency.key,
    scope: idempotency.scope,
    domainCommandId: idempotency.domainCommandId ?? command.domainCommandId,
    tenantId: idempotency.tenantId ?? command.tenantId ?? defaults.tenantId,
    integrationInstanceId:
      idempotency.integrationInstanceId ??
      command.integrationInstanceId ??
      defaults.integrationInstanceId,
    producerId: idempotency.producerId ?? command.producerId ?? defaults.producerId,
    allowGraphLocalFallback: idempotency.allowGraphLocalFallback,
  };
};

const defaultRetryPolicy = Object.freeze({
  enabled: true,
  maxAttempts: 2,
  retryableErrors: Object.freeze(["timeout", "rate_limited", "server_error"]),
});

const defaultPolicy = Object.freeze({
  mode: "policy",
  trigger: "data",
});

const getOriginalEventId = (event, command) => {
  if (command.originalEventId) {
    return command.originalEventId;
  }
  if (event?.targetEventId) {
    return event.targetEventId;
  }
  return getEventField(event, "eventId");
};

/**
 * Adapts a side-effecting node into the migration test shape without migrating
 * the concrete adapter itself. Future adapter tests should pass:
 * - executeSideEffect: the fake or wrapped side-effect call under assertion.
 * - resolveCommand: maps legacy leaflogic input/control/runtime values to a command object.
 * - resolveIdempotency: maps that command to wrapper idempotency metadata.
 */
const createSideEffectAdapterMigrationHarness = ({
  adapterName = DEFAULT_ADAPTER_NAME,
  runtimeTargetKey = `leafelement:${adapterName}`,
  nodeId = DEFAULT_NODE_ID,
  graphInstanceId = DEFAULT_GRAPH_INSTANCE_ID,
  tenantId = DEFAULT_TENANT_ID,
  integrationInstanceId = DEFAULT_INTEGRATION_INSTANCE_ID,
  producerId = DEFAULT_PRODUCER_ID,
  policy = defaultPolicy,
  retry = defaultRetryPolicy,
  dataInputCount = 1,
  executeSideEffect,
  resolveCommand = defaultResolveCommand,
  resolveIdempotency = defaultResolveIdempotency,
  idempotencyStore,
  runtimeSinks = createInMemoryRuntimeSinks(),
  idFactory = createDeterministicIdFactory(),
  eventIdFactory = createDeterministicIdFactory(),
  runner = createIdempotentSideEffectRunner({ idFactory }),
} = {}) => {
  assertFunction(executeSideEffect, "executeSideEffect");
  assertFunction(resolveCommand, "resolveCommand");
  assertFunction(resolveIdempotency, "resolveIdempotency");
  assertNonEmptyString(adapterName, "adapterName");
  validateRuntimeTargetKey(runtimeTargetKey);
  if (!Number.isSafeInteger(dataInputCount) || dataInputCount <= 0) {
    throw new SideEffectMigrationHarnessError("dataInputCount must be a positive safe integer.", {
      field: "dataInputCount",
      value: dataInputCount,
    });
  }

  const store =
    idempotencyStore === undefined
      ? createMemoryIdempotencyStore({
          traceSink: runtimeSinks.traceSink,
          logSink: runtimeSinks.logSink,
        })
      : idempotencyStore;
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: eventIdFactory,
  });
  const dataInputs = Array.from({ length: dataInputCount }, createFlow);
  const control = createControlFlow();
  const metaCtrl$ = new Subject();
  const decisions = [];
  const outputs = [];
  const executions = [];
  const pendingExecutions = [];
  let commandIndex = 0;

  const defaults = Object.freeze({
    tenantId,
    integrationInstanceId,
    producerId,
  });

  const runSideEffect = ({ inputValues, controlValue, runtime }) => {
    const execution = (async () => {
      const command = resolveCommand({
        inputValues,
        controlValue,
        runtime,
        adapterName,
        runtimeTargetKey,
      });
      const event = runtime.event;
      const runtimeContext = createRuntimeContext(event, {
        nodeId,
        runtimeTargetKey,
        tenantId: command.tenantId ?? tenantId,
        integrationInstanceId: command.integrationInstanceId ?? integrationInstanceId,
        producerId: command.producerId ?? producerId,
        domainCommandId: command.domainCommandId,
        originalEventId: getOriginalEventId(event, command),
      });
      const executionCause = runtime.decision?.reason ?? event.trace?.trigger;
      runtimeSinks.traceSink.emit({
        event: "side_effect_migration_execute",
        adapterName,
        runtimeTargetKey,
        executionCause,
        eventId: runtimeContext.eventId,
        eventKind: runtimeContext.eventKind,
        intent: runtimeContext.intent,
        command,
      });
      runtimeSinks.metricSink.record("ghostos_side_effect_migration_execution_total", {
        adapterName,
        runtimeTargetKey,
        executionCause,
        eventKind: runtimeContext.eventKind,
        intent: runtimeContext.intent,
      });

      const result = await runner.run({
        execute: (attempt) =>
          executeSideEffect({
            attempt,
            command,
            inputValues,
            controlValue,
            runtime,
            runtimeContext,
            adapterName,
            runtimeTargetKey,
          }),
        idempotencyStore: store,
        idempotency: resolveIdempotency({
          command,
          runtime,
          runtimeContext,
          defaults,
          adapterName,
          runtimeTargetKey,
        }),
        retry,
        runtimeContext,
        observability: runtimeSinks,
      });
      const executionEvent = redactValue({
        type: "side_effect_migration_result",
        adapterName,
        runtimeTargetKey,
        executionCause,
        result,
      });
      executions.push(executionEvent);
      runtimeSinks.logSink.info(executionEvent);
      return executionEvent;
    })().catch((error) => {
      const event = runtime.event;
      const errorEvent = redactValue({
        type: "side_effect_migration_error",
        adapterName,
        runtimeTargetKey,
        eventId: getEventField(event, "eventId"),
        eventKind: getEventField(event, "eventKind"),
        intent: getEventField(event, "intent"),
        executionCause: runtime.decision?.reason ?? event?.trace?.trigger,
        error,
      });
      executions.push(errorEvent);
      runtimeSinks.traceSink.emit({
        event: "side_effect_migration_error",
        ...errorEvent,
      });
      runtimeSinks.logSink.error(errorEvent);
      return errorEvent;
    });
    pendingExecutions.push(execution);
    return execution;
  };

  const driver = driveNodeByRuntimePolicy({
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    metaCtrl$,
    context: {
      nodeId,
      runtimeTargetKey,
    },
    policy,
    transformation: {
      leaflogic: (inputValues, controlValue, runtime) =>
        runSideEffect({ inputValues, controlValue, runtime }),
    },
    observability: {
      traceSink: runtimeSinks.traceSink,
    },
  });

  driver._stream.subscribe((output) => {
    outputs.push(output);
  });
  driver._control._stream.subscribe((decision) => {
    decisions.push(redactValue(decision));
  });

  const flush = async () => {
    const settled = await Promise.all(pendingExecutions);
    return settled.map((result) => redactValue(result));
  };

  const dispatchAndFlush = async (dispatch) => {
    const previousDecisionCount = decisions.length;
    const previousExecutionCount = executions.length;
    const previousOutputCount = outputs.length;
    dispatch();
    await flush();
    return {
      decisions: decisions.slice(previousDecisionCount),
      executions: executions.slice(previousExecutionCount),
      outputs: outputs.slice(previousOutputCount).map((output) => redactValue(output)),
      snapshot: snapshot(),
    };
  };

  const createCommand = (overrides = {}) => {
    commandIndex += 1;
    return {
      domainCommandId: `command-${commandIndex}`,
      tenantId,
      integrationInstanceId,
      producerId,
      payload: {},
      ...overrides,
    };
  };

  const sendDataCommand = (command = createCommand(), { laneIndex = 0, ...eventOptions } = {}) => {
    if (!dataInputs[laneIndex]) {
      throw new SideEffectMigrationHarnessError("laneIndex is outside data input range.", {
        field: "laneIndex",
        value: laneIndex,
      });
    }
    return dispatchAndFlush(() => {
      dataInputs[laneIndex]._stream.next(
        eventFactory.data(command, {
          sourceNodeId: nodeId,
          ...eventOptions,
        }),
      );
    });
  };

  const sendControlTick = ({
    intent = "legacy_tick",
    legacyControlPayload,
    ...eventOptions
  } = {}) =>
    dispatchAndFlush(() => {
      control._stream.next(
        eventFactory.control({
          intent,
          sourceNodeId: "runtime",
          targetNodeId: nodeId,
          legacyControlPayload: legacyControlPayload ?? { intent },
          ...eventOptions,
        }),
      );
    });

  const sendConfigRefresh = ({
    metaControl = true,
    configVersion = "config-1",
    ...eventOptions
  } = {}) =>
    dispatchAndFlush(() => {
      const envelope = eventFactory.control({
        intent: "refresh_config",
        sourceNodeId: "runtime",
        targetNodeId: nodeId,
        legacyControlPayload: { configVersion },
        ...eventOptions,
      });
      if (metaControl) {
        metaCtrl$.next(envelope);
        return;
      }
      control._stream.next(envelope);
    });

  const sendRetry = ({ targetAttemptId = "attempt-1", ...eventOptions } = {}) =>
    dispatchAndFlush(() => {
      control._stream.next(
        eventFactory.retry({
          sourceNodeId: "runtime",
          targetNodeId: nodeId,
          targetAttemptId,
          ...eventOptions,
        }),
      );
    });

  const sendReplay = ({ targetEventId = "data-1", ...eventOptions } = {}) =>
    dispatchAndFlush(() => {
      control._stream.next(
        eventFactory.replay({
          sourceNodeId: "runtime",
          targetNodeId: nodeId,
          targetEventId,
          ...eventOptions,
        }),
      );
    });

  const snapshot = () =>
    redactValue({
      adapterName,
      runtimeTargetKey,
      decisions,
      executions,
      outputs,
      observability: runtimeSinks.snapshot(),
      idempotencyStoreSize: typeof store?.size === "function" ? store.size() : undefined,
    });

  return Object.freeze({
    adapterName,
    runtimeTargetKey,
    nodeId,
    graphInstanceId,
    store,
    runtimeSinks,
    dataInputs,
    control,
    metaCtrl$,
    driver,
    createCommand,
    sendDataCommand,
    sendControlTick,
    sendConfigRefresh,
    sendRetry,
    sendReplay,
    flush,
    snapshot,
  });
};

export {
  SideEffectMigrationHarnessError,
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
};

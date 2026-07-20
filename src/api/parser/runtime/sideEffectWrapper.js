import { redactValue } from "./safeLogging.js";
import {
  IDEMPOTENCY_RESERVE_DECISIONS,
  assertProductionIdempotencyStore,
  createScopedIdempotencyKey,
  validateIdempotencyStoreCapability,
} from "./idempotencyStore.js";

const SIDE_EFFECT_OUTCOMES = Object.freeze({
  SUCCEEDED: "succeeded",
  SUPPRESSED: "suppressed",
  FAILED: "failed",
});

const DEFAULT_RETRYABLE_ERROR_CODES = Object.freeze(["timeout", "rate_limited", "server_error"]);

class SideEffectExecutionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "SideEffectExecutionError";
    this.code = "invalid_side_effect_execution";
    this.details = details;
  }
}

const assertNonEmptyString = (value, field) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SideEffectExecutionError(`${field} must be a non-empty string.`, { field, value });
  }
  return value.trim();
};

const defaultIdFactory = (() => {
  let counter = 0;
  return (prefix = "side-effect-attempt") => {
    counter += 1;
    return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${counter}`;
  };
})();

const createNoopMetricSink = () => ({ record: () => {} });
const createNoopTraceSink = () => ({ emit: () => {} });

const normalizeRetryPolicy = (retry = {}) => {
  if (!retry || typeof retry !== "object" || Array.isArray(retry)) {
    throw new SideEffectExecutionError("retry policy must be an object.", {
      field: "retry",
      value: retry,
    });
  }
  const enabled = retry.enabled === true;
  const maxAttempts = retry.maxAttempts === undefined ? 1 : retry.maxAttempts;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts <= 0) {
    throw new SideEffectExecutionError("retry.maxAttempts must be a positive safe integer.", {
      field: "retry.maxAttempts",
      value: maxAttempts,
    });
  }
  const retryableErrors = new Set(retry.retryableErrors ?? DEFAULT_RETRYABLE_ERROR_CODES);
  const retryableStatus = new Set(retry.retryableStatus ?? [408, 429, 500, 502, 503, 504]);
  const retryAfterMs = retry.retryAfterMs === undefined ? 0 : retry.retryAfterMs;
  if (!Number.isSafeInteger(retryAfterMs) || retryAfterMs < 0) {
    throw new SideEffectExecutionError("retry.retryAfterMs must be a non-negative safe integer.", {
      field: "retry.retryAfterMs",
      value: retryAfterMs,
    });
  }
  return Object.freeze({
    enabled,
    maxAttempts,
    retryableErrors,
    retryableStatus,
    retryAfterMs,
  });
};

const validateSideEffectIdempotencyMetadata = (idempotency = {}) => {
  if (!idempotency || typeof idempotency !== "object" || Array.isArray(idempotency)) {
    throw new SideEffectExecutionError("idempotency metadata must be an object.", {
      field: "idempotency",
      value: idempotency,
    });
  }
  if (idempotency.required !== true) {
    throw new SideEffectExecutionError("side effects require explicit idempotency metadata.", {
      field: "idempotency.required",
      value: idempotency.required,
    });
  }
  return idempotency;
};

const resolveGraphLocalScope = ({ graphInstanceId, nodeId, producerId = "runtime" } = {}) => {
  return `${assertNonEmptyString(graphInstanceId, "graphInstanceId")}:${assertNonEmptyString(
    nodeId,
    "nodeId",
  )}:${assertNonEmptyString(producerId, "producerId")}`;
};

const resolveExternalScope = ({ tenantId, integrationInstanceId, producerId = "runtime" } = {}) => {
  if (tenantId && integrationInstanceId) {
    return `${assertNonEmptyString(tenantId, "tenantId")}:${assertNonEmptyString(
      integrationInstanceId,
      "integrationInstanceId",
    )}:${assertNonEmptyString(producerId, "producerId")}`;
  }
  return undefined;
};

const resolveSideEffectIdempotency = ({ idempotency, runtimeContext = {} } = {}) => {
  const metadata = validateSideEffectIdempotencyMetadata(idempotency);
  if (metadata.key) {
    return Object.freeze({
      key: assertNonEmptyString(metadata.key, "idempotency.key"),
      scope: assertNonEmptyString(metadata.scope, "idempotency.scope"),
      domainCommandId: metadata.domainCommandId,
      source: "explicit-key",
    });
  }

  const domainCommandId = metadata.domainCommandId ?? runtimeContext.domainCommandId;
  const externalScope =
    metadata.scope ??
    resolveExternalScope({
      tenantId: metadata.tenantId ?? runtimeContext.tenantId,
      integrationInstanceId: metadata.integrationInstanceId ?? runtimeContext.integrationInstanceId,
      producerId: metadata.producerId ?? runtimeContext.producerId,
    });

  if (domainCommandId && externalScope) {
    return Object.freeze({
      key: createScopedIdempotencyKey({
        scope: externalScope,
        domainKey: domainCommandId,
      }),
      scope: externalScope,
      domainCommandId,
      source: "domain-command",
    });
  }

  if (metadata.allowGraphLocalFallback === true) {
    const scope =
      metadata.scope ??
      resolveGraphLocalScope({
        graphInstanceId: runtimeContext.graphInstanceId,
        nodeId: runtimeContext.nodeId,
        producerId: metadata.producerId ?? runtimeContext.producerId,
      });
    const domainKey = runtimeContext.eventId ?? metadata.domainCommandId;
    return Object.freeze({
      key: createScopedIdempotencyKey({
        scope,
        domainKey,
      }),
      scope,
      domainCommandId: domainKey,
      source: "graph-local-fallback",
    });
  }

  throw new SideEffectExecutionError(
    "idempotency metadata requires a domain command ID or an explicit graph-local fallback.",
    {
      field: "idempotency.domainCommandId",
    },
  );
};

const isRetryableError = (error, retryPolicy) => {
  if (!retryPolicy.enabled) {
    return false;
  }
  if (error?.retryable === true) {
    return true;
  }
  if (error?.code && retryPolicy.retryableErrors.has(error.code)) {
    return true;
  }
  const status = error?.statusCode ?? error?.status ?? error?.httpStatus;
  return status !== undefined && retryPolicy.retryableStatus.has(status);
};

const emitTrace = (traceSink, event) => {
  traceSink.emit(redactValue(event));
};

const emitMetric = (metricSink, name, labels = {}, value = 1) => {
  metricSink.record(name, redactValue(labels), value);
};

const createSuppressedResult = ({
  reserveDecision,
  idempotency,
  runtimeContext,
  traceSink,
  metricSink,
}) => {
  const result = Object.freeze({
    outcome: SIDE_EFFECT_OUTCOMES.SUPPRESSED,
    decision: reserveDecision.decision,
    idempotencyKey: idempotency.key,
    eventId: runtimeContext.eventId,
    originalEventId: runtimeContext.originalEventId ?? runtimeContext.eventId,
    attempts: Object.freeze([]),
    entry: reserveDecision.entry,
  });
  emitTrace(traceSink, {
    event: "side_effect_suppressed",
    decision: result.decision,
    eventId: result.eventId,
    originalEventId: result.originalEventId,
    keySource: idempotency.source,
    scope: idempotency.scope,
  });
  emitMetric(metricSink, "ghostos_side_effect_suppressed_total", {
    decision: result.decision,
    keySource: idempotency.source,
  });
  return result;
};

const executeIdempotentSideEffect = async ({
  execute,
  idempotencyStore,
  idempotency,
  retry = {},
  runtimeContext = {},
  observability = {},
  production = false,
  environment = "browser",
  externallyVisibleSideEffect = true,
  idFactory = defaultIdFactory,
} = {}) => {
  if (typeof execute !== "function") {
    throw new SideEffectExecutionError("execute must be a function.", { field: "execute" });
  }
  if (!idempotencyStore) {
    throw new SideEffectExecutionError("idempotencyStore is required.", {
      field: "idempotencyStore",
    });
  }
  const traceSink = observability.traceSink ?? createNoopTraceSink();
  const metricSink = observability.metricSink ?? createNoopMetricSink();
  const normalizedRetry = normalizeRetryPolicy(retry);
  const resolvedIdempotency = resolveSideEffectIdempotency({ idempotency, runtimeContext });
  const originalEventId = runtimeContext.originalEventId ?? runtimeContext.eventId;

  if (production && externallyVisibleSideEffect) {
    assertProductionIdempotencyStore(idempotencyStore, { environment });
  } else {
    validateIdempotencyStoreCapability(idempotencyStore, {
      environment,
      externallyVisibleSideEffect,
      production,
    });
  }

  const attempts = [];
  const maxAttempts = normalizedRetry.enabled ? normalizedRetry.maxAttempts : 1;
  for (let attemptIndex = 1; attemptIndex <= maxAttempts; attemptIndex += 1) {
    const attemptId = idFactory("side-effect-attempt");
    const reserveDecision = idempotencyStore.reserve(resolvedIdempotency.key, {
      attemptId,
      scope: resolvedIdempotency.scope,
      retry: {
        enabled: attemptIndex > 1,
        maxAttempts,
      },
      metadata: {
        eventId: runtimeContext.eventId,
        originalEventId,
        runtimeTargetKey: runtimeContext.runtimeTargetKey,
      },
    });

    emitTrace(traceSink, {
      event: "side_effect_reserve",
      decision: reserveDecision.decision,
      attemptId,
      attemptCount: attemptIndex,
      eventId: runtimeContext.eventId,
      originalEventId,
      keySource: resolvedIdempotency.source,
      scope: resolvedIdempotency.scope,
    });
    emitMetric(metricSink, "ghostos_side_effect_attempt_total", {
      decision: reserveDecision.decision,
      attemptCount: attemptIndex,
    });

    if (!reserveDecision.shouldExecute) {
      return createSuppressedResult({
        reserveDecision,
        idempotency: resolvedIdempotency,
        runtimeContext: { ...runtimeContext, originalEventId },
        traceSink,
        metricSink,
      });
    }

    attempts.push(
      Object.freeze({
        attemptId,
        attemptCount: attemptIndex,
        eventId: runtimeContext.eventId,
        originalEventId,
        idempotencyKey: resolvedIdempotency.key,
      }),
    );

    try {
      const value = await execute({
        attemptId,
        attemptCount: attemptIndex,
        eventId: runtimeContext.eventId,
        originalEventId,
        idempotencyKey: resolvedIdempotency.key,
        idempotency: resolvedIdempotency,
      });
      const entry = idempotencyStore.markSucceeded(resolvedIdempotency.key, value);
      emitTrace(traceSink, {
        event: "side_effect_succeeded",
        attemptId,
        attemptCount: attemptIndex,
        eventId: runtimeContext.eventId,
        originalEventId,
        keySource: resolvedIdempotency.source,
        scope: resolvedIdempotency.scope,
      });
      emitMetric(metricSink, "ghostos_side_effect_succeeded_total", {
        attemptCount: attemptIndex,
      });
      return Object.freeze({
        outcome: SIDE_EFFECT_OUTCOMES.SUCCEEDED,
        value,
        entry,
        attempts: Object.freeze(attempts),
        idempotencyKey: resolvedIdempotency.key,
        eventId: runtimeContext.eventId,
        originalEventId,
      });
    } catch (error) {
      const retryable = isRetryableError(error, normalizedRetry);
      const entry = idempotencyStore.markFailed(resolvedIdempotency.key, error, {
        retryable,
        retryAfterMs: normalizedRetry.retryAfterMs,
      });
      emitTrace(traceSink, {
        event: "side_effect_failed",
        attemptId,
        attemptCount: attemptIndex,
        eventId: runtimeContext.eventId,
        originalEventId,
        retryable,
        error,
        keySource: resolvedIdempotency.source,
        scope: resolvedIdempotency.scope,
      });
      emitMetric(metricSink, "ghostos_side_effect_failed_total", {
        attemptCount: attemptIndex,
        retryable,
      });
      if (retryable && attemptIndex < maxAttempts) {
        continue;
      }
      return Object.freeze({
        outcome: SIDE_EFFECT_OUTCOMES.FAILED,
        error: redactValue(error),
        entry,
        attempts: Object.freeze(attempts),
        idempotencyKey: resolvedIdempotency.key,
        eventId: runtimeContext.eventId,
        originalEventId,
      });
    }
  }

  throw new SideEffectExecutionError("side-effect execution exhausted unexpectedly.");
};

const createIdempotentSideEffectRunner = ({ idFactory = defaultIdFactory } = {}) => {
  let orderedTail = Promise.resolve();
  const run = (options = {}) => {
    const task = () => executeIdempotentSideEffect({ ...options, idFactory });
    if (options.executionPolicy?.concurrency === "parallel") {
      return task();
    }
    const next = orderedTail.then(task, task);
    orderedTail = next.catch(() => {});
    return next;
  };
  return Object.freeze({ run });
};

export {
  SIDE_EFFECT_OUTCOMES,
  SideEffectExecutionError,
  createIdempotentSideEffectRunner,
  executeIdempotentSideEffect,
  resolveSideEffectIdempotency,
  validateSideEffectIdempotencyMetadata,
};

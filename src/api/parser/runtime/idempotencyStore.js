import { redactValue } from "./safeLogging.js";

const IDEMPOTENCY_STATUSES = Object.freeze({
  IN_FLIGHT: "in_flight",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  SUPPRESSED: "suppressed",
});

const IDEMPOTENCY_STORE_CAPABILITIES = Object.freeze({
  MEMORY: "memory",
  DURABLE: "durable",
  SERVER_AUTHORITATIVE: "server-authoritative",
});

const IDEMPOTENCY_RESERVE_DECISIONS = Object.freeze({
  RESERVED: "reserved",
  RETRY_RESERVED: "retry_reserved",
  DUPLICATE_IN_FLIGHT: "duplicate_in_flight",
  DUPLICATE_SUCCEEDED: "duplicate_succeeded",
  DUPLICATE_SUPPRESSED: "duplicate_suppressed",
  FAILED_RETRY_BLOCKED: "failed_retry_blocked",
});

const TERMINAL_STATUSES = new Set([
  IDEMPOTENCY_STATUSES.SUCCEEDED,
  IDEMPOTENCY_STATUSES.FAILED,
  IDEMPOTENCY_STATUSES.SUPPRESSED,
]);
const VALID_STATUSES = new Set(Object.values(IDEMPOTENCY_STATUSES));

const DEFAULT_SUCCEEDED_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_FAILED_TTL_MS = 60 * 60 * 1000;
const DEFAULT_SUPPRESSED_TTL_MS = 60 * 60 * 1000;
const DEFAULT_ATTEMPT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_MAX_TERMINAL_ENTRIES = 1024;

class IdempotencyStoreError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "IdempotencyStoreError";
    this.code = "invalid_idempotency_store_operation";
    this.details = details;
  }
}

const defaultClock = () => Date.now();

const stableHashPrefix = (value) => {
  const input = `${value}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const assertNonEmptyString = (value, field) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new IdempotencyStoreError(`${field} must be a non-empty string.`, { field, value });
  }
  return value.trim();
};

const validateIdempotencyStatus = (status) => {
  if (!VALID_STATUSES.has(status)) {
    throw new IdempotencyStoreError(`Unsupported idempotency status: ${status}.`, {
      field: "status",
      value: status,
    });
  }
  return status;
};

const validateTtlMs = (ttlMs, field = "ttlMs") => {
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 0) {
    throw new IdempotencyStoreError(`${field} must be a non-negative safe integer.`, {
      field,
      value: ttlMs,
    });
  }
  return ttlMs;
};

const validatePositiveInt = (value, field) => {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new IdempotencyStoreError(`${field} must be a positive safe integer.`, {
      field,
      value,
    });
  }
  return value;
};

const validateIdempotencyKey = (key) => assertNonEmptyString(key, "idempotencyKey");

const validateIdempotencyScope = (scope) => assertNonEmptyString(scope, "scope");

const createScopedIdempotencyKey = ({ scope, domainKey } = {}) => {
  return `${validateIdempotencyScope(scope)}:${assertNonEmptyString(domainKey, "domainKey")}`;
};

const validateRetryPolicy = (retry = {}) => {
  if (retry === undefined) {
    return Object.freeze({ enabled: false, maxAttempts: 1, retryAfterMs: 0 });
  }
  if (!retry || typeof retry !== "object" || Array.isArray(retry)) {
    throw new IdempotencyStoreError("retry policy must be an object.", {
      field: "retry",
      value: retry,
    });
  }
  const enabled = retry.enabled === true;
  const maxAttempts =
    retry.maxAttempts === undefined
      ? 1
      : validatePositiveInt(retry.maxAttempts, "retry.maxAttempts");
  const retryAfterMs =
    retry.retryAfterMs === undefined ? 0 : validateTtlMs(retry.retryAfterMs, "retry.retryAfterMs");
  return Object.freeze({
    enabled,
    maxAttempts,
    retryAfterMs,
  });
};

const validateIdempotencyAttempt = (attempt = {}) => {
  if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) {
    throw new IdempotencyStoreError("attempt must be an object.", {
      field: "attempt",
      value: attempt,
    });
  }
  const attemptTimeoutMs =
    attempt.attemptTimeoutMs === undefined
      ? DEFAULT_ATTEMPT_TIMEOUT_MS
      : validatePositiveInt(attempt.attemptTimeoutMs, "attemptTimeoutMs");
  return Object.freeze({
    attemptId: assertNonEmptyString(attempt.attemptId, "attemptId"),
    scope: validateIdempotencyScope(attempt.scope),
    retry: validateRetryPolicy(attempt.retry),
    attemptTimeoutMs,
    metadata: redactValue(attempt.metadata ?? {}),
  });
};

const cloneRecord = (record) => {
  if (!record) {
    return undefined;
  }
  return Object.freeze({
    ...record,
    retry: Object.freeze({ ...(record.retry ?? {}) }),
    metadata: Object.freeze(redactValue(record.metadata ?? {})),
    error: record.error === undefined ? undefined : Object.freeze(redactValue(record.error)),
    result: record.result === undefined ? undefined : Object.freeze(redactValue(record.result)),
  });
};

const isTerminal = (status) => TERMINAL_STATUSES.has(status);

const isExpiredTerminal = (record, now) => {
  return isTerminal(record.status) && record.expiresAt !== undefined && record.expiresAt <= now;
};

const createDecision = ({ decision, shouldExecute, created = false, entry }) =>
  Object.freeze({
    decision,
    shouldExecute,
    created,
    entry: cloneRecord(entry),
  });

const createDiagnostic = ({ action, decision, record, details = {} }) => {
  return redactValue({
    component: "ghostos.idempotency",
    action,
    decision,
    status: record?.status,
    scope: record?.scope,
    keyHashPrefix: record?.keyHashPrefix,
    attemptId: record?.attemptId,
    attemptCount: record?.attemptCount,
    ...details,
  });
};

const createMemoryIdempotencyStore = ({
  clock = defaultClock,
  maxEntries = DEFAULT_MAX_TERMINAL_ENTRIES,
  succeededTtlMs = DEFAULT_SUCCEEDED_TTL_MS,
  failedTtlMs = DEFAULT_FAILED_TTL_MS,
  suppressedTtlMs = DEFAULT_SUPPRESSED_TTL_MS,
  traceSink,
  logSink,
} = {}) => {
  validatePositiveInt(maxEntries, "maxEntries");
  validateTtlMs(succeededTtlMs, "succeededTtlMs");
  validateTtlMs(failedTtlMs, "failedTtlMs");
  validateTtlMs(suppressedTtlMs, "suppressedTtlMs");

  const records = new Map();

  const now = () => {
    const value = clock();
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new IdempotencyStoreError("clock must return a non-negative safe integer.", {
        field: "clock",
        value,
      });
    }
    return value;
  };

  const emitDiagnostic = (event) => {
    const redacted = redactValue(event);
    traceSink?.emit?.(redacted);
    logSink?.debug?.(redacted);
  };

  const emitStoreDiagnostic = ({ action, decision, record, details }) => {
    emitDiagnostic(createDiagnostic({ action, decision, record, details }));
  };

  const deleteExpiredTerminal = (record, currentTime) => {
    if (record && isExpiredTerminal(record, currentTime)) {
      records.delete(record.key);
      emitStoreDiagnostic({
        action: "sweep",
        decision: "ttl_evicted",
        record,
      });
      return true;
    }
    return false;
  };

  const evictForCapacity = () => {
    if (records.size <= maxEntries) {
      return [];
    }
    const evicted = [];
    const terminalRecords = [...records.values()]
      .filter((record) => isTerminal(record.status))
      .sort((left, right) => {
        return (
          left.updatedAt - right.updatedAt ||
          left.firstSeenAt - right.firstSeenAt ||
          (left.expiresAt ?? Number.MAX_SAFE_INTEGER) - (right.expiresAt ?? Number.MAX_SAFE_INTEGER)
        );
      });

    for (const record of terminalRecords) {
      if (records.size <= maxEntries) {
        break;
      }
      records.delete(record.key);
      evicted.push(record);
      emitStoreDiagnostic({
        action: "sweep",
        decision: "capacity_evicted",
        record,
      });
    }
    return evicted;
  };

  const sweep = (sweepNow = now()) => {
    if (!Number.isSafeInteger(sweepNow) || sweepNow < 0) {
      throw new IdempotencyStoreError("sweep now must be a non-negative safe integer.", {
        field: "now",
        value: sweepNow,
      });
    }
    const evicted = [];
    for (const record of [...records.values()]) {
      if (isExpiredTerminal(record, sweepNow)) {
        records.delete(record.key);
        evicted.push(cloneRecord(record));
        emitStoreDiagnostic({
          action: "sweep",
          decision: "ttl_evicted",
          record,
        });
      }
    }
    evicted.push(...evictForCapacity().map(cloneRecord));
    return Object.freeze({
      evicted,
      evictedCount: evicted.length,
      size: records.size,
    });
  };

  const createInFlightRecord = ({ key, attempt, currentTime, attemptCount, firstSeenAt }) => {
    return {
      key,
      keyHashPrefix: stableHashPrefix(key),
      scope: attempt.scope,
      status: IDEMPOTENCY_STATUSES.IN_FLIGHT,
      attemptId: attempt.attemptId,
      firstSeenAt,
      lastAttemptAt: currentTime,
      updatedAt: currentTime,
      attemptCount,
      attemptExpiresAt: currentTime + attempt.attemptTimeoutMs,
      expiresAt: undefined,
      ttlMs: undefined,
      retry: attempt.retry,
      metadata: attempt.metadata,
    };
  };

  const canRetryFailedEntry = ({ entry, attempt, currentTime }) => {
    if (entry.status !== IDEMPOTENCY_STATUSES.FAILED) {
      return false;
    }
    if (!attempt.retry.enabled || entry.retryable !== true) {
      return false;
    }
    if (entry.attemptCount >= attempt.retry.maxAttempts) {
      return false;
    }
    const retryAfterAt = entry.retryAfterAt ?? entry.updatedAt;
    return retryAfterAt <= currentTime;
  };

  const reserve = (rawKey, rawAttempt = {}) => {
    const key = validateIdempotencyKey(rawKey);
    const attempt = validateIdempotencyAttempt(rawAttempt);
    const currentTime = now();
    const existing = records.get(key);
    if (deleteExpiredTerminal(existing, currentTime)) {
      return reserve(key, attempt);
    }

    if (!existing) {
      const record = createInFlightRecord({
        key,
        attempt,
        currentTime,
        attemptCount: 1,
        firstSeenAt: currentTime,
      });
      records.set(key, record);
      evictForCapacity();
      emitStoreDiagnostic({
        action: "reserve",
        decision: IDEMPOTENCY_RESERVE_DECISIONS.RESERVED,
        record,
      });
      return createDecision({
        decision: IDEMPOTENCY_RESERVE_DECISIONS.RESERVED,
        shouldExecute: true,
        created: true,
        entry: record,
      });
    }

    if (existing.status === IDEMPOTENCY_STATUSES.FAILED) {
      if (canRetryFailedEntry({ entry: existing, attempt, currentTime })) {
        const record = createInFlightRecord({
          key,
          attempt,
          currentTime,
          attemptCount: existing.attemptCount + 1,
          firstSeenAt: existing.firstSeenAt,
        });
        records.set(key, record);
        emitStoreDiagnostic({
          action: "reserve",
          decision: IDEMPOTENCY_RESERVE_DECISIONS.RETRY_RESERVED,
          record,
        });
        return createDecision({
          decision: IDEMPOTENCY_RESERVE_DECISIONS.RETRY_RESERVED,
          shouldExecute: true,
          created: false,
          entry: record,
        });
      }
      emitStoreDiagnostic({
        action: "reserve",
        decision: IDEMPOTENCY_RESERVE_DECISIONS.FAILED_RETRY_BLOCKED,
        record: existing,
      });
      return createDecision({
        decision: IDEMPOTENCY_RESERVE_DECISIONS.FAILED_RETRY_BLOCKED,
        shouldExecute: false,
        entry: existing,
      });
    }

    const duplicateDecision =
      existing.status === IDEMPOTENCY_STATUSES.IN_FLIGHT
        ? IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_IN_FLIGHT
        : existing.status === IDEMPOTENCY_STATUSES.SUCCEEDED
          ? IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_SUCCEEDED
          : IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_SUPPRESSED;
    emitStoreDiagnostic({
      action: "reserve",
      decision: duplicateDecision,
      record: existing,
    });
    return createDecision({
      decision: duplicateDecision,
      shouldExecute: false,
      entry: existing,
    });
  };

  const getExistingOrThrow = (key) => {
    const entry = records.get(validateIdempotencyKey(key));
    if (!entry) {
      throw new IdempotencyStoreError("idempotency record does not exist.", {
        field: "idempotencyKey",
      });
    }
    return entry;
  };

  const markTerminal = ({ key, status, ttlMs, currentTime, patch }) => {
    validateIdempotencyStatus(status);
    if (!isTerminal(status)) {
      throw new IdempotencyStoreError("markTerminal requires a terminal status.", {
        field: "status",
        value: status,
      });
    }
    const existing = getExistingOrThrow(key);
    const record = {
      ...existing,
      ...patch,
      status,
      updatedAt: currentTime,
      ttlMs,
      expiresAt: currentTime + ttlMs,
    };
    records.set(existing.key, record);
    evictForCapacity();
    emitStoreDiagnostic({
      action: "mark",
      decision: status,
      record,
      details: patch,
    });
    return cloneRecord(record);
  };

  const markSucceeded = (key, result = {}, options = {}) => {
    const currentTime = now();
    const ttlMs =
      options.ttlMs === undefined ? succeededTtlMs : validateTtlMs(options.ttlMs, "ttlMs");
    return markTerminal({
      key,
      status: IDEMPOTENCY_STATUSES.SUCCEEDED,
      ttlMs,
      currentTime,
      patch: {
        result: redactValue(result),
        retryable: false,
        lastErrorCode: null,
      },
    });
  };

  const markFailed = (key, error = {}, options = {}) => {
    const currentTime = now();
    const ttlMs = options.ttlMs === undefined ? failedTtlMs : validateTtlMs(options.ttlMs, "ttlMs");
    const retryAfterMs =
      options.retryAfterMs === undefined ? 0 : validateTtlMs(options.retryAfterMs, "retryAfterMs");
    return markTerminal({
      key,
      status: IDEMPOTENCY_STATUSES.FAILED,
      ttlMs,
      currentTime,
      patch: {
        error: redactValue(error),
        lastErrorCode: error?.code ?? error?.statusCode ?? null,
        retryable: options.retryable === true,
        retryAfterAt: currentTime + retryAfterMs,
      },
    });
  };

  const markSuppressed = (key, reason = "duplicate", options = {}) => {
    const currentTime = now();
    const ttlMs =
      options.ttlMs === undefined ? suppressedTtlMs : validateTtlMs(options.ttlMs, "ttlMs");
    return markTerminal({
      key,
      status: IDEMPOTENCY_STATUSES.SUPPRESSED,
      ttlMs,
      currentTime,
      patch: {
        suppressionReason: assertNonEmptyString(reason, "reason"),
        retryable: false,
      },
    });
  };

  const get = (rawKey) => {
    const key = validateIdempotencyKey(rawKey);
    const currentTime = now();
    const record = records.get(key);
    if (deleteExpiredTerminal(record, currentTime)) {
      return undefined;
    }
    return cloneRecord(records.get(key));
  };

  return Object.freeze({
    capabilities: Object.freeze({
      class: IDEMPOTENCY_STORE_CAPABILITIES.MEMORY,
      atomicReserve: "single-js-agent",
      authoritativeForExternalSideEffects: false,
      maxEntries,
    }),
    reserve,
    markSucceeded,
    markFailed,
    markSuppressed,
    get,
    sweep,
    size: () => records.size,
  });
};

export {
  DEFAULT_ATTEMPT_TIMEOUT_MS,
  DEFAULT_FAILED_TTL_MS,
  DEFAULT_MAX_TERMINAL_ENTRIES,
  DEFAULT_SUCCEEDED_TTL_MS,
  DEFAULT_SUPPRESSED_TTL_MS,
  IDEMPOTENCY_RESERVE_DECISIONS,
  IDEMPOTENCY_STATUSES,
  IDEMPOTENCY_STORE_CAPABILITIES,
  IdempotencyStoreError,
  createMemoryIdempotencyStore,
  createScopedIdempotencyKey,
  validateIdempotencyAttempt,
  validateIdempotencyKey,
  validateIdempotencyScope,
  validateIdempotencyStatus,
  validateRetryPolicy,
  validateTtlMs,
};

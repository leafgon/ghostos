import { Observable, Subject, from, merge, of } from "rxjs";
import { concatMap, map, share, startWith, withLatestFrom } from "rxjs/operators";

import { ElemCacheKeyLUT } from "./index.js";

import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { isBottle } from "../../../predicates.js";
import { doBottle } from "../../datautils/bottling.js";

const cachekeys = {
  CONFIG: "_cortex_config",
  FIFO: "_cortex_fifo",
  POLL_LIST: "_cortex_poll_list",
  IDEMPOTENCY_RECORDS: "_cortex_idempotency_records",
  DATA_SUBSCRIBER_COUNT: "_cortex_data_subscriber_count",
};

const CORTEX_CODEBASE = "ghostos/api/parser/nodelogic/elements/library/cortex.js";
const DEFAULT_JOBS_PATH = "/api/cortex/jobs";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_MAX_SUBMIT_ATTEMPTS = 3;
const DEFAULT_MAX_POLL_ATTEMPTS = 60;
const DEFAULT_TOTAL_TIMEOUT_MS = 120000;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9._:-]{8,256}$/;
const WORKLOAD_TYPES = new Set(["chat", "vision", "embedding", "transcription", "agent", "tool"]);
const PRIORITIES = new Set(["p0_interactive", "p1_interactive", "p2_batch"]);
const MODES = new Set(["sync", "async"]);
const CALLBACK_FIELDS = new Set([
  "callback",
  "callbackUrl",
  "callbackUri",
  "callbackHeaders",
  "callbackMethod",
  "callbacks",
  "webhook",
  "webhookUrl",
]);
const AUTHORITY_FIELDS = new Set([
  "tenantId",
  "jobId",
  "traceId",
  "spanId",
  "trustedTenantContext",
  "graphPath",
  "derivedOperationType",
  "operationTypeDerived",
  "operationType",
]);
const TRANSPORT_FIELDS = new Set([
  "headers",
  "authorization",
  "credentials",
  "baseUrl",
  "apiBaseUrl",
  "jobsPath",
  "retryCount",
  "requestId",
  "responseId",
]);
const VOLATILE_IDEMPOTENCY_FIELDS = new Set([
  ...AUTHORITY_FIELDS,
  ...TRANSPORT_FIELDS,
  "issuedAt",
  "expiresAt",
  "createdAt",
  "updatedAt",
  "submittedAt",
  "acceptedAt",
  "completedAt",
  "timestamp",
  "timestamps",
  "retryCount",
  "requestId",
  "responseId",
  "headers",
  "credentials",
  "baseUrl",
  "apiBaseUrl",
]);
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const SUCCESS_STATUSES = new Set(["completed", "succeeded"]);
const FAILURE_STATUSES = new Set(["failed"]);
const CANCELLATION_STATUSES = new Set(["cancelled", "canceled"]);
const TIMEOUT_STATUSES = new Set(["timed_out", "timeout"]);
const IN_FLIGHT_STATUSES = new Set(["accepted", "queued", "pending", "running", "processing"]);

const isPlainObject = (value) => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
};

class CortexConfigError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "CortexConfigError";
    this.code = "configuration_invalid";
    this.httpStatus = undefined;
    this.details = details;
  }
}

class CortexRuntimeError extends Error {
  constructor(code, message, { httpStatus = undefined, retryable = false, details = {} } = {}) {
    super(message);
    this.name = "CortexRuntimeError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    this.details = details;
  }
}

const trimString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const maybeTrimString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const nowIso = () => new Date().toISOString();

const normalizePositiveInteger = ({
  value,
  field,
  fallback,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(`${value}`, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new CortexConfigError(`${field} must be an integer between ${min} and ${max}.`, {
      field,
    });
  }
  return parsed;
};

const parseConfigValue = (rawConfig) => {
  const configInput = isBottle(rawConfig) ? rawConfig._content : rawConfig;

  if (configInput === undefined || configInput === null || configInput === "") {
    return {};
  }
  if (typeof configInput === "string") {
    try {
      return JSON.parse(configInput);
    } catch (_error) {
      throw new CortexConfigError("Cortex _default config must be valid JSON.", {
        field: "_default",
      });
    }
  }
  if (!isPlainObject(configInput)) {
    throw new CortexConfigError("Cortex _default config must resolve to an object.", {
      field: "_default",
    });
  }

  return { ...configInput };
};

const resolveHeaders = (headersValue) => {
  if (headersValue === undefined || headersValue === null) {
    return {};
  }
  if (!isPlainObject(headersValue)) {
    throw new CortexConfigError("Cortex config headers must be an object.", {
      field: "headers",
    });
  }

  return Object.fromEntries(
    Object.entries(headersValue)
      .filter(([_key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, `${value}`]),
  );
};

const resolveCredentialsMode = (config) => {
  const resolved =
    typeof config.credentials === "string"
      ? config.credentials.trim()
      : config.includeCredentials === false
        ? "same-origin"
        : "include";

  if (!["omit", "same-origin", "include"].includes(resolved)) {
    throw new CortexConfigError("Cortex config credentials must be omit|same-origin|include.", {
      field: "credentials",
    });
  }
  return resolved;
};

const resolveCortexConfig = (rawConfig) => {
  const parsedConfig = parseConfigValue(rawConfig);
  const apiBaseUrl = trimString(
    parsedConfig.apiBaseUrl ?? parsedConfig.baseUrl ?? parsedConfig.cortexBaseUrl ?? "",
  );
  const jobsPath = trimString(parsedConfig.jobsPath ?? DEFAULT_JOBS_PATH);
  const requestHeaders = resolveHeaders(parsedConfig.headers ?? parsedConfig.requestHeaders);
  const credentials = resolveCredentialsMode(parsedConfig);
  const fetchImpl =
    typeof parsedConfig.fetch === "function" ? parsedConfig.fetch : globalThis.fetch;

  if (typeof fetchImpl !== "function") {
    throw new CortexConfigError("Cortex runtime requires a fetch implementation.", {
      field: "fetch",
    });
  }
  if (!jobsPath) {
    throw new CortexConfigError("Cortex jobsPath must be configured.", {
      field: "jobsPath",
    });
  }

  return {
    apiBaseUrl,
    jobsPath,
    requestHeaders,
    credentials,
    fetchImpl,
    requestTimeoutMs: normalizePositiveInteger({
      value: parsedConfig.requestTimeoutMs ?? parsedConfig.timeoutMs,
      field: "requestTimeoutMs",
      fallback: DEFAULT_REQUEST_TIMEOUT_MS,
      min: 1,
      max: 120000,
    }),
    pollIntervalMs: normalizePositiveInteger({
      value: parsedConfig.pollIntervalMs,
      field: "pollIntervalMs",
      fallback: DEFAULT_POLL_INTERVAL_MS,
      min: 0,
      max: 300000,
    }),
    maxSubmitAttempts: normalizePositiveInteger({
      value: parsedConfig.maxSubmitAttempts,
      field: "maxSubmitAttempts",
      fallback: DEFAULT_MAX_SUBMIT_ATTEMPTS,
      min: 1,
      max: 10,
    }),
    maxPollAttempts: normalizePositiveInteger({
      value: parsedConfig.maxPollAttempts,
      field: "maxPollAttempts",
      fallback: DEFAULT_MAX_POLL_ATTEMPTS,
      min: 1,
      max: 1000,
    }),
    totalTimeoutMs: normalizePositiveInteger({
      value: parsedConfig.totalTimeoutMs,
      field: "totalTimeoutMs",
      fallback: DEFAULT_TOTAL_TIMEOUT_MS,
      min: 1,
      max: 3600000,
    }),
  };
};

const resolveApiUrl = ({ path, baseUrl }) => {
  const normalizedPath = trimString(path);
  if (!normalizedPath) {
    throw new CortexConfigError("Cortex endpoint path must not be empty.", {
      field: "path",
    });
  }
  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }
  const normalizedBaseUrl = trimString(baseUrl);
  if (!normalizedBaseUrl) {
    return normalizedPath;
  }
  return `${normalizedBaseUrl.replace(/\/+$/, "")}/${normalizedPath.replace(/^\/+/, "")}`;
};

const parseRetryAfterMs = (headers) => {
  const rawRetryAfter =
    typeof headers?.get === "function"
      ? (headers.get("retry-after") ?? headers.get("Retry-After"))
      : null;
  if (!rawRetryAfter) {
    return undefined;
  }
  const seconds = Number.parseInt(rawRetryAfter, 10);
  if (Number.isFinite(seconds) && !Number.isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const dateMs = Date.parse(rawRetryAfter);
  if (Number.isFinite(dateMs) && !Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return undefined;
};

const parseJsonResponse = async (response, { requireValidJson = false } = {}) => {
  try {
    return await response.json();
  } catch (jsonError) {
    if (requireValidJson) {
      throw new CortexRuntimeError("malformed_json", "Cortex response body must be valid JSON.", {
        httpStatus: response?.status,
        retryable: false,
        details: { reason: jsonError?.message },
      });
    }
    try {
      const text = await response.text();
      if (!text) {
        return {};
      }
      return JSON.parse(text);
    } catch (_textError) {
      return {};
    }
  }
};

const fetchWithTimeout = async (fetchImpl, url, requestInit, timeoutMs) => {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchImpl(url, { ...requestInit, signal: controller.signal });
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const sortForCanonicalJson = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => sortForCanonicalJson(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([_key, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortForCanonicalJson(entry)]),
    );
  }
  return value;
};

const canonicalJson = (value) => JSON.stringify(sortForCanonicalJson(value));

const sha256Hex = async (value) => {
  const subtle = globalThis.crypto?.subtle;
  if (typeof subtle?.digest !== "function") {
    throw new CortexRuntimeError(
      "crypto_unavailable",
      "Cortex idempotency derivation requires Web Crypto SHA-256 support.",
      {
        retryable: false,
        details: { field: "idempotencyKey" },
      },
    );
  }
  const bytes = new TextEncoder().encode(value);
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizePayloadRef = (payloadRef) => {
  if (!isPlainObject(payloadRef)) {
    throw new CortexRuntimeError("validation_failed", "payloadRef must be an object.", {
      httpStatus: 400,
      retryable: false,
      details: { field: "payloadRef" },
    });
  }

  const hasUri = Object.hasOwn(payloadRef, "uri") && payloadRef.uri !== undefined;
  const hasInline = Object.hasOwn(payloadRef, "inline") && payloadRef.inline !== undefined;
  if (Number(hasUri) + Number(hasInline) !== 1) {
    throw new CortexRuntimeError(
      "validation_failed",
      "payloadRef must contain exactly one of uri or inline.",
      {
        httpStatus: 400,
        retryable: false,
        details: { field: "payloadRef" },
      },
    );
  }

  const normalizedPayloadRef = {};
  if (hasUri) {
    const uri = maybeTrimString(payloadRef.uri);
    if (!uri) {
      throw new CortexRuntimeError("validation_failed", "payloadRef.uri must be a string.", {
        httpStatus: 400,
        retryable: false,
        details: { field: "payloadRef.uri" },
      });
    }
    normalizedPayloadRef.uri = uri;
  }
  if (hasInline) {
    normalizedPayloadRef.inline = payloadRef.inline;
  }
  if (payloadRef.mimeType !== undefined) {
    normalizedPayloadRef.mimeType = `${payloadRef.mimeType}`;
  }
  if (payloadRef.sizeBytes !== undefined) {
    const sizeBytes = Number.parseInt(`${payloadRef.sizeBytes}`, 10);
    if (!Number.isFinite(sizeBytes) || Number.isNaN(sizeBytes) || sizeBytes < 0) {
      throw new CortexRuntimeError("validation_failed", "payloadRef.sizeBytes must be >= 0.", {
        httpStatus: 400,
        retryable: false,
        details: { field: "payloadRef.sizeBytes" },
      });
    }
    normalizedPayloadRef.sizeBytes = sizeBytes;
  }
  if (payloadRef.checksum !== undefined) {
    normalizedPayloadRef.checksum = `${payloadRef.checksum}`;
  }

  return normalizedPayloadRef;
};

const rejectCallbackFields = (intent) => {
  const rejectedField = Object.keys(intent).find((key) => CALLBACK_FIELDS.has(key));
  if (rejectedField) {
    throw new CortexRuntimeError(
      "validation_failed",
      `Cortex intent field ${rejectedField} is not allowed.`,
      {
        httpStatus: 400,
        retryable: false,
        details: { field: rejectedField },
      },
    );
  }
};

const normalizeOptionalInteger = ({ value, field, min, max }) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number.parseInt(`${value}`, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new CortexRuntimeError(
      "validation_failed",
      `${field} must be an integer between ${min} and ${max}.`,
      {
        httpStatus: 400,
        retryable: false,
        details: { field },
      },
    );
  }
  return parsed;
};

const normalizeOptionalNumber = ({ value, field, min, max }) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < min || parsed > max) {
    throw new CortexRuntimeError(
      "validation_failed",
      `${field} must be a number between ${min} and ${max}.`,
      {
        httpStatus: 400,
        retryable: false,
        details: { field },
      },
    );
  }
  return parsed;
};

const normalizeIntentFields = (intent) => {
  if (!isPlainObject(intent)) {
    throw new CortexRuntimeError("validation_failed", "Cortex intent content must be an object.", {
      httpStatus: 400,
      retryable: false,
      details: { field: "intent" },
    });
  }

  rejectCallbackFields(intent);

  const schemaVersion = trimString(intent.schemaVersion);
  if (schemaVersion !== "v1") {
    throw new CortexRuntimeError("validation_failed", "schemaVersion must be 'v1'.", {
      httpStatus: 400,
      retryable: false,
      details: { field: "schemaVersion" },
    });
  }
  const cortexInstanceId = trimString(intent.cortexInstanceId);
  if (!UUID_REGEX.test(cortexInstanceId)) {
    throw new CortexRuntimeError("validation_failed", "cortexInstanceId must be a UUID string.", {
      httpStatus: 400,
      retryable: false,
      details: { field: "cortexInstanceId" },
    });
  }
  const workloadType = trimString(intent.workloadType);
  if (!WORKLOAD_TYPES.has(workloadType)) {
    throw new CortexRuntimeError(
      "validation_failed",
      "workloadType must be one of: chat, vision, embedding, transcription, agent, tool.",
      {
        httpStatus: 400,
        retryable: false,
        details: { field: "workloadType" },
      },
    );
  }
  const priority = trimString(intent.priority);
  if (!PRIORITIES.has(priority)) {
    throw new CortexRuntimeError(
      "validation_failed",
      "priority must be one of: p0_interactive, p1_interactive, p2_batch.",
      {
        httpStatus: 400,
        retryable: false,
        details: { field: "priority" },
      },
    );
  }
  const mode = trimString(intent.mode);
  if (!MODES.has(mode)) {
    throw new CortexRuntimeError("validation_failed", "mode must be sync or async.", {
      httpStatus: 400,
      retryable: false,
      details: { field: "mode" },
    });
  }

  const normalized = {
    schemaVersion,
    cortexInstanceId,
    workloadType,
    priority,
    mode,
    payloadRef: normalizePayloadRef(intent.payloadRef),
  };

  const timeoutMs = normalizeOptionalInteger({
    value: intent.timeoutMs,
    field: "timeoutMs",
    min: 1,
    max: 3600000,
  });
  const maxAttempts = normalizeOptionalInteger({
    value: intent.maxAttempts,
    field: "maxAttempts",
    min: 1,
    max: 1000,
  });
  const costBudgetUsd = normalizeOptionalNumber({
    value: intent.costBudgetUsd,
    field: "costBudgetUsd",
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  });

  if (timeoutMs !== undefined) normalized.timeoutMs = timeoutMs;
  if (maxAttempts !== undefined) normalized.maxAttempts = maxAttempts;
  if (intent.providerHints !== undefined) {
    if (!isPlainObject(intent.providerHints)) {
      throw new CortexRuntimeError("validation_failed", "providerHints must be an object.", {
        httpStatus: 400,
        retryable: false,
        details: { field: "providerHints" },
      });
    }
    normalized.providerHints = sortForCanonicalJson(intent.providerHints);
  }
  if (costBudgetUsd !== undefined) normalized.costBudgetUsd = costBudgetUsd;

  return normalized;
};

const stableBottleIdentity = (intentBottle) => {
  const label = isPlainObject(intentBottle?._label) ? intentBottle._label : {};
  const stableLabel = Object.fromEntries(
    ["refnode", "source", "tag", "intentId"]
      .filter((key) => label[key] !== undefined)
      .map((key) => [key, label[key]]),
  );
  return {
    _bname: intentBottle?._bname,
    _label: stableLabel,
  };
};

const stripVolatileSemanticFields = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => stripVolatileSemanticFields(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => entry !== undefined && !VOLATILE_IDEMPOTENCY_FIELDS.has(key))
        .map(([key, entry]) => [key, stripVolatileSemanticFields(entry)]),
    );
  }
  return value;
};

const resolveSemanticIdempotencyFields = (intent) => {
  const semanticFields = {};
  [
    "schemaVersion",
    "intentType",
    "action",
    "actorId",
    "targetId",
    "subject",
    "payload",
    "constraints",
  ].forEach((field) => {
    if (intent[field] !== undefined && !VOLATILE_IDEMPOTENCY_FIELDS.has(field)) {
      semanticFields[field] = stripVolatileSemanticFields(intent[field]);
    }
  });
  return semanticFields;
};

const resolveIntentId = (intent, intentBottle) => {
  return (
    maybeTrimString(intent.intentId) ??
    maybeTrimString(intentBottle?._label?.intentId) ??
    maybeTrimString(intentBottle?._label?.tag)
  );
};

const deriveIdempotencyKey = async ({
  intent,
  intentBottle,
  normalizedIntent,
  normalizedRequestBody,
  refnode,
}) => {
  const canonicalInput = {
    refnode,
    stableBottleIdentity: stableBottleIdentity(intentBottle),
    normalizedIntentFields: normalizedIntent,
    normalizedRequestBody,
    ...resolveSemanticIdempotencyFields(intent),
  };
  return sha256Hex(canonicalJson(canonicalInput));
};

const normalizeIntentBottle = async ({ intentBottle, refnode }) => {
  if (!isBottle(intentBottle) || intentBottle._bname !== "intent") {
    throw new CortexRuntimeError("validation_failed", "Cortex node accepts only intent bottles.", {
      httpStatus: 400,
      retryable: false,
      details: { field: "_bname" },
    });
  }

  const intent = intentBottle._content;
  const normalizedIntent = normalizeIntentFields(intent);
  const requestBodyWithoutIdempotencyKey = { ...normalizedIntent };
  const explicitIdempotencyKey = maybeTrimString(intent.idempotencyKey);
  if (explicitIdempotencyKey !== undefined && !IDEMPOTENCY_KEY_REGEX.test(explicitIdempotencyKey)) {
    throw new CortexRuntimeError(
      "validation_failed",
      "idempotencyKey must be 8-256 URL-safe characters.",
      {
        httpStatus: 400,
        retryable: false,
        details: { field: "idempotencyKey" },
      },
    );
  }
  const idempotencyKey =
    explicitIdempotencyKey ??
    (await deriveIdempotencyKey({
      intent,
      intentBottle,
      normalizedIntent,
      normalizedRequestBody: requestBodyWithoutIdempotencyKey,
      refnode,
    }));

  const requestBody = {
    ...requestBodyWithoutIdempotencyKey,
    idempotencyKey,
  };

  return {
    intent,
    intentBottle,
    normalizedIntent,
    requestBody,
    idempotencyKey,
    intentId: resolveIntentId(intent, intentBottle),
  };
};

const extractIntentBottles = (dataIn) => {
  const queue = Array.isArray(dataIn) ? [...dataIn] : [dataIn];
  const intents = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
    } else if (isBottle(current) && current._bname === "intent") {
      intents.push(current);
    }
  }
  return intents;
};

const makeErrorDetails = (details = {}) => {
  const field = maybeTrimString(details.field);
  const reason = maybeTrimString(details.reason);
  const requestId = maybeTrimString(details.requestId);
  const jobId = maybeTrimString(details.jobId);
  const retryAfterMs = Number.isInteger(details.retryAfterMs) ? details.retryAfterMs : undefined;
  if (
    field === undefined &&
    reason === undefined &&
    requestId === undefined &&
    jobId === undefined &&
    retryAfterMs === undefined
  ) {
    return undefined;
  }
  return {
    field,
    reason,
    requestId,
    jobId,
    retryAfterMs,
  };
};

const deriveOperationType = ({ workloadType, mode }) => {
  return `ai.jobs.command:${workloadType}:${mode}`;
};

const normalizeOutcomeStatus = (status) => {
  const normalizedStatus = trimString(status).toLowerCase();
  if (SUCCESS_STATUSES.has(normalizedStatus)) return "succeeded";
  if (FAILURE_STATUSES.has(normalizedStatus)) return "failed";
  if (CANCELLATION_STATUSES.has(normalizedStatus)) return "cancelled";
  if (TIMEOUT_STATUSES.has(normalizedStatus)) return "timed_out";
  return "error";
};

const mapPayloadRefToOutcomeResult = (payloadRef, resultEnvelope = {}) => {
  if (isPlainObject(payloadRef)) {
    const metadataSource = isPlainObject(resultEnvelope.metadata) ? resultEnvelope.metadata : {};
    const mimeType =
      maybeTrimString(payloadRef.mimeType) ?? maybeTrimString(metadataSource.mimeType);
    const sizeBytes = Number.isInteger(payloadRef.sizeBytes)
      ? payloadRef.sizeBytes
      : Number.isInteger(metadataSource.sizeBytes)
        ? metadataSource.sizeBytes
        : undefined;
    const checksum =
      maybeTrimString(payloadRef.checksum) ?? maybeTrimString(metadataSource.checksum);

    if (maybeTrimString(payloadRef.uri)) {
      return {
        kind: "uri",
        value: undefined,
        uri: maybeTrimString(payloadRef.uri),
        mimeType,
        sizeBytes,
        checksum,
      };
    }
    if (Object.hasOwn(payloadRef, "inline")) {
      return {
        kind: "inline",
        value: payloadRef.inline,
        uri: undefined,
        mimeType,
        sizeBytes,
        checksum,
      };
    }
  }

  if (payloadRef !== undefined) {
    return {
      kind: "inline",
      value: payloadRef,
      uri: undefined,
      mimeType: undefined,
      sizeBytes: undefined,
      checksum: undefined,
    };
  }

  if (isPlainObject(resultEnvelope.metadata) && Object.keys(resultEnvelope.metadata).length > 0) {
    return {
      kind: "metadata",
      value: sortForCanonicalJson(resultEnvelope.metadata),
      uri: undefined,
      mimeType: maybeTrimString(resultEnvelope.metadata.mimeType),
      sizeBytes: Number.isInteger(resultEnvelope.metadata.sizeBytes)
        ? resultEnvelope.metadata.sizeBytes
        : undefined,
      checksum: maybeTrimString(resultEnvelope.metadata.checksum),
    };
  }

  return undefined;
};

const makeBaseOutcome = ({
  normalized,
  idempotencyKey,
  requestId,
  jobId,
  status,
  ok,
  intentId,
  refnode,
  result = undefined,
  error = undefined,
  submittedAt = undefined,
  acceptedAt = undefined,
  completedAt = undefined,
}) => {
  return {
    schemaVersion: "v1",
    ok,
    status,
    mode: normalized.mode,
    refnode,
    intentId,
    idempotencyKey,
    requestId,
    jobId,
    workload: {
      cortexInstanceId: normalized.cortexInstanceId,
      workloadType: normalized.workloadType,
      priority: normalized.priority,
      operationTypeDerived: deriveOperationType(normalized),
    },
    result,
    error,
    timestamps: {
      submittedAt,
      acceptedAt,
      completedAt,
    },
  };
};

const makeErrorOutcome = ({
  normalized,
  idempotencyKey = "",
  requestId = undefined,
  jobId = undefined,
  intentId = undefined,
  refnode,
  code,
  message,
  httpStatus = undefined,
  retryable = false,
  details = {},
  submittedAt = undefined,
  acceptedAt = undefined,
  completedAt = nowIso(),
}) => {
  const safeNormalized = normalized ?? {
    mode: "async",
    cortexInstanceId: "",
    workloadType: "chat",
    priority: "p2_batch",
  };
  return makeBaseOutcome({
    normalized: safeNormalized,
    idempotencyKey,
    requestId,
    jobId,
    status: "error",
    ok: false,
    intentId,
    refnode,
    error: {
      code,
      message,
      httpStatus,
      retryable,
      details: makeErrorDetails({ ...details, requestId, jobId }),
    },
    submittedAt,
    acceptedAt,
    completedAt,
  });
};

const makeOutcomeForWaiter = (outcome, waiter) => {
  return {
    ...outcome,
    intentId: waiter.intentId,
  };
};

const makeTerminalOutcome = ({ entry, responsePayload }) => {
  const rawStatus = maybeTrimString(responsePayload.status);
  const status = normalizeOutcomeStatus(rawStatus);
  const requestId = maybeTrimString(responsePayload.requestId) ?? entry.accepted.requestId;
  const resultJobId = maybeTrimString(responsePayload.jobId);
  if (resultJobId && resultJobId !== entry.accepted.jobId) {
    return makeErrorOutcome({
      normalized: entry.normalizedIntent,
      idempotencyKey: entry.idempotencyKey,
      requestId,
      jobId: entry.accepted.jobId,
      refnode: entry.refnode,
      code: "job_id_mismatch",
      message: "Cortex result jobId did not match the accepted job.",
      details: { reason: "job_id_mismatch" },
      submittedAt: entry.submittedAt,
      acceptedAt: entry.acceptedAt,
    });
  }

  if (status === "succeeded") {
    return makeBaseOutcome({
      normalized: entry.normalizedIntent,
      idempotencyKey: entry.idempotencyKey,
      requestId,
      jobId: entry.accepted.jobId,
      status,
      ok: true,
      refnode: entry.refnode,
      result: mapPayloadRefToOutcomeResult(
        responsePayload.result?.payloadRef,
        responsePayload.result,
      ),
      submittedAt: entry.submittedAt,
      acceptedAt: entry.acceptedAt,
      completedAt: nowIso(),
    });
  }

  if (["failed", "cancelled", "timed_out"].includes(status)) {
    const responseError = isPlainObject(responsePayload.error) ? responsePayload.error : {};
    return makeBaseOutcome({
      normalized: entry.normalizedIntent,
      idempotencyKey: entry.idempotencyKey,
      requestId,
      jobId: entry.accepted.jobId,
      status,
      ok: false,
      refnode: entry.refnode,
      error: {
        code: maybeTrimString(responseError.code) ?? status,
        message: maybeTrimString(responseError.message) ?? `Cortex job ${status}.`,
        httpStatus: undefined,
        retryable: false,
        details: makeErrorDetails({
          reason: maybeTrimString(responseError.reason) ?? status,
          requestId,
          jobId: entry.accepted.jobId,
        }),
      },
      submittedAt: entry.submittedAt,
      acceptedAt: entry.acceptedAt,
      completedAt: nowIso(),
    });
  }

  return undefined;
};

const mapApiErrorCode = (httpStatus) => {
  if (httpStatus === 400) return "validation_failed";
  if (httpStatus === 401) return "auth_unauthorized";
  if (httpStatus === 403) return "auth_forbidden_scope";
  if (httpStatus === 404) return "not_found";
  if (httpStatus === 409) return "idempotency_conflict";
  if (httpStatus === 429) return "rate_limited";
  if (httpStatus >= 500) return "upstream_unavailable";
  return "api_error";
};

const mapApiError = ({ response, payload, fallbackMessage }) => {
  const payloadError = isPlainObject(payload?.error) ? payload.error : {};
  const httpStatus = response?.status;
  return new CortexRuntimeError(
    maybeTrimString(payloadError.code) ?? mapApiErrorCode(httpStatus),
    maybeTrimString(payloadError.message) ?? fallbackMessage,
    {
      httpStatus,
      retryable: RETRYABLE_HTTP_STATUSES.has(httpStatus),
      details: {
        field: maybeTrimString(payloadError.field),
        reason: maybeTrimString(payloadError.reason),
        requestId: maybeTrimString(payload.requestId),
        jobId: maybeTrimString(payload.jobId),
        retryAfterMs: parseRetryAfterMs(response?.headers),
      },
    },
  );
};

const validateAcceptedSubmit = (payload) => {
  const jobId = maybeTrimString(payload.jobId);
  const requestId = maybeTrimString(payload.requestId);
  const statusUrl = maybeTrimString(payload.statusUrl);
  const eventsUrl = maybeTrimString(payload.eventsUrl);
  const resultUrl = maybeTrimString(payload.resultUrl);
  if (
    payload.schemaVersion !== "v1" ||
    payload.status !== "accepted" ||
    !jobId ||
    !requestId ||
    !statusUrl ||
    !eventsUrl ||
    !resultUrl
  ) {
    throw new CortexRuntimeError(
      "malformed_response",
      "Cortex submit response did not match the accepted job contract.",
      {
        retryable: false,
      },
    );
  }
  return {
    jobId,
    requestId,
    statusUrl,
    eventsUrl,
    resultUrl,
  };
};

const submitCortexJob = async ({ config, normalized, refnode }) => {
  const url = resolveApiUrl({ path: config.jobsPath, baseUrl: config.apiBaseUrl });
  const submittedAt = nowIso();
  let lastError = undefined;

  for (let attempt = 1; attempt <= config.maxSubmitAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        config.fetchImpl,
        url,
        {
          method: "POST",
          credentials: config.credentials,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Idempotency-Key": normalized.idempotencyKey,
            ...config.requestHeaders,
          },
          body: JSON.stringify(normalized.requestBody),
        },
        config.requestTimeoutMs,
      );
      const payload = await parseJsonResponse(response, { requireValidJson: response.ok });
      if (response.status !== 202) {
        const error = mapApiError({
          response,
          payload,
          fallbackMessage: `Cortex submit failed with HTTP ${response.status}.`,
        });
        if (error.retryable && attempt < config.maxSubmitAttempts) {
          lastError = error;
          continue;
        }
        throw error;
      }
      const accepted = validateAcceptedSubmit(payload);
      return {
        accepted,
        submittedAt,
        acceptedAt: nowIso(),
      };
    } catch (error) {
      const runtimeError =
        error instanceof CortexRuntimeError
          ? error
          : new CortexRuntimeError(
              error?.name === "AbortError" ? "request_timeout" : "network_error",
              error?.name === "AbortError"
                ? "Cortex submit request timed out."
                : "Cortex submit request failed before a response was received.",
              {
                retryable: true,
                details: { reason: error?.message, refnode },
              },
            );
      if (runtimeError.retryable && attempt < config.maxSubmitAttempts) {
        lastError = runtimeError;
        continue;
      }
      throw runtimeError;
    }
  }

  throw (
    lastError ??
    new CortexRuntimeError("submit_failed", "Cortex submit failed.", {
      retryable: false,
    })
  );
};

const pollCortexResultOnce = async ({ config, entry }) => {
  let response = undefined;
  try {
    response = await fetchWithTimeout(
      config.fetchImpl,
      entry.accepted.resultUrl,
      {
        method: "GET",
        credentials: config.credentials,
        headers: {
          Accept: "application/json",
          ...config.requestHeaders,
        },
      },
      config.requestTimeoutMs,
    );
  } catch (error) {
    throw new CortexRuntimeError(
      error?.name === "AbortError" ? "request_timeout" : "network_error",
      error?.name === "AbortError"
        ? "Cortex result poll timed out."
        : "Cortex result poll failed before a response was received.",
      {
        retryable: true,
        details: { reason: error?.message },
      },
    );
  }

  const payload = await parseJsonResponse(response, { requireValidJson: response.ok });
  if (response.status === 409 && payload?.error?.code === "not_ready") {
    return { terminal: false };
  }
  if (!response.ok) {
    throw mapApiError({
      response,
      payload,
      fallbackMessage: `Cortex result poll failed with HTTP ${response.status}.`,
    });
  }

  const rawStatus = maybeTrimString(payload.status);
  if (IN_FLIGHT_STATUSES.has(rawStatus)) {
    return { terminal: false };
  }

  const outcome = makeTerminalOutcome({ entry, responsePayload: payload });
  if (!outcome) {
    throw new CortexRuntimeError(
      "malformed_response",
      "Cortex result response did not include a terminal status.",
      {
        retryable: false,
        details: {
          requestId: maybeTrimString(payload.requestId),
          jobId: maybeTrimString(payload.jobId),
        },
      },
    );
  }
  return { terminal: true, outcome };
};

const isPastDeadline = (entry) => {
  return Date.now() >= entry.deadlineMs;
};

const makeTimeoutOutcome = (entry) => {
  return makeBaseOutcome({
    normalized: entry.normalizedIntent,
    idempotencyKey: entry.idempotencyKey,
    requestId: entry.accepted.requestId,
    jobId: entry.accepted.jobId,
    status: "timed_out",
    ok: false,
    refnode: entry.refnode,
    error: {
      code: "poll_timeout",
      message: "Cortex job result polling exhausted the configured bounds.",
      httpStatus: undefined,
      retryable: false,
      details: makeErrorDetails({
        reason: "poll_timeout",
        requestId: entry.accepted.requestId,
        jobId: entry.accepted.jobId,
      }),
    },
    submittedAt: entry.submittedAt,
    acceptedAt: entry.acceptedAt,
    completedAt: nowIso(),
  });
};

const emitRecordOutcome = ({ record, outcome, emitOutputs }) => {
  record.state = "completed";
  record.outcome = outcome;
  const waiters = record.waiters.splice(0, record.waiters.length);
  emitOutputs(waiters.map((waiter) => makeOutcomeForWaiter(outcome, waiter)));
};

const ensureState = (_stream_cache) => {
  if (!Array.isArray(_stream_cache[cachekeys.FIFO])) {
    _stream_cache[cachekeys.FIFO] = [];
  }
  if (!Array.isArray(_stream_cache[cachekeys.POLL_LIST])) {
    _stream_cache[cachekeys.POLL_LIST] = [];
  }
  if (!isPlainObject(_stream_cache[cachekeys.IDEMPOTENCY_RECORDS])) {
    _stream_cache[cachekeys.IDEMPOTENCY_RECORDS] = {};
  }
  return {
    fifo: _stream_cache[cachekeys.FIFO],
    pollList: _stream_cache[cachekeys.POLL_LIST],
    records: _stream_cache[cachekeys.IDEMPOTENCY_RECORDS],
  };
};

const initElementInterface = (_stream_cache) => {
  const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ] ?? {};
  const configgen =
    typeof reduced_lambda_obj?._default === "function" ? reduced_lambda_obj._default : undefined;

  const node_context = {
    codebase: CORTEX_CODEBASE,
    refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
  };

  const _leaflogic = (input$objArr, controlflow$obj) => {
    const _outflow_data$ = new Subject();
    const async_out$ = new Subject();
    const state = ensureState(_stream_cache);
    const runtimeState = {
      submitting: false,
      polling: false,
      pollTimer: undefined,
      lastCtrl: undefined,
      subscriberCount: 0,
    };
    const data_in$ = (input$objArr?.[0]?._stream ?? of(undefined)).pipe(startWith(undefined));

    const config$obj = configgen
      ? driveDataflowByCtrlflow(controlflow$obj, input$objArr, undefined, node_context, {
          leaflogic: configgen,
          datalogic: {
            post: (_data) => {
              _stream_cache[cachekeys.CONFIG] = _data;
              return _data;
            },
          },
        })
      : {
          _stream: of({}),
          _control: { _stream: controlflow$obj._stream },
        };

    const emitOutputs = (outputs, ctrl = runtimeState.lastCtrl ?? { _bname: "accio" }) => {
      const filteredOutputs = outputs.filter((output) => output !== undefined);
      if (filteredOutputs.length === 0) {
        return;
      }
      async_out$.next({ ctrl, outputs: filteredOutputs, source: "async" });
    };

    const schedulePoll = (config) => {
      if (runtimeState.pollTimer !== undefined || state.pollList.length === 0) {
        return;
      }
      runtimeState.pollTimer = setTimeout(() => {
        runtimeState.pollTimer = undefined;
        void pollPending(config);
      }, config.pollIntervalMs);
    };

    const completeEntry = ({ entry, outcome }) => {
      state.pollList.splice(state.pollList.indexOf(entry), 1);
      emitRecordOutcome({
        record: entry.record,
        outcome,
        emitOutputs,
      });
    };

    const pollPending = async (config) => {
      if (runtimeState.polling || state.pollList.length === 0) {
        schedulePoll(config);
        return;
      }
      runtimeState.polling = true;
      const pollSnapshot = [...state.pollList];
      for (const entry of pollSnapshot) {
        if (!state.pollList.includes(entry)) {
          continue;
        }
        entry.pollAttempts += 1;
        if (entry.pollAttempts > config.maxPollAttempts || isPastDeadline(entry)) {
          completeEntry({ entry, outcome: makeTimeoutOutcome(entry) });
          continue;
        }
        try {
          const pollResult = await pollCortexResultOnce({ config, entry });
          if (pollResult.terminal) {
            completeEntry({ entry, outcome: pollResult.outcome });
          }
        } catch (error) {
          const runtimeError =
            error instanceof CortexRuntimeError
              ? error
              : new CortexRuntimeError("poll_failed", "Cortex result poll failed.", {
                  retryable: false,
                  details: { reason: error?.message },
                });
          if (
            runtimeError.retryable &&
            entry.pollAttempts < config.maxPollAttempts &&
            !isPastDeadline(entry)
          ) {
            continue;
          }
          completeEntry({
            entry,
            outcome: makeErrorOutcome({
              normalized: entry.normalizedIntent,
              idempotencyKey: entry.idempotencyKey,
              requestId: entry.accepted.requestId,
              jobId: entry.accepted.jobId,
              refnode: entry.refnode,
              code: runtimeError.code,
              message: runtimeError.message,
              httpStatus: runtimeError.httpStatus,
              retryable: runtimeError.retryable,
              details: runtimeError.details,
              submittedAt: entry.submittedAt,
              acceptedAt: entry.acceptedAt,
            }),
          });
        }
      }
      runtimeState.polling = false;
      schedulePoll(config);
    };

    const processFifo = async ({ config, refnode }) => {
      if (runtimeState.submitting) {
        return [];
      }
      runtimeState.submitting = true;
      const immediateOutputs = [];

      while (state.fifo.length > 0) {
        const intentBottle = state.fifo.shift();
        let normalized = undefined;
        try {
          normalized = await normalizeIntentBottle({ intentBottle, refnode });
          const waiter = { intentId: normalized.intentId };
          const existingRecord = state.records[normalized.idempotencyKey];
          if (existingRecord?.state === "pending") {
            existingRecord.waiters.push(waiter);
            continue;
          }
          if (existingRecord?.state === "completed") {
            immediateOutputs.push(makeOutcomeForWaiter(existingRecord.outcome, waiter));
            continue;
          }

          const record = {
            state: "pending",
            waiters: [waiter],
            outcome: undefined,
          };
          state.records[normalized.idempotencyKey] = record;

          const submitted = await submitCortexJob({ config, normalized, refnode });
          state.pollList.push({
            ...normalized,
            accepted: submitted.accepted,
            submittedAt: submitted.submittedAt,
            acceptedAt: submitted.acceptedAt,
            deadlineMs: Date.now() + config.totalTimeoutMs,
            pollAttempts: 0,
            refnode,
            record,
          });
        } catch (error) {
          const runtimeError =
            error instanceof CortexRuntimeError || error instanceof CortexConfigError
              ? error
              : new CortexRuntimeError("runtime_error", "Unexpected Cortex runtime error.", {
                  retryable: false,
                  details: { reason: error?.message },
                });
          immediateOutputs.push(
            makeErrorOutcome({
              normalized: normalized?.normalizedIntent,
              idempotencyKey:
                normalized?.idempotencyKey ??
                maybeTrimString(intentBottle?._content?.idempotencyKey) ??
                "",
              intentId:
                normalized?.intentId ?? resolveIntentId(intentBottle?._content ?? {}, intentBottle),
              refnode,
              code: runtimeError.code,
              message: runtimeError.message,
              httpStatus: runtimeError.httpStatus,
              retryable: runtimeError.retryable === true,
              details: runtimeError.details,
            }),
          );
          if (
            normalized?.idempotencyKey &&
            state.records[normalized.idempotencyKey]?.state === "pending"
          ) {
            delete state.records[normalized.idempotencyKey];
          }
        }
      }

      runtimeState.submitting = false;
      schedulePoll(config);
      return immediateOutputs;
    };

    const control_flow$ = config$obj._control._stream.pipe(
      withLatestFrom(config$obj._stream, data_in$),
      concatMap(async ([ctrlIn, rawConfig, dataIn]) => {
        runtimeState.lastCtrl = ctrlIn;
        _stream_cache[ElemCacheKeyLUT.CTRLIN] = ctrlIn;

        try {
          const config = resolveCortexConfig(rawConfig);
          _stream_cache[cachekeys.CONFIG] = config;
          extractIntentBottles(dataIn).forEach((intentBottle) => state.fifo.push(intentBottle));
          const outputs = await processFifo({
            config,
            refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
          });
          void pollPending(config);
          return { ctrl: ctrlIn, outputs, source: "control" };
        } catch (error) {
          const runtimeError =
            error instanceof CortexConfigError
              ? error
              : new CortexRuntimeError("runtime_error", "Unexpected Cortex runtime error.", {
                  retryable: false,
                  details: { reason: error?.message },
                });
          return {
            ctrl: ctrlIn,
            outputs: [
              makeErrorOutcome({
                refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
                code: runtimeError.code,
                message: runtimeError.message,
                details: runtimeError.details,
              }),
            ],
            source: "control",
          };
        }
      }),
    );

    const _ctrl_out$ = merge(control_flow$, async_out$).pipe(
      concatMap((flowResult) => {
        const outputs = flowResult.outputs.filter((output) => output !== undefined);
        if (outputs.length === 0) {
          return of({ ctrl: flowResult.ctrl, output: undefined });
        }
        return from(outputs.map((output) => ({ ctrl: flowResult.ctrl, output })));
      }),
      map(({ ctrl, output }) => {
        if (output !== undefined) {
          _outflow_data$.next(doBottle("outcome", output));
        }
        return ctrl;
      }),
      share(),
    );

    const _tracked_data_out$ = new Observable((subscriber) => {
      runtimeState.subscriberCount += 1;
      _stream_cache[cachekeys.DATA_SUBSCRIBER_COUNT] = runtimeState.subscriberCount;
      const sub = _outflow_data$.subscribe(subscriber);
      return () => {
        sub.unsubscribe();
        runtimeState.subscriberCount = Math.max(0, runtimeState.subscriberCount - 1);
        _stream_cache[cachekeys.DATA_SUBSCRIBER_COUNT] = runtimeState.subscriberCount;
        if (runtimeState.subscriberCount === 0 && runtimeState.pollTimer !== undefined) {
          clearTimeout(runtimeState.pollTimer);
          runtimeState.pollTimer = undefined;
        }
      };
    });

    return {
      _stream: _tracked_data_out$,
      _control: {
        _stream: _ctrl_out$.pipe(share()),
      },
    };
  };

  const _datalogic_pre = (data_in) => {
    return data_in;
  };

  const _datalogic_post = (data_in) => {
    return data_in;
  };

  return {
    leaflogic: _leaflogic,
    datalogic: {
      pre: _datalogic_pre,
      post: _datalogic_post,
    },
  };
};

const props = initElementInterface;

export { props, cachekeys };

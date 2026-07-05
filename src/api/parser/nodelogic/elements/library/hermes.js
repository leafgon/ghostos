import { Observable, Subject, merge, of } from "rxjs";
import { concatMap, map, share, startWith, withLatestFrom } from "rxjs/operators";

import { ElemCacheKeyLUT, formatElementFlowdata } from "./index.js";

import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { isBottle } from "../../../predicates.js";
import { doBottle } from "../../datautils/bottling.js";

/*
 * Frozen Hermes integration contract reference:
 * - leaf-server commit: ffcae9a4c02023f76ad7e3a9e23fa008e06e9d71
 * - issue: https://github.com/leafgon/leaf-server/issues/58
 * - synced pointer: issuecomment-4865386704
 */

const cachekeys = {
  CONFIG: "_hermes_config",
  CURSOR: "_hermes_cursor",
  LAST_READ_AT: "_hermes_last_read_at",
  READ_STREAM: "_hermes_read_stream",
  READ_STREAMS: "_hermes_read_streams",
  DATA_SUBSCRIBER_COUNT: "_hermes_data_subscriber_count",
};

const HERMES_CODEBASE = "ghostos/api/parser/nodelogic/elements/library/hermes.js";
const HERMES_DEFAULT_READ_PATH = "/api/hermes/integration/events";
const HERMES_DEFAULT_READ_STREAM_PATH = "/api/hermes/integration/events/stream";
const HERMES_DEFAULT_WRITE_PATH = "/api/hermes/egress-commands";
const HERMES_DEFAULT_LIMIT = 100;
const HERMES_DEFAULT_TIMEOUT_MS = 15000;
const HERMES_DEFAULT_POLL_INTERVAL_MS = 1000;
const HERMES_TRACE_PREFIX = "HERMES_TRACE";
const HERMES_TRACE_COMPONENT = "leafelement.hermes";
const HERMES_SSE_MAX_NO_FRAME_RETRIES = 3;
const HERMES_SSE_RETRY_BASE_MS = 500;
const HERMES_SSE_RETRY_MAX_MS = 8000;
const HERMES_SSE_RETRY_JITTER_MS = 300;
const HERMES_SSE_EVENT_DEDUPE_LIMIT = 1024;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DISCORD_SNOWFLAKE_REGEX = /^\d{17,20}$/;
const SENSITIVE_KEY_REGEX = /(authorization|token|cookie|secret|password|api[-_]?key)/i;

const isPlainObject = (value) => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
};

class HermesConfigError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "HermesConfigError";
    this.code = "validation_failed";
    this.status = 500;
    this.details = details;
  }
}

class HermesDomainError extends Error {
  constructor(code, message, { status = 400, details = {} } = {}) {
    super(message);
    this.name = "HermesDomainError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const redactSecrets = (value, seen = new WeakSet()) => {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry, seen));
  }
  if (isPlainObject(value)) {
    if (seen.has(value)) {
      return "[circular]";
    }
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (SENSITIVE_KEY_REGEX.test(key)) {
          return [key, "[redacted]"];
        }
        return [key, redactSecrets(entry, seen)];
      }),
    );
  }
  return value;
};

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

const encodeTraceValue = (value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  if (typeof value === "string") {
    return encodeURIComponent(value);
  }

  try {
    return encodeURIComponent(JSON.stringify(redactSecrets(value)));
  } catch (_error) {
    return encodeURIComponent("[unserializable]");
  }
};

const hermesTrace = (eventName, fields = {}) => {
  const fieldTokens = Object.entries(fields)
    .filter(([_key, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => {
      return `${key}=${encodeTraceValue(value)}`;
    });

  const suffix = fieldTokens.length > 0 ? ` ${fieldTokens.join(" ")}` : "";
  console.log(
    `${HERMES_TRACE_PREFIX} component=${HERMES_TRACE_COMPONENT} event=${eventName}${suffix}`,
  );
};

const stableHash = (value) => {
  const input = `${value ?? ""}`;
  let hash = 0;
  for (let idx = 0; idx < input.length; idx += 1) {
    hash = (hash * 31 + input.charCodeAt(idx)) >>> 0;
  }
  return hash;
};

const resolveDeterministicJitterMs = (instanceId, retryCount) => {
  const seed = stableHash(`${instanceId}:${retryCount}`);
  return seed % (HERMES_SSE_RETRY_JITTER_MS + 1);
};

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
    throw new HermesConfigError(`${field} must be an integer between ${min} and ${max}.`, {
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
    } catch (error) {
      throw new HermesConfigError("Hermes _default config must be valid JSON.", {
        field: "_default",
      });
    }
  }
  if (!isPlainObject(configInput)) {
    throw new HermesConfigError("Hermes _default config must resolve to an object.", {
      field: "_default",
    });
  }

  return { ...configInput };
};

const normalizeHermesMode = (modeValue) => {
  const mode = `${modeValue ?? "both"}`.trim().toLowerCase();
  if (["write", "read", "both"].includes(mode)) {
    return mode;
  }
  throw new HermesConfigError("Hermes config mode must be one of: write, read, both.", {
    field: "mode",
  });
};

const resolveHeaders = (headersValue) => {
  if (headersValue === undefined || headersValue === null) {
    return {};
  }
  if (!isPlainObject(headersValue)) {
    throw new HermesConfigError("Hermes config headers must be an object.", {
      field: "headers",
    });
  }
  return { ...headersValue };
};

const resolveCredentialsMode = (config) => {
  const resolved =
    typeof config.credentials === "string"
      ? config.credentials.trim()
      : config.includeCredentials === false
        ? "same-origin"
        : "include";

  if (!["omit", "same-origin", "include"].includes(resolved)) {
    throw new HermesConfigError("Hermes config credentials must be omit|same-origin|include.", {
      field: "credentials",
    });
  }
  return resolved;
};

const normalizeReadTransport = (readTransportValue) => {
  const readTransport = `${readTransportValue ?? "auto"}`.trim().toLowerCase();
  if (["poll", "sse", "auto"].includes(readTransport)) {
    return readTransport;
  }
  throw new HermesConfigError("Hermes readTransport must be one of: poll, sse, auto.", {
    field: "readTransport",
  });
};

const resolveEventSourceFactory = (parsedConfig) => {
  if (typeof parsedConfig.eventSourceFactory === "function") {
    return parsedConfig.eventSourceFactory;
  }

  const EventSourceImpl =
    typeof parsedConfig.eventSource === "function"
      ? parsedConfig.eventSource
      : typeof globalThis.EventSource === "function"
        ? globalThis.EventSource
        : undefined;
  if (typeof EventSourceImpl !== "function") {
    return undefined;
  }

  return (url, init = {}) => {
    return new EventSourceImpl(url, init);
  };
};

const resolveHermesConfig = (rawConfig, _stream_cache) => {
  const parsedConfig = parseConfigValue(rawConfig);
  const mode = normalizeHermesMode(parsedConfig.mode);

  const baseUrl = trimString(
    parsedConfig.baseUrl ?? parsedConfig.apiBaseUrl ?? parsedConfig.hermesBaseUrl ?? "",
  );
  const readPath = trimString(
    parsedConfig.readPath ?? parsedConfig.integrationEventsPath ?? HERMES_DEFAULT_READ_PATH,
  );
  const readStreamPath = trimString(
    parsedConfig.readStreamPath ??
      parsedConfig.integrationEventsStreamPath ??
      HERMES_DEFAULT_READ_STREAM_PATH,
  );
  const writePath = trimString(
    parsedConfig.writePath ?? parsedConfig.egressCommandsPath ?? HERMES_DEFAULT_WRITE_PATH,
  );
  const readTransport = normalizeReadTransport(
    parsedConfig.readTransport ?? parsedConfig.transport ?? "auto",
  );
  const instanceId =
    maybeTrimString(parsedConfig.instanceId) ??
    maybeTrimString(_stream_cache[ElemCacheKeyLUT.REFNODE]) ??
    "";
  const guildId = trimString(parsedConfig.guildId ?? "");
  const channelId = trimString(parsedConfig.channelId ?? "");
  const cursorFromConfig = maybeTrimString(parsedConfig.cursor);
  const sinceEventId = maybeTrimString(parsedConfig.sinceEventId);
  const requestHeaders = resolveHeaders(parsedConfig.headers ?? parsedConfig.requestHeaders);
  const credentials = resolveCredentialsMode(parsedConfig);
  const limit = normalizePositiveInteger({
    value: parsedConfig.limit,
    field: "limit",
    fallback: HERMES_DEFAULT_LIMIT,
    min: 1,
    max: 500,
  });
  const timeoutMs = normalizePositiveInteger({
    value: parsedConfig.timeoutMs,
    field: "timeoutMs",
    fallback: HERMES_DEFAULT_TIMEOUT_MS,
    min: 1,
    max: 120000,
  });
  const pollIntervalMs = normalizePositiveInteger({
    value: parsedConfig.pollIntervalMs,
    field: "pollIntervalMs",
    fallback: HERMES_DEFAULT_POLL_INTERVAL_MS,
    min: 0,
    max: 300000,
  });

  const fetchImpl =
    typeof parsedConfig.fetch === "function" ? parsedConfig.fetch : globalThis.fetch;
  const eventSourceFactory = resolveEventSourceFactory(parsedConfig);
  if (typeof fetchImpl !== "function") {
    throw new HermesConfigError("Hermes runtime requires a fetch implementation.", {
      field: "fetch",
    });
  }
  if (!readPath) {
    throw new HermesConfigError("Hermes readPath must be configured.", {
      field: "readPath",
    });
  }
  if (!readStreamPath) {
    throw new HermesConfigError("Hermes readStreamPath must be configured.", {
      field: "readStreamPath",
    });
  }
  if (!writePath) {
    throw new HermesConfigError("Hermes writePath must be configured.", {
      field: "writePath",
    });
  }
  if (cursorFromConfig && sinceEventId) {
    throw new HermesConfigError("Exactly one of cursor or sinceEventId may be configured.", {
      cursor: cursorFromConfig,
      sinceEventId,
    });
  }
  if (["read", "both"].includes(mode) && !instanceId) {
    throw new HermesConfigError("Hermes config instanceId is required for read mode.", {
      field: "instanceId",
      mode,
    });
  }
  if (
    ["read", "both"].includes(mode) &&
    readTransport === "sse" &&
    typeof eventSourceFactory !== "function"
  ) {
    throw new HermesConfigError(
      "Hermes readTransport=sse requires an EventSource implementation.",
      {
        field: "eventSourceFactory",
      },
    );
  }

  return {
    mode,
    baseUrl,
    readPath,
    readStreamPath,
    writePath,
    readTransport,
    instanceId,
    guildId,
    channelId,
    cursor: cursorFromConfig ?? maybeTrimString(_stream_cache[cachekeys.CURSOR]),
    sinceEventId,
    requestHeaders,
    credentials,
    limit,
    timeoutMs,
    pollIntervalMs,
    fetchImpl,
    eventSourceFactory,
  };
};

const normalizeRfc3339UTC = (value, fieldName) => {
  const raw = trimString(value);
  const parsed = new Date(raw);
  if (!raw || Number.isNaN(parsed.getTime())) {
    throw new HermesDomainError("validation_failed", `${fieldName} must be RFC3339 UTC.`, {
      status: 400,
      details: { field: fieldName },
    });
  }
  return parsed.toISOString().replace(".000Z", "Z");
};

const requireUUIDField = (value, fieldName) => {
  const normalized = trimString(value);
  if (!UUID_REGEX.test(normalized)) {
    throw new HermesDomainError("validation_failed", `${fieldName} must be a UUID string.`, {
      status: 400,
      details: { field: fieldName },
    });
  }
  return normalized;
};

const requireNonEmptyField = (value, fieldName) => {
  const normalized = trimString(value);
  if (!normalized) {
    throw new HermesDomainError("validation_failed", `${fieldName} is required.`, {
      status: 400,
      details: { field: fieldName },
    });
  }
  return normalized;
};

const requireSnowflakeField = (value, fieldName) => {
  const normalized = trimString(value);
  if (!DISCORD_SNOWFLAKE_REGEX.test(normalized)) {
    throw new HermesDomainError(
      "validation_failed",
      `${fieldName} must be a Discord snowflake string.`,
      {
        status: 400,
        details: { field: fieldName },
      },
    );
  }
  return normalized;
};

const isEmptyInputSentinel = (_data_in) => {
  let normalizedData = _data_in;
  if (Array.isArray(normalizedData) && normalizedData.length === 1) {
    normalizedData = normalizedData[0];
  }
  if (!isBottle(normalizedData)) {
    return false;
  }

  const bottleName = `${normalizedData._bname ?? ""}`.trim().toLowerCase();
  const hasSentinelBottleName = bottleName === "empty_bottle" || bottleName === "empty";
  if (!hasSentinelBottleName) {
    return false;
  }

  const bottleContent = normalizedData._content;
  return bottleContent === "empty_data" || bottleContent === null || bottleContent === undefined;
};

const normalizeWritePayload = (_data_in) => {
  let payload = isBottle(_data_in) ? _data_in._content : _data_in;

  if (Array.isArray(payload) && payload.length === 1) {
    payload = payload[0];
  }
  if (isBottle(payload)) {
    payload = payload._content;
  }
  if (isPlainObject(payload) && isPlainObject(payload.command)) {
    payload = payload.command;
  }

  return payload;
};

const normalizeWriteCommandEnvelope = ({ payload, config }) => {
  if (!isPlainObject(payload)) {
    throw new HermesDomainError("validation_failed", "Hermes write payload must be an object.", {
      status: 400,
      details: { field: "payload" },
    });
  }

  const command = { ...payload };
  if (!command.schemaVersion) {
    command.schemaVersion = "v1";
  }
  if (!command.instanceId && config.instanceId) {
    command.instanceId = config.instanceId;
  }
  if (!command.guildId && config.guildId) {
    command.guildId = config.guildId;
  }
  if (!command.channelId && config.channelId) {
    command.channelId = config.channelId;
  }

  if (`${command.schemaVersion}`.trim() !== "v1") {
    throw new HermesDomainError("validation_failed", "schemaVersion must be 'v1'.", {
      status: 400,
      details: { field: "schemaVersion" },
    });
  }

  const commandId = requireUUIDField(command.commandId, "commandId");
  const correlationId = requireNonEmptyField(command.correlationId, "correlationId");
  const producerId = requireNonEmptyField(command.producerId, "producerId");
  const instanceId = requireUUIDField(command.instanceId, "instanceId");
  const guildId = requireSnowflakeField(command.guildId, "guildId");
  const channelId = requireSnowflakeField(command.channelId, "channelId");
  const type = requireNonEmptyField(command.type, "type");

  if (!["send_message", "reply_message"].includes(type)) {
    throw new HermesDomainError(
      "validation_failed",
      "type must be one of: send_message, reply_message.",
      {
        status: 400,
        details: { field: "type" },
      },
    );
  }

  if (!isPlainObject(command.payload)) {
    throw new HermesDomainError("validation_failed", "payload must be an object.", {
      status: 400,
      details: { field: "payload" },
    });
  }

  const commandPayload = { ...command.payload };
  const replyToMessageId = maybeTrimString(commandPayload.replyToMessageId);
  if (type === "send_message") {
    if (replyToMessageId !== undefined) {
      throw new HermesDomainError(
        "validation_failed",
        "replyToMessageId must be null/absent for send_message.",
        {
          status: 400,
          details: { field: "payload.replyToMessageId" },
        },
      );
    }
    commandPayload.replyToMessageId = null;
  } else {
    if (!replyToMessageId || !DISCORD_SNOWFLAKE_REGEX.test(replyToMessageId)) {
      throw new HermesDomainError(
        "validation_failed",
        "replyToMessageId must be a Discord snowflake for reply_message.",
        {
          status: 400,
          details: { field: "payload.replyToMessageId" },
        },
      );
    }
    commandPayload.replyToMessageId = replyToMessageId;
  }

  const issuedAt = normalizeRfc3339UTC(command.issuedAt, "issuedAt");
  const expiresAt = normalizeRfc3339UTC(command.expiresAt, "expiresAt");
  if (new Date(issuedAt) > new Date(expiresAt)) {
    throw new HermesDomainError("validation_failed", "issuedAt must be <= expiresAt.", {
      status: 400,
      details: { field: "issuedAt" },
    });
  }

  return {
    schemaVersion: "v1",
    commandId,
    correlationId,
    producerId,
    instanceId,
    guildId,
    channelId,
    type,
    payload: commandPayload,
    issuedAt,
    expiresAt,
  };
};

const resolveApiUrl = ({ path, baseUrl, query = {} }) => {
  if (!path) {
    throw new HermesConfigError("Hermes endpoint path must not be empty.", {
      field: "path",
    });
  }

  const hasAbsoluteProtocol = /^https?:\/\//i.test(path);
  const normalizedPath = `${path}`.trim();
  const normalizedBaseUrl = trimString(baseUrl ?? "");
  const urlBase = hasAbsoluteProtocol
    ? normalizedPath
    : normalizedBaseUrl
      ? `${normalizedBaseUrl.replace(/\/+$/, "")}/${normalizedPath.replace(/^\/+/, "")}`
      : normalizedPath;

  const queryEntries = Object.entries(query)
    .filter(
      ([_key, value]) => value !== undefined && value !== null && `${value}`.trim().length > 0,
    )
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(`${value}`.trim())}`);
  if (queryEntries.length === 0) {
    return urlBase;
  }

  return `${urlBase}${urlBase.includes("?") ? "&" : "?"}${queryEntries.join("&")}`;
};

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch (_jsonError) {
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

const mapStatusToErrorCode = (statusCode) => {
  if (statusCode === 400) return "validation_failed";
  if (statusCode === 401) return "auth_unauthorized";
  if (statusCode === 403) return "auth_forbidden_scope";
  if (statusCode === 409) return "validation_failed";
  if (statusCode === 413) return "payload_too_large";
  if (statusCode === 429) return "rate_limited";
  if (statusCode >= 500) return "upstream_unavailable";
  return "execution_failed";
};

const mapApiError = ({ statusCode, payload, fallbackMessage }) => {
  const payloadError = isPlainObject(payload?.error) ? payload.error : undefined;
  const details =
    payloadError?.details !== undefined
      ? payloadError.details
      : payload?.details !== undefined
        ? payload.details
        : undefined;

  return {
    code:
      typeof payloadError?.code === "string" && payloadError.code.trim().length > 0
        ? payloadError.code.trim()
        : mapStatusToErrorCode(statusCode),
    message:
      typeof payloadError?.message === "string" && payloadError.message.trim().length > 0
        ? payloadError.message.trim()
        : fallbackMessage,
    status: statusCode,
    details: details !== undefined ? redactSecrets(details) : undefined,
  };
};

const READ_RESPONSE_META_KEYS = new Set([
  "schemaVersion",
  "requestId",
  "nextCursor",
  "cursor",
  "hasMore",
  "events",
  "data",
  "instance",
]);

const isMeaningfulReadRecord = (record) => {
  return isPlainObject(record) && Object.keys(record).length > 0;
};

const hasNonMetaReadFields = (payload) => {
  return (
    isPlainObject(payload) &&
    Object.keys(payload).some((key) => {
      return !READ_RESPONSE_META_KEYS.has(key);
    })
  );
};

const normalizeReadRecords = (responsePayload) => {
  if (Array.isArray(responsePayload.events)) {
    return responsePayload.events.filter((entry) => isMeaningfulReadRecord(entry));
  }

  if (Array.isArray(responsePayload.data)) {
    const records = responsePayload.data.filter((entry) => isMeaningfulReadRecord(entry));
    if (records.length > 0) {
      return records;
    }
  }

  if (isMeaningfulReadRecord(responsePayload.data)) {
    return [responsePayload.data];
  }

  if (isMeaningfulReadRecord(responsePayload.instance)) {
    return [responsePayload.instance];
  }

  if (hasNonMetaReadFields(responsePayload)) {
    return [responsePayload];
  }

  return [];
};

const toElementSuccessOutput = ({ mode, data, meta = {} }) => {
  return {
    element: "hermes",
    mode,
    ok: true,
    data: redactSecrets(data),
    meta: redactSecrets(meta),
  };
};

const toElementErrorOutput = ({ mode, error, meta = {} }) => {
  return {
    element: "hermes",
    mode,
    ok: false,
    error: {
      code: error.code ?? "execution_failed",
      message: error.message ?? "Hermes operation failed.",
      status: Number.isInteger(error.status) ? error.status : undefined,
      details: error.details !== undefined ? redactSecrets(error.details) : undefined,
    },
    meta: redactSecrets(meta),
  };
};

const toFatalErrorBottle = (error) => {
  const code = error?.code ?? "execution_failed";
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const message =
    typeof error?.message === "string" && error.message.trim().length > 0
      ? error.message.trim()
      : "Unexpected Hermes runtime failure.";

  return doBottle(
    "error",
    {
      type: "critical",
      element: "hermes",
      code,
      message,
      status,
      details: redactSecrets(error?.details ?? {}),
      codebase: HERMES_CODEBASE,
    },
    {},
  );
};

const clearReadStreamListeners = (readStreamState) => {
  if (!isPlainObject(readStreamState) || !Array.isArray(readStreamState.detachFns)) {
    return;
  }

  readStreamState.detachFns.forEach((detachFn) => {
    if (typeof detachFn === "function") {
      try {
        detachFn();
      } catch (_error) {
        // Best-effort listener teardown.
      }
    }
  });
  readStreamState.detachFns = [];
};

const ensureReadStreamRegistry = (_stream_cache) => {
  const readStreams = _stream_cache[cachekeys.READ_STREAMS];
  if (isPlainObject(readStreams)) {
    return readStreams;
  }
  const nextReadStreams = {};
  _stream_cache[cachekeys.READ_STREAMS] = nextReadStreams;
  return nextReadStreams;
};

const listReadStreamStates = (_stream_cache) => {
  return Object.values(ensureReadStreamRegistry(_stream_cache)).filter((entry) =>
    isPlainObject(entry),
  );
};

const getReadStreamStateByInstance = (_stream_cache, instanceId) => {
  if (!instanceId) {
    return undefined;
  }
  const readStreams = ensureReadStreamRegistry(_stream_cache);
  return isPlainObject(readStreams[instanceId]) ? readStreams[instanceId] : undefined;
};

const setReadStreamStateByInstance = ({ _stream_cache, instanceId, readStreamState }) => {
  if (!instanceId || !isPlainObject(readStreamState)) {
    return;
  }
  const readStreams = ensureReadStreamRegistry(_stream_cache);
  readStreams[instanceId] = readStreamState;
  _stream_cache[cachekeys.READ_STREAM] = readStreamState;
};

const removeReadStreamStateByInstance = (_stream_cache, instanceId) => {
  if (!instanceId) {
    return;
  }
  const readStreams = ensureReadStreamRegistry(_stream_cache);
  delete readStreams[instanceId];
  if (_stream_cache[cachekeys.READ_STREAM]?.instanceId === instanceId) {
    delete _stream_cache[cachekeys.READ_STREAM];
  }
};

const clearReadStreamReconnectTimer = (readStreamState) => {
  if (!isPlainObject(readStreamState)) {
    return;
  }
  if (readStreamState.reconnectTimer !== undefined) {
    clearTimeout(readStreamState.reconnectTimer);
    readStreamState.reconnectTimer = undefined;
  }
};

const resolveDataSubscriberCount = (_stream_cache) => {
  const resolved = Number(_stream_cache[cachekeys.DATA_SUBSCRIBER_COUNT] ?? 0);
  if (!Number.isFinite(resolved) || Number.isNaN(resolved) || resolved <= 0) {
    return 0;
  }
  return Math.floor(resolved);
};

const hasActiveDataSubscribers = (_stream_cache) => {
  return resolveDataSubscriberCount(_stream_cache) > 0;
};

const closeReadStreamState = (readStreamState, reason = "unspecified") => {
  if (!isPlainObject(readStreamState)) {
    return;
  }

  hermesTrace("sse.lifecycle.close", {
    fallbackToPoll: readStreamState.fallbackToPoll === true,
    instanceId: readStreamState.instanceId,
    reason,
    streamId: readStreamState.identityKey,
  });

  clearReadStreamReconnectTimer(readStreamState);
  clearReadStreamListeners(readStreamState);
  if (typeof readStreamState.source?.close === "function") {
    try {
      readStreamState.source.close();
    } catch (_error) {
      // Best-effort stream teardown.
    }
  }
  readStreamState.source = undefined;
};

const closeReadStreamByInstance = (_stream_cache, instanceId, reason = "unspecified") => {
  const readStreamState = getReadStreamStateByInstance(_stream_cache, instanceId);
  if (!isPlainObject(readStreamState)) {
    removeReadStreamStateByInstance(_stream_cache, instanceId);
    return;
  }

  closeReadStreamState(readStreamState, reason);
  removeReadStreamStateByInstance(_stream_cache, instanceId);
};

const closeReadStream = (_stream_cache, reason = "unspecified") => {
  listReadStreamStates(_stream_cache).forEach((readStreamState) => {
    closeReadStreamState(readStreamState, reason);
  });
  _stream_cache[cachekeys.READ_STREAMS] = {};
  delete _stream_cache[cachekeys.READ_STREAM];
};

const drainReadStreamOutputs = (_stream_cache) => {
  const outputs = [];
  listReadStreamStates(_stream_cache).forEach((readStreamState) => {
    if (
      !Array.isArray(readStreamState.pendingOutputs) ||
      readStreamState.pendingOutputs.length === 0
    ) {
      return;
    }
    outputs.push(...readStreamState.pendingOutputs);
    readStreamState.pendingOutputs = [];
  });
  return outputs;
};

const resolveReadCursor = ({ config, _stream_cache }) => {
  return maybeTrimString(_stream_cache[cachekeys.CURSOR]) ?? config.cursor;
};

const resolveReadQuery = ({ config, _stream_cache, includeLimit }) => {
  const cursor = resolveReadCursor({ config, _stream_cache });
  return {
    instanceId: config.instanceId,
    guildId: config.guildId || undefined,
    channelId: config.channelId || undefined,
    cursor: cursor ?? undefined,
    sinceEventId: cursor ? undefined : config.sinceEventId,
    limit: includeLimit ? config.limit : undefined,
  };
};

const resolveReadPollUrl = ({ config, _stream_cache }) => {
  return resolveApiUrl({
    path: config.readPath,
    baseUrl: config.baseUrl,
    query: resolveReadQuery({
      config,
      _stream_cache,
      includeLimit: true,
    }),
  });
};

const resolveReadStreamUrl = ({ config, _stream_cache }) => {
  return resolveApiUrl({
    path: config.readStreamPath,
    baseUrl: config.baseUrl,
    query: resolveReadQuery({
      config,
      _stream_cache,
      includeLimit: false,
    }),
  });
};

const resolveReadStreamIdentityKey = (config) => {
  const headerEntries = Object.entries(config.requestHeaders ?? {}).sort(([left], [right]) => {
    return left.localeCompare(right);
  });

  return JSON.stringify({
    baseUrl: config.baseUrl,
    readStreamPath: config.readStreamPath,
    readTransport: config.readTransport,
    instanceId: config.instanceId,
    guildId: config.guildId || "",
    channelId: config.channelId || "",
    credentials: config.credentials,
    requestHeaders: headerEntries,
  });
};

const parseSsePayloadObject = (rawData) => {
  if (isPlainObject(rawData)) {
    return rawData;
  }
  if (typeof rawData !== "string") {
    return undefined;
  }

  const trimmed = rawData.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return isPlainObject(parsed) ? parsed : undefined;
  } catch (_error) {
    return undefined;
  }
};

const attachEventSourceListener = (source, eventName, listener) => {
  if (typeof source?.addEventListener === "function") {
    source.addEventListener(eventName, listener);
    return () => {
      if (typeof source?.removeEventListener === "function") {
        source.removeEventListener(eventName, listener);
      }
    };
  }

  const canUseHandlerProperty =
    source !== null &&
    (typeof source === "object" || typeof source === "function") &&
    ((eventName === "message" && "onmessage" in source) ||
      (eventName === "open" && "onopen" in source) ||
      (eventName === "error" && "onerror" in source));
  if (!canUseHandlerProperty) {
    return () => {};
  }

  const property =
    eventName === "error" ? "onerror" : eventName === "open" ? "onopen" : "onmessage";
  const previous = source[property];
  source[property] = listener;
  return () => {
    if (source[property] === listener) {
      source[property] = previous;
    }
  };
};

const toReadSseErrorOutput = ({
  config,
  reason,
  message,
  status = 503,
  code = "upstream_unavailable",
}) => {
  return toElementErrorOutput({
    mode: "read",
    error: {
      code,
      message,
      status,
      details: { reason },
    },
    meta: {
      instanceId: config.instanceId,
    },
  });
};

const queueReadStreamOutput = (readStreamState, output) => {
  if (!isPlainObject(readStreamState) || output === undefined) {
    return;
  }
  if (typeof readStreamState.emitReadOutput === "function") {
    readStreamState.emitReadOutput(output);
    return;
  }
  if (!Array.isArray(readStreamState.pendingOutputs)) {
    readStreamState.pendingOutputs = [];
  }
  readStreamState.pendingOutputs.push(output);
};

const closeProbeResponseBody = async (response) => {
  try {
    if (typeof response?.body?.cancel === "function") {
      await response.body.cancel();
    }
  } catch (_error) {
    // Best-effort body cancellation after preflight headers.
  }
};

const runSsePreflightProbe = async ({ config, streamUrl, readStreamState }) => {
  const probeTimeoutMs = Math.max(1000, Math.min(config.timeoutMs, 5000));
  const probeMethod = "HEAD";
  hermesTrace("sse.preflight.request", {
    instanceId: config.instanceId,
    method: probeMethod,
    timeoutMs: probeTimeoutMs,
    url: streamUrl,
  });

  let response = undefined;
  try {
    response = await fetchWithTimeout(
      config.fetchImpl,
      streamUrl,
      {
        method: probeMethod,
        headers: {
          Accept: "text/event-stream",
          ...config.requestHeaders,
        },
        credentials: config.credentials,
      },
      probeTimeoutMs,
    );
  } catch (error) {
    hermesTrace("sse.preflight.network_error", {
      instanceId: config.instanceId,
      reason: error?.name === "AbortError" ? "timeout" : "network_error",
    });
    readStreamState.lastHttpStatus = undefined;
    return {
      authFailureReason: undefined,
      status: undefined,
      transientReason: error?.name === "AbortError" ? "timeout" : "network_error",
    };
  }

  const status = Number.isInteger(response?.status) ? response.status : undefined;
  readStreamState.lastHttpStatus = status;
  await closeProbeResponseBody(response);
  hermesTrace("sse.preflight.response", {
    instanceId: config.instanceId,
    ok: response?.ok === true,
    status,
  });

  if (status === 401) {
    return {
      authFailureReason: "http_401",
      status,
      transientReason: undefined,
    };
  }
  if (status === 403) {
    return {
      authFailureReason: "http_403",
      status,
      transientReason: undefined,
    };
  }
  if (status !== undefined && status >= 500) {
    return {
      authFailureReason: undefined,
      status,
      transientReason: `http_${status}`,
    };
  }

  return {
    authFailureReason: undefined,
    status,
    transientReason: undefined,
  };
};

const supportsEventSourceApi = (source) => {
  return (
    source !== null &&
    (typeof source === "object" || typeof source === "function") &&
    (typeof source.addEventListener === "function" ||
      "onopen" in source ||
      "onmessage" in source ||
      "onerror" in source)
  );
};

const resolveSseMessageId = ({ messageEvent, payload }) => {
  const candidates = [
    payload?.message_id,
    payload?.messageId,
    payload?.eventId,
    payload?.id,
    payload?.cursor,
    messageEvent?.lastEventId,
  ];
  for (const candidate of candidates) {
    const normalizedCandidate = maybeTrimString(candidate);
    if (normalizedCandidate) {
      return normalizedCandidate;
    }
  }
  return undefined;
};

const HERMES_ENVELOPE_WRAPPER_KEYS = ["payload", "event", "data"];
const HERMES_ENVELOPE_MAX_DEPTH = 6;

const hasEnvelopeContentText = (candidate) => {
  return candidate?.content?.text !== undefined && candidate?.content?.text !== null;
};

const collectHermesEnvelopeObjects = (payload) => {
  if (!isPlainObject(payload)) {
    return [];
  }

  const queue = [{ value: payload, depth: 0 }];
  const visited = new Set();
  const resolved = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentValue = current?.value;
    const currentDepth = Number.isInteger(current?.depth) ? current.depth : 0;
    if (!isPlainObject(currentValue) || visited.has(currentValue)) {
      continue;
    }
    visited.add(currentValue);
    resolved.push(currentValue);

    if (currentDepth >= HERMES_ENVELOPE_MAX_DEPTH) {
      continue;
    }

    for (const wrapperKey of HERMES_ENVELOPE_WRAPPER_KEYS) {
      const nextValue = currentValue[wrapperKey];
      if (isPlainObject(nextValue)) {
        queue.push({ value: nextValue, depth: currentDepth + 1 });
      }
    }
  }

  return resolved;
};

const resolveHermesUserMessagePayload = (envelopeObjects) => {
  return envelopeObjects.find((candidate) => {
    const discordEventType = maybeTrimString(candidate?.discord?.eventType);
    return discordEventType === "MESSAGE_CREATE" && hasEnvelopeContentText(candidate);
  });
};

const resolveHermesEnvelopePayload = (payload, envelopeObjects) => {
  const resolvedObjects = Array.isArray(envelopeObjects)
    ? envelopeObjects
    : collectHermesEnvelopeObjects(payload);
  if (resolvedObjects.length === 0) {
    return undefined;
  }

  const userMessagePayload = resolveHermesUserMessagePayload(resolvedObjects);
  if (userMessagePayload) {
    return userMessagePayload;
  }

  const payloadErrorCandidate = resolvedObjects.find((candidate) => {
    return candidate?.error !== undefined && candidate?.error !== null;
  });
  if (payloadErrorCandidate) {
    return payloadErrorCandidate;
  }

  const discordEventCandidate = resolvedObjects.find((candidate) => {
    return maybeTrimString(candidate?.discord?.eventType) !== undefined;
  });
  if (discordEventCandidate) {
    return discordEventCandidate;
  }

  const contentCandidate = resolvedObjects.find((candidate) => hasEnvelopeContentText(candidate));
  if (contentCandidate) {
    return contentCandidate;
  }

  return resolvedObjects[0];
};

const hasNonNullPayloadError = (payload, envelopeObjects) => {
  const resolvedObjects = Array.isArray(envelopeObjects)
    ? envelopeObjects
    : collectHermesEnvelopeObjects(payload);
  return resolvedObjects.some((candidate) => {
    return candidate?.error !== undefined && candidate?.error !== null;
  });
};

const resolveHermesEventFilterResult = (payload) => {
  const kind = maybeTrimString(payload?.kind);
  const envelopeObjects = collectHermesEnvelopeObjects(payload);
  const userMessagePayload = resolveHermesUserMessagePayload(envelopeObjects);
  const envelopePayload = resolveHermesEnvelopePayload(payload, envelopeObjects);
  const hasPayloadError = hasNonNullPayloadError(payload, envelopeObjects);

  const normalizedPayload = userMessagePayload ?? envelopePayload;
  const discordEventType = maybeTrimString(normalizedPayload?.discord?.eventType);
  const hasContentText = hasEnvelopeContentText(normalizedPayload);
  const hasUserMessage = userMessagePayload !== undefined;

  if (kind === "runtime.observed" && !hasPayloadError && !hasUserMessage) {
    return {
      allowDispatch: false,
      reason: "runtime_observed_noise",
      discordEventType,
      hasContentText,
      hasPayloadError,
    };
  }

  if (hasPayloadError) {
    return {
      allowDispatch: true,
      reason: "payload_error",
      discordEventType,
      hasContentText,
      hasPayloadError,
    };
  }

  if (!hasUserMessage || discordEventType !== "MESSAGE_CREATE" || !hasContentText) {
    return {
      allowDispatch: false,
      reason: "not_user_message",
      discordEventType,
      hasContentText,
      hasPayloadError,
    };
  }

  return {
    allowDispatch: true,
    reason: "user_message",
    discordEventType,
    hasContentText,
    hasPayloadError,
  };
};

const isDuplicateSseMessage = (readStreamState, messageId) => {
  const normalizedMessageId = maybeTrimString(messageId);
  if (!normalizedMessageId) {
    return false;
  }

  if (!(readStreamState.seenMessageIds instanceof Set)) {
    readStreamState.seenMessageIds = new Set();
  }
  if (!Array.isArray(readStreamState.seenMessageOrder)) {
    readStreamState.seenMessageOrder = [];
  }

  if (readStreamState.seenMessageIds.has(normalizedMessageId)) {
    return true;
  }

  readStreamState.seenMessageIds.add(normalizedMessageId);
  readStreamState.seenMessageOrder.push(normalizedMessageId);

  while (readStreamState.seenMessageOrder.length > HERMES_SSE_EVENT_DEDUPE_LIMIT) {
    const droppedMessageId = readStreamState.seenMessageOrder.shift();
    if (droppedMessageId !== undefined) {
      readStreamState.seenMessageIds.delete(droppedMessageId);
    }
  }

  return false;
};

const markReadStreamAuthPass = (readStreamState, config, reason) => {
  if (!readStreamState.authResolved) {
    readStreamState.authResolved = true;
    readStreamState.authPassed = true;
    hermesTrace("sse.auth.pass", {
      instanceId: config.instanceId,
      reason,
    });
  }
};

const enablePollFallback = ({ readStreamState, config, reason }) => {
  readStreamState.fallbackToPoll = true;
  clearReadStreamReconnectTimer(readStreamState);
  hermesTrace("sse.lifecycle.fallback_poll_enabled", {
    instanceId: config.instanceId,
    reason,
    streamId: readStreamState.identityKey,
    transport: config.readTransport,
  });
};

const emitAuthFail = ({ readStreamState, config, reason, status }) => {
  readStreamState.authResolved = true;
  readStreamState.authPassed = false;
  readStreamState.terminalFailureReason = reason;
  clearReadStreamReconnectTimer(readStreamState);

  hermesTrace("sse.auth.fail", {
    instanceId: config.instanceId,
    reason,
    status,
  });

  const resolvedStatus =
    status ?? (reason === "http_401" ? 401 : reason === "http_403" ? 403 : 503);
  const resolvedCode =
    reason === "http_401"
      ? "auth_unauthorized"
      : reason === "http_403"
        ? "auth_forbidden_scope"
        : "execution_failed";

  queueReadStreamOutput(
    readStreamState,
    toReadSseErrorOutput({
      config,
      reason,
      message: `Hermes SSE stream failed (${reason}).`,
      status: resolvedStatus,
      code: resolvedCode,
    }),
  );
};

const scheduleSseReconnect = ({ config, _stream_cache, readStreamState, reason }) => {
  if (!hasActiveDataSubscribers(_stream_cache)) {
    hermesTrace("sse.lifecycle.reconnect_skipped", {
      instanceId: config.instanceId,
      reason: "no_data_subscribers",
      retryCount: Number(readStreamState.retryCount ?? 0),
    });
    return;
  }
  if (readStreamState.fallbackToPoll === true || readStreamState.terminalFailureReason) {
    return;
  }
  if (readStreamState.reconnectTimer !== undefined) {
    return;
  }

  readStreamState.retryCount = Number(readStreamState.retryCount ?? 0) + 1;
  const backoffMs = Math.min(
    HERMES_SSE_RETRY_BASE_MS * 2 ** Math.min(readStreamState.retryCount - 1, 5),
    HERMES_SSE_RETRY_MAX_MS,
  );
  const jitterMs = resolveDeterministicJitterMs(
    readStreamState.instanceId,
    readStreamState.retryCount,
  );
  const delayMs = backoffMs + jitterMs;
  hermesTrace("sse.lifecycle.reconnect_scheduled", {
    delayMs,
    instanceId: config.instanceId,
    jitterMs,
    reason,
    retryCount: readStreamState.retryCount,
  });

  readStreamState.reconnectTimer = setTimeout(() => {
    readStreamState.reconnectTimer = undefined;
    openSseReadStream({
      config,
      _stream_cache,
      readStreamState,
      trigger: "reconnect",
    }).catch((_error) => {
      // Error handling is performed inside openSseReadStream.
    });
  }, delayMs);
};

const handleSseOpenFailure = ({ config, _stream_cache, readStreamState, reason, status }) => {
  readStreamState.currentAttemptFramesSeen = 0;
  readStreamState.noFrameFailureCount = Number(readStreamState.noFrameFailureCount ?? 0) + 1;

  if (reason === "http_401" || reason === "http_403") {
    emitAuthFail({ readStreamState, config, reason, status });
    return;
  }

  if (readStreamState.noFrameFailureCount >= HERMES_SSE_MAX_NO_FRAME_RETRIES) {
    if (config.readTransport === "auto") {
      readStreamState.terminalFailureReason = "max_no_frame_retries";
      hermesTrace("sse.lifecycle.no_frame_threshold", {
        instanceId: config.instanceId,
        noFrameFailureCount: readStreamState.noFrameFailureCount,
        status,
      });
      enablePollFallback({
        readStreamState,
        config,
        reason: "max_no_frame_retries",
      });
      return;
    }

    readStreamState.terminalFailureReason = "max_no_frame_retries";
    queueReadStreamOutput(
      readStreamState,
      toReadSseErrorOutput({
        config,
        reason: "max_no_frame_retries",
        message: "Hermes SSE stream did not emit frames after repeated retries.",
        status: status ?? 503,
        code: "upstream_unavailable",
      }),
    );
    hermesTrace("sse.lifecycle.no_frame_threshold", {
      instanceId: config.instanceId,
      noFrameFailureCount: readStreamState.noFrameFailureCount,
      reason: "max_no_frame_retries",
      status,
    });
    return;
  }

  scheduleSseReconnect({
    config,
    _stream_cache,
    readStreamState,
    reason,
  });
};

const openSseReadStream = async ({ config, _stream_cache, readStreamState, trigger }) => {
  if (!isPlainObject(readStreamState)) {
    return;
  }
  if (!hasActiveDataSubscribers(_stream_cache)) {
    hermesTrace("sse.lifecycle.open_skipped", {
      instanceId: config.instanceId,
      reason: "no_data_subscribers",
      transport: config.readTransport,
      trigger,
    });
    return;
  }
  if (
    readStreamState.opening === true ||
    readStreamState.source ||
    readStreamState.fallbackToPoll
  ) {
    return;
  }
  if (
    readStreamState.terminalFailureReason &&
    readStreamState.terminalFailureReason !== "max_no_frame_retries"
  ) {
    return;
  }
  if (typeof config.eventSourceFactory !== "function") {
    return;
  }

  const streamUrl = resolveReadStreamUrl({ config, _stream_cache });
  readStreamState.streamUrl = streamUrl;
  readStreamState.opening = true;
  readStreamState.currentAttemptOpened = false;
  clearReadStreamReconnectTimer(readStreamState);
  hermesTrace("sse.lifecycle.open_attempt", {
    instanceId: config.instanceId,
    retryCount: Number(readStreamState.retryCount ?? 0),
    streamUrl,
    transport: config.readTransport,
    trigger,
  });

  if (readStreamState.preflightAttempted !== true) {
    readStreamState.preflightAttempted = true;
    const preflight = await runSsePreflightProbe({
      config,
      streamUrl,
      readStreamState,
    });
    if (preflight.authFailureReason) {
      readStreamState.opening = false;
      handleSseOpenFailure({
        config,
        _stream_cache,
        readStreamState,
        reason: preflight.authFailureReason,
        status: preflight.status,
      });
      return;
    }
    if (preflight.transientReason) {
      hermesTrace("sse.preflight.transient", {
        instanceId: config.instanceId,
        reason: preflight.transientReason,
        status: preflight.status,
      });
    }
    if (preflight.status !== undefined && preflight.status >= 200 && preflight.status < 300) {
      markReadStreamAuthPass(readStreamState, config, "preflight_http_2xx");
    }
  }

  let source = undefined;
  try {
    source = config.eventSourceFactory(streamUrl, {
      withCredentials: config.credentials === "include",
      headers: {
        ...config.requestHeaders,
      },
    });
  } catch (_error) {
    readStreamState.opening = false;
    handleSseOpenFailure({
      config,
      _stream_cache,
      readStreamState,
      reason: "stream_open_failed",
      status: readStreamState.lastHttpStatus,
    });
    return;
  }

  if (!supportsEventSourceApi(source)) {
    if (typeof source?.close === "function") {
      source.close();
    }
    readStreamState.opening = false;
    handleSseOpenFailure({
      config,
      _stream_cache,
      readStreamState,
      reason: "invalid_event_source",
      status: 500,
    });
    return;
  }

  readStreamState.source = source;
  readStreamState.opening = false;
  readStreamState.currentAttemptFramesSeen = 0;
  readStreamState.terminalFailureReason = undefined;
  hermesTrace("sse.lifecycle.open", {
    instanceId: config.instanceId,
    streamId: readStreamState.identityKey,
    streamUrl,
    transport: config.readTransport,
  });

  const markFrameSeen = () => {
    readStreamState.framesSeen = Number(readStreamState.framesSeen ?? 0) + 1;
    readStreamState.currentAttemptFramesSeen =
      Number(readStreamState.currentAttemptFramesSeen ?? 0) + 1;
    readStreamState.noFrameFailureCount = 0;
    readStreamState.retryCount = 0;
  };

  const handleEventLikeMessage = (messageEvent, eventType) => {
    markFrameSeen();
    markReadStreamAuthPass(readStreamState, config, "stream_open");
    const payload = parseSsePayloadObject(messageEvent?.data);
    const messageId = resolveSseMessageId({
      messageEvent,
      payload,
    });
    hermesTrace("sse.event.received", {
      eventType,
      instanceId: config.instanceId,
      messageId,
    });

    if (isDuplicateSseMessage(readStreamState, messageId)) {
      hermesTrace("sse.event.duplicate", {
        eventType,
        instanceId: config.instanceId,
        messageId,
      });
      return;
    }

    if (eventType === "hermes.heartbeat") {
      if (!isPlainObject(payload)) {
        return;
      }
      const nextCursor = maybeTrimString(payload.cursor);
      if (nextCursor) {
        _stream_cache[cachekeys.CURSOR] = nextCursor;
      }
      hermesTrace("sse.event.heartbeat", {
        cursor: nextCursor,
        instanceId: config.instanceId,
      });
      return;
    }

    if (eventType !== "hermes.event") {
      hermesTrace("sse.event.filtered", {
        eventType,
        instanceId: config.instanceId,
        messageId,
        reason: "unsupported_event_type",
      });
      return;
    }

    if (!isMeaningfulReadRecord(payload)) {
      hermesTrace("sse.event.invalid_payload", {
        instanceId: config.instanceId,
        reason: "invalid_stream_event_payload",
      });
      queueReadStreamOutput(
        readStreamState,
        toReadSseErrorOutput({
          config,
          reason: "invalid_stream_event_payload",
          message: "Hermes SSE event payload must be a JSON object.",
          status: 502,
          code: "validation_failed",
        }),
      );
      return;
    }

    const nextCursor = maybeTrimString(payload.cursor);
    if (nextCursor) {
      _stream_cache[cachekeys.CURSOR] = nextCursor;
    }

    const filterResult = resolveHermesEventFilterResult(payload);
    if (!filterResult.allowDispatch) {
      hermesTrace("sse.event.filtered", {
        eventType,
        hasContentText: filterResult.hasContentText,
        hasPayloadError: filterResult.hasPayloadError,
        instanceId: config.instanceId,
        kind: payload.kind,
        messageId,
        reason: filterResult.reason,
        discordEventType: filterResult.discordEventType,
      });
      return;
    }

    hermesTrace("sse.event.dispatched", {
      eventId: payload.eventId,
      discordEventType: filterResult.discordEventType,
      hasContentText: filterResult.hasContentText,
      hasPayloadError: filterResult.hasPayloadError,
      instanceId: config.instanceId,
      kind: payload.kind,
      sequence: payload.sequence,
    });

    queueReadStreamOutput(
      readStreamState,
      toElementSuccessOutput({
        mode: "read",
        data: {
          schemaVersion: typeof payload.schemaVersion === "string" ? payload.schemaVersion : "v1",
          event: payload,
          cursor: nextCursor,
          hasMore: false,
        },
        meta: {
          instanceId: config.instanceId,
        },
      }),
    );
  };

  const handleStreamOpen = () => {
    readStreamState.currentAttemptOpened = true;
    markReadStreamAuthPass(readStreamState, config, "stream_open");
  };

  const handleStreamError = () => {
    const currentAttemptFramesSeen = Number(readStreamState.currentAttemptFramesSeen ?? 0);
    const totalFramesSeen = Number(readStreamState.framesSeen ?? 0);
    const hasFrameActivity = currentAttemptFramesSeen > 0 || totalFramesSeen > 0;
    const currentAttemptOpened = readStreamState.currentAttemptOpened === true;

    hermesTrace("sse.lifecycle.error", {
      authResolved: readStreamState.authResolved === true,
      framesSeen: totalFramesSeen,
      instanceId: config.instanceId,
      lastHttpStatus: readStreamState.lastHttpStatus,
      retryCount: Number(readStreamState.retryCount ?? 0),
      transport: config.readTransport,
    });

    clearReadStreamListeners(readStreamState);
    if (typeof readStreamState.source?.close === "function") {
      try {
        readStreamState.source.close();
      } catch (_error) {
        // Best-effort stream teardown after error.
      }
    }
    readStreamState.source = undefined;
    readStreamState.currentAttemptOpened = false;

    if (hasFrameActivity) {
      scheduleSseReconnect({
        config,
        _stream_cache,
        readStreamState,
        reason: "stream_closed_after_activity",
      });
      return;
    }

    const status = readStreamState.lastHttpStatus;
    const explicitAuthReason =
      status === 401 ? "http_401" : status === 403 ? "http_403" : undefined;
    if (explicitAuthReason) {
      handleSseOpenFailure({
        config,
        _stream_cache,
        readStreamState,
        reason: explicitAuthReason,
        status,
      });
      return;
    }

    const isAuthenticatedSession =
      readStreamState.authResolved === true && readStreamState.authPassed !== false;
    const hasSuccessfulPreflight = status !== undefined && status >= 200 && status < 300;
    if (currentAttemptOpened || isAuthenticatedSession || hasSuccessfulPreflight) {
      readStreamState.noFrameFailureCount = 0;
      scheduleSseReconnect({
        config,
        _stream_cache,
        readStreamState,
        reason: currentAttemptOpened
          ? "stream_closed_no_frame_after_open"
          : "stream_closed_no_frame_authenticated",
      });
      return;
    }

    handleSseOpenFailure({
      config,
      _stream_cache,
      readStreamState,
      reason: "stream_error_no_frame",
      status,
    });
  };

  readStreamState.detachFns = [
    attachEventSourceListener(readStreamState.source, "open", handleStreamOpen),
    attachEventSourceListener(readStreamState.source, "message", (event) =>
      handleEventLikeMessage(event, "message"),
    ),
    attachEventSourceListener(readStreamState.source, "hermes.event", (event) =>
      handleEventLikeMessage(event, "hermes.event"),
    ),
    attachEventSourceListener(readStreamState.source, "hermes.heartbeat", (event) =>
      handleEventLikeMessage(event, "hermes.heartbeat"),
    ),
    attachEventSourceListener(readStreamState.source, "error", handleStreamError),
  ];
};

const ensureSseReadStream = async ({ config, _stream_cache, emitReadOutput }) => {
  const identityKey = resolveReadStreamIdentityKey(config);
  const targetInstanceId = config.instanceId;
  if (!targetInstanceId) {
    return {
      usePollFallback: false,
      outputs: [],
    };
  }
  if (!hasActiveDataSubscribers(_stream_cache)) {
    closeReadStreamByInstance(_stream_cache, targetInstanceId, "no_data_subscribers");
    hermesTrace("sse.lifecycle.open_skipped", {
      instanceId: config.instanceId,
      reason: "no_data_subscribers",
      transport: config.readTransport,
    });
    return {
      usePollFallback: false,
      outputs: [],
    };
  }

  const registeredInstanceIds = Object.keys(ensureReadStreamRegistry(_stream_cache));
  registeredInstanceIds
    .filter((instanceId) => instanceId !== targetInstanceId)
    .forEach((instanceId) => {
      closeReadStreamByInstance(_stream_cache, instanceId, "instance_switched");
    });

  let readStreamState = getReadStreamStateByInstance(_stream_cache, targetInstanceId);
  if (isPlainObject(readStreamState) && readStreamState.identityKey !== identityKey) {
    closeReadStreamByInstance(_stream_cache, targetInstanceId, "reinitialize");
    readStreamState = undefined;
  }

  if (!isPlainObject(readStreamState)) {
    readStreamState = {
      identityKey,
      instanceId: targetInstanceId,
      source: undefined,
      pendingOutputs: [],
      detachFns: [],
      fallbackToPoll: false,
      emitReadOutput: typeof emitReadOutput === "function" ? emitReadOutput : undefined,
      authResolved: false,
      authPassed: false,
      preflightAttempted: false,
      reconnectTimer: undefined,
      retryCount: 0,
      framesSeen: 0,
      currentAttemptFramesSeen: 0,
      currentAttemptOpened: false,
      noFrameFailureCount: 0,
      lastHttpStatus: undefined,
      opening: false,
      terminalFailureReason: undefined,
      seenMessageIds: new Set(),
      seenMessageOrder: [],
    };
    setReadStreamStateByInstance({
      _stream_cache,
      instanceId: targetInstanceId,
      readStreamState,
    });
  } else if (typeof emitReadOutput === "function") {
    readStreamState.emitReadOutput = emitReadOutput;
  }

  _stream_cache[cachekeys.READ_STREAM] = readStreamState;
  if (readStreamState.fallbackToPoll === true) {
    hermesTrace("sse.lifecycle.reuse", {
      fallbackToPoll: true,
      instanceId: config.instanceId,
      streamId: identityKey,
      transport: config.readTransport,
    });
    return {
      usePollFallback: true,
      outputs: [],
    };
  }

  if (typeof config.eventSourceFactory !== "function") {
    if (config.readTransport === "auto") {
      hermesTrace("sse.lifecycle.open_skipped", {
        instanceId: config.instanceId,
        reason: "event_source_unavailable",
        transport: config.readTransport,
      });
      enablePollFallback({
        readStreamState,
        config,
        reason: "event_source_unavailable",
      });
      return {
        usePollFallback: true,
        outputs: [],
      };
    }

    readStreamState.terminalFailureReason = "event_source_unavailable";
    queueReadStreamOutput(
      readStreamState,
      toReadSseErrorOutput({
        config,
        reason: "event_source_unavailable",
        message: "Hermes SSE transport is unavailable in this runtime.",
        status: 500,
        code: "execution_failed",
      }),
    );
    return {
      usePollFallback: false,
      outputs: [],
    };
  }

  hermesTrace("sse.lifecycle.reuse", {
    fallbackToPoll: readStreamState.fallbackToPoll === true,
    hasSource: readStreamState.source !== undefined,
    instanceId: config.instanceId,
    isOpening: readStreamState.opening === true,
    retryCount: Number(readStreamState.retryCount ?? 0),
    streamId: identityKey,
    transport: config.readTransport,
  });
  if (
    !readStreamState.source &&
    readStreamState.opening !== true &&
    readStreamState.reconnectTimer === undefined &&
    !readStreamState.terminalFailureReason
  ) {
    await openSseReadStream({
      config,
      _stream_cache,
      readStreamState,
      trigger: "control_tick",
    });
  }

  return {
    usePollFallback: readStreamState.fallbackToPoll === true,
    outputs: [],
  };
};

const executeWriteFlow = async ({ config, _stream_cache, data_in }) => {
  const writePayload = normalizeWritePayload(data_in);
  if (writePayload === undefined || writePayload === null) {
    hermesTrace("write.api.skip", {
      instanceId: config.instanceId,
      reason: "empty_payload",
    });
    return [];
  }

  const command = normalizeWriteCommandEnvelope({ payload: writePayload, config });
  const writeUrl = resolveApiUrl({
    path: config.writePath,
    baseUrl: config.baseUrl,
  });
  hermesTrace("write.api.request", {
    commandId: command.commandId,
    instanceId: command.instanceId,
    method: "POST",
    url: writeUrl,
  });

  let response = undefined;
  try {
    response = await fetchWithTimeout(
      config.fetchImpl,
      writeUrl,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...config.requestHeaders,
        },
        credentials: config.credentials,
        body: JSON.stringify(command),
      },
      config.timeoutMs,
    );
  } catch (error) {
    hermesTrace("write.api.network_error", {
      commandId: command.commandId,
      instanceId: command.instanceId,
      reason: error?.name === "AbortError" ? "timeout" : "network_error",
    });
    return [
      toElementErrorOutput({
        mode: "write",
        error: {
          code: "upstream_unavailable",
          message: "Hermes write endpoint unavailable.",
          status: 503,
          details: { reason: error?.name === "AbortError" ? "timeout" : "network_error" },
        },
        meta: {
          instanceId: command.instanceId,
          commandId: command.commandId,
        },
      }),
    ];
  }

  const responsePayload = await parseJsonResponse(response);
  hermesTrace("write.api.response", {
    commandId: command.commandId,
    instanceId: command.instanceId,
    ok: response.ok,
    status: response.status,
  });
  if (response.status === 401 || response.status === 403) {
    hermesTrace("write.api.auth.fail", {
      commandId: command.commandId,
      instanceId: command.instanceId,
      status: response.status,
    });
  } else {
    hermesTrace("write.api.auth.pass", {
      commandId: command.commandId,
      instanceId: command.instanceId,
      status: response.status,
    });
  }
  if (!response.ok) {
    return [
      toElementErrorOutput({
        mode: "write",
        error: mapApiError({
          statusCode: response.status,
          payload: responsePayload,
          fallbackMessage: `Hermes write request failed with status ${response.status}.`,
        }),
        meta: {
          instanceId: command.instanceId,
          commandId: command.commandId,
          requestId: responsePayload?.requestId,
        },
      }),
    ];
  }

  _stream_cache[cachekeys.CONFIG] = config;
  hermesTrace("write.api.dispatched", {
    commandId: command.commandId,
    instanceId: command.instanceId,
    requestId: responsePayload?.requestId,
    status: typeof responsePayload?.status === "string" ? responsePayload.status : undefined,
  });
  return [
    toElementSuccessOutput({
      mode: "write",
      data: {
        status:
          typeof responsePayload?.status === "string" && responsePayload.status.trim().length > 0
            ? responsePayload.status.trim()
            : "accepted",
        requestId:
          typeof responsePayload?.requestId === "string" ? responsePayload.requestId : undefined,
        response: responsePayload,
      },
      meta: {
        instanceId: command.instanceId,
        commandId: command.commandId,
      },
    }),
  ];
};

const executeReadFlowPoll = async ({ config, _stream_cache }) => {
  const now = Date.now();
  const lastReadAt = Number(_stream_cache[cachekeys.LAST_READ_AT] ?? 0);
  if (config.pollIntervalMs > 0 && now - lastReadAt < config.pollIntervalMs) {
    hermesTrace("read.poll.skip", {
      instanceId: config.instanceId,
      pollIntervalMs: config.pollIntervalMs,
      reason: "poll_interval_not_elapsed",
    });
    return [];
  }
  _stream_cache[cachekeys.LAST_READ_AT] = now;

  const readUrl = resolveReadPollUrl({ config, _stream_cache });
  hermesTrace("read.poll.request", {
    instanceId: config.instanceId,
    method: "GET",
    url: readUrl,
  });

  let response = undefined;
  try {
    response = await fetchWithTimeout(
      config.fetchImpl,
      readUrl,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...config.requestHeaders,
        },
        credentials: config.credentials,
      },
      config.timeoutMs,
    );
  } catch (error) {
    hermesTrace("read.poll.network_error", {
      instanceId: config.instanceId,
      reason: error?.name === "AbortError" ? "timeout" : "network_error",
    });
    return [
      toElementErrorOutput({
        mode: "read",
        error: {
          code: "upstream_unavailable",
          message: "Hermes read endpoint unavailable.",
          status: 503,
          details: { reason: error?.name === "AbortError" ? "timeout" : "network_error" },
        },
        meta: {
          instanceId: config.instanceId,
        },
      }),
    ];
  }

  const responsePayload = await parseJsonResponse(response);
  hermesTrace("read.poll.response", {
    instanceId: config.instanceId,
    ok: response.ok,
    status: response.status,
  });
  if (response.status === 401 || response.status === 403) {
    hermesTrace("read.poll.auth.fail", {
      instanceId: config.instanceId,
      status: response.status,
    });
  } else {
    hermesTrace("read.poll.auth.pass", {
      instanceId: config.instanceId,
      status: response.status,
    });
  }
  if (!response.ok) {
    return [
      toElementErrorOutput({
        mode: "read",
        error: mapApiError({
          statusCode: response.status,
          payload: responsePayload,
          fallbackMessage: `Hermes read request failed with status ${response.status}.`,
        }),
        meta: {
          instanceId: config.instanceId,
          requestId: responsePayload?.requestId,
        },
      }),
    ];
  }

  if (!isPlainObject(responsePayload)) {
    return [
      toElementErrorOutput({
        mode: "read",
        error: {
          code: "validation_failed",
          message: "Hermes read response must be an object.",
          status: 502,
          details: { field: "response" },
        },
        meta: {
          instanceId: config.instanceId,
        },
      }),
    ];
  }

  const nextCursor = maybeTrimString(responsePayload.nextCursor);
  if (nextCursor) {
    _stream_cache[cachekeys.CURSOR] = nextCursor;
  }

  const readRecords = normalizeReadRecords(responsePayload);
  if (readRecords.length === 0) {
    hermesTrace("read.poll.empty", {
      hasMore: responsePayload.hasMore === true,
      instanceId: config.instanceId,
      nextCursor,
    });
    return [];
  }

  const responseCursor = maybeTrimString(responsePayload.cursor);
  hermesTrace("read.poll.dispatched", {
    eventCount: readRecords.length,
    hasMore: responsePayload.hasMore === true,
    instanceId: config.instanceId,
    nextCursor,
    requestId: responsePayload?.requestId,
  });

  return readRecords.map((event) => {
    return toElementSuccessOutput({
      mode: "read",
      data: {
        schemaVersion:
          typeof responsePayload.schemaVersion === "string" ? responsePayload.schemaVersion : "v1",
        event,
        cursor: nextCursor ?? responseCursor ?? event.cursor,
        hasMore: responsePayload.hasMore === true,
      },
      meta: {
        instanceId: config.instanceId,
        requestId:
          typeof responsePayload.requestId === "string" ? responsePayload.requestId : undefined,
      },
    });
  });
};

const executeReadFlow = async ({ config, _stream_cache, emitReadOutput }) => {
  hermesTrace("read.dispatch", {
    instanceId: config.instanceId,
    transport: config.readTransport,
  });
  if (!hasActiveDataSubscribers(_stream_cache)) {
    hermesTrace("read.dispatch.skip", {
      instanceId: config.instanceId,
      reason: "no_data_subscribers",
      transport: config.readTransport,
    });
    closeReadStreamByInstance(_stream_cache, config.instanceId, "no_data_subscribers");
    return [];
  }
  if (config.readTransport === "poll") {
    closeReadStream(_stream_cache, "transport_poll");
    return executeReadFlowPoll({ config, _stream_cache });
  }

  const sseSetup = await ensureSseReadStream({ config, _stream_cache, emitReadOutput });
  if (sseSetup.outputs.length > 0) {
    return sseSetup.outputs;
  }

  const sseOutputs = drainReadStreamOutputs(_stream_cache);
  if (sseOutputs.length > 0) {
    if (typeof emitReadOutput === "function") {
      sseOutputs.forEach((output) => emitReadOutput(output));
      return [];
    }
    return sseOutputs;
  }

  if (config.readTransport === "auto" && sseSetup.usePollFallback) {
    hermesTrace("read.dispatch.fallback_poll", {
      instanceId: config.instanceId,
      reason: "sse_fallback_enabled",
    });
    return executeReadFlowPoll({ config, _stream_cache });
  }

  return [];
};

const initElementInterface = (_stream_cache) => {
  const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ] ?? {};
  const configgen =
    typeof reduced_lambda_obj?._default === "function" ? reduced_lambda_obj._default : undefined;

  const node_context = {
    codebase: HERMES_CODEBASE,
    refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
  };

  const _leaflogic = (input$objArr, controlflow$obj) => {
    const _outflow_data$ = new Subject();
    const stream_read_out$ = new Subject();
    _stream_cache[cachekeys.DATA_SUBSCRIBER_COUNT] = 0;
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

    const emitReadOutput = (output) => {
      if (output === undefined) {
        return;
      }
      hermesTrace("data.emit.sse", {
        instanceId: _stream_cache[cachekeys.CONFIG]?.instanceId,
        mode: output?.mode,
        ok: output?.ok,
      });
      stream_read_out$.next({
        ctrl: _stream_cache[ElemCacheKeyLUT.CTRLIN] ?? { _bname: "accio" },
        outputs: [output],
        source: "sse_push",
      });
    };

    const control_readwrite_flow$ = config$obj._control._stream.pipe(
      withLatestFrom(config$obj._stream, data_in$),
      concatMap(async (merged_in) => {
        const _ctrl_in = merged_in[0];
        const rawConfig = merged_in[1];
        const _data_in = merged_in[2];
        _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
        hermesTrace("control.tick.received", {
          ctrlBottle: isBottle(_ctrl_in) ? _ctrl_in._bname : undefined,
          hasInputBottle: isBottle(_data_in),
          inputBottle: isBottle(_data_in) ? _data_in._bname : undefined,
          refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
        });

        try {
          const config = resolveHermesConfig(rawConfig, _stream_cache);
          _stream_cache[cachekeys.CONFIG] = config;
          hermesTrace("control.tick.config_resolved", {
            instanceId: config.instanceId,
            mode: config.mode,
            readTransport: config.readTransport,
          });
          if (!["read", "both"].includes(config.mode)) {
            closeReadStream(_stream_cache, "mode_without_read");
          }

          const nextOutputs = [];
          const upstreamErrorBottle =
            isBottle(_data_in) && _data_in._bname === "error" ? _data_in : undefined;
          const emptyInputSentinel = isEmptyInputSentinel(_data_in);
          if (emptyInputSentinel) {
            hermesTrace("data.input.empty_sentinel", {
              instanceId: config.instanceId,
              mode: config.mode,
            });
          }
          if (upstreamErrorBottle) {
            hermesTrace("data.input.error_passthrough", {
              instanceId: config.instanceId,
              mode: config.mode,
            });
            nextOutputs.push(upstreamErrorBottle);
          }

          if (
            ["write", "both"].includes(config.mode) &&
            !upstreamErrorBottle &&
            !emptyInputSentinel
          ) {
            const writeOutputs = await executeWriteFlow({
              config,
              _stream_cache,
              data_in: _data_in,
            });
            nextOutputs.push(...writeOutputs);
            hermesTrace("write.dispatch.complete", {
              instanceId: config.instanceId,
              outputCount: writeOutputs.length,
            });
          }

          if (["read", "both"].includes(config.mode)) {
            const readOutputs = await executeReadFlow({
              config,
              _stream_cache,
              emitReadOutput,
            });
            nextOutputs.push(...readOutputs);
            hermesTrace("read.dispatch.complete", {
              instanceId: config.instanceId,
              outputCount: readOutputs.length,
            });
          }

          return { ctrl: _ctrl_in, outputs: nextOutputs, source: "control_tick" };
        } catch (error) {
          if (error instanceof HermesDomainError) {
            hermesTrace("control.tick.domain_error", {
              code: error.code,
              message: error.message,
              status: error.status,
            });
            return {
              ctrl: _ctrl_in,
              outputs: [
                toElementErrorOutput({
                  mode: "write",
                  error: {
                    code: error.code,
                    message: error.message,
                    status: error.status,
                    details: error.details,
                  },
                  meta: {
                    instanceId:
                      _stream_cache[cachekeys.CONFIG]?.instanceId ??
                      maybeTrimString(_data_in?.instanceId),
                  },
                }),
              ],
              source: "control_tick",
            };
          }
          hermesTrace("control.tick.fatal_error", {
            code: error?.code,
            message: error?.message,
            status: error?.status,
          });
          return { ctrl: _ctrl_in, outputs: [toFatalErrorBottle(error)], source: "control_tick" };
        }
      }),
    );

    const _ctrl_out$ = merge(control_readwrite_flow$, stream_read_out$).pipe(
      map((flow_result) => {
        flow_result.outputs
          .filter((output) => output !== undefined)
          .forEach((output) => {
            hermesTrace("data.emit.output", {
              instanceId: output?.meta?.instanceId,
              mode: output?.mode,
              ok: output?.ok,
              source: flow_result.source ?? "unknown",
            });
            _outflow_data$.next(output);
          });
        hermesTrace("control.tick.relay", {
          source: flow_result.source ?? "unknown",
        });
        return flow_result.ctrl;
      }),
      share(),
    );

    const _tracked_data_out$ = new Observable((subscriber) => {
      const nextCount = resolveDataSubscriberCount(_stream_cache) + 1;
      _stream_cache[cachekeys.DATA_SUBSCRIBER_COUNT] = nextCount;
      hermesTrace("data.subscriber.add", {
        count: nextCount,
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
      });

      const sub = _outflow_data$.subscribe(subscriber);
      return () => {
        sub.unsubscribe();
        const remainingCount = Math.max(0, resolveDataSubscriberCount(_stream_cache) - 1);
        _stream_cache[cachekeys.DATA_SUBSCRIBER_COUNT] = remainingCount;
        hermesTrace("data.subscriber.remove", {
          count: remainingCount,
          refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
        });
        if (remainingCount === 0) {
          closeReadStream(_stream_cache, "no_data_subscribers");
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
    if (isBottle(data_in) && data_in._bname === "error") {
      return data_in;
    }
    return formatElementFlowdata(data_in, "elementio");
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

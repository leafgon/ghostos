import { Subject, of } from "rxjs";
import { concatMap, map, share, withLatestFrom } from "rxjs/operators";

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
};

const HERMES_CODEBASE = "ghostos/api/parser/nodelogic/elements/library/hermes.js";
const HERMES_DEFAULT_READ_PATH = "/api/hermes/integration/events";
const HERMES_DEFAULT_WRITE_PATH = "/api/hermes/egress-commands";
const HERMES_DEFAULT_LIMIT = 100;
const HERMES_DEFAULT_TIMEOUT_MS = 15000;
const HERMES_DEFAULT_POLL_INTERVAL_MS = 1000;

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
  const mode = `${modeValue ?? "write"}`.trim().toLowerCase();
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

const resolveHermesConfig = (rawConfig, _stream_cache) => {
  const parsedConfig = parseConfigValue(rawConfig);
  const mode = normalizeHermesMode(parsedConfig.mode);

  const baseUrl = trimString(
    parsedConfig.baseUrl ?? parsedConfig.apiBaseUrl ?? parsedConfig.hermesBaseUrl ?? "",
  );
  const readPath = trimString(
    parsedConfig.readPath ?? parsedConfig.integrationEventsPath ?? HERMES_DEFAULT_READ_PATH,
  );
  const writePath = trimString(
    parsedConfig.writePath ?? parsedConfig.egressCommandsPath ?? HERMES_DEFAULT_WRITE_PATH,
  );
  const instanceId = trimString(parsedConfig.instanceId ?? "");
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

  return {
    mode,
    baseUrl,
    readPath,
    writePath,
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

const executeWriteFlow = async ({ config, _stream_cache, data_in }) => {
  const writePayload = normalizeWritePayload(data_in);
  if (writePayload === undefined || writePayload === null) {
    return [];
  }

  const command = normalizeWriteCommandEnvelope({ payload: writePayload, config });
  const writeUrl = resolveApiUrl({
    path: config.writePath,
    baseUrl: config.baseUrl,
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

const executeReadFlow = async ({ config, _stream_cache }) => {
  const now = Date.now();
  const lastReadAt = Number(_stream_cache[cachekeys.LAST_READ_AT] ?? 0);
  if (config.pollIntervalMs > 0 && now - lastReadAt < config.pollIntervalMs) {
    return [];
  }
  _stream_cache[cachekeys.LAST_READ_AT] = now;

  const cursor = maybeTrimString(_stream_cache[cachekeys.CURSOR]) ?? config.cursor;
  const readUrl = resolveApiUrl({
    path: config.readPath,
    baseUrl: config.baseUrl,
    query: {
      instanceId: config.instanceId,
      guildId: config.guildId || undefined,
      channelId: config.channelId || undefined,
      cursor: cursor ?? undefined,
      sinceEventId: cursor ? undefined : config.sinceEventId,
      limit: config.limit,
    },
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

  const events = Array.isArray(responsePayload.events)
    ? responsePayload.events.filter((entry) => isPlainObject(entry))
    : [];
  if (events.length === 0) {
    return [];
  }

  return events.map((event) => {
    return toElementSuccessOutput({
      mode: "read",
      data: {
        schemaVersion:
          typeof responsePayload.schemaVersion === "string" ? responsePayload.schemaVersion : "v1",
        event,
        cursor: nextCursor ?? event.cursor,
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
    const data_in$ = input$objArr?.[0]?._stream ?? of(undefined);

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

    const _ctrl_out$ = config$obj._control._stream.pipe(
      withLatestFrom(config$obj._stream, data_in$),
      concatMap(async (merged_in) => {
        const _ctrl_in = merged_in[0];
        const rawConfig = merged_in[1];
        const _data_in = merged_in[2];
        _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

        try {
          const config = resolveHermesConfig(rawConfig, _stream_cache);
          _stream_cache[cachekeys.CONFIG] = config;

          const nextOutputs = [];
          const upstreamErrorBottle =
            isBottle(_data_in) && _data_in._bname === "error" ? _data_in : undefined;
          const emptyInputSentinel = isEmptyInputSentinel(_data_in);
          if (upstreamErrorBottle) {
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
          }

          if (["read", "both"].includes(config.mode)) {
            const readOutputs = await executeReadFlow({
              config,
              _stream_cache,
            });
            nextOutputs.push(...readOutputs);
          }

          return { ctrl: _ctrl_in, outputs: nextOutputs };
        } catch (error) {
          if (error instanceof HermesDomainError) {
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
            };
          }
          return { ctrl: _ctrl_in, outputs: [toFatalErrorBottle(error)] };
        }
      }),
      map((flow_result) => {
        flow_result.outputs
          .filter((output) => output !== undefined)
          .forEach((output) => _outflow_data$.next(output));
        return flow_result.ctrl;
      }),
      share(),
    );

    return {
      _stream: _outflow_data$.pipe(share()),
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

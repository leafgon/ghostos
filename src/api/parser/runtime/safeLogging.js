const REDACTED = "[redacted]";
const REDACTED_SIGNED_URL = "[redacted signed url]";
const CIRCULAR = "[circular]";

const SENSITIVE_KEY_PATTERN =
  /(^|[-_\s.])(authorization|cookie|set-cookie|token|secret|password|apikey|api-key|x-api-key|x-csrf-token|refresh-token|refresh_token|access-token|access_token|private-key|private_key|client-secret|client_secret)($|[-_\s.])/i;
const PRIVATE_KEY_PATTERN = /private.*key/i;
const SENSITIVE_QUERY_PATTERN =
  /(^|[-_\s.])(authorization|token|secret|password|apikey|api-key|api_key|x-api-key|x-csrf-token|refresh-token|refresh_token|access-token|access_token|client-secret|client_secret|code)($|[-_\s.])/i;
const SIGNED_URL_QUERY_PATTERN =
  /^(x-amz-signature|x-amz-credential|x-amz-security-token|x-goog-signature|x-goog-credential|x-goog-security-token|signature|sig|awsaccesskeyid|policy|key-pair-id)$/i;
const AUTH_SCHEME_PATTERN = /^(bearer|basic)\s+.+/i;
const EMBEDDED_HTTP_URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

const SAFE_TRACE_FIELD_NAMES = new Set([
  "attemptId",
  "attempt",
  "attempts",
  "code",
  "component",
  "configChanged",
  "configVersion",
  "event",
  "eventId",
  "graphInstanceId",
  "hashPrefix",
  "intent",
  "nodeId",
  "refnode",
  "requestId",
  "responseId",
  "retryCount",
  "sequence",
  "sourceNodeId",
  "spanId",
  "status",
  "statusCode",
  "targetAttemptId",
  "targetEventId",
  "traceId",
  "trigger",
]);

const isPlainObject = (value) => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};

const hasHeaderEntries = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.forEach === "function" &&
    typeof value.get === "function"
  );
};

const headersToObject = (headers) => {
  const entries = {};
  headers.forEach((value, key) => {
    entries[key] = value;
  });
  return entries;
};

const isSensitiveKey = (key) => {
  const normalized = `${key}`.replace(/_/g, "-");
  return SENSITIVE_KEY_PATTERN.test(normalized) || PRIVATE_KEY_PATTERN.test(normalized);
};

const isSensitiveQueryKey = (key) => {
  const normalized = `${key}`.replace(/_/g, "-");
  return SENSITIVE_QUERY_PATTERN.test(normalized);
};

const splitUrlString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const match = value.match(/^(https?:\/\/[^?#]*)(\?[^#]*)?(#.*)?$/i);
  if (!match) {
    return undefined;
  }
  return {
    base: match[1],
    search: match[2] ?? "",
    hash: match[3] ?? "",
    original: value,
  };
};

const decodeQueryKey = (key) => {
  try {
    return decodeURIComponent(key.replace(/\+/g, " "));
  } catch (_error) {
    return key;
  }
};

const parseQueryParts = (search) => {
  return `${search ?? ""}`
    .replace(/^\?/, "")
    .split("&")
    .filter((part) => part.length > 0)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      const rawKey = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
      const rawValue = separatorIndex === -1 ? "" : part.slice(separatorIndex + 1);
      return {
        hasValue: separatorIndex !== -1,
        rawKey,
        rawValue,
        key: decodeQueryKey(rawKey),
      };
    });
};

const urlHasSignedQuery = (urlParts) => {
  return parseQueryParts(urlParts.search).some(({ key }) => SIGNED_URL_QUERY_PATTERN.test(key));
};

const redactUrlString = (value) => {
  const urlParts = splitUrlString(value);
  if (!urlParts) {
    return value;
  }
  if (urlHasSignedQuery(urlParts)) {
    return `${urlParts.base}?${REDACTED_SIGNED_URL}`;
  }

  let didRedact = false;
  const query = parseQueryParts(urlParts.search)
    .map(({ hasValue, rawKey, rawValue, key }) => {
      if (isSensitiveQueryKey(key)) {
        didRedact = true;
        return `${rawKey}=${encodeURIComponent(REDACTED)}`;
      }
      return hasValue ? `${rawKey}=${rawValue}` : rawKey;
    })
    .join("&");

  if (!didRedact) {
    return urlParts.original;
  }

  return `${urlParts.base}${query ? `?${query}` : ""}${urlParts.hash}`;
};

const redactString = (value) => {
  const redactedUrls = value.replace(EMBEDDED_HTTP_URL_PATTERN, (url) => redactUrlString(url));
  if (AUTH_SCHEME_PATTERN.test(value.trim())) {
    return redactedUrls.replace(AUTH_SCHEME_PATTERN, (_match, scheme) => `${scheme} ${REDACTED}`);
  }
  return redactedUrls;
};

const responseLikeToObject = (value) => {
  const output = {};
  if ("status" in value) output.status = value.status;
  if ("statusText" in value) output.statusText = value.statusText;
  if ("ok" in value) output.ok = value.ok;
  if ("url" in value) output.url = value.url;
  if ("headers" in value) output.headers = value.headers;
  return output;
};

const requestLikeToObject = (value) => {
  const output = {};
  if ("method" in value) output.method = value.method;
  if ("url" in value) output.url = value.url;
  if ("headers" in value) output.headers = value.headers;
  if ("credentials" in value) output.credentials = value.credentials;
  if ("body" in value) output.body = value.body;
  return output;
};

const redactError = (error, seen) => {
  const output = {
    name: error.name,
    message: redactString(error.message ?? ""),
  };
  for (const key of [
    "code",
    "status",
    "statusCode",
    "httpStatus",
    "retryable",
    "details",
    "response",
    "request",
    "config",
    "cause",
  ]) {
    if (error[key] !== undefined) {
      output[key] = redactValue(error[key], seen);
    }
  }
  for (const key of Object.keys(error)) {
    if (output[key] === undefined) {
      output[key] = redactValue(error[key], seen);
    }
  }
  return output;
};

const redactObjectEntries = (value, seen) => {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (isSensitiveKey(key)) {
        return [key, REDACTED];
      }
      return [key, redactValue(entry, seen)];
    }),
  );
};

const redactValue = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return CIRCULAR;
  }
  seen.add(value);

  if (value instanceof Error) {
    return redactError(value, seen);
  }
  if (value instanceof URL) {
    return redactUrlString(value.href ?? `${value}`);
  }
  if (hasHeaderEntries(value)) {
    return redactObjectEntries(headersToObject(value), seen);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, seen));
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Map) {
    return redactObjectEntries(Object.fromEntries(value.entries()), seen);
  }
  if (value instanceof Set) {
    return [...value].map((entry) => redactValue(entry, seen));
  }
  if (typeof Response !== "undefined" && value instanceof Response) {
    return redactValue(responseLikeToObject(value), seen);
  }
  if (typeof Request !== "undefined" && value instanceof Request) {
    return redactValue(requestLikeToObject(value), seen);
  }
  if (isPlainObject(value)) {
    return redactObjectEntries(value, seen);
  }
  if (
    "headers" in value ||
    "config" in value ||
    "request" in value ||
    "response" in value ||
    "status" in value ||
    "url" in value
  ) {
    return redactObjectEntries(responseLikeToObject(value), seen);
  }
  return `[${value.constructor?.name ?? "object"}]`;
};

const pickSafeTraceFields = (fields = {}, allowedFields = SAFE_TRACE_FIELD_NAMES) => {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => allowedFields.has(key))
      .map(([key, value]) => [key, redactValue(value)]),
  );
};

const defaultSafeLoggingEnabled = () => {
  return globalThis.LEAFGON_SAFE_LOGGING === true;
};

const emitToSink = ({ sink, level, args }) => {
  const target = sink?.[level] ?? sink?.log;
  if (typeof target === "function") {
    target.apply(sink, args);
  }
};

const createSafeLogger = ({
  component,
  enabled = defaultSafeLoggingEnabled,
  sink = globalThis.console,
} = {}) => {
  const shouldLog = () => (typeof enabled === "function" ? enabled() : enabled === true);
  const emit = (level, args) => {
    if (!shouldLog()) {
      return;
    }
    const redactedArgs = args.map((arg) => redactValue(arg));
    emitToSink({
      sink,
      level,
      args: component ? [`[${component}]`, ...redactedArgs] : redactedArgs,
    });
  };

  return {
    debug: (...args) => emit("debug", args),
    info: (...args) => emit("info", args),
    warn: (...args) => emit("warn", args),
    error: (...args) => emit("error", args),
    log: (...args) => emit("log", args),
    trace: (eventName, fields = {}, options = {}) => {
      emit("info", [
        {
          event: eventName,
          ...pickSafeTraceFields(fields, options.allowedFields ?? SAFE_TRACE_FIELD_NAMES),
        },
      ]);
    },
  };
};

const runtimeLogger = createSafeLogger({ component: "ghostos.runtime" });

export {
  CIRCULAR,
  REDACTED,
  REDACTED_SIGNED_URL,
  SAFE_TRACE_FIELD_NAMES,
  createSafeLogger,
  pickSafeTraceFields,
  redactValue,
  runtimeLogger,
};

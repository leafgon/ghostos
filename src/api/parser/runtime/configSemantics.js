import { createControlEnvelope } from "./eventEnvelope.js";
import { RUNTIME_CLASSES } from "./nodeClassification.js";
import { redactValue } from "./safeLogging.js";

class ConfigSemanticsError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ConfigSemanticsError";
    this.code = "invalid_config_semantics";
    this.details = details;
  }
}

const CONFIG_BEHAVIORS = Object.freeze({
  FUTURE_ONLY: "future-only",
  RECOMPUTE_PURE: "recompute-pure",
  REOPEN_SOURCE: "reopen-source",
  RECONFIGURE_SIDE_EFFECT: "reconfigure-side-effect",
});

const SENSITIVE_KEY_PATTERN =
  /(^|[-_\s.])(authorization|cookie|set-cookie|token|secret|password|apikey|api-key|x-api-key|refresh-token|refresh_token|access-token|access_token|private-key|private_key|client-secret|client_secret)($|[-_\s.])/i;
const SIGNED_URL_QUERY_PATTERN =
  /^(x-amz-signature|x-amz-credential|x-amz-security-token|x-goog-signature|x-goog-credential|x-goog-security-token|signature|sig|awsaccesskeyid|policy|key-pair-id)$/i;

const createNoopTraceSink = () => ({ emit: () => {} });

const isPlainObject = (value) => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};

const isSensitiveKey = (key) => {
  return SENSITIVE_KEY_PATTERN.test(`${key}`.replace(/_/g, "-"));
};

const hasSignedUrlSecret = (value) => {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) {
    return false;
  }
  try {
    const url = new URL(value);
    return [...url.searchParams.keys()].some((key) => SIGNED_URL_QUERY_PATTERN.test(key));
  } catch (_error) {
    return false;
  }
};

const fingerprintString = (input) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const canonicalizeConfig = (value, options = {}, seen = new WeakSet()) => {
  if (value === null) {
    return "null";
  }
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean") {
    if (valueType === "number" && !Number.isFinite(value)) {
      throw new ConfigSemanticsError("Config fingerprint does not support non-finite numbers.", {
        value,
      });
    }
    return JSON.stringify(value);
  }
  if (value === undefined) {
    if (options.allowUndefined === true) {
      return '"[undefined]"';
    }
    throw new ConfigSemanticsError("Config fingerprint does not support undefined values.", {
      value,
    });
  }
  if (["function", "symbol", "bigint"].includes(valueType)) {
    throw new ConfigSemanticsError("Config fingerprint only supports JSON-compatible values.", {
      valueType,
    });
  }
  if (seen.has(value)) {
    throw new ConfigSemanticsError("Config fingerprint does not support cyclic values.");
  }
  seen.add(value);
  if (Array.isArray(value)) {
    const canonicalArray = `[${value.map((entry) => canonicalizeConfig(entry, options, seen)).join(",")}]`;
    seen.delete(value);
    return canonicalArray;
  }
  if (!isPlainObject(value)) {
    throw new ConfigSemanticsError("Config fingerprint only supports plain objects.", {
      valueType: value?.constructor?.name,
    });
  }
  const canonicalObject = `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeConfig(value[key], options, seen)}`)
    .join(",")}}`;
  seen.delete(value);
  return canonicalObject;
};

const configContainsSecrets = (value, seen = new WeakSet()) => {
  if (typeof value === "string") {
    return hasSignedUrlSecret(value);
  }
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => configContainsSecrets(entry, seen));
  }
  return Object.entries(value).some(([key, entry]) => {
    return isSensitiveKey(key) || configContainsSecrets(entry, seen);
  });
};

const stripSecretValuesForFingerprint = (value, seen = new WeakSet()) => {
  if (value === null || typeof value !== "object") {
    return typeof value === "string" && hasSignedUrlSecret(value) ? "[signed-url]" : value;
  }
  if (seen.has(value)) {
    throw new ConfigSemanticsError("Config fingerprint does not support cyclic values.");
  }
  seen.add(value);
  if (Array.isArray(value)) {
    const strippedArray = value.map((entry) => stripSecretValuesForFingerprint(entry, seen));
    seen.delete(value);
    return strippedArray;
  }
  if (!isPlainObject(value)) {
    throw new ConfigSemanticsError("Config fingerprint only supports plain objects.", {
      valueType: value?.constructor?.name,
    });
  }
  const strippedObject = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ? "[secret]" : stripSecretValuesForFingerprint(entry, seen),
    ]),
  );
  seen.delete(value);
  return strippedObject;
};

const isP0SideEffectingClassification = (classification = {}) => {
  return (
    classification.priority === "P0" ||
    classification.runtimeClass === RUNTIME_CLASSES.SIDE_EFFECTING_ACTION ||
    classification.idempotency?.required === true
  );
};

const fingerprintConfig = ({
  config,
  configVersion,
  configFingerprintKey,
  classification,
} = {}) => {
  const secretBearing = configContainsSecrets(config);
  if (
    secretBearing &&
    isP0SideEffectingClassification(classification) &&
    !configVersion &&
    !configFingerprintKey
  ) {
    throw new ConfigSemanticsError(
      "Secret-bearing P0 config requires configVersion or configFingerprintKey.",
      {
        field: "configVersion",
        runtimeTargetKey: classification?.runtimeTargetKey,
      },
    );
  }
  const fingerprintInput = secretBearing
    ? {
        ...(configFingerprintKey ? { keyScope: fingerprintString(configFingerprintKey) } : {}),
        config: stripSecretValuesForFingerprint(config),
      }
    : config;
  const canonical = canonicalizeConfig(fingerprintInput);
  const fingerprint = fingerprintString(canonical);
  return Object.freeze({
    configVersion,
    configFingerprint: fingerprint,
    configFingerprintPrefix: fingerprint.slice(0, 8),
    secretBearing,
  });
};

const assertConfigBehaviorAllowed = ({
  behavior = CONFIG_BEHAVIORS.FUTURE_ONLY,
  classification = {},
  retainedInput = false,
  replayPolicy,
} = {}) => {
  if (!Object.values(CONFIG_BEHAVIORS).includes(behavior)) {
    throw new ConfigSemanticsError("Unsupported config behavior.", {
      behavior,
    });
  }
  if (behavior === CONFIG_BEHAVIORS.RECOMPUTE_PURE) {
    if (classification.runtimeClass !== RUNTIME_CLASSES.PURE_TRANSFORM || retainedInput !== true) {
      throw new ConfigSemanticsError(
        "recompute-pure requires a pure transform with retained input.",
        {
          behavior,
          runtimeTargetKey: classification.runtimeTargetKey,
        },
      );
    }
  }
  if (behavior === CONFIG_BEHAVIORS.REOPEN_SOURCE) {
    if (classification.runtimeClass !== RUNTIME_CLASSES.SOURCE) {
      throw new ConfigSemanticsError("reopen-source requires a source node.", {
        behavior,
        runtimeTargetKey: classification.runtimeTargetKey,
      });
    }
  }
  if (
    isP0SideEffectingClassification(classification) &&
    behavior === CONFIG_BEHAVIORS.RECOMPUTE_PURE
  ) {
    throw new ConfigSemanticsError("Side-effecting config changes cannot use recompute-pure.", {
      behavior,
      runtimeTargetKey: classification.runtimeTargetKey,
    });
  }
  if (isP0SideEffectingClassification(classification) && replayPolicy?.allowConfigReplay === true) {
    return Object.freeze({ behavior, replayAllowed: true });
  }
  return Object.freeze({
    behavior,
    replayAllowed: false,
  });
};

const resolveConfigUpdate = ({
  previousConfigState,
  config,
  configVersion,
  configFingerprintKey,
  graphInstanceId = "ghostos-runtime",
  nodeId,
  runtimeTargetKey,
  classification,
  behavior = CONFIG_BEHAVIORS.FUTURE_ONLY,
  retainedInput = false,
  replayPolicy,
  eventId,
  observability = {},
} = {}) => {
  const behaviorPolicy = assertConfigBehaviorAllowed({
    behavior,
    classification,
    retainedInput,
    replayPolicy,
  });
  const fingerprint = fingerprintConfig({
    config,
    configVersion,
    configFingerprintKey,
    classification,
  });
  const previousVersion = previousConfigState?.configVersion;
  const previousFingerprint = previousConfigState?.configFingerprint;
  const configChanged = configVersion
    ? configVersion !== previousVersion
    : fingerprint.configFingerprint !== previousFingerprint;
  const traceEvent = redactValue({
    event: "config_update_decision",
    graphInstanceId,
    nodeId,
    runtimeTargetKey,
    configVersion,
    configChanged,
    behavior,
    replayedPriorData: false,
    configFingerprintPrefix: fingerprint.configFingerprintPrefix,
  });
  (observability.traceSink ?? createNoopTraceSink()).emit(traceEvent);
  const controlEnvelope =
    configChanged && eventId
      ? createControlEnvelope({
          intent: "refresh_config",
          eventId,
          sourceNodeId: "config-runtime",
          targetNodeId: nodeId,
          graphInstanceId,
          legacyControlPayload: {
            configVersion,
            configFingerprintPrefix: fingerprint.configFingerprintPrefix,
          },
          trace: {
            configVersion,
            configChanged,
            behavior,
            configFingerprintPrefix: fingerprint.configFingerprintPrefix,
          },
        })
      : undefined;
  return Object.freeze({
    ...fingerprint,
    graphInstanceId,
    nodeId,
    runtimeTargetKey,
    configChanged,
    behavior: behaviorPolicy.behavior,
    replayAllowed: behaviorPolicy.replayAllowed,
    replayedPriorData: false,
    controlEnvelope,
  });
};

const createSourceReopenPlan = ({
  previousSourceEventIds = [],
  newSourceEventIds = [],
  configUpdate,
} = {}) => {
  if (configUpdate?.behavior !== CONFIG_BEHAVIORS.REOPEN_SOURCE || !configUpdate.configChanged) {
    return Object.freeze({
      reopen: false,
      emitSourceEventIds: [],
      suppressedDuplicateSourceEventIds: [],
    });
  }
  const previous = new Set(previousSourceEventIds);
  const emitSourceEventIds = [];
  const suppressedDuplicateSourceEventIds = [];
  newSourceEventIds.forEach((sourceEventId) => {
    if (previous.has(sourceEventId)) {
      suppressedDuplicateSourceEventIds.push(sourceEventId);
    } else {
      emitSourceEventIds.push(sourceEventId);
    }
  });
  return Object.freeze({
    reopen: true,
    emitSourceEventIds,
    suppressedDuplicateSourceEventIds,
  });
};

export {
  CONFIG_BEHAVIORS,
  ConfigSemanticsError,
  assertConfigBehaviorAllowed,
  canonicalizeConfig,
  configContainsSecrets,
  createSourceReopenPlan,
  fingerprintConfig,
  resolveConfigUpdate,
};

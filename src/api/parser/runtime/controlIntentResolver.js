import { isBottle } from "../predicates.js";
import { createControlEnvelope, isRuntimeEnvelope } from "./eventEnvelope.js";
import { redactValue } from "./safeLogging.js";

const CONTROL_RESOLUTION_MODES = Object.freeze({
  COMPATIBILITY: "compatibility",
  STRICT: "strict",
});

const VALID_RESOLVED_INTENTS = new Set([
  "start",
  "stop",
  "pause",
  "resume",
  "cancel",
  "refresh_config",
  "retry",
  "replay",
  "poll",
  "checkpoint",
  "legacy_tick",
]);

const LIFECYCLE_START_VALUES = new Set(["open", "start", "started", "connect", "subscribe"]);
const LIFECYCLE_STOP_VALUES = new Set(["close", "closed", "stop", "stopped", "disconnect"]);
const LEGACY_BOTTLE_INTENTS = Object.freeze({
  ctrl_start: "start",
  ctrl_stop: "stop",
  ctrl_pause: "pause",
  ctrl_resume: "resume",
  ctrl_cancel: "cancel",
  ctrl_checkpoint: "checkpoint",
  ctrl_poll: "poll",
  ctrl_refresh_config: "refresh_config",
  ctrl_accio: "legacy_tick",
});

class ControlIntentResolverError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ControlIntentResolverError";
    this.code = "invalid_control_intent";
    this.details = details;
  }
}

const defaultIdFactory = (() => {
  let index = 0;
  return (prefix = "control") => {
    index += 1;
    return `${prefix}-${index}`;
  };
})();

const assertValidIntent = (intent, mode) => {
  if (!VALID_RESOLVED_INTENTS.has(intent)) {
    throw new ControlIntentResolverError(`Unsupported control intent: ${intent}.`, {
      field: "intent",
      intent,
      mode,
    });
  }
  return intent;
};

const getField = (value, field) => (value && typeof value === "object" ? value[field] : undefined);

const hasField = (value, field) => getField(value, field) !== undefined;

const getBottleName = (value) => (isBottle(value) ? value._bname : undefined);

const getLegacyContent = (value) => (isBottle(value) ? value._content : value);

const normalizeLifecycleValue = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : undefined;

const resolvePollMetadata = (input) => {
  const legacy = getLegacyContent(input);
  return (
    getField(input, "poll") === true ||
    getField(input, "poller") === true ||
    getField(input, "scheduler") === "poll" ||
    getField(input, "scheduler")?.kind === "poll" ||
    getField(input, "source") === "poller" ||
    getField(legacy, "poll") === true ||
    getField(legacy, "poller") === true
  );
};

const resolveLifecycleIntent = (input) => {
  const legacy = getLegacyContent(input);
  const value =
    normalizeLifecycleValue(getField(input, "lifecycleIntent")) ??
    normalizeLifecycleValue(getField(input, "lifecycle")) ??
    normalizeLifecycleValue(getField(input, "action")) ??
    normalizeLifecycleValue(getField(legacy, "lifecycleIntent")) ??
    normalizeLifecycleValue(getField(legacy, "lifecycle")) ??
    normalizeLifecycleValue(getField(legacy, "action"));
  if (LIFECYCLE_START_VALUES.has(value)) {
    return "start";
  }
  if (LIFECYCLE_STOP_VALUES.has(value)) {
    return "stop";
  }
  return undefined;
};

const resolveIntent = (input, { mode }) => {
  if (isRuntimeEnvelope(input)) {
    if (input.eventKind !== "control") {
      throw new ControlIntentResolverError("Typed control resolver requires a control envelope.", {
        field: "eventKind",
        value: input.eventKind,
      });
    }
    assertValidIntent(input.intent, mode);
    return { intent: input.intent, reason: "typed_envelope", passthrough: true };
  }

  if (hasField(input, "intent")) {
    return {
      intent: assertValidIntent(input.intent, mode),
      reason: "typed_object",
    };
  }
  if (hasField(input, "targetAttemptId") || getField(input, "retry") === true) {
    if (!getField(input, "targetAttemptId")) {
      throw new ControlIntentResolverError("Retry controls require targetAttemptId.", {
        field: "targetAttemptId",
      });
    }
    return { intent: "retry", reason: "retry_metadata" };
  }
  if (hasField(input, "targetEventId") || getField(input, "replay") === true) {
    if (!getField(input, "targetEventId")) {
      throw new ControlIntentResolverError("Replay controls require targetEventId.", {
        field: "targetEventId",
      });
    }
    return { intent: "replay", reason: "replay_metadata" };
  }
  if (
    hasField(input, "configVersion") ||
    hasField(input, "configFingerprint") ||
    hasField(input, "configFingerprintPrefix")
  ) {
    return { intent: "refresh_config", reason: "config_change" };
  }
  if (resolvePollMetadata(input)) {
    return { intent: "poll", reason: "poll_metadata" };
  }
  const lifecycleIntent = resolveLifecycleIntent(input);
  if (lifecycleIntent) {
    return { intent: lifecycleIntent, reason: "lifecycle_metadata" };
  }

  const bottleName = getBottleName(input);
  if (bottleName) {
    const intent = LEGACY_BOTTLE_INTENTS[bottleName];
    if (intent) {
      return { intent, reason: "legacy_bottle_allowlist" };
    }
    if (mode === CONTROL_RESOLUTION_MODES.STRICT) {
      throw new ControlIntentResolverError("Unknown legacy control bottle.", {
        field: "_bname",
        value: bottleName,
      });
    }
    return { intent: "legacy_tick", reason: "legacy_bottle_unknown" };
  }

  if (mode === CONTROL_RESOLUTION_MODES.STRICT) {
    throw new ControlIntentResolverError("Control intent could not be resolved in strict mode.", {
      field: "intent",
    });
  }
  return { intent: "legacy_tick", reason: "compatibility_fallback" };
};

const resolveControlIntent = (
  input,
  {
    mode = CONTROL_RESOLUTION_MODES.COMPATIBILITY,
    eventId,
    sourceNodeId = "runtime",
    targetNodeId,
    graphInstanceId,
    sequence,
    createdAt,
    parentEventIds,
    idFactory = defaultIdFactory,
  } = {},
) => {
  const resolution = resolveIntent(input, { mode });
  if (resolution.passthrough) {
    return input;
  }
  return createControlEnvelope({
    eventId: eventId ?? idFactory(resolution.intent),
    sourceNodeId,
    targetNodeId,
    graphInstanceId,
    sequence,
    createdAt,
    parentEventIds,
    intent: resolution.intent,
    legacyControlPayload: input,
    targetAttemptId: getField(input, "targetAttemptId"),
    targetEventId: getField(input, "targetEventId"),
    trace: {
      resolutionReason: resolution.reason,
      compatibilityMode: mode,
      legacyControlPayload: redactValue(input),
    },
  });
};

export { CONTROL_RESOLUTION_MODES, ControlIntentResolverError, resolveControlIntent };

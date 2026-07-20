import { isBottle } from "../predicates.js";
import { redactValue } from "./safeLogging.js";

const RUNTIME_ENVELOPE_MARKER = "__ghostosRuntimeEnvelope";
const DEFAULT_GRAPH_INSTANCE_ID = "ghostos-runtime";
const EMPTY_SENTINEL_BNAMES = new Set(["empty", "empty_bottle"]);
const EMPTY_SENTINEL_VALUES = new Set(["empty_data", null, undefined]);
const VALID_CONTROL_INTENTS = new Set([
  "start",
  "stop",
  "pause",
  "resume",
  "cancel",
  "refresh_config",
  "retry",
  "replay",
  "timer_tick",
  "poll",
  "manual_recompute",
  "drain",
  "checkpoint",
  "legacy_tick",
  "ui_clear",
  "ui_close",
  "ui_refresh",
  "media_play",
  "media_pause",
  "media_stop",
]);

class RuntimeEnvelopeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "RuntimeEnvelopeError";
    this.code = "invalid_runtime_envelope";
    this.details = details;
  }
}

const fallbackIdFactory = (() => {
  let counter = 0;
  return (prefix = "runtime-event") => {
    counter += 1;
    return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${counter}`;
  };
})();

const defaultClock = () => new Date().toISOString();

const freezeArray = (value = []) => Object.freeze([...value]);

const shallowFreeze = (value) => Object.freeze(value);

const isRuntimeEnvelope = (value) => {
  return Boolean(value?.[RUNTIME_ENVELOPE_MARKER]);
};

const resolvePayloadKind = (payload) => {
  if (isBottle(payload)) {
    if (EMPTY_SENTINEL_BNAMES.has(payload._bname) && EMPTY_SENTINEL_VALUES.has(payload._content)) {
      return "empty_sentinel";
    }
    return "bottle";
  }
  if (EMPTY_SENTINEL_VALUES.has(payload)) {
    return "empty_sentinel";
  }
  return "raw";
};

const assertNonEmptyString = (value, field) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RuntimeEnvelopeError(`${field} is required.`, { field, value });
  }
  return value.trim();
};

const normalizeParentEventIds = (parentEventIds = []) => {
  if (!Array.isArray(parentEventIds)) {
    throw new RuntimeEnvelopeError("parentEventIds must be an array.", {
      field: "parentEventIds",
      value: parentEventIds,
    });
  }
  return freezeArray(parentEventIds);
};

const createBaseEnvelope = ({
  eventId,
  eventKind,
  sourceNodeId,
  graphInstanceId = DEFAULT_GRAPH_INSTANCE_ID,
  sequence = 0,
  createdAt = defaultClock(),
  parentEventIds = [],
  trigger,
  trace = {},
}) => {
  return {
    [RUNTIME_ENVELOPE_MARKER]: true,
    eventId: assertNonEmptyString(eventId, "eventId"),
    eventKind: assertNonEmptyString(eventKind, "eventKind"),
    sourceNodeId,
    graphInstanceId: assertNonEmptyString(graphInstanceId, "graphInstanceId"),
    sequence,
    createdAt,
    trace: shallowFreeze({
      ...trace,
      parentEventIds: normalizeParentEventIds(parentEventIds),
      trigger: trigger ?? trace.trigger ?? eventKind,
    }),
  };
};

const createDataEnvelope = (payload, options = {}) => {
  if (isRuntimeEnvelope(payload)) {
    return payload;
  }
  const envelope = {
    ...createBaseEnvelope({
      ...options,
      eventKind: "data",
      trigger: options.trigger ?? "data",
    }),
    payload,
    payloadKind: options.payloadKind ?? resolvePayloadKind(payload),
  };
  return shallowFreeze(envelope);
};

const createControlEnvelope = ({
  intent = "legacy_tick",
  legacyControlPayload,
  targetNodeId,
  eventId,
  sourceNodeId,
  graphInstanceId,
  sequence,
  createdAt,
  parentEventIds,
  trigger,
  trace,
  ...rest
} = {}) => {
  if (!VALID_CONTROL_INTENTS.has(intent)) {
    throw new RuntimeEnvelopeError(`Unsupported control intent: ${intent}.`, {
      field: "intent",
      value: intent,
    });
  }
  if (intent === "retry" && !rest.targetAttemptId) {
    throw new RuntimeEnvelopeError("Retry envelopes require targetAttemptId.", {
      field: "targetAttemptId",
    });
  }
  if (intent === "replay" && !rest.targetEventId) {
    throw new RuntimeEnvelopeError("Replay envelopes require targetEventId.", {
      field: "targetEventId",
    });
  }
  const envelope = {
    ...createBaseEnvelope({
      eventId,
      eventKind: "control",
      sourceNodeId,
      graphInstanceId,
      sequence,
      createdAt,
      parentEventIds,
      trigger: trigger ?? intent,
      trace,
    }),
    intent,
    legacyControlPayload,
    targetNodeId,
    ...rest,
  };
  return shallowFreeze(envelope);
};

const createTimerEnvelope = ({
  timerId,
  eventId,
  sourceNodeId,
  graphInstanceId,
  sequence,
  createdAt,
  parentEventIds,
  trace,
  scheduledAt,
  firedAt = createdAt ?? defaultClock(),
} = {}) => {
  const envelope = {
    ...createBaseEnvelope({
      eventId,
      eventKind: "timer",
      sourceNodeId,
      graphInstanceId,
      sequence,
      createdAt,
      parentEventIds,
      trigger: "timer",
      trace,
    }),
    timerId,
    scheduledAt,
    firedAt,
  };
  return shallowFreeze(envelope);
};

const createRetryEnvelope = (options = {}) => {
  return createControlEnvelope({ ...options, intent: "retry", trigger: "retry" });
};

const createReplayEnvelope = (options = {}) => {
  return createControlEnvelope({ ...options, intent: "replay", trigger: "replay" });
};

const unwrapDataForLegacy = (value) => {
  return isRuntimeEnvelope(value) && value.eventKind === "data" ? value.payload : value;
};

const unwrapControlForLegacy = (value) => {
  return isRuntimeEnvelope(value) && value.eventKind === "control"
    ? value.legacyControlPayload
    : value;
};

const unwrapRuntimeEnvelope = (value) => {
  if (!isRuntimeEnvelope(value)) {
    return value;
  }
  if (value.eventKind === "control") {
    return unwrapControlForLegacy(value);
  }
  return value.payload;
};

const createRuntimeContext = (envelope, extra = {}) => {
  if (!isRuntimeEnvelope(envelope)) {
    throw new RuntimeEnvelopeError("Runtime context requires a runtime envelope.", {
      field: "envelope",
    });
  }
  return shallowFreeze({
    ...extra,
    eventId: envelope.eventId,
    eventKind: envelope.eventKind,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    sequence: envelope.sequence,
    createdAt: envelope.createdAt,
    payloadKind: envelope.payloadKind,
    intent: envelope.intent,
    trigger: envelope.trace?.trigger,
    parentEventIds: freezeArray(envelope.trace?.parentEventIds ?? []),
  });
};

const createLegacyCompatibilityBridge = ({ datalogic = {} } = {}) => {
  return {
    datalogic: {
      pre: (value) => {
        const legacyValue = unwrapDataForLegacy(value);
        return typeof datalogic.pre === "function" ? datalogic.pre(legacyValue) : legacyValue;
      },
      post: (value) => {
        const legacyValue = unwrapDataForLegacy(value);
        return typeof datalogic.post === "function" ? datalogic.post(legacyValue) : legacyValue;
      },
    },
    unwrapData: unwrapDataForLegacy,
    unwrapControl: unwrapControlForLegacy,
  };
};

const createEnvelopeTraceEvent = (envelope, fields = {}, { includePayload = false } = {}) => {
  if (!isRuntimeEnvelope(envelope)) {
    throw new RuntimeEnvelopeError("Trace output requires a runtime envelope.", {
      field: "envelope",
    });
  }
  const traceEvent = {
    ...fields,
    eventId: envelope.eventId,
    eventKind: envelope.eventKind,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    sequence: envelope.sequence,
    payloadKind: envelope.payloadKind,
    intent: envelope.intent,
    trigger: envelope.trace?.trigger,
    parentEventIds: envelope.trace?.parentEventIds ?? [],
    payload: includePayload ? envelope.payload : undefined,
    legacyControlPayload:
      includePayload && envelope.eventKind === "control"
        ? envelope.legacyControlPayload
        : undefined,
  };
  return redactValue(
    Object.fromEntries(Object.entries(traceEvent).filter(([_key, value]) => value !== undefined)),
  );
};

const createRuntimeEnvelopeFactory = ({
  graphInstanceId = DEFAULT_GRAPH_INSTANCE_ID,
  idFactory = fallbackIdFactory,
  clock = defaultClock,
} = {}) => {
  const sequenceBySourceNode = new Map();
  const nextSequence = (sourceNodeId = "runtime") => {
    const current = sequenceBySourceNode.get(sourceNodeId) ?? 0;
    const next = current + 1;
    sequenceBySourceNode.set(sourceNodeId, next);
    return next;
  };
  const nextId = (prefix) => idFactory(prefix);
  const withDefaults = (options = {}, prefix = "runtime-event") => {
    const sourceNodeId = options.sourceNodeId ?? "runtime";
    return {
      ...options,
      graphInstanceId: options.graphInstanceId ?? graphInstanceId,
      sourceNodeId,
      eventId: options.eventId ?? nextId(prefix),
      sequence: options.sequence ?? nextSequence(sourceNodeId),
      createdAt: options.createdAt ?? clock(),
    };
  };

  return {
    data: (payload, options = {}) => createDataEnvelope(payload, withDefaults(options, "data")),
    control: (options = {}) => createControlEnvelope(withDefaults(options, "control")),
    timer: (options = {}) => createTimerEnvelope(withDefaults(options, "timer")),
    retry: (options = {}) => createRetryEnvelope(withDefaults(options, "retry")),
    replay: (options = {}) => createReplayEnvelope(withDefaults(options, "replay")),
  };
};

export {
  DEFAULT_GRAPH_INSTANCE_ID,
  RUNTIME_ENVELOPE_MARKER,
  RuntimeEnvelopeError,
  createControlEnvelope,
  createDataEnvelope,
  createEnvelopeTraceEvent,
  createLegacyCompatibilityBridge,
  createReplayEnvelope,
  createRetryEnvelope,
  createRuntimeContext,
  createRuntimeEnvelopeFactory,
  createTimerEnvelope,
  isRuntimeEnvelope,
  resolvePayloadKind,
  unwrapControlForLegacy,
  unwrapDataForLegacy,
  unwrapRuntimeEnvelope,
};

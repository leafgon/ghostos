import {
  createControlEnvelope,
  createDataEnvelope,
  isRuntimeEnvelope,
  unwrapRuntimeEnvelope,
} from "./eventEnvelope.js";
import { collectParentEventIds } from "./graphBoundaryDeckWorkflow.js";
import { redactValue } from "./safeLogging.js";

class UiBridgePolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "UiBridgePolicyError";
    this.code = "invalid_ui_bridge_policy";
    this.details = details;
  }
}

const UI_CONTROL_INTENTS = Object.freeze([
  "ui_clear",
  "ui_close",
  "ui_refresh",
  "media_play",
  "media_pause",
  "media_stop",
]);

const REPEATABLE_ACTION_ADAPTERS = new Set(["mediaplayer", "gnav", "popup"]);

const UI_BRIDGE_POLICIES = Object.freeze({
  leafscreenio: Object.freeze({
    role: "screen",
    renderTrigger: "data",
    sourceEvents: true,
    typedControl: Object.freeze(["ui_clear", "ui_refresh", "ui_close"]),
    commandIdentityRequired: false,
  }),
  gnav: Object.freeze({
    role: "navigation",
    renderTrigger: "data",
    sourceEvents: true,
    typedControl: Object.freeze(["ui_refresh"]),
    commandIdentityRequired: true,
  }),
  popup: Object.freeze({
    role: "popup",
    renderTrigger: "data",
    sourceEvents: true,
    typedControl: Object.freeze(["ui_close", "ui_refresh"]),
    commandIdentityRequired: true,
  }),
  editor: Object.freeze({
    role: "editor",
    renderTrigger: "data",
    sourceEvents: true,
    typedControl: Object.freeze(["ui_refresh"]),
    commandIdentityRequired: false,
  }),
  prompt: Object.freeze({
    role: "prompt",
    renderTrigger: "data",
    sourceEvents: true,
    typedControl: Object.freeze(["ui_clear", "ui_refresh"]),
    commandIdentityRequired: false,
  }),
  mediaplayer: Object.freeze({
    role: "media",
    renderTrigger: "data",
    sourceEvents: false,
    typedControl: Object.freeze(["media_play", "media_pause", "media_stop"]),
    commandIdentityRequired: true,
  }),
  form: Object.freeze({
    role: "form",
    renderTrigger: "data",
    sourceEvents: true,
    typedControl: Object.freeze(["ui_clear", "ui_refresh"]),
    commandIdentityRequired: false,
  }),
});

const createNoopTraceSink = () => ({ emit: () => {} });
const noopHost = Object.freeze({
  render: () => undefined,
  control: () => undefined,
});

const assertRuntimeEnvelope = (event, field = "event") => {
  if (!isRuntimeEnvelope(event)) {
    throw new UiBridgePolicyError(`${field} must be a runtime envelope.`, { field });
  }
  return event;
};

const assertEventId = (value, field = "eventId") => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new UiBridgePolicyError(`${field} is required.`, { field, value });
  }
  return value.trim();
};

const emitTrace = (traceSink, event) => {
  traceSink.emit(redactValue(event));
};

const resolveUiBridgePolicy = ({ adapterName = "leafscreenio" } = {}) => {
  const policy = UI_BRIDGE_POLICIES[adapterName];
  if (!policy) {
    throw new UiBridgePolicyError("Unsupported UI bridge adapter.", {
      adapterName,
    });
  }
  return policy;
};

const createUiControlEnvelope = ({
  intent,
  eventId,
  sourceNodeId = "ui-runtime",
  targetNodeId,
  graphInstanceId,
  sequence,
  parentEventIds = [],
  command = {},
  trace = {},
} = {}) => {
  if (!UI_CONTROL_INTENTS.includes(intent)) {
    throw new UiBridgePolicyError("Unsupported UI/media control intent.", {
      field: "intent",
      value: intent,
    });
  }
  return createControlEnvelope({
    intent,
    eventId: assertEventId(eventId),
    sourceNodeId,
    targetNodeId,
    graphInstanceId,
    sequence,
    parentEventIds,
    legacyControlPayload: {
      commandKind: intent.startsWith("media_") ? "media_control" : "ui_control",
      intent,
      command,
    },
    trace: {
      ...trace,
      commandKind: intent.startsWith("media_") ? "media_control" : "ui_control",
    },
  });
};

const assertRepeatableCommandIdentity = ({ adapterName, command = {} } = {}) => {
  const policy = resolveUiBridgePolicy({ adapterName });
  if (!policy.commandIdentityRequired && !REPEATABLE_ACTION_ADAPTERS.has(adapterName)) {
    return Object.freeze({ required: false });
  }
  const commandId = command.commandId ?? command.idempotencyKey;
  if (typeof commandId !== "string" || commandId.trim().length === 0) {
    throw new UiBridgePolicyError("Repeatable UI/media actions require command identity.", {
      field: "command.commandId",
      adapterName,
    });
  }
  return Object.freeze({
    required: true,
    commandId: commandId.trim(),
  });
};

const createUiBridgeRuntime = ({
  adapterName = "leafscreenio",
  nodeId = adapterName,
  runtimeTargetKey = adapterName === "leafscreenio"
    ? "node:leafscreenio"
    : `leafelement:${adapterName}`,
  host = noopHost,
  observability = {},
} = {}) => {
  const policy = resolveUiBridgePolicy({ adapterName });
  const traceSink = observability.traceSink ?? createNoopTraceSink();
  const renderHistory = [];
  const controlHistory = [];
  const sourceHistory = [];

  const renderDataEvent = (event) => {
    const runtimeEvent = assertRuntimeEnvelope(event);
    if (runtimeEvent.eventKind !== "data") {
      emitTrace(traceSink, {
        event: "ui_bridge_render_decision",
        adapterName,
        runtimeTargetKey,
        decision: "skip",
        reason: "not_data",
        eventId: runtimeEvent.eventId,
        eventKind: runtimeEvent.eventKind,
        intent: runtimeEvent.intent,
      });
      return undefined;
    }
    const payload = unwrapRuntimeEnvelope(runtimeEvent);
    const result =
      typeof host.render === "function"
        ? host.render(payload, {
            adapterName,
            nodeId,
            event: runtimeEvent,
          })
        : undefined;
    const renderRecord = {
      adapterName,
      nodeId,
      runtimeTargetKey,
      eventId: runtimeEvent.eventId,
      parentEventIds: collectParentEventIds([runtimeEvent]),
      result,
    };
    renderHistory.push(renderRecord);
    emitTrace(traceSink, {
      event: "ui_bridge_render_decision",
      adapterName,
      runtimeTargetKey,
      decision: "render",
      reason: "data",
      eventId: runtimeEvent.eventId,
      eventKind: runtimeEvent.eventKind,
      parentEventIds: renderRecord.parentEventIds,
      payload,
      result,
    });
    return createDataEnvelope(result ?? payload, {
      eventId: `${runtimeEvent.eventId}:${adapterName}:render`,
      sourceNodeId: nodeId,
      graphInstanceId: runtimeEvent.graphInstanceId,
      sequence: runtimeEvent.sequence,
      parentEventIds: renderRecord.parentEventIds,
      trigger: "data",
      trace: {
        uiBridge: adapterName,
        role: policy.role,
        causeEventId: runtimeEvent.eventId,
      },
    });
  };

  const handleControlEvent = (event) => {
    const runtimeEvent = assertRuntimeEnvelope(event);
    const typedControl = UI_CONTROL_INTENTS.includes(runtimeEvent.intent);
    const command = runtimeEvent.legacyControlPayload?.command ?? {};
    if (!typedControl) {
      emitTrace(traceSink, {
        event: "ui_bridge_control_decision",
        adapterName,
        runtimeTargetKey,
        decision: "skip",
        reason:
          runtimeEvent.intent === "refresh_config"
            ? "config_future_behavior_only"
            : "unsupported_control_intent",
        eventId: runtimeEvent.eventId,
        eventKind: runtimeEvent.eventKind,
        intent: runtimeEvent.intent,
      });
      return Object.freeze({
        handled: false,
        reason:
          runtimeEvent.intent === "refresh_config"
            ? "config_future_behavior_only"
            : "unsupported_control_intent",
      });
    }
    if (!policy.typedControl.includes(runtimeEvent.intent)) {
      throw new UiBridgePolicyError("UI/media control intent is not supported by this adapter.", {
        adapterName,
        intent: runtimeEvent.intent,
      });
    }
    if (runtimeEvent.intent.startsWith("media_") || command.repeatable === true) {
      assertRepeatableCommandIdentity({ adapterName, command });
    }
    const result =
      typeof host.control === "function"
        ? host.control(runtimeEvent.intent, command, {
            adapterName,
            nodeId,
            event: runtimeEvent,
          })
        : undefined;
    const controlRecord = {
      adapterName,
      nodeId,
      runtimeTargetKey,
      eventId: runtimeEvent.eventId,
      intent: runtimeEvent.intent,
      commandId: command.commandId ?? command.idempotencyKey,
      result,
    };
    controlHistory.push(controlRecord);
    emitTrace(traceSink, {
      event: "ui_bridge_control_decision",
      adapterName,
      runtimeTargetKey,
      decision: "control",
      reason: runtimeEvent.intent,
      eventId: runtimeEvent.eventId,
      eventKind: runtimeEvent.eventKind,
      intent: runtimeEvent.intent,
      commandId: controlRecord.commandId,
      result,
    });
    return Object.freeze({
      handled: true,
      intent: runtimeEvent.intent,
      result,
    });
  };

  const emitSourceEvent = ({
    action,
    payload,
    eventId,
    sourceNodeId = `${nodeId}:source`,
    graphInstanceId,
    sequence,
    parentEvent,
    parentEventIds = [],
    trace = {},
  } = {}) => {
    if (!policy.sourceEvents) {
      throw new UiBridgePolicyError("This UI bridge does not emit source events.", {
        adapterName,
      });
    }
    const envelope = createDataEnvelope(payload, {
      eventId: assertEventId(eventId),
      sourceNodeId,
      graphInstanceId: graphInstanceId ?? parentEvent?.graphInstanceId,
      sequence,
      parentEventIds: collectParentEventIds([parentEvent], parentEventIds),
      trigger: "ui_source",
      trace: {
        ...trace,
        uiBridge: adapterName,
        action,
      },
    });
    sourceHistory.push({
      adapterName,
      action,
      eventId: envelope.eventId,
      parentEventIds: envelope.trace.parentEventIds,
    });
    emitTrace(traceSink, {
      event: "ui_bridge_source_event",
      adapterName,
      runtimeTargetKey,
      action,
      eventId: envelope.eventId,
      eventKind: envelope.eventKind,
      sourceNodeId: envelope.sourceNodeId,
      graphInstanceId: envelope.graphInstanceId,
      parentEventIds: envelope.trace.parentEventIds,
      payload,
    });
    return envelope;
  };

  return Object.freeze({
    adapterName,
    policy,
    renderDataEvent,
    handleControlEvent,
    emitSourceEvent,
    snapshot: () =>
      redactValue({
        renderHistory,
        controlHistory,
        sourceHistory,
      }),
  });
};

export {
  UI_BRIDGE_POLICIES,
  UI_CONTROL_INTENTS,
  UiBridgePolicyError,
  assertRepeatableCommandIdentity,
  createUiBridgeRuntime,
  createUiControlEnvelope,
  resolveUiBridgePolicy,
};

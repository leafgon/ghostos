import { createDataEnvelope, isRuntimeEnvelope, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import { collectParentEventIds } from "./graphBoundaryDeckWorkflow.js";
import { redactValue } from "./safeLogging.js";
import { doBottle, doUnbottle } from "../nodelogic/datautils/bottling.js";

class P3PureRenderPolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "P3PureRenderPolicyError";
    this.code = "invalid_p3_pure_render_policy";
    this.details = details;
  }
}

const P3_CORE_NODES = Object.freeze([
  "leaflabel",
  "leafdelabel",
  "leafbottle",
  "leafunbottle",
  "leafcrate",
]);
const P3_RENDER_ADAPTERS = Object.freeze(["text", "image", "html"]);

const createNoopTraceSink = () => ({ emit: () => {} });

const assertRuntimeEnvelope = (event, field = "event") => {
  if (!isRuntimeEnvelope(event)) {
    throw new P3PureRenderPolicyError(`${field} must be a runtime envelope.`, { field });
  }
  return event;
};

const emitTrace = (traceSink, event) => {
  traceSink.emit(redactValue(event));
};

const sortObjectKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (
    value === null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return value;
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObjectKeys(value[key])]),
  );
};

const renderTemplate = (template = "{{value}}", payload = {}) => {
  const context =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : { value: payload };
  return `${template}`.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, key) => {
    const value = key.split(".").reduce((current, part) => current?.[part], context);
    return value === undefined || value === null ? "" : `${value}`;
  });
};

const transformP3CorePayload = ({ nodeType, payload, args = {} }) => {
  if (!P3_CORE_NODES.includes(nodeType)) {
    throw new P3PureRenderPolicyError("Unsupported P3 core node.", { nodeType });
  }
  if (nodeType === "leaflabel") {
    return {
      label: args.label ?? args.labelstr ?? "label",
      value: payload,
    };
  }
  if (nodeType === "leafdelabel") {
    return payload?.value;
  }
  if (nodeType === "leafbottle") {
    return doBottle(args.bottlekey ?? "default", payload, args.label ? { tag: args.label } : {});
  }
  if (nodeType === "leafunbottle") {
    return doUnbottle(args.bottlekey ?? args.bottlekeys ?? "*", payload);
  }
  return {
    _cratelabel: args.label ? { tag: args.label } : {},
    payload: sortObjectKeys(payload),
  };
};

const renderP3AdapterPayload = ({ adapterName, payload, config = {} }) => {
  if (!P3_RENDER_ADAPTERS.includes(adapterName)) {
    throw new P3PureRenderPolicyError("Unsupported P3 render adapter.", { adapterName });
  }
  if (adapterName === "text") {
    return {
      type: "text",
      text: payload?.text ?? payload?.value ?? `${payload ?? ""}`,
    };
  }
  if (adapterName === "image") {
    return {
      type: "image",
      imagelist: Array.isArray(payload) ? payload : [payload],
    };
  }
  return {
    type: "html",
    innerhtml: renderTemplate(config.template, payload),
    templateVersion: config.templateVersion,
  };
};

const createOutputEnvelope = ({ event, output, sourceNodeId, trace = {} }) => {
  return createDataEnvelope(output, {
    eventId: `${event.eventId}:${sourceNodeId}:out`,
    sourceNodeId,
    graphInstanceId: event.graphInstanceId,
    sequence: event.sequence,
    parentEventIds: collectParentEventIds([event]),
    trigger: event.trace?.trigger ?? "data",
    trace,
  });
};

const executeP3CoreNodeByPolicy = ({
  nodeType,
  event,
  args = {},
  nodeId = nodeType,
  observability = {},
} = {}) => {
  const runtimeEvent = assertRuntimeEnvelope(event);
  const traceSink = observability.traceSink ?? createNoopTraceSink();
  if (runtimeEvent.eventKind !== "data") {
    emitTrace(traceSink, {
      event: "p3_core_policy_decision",
      nodeType,
      decision: "skip",
      reason: runtimeEvent.intent === "refresh_config" ? "config_future_only" : "not_data",
      eventId: runtimeEvent.eventId,
      eventKind: runtimeEvent.eventKind,
      intent: runtimeEvent.intent,
    });
    return undefined;
  }
  const output = transformP3CorePayload({
    nodeType,
    payload: unwrapRuntimeEnvelope(runtimeEvent),
    args,
  });
  if (output === undefined) {
    emitTrace(traceSink, {
      event: "p3_core_no_output",
      nodeType,
      decision: "no-output",
      reason: "filtered_or_missing_input",
      eventId: runtimeEvent.eventId,
      parentEventIds: collectParentEventIds([runtimeEvent]),
    });
    return undefined;
  }
  emitTrace(traceSink, {
    event: "p3_core_policy_decision",
    nodeType,
    decision: "execute",
    reason: "data",
    eventId: runtimeEvent.eventId,
    eventKind: runtimeEvent.eventKind,
    parentEventIds: collectParentEventIds([runtimeEvent]),
    payload: unwrapRuntimeEnvelope(runtimeEvent),
    output,
  });
  return createOutputEnvelope({
    event: runtimeEvent,
    output,
    sourceNodeId: nodeId,
    trace: {
      p3Node: nodeType,
      causeEventId: runtimeEvent.eventId,
    },
  });
};

const renderP3AdapterByPolicy = ({
  adapterName,
  event,
  config = {},
  nodeId = `leafelement:${adapterName}`,
  observability = {},
} = {}) => {
  const runtimeEvent = assertRuntimeEnvelope(event);
  const traceSink = observability.traceSink ?? createNoopTraceSink();
  if (runtimeEvent.eventKind !== "data") {
    emitTrace(traceSink, {
      event: "p3_render_policy_decision",
      adapterName,
      decision: "skip",
      reason: runtimeEvent.intent === "refresh_config" ? "config_future_only" : "not_data",
      eventId: runtimeEvent.eventId,
      eventKind: runtimeEvent.eventKind,
      intent: runtimeEvent.intent,
      configVersion: config.version,
    });
    return undefined;
  }
  const output = renderP3AdapterPayload({
    adapterName,
    payload: unwrapRuntimeEnvelope(runtimeEvent),
    config,
  });
  emitTrace(traceSink, {
    event: "p3_render_policy_decision",
    adapterName,
    decision: "render",
    reason: "data",
    eventId: runtimeEvent.eventId,
    eventKind: runtimeEvent.eventKind,
    parentEventIds: collectParentEventIds([runtimeEvent]),
    configVersion: config.version,
    configFingerprintPrefix: config.configFingerprintPrefix,
    output,
  });
  return createOutputEnvelope({
    event: runtimeEvent,
    output,
    sourceNodeId: nodeId,
    trace: {
      p3RenderAdapter: adapterName,
      causeEventId: runtimeEvent.eventId,
      configVersion: config.version,
      configFingerprintPrefix: config.configFingerprintPrefix,
    },
  });
};

export {
  P3PureRenderPolicyError,
  P3_CORE_NODES,
  P3_RENDER_ADAPTERS,
  executeP3CoreNodeByPolicy,
  renderP3AdapterByPolicy,
  renderP3AdapterPayload,
  transformP3CorePayload,
};

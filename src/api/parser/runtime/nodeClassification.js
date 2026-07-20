import { getRuntimeTargetKey, validateRuntimeTargetKey } from "./runtimeOptions.js";

const RUNTIME_CLASSES = Object.freeze({
  PURE_TRANSFORM: "pure_transform",
  STATEFUL_TRANSFORM: "stateful_transform",
  SIDE_EFFECTING_ACTION: "side_effecting_action",
  SOURCE: "source",
  SINK: "sink",
  ORCHESTRATOR: "orchestrator",
  UI_BRIDGE: "ui_sink_source_bridge",
  STRUCTURAL: "structural",
  METADATA: "metadata",
  ADAPTER_HOST: "adapter_host",
  BLOCKED: "blocked",
  OBSOLETE: "obsolete",
});

const TRIGGER_POLICIES = Object.freeze([
  "none",
  "data",
  "control",
  "timer",
  "primary-input",
  "all-inputs",
  "any-input",
  "manual-replay",
  "retry",
  "element-specific",
  "control-or-data",
]);

const SUPPORTED_STATUSES = new Set(["supported", "blocked", "obsolete", "metadata_only"]);
const VALID_TRIGGER_POLICIES = new Set(TRIGGER_POLICIES);

class NodeClassificationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "NodeClassificationError";
    this.code = "invalid_node_classification";
    this.details = details;
  }
}

const sideEffectGate = Object.freeze({
  requiresMigrationBeforeDataTrigger: true,
  idempotency: Object.freeze({ required: true }),
  retry: Object.freeze({ required: true }),
  replay: Object.freeze({ required: true }),
  redaction: Object.freeze({ required: true }),
});

const chronosTimingJoin = Object.freeze({
  mode: "latest-context",
  triggerSource: "timer",
  allowSamplingLatestData: true,
  timer: Object.freeze({
    eventIdRequired: true,
    sequenceRequired: true,
  }),
  checkpoint: Object.freeze({
    retainedState: "latest-data-by-lane",
    replayRequiresCheckpoint: true,
  }),
  ordering: "timer-sequence-then-lane-index",
});

const metadata = ({
  nodeType,
  runtimeClass,
  trigger,
  priority,
  status = "supported",
  join,
  idempotency = { required: false },
  rejectForNewGraphs = false,
  migrationGate,
  aliasOf,
  notes,
}) =>
  Object.freeze({
    nodeType,
    runtimeTargetKey: `node:${nodeType}`,
    runtimeClass,
    trigger,
    priority,
    status,
    join,
    idempotency: Object.freeze(idempotency),
    rejectForNewGraphs,
    migrationGate,
    aliasOf,
    notes,
  });

const elementMetadata = ({
  elementname,
  runtimeClass,
  trigger,
  priority,
  status = "supported",
  wired,
  idempotency = { required: false },
  rejectForNewGraphs = false,
  migrationGate,
  notes,
}) =>
  Object.freeze({
    nodeType: "leafelement",
    elementname,
    runtimeTargetKey: `leafelement:${elementname}`,
    runtimeClass,
    trigger,
    priority,
    status,
    wired,
    idempotency: Object.freeze(idempotency),
    rejectForNewGraphs,
    migrationGate,
    notes,
  });

const NODE_RUNTIME_CLASSIFICATIONS = Object.freeze({
  leafradioRX: metadata({
    nodeType: "leafradioRX",
    runtimeClass: RUNTIME_CLASSES.OBSOLETE,
    trigger: "none",
    priority: "P4",
    status: "obsolete",
    rejectForNewGraphs: true,
  }),
  leafradioTX: metadata({
    nodeType: "leafradioTX",
    runtimeClass: RUNTIME_CLASSES.OBSOLETE,
    trigger: "none",
    priority: "P4",
    status: "obsolete",
    rejectForNewGraphs: true,
  }),
  leafoutflowport: metadata({
    nodeType: "leafoutflowport",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "primary-input",
    priority: "P2",
    join: Object.freeze({ mode: "primary-input" }),
  }),
  leafinflowport: metadata({
    nodeType: "leafinflowport",
    runtimeClass: RUNTIME_CLASSES.SOURCE,
    trigger: "data",
    priority: "P2",
  }),
  leafmemoryio: metadata({
    nodeType: "leafmemoryio",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P1",
  }),
  leafscreenio: metadata({
    nodeType: "leafscreenio",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
  }),
  leafdeckspade: metadata({
    nodeType: "leafdeckspade",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "all-inputs",
    priority: "P2",
    join: Object.freeze({ mode: "all-inputs" }),
  }),
  leafdeckheart: metadata({
    nodeType: "leafdeckheart",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "all-inputs",
    priority: "P2",
    join: Object.freeze({ mode: "all-inputs" }),
  }),
  leafdeckdiamond: metadata({
    nodeType: "leafdeckdiamond",
    runtimeClass: RUNTIME_CLASSES.STRUCTURAL,
    trigger: "data",
    priority: "P2",
  }),
  leafdeckclub: metadata({
    nodeType: "leafdeckclub",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P2",
  }),
  leafgnav: metadata({
    nodeType: "leafgnav",
    runtimeClass: RUNTIME_CLASSES.BLOCKED,
    trigger: "none",
    priority: "P4",
    status: "blocked",
    rejectForNewGraphs: true,
    notes: "Use leafelement:gnav.",
  }),
  leafpopupview: metadata({
    nodeType: "leafpopupview",
    runtimeClass: RUNTIME_CLASSES.BLOCKED,
    trigger: "none",
    priority: "P4",
    status: "blocked",
    rejectForNewGraphs: true,
    notes: "Use leafelement:popup.",
  }),
  leafelement: metadata({
    nodeType: "leafelement",
    runtimeClass: RUNTIME_CLASSES.ADAPTER_HOST,
    trigger: "element-specific",
    priority: "P0",
  }),
  leafgraph: metadata({
    nodeType: "leafgraph",
    runtimeClass: RUNTIME_CLASSES.ORCHESTRATOR,
    trigger: "control-or-data",
    priority: "P2",
  }),
  leaflambdagraph: metadata({
    nodeType: "leaflambdagraph",
    runtimeClass: RUNTIME_CLASSES.ORCHESTRATOR,
    trigger: "control-or-data",
    priority: "P2",
  }),
  leafanchor: metadata({
    nodeType: "leafanchor",
    runtimeClass: RUNTIME_CLASSES.METADATA,
    trigger: "none",
    priority: "P4",
  }),
  leafspelldef: metadata({
    nodeType: "leafspelldef",
    runtimeClass: RUNTIME_CLASSES.METADATA,
    trigger: "none",
    priority: "P4",
  }),
  leafspell: metadata({
    nodeType: "leafspell",
    runtimeClass: RUNTIME_CLASSES.ORCHESTRATOR,
    trigger: "data",
    priority: "P2",
  }),
  leafloopyspell: metadata({
    nodeType: "leafloopyspell",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P2",
  }),
  leafsyncflow: metadata({
    nodeType: "leafsyncflow",
    runtimeClass: RUNTIME_CLASSES.METADATA,
    trigger: "none",
    priority: "P4",
    status: "metadata_only",
  }),
  leafchronosflow: metadata({
    nodeType: "leafchronosflow",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "timer",
    priority: "P1",
    join: chronosTimingJoin,
  }),
  leafasyncflow: metadata({
    nodeType: "leafasyncflow",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "timer",
    priority: "P1",
    join: chronosTimingJoin,
    aliasOf: "leafchronosflow",
    notes: "Chronos runtime policy variant using the same dataflow implementation.",
  }),
  leafmixflow: metadata({
    nodeType: "leafmixflow",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "any-input",
    priority: "P1",
    join: Object.freeze({ mode: "any-input" }),
  }),
  leafgateflow: metadata({
    nodeType: "leafgateflow",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P1",
  }),
  leaflabel: metadata({
    nodeType: "leaflabel",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
  }),
  leafdelabel: metadata({
    nodeType: "leafdelabel",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
  }),
  leafbottle: metadata({
    nodeType: "leafbottle",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
  }),
  leafunbottle: metadata({
    nodeType: "leafunbottle",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
  }),
  leafcrate: metadata({
    nodeType: "leafcrate",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
  }),
  leafconfig: metadata({
    nodeType: "leafconfig",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P2",
  }),
  leaflisp: metadata({
    nodeType: "leaflisp",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P2",
  }),
});

const LEAFELEMENT_RUNTIME_CLASSIFICATIONS = Object.freeze({
  gnav: elementMetadata({
    elementname: "gnav",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
  }),
  popup: elementMetadata({
    elementname: "popup",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
  }),
  editor: elementMetadata({
    elementname: "editor",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
  }),
  text: elementMetadata({
    elementname: "text",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "data",
    priority: "P3",
    wired: true,
  }),
  prompt: elementMetadata({
    elementname: "prompt",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
  }),
  http: elementMetadata({
    elementname: "http",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
  }),
  href: elementMetadata({
    elementname: "href",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
  }),
  mediaplayer: elementMetadata({
    elementname: "mediaplayer",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "data",
    priority: "P2",
    wired: true,
  }),
  image: elementMetadata({
    elementname: "image",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "data",
    priority: "P3",
    wired: true,
  }),
  mediainput: elementMetadata({
    elementname: "mediainput",
    runtimeClass: RUNTIME_CLASSES.SOURCE,
    trigger: "control",
    priority: "P1",
    wired: true,
  }),
  midi: elementMetadata({
    elementname: "midi",
    runtimeClass: RUNTIME_CLASSES.SOURCE,
    trigger: "control",
    priority: "P1",
    wired: true,
  }),
  sound: elementMetadata({
    elementname: "sound",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P1",
    wired: true,
  }),
  html: elementMetadata({
    elementname: "html",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    wired: true,
  }),
  form: elementMetadata({
    elementname: "form",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
  }),
  directus: elementMetadata({
    elementname: "directus",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
  }),
  token: elementMetadata({
    elementname: "token",
    runtimeClass: RUNTIME_CLASSES.BLOCKED,
    trigger: "none",
    priority: "P4",
    wired: false,
    status: "blocked",
    rejectForNewGraphs: true,
  }),
  rancher: elementMetadata({
    elementname: "rancher",
    runtimeClass: RUNTIME_CLASSES.BLOCKED,
    trigger: "none",
    priority: "P0",
    wired: false,
    status: "blocked",
    rejectForNewGraphs: true,
    migrationGate: sideEffectGate,
  }),
  hermes: elementMetadata({
    elementname: "hermes",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
  }),
  cortex: elementMetadata({
    elementname: "cortex",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
  }),
  hippocampus: elementMetadata({
    elementname: "hippocampus",
    runtimeClass: RUNTIME_CLASSES.BLOCKED,
    trigger: "none",
    priority: "P4",
    wired: false,
    status: "blocked",
    rejectForNewGraphs: true,
  }),
});

const validateTriggerPolicy = (trigger) => {
  if (!VALID_TRIGGER_POLICIES.has(trigger)) {
    throw new NodeClassificationError(`Unsupported trigger policy: ${trigger}.`, {
      field: "trigger",
      value: trigger,
    });
  }
  return trigger;
};

const validateClassification = (classification) => {
  if (!SUPPORTED_STATUSES.has(classification.status)) {
    throw new NodeClassificationError(
      `Unsupported classification status: ${classification.status}.`,
      {
        field: "status",
        value: classification.status,
      },
    );
  }
  validateTriggerPolicy(classification.trigger);
  if (classification.runtimeTargetKey !== "node:leafelement") {
    validateRuntimeTargetKey(classification.runtimeTargetKey);
  }
  return classification;
};

const resolveLeafElementRuntimeClassification = (elementname) => {
  const classification = LEAFELEMENT_RUNTIME_CLASSIFICATIONS[elementname];
  if (!classification) {
    throw new NodeClassificationError(`Unknown leafelement adapter: ${elementname}.`, {
      field: "elementname",
      value: elementname,
    });
  }
  return validateClassification(classification);
};

const resolveNodeRuntimeClassification = ({ type, args = {} } = {}) => {
  if (type === "leafelement") {
    if (args.elementname) {
      return resolveLeafElementRuntimeClassification(args.elementname);
    }
    return validateClassification(NODE_RUNTIME_CLASSIFICATIONS.leafelement);
  }
  const classification = NODE_RUNTIME_CLASSIFICATIONS[type];
  if (!classification) {
    throw new NodeClassificationError(`Unknown LEAF node type: ${type}.`, {
      field: "type",
      value: type,
    });
  }
  return validateClassification(classification);
};

const assertNodeAllowedForNewGraphs = ({ type, args = {} } = {}) => {
  const classification = resolveNodeRuntimeClassification({ type, args });
  if (
    classification.rejectForNewGraphs ||
    ["blocked", "obsolete"].includes(classification.status)
  ) {
    throw new NodeClassificationError(
      `${classification.runtimeTargetKey} is not allowed in new graphs.`,
      {
        field: "runtimeTargetKey",
        value: classification.runtimeTargetKey,
      },
    );
  }
  return classification;
};

const assertLeafElementAdapterSupported = (elementname) => {
  const classification = resolveLeafElementRuntimeClassification(elementname);
  if (
    !classification.wired ||
    classification.rejectForNewGraphs ||
    classification.status !== "supported"
  ) {
    throw new NodeClassificationError(
      `leafelement:${elementname} is not supported by a wired adapter.`,
      {
        field: "elementname",
        value: elementname,
      },
    );
  }
  return classification;
};

const listClassifiedNodeTypes = () => Object.keys(NODE_RUNTIME_CLASSIFICATIONS);
const listClassifiedLeafElementNames = () => Object.keys(LEAFELEMENT_RUNTIME_CLASSIFICATIONS);

export {
  LEAFELEMENT_RUNTIME_CLASSIFICATIONS,
  NODE_RUNTIME_CLASSIFICATIONS,
  NodeClassificationError,
  RUNTIME_CLASSES,
  TRIGGER_POLICIES,
  assertLeafElementAdapterSupported,
  assertNodeAllowedForNewGraphs,
  getRuntimeTargetKey,
  listClassifiedLeafElementNames,
  listClassifiedNodeTypes,
  resolveLeafElementRuntimeClassification,
  resolveNodeRuntimeClassification,
  validateClassification,
  validateRuntimeTargetKey,
  validateTriggerPolicy,
};

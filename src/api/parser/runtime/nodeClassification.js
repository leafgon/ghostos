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

const mixflowJoinPolicies = Object.freeze({
  mode: "any-input",
  supportedModes: Object.freeze({
    merge: Object.freeze({ trigger: "any-input", join: Object.freeze({ mode: "any-input" }) }),
    concat: Object.freeze({
      trigger: "primary-input",
      join: Object.freeze({ mode: "primary-input", primaryInputIndex: 0 }),
    }),
    combine: Object.freeze({ trigger: "all-inputs", join: Object.freeze({ mode: "all-inputs" }) }),
    combineLatest: Object.freeze({
      trigger: "all-inputs",
      join: Object.freeze({ mode: "latest-context" }),
    }),
    substitute: Object.freeze({
      trigger: "primary-input",
      join: Object.freeze({ mode: "latest-context", primaryInputIndex: 0 }),
    }),
    default: Object.freeze({ trigger: "any-input", join: Object.freeze({ mode: "any-input" }) }),
  }),
  ordering: "input-arrival-then-lane-index",
});

const gateflowPolicy = Object.freeze({
  mode: "any-input",
  rejectsWithTrace: true,
  configUpdates: "future-data-only",
});

const memoryStatePolicy = Object.freeze({
  updateTrigger: "data",
  ordering: "event-sequence",
  checkpoint: Object.freeze({
    mode: "explicit",
    replayRequiresCheckpoint: true,
  }),
  persistence: Object.freeze({
    local: "stateful-transform",
    global: "blocked-until-idempotency-policy",
  }),
});

const nestedGraphPolicy = Object.freeze({
  kind: "nested-graph",
  preservesTriggerCause: true,
  preservesParentEventIds: true,
  runtimeTargetContext: true,
  configUpdates: "future-execution-only",
});

const lambdaGraphPolicy = Object.freeze({
  kind: "lambda-graph",
  dataRecompute: "data-event",
  lifecycleControl: "control-event",
  configUpdates: "future-execution-only",
});

const spellInvocationPolicy = Object.freeze({
  kind: "spell-invocation",
  resolvesClassificationBeforeExecution: true,
  sideEffectMetadataRequired: true,
});

const loopySpellPolicy = Object.freeze({
  kind: "looping-spell",
  replay: "bounded-explicit",
  maxIterationsRequired: true,
  audit: true,
});

const leafLispPolicy = Object.freeze({
  kind: "leaflisp",
  pureByDefault: true,
  hostSideEffectsRequireMetadata: true,
});

const uiBridgePolicy = ({
  role,
  sourceEvents = true,
  typedControl = [],
  commandIdentityRequired = false,
}) =>
  Object.freeze({
    role,
    renderTrigger: "data",
    suppressControlReplay: true,
    sourceEvents,
    typedControl: Object.freeze(typedControl),
    commandIdentityRequired,
    configUpdates: "future-behavior-only",
  });

const configSemanticsPolicy = Object.freeze({
  defaultBehavior: "future-only",
  modes: Object.freeze([
    "future-only",
    "recompute-pure",
    "reopen-source",
    "reconfigure-side-effect",
  ]),
  scopedVersion: Object.freeze(["graphInstanceId", "nodeId", "runtimeTargetKey"]),
  fallbackFingerprint: "canonical-json",
  traceFields: Object.freeze([
    "configVersion",
    "configChanged",
    "behavior",
    "configFingerprintPrefix",
  ]),
});

const sideEffectConfigPolicy = Object.freeze({
  defaultBehavior: "reconfigure-side-effect",
  configReplay: "blocked-without-safe-replay-policy",
  secretChangeDetection: "configVersion-or-configFingerprintKey-required",
  traceFields: configSemanticsPolicy.traceFields,
});

const p3PurePolicy = ({ filterNoOutput = false } = {}) =>
  Object.freeze({
    trigger: "data",
    deterministic: true,
    preservesParentEventIds: true,
    suppressControlReplay: true,
    configUpdates: "future-only",
    filterNoOutput,
  });

const p3RenderPolicy = Object.freeze({
  trigger: "data",
  deterministic: true,
  preservesParentEventIds: true,
  suppressControlReplay: true,
  configUpdates: "future-only",
  hiddenExternalSideEffects: false,
});

const metadata = ({
  nodeType,
  runtimeClass,
  trigger,
  priority,
  status = "supported",
  join,
  state,
  boundary,
  deck,
  composite,
  dynamic,
  ui,
  config,
  p3,
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
    state,
    boundary,
    deck,
    composite,
    dynamic,
    ui,
    config,
    p3,
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
  device,
  ui,
  config,
  p3,
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
    device,
    ui,
    config,
    p3,
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
    boundary: Object.freeze({
      direction: "out",
      forwardNewDataOnly: true,
      preservesParentEventIds: true,
    }),
  }),
  leafinflowport: metadata({
    nodeType: "leafinflowport",
    runtimeClass: RUNTIME_CLASSES.SOURCE,
    trigger: "data",
    priority: "P2",
    boundary: Object.freeze({
      direction: "in",
      createsDataEnvelope: true,
      preservesParentEventIds: true,
    }),
  }),
  leafmemoryio: metadata({
    nodeType: "leafmemoryio",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P1",
    state: memoryStatePolicy,
  }),
  leafscreenio: metadata({
    nodeType: "leafscreenio",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    ui: uiBridgePolicy({
      role: "screen",
      typedControl: ["ui_clear", "ui_refresh", "ui_close"],
    }),
  }),
  leafdeckspade: metadata({
    nodeType: "leafdeckspade",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "all-inputs",
    priority: "P2",
    join: Object.freeze({ mode: "all-inputs" }),
    deck: Object.freeze({
      role: "spade",
      aggregation: "all-inputs",
      preservesParentEventIds: true,
    }),
  }),
  leafdeckheart: metadata({
    nodeType: "leafdeckheart",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "all-inputs",
    priority: "P2",
    join: Object.freeze({ mode: "all-inputs" }),
    deck: Object.freeze({
      role: "heart",
      aggregation: "all-inputs",
      preservesParentEventIds: true,
    }),
  }),
  leafdeckdiamond: metadata({
    nodeType: "leafdeckdiamond",
    runtimeClass: RUNTIME_CLASSES.STRUCTURAL,
    trigger: "data",
    priority: "P2",
    deck: Object.freeze({
      role: "diamond",
      aggregation: "data",
      preservesParentEventIds: true,
    }),
  }),
  leafdeckclub: metadata({
    nodeType: "leafdeckclub",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P2",
    deck: Object.freeze({
      role: "club",
      initialization: "data-event",
      preservesParentEventIds: true,
    }),
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
    composite: nestedGraphPolicy,
  }),
  leaflambdagraph: metadata({
    nodeType: "leaflambdagraph",
    runtimeClass: RUNTIME_CLASSES.ORCHESTRATOR,
    trigger: "control-or-data",
    priority: "P2",
    composite: lambdaGraphPolicy,
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
    dynamic: spellInvocationPolicy,
  }),
  leafloopyspell: metadata({
    nodeType: "leafloopyspell",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P2",
    dynamic: loopySpellPolicy,
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
    join: mixflowJoinPolicies,
  }),
  leafgateflow: metadata({
    nodeType: "leafgateflow",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P1",
    join: gateflowPolicy,
  }),
  leaflabel: metadata({
    nodeType: "leaflabel",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    p3: p3PurePolicy(),
  }),
  leafdelabel: metadata({
    nodeType: "leafdelabel",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    p3: p3PurePolicy(),
  }),
  leafbottle: metadata({
    nodeType: "leafbottle",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    p3: p3PurePolicy(),
  }),
  leafunbottle: metadata({
    nodeType: "leafunbottle",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    p3: p3PurePolicy({ filterNoOutput: true }),
  }),
  leafcrate: metadata({
    nodeType: "leafcrate",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    p3: p3PurePolicy(),
  }),
  leafconfig: metadata({
    nodeType: "leafconfig",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P2",
    config: configSemanticsPolicy,
  }),
  leaflisp: metadata({
    nodeType: "leaflisp",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P2",
    dynamic: leafLispPolicy,
  }),
});

const LEAFELEMENT_RUNTIME_CLASSIFICATIONS = Object.freeze({
  gnav: elementMetadata({
    elementname: "gnav",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
    ui: uiBridgePolicy({
      role: "navigation",
      typedControl: ["ui_refresh"],
      commandIdentityRequired: true,
    }),
  }),
  popup: elementMetadata({
    elementname: "popup",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
    ui: uiBridgePolicy({
      role: "popup",
      typedControl: ["ui_close", "ui_refresh"],
      commandIdentityRequired: true,
    }),
  }),
  editor: elementMetadata({
    elementname: "editor",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
    ui: uiBridgePolicy({
      role: "editor",
      typedControl: ["ui_refresh"],
    }),
  }),
  text: elementMetadata({
    elementname: "text",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "data",
    priority: "P3",
    wired: true,
    p3: p3RenderPolicy,
  }),
  prompt: elementMetadata({
    elementname: "prompt",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
    ui: uiBridgePolicy({
      role: "prompt",
      typedControl: ["ui_clear", "ui_refresh"],
    }),
  }),
  http: elementMetadata({
    elementname: "http",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
    config: sideEffectConfigPolicy,
  }),
  href: elementMetadata({
    elementname: "href",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
    config: sideEffectConfigPolicy,
  }),
  mediaplayer: elementMetadata({
    elementname: "mediaplayer",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "data",
    priority: "P2",
    wired: true,
    ui: uiBridgePolicy({
      role: "media",
      sourceEvents: false,
      typedControl: ["media_play", "media_pause", "media_stop"],
      commandIdentityRequired: true,
    }),
  }),
  image: elementMetadata({
    elementname: "image",
    runtimeClass: RUNTIME_CLASSES.SINK,
    trigger: "data",
    priority: "P3",
    wired: true,
    p3: p3RenderPolicy,
  }),
  mediainput: elementMetadata({
    elementname: "mediainput",
    runtimeClass: RUNTIME_CLASSES.SOURCE,
    trigger: "control",
    priority: "P1",
    wired: true,
    device: Object.freeze({
      lifecycleTrigger: "control",
      lifecycleIntents: Object.freeze(["start", "stop", "pause", "resume"]),
      sourceRecords: Object.freeze({
        emitsDataEvents: true,
        identity: "browser-best-effort",
      }),
      permissions: "host-provided",
    }),
  }),
  midi: elementMetadata({
    elementname: "midi",
    runtimeClass: RUNTIME_CLASSES.SOURCE,
    trigger: "control",
    priority: "P1",
    wired: true,
    device: Object.freeze({
      lifecycleTrigger: "control",
      lifecycleIntents: Object.freeze(["start", "stop", "pause", "resume"]),
      sourceRecords: Object.freeze({
        emitsDataEvents: true,
        identity: "device-message-id-or-sequence",
      }),
      outboundCommands: Object.freeze({
        trigger: "data",
        commandIdentityRequired: true,
        duplicateSuppression: "browser-local",
      }),
    }),
  }),
  sound: elementMetadata({
    elementname: "sound",
    runtimeClass: RUNTIME_CLASSES.STATEFUL_TRANSFORM,
    trigger: "data",
    priority: "P1",
    wired: true,
    device: Object.freeze({
      lifecycleTrigger: "control",
      lifecycleIntents: Object.freeze(["start", "stop", "pause", "resume"]),
      outboundCommands: Object.freeze({
        trigger: "data",
        commandIdentityRequired: true,
        duplicateSuppression: "browser-local",
      }),
      browserLocalIdempotency: "best-effort-session",
    }),
  }),
  html: elementMetadata({
    elementname: "html",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    priority: "P3",
    wired: true,
    p3: p3RenderPolicy,
  }),
  form: elementMetadata({
    elementname: "form",
    runtimeClass: RUNTIME_CLASSES.UI_BRIDGE,
    trigger: "data",
    priority: "P2",
    wired: true,
    ui: uiBridgePolicy({
      role: "form",
      typedControl: ["ui_clear", "ui_refresh"],
    }),
  }),
  directus: elementMetadata({
    elementname: "directus",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
    config: sideEffectConfigPolicy,
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
    config: sideEffectConfigPolicy,
  }),
  hermes: elementMetadata({
    elementname: "hermes",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
    config: sideEffectConfigPolicy,
  }),
  cortex: elementMetadata({
    elementname: "cortex",
    runtimeClass: RUNTIME_CLASSES.SIDE_EFFECTING_ACTION,
    trigger: "data",
    priority: "P0",
    wired: true,
    idempotency: { required: true },
    migrationGate: sideEffectGate,
    config: sideEffectConfigPolicy,
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

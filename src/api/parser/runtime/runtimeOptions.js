import { createSafeLogger, redactValue } from "./safeLogging.js";

const DEFAULT_FEATURE_FLAGS = Object.freeze({
  defaultTriggerMode: "policy",
  enableTriggerPolicy: true,
  dataTriggeredTargets: Object.freeze([]),
  idempotentSideEffects: false,
  dualTraceExecution: false,
});

const DEFAULT_RUNTIME_OPTIONS = Object.freeze({
  featureFlags: DEFAULT_FEATURE_FLAGS,
});

const RUNTIME_OPTION_CONFIG_KEYS = [
  "ghostRuntimeOptions",
  "runtimeOptions",
  "GhostRuntimeOptions",
  "ghostosRuntimeOptions",
];

const VALID_TRIGGER_MODES = new Set(["legacy", "policy"]);
const BOOLEAN_FEATURE_FLAG_NAMES = [
  "enableTriggerPolicy",
  "idempotentSideEffects",
  "dualTraceExecution",
];
const TARGET_KEY_PATTERN = /^(node|leafelement):[A-Za-z0-9_.:-]+$/;

class GhostRuntimeOptionsError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "GhostRuntimeOptionsError";
    this.code = "invalid_runtime_options";
    this.details = details;
  }
}

const isPlainObject = (value) => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
};

const cloneFeatureFlags = (featureFlags = DEFAULT_FEATURE_FLAGS) => {
  return {
    ...featureFlags,
    dataTriggeredTargets: [...(featureFlags.dataTriggeredTargets ?? [])],
  };
};

const normalizeBooleanFlag = (value, field) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new GhostRuntimeOptionsError(`${field} must be a boolean.`, { field, value });
};

const normalizeTriggerMode = (value) => {
  if (value === undefined) {
    return undefined;
  }
  if (VALID_TRIGGER_MODES.has(value)) {
    return value;
  }
  throw new GhostRuntimeOptionsError("defaultTriggerMode must be one of: legacy, policy.", {
    field: "defaultTriggerMode",
    value,
  });
};

const normalizeTargetList = (value, field) => {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new GhostRuntimeOptionsError(`${field} must be an array of runtime target keys.`, {
      field,
      value,
    });
  }
  return value.map((targetKey) => validateRuntimeTargetKey(targetKey));
};

const normalizeFeatureFlags = (featureFlags = {}) => {
  if (!isPlainObject(featureFlags)) {
    throw new GhostRuntimeOptionsError("featureFlags must be an object.", {
      field: "featureFlags",
      value: featureFlags,
    });
  }

  const normalized = {};
  const defaultTriggerMode = normalizeTriggerMode(featureFlags.defaultTriggerMode);
  if (defaultTriggerMode !== undefined) {
    normalized.defaultTriggerMode = defaultTriggerMode;
  }
  for (const field of BOOLEAN_FEATURE_FLAG_NAMES) {
    if (featureFlags[field] !== undefined) {
      normalized[field] = normalizeBooleanFlag(featureFlags[field], field);
    }
  }
  const dataTriggeredTargets = normalizeTargetList(
    featureFlags.dataTriggeredTargets,
    "dataTriggeredTargets",
  );
  if (dataTriggeredTargets !== undefined) {
    normalized.dataTriggeredTargets = dataTriggeredTargets;
  }
  return normalized;
};

const mergeFeatureFlags = (...featureFlagLayers) => {
  return featureFlagLayers.reduce((merged, layer) => {
    if (layer === undefined) {
      return merged;
    }
    return {
      ...merged,
      ...normalizeFeatureFlags(layer),
    };
  }, cloneFeatureFlags(DEFAULT_FEATURE_FLAGS));
};

const extractRuntimeOptionsFromConfig = (config = {}) => {
  if (!isPlainObject(config)) {
    return {};
  }
  for (const key of RUNTIME_OPTION_CONFIG_KEYS) {
    if (isPlainObject(config[key])) {
      return config[key];
    }
  }
  if (isPlainObject(config.featureFlags) || isPlainObject(config.observability)) {
    return {
      featureFlags: config.featureFlags,
      observability: config.observability,
    };
  }
  return {};
};

const validateRuntimeTargetKey = (targetKey) => {
  if (typeof targetKey !== "string" || !TARGET_KEY_PATTERN.test(targetKey)) {
    throw new GhostRuntimeOptionsError(
      "Runtime target keys must use node:<nodeType> or leafelement:<elementname>.",
      { field: "runtimeTargetKey", value: targetKey },
    );
  }
  if (targetKey === "node:leafelement") {
    throw new GhostRuntimeOptionsError(
      "leafelement policies must target leafelement:<elementname>, not node:leafelement.",
      { field: "runtimeTargetKey", value: targetKey },
    );
  }
  return targetKey;
};

const getRuntimeTargetKey = ({ type, args = {} } = {}) => {
  if (type === "leafelement") {
    const elementname = args?.elementname;
    if (typeof elementname !== "string" || elementname.trim().length === 0) {
      throw new GhostRuntimeOptionsError(
        "leafelement runtime target keys require args.elementname.",
        { field: "args.elementname", value: elementname },
      );
    }
    return validateRuntimeTargetKey(`leafelement:${elementname.trim()}`);
  }
  if (typeof type !== "string" || type.trim().length === 0) {
    throw new GhostRuntimeOptionsError("Runtime target keys require a node type.", {
      field: "type",
      value: type,
    });
  }
  return validateRuntimeTargetKey(`node:${type.trim()}`);
};

const createNoopTraceSink = () => {
  return {
    emit: () => {},
  };
};

const createNoopMetricSink = () => {
  return {
    record: () => {},
  };
};

const createNoopLogSink = () => {
  return {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };
};

const assertSinkMethod = (sink, method, sinkName) => {
  if (sink === undefined) {
    return;
  }
  if (!sink || typeof sink[method] !== "function") {
    throw new GhostRuntimeOptionsError(`${sinkName}.${method} must be a function.`, {
      field: `${sinkName}.${method}`,
    });
  }
};

const wrapTraceSink = (sink = createNoopTraceSink()) => {
  assertSinkMethod(sink, "emit", "traceSink");
  return {
    emit: (event) => sink.emit(redactValue(event)),
  };
};

const wrapMetricSink = (sink = createNoopMetricSink()) => {
  assertSinkMethod(sink, "record", "metricSink");
  return {
    record: (name, labels = {}, value = 1) => sink.record(name, redactValue(labels), value),
  };
};

const wrapLogSink = (sink = createNoopLogSink()) => {
  for (const level of ["debug", "info", "warn", "error"]) {
    assertSinkMethod(sink, level, "logSink");
  }
  return {
    debug: (event) => sink.debug(redactValue(event)),
    info: (event) => sink.info(redactValue(event)),
    warn: (event) => sink.warn(redactValue(event)),
    error: (event) => sink.error(redactValue(event)),
  };
};

const normalizeObservability = (observability = {}) => {
  if (observability !== undefined && !isPlainObject(observability)) {
    throw new GhostRuntimeOptionsError("observability must be an object.", {
      field: "observability",
      value: observability,
    });
  }
  return {
    traceSink: wrapTraceSink(observability?.traceSink),
    metricSink: wrapMetricSink(observability?.metricSink),
    logSink: wrapLogSink(observability?.logSink),
  };
};

const createInMemoryRuntimeSinks = () => {
  const traces = [];
  const metrics = [];
  const logs = [];
  return {
    traceSink: {
      emit: (event) => {
        traces.push(redactValue(event));
      },
    },
    metricSink: {
      record: (name, labels = {}, value = 1) => {
        metrics.push({ name, labels: redactValue(labels), value });
      },
    },
    logSink: {
      debug: (event) => logs.push({ level: "debug", event: redactValue(event) }),
      info: (event) => logs.push({ level: "info", event: redactValue(event) }),
      warn: (event) => logs.push({ level: "warn", event: redactValue(event) }),
      error: (event) => logs.push({ level: "error", event: redactValue(event) }),
    },
    snapshot: () => ({
      traces: traces.map((event) => redactValue(event)),
      metrics: metrics.map((event) => redactValue(event)),
      logs: logs.map((event) => redactValue(event)),
    }),
    clear: () => {
      traces.length = 0;
      metrics.length = 0;
      logs.length = 0;
    },
  };
};

const createCallbackRuntimeSinks = ({ onTrace, onMetric, onLog } = {}) => {
  const emitLog = (level, event) => {
    if (typeof onLog === "function") {
      onLog(level, redactValue(event));
    }
  };
  return {
    traceSink: {
      emit: (event) => {
        if (typeof onTrace === "function") {
          onTrace(redactValue(event));
        }
      },
    },
    metricSink: {
      record: (name, labels = {}, value = 1) => {
        if (typeof onMetric === "function") {
          onMetric(name, redactValue(labels), value);
        }
      },
    },
    logSink: {
      debug: (event) => emitLog("debug", event),
      info: (event) => emitLog("info", event),
      warn: (event) => emitLog("warn", event),
      error: (event) => emitLog("error", event),
    },
  };
};

const createSafeLocalLogSink = ({ component = "ghostos.runtime", enabled, sink } = {}) => {
  const logger = createSafeLogger({ component, enabled, sink });
  return {
    debug: (event) => logger.debug(event),
    info: (event) => logger.info(event),
    warn: (event) => logger.warn(event),
    error: (event) => logger.error(event),
  };
};

const resolveGhostRuntimeOptions = ({
  runtimeConfig,
  graphMetadata,
  nodeMetadata,
  packageDefaults,
  buildDefaults,
  globalOverrides,
  allowGlobalDebugOverrides = false,
} = {}) => {
  const runtimeOptions = extractRuntimeOptionsFromConfig(runtimeConfig);
  const graphOptions = extractRuntimeOptionsFromConfig(graphMetadata);
  const nodeOptions = extractRuntimeOptionsFromConfig(nodeMetadata);
  const packageOptions = extractRuntimeOptionsFromConfig(packageDefaults);
  const buildOptions = extractRuntimeOptionsFromConfig(buildDefaults);
  const debugGlobalOptions = allowGlobalDebugOverrides
    ? extractRuntimeOptionsFromConfig(
        globalOverrides ??
          globalThis.GHOSTOS_RUNTIME_OPTIONS ??
          globalThis.__GHOSTOS_RUNTIME_OPTIONS__,
      )
    : {};

  const featureFlags = mergeFeatureFlags(
    DEFAULT_FEATURE_FLAGS,
    packageOptions.featureFlags,
    buildOptions.featureFlags,
    graphOptions.featureFlags,
    nodeOptions.featureFlags,
    runtimeOptions.featureFlags,
    debugGlobalOptions.featureFlags,
  );
  const observability =
    debugGlobalOptions.observability ??
    runtimeOptions.observability ??
    nodeOptions.observability ??
    graphOptions.observability ??
    buildOptions.observability ??
    packageOptions.observability ??
    {};

  return {
    featureFlags,
    observability: normalizeObservability(observability),
  };
};

export {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_RUNTIME_OPTIONS,
  GhostRuntimeOptionsError,
  createCallbackRuntimeSinks,
  createInMemoryRuntimeSinks,
  createNoopLogSink,
  createNoopMetricSink,
  createNoopTraceSink,
  createSafeLocalLogSink,
  extractRuntimeOptionsFromConfig,
  getRuntimeTargetKey,
  resolveGhostRuntimeOptions,
  validateRuntimeTargetKey,
  wrapLogSink,
  wrapMetricSink,
  wrapTraceSink,
};

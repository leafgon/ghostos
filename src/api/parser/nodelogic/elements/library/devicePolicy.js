import { createDataEnvelope } from "../../../runtime/eventEnvelope.js";
import { driveNodeByRuntimePolicy } from "../../../runtime/policyExecution.js";
import { redactValue } from "../../../runtime/safeLogging.js";

class DeviceAdapterPolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "DeviceAdapterPolicyError";
    this.code = "invalid_device_adapter_policy";
    this.details = details;
  }
}

const DEVICE_ADAPTER_POLICIES = Object.freeze({
  mediainput: Object.freeze({
    runtimeTargetKey: "leafelement:mediainput",
    lifecycleIntents: Object.freeze(["start", "stop", "pause", "resume"]),
    lifecycleCapabilities: Object.freeze({
      start: "start",
      stop: "stop",
      pause: "pause",
      resume: "resume",
    }),
    sourceIdentity: "browser-best-effort",
  }),
  midi: Object.freeze({
    runtimeTargetKey: "leafelement:midi",
    lifecycleIntents: Object.freeze(["start", "stop", "pause", "resume"]),
    lifecycleCapabilities: Object.freeze({
      start: "open",
      stop: "close",
      pause: "pause",
      resume: "resume",
    }),
    sourceIdentity: "device-message-id-or-sequence",
    commandCapability: "sendMidi",
    commandIdentityRequired: true,
  }),
  sound: Object.freeze({
    runtimeTargetKey: "leafelement:sound",
    lifecycleIntents: Object.freeze(["start", "stop", "pause", "resume"]),
    lifecycleCapabilities: Object.freeze({
      start: "start",
      stop: "stop",
      pause: "pause",
      resume: "resume",
    }),
    commandCapability: "executeSoundCommand",
    commandIdentityRequired: true,
  }),
});

const resolveDeviceAdapterPolicy = (adapterName) => {
  const policy = DEVICE_ADAPTER_POLICIES[adapterName];
  if (!policy) {
    throw new DeviceAdapterPolicyError(`Unsupported device adapter: ${adapterName}.`, {
      field: "adapterName",
      value: adapterName,
    });
  }
  return policy;
};

const emitDeviceTrace = (traceSink, event) => {
  traceSink?.emit(redactValue(event));
};

const assertCapability = ({ adapterName, host, capability }) => {
  if (!host || typeof host[capability] !== "function") {
    throw new DeviceAdapterPolicyError(
      `${adapterName} host does not support required capability: ${capability}.`,
      {
        field: "capability",
        value: capability,
      },
    );
  }
  return host[capability].bind(host);
};

const createBrowserLocalCommandGuard = () => {
  const seenCommandIds = new Set();
  return Object.freeze({
    reserve: (commandId) => {
      if (seenCommandIds.has(commandId)) {
        return false;
      }
      seenCommandIds.add(commandId);
      return true;
    },
    snapshot: () => Object.freeze({ commandIds: Object.freeze([...seenCommandIds]) }),
  });
};

const assertDeviceCommandIdentity = ({ adapterName, command = {} }) => {
  const policy = resolveDeviceAdapterPolicy(adapterName);
  if (
    policy.commandIdentityRequired &&
    (typeof command.commandId !== "string" || command.commandId.trim().length === 0)
  ) {
    throw new DeviceAdapterPolicyError(`${adapterName} commands require commandId.`, {
      field: "command.commandId",
      value: command.commandId,
    });
  }
  return command.commandId.trim();
};

const applyDeviceLifecycleControl = ({ adapterName, host, control, traceSink } = {}) => {
  const policy = resolveDeviceAdapterPolicy(adapterName);
  const intent = control?.intent;
  if (!policy.lifecycleIntents.includes(intent)) {
    throw new DeviceAdapterPolicyError(
      `${adapterName} does not support lifecycle intent: ${intent}.`,
      {
        field: "intent",
        value: intent,
      },
    );
  }
  const capability = policy.lifecycleCapabilities[intent];
  const execute = assertCapability({ adapterName, host, capability });
  const result = execute({ control });
  emitDeviceTrace(traceSink, {
    event: "device_lifecycle_control",
    adapterName,
    runtimeTargetKey: policy.runtimeTargetKey,
    intent,
    eventId: control?.eventId,
    sourceNodeId: control?.sourceNodeId,
  });
  return Object.freeze({
    adapterName,
    intent,
    status: "applied",
    result,
  });
};

const normalizeDeviceSourceRecord = ({
  adapterName,
  record = {},
  graphInstanceId = "device-adapter",
  sourceNodeId = `${adapterName}:source`,
  sequence = 1,
  parentEventIds = [],
} = {}) => {
  const policy = resolveDeviceAdapterPolicy(adapterName);
  const recordId = record.recordId ?? record.messageId ?? `${sourceNodeId}:${sequence}`;
  return createDataEnvelope(
    {
      adapterName,
      sourceIdentity: policy.sourceIdentity,
      recordId,
      payload: record.payload,
    },
    {
      eventId: record.eventId ?? `${adapterName}:${recordId}`,
      sourceNodeId,
      graphInstanceId,
      sequence,
      parentEventIds,
      trigger: "data",
    },
  );
};

const executeDeviceCommand = ({
  adapterName,
  command = {},
  host,
  commandGuard = createBrowserLocalCommandGuard(),
  traceSink,
  eventContext = {},
} = {}) => {
  const policy = resolveDeviceAdapterPolicy(adapterName);
  const commandId = assertDeviceCommandIdentity({ adapterName, command });
  if (!commandGuard.reserve(commandId)) {
    emitDeviceTrace(traceSink, {
      event: "device_command_suppressed",
      adapterName,
      runtimeTargetKey: policy.runtimeTargetKey,
      commandId,
      eventId: eventContext.eventId,
      reason: "duplicate_command",
    });
    return Object.freeze({
      adapterName,
      commandId,
      status: "duplicate_suppressed",
    });
  }
  const execute = assertCapability({
    adapterName,
    host,
    capability: policy.commandCapability,
  });
  const result = execute(command);
  emitDeviceTrace(traceSink, {
    event: "device_command_executed",
    adapterName,
    runtimeTargetKey: policy.runtimeTargetKey,
    commandId,
    eventId: eventContext.eventId,
    parentEventIds: eventContext.parentEventIds ?? [],
    status: "executed",
  });
  return Object.freeze({
    adapterName,
    commandId,
    status: "executed",
    result,
  });
};

const driveDeviceCommandByRuntimePolicy = ({
  adapterName,
  host,
  commandGuard = createBrowserLocalCommandGuard(),
  inflowCtrlObj,
  dataInflowObjArr = [],
  metaCtrl$,
  context = {},
  observability = {},
} = {}) => {
  const policy = resolveDeviceAdapterPolicy(adapterName);
  return driveNodeByRuntimePolicy({
    inflowCtrlObj,
    dataInflowObjArr,
    metaCtrl$,
    context: {
      nodeId: context.nodeId ?? `${adapterName}-device-command`,
      runtimeTargetKey: context.runtimeTargetKey ?? policy.runtimeTargetKey,
      ...context,
    },
    policy: {
      mode: "policy",
      trigger: "data",
    },
    transformation: {
      leaflogic: ([command], _controlValue, runtime) =>
        executeDeviceCommand({
          adapterName,
          command,
          host,
          commandGuard,
          traceSink: observability.traceSink,
          eventContext: {
            eventId: runtime.event.eventId,
            parentEventIds: runtime.event.trace?.parentEventIds ?? [],
          },
        }),
    },
    observability,
  });
};

export {
  DEVICE_ADAPTER_POLICIES,
  DeviceAdapterPolicyError,
  applyDeviceLifecycleControl,
  assertDeviceCommandIdentity,
  createBrowserLocalCommandGuard,
  driveDeviceCommandByRuntimePolicy,
  executeDeviceCommand,
  normalizeDeviceSourceRecord,
  resolveDeviceAdapterPolicy,
};

import { Subject, merge } from "rxjs";
import { map } from "rxjs/operators";

import {
  createDataEnvelope,
  isRuntimeEnvelope,
  resolvePayloadKind,
  unwrapControlForLegacy,
  unwrapDataForLegacy,
} from "./eventEnvelope.js";
import { redactValue } from "./safeLogging.js";

const POLICY_EXECUTION_MODES = Object.freeze({
  LEGACY: "legacy",
  POLICY: "policy",
});

const POLICY_EXECUTION_DECISIONS = Object.freeze({
  EXECUTE: "execute",
  SKIP: "skip",
});

class PolicyExecutionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PolicyExecutionError";
    this.code = "invalid_policy_execution";
    this.details = details;
  }
}

const createNoopTraceSink = () => ({ emit: () => {} });

const assertStreamObject = (value, field) => {
  if (!value || typeof value._stream?.subscribe !== "function") {
    throw new PolicyExecutionError(`${field} must be a legacy flow object with _stream.`, {
      field,
    });
  }
  return value;
};

const normalizePolicy = (policy = {}) => {
  return Object.freeze({
    mode: policy.mode ?? POLICY_EXECUTION_MODES.LEGACY,
    trigger: policy.trigger ?? "data",
    join: Object.freeze({
      mode: policy.join?.mode ?? policy.trigger ?? "any-input",
      primaryInputIndex: policy.join?.primaryInputIndex ?? 0,
      windowSize: policy.join?.windowSize ?? 1,
      allowSamplingLatestData: policy.join?.allowSamplingLatestData === true,
    }),
    allowedControlIntents: Object.freeze(policy.allowedControlIntents ?? []),
  });
};

const getEventKind = (event) => {
  if (isRuntimeEnvelope(event)) {
    return event.eventKind;
  }
  return event?.eventKind ?? event?.kind ?? "data";
};

const getControlIntent = (event) => {
  if (isRuntimeEnvelope(event)) {
    return event.intent;
  }
  return (
    event?.intent ?? unwrapControlForLegacy(event)?.intent ?? unwrapControlForLegacy(event)?._bname
  );
};

const isMeaningfulDataEvent = (event) => {
  const payload = unwrapDataForLegacy(event);
  return resolvePayloadKind(payload) !== "empty_sentinel";
};

const shouldExecuteByRuntimePolicy = ({ event, policy, laneIndex = 0, latestData = [] } = {}) => {
  const normalized = normalizePolicy(policy);
  if (normalized.mode === POLICY_EXECUTION_MODES.LEGACY) {
    return Object.freeze({
      decision: POLICY_EXECUTION_DECISIONS.EXECUTE,
      reason: "legacy",
      legacyWouldExecute: true,
    });
  }

  const eventKind = getEventKind(event);
  const intent = getControlIntent(event);
  let execute = false;
  let reason = "policy_skip";

  if (normalized.trigger === "data") {
    execute = eventKind === "data" && isMeaningfulDataEvent(event);
    reason = execute ? "data" : "not_meaningful_data";
  } else if (normalized.trigger === "control") {
    execute =
      eventKind === "control" &&
      normalized.allowedControlIntents.includes(intent) &&
      event?.metaControl !== true;
    reason = execute ? `control:${intent}` : "control_intent_not_allowed";
  } else if (normalized.trigger === "timer") {
    execute = eventKind === "timer" || intent === "timer_tick";
    reason = execute ? "timer" : "not_timer";
  } else if (normalized.trigger === "primary-input") {
    execute =
      eventKind === "data" &&
      laneIndex === normalized.join.primaryInputIndex &&
      isMeaningfulDataEvent(event);
    reason = execute ? "primary-input" : "not_primary_input";
  } else if (normalized.trigger === "all-inputs") {
    execute =
      eventKind === "data" && latestData.length > 0 && latestData.every((entry) => entry.hasValue);
    reason = execute ? "all-inputs" : "waiting_for_all_inputs";
  } else if (normalized.trigger === "any-input") {
    execute = eventKind === "data" && isMeaningfulDataEvent(event);
    reason = execute ? "any-input" : "not_meaningful_data";
  } else if (normalized.trigger === "manual-replay") {
    execute = eventKind === "control" && intent === "replay";
    reason = execute ? "manual-replay" : "not_replay";
  } else if (normalized.trigger === "retry") {
    execute = eventKind === "control" && intent === "retry";
    reason = execute ? "retry" : "not_retry";
  }

  return Object.freeze({
    decision: execute ? POLICY_EXECUTION_DECISIONS.EXECUTE : POLICY_EXECUTION_DECISIONS.SKIP,
    reason,
    legacyWouldExecute: true,
  });
};

const selectJoinedInputs = ({ event, policy, laneIndex, latestData, windows }) => {
  const normalized = normalizePolicy(policy);
  const payload = unwrapDataForLegacy(event);
  const joinMode = normalized.join.mode;
  if (joinMode === "primary-input") {
    return [payload];
  }
  if (joinMode === "all-inputs") {
    return latestData.map((entry) => entry.value);
  }
  if (joinMode === "latest-context") {
    return latestData.map((entry, index) => (index === laneIndex ? payload : entry.value));
  }
  if (joinMode === "windowed") {
    return windows.map((window) => [...window]);
  }
  return [payload];
};

const emitTrace = (traceSink, event) => {
  traceSink.emit(redactValue(event));
};

const maybeWrapOutput = ({ output, event, context }) => {
  if (!isRuntimeEnvelope(event)) {
    return output;
  }
  return createDataEnvelope(output, {
    eventId: `${event.eventId}:out`,
    sourceNodeId: context.nodeId,
    graphInstanceId: event.graphInstanceId,
    sequence: event.sequence,
    parentEventIds: [event.eventId, ...(event.trace?.parentEventIds ?? [])],
    trace: {
      trigger: event.trace?.trigger,
    },
  });
};

const executeLegacyHooks = ({ inputValues, controlValue, transformation = {}, runtime }) => {
  const preInput =
    typeof transformation.datalogic?.pre === "function"
      ? inputValues.map((value) => transformation.datalogic.pre(value))
      : inputValues;
  const logicOutput =
    typeof transformation.leaflogic === "function"
      ? transformation.leaflogic(preInput, controlValue, runtime)
      : preInput.length === 1
        ? preInput[0]
        : preInput;
  return typeof transformation.datalogic?.post === "function"
    ? transformation.datalogic.post(logicOutput)
    : logicOutput;
};

const driveNodeByRuntimePolicy = ({
  inflowCtrlObj,
  dataInflowObjArr = [],
  metaCtrl$,
  context = {},
  policy = {},
  transformation = {},
  observability = {},
} = {}) => {
  const controlObj = assertStreamObject(inflowCtrlObj, "inflowCtrlObj");
  dataInflowObjArr.forEach((flowObj, index) =>
    assertStreamObject(flowObj, `dataInflowObjArr[${index}]`),
  );
  const normalizedPolicy = normalizePolicy(policy);
  const traceSink = observability.traceSink ?? createNoopTraceSink();
  const output$ = new Subject();
  const control$ = new Subject();
  const latestData = dataInflowObjArr.map(() => ({ hasValue: false, value: undefined }));
  const windows = dataInflowObjArr.map(() => []);

  const runIfAllowed = ({ event, laneIndex = 0, controlValue, metaControl = false }) => {
    const decision = shouldExecuteByRuntimePolicy({
      event: metaControl ? { ...event, metaControl: true } : event,
      policy: normalizedPolicy,
      laneIndex,
      latestData,
    });
    emitTrace(traceSink, {
      event: "policy_driver_decision",
      runtimeTargetKey: context.runtimeTargetKey,
      trigger: normalizedPolicy.trigger,
      decision: decision.decision,
      reason: decision.reason,
      legacyWouldExecute: decision.legacyWouldExecute,
      actualExecute: decision.decision === POLICY_EXECUTION_DECISIONS.EXECUTE,
      eventKind: getEventKind(event),
      intent: getControlIntent(event),
      laneIndex,
      metaControl,
    });
    control$.next({
      decision: decision.decision,
      reason: decision.reason,
      event,
    });
    if (decision.decision !== POLICY_EXECUTION_DECISIONS.EXECUTE) {
      return;
    }
    const eventKind = getEventKind(event);
    const inputValues =
      eventKind === "data"
        ? selectJoinedInputs({
            event,
            policy: normalizedPolicy,
            laneIndex,
            latestData,
            windows,
          })
        : normalizedPolicy.join.allowSamplingLatestData
          ? latestData.filter((entry) => entry.hasValue).map((entry) => entry.value)
          : [];
    const output = executeLegacyHooks({
      inputValues,
      controlValue: unwrapControlForLegacy(controlValue ?? event),
      transformation,
      runtime: {
        context,
        policy: normalizedPolicy,
        event,
        decision,
      },
    });
    output$.next(maybeWrapOutput({ output, event, context }));
  };

  dataInflowObjArr.forEach((flowObj, laneIndex) => {
    flowObj._stream.subscribe((event) => {
      const payload = unwrapDataForLegacy(event);
      latestData[laneIndex] = { hasValue: true, value: payload };
      windows[laneIndex].push(payload);
      while (windows[laneIndex].length > normalizedPolicy.join.windowSize) {
        windows[laneIndex].shift();
      }
      runIfAllowed({ event, laneIndex });
    });
  });

  controlObj._stream.subscribe((event) => {
    runIfAllowed({ event, controlValue: event });
  });

  if (metaCtrl$) {
    metaCtrl$.subscribe((event) => {
      runIfAllowed({ event, controlValue: event, metaControl: true });
    });
  }

  return Object.freeze({
    _stream: output$.asObservable(),
    _control: Object.freeze({
      _stream: merge(control$).pipe(map((event) => event)),
      _config: controlObj._config ?? {},
    }),
  });
};

export {
  POLICY_EXECUTION_DECISIONS,
  POLICY_EXECUTION_MODES,
  PolicyExecutionError,
  driveNodeByRuntimePolicy,
  normalizePolicy,
  selectJoinedInputs,
  shouldExecuteByRuntimePolicy,
};

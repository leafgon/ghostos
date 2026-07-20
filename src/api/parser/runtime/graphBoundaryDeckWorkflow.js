import { Subject } from "rxjs";

import {
  createDataEnvelope,
  isRuntimeEnvelope,
  resolvePayloadKind,
  unwrapRuntimeEnvelope,
} from "./eventEnvelope.js";
import {
  POLICY_EXECUTION_DECISIONS,
  POLICY_EXECUTION_MODES,
  shouldExecuteByRuntimePolicy,
} from "./policyExecution.js";
import { redactValue } from "./safeLogging.js";

class GraphBoundaryDeckPolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "GraphBoundaryDeckPolicyError";
    this.code = "invalid_graph_boundary_deck_policy";
    this.details = details;
  }
}

const DECK_POLICIES = Object.freeze({
  spade: Object.freeze({
    trigger: "all-inputs",
    join: Object.freeze({ mode: "all-inputs" }),
  }),
  heart: Object.freeze({
    trigger: "all-inputs",
    join: Object.freeze({ mode: "all-inputs" }),
  }),
  diamond: Object.freeze({
    trigger: "data",
    join: Object.freeze({ mode: "data" }),
  }),
  club: Object.freeze({
    trigger: "data",
    join: Object.freeze({ mode: "data" }),
  }),
});

const createNoopTraceSink = () => ({ emit: () => {} });

const flow = (stream, config = {}) =>
  Object.freeze({
    _stream: stream,
    _config: config,
  });

const assertStreamObject = (value, field) => {
  if (!value || typeof value._stream?.subscribe !== "function") {
    throw new GraphBoundaryDeckPolicyError(`${field} must be a legacy flow object with _stream.`, {
      field,
    });
  }
  return value;
};

const assertEventId = (value, field = "eventId") => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GraphBoundaryDeckPolicyError(`${field} is required.`, { field, value });
  }
  return value.trim();
};

const emitTrace = (traceSink, event) => {
  traceSink.emit(redactValue(event));
};

const collectParentEventIds = (events = [], explicitParentEventIds = []) => {
  const parentEventIds = [];
  const addParentEventId = (eventId) => {
    if (typeof eventId === "string" && eventId.length > 0 && !parentEventIds.includes(eventId)) {
      parentEventIds.push(eventId);
    }
  };

  events.filter(isRuntimeEnvelope).forEach((event) => {
    addParentEventId(event.eventId);
    (event.trace?.parentEventIds ?? []).forEach(addParentEventId);
  });
  explicitParentEventIds.forEach(addParentEventId);

  return parentEventIds;
};

const createGraphBoundaryInflowDataEvent = ({
  payload,
  eventId,
  sourceNodeId = "leafinflowport",
  graphInstanceId,
  sequence,
  parentEvent,
  parentEventIds = [],
  trigger = "graph_input",
  trace = {},
  observability = {},
} = {}) => {
  const envelope = createDataEnvelope(payload, {
    eventId: assertEventId(eventId),
    sourceNodeId,
    graphInstanceId,
    sequence,
    parentEventIds: collectParentEventIds([parentEvent], parentEventIds),
    trigger,
    trace: {
      ...trace,
      boundary: "inflow",
    },
  });
  emitTrace(observability.traceSink ?? createNoopTraceSink(), {
    event: "graph_boundary_inflow_event",
    boundary: "inflow",
    eventId: envelope.eventId,
    eventKind: envelope.eventKind,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    sequence: envelope.sequence,
    payloadKind: envelope.payloadKind,
    parentEventIds: envelope.trace.parentEventIds,
    payload,
  });
  return envelope;
};

const createDeckInitializationDataEvent = ({
  payload,
  eventId,
  sourceNodeId = "leafdeckclub",
  graphInstanceId,
  sequence,
  parentEvent,
  parentEventIds = [],
  trace = {},
  observability = {},
} = {}) => {
  const envelope = createDataEnvelope(payload, {
    eventId: assertEventId(eventId),
    sourceNodeId,
    graphInstanceId,
    sequence,
    parentEventIds: collectParentEventIds([parentEvent], parentEventIds),
    trigger: "deck_initialization",
    trace: {
      ...trace,
      deckRole: "club",
      dataCategory: "initialization",
    },
  });
  emitTrace(observability.traceSink ?? createNoopTraceSink(), {
    event: "deck_initialization_data_event",
    deckRole: "club",
    dataCategory: "initialization",
    eventId: envelope.eventId,
    eventKind: envelope.eventKind,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    sequence: envelope.sequence,
    payloadKind: envelope.payloadKind,
    parentEventIds: envelope.trace.parentEventIds,
    payload,
  });
  return envelope;
};

const resolveDeckRuntimePolicy = ({ role } = {}) => {
  const policy = DECK_POLICIES[role];
  if (!policy) {
    throw new GraphBoundaryDeckPolicyError("Unsupported deck role.", { role });
  }
  return Object.freeze({
    mode: POLICY_EXECUTION_MODES.POLICY,
    ...policy,
  });
};

const createInitialLaneState = (dataInflowObjArr) =>
  dataInflowObjArr.map(() => ({
    hasValue: false,
    value: undefined,
    event: undefined,
    fresh: false,
  }));

const defaultDeckPayload = ({ role, inputValues, event, laneIndex }) =>
  Object.freeze({
    deckRole: role,
    inputValues,
    causeEventId: event?.eventId,
    causeLaneIndex: laneIndex,
  });

const createOutputEnvelope = ({
  payload,
  event,
  inputEvents,
  context,
  trigger,
  trace = {},
  eventIdSuffix = "out",
}) => {
  if (!isRuntimeEnvelope(event)) {
    return payload;
  }
  return createDataEnvelope(payload, {
    eventId: `${event.eventId}:${eventIdSuffix}`,
    sourceNodeId: context.nodeId,
    graphInstanceId: event.graphInstanceId,
    sequence: event.sequence,
    parentEventIds: collectParentEventIds(inputEvents),
    trigger,
    trace,
  });
};

const driveGraphOutflowByRuntimePolicy = ({
  inflowCtrlObj,
  dataInflowObjArr = [],
  metaCtrl$,
  context = {},
  transformation = {},
  observability = {},
  compatibilityMode = "runtime",
} = {}) => {
  const controlObj = assertStreamObject(inflowCtrlObj, "inflowCtrlObj");
  dataInflowObjArr.forEach((flowObj, index) =>
    assertStreamObject(flowObj, `dataInflowObjArr[${index}]`),
  );
  const output$ = new Subject();
  const control$ = new Subject();
  const latestData = createInitialLaneState(dataInflowObjArr);
  const traceSink = observability.traceSink ?? createNoopTraceSink();
  const policy = Object.freeze({
    mode: POLICY_EXECUTION_MODES.POLICY,
    trigger: "primary-input",
    join: Object.freeze({ mode: "primary-input", primaryInputIndex: 0 }),
  });

  const runIfAllowed = ({ event, laneIndex = 0, metaControl = false }) => {
    const decision = shouldExecuteByRuntimePolicy({
      event: metaControl ? { ...event, metaControl: true } : event,
      policy,
      laneIndex,
      latestData,
    });
    const policyWouldExecute = decision.decision === POLICY_EXECUTION_DECISIONS.EXECUTE;
    emitTrace(traceSink, {
      event: "graph_boundary_outflow_decision",
      runtimeTargetKey: context.runtimeTargetKey,
      boundary: "outflow",
      decision: decision.decision,
      reason: decision.reason,
      policyWouldExecute,
      eventId: event?.eventId,
      eventKind: isRuntimeEnvelope(event) ? event.eventKind : event?.eventKind,
      laneIndex,
      metaControl,
    });
    control$.next({
      decision: decision.decision,
      reason: decision.reason,
      event,
    });
    if (!policyWouldExecute) {
      return;
    }
    const inputValue = unwrapRuntimeEnvelope(event);
    const output =
      typeof transformation.leaflogic === "function"
        ? transformation.leaflogic([inputValue], undefined, {
            context,
            policy,
            event,
            decision,
          })
        : inputValue;
    if (output === undefined && transformation.suppressUndefinedOutput === true) {
      return;
    }
    const envelope = createOutputEnvelope({
      payload: output,
      event,
      inputEvents: [event],
      context,
      trigger: decision.reason,
      eventIdSuffix: "graph-out",
      trace: {
        boundary: "outflow",
        causeEventId: event?.eventId,
      },
    });
    output$.next(compatibilityMode === "legacy" ? unwrapRuntimeEnvelope(envelope) : envelope);
  };

  dataInflowObjArr.forEach((flowObj, laneIndex) => {
    flowObj._stream.subscribe((event) => {
      latestData[laneIndex] = {
        hasValue: isRuntimeEnvelope(event)
          ? resolvePayloadKind(event.payload) !== "empty_sentinel"
          : true,
        value: unwrapRuntimeEnvelope(event),
        event,
        fresh: true,
      };
      runIfAllowed({ event, laneIndex });
    });
  });
  controlObj._stream.subscribe((event) => runIfAllowed({ event }));
  metaCtrl$?.subscribe((event) => runIfAllowed({ event, metaControl: true }));

  return Object.freeze({
    _stream: output$.asObservable(),
    _control: flow(control$.asObservable(), controlObj._config ?? {}),
  });
};

const driveDeckNodeByRuntimePolicy = ({
  role,
  inflowCtrlObj,
  dataInflowObjArr = [],
  metaCtrl$,
  context = {},
  transformation = {},
  observability = {},
} = {}) => {
  const controlObj = assertStreamObject(inflowCtrlObj, "inflowCtrlObj");
  dataInflowObjArr.forEach((flowObj, index) =>
    assertStreamObject(flowObj, `dataInflowObjArr[${index}]`),
  );
  const policy = resolveDeckRuntimePolicy({ role });
  const output$ = new Subject();
  const control$ = new Subject();
  const latestData = createInitialLaneState(dataInflowObjArr);
  const traceSink = observability.traceSink ?? createNoopTraceSink();

  const runIfAllowed = ({ event, laneIndex = 0, metaControl = false }) => {
    const decision = shouldExecuteByRuntimePolicy({
      event: metaControl ? { ...event, metaControl: true } : event,
      policy,
      laneIndex,
      latestData,
    });
    const policyWouldExecute = decision.decision === POLICY_EXECUTION_DECISIONS.EXECUTE;
    emitTrace(traceSink, {
      event: "deck_policy_driver_decision",
      runtimeTargetKey: context.runtimeTargetKey,
      deckRole: role,
      trigger: policy.trigger,
      decision: decision.decision,
      reason: decision.reason,
      policyWouldExecute,
      eventId: event?.eventId,
      eventKind: isRuntimeEnvelope(event) ? event.eventKind : event?.eventKind,
      laneIndex,
      metaControl,
    });
    control$.next({
      decision: decision.decision,
      reason: decision.reason,
      event,
    });
    if (!policyWouldExecute) {
      return;
    }

    const inputEntries =
      policy.join.mode === "all-inputs"
        ? latestData
        : [{ value: unwrapRuntimeEnvelope(event), event }];
    const inputValues = inputEntries.map((entry) => entry.value);
    const inputEvents = inputEntries.map((entry) => entry.event).filter(Boolean);
    const output =
      typeof transformation.leaflogic === "function"
        ? transformation.leaflogic(inputValues, undefined, {
            context,
            policy,
            event,
            decision,
            role,
            laneIndex,
          })
        : defaultDeckPayload({ role, inputValues, event, laneIndex });
    if (output === undefined && transformation.suppressUndefinedOutput === true) {
      return;
    }
    output$.next(
      createOutputEnvelope({
        payload: output,
        event,
        inputEvents,
        context,
        trigger: decision.reason,
        eventIdSuffix: `${role}:out`,
        trace: {
          deckRole: role,
          causeEventId: event?.eventId,
          causeLaneIndex: laneIndex,
        },
      }),
    );
    if (policy.join.mode === "all-inputs") {
      latestData.forEach((entry) => {
        entry.fresh = false;
      });
    }
  };

  dataInflowObjArr.forEach((flowObj, laneIndex) => {
    flowObj._stream.subscribe((event) => {
      latestData[laneIndex] = {
        hasValue: isRuntimeEnvelope(event)
          ? resolvePayloadKind(event.payload) !== "empty_sentinel"
          : true,
        value: unwrapRuntimeEnvelope(event),
        event,
        fresh: true,
      };
      runIfAllowed({ event, laneIndex });
    });
  });
  controlObj._stream.subscribe((event) => runIfAllowed({ event }));
  metaCtrl$?.subscribe((event) => runIfAllowed({ event, metaControl: true }));

  return Object.freeze({
    _stream: output$.asObservable(),
    _control: flow(control$.asObservable(), controlObj._config ?? {}),
  });
};

export {
  GraphBoundaryDeckPolicyError,
  collectParentEventIds,
  createDeckInitializationDataEvent,
  createGraphBoundaryInflowDataEvent,
  driveDeckNodeByRuntimePolicy,
  driveGraphOutflowByRuntimePolicy,
  resolveDeckRuntimePolicy,
};

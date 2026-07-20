import { Subject } from "rxjs";

import { createDataEnvelope, isRuntimeEnvelope, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import { collectParentEventIds } from "./graphBoundaryDeckWorkflow.js";
import { RUNTIME_CLASSES, resolveNodeRuntimeClassification } from "./nodeClassification.js";
import { redactValue } from "./safeLogging.js";

class DynamicCompositePolicyError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "DynamicCompositePolicyError";
    this.code = "invalid_dynamic_composite_policy";
    this.details = details;
  }
}

const LIFECYCLE_CONTROL_INTENTS = new Set(["start", "stop", "pause", "resume", "cancel"]);
const CONFIG_CONTROL_INTENTS = new Set(["refresh_config"]);
const DEFAULT_MAX_LOOP_ITERATIONS = 100;
const MAX_ALLOWED_LOOP_ITERATIONS = 1000;

const createNoopTraceSink = () => ({ emit: () => {} });

const flow = (stream, config = {}) =>
  Object.freeze({
    _stream: stream,
    _config: config,
  });

const assertRuntimeEnvelope = (event, field = "event") => {
  if (!isRuntimeEnvelope(event)) {
    throw new DynamicCompositePolicyError(`${field} must be a runtime envelope.`, {
      field,
    });
  }
  return event;
};

const assertEventId = (value, field = "eventId") => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DynamicCompositePolicyError(`${field} is required.`, { field, value });
  }
  return value.trim();
};

const assertStreamObject = (value, field) => {
  if (!value || typeof value._stream?.subscribe !== "function") {
    throw new DynamicCompositePolicyError(`${field} must be a legacy flow object with _stream.`, {
      field,
    });
  }
  return value;
};

const emitTrace = (traceSink, event) => {
  traceSink.emit(redactValue(event));
};

const createNestedGraphExecutionEvent = ({
  inputEvent,
  payload = unwrapRuntimeEnvelope(inputEvent),
  eventId,
  sourceNodeId = "leafgraph",
  graphInstanceId = inputEvent?.graphInstanceId,
  nestedGraphId,
  runtimeTargetKey = "node:leafgraph",
  nestedRuntimeTargetKey,
  trace = {},
  observability = {},
} = {}) => {
  const event = assertRuntimeEnvelope(inputEvent, "inputEvent");
  const envelope = createDataEnvelope(payload, {
    eventId: assertEventId(eventId),
    sourceNodeId,
    graphInstanceId,
    sequence: event.sequence,
    parentEventIds: collectParentEventIds([event]),
    trigger: event.trace?.trigger ?? event.eventKind,
    trace: {
      ...trace,
      composite: "nested-graph",
      nestedGraphId,
      runtimeTargetKey,
      nestedRuntimeTargetKey,
      causeEventId: event.eventId,
    },
  });
  emitTrace(observability.traceSink ?? createNoopTraceSink(), {
    event: "nested_graph_execution_event",
    runtimeTargetKey,
    nestedRuntimeTargetKey,
    nestedGraphId,
    eventId: envelope.eventId,
    eventKind: envelope.eventKind,
    trigger: envelope.trace.trigger,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    parentEventIds: envelope.trace.parentEventIds,
    causeEventId: event.eventId,
    payload,
  });
  return envelope;
};

const classifyLambdaGraphTrigger = (event) => {
  const runtimeEvent = assertRuntimeEnvelope(event);
  if (runtimeEvent.eventKind === "data") {
    return Object.freeze({
      decision: "execute",
      reason: "data_recompute",
      recompute: true,
      lifecycleControl: false,
      configUpdate: false,
    });
  }
  if (runtimeEvent.eventKind === "control" && LIFECYCLE_CONTROL_INTENTS.has(runtimeEvent.intent)) {
    return Object.freeze({
      decision: "skip",
      reason: `lifecycle_control:${runtimeEvent.intent}`,
      recompute: false,
      lifecycleControl: true,
      configUpdate: false,
    });
  }
  if (runtimeEvent.eventKind === "control" && CONFIG_CONTROL_INTENTS.has(runtimeEvent.intent)) {
    return Object.freeze({
      decision: "skip",
      reason: "config_future_execution_only",
      recompute: false,
      lifecycleControl: false,
      configUpdate: true,
    });
  }
  return Object.freeze({
    decision: "skip",
    reason: "unsupported_control_for_recompute",
    recompute: false,
    lifecycleControl: false,
    configUpdate: false,
  });
};

const driveLambdaGraphByRuntimePolicy = ({
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
  const output$ = new Subject();
  const control$ = new Subject();
  const traceSink = observability.traceSink ?? createNoopTraceSink();

  const run = ({ event, laneIndex = 0, metaControl = false }) => {
    const decision = classifyLambdaGraphTrigger(event);
    emitTrace(traceSink, {
      event: "lambda_graph_policy_decision",
      runtimeTargetKey: context.runtimeTargetKey,
      eventId: event?.eventId,
      eventKind: event?.eventKind,
      intent: event?.intent,
      laneIndex,
      metaControl,
      decision: decision.decision,
      reason: decision.reason,
      recompute: decision.recompute,
      lifecycleControl: decision.lifecycleControl,
      configUpdate: decision.configUpdate,
    });
    control$.next({
      decision: decision.decision,
      reason: decision.reason,
      event,
    });
    if (!decision.recompute) {
      return;
    }
    const inputValue = unwrapRuntimeEnvelope(event);
    const output =
      typeof transformation.leaflogic === "function"
        ? transformation.leaflogic([inputValue], undefined, {
            context,
            event,
            decision,
            laneIndex,
          })
        : inputValue;
    if (output === undefined && transformation.suppressUndefinedOutput === true) {
      return;
    }
    output$.next(
      createDataEnvelope(output, {
        eventId: `${event.eventId}:lambda-out`,
        sourceNodeId: context.nodeId,
        graphInstanceId: event.graphInstanceId,
        sequence: event.sequence,
        parentEventIds: collectParentEventIds([event]),
        trigger: decision.reason,
        trace: {
          composite: "lambda-graph",
          causeEventId: event.eventId,
        },
      }),
    );
  };

  dataInflowObjArr.forEach((flowObj, laneIndex) => {
    flowObj._stream.subscribe((event) => run({ event, laneIndex }));
  });
  controlObj._stream.subscribe((event) => run({ event }));
  metaCtrl$?.subscribe((event) => run({ event, metaControl: true }));

  return Object.freeze({
    _stream: output$.asObservable(),
    _control: flow(control$.asObservable(), controlObj._config ?? {}),
  });
};

const isSideEffectingClassification = (classification = {}) =>
  classification.runtimeClass === RUNTIME_CLASSES.SIDE_EFFECTING_ACTION ||
  classification.idempotency?.required === true ||
  classification.migrationGate?.idempotency?.required === true;

const assertSideEffectMetadata = ({ classification, sideEffectMetadata } = {}) => {
  if (!isSideEffectingClassification(classification)) {
    return Object.freeze({ required: false });
  }
  const idempotencyKey = sideEffectMetadata?.idempotencyKey ?? sideEffectMetadata?.idempotency?.key;
  if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
    throw new DynamicCompositePolicyError(
      "Side-effecting dynamic execution requires idempotency metadata.",
      {
        field: "sideEffectMetadata.idempotencyKey",
        runtimeTargetKey: classification.runtimeTargetKey,
      },
    );
  }
  return Object.freeze({
    required: true,
    idempotencyKey: idempotencyKey.trim(),
    retry: sideEffectMetadata?.retry ?? classification.migrationGate?.retry,
    replay: sideEffectMetadata?.replay ?? classification.migrationGate?.replay,
  });
};

const resolveSpellInvocationClassification = ({
  spellName,
  declaredClassification,
  inheritedClassification,
  sideEffectMetadata,
} = {}) => {
  const classification =
    declaredClassification ??
    inheritedClassification ??
    resolveNodeRuntimeClassification({ type: "leaflisp", args: {} });
  const sideEffect = assertSideEffectMetadata({ classification, sideEffectMetadata });
  return Object.freeze({
    spellName,
    runtimeTargetKey: classification.runtimeTargetKey,
    runtimeClass: classification.runtimeClass,
    trigger: classification.trigger,
    sideEffect,
    inherited: declaredClassification === undefined && inheritedClassification !== undefined,
  });
};

const validateLoopReplayPolicy = ({
  maxIterations = DEFAULT_MAX_LOOP_ITERATIONS,
  replayMode = "manual-replay",
  audit = true,
} = {}) => {
  if (!Number.isInteger(maxIterations) || maxIterations <= 0) {
    throw new DynamicCompositePolicyError("maxIterations must be a positive integer.", {
      field: "maxIterations",
      value: maxIterations,
    });
  }
  if (maxIterations > MAX_ALLOWED_LOOP_ITERATIONS) {
    throw new DynamicCompositePolicyError("maxIterations exceeds the runtime safety limit.", {
      field: "maxIterations",
      value: maxIterations,
      maxAllowed: MAX_ALLOWED_LOOP_ITERATIONS,
    });
  }
  if (!["manual-replay", "bounded-loop"].includes(replayMode)) {
    throw new DynamicCompositePolicyError("Unsupported loop replay mode.", {
      field: "replayMode",
      value: replayMode,
    });
  }
  return Object.freeze({
    maxIterations,
    replayMode,
    audit,
    bounded: true,
  });
};

const createLoopReplayAttemptEvent = ({
  inputEvent,
  attemptIndex,
  policy,
  eventId,
  sourceNodeId = "leafloopyspell",
  observability = {},
} = {}) => {
  const event = assertRuntimeEnvelope(inputEvent, "inputEvent");
  const loopPolicy = validateLoopReplayPolicy(policy);
  if (
    !Number.isInteger(attemptIndex) ||
    attemptIndex < 1 ||
    attemptIndex > loopPolicy.maxIterations
  ) {
    throw new DynamicCompositePolicyError("Loop replay attempt is outside the declared bounds.", {
      field: "attemptIndex",
      value: attemptIndex,
      maxIterations: loopPolicy.maxIterations,
    });
  }
  const envelope = createDataEnvelope(unwrapRuntimeEnvelope(event), {
    eventId: assertEventId(eventId),
    sourceNodeId,
    graphInstanceId: event.graphInstanceId,
    sequence: event.sequence,
    parentEventIds: collectParentEventIds([event]),
    trigger: "bounded_loop_replay",
    trace: {
      dynamic: "leafloopyspell",
      attemptIndex,
      maxIterations: loopPolicy.maxIterations,
      replayMode: loopPolicy.replayMode,
      causeEventId: event.eventId,
    },
  });
  emitTrace(observability.traceSink ?? createNoopTraceSink(), {
    event: "loop_replay_attempt_event",
    eventId: envelope.eventId,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    parentEventIds: envelope.trace.parentEventIds,
    attemptIndex,
    maxIterations: loopPolicy.maxIterations,
    replayMode: loopPolicy.replayMode,
  });
  return envelope;
};

const assertLeafLispDynamicPolicy = ({ helpers = [], declarations = {} } = {}) => {
  const helperMetadata = helpers.map((helper) => {
    if (helper.sideEffecting !== true) {
      return Object.freeze({
        name: helper.name,
        sideEffecting: false,
      });
    }
    const declaration = declarations.helpers?.[helper.name];
    const idempotencyKey = declaration?.idempotencyKey ?? declaration?.idempotency?.key;
    if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
      throw new DynamicCompositePolicyError(
        "Side-effecting leaflisp helpers require declared idempotency metadata.",
        {
          field: `helpers.${helper.name}.idempotencyKey`,
        },
      );
    }
    return Object.freeze({
      name: helper.name,
      sideEffecting: true,
      idempotencyKey: idempotencyKey.trim(),
    });
  });
  return Object.freeze({
    runtimeTargetKey: "node:leaflisp",
    runtimeClass: RUNTIME_CLASSES.PURE_TRANSFORM,
    trigger: "data",
    pureByDefault: true,
    helpers: Object.freeze(helperMetadata),
  });
};

const executeLeafLispPureDataTransform = ({
  inputEvent,
  expression,
  evaluator,
  eventId,
  sourceNodeId = "leaflisp",
  helpers = [],
  declarations = {},
  observability = {},
} = {}) => {
  const event = assertRuntimeEnvelope(inputEvent, "inputEvent");
  if (event.eventKind !== "data") {
    throw new DynamicCompositePolicyError("leaflisp pure transforms require a data event.", {
      field: "eventKind",
      value: event.eventKind,
    });
  }
  if (typeof evaluator !== "function") {
    throw new DynamicCompositePolicyError("leaflisp execution requires an evaluator function.", {
      field: "evaluator",
    });
  }
  const policy = assertLeafLispDynamicPolicy({ helpers, declarations });
  const payload = evaluator(unwrapRuntimeEnvelope(event), expression);
  const envelope = createDataEnvelope(payload, {
    eventId: assertEventId(eventId),
    sourceNodeId,
    graphInstanceId: event.graphInstanceId,
    sequence: event.sequence,
    parentEventIds: collectParentEventIds([event]),
    trigger: "data",
    trace: {
      dynamic: "leaflisp",
      pureByDefault: policy.pureByDefault,
      causeEventId: event.eventId,
    },
  });
  emitTrace(observability.traceSink ?? createNoopTraceSink(), {
    event: "leaflisp_pure_transform_event",
    eventId: envelope.eventId,
    eventKind: envelope.eventKind,
    sourceNodeId: envelope.sourceNodeId,
    graphInstanceId: envelope.graphInstanceId,
    parentEventIds: envelope.trace.parentEventIds,
    pureByDefault: policy.pureByDefault,
    payload,
  });
  return envelope;
};

export {
  DynamicCompositePolicyError,
  assertLeafLispDynamicPolicy,
  assertSideEffectMetadata,
  classifyLambdaGraphTrigger,
  createLoopReplayAttemptEvent,
  createNestedGraphExecutionEvent,
  driveLambdaGraphByRuntimePolicy,
  executeLeafLispPureDataTransform,
  resolveSpellInvocationClassification,
  validateLoopReplayPolicy,
};

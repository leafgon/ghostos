import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";

import { executeLEAFlisp } from "../nodelogic/wizardry/leaflisp.js";
import { createRuntimeEnvelopeFactory, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import {
  DynamicCompositePolicyError,
  assertLeafLispDynamicPolicy,
  createLoopReplayAttemptEvent,
  createNestedGraphExecutionEvent,
  driveLambdaGraphByRuntimePolicy,
  executeLeafLispPureDataTransform,
  resolveSpellInvocationClassification,
  validateLoopReplayPolicy,
} from "./dynamicCompositeWorkflow.js";
import {
  resolveLeafElementRuntimeClassification,
  resolveNodeRuntimeClassification,
} from "./nodeClassification.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import { createDeterministicIdFactory } from "./sideEffectMigrationHarness.js";

const flow = () => ({ _stream: new Subject(), _config: {} });

const createEventFactory = (graphInstanceId = "dynamic-composite-policy") =>
  createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

describe("dynamic composite runtime policy helpers", () => {
  it("classifies composite, dynamic, looping, and leaflisp runtime contracts", () => {
    expect(resolveNodeRuntimeClassification({ type: "leafgraph", args: {} })).toMatchObject({
      runtimeClass: "orchestrator",
      trigger: "control-or-data",
      composite: {
        kind: "nested-graph",
        preservesTriggerCause: true,
        preservesParentEventIds: true,
        runtimeTargetContext: true,
      },
    });
    expect(resolveNodeRuntimeClassification({ type: "leaflambdagraph", args: {} })).toMatchObject({
      composite: {
        kind: "lambda-graph",
        dataRecompute: "data-event",
        lifecycleControl: "control-event",
      },
    });
    expect(resolveNodeRuntimeClassification({ type: "leafspell", args: {} })).toMatchObject({
      dynamic: {
        kind: "spell-invocation",
        resolvesClassificationBeforeExecution: true,
        sideEffectMetadataRequired: true,
      },
    });
    expect(resolveNodeRuntimeClassification({ type: "leafloopyspell", args: {} })).toMatchObject({
      dynamic: {
        kind: "looping-spell",
        replay: "bounded-explicit",
        maxIterationsRequired: true,
      },
    });
    expect(resolveNodeRuntimeClassification({ type: "leaflisp", args: {} })).toMatchObject({
      runtimeClass: "pure_transform",
      trigger: "data",
      dynamic: {
        kind: "leaflisp",
        pureByDefault: true,
        hostSideEffectsRequireMetadata: true,
      },
    });
  });

  it("preserves trigger cause, parent causality, and runtime target context for nested graphs", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const hostEvent = eventFactory.data(
      {
        value: "host-input",
        token: "secret-token",
        authorization: "Bearer abc123",
      },
      {
        eventId: "host-event-1",
        sourceNodeId: "host-source",
        parentEventIds: ["root-event"],
        trigger: "source",
      },
    );

    const nestedEvent = createNestedGraphExecutionEvent({
      inputEvent: hostEvent,
      eventId: "nested-event-1",
      sourceNodeId: "leafgraph:child",
      nestedGraphId: "child-graph",
      runtimeTargetKey: "node:leafgraph",
      nestedRuntimeTargetKey: "node:leaflambdagraph",
      observability: {
        traceSink: sinks.traceSink,
      },
    });

    expect(nestedEvent).toMatchObject({
      eventId: "nested-event-1",
      eventKind: "data",
      sourceNodeId: "leafgraph:child",
      graphInstanceId: "dynamic-composite-policy",
      trace: {
        trigger: "source",
        composite: "nested-graph",
        nestedGraphId: "child-graph",
        runtimeTargetKey: "node:leafgraph",
        nestedRuntimeTargetKey: "node:leaflambdagraph",
        causeEventId: "host-event-1",
        parentEventIds: ["host-event-1", "root-event"],
      },
    });
    expect(unwrapRuntimeEnvelope(nestedEvent)).toEqual(unwrapRuntimeEnvelope(hostEvent));
    expect(sinks.snapshot().traces).toEqual([
      expect.objectContaining({
        event: "nested_graph_execution_event",
        runtimeTargetKey: "node:leafgraph",
        nestedRuntimeTargetKey: "node:leaflambdagraph",
        parentEventIds: ["host-event-1", "root-event"],
      }),
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("recomputes lambda graphs on data while treating lifecycle/config as control only", () => {
    const eventFactory = createEventFactory();
    const dataInput = flow();
    const control = flow();
    const metaCtrl$ = new Subject();
    const sinks = createInMemoryRuntimeSinks();
    const outputs = [];
    const decisions = [];

    const lambdaGraph = driveLambdaGraphByRuntimePolicy({
      inflowCtrlObj: control,
      dataInflowObjArr: [dataInput],
      metaCtrl$,
      context: {
        nodeId: "leaflambdagraph:node",
        runtimeTargetKey: "node:leaflambdagraph",
      },
      transformation: {
        leaflogic: (values, _controlValue, runtime) => ({
          value: `${values[0].value}:computed`,
          causeEventId: runtime.event.eventId,
        }),
      },
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    lambdaGraph._stream.subscribe((event) => outputs.push(event));
    lambdaGraph._control._stream.subscribe((event) => decisions.push(event));

    dataInput._stream.next(
      eventFactory.data(
        {
          value: "alpha",
          cookie: "sessionid=abc",
        },
        {
          eventId: "lambda-data-1",
          sourceNodeId: "lambda-source",
          parentEventIds: ["nested-event-1"],
        },
      ),
    );
    control._stream.next(
      eventFactory.control({
        eventId: "lambda-start",
        sourceNodeId: "runtime",
        targetNodeId: "leaflambdagraph:node",
        intent: "start",
      }),
    );
    metaCtrl$.next(
      eventFactory.control({
        eventId: "lambda-config",
        sourceNodeId: "runtime",
        targetNodeId: "leaflambdagraph:node",
        intent: "refresh_config",
      }),
    );

    expect(outputs).toHaveLength(1);
    expect(unwrapRuntimeEnvelope(outputs[0])).toEqual({
      value: "alpha:computed",
      causeEventId: "lambda-data-1",
    });
    expect(outputs[0].trace.parentEventIds).toEqual(["lambda-data-1", "nested-event-1"]);
    expect(decisions.map((event) => [event.decision, event.reason])).toEqual([
      ["execute", "data_recompute"],
      ["skip", "lifecycle_control:start"],
      ["skip", "config_future_execution_only"],
    ]);
    expect(
      sinks
        .snapshot()
        .traces.map((event) => [
          event.decision,
          event.reason,
          event.recompute,
          event.lifecycleControl,
          event.configUpdate,
        ]),
    ).toEqual([
      ["execute", "data_recompute", true, false, false],
      ["skip", "lifecycle_control:start", false, true, false],
      ["skip", "config_future_execution_only", false, false, true],
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("resolves spell classification and rejects side-effecting spells without idempotency metadata", () => {
    const pureLeafLisp = resolveNodeRuntimeClassification({ type: "leaflisp", args: {} });
    const inherited = resolveSpellInvocationClassification({
      spellName: "pure-spell",
      inheritedClassification: pureLeafLisp,
    });

    expect(inherited).toMatchObject({
      spellName: "pure-spell",
      runtimeTargetKey: "node:leaflisp",
      runtimeClass: "pure_transform",
      trigger: "data",
      inherited: true,
      sideEffect: {
        required: false,
      },
    });

    const httpClassification = resolveLeafElementRuntimeClassification("http");
    expect(() =>
      resolveSpellInvocationClassification({
        spellName: "http-spell",
        declaredClassification: httpClassification,
      }),
    ).toThrow(DynamicCompositePolicyError);
    expect(
      resolveSpellInvocationClassification({
        spellName: "http-spell",
        declaredClassification: httpClassification,
        sideEffectMetadata: {
          idempotencyKey: "spell-command-1",
          retry: { maxAttempts: 1 },
          replay: { mode: "manual" },
        },
      }),
    ).toMatchObject({
      spellName: "http-spell",
      runtimeTargetKey: "leafelement:http",
      runtimeClass: "side_effecting_action",
      sideEffect: {
        required: true,
        idempotencyKey: "spell-command-1",
      },
    });
  });

  it("validates bounded loop/replay policy and emits auditable replay attempts", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const inputEvent = eventFactory.data(
      {
        value: "loop-input",
        token: "secret-token",
      },
      {
        eventId: "loop-source-1",
        sourceNodeId: "loop-source",
        parentEventIds: ["lambda-data-1"],
      },
    );
    const policy = validateLoopReplayPolicy({
      maxIterations: 3,
      replayMode: "bounded-loop",
    });

    expect(policy).toMatchObject({
      maxIterations: 3,
      replayMode: "bounded-loop",
      bounded: true,
      audit: true,
    });
    expect(() => validateLoopReplayPolicy({ maxIterations: 0 })).toThrow(
      DynamicCompositePolicyError,
    );
    expect(() => validateLoopReplayPolicy({ maxIterations: 1001 })).toThrow(
      DynamicCompositePolicyError,
    );
    const attempt = createLoopReplayAttemptEvent({
      inputEvent,
      attemptIndex: 2,
      policy,
      eventId: "loop-attempt-2",
      observability: {
        traceSink: sinks.traceSink,
      },
    });

    expect(attempt).toMatchObject({
      eventId: "loop-attempt-2",
      eventKind: "data",
      trace: {
        trigger: "bounded_loop_replay",
        dynamic: "leafloopyspell",
        attemptIndex: 2,
        maxIterations: 3,
        replayMode: "bounded-loop",
        causeEventId: "loop-source-1",
        parentEventIds: ["loop-source-1", "lambda-data-1"],
      },
    });
    expect(() =>
      createLoopReplayAttemptEvent({
        inputEvent,
        attemptIndex: 4,
        policy,
        eventId: "loop-attempt-4",
      }),
    ).toThrow(DynamicCompositePolicyError);
    expect(sinks.snapshot().traces).toEqual([
      expect.objectContaining({
        event: "loop_replay_attempt_event",
        eventId: "loop-attempt-2",
        attemptIndex: 2,
        maxIterations: 3,
      }),
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("keeps leaflisp pure/data-triggered by default and requires metadata for helper side effects", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const inputEvent = eventFactory.data(2, {
      eventId: "leaflisp-input-1",
      sourceNodeId: "leaflisp-source",
    });
    const expression = "(return (+ inport 3))";

    const first = executeLeafLispPureDataTransform({
      inputEvent,
      expression,
      evaluator: executeLEAFlisp,
      eventId: "leaflisp-out-1",
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const second = executeLeafLispPureDataTransform({
      inputEvent,
      expression,
      evaluator: executeLEAFlisp,
      eventId: "leaflisp-out-2",
    });

    expect(unwrapRuntimeEnvelope(first)).toBe(5);
    expect(unwrapRuntimeEnvelope(second)).toBe(5);
    expect(first.trace.parentEventIds).toEqual(["leaflisp-input-1"]);
    expect(() =>
      assertLeafLispDynamicPolicy({
        helpers: [{ name: "fetch", sideEffecting: true }],
      }),
    ).toThrow(DynamicCompositePolicyError);
    expect(
      assertLeafLispDynamicPolicy({
        helpers: [{ name: "fetch", sideEffecting: true }],
        declarations: {
          helpers: {
            fetch: {
              idempotencyKey: "leaflisp-fetch-1",
            },
          },
        },
      }),
    ).toMatchObject({
      runtimeTargetKey: "node:leaflisp",
      runtimeClass: "pure_transform",
      pureByDefault: true,
      helpers: [
        {
          name: "fetch",
          sideEffecting: true,
          idempotencyKey: "leaflisp-fetch-1",
        },
      ],
    });
    expect(sinks.snapshot().traces).toEqual([
      expect.objectContaining({
        event: "leaflisp_pure_transform_event",
        eventId: "leaflisp-out-1",
        pureByDefault: true,
      }),
    ]);
  });
});

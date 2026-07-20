import { describe, expect, it } from "vitest";
import { Subject } from "rxjs";

import {
  ChronosRuntimePolicyError,
  _leafchronosflow,
  assertChronosTimerEvent,
  driveLeafChronosByRuntimePolicy,
  resolveChronosRuntimePolicy,
} from "./leafchronosflow.js";
import {
  createControlEnvelope,
  createRuntimeEnvelopeFactory,
  isRuntimeEnvelope,
  unwrapRuntimeEnvelope,
} from "../../runtime/eventEnvelope.js";
import { resolveNodeRuntimeClassification } from "../../runtime/nodeClassification.js";
import { createInMemoryRuntimeSinks } from "../../runtime/runtimeOptions.js";
import { createDeterministicIdFactory } from "../../runtime/sideEffectMigrationHarness.js";

const buildLambdaCtrl = () => ({
  gos: {
    etaTree: {
      graphcomponents: {
        components: {
          lut: {},
        },
      },
      leafgraph: {
        graph: {
          dataflow: {
            getNodeAttributes: () => ({
              leafnode: {
                data: {
                  leaf: {
                    logic: {
                      type: "leafchronosflow",
                      args: {},
                    },
                  },
                },
              },
            }),
          },
        },
      },
    },
  },
});

describe("leafchronosflow", () => {
  it("passes default multi-source input data asynchronously", async () => {
    const dataflowlogic = await _leafchronosflow.dataflow(buildLambdaCtrl())({
      refnode: "chronos-node",
      refnodedata: {
        leaf: {
          logic: {
            type: "leafchronosflow",
            args: {},
          },
        },
      },
      nodelambda: [],
      contextuallambda: [],
    });

    const sourceA$ = new Subject();
    const sourceB$ = new Subject();
    const ctrl$ = new Subject();
    const output = [];

    const output$obj = dataflowlogic([{ _stream: sourceA$ }, { _stream: sourceB$ }], {
      _stream: ctrl$,
      _config: {},
    });
    const subscription = output$obj._stream.subscribe((value) => output.push(value));

    sourceA$.next("a1");
    expect(output).toEqual(["a1"]);

    sourceB$.next("b1");
    expect(output).toEqual(["a1", "b1"]);

    sourceA$.next("a2");
    expect(output).toEqual(["a1", "b1", "a2"]);

    subscription.unsubscribe();
  });

  it("declares Chronos and async flow as explicit timer policy variants", () => {
    const chronos = resolveNodeRuntimeClassification({ type: "leafchronosflow", args: {} });
    const asyncAlias = resolveNodeRuntimeClassification({ type: "leafasyncflow", args: {} });
    const chronosPolicy = resolveChronosRuntimePolicy({ nodeType: "leafchronosflow" });
    const asyncPolicy = resolveChronosRuntimePolicy({ nodeType: "leafasyncflow" });

    expect(chronos).toMatchObject({
      runtimeClass: "stateful_transform",
      trigger: "timer",
      priority: "P1",
      join: {
        mode: "latest-context",
        triggerSource: "timer",
        allowSamplingLatestData: true,
        timer: {
          eventIdRequired: true,
          sequenceRequired: true,
        },
        checkpoint: {
          retainedState: "latest-data-by-lane",
          replayRequiresCheckpoint: true,
        },
      },
    });
    expect(asyncAlias).toMatchObject({
      trigger: "timer",
      aliasOf: "leafchronosflow",
    });
    expect(chronosPolicy).toMatchObject({
      mode: "policy",
      trigger: "timer",
      join: {
        mode: "latest-context",
        allowSamplingLatestData: true,
      },
      checkpoint: {
        retainedState: "latest-data-by-lane",
        replayRequiresCheckpoint: true,
      },
      ordering: "timer-sequence-then-lane-index",
    });
    expect(asyncPolicy).toMatchObject({
      trigger: "timer",
      aliasOf: "leafchronosflow",
    });
  });

  it("validates timer envelopes before policy execution", () => {
    const eventFactory = createRuntimeEnvelopeFactory({
      graphInstanceId: "chronos-validation",
      idFactory: createDeterministicIdFactory(),
    });
    const timerEvent = eventFactory.timer({
      eventId: "timer-1",
      sourceNodeId: "clock",
      timerId: "chronos-clock",
    });

    expect(assertChronosTimerEvent(timerEvent)).toBe(timerEvent);
    expect(() =>
      assertChronosTimerEvent(
        createControlEnvelope({
          eventId: "control-timer",
          sourceNodeId: "clock",
          graphInstanceId: "chronos-validation",
          intent: "timer_tick",
        }),
      ),
    ).toThrow(ChronosRuntimePolicyError);
    expect(() => assertChronosTimerEvent({ ...timerEvent, sequence: undefined })).toThrow(
      ChronosRuntimePolicyError,
    );
  });

  it("suppresses data and control-only ticks but samples latest data on timer events", () => {
    const workflow = createChronosPolicyWorkflow();

    workflow.sendData(0, "a1", { eventId: "a1", parentEventIds: ["root-a"] });
    workflow.sendData(1, "b1", { eventId: "b1", parentEventIds: ["root-b"] });
    workflow.sendControlTick({ eventId: "control-after-data" });
    workflow.sendData(0, "a2", { eventId: "a2" });

    expect(workflow.outputs).toEqual([]);

    workflow.sendTimer({ eventId: "timer-1" });

    expect(workflow.outputs).toHaveLength(1);
    expect(isRuntimeEnvelope(workflow.outputs[0])).toBe(true);
    expect(unwrapRuntimeEnvelope(workflow.outputs[0])).toMatchObject({
      values: ["a2", "b1"],
      cause: {
        eventId: "timer-1",
        eventKind: "timer",
        sequence: 1,
        sourceNodeId: "clock",
        trigger: "timer",
      },
    });
    expect(workflow.outputs[0].trace.parentEventIds).toEqual(["timer-1", "a2", "b1", "root-b"]);
    expect(workflow.decisionReasons()).toEqual([
      ["skip", "not_timer", "data"],
      ["skip", "not_timer", "data"],
      ["skip", "not_timer", "control"],
      ["skip", "not_timer", "data"],
      ["execute", "timer", "timer"],
    ]);
    expect(workflow.timerTrace()).toMatchObject({
      eventId: "timer-1",
      eventKind: "timer",
      sequence: 1,
      sourceNodeId: "clock",
      trigger: "timer",
      actualExecute: true,
    });
  });

  it("keeps timer output order deterministic for fixed input and timer sequences", () => {
    const runSequence = () => {
      const workflow = createChronosPolicyWorkflow("leafasyncflow");

      workflow.sendData(0, "a1", { eventId: "a1" });
      workflow.sendTimer({ eventId: "timer-1" });
      workflow.sendData(1, "b1", { eventId: "b1" });
      workflow.sendTimer({ eventId: "timer-2" });

      return workflow.outputs.map((event) => unwrapRuntimeEnvelope(event));
    };

    expect(runSequence()).toEqual([
      {
        values: ["a1"],
        cause: {
          eventId: "timer-1",
          eventKind: "timer",
          sequence: 1,
          sourceNodeId: "clock",
          trigger: "timer",
        },
      },
      {
        values: ["a1", "b1"],
        cause: {
          eventId: "timer-2",
          eventKind: "timer",
          sequence: 2,
          sourceNodeId: "clock",
          trigger: "timer",
        },
      },
    ]);
    expect(runSequence()).toEqual(runSequence());
  });
});

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const createChronosPolicyWorkflow = (nodeType = "leafchronosflow") => {
  const graphInstanceId = `chronos-policy-${nodeType}`;
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });
  const dataInputs = [flow(), flow()];
  const control = controlFlow();
  const sinks = createInMemoryRuntimeSinks();
  const outputs = [];

  const output = driveLeafChronosByRuntimePolicy({
    nodeType,
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    context: {
      nodeId: "chronos-node",
      runtimeTargetKey: `node:${nodeType}`,
    },
    transformation: {
      leaflogic: (values, _controlValue, runtime) => ({
        values: values.map((value) => value.value),
        cause: {
          eventId: runtime.event.eventId,
          eventKind: runtime.event.eventKind,
          sequence: runtime.event.sequence,
          sourceNodeId: runtime.event.sourceNodeId,
          trigger: runtime.decision.reason,
        },
      }),
    },
    observability: {
      traceSink: sinks.traceSink,
    },
  });
  output._stream.subscribe((event) => outputs.push(event));

  return {
    outputs,
    sendData: (laneIndex, value, { eventId, parentEventIds = [] } = {}) => {
      dataInputs[laneIndex]._stream.next(
        eventFactory.data(
          {
            laneIndex,
            value,
          },
          {
            eventId,
            sourceNodeId: laneIndex === 0 ? "source-a" : "source-b",
            parentEventIds,
          },
        ),
      );
    },
    sendControlTick: ({ eventId } = {}) => {
      control._stream.next(
        eventFactory.control({
          eventId,
          sourceNodeId: "runtime",
          targetNodeId: "chronos-node",
          intent: "legacy_tick",
        }),
      );
    },
    sendTimer: ({ eventId } = {}) => {
      control._stream.next(
        eventFactory.timer({
          eventId,
          sourceNodeId: "clock",
          timerId: "chronos-clock",
        }),
      );
    },
    decisionReasons: () =>
      sinks
        .snapshot()
        .traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => [event.decision, event.reason, event.eventKind]),
    timerTrace: () =>
      sinks
        .snapshot()
        .traces.find(
          (event) => event.event === "policy_driver_decision" && event.eventKind === "timer",
        ),
  };
};

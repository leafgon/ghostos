import { describe, expect, it } from "vitest";
import { Subject } from "rxjs";

import {
  MixflowRuntimePolicyError,
  driveLeafMixflowByRuntimePolicy,
  resolveLeafMixflowJoinPolicy,
} from "./leafmixflow.js";
import { driveLeafGateflowByRuntimePolicy, evaluateLeafGateflowData } from "./leafgateflow.js";
import { doBottle } from "../datautils/bottling.js";
import {
  createRuntimeEnvelopeFactory,
  unwrapRuntimeEnvelope,
} from "../../runtime/eventEnvelope.js";
import { resolveNodeRuntimeClassification } from "../../runtime/nodeClassification.js";
import { createInMemoryRuntimeSinks } from "../../runtime/runtimeOptions.js";
import { createDeterministicIdFactory } from "../../runtime/sideEffectMigrationHarness.js";

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const createEventFactory = (graphInstanceId) =>
  createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });

const createMixWorkflow = (mode) => {
  const eventFactory = createEventFactory(`mix-${mode}`);
  const dataInputs = [flow(), flow()];
  const control = controlFlow();
  const metaCtrl$ = new Subject();
  const sinks = createInMemoryRuntimeSinks();
  const outputs = [];

  const output = driveLeafMixflowByRuntimePolicy({
    mode,
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    metaCtrl$,
    context: {
      nodeId: "mix-node",
      runtimeTargetKey: "node:leafmixflow",
    },
    transformation: {
      leaflogic: (values, _controlValue, runtime) => ({
        laneValues: values.map((value) => value.value),
        laneIndexes: values.map((value) => value.laneIndex),
        causeLaneIndex: runtime.event.payload?.laneIndex,
        causeEventId: runtime.event.eventId,
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
            laneId: laneIndex === 0 ? "source_a" : "source_b",
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
          targetNodeId: "mix-node",
          intent: "legacy_tick",
        }),
      );
    },
    sendConfigRefresh: ({ eventId } = {}) => {
      metaCtrl$.next(
        eventFactory.control({
          eventId,
          sourceNodeId: "runtime",
          targetNodeId: "mix-node",
          intent: "refresh_config",
          legacyControlPayload: { version: eventId },
        }),
      );
    },
    decisionReasons: () =>
      sinks
        .snapshot()
        .traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => [event.decision, event.reason, event.eventKind, event.laneIndex]),
  };
};

const createGateWorkflow = ({ gatekey = "kind=allow", toggledatakey = false } = {}) => {
  const eventFactory = createEventFactory("gate-policy");
  const dataInputs = [flow()];
  const control = controlFlow();
  const metaCtrl$ = new Subject();
  const sinks = createInMemoryRuntimeSinks();
  const outputs = [];

  const output = driveLeafGateflowByRuntimePolicy({
    gatekey,
    toggledatakey,
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    metaCtrl$,
    context: {
      nodeId: "gate-node",
      runtimeTargetKey: "node:leafgateflow",
    },
    observability: {
      traceSink: sinks.traceSink,
    },
  });
  output._stream.subscribe((event) => outputs.push(event));

  return {
    outputs,
    sendData: (value, { eventId, parentEventIds = [] } = {}) => {
      dataInputs[0]._stream.next(
        eventFactory.data(value, {
          eventId,
          sourceNodeId: "gate-source",
          parentEventIds,
        }),
      );
    },
    sendControlTick: ({ eventId } = {}) => {
      control._stream.next(
        eventFactory.control({
          eventId,
          sourceNodeId: "runtime",
          targetNodeId: "gate-node",
          intent: "legacy_tick",
        }),
      );
    },
    sendConfigRefresh: ({ eventId } = {}) => {
      metaCtrl$.next(
        eventFactory.control({
          eventId,
          sourceNodeId: "runtime",
          targetNodeId: "gate-node",
          intent: "refresh_config",
          legacyControlPayload: { version: eventId },
        }),
      );
    },
    noOutputTraces: () =>
      sinks.snapshot().traces.filter((event) => event.event === "policy_driver_no_output"),
    decisionReasons: () =>
      sinks
        .snapshot()
        .traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => [event.decision, event.reason, event.eventKind]),
  };
};

describe("leafmixflow runtime policy helpers", () => {
  it("maps legacy mix modes to declared join policies", () => {
    expect(resolveNodeRuntimeClassification({ type: "leafmixflow", args: {} }).join).toMatchObject({
      supportedModes: {
        merge: { trigger: "any-input", join: { mode: "any-input" } },
        concat: { trigger: "primary-input", join: { mode: "primary-input" } },
        combine: { trigger: "all-inputs", join: { mode: "all-inputs" } },
        combineLatest: { trigger: "all-inputs", join: { mode: "latest-context" } },
      },
    });
    expect(resolveLeafMixflowJoinPolicy({ mode: "merge" })).toMatchObject({
      mixMode: "merge",
      trigger: "any-input",
      join: { mode: "any-input" },
    });
    expect(resolveLeafMixflowJoinPolicy({ mode: "concat" })).toMatchObject({
      trigger: "primary-input",
      join: { mode: "primary-input", primaryInputIndex: 0 },
    });
    expect(resolveLeafMixflowJoinPolicy({ mode: "latest" })).toMatchObject({
      mixMode: "combineLatest",
      trigger: "all-inputs",
      join: { mode: "latest-context" },
    });
    expect(() => resolveLeafMixflowJoinPolicy({ mode: "mystery" })).toThrow(
      MixflowRuntimePolicyError,
    );
  });

  it("executes any-input merge policy on data while suppressing control and config ticks", () => {
    const workflow = createMixWorkflow("merge");

    workflow.sendData(0, "a1", { eventId: "a1", parentEventIds: ["root-a"] });
    workflow.sendControlTick({ eventId: "control-after-a1" });
    workflow.sendConfigRefresh({ eventId: "config-after-a1" });
    workflow.sendData(1, "b1", { eventId: "b1" });

    expect(workflow.outputs.map((event) => unwrapRuntimeEnvelope(event))).toEqual([
      {
        laneValues: ["a1"],
        laneIndexes: [0],
        causeLaneIndex: 0,
        causeEventId: "a1",
      },
      {
        laneValues: ["b1"],
        laneIndexes: [1],
        causeLaneIndex: 1,
        causeEventId: "b1",
      },
    ]);
    expect(workflow.outputs[0].trace.parentEventIds).toEqual(["a1", "root-a"]);
    expect(workflow.decisionReasons()).toEqual([
      ["execute", "any-input", "data", 0],
      ["skip", "not_meaningful_data", "control", 0],
      ["skip", "not_meaningful_data", "control", 0],
      ["execute", "any-input", "data", 1],
    ]);
  });

  it("covers all-input and primary-input policies with deterministic output ordering", () => {
    const allInputs = createMixWorkflow("combine");
    allInputs.sendData(0, "a1", { eventId: "all-a1" });
    allInputs.sendData(1, "b1", { eventId: "all-b1" });
    allInputs.sendData(1, "b2", { eventId: "all-b2" });
    allInputs.sendData(0, "a2", { eventId: "all-a2" });

    expect(allInputs.outputs.map((event) => unwrapRuntimeEnvelope(event).laneValues)).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);
    expect(allInputs.outputs[0].trace.parentEventIds).toEqual(["all-b1", "all-a1"]);

    const primaryInput = createMixWorkflow("concat");
    primaryInput.sendData(1, "ignored-context", { eventId: "primary-b1" });
    primaryInput.sendData(0, "a1", { eventId: "primary-a1" });

    expect(primaryInput.outputs.map((event) => unwrapRuntimeEnvelope(event).laneValues)).toEqual([
      ["a1"],
    ]);
  });
});

describe("leafgateflow runtime policy helpers", () => {
  it("evaluates pass, reject, and NOT-gate decisions without mutating payloads", () => {
    const passBottle = doBottle("allow", { ok: true });
    const rejectBottle = doBottle("deny", { ok: false });

    expect(evaluateLeafGateflowData({ value: { kind: "allow" }, gatekey: "kind=allow" })).toEqual({
      kind: "allow",
    });
    expect(evaluateLeafGateflowData({ value: { kind: "deny" }, gatekey: "kind=allow" })).toBe(
      undefined,
    );
    expect(evaluateLeafGateflowData({ value: passBottle, gatekey: "allow" })).toBe(passBottle);
    expect(evaluateLeafGateflowData({ value: rejectBottle, gatekey: "allow" })).toBe(undefined);
    expect(
      evaluateLeafGateflowData({
        value: rejectBottle,
        gatekey: "allow",
        toggledatakey: true,
      }),
    ).toBe(rejectBottle);
  });

  it("passes matching data, suppresses rejected data, and traces no-output decisions", () => {
    const workflow = createGateWorkflow();

    workflow.sendData({ kind: "allow", value: 1 }, { eventId: "gate-pass", parentEventIds: ["p"] });
    workflow.sendData({ kind: "deny", value: 2 }, { eventId: "gate-reject" });
    workflow.sendControlTick({ eventId: "gate-control" });
    workflow.sendConfigRefresh({ eventId: "gate-config" });
    workflow.sendData({ kind: "allow", value: 3 }, { eventId: "gate-future-pass" });

    expect(workflow.outputs.map((event) => unwrapRuntimeEnvelope(event))).toEqual([
      { kind: "allow", value: 1 },
      { kind: "allow", value: 3 },
    ]);
    expect(workflow.outputs[0].trace.parentEventIds).toEqual(["gate-pass", "p"]);
    expect(workflow.noOutputTraces()).toMatchObject([
      {
        reason: "leafgateflow_rejected",
        eventId: "gate-reject",
        eventKind: "data",
      },
    ]);
    expect(workflow.decisionReasons()).toEqual([
      ["execute", "data", "data"],
      ["execute", "data", "data"],
      ["skip", "not_meaningful_data", "control"],
      ["skip", "not_meaningful_data", "control"],
      ["execute", "data", "data"],
    ]);
  });
});

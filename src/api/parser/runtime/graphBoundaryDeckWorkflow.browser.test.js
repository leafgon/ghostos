import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";

import {
  createRuntimeEnvelopeFactory,
  isRuntimeEnvelope,
  unwrapRuntimeEnvelope,
} from "./eventEnvelope.js";
import {
  createDeckInitializationDataEvent,
  createGraphBoundaryInflowDataEvent,
  driveDeckNodeByRuntimePolicy,
  driveGraphOutflowByRuntimePolicy,
  resolveDeckRuntimePolicy,
} from "./graphBoundaryDeckWorkflow.js";
import { resolveNodeRuntimeClassification } from "./nodeClassification.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import { createDeterministicIdFactory } from "./sideEffectMigrationHarness.js";

const flow = () => ({ _stream: new Subject(), _config: {} });

const createEventFactory = (graphInstanceId = "boundary-deck-policy") =>
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

describe("graph boundary and deck runtime policy helpers", () => {
  it("classifies graph boundary and deck nodes with explicit policy metadata", () => {
    expect(resolveNodeRuntimeClassification({ type: "leafinflowport", args: {} })).toMatchObject({
      runtimeClass: "source",
      trigger: "data",
      boundary: {
        direction: "in",
        createsDataEnvelope: true,
        preservesParentEventIds: true,
      },
    });
    expect(resolveNodeRuntimeClassification({ type: "leafoutflowport", args: {} })).toMatchObject({
      runtimeClass: "sink",
      trigger: "primary-input",
      boundary: {
        direction: "out",
        forwardNewDataOnly: true,
        preservesParentEventIds: true,
      },
    });
    expect(resolveNodeRuntimeClassification({ type: "leafdeckspade", args: {} })).toMatchObject({
      trigger: "all-inputs",
      join: { mode: "all-inputs" },
      deck: { role: "spade", aggregation: "all-inputs" },
    });
    expect(resolveNodeRuntimeClassification({ type: "leafdeckdiamond", args: {} })).toMatchObject({
      trigger: "data",
      deck: { role: "diamond", aggregation: "data" },
    });
    expect(resolveDeckRuntimePolicy({ role: "heart" })).toMatchObject({
      mode: "policy",
      trigger: "all-inputs",
      join: { mode: "all-inputs" },
    });
  });

  it("wraps graph input into data envelopes with parent event identity and redacted traces", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const parentEvent = eventFactory.data(
      {
        input: "host",
        token: "secret-token",
      },
      {
        eventId: "host-parent",
        sourceNodeId: "host",
        parentEventIds: ["root-event"],
      },
    );

    const graphInput = createGraphBoundaryInflowDataEvent({
      payload: {
        graphValue: "inside",
        authorization: "Bearer abc123",
        cookie: "sessionid=abc",
      },
      eventId: "graph-input-1",
      sourceNodeId: "leafinflowport:input",
      graphInstanceId: "boundary-deck-policy",
      parentEvent,
      parentEventIds: ["explicit-parent"],
      observability: {
        traceSink: sinks.traceSink,
      },
    });

    expect(graphInput).toMatchObject({
      eventId: "graph-input-1",
      eventKind: "data",
      sourceNodeId: "leafinflowport:input",
      payloadKind: "raw",
      trace: {
        trigger: "graph_input",
        boundary: "inflow",
        parentEventIds: ["host-parent", "root-event", "explicit-parent"],
      },
    });
    expect(unwrapRuntimeEnvelope(graphInput)).toEqual({
      graphValue: "inside",
      authorization: "Bearer abc123",
      cookie: "sessionid=abc",
    });
    expect(sinks.snapshot().traces).toEqual([
      expect.objectContaining({
        event: "graph_boundary_inflow_event",
        boundary: "inflow",
        eventId: "graph-input-1",
        parentEventIds: ["host-parent", "root-event", "explicit-parent"],
      }),
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("forwards graph output data once, suppresses control/config ticks, and unwraps legacy output", () => {
    const eventFactory = createEventFactory();
    const dataInput = flow();
    const control = flow();
    const metaCtrl$ = new Subject();
    const runtimeSinks = createInMemoryRuntimeSinks();
    const legacySinks = createInMemoryRuntimeSinks();
    const runtimeOutputs = [];
    const legacyOutputs = [];

    const runtimeOutflow = driveGraphOutflowByRuntimePolicy({
      inflowCtrlObj: control,
      dataInflowObjArr: [dataInput],
      metaCtrl$,
      context: {
        nodeId: "leafoutflowport:runtime",
        runtimeTargetKey: "node:leafoutflowport",
      },
      observability: {
        traceSink: runtimeSinks.traceSink,
      },
    });
    const legacyOutflow = driveGraphOutflowByRuntimePolicy({
      inflowCtrlObj: control,
      dataInflowObjArr: [dataInput],
      metaCtrl$,
      context: {
        nodeId: "leafoutflowport:legacy",
        runtimeTargetKey: "node:leafoutflowport",
      },
      observability: {
        traceSink: legacySinks.traceSink,
      },
      compatibilityMode: "legacy",
    });
    runtimeOutflow._stream.subscribe((event) => runtimeOutputs.push(event));
    legacyOutflow._stream.subscribe((event) => legacyOutputs.push(event));

    dataInput._stream.next(
      eventFactory.data(
        {
          value: "graph-result",
          token: "secret-token",
        },
        {
          eventId: "graph-data-1",
          sourceNodeId: "leafinflowport:input",
          parentEventIds: ["host-parent"],
        },
      ),
    );
    control._stream.next(
      eventFactory.control({
        eventId: "control-after-data",
        sourceNodeId: "runtime",
        targetNodeId: "leafoutflowport",
        intent: "legacy_tick",
      }),
    );
    metaCtrl$.next(
      eventFactory.control({
        eventId: "config-after-data",
        sourceNodeId: "runtime",
        targetNodeId: "leafoutflowport",
        intent: "refresh_config",
      }),
    );

    expect(runtimeOutputs).toHaveLength(1);
    expect(runtimeOutputs[0].trace.parentEventIds).toEqual(["graph-data-1", "host-parent"]);
    expect(unwrapRuntimeEnvelope(runtimeOutputs[0])).toEqual({
      value: "graph-result",
      token: "secret-token",
    });
    expect(legacyOutputs).toEqual([
      {
        value: "graph-result",
        token: "secret-token",
      },
    ]);
    expect(isRuntimeEnvelope(legacyOutputs[0])).toBe(false);
    expect(
      runtimeSinks
        .snapshot()
        .traces.map((event) => [event.decision, event.reason, event.eventKind]),
    ).toEqual([
      ["execute", "primary-input", "data"],
      ["skip", "not_primary_input", "control"],
      ["skip", "not_primary_input", "control"],
    ]);
    assertNoSecretLeak(runtimeSinks.snapshot().traces);
  });

  it("aggregates spade and heart decks by all inputs with lane-order output and parent IDs", () => {
    const eventFactory = createEventFactory();
    const dataInputs = [flow(), flow()];
    const control = flow();
    const metaCtrl$ = new Subject();
    const sinks = createInMemoryRuntimeSinks();
    const spadeOutputs = [];
    const heartOutputs = [];

    const createDeck = (role, outputList) => {
      const deck = driveDeckNodeByRuntimePolicy({
        role,
        inflowCtrlObj: control,
        dataInflowObjArr: dataInputs,
        metaCtrl$,
        context: {
          nodeId: `leafdeck${role}`,
          runtimeTargetKey: `node:leafdeck${role}`,
        },
        transformation: {
          leaflogic: (values, _control, runtime) => ({
            role,
            laneValues: values.map((value) => value.value),
            causeEventId: runtime.event.eventId,
            causeLaneIndex: runtime.laneIndex,
          }),
        },
        observability: {
          traceSink: sinks.traceSink,
        },
      });
      deck._stream.subscribe((event) => outputList.push(event));
    };
    createDeck("spade", spadeOutputs);
    createDeck("heart", heartOutputs);

    dataInputs[1]._stream.next(
      eventFactory.data(
        { value: "b1", authorization: "Bearer abc123" },
        { eventId: "lane-b1", sourceNodeId: "lane-b" },
      ),
    );
    control._stream.next(
      eventFactory.control({
        eventId: "control-after-b1",
        sourceNodeId: "runtime",
        targetNodeId: "leafdeckspade",
        intent: "legacy_tick",
      }),
    );
    metaCtrl$.next(
      eventFactory.control({
        eventId: "config-after-b1",
        sourceNodeId: "runtime",
        targetNodeId: "leafdeckspade",
        intent: "refresh_config",
      }),
    );
    dataInputs[0]._stream.next(
      eventFactory.data(
        { value: "a1", token: "secret-token" },
        { eventId: "lane-a1", sourceNodeId: "lane-a", parentEventIds: ["root-a"] },
      ),
    );
    dataInputs[0]._stream.next(
      eventFactory.data({ value: "a2" }, { eventId: "lane-a2", sourceNodeId: "lane-a" }),
    );
    dataInputs[1]._stream.next(
      eventFactory.data(
        { value: "b2", cookie: "sessionid=abc" },
        { eventId: "lane-b2", sourceNodeId: "lane-b" },
      ),
    );

    expect(spadeOutputs.map((event) => unwrapRuntimeEnvelope(event))).toEqual([
      {
        role: "spade",
        laneValues: ["a1", "b1"],
        causeEventId: "lane-a1",
        causeLaneIndex: 0,
      },
      {
        role: "spade",
        laneValues: ["a2", "b2"],
        causeEventId: "lane-b2",
        causeLaneIndex: 1,
      },
    ]);
    expect(heartOutputs.map((event) => unwrapRuntimeEnvelope(event).laneValues)).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);
    expect(spadeOutputs[0].trace.parentEventIds).toEqual(["lane-a1", "root-a", "lane-b1"]);
    expect(spadeOutputs[1].trace.parentEventIds).toEqual(["lane-a2", "lane-b2"]);
    expect(
      sinks
        .snapshot()
        .traces.filter((event) => event.deckRole === "spade")
        .map((event) => [event.decision, event.reason, event.eventKind]),
    ).toEqual([
      ["skip", "waiting_for_all_inputs", "data"],
      ["skip", "waiting_for_all_inputs", "control"],
      ["skip", "waiting_for_all_inputs", "control"],
      ["execute", "all-inputs", "data"],
      ["skip", "waiting_for_all_inputs", "data"],
      ["execute", "all-inputs", "data"],
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("keeps diamond data-driven and does not rebroadcast on control or config ticks", () => {
    const eventFactory = createEventFactory();
    const dataInput = flow();
    const control = flow();
    const metaCtrl$ = new Subject();
    const sinks = createInMemoryRuntimeSinks();
    const outputs = [];

    const diamond = driveDeckNodeByRuntimePolicy({
      role: "diamond",
      inflowCtrlObj: control,
      dataInflowObjArr: [dataInput],
      metaCtrl$,
      context: {
        nodeId: "leafdeckdiamond",
        runtimeTargetKey: "node:leafdeckdiamond",
      },
      transformation: {
        leaflogic: (values, _control, runtime) => ({
          value: values[0].value,
          causeEventId: runtime.event.eventId,
        }),
      },
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    diamond._stream.subscribe((event) => outputs.push(event));

    dataInput._stream.next(eventFactory.data({ value: "diamond-data" }, { eventId: "diamond-1" }));
    control._stream.next(
      eventFactory.control({
        eventId: "diamond-control",
        sourceNodeId: "runtime",
        targetNodeId: "leafdeckdiamond",
        intent: "legacy_tick",
      }),
    );
    metaCtrl$.next(
      eventFactory.control({
        eventId: "diamond-config",
        sourceNodeId: "runtime",
        targetNodeId: "leafdeckdiamond",
        intent: "refresh_config",
      }),
    );

    expect(outputs).toHaveLength(1);
    expect(unwrapRuntimeEnvelope(outputs[0])).toEqual({
      value: "diamond-data",
      causeEventId: "diamond-1",
    });
    expect(outputs[0].trace.parentEventIds).toEqual(["diamond-1"]);
    expect(
      sinks.snapshot().traces.map((event) => [event.decision, event.reason, event.eventKind]),
    ).toEqual([
      ["execute", "data", "data"],
      ["skip", "not_meaningful_data", "control"],
      ["skip", "not_meaningful_data", "control"],
    ]);
  });

  it("marks club initialization as explicit data rather than lifecycle control", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const parentEvent = eventFactory.control({
      eventId: "graph-start",
      sourceNodeId: "runtime",
      targetNodeId: "leafdeckclub",
      intent: "start",
    });

    const initialization = createDeckInitializationDataEvent({
      payload: {
        deck: "home",
        authorization: "Bearer abc123",
      },
      eventId: "club-init-1",
      sourceNodeId: "leafdeckclub",
      graphInstanceId: "boundary-deck-policy",
      parentEvent,
      observability: {
        traceSink: sinks.traceSink,
      },
    });

    expect(initialization).toMatchObject({
      eventId: "club-init-1",
      eventKind: "data",
      sourceNodeId: "leafdeckclub",
      trace: {
        trigger: "deck_initialization",
        deckRole: "club",
        dataCategory: "initialization",
        parentEventIds: ["graph-start"],
      },
    });
    expect(initialization.intent).toBeUndefined();
    expect(sinks.snapshot().traces).toEqual([
      expect.objectContaining({
        event: "deck_initialization_data_event",
        deckRole: "club",
        dataCategory: "initialization",
        eventId: "club-init-1",
      }),
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });
});

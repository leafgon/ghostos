import { describe, expect, it } from "vitest";
import { Subject } from "rxjs";

import {
  MemoryRuntimePolicyError,
  assertLeafMemoryPersistencePolicy,
  driveLeafMemoryByRuntimePolicy,
} from "./leafmemoryio.js";
import {
  createRuntimeEnvelopeFactory,
  unwrapRuntimeEnvelope,
} from "../../runtime/eventEnvelope.js";
import { resolveNodeRuntimeClassification } from "../../runtime/nodeClassification.js";
import { createInMemoryRuntimeSinks } from "../../runtime/runtimeOptions.js";
import { createDeterministicIdFactory } from "../../runtime/sideEffectMigrationHarness.js";

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

const createMemoryWorkflow = () => {
  const graphInstanceId = "memory-policy";
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });
  const dataInput = flow();
  const control = controlFlow();
  const metaCtrl$ = new Subject();
  const sinks = createInMemoryRuntimeSinks();
  const outputs = [];

  const output = driveLeafMemoryByRuntimePolicy({
    memoryname: "session",
    memoryKey: "session-key",
    inflowCtrlObj: control,
    dataInflowObjArr: [dataInput],
    metaCtrl$,
    context: {
      nodeId: "memory-node",
      runtimeTargetKey: "node:leafmemoryio",
    },
    observability: {
      traceSink: sinks.traceSink,
    },
  });
  output._stream.subscribe((event) => outputs.push(event));

  return {
    memory: output.memory,
    outputs,
    snapshot: () => sinks.snapshot(),
    sendData: (value, { eventId, parentEventIds = [] } = {}) => {
      dataInput._stream.next(
        eventFactory.data(value, {
          eventId,
          sourceNodeId: "memory-source",
          parentEventIds,
        }),
      );
    },
    sendControlTick: ({ eventId } = {}) => {
      control._stream.next(
        eventFactory.control({
          eventId,
          sourceNodeId: "runtime",
          targetNodeId: "memory-node",
          intent: "legacy_tick",
        }),
      );
    },
    sendConfigRefresh: ({ eventId } = {}) => {
      metaCtrl$.next(
        eventFactory.control({
          eventId,
          sourceNodeId: "runtime",
          targetNodeId: "memory-node",
          intent: "refresh_config",
          legacyControlPayload: { version: eventId },
        }),
      );
    },
  };
};

describe("leafmemoryio runtime policy helpers", () => {
  it("classifies default memory as a data-driven stateful transform", () => {
    expect(resolveNodeRuntimeClassification({ type: "leafmemoryio", args: {} })).toMatchObject({
      runtimeClass: "stateful_transform",
      trigger: "data",
      priority: "P1",
      state: {
        updateTrigger: "data",
        ordering: "event-sequence",
        checkpoint: {
          mode: "explicit",
          replayRequiresCheckpoint: true,
        },
        persistence: {
          local: "stateful-transform",
          global: "blocked-until-idempotency-policy",
        },
      },
    });
  });

  it("blocks persistent/global policy mode until idempotency is defined", () => {
    expect(assertLeafMemoryPersistencePolicy({ persistenceMode: "local" })).toBe("local");
    expect(() => assertLeafMemoryPersistencePolicy({ persistenceMode: "global" })).toThrow(
      MemoryRuntimePolicyError,
    );
    expect(() =>
      driveLeafMemoryByRuntimePolicy({
        memoryname: "session",
        persistenceMode: "persistent",
        inflowCtrlObj: controlFlow(),
        dataInflowObjArr: [flow()],
      }),
    ).toThrow(MemoryRuntimePolicyError);
  });

  it("updates memory only on data events and preserves parent IDs", () => {
    const workflow = createMemoryWorkflow();

    workflow.sendData(
      {
        text: "first",
        token: "secret-token",
        authorization: "Bearer abc123",
      },
      { eventId: "data-1", parentEventIds: ["root-1"] },
    );
    workflow.sendControlTick({ eventId: "control-after-data" });
    workflow.sendConfigRefresh({ eventId: "config-after-data" });
    workflow.sendData({ text: "second", cookie: "sessionid=abc" }, { eventId: "data-2" });

    expect(workflow.outputs.map((event) => unwrapRuntimeEnvelope(event))).toMatchObject([
      {
        memoryname: "session",
        memoryKey: "session-key",
        decision: "write",
        stateVersion: 1,
      },
      {
        memoryname: "session",
        memoryKey: "session-key",
        decision: "write",
        stateVersion: 2,
      },
    ]);
    expect(workflow.outputs[0].trace.parentEventIds).toEqual(["data-1", "root-1"]);
    expect(workflow.outputs[1].trace.parentEventIds).toEqual(["data-2"]);

    const memorySnapshot = workflow.memory.snapshot();
    expect(memorySnapshot.current["session-key"]).toMatchObject({
      raw: { text: "second", cookie: "sessionid=abc" },
      stateVersion: 2,
      eventId: "data-2",
      trigger: "data",
    });
    expect(memorySnapshot.history.map((record) => [record.eventId, record.stateVersion])).toEqual([
      ["data-1", 1],
      ["data-2", 2],
    ]);
  });

  it("validates checkpoint-backed replay targets and redacts traces", () => {
    const workflow = createMemoryWorkflow();

    workflow.sendData({ text: "safe", token: "secret-token" }, { eventId: "data-1" });

    const checkpoint = workflow.memory.checkpoint("checkpoint-1");
    const replayTarget = workflow.memory.validateReplay({
      targetEventId: "data-1",
      checkpoint,
    });

    expect(checkpoint).toMatchObject({
      checkpointId: "checkpoint-1",
      stateVersion: 1,
    });
    expect(replayTarget).toMatchObject({
      eventId: "data-1",
      stateVersion: 1,
    });
    expect(() =>
      workflow.memory.validateReplay({
        targetEventId: "missing",
        checkpoint,
      }),
    ).toThrow(MemoryRuntimePolicyError);
    expect(() =>
      workflow.memory.validateReplay({
        targetEventId: "data-1",
      }),
    ).toThrow(MemoryRuntimePolicyError);

    const traces = workflow.snapshot().traces;
    expect(traces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: "leafmemoryio_state_decision",
          runtimeTargetKey: "node:leafmemoryio",
          decision: "write",
          eventId: "data-1",
          trigger: "data",
          stateVersion: 1,
        }),
      ]),
    );
    assertNoSecretLeak(traces);
  });
});

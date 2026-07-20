import { Subject } from "rxjs";
import { describe, expect, it } from "vitest";

import { resolveControlIntent } from "./controlIntentResolver.js";
import { createRuntimeEnvelopeFactory, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import { driveNodeWithRuntimeOptions } from "./policyExecution.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import { redactValue } from "./safeLogging.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const stableHashPrefix = (value) => {
  const input = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
};

const createSourceLifecycleWorkflow = ({ sourceId = "feed" } = {}) => {
  const graphInstanceId = "source-lifecycle-workflow";
  const sourceNodeId = `source:${sourceId}`;
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: (() => {
      let index = 0;
      return (prefix) => {
        index += 1;
        return `${prefix}-${index}`;
      };
    })(),
  });
  const sourceOutflow = flow();
  const control = controlFlow();
  const runtimeSinks = createInMemoryRuntimeSinks();
  const sourceEnvelopes = [];
  const sinkOutputs = [];
  const seenStableRecordIds = new Set();
  let opened = false;
  let paused = false;
  let weakRecordIndex = 0;

  const transform = driveNodeWithRuntimeOptions({
    runtimeTargetKey: "node:source-transform",
    runtimeConfig: {
      featureFlags: {
        enableTriggerPolicy: true,
        dataTriggeredTargets: ["node:source-transform"],
      },
    },
    targetPolicy: {
      trigger: "data",
    },
    inflowCtrlObj: control,
    dataInflowObjArr: [sourceOutflow],
    transformation: {
      leaflogic: ([record], _controlValue, runtime) => ({
        eventId: `sink:${runtime.event.eventId}`,
        parentEventIds: [runtime.event.eventId, ...(runtime.event.trace.parentEventIds ?? [])],
        trigger: runtime.event.trace.trigger,
        sourceId: record.sourceId,
        sourceRecordId: record.sourceRecordId,
        sourceIdentityStrength: record.sourceIdentityStrength,
        sequence: runtime.event.sequence,
        value: record.value,
      }),
    },
    observability: {
      traceSink: runtimeSinks.traceSink,
      metricSink: runtimeSinks.metricSink,
    },
  });
  transform._stream.subscribe((output) => {
    sinkOutputs.push(redactValue(unwrapRuntimeEnvelope(output)));
  });
  transform._control._stream.subscribe(() => {});

  const emitLifecycleTrace = (envelope) => {
    runtimeSinks.traceSink.emit({
      event: "source_lifecycle_control",
      sourceId,
      intent: envelope.intent,
      resolutionReason: envelope.trace.resolutionReason,
      eventId: envelope.eventId,
      legacyControlPayload: envelope.trace.legacyControlPayload,
    });
  };

  const applyControl = (input, options = {}) => {
    const envelope = resolveControlIntent(input, {
      sourceNodeId: "runtime",
      targetNodeId: sourceNodeId,
      graphInstanceId,
      ...options,
    });
    if (envelope.intent === "start") {
      opened = true;
      paused = false;
    } else if (envelope.intent === "stop") {
      opened = false;
      paused = false;
    } else if (envelope.intent === "pause") {
      paused = true;
    } else if (envelope.intent === "resume") {
      paused = false;
    }
    emitLifecycleTrace(envelope);
    return envelope;
  };

  const emitRecord = (record) => {
    if (!opened || paused) {
      runtimeSinks.traceSink.emit({
        event: "source_record_suppressed",
        sourceId,
        opened,
        paused,
        sourceRecordId: record.id,
      });
      return undefined;
    }

    const hasStableId = typeof record.id === "string" && record.id.trim().length > 0;
    const correlationHashPrefix = stableHashPrefix(record);
    const sourceRecordId = hasStableId ? record.id.trim() : undefined;
    if (sourceRecordId && seenStableRecordIds.has(sourceRecordId)) {
      runtimeSinks.traceSink.emit({
        event: "source_record_deduped",
        sourceId,
        sourceRecordId,
      });
      return undefined;
    }
    if (sourceRecordId) {
      seenStableRecordIds.add(sourceRecordId);
    } else {
      weakRecordIndex += 1;
    }

    const envelope = eventFactory.data(
      {
        sourceId,
        sourceRecordId,
        sourceIdentityStrength: sourceRecordId ? "stable" : "weak_correlation",
        correlationHashPrefix: sourceRecordId ? undefined : correlationHashPrefix,
        value: record.value,
      },
      {
        eventId: sourceRecordId
          ? `source:${sourceId}:${sourceRecordId}`
          : `source:${sourceId}:weak:${correlationHashPrefix}:${weakRecordIndex}`,
        sourceNodeId,
        trigger: "source_record",
        parentEventIds: record.parentEventIds ?? [],
        trace: {
          sourceId,
          sourceRecordId,
          sourceIdentityStrength: sourceRecordId ? "stable" : "weak_correlation",
          correlationHashPrefix: sourceRecordId ? undefined : correlationHashPrefix,
        },
      },
    );
    sourceEnvelopes.push(envelope);
    runtimeSinks.traceSink.emit({
      event: "source_record_emitted",
      sourceId,
      eventId: envelope.eventId,
      sourceRecordId,
      sourceIdentityStrength: envelope.trace.sourceIdentityStrength,
      correlationHashPrefix: envelope.trace.correlationHashPrefix,
      sequence: envelope.sequence,
    });
    sourceOutflow._stream.next(envelope);
    return envelope;
  };

  const reconnect = () => {
    const stop = applyControl({ lifecycle: "close" }, { eventId: "reconnect-stop" });
    const start = applyControl({ lifecycle: "open" }, { eventId: "reconnect-start" });
    return { stop, start };
  };

  const snapshot = () =>
    redactValue({
      sourceEnvelopes,
      sinkOutputs,
      traces: runtimeSinks.snapshot().traces,
      metrics: runtimeSinks.snapshot().metrics,
      opened,
      paused,
    });

  return {
    applyControl,
    emitRecord,
    reconnect,
    snapshot,
    sourceEnvelopes,
    sinkOutputs,
  };
};

describe("source subscription lifecycle workflow", () => {
  it("opens through typed start control and emits stable source data envelopes", () => {
    const workflow = createSourceLifecycleWorkflow({ sourceId: "orders" });
    const start = workflow.applyControl(
      {
        lifecycle: "open",
        authorization: "Bearer abc123",
      },
      { eventId: "start-1" },
    );
    const emitted = workflow.emitRecord({
      id: "record-1",
      value: "created",
      parentEventIds: ["control:start"],
    });

    expect(start).toMatchObject({
      intent: "start",
      trace: {
        resolutionReason: "lifecycle_metadata",
      },
    });
    expect(emitted).toMatchObject({
      eventId: "source:orders:record-1",
      sourceNodeId: "source:orders",
      sequence: 1,
      trace: {
        trigger: "source_record",
        parentEventIds: ["control:start"],
        sourceId: "orders",
        sourceRecordId: "record-1",
        sourceIdentityStrength: "stable",
      },
    });
    expect(workflow.sinkOutputs).toEqual([
      {
        eventId: "sink:source:orders:record-1",
        parentEventIds: ["source:orders:record-1", "control:start"],
        trigger: "source_record",
        sourceId: "orders",
        sourceRecordId: "record-1",
        sourceIdentityStrength: "stable",
        sequence: 1,
        value: "created",
      },
    ]);
    assertNoSecretLeak(workflow.snapshot());
  });

  it("pauses downstream processing and resumes without replaying suppressed records", () => {
    const workflow = createSourceLifecycleWorkflow();
    workflow.applyControl({ lifecycle: "open" }, { eventId: "start-1" });
    workflow.emitRecord({ id: "record-1", value: "before-pause" });
    workflow.applyControl({ intent: "pause" }, { eventId: "pause-1" });
    const pausedRecord = workflow.emitRecord({ id: "record-2", value: "during-pause" });
    workflow.applyControl({ intent: "resume" }, { eventId: "resume-1" });
    workflow.emitRecord({ id: "record-3", value: "after-resume" });

    expect(pausedRecord).toBeUndefined();
    expect(workflow.sinkOutputs.map((event) => event.value)).toEqual([
      "before-pause",
      "after-resume",
    ]);
    expect(
      workflow
        .snapshot()
        .traces.filter((event) => event.event === "source_lifecycle_control")
        .map((event) => event.intent),
    ).toEqual(["start", "pause", "resume"]);
    expect(
      workflow
        .snapshot()
        .traces.some(
          (event) =>
            event.event === "source_record_suppressed" && event.sourceRecordId === "record-2",
        ),
    ).toBe(true);
  });

  it("dedupes stable source records across reconnect without replay", () => {
    const workflow = createSourceLifecycleWorkflow();
    workflow.applyControl({ lifecycle: "open" }, { eventId: "start-1" });
    workflow.emitRecord({ id: "record-1", value: "first" });
    workflow.reconnect();
    const duplicate = workflow.emitRecord({ id: "record-1", value: "duplicate" });
    workflow.emitRecord({ id: "record-2", value: "second" });

    expect(duplicate).toBeUndefined();
    expect(workflow.sinkOutputs.map((event) => event.sourceRecordId)).toEqual([
      "record-1",
      "record-2",
    ]);
    expect(workflow.sinkOutputs.map((event) => event.value)).toEqual(["first", "second"]);
    expect(
      workflow.snapshot().traces.some((event) => event.event === "source_record_deduped"),
    ).toBe(true);
  });

  it("uses weak missing-ID correlation without treating it as user-visible identity", () => {
    const workflow = createSourceLifecycleWorkflow();
    workflow.applyControl({ lifecycle: "open" }, { eventId: "start-1" });
    const first = workflow.emitRecord({ value: "missing-id" });
    const second = workflow.emitRecord({ value: "missing-id" });

    expect(first.eventId).not.toBe(second.eventId);
    expect(first.trace.correlationHashPrefix).toBe(second.trace.correlationHashPrefix);
    expect(first.payload.sourceRecordId).toBeUndefined();
    expect(first.payload.sourceIdentityStrength).toBe("weak_correlation");
    expect(workflow.sinkOutputs).toHaveLength(2);
    expect(workflow.sinkOutputs.every((event) => event.sourceRecordId === undefined)).toBe(true);
  });
});

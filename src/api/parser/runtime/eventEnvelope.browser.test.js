import { describe, expect, it } from "vitest";
import { Subject, firstValueFrom } from "rxjs";
import { map, take, toArray } from "rxjs/operators";

import { isBottle } from "../predicates.js";
import { doBottle } from "../nodelogic/datautils/bottling.js";
import {
  RuntimeEnvelopeError,
  createControlEnvelope,
  createDataEnvelope,
  createEnvelopeTraceEvent,
  createLegacyCompatibilityBridge,
  createReplayEnvelope,
  createRetryEnvelope,
  createRuntimeContext,
  createRuntimeEnvelopeFactory,
  isRuntimeEnvelope,
  resolvePayloadKind,
  unwrapControlForLegacy,
  unwrapDataForLegacy,
  unwrapRuntimeEnvelope,
} from "./eventEnvelope.js";

const assertNoEnvelopeLeak = (value) => {
  expect(isRuntimeEnvelope(value)).toBe(false);
  expect(JSON.stringify(value)).not.toContain("__ghostosRuntimeEnvelope");
};

const makeFactory = () => {
  let id = 0;
  return createRuntimeEnvelopeFactory({
    graphInstanceId: "graph-1",
    clock: () => "2026-07-20T00:00:00.000Z",
    idFactory: (prefix) => {
      id += 1;
      return `${prefix}-${id}`;
    },
  });
};

describe("runtime event envelopes", () => {
  it("wraps raw payloads, bottles, and empty sentinels", () => {
    const bottle = doBottle("message", { text: "hello" });
    const rawEnvelope = createDataEnvelope(
      { value: 1 },
      {
        eventId: "evt-raw",
        graphInstanceId: "graph-1",
        sourceNodeId: "node-a",
      },
    );
    const bottleEnvelope = createDataEnvelope(bottle, {
      eventId: "evt-bottle",
      graphInstanceId: "graph-1",
      sourceNodeId: "node-a",
    });
    const emptyEnvelope = createDataEnvelope(doBottle("empty_bottle", "empty_data"), {
      eventId: "evt-empty",
      graphInstanceId: "graph-1",
      sourceNodeId: "node-a",
    });

    expect(rawEnvelope.payloadKind).toBe("raw");
    expect(bottleEnvelope.payloadKind).toBe("bottle");
    expect(emptyEnvelope.payloadKind).toBe("empty_sentinel");
    expect(resolvePayloadKind(undefined)).toBe("empty_sentinel");
    expect(unwrapRuntimeEnvelope(bottleEnvelope)).toBe(bottle);
  });

  it("preserves event IDs, parent event IDs, monotonic sequence, and trigger fields", () => {
    const factory = makeFactory();
    const first = factory.data("a", {
      sourceNodeId: "node-a",
      eventId: "domain-event-1",
      parentEventIds: ["parent-1"],
    });
    const second = factory.data("b", { sourceNodeId: "node-a" });
    const otherSource = factory.data("c", { sourceNodeId: "node-b" });

    expect(first.eventId).toBe("domain-event-1");
    expect(first.trace.parentEventIds).toEqual(["parent-1"]);
    expect(first.trace.trigger).toBe("data");
    expect(second.sequence).toBe(first.sequence + 1);
    expect(otherSource.sequence).toBe(1);
    expect(second.graphInstanceId).toBe("graph-1");
  });

  it("creates control, retry, and replay envelopes with validation", () => {
    const control = createControlEnvelope({
      eventId: "ctrl-1",
      graphInstanceId: "graph-1",
      intent: "refresh_config",
      legacyControlPayload: { _bname: "accio" },
    });
    const retry = createRetryEnvelope({
      eventId: "retry-1",
      graphInstanceId: "graph-1",
      targetAttemptId: "attempt-1",
    });
    const replay = createReplayEnvelope({
      eventId: "replay-1",
      graphInstanceId: "graph-1",
      targetEventId: "event-1",
    });

    expect(control.eventKind).toBe("control");
    expect(control.intent).toBe("refresh_config");
    expect(unwrapControlForLegacy(control)).toEqual({ _bname: "accio" });
    expect(retry.trace.trigger).toBe("retry");
    expect(replay.trace.trigger).toBe("replay");
    expect(() =>
      createRetryEnvelope({ eventId: "retry-missing", graphInstanceId: "graph-1" }),
    ).toThrow(RuntimeEnvelopeError);
    expect(() =>
      createReplayEnvelope({ eventId: "replay-missing", graphInstanceId: "graph-1" }),
    ).toThrow(RuntimeEnvelopeError);
  });

  it("delivers legacy raw payloads and bottles through compatibility datalogic hooks", () => {
    const bottle = doBottle("command", { apiKey: "secret-token", ok: true });
    const envelope = createDataEnvelope(bottle, {
      eventId: "evt-bottle",
      graphInstanceId: "graph-1",
      sourceNodeId: "node-a",
    });
    const seen = [];
    const bridge = createLegacyCompatibilityBridge({
      datalogic: {
        pre: (data) => {
          seen.push({ stage: "pre", isBottle: isBottle(data), bname: data._bname });
          return data;
        },
        post: (data) => {
          seen.push({ stage: "post", isBottle: isBottle(data), bname: data._bname });
          return data;
        },
      },
    });

    const preOutput = bridge.datalogic.pre(envelope);
    const postOutput = bridge.datalogic.post(
      createDataEnvelope(preOutput, {
        eventId: "evt-post",
        graphInstanceId: "graph-1",
        sourceNodeId: "node-b",
        parentEventIds: [envelope.eventId],
      }),
    );

    expect(preOutput).toBe(bottle);
    expect(postOutput).toBe(bottle);
    expect(seen).toEqual([
      { stage: "pre", isBottle: true, bname: "command" },
      { stage: "post", isBottle: true, bname: "command" },
    ]);
    assertNoEnvelopeLeak(preOutput);
    assertNoEnvelopeLeak(postOutput);
  });

  it("does not leak envelopes into compatibility-mode stream emissions", async () => {
    const factory = makeFactory();
    const runtime$ = new Subject();
    const legacy$ = runtime$.pipe(map((event) => unwrapDataForLegacy(event)));
    const outputPromise = firstValueFrom(legacy$.pipe(take(2), toArray()));

    const raw = { payload: "hello" };
    const bottle = doBottle("message", { text: "hi" });
    runtime$.next(factory.data(raw, { sourceNodeId: "node-a" }));
    runtime$.next(factory.data(bottle, { sourceNodeId: "node-a" }));
    const outputs = await outputPromise;

    expect(outputs[0]).toBe(raw);
    expect(outputs[1]).toBe(bottle);
    outputs.forEach(assertNoEnvelopeLeak);
  });

  it("exposes a read-only runtime context separate from legacy payloads", () => {
    const envelope = createDataEnvelope(
      { token: "secret-token" },
      {
        eventId: "evt-context",
        graphInstanceId: "graph-1",
        sourceNodeId: "node-a",
        sequence: 9,
        parentEventIds: ["parent-1"],
      },
    );
    const context = createRuntimeContext(envelope, { targetKey: "node:leaflisp" });

    expect(context).toMatchObject({
      targetKey: "node:leaflisp",
      eventId: "evt-context",
      graphInstanceId: "graph-1",
      sourceNodeId: "node-a",
      sequence: 9,
      payloadKind: "raw",
      trigger: "data",
    });
    expect(context.parentEventIds).toEqual(["parent-1"]);
    expect(Object.isFrozen(context)).toBe(true);
    expect(context).not.toHaveProperty("payload");
  });

  it("redacts envelope trace output and excludes payloads by default", () => {
    const envelope = createDataEnvelope(
      {
        authorization: "Bearer abc123",
        callbackUrl: "https://example.test/a?signature=deadbeef",
      },
      {
        eventId: "evt-secret",
        graphInstanceId: "graph-1",
        sourceNodeId: "node-a",
        parentEventIds: ["parent-1"],
      },
    );

    const defaultTrace = createEnvelopeTraceEvent(envelope, {
      config: { token: "secret-token" },
    });
    const payloadTrace = createEnvelopeTraceEvent(envelope, {}, { includePayload: true });

    expect(defaultTrace).not.toHaveProperty("payload");
    expect(defaultTrace.eventId).toBe("evt-secret");
    expect(defaultTrace.parentEventIds).toEqual(["parent-1"]);
    const serialized = JSON.stringify({ defaultTrace, payloadTrace });
    expect(serialized).not.toContain("Bearer abc123");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("signature=deadbeef");
  });
});

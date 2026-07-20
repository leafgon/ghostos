import { describe, expect, it, vi } from "vitest";

import {
  IDEMPOTENCY_STORE_CAPABILITIES,
  createFakeDurableIdempotencyStore,
  createMemoryIdempotencyStore,
} from "./idempotencyStore.js";
import {
  SIDE_EFFECT_OUTCOMES,
  SideEffectExecutionError,
  createIdempotentSideEffectRunner,
  executeIdempotentSideEffect,
  resolveSideEffectIdempotency,
} from "./sideEffectWrapper.js";

const createAttemptIds = () => {
  let index = 0;
  return () => {
    index += 1;
    return `attempt-${index}`;
  };
};

const createClock = (initial = 0) => {
  let value = initial;
  return {
    now: () => value,
    advance: (ms) => {
      value += ms;
      return value;
    },
  };
};

const runtimeContext = (overrides = {}) => ({
  eventId: "event-1",
  graphInstanceId: "graph-1",
  nodeId: "node-1",
  runtimeTargetKey: "leafelement:hermes",
  tenantId: "tenant-1",
  integrationInstanceId: "integration-1",
  producerId: "producer-1",
  ...overrides,
});

const idempotency = (overrides = {}) => ({
  required: true,
  domainCommandId: "command-1",
  tenantId: "tenant-1",
  integrationInstanceId: "integration-1",
  producerId: "producer-1",
  ...overrides,
});

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

describe("idempotent side-effect wrapper", () => {
  it("derives domain command keys and executes a first command once", async () => {
    const store = createMemoryIdempotencyStore();
    const execute = vi.fn().mockResolvedValue({ statusCode: 202 });

    const result = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext(),
      idFactory: createAttemptIds(),
    });

    expect(result).toMatchObject({
      outcome: SIDE_EFFECT_OUTCOMES.SUCCEEDED,
      idempotencyKey: "tenant-1:integration-1:producer-1:command-1",
      attempts: [
        {
          attemptId: "attempt-1",
          eventId: "event-1",
          originalEventId: "event-1",
        },
      ],
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(store.get(result.idempotencyKey).status).toBe("succeeded");
  });

  it("suppresses concurrent duplicate keys while in-flight", async () => {
    const store = createMemoryIdempotencyStore();
    let release;
    const firstExecution = new Promise((resolve) => {
      release = () => resolve({ ok: true });
    });
    const first = executeIdempotentSideEffect({
      execute: vi.fn().mockReturnValue(firstExecution),
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext(),
      idFactory: createAttemptIds(),
    });
    const duplicate = await executeIdempotentSideEffect({
      execute: vi.fn().mockResolvedValue({ ok: "duplicate" }),
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext({ eventId: "event-duplicate" }),
      idFactory: createAttemptIds(),
    });

    expect(duplicate).toMatchObject({
      outcome: SIDE_EFFECT_OUTCOMES.SUPPRESSED,
      decision: "duplicate_in_flight",
    });
    release();
    expect((await first).outcome).toBe(SIDE_EFFECT_OUTCOMES.SUCCEEDED);
  });

  it("suppresses succeeded duplicates within TTL and executes after TTL eviction", async () => {
    const clock = createClock();
    const store = createMemoryIdempotencyStore({ clock: clock.now, succeededTtlMs: 10 });
    const execute = vi.fn().mockResolvedValue({ ok: true });

    await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext(),
      idFactory: createAttemptIds(),
    });
    const duplicate = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext({ eventId: "event-2" }),
      idFactory: createAttemptIds(),
    });
    expect(duplicate).toMatchObject({
      outcome: SIDE_EFFECT_OUTCOMES.SUPPRESSED,
      decision: "duplicate_succeeded",
    });

    clock.advance(10);
    const fresh = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext({ eventId: "event-3" }),
      idFactory: createAttemptIds(),
    });
    expect(fresh.outcome).toBe(SIDE_EFFECT_OUTCOMES.SUCCEEDED);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("retries retryable failures with the same event and key but new attempt IDs", async () => {
    const store = createMemoryIdempotencyStore();
    const execute = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("timeout"), { code: "timeout" }))
      .mockResolvedValueOnce({ ok: true });

    const result = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext({ eventId: "event-retry" }),
      retry: {
        enabled: true,
        maxAttempts: 2,
        retryableErrors: ["timeout"],
      },
      idFactory: createAttemptIds(),
    });

    expect(result.outcome).toBe(SIDE_EFFECT_OUTCOMES.SUCCEEDED);
    expect(result.attempts).toMatchObject([
      {
        attemptId: "attempt-1",
        eventId: "event-retry",
        originalEventId: "event-retry",
      },
      {
        attemptId: "attempt-2",
        eventId: "event-retry",
        originalEventId: "event-retry",
      },
    ]);
    expect(new Set(result.attempts.map((attempt) => attempt.idempotencyKey))).toEqual(
      new Set(["tenant-1:integration-1:producer-1:command-1"]),
    );
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable failures", async () => {
    const store = createMemoryIdempotencyStore();
    const execute = vi.fn().mockRejectedValue(Object.assign(new Error("bad"), { code: "fatal" }));

    const result = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext(),
      retry: {
        enabled: true,
        maxAttempts: 3,
        retryableErrors: ["timeout"],
      },
      idFactory: createAttemptIds(),
    });

    expect(result).toMatchObject({
      outcome: SIDE_EFFECT_OUTCOMES.FAILED,
      attempts: [
        {
          attemptId: "attempt-1",
        },
      ],
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("suppresses replay of succeeded side effects unless a new domain command ID is supplied", async () => {
    const store = createMemoryIdempotencyStore();
    const execute = vi.fn().mockResolvedValue({ ok: true });

    await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext(),
      idFactory: createAttemptIds(),
    });
    const replay = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency(),
      runtimeContext: runtimeContext({
        eventId: "replay-1",
        originalEventId: "event-1",
      }),
      idFactory: createAttemptIds(),
    });
    const newCommandReplay = await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency({ domainCommandId: "command-2" }),
      runtimeContext: runtimeContext({
        eventId: "replay-2",
        originalEventId: "event-1",
      }),
      idFactory: createAttemptIds(),
    });

    expect(replay).toMatchObject({
      outcome: SIDE_EFFECT_OUTCOMES.SUPPRESSED,
      decision: "duplicate_succeeded",
      originalEventId: "event-1",
    });
    expect(newCommandReplay.outcome).toBe(SIDE_EFFECT_OUTCOMES.SUCCEEDED);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("fails fast for missing idempotency metadata and insufficient production stores", async () => {
    const memoryStore = createMemoryIdempotencyStore();
    const durableStore = createFakeDurableIdempotencyStore();

    await expect(
      executeIdempotentSideEffect({
        execute: vi.fn(),
        idempotencyStore: durableStore,
        idempotency: {},
        runtimeContext: runtimeContext(),
      }),
    ).rejects.toThrow(SideEffectExecutionError);
    await expect(
      executeIdempotentSideEffect({
        execute: vi.fn(),
        idempotencyStore: memoryStore,
        idempotency: idempotency(),
        runtimeContext: runtimeContext(),
        production: true,
        environment: "server",
      }),
    ).rejects.toThrow();
    await expect(
      executeIdempotentSideEffect({
        execute: vi.fn().mockResolvedValue({ ok: true }),
        idempotencyStore: durableStore,
        idempotency: idempotency(),
        runtimeContext: runtimeContext(),
        production: true,
        environment: "server",
      }),
    ).resolves.toMatchObject({
      outcome: SIDE_EFFECT_OUTCOMES.SUCCEEDED,
    });
    expect(durableStore.capabilities.class).toBe(IDEMPOTENCY_STORE_CAPABILITIES.DURABLE);
  });

  it("uses graph-local fallback only when explicitly allowed", () => {
    expect(() =>
      resolveSideEffectIdempotency({
        idempotency: {
          required: true,
        },
        runtimeContext: runtimeContext(),
      }),
    ).toThrow(SideEffectExecutionError);
    expect(
      resolveSideEffectIdempotency({
        idempotency: {
          required: true,
          allowGraphLocalFallback: true,
        },
        runtimeContext: runtimeContext(),
      }),
    ).toMatchObject({
      key: "graph-1:node-1:producer-1:event-1",
      source: "graph-local-fallback",
    });
  });

  it("emits redacted trace and metric events for decisions", async () => {
    const traceSink = { emit: vi.fn() };
    const metricSink = { record: vi.fn() };
    const store = createMemoryIdempotencyStore();
    const execute = vi.fn().mockRejectedValue(
      Object.assign(new Error("failed https://example.test/a?token=secret-token"), {
        code: "timeout",
        config: {
          headers: {
            authorization: "Bearer abc123",
            cookie: "sessionid=abc",
          },
        },
      }),
    );

    await executeIdempotentSideEffect({
      execute,
      idempotencyStore: store,
      idempotency: idempotency({ domainCommandId: "secret-token" }),
      runtimeContext: runtimeContext(),
      retry: {
        enabled: true,
        maxAttempts: 1,
        retryableErrors: ["timeout"],
      },
      observability: {
        traceSink,
        metricSink,
      },
      idFactory: createAttemptIds(),
    });

    expect(traceSink.emit).toHaveBeenCalled();
    expect(metricSink.record).toHaveBeenCalled();
    assertNoSecretLeak(traceSink.emit.mock.calls);
    assertNoSecretLeak(metricSink.record.mock.calls);
  });

  it("serializes side-effect execution by default unless concurrency is explicitly parallel", async () => {
    const runner = createIdempotentSideEffectRunner({ idFactory: createAttemptIds() });
    const orderedEvents = [];
    const makeRun = (name, commandId) =>
      runner.run({
        execute: async () => {
          orderedEvents.push(`start:${name}`);
          await Promise.resolve();
          orderedEvents.push(`end:${name}`);
          return { name };
        },
        idempotencyStore: createMemoryIdempotencyStore(),
        idempotency: idempotency({ domainCommandId: commandId }),
        runtimeContext: runtimeContext({ eventId: `event-${name}` }),
      });

    await Promise.all([makeRun("a", "command-a"), makeRun("b", "command-b")]);
    expect(orderedEvents).toEqual(["start:a", "end:a", "start:b", "end:b"]);

    const parallelRunner = createIdempotentSideEffectRunner({ idFactory: createAttemptIds() });
    const parallelEvents = [];
    await Promise.all([
      parallelRunner.run({
        execute: async () => {
          parallelEvents.push("start:a");
          await Promise.resolve();
          parallelEvents.push("end:a");
          return { ok: "a" };
        },
        idempotencyStore: createMemoryIdempotencyStore(),
        idempotency: idempotency({ domainCommandId: "parallel-a" }),
        runtimeContext: runtimeContext({ eventId: "parallel-a" }),
        executionPolicy: { concurrency: "parallel" },
      }),
      parallelRunner.run({
        execute: async () => {
          parallelEvents.push("start:b");
          await Promise.resolve();
          parallelEvents.push("end:b");
          return { ok: "b" };
        },
        idempotencyStore: createMemoryIdempotencyStore(),
        idempotency: idempotency({ domainCommandId: "parallel-b" }),
        runtimeContext: runtimeContext({ eventId: "parallel-b" }),
        executionPolicy: { concurrency: "parallel" },
      }),
    ]);
    expect(parallelEvents.slice(0, 2).sort()).toEqual(["start:a", "start:b"]);
  });
});

import { describe, expect, it } from "vitest";

import {
  IDEMPOTENCY_RESERVE_DECISIONS,
  IDEMPOTENCY_STATUSES,
  IDEMPOTENCY_STORE_CAPABILITIES,
  IdempotencyStoreError,
  assertProductionIdempotencyStore,
  createFakeDurableBackingStore,
  createFakeDurableIdempotencyStore,
  createFakeServerAuthoritativeIdempotencyStore,
  createMemoryIdempotencyStore,
  validateIdempotencyStoreCapability,
} from "./idempotencyStore.js";

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

const attempt = (attemptId, overrides = {}) => ({
  attemptId,
  scope: "tenant-1:integration-1:producer-1",
  ...overrides,
});

describe("idempotency durable store conformance", () => {
  it("rejects memory stores for production server and worker side effects", () => {
    const memoryStore = createMemoryIdempotencyStore();
    const durableStore = createFakeDurableIdempotencyStore();
    const providerStore = createFakeServerAuthoritativeIdempotencyStore();

    expect(() => assertProductionIdempotencyStore(memoryStore, { environment: "server" })).toThrow(
      IdempotencyStoreError,
    );
    expect(() => assertProductionIdempotencyStore(memoryStore, { environment: "worker" })).toThrow(
      IdempotencyStoreError,
    );
    expect(assertProductionIdempotencyStore(durableStore, { environment: "server" })).toMatchObject(
      {
        class: IDEMPOTENCY_STORE_CAPABILITIES.DURABLE,
        survivesRestart: true,
        sharedAcrossWorkers: true,
      },
    );
    expect(
      assertProductionIdempotencyStore(providerStore, { environment: "worker" }),
    ).toMatchObject({
      class: IDEMPOTENCY_STORE_CAPABILITIES.SERVER_AUTHORITATIVE,
      authoritativeForExternalSideEffects: true,
    });
  });

  it("requires durable stores to declare retention or provider retention delegation", () => {
    const validStore = createFakeDurableIdempotencyStore();
    const invalidStore = {
      ...validStore,
      capabilities: {
        ...validStore.capabilities,
        retention: undefined,
      },
    };

    expect(validateIdempotencyStoreCapability(validStore)).toMatchObject({
      class: IDEMPOTENCY_STORE_CAPABILITIES.DURABLE,
      retention: {
        mode: "declared",
      },
    });
    expect(() => validateIdempotencyStoreCapability(invalidStore)).toThrow(IdempotencyStoreError);
  });

  it("preserves terminal entries across fake durable restart views", () => {
    const clock = createClock();
    const backingStore = createFakeDurableBackingStore();
    const firstView = createFakeDurableIdempotencyStore({
      backingStore,
      clock: clock.now,
    });
    const key = "tenant-1:integration-1:producer-1:command-restart";

    firstView.reserve(key, attempt("attempt-1"));
    firstView.markSucceeded(key, { responseId: "response-1" });

    const restartedView = createFakeDurableIdempotencyStore({
      backingStore,
      clock: clock.now,
    });
    expect(restartedView.get(key)).toMatchObject({
      status: IDEMPOTENCY_STATUSES.SUCCEEDED,
      result: {
        responseId: "response-1",
      },
    });
    expect(restartedView.reserve(key, attempt("attempt-2"))).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_SUCCEEDED,
      shouldExecute: false,
    });
  });

  it("produces one winner and observable duplicates for concurrent fake durable reservations", async () => {
    const backingStore = createFakeDurableBackingStore();
    const workerA = createFakeDurableIdempotencyStore({ backingStore });
    const workerB = createFakeDurableIdempotencyStore({ backingStore });
    const key = "tenant-1:integration-1:producer-1:command-concurrent";

    const [first, second] = await Promise.all([
      Promise.resolve().then(() => workerA.reserve(key, attempt("attempt-a"))),
      Promise.resolve().then(() => workerB.reserve(key, attempt("attempt-b"))),
    ]);
    const decisions = [first.decision, second.decision].sort();

    expect(decisions).toEqual(
      [
        IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_IN_FLIGHT,
        IDEMPOTENCY_RESERVE_DECISIONS.RESERVED,
      ].sort(),
    );
    expect([first, second].filter((result) => result.shouldExecute)).toHaveLength(1);
    expect(workerA.get(key).status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
    expect(workerB.get(key).status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
  });

  it("shares worker views and applies TTL and max-size policies from the same backing store", () => {
    const clock = createClock();
    const backingStore = createFakeDurableBackingStore();
    const workerA = createFakeDurableIdempotencyStore({
      backingStore,
      clock: clock.now,
      maxEntries: 2,
      succeededTtlMs: 10,
      failedTtlMs: 20,
      suppressedTtlMs: 30,
    });
    const workerB = createFakeDurableIdempotencyStore({
      backingStore,
      clock: clock.now,
      maxEntries: 2,
      succeededTtlMs: 10,
      failedTtlMs: 20,
      suppressedTtlMs: 30,
    });

    workerA.reserve("old-success", attempt("attempt-1"));
    workerA.markSucceeded("old-success");
    clock.advance(1);
    workerA.reserve("new-failed", attempt("attempt-2"));
    workerA.markFailed("new-failed", { code: "retryable" }, { retryable: true });
    clock.advance(1);
    workerB.reserve("active-shared", attempt("attempt-3"));

    expect(workerA.get("active-shared").status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
    expect(workerB.get("old-success")).toBeUndefined();
    expect(workerB.get("new-failed").status).toBe(IDEMPOTENCY_STATUSES.FAILED);

    clock.advance(20);
    const sweep = workerA.sweep();
    expect(sweep.evicted.map((entry) => entry.status)).toContain(IDEMPOTENCY_STATUSES.FAILED);
    expect(workerB.get("active-shared").status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
  });

  it("requires explicit stale in-flight recovery before a retry can reserve another attempt", () => {
    const clock = createClock();
    const store = createFakeDurableIdempotencyStore({ clock: clock.now });
    const key = "tenant-1:integration-1:producer-1:command-stale";

    store.reserve(key, attempt("attempt-1", { attemptTimeoutMs: 50 }));
    expect(() =>
      store.recoverStaleInFlight(key, {
        recoveredByAttemptId: "attempt-2",
      }),
    ).toThrow(IdempotencyStoreError);

    clock.advance(50);
    expect(
      store.reserve(
        key,
        attempt("attempt-2", {
          retry: {
            enabled: true,
            maxAttempts: 2,
          },
        }),
      ),
    ).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_IN_FLIGHT,
      shouldExecute: false,
    });

    const recovered = store.recoverStaleInFlight(key, {
      recoveredByAttemptId: "attempt-2",
      reason: "worker_restart",
    });
    expect(recovered).toMatchObject({
      status: IDEMPOTENCY_STATUSES.FAILED,
      retryable: true,
      lastErrorCode: "stale_in_flight",
      recovery: {
        recoveredByAttemptId: "attempt-2",
        reason: "worker_restart",
      },
    });

    expect(store.reserve(key, attempt("attempt-2"))).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.FAILED_RETRY_BLOCKED,
      shouldExecute: false,
    });
    expect(
      store.reserve(
        key,
        attempt("attempt-2", {
          retry: {
            enabled: true,
            maxAttempts: 2,
          },
        }),
      ),
    ).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.RETRY_RESERVED,
      shouldExecute: true,
      entry: {
        attemptId: "attempt-2",
        attemptCount: 2,
      },
    });
  });
});

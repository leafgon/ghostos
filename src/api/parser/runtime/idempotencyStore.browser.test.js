import { describe, expect, it, vi } from "vitest";

import {
  IDEMPOTENCY_RESERVE_DECISIONS,
  IDEMPOTENCY_STATUSES,
  IDEMPOTENCY_STORE_CAPABILITIES,
  IdempotencyStoreError,
  createMemoryIdempotencyStore,
  createScopedIdempotencyKey,
  validateIdempotencyAttempt,
  validateIdempotencyStatus,
  validateRetryPolicy,
  validateTtlMs,
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
  scope: "graph-1:node-1:producer-1",
  ...overrides,
});

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
  expect(serialized).not.toContain("raw-password");
};

describe("memory idempotency store", () => {
  it("declares memory capabilities and atomically observes in-flight reservations", () => {
    const clock = createClock();
    const store = createMemoryIdempotencyStore({ clock: clock.now });
    const key = createScopedIdempotencyKey({
      scope: "graph-1:node-1:producer-1",
      domainKey: "command-1",
    });

    const first = store.reserve(key, attempt("attempt-1"));
    const duplicate = store.reserve(key, attempt("attempt-2"));

    expect(store.capabilities).toMatchObject({
      class: IDEMPOTENCY_STORE_CAPABILITIES.MEMORY,
      authoritativeForExternalSideEffects: false,
    });
    expect(first).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.RESERVED,
      shouldExecute: true,
      created: true,
    });
    expect(first.entry.status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
    expect(duplicate).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_IN_FLIGHT,
      shouldExecute: false,
    });
    expect(duplicate.entry.attemptId).toBe("attempt-1");
    expect(duplicate.entry.attemptCount).toBe(1);
  });

  it("suppresses duplicate attempts after success within TTL and allows a fresh attempt after TTL", () => {
    const clock = createClock(100);
    const store = createMemoryIdempotencyStore({ clock: clock.now, succeededTtlMs: 1000 });
    const key = "graph-1:node-1:producer-1:command-success";

    store.reserve(key, attempt("attempt-1"));
    const succeeded = store.markSucceeded(key, {
      statusCode: 202,
      authorization: "Bearer abc123",
    });

    expect(succeeded.status).toBe(IDEMPOTENCY_STATUSES.SUCCEEDED);
    expect(succeeded.result.authorization).toBe("[redacted]");

    clock.advance(999);
    const duplicate = store.reserve(key, attempt("attempt-2"));
    expect(duplicate).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_SUCCEEDED,
      shouldExecute: false,
    });

    clock.advance(1);
    const fresh = store.reserve(key, attempt("attempt-3"));
    expect(fresh).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.RESERVED,
      shouldExecute: true,
      created: true,
    });
    expect(fresh.entry.attemptId).toBe("attempt-3");
  });

  it("allows failed entries to retry only under retry policy metadata", () => {
    const clock = createClock();
    const store = createMemoryIdempotencyStore({ clock: clock.now });
    const key = "graph-1:node-1:producer-1:command-failed";

    store.reserve(key, attempt("attempt-1"));
    store.markFailed(
      key,
      { code: "timeout", message: "upstream timeout" },
      { retryable: true, retryAfterMs: 50 },
    );

    clock.advance(49);
    expect(store.reserve(key, attempt("attempt-2"))).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.FAILED_RETRY_BLOCKED,
      shouldExecute: false,
    });

    clock.advance(1);
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

    store.markFailed(key, { code: "fatal" }, { retryable: false });
    expect(
      store.reserve(
        key,
        attempt("attempt-3", {
          retry: {
            enabled: true,
            maxAttempts: 3,
          },
        }),
      ),
    ).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.FAILED_RETRY_BLOCKED,
      shouldExecute: false,
    });
  });

  it("records suppressed entries as observable and non-fatal", () => {
    const clock = createClock();
    const store = createMemoryIdempotencyStore({ clock: clock.now, suppressedTtlMs: 100 });
    const key = "graph-1:node-1:producer-1:command-suppressed";

    store.reserve(key, attempt("attempt-1"));
    const suppressed = store.markSuppressed(key, "duplicate-success");

    expect(suppressed).toMatchObject({
      status: IDEMPOTENCY_STATUSES.SUPPRESSED,
      suppressionReason: "duplicate-success",
    });
    expect(store.reserve(key, attempt("attempt-2"))).toMatchObject({
      decision: IDEMPOTENCY_RESERVE_DECISIONS.DUPLICATE_SUPPRESSED,
      shouldExecute: false,
    });
    expect(store.get(key).status).toBe(IDEMPOTENCY_STATUSES.SUPPRESSED);

    clock.advance(100);
    expect(store.sweep().evictedCount).toBe(1);
    expect(store.get(key)).toBeUndefined();
  });

  it("sweeps terminal TTLs without evicting active in-flight attempts", () => {
    const clock = createClock();
    const store = createMemoryIdempotencyStore({
      clock: clock.now,
      succeededTtlMs: 10,
      failedTtlMs: 20,
      suppressedTtlMs: 30,
    });

    store.reserve("key-succeeded", attempt("attempt-succeeded"));
    store.markSucceeded("key-succeeded");
    store.reserve("key-failed", attempt("attempt-failed"));
    store.markFailed("key-failed", { code: "retryable" }, { retryable: true });
    store.reserve("key-suppressed", attempt("attempt-suppressed"));
    store.markSuppressed("key-suppressed");
    store.reserve("key-in-flight", attempt("attempt-active", { attemptTimeoutMs: 15 }));

    clock.advance(29);
    const sweep = store.sweep();

    expect(sweep.evicted.map((entry) => entry.status)).toEqual([
      IDEMPOTENCY_STATUSES.SUCCEEDED,
      IDEMPOTENCY_STATUSES.FAILED,
    ]);
    expect(store.get("key-suppressed").status).toBe(IDEMPOTENCY_STATUSES.SUPPRESSED);
    expect(store.get("key-in-flight").status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);

    clock.advance(1);
    expect(store.sweep().evicted.map((entry) => entry.status)).toEqual([
      IDEMPOTENCY_STATUSES.SUPPRESSED,
    ]);
    expect(store.get("key-in-flight").status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
  });

  it("prefers old terminal entries for max-size eviction and protects in-flight entries", () => {
    const clock = createClock();
    const store = createMemoryIdempotencyStore({ clock: clock.now, maxEntries: 2 });

    store.reserve("old-terminal", attempt("attempt-1"));
    store.markSucceeded("old-terminal");
    clock.advance(1);
    store.reserve("new-terminal", attempt("attempt-2"));
    store.markFailed("new-terminal", { code: "retryable" }, { retryable: true });
    clock.advance(1);
    store.reserve("active", attempt("attempt-3"));

    expect(store.size()).toBe(2);
    expect(store.get("old-terminal")).toBeUndefined();
    expect(store.get("new-terminal").status).toBe(IDEMPOTENCY_STATUSES.FAILED);
    expect(store.get("active").status).toBe(IDEMPOTENCY_STATUSES.IN_FLIGHT);
  });

  it("emits redacted diagnostics without logging full idempotency keys or payloads", () => {
    const traceSink = { emit: vi.fn() };
    const logSink = { debug: vi.fn() };
    const store = createMemoryIdempotencyStore({ traceSink, logSink });
    const key = "graph-1:node-1:producer-1:token=secret-token";

    store.reserve(
      key,
      attempt("attempt-secret", {
        metadata: {
          payload: {
            password: "raw-password",
          },
          headers: {
            authorization: "Bearer abc123",
            cookie: "sessionid=abc",
          },
        },
      }),
    );
    store.markFailed(
      key,
      {
        code: "upstream",
        config: {
          headers: {
            authorization: "Bearer abc123",
          },
        },
      },
      { retryable: true },
    );

    expect(traceSink.emit).toHaveBeenCalled();
    expect(logSink.debug).toHaveBeenCalled();
    const events = traceSink.emit.mock.calls.map(([event]) => event);
    expect(events[0]).toHaveProperty("keyHashPrefix");
    expect(events[0]).not.toHaveProperty("key");
    assertNoSecretLeak(events);
  });

  it("validates keys, scopes, attempts, statuses, TTL, and retry metadata", () => {
    expect(
      createScopedIdempotencyKey({ scope: "tenant:integration:producer", domainKey: "cmd" }),
    ).toBe("tenant:integration:producer:cmd");
    expect(() => createScopedIdempotencyKey({ scope: "", domainKey: "cmd" })).toThrow(
      IdempotencyStoreError,
    );
    expect(() => validateIdempotencyAttempt({ attemptId: "a1" })).toThrow(IdempotencyStoreError);
    expect(() => validateIdempotencyStatus("pending")).toThrow(IdempotencyStoreError);
    expect(() => validateTtlMs(-1)).toThrow(IdempotencyStoreError);
    expect(() => validateRetryPolicy({ enabled: true, maxAttempts: 0 })).toThrow(
      IdempotencyStoreError,
    );

    const store = createMemoryIdempotencyStore();
    expect(() =>
      store.reserve({ payload: { token: "secret-token" } }, attempt("attempt-1")),
    ).toThrow(IdempotencyStoreError);
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "./sideEffectMigrationHarness.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

const createHarness = (options = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "adapter-under-test",
    runtimeTargetKey: "leafelement:adapter-under-test",
    executeSideEffect: vi.fn(({ command, attempt }) => ({
      accepted: true,
      command: command.domainCommandId,
      attemptId: attempt.attemptId,
    })),
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    ...options,
  });

describe("side-effect migration harness", () => {
  it("executes one data command once and suppresses repeated control/config ticks", async () => {
    const executeSideEffect = vi.fn(({ command }) => ({ ok: command.domainCommandId }));
    const harness = createHarness({ executeSideEffect });
    const command = harness.createCommand({ domainCommandId: "command-once" });

    const data = await harness.sendDataCommand(command, { eventId: "data-1" });
    await harness.sendControlTick({ eventId: "ctrl-1" });
    await harness.sendControlTick({ eventId: "ctrl-2" });
    await harness.sendConfigRefresh({ eventId: "config-1" });

    expect(executeSideEffect).toHaveBeenCalledTimes(1);
    expect(data.executions[0]).toMatchObject({
      type: "side_effect_migration_result",
      executionCause: "data",
      result: {
        outcome: "succeeded",
        eventId: "data-1",
      },
    });
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
      "skip",
    ]);
    expect(
      harness
        .snapshot()
        .observability.traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => event.actualExecute),
    ).toEqual([true, false, false, false]);
  });

  it("fails fast through typed harness errors when idempotency key material is missing", async () => {
    const executeSideEffect = vi.fn();
    const harness = createHarness({ executeSideEffect });

    const result = await harness.sendDataCommand(
      {
        payload: {
          value: "missing-domain-command-id",
        },
      },
      { eventId: "data-missing-idempotency" },
    );

    expect(executeSideEffect).not.toHaveBeenCalled();
    expect(result.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
      error: {
        name: "SideEffectExecutionError",
        code: "invalid_side_effect_execution",
      },
    });
    expect(
      result.snapshot.observability.traces.some(
        (event) => event.event === "side_effect_migration_error",
      ),
    ).toBe(true);
  });

  it("fails fast through typed harness errors when the idempotency store is missing", async () => {
    const executeSideEffect = vi.fn();
    const harness = createHarness({
      executeSideEffect,
      idempotencyStore: null,
    });

    const result = await harness.sendDataCommand(
      harness.createCommand({ domainCommandId: "missing-store" }),
      { eventId: "data-missing-store" },
    );

    expect(executeSideEffect).not.toHaveBeenCalled();
    expect(result.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
      error: {
        name: "SideEffectExecutionError",
        code: "invalid_side_effect_execution",
      },
    });
  });

  it("uses the wrapper retry limit and reports the final typed failure event", async () => {
    const executeSideEffect = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("timed out"), { code: "timeout" }));
    const harness = createHarness({
      executeSideEffect,
      retry: {
        enabled: true,
        maxAttempts: 2,
        retryableErrors: ["timeout"],
      },
    });

    const result = await harness.sendDataCommand(
      harness.createCommand({ domainCommandId: "retry-limited" }),
      { eventId: "data-retry" },
    );

    expect(executeSideEffect).toHaveBeenCalledTimes(2);
    expect(result.executions[0]).toMatchObject({
      type: "side_effect_migration_result",
      result: {
        outcome: "failed",
        attempts: [
          {
            attemptCount: 1,
            eventId: "data-retry",
          },
          {
            attemptCount: 2,
            eventId: "data-retry",
          },
        ],
        error: {
          code: "timeout",
        },
      },
    });
  });

  it("suppresses duplicate idempotency keys and records suppression trace and metric output", async () => {
    const executeSideEffect = vi.fn(({ command }) => ({ ok: command.domainCommandId }));
    const harness = createHarness({ executeSideEffect });
    const command = harness.createCommand({ domainCommandId: "duplicate-key" });

    await harness.sendDataCommand(command, { eventId: "data-1" });
    const duplicate = await harness.sendDataCommand(command, { eventId: "data-duplicate" });

    expect(executeSideEffect).toHaveBeenCalledTimes(1);
    expect(duplicate.executions[0]).toMatchObject({
      type: "side_effect_migration_result",
      result: {
        outcome: "suppressed",
        decision: "duplicate_succeeded",
      },
    });
    expect(
      duplicate.snapshot.observability.traces.some(
        (event) => event.event === "side_effect_suppressed",
      ),
    ).toBe(true);
    expect(
      duplicate.snapshot.observability.metrics.some(
        (event) => event.name === "ghostos_side_effect_suppressed_total",
      ),
    ).toBe(true);
  });

  it("models explicit replay through policy sampling and suppresses a repeated replay key", async () => {
    const executeSideEffect = vi.fn(({ command }) => ({ replayed: command.domainCommandId }));
    const harness = createHarness({
      executeSideEffect,
      policy: {
        mode: "policy",
        trigger: "manual-replay",
        join: {
          allowSamplingLatestData: true,
        },
      },
    });
    const command = harness.createCommand({ domainCommandId: "replay-key" });

    await harness.sendDataCommand(command, { eventId: "data-replay-source" });
    const replay = await harness.sendReplay({
      eventId: "replay-1",
      targetEventId: "data-replay-source",
    });
    const duplicateReplay = await harness.sendReplay({
      eventId: "replay-2",
      targetEventId: "data-replay-source",
    });

    expect(executeSideEffect).toHaveBeenCalledTimes(1);
    expect(replay.executions[0]).toMatchObject({
      type: "side_effect_migration_result",
      executionCause: "manual-replay",
      result: {
        outcome: "succeeded",
        eventId: "replay-1",
        originalEventId: "data-replay-source",
      },
    });
    expect(duplicateReplay.executions[0]).toMatchObject({
      result: {
        outcome: "suppressed",
        decision: "duplicate_succeeded",
        originalEventId: "data-replay-source",
      },
    });
  });

  it("keeps harness captures redacted while preserving execution cause", async () => {
    const executeSideEffect = vi.fn(({ command }) => ({
      ok: true,
      authorization: command.payload.authorization,
      callbackUrl: "https://example.test/callback?token=secret-token",
    }));
    const harness = createHarness({ executeSideEffect });

    await harness.sendDataCommand(
      harness.createCommand({
        domainCommandId: "redaction",
        payload: {
          token: "secret-token",
          authorization: "Bearer abc123",
          cookie: "sessionid=abc",
          callbackUrl: "https://example.test/callback?token=secret-token",
        },
      }),
      { eventId: "data-secret" },
    );

    const snapshot = harness.snapshot();
    assertNoSecretLeak(snapshot);
    expect(
      snapshot.observability.traces.some(
        (event) =>
          event.event === "side_effect_migration_execute" && event.executionCause === "data",
      ),
    ).toBe(true);
    expect(
      snapshot.observability.metrics.some(
        (event) =>
          event.name === "ghostos_side_effect_migration_execution_total" &&
          event.labels.executionCause === "data",
      ),
    ).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";

import { doBottle } from "../nodelogic/datautils/bottling.js";
import { createControlEnvelope } from "./eventEnvelope.js";
import {
  CONTROL_RESOLUTION_MODES,
  ControlIntentResolverError,
  resolveControlIntent,
} from "./controlIntentResolver.js";
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

describe("control intent resolver", () => {
  it("accepts already typed control envelopes and validates plain typed controls", () => {
    const typedEnvelope = createControlEnvelope({
      eventId: "typed-start",
      graphInstanceId: "graph-1",
      intent: "start",
    });

    expect(resolveControlIntent(typedEnvelope)).toBe(typedEnvelope);
    expect(
      resolveControlIntent(
        {
          intent: "checkpoint",
          authorization: "Bearer abc123",
        },
        { eventId: "checkpoint-1" },
      ),
    ).toMatchObject({
      eventKind: "control",
      eventId: "checkpoint-1",
      intent: "checkpoint",
      trace: {
        resolutionReason: "typed_object",
      },
    });
    expect(() =>
      resolveControlIntent({ intent: "unknown" }, { mode: CONTROL_RESOLUTION_MODES.STRICT }),
    ).toThrow(ControlIntentResolverError);
  });

  it("requires target identities for retry and replay controls", () => {
    expect(
      resolveControlIntent({ retry: true, targetAttemptId: "attempt-1" }, { eventId: "retry-1" }),
    ).toMatchObject({
      intent: "retry",
      targetAttemptId: "attempt-1",
      trace: {
        resolutionReason: "retry_metadata",
      },
    });
    expect(
      resolveControlIntent({ replay: true, targetEventId: "event-1" }, { eventId: "replay-1" }),
    ).toMatchObject({
      intent: "replay",
      targetEventId: "event-1",
      trace: {
        resolutionReason: "replay_metadata",
      },
    });
    expect(() => resolveControlIntent({ retry: true })).toThrow(ControlIntentResolverError);
    expect(() => resolveControlIntent({ replay: true })).toThrow(ControlIntentResolverError);
  });

  it("resolves config, poller, and lifecycle metadata deterministically", () => {
    expect(resolveControlIntent({ configVersion: "v2" })).toMatchObject({
      intent: "refresh_config",
      trace: {
        resolutionReason: "config_change",
      },
    });
    expect(resolveControlIntent({ configFingerprintPrefix: "abc12345" })).toMatchObject({
      intent: "refresh_config",
    });
    expect(resolveControlIntent({ scheduler: { kind: "poll" } })).toMatchObject({
      intent: "poll",
      trace: {
        resolutionReason: "poll_metadata",
      },
    });
    expect(resolveControlIntent({ lifecycle: "open" })).toMatchObject({
      intent: "start",
      trace: {
        resolutionReason: "lifecycle_metadata",
      },
    });
    expect(resolveControlIntent({ action: "close" })).toMatchObject({
      intent: "stop",
    });
  });

  it("keeps ctrl_accio and unknown legacy bottles as legacy ticks in compatibility mode", () => {
    const accio = resolveControlIntent(doBottle("ctrl_accio", { tick: true }), {
      eventId: "accio-1",
    });
    const unknown = resolveControlIntent(doBottle("ctrl_custom", { token: "secret-token" }), {
      eventId: "unknown-1",
    });

    expect(accio).toMatchObject({
      intent: "legacy_tick",
      legacyControlPayload: {
        _bname: "ctrl_accio",
      },
      trace: {
        resolutionReason: "legacy_bottle_allowlist",
      },
    });
    expect(unknown).toMatchObject({
      intent: "legacy_tick",
      trace: {
        resolutionReason: "legacy_bottle_unknown",
      },
    });
    expect(() =>
      resolveControlIntent(doBottle("ctrl_custom", {}), {
        mode: CONTROL_RESOLUTION_MODES.STRICT,
      }),
    ).toThrow(ControlIntentResolverError);
    assertNoSecretLeak(unknown.trace);
  });

  it("preserves raw legacy payload while redacting compatibility trace context", () => {
    const legacy = {
      configVersion: "v3",
      authorization: "Bearer abc123",
      cookie: "sessionid=abc",
      callbackUrl: "https://example.test/callback?token=secret-token",
    };
    const envelope = resolveControlIntent(legacy, { eventId: "config-3" });

    expect(envelope.legacyControlPayload).toBe(legacy);
    expect(envelope.trace.legacyControlPayload.authorization).toBe("[redacted]");
    assertNoSecretLeak(envelope.trace);
  });

  it("does not execute opted-in data-driven side effects on resolved legacy ticks", async () => {
    const executeSideEffect = vi.fn();
    const harness = createSideEffectAdapterMigrationHarness({
      adapterName: "control-resolver-action",
      runtimeTargetKey: "leafelement:control-resolver-action",
      executeSideEffect,
      idFactory: createDeterministicIdFactory(),
      eventIdFactory: createDeterministicIdFactory(),
    });
    const legacyTick = resolveControlIntent(doBottle("ctrl_accio", {}), {
      eventId: "legacy-tick-1",
      targetNodeId: "control-resolver-action",
    });

    await harness.sendDataCommand(harness.createCommand({ domainCommandId: "command-1" }), {
      eventId: "data-1",
    });
    await harness.sendControlTick({
      eventId: legacyTick.eventId,
      intent: legacyTick.intent,
      legacyControlPayload: legacyTick.legacyControlPayload,
    });

    expect(executeSideEffect).toHaveBeenCalledTimes(1);
    expect(harness.snapshot().decisions.map((event) => [event.decision, event.reason])).toEqual([
      ["execute", "data"],
      ["skip", "not_meaningful_data"],
    ]);
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  CONFIG_BEHAVIORS,
  ConfigSemanticsError,
  canonicalizeConfig,
  createSourceReopenPlan,
  fingerprintConfig,
  resolveConfigUpdate,
} from "./configSemantics.js";
import {
  resolveLeafElementRuntimeClassification,
  resolveNodeRuntimeClassification,
} from "./nodeClassification.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
  expect(serialized).not.toContain("x-amz-signature");
  expect(serialized).not.toContain("abcdef");
};

describe("config semantics runtime helpers", () => {
  it("classifies leafconfig and P0 side-effect config semantics", () => {
    expect(resolveNodeRuntimeClassification({ type: "leafconfig", args: {} })).toMatchObject({
      runtimeClass: "stateful_transform",
      trigger: "data",
      config: {
        defaultBehavior: "future-only",
        modes: ["future-only", "recompute-pure", "reopen-source", "reconfigure-side-effect"],
        fallbackFingerprint: "canonical-json",
      },
    });
    expect(resolveLeafElementRuntimeClassification("http")).toMatchObject({
      runtimeClass: "side_effecting_action",
      priority: "P0",
      config: {
        defaultBehavior: "reconfigure-side-effect",
        configReplay: "blocked-without-safe-replay-policy",
        secretChangeDetection: "configVersion-or-configFingerprintKey-required",
      },
    });
  });

  it("builds deterministic canonical fingerprints and rejects unsupported config values", () => {
    const left = {
      b: 2,
      a: {
        y: true,
        x: ["one", "two"],
      },
    };
    const right = {
      a: {
        x: ["one", "two"],
        y: true,
      },
      b: 2,
    };
    const changed = {
      a: {
        x: ["one", "three"],
        y: true,
      },
      b: 2,
    };
    const leftFingerprint = fingerprintConfig({ config: left });
    const rightFingerprint = fingerprintConfig({ config: right });
    const changedFingerprint = fingerprintConfig({ config: changed });
    const cyclic = {};
    cyclic.self = cyclic;

    expect(canonicalizeConfig(left)).toBe(canonicalizeConfig(right));
    expect(leftFingerprint.configFingerprint).toBe(rightFingerprint.configFingerprint);
    expect(leftFingerprint.configFingerprint).not.toBe(changedFingerprint.configFingerprint);
    expect(() => canonicalizeConfig({ fn: () => undefined })).toThrow(ConfigSemanticsError);
    expect(() => canonicalizeConfig(cyclic)).toThrow(ConfigSemanticsError);
  });

  it("treats config changes as future-only by default and emits refresh_config only on change", () => {
    const sinks = createInMemoryRuntimeSinks();
    const leafconfig = resolveNodeRuntimeClassification({ type: "leafconfig", args: {} });
    const first = resolveConfigUpdate({
      config: { suffix: "alpha" },
      graphInstanceId: "config-graph",
      nodeId: "leafconfig-node",
      runtimeTargetKey: "node:leafconfig",
      classification: leafconfig,
      eventId: "config-v1-event",
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const unchanged = resolveConfigUpdate({
      previousConfigState: first,
      config: { suffix: "alpha" },
      graphInstanceId: "config-graph",
      nodeId: "leafconfig-node",
      runtimeTargetKey: "node:leafconfig",
      classification: leafconfig,
      eventId: "config-v1-repeat",
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const changed = resolveConfigUpdate({
      previousConfigState: first,
      config: { suffix: "beta" },
      graphInstanceId: "config-graph",
      nodeId: "leafconfig-node",
      runtimeTargetKey: "node:leafconfig",
      classification: leafconfig,
      eventId: "config-v2-event",
      observability: {
        traceSink: sinks.traceSink,
      },
    });

    expect(first).toMatchObject({
      configChanged: true,
      behavior: "future-only",
      replayedPriorData: false,
    });
    expect(first.controlEnvelope).toMatchObject({
      eventId: "config-v1-event",
      eventKind: "control",
      intent: "refresh_config",
    });
    expect(unchanged.configChanged).toBe(false);
    expect(unchanged.controlEnvelope).toBeUndefined();
    expect(changed.configChanged).toBe(true);
    expect(changed.controlEnvelope).toMatchObject({
      eventId: "config-v2-event",
      intent: "refresh_config",
    });
    expect(sinks.snapshot().traces.map((event) => [event.configChanged, event.behavior])).toEqual([
      [true, "future-only"],
      [false, "future-only"],
      [true, "future-only"],
    ]);
  });

  it("allows pure recompute only for pure retained-input transforms and rejects side-effect replay", () => {
    const pure = resolveNodeRuntimeClassification({ type: "leaflisp", args: {} });
    const http = resolveLeafElementRuntimeClassification("http");

    expect(
      resolveConfigUpdate({
        config: { expression: "(return inport)" },
        classification: pure,
        behavior: CONFIG_BEHAVIORS.RECOMPUTE_PURE,
        retainedInput: true,
      }),
    ).toMatchObject({
      behavior: "recompute-pure",
      replayAllowed: false,
    });
    expect(() =>
      resolveConfigUpdate({
        config: { expression: "(return inport)" },
        classification: pure,
        behavior: CONFIG_BEHAVIORS.RECOMPUTE_PURE,
        retainedInput: false,
      }),
    ).toThrow(ConfigSemanticsError);
    expect(() =>
      resolveConfigUpdate({
        config: { endpoint: "/orders" },
        classification: http,
        behavior: CONFIG_BEHAVIORS.RECOMPUTE_PURE,
        retainedInput: true,
      }),
    ).toThrow(ConfigSemanticsError);
  });

  it("reopens sources without duplicating already emitted source event IDs", () => {
    const source = resolveLeafElementRuntimeClassification("mediainput");
    const configUpdate = resolveConfigUpdate({
      previousConfigState: { configVersion: "camera-v1" },
      config: { deviceId: "camera-2" },
      configVersion: "camera-v2",
      classification: source,
      behavior: CONFIG_BEHAVIORS.REOPEN_SOURCE,
    });
    const plan = createSourceReopenPlan({
      configUpdate,
      previousSourceEventIds: ["frame-1", "frame-2"],
      newSourceEventIds: ["frame-2", "frame-3"],
    });

    expect(configUpdate).toMatchObject({
      configChanged: true,
      behavior: "reopen-source",
    });
    expect(plan).toEqual({
      reopen: true,
      emitSourceEventIds: ["frame-3"],
      suppressedDuplicateSourceEventIds: ["frame-2"],
    });
  });

  it("fails fast for secret-bearing P0 config without version/key and redacts traces", () => {
    const sinks = createInMemoryRuntimeSinks();
    const http = resolveLeafElementRuntimeClassification("http");
    const secretConfig = {
      endpoint: "https://example.test/upload?x-amz-signature=abcdef",
      authorization: "Bearer abc123",
      token: "secret-token",
      cookie: "sessionid=abc",
    };

    expect(() =>
      fingerprintConfig({
        config: secretConfig,
        classification: http,
      }),
    ).toThrow(ConfigSemanticsError);
    const versioned = resolveConfigUpdate({
      config: secretConfig,
      configVersion: "http-config-v1",
      graphInstanceId: "config-graph",
      nodeId: "http-node",
      runtimeTargetKey: "leafelement:http",
      classification: http,
      behavior: CONFIG_BEHAVIORS.RECONFIGURE_SIDE_EFFECT,
      eventId: "http-config-event",
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const keyed = fingerprintConfig({
      config: secretConfig,
      configFingerprintKey: "host-secret-key",
      classification: http,
    });

    expect(versioned).toMatchObject({
      configChanged: true,
      configVersion: "http-config-v1",
      behavior: "reconfigure-side-effect",
      replayedPriorData: false,
      replayAllowed: false,
    });
    expect(versioned.configFingerprintPrefix).toHaveLength(8);
    expect(keyed.configFingerprintPrefix).toHaveLength(8);
    expect(sinks.snapshot().traces).toEqual([
      expect.objectContaining({
        event: "config_update_decision",
        runtimeTargetKey: "leafelement:http",
        configVersion: "http-config-v1",
        configChanged: true,
        behavior: "reconfigure-side-effect",
      }),
    ]);
    assertNoSecretLeak(sinks.snapshot());
  });

  it("uses updated config on the next data event without repeating the prior side effect", () => {
    const executeSideEffect = vi.fn();
    const leafconfig = resolveNodeRuntimeClassification({ type: "leafconfig", args: {} });
    let configState = resolveConfigUpdate({
      config: { suffix: "alpha" },
      classification: leafconfig,
      eventId: "initial-config",
    });
    let activeConfig = { suffix: "alpha" };

    const runData = (value) => {
      executeSideEffect(`${value}:${activeConfig.suffix}`);
    };

    runData("order");
    configState = resolveConfigUpdate({
      previousConfigState: configState,
      config: { suffix: "beta" },
      classification: leafconfig,
      eventId: "updated-config",
    });
    activeConfig = { suffix: "beta" };
    expect(configState).toMatchObject({
      configChanged: true,
      replayedPriorData: false,
    });
    expect(executeSideEffect).toHaveBeenCalledTimes(1);
    runData("order");

    expect(executeSideEffect).toHaveBeenCalledTimes(2);
    expect(executeSideEffect.mock.calls.map(([value]) => value)).toEqual([
      "order:alpha",
      "order:beta",
    ]);
  });
});

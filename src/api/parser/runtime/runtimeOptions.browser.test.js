import { describe, expect, it, vi } from "vitest";

import {
  GhostRuntimeOptionsError,
  createCallbackRuntimeSinks,
  createInMemoryRuntimeSinks,
  createNoopLogSink,
  createNoopMetricSink,
  createNoopTraceSink,
  createSafeLocalLogSink,
  getRuntimeTargetKey,
  resolveGhostRuntimeOptions,
  validateRuntimeTargetKey,
} from "./runtimeOptions.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("sessionid=abc");
  expect(serialized).not.toContain("signature=deadbeef");
};

describe("runtime options", () => {
  it("resolves legacy-safe defaults with no-op sinks", () => {
    const options = resolveGhostRuntimeOptions();

    expect(options.featureFlags).toEqual({
      defaultTriggerMode: "legacy",
      enableTriggerPolicy: false,
      dataTriggeredTargets: [],
      idempotentSideEffects: false,
      dualTraceExecution: false,
    });
    expect(() => options.observability.traceSink.emit({ token: "secret-token" })).not.toThrow();
    expect(() =>
      options.observability.metricSink.record("ghostos_test_total", { token: "secret-token" }, 1),
    ).not.toThrow();
    expect(() => options.observability.logSink.info({ token: "secret-token" })).not.toThrow();
  });

  it("resolves feature flags with explicit override precedence", () => {
    const options = resolveGhostRuntimeOptions({
      packageDefaults: {
        featureFlags: {
          defaultTriggerMode: "legacy",
          enableTriggerPolicy: false,
          dataTriggeredTargets: ["node:leaflisp"],
        },
      },
      buildDefaults: {
        featureFlags: {
          enableTriggerPolicy: true,
          idempotentSideEffects: false,
        },
      },
      graphMetadata: {
        featureFlags: {
          idempotentSideEffects: true,
          dataTriggeredTargets: ["leafelement:http"],
        },
      },
      nodeMetadata: {
        featureFlags: {
          dataTriggeredTargets: ["leafelement:hermes"],
          dualTraceExecution: false,
        },
      },
      runtimeConfig: {
        ghostRuntimeOptions: {
          featureFlags: {
            defaultTriggerMode: "policy",
            dualTraceExecution: true,
          },
        },
      },
    });

    expect(options.featureFlags).toEqual({
      defaultTriggerMode: "policy",
      enableTriggerPolicy: true,
      dataTriggeredTargets: ["leafelement:hermes"],
      idempotentSideEffects: true,
      dualTraceExecution: true,
    });
  });

  it("requires explicit opt-in for debug global overrides", () => {
    globalThis.GHOSTOS_RUNTIME_OPTIONS = {
      featureFlags: {
        enableTriggerPolicy: true,
      },
    };
    try {
      expect(resolveGhostRuntimeOptions().featureFlags.enableTriggerPolicy).toBe(false);
      expect(
        resolveGhostRuntimeOptions({ allowGlobalDebugOverrides: true }).featureFlags
          .enableTriggerPolicy,
      ).toBe(true);
    } finally {
      delete globalThis.GHOSTOS_RUNTIME_OPTIONS;
    }
  });

  it("extracts runtime options from existing _config-shaped objects", () => {
    const options = resolveGhostRuntimeOptions({
      runtimeConfig: {
        featureFlags: {
          enableTriggerPolicy: "true",
          dataTriggeredTargets: ["node:leafmixflow"],
        },
      },
    });

    expect(options.featureFlags.enableTriggerPolicy).toBe(true);
    expect(options.featureFlags.dataTriggeredTargets).toEqual(["node:leafmixflow"]);
  });

  it("validates runtime target keys and derives leafelement target keys", () => {
    expect(getRuntimeTargetKey({ type: "leaflisp" })).toBe("node:leaflisp");
    expect(getRuntimeTargetKey({ type: "leafelement", args: { elementname: "http" } })).toBe(
      "leafelement:http",
    );
    expect(validateRuntimeTargetKey("leafelement:cortex")).toBe("leafelement:cortex");
    expect(() => validateRuntimeTargetKey("http")).toThrow(GhostRuntimeOptionsError);
    expect(() => validateRuntimeTargetKey("node:leafelement")).toThrow(GhostRuntimeOptionsError);
    expect(() => getRuntimeTargetKey({ type: "leafelement", args: {} })).toThrow(
      GhostRuntimeOptionsError,
    );
  });

  it("fails malformed feature flag values before runtime execution", () => {
    expect(() =>
      resolveGhostRuntimeOptions({
        runtimeConfig: {
          featureFlags: {
            defaultTriggerMode: "data",
          },
        },
      }),
    ).toThrow(GhostRuntimeOptionsError);

    expect(() =>
      resolveGhostRuntimeOptions({
        runtimeConfig: {
          featureFlags: {
            enableTriggerPolicy: "yes",
          },
        },
      }),
    ).toThrow(GhostRuntimeOptionsError);

    expect(() =>
      resolveGhostRuntimeOptions({
        runtimeConfig: {
          featureFlags: {
            dataTriggeredTargets: ["hermes"],
          },
        },
      }),
    ).toThrow(GhostRuntimeOptionsError);
  });

  it("provides no-op sinks and in-memory browser sinks", () => {
    const noopTraceSink = createNoopTraceSink();
    const noopMetricSink = createNoopMetricSink();
    const noopLogSink = createNoopLogSink();

    expect(() => noopTraceSink.emit({ token: "secret-token" })).not.toThrow();
    expect(() => noopMetricSink.record("metric", { token: "secret-token" }, 1)).not.toThrow();
    expect(() => noopLogSink.error({ token: "secret-token" })).not.toThrow();

    const sinks = createInMemoryRuntimeSinks();
    sinks.traceSink.emit({
      eventId: "evt-1",
      authorization: "Bearer abc123",
      signedUrl: "https://assets.example.test/file?signature=deadbeef",
    });
    sinks.metricSink.record("ghostos_test_total", { cookie: "sessionid=abc", status: "ok" }, 2);
    sinks.logSink.warn({ token: "secret-token", statusCode: 202 });

    const snapshot = sinks.snapshot();
    expect(snapshot.traces[0].eventId).toBe("evt-1");
    expect(snapshot.traces[0].authorization).toBe("[redacted]");
    expect(snapshot.metrics[0].labels.status).toBe("ok");
    expect(snapshot.logs[0].event.statusCode).toBe(202);
    assertNoSecretLeak(snapshot);

    sinks.clear();
    expect(sinks.snapshot()).toEqual({ traces: [], metrics: [], logs: [] });
  });

  it("wraps callback and host sinks with redaction", () => {
    const onTrace = vi.fn();
    const onMetric = vi.fn();
    const onLog = vi.fn();
    const callbackSinks = createCallbackRuntimeSinks({ onTrace, onMetric, onLog });

    const options = resolveGhostRuntimeOptions({
      runtimeConfig: {
        observability: callbackSinks,
      },
    });

    options.observability.traceSink.emit({ token: "secret-token", eventId: "evt-1" });
    options.observability.metricSink.record(
      "ghostos_test_total",
      { authorization: "Bearer abc123", status: "ok" },
      1,
    );
    options.observability.logSink.error({
      url: "https://example.test/a?access_token=secret-token&eventId=evt-1",
    });

    expect(onTrace).toHaveBeenCalledWith({ token: "[redacted]", eventId: "evt-1" });
    expect(onMetric).toHaveBeenCalledWith(
      "ghostos_test_total",
      { authorization: "[redacted]", status: "ok" },
      1,
    );
    expect(onLog.mock.calls[0][0]).toBe("error");
    assertNoSecretLeak({
      traces: onTrace.mock.calls,
      metrics: onMetric.mock.calls,
      logs: onLog.mock.calls,
    });
  });

  it("supports explicitly enabled safe local logging without Node-only globals", () => {
    const sink = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const logSink = createSafeLocalLogSink({
      component: "test",
      enabled: true,
      sink,
    });

    logSink.info({ token: "secret-token", eventId: "evt-1" });

    expect(sink.info).toHaveBeenCalledTimes(1);
    const serialized = JSON.stringify(sink.info.mock.calls);
    expect(serialized).toContain("evt-1");
    assertNoSecretLeak(sink.info.mock.calls);
  });
});

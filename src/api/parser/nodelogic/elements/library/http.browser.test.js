import { describe, expect, it, vi } from "vitest";

import { doBottle } from "../../datautils/bottling.js";
import {
  executeHttpFetchCommand,
  isHttpSafeReadMethod,
  isHttpWriteMethod,
  normalizeHttpRequestCommand,
  resolveHttpWriteIdempotency,
} from "./http.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "../../../runtime/sideEffectMigrationHarness.js";

const jsonResponse = ({
  ok = true,
  status = 200,
  body = { ok: true },
  statusText = "OK",
} = {}) => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(body),
});

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
  expect(serialized).not.toContain("signature=deadbeef");
};

const createHttpHarness = ({ fetchImpl, idempotencyStore } = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "http",
    runtimeTargetKey: "leafelement:http",
    executeSideEffect: ({ command }) => executeHttpFetchCommand({ command, fetchImpl }),
    resolveCommand: ({ inputValues }) => normalizeHttpRequestCommand(inputValues[0]),
    resolveIdempotency: ({ command }) => resolveHttpWriteIdempotency(command),
    idempotencyStore,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    retry: {
      enabled: true,
      maxAttempts: 2,
      retryableErrors: ["http_503", "http_429", "timeout"],
    },
  });

const writeCommand = (overrides = {}) => ({
  method: "post",
  uri: "https://api.example.test/write",
  headers: {
    authorization: "Bearer abc123",
    cookie: "sessionid=abc",
  },
  body: {
    value: "payload",
    token: "secret-token",
  },
  domainCommandId: "command-1",
  tenantId: "tenant-1",
  integrationInstanceId: "integration-1",
  producerId: "producer-1",
  ...overrides,
});

describe("leafelement:http runtime write helpers", () => {
  it("classifies safe reads separately from write actions", () => {
    expect(isHttpSafeReadMethod("GET")).toBe(true);
    expect(isHttpSafeReadMethod("head")).toBe(true);
    expect(isHttpWriteMethod("POST")).toBe(true);
    expect(isHttpWriteMethod("patch")).toBe(true);
    expect(isHttpWriteMethod("delete")).toBe(true);
    expect(isHttpWriteMethod("get")).toBe(false);
  });

  it("normalizes legacy http-request bottles and requires write idempotency metadata", () => {
    const command = normalizeHttpRequestCommand(
      doBottle("http-request", {
        mode: "put",
        uri: "https://api.example.test/resource",
        data: { ok: true },
        domainCommandId: "put-1",
      }),
    );

    expect(command).toMatchObject({
      method: "put",
      uri: "https://api.example.test/resource",
      body: { ok: true },
      domainCommandId: "put-1",
    });
    expect(() =>
      resolveHttpWriteIdempotency({ method: "post", uri: "https://api.example.test" }),
    ).toThrow();
    expect(() =>
      resolveHttpWriteIdempotency({ method: "get", uri: "https://api.example.test" }),
    ).toThrow();
  });

  it("executes one write for one data command and suppresses control/config ticks", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: 202, body: { id: "ok" } }));
    const harness = createHttpHarness({ fetchImpl });

    await harness.sendDataCommand(writeCommand(), { eventId: "http-write-1" });
    await harness.sendControlTick({ eventId: "control-1" });
    await harness.sendConfigRefresh({ eventId: "config-1" });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.example.test/write");
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({
      method: "POST",
      credentials: "include",
    });
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
    ]);
    assertNoSecretLeak(harness.snapshot());
  });

  it("suppresses duplicate keys and explicit replay of succeeded writes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: 202 }));
    const harness = createHttpHarness({ fetchImpl });
    const command = writeCommand({ domainCommandId: "duplicate" });

    await harness.sendDataCommand(command, { eventId: "http-write-1" });
    const duplicate = await harness.sendDataCommand(command, { eventId: "http-write-duplicate" });
    const replayHarness = createHttpHarness({
      fetchImpl,
    });
    await replayHarness.sendDataCommand(command, { eventId: "http-replay-source" });
    const replay = await replayHarness.sendDataCommand(
      { ...command, originalEventId: "http-replay-source" },
      { eventId: "http-replay-1" },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(duplicate.executions[0].result).toMatchObject({
      outcome: "suppressed",
      decision: "duplicate_succeeded",
    });
    expect(replay.executions[0].result).toMatchObject({
      outcome: "suppressed",
      decision: "duplicate_succeeded",
    });
  });

  it("bounds retryable failures and does not retry validation failures", async () => {
    const retryFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: false, status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(jsonResponse({ status: 202, body: { ok: true } }));
    const retryHarness = createHttpHarness({ fetchImpl: retryFetch });

    const retried = await retryHarness.sendDataCommand(writeCommand({ domainCommandId: "retry" }), {
      eventId: "http-retry",
    });

    expect(retryFetch).toHaveBeenCalledTimes(2);
    expect(retried.executions[0].result).toMatchObject({
      outcome: "succeeded",
      attempts: [{ attemptCount: 1 }, { attemptCount: 2 }],
    });

    const validationFetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: false, status: 400, statusText: "Bad Request" }));
    const validationHarness = createHttpHarness({ fetchImpl: validationFetch });
    const failed = await validationHarness.sendDataCommand(
      writeCommand({ domainCommandId: "validation" }),
      { eventId: "http-validation" },
    );

    expect(validationFetch).toHaveBeenCalledTimes(1);
    expect(failed.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "http_400",
        retryable: false,
      },
    });
  });

  it("fails fast for missing endpoint, missing idempotency, and missing store", async () => {
    const fetchImpl = vi.fn();
    const harness = createHttpHarness({ fetchImpl });
    const missingEndpoint = await harness.sendDataCommand(
      writeCommand({ uri: undefined, domainCommandId: "missing-endpoint" }),
      { eventId: "missing-endpoint" },
    );
    const missingIdempotency = await harness.sendDataCommand(
      writeCommand({ domainCommandId: undefined }),
      { eventId: "missing-idempotency" },
    );
    const missingStoreHarness = createHttpHarness({ fetchImpl, idempotencyStore: null });
    const missingStore = await missingStoreHarness.sendDataCommand(writeCommand(), {
      eventId: "missing-store",
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(missingEndpoint.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingIdempotency.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingStore.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
  });

  it("redacts request configs, response errors, and signed URLs in harness captures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 503,
        statusText: "Unavailable",
        body: {
          callbackUrl: "https://example.test/callback?signature=deadbeef",
          authorization: "Bearer abc123",
        },
      }),
    );
    const harness = createHttpHarness({ fetchImpl });

    await harness.sendDataCommand(
      writeCommand({
        uri: "https://api.example.test/write?token=secret-token",
        domainCommandId: "redaction",
      }),
      { eventId: "http-redaction" },
    );

    assertNoSecretLeak(harness.snapshot());
  });
});

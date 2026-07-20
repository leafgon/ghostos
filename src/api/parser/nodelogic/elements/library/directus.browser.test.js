import { describe, expect, it, vi } from "vitest";

import { doBottle } from "../../datautils/bottling.js";
import {
  buildDirectusMutationRequest,
  executeDirectusMutationCommand,
  isDirectusMutationOperation,
  isDirectusReadOperation,
  normalizeDirectusRequestCommand,
  resolveDirectusMutationIdempotency,
  resolveDirectusReadSourceIdentity,
} from "./directus.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "../../../runtime/sideEffectMigrationHarness.js";

const directusResponse = ({
  ok = true,
  status = 200,
  body = { data: { id: "item-1" } },
  statusText = "OK",
} = {}) => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(body),
});

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("directus-secret");
  expect(serialized).not.toContain("Bearer directus-secret");
  expect(serialized).not.toContain("super-secret-password");
  expect(serialized).not.toContain("token=directus-secret");
};

const createDirectusHarness = ({ transport, idempotencyStore } = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "directus",
    runtimeTargetKey: "leafelement:directus",
    executeSideEffect: ({ command }) => executeDirectusMutationCommand({ command, transport }),
    resolveCommand: ({ inputValues }) => normalizeDirectusRequestCommand(inputValues[0]),
    resolveIdempotency: ({ command }) => resolveDirectusMutationIdempotency(command),
    idempotencyStore,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    retry: {
      enabled: true,
      maxAttempts: 2,
      retryableErrors: ["directus_408", "directus_429", "directus_500", "directus_503"],
    },
  });

const mutationCommand = (overrides = {}) => ({
  operation: "create",
  endpoint: "https://directus.example.test",
  collection: "articles",
  token: "directus-secret",
  body: {
    title: "Data-driven Directus",
  },
  domainCommandId: "directus-command-1",
  tenantId: "tenant-1",
  integrationInstanceId: "directus-instance-1",
  producerId: "producer-1",
  ...overrides,
});

describe("leafelement:directus runtime mutation helpers", () => {
  it("classifies read/source behavior separately from mutation actions", () => {
    expect(isDirectusReadOperation("read")).toBe(true);
    expect(isDirectusReadOperation("get")).toBe(true);
    expect(isDirectusMutationOperation("create")).toBe(true);
    expect(isDirectusMutationOperation("patch")).toBe(true);
    expect(isDirectusMutationOperation("delete")).toBe(true);

    const identity = resolveDirectusReadSourceIdentity({
      operation: "read",
      endpoint: "https://directus.example.test",
      collection: "articles",
      sourceId: "articles-feed",
      token: "directus-secret",
    });

    expect(identity).toMatchObject({
      sourceId: "articles-feed",
      collection: "articles",
      operation: "read",
    });
    expect(
      resolveDirectusReadSourceIdentity({
        operation: "read",
        endpoint: "https://directus.example.test?token=directus-secret",
        collection: "articles",
      }).sourceId,
    ).toBe("directus:https://directus.example.test:articles:read");
    expect(() =>
      resolveDirectusMutationIdempotency({ ...mutationCommand(), sourceId: "feed" }),
    ).not.toThrow();
  });

  it("normalizes legacy Directus bottles and builds authenticated mutation requests", () => {
    const command = normalizeDirectusRequestCommand(
      doBottle("directus-mutation", {
        action: "update",
        endpoint: "https://directus.example.test",
        collection: "articles",
        id: "article-1",
        accessToken: "directus-secret",
        data: { title: "Updated" },
        domainCommandId: "update-1",
      }),
    );
    const request = buildDirectusMutationRequest(command);

    expect(command).toMatchObject({
      operation: "update",
      collection: "articles",
      itemId: "article-1",
      body: { title: "Updated" },
      domainCommandId: "update-1",
    });
    expect(request).toMatchObject({
      method: "PATCH",
      url: "https://directus.example.test/items/articles/article-1",
      headers: {
        Authorization: "Bearer directus-secret",
        Accept: "application/json",
      },
    });
  });

  it("executes one data-triggered mutation and suppresses control/config ticks", async () => {
    const transport = vi.fn().mockResolvedValue(directusResponse({ status: 201 }));
    const harness = createDirectusHarness({ transport });

    await harness.sendDataCommand(mutationCommand(), { eventId: "directus-data-1" });
    await harness.sendControlTick({ eventId: "directus-control-1" });
    await harness.sendConfigRefresh({ eventId: "directus-config-1" });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toMatchObject({
      method: "POST",
      url: "https://directus.example.test/items/articles",
    });
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
    ]);
  });

  it("suppresses duplicate mutations and replayed successful commands by idempotency key", async () => {
    const transport = vi.fn().mockResolvedValue(directusResponse({ status: 201 }));
    const harness = createDirectusHarness({ transport });
    const command = mutationCommand({ domainCommandId: "duplicate-command" });

    await harness.sendDataCommand(command, { eventId: "directus-data-1" });
    const duplicate = await harness.sendDataCommand(command, {
      eventId: "directus-data-duplicate",
    });
    const replay = await harness.sendDataCommand(
      { ...command, originalEventId: "directus-data-1" },
      { eventId: "directus-replay-1" },
    );

    expect(transport).toHaveBeenCalledTimes(1);
    expect(duplicate.executions[0].result).toMatchObject({
      outcome: "suppressed",
      decision: "duplicate_succeeded",
    });
    expect(replay.executions[0].result).toMatchObject({
      outcome: "suppressed",
      decision: "duplicate_succeeded",
    });
  });

  it("bounds retryable failures and does not retry validation/auth failures", async () => {
    const retryTransport = vi
      .fn()
      .mockResolvedValueOnce(
        directusResponse({ ok: false, status: 503, statusText: "Unavailable" }),
      )
      .mockResolvedValueOnce(directusResponse({ status: 200, body: { data: { id: "ok" } } }));
    const retryHarness = createDirectusHarness({ transport: retryTransport });

    const retried = await retryHarness.sendDataCommand(
      mutationCommand({ domainCommandId: "retry" }),
      { eventId: "directus-retry" },
    );

    expect(retryTransport).toHaveBeenCalledTimes(2);
    expect(retried.executions[0].result).toMatchObject({
      outcome: "succeeded",
      attempts: [{ attemptCount: 1 }, { attemptCount: 2 }],
    });

    const authTransport = vi
      .fn()
      .mockResolvedValue(directusResponse({ ok: false, status: 401, statusText: "Unauthorized" }));
    const authHarness = createDirectusHarness({ transport: authTransport });
    const failed = await authHarness.sendDataCommand(
      mutationCommand({ domainCommandId: "auth-failure" }),
      { eventId: "directus-auth-failure" },
    );

    expect(authTransport).toHaveBeenCalledTimes(1);
    expect(failed.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "directus_401",
        retryable: false,
      },
    });
  });

  it("fails fast for missing endpoint, credential, idempotency metadata, and store", async () => {
    const transport = vi.fn();
    const harness = createDirectusHarness({ transport });
    const missingEndpoint = await harness.sendDataCommand(
      mutationCommand({ endpoint: undefined, domainCommandId: "missing-endpoint" }),
      { eventId: "missing-endpoint" },
    );
    const missingCredential = await harness.sendDataCommand(
      mutationCommand({ token: undefined, domainCommandId: "missing-credential" }),
      { eventId: "missing-credential" },
    );
    const missingIdempotency = await harness.sendDataCommand(
      mutationCommand({ domainCommandId: undefined }),
      { eventId: "missing-idempotency" },
    );
    const missingStoreHarness = createDirectusHarness({ transport, idempotencyStore: null });
    const missingStore = await missingStoreHarness.sendDataCommand(mutationCommand(), {
      eventId: "missing-store",
    });

    expect(transport).not.toHaveBeenCalled();
    expect(missingEndpoint.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingCredential.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingIdempotency.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingStore.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
  });

  it("redacts Directus credentials, headers, bodies, errors, and URLs in captures", async () => {
    const transport = vi.fn().mockResolvedValue(
      directusResponse({
        ok: false,
        status: 503,
        statusText: "Unavailable",
        body: {
          authorization: "Bearer directus-secret",
          callbackUrl: "https://directus.example.test/callback?token=directus-secret",
          password: "super-secret-password",
        },
      }),
    );
    const harness = createDirectusHarness({ transport });

    await harness.sendDataCommand(
      mutationCommand({
        endpoint: "https://directus.example.test?token=directus-secret",
        headers: {
          authorization: "Bearer directus-secret",
        },
        body: {
          password: "super-secret-password",
          token: "directus-secret",
        },
        domainCommandId: "redaction",
      }),
      { eventId: "directus-redaction" },
    );

    assertNoSecretLeak(harness.snapshot());
  });
});

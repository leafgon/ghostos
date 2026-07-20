import { describe, expect, it, vi } from "vitest";

import {
  executeHermesEgressCommand,
  normalizeHermesEgressCommand,
  resolveHermesEgressIdempotency,
  resolveHermesSourceRecordIdentity,
} from "./hermes.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "../../../runtime/sideEffectMigrationHarness.js";

const INSTANCE_ID = "11111111-1111-4111-8111-111111111111";
const COMMAND_ID = "22222222-2222-4222-8222-222222222222";
const GUILD_ID = "123456789012345678";
const CHANNEL_ID = "234567890123456789";

const hermesResponse = ({
  ok = true,
  status = 202,
  body = { status: "accepted", requestId: "req-1" },
  statusText = "Accepted",
} = {}) => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

const hermesConfig = (overrides = {}) => ({
  baseUrl: "https://hermes.example.test",
  writePath: "/api/hermes/egress-commands",
  requestHeaders: {
    authorization: "Bearer hermes-secret",
  },
  credentials: "omit",
  timeoutMs: 5000,
  instanceId: INSTANCE_ID,
  guildId: GUILD_ID,
  channelId: CHANNEL_ID,
  ...overrides,
});

const egressCommand = (overrides = {}) => ({
  schemaVersion: "v1",
  commandId: COMMAND_ID,
  correlationId: "corr-1",
  producerId: "ghostos-hermes-test",
  instanceId: INSTANCE_ID,
  guildId: GUILD_ID,
  channelId: CHANNEL_ID,
  type: "send_message",
  payload: {
    content: "hello",
    token: "hermes-secret",
    replyToMessageId: null,
  },
  ...overrides,
});

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("hermes-secret");
  expect(serialized).not.toContain("Bearer hermes-secret");
  expect(serialized).not.toContain("token=hermes-secret");
};

const createHermesHarness = ({ transport, config = hermesConfig(), idempotencyStore } = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "hermes",
    runtimeTargetKey: "leafelement:hermes",
    executeSideEffect: ({ command }) => executeHermesEgressCommand({ command, config, transport }),
    resolveCommand: ({ inputValues }) => normalizeHermesEgressCommand(inputValues[0], { config }),
    resolveIdempotency: ({ command }) => resolveHermesEgressIdempotency(command),
    idempotencyStore,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    retry: {
      enabled: true,
      maxAttempts: 2,
      retryableErrors: ["upstream_unavailable", "rate_limited"],
    },
  });

describe("leafelement:hermes egress migration helpers", () => {
  it("executes one data-triggered egress command and suppresses control/config ticks", async () => {
    const transport = vi.fn().mockResolvedValue(hermesResponse());
    const harness = createHermesHarness({ transport });

    await harness.sendDataCommand(egressCommand(), { eventId: "hermes-data-1" });
    await harness.sendControlTick({ eventId: "hermes-control-1" });
    await harness.sendControlTick({ eventId: "hermes-control-2" });
    await harness.sendConfigRefresh({ eventId: "hermes-config-1" });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toMatchObject({
      url: "https://hermes.example.test/api/hermes/egress-commands",
      init: {
        method: "POST",
        credentials: "omit",
      },
    });
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
      "skip",
    ]);
  });

  it("suppresses duplicate and replayed successful egress commands by command ID", async () => {
    const transport = vi.fn().mockResolvedValue(hermesResponse());
    const harness = createHermesHarness({ transport });
    const command = egressCommand({ commandId: "33333333-3333-4333-8333-333333333333" });

    await harness.sendDataCommand(command, { eventId: "hermes-data-1" });
    const duplicate = await harness.sendDataCommand(command, {
      eventId: "hermes-data-duplicate",
    });
    const replay = await harness.sendDataCommand(
      { ...command, originalEventId: "hermes-data-1" },
      { eventId: "hermes-replay-1" },
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

  it("bounds retryable failures and does not retry validation or auth failures", async () => {
    const retryTransport = vi
      .fn()
      .mockResolvedValueOnce(
        hermesResponse({
          ok: false,
          status: 503,
          statusText: "Unavailable",
          body: { error: { code: "upstream_unavailable", message: "temporary" } },
        }),
      )
      .mockResolvedValueOnce(hermesResponse());
    const retryHarness = createHermesHarness({ transport: retryTransport });

    const retried = await retryHarness.sendDataCommand(
      egressCommand({ commandId: "44444444-4444-4444-8444-444444444444" }),
      { eventId: "hermes-retry" },
    );

    expect(retryTransport).toHaveBeenCalledTimes(2);
    expect(retried.executions[0].result).toMatchObject({
      outcome: "succeeded",
      attempts: [{ attemptCount: 1 }, { attemptCount: 2 }],
    });

    const authTransport = vi.fn().mockResolvedValue(
      hermesResponse({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        body: { error: { code: "auth_unauthorized", message: "unauthorized" } },
      }),
    );
    const authHarness = createHermesHarness({ transport: authTransport });
    const failed = await authHarness.sendDataCommand(
      egressCommand({ commandId: "55555555-5555-4555-8555-555555555555" }),
      { eventId: "hermes-auth-failure" },
    );

    expect(authTransport).toHaveBeenCalledTimes(1);
    expect(failed.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "auth_unauthorized",
        retryable: false,
      },
    });
  });

  it("fails fast for missing credentials, command ID, and idempotency store", async () => {
    const transport = vi.fn();
    const missingCredentialHarness = createHermesHarness({
      transport,
      config: hermesConfig({ requestHeaders: {}, credentials: "omit" }),
    });
    const missingCredential = await missingCredentialHarness.sendDataCommand(egressCommand(), {
      eventId: "missing-credential",
    });
    const missingCommandIdHarness = createHermesHarness({ transport });
    const missingCommandId = await missingCommandIdHarness.sendDataCommand(
      egressCommand({ commandId: undefined }),
      { eventId: "missing-command-id" },
    );
    const missingStoreHarness = createHermesHarness({ transport, idempotencyStore: null });
    const missingStore = await missingStoreHarness.sendDataCommand(egressCommand(), {
      eventId: "missing-store",
    });

    expect(transport).not.toHaveBeenCalled();
    expect(missingCredential.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "validation_failed",
      },
    });
    expect(missingCommandId.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingStore.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
  });

  it("redacts egress credentials, headers, URLs, errors, and sensitive payload fields", async () => {
    const transport = vi.fn().mockResolvedValue(
      hermesResponse({
        ok: false,
        status: 503,
        statusText: "Unavailable",
        body: {
          error: {
            code: "upstream_unavailable",
            message: "failed https://hermes.example.test/callback?token=hermes-secret",
            details: {
              authorization: "Bearer hermes-secret",
              token: "hermes-secret",
            },
          },
        },
      }),
    );
    const harness = createHermesHarness({
      transport,
      config: hermesConfig({
        baseUrl: "https://hermes.example.test?token=hermes-secret",
      }),
    });

    await harness.sendDataCommand(
      egressCommand({ commandId: "66666666-6666-4666-8666-666666666666" }),
      { eventId: "hermes-redaction" },
    );

    assertNoSecretLeak(harness.snapshot());
  });

  it("preserves source identity, cursor, sequence, and parent IDs for read records", () => {
    const identity = resolveHermesSourceRecordIdentity(
      {
        eventId: "evt-1",
        cursor: "cursor-1",
        sequence: 42,
      },
      {
        instanceId: INSTANCE_ID,
        parentEventIds: ["parent-1"],
      },
    );

    expect(identity).toEqual({
      sourceId: `hermes:${INSTANCE_ID}:evt-1`,
      eventId: "evt-1",
      cursor: "cursor-1",
      sequence: 42,
      parentEventIds: ["parent-1"],
    });
  });
});

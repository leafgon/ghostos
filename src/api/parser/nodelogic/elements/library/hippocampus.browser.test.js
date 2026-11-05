import { describe, expect, it, vi } from "vitest";

import {
  HippocampusRuntimeError,
  executeHippocampusIntentCommand,
  normalizeHippocampusIntentCommand,
  resolveHippocampusIntentIdempotency,
} from "./hippocampus.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "../../../runtime/sideEffectMigrationHarness.js";

const TENANT_ID = "tenant-test";
const GRAPH_DOMAIN = "domain-test";
const GRAPH_APP = "app-test";
const SPELL_REF = "spell-test";
const ELEMENT_NODE_ID = "11111111-1111-4111-8111-111111111111";
const DEPLOYMENT_ID = "22222222-2222-4222-8222-222222222222";

const digest = (char) => `sha256:${char.repeat(64)}`;

const PROFILE_BINDING = {
  profileSpellRef: "breezyforest/hippocampus-profiles#standard",
  profileId: "standard",
  profileVersion: "v1",
  profileDigest: digest("f"),
  allowlistReleaseId: "allowlist-v1",
  allowlistManifestDigest: digest("e"),
  allowlistEntryDigest: digest("d"),
};

const baseBindings = (intent, overrides = {}) => ({
  tenantId: TENANT_ID,
  deploymentId: DEPLOYMENT_ID,
  graphDomain: GRAPH_DOMAIN,
  graphApp: GRAPH_APP,
  spellRef: SPELL_REF,
  elementNodeId: ELEMENT_NODE_ID,
  profile: PROFILE_BINDING,
  configurationDigest: intent.configurationDigest,
  operationRef: intent.operationRef,
  requestId: "request-1",
  ...overrides,
});

const successfulOutcome = (intent, overrides = {}) => ({
  schema: "hippocampus-element-outcome.v1",
  ok: true,
  status: intent.operation === "configure" ? "applied" : "committed",
  replayed: false,
  bindings: baseBindings(intent, overrides.bindings),
  versions: [
    {
      entityRef: "entity:note",
      recordRef: "note:1",
      version: 1,
    },
  ],
  result: {
    operation: intent.operation,
  },
  ...overrides,
});

const commandIntent = (overrides = {}) => ({
  schema: "hippocampus-element-intent.v1",
  operation: "command",
  configurationId: "cfg-1",
  configurationDigest: digest("a"),
  operationRef: "hippocampus-command.v1",
  idempotencyKey: "idem-1",
  expectedVersions: [
    {
      entityRef: "entity:note",
      recordRef: "note:1",
      version: 0,
    },
  ],
  input: {
    action: "upsert",
    payload: {
      title: "hello",
    },
  },
  ...overrides,
});

const configureIntent = (overrides = {}) => ({
  schema: "hippocampus-element-intent.v1",
  operation: "configure",
  configurationId: "cfg-1",
  configurationDigest: digest("b"),
  operationRef: "hippocampus-configure.v1",
  expectedAppliedConfigurationDigest: null,
  idempotencyKey: "idem-configure-1",
  ...overrides,
});

const readIntent = (overrides = {}) => ({
  schema: "hippocampus-element-intent.v1",
  operation: "get",
  configurationId: "cfg-1",
  configurationDigest: digest("c"),
  operationRef: "hippocampus-read.v1",
  input: {
    entityRef: "entity:note",
    recordRef: "note:1",
  },
  ...overrides,
});

const createHippocampusHarness = ({ transport, config = {}, idempotencyStore } = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "hippocampus",
    runtimeTargetKey: "leafelement:hippocampus",
    executeSideEffect: ({ command }) =>
      executeHippocampusIntentCommand({
        command,
        config: {
          timeoutMs: 5000,
          ...config,
          transport,
        },
        executionContext: {
          tenantId: TENANT_ID,
          graphDomain: GRAPH_DOMAIN,
          graphApp: GRAPH_APP,
          spellRef: SPELL_REF,
          elementNodeId: ELEMENT_NODE_ID,
          deploymentId: DEPLOYMENT_ID,
          requestId: "request-1",
          profile: PROFILE_BINDING,
        },
      }),
    resolveCommand: ({ inputValues }) => normalizeHippocampusIntentCommand(inputValues[0]),
    resolveIdempotency: ({ command }) => resolveHippocampusIntentIdempotency(command),
    idempotencyStore,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    retry: {
      enabled: true,
      maxAttempts: 2,
      retryableErrors: ["dependency-unavailable", "timeout"],
    },
  });

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("hippo-secret");
  expect(serialized).not.toContain("Bearer hippo-secret");
  expect(serialized).not.toContain("token=hippo-secret");
};

describe("leafelement:hippocampus adapter helpers", () => {
  it("executes data-triggered intents and suppresses control/config ticks", async () => {
    const transport = vi.fn(async ({ intent }) => successfulOutcome(intent));
    const harness = createHippocampusHarness({ transport });

    await harness.sendDataCommand(commandIntent(), { eventId: "hippo-data-1" });
    await harness.sendControlTick({ eventId: "hippo-control-1" });
    await harness.sendConfigRefresh({ eventId: "hippo-config-1" });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
    ]);
  });

  it("suppresses duplicate and replayed command intents by idempotency key", async () => {
    const transport = vi.fn(async ({ intent }) => successfulOutcome(intent));
    const harness = createHippocampusHarness({ transport });
    const intent = commandIntent({ idempotencyKey: "idem-duplicate-1" });

    await harness.sendDataCommand(intent, { eventId: "hippo-data-1" });
    const duplicate = await harness.sendDataCommand(intent, { eventId: "hippo-data-duplicate" });
    const replay = await harness.sendDataCommand(intent, { eventId: "hippo-data-replay" });

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

  it("retries dependency-unavailable failures and does not retry non-retryable conflicts", async () => {
    const retryTransport = vi
      .fn()
      .mockRejectedValueOnce(new HippocampusRuntimeError("dependency-unavailable"))
      .mockImplementationOnce(async ({ intent }) => successfulOutcome(intent));
    const retryHarness = createHippocampusHarness({ transport: retryTransport });

    const retried = await retryHarness.sendDataCommand(commandIntent(), {
      eventId: "hippo-retry-1",
    });

    expect(retryTransport).toHaveBeenCalledTimes(2);
    expect(retried.executions[0].result).toMatchObject({
      outcome: "succeeded",
      attempts: [{ attemptCount: 1 }, { attemptCount: 2 }],
    });

    const conflictTransport = vi
      .fn()
      .mockRejectedValue(
        new HippocampusRuntimeError("version-conflict", undefined, { retryable: false }),
      );
    const conflictHarness = createHippocampusHarness({ transport: conflictTransport });

    const failed = await conflictHarness.sendDataCommand(commandIntent(), {
      eventId: "hippo-conflict-1",
    });

    expect(conflictTransport).toHaveBeenCalledTimes(1);
    expect(failed.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "version-conflict",
        retryable: false,
      },
    });
  });

  it("fails fast for missing transport, malformed intents, and missing idempotency metadata", async () => {
    const noTransportHarness = createHippocampusHarness({ transport: undefined });
    const missingTransport = await noTransportHarness.sendDataCommand(commandIntent(), {
      eventId: "missing-transport",
    });

    const malformedIntentHarness = createHippocampusHarness({
      transport: vi.fn(async ({ intent }) => successfulOutcome(intent)),
    });
    const malformed = await malformedIntentHarness.sendDataCommand(
      commandIntent({ schema: "hippocampus-element-intent.v999" }),
      {
        eventId: "malformed-intent",
      },
    );

    const missingIdempotencyHarness = createHippocampusHarness({
      transport: vi.fn(async ({ intent }) => successfulOutcome(intent)),
    });
    const missingIdempotency = await missingIdempotencyHarness.sendDataCommand(
      commandIntent({ idempotencyKey: undefined }),
      {
        eventId: "missing-idempotency",
      },
    );

    const missingStoreHarness = createHippocampusHarness({
      transport: vi.fn(async ({ intent }) => successfulOutcome(intent)),
      idempotencyStore: null,
    });
    const missingStore = await missingStoreHarness.sendDataCommand(commandIntent(), {
      eventId: "missing-store",
    });

    expect(missingTransport.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "configuration-invalid",
      },
    });
    expect(malformed.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingIdempotency.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingStore.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
  });

  it("rejects intent payloads with forbidden url/sql/transport fields", () => {
    expect(() =>
      normalizeHippocampusIntentCommand(
        readIntent({
          input: {
            entityRef: "entity:note",
            sql: "select * from note",
          },
        }),
      ),
    ).toThrow(HippocampusRuntimeError);

    expect(() =>
      normalizeHippocampusIntentCommand(
        readIntent({
          input: {
            entityRef: "entity:note",
            callbackUrl: "https://attacker.example/callback",
          },
        }),
      ),
    ).toThrow(HippocampusRuntimeError);

    expect(() =>
      normalizeHippocampusIntentCommand(
        commandIntent({
          operationRef: "hippocampus-command.v999",
        }),
      ),
    ).toThrow("Contract version is not supported.");
  });

  it("fails closed when returned outcome bindings do not correlate", async () => {
    const intent = configureIntent();
    const transport = vi.fn(async ({ intent: command }) =>
      successfulOutcome(command, {
        bindings: {
          operationRef: "hippocampus-other.v1",
        },
      }),
    );

    await expect(
      executeHippocampusIntentCommand({
        command: intent,
        config: { transport },
        executionContext: {
          tenantId: TENANT_ID,
          graphDomain: GRAPH_DOMAIN,
          graphApp: GRAPH_APP,
          spellRef: SPELL_REF,
          elementNodeId: ELEMENT_NODE_ID,
          deploymentId: DEPLOYMENT_ID,
          requestId: "request-1",
          profile: PROFILE_BINDING,
        },
      }),
    ).rejects.toMatchObject({
      code: "result-correlation-mismatch",
    });

    const mismatchedTenantTransport = vi.fn(async ({ intent: command }) =>
      successfulOutcome(command, {
        bindings: {
          tenantId: "tenant-other",
        },
      }),
    );

    await expect(
      executeHippocampusIntentCommand({
        command: intent,
        config: { transport: mismatchedTenantTransport },
        executionContext: {
          tenantId: TENANT_ID,
          graphDomain: GRAPH_DOMAIN,
          graphApp: GRAPH_APP,
          spellRef: SPELL_REF,
          elementNodeId: ELEMENT_NODE_ID,
          deploymentId: DEPLOYMENT_ID,
          requestId: "request-1",
          profile: PROFILE_BINDING,
        },
      }),
    ).rejects.toMatchObject({
      code: "result-correlation-mismatch",
    });
  });

  it("fails closed when successful outcomes omit bindings", async () => {
    const intent = configureIntent();
    const transport = vi.fn(async () => ({
      schema: "hippocampus-element-outcome.v1",
      ok: true,
      status: "applied",
      replayed: false,
      versions: [],
      result: {},
    }));

    await expect(
      executeHippocampusIntentCommand({
        command: intent,
        config: { transport },
        executionContext: {
          tenantId: TENANT_ID,
          graphDomain: GRAPH_DOMAIN,
          graphApp: GRAPH_APP,
          spellRef: SPELL_REF,
          elementNodeId: ELEMENT_NODE_ID,
          deploymentId: DEPLOYMENT_ID,
          requestId: "request-1",
          profile: PROFILE_BINDING,
        },
      }),
    ).rejects.toMatchObject({
      code: "result-correlation-mismatch",
    });
  });

  it("redacts secrets from retry traces, errors, and runtime snapshots", async () => {
    const transport = vi
      .fn()
      .mockRejectedValue(
        new Error("failed https://hippocampus.internal/callback?token=hippo-secret"),
      );
    const harness = createHippocampusHarness({
      transport,
    });

    await harness.sendDataCommand(
      commandIntent({
        input: {
          action: "upsert",
          payload: {
            token: "hippo-secret",
          },
        },
      }),
      {
        eventId: "hippo-redaction",
      },
    );

    assertNoSecretLeak(harness.snapshot());
  });

  it("marks read intents as non-idempotent wrappers while command/configure require keys", () => {
    expect(resolveHippocampusIntentIdempotency(readIntent())).toMatchObject({
      required: false,
    });
    expect(resolveHippocampusIntentIdempotency(commandIntent())).toMatchObject({
      required: true,
      key: "idem-1",
    });
    expect(resolveHippocampusIntentIdempotency(configureIntent())).toMatchObject({
      required: true,
      key: "idem-configure-1",
    });
  });
});

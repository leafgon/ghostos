import { describe, expect, it, vi } from "vitest";

import { doBottle } from "../../datautils/bottling.js";
import {
  executeCortexSubmissionCommand,
  normalizeCortexSubmissionCommand,
  resolveCortexPollSourceIdentity,
  resolveCortexSubmissionIdempotency,
} from "./cortex.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "../../../runtime/sideEffectMigrationHarness.js";

const REFNODE = "11111111-1111-4111-8111-111111111111";

const cortexResponse = ({
  status = 202,
  ok = status >= 200 && status < 300,
  body = acceptedResponse("job-1"),
  statusText = "Accepted",
} = {}) => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

const acceptedResponse = (jobId) => ({
  schemaVersion: "v1",
  status: "accepted",
  jobId,
  requestId: `req-${jobId}`,
  statusUrl: `/api/cortex/jobs/${jobId}`,
  eventsUrl: `/api/cortex/jobs/${jobId}/events`,
  resultUrl: `/api/cortex/jobs/${jobId}/result`,
});

const cortexConfig = (overrides = {}) => ({
  apiBaseUrl: "https://cortex.example.test",
  jobsPath: "/api/cortex/jobs",
  requestHeaders: {
    authorization: "Bearer cortex-secret",
  },
  credentials: "omit",
  requestTimeoutMs: 5000,
  ...overrides,
});

const intentBottle = (overrides = {}, label = {}) =>
  doBottle(
    "intent",
    {
      schemaVersion: "v1",
      workloadType: "chat",
      priority: "p1_interactive",
      mode: "async",
      payloadRef: {
        inline: {
          prompt: "hello",
          token: "cortex-secret",
        },
      },
      idempotencyKey: "idem-cortex-1",
      ...overrides,
    },
    label,
  );

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("cortex-secret");
  expect(serialized).not.toContain("Bearer cortex-secret");
  expect(serialized).not.toContain("token=cortex-secret");
};

const createCortexHarness = ({ transport, config = cortexConfig(), idempotencyStore } = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "cortex",
    runtimeTargetKey: "leafelement:cortex",
    executeSideEffect: ({ command }) =>
      executeCortexSubmissionCommand({ command, config, transport }),
    resolveCommand: ({ inputValues }) =>
      normalizeCortexSubmissionCommand({ intentBottle: inputValues[0], refnode: REFNODE }),
    resolveIdempotency: ({ command }) => resolveCortexSubmissionIdempotency(command),
    idempotencyStore,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    retry: {
      enabled: true,
      maxAttempts: 2,
      retryableErrors: ["upstream_unavailable", "rate_limited"],
    },
  });

describe("leafelement:cortex migration helpers", () => {
  it("executes one data-triggered submission and suppresses control/config ticks", async () => {
    const transport = vi.fn().mockResolvedValue(cortexResponse());
    const harness = createCortexHarness({ transport });

    await harness.sendDataCommand(intentBottle(), { eventId: "cortex-data-1" });
    await harness.sendControlTick({ eventId: "cortex-control-1" });
    await harness.sendConfigRefresh({ eventId: "cortex-config-1" });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toMatchObject({
      url: "https://cortex.example.test/api/cortex/jobs",
      init: {
        method: "POST",
        credentials: "omit",
      },
    });
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
    ]);
  });

  it("suppresses duplicate and replayed submissions by explicit idempotency key", async () => {
    const transport = vi.fn().mockResolvedValue(cortexResponse());
    const harness = createCortexHarness({ transport });
    const intent = intentBottle({ idempotencyKey: "idem-cortex-duplicate" });

    await harness.sendDataCommand(intent, { eventId: "cortex-data-1" });
    const duplicate = await harness.sendDataCommand(intent, {
      eventId: "cortex-data-duplicate",
    });
    const replay = await harness.sendDataCommand(intent, { eventId: "cortex-replay-1" });

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

  it("bounds retryable submit failures and does not retry auth failures", async () => {
    const retryTransport = vi
      .fn()
      .mockResolvedValueOnce(
        cortexResponse({
          status: 503,
          ok: false,
          body: { error: { code: "upstream_unavailable", message: "temporary" } },
        }),
      )
      .mockResolvedValueOnce(cortexResponse({ body: acceptedResponse("job-retry") }));
    const retryHarness = createCortexHarness({ transport: retryTransport });

    const retried = await retryHarness.sendDataCommand(
      intentBottle({ idempotencyKey: "idem-cortex-retry" }),
      { eventId: "cortex-retry" },
    );

    expect(retryTransport).toHaveBeenCalledTimes(2);
    expect(retried.executions[0].result).toMatchObject({
      outcome: "succeeded",
      attempts: [{ attemptCount: 1 }, { attemptCount: 2 }],
    });

    const authTransport = vi.fn().mockResolvedValue(
      cortexResponse({
        status: 401,
        ok: false,
        body: { error: { code: "auth_unauthorized", message: "unauthorized" } },
      }),
    );
    const authHarness = createCortexHarness({ transport: authTransport });
    const failed = await authHarness.sendDataCommand(
      intentBottle({ idempotencyKey: "idem-cortex-auth" }),
      { eventId: "cortex-auth" },
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

  it("fails fast for missing credential, idempotency key, and store", async () => {
    const transport = vi.fn();
    const missingCredentialHarness = createCortexHarness({
      transport,
      config: cortexConfig({ requestHeaders: {}, credentials: "omit" }),
    });
    const missingCredential = await missingCredentialHarness.sendDataCommand(intentBottle(), {
      eventId: "missing-credential",
    });
    const missingKeyHarness = createCortexHarness({ transport });
    const missingKey = await missingKeyHarness.sendDataCommand(
      intentBottle({ idempotencyKey: undefined }),
      { eventId: "missing-idempotency" },
    );
    const missingStoreHarness = createCortexHarness({ transport, idempotencyStore: null });
    const missingStore = await missingStoreHarness.sendDataCommand(intentBottle(), {
      eventId: "missing-store",
    });

    expect(transport).not.toHaveBeenCalled();
    expect(missingCredential.executions[0].result).toMatchObject({
      outcome: "failed",
      error: {
        code: "configuration_invalid",
      },
    });
    expect(missingKey.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingStore.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
  });

  it("redacts Cortex credentials, payloads, headers, URLs, responses, and errors", async () => {
    const transport = vi.fn().mockResolvedValue(
      cortexResponse({
        status: 503,
        ok: false,
        body: {
          error: {
            code: "upstream_unavailable",
            message: "failed https://cortex.example.test/callback?token=cortex-secret",
            details: {
              authorization: "Bearer cortex-secret",
              token: "cortex-secret",
            },
          },
        },
      }),
    );
    const harness = createCortexHarness({
      transport,
      config: cortexConfig({
        apiBaseUrl: "https://cortex.example.test?token=cortex-secret",
      }),
    });

    await harness.sendDataCommand(intentBottle({ idempotencyKey: "idem-cortex-redaction" }), {
      eventId: "cortex-redaction",
    });

    assertNoSecretLeak(harness.snapshot());
  });

  it("preserves poll/source identity separately from submission idempotency", () => {
    expect(
      resolveCortexPollSourceIdentity(
        {
          status: "accepted",
          jobId: "job-123",
          requestId: "req-123",
        },
        { parentEventIds: ["parent-1"] },
      ),
    ).toEqual({
      sourceId: "cortex:job-123",
      jobId: "job-123",
      requestId: "req-123",
      status: "accepted",
      parentEventIds: ["parent-1"],
    });
  });
});

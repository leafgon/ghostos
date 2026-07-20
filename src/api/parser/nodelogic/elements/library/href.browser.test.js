import { describe, expect, it, vi } from "vitest";

import { doBottle } from "../../datautils/bottling.js";
import {
  assertHrefNavigationCommand,
  executeHrefNavigationCommand,
  normalizeHrefNavigationCommand,
  resolveHrefNavigationIdempotency,
} from "./href.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "../../../runtime/sideEffectMigrationHarness.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("signature=deadbeef");
  expect(serialized).not.toContain("code=oauth-secret");
};

const createHrefHarness = ({ navigationTarget, idempotencyStore } = {}) =>
  createSideEffectAdapterMigrationHarness({
    adapterName: "href",
    runtimeTargetKey: "leafelement:href",
    executeSideEffect: ({ command }) => executeHrefNavigationCommand({ command, navigationTarget }),
    resolveCommand: ({ inputValues }) => normalizeHrefNavigationCommand(inputValues[0]),
    resolveIdempotency: ({ command }) => resolveHrefNavigationIdempotency(command),
    idempotencyStore,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
    retry: {
      enabled: false,
      maxAttempts: 1,
      retryableErrors: [],
    },
  });

const navigationCommand = (overrides = {}) => ({
  uri: "https://app.example.test/dashboard",
  domainCommandId: "navigate-1",
  tenantId: "tenant-1",
  integrationInstanceId: "browser-session-1",
  producerId: "producer-1",
  ...overrides,
});

describe("leafelement:href runtime navigation helpers", () => {
  it("normalizes legacy href-request bottles and requires target plus idempotency", () => {
    const command = normalizeHrefNavigationCommand(
      doBottle("href-request", {
        uri: "/editor/breezyforest/main",
        data: { source: "button" },
        domainCommandId: "nav-bottle-1",
      }),
    );

    expect(command).toMatchObject({
      uri: "/editor/breezyforest/main",
      data: { source: "button" },
      domainCommandId: "nav-bottle-1",
    });
    expect(() =>
      assertHrefNavigationCommand({
        domainCommandId: "missing-target",
      }),
    ).toThrow();
    expect(() =>
      resolveHrefNavigationIdempotency({
        uri: "/missing-idempotency",
      }),
    ).toThrow();
  });

  it("executes one data-triggered navigation and suppresses control/config ticks", async () => {
    const navigationTarget = vi.fn();
    const harness = createHrefHarness({ navigationTarget });

    await harness.sendDataCommand(navigationCommand(), { eventId: "href-data-1" });
    await harness.sendControlTick({ eventId: "href-control-1" });
    await harness.sendConfigRefresh({ eventId: "href-config-1" });

    expect(navigationTarget).toHaveBeenCalledTimes(1);
    expect(navigationTarget).toHaveBeenCalledWith(
      "https://app.example.test/dashboard",
      expect.objectContaining({ domainCommandId: "navigate-1" }),
    );
    expect(harness.snapshot().decisions.map((event) => event.decision)).toEqual([
      "execute",
      "skip",
      "skip",
    ]);
  });

  it("suppresses duplicate navigation commands by idempotency key within session scope", async () => {
    const navigationTarget = vi.fn();
    const harness = createHrefHarness({ navigationTarget });
    const command = navigationCommand({
      domainCommandId: "same-navigation-command",
    });

    await harness.sendDataCommand(command, { eventId: "href-data-1" });
    const duplicate = await harness.sendDataCommand(command, { eventId: "href-data-duplicate" });

    expect(navigationTarget).toHaveBeenCalledTimes(1);
    expect(duplicate.executions[0].result).toMatchObject({
      outcome: "suppressed",
      decision: "duplicate_succeeded",
    });
  });

  it("fails validation without navigating when target or idempotency metadata is missing", async () => {
    const navigationTarget = vi.fn();
    const harness = createHrefHarness({ navigationTarget });
    const missingTarget = await harness.sendDataCommand(
      navigationCommand({ uri: undefined, domainCommandId: "missing-target" }),
      { eventId: "missing-target" },
    );
    const missingIdempotency = await harness.sendDataCommand(
      navigationCommand({ domainCommandId: undefined }),
      { eventId: "missing-idempotency" },
    );
    const missingStoreHarness = createHrefHarness({ navigationTarget, idempotencyStore: null });
    const missingStore = await missingStoreHarness.sendDataCommand(navigationCommand(), {
      eventId: "missing-store",
    });

    expect(navigationTarget).not.toHaveBeenCalled();
    expect(missingTarget.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingIdempotency.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
    expect(missingStore.executions[0]).toMatchObject({
      type: "side_effect_migration_error",
    });
  });

  it("supports browser-safe no-op targets for deterministic tests", async () => {
    const assign = vi.fn();
    const navigationTarget = {
      href: "https://app.example.test/dashboard",
      assign,
    };

    const result = await executeHrefNavigationCommand({
      command: navigationCommand(),
      navigationTarget,
    });

    expect(assign).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "noop",
      navigated: false,
      reason: "already_at_target",
    });
  });

  it("redacts signed and credential-bearing navigation URLs from harness captures", async () => {
    const navigationTarget = vi.fn();
    const harness = createHrefHarness({ navigationTarget });

    await harness.sendDataCommand(
      navigationCommand({
        uri: "https://app.example.test/callback?signature=deadbeef&token=secret-token",
        domainCommandId: "redaction",
        data: {
          returnTo: "https://app.example.test/oauth?code=oauth-secret",
        },
      }),
      { eventId: "href-redaction" },
    );

    expect(navigationTarget).toHaveBeenCalledTimes(1);
    assertNoSecretLeak(harness.snapshot());
  });
});

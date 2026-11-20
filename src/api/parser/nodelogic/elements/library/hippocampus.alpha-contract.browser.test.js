import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  executeElementHippocampusIntent,
  resolveHippocampusIntentIdempotency,
} from "./hippocampus.js";

const fixtureRoot = join(process.cwd(), "tests", "fixtures", "hippocampus-adapter-contract");

const readFixture = (name) => {
  return JSON.parse(readFileSync(join(fixtureRoot, name), "utf8"));
};

describe("leafelement:hippocampus v1alpha1 adapter mapping", () => {
  it("maps command intent bottles to leaf-server request intent and outcome bottle", async () => {
    const inport = readFixture("inport.intent.command.success.json");
    const leafServerResponse = readFixture("leaf-server.response.command.success.json");
    const expectedOutport = readFixture("outport.outcome.command.success.json");

    const transport = vi.fn(async ({ intent }) => {
      expect(intent).toMatchObject({
        schemaVersion: "hippocampus-intent.v1alpha1",
        intentId: "intent-command-001",
        operation: "command",
        deploymentId: "f8d8d870-8815-5e5a-971f-d3c0bad1d504",
        method: "POST",
        path: "/api/hippocampus/f8d8d870-8815-5e5a-971f-d3c0bad1d504/commands/advance-document:execute",
        options: {
          idempotencyKey: "idem-command-001",
          timeoutMs: 15000,
          maxAttempts: 2,
        },
      });
      return leafServerResponse;
    });

    const output = await executeElementHippocampusIntent(
      inport,
      { requestId: "ctx-request-1" },
      {
        transport,
      },
    );

    expect(transport).toHaveBeenCalledTimes(1);
    expect(output._bname).toBe("outcome");
    expect(output._content).toEqual(expectedOutport._content);
    expect(output._label.parentEventId).toBe(inport._label.eventId);
    expect(output._label.eventId.startsWith("outcome-")).toBe(true);
  });

  it("maps retryable leaf-server failures to retryable alpha outcomes", async () => {
    const inport = readFixture("inport.intent.query.retryable.json");
    const leafServerResponse = readFixture(
      "leaf-server.response.error.dependency-unavailable.json",
    );
    const expectedOutport = readFixture("outport.outcome.query.retryable-error.json");

    const transport = vi.fn(async () => leafServerResponse);

    const output = await executeElementHippocampusIntent(
      inport,
      { requestId: "ctx-request-2" },
      {
        transport,
      },
    );

    expect(transport).toHaveBeenCalledTimes(1);
    expect(output._content).toEqual(expectedOutport._content);
    expect(output._label.parentEventId).toBe(inport._label.eventId);
  });

  it("uses instanceId for leaf-server proxy path when provided", async () => {
    const inport = readFixture("inport.intent.query.success.json");
    inport._content.instanceId = "ea6598d2-63b6-40ae-a161-2d6311a5bd6c";
    const leafServerResponse = readFixture("leaf-server.response.query.success.json");

    const transport = vi.fn(async ({ intent }) => {
      expect(intent).toMatchObject({
        operation: "query",
        deploymentId: "f8d8d870-8815-5e5a-971f-d3c0bad1d504",
        instanceId: "ea6598d2-63b6-40ae-a161-2d6311a5bd6c",
        method: "POST",
        path: "/api/hippocampus/ea6598d2-63b6-40ae-a161-2d6311a5bd6c/records/notes:query",
      });
      return leafServerResponse;
    });

    const output = await executeElementHippocampusIntent(
      inport,
      { requestId: "ctx-request-3" },
      {
        transport,
      },
    );

    expect(transport).toHaveBeenCalledTimes(1);
    expect(output._content.ok).toBe(true);
    expect(output._content.deploymentId).toBe("f8d8d870-8815-5e5a-971f-d3c0bad1d504");
  });

  it("falls back to execution-context elementNodeId when instanceId is omitted", async () => {
    const inport = readFixture("inport.intent.query.success.json");
    delete inport._content.instanceId;
    const leafServerResponse = readFixture("leaf-server.response.query.success.json");

    const transport = vi.fn(async ({ intent }) => {
      expect(intent).toMatchObject({
        operation: "query",
        deploymentId: "f8d8d870-8815-5e5a-971f-d3c0bad1d504",
        instanceId: "ea6598d2-63b6-40ae-a161-2d6311a5bd6c",
        method: "POST",
        path: "/api/hippocampus/ea6598d2-63b6-40ae-a161-2d6311a5bd6c/records/notes:query",
      });
      return leafServerResponse;
    });

    const output = await executeElementHippocampusIntent(
      inport,
      {
        requestId: "ctx-request-4",
        elementNodeId: "ea6598d2-63b6-40ae-a161-2d6311a5bd6c",
      },
      {
        transport,
      },
    );

    expect(transport).toHaveBeenCalledTimes(1);
    expect(output._content.ok).toBe(true);
  });

  it("derives idempotency metadata from alpha command intents", () => {
    const inport = readFixture("inport.intent.command.success.json");

    expect(resolveHippocampusIntentIdempotency(inport)).toMatchObject({
      required: true,
      key: "idem-command-001",
      scope: "f8d8d870-8815-5e5a-971f-d3c0bad1d504:command:advance-document",
      domainCommandId: "intent-command-001",
    });
  });
});

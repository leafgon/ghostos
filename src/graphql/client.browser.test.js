import { afterEach, describe, expect, it, vi } from "vitest";

import { REDACTED } from "../api/parser/runtime/safeLogging.js";
import { createGQLClient } from "./client.js";

const API_TOKEN = ["leaf", "live", "token-node-1", "secret"].join("_");
const tokenEvent = {
  type: "apiToken.created",
  version: "leaf.apiToken.v1",
  tokenId: "token-node-1",
  token: API_TOKEN,
  provenance: "user-a:main",
  scopes: ["graphql:write"],
  createdAt: "2026-07-12T12:00:00Z",
  expiresAt: "2026-10-10T12:00:00Z",
};

const makeJsonResponse = (body) => ({
  json: vi.fn().mockResolvedValue(body),
});

const serializeCalls = (mock) => JSON.stringify(mock.mock.calls);

describe("GraphQL client leaf event handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves one-time API token leaf events in the live response", async () => {
    const response = {
      data: { addNode: { node: [{ uuid: "token-node-1" }] } },
      extensions: { leafEvents: [tokenEvent] },
    };
    globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(response));
    const successCallback = vi.fn();
    const hook = vi.fn();
    const client = createGQLClient({
      endpoint: "https://example.test/qmgraphql",
      hook,
    });

    const result = await client.query(
      { query: JSON.stringify({ query: "mutation { addNode { node { uuid } } }" }) },
      successCallback,
    );

    expect(result.extensions.leafEvents[0].token).toBe(API_TOKEN);
    expect(successCallback.mock.calls[0][0].extensions.leafEvents[0].token).toBe(API_TOKEN);
    expect(hook.mock.calls[0][0].extensions.leafEvents[0]).toMatchObject({
      token: REDACTED,
      tokenId: "token-node-1",
      provenance: "user-a:main",
      scopes: ["graphql:write"],
      createdAt: "2026-07-12T12:00:00Z",
      expiresAt: "2026-10-10T12:00:00Z",
    });
    expect(serializeCalls(hook)).not.toContain(API_TOKEN);
  });

  it("redacts token material from GraphQL error diagnostics without changing thrown response", async () => {
    const response = {
      errors: [{ message: "failed" }],
      extensions: { leafEvents: [tokenEvent] },
    };
    globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(response));
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorCallback = vi.fn();
    const client = createGQLClient({ endpoint: "https://example.test/qmgraphql" });

    await expect(client.query({ query: "mutation" }, undefined, errorCallback)).rejects.toBe(
      response,
    );

    expect(errorCallback.mock.calls[0][0].extensions.leafEvents[0].token).toBe(API_TOKEN);
    expect(serializeCalls(consoleLog)).not.toContain(API_TOKEN);
    expect(serializeCalls(consoleLog)).toContain(REDACTED);
  });
});

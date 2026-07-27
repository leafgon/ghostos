import { afterEach, describe, expect, it, vi } from "vitest";

import { mutateAddNode } from "./leafgql.js";

const API_TOKEN = ["leaf", "live", "token-node-1", "secret"].join("_");

const makeJsonResponse = (body) => ({
  json: vi.fn().mockResolvedValue(body),
});

describe("leafgql mutation helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the full GraphQL envelope so leafEvents reach downstream consumers", async () => {
    const response = {
      data: { addNode: { node: [{ uuid: "token-node-1" }] } },
      extensions: {
        leafEvents: [
          {
            type: "apiToken.created",
            version: "leaf.apiToken.v1",
            tokenId: "token-node-1",
            token: API_TOKEN,
          },
        ],
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue(makeJsonResponse(response));
    vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await mutateAddNode({
      endpoint: "https://example.test/qmgraphql",
      variables: { uuid: "token-node-1", data: "{}", graphdomain: "d", graphappid: "a" },
    });

    expect(result).toBe(response);
    expect(result.extensions.leafEvents[0].token).toBe(API_TOKEN);
  });
});

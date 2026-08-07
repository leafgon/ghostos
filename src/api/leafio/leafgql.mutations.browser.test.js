import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
const createGQLClient = vi.fn(() => ({ query }));

vi.mock("../../graphql/client.js", () => ({ createGQLClient }));

const endpoint = "https://example.test/qmgraphql";
const response = {
  data: { mutation: { uuid: "result-id" } },
  extensions: { leafEvents: [{ type: "test.event" }] },
};

describe("public graph mutation acknowledgements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["mutateAddNode", { variables: { uuid: "node-a" }, endpoint }],
    ["mutateUpdateNode", { variables: { uuid: "node-a" }, endpoint }],
    ["mutateDelNode", { node_uuid: "node-a", endpoint }],
    ["mutateAddEdge", { variables: { uuid: "edge-a" }, endpoint }],
    ["mutateDelEdge", { edge_uuid: "edge-a", endpoint }],
  ])("returns the exact envelope from %s", async (name, request) => {
    query.mockResolvedValue(response);
    const mutations = await import("./leafgql.js");

    await expect(mutations[name](request)).resolves.toBe(response);
    expect(createGQLClient).toHaveBeenCalledWith({
      endpoint,
      headers: { Accept: "application/json" },
    });
    expect(query).toHaveBeenCalledOnce();
  });

  it.each([
    ["mutateAddNode", { variables: { uuid: "node-a" }, endpoint }],
    ["mutateUpdateNode", { variables: { uuid: "node-a" }, endpoint }],
    ["mutateDelNode", { node_uuid: "node-a", endpoint }],
    ["mutateAddEdge", { variables: { uuid: "edge-a" }, endpoint }],
    ["mutateDelEdge", { edge_uuid: "edge-a", endpoint }],
  ])("propagates a rejected %s request", async (name, request) => {
    const error = new Error("network unavailable");
    query.mockRejectedValue(error);
    const mutations = await import("./leafgql.js");

    await expect(mutations[name](request)).rejects.toBe(error);
  });

  it("uses the configured default mutation endpoint", async () => {
    query.mockResolvedValue(response);
    const mutations = await import("./leafgql.js");
    mutations.setLEAFgqlEndpoints({ endpoint_qm: endpoint });

    await expect(mutations.mutateUpdateNode({ variables: { uuid: "node-a" } })).resolves.toBe(
      response,
    );
    expect(createGQLClient).toHaveBeenCalledWith({
      endpoint,
      headers: { Accept: "application/json" },
    });
  });
});

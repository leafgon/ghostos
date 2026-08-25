import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "buffer";

import { executeLEAFGraph, reducedLEAFGraph } from "../../index.core.js";
import { executeLEAFLogic } from "./leaf.js";
import { doBottle } from "./nodelogic/datautils/bottling.js";
import {
  LIST_SCHEMA_VERSION,
  STORE_SCHEMA_VERSION,
  createInMemoryBlobStorageAdapter,
  executeBlobStoreBottle,
} from "./nodelogic/elements/library/blob.js";

const loadTestbedGraph = async () => {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(moduleDir, "../../../tests/breezyforest-testbed.json");

  return JSON.parse(await readFile(fixturePath, "utf-8"));
};

const toBase64Str = (value) => Buffer.from(JSON.stringify(value)).toString("base64");

const buildBlobListGraph = () => ({
  nodes: [
    {
      uuid: "node-in",
      out_edges: [
        {
          uuid: "edge-in-blob",
          source: { uuid: "node-in" },
          target: { uuid: "node-blob" },
          data: toBase64Str({
            leaf: { api: "breezyforest", logic: { type: "leafdataedge" } },
          }),
        },
      ],
      data: toBase64Str({
        leaf: {
          logic: { type: "leafinflowport", args: {} },
          api: "breezyforest",
          appdata: { position: { x: 0, y: 0 } },
        },
      }),
    },
    {
      uuid: "node-blob",
      out_edges: [
        {
          uuid: "edge-blob-out",
          source: { uuid: "node-blob" },
          target: { uuid: "node-out" },
          data: toBase64Str({
            leaf: { api: "breezyforest", logic: { type: "leafdataedge" } },
          }),
        },
      ],
      data: toBase64Str({
        leaf: {
          logic: { type: "leafelement", args: { elementname: "blob" } },
          api: "breezyforest",
          appdata: { position: { x: 50, y: 0 } },
        },
      }),
    },
    {
      uuid: "node-out",
      out_edges: [],
      data: toBase64Str({
        leaf: {
          logic: { type: "leafoutflowport", args: {} },
          api: "breezyforest",
          appdata: { position: { x: 100, y: 0 } },
        },
      }),
    },
  ],
});

describe("LEAF graph runtime wrappers", () => {
  it("reduces LEAF graph JSON to an executable LEAF logic function", async () => {
    const graph = await loadTestbedGraph();
    const leaflogic = await reducedLEAFGraph(graph, {
      domain: "breezyforest",
      appid: "testbed",
    });

    const output = await executeLEAFLogic(leaflogic, { hello: "world" });

    expect(output).toBe("world");
  }, 15000);

  it("executes LEAF graph JSON with input data", async () => {
    const graph = await loadTestbedGraph();
    const output = await executeLEAFGraph(
      graph,
      { hello: "world" },
      {
        domain: "breezyforest",
        appid: "testbed",
      },
    );

    expect(output).toBe("world");
  }, 15000);

  it("accepts a raw nodes array as graph JSON", async () => {
    const graph = await loadTestbedGraph();
    const output = await executeLEAFGraph(
      graph.data.graph.nodes,
      { hello: "world" },
      {
        domain: "breezyforest",
        appid: "testbed",
      },
    );

    expect(output).toBe("world");
  }, 15000);

  it("propagates runtimeconfig blob execution context through eta controlflow", async () => {
    const blobStorageAdapter = createInMemoryBlobStorageAdapter();
    const executionContext = {
      tenantId: "tenant-a",
      graphDomainId: "domain-a",
      graphAppId: "app-a",
      actorRef: "user:owner-a",
      correlationId: "corr-runtime-blob-list",
      blobStorageAdapter,
    };

    await executeBlobStoreBottle(
      {
        schemaVersion: STORE_SCHEMA_VERSION,
        operation: "create",
        blobElementId: "node-blob",
        requestedObjectId: "logo",
        contentType: "image/png",
        contentLength: 123,
        contentHash: `sha256:${"a".repeat(64)}`,
        payloadRef: { kind: "inline-bytes", ref: "inline-a" },
      },
      executionContext,
    );

    const output = await executeLEAFGraph(
      buildBlobListGraph(),
      doBottle("blob-list", { schemaVersion: LIST_SCHEMA_VERSION }),
      {
        domain: "domain-a",
        appid: "app-a",
        runtimeconfig: {
          blobExecutionContext: executionContext,
        },
      },
    );

    expect(output).toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [{ objectId: "logo", blobElementId: "node-blob" }],
    });
  }, 15000);
});

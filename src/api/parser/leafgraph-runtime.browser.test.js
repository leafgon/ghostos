import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { executeLEAFGraph, reducedLEAFGraph } from "../../index.core.js";
import { executeLEAFLogic } from "./leaf.js";

const loadTestbedGraph = async () => {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(moduleDir, "../../../tests/breezyforest-testbed.json");

  return JSON.parse(await readFile(fixturePath, "utf-8"));
};

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
});

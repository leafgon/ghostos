import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { executeLEAFLogic, reconstructLEAFGraph, analyzeLEAFGraph } from "./leaf.js";
import { runtimeEtaTree } from "./eta.js";
import { _leafgraph } from "./nodelogic/abstraction/index.js";

const loadTestbedPayload = async () => {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(
    moduleDir,
    "../../../tests/breezyforest-testbed.json"
  );
  return JSON.parse(await readFile(fixturePath, "utf-8"));
};

const loadTestbedNodes = async () => {
  const payload = await loadTestbedPayload();
  const nodes = payload?.data?.graph?.nodes;

  if (!Array.isArray(nodes)) {
    throw new Error("Expected breezyforest-testbed.json to include graph nodes.");
  }

  return nodes;
};

describe("leafgraph lambda (testbed)", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      delete globalThis.fetch;
    }
  });

  it(
    "executes the test-schema spelldef from breezyforest/testbed",
    async () => {
      const nodes = await loadTestbedNodes();
      const leafgraph = reconstructLEAFGraph(nodes);
      const leafcomponents = analyzeLEAFGraph(leafgraph);

      const leafio = {
        getCurLEAFIOState: () => ({}),
        getMasterSubsDir: () => ({}),
        setNewLEAFIOState: () => true,
        setLEAFIOCallback: () => {},
      };

      const leaflakeio = {
        qm_methods: {
          queryGraph: async () => ({ graph: { nodes } }),
        },
      };

      const mainMnemosyne = { current: {} };
      const etaTree = runtimeEtaTree(
        "nav",
        "breezyforest",
        "testbed",
        "breezyforest",
        "testbed",
        leafgraph,
        leafcomponents,
        leafio,
        leaflakeio,
        mainMnemosyne
      );

      const lambdactrl = {
        gos: {
          standardSpellbook: {},
          curatedSpellbook: {},
          stdlambdalut: {},
          curatedlambdalut: {},
          leafio: etaTree.leafio,
          etaTree,
        },
        user: {
          spellbook: {},
          lambdalut: {},
        },
      };

      const leafgraph_args = {
        graphuuid: "",
        domain: "breezyforest",
        appid: "testbed",
        graphaddrstr: "breezyforest/testbed",
      };
      const getLEAFGraph = _leafgraph.lambda(lambdactrl)({
        refnodedata: { leaf: { logic: { args: leafgraph_args } } },
        nodelambda: [],
        contextuallambda: ["leafvisualelements"],
      });
      const rt_leafgraph = await getLEAFGraph;

      expect(rt_leafgraph).toBeDefined();
      expect(rt_leafgraph["test-schema"]).toBeDefined();
      expect(rt_leafgraph["test-schema"]._default).toBeDefined();

      const output = await executeLEAFLogic(
        rt_leafgraph["test-schema"]._default,
        []
      );

      expect(output).toEqual({
        title: "inport schema",
        type: "object",
        required: ["hello", "data"],
        properties: {
          hello: { type: "string" },
          data: { type: "string" },
        },
      });
    },
    15000
  );

  it(
    "executes the test-schema spelldef from a GitHub-hosted leafgraph",
    async () => {
      const payload = await loadTestbedPayload();
      const nodes = payload?.data?.graph?.nodes ?? [];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      });

      const leafgraph = reconstructLEAFGraph(nodes);
      const leafcomponents = analyzeLEAFGraph(leafgraph);

      const leafio = {
        getCurLEAFIOState: () => ({}),
        getMasterSubsDir: () => ({}),
        setNewLEAFIOState: () => true,
        setLEAFIOCallback: () => {},
      };

      const leaflakeio = {
        qm_methods: {
          queryGraph: async () => ({ graph: { nodes } }),
        },
      };

      const mainMnemosyne = { current: {} };
      const etaTree = runtimeEtaTree(
        "nav",
        "breezyforest",
        "testbed",
        "breezyforest",
        "testbed",
        leafgraph,
        leafcomponents,
        leafio,
        leaflakeio,
        mainMnemosyne
      );

      const lambdactrl = {
        gos: {
          standardSpellbook: {},
          curatedSpellbook: {},
          stdlambdalut: {},
          curatedlambdalut: {},
          leafio: etaTree.leafio,
          etaTree,
        },
        user: {
          spellbook: {},
          lambdalut: {},
        },
      };

      const leafgraph_args = {
        graphuuid: "",
        domain: "github",
        appid: "leafgon/leafgraphs/tests/breezyforest-testbed?token=abc123",
        graphaddrstr: "github/leafgon/leafgraphs/tests/breezyforest-testbed?token=abc123",
      };
      const getLEAFGraph = _leafgraph.lambda(lambdactrl)({
        refnodedata: { leaf: { logic: { args: leafgraph_args } } },
        nodelambda: [],
        contextuallambda: ["leafvisualelements"],
      });
      const rt_leafgraph = await getLEAFGraph;

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-testbed.json?token=abc123"
      );
      expect(rt_leafgraph).toBeDefined();
      expect(rt_leafgraph["test-schema"]).toBeDefined();
      expect(rt_leafgraph["test-schema"]._default).toBeDefined();

      const output = await executeLEAFLogic(
        rt_leafgraph["test-schema"]._default,
        []
      );

      expect(output).toEqual({
        title: "inport schema",
        type: "object",
        required: ["hello", "data"],
        properties: {
          hello: { type: "string" },
          data: { type: "string" },
        },
      });
    },
    15000
  );
});

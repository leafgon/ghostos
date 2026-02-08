import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { executeLEAFLogic, reconstructLEAFGraph, analyzeLEAFGraph } from "./leaf.js";
import { runtimeEtaTree } from "./eta.js";
import { _leafgraph } from "./nodelogic/abstraction/index.js";

const loadTestsPayload = async () => {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(
    moduleDir,
    "../../../tests/breezyforest-tests.json"
  );
  return JSON.parse(await readFile(fixturePath, "utf-8"));
};

const getLeafSpellDefs = (nodes) =>
  nodes
    .filter((node) => node?.leafnodetype === "leafspelldef")
    .map((node) => {
      const raw = Buffer.from(node?.data ?? "", "base64").toString("utf-8");
      const payload = raw ? JSON.parse(raw) : {};
      return payload?.leaf?.logic?.args?.spellname ?? "";
    })
    .filter(Boolean);

describe("leafgraph lambda (breezyforest-tests)", () => {
  let originalFetch;
  let payload;
  let nodes;
  let expectedSpells;

  const buildRuntimeLeafgraph = async () => {
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
      "tests",
      "breezyforest",
      "tests",
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
      appid: "leafgon/leafgraphs/tests/breezyforest-tests?token=abc123",
      graphaddrstr:
        "github/leafgon/leafgraphs/tests/breezyforest-tests?token=abc123",
    };
    const getLEAFGraph = _leafgraph.lambda(lambdactrl)({
      refnodedata: { leaf: { logic: { args: leafgraph_args } } },
      nodelambda: [],
      contextuallambda: ["leafvisualelements"],
    });

    return getLEAFGraph;
  };

  beforeEach(async () => {
    originalFetch = globalThis.fetch;
    payload = await loadTestsPayload();
    nodes = payload?.data?.graph?.nodes ?? [];
    expectedSpells = getLeafSpellDefs(nodes);
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      delete globalThis.fetch;
    }
  });

  it(
    "executes test-label-const from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-label-const"]).toBeDefined();
      expect(rt_leafgraph["test-label-const"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-label-const"]._default,
        []
      );
      expect(output).toBe("hello");
    },
    15000
  );

  it(
    "executes test-spell from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-spell"]).toBeDefined();
      expect(rt_leafgraph["test-spell"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-spell"]._default,
        []
      );
      expect(output).toBe("hello");
    },
    15000
  );

  it(
    "executes test-loopy-bypass from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-loopy-bypass"]).toBeDefined();
      expect(rt_leafgraph["test-loopy-bypass"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-loopy-bypass"]._default,
        []
      );
      expect(output).toEqual(["bypassed"]);
    },
    15000
  );

  it(
    "executes test-loopy-straight from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-loopy-straight"]).toBeDefined();
      expect(rt_leafgraph["test-loopy-straight"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-loopy-straight"]._default,
        []
      );
      expect(output).toBe("straight");
    },
    15000
  );

  it(
    "executes test-loopy-loop from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-loopy-loop"]).toBeDefined();
      expect(rt_leafgraph["test-loopy-loop"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-loopy-loop"]._default,
        []
      );
      expect(output).toEqual(["bypass", "bypass"]);
    },
    15000
  );

  it(
    "executes test-default-mix from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-default-mix"]).toBeDefined();
      expect(rt_leafgraph["test-default-mix"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-default-mix"]._default,
        []
      );
      expect(output).toEqual({ bottle1: "ingredient1", bottle2: "ingredient2" });
    },
    15000
  );

  it(
    "executes test-parfait-mix from a GitHub-hosted leafgraph",
    async () => {
      const rt_leafgraph = await buildRuntimeLeafgraph();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/leafgon/leafgraphs/refs/heads/main/tests/breezyforest-tests.json?token=abc123"
      );
      expect(expectedSpells.length).toBeGreaterThan(0);
      expect(rt_leafgraph["test-parfait-mix"]).toBeDefined();
      expect(rt_leafgraph["test-parfait-mix"]._default).toBeDefined();
      const output = await executeLEAFLogic(
        rt_leafgraph["test-parfait-mix"]._default,
        []
      );
      expect(output).toEqual(["ingredient1", "ingredient2"]);
    },
    15000
  );
});

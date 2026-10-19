import { executeLEAFGraph, doBottle } from "ghostos";
import { Buffer } from "node:buffer";

const endpoint = process.env.LEAFGON_ENDPOINT_QM || "https://www.leafgon.com/qmgraphql";
const domain = "breezyforest";
const appid = "tests";

const graphQuery = `query($domain:String!, $appid:String!) {
  graph: getGraph(domain: $domain, appid: $appid, filter: {}) {
    domain
    appid
    nodes {
      uuid
      data
      out_edges {
        uuid
        source { uuid }
        target { uuid }
        data
      }
    }
    edges {
      uuid
      source { uuid }
      target { uuid }
      data
    }
  }
}`;

const decode = (value) => {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64");

const mkNodeData = (type, args = {}, x = 0, y = 0) =>
  encode({
    leaf: {
      logic: { type, args },
      api: "breezyforest",
      appdata: { position: { x, y } },
    },
  });

const mkEdgeData = (type) =>
  encode({
    leaf: {
      api: "breezyforest",
      logic: { type },
    },
  });

const fetchGraph = async () => {
  const headers = {
    "content-type": "application/json",
    accept: "application/json",
  };

  if (process.env.LEAFGON_CLIENT_AUTH_KEY) {
    headers["X-API-Key"] = process.env.LEAFGON_CLIENT_AUTH_KEY;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: graphQuery, variables: { domain, appid } }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL endpoint returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }

  const graph = payload?.data?.graph;
  if (!graph?.nodes?.length) {
    const authHint = process.env.LEAFGON_CLIENT_AUTH_KEY
      ? "Check that the API key has access to breezyforest/tests and that endpoint/domain/appid are correct."
      : "Set LEAFGON_CLIENT_AUTH_KEY if your endpoint requires auth for breezyforest/tests.";
    throw new Error(`No nodes returned for ${domain}/${appid} from ${endpoint}. ${authHint}`);
  }

  return graph;
};

const collectGraphIndex = (graph) => {
  const nodesById = new Map();

  for (const node of graph.nodes) {
    const decoded = decode(node.data);
    const logic = decoded?.leaf?.logic ?? {};
    nodesById.set(node.uuid, {
      uuid: node.uuid,
      out_edges: node.out_edges ?? [],
      type: logic.type,
      args: logic.args ?? {},
    });
  }

  return nodesById;
};

const collectSpellDefs = (nodesById) => {
  const spellDefs = new Map();

  for (const node of nodesById.values()) {
    if (node.type !== "leafspelldef") continue;
    const spell = node.args?.spellname;
    if (typeof spell === "string" && spell.length > 0) {
      spellDefs.set(spell, node.uuid);
    }
  }

  return spellDefs;
};

const collectNativeCallers = (nodesById) => {
  const callersBySpell = new Map();

  const addCaller = (spell, caller) => {
    if (!callersBySpell.has(spell)) callersBySpell.set(spell, []);
    callersBySpell.get(spell).push(caller);
  };

  for (const node of nodesById.values()) {
    if (node.type !== "leafspell") continue;
    const spell = node.args?.spellname;
    if (typeof spell === "string" && spell.length > 0) {
      addCaller(spell, {
        uuid: node.uuid,
        type: node.type,
        mode: "leafspell.args.spellname",
        synthetic: false,
      });
    }
  }

  const decodeEdgeType = (edgeData) => decode(edgeData)?.leaf?.logic?.type;

  for (const node of nodesById.values()) {
    if (node.type !== "leafloopyspell") continue;

    for (const edge of node.out_edges ?? []) {
      if (decodeEdgeType(edge.data) !== "leaflambdaedge") continue;
      const target = nodesById.get(edge.target?.uuid);
      if (!target || target.type !== "leafspelldef") continue;
      const spell = target.args?.spellname;
      if (typeof spell === "string" && spell.length > 0) {
        addCaller(spell, {
          uuid: node.uuid,
          type: node.type,
          mode: "lambda-edge->spelldef",
          synthetic: false,
        });
      }
    }
  }

  return callersBySpell;
};

const attachSyntheticCallers = ({ graph, spellDefs, callersBySpell }) => {
  const graphBySpell = new Map();

  const addCaller = (spell, caller) => {
    if (!callersBySpell.has(spell)) callersBySpell.set(spell, []);
    callersBySpell.get(spell).push(caller);
  };

  for (const [spell, defUuid] of spellDefs.entries()) {
    if ((callersBySpell.get(spell) ?? []).length > 0) {
      graphBySpell.set(spell, graph);
      continue;
    }

    const spellCallerUuid = `harness-spell-${spell}`;
    const outUuid = `harness-out-${spell}`;
    const lambdaEdgeUuid = `harness-edge-lambda-${spell}`;
    const dataEdgeUuid = `harness-edge-data-${spell}`;

    const callerNode = {
      uuid: spellCallerUuid,
      data: mkNodeData("leafspell", { spellname: spell }, 2000, 2000),
      out_edges: [
        {
          uuid: lambdaEdgeUuid,
          source: { uuid: spellCallerUuid },
          target: { uuid: defUuid },
          data: mkEdgeData("leaflambdaedge"),
        },
        {
          uuid: dataEdgeUuid,
          source: { uuid: spellCallerUuid },
          target: { uuid: outUuid },
          data: mkEdgeData("leafdataedge"),
        },
      ],
    };

    const outNode = {
      uuid: outUuid,
      data: mkNodeData("leafoutflowport", {}, 2200, 2000),
      out_edges: [],
    };

    const graphCopy = {
      ...graph,
      nodes: [...graph.nodes, callerNode, outNode],
      edges: [
        ...graph.edges,
        {
          uuid: lambdaEdgeUuid,
          source: { uuid: spellCallerUuid },
          target: { uuid: defUuid },
          data: mkEdgeData("leaflambdaedge"),
        },
        {
          uuid: dataEdgeUuid,
          source: { uuid: spellCallerUuid },
          target: { uuid: outUuid },
          data: mkEdgeData("leafdataedge"),
        },
      ],
    };

    addCaller(spell, {
      uuid: spellCallerUuid,
      type: "leafspell",
      mode: "synthetic-leafspell",
      synthetic: true,
    });

    graphBySpell.set(spell, graphCopy);
  }

  return graphBySpell;
};

const dedupeCallers = (callersBySpell) => {
  const deduped = [];

  for (const [spell, callers] of callersBySpell.entries()) {
    const seen = new Set();

    for (const caller of callers) {
      const key = `${spell}::${caller.uuid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push({ spell, ...caller });
    }
  }

  return deduped;
};

const runValidation = async ({ graph, spellDefs, callersBySpell, graphBySpell }) => {
  const testInputs = [
    { name: "object", value: { hello: "world", input: "smoke-test" } },
    {
      name: "accio-data",
      value: doBottle("accio", "data_accio", { provenance: "node-harness" }),
    },
    {
      name: "plain-bottle",
      value: doBottle("test", { hello: "world" }, { provenance: "node-harness" }),
    },
  ];

  const callers = dedupeCallers(callersBySpell);
  const runResults = [];

  for (const caller of callers) {
    const graphForSpell = graphBySpell.get(caller.spell) ?? graph;
    let success = null;
    const errors = [];

    for (const input of testInputs) {
      try {
        const output = await executeLEAFGraph(graphForSpell, input.value, {
          domain,
          appid,
          refnode: caller.uuid,
        });

        success = {
          input: input.name,
          outputType: typeof output,
          outputPreview: JSON.stringify(output)?.slice(0, 120),
        };
        break;
      } catch (error) {
        errors.push({ input: input.name, error: String(error?.message ?? error) });
      }
    }

    runResults.push({ ...caller, ok: Boolean(success), success, errors });
  }

  const spells = [...spellDefs.keys()].sort();

  return spells.map((spell) => {
    const runs = runResults.filter((run) => run.spell === spell);

    return {
      spell,
      pass: runs.some((run) => run.ok),
      callerCount: runs.length,
      syntheticUsed: runs.some((run) => run.synthetic),
      runs,
    };
  });
};

const printSummary = (summary) => {
  const passing = summary.filter((spell) => spell.pass).length;
  const failing = summary.length - passing;

  console.log("=== breezyforest/tests spell validation (Node.js, exhaustive) ===");
  console.log(
    `endpoint=${endpoint} spellDefs=${summary.length} passingSpells=${passing} failingSpells=${failing}`,
  );

  for (const spell of summary) {
    console.log(
      `${spell.pass ? "PASS" : "FAIL"} spell=${spell.spell} callers=${spell.callerCount} syntheticUsed=${spell.syntheticUsed}`,
    );

    for (const run of spell.runs) {
      if (run.ok) {
        console.log(
          `  - ok caller=${run.uuid} type=${run.type} mode=${run.mode} synthetic=${run.synthetic} input=${run.success.input} outputType=${run.success.outputType} output=${run.success.outputPreview}`,
        );
        continue;
      }

      const brief = run.errors.map((error) => `${error.input}:${error.error}`).join(" | ");
      console.log(
        `  - fail caller=${run.uuid} type=${run.type} mode=${run.mode} synthetic=${run.synthetic} errors=${brief}`,
      );
    }
  }

  return failing;
};

const graph = await fetchGraph();
const nodesById = collectGraphIndex(graph);
const spellDefs = collectSpellDefs(nodesById);
const callersBySpell = collectNativeCallers(nodesById);
const graphBySpell = attachSyntheticCallers({ graph, spellDefs, callersBySpell });
const summary = await runValidation({ graph, spellDefs, callersBySpell, graphBySpell });
const failing = printSummary(summary);

if (failing > 0) {
  process.exitCode = 2;
}

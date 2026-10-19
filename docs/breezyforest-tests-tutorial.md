# Tutorial: learn with `/editor/breezyforest/tests` graphs

This tutorial uses example graphs from the LEAF editor tests namespace:

- `https://www.leafgon.com/editor/breezyforest/tests`

These graphs are useful for learning usage patterns and can be downloaded and
run locally with Node.js.

## 0) Prerequisites

- Node.js `>=24`
- `ghostos` installed in your project
- `gq` CLI available for GraphQL fetch examples
- Network access to `https://www.leafgon.com/qmgraphql`
- `LEAFGON_CLIENT_AUTH_KEY` exported if your GraphQL endpoint requires API-key auth

Install package if needed:

```bash
npm i ghostos
```

## 1) Choose a graph from the tests namespace

Open the tests namespace in the editor and pick a graph that matches your
learning goal:

- basic data transform pattern
- runtime wrapper pattern
- element rendering or routing pattern

Record the graph app id as `tests/<example-graph>`.

## 2) Download graph JSON from Leafgon GraphQL

You can fetch the graph JSON directly and save it locally:

```bash
mkdir -p ./graphs
gq https://www.leafgon.com/qmgraphql -q 'query {graph: getGraph(domain: "breezyforest", appid: "tests/<example-graph>", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges {uuid source {uuid} target {uuid}}}}' > ./graphs/tests-example.json
```

## 3) Run locally with Node.js

Create `run-tests-graph.mjs`:

```js
import { readFile } from "node:fs/promises";
import { executeLEAFGraph } from "ghostos";

const graph = JSON.parse(await readFile("./graphs/tests-example.json", "utf8"));

const output = await executeLEAFGraph(
  graph,
  { hello: "world" },
  {
    domain: "breezyforest",
    appid: "tests/<example-graph>",
  },
);

console.log(output);
```

Run it:

```bash
node run-tests-graph.mjs
```

## 4) Iterate with different patterns

Repeat steps 1-3 with multiple test graphs and compare behavior:

- how input payloads are transformed
- which node types are active in each flow
- where side effects are introduced vs pure transforms

## 5) Validate all defined spells in this namespace

Run the built-in validation harness:

```bash
npm run validate:breezyforest-tests
```

The command produces a per-spell pass/fail report and exits non-zero when any
spell fails.

## 6) Optional: inspect reduction before execution

If you want to inspect component selection first:

```js
import { reducedLEAFGraph } from "ghostos";

const leaflogic = await reducedLEAFGraph(graph, {
  domain: "breezyforest",
  appid: "tests/<example-graph>",
  componentScope: "runtime",
  componentIndex: 0,
});
```

Then execute reduced logic with your own runtime flow, or continue using
`executeLEAFGraph` for one-call execution.

## 7) Native vs synthetic caller caveat

Some `leafspelldef` nodes in `breezyforest/tests` may not have a dedicated
caller node wired in the graph at all times. The validation harness generates
temporary in-memory caller wiring for uncoupled spell definitions so every
defined spell can be executed in Node.js.

# LEAF intro + local Node.js parser tutorial

This guide connects the LEAF editor intro/tutorial path to local execution with the `ghostos` npm package.

## 1) Start with LEAF concepts

If you are coming from the editor, start at:

- `https://www.leafgon.com/editor/breezyforest/guides?topic=top`

Then keep this mental model while coding locally:

- **Graph domain**: nodes and edges coordinate execution and dataflow.
- **Text domain (LEAFlisp)**: expressions transform payloads.

Typical first flow:

- `Inport -> Leaflisp -> ScreenIO`
- `Inport -> Leaflisp -> Outport`

## 2) Local prerequisites

- Node.js `>=24`
- ESM project support

Install:

```bash
npm i ghostos
```

## 3) Fastest local win: run LEAFlisp directly

Create `run-leaflisp.mjs`:

```js
import { executeLEAFlisp } from "ghostos/core";

const input = { name: "LEAF", count: 2 };
const code = `
(do
  (def nextCount (+ (get inport :count) 1))
  (return {:message (+ "hello " (get inport :name)) :count nextCount})
)
`;

const output = await executeLEAFlisp(input, code);
console.log(output);
```

Run:

```bash
node run-leaflisp.mjs
```

`executeLEAFlisp` injects your input as `inport`, executes LEAFlisp, and converts output back to JS values.

## 4) Execute a full LEAF graph JSON locally

Export or obtain a graph JSON from the editor/server and store it as `graph.json`.

Create `run-graph.mjs`:

```js
import { readFile } from "node:fs/promises";
import { executeLEAFGraph } from "ghostos/core";

const graph = JSON.parse(await readFile("./graph.json", "utf8"));

const output = await executeLEAFGraph(
  graph,
  { hello: "world" },
  {
    domain: "breezyforest",
    appid: "local-test",
  },
);

console.log(output);
```

Run:

```bash
node run-graph.mjs
```

Accepted graph input shapes include raw `nodes[]`, `{nodes:[...]}`, `{graph:{nodes:[...]}}`, and `{data:{graph:{nodes:[...]}}}`.

## 5) Advanced control: reduce first, execute later

Use `reducedLEAFGraph` when you want to inspect/select a component before execution:

```js
import { reducedLEAFGraph } from "ghostos/core";

const leaflogic = await reducedLEAFGraph(graph, {
  domain: "breezyforest",
  appid: "local-test",
  componentScope: "runtime", // or "lambda" / "dataflow-lambda"
  componentIndex: 0,
});
```

Then execute with `executeLEAFLogic` or keep using `executeLEAFGraph` for the simpler path.

## 6) Override GraphQL endpoints when needed

If you connect to non-default backends, override endpoints explicitly:

```js
import { setLEAFgqlEndpoints, initializeLEAFlakeGQLClient } from "ghostos/core";

setLEAFgqlEndpoints({
  endpoint_subs: "https://example.com/sgraphql",
  websocket_subs: "wss://example.com/sgraphql",
  endpoint_qm: "https://example.com/qmgraphql",
});

initializeLEAFlakeGQLClient({
  _clientConfig: {
    dburi_subs: "https://example.com/sgraphql",
    dburi_subs_ws: "wss://example.com/sgraphql",
    dburi_qm: "https://example.com/qmgraphql",
    clientAuthKey: "<api-key-if-required>",
  },
});
```

You can also set env vars:

- `LEAFGON_ENDPOINT_SUBS`
- `LEAFGON_WEBSOCKET_SUBS`
- `LEAFGON_ENDPOINT_QM`

## 7) Troubleshooting

- **Error**: `reducedLEAFGraph requires graph JSON with a nodes array.`
  - Ensure your input has one of the accepted shapes and includes `nodes`.
- **Unexpected LEAFlisp behavior**
  - Start with `(return inport)` to validate payload shape first.
- **Remote fetch/subscription issues**
  - Verify endpoint URLs and API key wiring before debugging graph logic.

## 8) Next reading

- `docs/leaflisp.md`
- `docs/github-leafgraphs.md`
- `docs/leafgon-leafgraphs.md`

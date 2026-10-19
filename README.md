# ghostos

`ghostos` is the public MIT-licensed npm runtime for LEAF graph parsing and execution, used by leafgon.com.

## Install

```bash
npm i ghostos
```

## Runtime requirements

- Node.js `>=24.0.0`
- ESM environment (package `type: module`)

## Documentation

- Docs map (start here): [Documentation index](https://github.com/leafgon/ghostos/blob/main/docs/README.md)
- LEAF intro + local Node.js tutorial: [LEAF Intro (Node.js)](https://github.com/leafgon/ghostos/blob/main/docs/leaf-intro-nodejs.md)
- Tutorial using `/editor/breezyforest/tests` example graphs: [Breezyforest Tests Tutorial](https://github.com/leafgon/ghostos/blob/main/docs/breezyforest-tests-tutorial.md)
- Spell validation report for `/editor/breezyforest/tests`: [Breezyforest Tests Validation](https://github.com/leafgon/ghostos/blob/main/docs/breezyforest-tests-validation.md)
- LEAFlisp reference: [LEAFlisp Reference](https://github.com/leafgon/ghostos/blob/main/docs/leaflisp.md)
- Runtime wrappers guide: [Runtime Wrappers Guide](https://github.com/leafgon/ghostos/blob/main/docs/leafgraph-runtime-wrappers.md)
- Release notes: [Release Notes](https://github.com/leafgon/ghostos/tree/main/docs/release-notes)

## Core usage

```js
import { setLEAFgqlEndpoints, initializeLEAFlakeGQLClient } from "ghostos";

setLEAFgqlEndpoints({
  endpoint_subs: "https://www.leafgon.com/sgraphql",
  websocket_subs: "wss://www.leafgon.com/sgraphql",
  endpoint_qm: "https://www.leafgon.com/qmgraphql",
});

initializeLEAFlakeGQLClient({
  _clientConfig: {
    dburi_subs: "https://www.leafgon.com/sgraphql",
    dburi_subs_ws: "wss://www.leafgon.com/sgraphql",
    dburi_qm: "https://www.leafgon.com/qmgraphql",
  },
});
```

Use the package entrypoint import path (`"ghostos"`) for runtime examples.

## Canonical LEAFlisp node data

The standard `leaflisp` scaffold always includes `leaf.object`, initialized to
`null`. Graph mutation clients must preserve that field alongside
`leaf.logic.args.lispexpression`; Leaf Server materializes its value from the
expression when the node has no incoming data-edge connection.

## Getting graph data from leafgon.com

```bash
gq https://www.leafgon.com/qmgraphql -q 'query {graph: getGraph(domain: "breezyforest", appid: "tests", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges { uuid source {uuid} target {uuid} } }}' > ./tests/breezyforest-tests-example.json
```

Equivalent `curl` command:

```bash
curl -sS https://www.leafgon.com/qmgraphql \
  -H 'content-type: application/json' \
  -H 'accept: application/json' \
  --data '{"query":"query {graph: getGraph(domain: \"breezyforest\", appid: \"tests\", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges { uuid source {uuid} target {uuid} } }}"}' \
  > ./tests/breezyforest-tests-example.json
```

Equivalent Node.js command:

```bash
node --input-type=module <<'EOF'
import { writeFile } from "node:fs/promises";

const endpoint = "https://www.leafgon.com/qmgraphql";
const query = `query {graph: getGraph(domain: "breezyforest", appid: "tests", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges { uuid source {uuid} target {uuid} } }}`;

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    accept: "application/json",
  },
  body: JSON.stringify({ query }),
});

const payload = await response.json();
await writeFile("./tests/breezyforest-tests-example.json", JSON.stringify(payload, null, 2));
EOF
```

For this namespace, `tests` is the app id shown in `/editor/breezyforest/tests`.

## GitHub-hosted leafgraphs

Leafgraphs can be loaded from GitHub raw JSON by using `github` as the domain and a repo filepath as the appid.

Format:

- `github/<github-user>/<repo>/<path>`
- `github/<github-user>/<repo>@<ref>/<path>` (optional ref, default `main`)
- `github/<github-user>/<repo>/<path>?token=<some token>`

Examples:

- `github/leafgon/leafgraphs/tests/example-learning-graph`
- `github/leafgon/leafgraphs@dev/tests/example-learning-graph`
- `github/leafgon/leafgraphs/tests/example-learning-graph?token=abc123`

See [GitHub-Hosted Leafgraphs guide](https://github.com/leafgon/ghostos/blob/main/docs/github-leafgraphs.md) for end-user documentation.

## Leafgon-hosted leafgraphs

See [Leafgon-Hosted Leafgraphs guide](https://github.com/leafgon/ghostos/blob/main/docs/leafgon-leafgraphs.md) for end-user documentation.

## Learn LEAF locally

- Editor intro/tutorial: [leafgon.com editor guide](https://www.leafgon.com/editor/breezyforest/guides?topic=start)
- Editor example graph namespace: [leafgon.com `/editor/breezyforest/tests`](https://www.leafgon.com/editor/breezyforest/tests)
- Local Node.js parser tutorial: [LEAF Intro (Node.js)](https://github.com/leafgon/ghostos/blob/main/docs/leaf-intro-nodejs.md)
- `/editor/breezyforest/tests` tutorial: [Breezyforest Tests Tutorial](https://github.com/leafgon/ghostos/blob/main/docs/breezyforest-tests-tutorial.md)
- Spell validation report + command: [Breezyforest Tests Validation](https://github.com/leafgon/ghostos/blob/main/docs/breezyforest-tests-validation.md)

## Release and security docs

- Release process: [RELEASING.md](https://github.com/leafgon/ghostos/blob/main/RELEASING.md)
- Security policy: [SECURITY.md](https://github.com/leafgon/ghostos/blob/main/SECURITY.md)
- Contribution guide: [CONTRIBUTING.md](https://github.com/leafgon/ghostos/blob/main/CONTRIBUTING.md)

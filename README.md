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

- Docs map (start here): `docs/README.md`
- LEAF intro + local Node.js tutorial: `docs/leaf-intro-nodejs.md`
- Tutorial using `/editor/breezyforest/tests` example graphs: `docs/breezyforest-tests-tutorial.md`
- Spell validation report for `/editor/breezyforest/tests`: `docs/breezyforest-tests-validation.md`
- LEAFlisp reference: `docs/leaflisp.md`
- Runtime wrappers guide: `docs/leafgraph-runtime-wrappers.md`
- Release notes: `docs/release-notes/`

## Core usage

```js
import { setLEAFgqlEndpoints, initializeLEAFlakeGQLClient } from "ghostos";

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
gq https://www.leafgon.com/qmgraphql -q 'query {graph: getGraph(domain: "breezyforest", appid: "tests/<example-graph>", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges { uuid source {uuid} target {uuid} } }}' > ./tests/breezyforest-tests-example.json
```

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

See `docs/github-leafgraphs.md` for end-user documentation.

## Leafgon-hosted leafgraphs

See `docs/leafgon-leafgraphs.md` for end-user documentation.

## Learn LEAF locally

- Editor intro/tutorial: `https://www.leafgon.com/editor/breezyforest/guides?topic=start`
- Editor example graph namespace: `https://www.leafgon.com/editor/breezyforest/tests`
- Local Node.js parser tutorial: `docs/leaf-intro-nodejs.md`
- `/editor/breezyforest/tests` tutorial: `docs/breezyforest-tests-tutorial.md`
- Spell validation report + command: `docs/breezyforest-tests-validation.md`

## Release and security docs

- Release process: `RELEASING.md`
- Security policy: `SECURITY.md`
- Contribution guide: `CONTRIBUTING.md`

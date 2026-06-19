# ghostos

A reference LEAF parser implementation used by leafgon.com

## Node setup

```bash
npm i ghostos
```

## getting graph data from leafgon.com

```bash
gq https://www.leafgon.com/qmgraphql -q 'query {graph: getGraph(domain: "breezyforest", appid: "testbed", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges { uuid source {uuid} target {uuid} } }}' > ./tests/breezyforest-testbed.json
```

## Override Endpoint URIs

You can override the default GraphQL URIs at runtime:

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
  },
});
```

## GitHub-hosted leafgraphs

Leafgraphs can be loaded from GitHub raw JSON by using `github` as the domain and a repo filepath as the appid.

Format:

- `github/<github-user>/<repo>/<path>`
- `github/<github-user>/<repo>@<ref>/<path>` (optional ref, default `main`)
- `github/<github-user>/<repo>/<path>?token=<some token>`

Example:

- `github/leafgon/leafgraphs/tests/breezyforest-testbed`
- `github/leafgon/leafgraphs@dev/tests/breezyforest-testbed`
- `github/leafgon/leafgraphs/tests/breezyforest-testbed?token=abc123`

See `docs/github-leafgraphs.md` for end-user documentation.

## Leafgon-hosted leafgraphs

See `docs/leafgon-leafgraphs.md` for end-user documentation.

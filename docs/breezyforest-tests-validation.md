# `/editor/breezyforest/tests` spell validation report

This page documents Node.js validation coverage for spell definitions in the
`breezyforest/tests` namespace.

## Validation command

```bash
npm run validate:breezyforest-tests
```

Equivalent make target:

```bash
make validate-breezyforest-tests
```

## Current baseline

Validation baseline captured on **October 19, 2026**:

- Spell definitions discovered: `9`
- Spells passing: `9`
- Spells failing: `0`

Spells covered:

- `test-default-mix`
- `test-http-element`
- `test-label-const`
- `test-leaflisp`
- `test-loopy-bypass`
- `test-loopy-loop`
- `test-loopy-straight`
- `test-parfait-mix`
- `test-spell`

## Native vs synthetic caller coverage

The namespace graph can include spell definitions without an explicitly wired
caller node. The validation harness tests both categories:

- **Native caller run**: a caller node already exists in the graph.
- **Synthetic caller run**: temporary caller wiring is generated in-memory for
  uncoupled `leafspelldef` nodes.

A spell is considered validated when at least one caller run succeeds.

## Endpoint assumptions

By default, the harness queries:

- `LEAFGON_ENDPOINT_QM` if set
- otherwise `https://www.leafgon.com/qmgraphql`

Optional auth header:

- `LEAFGON_CLIENT_AUTH_KEY` is sent as `X-API-Key` when set.
- Depending on deployment policy, API key access may be required to read
  `breezyforest/tests`.

## Common failure modes

- **No graph returned**
  - Cause: endpoint or auth mismatch (including missing API key).
  - Check: `LEAFGON_ENDPOINT_QM`, `LEAFGON_CLIENT_AUTH_KEY`.
- **Network errors**
  - Cause: blocked outbound access or TLS issues.
  - Check: connectivity to Leafgon GraphQL endpoint.
- **Per-spell execution failures**
  - Cause: runtime contract mismatch, missing dependencies, or graph drift.
  - Check: per-spell output in command logs.

## Related docs

- `breezyforest-tests-tutorial.md`
- `leaf-intro-nodejs.md`
- `leafgraph-runtime-wrappers.md`

# ghostos
A reference LEAF parser implementation used by leafgon.com

# Node/TS/JS Codex-friendly Template

This repository is designed to support a tight inner development loop with **Codex CLI**.

## Development model
- **Codex CLI** acts as a *junior engineer*: proposes a plan, edits in small batches, runs canonical commands.
- **You** act as *tech lead + reviewer*: approve plan, enforce constraints, review diffs, accept/reject.

See: [CODEX.md](./CODEX.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).

## Canonical commands (used by humans + Codex)
```bash
make fmt
make lint
make typecheck
make test
make ci
```

## Codex CLI prompt starter
> Read CODEX.md first.  
> Task: ___.  
> Constraints: ___.  
> Do not touch: auth/crypto/infra/schemas unless I say so.  
> Add tests. Run `make test` frequently and `make ci` at the end.  
> Propose a plan before editing.

## Node setup

```bash
npm install
make ci
```

## getting graph data from leafgon.com
```bash
gq https://gdb.leafgon.com/qmgraphql -q 'query {graph: getGraph(domain: "breezyforest", appid: "testbed", filter: {}) {domain appid nodes {uuid leafnodetype out_edges {uuid source {uuid} target {uuid} data} data} edges { uuid source {uuid} target {uuid} } }}' > ./tests/breezyforest-testbed.json
```

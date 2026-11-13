# Hippocampus Adapter Contract Fixtures

Draft fixtures for implementing/testing `leafelement(hippocampus)` in GhostOS.

- `inport.intent.*.json`: bottled input events consumed by the adapter.
- `leaf-server.response.*.json`: expected HTTP status/body envelopes returned by leaf-server.
- `outport.outcome.*.json`: bottled outcomes the adapter should emit.

These fixtures are referenced by `docs/hippocampus-element-node-draft.md`.

## Contract vectors

- `TV-001 query success`
  - `inport.intent.query.success.json`
  - `leaf-server.response.query.success.json`
  - `outport.outcome.query.success.json`
- `TV-002 command success`
  - `inport.intent.command.success.json`
  - `leaf-server.response.command.success.json`
  - `outport.outcome.command.success.json`
- `TV-003 command version conflict`
  - `inport.intent.command.version-conflict.json`
  - `leaf-server.response.error.version-conflict.json`
  - `outport.outcome.command.version-conflict.json`
- `TV-004 retryable dependency unavailable`
  - `inport.intent.query.retryable.json`
  - `leaf-server.response.error.dependency-unavailable.json`
  - `outport.outcome.query.retryable-error.json`
- `TV-005 configure success`
  - `inport.intent.configure.success.json`
  - `leaf-server.response.configure.success.json`
  - `outport.outcome.configure.success.json`
- `TV-006 configure scope conflict`
  - `inport.intent.configure.scope-conflict.json`
  - `leaf-server.response.error.configuration-scope-conflict.json`
  - `outport.outcome.configure.scope-conflict.json`
- `TV-007 command idempotency conflict`
  - `inport.intent.command.idempotency-conflict.json`
  - `leaf-server.response.error.idempotency-conflict.json`
  - `outport.outcome.command.idempotency-conflict.json`

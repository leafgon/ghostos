# GhostOS Broad-Spectrum Data-Oriented Runtime Refactor Note

## Purpose

This note specifies a broad-spectrum refactor for LEAF/GhostOS workflow execution. The goal is to make data-oriented workflows secure, robust, idempotent, and deterministic by making data events the default execution driver for data-processing and side-effecting nodes, while preserving control flow as an explicit orchestration, lifecycle, scheduling, and replay plane.

The Hermes duplicate-send incident is one concrete symptom of the current architecture, but the design below is not Hermes-specific. The same failure mode can affect any side-effecting node if control ticks can re-trigger work against latched data:

- HTTP write nodes
- Discord or chat output nodes
- database mutation nodes
- queue publishing nodes
- file/object storage write nodes
- webhook nodes
- email/SMS/notification nodes
- long-running job submission nodes
- external API action nodes

The refactor should be implemented at the GhostOS runtime and node-contract level, with node-specific migrations layered on top.

## Current Problem

GhostOS currently has multiple runtime paths where control flow acts as the primary driver:

- `src/api/parser/eta.js`
  - `weaveDataflowPlane()` constructs prime data and control streams.
  - Start nodes receive prime control/data streams.
  - Non-start nodes use Chronos synchronization to propagate control and sample latest data.

- `src/api/parser/leaf.js`
  - `driveDataflowByCtrlflow()` drives child logic from incoming control.
  - It then relays child output control and sampled data.

- Node libraries may follow the same pattern:
  - listen to control stream
  - sample latest config and latest data
  - perform node work

The unsafe generic shape is:

```js
control$.pipe(withLatestFrom(config$, data$), concatMap(runNode));
```

This is level-triggered:

```text
control tick + latest data => execute
```

That is useful for lifecycle orchestration, but it is not a safe default for data-oriented workflows. If the latest data is an action command, message, write request, job submission, or mutation, repeated control ticks can repeat the same logical side effect.

## Target Architecture

The runtime should support explicit execution trigger semantics. Data-oriented nodes should default to edge-triggered execution:

```text
new data event + latest config/control state => execute
```

The safe generic shape is:

```js
data$.pipe(filter(isMeaningfulInput), withLatestFrom(config$, controlState$), concatMap(runNode));
```

Control remains first-class, but it must not implicitly replay old data. Control events should express lifecycle and orchestration intent:

- start
- stop
- pause
- resume
- cancel
- refresh config
- retry
- replay
- timer tick
- poll
- manual recompute
- drain
- checkpoint

The runtime should make the trigger source visible and deterministic for every node execution.

## Design Principles

1. Data events trigger data work.
2. Control events coordinate data work.
3. Side effects require idempotency.
4. Replays require explicit intent.
5. Retries are bounded and observable.
6. Config updates affect future work by default, not past work.
7. Empty-data sentinels are no-op for side-effecting nodes.
8. Node join semantics are declared, not inferred from operator accidents.
9. Runtime event identity is stable and traceable.
10. Production paths fail fast when required configuration is missing.

## Required Runtime Invariants

The refactor must enforce these invariants across the runtime, not only inside individual node libraries:

1. A data event is processed at most once by a side-effecting node unless explicit retry or replay intent permits another attempt.
2. A control-only event must not re-execute the latest data event by default.
3. A config-only event must not re-execute the latest data event by default.
4. A replay event must reference a target event or domain command.
5. A retry event must reference a failed attempt and must satisfy retry policy.
6. A side-effecting node must declare or derive an idempotency key.
7. Multi-input nodes must declare which input lane drives execution.
8. Output event order for a node must be deterministic for a fixed input sequence.
9. Runtime traces must identify execution cause: data, control, timer, retry, replay, startup, or config refresh.
10. Sensitive data must not be logged while adding traceability.

## Node Classification

Every node should be classified by runtime behavior. The classification drives default trigger policy, idempotency requirements, and tests.

### Pure Transform

Examples:

- map
- parse
- normalize
- format
- filter
- enrich from local/static state

Default trigger:

- `data`

Contract:

- deterministic output for deterministic input/config
- no external side effects
- no hidden network access
- config changes affect subsequent data unless node declares recompute behavior

### Stateful Transform

Examples:

- accumulator
- window
- session memory
- debounce/throttle
- dedupe
- join with retained context

Default trigger:

- `data`, `primary-input`, or `all-inputs`

Contract:

- state update rules are explicit
- event order is deterministic
- state checkpointing is explicit if needed
- replay behavior is documented

### Side-Effecting Action

Examples:

- HTTP POST/PUT/PATCH/DELETE
- Discord send
- queue publish
- database mutation
- object storage write
- webhook emit
- email/SMS send
- external job submission

Default trigger:

- `data`

Contract:

- requires idempotency key
- uses ordered execution unless explicitly configured otherwise
- duplicate data events with the same idempotency key are suppressed or treated as idempotent success
- retry is explicit, bounded, and traceable
- control/config ticks do not execute the side effect

### Source

Examples:

- user input
- SSE subscription
- WebSocket subscription
- file watcher
- queue consumer
- timer
- poller

Default trigger:

- `control`, `timer`, or external source event

Contract:

- lifecycle is control-driven
- emitted records become data events with stable event IDs
- reconnect/retry does not duplicate emitted logical records when source identity is available

### Sink

Examples:

- UI display
- log display
- metrics output
- non-mutating debug stream

Default trigger:

- `data`

Contract:

- rendering/display is data-driven
- control can clear, pause, or refresh display explicitly

### Orchestrator

Examples:

- branch
- router
- scheduler
- graph lifecycle manager
- cancellation manager

Default trigger:

- `control` or declared hybrid policy

Contract:

- emits typed control intents
- does not mutate external state unless also classified as side-effecting

## Trigger Policies

Add explicit trigger policy metadata to node runtime metadata. This should be available to runtime compilation, tracing, and tests.

Recommended modes:

- `data`
  - Execute on meaningful data events.
  - Sample latest config and control state as context.
  - Default for pure transforms, stateful transforms, sinks, and side-effecting actions.

- `control`
  - Execute on typed control events.
  - May sample data only if the node declares replay/recompute semantics.
  - Default for lifecycle/orchestration nodes.

- `timer`
  - Execute on scheduler-generated events.
  - Timer events must have event IDs and sequence numbers.

- `primary-input`
  - Execute when one declared input lane emits.
  - Other lanes provide latest context.

- `all-inputs`
  - Execute after fresh data is available from every declared input lane.
  - Useful for deterministic joins.

- `any-input`
  - Execute when any input lane emits.
  - Must include lane identity in the event envelope.

- `manual-replay`
  - Execute only from explicit replay control intent.
  - Must reference target event identity.

- `retry`
  - Execute only from explicit retry control intent or retry policy.
  - Must reference failed attempt identity.

Example metadata:

```json
{
  "nodeType": "http_action",
  "classification": "side_effecting_action",
  "trigger": "data",
  "join": {
    "mode": "primary-input",
    "primaryInput": "request"
  },
  "idempotency": {
    "required": true,
    "keyPath": "payload.commandId",
    "scope": ["graphInstanceId", "nodeId", "producerId"]
  },
  "retry": {
    "maxAttempts": 3,
    "backoff": "exponential",
    "retryableStatus": [408, 429, 500, 502, 503, 504]
  }
}
```

## Runtime Event Envelope

Introduce a runtime event envelope for data, control, timer, retry, and replay events. The envelope can wrap existing node payloads internally so user-level LEAF code does not need to migrate all at once.

Recommended shape:

```json
{
  "eventId": "uuid",
  "eventKind": "data",
  "sourceNodeId": "node uuid",
  "graphInstanceId": "uuid",
  "sequence": 42,
  "createdAt": "2026-07-19T00:00:00.000Z",
  "payload": {},
  "trace": {
    "parentEventIds": [],
    "trigger": "data"
  }
}
```

Requirements:

- `eventId` is stable for one logical event.
- `sequence` is monotonic per source node.
- `graphInstanceId` scopes runtime execution.
- `parentEventIds` preserve causality.
- `trigger` records the cause of execution.
- domain-specific idempotency keys remain available in payload or metadata.
- runtime `eventId` is a fallback execution key, not a substitute for domain command identity when the domain provides one.

Control event shape:

```json
{
  "eventId": "uuid",
  "eventKind": "control",
  "intent": "refresh_config",
  "targetNodeId": "node uuid",
  "graphInstanceId": "uuid",
  "sequence": 17,
  "createdAt": "2026-07-19T00:00:00.000Z",
  "trace": {
    "trigger": "control"
  }
}
```

Replay event shape:

```json
{
  "eventId": "uuid",
  "eventKind": "control",
  "intent": "replay",
  "targetEventId": "uuid",
  "reason": "manual-debug",
  "trace": {
    "trigger": "replay"
  }
}
```

Retry event shape:

```json
{
  "eventId": "uuid",
  "eventKind": "control",
  "intent": "retry",
  "targetAttemptId": "uuid",
  "reason": "retryable-timeout",
  "trace": {
    "trigger": "retry"
  }
}
```

## Execution Helpers

Create runtime helpers so node authors do not hand-roll trigger behavior with ad hoc Rx pipelines.

### Data-Driven Helper

```js
driveNodeByDataflow({
  data$,
  config$,
  controlState$,
  policy,
  handler,
});
```

Rules:

- data events trigger `handler`
- config and control are sampled
- empty sentinels are filtered by default for side-effecting actions
- output events include parent data event ID
- ordered mode uses `concatMap`
- concurrent mode requires explicit policy

### Control-Driven Helper

```js
driveNodeByCtrlflow({
  control$,
  dataState$,
  config$,
  policy,
  handler,
});
```

Rules:

- control events trigger `handler`
- data sampling requires declared intent such as replay or recompute
- startup/stop/pause/resume are distinct from retry/replay
- control-only execution must not be mistaken for data execution

### Multi-Input Helper

```js
driveNodeByJoinPolicy({
  inputs,
  config$,
  controlState$,
  joinPolicy,
  handler,
});
```

Required join policies:

- `primary-input`
- `all-inputs`
- `any-input`
- `latest-context`
- `windowed`

Each output event must record which input event IDs caused it.

## Idempotency Contract

Idempotency must be a runtime-level contract for side-effecting actions.

Every side-effecting action should declare:

- whether an idempotency key is required
- how to derive the key
- key scope
- retry policy
- replay policy
- cache TTL
- max cache size
- whether server-side idempotency exists

Recommended key scope:

```text
graphInstanceId:nodeId:domainKey
```

If a node talks to an external domain with stronger identity, include it:

```text
tenantId:integrationInstanceId:producerId:commandId
```

Cache state:

```json
{
  "status": "in_flight | succeeded | failed | suppressed",
  "attemptId": "uuid",
  "firstSeenAt": 0,
  "lastAttemptAt": 0,
  "attemptCount": 1,
  "lastErrorCode": null
}
```

Generic rules:

- `in_flight` suppresses concurrent duplicate attempts.
- `succeeded` suppresses duplicate attempts within TTL.
- `failed` allows retry only under retry policy.
- `suppressed` is observable and non-fatal.
- TTL eviction must not evict in-flight entries.
- max-size eviction should prefer old terminal entries.
- content hashes are correlation aids, not primary idempotency for user-visible side effects.
- missing required idempotency keys fail fast in production.

## Retry Contract

Retries must be explicit and bounded.

Rules:

- Retry only retryable errors.
- Preserve original event ID and idempotency key.
- Create a distinct attempt ID per attempt.
- Include attempt count in trace.
- Use deterministic backoff in tests via injectable scheduler.
- Never retry validation errors or missing credentials.
- Never retry non-idempotent actions unless the node declares a safe idempotency key.

Retry metadata:

```json
{
  "maxAttempts": 3,
  "backoff": {
    "type": "exponential",
    "initialMs": 250,
    "maxMs": 5000,
    "jitter": "bounded"
  },
  "retryableErrors": ["timeout", "rate_limited", "server_error"]
}
```

## Replay Contract

Replay must be separate from retry.

Retry means:

```text
same logical event, previous attempt failed, try again under policy
```

Replay means:

```text
operator or runtime intentionally reprocesses a previous event
```

Replay rules:

- Replay requires explicit control intent.
- Replay must reference a target event.
- Replay must be auditable.
- Replay of a side effect must either:
  - reuse idempotency and be suppressed as already succeeded, or
  - require a new domain command ID if the intent is to create a new external effect.
- Replay must never happen from an ambiguous control tick.

## Configuration Semantics

Config changes must have explicit execution semantics.

Default:

```text
config update changes future processing only
```

Optional declared modes:

- `future-only`
  - default
  - no replay

- `recompute-pure`
  - allowed only for pure transforms
  - reprocesses retained latest input

- `reopen-source`
  - lifecycle behavior for source nodes
  - closes/reopens subscription or polling

- `reconfigure-side-effect`
  - affects future side effects
  - must not replay successful previous side effects

Config update traces should include:

- config version
- node ID
- whether recompute/reopen occurred
- whether prior data was replayed

## Empty Data and Sentinel Semantics

Empty-data sentinels should be first-class events or normalized before node execution.

Rules:

- Side-effecting actions do not execute on empty data.
- Pure transforms may execute on empty data only if declared.
- Source startup may emit empty/control readiness events, but those must not look like user data.
- Empty sentinels must be traceable as runtime lifecycle events.

## Security Requirements

1. Do not log secrets, bearer tokens, cookies, API keys, refresh tokens, private keys, or full signed URLs.
2. Redact authorization headers and secret-bearing config fields in traces.
3. Fail fast when required credentials, endpoints, or idempotency keys are missing.
4. Never silently fall back to fake/stub side effects in production paths.
5. Avoid using payload content as an idempotency key for sensitive or user-visible actions.
6. If payload hashes are logged, use short prefixes only for correlation.
7. Keep retry limits bounded to avoid external API abuse.
8. Treat replay as privileged/debug intent.
9. Preserve server-side authorization and validation.
10. Client/runtime dedupe is defense in depth, not a substitute for server idempotency.

## Determinism Requirements

For a fixed ordered sequence of data, control, timer, config, retry, and replay events, a node should produce the same ordered output sequence.

Implementation rules:

- use `concatMap` for ordered side effects
- avoid unbounded `mergeMap` for side effects
- assign monotonic per-node sequence numbers
- preserve parent event IDs
- declare join policies
- make scheduler/timer behavior injectable in tests
- separate attempt IDs from event IDs
- keep config versioning explicit
- do not let config/control ticks implicitly replay data

## Robustness Requirements

1. Duplicate prevention must not depend on timing windows alone.
2. In-flight side effects must suppress concurrent duplicate attempts.
3. Failed attempts must transition state reliably.
4. Cache TTL eviction must not remove in-flight entries.
5. Caches must be bounded by TTL and max entry count.
6. Browser refresh or worker restart may lose local cache; server-side idempotency remains authoritative where available.
7. Runtime behavior should degrade safely when local cache is lost.
8. Backpressure behavior must be explicit for high-volume streams.
9. Node-level errors must produce typed error events, not ambiguous data.
10. Cancellation must stop future attempts without corrupting idempotency state.

## Runtime Refactor Plan

### Phase 1: Define Runtime Contracts

Scope:

- Add node classification metadata.
- Add trigger policy schema.
- Add event envelope types.
- Add idempotency/retry/replay contracts.
- Add trace field conventions.

Implementation tasks:

1. Define runtime TypeScript/JavaScript schemas or validators.
2. Add helper to resolve node classification.
3. Add helper to resolve trigger policy.
4. Add helper to wrap legacy payloads into runtime envelopes.
5. Add redaction utility for trace/log fields.
6. Add tests for schema validation and redaction.

Acceptance criteria:

- Every node can be classified.
- Unknown trigger policy fails validation.
- Side-effecting nodes without idempotency metadata are flagged.
- Traces can identify execution cause without exposing secrets.

### Phase 2: Add Generic Execution Drivers

Scope:

- Implement shared data-driven, control-driven, timer-driven, retry, replay, and multi-input drivers.
- Keep legacy driver available for compatibility.

Implementation tasks:

1. Implement `driveNodeByDataflow()`.
2. Implement `driveNodeByCtrlflow()`.
3. Implement `driveNodeByJoinPolicy()`.
4. Implement `driveNodeByTimer()`.
5. Implement idempotent side-effect wrapper.
6. Implement retry wrapper with injectable scheduler.
7. Implement replay resolver.
8. Add trace events for driver decisions.

Acceptance criteria:

- Data-driven nodes do not execute on control-only ticks.
- Control-driven nodes require typed control intent.
- Multi-input joins are deterministic under tested event sequences.
- Side-effect wrapper suppresses duplicate in-flight and succeeded keys.

### Phase 3: Add Compatibility Layer and Dual Trace

Scope:

- Allow existing graphs to run without behavior changes.
- Add feature flags to opt selected nodes into new semantics.
- Add dual-trace mode to compare legacy and new driver decisions.

Implementation tasks:

1. Add runtime feature flags.
2. Keep legacy `driveDataflowByCtrlflow()` behavior available.
3. Add dual-trace instrumentation:
   - legacy would-execute
   - new would-execute
   - actual executed
   - suppressed duplicate
4. Add metrics for divergence.

Feature flag examples:

```text
GHOSTOS_DEFAULT_TRIGGER_MODE=legacy
GHOSTOS_ENABLE_TRIGGER_POLICY=true
GHOSTOS_DATA_TRIGGERED_NODE_TYPES=http_action,queue_publish,db_write,hermes_write
GHOSTOS_IDEMPOTENT_SIDE_EFFECTS=true
GHOSTOS_DUAL_TRACE_EXECUTION=true
```

Acceptance criteria:

- Existing graphs run unchanged by default.
- Opt-in nodes use new trigger policy.
- Dual trace shows control-only ticks no longer execute opted-in data-driven nodes.

### Phase 4: Migrate Side-Effecting Nodes

Scope:

- Move all side-effecting action nodes to data-driven execution with idempotency.

Migration order:

1. Generic HTTP action/write nodes.
2. Queue publish nodes.
3. Database mutation nodes.
4. External API action nodes.
5. Chat/Discord/email/SMS/notification nodes.
6. Object/file storage write nodes.
7. Hermes write as one implementation of external message egress.

Acceptance criteria:

- Each migrated node declares idempotency metadata.
- Repeated control ticks do not duplicate side effects.
- Retry behavior is bounded.
- Missing idempotency key fails fast where required.

### Phase 5: Migrate Pure and Stateful Data Nodes

Scope:

- Move transforms and stateful processors to data-driven or declared join-policy execution.

Migration order:

1. Stateless transforms.
2. Filters/routers.
3. Stateful accumulators/windows.
4. Multi-input joins.
5. Memory/session nodes.

Acceptance criteria:

- Pure transforms are deterministic.
- Config updates do not replay prior data unless declared.
- Multi-input joins include parent event IDs.
- Stateful nodes document checkpoint/replay behavior.

### Phase 6: Make Control Intent Explicit

Scope:

- Replace ambiguous `ctrl_accio`-style ticks with typed control events.

Control intents:

```json
{ "intent": "start" }
{ "intent": "stop" }
{ "intent": "pause" }
{ "intent": "resume" }
{ "intent": "cancel" }
{ "intent": "refresh_config" }
{ "intent": "retry", "targetAttemptId": "uuid" }
{ "intent": "replay", "targetEventId": "uuid" }
{ "intent": "poll" }
{ "intent": "checkpoint" }
```

Acceptance criteria:

- Nodes distinguish startup from retry/replay.
- Control events that sample data must declare why.
- Replay and retry are auditable.

### Phase 7: Change Defaults

Scope:

- After migration and compatibility validation, change default trigger mode for data-oriented nodes to `data`.

Acceptance criteria:

- No known side-effecting node remains implicitly control-triggered.
- CI covers legacy and new behavior where compatibility is required.
- Production metrics show no unexpected execution-count regression.

## Testing Strategy

### Unit Tests: Runtime Event Envelope

Test cases:

1. Legacy payload wraps into data event envelope.
2. Data event IDs remain stable through one execution path.
3. Parent event IDs are preserved.
4. Control events require typed intent.
5. Replay events require target event ID.
6. Retry events require target attempt ID.
7. Redaction removes secrets from traces.
8. Sequence numbers are monotonic per source node.

### Unit Tests: Trigger Drivers

Test cases:

1. `trigger: "data"` executes on data event.
2. `trigger: "data"` does not execute on control-only tick.
3. `trigger: "data"` does not execute on config-only update.
4. `trigger: "control"` executes on allowed control intent.
5. `trigger: "control"` rejects undeclared data replay.
6. `trigger: "timer"` executes on timer event with event ID.
7. `trigger: "primary-input"` executes only when primary lane emits.
8. `trigger: "all-inputs"` waits for fresh events from all lanes.
9. `trigger: "any-input"` records which lane caused execution.
10. `manual-replay` requires explicit target event.

### Unit Tests: Idempotent Side-Effect Wrapper

Test cases:

1. First command with a key executes once.
2. Concurrent duplicate key is suppressed while in-flight.
3. Succeeded duplicate key is suppressed within TTL.
4. Failed key can retry only when retry policy allows.
5. Non-retryable failure does not retry.
6. Missing required key fails validation.
7. TTL eviction removes old terminal entries.
8. TTL eviction does not remove in-flight entries.
9. Max-size eviction prefers old terminal entries.
10. Suppression emits observable trace/metric event.

### Unit Tests: Config Semantics

Test cases:

1. Config update changes next data event.
2. Config update does not replay previous data by default.
3. Pure transform with `recompute-pure` can recompute latest retained input.
4. Side-effecting node rejects config-driven replay.
5. Source node with `reopen-source` restarts subscription without duplicating already emitted source events when source IDs exist.

### Unit Tests: Retry and Replay

Test cases:

1. Retry preserves original event ID and idempotency key.
2. Retry creates new attempt ID.
3. Retry stops at max attempts.
4. Retry scheduler is deterministic in tests.
5. Replay requires target event.
6. Replay of succeeded side effect is suppressed unless new domain command ID is provided.
7. Replay of pure transform is allowed when policy permits.
8. Replay trace includes original event and replay event.

### Integration Tests: Generic Data Workflow

Build a representative graph:

```text
source -> transform -> action -> sink
```

Scenarios:

1. One source event produces one action side effect.
2. Repeated control ticks after the source event produce no extra action side effects.
3. Config refresh after action success does not repeat the action.
4. Next source event uses the new config.
5. Action timeout retries under policy.
6. Non-retryable action error produces typed error event.
7. Manual replay is explicit and auditable.

### Integration Tests: Multi-Input Workflow

Build a representative graph:

```text
source_a ----\
              join -> transform -> action
source_b ----/
```

Scenarios:

1. `all-inputs` waits for both fresh inputs.
2. `primary-input` executes only on primary lane.
3. Config/control-only ticks do not execute the join.
4. Output parent event IDs include the correct inputs.
5. Reordering inputs produces deterministic behavior according to declared join policy.

### Integration Tests: Source and Subscription Workflow

Build a representative graph:

```text
control start -> source subscription -> transform -> sink
```

Scenarios:

1. Start control opens source.
2. Source records emit data events.
3. Pause control stops downstream processing according to policy.
4. Resume control continues without replay unless declared.
5. Reconnect dedupes source records when source event IDs exist.

### Property Tests

Recommended properties:

- For one data event and any number of control/config ticks, side-effect count is `1`.
- For `N` unique idempotency keys, side-effect count is `N`.
- For duplicated idempotency keys, side-effect count is `1` within TTL.
- For pure transforms, output is deterministic for fixed input/config sequence.
- For bounded retries, attempt count never exceeds max attempts.
- For all-input joins, output count never exceeds complete fresh input sets.
- For primary-input joins, output count equals primary input count after required context exists.

### Regression Tests for Known Failure Mode

Keep a regression test based on the observed class of failure:

```text
data command arrives once
control ticks arrive many times
side-effecting egress node executes once
```

This test should be generic and reusable for every side-effecting node adapter. Hermes can be one adapter instance, not the only test target.

## Observability

Add runtime metrics:

- `ghostos_node_execution_total{node_type, trigger, status}`
- `ghostos_node_execution_suppressed_total{node_type, reason}`
- `ghostos_side_effect_attempt_total{node_type, status}`
- `ghostos_side_effect_idempotency_total{node_type, decision}`
- `ghostos_retry_total{node_type, status}`
- `ghostos_replay_total{node_type, status}`
- `ghostos_config_update_total{node_type, behavior}`
- `ghostos_control_event_total{intent}`

Trace fields:

- graph instance ID
- node ID
- node type
- node classification
- trigger policy
- trigger source
- event ID
- parent event IDs
- attempt ID
- idempotency decision
- retry count
- config version

Do not log:

- bearer tokens
- cookies
- secrets
- raw credentials
- full signed URLs
- private keys
- sensitive raw payloads

## Backward Compatibility

The migration should be opt-in before defaults change.

Compatibility strategy:

1. Add metadata and helpers without changing legacy behavior.
2. Enable new drivers per node type or per graph.
3. Run dual trace before switching execution.
4. Compare legacy would-execute counts against new actual-execute counts.
5. Migrate side-effecting nodes first.
6. Migrate transforms and joins after side effects are safe.
7. Change defaults only after tests and production telemetry show stable behavior.

Legacy behavior should remain available only as a compatibility mode, not as the preferred architecture for new data-oriented nodes.

## Rollout Plan

1. Land runtime contracts, schemas, and trace redaction.
2. Land generic execution drivers.
3. Land generic idempotent side-effect wrapper.
4. Add broad unit tests for triggers, idempotency, retry, replay, and config semantics.
5. Add generic integration test graphs.
6. Enable dual trace in staging.
7. Migrate one low-risk side-effecting node type.
8. Validate duplicate suppression and execution counts.
9. Migrate remaining side-effecting nodes.
10. Migrate pure/stateful data nodes.
11. Make typed control intent mandatory for new nodes.
12. Change default trigger mode for data-oriented nodes to `data`.

Rollback:

- Disable new trigger drivers per feature flag.
- Keep idempotency wrapper enabled where safe.
- Preserve trace redaction and observability.
- Keep server-side idempotency as the final authority for external side effects.

## Recommended First Broad Patch

The first patch should not be Hermes-specific. It should establish the reusable runtime foundation:

1. Add node classification and trigger policy schema.
2. Add runtime event envelope helpers.
3. Add generic idempotent side-effect wrapper.
4. Add data-driven and control-driven execution helpers.
5. Add tests proving control-only ticks do not execute data-driven nodes.
6. Add a generic side-effect adapter test harness.

After that, migrate individual node adapters, including Hermes, onto the shared wrapper and trigger policy.

## Resolved Design Decisions

These decisions define the default contract for new and migrated runtime behavior.
Legacy behavior may remain available only through explicit compatibility metadata
and feature flags.

1. Runtime envelopes are internal runtime data structures. User-level LEAF code
   should receive a stable, read-only runtime context instead of raw envelopes.
   The context should expose only contract fields such as `eventId`,
   `eventKind`, `trigger`, `parentEventIds`, `attemptId`, retry count, and
   idempotency decision.
2. Side-effecting nodes without required idempotency metadata must fail at graph
   compile time for new or migrated nodes. Production runtime must also fail
   fast if required metadata or a derived idempotency key is missing, because
   metadata can drift or be bypassed. Legacy compatibility mode may warn and
   dual-trace before the graph opts into the new contract.
3. The default graph-local idempotency scope is:

   ```text
   graphInstanceId:nodeId:producerId:domainKey
   ```

   When an external domain provides stronger identity, use:

   ```text
   tenantId:integrationInstanceId:producerId:commandId
   ```

   Browser-local idempotency caches are best-effort only. Server and durable
   worker contexts must use a shared durable idempotency store for externally
   visible side effects.

4. The default TTL for succeeded side-effect idempotency entries is 24 hours
   unless node metadata or provider semantics declare a stronger TTL. In-flight
   entries must not be evicted before their attempt timeout. Failed entries
   should remain at least through the retry window. High-impact external actions
   should declare longer TTLs, commonly 7 days or the provider-defined retention
   period.
5. Replay of a successful side effect reuses the original idempotency key by
   default and is suppressed as an already-succeeded action. A replay intended
   to create a new external effect must provide a new domain command ID and be
   audited as a new command. Replay must never be inferred from an ambiguous
   control tick.
6. Config-driven recompute is allowed only for pure transforms by default.
   Stateful nodes must declare checkpoint and replay semantics before config
   recompute can sample previous data. Side-effecting nodes must reject
   config-driven replay unless they declare a specific safe replay policy.
7. During compatibility mode, existing `ctrl_accio` ticks map conservatively to
   typed control intents:

   | Legacy signal                              | Typed intent     |
   | ------------------------------------------ | ---------------- |
   | graph or node open/start tick              | `start`          |
   | graph or node close/stop tick              | `stop`           |
   | config change tick                         | `refresh_config` |
   | scheduler or polling tick                  | `poll`           |
   | explicit retry metadata                    | `retry`          |
   | explicit replay metadata with target event | `replay`         |
   | ambiguous control-only tick                | `legacy_tick`    |

   `legacy_tick` is traceable compatibility state, not a replay intent. Opted-in
   data-driven nodes must not execute from it.

8. Shared runtime helpers are the long-term node-library contract. The compiler
   may wrap existing node functions during migration, but compiler wrapping is a
   compatibility bridge rather than the permanent behavior model.
9. Source-level dedupe must prefer stable provider identity such as message ID,
   offset, partition, cursor, webhook delivery ID, or event ID. If the source has
   weak or missing IDs, the adapter must declare a best-effort dedupe strategy
   using source partition, observed timestamp window, and a redacted payload
   fingerprint. Best-effort source dedupe is only a correlation aid and must not
   be the primary idempotency key for user-visible side effects.
10. Legacy graphs that rely on control-driven replay must be identified through
    dual trace divergence: legacy would execute on a control tick while the new
    data-driven policy would not. Those graphs require explicit migration
    metadata naming the affected nodes, the intended replay behavior, and the
    replacement typed intent or data trigger.

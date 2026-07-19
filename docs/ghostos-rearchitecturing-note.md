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

## Repo Node Inventory

The concrete inventory for this repository is derived from:

- `src/api/metamodel.js`
  - `_leafstdlib_dataflow_api()` defines `_breezyforestapi`, the editor/runtime
    registry of LEAF node types.
  - `leafelement.editorconfig.allowednames` defines the allowed element names.
- `src/api/parser/breezyforest.js`
  - `getLEAFNodeCoreLogic()` maps active LEAF node types to implementation
    objects.
  - This dispatch map is authoritative for runnable runtime node types, even
    when a type is absent from `_leafstdlib_dataflow_api()`.
- `src/api/parser/nodelogic/`
  - core node processing logic.
- `src/api/parser/nodelogic/elements/leafelement.js`
  - the shared `leafelement` dispatcher.
- `src/api/parser/nodelogic/elements/library/`
  - concrete element adapter logic.

Migration priorities:

| Priority | Meaning                                                                                   |
| -------- | ----------------------------------------------------------------------------------------- |
| P0       | Side-effecting, external, or incident-relevant adapter; migrate before changing defaults. |
| P1       | Stateful, source, join, device, or timing behavior; migrate before broad graph opt-in.    |
| P2       | Boundary, composite, dynamic, or UI behavior; migrate before removing compatibility mode. |
| P3       | Pure transform or low-risk sink; migrate after higher-risk behavior is covered.           |
| P4       | Obsolete, metadata-only, or structural type; block, deprecate, or document explicitly.    |

### Core LEAF Node Types

Every non-obsolete entry in `_leafstdlib_dataflow_api()` must have runtime
metadata for classification, trigger policy, join policy where applicable, and
idempotency requirements where applicable. The initial classification table is:

| Node type         | Implementation                                            | Runtime class                     | Default trigger                               | Priority | Migration detail                                                                                                                           |
| ----------------- | --------------------------------------------------------- | --------------------------------- | --------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `leafradioRX`     | `src/api/parser/nodelogic/io/leafradioRX.js`              | obsolete source                   | none                                          | P4       | Present in metadata but obsolete and not exported from `io/index.js`; new graphs must reject it and legacy graphs need explicit migration. |
| `leafradioTX`     | `src/api/parser/nodelogic/io/leafradioTX.js`              | obsolete sink/action              | none                                          | P4       | Present in metadata but obsolete and not exported from `io/index.js`; new graphs must reject it and legacy graphs need explicit migration. |
| `leafoutflowport` | `src/api/parser/nodelogic/io/leafoutflowport.js`          | graph boundary sink               | `data` or `primary-input`                     | P2       | Should forward newly emitted graph data, not replay latest data on a generic control tick.                                                 |
| `leafinflowport`  | `src/api/parser/nodelogic/io/leafinflowport.js`           | graph boundary source             | `data`                                        | P2       | Should convert graph input into runtime data events with parent event identity.                                                            |
| `leafmemoryio`    | `src/api/parser/nodelogic/io/leafmemoryio.js`             | stateful transform                | `data`                                        | P1       | Writes runtime `mnemosyne` memory; if persistent/global memory is enabled, classify that mode as side-effecting with idempotency.          |
| `leafscreenio`    | `src/api/parser/nodelogic/io/leafscreenio.js`             | UI sink/source bridge             | `data`                                        | P2       | Browser/window behavior must be explicit; display updates should be data-driven and user-input emissions should be source events.          |
| `leafdeckspade`   | `src/api/parser/nodelogic/elements/leafdeckspade.js`      | structural stateful transform     | `data` or `all-inputs`                        | P2       | Deck aggregation must preserve parent event IDs and declare join semantics.                                                                |
| `leafdeckheart`   | `src/api/parser/nodelogic/elements/leafdeckheart.js`      | structural stateful transform     | `data` or `all-inputs`                        | P2       | Deck aggregation must preserve parent event IDs and declare join semantics.                                                                |
| `leafdeckdiamond` | `src/api/parser/nodelogic/elements/leafdeckdiamond.js`    | structural transform              | `data`                                        | P2       | Should remain data-driven and avoid control-triggered rebroadcast.                                                                         |
| `leafdeckclub`    | `src/api/parser/nodelogic/elements/leafdeckclub.js`       | structural source/transform       | `data`                                        | P2       | Initialization data and deck output must become explicit data events.                                                                      |
| `leafgnav`        | legacy dispatch in `src/api/parser/breezyforest.js`       | blocked legacy UI node            | none                                          | P4       | Runnable through `getLEAFNodeCoreLogic()` but absent from metadata; reject for new graphs and require `leafelement` `gnav` instead.        |
| `leafpopupview`   | legacy dispatch in `src/api/parser/breezyforest.js`       | blocked legacy UI node            | none                                          | P4       | Runnable through `getLEAFNodeCoreLogic()` but absent from metadata; reject for new graphs and require `leafelement` `popup` instead.       |
| `leafelement`     | `src/api/parser/nodelogic/elements/leafelement.js`        | adapter host                      | element-specific                              | P0       | The wrapper must resolve classification from `elementname`; it must not treat all elements as one runtime class.                           |
| `leafgraph`       | `src/api/parser/nodelogic/abstraction/leafgraph.js`       | composite/orchestrator            | `control` plus declared data policy           | P2       | Graph expansion and nested execution must preserve trigger cause across graph boundaries.                                                  |
| `leaflambdagraph` | `src/api/parser/nodelogic/abstraction/leaflambdagraph.js` | composite transform/orchestrator  | `data` or `control` by declaration            | P2       | Lambda graph execution must distinguish data recompute from lifecycle control.                                                             |
| `leafanchor`      | `src/api/parser/nodelogic/abstraction/leafanchor.js`      | structural metadata               | none                                          | P4       | No runtime execution should be required beyond graph structure validation.                                                                 |
| `leafspelldef`    | `src/api/parser/nodelogic/abstraction/leafspelldef.js`    | declaration metadata              | compile-time                                  | P4       | Defines spell metadata; runtime execution should be avoided unless explicitly modeled.                                                     |
| `leafspell`       | `src/api/parser/nodelogic/abstraction/leafspell.js`       | dynamic transform/orchestrator    | `data`                                        | P2       | Spell invocation must inherit the resolved spell classification; side-effecting spells require metadata.                                   |
| `leafloopyspell`  | `src/api/parser/nodelogic/abstraction/leafloopyspell.js`  | stateful transform/orchestrator   | `data` or declared join                       | P2       | Loop/replay semantics must be explicit and bounded.                                                                                        |
| `leafsyncflow`    | metadata only in `src/api/metamodel.js`                   | join policy placeholder           | none until wired                              | P4       | Registered in metadata but not mapped in `getLEAFNodeCoreLogic()`; either wire to a helper or deprecate.                                   |
| `leafchronosflow` | `src/api/parser/nodelogic/dataflow/leafchronosflow.js`    | stateful join/timing transform    | declared join or `timer`                      | P1       | Chronos behavior must become explicit join/timer metadata instead of implicit control sampling.                                            |
| `leafasyncflow`   | mapped to `_leafchronosflow` in `breezyforest.js`         | async join/timing transform       | declared join or `timer`                      | P1       | Alias behavior must be documented and tested as a Chronos policy variant.                                                                  |
| `leafmixflow`     | `src/api/parser/nodelogic/dataflow/leafmixflow.js`        | join transform                    | `primary-input`, `all-inputs`, or `any-input` | P1       | `merge`, `concat`, `combineLatest`, and related modes must map to declared join policies.                                                  |
| `leafgateflow`    | `src/api/parser/nodelogic/dataflow/leafgateflow.js`       | pure filter/router                | `data`                                        | P1       | Gate decisions should execute on data events and include rejected-event trace decisions where useful.                                      |
| `leaflabel`       | `src/api/parser/nodelogic/datautils/leaflabel.js`         | pure transform                    | `data`                                        | P3       | Labeling must preserve parent event identity.                                                                                              |
| `leafdelabel`     | `src/api/parser/nodelogic/datautils/leafdelabel.js`       | pure transform                    | `data`                                        | P3       | Delabeling must preserve parent event identity.                                                                                            |
| `leafbottle`      | `src/api/parser/nodelogic/datautils/leafbottle.js`        | pure transform                    | `data`                                        | P3       | Bottling should be deterministic and retain provenance.                                                                                    |
| `leafunbottle`    | `src/api/parser/nodelogic/datautils/leafunbottle.js`      | pure transform/filter             | `data`                                        | P3       | Missing bottle keys should be observable as filtered/no-output decisions.                                                                  |
| `leafcrate`       | `src/api/parser/nodelogic/datautils/leafcrate.js`         | pure transform                    | `data`                                        | P3       | Crate shaping should be deterministic.                                                                                                     |
| `leafconfig`      | `src/api/parser/nodelogic/datautils/leafconfig.js`        | config transform/source           | `data` or `refresh_config`                    | P2       | Config changes affect future processing by default; recompute requires explicit policy.                                                    |
| `leaflisp`        | `src/api/parser/nodelogic/wizardry/leaflisp.js`           | dynamic pure transform by default | `data`                                        | P2       | Lisp evaluation is pure unless the resolved lambda or host helper declares side effects.                                                   |

### `leafelement` Adapter Types

`leafelement` is a special node type. Its `elementname` is constrained by
`editorconfig.allowednames`, and the concrete runtime behavior is supplied by
`src/api/parser/nodelogic/elements/library/` through
`initStdElementProps()`. Runtime metadata must therefore be keyed by both
`type: "leafelement"` and `args.elementname`.

| Element name  | Adapter status                                                            | Runtime class                                           | Default trigger                                         | Priority | Migration detail                                                                                                          |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `gnav`        | wired: `library/gnav.js`                                                  | UI sink/source bridge                                   | `data` plus typed UI control                            | P2       | Navigation UI updates should be data-driven; user navigation events should emit source data events.                       |
| `popup`       | wired: `library/popup.js`                                                 | UI sink/source bridge                                   | `data` plus typed UI control                            | P2       | Popup display is a sink; user actions or close events are source events.                                                  |
| `editor`      | wired: `library/editor.js`                                                | UI stateful sink/source                                 | `data` plus typed UI control                            | P2       | Editor content updates and emitted edits require separate sink/source event identities.                                   |
| `text`        | wired: `library/text.js`                                                  | UI sink/pure transform                                  | `data`                                                  | P3       | Text rendering should not replay on control-only ticks.                                                                   |
| `prompt`      | wired: `library/prompt.js`                                                | UI source/sink                                          | `data` plus typed UI control                            | P2       | Prompt submissions must become source data events; prompt rendering is a sink.                                            |
| `http`        | wired: `library/http.js`                                                  | source for safe reads; side-effecting action for writes | `data`                                                  | P0       | `GET` can be modeled as source/read; `POST`, `PUT`, `PATCH`, and `DELETE` require idempotency metadata and bounded retry. |
| `href`        | wired: `library/href.js`                                                  | browser navigation side effect                          | `data`                                                  | P0       | Assigning `window.location.href` is externally visible navigation and must not be replayed from control ticks.            |
| `mediaplayer` | wired: `library/mediaplayer.js`                                           | UI/media sink                                           | `data` plus typed media control                         | P2       | Playback commands are side-effect-like browser actions and need explicit command identity if repeated.                    |
| `image`       | wired: `library/image.js`                                                 | UI sink/pure transform                                  | `data`                                                  | P3       | Image display should be data-driven and provenance-preserving.                                                            |
| `mediainput`  | wired: `library/mediainput.js`                                            | browser media source                                    | `control` lifecycle, then source data events            | P1       | Device permission, stream start/stop, and emitted frames/blobs must be typed source lifecycle behavior.                   |
| `midi`        | wired: `library/midi.js`                                                  | external device source/sink                             | `control` lifecycle, then source data events            | P1       | MIDI open/close is lifecycle control; inbound/outbound messages require stable event identity.                            |
| `sound`       | wired: `library/sound.js`                                                 | browser audio stateful sink/source                      | `data` plus typed media control                         | P1       | Audio graph mutation and playback are stateful browser side effects; command identity is needed for replay safety.        |
| `html`        | wired: `library/html.js`                                                  | pure transform/UI sink                                  | `data`                                                  | P3       | Template compilation should be config/future-only; rendered output should preserve input provenance.                      |
| `form`        | wired: `library/form.js`                                                  | UI stateful sink/source                                 | `data` plus typed UI control                            | P2       | Form rendering is a sink; submitted values are source data events.                                                        |
| `directus`    | wired: `library/directus.js`                                              | source for reads; side-effecting action for writes      | `data`                                                  | P0       | Directus writes require domain command IDs, idempotency, redaction, and retry policy before opt-in.                       |
| `token`       | allowed name, no wired adapter                                            | blocked/metadata-only                                   | none                                                    | P4       | Keep blocked until an adapter and explicit security contract exist.                                                       |
| `rancher`     | allowed name and adapter file exists, but not wired in `library/index.js` | side-effecting external API if enabled                  | `data`                                                  | P0       | Do not expose until wired intentionally with idempotency, credential handling, and redaction.                             |
| `hermes`      | wired: `library/hermes.js`                                                | source plus side-effecting action                       | `data` for writes; `control`/source lifecycle for reads | P0       | Egress commands require idempotency; read/poll/SSE events require source dedupe and cursor semantics.                     |
| `cortex`      | wired: `library/cortex.js`                                                | side-effecting job submission plus poll source          | `data`                                                  | P0       | Job submission already has adapter-level idempotency behavior; migrate onto shared runtime metadata and wrapper.          |
| `hippocampus` | allowed name, no wired adapter                                            | blocked/metadata-only                                   | none                                                    | P4       | Keep blocked until an adapter and memory/persistence contract exist.                                                      |

Additional adapter files currently outside the reachable `leafelement`
registry:

| Adapter file                                                    | Current status                                                                           | Required decision                                                                                                                                            |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/api/parser/nodelogic/elements/library/openai.js`           | file exists but `openai` is not in `allowednames` and is not wired in `library/index.js` | Treat as unavailable. If exposed later, classify as P0 side-effecting external API/job adapter with idempotency, credential, redaction, and retry contracts. |
| `src/api/parser/nodelogic/elements/library/rancher.js`          | file exists and `rancher` is allowed, but it is not wired in `library/index.js`          | Either wire intentionally with P0 side-effecting external API metadata or remove/deprecate the allowed name.                                                 |
| `src/api/parser/nodelogic/elements/library/wizardryelements.js` | helper/experimental element code, not wired through `initStdElementProps()`              | Keep out of runtime inventory until it is registered deliberately.                                                                                           |

Inventory acceptance gates:

1. Runtime classification tests must enumerate `Object.keys(_leafstdlib_dataflow_api())`.
2. Runtime classification tests must enumerate the concrete dispatch keys in
   `getLEAFNodeCoreLogic()`, not only metadata-derived node types.
3. The only unclassified core node types allowed by tests are explicitly obsolete,
   metadata-only, blocked, or legacy-dispatch entries listed above.
4. `leafradioRX` and `leafradioTX` must be rejected for new graphs.
5. `leafgnav` and `leafpopupview` must be rejected for new graphs; use their
   `leafelement` adapter equivalents instead.
6. `leafelement` classification must dispatch by `args.elementname`.
7. Runtime classification tests must enumerate `leafelement.editorconfig.allowednames`.
8. Allowed element names without wired adapters must fail fast with an unsupported-adapter error, not silently fall back.
9. Wired adapter files that are not allowed names must remain unreachable until explicitly added to metadata.
10. P0 adapters must not opt into data-triggered execution until idempotency, retry, replay, and redaction metadata are present.

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

Introduce a runtime event envelope for data, control, timer, retry, and replay
events. The envelope can wrap existing node payloads internally so user-level
LEAF code does not need to migrate all at once.

For compatibility-mode legacy handlers, envelopes are internal runtime
structures. Existing `datalogic.pre`, `leaflogic`, and `datalogic.post` code must
see the same raw payloads, bottles, and control objects they see today. Runtime
metadata is exposed separately through a stable read-only runtime context, not
by replacing the payload object passed through legacy `_stream` emissions.

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
  "payloadKind": "raw|bottle|empty_sentinel",
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
- `payload` contains the original legacy value exactly as emitted.
- `payloadKind` records whether the payload is a raw value, a bottle, or an
  empty-data sentinel without changing the payload shape.
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

The bare helper APIs below are lower-level primitives. They are not the first
repo-facing migration API because the current runtime is built around composite
flow objects rather than independent data and control streams.

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

## Legacy Flow Object Adapter Contract

The first migration layer should preserve the current runtime object contract
while routing execution through explicit trigger policies internally. Existing
node logic and element adapters should not need ad hoc rewiring before the new
drivers can be introduced.

Current flow object shapes:

```js
type LegacyDataFlowObject = {
  _stream: Observable<unknown>,
  _control?: LegacyControlFlowObject,
};

type LegacyControlFlowObject = {
  _stream: Observable<unknown>,
  _config?: Record<string, unknown>,
};

type LegacyNodeOutputObject = {
  _stream: Observable<unknown>,
  _control: LegacyControlFlowObject,
};
```

Current transformation shape:

```js
type LegacyTransformation = {
  leaflogic?: (inputObjArr, controlObj) => LegacyNodeOutputObject,
  datalogic?: {
    pre?: (data) => unknown,
    post?: (data) => unknown,
  },
};
```

The repo-facing migration helper should accept and return the legacy composite
shape:

```js
driveNodeByRuntimePolicy({
  inflowCtrlObj,
  dataInflowObjArr,
  metaCtrl$,
  context,
  policy,
  transformation,
});
```

Where:

- `inflowCtrlObj` is the current control object with `_stream` and `_config`.
- `dataInflowObjArr` is the current array of input objects with `_stream`.
- `metaCtrl$` is the optional auxiliary control stream currently passed through
  `driveDataflowByCtrlflow()`.
- `context` carries runtime location, trace, node, graph, and adapter metadata.
- `policy` is the resolved trigger policy and classification metadata.
- `transformation` preserves existing `leaflogic` and `datalogic.pre/post`
  hooks.

It must return:

```js
{
  _stream,
  _control: {
    _stream,
    _config,
  },
}
```

Adapter mapping rules:

1. Each legacy data emission is wrapped in an internal runtime data envelope
   before policy evaluation.
2. Each legacy control emission becomes a typed control envelope when it maps to
   a known intent; otherwise it becomes `legacy_tick`.
3. `legacy_tick` may drive compatibility-mode behavior only. It must not drive
   data-oriented side effects for opted-in nodes.
4. `inflowCtrlObj._config` becomes sampled runtime config context. It must not
   be treated as a data event.
5. `metaCtrl$` becomes auxiliary control input. It may carry lifecycle or
   adapter-local coordination, but it is not replay intent unless explicitly
   typed as replay.
6. In compatibility mode, the bridge unwraps the envelope before invoking
   `datalogic.pre`; `datalogic.pre` receives the original raw payload or bottle,
   so `isBottle(data)` and `_bname` checks continue to work.
7. The policy driver uses envelope metadata for trigger decisions, tracing,
   retry, replay, and idempotency decisions. It must not require legacy
   `leaflogic` implementations to inspect or mutate envelopes.
8. `leaflogic` is invoked through bridge streams so existing node logic still
   sees `inputObjArr` and `controlObj` with legacy-shaped `_stream` emissions.
   This preserves the call signature and composite flow-object shape only; it
   does not automatically rewrite adapter-internal subscriptions or side-effect
   triggers.
9. In compatibility mode, `datalogic.post` receives the legacy output payload
   from `leaflogic`, not a runtime envelope.
10. After `datalogic.post`, output data is wrapped into a runtime envelope for
    trace and causality propagation, then converted back to legacy `_stream`
    emissions while preserving parent event IDs in trace metadata.
11. Output control envelopes are converted back to `_control._stream` emissions
    with updated `_config.traces`.

The intended layering is:

```text
legacy composite flow objects
  -> runtime event envelopes
  -> policy driver
  -> legacy composite output object
```

This keeps the first runtime patch narrow: add policy-aware drivers and a
compatibility adapter without forcing every `src/api/parser/nodelogic/**`
implementation to switch to the lower-level stream primitives immediately.
However, the adapter is only a boundary bridge. It cannot make an internally
control-driven side-effecting adapter data-safe unless the adapter's internal
side-effect path is also migrated, gated by typed intent, or wrapped at the
side-effect call site.

Adapter acceptance criteria:

- `driveNodeByRuntimePolicy()` returns the same composite output shape expected
  by `eta.js`, `leaf.js`, `leafelement.js`, and existing node libraries.
- Existing `leaflogic(inputObjArr, controlObj)` functions can keep their
  signature and composite flow-object contract behind the adapter.
- Existing `datalogic.pre` and `datalogic.post` hooks execute in the same order
  relative to node logic as they do today.
- Compatibility-mode `datalogic.pre`, `leaflogic`, and `datalogic.post` receive
  legacy payloads and bottles, not runtime envelopes.
- Runtime context is available as a separate read-only object; it must not be
  merged into bottle content or legacy payload objects.
- The adapter can run in compatibility mode with legacy control-driven behavior
  and in opt-in mode with data-driven behavior for selected node types.
- In opt-in mode, a side-effecting adapter is not considered safe merely because
  it is hosted behind the bridge; its internal control subscriptions must be
  audited and either made data-driven, restricted to typed non-write control
  intent, or wrapped around the exact side-effect call.
- Dual trace records both legacy would-execute and policy-driver decisions.
- `metaCtrl$` emissions are traceable and cannot implicitly replay data.
- A side-effecting adapter opted into data-driven execution cannot execute from
  a control-only legacy tick.
- Tests cover at least one pure transform, one join/stateful node, and one
  `leafelement` adapter through the legacy-object adapter.
- Tests prove a bottle remains a bottle through `datalogic.pre`, `leaflogic`,
  and `datalogic.post`, including `isBottle()` and `_bname` branching.
- Tests prove no runtime envelope object leaks into compatibility-mode
  `_stream` or `_control._stream` emissions.
- Tests for side-effecting adapters include a legacy-shaped adapter with an
  internal `_control._stream.pipe(withLatestFrom(...))` path and prove
  control-only ticks cannot re-dispatch the side effect after opt-in.

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

### Idempotency Storage Contract

The generic side-effect wrapper must be storage-pluggable, but production policy
must not be storage-optional. The wrapper should accept an explicit
`idempotencyStore`; it must not silently choose an unsafe cache for
side-effecting production paths.

Storage backend classes:

- `memory`
  - Allowed for tests, local development, browser best-effort UI actions, and
    non-authoritative duplicate suppression.
  - Not sufficient as the final authority for externally visible side effects.
- `durable`
  - Required for server and worker side-effecting actions unless the external
    service provides authoritative idempotency.
  - Must support atomic create/update or compare-and-set semantics for
    concurrent duplicate suppression.
  - This package defines the durable-store interface and conformance contract;
    concrete database, queue, cache, or host persistence adapters live at the
    host/integration boundary.
- `server-authoritative`
  - Required when the external service supports idempotency keys or domain
    command IDs.
  - Runtime storage remains defense in depth and observability, not the final
    source of truth.

Default scopes:

```text
graphInstanceId:nodeId:producerId:domainKey
tenantId:integrationInstanceId:producerId:commandId
```

Use the graph-local scope only as a fallback. Prefer the external-domain scope
when tenant, integration, producer, and command identity exist. Browser-only
scope must include `graphInstanceId`, `nodeId`, and a session or runtime
instance ID, and must be documented as non-authoritative.

Default retention:

- `succeeded`: 24 hours unless node metadata or provider semantics declare a
  longer retention period.
- `failed`: retain at least through the retry window; default to 1 hour if no
  retry metadata declares otherwise.
- `suppressed`: retain for the same TTL as the terminal entry it references.
- `in_flight`: do not evict before the attempt timeout. Stale in-flight entries
  require explicit recovery policy before another attempt can proceed.

Default max size:

- In-memory stores default to 1,024 terminal entries per node instance unless
  node metadata declares a stricter limit.
- Durable stores must declare retention and capacity policy, or explicitly rely
  on provider/store retention.
- Max-size eviction must prefer old terminal entries and must never evict active
  `in_flight` entries.

Runtime environment rules:

- Browser runtime may use memory storage only for best-effort suppression.
  Browser refresh, tab close, or session loss can clear the cache, so external
  writes still require server/provider idempotency.
- Server runtime hosts must provide durable or server-authoritative
  idempotency for externally visible side effects; this package should validate
  that an acceptable store capability is configured but should not implement a
  database- or infrastructure-specific durability adapter in the first patch.
- Worker runtime hosts must share the same durable store and scope as the server
  for the same tenant/integration. Per-worker memory is not sufficient across
  restarts, parallel workers, or queue redelivery, but the concrete shared-store
  implementation is host-owned.

Store interface requirements:

- `reserve(key, attempt)` atomically creates or observes an `in_flight` entry.
- `markSucceeded(key, result)` records terminal success and TTL.
- `markFailed(key, error)` records retryable/non-retryable failure state.
- `markSuppressed(key, reason)` records observable suppression.
- `get(key)` returns current state without extending TTL unless policy says so.
- `sweep(now)` evicts only eligible terminal entries.
- Store implementations must declare their capability class, such as `memory`,
  `durable`, or `server-authoritative`, so production policy can fail fast when
  a side-effecting node is configured with an insufficient store.

Wrapper acceptance criteria:

- Production side-effecting nodes fail fast if no acceptable
  `idempotencyStore` is configured.
- Concurrent duplicate attempts against the same key produce one `in_flight`
  reservation and suppressed duplicates.
- Package tests use fake stores to exercise the durable-store contract,
  including simulated restart, concurrent reservation, stale `in_flight`
  recovery, and shared-worker views.
- Host durability tests belong with the host adapter that binds this interface
  to a concrete database, queue, cache, or provider-authoritative API.
- TTL tests cover `succeeded`, `failed`, `suppressed`, and stale `in_flight`
  behavior.
- Fake durable-store conflict tests prove the interface requires atomic
  duplicate suppression; concrete host adapters must run the same conformance
  suite against their backing store.

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

### Redaction First

Redaction is a prerequisite for runtime envelopes, richer traces, dual trace,
idempotency diagnostics, replay diagnostics, and side-effect adapter migration.
The first broad runtime patch must add shared redaction and safe logging before
new trace fields or envelope payloads are emitted broadly.

Required redaction behavior:

- Redact recursively by key for objects, arrays, request configs, response
  headers, error objects, control payloads, data payloads, and trace fields.
- Redact known sensitive keys and header names, including `authorization`,
  `cookie`, `set-cookie`, `token`, `secret`, `password`, `apiKey`, `api-key`,
  `x-api-key`, `X-CSRF-Token`, `refresh_token`, `access_token`, and private key
  fields.
- Redact full signed URLs and credential-bearing query parameters.
- Preserve non-sensitive correlation fields such as node ID, event ID, attempt
  ID, status code, error code, retry count, and short hash prefixes.
- Prefer allow-listed trace fields for side-effect adapters over logging raw
  request/response envelopes.

Required logging behavior:

- Existing side-effect adapter `console.log`, `console.warn`, and
  `console.error` calls must be removed, feature-gated for local debugging, or
  routed through the safe logging utility before the adapter opts into richer
  runtime tracing.
- P0 adapters must have redaction tests before data-triggered execution,
  idempotency diagnostics, or dual trace are enabled for them.
- No new runtime trace/envelope field may be logged unless it passes through the
  shared redaction utility or is included in a narrow allow-list.

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

## Runtime Options and Observability Contract

This package has browser-facing builds and should not assume a single server
process, `process.env`, or Prometheus transport. Rollout controls and
observability must be passed through runtime configuration and explicit sinks.
Environment variables and Prometheus exporters are host adapters, not the
package-level contract.

Repo-facing runtime options:

```js
{
  featureFlags: {
    defaultTriggerMode: "legacy" | "policy",
    enableTriggerPolicy: false,
    dataTriggeredNodeTypes: [],
    idempotentSideEffects: false,
    dualTraceExecution: false,
  },
  observability: {
    traceSink,
    metricSink,
    logSink,
  },
}
```

Feature flag resolution order:

1. Per-execution runtime config passed through existing `runtimeconfig` /
   `_config`.
2. Graph or node metadata.
3. Package defaults.
4. Build-time environment variables only as host-provided defaults for bundled
   deployments.
5. `globalThis` overrides only for local/debug tooling, not production policy.

Required sinks:

```js
traceSink.emit(event);
metricSink.record(name, labels, value);
logSink.debug(event);
logSink.info(event);
logSink.warn(event);
logSink.error(event);
```

Sink requirements:

- Default sinks are no-op, except safe local logging may be enabled explicitly
  after redaction.
- Browser hosts may provide callback, event, or in-memory sinks.
- Node/server hosts may adapt sinks to logs, OpenTelemetry, Prometheus, or
  leaf-server APIs.
- This package emits structured, redacted events; it does not own the metrics
  backend.
- Tests must include no-op sinks and in-memory sinks so browser builds do not
  depend on Node environment variables or Prometheus.
- Every sink event must pass through the shared redaction utility unless the
  event schema is an explicit narrow allow-list.

## Runtime Refactor Plan

### Phase 1: Define Runtime Contracts

Scope:

- Add node classification metadata.
- Add trigger policy schema.
- Add event envelope types.
- Add idempotency/retry/replay contracts.
- Add trace field conventions.
- Add runtime options and observability sink contracts.

Implementation tasks:

1. Define runtime TypeScript/JavaScript schemas or validators.
2. Add helper to resolve node classification.
3. Add helper to resolve trigger policy.
4. Add helper to wrap legacy payloads into runtime envelopes.
5. Add redaction utility for trace/log fields.
6. Add a metadata node inventory fixture derived from `_leafstdlib_dataflow_api()`.
7. Add a runtime dispatch inventory fixture derived from the concrete keys in
   `getLEAFNodeCoreLogic()`.
8. Add a `leafelement` adapter inventory fixture derived from
   `leafelement.editorconfig.allowednames` and `initStdElementProps()`.
9. Add `GhostRuntimeOptions` and transport-neutral observability sink schemas.
10. Add no-op and in-memory test sinks.
11. Add tests for schema validation, inventory completeness, sink behavior, and
    redaction.

Acceptance criteria:

- Every non-obsolete node from `_leafstdlib_dataflow_api()` can be classified.
- Every runnable dispatch key from `getLEAFNodeCoreLogic()` is classified or
  rejected; legacy dispatch-only keys such as `leafgnav` and `leafpopupview`
  must not remain available for new graphs.
- Every allowed `leafelement` name is either classified with a wired adapter or
  explicitly blocked as unsupported.
- `leafradioRX` and `leafradioTX` are rejected for new graphs as obsolete node
  types.
- `leafelement` classification resolves by `args.elementname`, not only by the
  outer `leafelement` node type.
- Unknown trigger policy fails validation.
- Runtime option resolution works through `_config` without requiring
  `process.env`.
- Browser/no-op observability mode does not require Prometheus or a Node
  metrics backend.
- Side-effecting nodes without idempotency metadata are flagged.
- Traces can identify execution cause without exposing secrets.

### Phase 2: Add Generic Execution Drivers

Scope:

- Implement shared data-driven, control-driven, timer-driven, retry, replay, and multi-input drivers.
- Add a legacy flow object adapter that preserves the current `_stream` /
  `_control._stream` contract.
- Keep legacy driver behavior available for compatibility.

Implementation tasks:

1. Implement `driveNodeByRuntimePolicy()` for legacy composite flow objects.
2. Implement `driveNodeByDataflow()`.
3. Implement `driveNodeByCtrlflow()`.
4. Implement `driveNodeByJoinPolicy()`.
5. Implement `driveNodeByTimer()`.
6. Implement idempotent side-effect wrapper.
7. Implement retry wrapper with injectable scheduler.
8. Implement replay resolver.
9. Add trace events for adapter and driver decisions.

Acceptance criteria:

- `driveNodeByRuntimePolicy()` accepts current `inflow_ctrl$obj`,
  `data_inflow$objArr`, `meta_ctrl_in$`, `context`, and transformation hooks.
- `driveNodeByRuntimePolicy()` returns the current composite output shape with
  `_stream` and `_control._stream`.
- Existing `leaflogic` and `datalogic.pre/post` hooks keep their current
  signature and ordering through the adapter.
- Side-effecting `leaflogic` implementations with internal control-driven write
  paths must be migrated internally or guarded at the side-effect call site
  before they opt into data-driven execution.
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

1. Add runtime feature flag resolution through `GhostRuntimeOptions`.
2. Keep legacy `driveDataflowByCtrlflow()` behavior available.
3. Add dual-trace instrumentation:
   - legacy would-execute
   - new would-execute
   - actual executed
   - suppressed duplicate
4. Emit divergence metrics through `metricSink`.

Runtime option example:

```js
{
  featureFlags: {
    defaultTriggerMode: "legacy",
    enableTriggerPolicy: true,
    dataTriggeredNodeTypes: ["http", "directus", "hermes", "cortex"],
    idempotentSideEffects: true,
    dualTraceExecution: true,
  },
  observability: {
    traceSink,
    metricSink,
    logSink,
  },
}
```

Hosts may map environment variables such as `GHOSTOS_ENABLE_TRIGGER_POLICY` into
`GhostRuntimeOptions`, but package code should read resolved runtime options,
not environment variables directly.

Acceptance criteria:

- Existing graphs run unchanged by default.
- Opt-in nodes use new trigger policy.
- Dual trace shows control-only ticks no longer execute opted-in data-driven nodes.
- Browser builds can run with no-op sinks and no environment variables.

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
- Adapter-internal control streams that previously sampled latest data for
  writes are split, gated by typed non-write intent, or moved behind the
  generic idempotent side-effect wrapper.
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

Emit runtime metric events through `metricSink.record(name, labels, value)`.
These names are package-level event names. A Node/server host may map them to
Prometheus, OpenTelemetry, logs, or another backend.

- `ghostos_node_execution_total{node_type, trigger, status}`
- `ghostos_node_execution_suppressed_total{node_type, reason}`
- `ghostos_side_effect_attempt_total{node_type, status}`
- `ghostos_side_effect_idempotency_total{node_type, decision}`
- `ghostos_retry_total{node_type, status}`
- `ghostos_replay_total{node_type, status}`
- `ghostos_config_update_total{node_type, behavior}`
- `ghostos_control_event_total{intent}`

Emit trace events through `traceSink.emit(event)`.

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

Emit logs through `logSink`. Direct `console` usage should be local/debug-only
or wrapped by a host-provided sink. Browser builds must work with no-op sinks.

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

## Recommended Foundation Patch Series

The first phase should not be Hermes-specific, but it must land as small,
ordered patches instead of one broad runtime patch. Each patch should own one
contract, one review surface, and the tests needed to prove that contract.

1. Redaction-only patch:
   - Add shared redaction and safe logging utilities.
   - Replace, remove, or feature-gate raw logging in high-risk runtime and
     adapter paths before richer traces are emitted.
   - Add tests proving redaction covers control data, headers, cookies, request
     configs, responses, error objects, signed URLs, and sensitive payload
     fields.
2. Runtime options and sink interfaces patch:
   - Add `GhostRuntimeOptions`, feature flag resolution, and transport-neutral
     `traceSink`, `metricSink`, and `logSink` interfaces.
   - Add no-op and in-memory test sinks for browser-safe observability.
3. Runtime event envelope patch:
   - Add runtime event envelope helpers.
   - Define envelope unwrap semantics for compatibility-mode `datalogic.pre`,
     `leaflogic`, and `datalogic.post`.
   - Ensure envelope trace and log output passes through the shared redaction
     utility before it reaches any sink.
   - Add tests proving legacy handlers see raw payloads or bottles, not runtime
     envelopes.
4. Node classification and trigger policy patch:
   - Add node classification and trigger policy schema.
   - Add helpers and tests for classification and trigger policy resolution.
5. Idempotency store contract patch:
   - Add idempotency storage contract, store interface, and memory test store.
   - Add tests for reservation, success, failure, duplicate decisions, and TTL.
6. Durable-store interface boundary patch:
   - Add durable-store adapter contract and capability metadata.
   - Add fake-store conformance tests for restart simulation, concurrent
     reservation, TTL, stale in-flight recovery, and shared-worker views.
   - Document that concrete database, queue, cache, or provider-authoritative
     durability adapters belong at the host/integration boundary.
7. Generic side-effect wrapper patch:
   - Add generic idempotent side-effect wrapper.
   - Require an explicit `idempotencyStore` for production side-effecting nodes.
   - Add tests for duplicate suppression and fail-fast behavior when required
     idempotency metadata or storage is missing.
8. Generic execution helpers and legacy adapter patch:
   - Add the legacy flow object adapter and generic data/control execution
     helpers.
   - Add tests proving control-only ticks do not execute data-driven nodes.
9. Generic side-effect adapter harness patch:
   - Add a reusable side-effect adapter test harness.
   - Keep Hermes as a later adapter migration target, not part of the foundation
     patch series.

After this foundation series lands, migrate individual node adapters, including
Hermes, onto the shared wrapper and trigger policy in separate adapter-specific
patches.

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

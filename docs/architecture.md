# GhostOS Architecture

GhostOS is the LEAF graph parser and runtime used by `leafgon.com`. It compiles LEAF graph definitions into executable dataflow nodes, wires their data and control streams, and runs node-specific logic through the parser and standard node library.

## High-Level Layers

- **Graph model and metadata**: `src/api/metamodel.js` defines the editor/runtime registry for LEAF node types. The registry constrains which nodes and `leafelement` adapters can appear in authored graphs.
- **Runtime graph compilation**: `src/api/parser/leaf.js` analyzes graph components, drives child logic, traces runtime execution, and bridges legacy control-driven execution paths.
- **Eta reduction and weaving**: `src/api/parser/eta.js` reduces lambda graphs, expands runtime node logic, and weaves the dataflow and control-flow planes into executable stream objects.
- **Runnable node dispatch**: `src/api/parser/breezyforest.js` maps LEAF node type names to concrete runtime logic implementations.
- **Node implementations**: `src/api/parser/nodelogic/` contains standard node behavior, including graph boundary nodes, data utilities, dataflow joins, abstractions, wizardry nodes, and `leafelement` adapters.
- **Adapter library**: `src/api/parser/nodelogic/elements/library/` implements browser, external API, UI, media, and side-effecting adapters such as `http`, `href`, `directus`, `hermes`, and `cortex`.
- **Runtime safety utilities**: `src/api/parser/runtime/` contains shared runtime infrastructure used by the refactor, including safe logging, recursive redaction, runtime option resolution, feature flags, observability sink contracts, internal runtime event envelopes, and node classification metadata.

## Execution Model

GhostOS has two logical planes:

- **Dataflow plane**: carries user data, node outputs, adapter results, and graph boundary values.
- **Control-flow plane**: carries lifecycle, orchestration, scheduling, replay, retry, and compatibility ticks.

The rearchitecture target is to make data-oriented node work edge-triggered by new data events while preserving control flow as an explicit orchestration plane. Side-effecting adapters must not replay latched data from control-only ticks unless a typed retry or replay intent explicitly permits it.

## Runtime Safety Direction

The runtime refactor is organized around a few invariants:

- Data events trigger data work by default.
- Control events coordinate work and do not implicitly replay prior data.
- Side-effecting nodes require idempotency metadata and bounded retry behavior.
- Runtime traces identify execution cause without logging secrets.
- Config changes affect future work by default unless a node declares recompute behavior.
- Multi-input nodes declare which lane drives execution.

Runtime rollout is controlled through `GhostRuntimeOptions`-style configuration rather than package code reading host environment variables directly. Feature flags cover default trigger mode, trigger policy enablement, data-triggered targets, idempotent side effects, and dual trace execution. Package defaults use policy execution for data-oriented targets after the migration gates pass, while graph, node, runtime, or build config can explicitly select legacy compatibility. Resolution is layered from package/build defaults through graph and node metadata to per-execution runtime config, with debug-only `globalThis` overrides requiring explicit opt-in.

Runtime event envelopes are internal metadata wrappers for data, control, timer, retry, and replay events. They preserve event identity, source-local sequence, graph instance ID, trigger cause, payload kind, and parent event IDs for policy and trace decisions. Compatibility helpers unwrap envelopes before legacy `datalogic.pre`, `leaflogic`, and `datalogic.post` handlers so existing code continues to receive raw payloads, bottles, and control objects.

Idempotency storage is a package-level contract for side-effecting actions. The runtime defines reservation, success, failure, suppression, lookup, sweep, capability validation, and explicit stale in-flight recovery transitions plus a bounded memory implementation for tests, local development, and browser best-effort duplicate suppression. The memory store is not authoritative for externally visible side effects; server, worker, and integration hosts must provide durable or provider-authoritative idempotency where retries, restarts, parallel workers, or external writes are involved. Package conformance tests use fake durable stores to prove the interface contract, while real database, queue, cache, or provider durability tests belong with the host adapter that binds this package API to infrastructure.

The generic side-effect wrapper uses the idempotency store contract to reserve attempts, suppress duplicates and replayed successes, apply bounded retry policy, emit redacted trace and metric decisions, and fail fast when production side-effecting paths lack acceptable idempotency storage. It is an opt-in runtime utility until individual P0 adapters migrate to it.

Policy execution helpers adapt legacy composite flow objects to explicit data, control, timer, join, retry, and replay trigger decisions. Policy mode is the package default for data-oriented targets, records what legacy would have executed versus what policy actually executes, and suppresses control/config replays unless the target declares a safe policy. Legacy compatibility remains available by setting `enableTriggerPolicy: false` or by using `defaultTriggerMode: "legacy"` with target-key allow lists during rollback or partial rollout.

Side-effect migration tests use a shared runtime harness that composes policy execution, runtime envelopes, in-memory observability sinks, and the idempotent side-effect wrapper around fake adapter calls. Future P0 adapter migrations should adapt concrete adapters into that harness shape so data-triggering, control/config suppression, retry, replay, duplicate keys, and redaction are proven consistently. Hermes is one later adapter migration and is not special-cased by the foundation harness.

Generic workflow integration tests model `source -> transform -> action -> sink` with runtime envelopes, deterministic config versions and fingerprint prefixes, fake side effects, and redacted in-memory observability. These tests are the end-to-end regression target for the data-oriented contract before concrete adapters opt in.

Multi-input workflow integration tests model `source_a + source_b -> join -> transform -> action` for all-input, primary-input, and any-input policies. All-input joins execute only after each lane has fresh data for the next set, primary-input joins can declare required context lanes, and traces record the lane that caused execution.

`leafchronosflow` is the explicit timer-driven stateful join surface. In policy mode it retains latest data by lane, suppresses data/control-only redispatch, and samples retained data only when a timer envelope with an event ID and sequence arrives. `leafasyncflow` is documented and classified as the same Chronos policy variant through the legacy shared implementation. Timer outputs preserve the timer event and sampled input event IDs in their parent-event trace, and retained latest-data state requires checkpoint-aware replay before host-level replay is enabled.

`leafmixflow` maps legacy mix modes to declared join policies before policy execution: merge/default use any-input ordering, concat uses the primary lane, and combine/combineLatest use all-input/latest-context join shapes. `leafgateflow` is a data-triggered filter/router in policy mode; rejected data is reported as a no-output trace decision and control/config ticks affect only future data unless a recompute policy is declared.

`leafmemoryio` is a data-driven stateful transform in policy mode. Local memory writes update deterministic in-memory state only from data envelopes, record event IDs and parent event IDs, expose explicit checkpoint/replay validation, and suppress control/config replay by default. Persistent or global memory mode remains blocked for policy execution until durable storage and idempotency metadata are defined.

Runtime invariant property tests use deterministic tables rather than external fuzzing dependencies to vary control/config tick counts, idempotency keys, retry limits, pure transform sequences, and join input ordering. They provide broad regression coverage for the rule that control/config ticks cannot replay data-oriented work or duplicate side effects by default.

Compatibility rollout helpers resolve `GhostRuntimeOptions` for a canonical runtime target key before choosing legacy or policy execution. Policy execution is the default after the runtime migration gates, while explicitly legacy targets can still run compatibility behavior. Targets can emit dual trace fields and divergence metrics that compare legacy would-execute behavior with policy-mode execution before, during, and after rollout.

The typed control intent resolver normalizes legacy control emissions, host lifecycle metadata, config changes, retry/replay requests, and scheduler/poller metadata into control envelopes. Compatibility mode maps ambiguous legacy ticks to `legacy_tick`, while strict typed-control paths fail fast on unknown intents or retry/replay requests without target identity.

Source lifecycle integration tests model subscription open, pause, resume, reconnect, source-record emission, stable source ID dedupe, and weak missing-ID correlation. Source records become data envelopes with source identity, monotonic sequence, trigger cause, and parent event IDs before downstream data-driven processing.

The `leafelement:http` migration boundary distinguishes safe read methods from externally visible write methods. HTTP write helpers normalize legacy request bottles into commands, require idempotency metadata, execute through fakeable fetch calls in tests, and rely on the shared side-effect harness for data-triggering, retry, replay, duplicate suppression, and redacted observability.

The `leafelement:href` migration boundary treats browser navigation as an externally visible side effect. Navigation helpers normalize legacy `href-request` bottles into typed commands, require a target URI plus command identity or explicit browser-local fallback metadata, execute through a fakeable location-like target, and rely on the shared side-effect harness for data-triggering, control/config suppression, duplicate suppression, and redacted observability. Browser-local idempotency is best-effort within the current runtime session; hosts that need restart-safe navigation commands must provide a durable or domain-authoritative idempotency store.

The `leafelement:directus` migration boundary separates read/source commands from create, update, upsert, and delete mutations. Mutation helpers normalize legacy Directus request bottles into typed commands, require endpoint, collection, credential, and idempotency metadata, execute through a fakeable Directus transport, and rely on the shared side-effect harness for data-triggering, control/config suppression, bounded retry, replay/duplicate suppression, fail-fast validation, and redacted observability. Directus production mutations require a durable, server-authoritative, or provider-authoritative idempotency store supplied by the host; source identity for reads is separate from mutation idempotency.

The `leafelement:hermes` migration boundary separates egress commands from read, poll, and SSE source lifecycle behavior. Egress helpers normalize message commands, require credentials and command identity, execute through a fakeable Hermes transport, and rely on the shared side-effect harness for data-triggering, control/config suppression, bounded retry, replay/duplicate suppression, fail-fast validation, and redacted observability. Hermes source records carry stable source identity, cursor/sequence metadata, and parent event IDs separately from egress idempotency; production egress requires a durable, server-authoritative, or provider-authoritative idempotency store supplied by the host.

The `leafelement:cortex` migration boundary separates job submission from poll/result source lifecycle behavior. Submission helpers map the adapter's existing idempotency key semantics onto shared runtime idempotency metadata, require credentials and explicit command identity for migrated policy execution, execute through a fakeable Cortex transport, and rely on the shared side-effect harness for data-triggering, control/config suppression, bounded retry, replay/duplicate suppression, fail-fast validation, and redacted observability. Cortex poll/source records carry job and request identity separately from submission idempotency.

The media/device adapter boundary covers `leafelement:mediainput`, `leafelement:midi`, and `leafelement:sound`. Lifecycle open/start/stop/pause/resume is typed control handled by the host, inbound media and MIDI records become data envelopes with stable or documented best-effort source identity, and outbound MIDI/audio/playback commands are data-triggered with browser-local command identity suppression. Browser-local suppression is best-effort for the active session only; hosts that need durable repeat safety must provide durable idempotency outside this package.

Graph boundary and deck structural nodes are policy-mode migration surfaces. `leafinflowport` converts host graph inputs into data envelopes with parent event IDs, while `leafoutflowport` forwards only newly emitted data and does not replay retained graph output on control/config ticks. `leafdeckspade` and `leafdeckheart` declare all-input aggregation with deterministic lane ordering, `leafdeckdiamond` remains data-triggered, and `leafdeckclub` emits initialization as explicit data distinct from lifecycle control. Legacy compatibility paths unwrap runtime envelopes before consumer callbacks.

Composite and dynamic graph nodes resolve policy before nested execution. `leafgraph` preserves trigger cause, parent event IDs, and runtime target context across nested graph boundaries. `leaflambdagraph` treats data events as recompute triggers while lifecycle and config control affect orchestration or future execution only. `leafspell` inherits or declares the resolved runtime classification before invocation, with side-effecting spells requiring idempotency metadata. `leafloopyspell` replay and looping are bounded and auditable, and `leaflisp` remains a pure data transform unless host helpers declare side effects explicitly.

UI bridge nodes split rendering sinks from user-action sources. `leafscreenio` and `leafelement:gnav`, `popup`, `editor`, `prompt`, `mediaplayer`, and `form` render only from data events, emit user actions as source data events with stable event IDs, and handle clear/close/refresh/playback through typed UI or media control intents. Generic control/config ticks do not replay prior render or browser/media actions, and repeatable browser/media commands require command identity where replay safety matters.

Configuration changes are future-only by default. `leafconfig` and runtime config helpers resolve a `refresh_config` control event only when a scoped `configVersion` or deterministic canonical fingerprint changes. `recompute-pure` is limited to pure transforms with retained input, `reopen-source` dedupes already emitted source event IDs, and side-effecting nodes do not replay prior effects from config changes unless a safe policy is declared. Secret-bearing P0 config requires a host version or non-exported fingerprint key, and traces expose only version, change state, behavior, and short non-sensitive fingerprint prefixes.

P3 pure transforms and render sinks are data-triggered and deterministic. `leaflabel`, `leafdelabel`, `leafbottle`, `leafunbottle`, and `leafcrate` preserve parent event IDs, suppress control/config replay, and report filtered inputs as no-output decisions where applicable. `leafelement:text`, `image`, and `html` render from data only, expose no hidden network or external side effects, and apply template/config changes to future data unless a pure recompute policy is declared.

## Node Classification

Runtime metadata classifies nodes by behavior:

- **Pure transform**: deterministic data transforms without external side effects.
- **Stateful transform**: stateful data processing such as memory, joins, windows, and dedupe.
- **Side-effecting action**: externally visible writes such as HTTP mutations, browser navigation, API job submission, queue publishing, and notifications.
- **Source**: external or lifecycle-driven input producers such as timers, subscriptions, devices, and user input.
- **Sink**: rendering, display, metrics, or debug output that consumes data.
- **Orchestrator**: graph lifecycle, routing, scheduling, branching, and cancellation behavior.

`leafelement` is an adapter host and must resolve classification from `args.elementname`; it is not one uniform runtime class.

Runtime classification uses canonical target keys: core nodes use `node:<nodeType>`, and adapters use `leafelement:<elementname>`. The runnable dispatch registry and wired adapter registry are exported for inventory tests so classification coverage is based on runtime metadata rather than source-text parsing. Obsolete or legacy dispatch-only nodes such as `leafradioRX`, `leafradioTX`, `leafgnav`, and `leafpopupview` are blocked for new graphs.

P4 inventory decisions are explicit metadata, not implied by missing source imports. Obsolete radio nodes, legacy-only dispatch keys, metadata-only `leafanchor`/`leafsyncflow`, declaration-only `leafspelldef`, and blocked adapters such as `token`, `hippocampus`, and `rancher` declare whether runtime execution is modeled. New graph and runtime-execution validation fail fast for obsolete, blocked, legacy-only, or metadata-only targets while preserving legacy dispatch definitions for compatibility.

Allowed adapter names can remain blocked when their runtime safety contract is incomplete. `leafelement:rancher` is intentionally allowed only as blocked metadata: its legacy adapter source exists, but it is not present in the wired adapter registry and new graphs must receive a deterministic unsupported-adapter validation error until credential handling, idempotency, retry/replay, and redaction are migrated.

## Security Boundary

Runtime traces and diagnostics must pass through shared redaction before emission. Sensitive keys, headers, payload fields, error objects, request configs, response headers, cookies, bearer tokens, private keys, credential query parameters, and signed URLs are redacted before logs or trace sinks see them. Browser logging is disabled by default unless explicitly enabled for local debugging.

Observability is transport-neutral at the package boundary. Runtime code emits to `traceSink.emit(event)`, `metricSink.record(name, labels, value)`, and `logSink.debug/info/warn/error(event)`. Default sinks are no-op; browser hosts can use callback or in-memory sinks, and server hosts can adapt the same interfaces to logs, OpenTelemetry, Prometheus, or host APIs outside this package.

## Compatibility Strategy

Existing LEAF payload shapes remain compatible during the refactor. Runtime envelopes, typed control intents, trigger policies, idempotency records, and richer traces are introduced behind compatibility bridges so legacy `datalogic.pre`, `leaflogic`, and `datalogic.post` code continues to receive the raw payload shapes it expects while runtime metadata is exposed through explicit context.

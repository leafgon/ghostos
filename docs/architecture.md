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

Runtime rollout is controlled through `GhostRuntimeOptions`-style configuration rather than package code reading host environment variables directly. Feature flags cover default trigger mode, trigger policy enablement, data-triggered targets, idempotent side effects, and dual trace execution. Resolution is layered from package/build defaults through graph and node metadata to per-execution runtime config, with debug-only `globalThis` overrides requiring explicit opt-in.

Runtime event envelopes are internal metadata wrappers for data, control, timer, retry, and replay events. They preserve event identity, source-local sequence, graph instance ID, trigger cause, payload kind, and parent event IDs for policy and trace decisions. Compatibility helpers unwrap envelopes before legacy `datalogic.pre`, `leaflogic`, and `datalogic.post` handlers so existing code continues to receive raw payloads, bottles, and control objects.

Idempotency storage is a package-level contract for side-effecting actions. The runtime defines reservation, success, failure, suppression, lookup, sweep, capability validation, and explicit stale in-flight recovery transitions plus a bounded memory implementation for tests, local development, and browser best-effort duplicate suppression. The memory store is not authoritative for externally visible side effects; server, worker, and integration hosts must provide durable or provider-authoritative idempotency where retries, restarts, parallel workers, or external writes are involved. Package conformance tests use fake durable stores to prove the interface contract, while real database, queue, cache, or provider durability tests belong with the host adapter that binds this package API to infrastructure.

The generic side-effect wrapper uses the idempotency store contract to reserve attempts, suppress duplicates and replayed successes, apply bounded retry policy, emit redacted trace and metric decisions, and fail fast when production side-effecting paths lack acceptable idempotency storage. It is an opt-in runtime utility until individual P0 adapters migrate to it.

Policy execution helpers provide an opt-in adapter from legacy composite flow objects to explicit data, control, timer, join, retry, and replay trigger decisions. The package default remains legacy behavior; policy mode is selected per runtime target and records what legacy would have executed versus what policy actually executes.

Side-effect migration tests use a shared runtime harness that composes policy execution, runtime envelopes, in-memory observability sinks, and the idempotent side-effect wrapper around fake adapter calls. Future P0 adapter migrations should adapt concrete adapters into that harness shape so data-triggering, control/config suppression, retry, replay, duplicate keys, and redaction are proven consistently. Hermes is one later adapter migration and is not special-cased by the foundation harness.

Generic workflow integration tests model `source -> transform -> action -> sink` with runtime envelopes, deterministic config versions and fingerprint prefixes, fake side effects, and redacted in-memory observability. These tests are the end-to-end regression target for the data-oriented contract before concrete adapters opt in.

Multi-input workflow integration tests model `source_a + source_b -> join -> transform -> action` for all-input, primary-input, and any-input policies. All-input joins execute only after each lane has fresh data for the next set, primary-input joins can declare required context lanes, and traces record the lane that caused execution.

Runtime invariant property tests use deterministic tables rather than external fuzzing dependencies to vary control/config tick counts, idempotency keys, retry limits, pure transform sequences, and join input ordering. They provide broad regression coverage for the rule that control/config ticks cannot replay data-oriented work or duplicate side effects by default.

Compatibility rollout helpers resolve `GhostRuntimeOptions` for a canonical runtime target key before choosing legacy or policy execution. Legacy mode remains the default for existing graphs, while opted-in targets can emit dual trace fields and divergence metrics that compare legacy would-execute behavior with policy-mode execution.

The typed control intent resolver normalizes legacy control emissions, host lifecycle metadata, config changes, retry/replay requests, and scheduler/poller metadata into control envelopes. Compatibility mode maps ambiguous legacy ticks to `legacy_tick`, while strict typed-control paths fail fast on unknown intents or retry/replay requests without target identity.

Source lifecycle integration tests model subscription open, pause, resume, reconnect, source-record emission, stable source ID dedupe, and weak missing-ID correlation. Source records become data envelopes with source identity, monotonic sequence, trigger cause, and parent event IDs before downstream data-driven processing.

The `leafelement:http` migration boundary distinguishes safe read methods from externally visible write methods. HTTP write helpers normalize legacy request bottles into commands, require idempotency metadata, execute through fakeable fetch calls in tests, and rely on the shared side-effect harness for data-triggering, retry, replay, duplicate suppression, and redacted observability.

The `leafelement:href` migration boundary treats browser navigation as an externally visible side effect. Navigation helpers normalize legacy `href-request` bottles into typed commands, require a target URI plus command identity or explicit browser-local fallback metadata, execute through a fakeable location-like target, and rely on the shared side-effect harness for data-triggering, control/config suppression, duplicate suppression, and redacted observability. Browser-local idempotency is best-effort within the current runtime session; hosts that need restart-safe navigation commands must provide a durable or domain-authoritative idempotency store.

The `leafelement:directus` migration boundary separates read/source commands from create, update, upsert, and delete mutations. Mutation helpers normalize legacy Directus request bottles into typed commands, require endpoint, collection, credential, and idempotency metadata, execute through a fakeable Directus transport, and rely on the shared side-effect harness for data-triggering, control/config suppression, bounded retry, replay/duplicate suppression, fail-fast validation, and redacted observability. Directus production mutations require a durable, server-authoritative, or provider-authoritative idempotency store supplied by the host; source identity for reads is separate from mutation idempotency.

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

## Security Boundary

Runtime traces and diagnostics must pass through shared redaction before emission. Sensitive keys, headers, payload fields, error objects, request configs, response headers, cookies, bearer tokens, private keys, credential query parameters, and signed URLs are redacted before logs or trace sinks see them. Browser logging is disabled by default unless explicitly enabled for local debugging.

Observability is transport-neutral at the package boundary. Runtime code emits to `traceSink.emit(event)`, `metricSink.record(name, labels, value)`, and `logSink.debug/info/warn/error(event)`. Default sinks are no-op; browser hosts can use callback or in-memory sinks, and server hosts can adapt the same interfaces to logs, OpenTelemetry, Prometheus, or host APIs outside this package.

## Compatibility Strategy

Existing LEAF payload shapes remain compatible during the refactor. Runtime envelopes, typed control intents, trigger policies, idempotency records, and richer traces are introduced behind compatibility bridges so legacy `datalogic.pre`, `leaflogic`, and `datalogic.post` code continues to receive the raw payload shapes it expects while runtime metadata is exposed through explicit context.

# GhostOS Architecture

GhostOS is the LEAF graph parser and runtime used by `leafgon.com`. It compiles LEAF graph definitions into executable dataflow nodes, wires their data and control streams, and runs node-specific logic through the parser and standard node library.

## High-Level Layers

- **Graph model and metadata**: `src/api/metamodel.js` defines the editor/runtime registry for LEAF node types. The registry constrains which nodes and `leafelement` adapters can appear in authored graphs.
- **Runtime graph compilation**: `src/api/parser/leaf.js` analyzes graph components, drives child logic, traces runtime execution, and bridges legacy control-driven execution paths.
- **Eta reduction and weaving**: `src/api/parser/eta.js` reduces lambda graphs, expands runtime node logic, and weaves the dataflow and control-flow planes into executable stream objects.
- **Runnable node dispatch**: `src/api/parser/breezyforest.js` maps LEAF node type names to concrete runtime logic implementations.
- **Node implementations**: `src/api/parser/nodelogic/` contains standard node behavior, including graph boundary nodes, data utilities, dataflow joins, abstractions, wizardry nodes, and `leafelement` adapters.
- **Adapter library**: `src/api/parser/nodelogic/elements/library/` implements browser, external API, UI, media, and side-effecting adapters such as `http`, `href`, `directus`, `hermes`, and `cortex`.
- **Runtime safety utilities**: `src/api/parser/runtime/` contains shared runtime infrastructure used by the refactor. The first utility is safe logging and recursive redaction for traces and diagnostics.

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

## Node Classification

Runtime metadata classifies nodes by behavior:

- **Pure transform**: deterministic data transforms without external side effects.
- **Stateful transform**: stateful data processing such as memory, joins, windows, and dedupe.
- **Side-effecting action**: externally visible writes such as HTTP mutations, browser navigation, API job submission, queue publishing, and notifications.
- **Source**: external or lifecycle-driven input producers such as timers, subscriptions, devices, and user input.
- **Sink**: rendering, display, metrics, or debug output that consumes data.
- **Orchestrator**: graph lifecycle, routing, scheduling, branching, and cancellation behavior.

`leafelement` is an adapter host and must resolve classification from `args.elementname`; it is not one uniform runtime class.

## Security Boundary

Runtime traces and diagnostics must pass through shared redaction before emission. Sensitive keys, headers, payload fields, error objects, request configs, response headers, cookies, bearer tokens, private keys, credential query parameters, and signed URLs are redacted before logs or trace sinks see them. Browser logging is disabled by default unless explicitly enabled for local debugging.

## Compatibility Strategy

Existing LEAF payload shapes remain compatible during the refactor. Runtime envelopes, typed control intents, trigger policies, idempotency records, and richer traces are introduced behind compatibility bridges so legacy `datalogic.pre`, `leaflogic`, and `datalogic.post` code continues to receive the raw payload shapes it expects while runtime metadata is exposed through explicit context.

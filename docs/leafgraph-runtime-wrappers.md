# LEAF Graph Runtime Wrappers

This guide explains how to reduce and execute LEAF graph JSON directly from
JavaScript.

## Exports

Import the wrappers from the package entrypoint.

```js
import { reducedLEAFGraph, executeLEAFGraph } from "ghostos";
```

## `executeLEAFGraph(graph, inputData, options)`

Use `executeLEAFGraph` when you want to run graph JSON with input data in one
call. The wrapper reduces the graph into LEAF logic, then executes that logic
with `inputData`.

```js
import { executeLEAFGraph } from "ghostos";

const output = await executeLEAFGraph(
  graphJson,
  { hello: "world" },
  {
    domain: "breezyforest",
    appid: "tests/example-learning-graph",
  },
);
```

## `reducedLEAFGraph(graph, options)`

Use `reducedLEAFGraph` when you want to inspect, cache, or execute the reduced
LEAF logic yourself.

```js
import { executeLEAFLogic, reducedLEAFGraph } from "ghostos";

const leaflogic = await reducedLEAFGraph(graphJson, {
  domain: "breezyforest",
  appid: "tests/example-learning-graph",
});

const output = await executeLEAFLogic(leaflogic, { hello: "world" });
```

## Supported Graph JSON Shapes

Both wrappers accept a parsed object, a JSON string, or a raw node array. The
graph must contain a `nodes` array in one of these shapes:

```js
await executeLEAFGraph(nodes, inputData);
await executeLEAFGraph({ nodes }, inputData);
await executeLEAFGraph({ graph: { nodes } }, inputData);
await executeLEAFGraph({ data: { graph: { nodes } } }, inputData);
await executeLEAFGraph(JSON.stringify({ data: { graph: { nodes } } }), inputData);
```

If no `nodes` array can be found, the wrappers throw an error.

## Node.js Example

```js
import { readFile } from "node:fs/promises";
import { executeLEAFGraph } from "ghostos";

const graphJson = JSON.parse(
  await readFile(new URL("./breezyforest-tests-example.json", import.meta.url), "utf-8"),
);

const output = await executeLEAFGraph(
  graphJson,
  { hello: "world" },
  {
    domain: "breezyforest",
    appid: "tests/example-learning-graph",
  },
);

console.log(output);
```

## Options

- `domain`: Runtime graph domain. Defaults to `"breezyforest"`.
- `appid`: Runtime graph app id. Defaults to `"leafgraph"`.
- `hostdomain`: Host graph domain. Defaults to `domain`.
- `hostappid`: Host graph app id. Defaults to `appid`.
- `mode`: Runtime mode passed to the eta tree. Defaults to `"nav"`.
- `component`: Explicit component member array to reduce.
- `componentIndex`: Component index to reduce. Defaults to `0`.
- `componentScope`: Component lookup scope. Use `"runtime"`, `"lambda"`, or
  `"dataflow-lambda"`. Defaults to `"runtime"`, with fallback to the first
  dataflow lambda component.
- `contextuallambda`: Contextual lambdas passed to dataflow reduction. Defaults
  to `[]`.
- `refnode`: Reference node for reduction and execution. Defaults to the first
  selected component member.
- `runtimeconfig`: Runtime config passed to `executeLEAFLogic` by
  `executeLEAFGraph`. Defaults to `{}`.
- `ctrlInput`: Optional control input passed to `executeLEAFLogic` by
  `executeLEAFGraph`.
- `leafio`: LEAF IO implementation used while building the eta tree.
- `leaflakeio`: Leaflake IO implementation used while building the eta tree.
- `mnemosyne`: Runtime memory container. Defaults to `{ current: {} }`.
- `hostEtaTree`: Existing host eta tree to attach to.
- `initLeaflisp`: Whether to initialize `gRuntimeLEAFlisp` on the eta tree.
  Defaults to `true`.
- `leaflispAccioBottles`: Custom data and control accio bottles used when
  initializing LEAFlisp.
- `masterSubsDirectory`: Optional master subscription directory passed to graph
  reconstruction.

## Runtime Services

The wrappers include minimal defaults for local graph reduction:

- `leafio` defaults to no-op state and callback methods.
- `leaflakeio.qm_methods.queryGraph` defaults to returning the same graph nodes.
- `mnemosyne` defaults to an empty `{ current: {} }` container.

Graphs that query other graphs, rely on subscription state, or use host runtime
behavior should pass real `leafio`, `leaflakeio`, `mnemosyne`, and contextual
lambda values through `options`.

## Component Selection

By default, `reducedLEAFGraph` reduces the first runtime component. If the graph
has no runtime component, it falls back to the first lambda component whose
scope is `dataflow`.

Use `component`, `componentScope`, or `componentIndex` when a graph contains
multiple reducible components and the default selection is not the target
component.

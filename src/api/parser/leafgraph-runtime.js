import { reconstructLEAFGraph, analyzeLEAFGraph, executeLEAFLogic } from "./leaf.js";
import { runtimeEtaTree, etaReduceDataflowComponent } from "./eta.js";
import { init_gRuntimeLEAFlisp } from "./nodelogic/wizardry/leaflisp.js";
import { doBottle } from "./nodelogic/datautils/bottling.js";

const defaultLeafIO = {
  getCurLEAFIOState: () => ({}),
  getMasterSubsDir: () => ({}),
  setNewLEAFIOState: () => true,
  setLEAFIOCallback: () => {},
};

const parseGraphJson = (graph) => {
  if (typeof graph === "string") {
    return JSON.parse(graph);
  }

  return graph;
};

const extractGraphNodes = (graph) => {
  const parsedGraph = parseGraphJson(graph);

  if (Array.isArray(parsedGraph)) {
    return parsedGraph;
  }

  if (Array.isArray(parsedGraph?.nodes)) {
    return parsedGraph.nodes;
  }

  if (Array.isArray(parsedGraph?.graph?.nodes)) {
    return parsedGraph.graph.nodes;
  }

  if (Array.isArray(parsedGraph?.data?.graph?.nodes)) {
    return parsedGraph.data.graph.nodes;
  }

  throw new Error("reducedLEAFGraph requires graph JSON with a nodes array.");
};

const createDefaultLeafLakeIO = (nodes) => ({
  qm_methods: {
    queryGraph: async () => ({ graph: { nodes } }),
  },
});

const resolveComponent = (leafcomponents, options) => {
  const { component, componentIndex = 0, componentScope = "runtime" } = options;

  if (Array.isArray(component)) {
    return component;
  }

  const runtimeComponents = leafcomponents.components.nodegroups.runtime;
  const lambdaComponents = leafcomponents.components.nodegroups.lambda;

  if (componentScope === "lambda") {
    return lambdaComponents[componentIndex];
  }

  if (componentScope === "dataflow-lambda") {
    return lambdaComponents.filter(
      (candidate) => leafcomponents.components.lut[candidate[0]]?.scope === "dataflow",
    )[componentIndex];
  }

  return (
    runtimeComponents[componentIndex] ??
    lambdaComponents.filter(
      (candidate) => leafcomponents.components.lut[candidate[0]]?.scope === "dataflow",
    )[componentIndex]
  );
};

const reducedLEAFGraph = async (graph, options = {}) => {
  const nodes = extractGraphNodes(graph);
  const leafgraph = reconstructLEAFGraph(nodes, options.masterSubsDirectory);
  const leafcomponents = analyzeLEAFGraph(leafgraph);
  const component = resolveComponent(leafcomponents, options);

  if (!component) {
    throw new Error("reducedLEAFGraph could not find a reducible LEAF graph component.");
  }

  const {
    mode = "nav",
    domain = "breezyforest",
    appid = "leafgraph",
    hostdomain = domain,
    hostappid = appid,
    leafio = defaultLeafIO,
    leaflakeio = createDefaultLeafLakeIO(nodes),
    mnemosyne = { current: {} },
    hostEtaTree,
    contextuallambda = [],
    initLeaflisp = true,
    leaflispAccioBottles = {
      data: doBottle("accio", "data_accio", { provenance: "reducedLEAFGraph" }),
      ctrl: doBottle("accio", "ctrl_accio", { provenance: "reducedLEAFGraph" }),
    },
  } = options;

  const etaTree = runtimeEtaTree(
    mode,
    hostdomain,
    hostappid,
    domain,
    appid,
    leafgraph,
    leafcomponents,
    leafio,
    leaflakeio,
    mnemosyne,
    hostEtaTree,
  );

  if (initLeaflisp) {
    etaTree.gRuntimeLEAFlisp = init_gRuntimeLEAFlisp(etaTree, leaflispAccioBottles);
  }

  return etaReduceDataflowComponent({
    refnode: options.refnode ?? component[0],
    component_members: component,
    contextuallambda,
    etaTree,
  });
};

const executeLEAFGraph = async (graph, inputData, options = {}) => {
  const leaflogic = await reducedLEAFGraph(graph, options);

  return executeLEAFLogic(
    leaflogic,
    inputData,
    options.runtimeconfig ?? {},
    options.refnode,
    options.ctrlInput,
  );
};

export { reducedLEAFGraph, executeLEAFGraph };

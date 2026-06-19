import { runtimeEtaTree } from "./eta.js";
import { reconstructLEAFGraph, analyzeLEAFGraph } from "./leaf.js";
import { v5 as uuid5 } from "uuid";

const DEFAULT_GITHUB_REF = "main";
const GITHUB_DOMAIN = "github";

const redactQueryValues = (graphRef) => {
  if (typeof graphRef !== "string") {
    return graphRef;
  }
  const queryIndex = graphRef.indexOf("?");
  if (queryIndex === -1) {
    return graphRef;
  }
  const refPath = graphRef.slice(0, queryIndex);
  const refQuery = graphRef.slice(queryIndex + 1);
  if (refQuery.length === 0) {
    return `${refPath}?`;
  }
  const redactedQuery = refQuery
    .split("&")
    .map((entry) => {
      if (!entry) {
        return entry;
      }
      const [key] = entry.split("=");
      return key ? `${key}=REDACTED` : "REDACTED";
    })
    .join("&");
  return `${refPath}?${redactedQuery}`;
};

const redactGraphCoordinate = (graphdomain, graphappid) =>
  `${graphdomain}/${redactQueryValues(graphappid)}`;

const normalizeGraphNodesPayload = (payload) => {
  if (!payload) {
    return [];
  }
  if (payload.graph?.nodes) {
    return payload.graph.nodes;
  }
  if (payload.data?.graph?.nodes) {
    return payload.data.graph.nodes;
  }
  if (payload.nodes) {
    return payload.nodes;
  }
  return [];
};

const parseGithubGraphRef = (graphappid) => {
  const [appid_path, appid_query] = graphappid.split("?");
  const parts = appid_path.split("/");
  if (parts[0]?.toLowerCase() === GITHUB_DOMAIN) {
    parts.shift();
  }
  if (parts.length < 3) {
    return null;
  }
  const user = parts.shift();
  const repo_part = parts.shift();
  if (!user || !repo_part) {
    return null;
  }
  const repo_segments = repo_part.split("@");
  const repo = repo_segments[0];
  const ref = repo_segments[1] || DEFAULT_GITHUB_REF;
  let path = parts.join("/");
  if (!repo || !path) {
    return null;
  }
  if (!path.endsWith(".json")) {
    path = `${path}.json`;
  }
  return { user, repo, ref, path, query: appid_query };
};

const isGithubGraphRef = (graphdomain, graphappid) => {
  if (typeof graphdomain === "string" && graphdomain.toLowerCase() === GITHUB_DOMAIN) {
    return true;
  }
  if (typeof graphappid !== "string") {
    return false;
  }
  const graphappidLower = graphappid.toLowerCase();
  return graphappidLower.startsWith(`${GITHUB_DOMAIN}/`) && graphappidLower.includes("/");
};

const fetchGithubGraph = async (graphdomain, graphappid) => {
  const graph_ref = parseGithubGraphRef(graphappid);
  if (!graph_ref) {
    throw new Error(`Invalid GitHub graph reference: ${redactQueryValues(graphappid)}`);
  }
  if (!globalThis.fetch) {
    throw new Error("GitHub graph fetch requires global fetch.");
  }
  const { user, repo, ref, path, query } = graph_ref;
  const url = `https://raw.githubusercontent.com/${user}/${repo}/refs/heads/${ref}/${path}${query ? `?${query}` : ""}`;
  const response = await globalThis.fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch GitHub graph ${redactGraphCoordinate(graphdomain, graphappid)}: ${response.status}`,
    );
  }
  const payload = await response.json();
  const nodes = normalizeGraphNodesPayload(payload);
  return { graph: { nodes } };
};

/*
 * etaTreeForest is a memory instance managing a bag of etatrees and information on their hierarchical relationships
 * to be stored in the master mnemosyne storage instance held by App.js, under the memory key "_etaTreeForest".
 * prefixing a memory key name with underscore would provide a mechanism for stopping user-level access to the memory
 * via the menomsyne leafnode. As of 14 May 2022, menosyne leafnode needs refactoring to disallow user-level access
 * for any underscore prefixed memory names.
 */
const etaTreeForest = (refEtaTree) => {
  const retrieveMasterEtaTree = (_etatree) => {
    if (!_etatree.hostEtaTree) return _etatree;
    return retrieveMasterEtaTree(_etatree.hostEtaTree);
  };

  //{
  //    setEtaTree: (treename, etaTree, parentname) => {
  //        masterEtaTree.mnemosyne.current[_etatreeforest_key][treename] = {tree: etaTree, parent: parentname};
  //        return data;
  //        //lambdactrl.gos.etaTree.mnemosyne.current = {...lambdactrl.gos.etaTree.mnemosyne.current, [memorykey]: data};
  //        // TBD: ponder about the best approach to mutating the master mnemosyne
  //        // lambdactrl.gos.etaTree.mnemosyne.current[memorykey] = data;
  //        // or to use the "pure" approach of store = {...store, [key]: val}
  //    },
  //    getEtaTree: (treename) => {
  //        return masterEtaTree.mnemosyne.current[_etatreeforest][treename].tree;
  //    }
  //},
  const rootEtaTree = retrieveMasterEtaTree(refEtaTree);
  const { appmode, domain, appid } = rootEtaTree;
  // spark_dev_note: below memory uri is only for systematically generating uuids based on graph's domain and appid
  // the uri does not correspond to a physical address serving any data.
  const etatreeforest_memory_uri = `https://www.leafgon.com/${domain}/${appid}/_etaTreeForest`; //${memoryname}`;
  const _etatreeforest_key = uuid5(etatreeforest_memory_uri, uuid5.URL); // uuid deterministically generated based on domain and appid
  const etaTreeLUT = rootEtaTree.mnemosyne.current[_etatreeforest_key];
  const etaTreeForestObj = {
    initEtaTreeForest: () => {
      if (!(_etatreeforest_key in rootEtaTree.mnemosyne.current))
        rootEtaTree.mnemosyne.current[_etatreeforest_key] = {};
      else
        console.error(
          "LEAF Error: an attempt to initialize an already initialized instance of etaTreeForest detected. This is likely due to a bug in eta tree handling.",
        );
    },
    getEtaTree: async (graphdomain, graphappid) => {
      const etatreekey = graphdomain + "/" + graphappid;
      if (etatreekey in etaTreeLUT) {
        return rootEtaTree.mnemosyne.current[_etatreeforest_key][etatreekey].tree; // {tree, parent} per etaTree reference
      } else {
        // need to reconstruct the relevant etaTree by parsing the graph from scratch
        const etatree = await etaTreeForestObj.parseGraphEtaTree(graphdomain, graphappid);
        return etatree;
      }
    },
    setEtaTree: (graphdomain, graphappid, etaTree, parentname) => {
      const etatreekey = graphdomain + "/" + graphappid;
      rootEtaTree.mnemosyne.current[_etatreeforest_key][etatreekey] = {
        tree: etaTree,
        parent: parentname,
      }; // {tree, parent} per etaTree reference
    },
    removeEtaBush: (graphdomain, graphappid) => {
      // now remove etaTree associated to graphdomain/graphappid and any other etaTrees
      // registered in the forest with graphdomain/graphappid as parent
      const etatreekey = graphdomain + "/" + graphappid;
      const _etaTreeLUT = Object.entries(etaTreeLUT)
        .filter(([key, val]) => key !== etatreekey && val.parent !== etatreekey)
        .reduce((lut, entry) => {
          lut[entry[0]] = entry[1];
          return lut;
        }, {});
      rootEtaTree.mnemosyne.current[_etatreeforest_key] = _etaTreeLUT;
    },
    parseGraphEtaTree: async (graphdomain, graphappid) => {
      const host_domain = domain;
      const host_appid = appid;
      const safeGraphCoord = redactGraphCoordinate(graphdomain, graphappid);
      // {_appmode, _hostdomain, _hostappid, _domain, _appid, filter='{}', variables}
      console.log("parseGraphEtaTree(): ", safeGraphCoord, "parsing...");
      if (globalThis?.DEBUG) {
        const tracecoord = safeGraphCoord;
        if (globalThis.trace[tracecoord]) {
          globalThis.trace[tracecoord].push("parsing");
        } else {
          globalThis.trace[tracecoord] = ["parsing"];
        }
      }
      const graph_data = isGithubGraphRef(graphdomain, graphappid)
        ? await fetchGithubGraph(graphdomain, graphappid)
        : await rootEtaTree.leaflakeio.qm_methods.queryGraph({
            _appmode: appmode,
            _hostdomain: domain,
            _hostappid: appid,
            _domain: graphdomain,
            _appid: graphappid,
          });
      //runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio, lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda)(graph_data);
      if (graph_data == { graph: null }) console.error("start debugging");
      //console.log("parseGraphEtaTree() graph queried: ", graphdomain, graphappid, graph_data);

      const { nodes } = graph_data.graph ? graph_data.graph : { nodes: [] };

      const leafgraph = reconstructLEAFGraph(nodes);
      const leafcomponents = analyzeLEAFGraph(leafgraph);

      // TBD: currently no mechanism is in place to support multiple runtimeEtaTrees.
      // refactor eta.js to make runtimeEtaTree an object that can be encapsulated and instantiated.
      // initialize leaf compiler
      //runtimeEtaTree.initTree(leafgraph, leafcomponents, masterSubsDirectory);
      const hostEtaTree = rootEtaTree;
      // spark_dev_note: here the sub etatree returned by runtimeEtaTree() inherits the appmode of the hostEtaTree (ie rootEtaTree)
      // this usage scenario would work in the mean time but some thought experiment needs to be done
      // to see if this inheritance is valid universally or not.
      // the rootEtaTree is initialized in App.js under handleGraphUpdate()
      const etaTree = runtimeEtaTree(
        appmode,
        host_domain,
        host_appid,
        graphdomain,
        graphappid,
        leafgraph,
        leafcomponents,
        hostEtaTree.leafio,
        hostEtaTree.leaflakeio,
        hostEtaTree.mnemosyne,
        hostEtaTree,
      );
      // set etaTree in the main mnemosyne's memory space with the key name '_etaTreeForest' using the treename
      //const treename = graph_domain+"/"+graph_appid;
      const parentname = hostEtaTree ? host_domain + "/" + host_appid : undefined;
      etaTreeForestObj.setEtaTree(graphdomain, graphappid, etaTree, parentname); // setEtaTree of etatreeforest.js accessed via the formalities of _leafmemoryio methods

      console.log("parseGraphEtaTree(): ", safeGraphCoord, "parsed");
      if (globalThis?.DEBUG) {
        const tracecoord = safeGraphCoord;
        if (globalThis.trace[tracecoord]) {
          globalThis.trace[tracecoord].push("parsed");
        } else {
          globalThis.trace[tracecoord] = ["parsed"];
        }
      }
      return etaTree;
    },
  };

  return etaTreeForestObj;
};

export { etaTreeForest };

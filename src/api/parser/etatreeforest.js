import { runtimeEtaTree } from './eta.js';
import { reconstructLEAFGraph, analyzeLEAFGraph } from './leaf.js';
import { v5 as uuid5 } from 'uuid';

/*
 * etaTreeForest is a memory instance managing a bag of etatrees and information on their hierarchical relationships
 * to be stored in the master mnemosyne storage instance held by App.js, under the memory key "_etaTreeForest".
 * prefixing a memory key name with underscore would provide a mechanism for stopping user-level access to the memory
 * via the menomsyne leafnode. As of 14 May 2022, menosyne leafnode needs refactoring to disallow user-level access
 * for any underscore prefixed memory names.
 */
const etaTreeForest = (refEtaTree) => {
    const retrieveMasterEtaTree = (_etatree) => {
        if (!_etatree.hostEtaTree)
            return _etatree;
        else (_etatree.hostEtaTree)
            return retrieveMasterEtaTree(_etatree.hostEtaTree);
    }
    
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
    const {appmode, domain, appid} = rootEtaTree;
    // spark_dev_note: below memory uri is only for systematically generating uuids based on graph's domain and appid
    // the uri does not correspond to a physical address serving any data.
    const etatreeforest_memory_uri = `https://www.leafgon.com/${domain}/${appid}/_etaTreeForest`; //${memoryname}`; 
    const _etatreeforest_key = uuid5(etatreeforest_memory_uri, uuid5.URL) // uuid deterministically generated based on domain and appid  
    const etaTreeLUT = rootEtaTree.mnemosyne.current[_etatreeforest_key]; 
    const etaTreeForestObj = {
        initEtaTreeForest: () => {
            if (!(_etatreeforest_key in rootEtaTree.mnemosyne.current))
                rootEtaTree.mnemosyne.current[_etatreeforest_key] = {};
            else
                console.error("LEAF Error: an attempt to initialize an already initialized instance of etaTreeForest detected. This is likely due to a bug in eta tree handling.");
        },
        getEtaTree: async (graphdomain, graphappid) => {
            const etatreekey = graphdomain + '/' + graphappid;
            if (etatreekey in etaTreeLUT) {
                return rootEtaTree.mnemosyne.current[_etatreeforest_key][etatreekey].tree; // {tree, parent} per etaTree reference 
            }
            else {
                // need to reconstruct the relevant etaTree by parsing the graph from scratch
                const etatree = await etaTreeForestObj.parseGraphEtaTree(graphdomain, graphappid);
                return etatree;
            }
        },
        setEtaTree: (graphdomain, graphappid, etaTree, parentname) => {
            const etatreekey = graphdomain + '/' + graphappid;
            rootEtaTree.mnemosyne.current[_etatreeforest_key][etatreekey] = {tree: etaTree, parent: parentname}; // {tree, parent} per etaTree reference 
        },
        removeEtaBush: (graphdomain, graphappid) => {
            // now remove etaTree associated to graphdomain/graphappid and any other etaTrees 
            // registered in the forest with graphdomain/graphappid as parent
            const etatreekey = graphdomain + '/' + graphappid;
            const _etaTreeLUT = Object.entries(etaTreeLUT)
                            .filter(([key, val])=>(key !== etatreekey && val.parent !== etatreekey))
                            .reduce((lut, entry)=>{lut[entry[0]]=entry[1]; return lut;},{});
            rootEtaTree.mnemosyne.current[_etatreeforest_key] = _etaTreeLUT;
        },
        parseGraphEtaTree: async (graphdomain, graphappid) => {
            const host_domain = domain;
            const host_appid = appid;
            // {_appmode, _hostdomain, _hostappid, _domain, _appid, filter='{}', variables}
            console.log("parseGraphEtaTree(): ", (graphdomain + "/" + graphappid), "parsing...");
            if (globalThis?.DEBUG) {
                const tracecoord = (graphdomain + "/" + graphappid);
                globalThis.trace[tracecoord] ? 
                    globalThis.trace[tracecoord].push("parsing") :
                    globalThis.trace[tracecoord] = ["parsing"];
            }
            const graph_data = await rootEtaTree.leaflakeio.qm_methods.queryGraph({_appmode: appmode, _hostdomain: domain, _hostappid: appid, _domain: graphdomain, _appid: graphappid});
            //runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio, lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda)(graph_data);
            if (graph_data == {graph: null})
                console.error("start debugging");
            //console.log("parseGraphEtaTree() graph queried: ", graphdomain, graphappid, graph_data);


            const {nodes} = graph_data.graph ? graph_data.graph : {nodes: []};

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
            const etaTree = runtimeEtaTree(appmode, host_domain, host_appid, graphdomain, graphappid, leafgraph, leafcomponents, hostEtaTree.leafio, hostEtaTree.leaflakeio, hostEtaTree.mnemosyne, hostEtaTree);
            const main_component = leafcomponents.components.nodegroups.runtime[0];
            const lambda_components = leafcomponents.components.nodegroups.lambda;
        
            // set etaTree in the main mnemosyne's memory space with the key name '_etaTreeForest' using the treename
            //const treename = graph_domain+"/"+graph_appid;
            const parentname = hostEtaTree ? host_domain+"/"+host_appid : undefined;
            etaTreeForestObj.setEtaTree(graphdomain, graphappid, etaTree, parentname); // setEtaTree of etatreeforest.js accessed via the formalities of _leafmemoryio methods

            console.log("parseGraphEtaTree(): ", (graphdomain + "/" + graphappid), "parsed");
            if (globalThis?.DEBUG) {
                const tracecoord = (graphdomain + "/" + graphappid);
                globalThis.trace[tracecoord] ? 
                    globalThis.trace[tracecoord].push("parsed") :
                    globalThis.trace[tracecoord] = ["parsed"];
            }
            return etaTree;
        }
    }

    return etaTreeForestObj;
};

export {etaTreeForest}
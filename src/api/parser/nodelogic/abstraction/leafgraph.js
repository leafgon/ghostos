import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { _leafbottle } from '../datautils/index.js';
//import { reconstructLEAFGraph, analyzeLEAFGraph } from '../../leaf';
//import { initializeLEAFlakeGQLClient } from '../../../leafio/leaflake';
//import { LEAFIOmetamodel } from '../../../metamodel';
import { _leafstdlib_dataflow_api } from '../../../metamodel.js';

import { fetchMultiKeyedData } from '../../../../api/utils/fetchnodedata.js';
import { mergeDataflows } from '../../../utils/leafdataflow.js';
import { _leafmemoryio } from '../io/index.js';
import { etaTreeForest } from '../../etatreeforest.js';

const leafgraph_apidef = _leafstdlib_dataflow_api("leafgraph")

const graphRefUpdateHandler = async (lambdactrl, refnode, host_domain, host_appid, graph_domain, graph_appid, leafio, mnemosyneRef, hostEtaTree, contextuallambda, parseLEAFConfig=false) => { //({ graph: {nodes, edges }}={}) => {}
    //const leafgraph = reconstructLEAFGraph(nodes); //, masterSubsDirectory;
    ////leafgraph.graph.dataflow.mapEdges((edge, attributes, source, target, sourceAttributes, targetAttributes) => {
    ////    console.log('edge: ', attributes, source, target);
    ////});
    //const leafcomponents = analyzeLEAFGraph(leafgraph);

    //// TBD: currently no mechanism is in place to support multiple runtimeEtaTrees.
    //// refactor eta.js to make runtimeEtaTree an object that can be encapsulated and instantiated. 
    //// initialize leaf compiler
    ////runtimeEtaTree.initTree(leafgraph, leafcomponents, masterSubsDirectory);
    //const etaTree = runtimeEtaTree(host_domain, host_appid, graph_domain, graph_appid, leafgraph, leafcomponents, leafio, hostEtaTree.leaflakeio, mnemosyneRef, hostEtaTree);
    //const main_component = leafcomponents.components.nodegroups.runtime[0];
    //const lambda_components = leafcomponents.components.nodegroups.lambda;

    //// set etaTree in the main mnemosyne's memory space with the key name '_etaTreeForest' using the treename
    //const treename = graph_domain+"/"+graph_appid;
    //const parentname = hostEtaTree ? host_domain+"/"+host_appid : undefined;
    //_leafmemoryio.methods(lambdactrl)({}).etatreeforest.setEtaTree(treename, etaTree, parentname);


    console.log("graphRefUpdateHandler(): ", graph_domain, graph_appid);
    const etaTree = await etaTreeForest(hostEtaTree)?.parseGraphEtaTree(graph_domain, graph_appid);
    if (etaTree === undefined)
        console.log("start debugging");
    const leafgraph = etaTree.leafgraph;
    const leafcomponents = etaTree.graphcomponents;
    const main_component = etaTree.graphcomponents.components.nodegroups.runtime[0];
    const lambda_components = etaTree.graphcomponents.components.nodegroups.lambda;


    // go through main_component and lambda_components defined in the current leafgraph
    // and catalog their eta reduced functions into a dictionary object to be passed down the lambda out port.
    const promiseArr = [];
    const promiseFactory = async () => {
        const graphLUT = {};
        // TBD: go over the leafspelldefs and make sure NOT to touch any leafspelldefs that would
        // cause self-looping definitions and go into infinite recursion. 
        // spark_dev_note: come up with a refactoring strategy to allow a leafgraph being imported 
        // to have leafspelldefs referencing the host leafgraph without worrying about infinite recursion. 
        // for now (8 Apr 2022), just exclude any leafspelldefs referencing the host leafgraph. 
        const clashing_leafgraph = leafgraph.graph.lambda.nodes().filter(
            (leafnodeuuid) => {
            //leafnodeAttributes: {leafnode: {...node, data: node_data}, lambdactrl: {gos: {standardSpellBook: {}, curatedSpellBook: {}, masterSubsDirectory: masterSubsDirectory}, user: {spellbook:{}, config:node_data}}}
                if (leafnodeuuid === "undefined" || leafnodeuuid === undefined)
                    console.log("start debugging");
                const leafnodeAttributes = leafgraph.graph.lambda.getNodeAttributes(leafnodeuuid);
                const {type, args} = leafnodeAttributes.leafnode.data.leaf.logic;
                if (type === "leafgraph") {
                    const leafgraph_addr = fetchMultiKeyedData(leafgraph_apidef.editorconfig.namedatakey, args).toLowerCase();
                    const hostgraph_addr = host_domain+'/'+host_appid;
                    return (leafgraph_addr === hostgraph_addr);
                }
                else {
                    return false;
                }
            }
        );
        if (clashing_leafgraph.length === 0) {
            const etaReductionPromiseArr = [];
            if (main_component) {
                //const reductionPromise = etaReduceDataflowComponent({component_members: main_component, contextuallambda, etaTree: etaTree});
                //reductionPromise.then((reducedDataflowFunc) => {
                //    graphLUT._default  = reducedDataflowFunc;
                //})
                //etaReductionPromiseArr.push(reductionPromise);
                if (["2ee89b44-16af-472f-97d4-47ae65f064c8"].includes(refnode))
                    console.log("start debugging");
                graphLUT._default = await etaReduceDataflowComponent({refnode: "leafgraph", component_members: main_component, contextuallambda, etaTree: etaTree});
            }
            // parse leafconfig from the leafgraph if any
            if (parseLEAFConfig && leafcomponents.leafconfig !== undefined) {
                const leafconfigPromise = etaTree.etaReduceLEAFNode({nodeuuid: leafcomponents.leafconfig, contextuallambda: contextuallambda}); //etaReduceLambdaGraphs({refnode: a_spelldef_uuid, })
                const leafconfigfLUT = await leafconfigPromise;
                graphLUT['_leafconfig'] = leafconfigfLUT['leafconfig']; 
                //leafconfigPromise.then((leafconfigfLUT) => {
                //    graphLUT['_leafconfig'] = leafconfigfLUT['leafconfig']; 
                //});
            }

            // parse all spelldefs from the leafgraph
            Object.entries(leafcomponents.spelldefs).map(
                ([a_spell_name, a_spelldef_uuid]) => {
                    // find out if the current leafspelldef would lead to self-looping definitions

                    const spelldefLUTPromise = etaTree.etaReduceLEAFNode({nodeuuid: a_spelldef_uuid, contextuallambda: contextuallambda}); //etaReduceLambdaGraphs({refnode: a_spelldef_uuid, })
                    // spelldefLUT is an LUT of dataflow-plane-scoped funcs as reduced by etaReduceLEAFNode() 
                    // as returned by executing the lambda-plane-scoped function of the spelldef leafnode. 
                    spelldefLUTPromise.then((spelldefLUT) => {
                        graphLUT[a_spell_name] = spelldefLUT; 
                    });
                    etaReductionPromiseArr.push(spelldefLUTPromise);
                }
            );

            await Promise.all(etaReductionPromiseArr); // block
        }

        return graphLUT; // this is what the promise would return once all other impending promises are resolved
    //promiseArr.push(runtimeLEAFGraphMainReductionPromise);
    };
    const runtimeLEAFGraphFuncLUTPromise = promiseFactory();

    //const runtimeLEAFGraphLUTPromise = Promise.all(promiseArr);

    return runtimeLEAFGraphFuncLUTPromise;
};
//const _leafapp = ({ appid=null, superappid=null } ={}, lambdaFunc=x=>x, graphContextual) => {}
const _leafgraph = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});

        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.

        //const filterDataOfInterest = _leafdataUnbottle({bottlekey:'_leafdeck'});
        const bottleUp = _leafbottle({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafgraph'}}}}, contextuallambda});
        const {type, args} = refnodedata.leaf.logic;

        // TBD: retrieve leafgraph from the lake as per the recorded domain and appid, reconstruct and analyze leafgraph
        const leafgraph_addr_str = fetchMultiKeyedData(leafgraph_apidef.editorconfig.namedatakey, args).toLowerCase();
        const addr_re = /([\w]+)\/([\w]+)/;
        const re_match = leafgraph_addr_str.match(addr_re);
        const isvalidmatch = (re_match && re_match[0] === leafgraph_addr_str) ? true : false;

        if (!isvalidmatch) {
            console.error(`LEAF Error: _leafgraph(): an invalid graph address (${leafgraph_addr_str}) entered.`);
            return {};
        }
        const graph_domain = re_match[1]; // parse the domain/appid from refnodedata
        const graph_appid = re_match[2];
        const host_domain = lambdactrl.gos.etaTree.domain; // current domain becomes the host domain of the leafgraph lookup
        const host_appid = lambdactrl.gos.etaTree.appid; // current appid becomes the host appid of the leafgraph lookup 
        
        if (graph_domain+'/'+graph_appid !== host_domain+'/'+host_appid) {
            //let runtimeLEAFGraphFuncLUTPromise;
            //const gql_subs_client = initializeLEAFlakeGQLClient({
            //    _domain: graph_domain, _appid: graph_appid, 
            //    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_qm,
            //    _handleChange: ({ graph: {nodes, edges }}={}) => {
            //        runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio.getMasterSubsDir(), lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda)({ graph: {nodes, edges }});
            //    }
            //});
            //await gql_subs_client.qm_methods.queryGraph(); // async call
            const runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, refnode, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio, lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda); //(ret1);

            const runtimeLEAFGraphFuncLUT = await runtimeLEAFGraphFuncLUTPromise;

            return (flowinput$Arr, controlflow$obj) => {
                //const flowinput$ = mergeDataflows(flowinput$Arr); // default to merging
                //const flowoutput$ = graphContextual(flowinput$);

                // do something with runtimeFuncLUT and transform flowinput$ into flowoutput$
                if (runtimeLEAFGraphFuncLUT) {
                    //const flowoutput$ = runtimeLEAFGraphFuncLUT._default([flowinput$]);
                    const flowoutput$obj = runtimeLEAFGraphFuncLUT._default(flowinput$Arr, controlflow$obj);

                    //flowoutput@obj is of form: {_stream, _control: controlflow$obj}; // with controlflow@obj pass thru
                    return {...flowoutput$obj, _control: controlflow$obj}; 
                }
                else {
                    console.error("LEAF Error: _leafgraph(): the leafnode was used before the graph retrieval from leaflake finished.");
                }
            };
        }
        else {
            console.error(`LEAF Error: _leafgraph(): a self-referring leafgraph (${refnode}) is not allowed.`);
            return (flowinput$Arr) => { // identity dataflow function
                const flowinput$obj = mergeDataflows(flowinput$Arr); // default to merging
                return {...flowinput$obj, _control: controlflow$obj}
            }
        }
    },
    // lambda opts out to NOT parse leafconfig node
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        // TBD has yet to be implemented
        //const reduced_lambda_obj = etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const {type, args} = refnodedata.leaf.logic;

        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});

        const leafgraph_addr_str = fetchMultiKeyedData(leafgraph_apidef.editorconfig.namedatakey, args).toLowerCase();
        const addr_re = /([\w-]+){0,1}(\/([\w-]+)){0,1}/;
        const re_match = leafgraph_addr_str.match(addr_re);
        const isvalidmatch = (re_match && re_match[0] === leafgraph_addr_str) ? true : false;

        if (!isvalidmatch) {
            console.error(`LEAF Error: _leafgraph(): an invalid graph address (${leafgraph_addr_str}) entered.`);
            return {};
        }
        const host_domain = lambdactrl.gos.etaTree.domain; // current domain becomes the host domain of the leafgraph lookup
        const host_appid = lambdactrl.gos.etaTree.appid; // current appid becomes the host appid of the leafgraph lookup 
        const graph_domain = re_match[1] ? re_match[1] : host_domain; // parse the domain from the addr_str
        const graph_appid = re_match[3] ? re_match[3] : 'index'; // parse the appid from the addr_str, where 'index' used as default
        
        if (graph_domain === 'breezyforest' || graph_domain+'/'+graph_appid !== host_domain+'/'+host_appid) {
            let runtimeLEAFGraphFuncLUTPromise;
            //const gql_subs_client = initializeLEAFlakeGQLClient({
            //    _domain: graph_domain, _appid: graph_appid, 
            //    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_qm,
            //    _handleChange: ({ graph: {nodes, edges }}={}) => {
            //        runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.masterSubsDirectory, contextuallambda)({ graph: {nodes, edges }});
            //    }
            //});
            try {
                //const gql_subs_client = initializeLEAFlakeGQLClient({
                //    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_qm,
                //});
                //const ret1 = await gql_subs_client.qm_methods.queryGraph({_domain: graph_domain, _appid: graph_appid});
                if (graph_appid === "editor")
                    console.log("start debugging");
                if (["3be30006-5b56-4b27-8eaa-249c6a46a557"].includes(refnode))
                    console.log("start debugging");
                const runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, refnode, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio, lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda); //(ret1);
                //gql_subs_client.subs_methods.queryGraph({_domain: domain, _appid: appid, subsCallback: handleGraphUpdate(done)});

                //const qmresponsePromise = gql_subs_client.qm_methods.queryGraph(); 
                //await qmresponsePromise; // blocking call 
                const runtimeLEAFGraphFuncLUT = await runtimeLEAFGraphFuncLUTPromise;

                return runtimeLEAFGraphFuncLUT;
            }
            catch (err) {
                console.error('leafgraph.lambda:', err);
                return undefined;
            }
        }
        else {
            console.error(`LEAF Error: _leafgraph(): a self-referring leafgraph (${refnode}) is not allowed.`);
            return {};
        }

        //const lambda_lut = {};
        //Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
        //    lambda_lut[key] = (input$) => { // a dataflow-scoped func per key
        //        const output$ = etafunc(input$);
        //        return output$;
        //    }
        //});
        //return lambda_lut;
    },
    // _lambda opts in to parse leafconfig node
    _lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        // TBD has yet to be implemented
        //const reduced_lambda_obj = etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const {type, args} = refnodedata.leaf.logic;

        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});

        const leafgraph_addr_str = fetchMultiKeyedData(leafgraph_apidef.editorconfig.namedatakey, args).toLowerCase();
        const addr_re = /([\w-]+){0,1}(\/([\w-]+)){0,1}/;
        const re_match = leafgraph_addr_str.match(addr_re);
        const isvalidmatch = (re_match && re_match[0] === leafgraph_addr_str) ? true : false;

        if (!isvalidmatch) {
            console.error(`LEAF Error: _leafgraph(): an invalid graph address (${leafgraph_addr_str}) entered.`);
            return {};
        }
        const host_domain = lambdactrl.gos.etaTree.domain; // current domain becomes the host domain of the leafgraph lookup
        const host_appid = lambdactrl.gos.etaTree.appid; // current appid becomes the host appid of the leafgraph lookup 
        const graph_domain = re_match[1] ? re_match[1] : host_domain; // parse the domain from the addr_str
        const graph_appid = re_match[3] ? re_match[3] : 'index'; // parse the appid from the addr_str, where 'index' used as default
        
        if (graph_domain === 'breezyforest' || graph_domain+'/'+graph_appid !== host_domain+'/'+host_appid) {
            let runtimeLEAFGraphFuncLUTPromise;
            //const gql_subs_client = initializeLEAFlakeGQLClient({
            //    _domain: graph_domain, _appid: graph_appid, 
            //    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_qm,
            //    _handleChange: ({ graph: {nodes, edges }}={}) => {
            //        runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.masterSubsDirectory, contextuallambda)({ graph: {nodes, edges }});
            //    }
            //});
            try {
                //const gql_subs_client = initializeLEAFlakeGQLClient({
                //    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_qm,
                //});
                //const ret1 = await gql_subs_client.qm_methods.queryGraph({_domain: graph_domain, _appid: graph_appid});
                if (graph_appid === "editor")
                    console.log("start debugging");
                if (["3be30006-5b56-4b27-8eaa-249c6a46a557"].includes(refnode))
                    console.log("start debugging");
                const runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, refnode, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio, lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda, true); //(ret1);
                //gql_subs_client.subs_methods.queryGraph({_domain: domain, _appid: appid, subsCallback: handleGraphUpdate(done)});

                //const qmresponsePromise = gql_subs_client.qm_methods.queryGraph(); 
                //await qmresponsePromise; // blocking call 
                const runtimeLEAFGraphFuncLUT = await runtimeLEAFGraphFuncLUTPromise;

                return runtimeLEAFGraphFuncLUT;
            }
            catch (err) {
                console.error('leafgraph.lambda:', err);
                return undefined;
            }
        }
        else {
            console.error(`LEAF Error: _leafgraph(): a self-referring leafgraph (${refnode}) is not allowed.`);
            return {};
        }

        //const lambda_lut = {};
        //Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
        //    lambda_lut[key] = (input$) => { // a dataflow-scoped func per key
        //        const output$ = etafunc(input$);
        //        return output$;
        //    }
        //});
        //return lambda_lut;
    },
    methods: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        return {
            //etatreeforest: { // leafgraph methods to be used by etatreeforest.js and by graphRefUpdateHandler()
            //    parseGraphEtaTree: async (graphdomain, graphappid) => {
            //        const host_domain = lambdactrl.gos.etaTree.domain;
            //        const host_appid = lambdactrl.gos.etaTree.appid;
            //        const graph_data = await lambdactrl.gos.etaTree.leaflakeio.qm_methods.queryGraph({_domain: graphdomain, _appid: graphappid});
            //        //runtimeLEAFGraphFuncLUTPromise = graphRefUpdateHandler(lambdactrl, host_domain, host_appid, graph_domain, graph_appid, lambdactrl.gos.leafio, lambdactrl.gos.etaTree.mnemosyne, lambdactrl.gos.etaTree, contextuallambda)(graph_data);


            //        const {nodes, edges } = graph_data;

            //        const leafgraph = reconstructLEAFGraph(nodes);
            //        const leafcomponents = analyzeLEAFGraph(leafgraph);
            //    
            //        // TBD: currently no mechanism is in place to support multiple runtimeEtaTrees.
            //        // refactor eta.js to make runtimeEtaTree an object that can be encapsulated and instantiated. 
            //        // initialize leaf compiler
            //        //runtimeEtaTree.initTree(leafgraph, leafcomponents, masterSubsDirectory);
            //        const hostEtaTree = lambdactrl.gos.etaTree;
            //        const etaTree = runtimeEtaTree(host_domain, host_appid, graph_domain, graph_appid, leafgraph, leafcomponents, lambdactrl.gos.leafio, hostEtaTree.leaflakeio, hostEtaTree.mnemosyne, hostEtaTree);
            //        const main_component = leafcomponents.components.nodegroups.runtime[0];
            //        const lambda_components = leafcomponents.components.nodegroups.lambda;
            //    
            //        // set etaTree in the main mnemosyne's memory space with the key name '_etaTreeForest' using the treename
            //        const treename = graph_domain+"/"+graph_appid;
            //        const parentname = hostEtaTree ? host_domain+"/"+host_appid : undefined;
            //        _leafmemoryio.methods(lambdactrl)({}).etatreeforest.setEtaTree(treename, etaTree, parentname); // setEtaTree of etatreeforest.js accessed via the formalities of _leafmemoryio methods

            //        return etaTree;
            //    }
            //},
            //general: {
            //    getNodeData: () => {
            //        return refnodedata;
            //    },
            //    executeLEAFlisp: (lispcode) => {
            //        return run(lispcode);
            //    }
            //}
        };
    }
};

export { _leafgraph };
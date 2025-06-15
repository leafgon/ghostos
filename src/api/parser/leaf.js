/*
 * author: spark@leautomaton.com
 * copyright LEA
 * 
 * LEAF graph interpreter v0.1
 * 16 Dec 2021
 * 
 */
import { map, concatMap, combineLatestWith, zipWith, mergeWith, concatWith, raceWith, skip, multicast, share, takeUntil, switchMap, withLatestFrom, filter, skipUntil, first } from 'rxjs/operators';
import { combineLatest, interval, zip, merge, concat, race, of, take, BehaviorSubject, Subject } from 'rxjs';
import { LEAFIOmetamodel } from '../metamodel.js';
//import { processLEAFNodeLogic } from './breezyforest';
import Graph from 'graphology';
import {connectedComponents} from 'graphology-components';

import { isSpellDefComponent, hasLambdaGraphNode, isDataflowPlaneScoped, isLambdaPlaneScoped, isLambdaComponent, isRuntimeComponent, isAnchoredComponent, isBottle, isLEAFConfigComponent } from './predicates.js';

import {Buffer} from 'buffer';

import { firstValueFrom } from 'rxjs';
//import { TIMEOUTBEHAVIOR_BESTEFFORT, combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../utils/leafdataflow';
import { _leafgraph } from './nodelogic/abstraction/index.js';
import { doBottle } from './nodelogic/datautils/bottling.js';

const _version = LEAFIOmetamodel.breezyforest._version;

// various combining mechanisms explained in 
// https://indepth.dev/posts/1114/learn-to-combine-rxjs-sequences-with-super-intuitive-interactive-diagrams
const combineOpDictionary = {
    merge: {indexed: mergeWith, unindexed: merge},
    combine: {indexed: zipWith, unindexed: zip},
    combineLatest: {indexed: combineLatestWith, unindexed: combineLatest},
    concat: {indexed: concatWith, unindexed: concat},
    race: {indexed: raceWith, unindexed: race}
};
//const postcombineOpDictionary = {
//    merge: {indexed: null, unindexed: null},
//    zip: {indexed: zipWith, unindexed: zip},
//    zipLatest: {indexed: combineLatestWith, unindexed: combineLatest},
//    concat: {indexed: concatWith, unindexed: concat},
//    race: {indexed: raceWith, unindexed: race}
//};

const combineInputStreams = (config) => {
    if (config.isIndexed) {
        const operatorFunc = combineOpDictionary[config.combineOperator]['indexed'];
        return (input$Arr) => {
            return interval().pipe(
                operatorFunc(...input$Arr),
                //map(x => {
                //    //console.log('indexed combineInputStreams: ' + x + ', config: ' + JSON.stringify(config)); 
                //    return x;
                //})
            );
        }
    }
    else {
        const operatorFunc = combineOpDictionary[config.combineOperator]['unindexed'];
        return (input$Arr) => {
            return operatorFunc(...input$Arr); //.pipe(map(x => {
            //    //console.log('unindexed combineInputStreams: ' + x + ', config: ' + JSON.stringify(config)); 
            //    return x;
            //}));
        }
    }
}
/*
 * function parseLEAFNode() is used to parse a LEAF node
 * in order to set up its LEAF execution logic and to configure the mode of execution accordingly 
 * the function returns a function that executes the given logic.
 * running the returned function provided with an array of input streams would return an output stream,
 * reflecting the result of the executed logic.
 * arguments:
 * @lambdactrl: a json object representing a LEAF node's control data's duality consisting of gos and user  
 *  @gos 
 *  @user:
 *     @config: a json object specifying the configuration options for the node's mode of execution
 *              here, things like 
 * @lambdadata:
 *  @nodeLambdaFunc: a parsed runtime lambda function connected to the current node
 *  @graphContextual: a parsed runtime lambda function connected to the graph of which the current node is a member
 * example node_data retrieved from leaflake:
 * {
 *  'leaf': {
 *      'api': 'breezynode',
 *      'logic': {
 *          'type': 'leafdeckclub',
 *          'args': {'logictoggle': False, 'deckname': 'Lim'}
 *      },
 *      'node': {'leaduuid': '21e88429-2917-4e74-939f-919f17a1c4c6'}
 *  },
 *  'leafeditor': {'position': {'x': 240, 'y': 256}}
 * }
 */
//const parseLEAFNode = (node_dualplane_data, config={}, nodeLambdaFunc, graphContextual) => {}
//const parseLEAFNode = (input) => {
//    const {
//        lambdactrl, //: {gos: {standardSpellBook={}, curatedSpellBook={}}, user: {spellbook={}, leaf, config={}}}
//        lambdadata  //: {lambdaFunc: nodeLambdaFunc, graphContextual}
//    }=input;
//    const defaultConfig = {combineOperator: 'merge', isIndexed: false, metamodel: LEAFIOmetamodel.breezyforest};
//    //const node_data = JSON.parse(Buffer.from(node.data, 'base64').toString('utf-8')); // parse base64 into a json object
//    const fullConfig = {...defaultConfig, ...lambdactrl.user.config};
//
//    //const processLEAFNodeLogic = ({lambdactrl: {gos={}, user: args={}}, lambdadata: {lambdaFunc: nodeLambdaFunc, graphContextual}}) => {}
//    const leafNodeLogic = processLEAFNodeLogic({lambdactrl, lambdadata});
//    const inputCombineFunc = combineInputStreams(fullConfig);
//    const flattenArray = (x) => Array.isArray(x) ? x.flatMap(_x=>_x) : x;
//    return (input$Arr) => {
//        if (input$Arr.length > 0) {
//            // make a configurable choice of combining input streams via either merge, zip, combineLatest, etc as defined in combineOpDictionary 
//            const combinedInput$ = inputCombineFunc(input$Arr); //.pipe(
//            //    map((_data) => { // a window for debugging
//            //        console.log(_data);
//            //        return _data;
//            //    })
//            //); // to combine 1, [2, [3]] into [1, [2, [3]]] or 1 into [1]
//            const flattendInput$ = combinedInput$.pipe(map(x=>flattenArray(x))); //.pipe(
//            //    map((_data) => { // a window for debugging
//            //        console.log(_data);
//            //        return _data;
//            //    })
//            //); // to flatten [1,[2, [3]]] into [1, 2, [3]] or [1] into [1]
//            //const output$ = combinedInput$.pipe(
//            //    map(node_input=>{
//            //        let node_output = null; 
//            //        //console.log('input$ ' + JSON.stringify(input$));
//            //        console.log('input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
//            //        // execute node level logic and optionally set node_output here
//            //        node_output = processLEAFNodeLogic(node_data.leaf.logic)(node_input);
//            //        console.log('node logic executed: ' + JSON.stringify(node_output));
//            //        return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
//            //    })
//            //);
//
//            const output$ = leafNodeLogic(flattendInput$);
//            return output$;
//        }
//        //else {
//        //    // where a node has zero input streams,  
//        //    // the node would act as a point of origin indefinitely generating a default data stream 
//        //    // of unbridled interval indexes 0,1,2,3,...
//        //    // spark_dev_note: ponder about whether supporting timed intervals here would be of any use.
//        //    // for example, it could be used in throttling the LEAF data processing throughput.
//        //    //const output$ = interval().pipe(
//        //    //    map(node_input=> {
//        //    //        let node_output = null; 
//        //    //        console.log('source input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
//        //    //        // execute node level logic and optionally set node_output here
//        //    //        node_output = processLEAFNodeLogic(node_data.leaf.logic)(node_input);
//        //    //        console.log('node logic executed: ' + JSON.stringify(node_output));
//        //    //        return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
//        //    //    })
//        //    //);
//        //    const generatedInput$ = interval();
//        //    const output$ = leafNodeLogic(generatedInput$);
//        //    return output$;
//        //}
//    };
//};

//const addNodeIfNotRedundant = ( graph, uuid, data ) => {
//    if (!graph.hasNode(uuid))
//        graph.addNode(uuid, data);
//};

/*
 * parseSpellBook() parses a spellbook represented in graph into a js function LUT of spells.
 * @spellbookgrapho: a graphology Graph carrying nodes, each identified by uuid containing as attributes the corresponding leafnode and its decoded data.
 *                   the graph only carries dataflow plane edges.
 * @leaflib: is a js func library (LUT) carrying references to the leaf standard lib + standard spells + curated spells
 * @masterSubsDirectory: is an object carrying the details for establishing LEAFIO protocols 
 *                       (that support inter-component communication channels) between some leafnodes
 */
const parseSpellBook = ({spellbookgrapho, leaflib, masterSubsDirectory}) => {

};

/*
 * reconstructLEAFGraph() initializes a GOSjs-compatable graph data structure based on the @nodes passed in.
 * a single LEAF component is defined only within the context of nodes and data edges (i.e. leafdataedge).
 * a LEAF component is a runtime LEAF component if none of its nodes is part of lambdasources.
 * a LEAF component is a lambda LEAF component if any of its nodes is part of lambdasources.
 * a LEAF component is an anchored LEAF component if any of its nodes is part of anchortargets.
 * @nodes: a data object carrying a list of nodes & their associated edges transported from LEAFlake via GraphQL. 
 * @masterSubsDirectory: a directory of inter-component communication channels
 */
const reconstructLEAFGraph = (nodes, masterSubsDirectory) => {
    const dataflowgraph = new Graph();
    const lambdagraph = new Graph();
    const combinedgraph = new Graph();
    const spellbookgraph = new Graph();

    let thespadeuuid = undefined;
    // register start and end nodes
    //graph.addNode('leafstart');
    //graph.addNode('leafend');
    // process nodes data
    nodes.forEach(node => {
        //const node_data = JSON.parse(atob(node.data));
        const node_data = JSON.parse(Buffer.from(node.data, 'base64').toString('utf-8'));
        if (node_data.leaf.logic.type === 'leafdeckspade')
            thespadeuuid = node.uuid;
        // add node
        // construct a graphology node-attributes lut to use node uuids to look up corresponding gos-level control data and user-level control data
//const parseLEAFNode = ({lambdactrl: {gos: {standardSpellBook={}, curatedSpellBook={}}, user:{spellbook={}, config={}}}, lambdadata: {lambdaFunc: nodeLambdaFunc, graphContextual}}) => {}
        // TBD: spark_dev_note: currently there are rather too many duplicates of graphology objects lying around causing clutter without adding any usefulness.
        // to make matters worse, the naming of these graphs isn't really self-explanatory enough.
        // analyze the code base regarding their usage and cut down the clutter and/or change their names.
        dataflowgraph.addNode(node.uuid, {leafnode: {...node, data: node_data}, lambdactrl: {gos: {standardSpellBook: {}, curatedSpellBook: {}, masterSubsDirectory: masterSubsDirectory}, user: {spellbook:{}, config:node_data}}}); 
        lambdagraph.addNode(node.uuid, {leafnode: {...node, data: node_data}, lambdactrl: {gos: masterSubsDirectory, user: node_data}}); 
        combinedgraph.addNode(node.uuid, {leafnode: {...node, data: node_data}, lambdactrl: {gos: masterSubsDirectory, user: node_data}}); 
        //dataflowgraph.addNode(node.uuid, {leafnode: {...node, data: node_data}, lambdactrl: {gos: {standardSpellBook: {}, curatedSpellBook: {}}, user: {spellbook:{}, config:node_data}}}); 
        //lambdagraph.addNode(node.uuid, {leafnode: {...node, data: node_data}, lambdactrl: {gos: {}, user: node_data}}); 
        //combinedgraph.addNode(node.uuid, {leafnode: {...node, data: node_data}, lambdactrl: {gos: {}, user: node_data}}); 
        // vs code erroneously claims atob is deprecated.
        //addNodeIfNotRedundant(graph, node.uuid, {leaf: JSON.parse(atob(node.data)).leaf} );
    });


    const datasources = new Set();
    const datatargets = new Set();
    const lambdasources = new Set();
    const lambdatargets = new Set();
    const lambdasourcelut = {};
    const anchortargets = new Set();
    // process edges data
    nodes.forEach(node => {
        //node.out_edges.filter((an_edge, idx) => {})
        // access and check the edge type, and filter in if of leafdataedge 
        node.out_edges.forEach(
            (an_edge, index) => {
                //const edge_data = JSON.parse(atob(an_edge.data)).leaf;
                const edge_data = JSON.parse(Buffer.from(an_edge.data, 'base64').toString('utf-8')).leaf;
                if (edge_data.logic.type === 'leafdataedge') { // leafdataedge 
                    if (!dataflowgraph.edge(an_edge.source.uuid, an_edge.target.uuid)) {
                        dataflowgraph.addEdgeWithKey(an_edge.uuid, an_edge.source.uuid, an_edge.target.uuid, edge_data);
                        combinedgraph.addEdgeWithKey(an_edge.uuid, an_edge.source.uuid, an_edge.target.uuid, edge_data);
                        datasources.add(an_edge.source.uuid);
                        datatargets.add(an_edge.target.uuid);
                    }
                    else {
                        const _cache = {node};
                        console.error(`duplicate edge data detected linking ${an_edge.source.uuid} and ${an_edge.target.uuid}`);
                    }
                }
                else if (edge_data.logic.type === 'leaflambdaedge') {
                    if (an_edge.source.uuid.slice(0, 4) === "9935")
                    {
                        const teststr = JSON.parse(Buffer.from(an_edge.data, 'base64').toString('utf-8'));
                        console.log("start debugging", teststr);
                        return;
                    }
                    lambdagraph.addEdgeWithKey(an_edge.uuid, an_edge.source.uuid, an_edge.target.uuid, edge_data);
                    combinedgraph.addEdgeWithKey(an_edge.uuid, an_edge.source.uuid, an_edge.target.uuid, edge_data);
                    // build source and target sets constituting all instances of leaflambdaedge
                    lambdasources.add(an_edge.source.uuid); // used to determine lambda vs non-lambda components
                    lambdatargets.add(an_edge.target.uuid); // used to determine if a node's leaf logic has a lambda component

                    // LUT used to look-up a source lambda node, if any, of a node.
                    // any unintended key clashes would turn up as an array of source node uuids sharing the same key as a target
                    lambdasourcelut[an_edge.target.uuid] = ((an_edge.target.uuid in lambdasourcelut) ? 
                        [an_edge.source.uuid].concat(lambdasourcelut[an_edge.target.uuid]) :  // array indicating a key clash
                        [an_edge.source.uuid]); // an array of a single uuid to begin with
                }
                else if (edge_data.logic.type === 'leafanchoredge') { // leafanchoredge
                    //console.log(edge_data.logic.type);
                    anchortargets.add(an_edge.target.uuid); // used to determine if a component is anchored
                }
            }
        );
    });

    // return a reconstructed object carrying information just enough to parse the LEAF logic given in the graph
    return {graph: {lambda: lambdagraph, dataflow: dataflowgraph}, thespade: {uuid: thespadeuuid}, edges: {data: {sources: datasources, targets: datatargets}, lambda: {sources: lambdasources, targets: lambdatargets, sourcelut: lambdasourcelut}, anchor: {targets: anchortargets}}};
};

/*
 * analyzeLEAFGraph() takes as input @leafgraph and
 * isolates and analyzes the graph components to determine their scopes (runtime, lambda or anchored)
 * @leafgraph: an object returned by reconstructLEAFGraph()
 * a LEAF component is a runtime LEAF component if none of its nodes is part of lambdasources.
 * a LEAF component is a lambda LEAF component if any of its nodes is part of lambdasources.
 * a LEAF component is an anchored LEAF component if any of its nodes is part of anchortargets.
 */
const analyzeLEAFGraph = (leafgraph) => {
    console.time('analyzeLEAFGraph')
    // component lists
    const runtimeList = []; 
    const lambdaList = [];
    const anchoredList = [];

    // analyze components in terms only of nodes and data edges
    const components = connectedComponents(leafgraph.graph.dataflow);

    //console.log(JSON.stringify(components));

    // a utility function to assist with building a LUT cumulatively 
    const buildComponentLUT = (nodesList, componentIdx, componentScope, componentCategory, cumulativeLUT) => {
        const lut = {...cumulativeLUT};
        nodesList.forEach((nodeuuid) => {
            lut[nodeuuid] = {
                idx: componentIdx, 
                scope: componentScope, 
                category: componentCategory, 
                metadata: leafgraph.graph.dataflow._nodes.get(nodeuuid).attributes.leafnode.data.leaf.logic // added for Tracy the tracer bottle support #tracy #tracythetracer #tracerbottle
            };
        });

        return lut;
    };

    let componentDetailsLUT = {};
    const spelldefnodes = {};
    let leafconfignode = undefined;
    // spark_dev_note: array iteration in js using forEach does not allow early return out of the iteration.
    // for conditions requiring early termination, use either some or every
    components.forEach((component) => {
        // pushing [component] in a js array inserts each component (i.e. a list of node uuids) 
        // as a single entry in the array
        if (isAnchoredComponent(component, leafgraph))
        {
            anchoredList.push(component); 
            //console.log(JSON.stringify(component), ' is anchored.');
        }
        else {
            const is_lambdacomp = isLambdaComponent(component, leafgraph);
            const is_spelldefcomp = isSpellDefComponent(component, leafgraph);
            const is_leafconfigcomp = isLEAFConfigComponent(component, leafgraph);
            if (is_lambdacomp || is_spelldefcomp || is_leafconfigcomp) {
                const curLen = lambdaList.push(component);
                const component_idx = curLen - 1;
                let component_scope = undefined; // scope undefined as default
                // now determine if the lambda dataflow component is defined with the scope of dataflow or lambda plane
                if (isDataflowPlaneScoped(component, leafgraph)) {
                    component_scope = "dataflow"; // to mean dataflow-plane-scoped
                }
                else if (isLambdaPlaneScoped(component, leafgraph)) {
                    component_scope = "lambda"; // to mean lambda-plane-scoped
                }
                else {
                    console.error(`LEAF Error: analyzeLEAFGraph(): the lambda dataflow component (idx: ${component_idx}) is NOT defined with the scope of either the dataflow plane or the lambda plane.`);
                }

                const component_cat = "lambda";
                componentDetailsLUT = buildComponentLUT(component, component_idx, component_scope, component_cat, componentDetailsLUT);
                //console.log(JSON.stringify(component), ' is a lambda component.');

                if (is_spelldefcomp) {
                    const spelldefnodedata = leafgraph.graph.dataflow.getNodeAttributes(component[0]).leafnode.data; // graphology node attributes: {gos: subs_directory, user: node_data}
                    spelldefnodes[spelldefnodedata.leaf.logic.args.spellname] = component[0]; // build a spelldef lut by name
                }
                else if (is_leafconfigcomp) {
                    leafconfignode = component[0];
                }
            }
            else if (isRuntimeComponent(component, leafgraph)) {
                const curLen = runtimeList.push(component);
                const main_idx = curLen - 1;
                componentDetailsLUT = buildComponentLUT(component, main_idx, "dataflow", "main", componentDetailsLUT);
                //console.log(JSON.stringify(component), ' is a runtime component.');
            }
            else
                console.info('LEAF Error: analyzeLEAFGraph():', JSON.stringify(component), ' is an unknown component.');

        }
    });
    console.timeEnd('analyzeLEAFGraph')
    return {spelldefs: spelldefnodes, leafconfig: leafconfignode, components: {nodegroups: {runtime: runtimeList, lambda: lambdaList, anchored: anchoredList}, lut: componentDetailsLUT}};
};

/*
 * parseLEAFGraph() is where leafgraph is parsed, eta reduced in multiple stages and is converted 
 * to the final form of a single js executable logic accepting input$ and returning output$ for runtime evaluation.
 * @leafgraph: an object assembled from the objects returned by reconstructLEAFGraph() and analyzeLEAFGraph(), breaking down as follows
 * {
 *   graph: a graphology object
 *   edges: { 
 *      // edge definitions in terms of source/target node lists as per leaf edge type, and a LUT to lookup 
 *      // lambda source nodes given a target node. 
 *      data: {sources: datasources, targets: datatargets}, 
 *      lambda: {sources: lambdasources, targets: lambdatargets, sourcelut: lambdasourcelut}, 
 *      anchor: {targets: anchortargets}
 *   },
 *   spelldefs: a set of 'leafspellnode' nodes defining user-defined spells for the graph
 *   components: {
 *      nodegroups: {runtime: runtimeList, lambda: lambdaList, anchored: anchoredList}, 
 *      lut: {lambda: lambdaComponentLUT}
 *   },
 *   contextual: is a js runtime function providing the contextual background for running the current graph against data streams
 *   {
 *      components (DEPRECATED): a list of super-leafgraph components that can be used to establish runtime contextual 
 *                  backgrounds in terms of governing how the current graph would run the data flow.
 *                  this field is equivalent to having a list of delta components, not at a component level but
 *                  at a graph level. A super graph is higher in runtime calling hierarchy than a (sub-)graph, 
 *                  meaning that the super graph knows more about the data source one way or another 
 *                  as its context is closer to the source.
 *      nodeoforigin (DEPRECATED): uuid of the node in the super leafgraph, representing the current leafgraph; 
 *                  used for tracing the current graph's lambda input with respect to its super graph's context.
 *   }
 * }
 */
//const parseLEAFGraph = (leafgraph) => {
//    const {
//        graph, 
//        edges,
//        spelldefs,
//        components,
//        contextual,
//    } = leafgraph;
//
//    const defaultOutputHandlingConfig = {combineOperator: 'merge', isIndexed: false, metamodel: LEAFIOmetamodel.breezyforest};
//
//    // spark_dev_note: LEAF breezyforest allows a single node to have multiple lambda edges, 
//    // each of which harbours an isolated LEAF data processing logic while sharing the same data input. 
//    // Lambda inputs would allow user-level customization/configuration of how a node should function
//    const constructRuntimeLEAFjs = (nodeuuid, func$LUT) => {
//        // rough pseudo code
//        // find a list of nodeuuids for the nodes providing data input$ into the current node (nodeuuid) using the graphology Graph graph.dataflow
//        const datainputnodes = graph.dataflow.mapInEdges(nodeuuid, (edge)=>{return graph.dataflow.source(edge)}); 
//        // oneliner: if nodeuuid has lambda connections, look up the lambda component and parse it
//        //if (nodeuuid in edges.lambda.sourcelut) // if the current node is a target of a lambda edge
//        //    look up the source lambda component as follows and run parseLEAFComponent on that component
//        //    const lambdasourcenode = edges.lambda.sourcelut[nodeuuid];
//        //    const componentidx = components.lut.lambda[lambdasourcenode];
//        //    const lambdacomponent = components.nodegroups.lambda[componentidx]; 
//        //    parseLEAFComponent(lambdacomponent); // this should return something with which to construct the ultimate runtime js function.
//        // all of the above in one liner :)
//        const lambdacomponentRuntimeFunc = (nodeuuid in edges.lambda.sourcelut) ? 
//            (_input$) => {return parseLEAFComponent(components.nodegroups.lambda[components.lut[edges.lambda.sourcelut[nodeuuid]].idx])(_input$)} :
//            undefined; //(_input$) => {return _input$}; // no op, just relay the given input stream as output if no lambda definition
//        // find a js-runtime abstract functional reference for each input node uuid from the list of input nodes
//        const datainputnodesRuntimeFuncList = datainputnodes.map((a_node_uuid)=>{
//            // return a reference to a function with which to weave a long chain of functions prior to subscription call
//        //   if it is in the startnodes list
//        //     return func$LUT[nodeuuid]([]);
//        //   else 
//        //     make a recursive call to constructRuntimeLEAFjs() 
//            //const _runtimeLEAFjsFunc = func$LUT[a_node_uuid](lambdacomponentRuntimeFunc);
//            //if (startnodes.includes(a_node_uuid))
//            //    return (_input$Arr) => {return _runtimeLEAFjsFunc(_input$Arr)}; 
//            //else
//            //    return (_input$Arr) => {return constructRuntimeLEAFjs(a_node_uuid)(_input$Arr)}; // should return something, just hasn't been determined yet
//            const _runtimeLEAFjsFunc = constructRuntimeLEAFjs(a_node_uuid, func$LUT);
//            return (_input$Arr) => {return _runtimeLEAFjsFunc(_input$Arr)}; // should return something, just hasn't been determined yet
//        }); // is a list of functions to call functions in order to defer the evaluation of _input$Arr till the end.
//
//        const nodeInputConfig = {}; // get node specific input stream combining config, default is {}
//        const defaultInputHandlingConfig = {combineOperator: 'merge', isIndexed: false, metamodel: LEAFIOmetamodel.breezyforest};
//        //const node_data = JSON.parse(Buffer.from(node.data, 'base64').toString('utf-8')); // parse base64 into a json object
//        const fullInputConfig = {...defaultInputHandlingConfig, ...nodeInputConfig};
//        const runtimeLEAFjsFunc = func$LUT[nodeuuid](lambdacomponentRuntimeFunc);
//        return (_input$Arr) => {
//            // combineInput$Func() expects 1 or more input$ given in the argument __input$Arr
//            //console.log('runtime LEAFjs _input$Arr: ', _input$Arr);
//            const combineInput$Arr = (__input$Arr) => {
//                // make a configurable choice of combining input streams via either merge, zip, combineLatest, etc as defined in combineOpDictionary 
//                const combinedInput$ = combineInputStreams(fullInputConfig)(__input$Arr); 
//                // const output$ = combinedInput$       // production use
//                const output$ = combinedInput$.pipe(    // development use 
//                    map(node_input=>{
//                        let node_output = null; 
//                        //console.log('input: '+ node_input + ' ' + Date.now())  
//                        // execute node level logic and optionally set node_output here
//                        //node_output = processLEAFNodeLogic(node_data.leaf.logic)(node_input);
//                        //console.log('node logic executed: ' + JSON.stringify(node_output));
//                        return node_output ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
//                    })
//                );
//                return output$;
//            }; 
//            return runtimeLEAFjsFunc(
//                datainputnodesRuntimeFuncList.length > 0 ? 
//                [combineInput$Arr(
//                    datainputnodesRuntimeFuncList.map((inputFunc) => inputFunc(_input$Arr)) 
//                )] :
//                _input$Arr
//            );
//        };
//    };
//
//    const parseLEAFComponent = (leafcomponent, endnodes, func$LUT) => {
//        //console.log(leafcomponent);
//
//        // parse LEAF ahead of data input streams
//        const runtimeLEAFComponentFuncList = endnodes.map((nodeuuid) => constructRuntimeLEAFjs(nodeuuid, func$LUT));
//
//        return (_input$Arr) => {
//            const output$Arr = runtimeLEAFComponentFuncList.map((compFunc) => {
//                return compFunc(_input$Arr);
//            });
//            const combinedOutput$ = combineInputStreams(defaultOutputHandlingConfig)(output$Arr); 
//                    // const output$ = combinedInput$       // production use
//            return combinedOutput$;
//        };
//    };
//
//    // parse the user-defined spellbook out of @spelldefs
//
//    //console.log(components.lut);
//    //return (_input$Arr) => {
//    //    const output$Arr = components.nodegroups.runtime.map((leafcomponent) => {
//    //        return parseLEAFComponent(leafcomponent)(_input$Arr);
//    //    });
//    //    const combinedOutput$ = combineInputStreams(defaultOutputHandlingConfig)(output$Arr); 
//    //    return combinedOutput$;
//    //};
//    const leafGraphRuntimeComponentsLUT = {};
//    components.nodegroups.runtime.map((leafcomponent, compindex) => { // leafcomponent here is a list of nodeuuids belonging to that leafcomponent
//        // find start and end nodes
//        const startnodes = [];
//        const endnodes = [];
//        const func$LUT = {};
//        // build a func LUT out of the nodes of a LEAF graph component. 
//        leafcomponent.forEach((nodeuuid) => {
//            const isSourceNode = edges.data.sources.has(nodeuuid);
//            const isTargetNode = edges.data.targets.has(nodeuuid);
//            if (!isTargetNode)
//                startnodes.push(nodeuuid);
//            if (!isSourceNode)
//                endnodes.push(nodeuuid);
//
//            const lambda_ctrl_data = graph.dataflow.getNodeAttributes(nodeuuid); // graphology node attributes: {gos: subs_directory, user: node_data}
//            // <--- a good place to intervene for debugging the function below the unit-test level
//
//            // leafUnitFunc is the function to execute node's logic, configured as per node_data and other configs.
//            // default usage pattern: const output$ = leafUnitFunc(input$list);
//            const leafUnitFunc = (lambdaFunc) => parseLEAFNode(
////                {data: "eyJsZWFmIjogeyJhcGkiOiAiYnJlZXp5bm9kZSIsICJsb2dpYyI6IHsidHlwZSI6ICJsZWFmZGVja2NsdWIiLCAiYXJncyI6IHsibG9naWN0b2dnbGUiOiBmYWxzZSwgImRlY2tuYW1lIjogIkxpbSJ9fSwgIm5vZGUiOiB7ImxlYWR1dWlkIjogIjIxZTg4NDI5LTI5MTctNGU3NC05MzlmLTkxOWYxN2ExYzRjNiJ9fSwgImxlYWZlZGl0b3IiOiB7InBvc2l0aW9uIjogeyJ4IjogMjQwLCAieSI6IDI1Nn19fQ=="},
//                {
//
//                    lambdactrl: {
//                        ...lambda_ctrl_data.lambdactrl,
//                        user: {
//                            ...lambda_ctrl_data.lambdactrl.user, 
//                            leaf: lambda_ctrl_data.leafnode.data.leaf,
//                            config: {combineOperator: 'merge', isIndexed: false}, // merge being the default mode of combining multiple dataflow streams
//                        }
//                    },
//                    lambdadata: {
//                        //{combineOperator: 'merge', isIndexed: false},
//                        lambdaFunc,
//                        graphContextual: contextual
//                    }
//                }
//            ); 
//            func$LUT[nodeuuid] = leafUnitFunc;
//        });
//
//        leafGraphRuntimeComponentsLUT[compindex] = parseLEAFComponent(leafcomponent, endnodes, func$LUT); // func references expecting input$Arr to be passed by argument upon calling them
//    });
//
//    return (_input$Arr) => {
//        const _output$Arr = Object.entries(leafGraphRuntimeComponentsLUT).map(([_compindex, _compRuntime]) => {
//            return _compRuntime(_input$Arr);
//        });
//        const _combinedOutput$ = combineInputStreams(defaultOutputHandlingConfig)(_output$Arr); 
//        return _combinedOutput$;
//    };
//};

const parseLEAFEdges = (nodes) => {
    const parsedEdges = {};

    nodes.forEach(node => {
        node.out_edges.filter((an_edge, idx) => {}).forEach(
            (an_edge, index) => {
                // access and check the edge type, and filter in if of leafdataedge or leaflambdaedge
            }
        )
        if (Object.keys(node.out_edges).length > 0) {

        }
    });
};

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leaf.js", codebase:"/src/ghostos/api/parser/leaf.js"}, {});
const ctrl_accio_bottle = doBottle('accio', 'ctrl_accio', {provenance: "executeLEAFLogic"});
//const data_accio_bottle = doBottle('accio', 'data_accio');
const executeLEAFLogic = async (leaflogic, data_input, runtimeconfig={}, refnode=undefined, ctrl_input=undefined) => {
    //const data_input$ = new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js executeLEAFLogic data stream"}});
    const data_input$ = new Subject(); //new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js executeLEAFLogic data stream"}});
    //const ctrl_input$ = new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js executeLEAFLogic ctrl stream"}});
    const ctrl_input$ = new Subject(); 
    // ctrlinput$.next(doBottle('accio', 'ctrl_accio')); // the default ctrl mesg as per App.js
    const controldata$obj = {_stream: ctrl_input$, _config: runtimeconfig}; // spark_dev_note: #ctrlflow_config, leafelement text
    const output$obj = leaflogic([{_stream: data_input$}], controldata$obj);
    //let output = undefined;
    if (output$obj) { 
        const dataret_prom = firstValueFrom(output$obj._control._stream.pipe(
            withLatestFrom(output$obj._stream),
            map(_combined_in => {
                return _combined_in[1]; // return data 
            })
        ));
        data_input$.next(data_input);
        if (ctrl_input)
            ctrl_input$.next(ctrl_input);
        else
            ctrl_input$.next(ctrl_accio_bottle);
        const dataret = await dataret_prom;

        return dataret;
    }
    //const dataret = output$obj ? await firstValueFrom(output$obj._stream) : undefined;
    //console.log(dataret);
    return undefined;
};

const subs_ctrl_accio_bottle = doBottle('accio', 'ctrl_accio', {provenance: "subscribeToLEAFLogic"});
//const subs_data_accio_bottle = doBottle('accio', 'data_accio');
const subscribeToLEAFLogic = async (leaflogic, input, runtimeconfig, stopper$) => {
    const data_input$ = new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js subscribeToLEAFLogic data stream"}});
    const ctrl_input$ = new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js subscribeToLEAFLogic ctrl stream"}});
    data_input$.next(input);
    ctrl_input$.next(subs_ctrl_accio_bottle);
    const controldata$obj = {_stream: ctrl_input$, _config: runtimeconfig};
    const output$obj = leaflogic([{_stream: data_input$}], controldata$obj);
    let output = undefined;
    let _ctrl_in_cache = undefined;
    const ret = output$obj ? output$obj._control._stream.pipe(
        switchMap(_ctrl_in => {
            _ctrl_in_cache = _ctrl_in;
            return output$obj._stream
        }),
        map(_data_in => {
            return [_ctrl_in_cache, _data_in];
        }),
        takeUntil(stopper$)
    ).subscribe({
        next: x => {
            //outbuffer = outbuffer.concat(x);
            console.log('inner next: ', x);
            //reRenderApp();
        },
        error: err => { // error
            console.error('Error: ' + err);
        },
        complete: () => {
            console.log('subs complete');
        },
    }) : undefined;
    console.log(ret);
    //return output;
};

// flowname, by default, is undefined. if specified however, the input data would be labelled using
// a dictionary object in which the flowname is the key and the input data is the value.
// this data transformation is handy for the purpose of logically mapping multiple input streams 
// (obtained either via the main dataflow stream or via lambda invocation output streams) 
// flowing into a leaf node. 
const executeLEAFLogicInSync = (leaflogic, input$, output$inst, ctrlinput$, runtimeconfig, flowname=undefined) => {
    //const input$ = of(input);
    const controldata$obj = {_stream: ctrlinput$, _config: runtimeconfig};
    if (output$inst) {
        if (!output$inst.runtime) {
            const run_leaflogic = async () => {
                leaflogic([{_stream: input$}], controldata$obj)._stream.pipe(
                    //take(1), // a safeguard
                    map( _ => {
                        const outdata = flowname ? (()=>{const _outdata = (new Object()); _outdata[flowname] = _; return _outdata;})() : _;
                        console.log(outdata);
                        if (output$inst)
                            output$inst.subject$.next(outdata);
                        return outdata;
                    })
                    //concatMap(invokesignal => { // resetting the signal boundary for ease of debugging
                    //    return of(invokesignal);
                    //})
                ).subscribe({
                    next: _ => {
                        console.log("leaf.js output$inst.runtime leaflogic subs: ",_);
                    },
                    complete: () => {
                        console.log("leaf.js output$inst.runtime leaflogic subs completed.");
                    }
                });
            };
            output$inst.runtime = run_leaflogic();
        }

        return {
            _stream: output$inst.subject$
        };
    }
    else {
        const output$obj = leaflogic([{_stream: input$}], controldata$obj);
        //{
        //    _stream: leaflogic([{_stream: input$}], controldata$obj)._stream.pipe(
        //        //take(1), // a safeguard
        //        map( _ => {
        //            const outdata = flowname ? (()=>{const _outdata = (new Object()); _outdata[flowname] = _; return _outdata;})() : _;
        //            console.log(outdata);
        //            return outdata;
        //        })
        //        //concatMap(invokesignal => { // resetting the signal boundary for ease of debugging
        //        //    return of(invokesignal);
        //        //})
        //    )
        //};

        return output$obj;
    }
};

globalThis.TRACEON = true;
globalThis.TRACESIZE = 30;

const timeoutPromise = (prom, time, codebase, exception, metadata) => {
    let timer;
    return Promise.race([
        prom,
        new Promise((_resolve, _rej) => timer = setTimeout(()=>{
            //rej(); 
            const errorbottle = doBottle("error", {type: "timeout", message: exception, codebase, metadata});
            console.error(exception, errorbottle);
            //rej(errorbottle);
            _resolve(errorbottle);
        }, time, exception))
    ]).finally(() => clearTimeout(timer));
};
const leafTraceFlow = (_prevtraces, _curtrace, consolelog=false) => {
    if (globalThis.TRACEON) {
        if (consolelog) {
            console.log("leaf.js trace: ", JSON.stringify(_curtrace));
        }
        if (Array.isArray(_prevtraces)) {
            return [..._prevtraces, {timestamp: Date.now(), trace: _curtrace}];
        }
        else if (_prevtraces === undefined) {
            return [{timestamp: Date.now(), trace: _curtrace}];
        }
        else {
            console.log("start debugging");
        }
    }
    else {
        return _prevtraces ? _prevtraces : []; //_prevtraces;
    }
};
// transformation defines any data transformation logic, in terms of the following
// datalogic is a function offering some data transformation logic, as defined by the calling leafnode.
// if undefined, the flow is driven without any datalogic ("map-level") data transformation to the data flow content. 
// leaflogic is a leaf flow function offering some data transformation/action logic, as defined by the calling leafnode.
// if undefined, the flow is driven without any leaflogic ("concatMap-level") data transformation to the data flow content.
const driveDataflowByCtrlflow = (inflow_ctrl$obj, data_inflow$objArr, meta_ctrl_in$, context={}, transformation={leaflogic: undefined, datalogic: {pre: undefined, post: undefined}}) => {
    const _local_cache = {};
    //const _outflow_data$ = outflow_data$ !== undefined ? outflow_data$ : new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js driveDataflowByCtrlflow data stream"}});
    //const _outflow_data$ = outflow_data$ !== undefined ? outflow_data$ : new BehaviorSubject(raceConditionError);
    //const _outflow_data$ = outflow_data$ !== undefined ? outflow_data$ : new Subject();
    const _outflow_data$ = new Subject();
    //const _ctrl_traffic_flag$ = new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js driveDataflowByCtrlflow ctrl traffic flag stream"}});
    const _ctrl_bridge$ = new Subject(); //new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js driveDataflowByCtrlflow bridged ctrl stream"}});
    const _data_bridge$ = new Subject(); //new BehaviorSubject({...raceConditionError, _label: {at: "leaf.js driveDataflowByCtrlflow bridged data stream"}});
    //let _combined_bridge$ = undefined;
    //const _combined_bridge_ready$ = new Subject();
    //const _outflow_data_ctrl$ = new Subject();
    const outer_relay_ctrl$ = new Subject(); 

    //const _outflow_data$ = outflow_data$ !== undefined ? outflow_data$ : new Subject();
    let _ctrl_data_cache = undefined;
    let _data_cache = undefined;
    if (["e9e6e44b-792b-46d0-b1d3-58ce2f46c45b", "c822ae2e-1be8-46be-b2cb-21a43cef0555", "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91"].includes(context.refnode))
        console.log("start debugging");

    //const setupLogicStream = async () => {
    //    const _leaflogicProm = Promise.resolve(transformation.leaflogic); // transformation.leaflogic may be either undefined, a promise of a leaf stream function or a leaf stream function
    //    const _leaflogic = await (transformation.leaflogic ? 
    //        timeoutPromise(_leaflogicProm, 35000, "leaf.js driveDataflowByCtrlflow()", "LEAF Error: resolving transformation.leaflogic timed out", context):
    //        Promise.resolve(undefined));

    //    const leaflogic_out$obj = ((_leaflogic !== undefined) ? 
    //        _leaflogic([{_stream: _data_bridge$}], {_stream: (meta_ctrl_in$ !== undefined ? merge(_ctrl_bridge$, meta_ctrl_in$) : _ctrl_bridge$), _config: {...inflow_ctrl$obj._config}}) : 
    //        {
    //                    //combineLatest(preprocessed_inflow_data$objArr.map(_obj=>_obj._stream)) : 
    //            _stream: _data_bridge$, 
    //            _control: {_stream: _ctrl_bridge$, _config: {...inflow_ctrl$obj._config, traces: leafTraceFlow(inflow_ctrl$obj._config?.traces, context)}}
    //        }
    //    );

    //    return leaflogic_out$obj._control._stream.pipe(
    //        withLatestFrom(leaflogic_out$obj._stream)
    //    )
    //};

    const _leaflogic = transformation.leaflogic;
    if (_leaflogic !== undefined && typeof(_leaflogic) !== "function")
        console.log("start debugging");
    const leaflogic_out$obj = ((_leaflogic !== undefined) ? 
        _leaflogic([{_stream: _data_bridge$}], {_stream: (meta_ctrl_in$ !== undefined ? merge(_ctrl_bridge$, meta_ctrl_in$) : _ctrl_bridge$), _config: {...inflow_ctrl$obj._config}}) : 
        {
                    //combineLatest(preprocessed_inflow_data$objArr.map(_obj=>_obj._stream)) : 
            _stream: _data_bridge$, 
            _control: {_stream: _ctrl_bridge$, _config: {...inflow_ctrl$obj._config, traces: leafTraceFlow(inflow_ctrl$obj._config?.traces, context)}}
        }
    );

    //firstValueFrom(of(1).pipe(
    //    switchMap(_in => {
    //        return setupLogicStream();
    //    }),
    //    switchMap(_combined$ => {
    //        _combined_bridge$ = _combined$;
    //        _combined_bridge_ready$.next();
    //        return _combined$;
    //    })
    //));

    //const _side$ = setupLogicStream(); 
    //of(1).pipe(
    //    map(_in=> {
    //        return setupLogicStream();
    //    }),
    //    switchMap(_combined$ => {
    //        return _combined$;
    //    })
    //);

    const inflow_data$ = (data_inflow$objArr.length > 1 ? merge(...data_inflow$objArr.map(_in$obj=>_in$obj._stream)) : data_inflow$objArr[0]._stream);

    const _outflow_ctrl$ = inflow_ctrl$obj._stream.pipe(
        withLatestFrom(inflow_data$),
        switchMap( _combined_in => {
            if (["806e0a4b-badf-42a0-85af-5ad306385c58"].includes(context.refnode))
                console.log("start debugging");
            if (data_inflow$objArr.length > 1)
                console.error("start debugging");
            const _ctrl_in = _combined_in[0];

            const _data_in = (transformation.datalogic?.pre !== undefined) ? transformation.datalogic.pre(_combined_in[1]) : _combined_in[1];
            _ctrl_data_cache = _ctrl_in?.length === 1 ? _ctrl_in[0] : _ctrl_in;
            const _new_ctrl_data = {..._ctrl_data_cache, traces: leafTraceFlow(_ctrl_data_cache?.traces, {...context, at: "leaf.js driveDataflowByCtrlflow, initial switch-mapping of the ctrl signal to drive dataflow through a resolved leaflogic"}, true)};
            _data_cache = _data_in;
            //const endof_leaflogic_probe = firstValueFrom(leaflogic_out$obj._control._stream)
            setTimeout(()=>{
                _data_bridge$.next(_data_in);
                _ctrl_bridge$.next(_new_ctrl_data);
            }, 1);
            //return new BehaviorSubject(_combined_in);
            //await endof_leaflogic_probe;
            //return _new_ctrl_data;
            return leaflogic_out$obj._control._stream;
        }),
        //switchMap(_ctrl_relay$ => {
        //    return _ctrl_relay$;
        //}),
        //map(_ctrl_in => {
        //    if (context.refnode === "a9a46a08-110a-4c44-ac83-3caaf40623c5")
        //        console.log("_ctrl_in to be registered in leaflogic output", context.refnode, _ctrl_in);
        //    return _ctrl_in;
        //}),
        withLatestFrom(leaflogic_out$obj._control._stream),
        withLatestFrom(leaflogic_out$obj._stream),
        map(_combined_in => {
            return [_combined_in[0][1], _combined_in[1]];
        }),
        //withLatestFrom(leaflogic_out$obj._stream),
        map(_combined_in=> {
            if (context.refnode === "a9a46a08-110a-4c44-ac83-3caaf40623c5")
                console.log("_combined_in to be registered in nodeflowinterface", context.refnode, _combined_in);
            if (['38567c62-7513-4ec3-9011-2fcf6c51ec7b'].includes(context.refnode))
                console.log("start debugging");
            const _next_data = ((transformation.datalogic?.post !== undefined) ?
                transformation.datalogic.post(_combined_in[1]) :
                _combined_in[1]
                //_combined_in.slice(1).map(_outflow_data=>{return(transformation.datalogic.post(_outflow_data));}) :
            );
            //if (["7acea147-96b9-4c83-8a0f-1c3f4e6947b5", "290a5581-6247-4c1b-bb42-4790c8ceb551"].includes(context.refnode))
            //    console.log("start debugging");
            //if(!Array.isArray(_next_data))
            //    console.log("start debugging");
            const _filtered_data = (Array.isArray(_next_data) ? 
                _next_data.filter(_data=>_data!==undefined) : 
                (_next_data!==undefined ? 
                    _next_data :
                    undefined
                )
            );

            if (_filtered_data !== undefined) // now take care of data plurality
            {
                //if (_filtered_data.length === 1)
                //    _outflow_data$.next(_filtered_data[0]); // publish the next available post-processed data via the data flow subject channel
                //else if (_filtered_data.length > 1)
                //    _outflow_data$.next(_filtered_data); // publish the next available post-processed data via the data flow subject channel
                //else
                //    _outflow_data$.next(_filtered_data); // possibly just []
                _outflow_data$.next(_filtered_data); // possibly just []

                //_outflow_data_ctrl$.next("timing nudge");
                console.log("leaf.js driveDataflowByCtrlflow, _data signal emitted", context, _combined_in);

                console.log("leaf.js driveDataflowByCtrlflow, relaying ctrl signal");
                //setTimeout(() => {
                //    outer_relay_ctrl$.next(_combined_in[0]);
                //}, 1);
                ////return new BehaviorSubject(_combined_in[0]); // only pass the ctrl data in the flow;
                //return outer_relay_ctrl$;

            }
            return _combined_in[0];
        }),
        //withLatestFrom(outer_relay_ctrl$),
        map(_out_sig => {
            return _out_sig;
        }),
        share()
    );
    return {
        _stream: _outflow_data$.pipe(
            filter(_outflow_data => JSON.stringify({..._outflow_data, "_label": {}}) !== JSON.stringify(raceConditionError)),
            share()
        ), 
        _control: {
            _stream: _outflow_ctrl$.pipe(
                map(_ctrl_in => {
                    //_ctrl_traffic_flag$.next(_ctrl_in);
                    if (["e9e6e44b-792b-46d0-b1d3-58ce2f46c45b", "c822ae2e-1be8-46be-b2cb-21a43cef0555"].includes(context.refnode))
                        console.log("start debugging");
                    return _ctrl_in;
                }),
                share()
            ), _config: {...inflow_ctrl$obj._config, traces: leafTraceFlow(inflow_ctrl$obj._config?.traces, context)}
        }
    };
};

const parseAddressableGraph = async (addrstr, _etaTree, _refnode) => {
    const lambdactrl = {
        gos: {
            standardSpellbook: {},
            curatedSpellbook: {},
            stdlambdalut: {},
            curatedlambdalut: {},
            //leafio: leafRuntimeRef.current.leafio,
            //etaTree: {mnemosyne: mainMnemosyne, domain: host_domain, appid: host_appid}, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
            //leafio: props.etaTree.leafio,
            //etaTree: props.etaTree, // root etaTree
            leafio: _etaTree.leafio,
            etaTree: _etaTree, // root etaTree
        }, 
        user: {
            spellbook: {},
            lambdalut: {},
        }
    };
    const {domain, appid} = lambdactrl.gos.etaTree;
    const leafgraph_args = {graphuuid: '', domain, appid, graphaddrstr: addrstr}; //'breezyforest/editor'
    try {
        const getLEAFGraph = _leafgraph.lambda(lambdactrl)({refnode: _refnode, refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
        const rt_leafgraph = await getLEAFGraph; //.then((response) =>  // async call to get leafgraph

        console.log(rt_leafgraph);

        return rt_leafgraph;
    } 
    catch (error) {
        console.error(error);
        return {};
    }
};

//export {_version, parseLEAFNode, reconstructLEAFGraph, analyzeLEAFGraph, parseLEAFGraph}
export {_version, reconstructLEAFGraph, analyzeLEAFGraph, executeLEAFLogic, subscribeToLEAFLogic, executeLEAFLogicInSync, driveDataflowByCtrlflow, leafTraceFlow, parseAddressableGraph, timeoutPromise };

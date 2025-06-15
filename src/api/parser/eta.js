import { map, concatMap, filter, share, combineLatestWith, zipWith, mergeWith, concatWith, raceWith, skip, skipWhile, delay, withLatestFrom, multicast, bufferTime, switchMap } from 'rxjs/operators';
import { take, combineLatest, interval, zip, merge, concat, race, from, of, BehaviorSubject, Subject, firstValueFrom } from 'rxjs';

import { template } from '@babel/core';
import Graph from 'graphology';

import {connectedComponents} from 'graphology-components';
//import cloneDeep from 'lodash/cloneDeep';
import lodashpkg from 'lodash';

import { getLEAFNodeCoreLogic } from './breezyforest.js';
//import { LEAFIOmetamodel } from '../metamodel';
//import { combineDataflows, mergeObservableDataflows, mergeDataflows, chronosDataflow, CHRONOSTYPE_SYNC, TIMEOUTBEHAVIOR_BESTEFFORT } from '../utils/leafdataflow';
import { etaTreeForest } from './etatreeforest.js';
import axios from 'axios';
import { driveDataflowByCtrlflow, leafTraceFlow } from './leaf.js';
import { isBottle, isEmptyBottle } from './predicates.js';
import { doBottle } from './nodelogic/datautils/bottling.js';
import { v4 as uuid4 } from 'uuid';

// locally global constants
const {memoize} = lodashpkg; // nodejs compatible lodash import
const EtaStageRootGraph = "rootgraph";
const EtaStageComponentGraph = "componentgraph";
const EtaStageNodeGraph = "nodegraph";
const EtaStageCompiledGraph = "compiledgraph"; // a stage as a result of a bunch of nodegraph stage nodes being compiled across dataflow and lambda planes

const EtaTreeConfig = {
    isdebug: process.env.LEAFGON_ENV_TYPE === "development" ? true : false,
};
/*
 * processLEAFEtaReduction() is a function to perform LEAF graph reduction, a LEAF equivalent of the eta reduction in lambda calculus
 * it accepts the following arguments and returns a reduced graph in the form below: 
 * TBD: {nodes: [a list of nodes], edges: [a list of edges]} or a graphology object`
 * @node: is the target node being reduced
 *  TBD: @node is a simple uuid or the following json structure 
  {
    uuid: '308bd84f-3af2-478e-ae35-b2842a9bd3a1', // a node id unique in the domain
  }

 * @prevnode: is used to identify a preceding node in the symantic chain of nodes traversed in the eta reduction, (or undefined)
 * @rootnode: can be used to identify the original root in the midst of recursion.
 *            @node === @rootnode when the function is first invoked.
 * @leafgraph: is the node lut for retrieving lexical analysis gathered about any nodes 
 *           relevant with respect to the Eta reduction of @node. 
 *           {graph: {lambda: lambdagraph, dataflow: dataflowgraph}, thespade: {uuid: thespadeuuid}, spelldefs: spelldefnodes, edges: {data: {sources: datasources, targets: datatargets}, lambda: {sources: lambdasources, targets: lambdatargets, sourcelut: lambdasourcelut}, anchor: {targets: anchortargets}}}
 *           TBD @leafgraph is a leafgraph object returned by reconstructLEAFGraph() ?
 *               if so, should it be called leafgraph instead?
 * @graphcomponents: is the component analysis data object of a leafgraph, structured as returned by analyzeLEAFGraph()
 * @leaflib: is a json object carrying the following two
 *  @spellbookgrapho: a graphology Graph carrying nodes, each identified by uuid 
 *                    containing as attributes the corresponding leafnode and its decoded data.
 *                    the graph only carries dataflow plane edges.
 *  @userlib: is a js func library (LUT) carrying references to the user-defined spell defs, 
 *            TBD choose btw @spellbookgrapho and @userlib, or maybe both.
 *  @leaflib: is a js func library (LUT) carrying references to the leaf standard lib + standard spells + curated spells
 */

// preprocessLEAFEtaReduction() compiles through all nodes relevant to the eta reduction of the rootnode
// creating a graphology object consisting only of non-reduceable nodes from the pool of relevant nodes.
//const preprocessLEAFEtaReduction = (node, prevnode, rootnode, leafgraph, graphcomponents, leaflib, processedGraph=new Graph()) => {
//  //const processedGraph = new Graph(); // an empty graphology object
//
//  const node_logic_type = leafgraph.graph.dataflow.getNodeAttributes(node.uuid).leafnode.data.leaf.logic.type;
//
//  // copy the current node
//  if (!processedGraph.hasNode(node.uuid))
//    processedGraph.addNode(node.uuid, leafgraph.graph.dataflow.getNodeAttributes(node.uuid)); 
//
//  // get dataflow plane neighbors with respect to the current node
//  leafgraph.graph.dataflow.inNeighbors(nodeuuid).map((neighboruuid) => {
//    if (!processedGraph.hasNode(neighboruuid)) {
//      processedGraph.addNode(neighboruuid, leafgraph.graph.dataflow.getNodeAttributes(neighboruuid)); 
//      const edge_attributes = leafgraph.graph.dataflow.getEdgeAttributes(neighboruuid, nodeuuid);
//      processedGraph.addEdge(neighboruuid, nodeuuid); // without the edge id in the original leafgraph
//    }
//  });
//  leafgraph.graph.dataflow.outNeighbors(nodeuuid).map((neighboruuid) => {
//    if (!processedGraph.hasNode(neighboruuid)) {
//      processedGraph.addNode(neighboruuid, leafgraph.graph.dataflow.getNodeAttributes(neighboruuid)); 
//      const edge_attributes = leafgraph.graph.dataflow.getEdgeAttributes(nodeuuid, neighboruuid);
//      processedGraph.addEdge(nodeuuid, neighboruuid); // without the edge id in the original leafgraph
//    }
//  });
//
//};

const checkScopeMatch = (node1uuid, node2uuid, graphscomponents) => {
  const node1_component_scope = graphscomponents.components.lut[node1uuid].scope;
  const node2_component_scope = graphscomponents.components.lut[node2uuid].scope;
  
  // find out about the nature of the component
  if (node1_component_scope === node2_component_scope)
    return {match: true, node1: node1_component_scope, node2: node2_component_scope};
  else
    return {match: false, node1: node1_component_scope, node2: node2_component_scope};
};

const assertScopeMatch = (node1uuid, node2uuid, graphscomponents) => {
  // find out about the nature of the component
  const scopes = checkScopeMatch(node1uuid, node2uuid, graphscomponents);
  if (scopes.match) {
    return scopes;
  }
  else {
    throw `LEAF error: component scope mismatch between the graph node (uuid: ${node1uuid}, scope: ${scopes.node1}) and the referred lambda component (entry node uuid: ${node2uuid}, scope: ${scopes.node2}).`;
  }
};

//const parseLEAFGraphByMemberNode = (node, prevnode, rootnode, leafgraph, graphcomponents, leaflib) => {
//  // identify the component the member node belongs to
//  const component_idx = graphcomponents.components.lut[leafspelldef_entrynode.uuid].idx; // look up the matching component idx
//  // get the component, fyi: component is a list of member nodes' uuids
//  const leafcomponent = graphcomponents.components.nodegroups.lambda[component_idx]; 
//
//  // find start and end nodes
//  const startnodes = [];
//  const endnodes = [];
//  const func$LUT = {};
//  // build a func LUT out of the nodes of a LEAF graph component. 
//  leafcomponent.forEach((nodeuuid) => {
//    const isSourceNode = leafgraph.edges.data.sources.has(nodeuuid);
//    const isTargetNode = leafgraph.edges.data.targets.has(nodeuuid);
//    if (!isTargetNode)
//        startnodes.push(nodeuuid);
//    if (!isSourceNode)
//        endnodes.push(nodeuuid);
//  });
//
//};

// spark_dev_note: each leaf node must be accompanied by a leaf js func pattern supporting the plane duality of being initialized in the lambda plane and used in the dataflow plane as follows.
// @lambdafuncArgs: a dictionary of eta reduced lambda graphs, each compiled into a leaf js func pattern, passed as argument
const leafnodejsLUT = {
  nodeuuid1: (lambdajsArgs) => {
    const lambdalambdafunc = x => undefined; // get the lambda graph with respect to the current node in its current graph context;
    const node_setup = lambdajsArgs.default({default: lambdalambdafunc});
    return (input$) => {
      // use node_setup somehow
      const output$ = input$;
      return output$;
    }
  }
}

//const getLEAFstdjslib = (type, args) => {
//  return leafstdjslib[type];
//};

//const getLEAFSpellDefjs = (typeargs, nodelambda, contextuallambda) => {
//  // get the spell def object
//  const {leafspelldef_entrynode, spelldef_jslut} = getLEAFSpellDef_jsLUT(typeargs.spellname); // json object consisting of js reduced leafnode logic of member nodes relevant to the spell def.
//  //spelldef_jslut.
//    
//  // identify the component the member node belongs to
//  const component_idx = graphcomponents.components.lut[leafspelldef_entrynode.uuid].idx; // look up the matching component idx
//  // get the component, fyi: component is a list of member nodes' uuids
//  const leafcomponent = graphcomponents.components.nodegroups.lambda[component_idx]; 
//
//  // compile js dataflow plane func
//  // find start and end nodes
//  const startnodes = [];
//  const endnodes = [];
//  const func$LUT = {};
//  // build a func LUT out of the nodes of a LEAF graph component. 
//  leafcomponent.forEach((nodeuuid) => {
//    const isSourceNode = leafgraph.edges.data.sources.has(nodeuuid);
//    const isTargetNode = leafgraph.edges.data.targets.has(nodeuuid);
//    if (!isTargetNode)
//        startnodes.push(nodeuuid);
//    if (!isSourceNode)
//        endnodes.push(nodeuuid);
//  });
//  const getCurLambdajsLUT = (lambdakey=undefined) => {
//    if (lambdakey)
//      if (lambdakey in nodelambda)
//        return nodelambda[lambdakey];
//      else
//        return x => undefined; // a default js func to return when the expected lambda key does not exist in lut
//    else
//      return nodelambda;
//  };
//  return (input$Arr) => {
//    return endnodes.map((nodeuuid) => {
////      const nodelambda = 
//      const output$ = spelldef_jslut[nodeuuid](nodelambda=spelldef_jslut.lambda[nodeuuid] ,contextuallambda=getCurLambdajsLUT())(input$Arr);
//      return output$;
//    });
//  }
//}

        //const _nodelambda = leafgraph.edges.lambda.sourcelut[contextual_lut._default.uuid]; 
        //const _contextuallambda = nodelambda; // derivative contextuallambda 

        ////const thecorelogic = etaReduceLambdaGraphs(contextual_lut._default.uuid, _nodelambda, _contextuallambda, leafgraph, graphcomponents);
        //const thecorelogic = etaReduceLambdaGraphs(contextual_lut._default.uuid, _contextuallambda, leafgraph, graphcomponents);

const getComponentByMemberNode = (leafnodeuuid, graphcomponents) => {
  // identify the component the member node belongs to
  const component_idx = graphcomponents.components.lut[leafnodeuuid].idx; // look up the matching component idx
  // get the component, fyi: component is a list of member nodes' uuids
  const leafcomponent = graphcomponents.components.nodegroups.lambda[component_idx]; 

  return leafcomponent;
};

// @leafnode_scope: "dataflow" or "lambda"
// @refnode: is a leaf node defining the @leafnode of interest within its frame of reference

  ////const lambda_lut = _refnode ? parseLambdaLUT(nodelambda, _refnode, _refnode_logic) : undefined;
  //const lambda_leafjs_lut = {}; 
  
  //const lambda_etaobj = etaReduceLambdaGraphs(nodelambda, contextuallambda); // TBD: check if contextuallambda is invariant
  //lambda_etaobj._default.graphscope
  //nodelambda.map(lambda_uuid => {
  //  //const etaReducedLEAFjs = etaReduceLambdaGraphs(lambda_uuid, contextuallambda);
  //  //const lambda_nodelambda = runtimeEtaTree.leafgraph.edges.lambda.sourcelut[lambda_uuid]; // get nodelambda w.r.t. lambda_uuid;
  //  const lambda_etaobj = etaReduceLambdaGraphs(lambda_uuid, contextuallambda); // TBD: check if contextuallambda is invariant

  //  if (lambda_etaobj.graphscope === "dataflow") { // a condition indicating the leaf graph author's intent to specify a default lambda
  //     if ("_default" in lambda_leafjs_lut) { // error condition
  //        throw `LEAF error: the logical construct built using the ${_refnode_logic.type} node `+
  //              `(${_refnode}) called with args (${JSON.stringify(_refnode_logic.args)}) has multiple `+
  //              'defaults defined for its lambda. LEAF only allows single-default lambda constructs.';
  //     }
  //  }
  //  else if (lambda_etaobj.graphscope === "lambda") {
  //    // a lambda-scoped eta function is for symentic operations to be executed at runtime, not by the user but by the parser 
  //    const nextlambda_etaobj = lambda_etaobj.etafunc(); // TBD: should need to peel off lambda scoped eta objs by repeating this etafunc invocation till a dataflow-scoped etaobj is returned.
  //    //nextlambda_etaobj.etafunc(); ... and so on
  //  }

  //  Object.entries(etaReducedLEAFjs()).map(([lambda_key, lambda_leafjs]) => {
  //    if (lambda_key in lambda_leafjs_lut) { // error condition
  //      if (lambda_key === '_default')
  //        throw `LEAF error: the logical construct built using the ${_refnode_logic.type} node `+
  //              `(${_refnode}) called with args (${JSON.stringify(_refnode_logic.args)}) has multiple `+
  //              'defaults defined for its lambda. LEAF only allows single-default lambda constructs.';
  //      else
  //        throw `LEAF error: the logical construct built using the ${_refnode_logic.type} node `+
  //              `(${_refnode}) called with args (${JSON.stringify(_refnode_logic.args)}) has multiple `+
  //              `lambda definitions for ${lambda_key}. LEAF only allows uniquely labelled lambda constructs.`;
  //    }
  //    lambda_leafjs_lut[lambda_key] = lambda_leafjs;
  //  });
  //});

  //return undefined;//(nodelambda, contextuallambda);

  //const membernode_lambda = leafgraph.edges.lambda.sourcelut[membernode_uuid]; 

const relayStreamIntoSubject = (_stream$, _subject$, _defaultmesg="") => {
    return _defaultmesg !== "" ? 
    _stream$.pipe(map(_ => {
        _subject$.next(doBottle('_eta', _defaultmesg)); // do relay '_eta' bottle with non-empty default message
        return _; // return data into the original stream
    })) : 
    _stream$.pipe(map(_ => {
        _subject$.next(_); // do relay data
        return _; // return data into the original stream
    }));
};

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in eta.js", codebase:"/src/ghostos/api/parser/eta.js"}, {});

// find the closest common ancestor (CCA) in two or more traces
// using binary search
const binarySearchTraceCCA = (traceArr) => {
    if (traceArr.length > 0) {
        const ref_trace_idx_obj = traceArr.filter(_=>_).map((_trace, _idx)=>{return {"idx": _idx, "trace": _trace.traces}}).slice(1).reduce(
            (_shortesttraceidxobj, _curtraceidxobj) => {
                if (_shortesttraceidxobj.trace.length > _curtraceidxobj.trace.length)
                    return _curtraceidxobj;
                else
                    return _shortesttraceidxobj;
            },
            {"idx": 0, "trace": traceArr[0].traces}
        );

        const primary_trace = ref_trace_idx_obj.trace;
        const secondary_traces = [...traceArr].filter((_val,_idx)=>_idx!==ref_trace_idx_obj.idx).map(_traceobj=>_traceobj.traces); // remove 1 trace at the idx

        const _binSearch = (startidx, endidx) => {
            if (startidx > endidx) {
                console.log('_binSearch error btw idx:', startidx, endidx);
                return -1;
            }
            const mid_idx = Math.floor((endidx - startidx) / 2) + startidx;

            const othertraces_idx_i0 = secondary_traces.map(a_trace=>a_trace[mid_idx]);
            const othertraces_idx_i1 = secondary_traces.map(a_trace=>a_trace[mid_idx+1]);
            const isEqualTrace = (_trace1, _trace2) => {
                const _is_t1_array = Array.isArray(_trace1); 
                const _is_t2_array = Array.isArray(_trace2);
                if (!_is_t1_array && !_is_t2_array)
                    return (_trace1.trace.refnode === _trace2.trace.refnode && _trace1.trace.codebase === _trace2.trace.codebase)
                else if (_is_t1_array && _is_t2_array) {
                    if (_trace1.length === _trace2.length) {
                        return _trace1.reduce((_accbool, _curtrace, _curidx) => {_accbool && isEqualTrace(_curtrace, _trace2[_curidx])}, true);
                    }
                    else
                        return false;
                }
                else
                    return false;
            }
            const mid_idx0_equality = (othertraces_idx_i0.reduce((_accbool, _curtrace)=>_accbool&&isEqualTrace(primary_trace[mid_idx],_curtrace), true) === true);
            const mid_idx1_equality = (othertraces_idx_i1.reduce((_accbool, _curtrace)=>_accbool&&isEqualTrace(primary_trace[mid_idx+1],_curtrace), true) === true);
            if (mid_idx0_equality && !mid_idx1_equality) {
                console.log('CCA idx:', mid_idx);
                return mid_idx;
            } else if (mid_idx0_equality && mid_idx1_equality) {
                console.log('aim upper half', mid_idx+1, endidx);
                return _binSearch(mid_idx+1, endidx);
            } else if (!mid_idx0_equality && !mid_idx1_equality) {
                console.log('aim lower half', startidx, mid_idx);
                return _binSearch(startidx, mid_idx);
            } else {
                console.log('_binSearch error btw idx:', startidx, endidx);
                return -1;
            }
        };

        return _binSearch(0, primary_trace.length - 1);
    }
    return -1;
};

const _synchronizeFlow = (nodeflowinterface, _upstream_out$objArr, inputnodes=undefined, consolidate_dataflow=false) => {
    // get the set of inputnodes wrt the current node or endnodes if current node undefined
    // inputnodes === endnodes in the context of weaveDataflowPlane where two end nodes in a dataflow
    // are consolidated into a single synchronized data stream.
    const datainputnodes = (inputnodes) ? inputnodes : nodeflowinterface.inputnodes;
        // initialize flow interface
    const _synced_upstream_out$objArr =
        _upstream_out$objArr.map((_composite$obj, idx) => {
            const inputnode = datainputnodes.length > 0 ? datainputnodes[idx]: undefined;
            return {
                _stream: _composite$obj._stream.pipe(
                    map(_data_in => {
                        //console.log("start debugging", _data_in);
                        return _data_in;
                    })
                ),
                _control: ((nodeflowinterface && nodeflowinterface.synchronized) ?
                    {_stream: _composite$obj._control._stream.pipe(
                        map(_ctrldata => {
                            if (Array.isArray(_ctrldata) && _ctrldata.length === 0)
                            {
                                console.log("start debugging");
                            }
                            nodeflowinterface.recordflow(inputnode); // record the incidence of flow from the inputnode 
                            if (Array.isArray(_ctrldata) && _ctrldata.length === 0)
                            {
                                console.log("start debugging");
                            }
                            return _ctrldata; 
                        })
                    )}:
                    {_stream: _composite$obj._control._stream.pipe(
                        map(_ctrldata => {
                            // spark_dev_note: 30/June/2023
                            // a tricky bug to tackle. for a yet unknown cause, _ctrldata passed here on
                            // the flow is []
                            // this is likely due to some logic upstream of the flow mistakenly sending this
                            // empty array down the ctrl flow line. 
                            // 1/July/2023 this was caused by bufferTime returning [] after timeout elapses
                            if (Array.isArray(_ctrldata) && _ctrldata.length === 0)
                            {
                                console.log("start debugging");
                            }
                            return _ctrldata; // do nothing to the control data
                        })
                    )}
                )
            };
        });

    const _upstream_dataflow$objArr = _synced_upstream_out$objArr.filter(_=>_._stream).map(_=>{return {_stream: _._stream}});
    const _upstream_ctrlflow$Arr = _synced_upstream_out$objArr.map(_=>_._control._stream);
    // consolidate multiple control flows if any, with the traffic control via checksync

    // spark_dev_note: (24/Mar/2023)
    // current default consolidation method for control flow is just choosing the first one. 
    // unsure whether this would change down the road, but currently the data passed on the 
    // control flow is the same across the board. 
    // for control flow, it's the incidence of signal that matters, not the content.  
    const _upstream_controlflow$obj = {_stream: ((nodeflowinterface && nodeflowinterface.synchronized) ? 
        combineLatest(_upstream_ctrlflow$Arr).pipe(
            map( _ctrldataArr => { // array of ctrldata, due to combineLatest
                const consolidated_ctrldata = _ctrldataArr[0]; 

                if (nodeflowinterface.checksync()) { // if all incoming data synchronized
                    nodeflowinterface.initflowcache();
                    return consolidated_ctrldata;
                }
                // otherwise 
                return undefined;
            }),
            //delay(1), // delay control signal by 1ms, just in case data flow is delayed by a smidgen
            filter(_data=>_data!==undefined)
        ):
        merge(..._upstream_ctrlflow$Arr).pipe(
            // spark_dev_note 30/Jun/2023
            // The behavior of bufferTime here is ideal except that it returns an empty array (ie [])
            // even when there is nothing in the ctrldata flow
            // hence the need for filtering out [] here
            bufferTime(1),
            filter(_ctrldata=>(_ctrldata !== undefined &&_ctrldata.length > 0)),
            map( _ctrldata => { // array of ctrldata, due to bufferTime() 
                //const consolidated_ctrldata = _ctrldataArr[0]; 
                //return consolidated_ctrldata;
                const _rt_cache = {refnode, startnodes, endnodes, etaTree};

                if (_ctrldata.length > 1) {
                    if (_ctrldata.includes(undefined))
                        console.log("start debugging");

                    const cca_idx = binarySearchTraceCCA(_ctrldata);
                    if (cca_idx > -1) {
                        return {
                            ..._ctrldata[0], 
                            "traces": [
                                ..._ctrldata[0].traces.slice(0,cca_idx+1), 
                                _ctrldata.map(a_ctrl_in=>{
                                    const _trailtrace = a_ctrl_in.traces.slice(cca_idx+1);
                                    return _trailtrace.length === 1 ? _trailtrace[0] : _trailtrace;
                                })
                            ]
                        };
                    }
                }
                return _ctrldata[0];
            }),
            //delay(2), // delay control signal by 2ms, just in case data flow is delayed by a smidgen
            filter(_data=>_data!==undefined)
        )
    )};
    //if (!_upstream_controlflow$obj)
    //    console.log("start debugging");

    if (!consolidate_dataflow) {
        return [_upstream_controlflow$obj, _upstream_dataflow$objArr];
    }
    else {
        const consolidated_dataflow$obj = {
            _stream: _upstream_controlflow$obj._stream.pipe(withLatestFrom(..._upstream_dataflow$objArr.map(_=>_._stream))).pipe(map(_data=>{
                if (_upstream_dataflow$objArr.length > 1)
                    console.log("start debugging");
                const consolidated_data = _data.slice(1);
                return consolidated_data.length > 1 ? consolidated_data : consolidated_data[0]; // remove array struct for single length data array
            }))
        }
        return [_upstream_controlflow$obj, consolidated_dataflow$obj];
    }
};

//_dosyncflow = (nodeflowinterface, _upstream_out$objArr, inputnodes=undefined, consolidate_dataflow=false) => {
//    if (!consolidate_dataflow) {
//        return [_upstream_controlflow$obj, _upstream_dataflow$objArr];
//    }
//    else {
//        const consolidated_dataflow$obj = {
//            _stream: _upstream_controlflow$obj._stream.pipe(withLatestFrom(..._upstream_dataflow$objArr.map(_=>_._stream))).pipe(map(_data=>{
//                if (_upstream_dataflow$objArr.length > 1)
//                    console.log("start debugging");
//                const consolidated_data = _data.slice(1);
//                return consolidated_data.length > 1 ? consolidated_data : consolidated_data[0]; // remove array struct for single length data array
//            }))
//        }
//        return [_upstream_controlflow$obj, consolidated_dataflow$obj];
//    }
//}

/*

        combineLatest(_upstream_ctrlflow$Arr).pipe(
            map( (_ctrldataArr, _flow_idx) => { // array of ctrldata, due to combineLatest
                const consolidated_ctrldata = _ctrldataArr[0]; 

                if (rt_context.nodeuuid === "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91")
                    console.log("doChronosSynchronize(), midi message to be registered in nodeflowinterface 98d167d3-c1ed-4d4a-9ab9-25eaccd20a91 ", _ctrldataArr);
                if (_nodeflowinterface.checksync()) { // if all incoming data synchronized
                    _nodeflowinterface.initflowcache();
                    return consolidated_ctrldata;
                }
                // otherwise 
                return undefined;
            }),
            //delay(1), // delay control signal by 1ms, just in case data flow is delayed by a smidgen
            filter(_data=>_data!==undefined),
            withLatestFrom(..._flow$Arr),
            map(_combined_in => {

                if (rt_context.nodeuuid === "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91")
                    console.log("start debugging")
                console.log("eta.js doChronosSynchronize _composite_in registered", rt_context, _combined_in);
                //const _ctrl_out = _composite_in.pop(); // last item in the array is the ctrl
                if (isBottle(_combined_in[1]) && _combined_in[1]._bname === "screenio")
                    console.log("start debugging")
                let synced_nonempty_data = _combined_in.slice(1).flat(); //.filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
                if (synced_nonempty_data.length === 1)
                    _chronos_data_out$.next(synced_nonempty_data[0]);// the remainder is the data
                else
                    _chronos_data_out$.next(synced_nonempty_data); // flow data array including []
                    //_chronos_data_out$.next(empty_databus_bottle);// the remainder is the data


                return _combined_in[0]; // relay ctrl signal
            })
        ):
*/
const initTrafficSyncCache = (_cache, lanecount) => {
    [...Array(lanecount).keys()].map(_lane_idx => {
        _cache[_lane_idx] = false;
    });

    return _cache;
};

const isTrafficSynced = (_cache, lanecount) => {
    let is_synced = true;
    [...Array(lanecount).keys()].map(_lane_idx => {
        is_synced &&= _cache[_lane_idx];
    });

    return is_synced;
};

const doChronosSynchronize = (_stream$objArr, _gates={time: -1, count: -1}, _nodeflowinterface=undefined, rt_context={}) => {
    // _stream$objArr is guaranteed to have at least 1 element, so arbitrarily pick the first one as prime for consolidation
    // it is also assumed to have composite obj consisting of _stream and _control._stream

    const empty_databus_bottle = doBottle("empty_bottle", "empty_data", {_provenance: {rt_context, codebase: "eta.js doChronosSynchronize"}});
    //const _chronos_data_out$ = new BehaviorSubject({...raceConditionError, "_label": {context: "doChronosSynchronize chronos_data_out"}});
    const _chronos_data_out$ = new Subject();
    console.log("invoking doChronosSynchronize, ", rt_context);
    // first consolidate ctrl streams
    const _prime_ctrl_handle$ =  _stream$objArr[0]._control._stream; 
    const inputcount = _stream$objArr.length;


    const _upstream_ctrlflow$Arr = _stream$objArr.map(_$obj => _$obj._control._stream);
    const _flow$Arr = _stream$objArr.map(_out$obj=>_out$obj._stream);
    const _traffic_sync_cache = {};
    let _synced_data_cache = {};
    const _lanecount = _stream$objArr.length;
    initTrafficSyncCache(_traffic_sync_cache, _lanecount);
    const _chronos_ctrl_out$ = ((_nodeflowinterface && _nodeflowinterface.synchronized) ? 
        merge(..._stream$objArr.map((_$obj, _lane_idx)=>{
            return _$obj._control._stream.pipe(
                withLatestFrom(_$obj._stream),
                map(_combined_in => {
                    return [_lane_idx, _combined_in]; // relay combined signal
                })
            )
        })).pipe(
            map(_next_in => {
                _traffic_sync_cache[_next_in[0]] = true;
                _synced_data_cache[_next_in[0]] = _next_in[1];
                if (isTrafficSynced(_traffic_sync_cache, _lanecount)) {
                    // initialize traffic cache for next round of traffic sync
                    initTrafficSyncCache(_traffic_sync_cache, _lanecount);
                    const synced_data = Object.values(_synced_data_cache);
                    _synced_data_cache = {};
                    return synced_data;
                }
                else
                    return undefined;
            }),
            filter(_in=>_in !== undefined),
            map(_combined_inArr => {
                console.log("eta.js doChronosSynchronize _composite_in registered", rt_context.nodeuuid, _nodeflowinterface.checksync(), _combined_inArr);
                if (rt_context.nodeuuid === "806e0a4b-badf-42a0-85af-5ad306385c58")
                    console.log("start debugging");
                if (_nodeflowinterface.checksync()) { // if all incoming data synchronized
                    _nodeflowinterface.initflowcache();

                    if (rt_context.nodeuuid === "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91")
                        console.log("start debugging")
                    //const _ctrl_out = _composite_in.pop(); // last item in the array is the ctrl
                    let synced_nonempty_data = _combined_inArr.map(_combined_in=>{
                        const _flattend_dat = _combined_in.slice(1).flat();
                        if (_flattend_dat.length === 1)
                            return _flattend_dat[0];
                        else
                            return _flattend_dat;
                    }); //.filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
                    _chronos_data_out$.next(synced_nonempty_data); // flow data array including []

                    return _combined_inArr.map(_combined_in=>_combined_in[0]); // relay consolidated ctrl signal
                }
                // otherwise 
                return undefined; 
            }),
            filter(_data=>_data!==undefined), // this blocks unsynchronized data flow
        ) :
        (_upstream_ctrlflow$Arr.length > 1 ? 
            merge(..._upstream_ctrlflow$Arr.map((_ctrl$, _flow_idx) => _ctrl$.pipe(
                // spark_dev_note 30/Jun/2023
                // The behavior of bufferTime here is ideal except that it returns an empty array (ie [])
                // even when there is nothing in the ctrldata flow
                // hence the need for filtering out [] here
                //bufferTime(1),
                //filter(_ctrldata=>(_ctrldata !== undefined &&_ctrldata.length > 0)),
                withLatestFrom(_flow$Arr[_flow_idx]),
                map( _combined_in => { // array of ctrldata, due to bufferTime() 
                    //const consolidated_ctrldata = _ctrldataArr[0]; 
                    //return consolidated_ctrldata;
                    //const _rt_cache = {refnode, startnodes, endnodes, etaTree};

                    const _ctrldata = _combined_in[0];
                    if (_ctrldata.length > 1) {
                        if (_ctrldata.includes(undefined))
                            console.log("start debugging");

                        //const cca_idx = binarySearchTraceCCA(_ctrldata);
                        //if (cca_idx > -1) {
                        //    return {
                        //        ..._ctrldata[0], 
                        //        "traces": [
                        //            ..._ctrldata[0].traces.slice(0,cca_idx+1), 
                        //            _ctrldata.map(a_ctrl_in=>{
                        //                const _trailtrace = a_ctrl_in.traces.slice(cca_idx+1);
                        //                return _trailtrace.length === 1 ? _trailtrace[0] : _trailtrace;
                        //            })
                        //        ]
                        //    };
                        //}
                    }

                    if (rt_context.nodeuuid === "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91")
                        console.log("start debugging")
                    console.log("eta.js doChronosSynchronize _composite_in registered", rt_context, _combined_in);
                    //const _ctrl_out = _composite_in.pop(); // last item in the array is the ctrl
                    if (isBottle(_combined_in[1]) && _combined_in[1]._bname === "screenio")
                        console.log("start debugging")
                    //let synced_nonempty_data = _combined_in.slice(1).flat(); //.filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
                    let synced_nonempty_data = _combined_in.slice(1); //.filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
                    //if (synced_nonempty_data.length === 1)
                    //    _chronos_data_out$.next(synced_nonempty_data[0]);// the remainder is the data
                    //else
                    //    _chronos_data_out$.next(synced_nonempty_data); // flow data array including []
                    _chronos_data_out$.next(synced_nonempty_data); // flow data array including []
                        //_chronos_data_out$.next(empty_databus_bottle);// the remainder is the data



                    return _ctrldata;
                }),
                //delay(2), // delay control signal by 2ms, just in case data flow is delayed by a smidgen
                //filter(_data=>_data!==undefined)
            ))) :
            _upstream_ctrlflow$Arr[0].pipe(
                // spark_dev_note 30/Jun/2023
                // The behavior of bufferTime here is ideal except that it returns an empty array (ie [])
                // even when there is nothing in the ctrldata flow
                // hence the need for filtering out [] here
                //bufferTime(1),
                //filter(_ctrldata=>(_ctrldata !== undefined &&_ctrldata.length > 0)),
                withLatestFrom(_flow$Arr[0]),
                map( _combined_in => { // array of ctrldata, due to bufferTime() 
                    //const consolidated_ctrldata = _ctrldataArr[0]; 
                    //return consolidated_ctrldata;
                    //const _rt_cache = {refnode, startnodes, endnodes, etaTree};

                    const _ctrldata = _combined_in[0];

                    console.log("eta.js doChronosSynchronize _composite_in registered", rt_context, _combined_in);
                    //const _ctrl_out = _composite_in.pop(); // last item in the array is the ctrl
                    if (isBottle(_combined_in[1]) && _combined_in[1]._bname === "screenio")
                        console.log("start debugging")
                    //let synced_nonempty_data = _combined_in.slice(1).flat(); //.filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
                    let synced_nonempty_data = _combined_in[1]; //.filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
                    //if (synced_nonempty_data.length === 1)
                    //    _chronos_data_out$.next(synced_nonempty_data[0]);// the remainder is the data
                    //else
                    //    _chronos_data_out$.next(synced_nonempty_data); // flow data array including []
                    _chronos_data_out$.next(synced_nonempty_data); // flow data array including []
                        //_chronos_data_out$.next(empty_databus_bottle);// the remainder is the data

                    return _ctrldata;
                }),
                //delay(2), // delay control signal by 2ms, just in case data flow is delayed by a smidgen
                //filter(_data=>_data!==undefined)
            )
        )
    );



    //const _chronos_ctrl_out$ = _chronos_ctrl_in$.pipe(
    //    switchMap(_ctrl_in => {
    //        if (_ctrl_in === undefined)
    //            console.error("_ctrl_in undefined, start debugging");
    //        _new_ctrl_data$.next(_ctrl_in); // relay ctrl_in signal
    //        //return _ctrl_in;
    //        return chronosDataflow(
    //            _new_ctrl_data$, 
    //            _flow$Arr, // conceptually called _chronos_data_in$
    //            true, // passthru ctrl signal in the 0th index of data array
    //            CHRONOSTYPE_SYNC, 
    //            _gates, 
    //            TIMEOUTBEHAVIOR_BESTEFFORT, 
    //            {
    //                ...rt_context, desc: "consolidating data streams",
    //                at: "doChronosSynchronize _chronos_passthru_data_out$ (src/ghostos/api/parser/eta.js)"
    //            }
    //        );
    //    }),
    //    //switchMap(_ctrl_in=> {
    //    //    // put a trace here as this is a place where multiple upstream ctrl signals 
    //    //    // consolidated (by chronosDataflow), returned as an array.

    //    //    _pipe_cache_ctrl_in = (globalThis.TRACEON ? 
    //    //        {..._ctrl_in, traces: leafTraceFlow(_ctrl_in?.traces, {...rt_context, desc: "doChronosSynchronize() consolidated ctrl came through with inputcount of " + inputcount}, true)} :
    //    //        _ctrl_in
    //    //    ); 
    //    //    const _new_ctrl_data$ = of(_pipe_cache_ctrl_in);
    //    //    
    //    //    // second consolidate data streams
    //    //    const _flow$Arr = _stream$objArr.map(_out$obj=>_out$obj._stream);
    //    //    //const _chronos_data_in$ = chronosDataflow(of(_pipe_cache_ctrl_in), _flow$Arr, false, CHRONOSTYPE_SYNC, {time: -1, count: -1}, TIMEOUTBEHAVIOR_BESTEFFORT, {...rt_context, desc: "consolidating ctrl streams"});
    //    //    const _chronos_passthru_data_out$ = chronosDataflow(
    //    //        _new_ctrl_data$, 
    //    //        _flow$Arr, // conceptually called _chronos_data_in$
    //    //        false, // passthru ctrl signal in the 0th index of data array
    //    //        CHRONOSTYPE_SYNC, 
    //    //        _gates, 
    //    //        TIMEOUTBEHAVIOR_BESTEFFORT, 
    //    //        {
    //    //            ...rt_context, desc: "consolidating data streams",
    //    //            at: "doChronosSynchronize _chronos_passthru_data_out$ (src/ghostos/api/parser/eta.js)"
    //    //        }
    //    //    );

    //    //    console.log("eta.js doChronosSynchronize prior to resolving data stream");
    //    //    return combineLatest([_new_ctrl_data$, _chronos_passthru_data_out$]);
    //    //    //return combineLatest([..._flow$Arr, _new_ctrl_data$]);
    //    //    //return combineLatest(_flow$Arr); 
    //    //}),
    //    map(_composite_in=>{
    //        console.log("eta.js doChronosSynchronize _composite_in registered");
    //        //const _ctrl_out = _composite_in.pop(); // last item in the array is the ctrl
    //        if (isBottle(_composite_in[1]) && _composite_in[1]._bname === "screenio")
    //            console.log("start debugging")
    //        let synced_nonempty_data = _composite_in.slice(1).flat().filter(_in=>(!isBottle(_in)||!isEmptyBottle(_in))); 
    //        if (synced_nonempty_data.length === 1)
    //            _chronos_data_out$.next(synced_nonempty_data[0]);// the remainder is the data
    //        else
    //            _chronos_data_out$.next(synced_nonempty_data); // flow data array including []
    //            //_chronos_data_out$.next(empty_databus_bottle);// the remainder is the data
    //        //return _ctrl_out; // return ctrl
    //        //return _pipe_cache_ctrl_in;
    //        return _composite_in[0]; // ctrl data
    //    }),
    //    share()
    //);


    //const _chronos_ctrl_out$ = _chronos_passthru_data_out$.pipe(map(
    //    _chronos_data_out => { // upon receiving a nudge from upstream on the data pipe
    //        return _chronos_data_out[0]; // note: chronosDataflow option of passctrl is true for this to work
    //    }
    //));
    //const _chronos_data_out$ = _chronos_passthru_data_out$.pipe(map(
    //    _chronos_data_out => { // upon receiving a nudge from upstream on the data pipe
    //        return _chronos_data_out.slice(1); // note: chronosDataflow option of passctrl is true for this to work
    //    }
    //));

    // spark_dev_note: 26/July/2023
    // #rx #leaf #dataflow #ctrlflow #consolidation #flowweaving #weave #critical #parse
    // the way doChronosSynchronize is currently implemented mandates the following requirement 
    // in using the data- and ctrl- streams returned from here downstream.
    // The order in which data- or ctrl- streams is subscribed to by a listener must be 
    // ctrl-stream first and data-stream second. Having it the other way around would cause
    // funky looping signals getting repeated in the data-/ctrl- pipelines.
    // A special caution has to be taken to make sure that the subscription order is valid, 
    // as the wrong subscription order is prone to cause obscure errors difficult to debug and causes breaks 
    // in the data pipelines, even if unit test results may say otherwise.
    // This order must also be imposed when using rx stream operators such as combineLatest or merge,
    // at least in the context of using Javascript (hasn't been tested in Python)
    //
    // as of 27/July/2023 the above dev note no longer holds true.
    return {
        ctrl: _chronos_ctrl_out$, 
        data: _chronos_data_out$.pipe(
            filter(_data_out=> JSON.stringify({..._data_out, "_label": {}}) !== JSON.stringify(raceConditionError)),
        )
        //data: _chronos_ctrl_out$.pipe(
        //    withLatestFrom(_chronos_data_out$),
        //    map(_combined_out=>{
        //        console.log("doChronosSynchronize _combined_out registered", _combined_out);
        //        return _combined_out[1]; // only return data
        //        //return _chronos_data_out$.pipe( // #dataflow #flowweaving
        //        //    map(_data_out => {
        //        //        console.log("doChronosSynchronize _ctrl_out driven data registered", _data_out);
        //        //        return _data_out;
        //        //        //_pipe_cache = _data_out;
        //        //        //return _pipe_cache;
        //        //    })
        //        //);
        //        //return firstValueFrom(_chronos_data_out$.pipe( // #dataflow #flowweaving
        //        //    map(_data_out => {
        //        //        console.log("doChronosSynchronize _ctrl_out driven data registered", _data_out);
        //        //        return _data_out;
        //        //        //_pipe_cache = _data_out;
        //        //        //return _pipe_cache;
        //        //    })
        //        //));
        //    })
        //)
    };
}

const doChronosAsynchronize = (_stream$objArr, _gates={time: -1, count: -1}, rt_context={}) => {
    // _stream$objArr is guaranteed to have at least 1 element, so arbitrarily pick the first one as prime for consolidation
    // it is also assumed to have composite obj consisting of _stream and _control._stream

    const inputcount = _stream$objArr.length;
    //const _chronos_data_out$ = new BehaviorSubject({...raceConditionError, "_label": {context: "doChronosAsynchronize _chronos_data_out"}});
    const _chronos_data_out$ = new Subject(); 
    //const _chronos_bridge_ctrl$ = new BehaviorSubject({...raceConditionError, "_label": {context: "doChronosAsynchronize _chronos_bridge_ctrl"}});
    //const _chronos_data_out$ = new Subject();
    // first consolidate ctrl streams
    const ctrl_out$Arr = _stream$objArr.map(_input$obj => {
        let _pipe_cache_ctrl_in;
        return _input$obj._control._stream.pipe(
            map(_ctrl_in => {
                _pipe_cache_ctrl_in = (globalThis.TRACEON ? 
                    {..._ctrl_in, traces: leafTraceFlow(_ctrl_in?.traces, {...rt_context, desc: "doChronosAsynchronize(), a ctrl signal came through out of inputcount of " + inputcount}, true)} :
                    _ctrl_in
                ); 
                return _pipe_cache_ctrl_in;
            }),
                ////const _new_ctrl_data$ = of(_pipe_cache_ctrl_in);
                //_chronos_bridge_ctrl$.next(_pipe_cache_ctrl_in);

                //// chronosDataflow is used on a single data stream for enforcing its gating conditions
                //const _chronos_passthru_data_out$ = chronosDataflow(
                //    _chronos_bridge_ctrl$, 
                //    [_input$obj._stream], // a single data stream, conceptually called _chronos_data_in$
                //    false, // passthru ctrl signal in the 0th index of data array
                //    CHRONOSTYPE_SYNC, 
                //    _gates, 
                //    TIMEOUTBEHAVIOR_BESTEFFORT, 
                //    {
                //        ...rt_context, desc: "consolidating data streams",
                //        at: "doChronosAsynchronize _chronos_passthru_data_out$ (src/ghostos/api/parser/eta.js)"
                //    }
                //);

                //return _chronos_passthru_data_out$;
            withLatestFrom(_input$obj._stream),
            map(_combined_out => {
                _chronos_data_out$.next(_combined_out.length === 2 ? _combined_out[1] : _combined_out.slice(1));
                return _combined_out[0];
            }),
            share()
        )
    })

    const _chronos_ctrl_out$ = merge(...ctrl_out$Arr).pipe(
        map(_ctrl_out => { // peep hole
            return _ctrl_out;
        })
    )

    return {
        ctrl: _chronos_ctrl_out$, 
        data: _chronos_data_out$.pipe(
            filter(_data_out=> JSON.stringify({..._data_out, "_label": {}}) !== JSON.stringify(raceConditionError)),
        )
    };
};

//const doChronosSynchronize = (_stream$objArr, _gates={time: -1, count: -1}, rt_context={}) => {
//    // _stream$objArr is guaranteed to have at least 1 element, so arbitrarily pick the first one as prime for consolidation
//    // it is also assumed to have composite obj consisting of _stream and _control._stream
//
//    const _chronos_data_out$ = new BehaviorSubject(raceConditionError);
//    //const _chronos_data_out$ = new Subject();
//    // first consolidate ctrl streams
//    const _prime_ctrl_handle$ =  _stream$objArr[0]._control._stream; 
//    const inputcount = _stream$objArr.length;
//    const _chronos_ctrl_in$ = (( inputcount === 1) ?
//        _prime_ctrl_handle$ :
//        chronosDataflow(
//            _prime_ctrl_handle$, 
//            _stream$objArr.slice(1).map(_out$obj=>{ // any non-prime control streams
//                return _out$obj._control._stream;
//            }),
//            true,
//            CHRONOSTYPE_SYNC, 
//            _gates, 
//            TIMEOUTBEHAVIOR_BESTEFFORT, 
//            {
//                ...rt_context, desc: "consolidating ctrl streams",
//                at: "doChronosSynchronize _chronos_ctrl_in$ (src/ghostos/api/parser/eta.js)"
//            }
//        )
//    );
//    const _chronos_ctrl_out$ = _chronos_ctrl_in$.pipe(
//        switchMap(_ctrl_in=> {
//            // put a trace here as this is a place where multiple upstream ctrl signals 
//            // consolidated (by chronosDataflow), returned as an array.
//
//            
//            const _new_ctrl_data$ = (globalThis.TRACEON ? 
//                of({..._ctrl_in, traces: leafTraceFlow(_ctrl_in?.traces, {...rt_context, desc: "doChronosSynchronize() consolidated ctrl came through with inputcount of " + inputcount}, true)}) :
//                of(_ctrl_in)
//            );
//            
//            // second consolidate data streams
//            const _flow$Arr = _stream$objArr.map(_out$obj=>_out$obj._stream);
//            //const _chronos$ = chronosDataflow(_ctrl$, _flow$Arr, CHRONOSTYPE_SYNC, {}, TIMEOUTBEHAVIOR_BESTEFFORT, {...rt_context, desc: "consolidating ctrl streams"});
//            //const _chronos_passthru_data_out$ = chronosDataflow(
//            //    _new_ctrl_data$, 
//            //    _flow$Arr, // conceptually called _chronos_data_in$
//            //    true, // passthru ctrl signal in the 0th index of data array
//            //    CHRONOSTYPE_SYNC, 
//            //    _gates, 
//            //    TIMEOUTBEHAVIOR_BESTEFFORT, 
//            //    {
//            //        ...rt_context, desc: "consolidating data streams",
//            //        at: "doChronosSynchronize _chronos_passthru_data_out$ (src/ghostos/api/parser/eta.js)"
//            //    }
//            //);
//
//            //return _chronos_passthru_data_out$;
//            return combineLatest([..._flow$Arr, _new_ctrl_data$]);
//        }),
//        map(_composite_in=>{
//            const _ctrl_out = _composite_in.pop(); // last item in the array is the ctrl
//            _chronos_data_out$.next(_composite_in);// the remainder is the data
//            return _ctrl_out; // return ctrl
//        }),
//        share()
//    );
//
//
//    //const _chronos_ctrl_out$ = _chronos_passthru_data_out$.pipe(map(
//    //    _chronos_data_out => { // upon receiving a nudge from upstream on the data pipe
//    //        return _chronos_data_out[0]; // note: chronosDataflow option of passctrl is true for this to work
//    //    }
//    //));
//    //const _chronos_data_out$ = _chronos_passthru_data_out$.pipe(map(
//    //    _chronos_data_out => { // upon receiving a nudge from upstream on the data pipe
//    //        return _chronos_data_out.slice(1); // note: chronosDataflow option of passctrl is true for this to work
//    //    }
//    //));
//
//    return {ctrl: _chronos_ctrl_out$, data: _chronos_data_out$};
//}

const weaveDataflowPlane = (refnode, startnodes, endnodes, eta_lut, etaTree, prime_ctrlflow$obj, prime_dataflow$obj) => {
    const rt_context = {refnode, codebase: "eta.js weaveDataflowPlane", domain: etaTree.domain, appid: etaTree.appid};
    // spark_dev_note: 19/June/2023
    // #databus
    //const empty_databus_bottle = enterDataBus("empty_data", {_provenance: {refnode, codebase: "eta.js weaveDataflowPlane"}});
    const empty_databus_bottle = doBottle("empty_bottle", "empty_data", {_provenance: {refnode, codebase: "eta.js weaveDataflowPlane"}});
    //const empty_data_accio_bottle = doBottle('accio', 'empty_data_accio');
    // TBD: memoize this function by building a dedicated memcached version of this function, 
    // separate from etaTree.etaReduceLEAFNode
    const defaultConfig = {combineOperator: 'merge', isIndexed: false};
    //const node_data = JSON.parse(Buffer.from(node.data, 'base64').toString('utf-8')); // parse base64 into a json object

    //if (!refnode) {
    //    console.log("start debugging");
    //}
    //const combineStreamsFunc = combineInputStreams(defaultConfig);
    //const flattenArray = (x) => Array.isArray(x) ? x.flatMap(_x=>_x) : x;

    const flowinterface = {};
    // initialize flowinterface
    //curnodes.map(nodeuuid => {
    //    const _inputnodes = etaTree.leafgraph.graph.dataflow.mapInEdges(nodeuuid, (edge)=>{return etaTree.leafgraph.graph.dataflow.source(edge)}); 
    //    flowinterface[nodeuuid] = {
    //        "inputnodes": _inputnodes,
    //        "data_in": _inputnodes.map(_=>new ReplaySubject(1)),
    //        "data_out": new ReplaySubject(1),
    //        "ctrl_in": new ReplaySubject(1),
    //        "ctrl_out": new ReplaySubject(1)
    //    }
    //});

    const initializeFlowInterface = (_curnode, _upstream_ctrlflow$objArr, _upstream_dataflow$objArr, syncmultiple=true) => {
        // iterate through current set of nodes 
        const nodeuuid = _curnode;
        const _inputnodes = etaTree.leafgraph.graph.dataflow.mapInEdges(nodeuuid, (edge)=>{return etaTree.leafgraph.graph.dataflow.source(edge)});
        //const _upstream_output$Arr = initializeFlowInterface(_inputnodes);
        if (!(nodeuuid in flowinterface)) {
            flowinterface[nodeuuid] = {
                "inputnodes": _inputnodes,
                "synchronized": false, 
                "flowcache": {}, // used for enforcing synchronization of multiple flows
                "initflowcache": () => {
                    const connected_input_num = flowinterface[nodeuuid].inputnodes.length;
                    flowinterface[nodeuuid].flowcache = (connected_input_num > 1 ?
                        Object.keys(flowinterface[nodeuuid].inputnodes)?.reduce((cacheLUT, cur_nodeinput_idx)=>{cacheLUT[cur_nodeinput_idx] = false; return cacheLUT;}, {}) :
                        {0: false}
                    );
                },
                "recordflow": (_flow_idx) => {
                    flowinterface[nodeuuid].flowcache[_flow_idx] = true
                },
                "checksync": () => {
                    const issynced = Object.values(flowinterface[nodeuuid].flowcache).reduce((pred, curbool)=>pred&&curbool, true);
                    return issynced;
                },
                "data_in$Arr": _upstream_dataflow$objArr.map((_stream$obj, _flow_idx)=>_stream$obj._stream.pipe(
                    filter(_data_in=> JSON.stringify({..._data_in, "_label": {}}) !== JSON.stringify(raceConditionError)),
                    map(_data_in => {
                        if (["c10cbbbb-14d5-4270-b17a-1965afcabc98"].includes(nodeuuid))
                            console.log("_data_in fuse junction, start debugging", nodeuuid, flowinterface[nodeuuid])
                        console.log("midi message to be registered in nodeflowinterface", nodeuuid, _data_in);
                        //flowinterface[nodeuuid].recordflow(_flow_idx); // record the incidence of flow from the inputnode id'ed by its idx in the array
                        if (isBottle(_data_in) && _data_in._bname === "error")
                            console.error("start debugging", _data_in);
                        if (["c822ae2e-1be8-46be-b2cb-21a43cef0555", "e9e6e44b-792b-46d0-b1d3-58ce2f46c45b"].includes(nodeuuid) && isBottle(_data_in) && _data_in._bname === "_midi_in")
                            console.log("midi_in signal registered in nodeflowinterface", _data_in, nodeuuid);
                        return _data_in;
                    })
                )),
                "data_out": undefined,
                "ctrl_in$Arr": _upstream_ctrlflow$objArr.map((_stream$obj, _flow_idx) =>_stream$obj._stream.pipe(
                    filter(_ctrl_in=> JSON.stringify({..._ctrl_in, "_label": {}}) !== JSON.stringify(raceConditionError)),
                    map(_ctrl_in => {
                        if (!_ctrl_in)
                            console.log("ctrl message to be registered in nodeflowinterface", nodeuuid, _ctrl_in);
                        if (flowinterface[nodeuuid][_flow_idx]) {
                            console.error("ctrl signal arrived congested", _ctrl_in);
                        }
                        if (["c822ae2e-1be8-46be-b2cb-21a43cef0555", "e9e6e44b-792b-46d0-b1d3-58ce2f46c45b"].includes(nodeuuid))
                            console.log("ctrl_in signal registered in nodeflowinterface", _ctrl_in, nodeuuid);

                        flowinterface[nodeuuid].recordflow(_flow_idx); // record the incidence of ctrl flow from the inputnode id'ed by its idx in the array
                        return _ctrl_in;
                    })
                )),
                "ctrl_out": undefined,
                "get_composite_in$objArr": () => {
                    return flowinterface[nodeuuid].data_in$Arr.map((_data_in$, _flow_idx)=> {
                        return {_stream: _data_in$, _control: {_stream: flowinterface[nodeuuid].ctrl_in$Arr[_flow_idx]}}
                    });
                }
            }
            flowinterface[nodeuuid].initflowcache();
            if (_inputnodes.length > 1 && syncmultiple) // synchronized = true, for multiple flows by default
                flowinterface[nodeuuid].synchronized = true;
        }
        // weave upstream flows to current node's output flow
        //const dataflow_out$ = flowinterface[nodeuuid].data_in
    }

    // starting from endnodes, working backwards
    // recursively trace node connections, then weave the flow back in the forward direction.
    const _weaveDataflowPlane = (_curnodes, _datainputnodes=undefined) => {
        return _curnodes.map(nodeuuid => {
            if (flowinterface[nodeuuid]?.data_out && flowinterface[nodeuuid]?.ctrl_out) {

                //const relay_sub_ctrl$ = new BehaviorSubject({...raceConditionError, _label: "relay sub ctrl in _weaveDataflowPlane"}) //create subject
                //const relay_sub_data$ = new BehaviorSubject({...raceConditionError, _label: "relay sub data in _weaveDataflowPlane"}) //create subject
                //flowinterface[nodeuuid].ctrl_out._stream.subscribe(relay_sub_ctrl$); 
                //flowinterface[nodeuuid].data_out._stream.subscribe(relay_sub_data$); 
                //return { // now return an output composite from the cache 

                //    _stream: relay_sub_data$.pipe(
                //        filter(_data_out=>!(isBottle(_data_out)&&_data_out._bname==="error")),
                //        map(_data_out=>{
                //            return _data_out;
                //        }),
                //        share() 
                //    ),
                //    _control: {
                //        _stream: relay_sub_ctrl$.pipe(
                //            filter(_data_out=>!(isBottle(_data_out)&&_data_out._bname==="error")),
                //            map(_ctrl_out=>{
                //                return _ctrl_out;
                //            }),
                //            share()
                //        )
                //    }
                //};
                return {
                    _stream: flowinterface[nodeuuid].data_out._stream.pipe(
                        map(_data_out=>{ // peep hole
                            return _data_out;
                        })
                    ),
                    _control: {
                        _stream: flowinterface[nodeuuid].ctrl_out._stream.pipe(
                            map(_ctrl_out=>{ // peep hole
                                return _ctrl_out;
                            })
                        )
                    }
                };
            }
            else {
                // get the current node's eta reduced function
                const etafunc = eta_lut[nodeuuid]; 
                if (etafunc == undefined) {
                    console.log("start debugging");
                }
                if (!etafunc || !("_default" in etafunc)) {
                    throw `LEAF error: weaveDataflowPlane(): the ${(etafunc ? "" : "undefined")} eta reduced function with the refnode ${nodeuuid} `+
                        `has no _default defined.`;
                }
                // findout the set of inputnodes wrt the current node
                const datainputnodes = (!_datainputnodes ? 
                    etaTree.leafgraph.graph.dataflow.mapInEdges(nodeuuid, (edge)=>{return etaTree.leafgraph.graph.dataflow.source(edge)}) :
                    _datainputnodes
                );

                const _upstream_out$objArr = (datainputnodes.length === 0) ?  // recursively trace backwards from right to left, until the start node
                    [{_stream: prime_dataflow$obj._stream, _control: {_stream: prime_ctrlflow$obj._stream}}] : // prime input flow for the starting node
                    _weaveDataflowPlane(datainputnodes).filter(x=>x); // weaved input flow (aka the output flow of previous node) for the rest

                if (datainputnodes.length > 1)
                    console.log("start debugging");
                // initialize incoming flow for the current node
                // initialization of outgoing flow can be done after executing the current node's eta function
                initializeFlowInterface(nodeuuid, 
                    _upstream_out$objArr.map(_=>{ return {_stream: _._control._stream} }),
                    _upstream_out$objArr.map(_=>{ return {_stream: _._stream }})
                ); 
                // initialize flow interface 

                if (nodeuuid === "98d167d3-c1ed-4d4a-9ab9-25eaccd20a91")
                    console.log("start debugging");

                const nodedata = etaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid).leafnode.data; //.leaf.logic;

                //if (nodedata.leaf.logic.type === "leafelement") {
                //    etaTree.leafio.elementioLUT[nodeuuid] = flowinterface[nodeuuid]; 
                //}
                // here a decision is made to go for either synchronous or asynchronous stream flows, depending on
                // whether the current node is the special leafnode "Chronos", of type leafchronosflow
                // doChronosAsynchronize(flowinterface[nodeuuid].get_composite_in$objArr(), {time:-1, count:-1}, {...rt_context, ...nodedata, at: "eta.js _weaveDataflowPlane", nodeuuid})
                const is_chronosflow = (nodedata.leaf.logic.type === "leafchronosflow");
                const {ctrl: _chronos_ctrl_out$, data: _chronos_data_out$ } = ( is_chronosflow ? 
                    {ctrl: merge(...flowinterface[nodeuuid].get_composite_in$objArr().map(_composite_in$obj=>_composite_in$obj._control._stream)), data: undefined} :
                    doChronosSynchronize(flowinterface[nodeuuid].get_composite_in$objArr(), {time:-1, count:-1}, flowinterface[nodeuuid], {...rt_context, ...nodedata, at: "eta.js _weaveDataflowPlane", nodeuuid}) 
                );
                //const [synced_upstream_controlflow$obj, synced_upstream_dataflow$objArr] = _synchronizeFlow(nodeuuid, _upstream_out$objArr);
                const synced_upstream_controlflow$obj = {
                    _stream: _chronos_ctrl_out$.pipe(
                        map(_ctrl_in => {
                            if (nodeuuid === "fa175f13-a1fc-482c-9c2c-7f5a9d22a136")
                                console.log("start debugging");
                            return _ctrl_in;
                        })
                    )
                };
                const synced_upstream_dataflow$objArr = ( is_chronosflow ? 
                    //[{
                    //    _stream: merge(...flowinterface[nodeuuid].get_composite_in$objArr().map((_composite_in$obj, idx)=>{
                    //        return _composite_in$obj._stream.pipe(
                    //            map(_in => {
                    //                const _cache = idx;
                    //                return _in;
                    //            })
                    //        );
                    //    }))
                    //}]
                    
                    flowinterface[nodeuuid].get_composite_in$objArr().map((_composite_in$obj, idx)=>{
                        return {
                            _stream: _composite_in$obj._stream.pipe(
                                map(_in => {
                                    const _cache = idx;
                                    return _in;
                                })
                            )
                        };
                    }) :
                    [{
                        _stream: _chronos_data_out$.pipe(
                            map(_data_in => {
                                if (nodeuuid === "fa175f13-a1fc-482c-9c2c-7f5a9d22a136")
                                    console.log("start debugging");
                                return _data_in;
                            })
                        )
                    }]
                );
                //const synced_upstream_controlflow$obj = {
                //    _stream: combineLatest(_upstream_out$objArr.map(_$obj => {
                //        return _$obj._control._stream
                //    })).pipe(
                //        map(_synced_upstream => {
                //            // take care of plurality due to combineLatest
                //            const plurality_checked_synced_upstream = (_synced_upstream.length === 1) ? 
                //                _synced_upstream[0] : _synced_upstream;
                //            return plurality_checked_synced_upstream;
                //        })
                //    ),
                //    _config: _upstream_out$objArr.map(_$obj => {
                //        return _$obj._control._config
                //    })
                //};
                //const synced_upstream_dataflow$objArr = _upstream_out$objArr.map(_$obj => {
                //    return {_stream: _$obj._stream};
                //})

                // now weave the flow processing logic (aka the node's eta function) depending on the node characteristic
                if (datainputnodes.length > 0) {
                    if (endnodes.includes(nodeuuid)) { // if it is amoung endnodes
                        if (nodedata.leaf.logic.type === "leafoutflowport") { // permit output$ only if the node is of type leafoutflowport
                            //if (!synced_upstream_controlflow$obj)
                            //    console.log("start debugging");
                            const etaoutput$obj = etafunc._default(synced_upstream_dataflow$objArr, synced_upstream_controlflow$obj); // return the subsequent output$ as returned by the etafunc against upstream_output$

                            // now store this etaoutput$obj in flowinterface
                            flowinterface[nodeuuid].data_out = {_stream: etaoutput$obj._stream};
                            flowinterface[nodeuuid].ctrl_out = {_stream: etaoutput$obj._control._stream};

                            return { // now return a composite from current _weaveDataflowPlane() to the next connected node 
                                _stream: etaoutput$obj._stream.pipe(map(x => {
                                    //const _cache = {nodeuuid, datainputnodes};
                                    return x;
                                })), 
                                _control: {
                                    _stream: etaoutput$obj._control._stream.pipe(map(x => {
                                        //const _cache = {nodeuuid, datainputnodes};
                                        //const _cache = {flowinterface};
                                        return x;
                                    }))
                                }
                            }
                        }
                        else { // otherwise, just invoke the etafunc without returning output dataflow stream
                            // initiate the stream flow
                            const etaoutput$obj = etafunc._default(synced_upstream_dataflow$objArr, synced_upstream_controlflow$obj);
                            let _nodecache;
                            //const empty_dataflow$ = new BehaviorSubject({...raceConditionError, _label:{...empty_databus_bottle._label, context: "flow error at an exitless end node, "+nodeuuid}});
                            //const empty_dataflow$ = new Subject();
                            //const invocationflow$ = etaoutput$obj._control._stream.pipe(
                            //    switchMap(_ctrl_in => {
                            //        //const _cache = {nodeuuid, datainputnodes};
                            //        _nodecache = _ctrl_in;
                            //        return etaoutput$obj._stream;
                            //    }),
                            //    map(_ => {
                            //        empty_dataflow$.next({...empty_databus_bottle, _label: {...empty_databus_bottle._label, context: "a nudge data bottle returned by an exitless end node, "+nodeuuid}});
                            //        return _nodecache;
                            //    }),
                            //    //filter(_ => _)
                            //    //skipWhile(unitdata => true) 
                            //);
                            //const invocationflow$ = etaoutput$obj._stream.pipe(
                            //    map(_data_in => {

                            //    })
                            //);
                            //const mutedflow$ = etaoutput$obj._control._stream.pipe(
                            //    skipWhile(_ => true) // make this stream a deadend without killing the flow.
                            //);
                            // now store this etaoutput$obj in flowinterface
                            flowinterface[nodeuuid].data_out = {_stream: etaoutput$obj._stream.pipe(
                                map(_data_out => {
                                    return {...empty_databus_bottle, _label: {...empty_databus_bottle._label, context: "a nudge data bottle returned by an exitless end node, "+nodeuuid}};
                                })
                            )}; //{_stream: mutedflow$};
                            flowinterface[nodeuuid].ctrl_out = {_stream: etaoutput$obj._control._stream.pipe(
                                map(_ctrl_out => {
                                    return _ctrl_out;
                                })
                            )};

                            return {
                                _stream: flowinterface[nodeuuid].data_out._stream.pipe(map( x => {
                                    //const _cache = {nodeuuid, datainputnodes};
                                    return x;
                                })), 
                                //etaoutput$obj._stream.pipe(
                                //    map(x=> {
                                //        return undefined;
                                //    }),
                                //    filter(_ => _)
                                //), 
                                _control: {
                                    _stream: flowinterface[nodeuuid].ctrl_out._stream.pipe(map(x => {
                                        //const _cache = {nodeuuid, datainputnodes};
                                        return x;
                                    }))
                                }
                            };
                        };
                    }
                    else { // if neither among startnodes nor among endnodes, aka the in-betweeners, just process input to output as defined by etafunc
                        //if (nodeuuid.slice(0,4) === 'fdff')
                        //    console.log(nodeuuid);
                        const etaoutput$obj = etafunc._default(synced_upstream_dataflow$objArr, synced_upstream_controlflow$obj); // return the subsequent output$ as returned by the etafunc against upstream_output$
                        // now store this etaoutput$obj in flowinterface
                        flowinterface[nodeuuid].data_out = {_stream: etaoutput$obj._stream};
                        //if (!etaoutput$obj._control)
                        //    console.log("start debugging");
                        flowinterface[nodeuuid].ctrl_out = {_stream: etaoutput$obj._control._stream};

                        return {
                            _stream: etaoutput$obj._stream.pipe(map(x => {
                                //const _cache = {nodeuuid, datainputnodes};
                                if (nodeuuid === "0f35d8bc-36a6-4fe8-b185-f8ed5188b28f")
                                    console.log("start debugging");
                                return x;
                            })), 
                            _control: {
                                _stream: etaoutput$obj._control._stream.pipe(map(x => {
                                    //const _cache = {nodeuuid, datainputnodes};
                                    if (nodeuuid === "0f35d8bc-36a6-4fe8-b185-f8ed5188b28f")
                                        console.log("start debugging");
                                    return x;
                                }))
                            }
                        };
                    }
                }
                else { // startnodes 
                    if (!startnodes.includes(nodeuuid)) {
                        throw `LEAF error: weaveDataflowPlane(): the eta reduced function with the refnode ${nodeuuid} `+
                            `has matched against incomplete startnodes reference.`;
                    }

                    const nodedata = etaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid).leafnode.data; //.leaf.logic;
                    if (nodedata.leaf.logic.type === "leafinflowport") { // only allow dataflow input thru leafinflowport
                        const etaoutput$obj = etafunc._default(synced_upstream_dataflow$objArr, synced_upstream_controlflow$obj); // return the subsequent output$ as returned by the etafunc against upstream_output$
                        //const etaoutput$obj = etafunc._default(input$Arr, controlflow$obj);

                        // now store this etaoutput$obj in flowinterface
                        flowinterface[nodeuuid].data_out = {_stream: etaoutput$obj._stream};
                        flowinterface[nodeuuid].ctrl_out = {_stream: etaoutput$obj._control._stream};

                        return { // now return a composite from current _weaveDataflowPlane() to the next connected node 
                            _stream: etaoutput$obj._stream.pipe(map(x => {
                                //const _cache = {nodeuuid, datainputnodes};
                                return x;
                            })), 
                            _control: {
                                _stream: etaoutput$obj._control._stream.pipe(map(x => {
                                    //const _cache = {nodeuuid, datainputnodes};
                                    return x;
                                }))
                            }
                        }
                    }
                    else { // otherwise just invoke the downstream func without the input dataflow stream.
                        // spark_dev_note: TBD: currently if there is a disconnect in the input flow and continuing leaf logic
                        // there is no way to pass on the execution flow other than relying on intermediary subject
                        // actively working on the message passing. devise a way to make it work. 
            //, controlflow$obj={_stream: of([])}
                        //if (nodeuuid.slice(0,4) === 'fdff')
                        //    console.log(nodeuuid);
                        //const controlflow$obj = combineDataflows(nodeuuid, input$Arr);
                        let _pipe_cache_ctrl_in;
                        //const empty_dataflow$ = new BehaviorSubject({...empty_databus_bottle, _label:{...empty_databus_bottle._label, context: "input-less node dataflow init"}});
                        //const empty_dataflow$ = new Subject();

                        //const driving_ctrlflow$obj = {
                        //    ...synced_upstream_controlflow$obj,
                        //    _stream: synced_upstream_controlflow$obj._stream.pipe(
                        //        //switchMap(_ctrl_in => {
                        //        //    _pipe_cache_ctrl_in = _ctrl_in;
                        //        //    return combineLatest(synced_upstream_dataflow$objArr.map(data$obj => data$obj._stream));
                        //        //}),
                        //        withLatestFrom(synced_upstream_dataflow$objArr[0]._stream), // Array guaranteed to be of length 1
                        //        //switchMap(_ctrl_in => {
                        //        //    _pipe_cache_ctrl_in = _ctrl_in;
                        //        //    return combineLatest([of(_ctrl_in), synced_upstream_dataflow$objArr[0]._stream]);
                        //        //}),
                        //        map(_combined_data_in => {
                        //            empty_dataflow$.next({...empty_databus_bottle, _label:{...empty_databus_bottle._label, context: "input-less node dataflow nudging message as per ctrl signal"}});
                        //            //return _pipe_cache_ctrl_in;
                        //            return _combined_data_in[0];
                        //        })
                        //    ),
                        //};
                        //const _etafunc_output$obj = etafunc._default([], _controlflow$obj);
                        //const etaoutput$obj = etafunc._default([{_stream: empty_dataflow$}], driving_ctrlflow$obj); // return the subsequent output$ as returned by the etafunc against upstream_output$
                        //const etaoutput$obj = etafunc._default([{_stream: empty_dataflow$}], synced_upstream_controlflow$obj); // return the subsequent output$ as returned by the etafunc against upstream_output$
                        const redacted_dataflow$objArr = synced_upstream_dataflow$objArr.map(_$obj=>{
                            return {_stream: _$obj._stream.pipe(
                                map(_data_in=>{
                                    return {...empty_databus_bottle, _label:{...empty_databus_bottle._label, context: "input-less node dataflow nudging message as per ctrl signal"}};
                                })
                            )};
                        });
                        const etaoutput$obj = etafunc._default(redacted_dataflow$objArr, synced_upstream_controlflow$obj); // return the subsequent output$ as returned by the etafunc against upstream_output$
                        // now store this etaoutput$obj in flowinterface
                        flowinterface[nodeuuid].data_out = {_stream: etaoutput$obj._stream};
                        flowinterface[nodeuuid].ctrl_out = {_stream: etaoutput$obj._control._stream};
                        return { // now return a composite from current _weaveDataflowPlane() to the next connected node 
                            _stream: etaoutput$obj._stream.pipe(
                                map(x => {
                                    //const _cache = {nodeuuid, datainputnodes};
                                    return x;
                                })
                            ), 
                            _control: {
                                _stream: etaoutput$obj._control._stream.pipe(
                                    map(x => {
                                        //const _cache = {nodeuuid, datainputnodes};
                                        return x;
                                    })
                                )
                            }
                        }
                    }
                }
            }
        });
    };

    //if (endnodes.includes("2c2ec9ac-a3cf-423c-bc6a-441a60adc608", "8afd9037-9e54-4d5e-a734-33ab9d93d11c"))
    //    console.log("start debugging");
    const weavedplane_out$objArr = _weaveDataflowPlane(endnodes);

    // be aware of the two different return modes of _synchronizeFlow depending on the boolean argument
    // specifying the option for consolidating the data flow array

    //const {ctrl: _chronos_ctrl_out$, data: _chronos_data_out$ } = doChronosSynchronize(weavedplane_out$objArr, {time:2000, count:-1}, {...rt_context, at: "eta.js weaveDataflowPlane", endnodes});
    if (weavedplane_out$objArr.length === 0)
        console.log("start debugging");
    const {ctrl: _chronos_ctrl_out$, data: _chronos_data_out$ } = (weavedplane_out$objArr.length > 1 ? 
        doChronosAsynchronize(weavedplane_out$objArr, {time:-1, count:-1}, {...rt_context, at: "eta.js _weaveDataflowPlane", endnodes}) :
        {ctrl: weavedplane_out$objArr[0]._control._stream, data: weavedplane_out$objArr[0]._stream}
    );
    //const [synced_upstream_controlflow$obj, synced_upstream_dataflow$objArr] = _synchronizeFlow(nodeuuid, _upstream_out$objArr);
    //const [synced_exit_controlflow$obj, synced_exit_dataflow$obj] =  _synchronizeFlow(undefined, weavedplane_out$objArr, true);
    const synced_exit_controlflow$obj = {_stream: _chronos_ctrl_out$};
    const synced_exit_dataflow$obj = {_stream: _chronos_data_out$};
    //if (endnodes.includes('d3553691-cdc9-4cc1-815f-e629a94899cd')) {
    //    // testing condition
    //    prime_ctrlflow$obj._stream.next(doBottle("ctrl_accio", "")); 
    //    prime_dataflow$obj._stream.next(doBottle("data_accio", ""));
    //    _chronos_data_out$.pipe(
    //        map(_data_out=>{
    //            console.log(_data_out);
    //            return _data_out;
    //        })
    //    ).subscribe(
    //        {
    //            next: _out=>
    //            {
    //                return _out;
    //            }
    //        }
    //    )
    //    _chronos_ctrl_out$.pipe(
    //        filter(_ctrl_in=>!(isBottle(_ctrl_in) && _ctrl_in._bname === "error")),
    //        //withLatestFrom(_chronos_data_out$)
    //    ).subscribe({
    //        next: _data_out=> {
    //            console.log(_data_out);
    //            return _data_out;
    //        }
    //    })
    //}

    //const synced_exit_controlflow$obj = {
    //    _stream: combineLatest(weavedplane_out$objArr.map(_$obj => {
    //        return _$obj._control._stream
    //    })).pipe(map(_exitctrl_in=> {
    //        // take care of plurality due to combineLatest
    //        const plurality_checked_synced_ctrl_in = (_exitctrl_in.length === 1) ? 
    //            _exitctrl_in[0] : _exitctrl_in;
    //        return plurality_checked_synced_ctrl_in;
    //    })),
    //    _config: weavedplane_out$objArr.map(_$obj => {
    //        return _$obj._control._config
    //    })
    //};
    //const synced_exit_dataflow$obj = {
    //    _stream: combineLatest(weavedplane_out$objArr.map(_$obj => {
    //        return _$obj._stream;
    //    })).pipe(map(_exitdata_in=> {
    //        // take care of plurality due to combineLatest
    //        const plurality_checked_synced_data_in = (_exitdata_in.length === 1) ? 
    //            _exitdata_in[0] : _exitdata_in;
    //        return plurality_checked_synced_data_in;
    //    }))
    //};

    // spark_dev_note: (22/Mar/2023)
    // #bugreport #mar2023bug2
    // the tagaction lambda function {ref: "gnav element d1d248a8-0d96-486d-bd75-d3aa50181376"}
    // desc: the tagaction is triggered upon a touch event on one of the tags in gnav background
    // the event seems to rerun the chain of LEAF parsing events in eta.js such as weaveDataflowPlane
    // on the lambda LEAF graph, and possibly cause seconds of delay in user experience.
    // severity: fix it with highest priority.
    // following is a potential solution. seperate out as much parsing processes as possible into the
    // "preprocessing" section of weaveDataflowPlane before returning a dataflow function, and minimize
    // the dataflow function into processing the dynamically passed dataflow stream instances that are
    // _input$Arr, _controlflow$obj

    return [{...synced_exit_dataflow$obj, _control: synced_exit_controlflow$obj}, flowinterface];
};

const rxTimeoutStream = (prom, time, codebase, exception, metadata) => {
    let timer;
    return race([
        new Promise((_resolve, _rej) => timer = setTimeout(()=>{
            const _rt_cache = {prom, metadata};
            //rej(); 
            const nodeinfo = metadata.nodeinfo;
            const traces = metadata.traces;
            const errorbottle = doBottle("error", {type: "timeout", message: exception, codebase}, {...metadata});
            console.error(exception);
            console.error(errorbottle);
            //rej(errorbottle);
            _resolve(errorbottle);
        }, time, exception)),
        prom.pipe(map(_resolved=> {
            console.log("rxTimeoutStream resolved, clearing timer:", metadata.traces);
            clearTimeout(timer);
            return _resolved;
        }))
    ]); //.finally(() => clearTimeout(timer));
};
// spark_dev_note: (23/Mar/2023)
// #bugreport #mar2023bug3
// it appears parseDataflowFunc once a dataflow func is weaved forms an internal never-ending loop
// depending on how the dataflow construct is
// the never-ending loop occurs for "accio" spell (refnode: "61bf6fc4-e616-46f3-b0cf-ef1fb86d5ce0") 
// under breezyforest/main
// severity: high, fix it or perish
const parseDataflowFunc = (refnode, startnodes, endnodes, eta_lut, etaTree, metadata={}) => {
    if (refnode === "editor" || refnode === undefined)
        console.log("start debugging");
    //console.log("parseDataflowFunc called for:", refnode, startnodes, endnodes);
    // initialize flowinterface
    const inline_refnode_LUT = {
        "main": "nav main dataflow",
        "leafgraph": "leafgraph main dataflow",
        "editor": "editor main dataflow"
    }
    const node_context = {
        codebase: "eta.js",
        refnode,
        leafnode: Object.keys(inline_refnode_LUT).includes(refnode) ? inline_refnode_LUT[refnode] : etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode)?.leafnode.data,
        metadata,
        domain: etaTree.domain,
        appid: etaTree.appid
    };
    
    return (input$Arr=[], controlflow$obj) => {
        const flowinterface = {
            "data_in": new Subject(),
            "ctrl_in": new Subject(),
            "data_out": new Subject(),
            "ctrl_out": new Subject()
        };

        const prime_dataflow$obj = {_stream: flowinterface.data_in}
        const prime_ctrlflow$obj = {_stream: flowinterface.ctrl_in, _config: {}}

        if (["3980759d-7c59-4b9e-b799-87b5fd4cbcec", "62890d97-837a-463e-aac9-d7fca2293427"].includes(refnode))
            console.log("start debugging");
        if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(refnode))
            console.log("start debugging");
        const [_flowfunc_output$obj, weavedflowLUT] = weaveDataflowPlane(refnode, startnodes, endnodes, eta_lut, etaTree, prime_ctrlflow$obj, prime_dataflow$obj);

        // spark_dev_note: refactor parseDataflowFunc to use driveDataflowByCtrlflow() as follows
        const preprocessfunc = (_data_in) => {
            const _rt_cache = {...node_context};
            //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles
            //flowinterface.data_in.next(_data_in);
            const _data_out = _data_in; // do nothing
            return _data_out;
        };

        const _etaflowfunc = (_input$objArr, _controlflow$obj) => {
            const _outflow_data$ = new Subject();

            let _pipe_cache_ctrl_in;
            const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                map(_ctrl_in => {
                    _pipe_cache_ctrl_in = _ctrl_in;
                    return _ctrl_in;
                }),
                withLatestFrom(..._input$objArr.map(_input$obj=>_input$obj._stream)),
                //switchMap(_combined_in=> {
                //    if (metadata.refnode === "19ec3d65-7361-4a37-95be-c0f30ecedd3f")
                //        console.log("start debugging");
                //    console.log("eta.js parseDataflowFunc() _etaflowfunc data_in registered in the flow:", _combined_in);
                //    //const _rt_cache = {parent_traces: controlflow$obj._config?.traces, traces: _controlflow$obj._config?.traces}
                //    //const _ctrl_in = _ctrl_in_data_in[0];
                //    const _plurality_checked_data_in = _input$objArr.length === 1 ? _combined_in[1] : _combined_in.slice(1);
                //    // now pass data and ctrl data into the eta function

                //    // spark_dev_note: this is where any leaf lambda function eta-reduced by 
                //    // weaveDataflowPlane() can be invoked. The following code snipet is a real life
                //    // example of how this mode of lambda function invocation can be accomplished piggybacking on
                //    // the subscription chain of a existing flow using the rx.js stream operators.
                //    // The subjects flowinterface.{data_in or ctrl_in} function as portals taking
                //    // the data- and ctrl- inputflows.
                //    // The _flowfunc_output$obj function as portals returning the data- and ctrl- outputflows
                //    // as dictated by the relevant lambda function logic, reduced above by weaveDataflowPlane().
                //    // The returning data- and ctrl- flow is statically accessable via the rx.js operator pair concatMap-map 
                //    // making the static data assigned to _combined_in in the map.
                //    // in sum, _combined_in[1] is the output of the lambda function 
                //    // as per the provided input _data_in and _ctrl_in.
                //    // when debugging, use information in node_context to trace 
                //    // the current stream to a particular LEAF code base.

                //    //flowinterface.data_in.next(_plurality_checked_data_in);
                //    //flowinterface.ctrl_in.next(_pipe_cache_ctrl_in);

                //    //const nodeinfo = {
                //    //    refnode,
                //    //    leaflogic: !(refnode in inline_refnode_LUT) ? etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic : undefined,
                //    //    nodeaddr: etaTree.domain+'/'+etaTree.appid,
                //    //    ctrl_trace: _pipe_cache_ctrl_in.traces
                //    //};
                //    ////return combineLatest([_flowfunc_output$obj._control._stream, _flowfunc_output$obj._stream]);
                //    //return _flowfunc_output$obj._control._stream.pipe(withLatestFrom(_flowfunc_output$obj._stream)).pipe(map(_inner_combined_in=>{
                //    //    return _inner_combined_in; // remove array struct for single length data array
                //    //}));
                //    const nodeinfo = {
                //        refnode,
                //        leaflogic: !(refnode in inline_refnode_LUT) ? etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic : undefined,
                //        nodeaddr: etaTree.domain+'/'+etaTree.appid,
                //        ctrl_trace: _pipe_cache_ctrl_in.traces
                //    };
                //    //return combineLatest([_flowfunc_output$obj._control._stream, _flowfunc_output$obj._stream]);
                //    //const _flowfunc_combined_output$ = new Subject();
                //    const _data_in_relay$ = new BehaviorSubject(_plurality_checked_data_in);
                //    const _ctrl_in_relay$ = new BehaviorSubject(_pipe_cache_ctrl_in);

                //    const _flowfunc_combined_output$ = _ctrl_in_relay$.pipe(
                //        withLatestFrom(_data_in_relay$),
                //        map(_inner_combined_in => {
                //            flowinterface.data_in.next(_inner_combined_in[1]);
                //            flowinterface.ctrl_in.next(_inner_combined_in[0]);

                //            return _inner_combined_in;
                //        }),
                //        withLatestFrom(_flowfunc_output$obj._control._stream),
                //        map(_inner_combined_ctrl_in => {
                //            return _inner_combined_ctrl_in[1];
                //        }),
                //        withLatestFrom(_flowfunc_output$obj._stream),
                //        map(_inner_combined_in => {
                //            //_flowfunc_combined_output$.next(_inner_combined_in);
                //            return _inner_combined_in;
                //        })
                //    );
                //    //(_flowfunc_output$obj._control._stream.pipe(withLatestFrom(_flowfunc_output$obj._stream)).pipe(map(_inner_combined_in=>{
                //    //    return _inner_combined_in; // remove array struct for single length data array
                //    //}))).subscribe(_inner_combined_in => {
                //    //    _flowfunc_combined_output$.next(_inner_combined_in);
                //    //});

                //    //flowinterface.data_in.next(_plurality_checked_data_in);
                //    //flowinterface.ctrl_in.next(_pipe_cache_ctrl_in);

                //    return _flowfunc_combined_output$;
                //}),
                switchMap( _combined_in=> {
                    if (metadata.refnode === "19ec3d65-7361-4a37-95be-c0f30ecedd3f")
                        console.log("start debugging");
                    console.log("eta.js parseDataflowFunc() _etaflowfunc data_in registered in the flow:", _combined_in);
                    //const _rt_cache = {parent_traces: controlflow$obj._config?.traces, traces: _controlflow$obj._config?.traces}
                    //const _ctrl_in = _ctrl_in_data_in[0];
                    if (_input$objArr.length > 1)
                        console.log("start debugging");
                    const _plurality_checked_data_in = _input$objArr.length === 1 ? _combined_in[1] : _combined_in.slice(1);
                    // now pass data and ctrl data into the eta function

                    // spark_dev_note: this is where any leaf lambda function eta-reduced by 
                    // weaveDataflowPlane() can be invoked. The following code snipet is a real life
                    // example of how this mode of lambda function invocation can be accomplished piggybacking on
                    // the subscription chain of a existing flow using the rx.js stream operators.
                    // The subjects flowinterface.{data_in or ctrl_in} function as portals taking
                    // the data- and ctrl- inputflows.
                    // The _flowfunc_output$obj function as portals returning the data- and ctrl- outputflows
                    // as dictated by the relevant lambda function logic, reduced above by weaveDataflowPlane().
                    // The returning data- and ctrl- flow is statically accessable via the rx.js operator pair concatMap-map 
                    // making the static data assigned to _combined_in in the map.
                    // in sum, _combined_in[1] is the output of the lambda function 
                    // as per the provided input _data_in and _ctrl_in.
                    // when debugging, use information in node_context to trace 
                    // the current stream to a particular LEAF code base.

                    //flowinterface.data_in.next(_plurality_checked_data_in);
                    //flowinterface.ctrl_in.next(_pipe_cache_ctrl_in);

                    //const nodeinfo = {
                    //    refnode,
                    //    leaflogic: !(refnode in inline_refnode_LUT) ? etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic : undefined,
                    //    nodeaddr: etaTree.domain+'/'+etaTree.appid,
                    //    ctrl_trace: _pipe_cache_ctrl_in.traces
                    //};
                    ////return combineLatest([_flowfunc_output$obj._control._stream, _flowfunc_output$obj._stream]);
                    //return _flowfunc_output$obj._control._stream.pipe(withLatestFrom(_flowfunc_output$obj._stream)).pipe(map(_inner_combined_in=>{
                    //    return _inner_combined_in; // remove array struct for single length data array
                    //}));
                    const nodeinfo = {
                        refnode,
                        leaflogic: !(refnode in inline_refnode_LUT) ? etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic : undefined,
                        nodeaddr: etaTree.domain+'/'+etaTree.appid,
                        ctrl_trace: _pipe_cache_ctrl_in.traces
                    };

                    //(_flowfunc_output$obj._control._stream.pipe(withLatestFrom(_flowfunc_output$obj._stream)).pipe(map(_inner_combined_in=>{
                    //    return _inner_combined_in; // remove array struct for single length data array
                    //}))).subscribe(_inner_combined_in => {
                    //    //_flowfunc_combined_output$.next(_inner_combined_in);
                    //    console.log(_inner_combined_in);
                    //});

                    //const endof_leaflogic_probe = firstValueFrom(_flowfunc_output$obj._control._stream)
                    //flowinterface.data_in.next(_plurality_checked_data_in);
                    //flowinterface.ctrl_in.next(_pipe_cache_ctrl_in);
                    //await endof_leaflogic_probe;
                    //return _combined_in;
                    if ("e2fd7358-27e5-4819-88f8-d8f25c81c9a0" === refnode)
                        console.log("start debugging");
                    setTimeout(() => {
                        flowinterface.data_in.next(_plurality_checked_data_in);
                        flowinterface.ctrl_in.next(_pipe_cache_ctrl_in);
                    }, 1);

                    return _flowfunc_output$obj._control._stream;
                }),
                //withLatestFrom(_flowfunc_output$obj._control._stream),
                //map(_inner_combined_ctrl_in => {
                //    return _inner_combined_ctrl_in[1];
                //}),
                withLatestFrom(_flowfunc_output$obj._stream),
                map(_combined_in => {
                    //const _rt_cache = {parent_traces: controlflow$obj._config?.traces, traces: _controlflow$obj._config?.traces}
                    if (isBottle(_combined_in[1]) && _combined_in[1]._bname === "error") {
                        console.log("start debugging");
                        console.error("rxTimeoutStream resolved with error: ", _combined_in);
                        console.error("LEAR Error: an error occurred when rxTimeoutStream was invoked with ctrl_in from the etafunc invocation within parseDataflowFunc: ", _pipe_cache_ctrl_in);
                    }
                    else {
                        console.log("rxTimeoutStream resolved: ", _combined_in);
                        const _next_data = _combined_in[1]; //.slice(1).filter(_data=>_data!==undefined);
                        if (_next_data !== undefined)
                            _outflow_data$.next(_next_data); // publish the next available post-processed data via the data flow subject channel
                        else
                            console.log("start debugging, this could potentially be the cause of the race condition error from leafmixflow.js");
                    }
                    return _combined_in[0]; // only pass the ctrl data in the flow;
                }),
                share()
            );
            return {
                _stream: _outflow_data$.pipe(
                    filter(_data_out=> JSON.stringify({..._data_out, "_label": {}}) !== JSON.stringify(raceConditionError)),
                ), 
                _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
        }

        const output$obj = driveDataflowByCtrlflow(controlflow$obj, input$Arr, undefined, 
            {
                ...node_context,
                metastep: "invoking parseDataflowFunc()"
            },
            {
                leaflogic: _etaflowfunc,
                datalogic: {
                    //pre: preprocessfunc,
                    //post: postprocessfunc
                }
            }
        );

        return output$obj;
    }
};

// memoize this function
const _etaReduceDataflowComponent_memcache_resolver = ({refnode, component_members, contextuallambda, etaTree}={}) => JSON.stringify([...component_members, ...contextuallambda, etaTree.sessionid]);
const etaReduceDataflowComponent = memoize(async ({refnode, component_members, contextuallambda, etaTree}={}) => {
    const startnodes = [];
    const endnodes = [];
    const eta_lut = {};
    //if (!refnode)
    //    console.log("start debugging");
    if (["7b1f"].includes(refnode?.slice(0,4)))
        console.log("start debugging");
    if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(refnode))
        console.log("start debugging");
    //if (component_members.some((a_member) => (a_member).slice(0,4) === 'cafc'))
    //    console.log('start debugging');
    //if (!Array.isArray(contextuallambda))
    //    console.log(contextuallambda);
    const promiseArr = component_members.map((membernode_uuid) => {
        //if (!refnode)
        //    console.log("start debugging");
        const membernode_lambda = etaTree.leafgraph.edges.lambda.sourcelut[membernode_uuid]; 
        //const membernode_lambda = etaTree.graphcomponents.components.lut.lambda[membernode_uuid]; 
        //etaTree.etaReduce.componentgraph(membernode_uuid)(membernode_uuid, membernode_lambda, contextuallambda);
        //const membernode_etaobj = etaReduceLEAFNode({nodeuuid: membernode_uuid, contextuallambda: contextuallambda, leafnode_scope: lambdacomponent_scope});
        if ("5f7d8750-8ebd-46ee-9a21-029d4000f452" === membernode_uuid)
            console.log("start debugging");
        const etaReductionPromise = etaTree.etaReduceLEAFNode({nodeuuid: membernode_uuid, contextuallambda: contextuallambda});
        etaReductionPromise.then(
        (membernode_etafunc) => {
            //if (!refnode)
            //    console.log("start debugging");
            //if (["7b1f"].includes(refnode?.slice(0,4)))
            //    console.log("start debugging");
            if (membernode_etafunc == undefined) {
                console.log("start debugging");
            }
            eta_lut[membernode_uuid] = membernode_etafunc;
            //const lambda_compiled = etaReduceLambdaGraphs({nodelambda: membernode_lambda, contextuallambda: contextuallambda}); // recursion into lambda upstream 

            //TBD: determine whether it'd be a better recursion pattern to use etaReduceLEAFNode here instead of etaReduceLambdaGraphs followed by node-level logic handling
            const isSourceNode = etaTree.leafgraph.edges.data.sources.has(membernode_uuid);
            const isTargetNode = etaTree.leafgraph.edges.data.targets.has(membernode_uuid);
            if (!isTargetNode)
                startnodes.push(membernode_uuid);
            if (!isSourceNode)
                endnodes.push(membernode_uuid);
        }
        );
        return etaReductionPromise;
    });
    if (["7b1f", "main"].includes(refnode?.slice(0,4)))
        console.log("start debugging");
    await Promise.all(promiseArr);
    //if (!refnode)
    //    console.log("start debugging");
    //if (endnodes.length > 0 && endnodes[0].slice(0,4) === 'cafc')
    //    console.log('start debugging');
    if (["7b1f", "main"].includes(refnode?.slice(0,4)))
        console.log("start debugging");
    if (["2ee89b44-16af-472f-97d4-47ae65f064c8"].includes(refnode))
        console.log("start debugging");
    //const dataflow_eta = weaveDataflowPlane(refnode, [...endnodes], startnodes, endnodes, eta_lut, etaTree);
    const dataflow_eta = parseDataflowFunc(refnode, startnodes, endnodes, eta_lut, etaTree);
    

    //if (["7b1f"].includes(refnode?.slice(0,4)))
    //    console.log("start debugging");
    return dataflow_eta;
}, _etaReduceDataflowComponent_memcache_resolver);

const etaReduceLambdaGraphs = async ({refnode, nodelambda, contextuallambda, etaTree, addnodelut=false, metadata={}}={}) => {
    // @refnode is the uuid of a leaf node by which the two lambda graphs (nodelambda & contextuallambda) are referenced 
    // @nodelambda is a list of uuids of entry nodes of the lambda component graphs connected to @refnode, 
    // @contextuallambda is a list of uuids of entry nodes of the contextual lambda component graphs

    //if (refnode && refnode.slice(0,4) === "9935")
    //    console.log("start debugging");
    if (["7b1f"].includes(refnode?.slice(0,4)))
        console.log("start debugging");
    if (['530acdcf-067d-4868-ba0c-b7a83e6edfdf'].includes(refnode))
        console.log("start debugging")
    if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(refnode))
        console.log("start debugging");
    const lambdaLUT = addnodelut ? {_nodelut: {}} : {};
    //if (!nodelambda)
    //    console.log(nodelambda);
    const promiseArr = nodelambda.map((lambdanodeuuid) => {
        //if (! etaTree.graphcomponents.components.lut[lambdanodeuuid] )
        //    console.log(lambdanodeuuid);
        //console.log(`etaReduceLambdaGraphs(): reading node scope for ${lambdanodeuuid}: ${etaTree.graphcomponents.components.lut[lambdanodeuuid]}`);
        if (!(lambdanodeuuid in etaTree.graphcomponents.components.lut))
            console.log("LEAF Error: etaTree lookup error");

        const {idx: lambdacomponent_idx, scope: lambdacomponent_scope} = etaTree.graphcomponents.components.lut[lambdanodeuuid]; // look up the matching component idx
        const lambda_component = etaTree.graphcomponents.components.nodegroups.lambda[lambdacomponent_idx]; 

        if (lambdacomponent_scope === "dataflow") {
            const etaReductionPromise = etaReduceDataflowComponent({refnode, component_members: lambda_component, contextuallambda, etaTree});

            if (["7b1f"].includes(refnode?.slice(0,4)))
                console.log("start debugging");

            if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(refnode))
                console.log("start debugging");

            etaReductionPromise.then(
                (dataflow_eta) => {
                    if (["7b1f"].includes(refnode?.slice(0,4)))
                        console.log("start debugging");
                    if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(refnode))
                        console.log("start debugging");
                    lambdaLUT._default = dataflow_eta; // dataflow scope eta func is assigned to _default by default
                    if (addnodelut)
                        lambdaLUT._nodelut['_default'] = lambdanodeuuid;
                }
            );
            return etaReductionPromise;
            //{ 
            //  _default: {
            //    etastage: EtaStageCompiledGraph,
            //    graphscope: nodecomponent_scope, // leafnode_scope === graphcomponents.components.lut.lambda[leafnode.uuid].scope ?
            //    etafunc: dataflow_eta,
            //  }
            //};
        }
        else if (lambdacomponent_scope === "lambda") {
            if (lambda_component.length > 1) { // parsing error condition
                const refnode_logic = etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
                console.error(`LEAF error: the logical construct built using the ${refnode_logic.type} node `+
                    `(${refnode}) called with args (${JSON.stringify(refnode_logic.args)}) has an invalid `+
                    `lambda construct. LEAF does NOT allow lambda-scoped nodes to have dataflow edges.`);
            }
            else {
                const etaReductionPromise = etaTree.etaReduceLEAFNode({nodeuuid: lambdanodeuuid, contextuallambda: contextuallambda});
                etaReductionPromise.then(
                (lambdanode_etaobj) => {
                    if (!lambdanode_etaobj)
                        console.log("start debugging");
                    Object.entries(lambdanode_etaobj).map(([lambda_key, etafunc]) => {
                    if (lambda_key in lambdaLUT) {
                        const refnode_logic = etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
                        console.error(`LEAF error: the logical construct built using the ${refnode_logic.type} node `+
                            `(${refnode}) called with args (${JSON.stringify(refnode_logic.args)}) has multiple `+
                            `lambda definitions for ${lambda_key}. LEAF only allows uniquely labelled lambda constructs.`);
                    }
                    else {
                        lambdaLUT[lambda_key] = etafunc;
                        if (addnodelut)
                            lambdaLUT._nodelut[lambda_key] = lambdanodeuuid;
                    }
                    });
                }
                ).catch((error) => {
                    console.error(error);
                });
                return etaReductionPromise;
            }
        }
        else { // error condition
            const refnode_logic = etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
            const lambdanode_logic = etaTree.leafgraph.graph.dataflow.getNodeAttributes(lambdanodeuuid).leafnode.data.leaf.logic;
            console.error(`LEAF error: the lambda construct of type ${lambdanode_logic.type} connected to the ${refnode_logic.type} node (${refnode}) called with args (${JSON.stringify(refnode_logic.args)}) has an invalid scope: ${lambdacomponent_scope}.`);
        }
    });
    //if (["7b1f"].includes(refnode?.slice(0,4)))
    //    console.log("start debugging");
    await Promise.all(promiseArr);
    //if (refnode && refnode.slice(0,4) === "c437")
    //    console.log("start debugging");

    //if (["7b1f"].includes(refnode?.slice(0,4)))
    //    console.log("start debugging");
    if (["e36a8dd4-c8df-4dfa-b60c-765eeb5b99fd"].includes(refnode))
        console.log("start debugging");
    return lambdaLUT;
};


// runtimeEtaTree upon invoking runtimeEtaTree.etaReduce.rootgraph(_leafgraph, _graphcomponents)
// would initiate the initialization of its rootgraph base by returning a function accepting the following arguments:
//  @_leafgraph: a data object as returned by reconstructLEAFGraph() in leaf.js
//  @_graphcomponents: a data object as returned by analyzeLEAFGraph() in leaf.js
// Invoking the function with the said arguments accomplishes the initialization of the rootgraph stage in the eta reduction processe.
// Subsequently, runtimeEtaTree can be eta-reduced further to the componentgraph stage by first calling runtimeEtaTree.etaReduce.componentgraph(nodeuuid).
// This function call accepts the following arguments:
//  @nodeuuid: the uuid of a member node comprising a component graph of interest
// Invoking the function with the said arguments accomplishes the initialization of the componentgraph stage in the eta reduction process,
// in which the component graph level details such as component scope (ie. dataflow vs lambda) and member nodes' core logic are looked up and set.
// The next and the last eta reduction step is to accomplish the nodegraph stage in the eta reduction process that would commit the contextual fate of
// each and every leaf node involved in the graph's intended logic, by setting the following node-level details through invoking
// runtimeEtaTree.etaReduce.nodegraph(nodeuuid, nodelambda, contextuallambda, reduceagain)
//  @nodeuuid: the uuid of a leaf node 
//  @nodelambda: the lambda graph feeding into the leaf node
//  @contextuallambda: the lambda graph feeding into the leaf node's component graph
//  @reduceagain: a boolean to specify whether to perform eta reduction again even if runtimeEtaTree contains a previous eta reduction result.
const runtimeEtaTree = (_mode, _host_domain, _host_appid, _domain, _appid, _leafgraph, _graphcomponents, _leafio, _leaflakeio, _mnemosyne, _hostEtaTree=undefined) => {

  const _runtimeEtaTree = {
    sessionid: _hostEtaTree ? _hostEtaTree.sessionid : undefined,
    appmode: _mode,
    hostdomain: _host_domain,
    hostappid: _host_appid,
    domain: _domain,
    appid: _appid,
    leafgraph: undefined, // the main runtime component graph exists under leafgraph.components.nodegroups.runtime
    graphcomponents: undefined,
    rootgraphstate: undefined,
    leafio: undefined, // directory of ghostos i/o
    leaflakeio: undefined,
    mnemosyne: undefined, // a reference to shared mutable (useRef) memory held by App.js
    hostEtaTree: _hostEtaTree, // undefined for root etaTree
    leafnodemethods: {}, // a lut of runtime configured leafnode specific methods, lut populated via _etaReduceLEAFNode
    lookupRuntimeLambdaLUT: async (graphdomain, graphappid, refnode, nodelambda, contextuallambda, isnodeonly=false) => {
        //const _refnode = nodeuuid; //refnodepath[1]; //leafgraph.graph.lambda.outNeighbors(contextuallambda[0])[0]; 
        if (nodelambda.length === 0)
            return {};

        // check if the address space of nodelambda resides in the current etaTree
        //if (nodelambda.some((lambdauuid) => lambdauuid in _runtimeEtaTree.graphcomponents.components.lut)) {
        //    const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: _runtimeEtaTree});

        //    console.log(reduced_lambda_obj);
        //    return reduced_lambda_obj;
        //}
        //else {
        //    // look them up in the etatreeforest
        //    if (_runtimeEtaTree.hostEtaTree)
        //        return await _runtimeEtaTree.hostEtaTree.lookupRuntimeLambdaLUT(refnode, nodelambda, contextuallambda);
        //    else {
        //        return undefined;
        //    }
        //}
        //const cur_etatree = _runtimeEtaTree.mnemosyne._etaTreeForest.getEtaTree(graphdomain, graphappid);
        const cur_etatree = await etaTreeForest(_runtimeEtaTree).getEtaTree(graphdomain, graphappid);
        
        const reduced_lambda_obj = (isnodeonly ? await _runtimeEtaTree.etaReduceLEAFNode({nodeuuid: refnode, contextuallambda: contextuallambda}) : await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree:cur_etatree}));
        return reduced_lambda_obj;
    },
    lookupLEAFNodeMethods: async (nodeuuid, _refnodedata=undefined) => {
        // spark_dev_note: the second optional argument _refnodedata is for making a leaflisp node, 
        // newly dropped into the canvas, to be capable of opening the vim editor, without 
        // requiring the browser page to be refreshed.
        // a leaflisp node newly dropped into the canvas would not exist in _runtimeEtaTree yet
        // due to the lack of update, and texteditor.js, when looking up its etaTree to
        // lookup the hosting node's information, needs to pass in refnodedata in case
        // this pre-update boundary condition is met. 
        if (nodeuuid in _runtimeEtaTree.leafnodemethods)
            return _runtimeEtaTree.leafnodemethods[nodeuuid];
        else {
            // check if the nodeuuid lives in the current etaTree
            const isNodeInEtaTree = _runtimeEtaTree.leafgraph.graph.dataflow.nodes().includes(nodeuuid);
            if ( isNodeInEtaTree) {
                const refnodedata = _runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid).leafnode.data;

                const _refnode_logic = refnodedata.leaf.logic;
                const lambdactrl = {
                    gos: {
                        standardSpellbook: {},
                        curatedSpellbook: {},
                        stdlambdalut: {},
                        curatedlambdalut: {},
                        leafio: _runtimeEtaTree.leafio,
                        etaTree: _runtimeEtaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
                    }, 
                    user: {
                        spellbook: _runtimeEtaTree.graphcomponents.spelldefs,
                        lambdalut: _runtimeEtaTree.leafgraph.edges.lambda.sourcelut,
                    }
                };
                const leafNodeMethods = getLEAFNodeCoreLogic(_refnode_logic.type, 'methods', lambdactrl);
                //if (_refnode_logic.type === 'leaflisp')
                //    console.log('debugging');
                // register the retrieved methods in the eta tree's nodemethod LUT if not already done so.
                if (leafNodeMethods && !(nodeuuid in _runtimeEtaTree.leafnodemethods)) {
                    const _nodelambda = _runtimeEtaTree.leafgraph.edges.lambda.sourcelut[nodeuuid] ? _runtimeEtaTree.leafgraph.edges.lambda.sourcelut[nodeuuid] : [];
                    _runtimeEtaTree.leafnodemethods[nodeuuid] = await leafNodeMethods({refnode: nodeuuid, refnodedata, nodelambda:_nodelambda, contextuallambda:[]});
                    return _runtimeEtaTree.leafnodemethods[nodeuuid];
                }
                return undefined;
            }
            else if (_runtimeEtaTree.hostEtaTree)
                return _runtimeEtaTree.hostEtaTree.lookupLEAFNodeMethods(nodeuuid, _refnodedata);
            else {
                if (_refnodedata !== undefined) {
                    const refnodedata = _refnodedata; //_runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid).leafnode.data;
                    const _refnode_logic = refnodedata.leaf.logic;
                    const lambdactrl = {
                        gos: {
                            standardSpellbook: {},
                            curatedSpellbook: {},
                            stdlambdalut: {},
                            curatedlambdalut: {},
                            leafio: _runtimeEtaTree.leafio,
                            etaTree: _runtimeEtaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
                        }, 
                        user: {
                            spellbook: _runtimeEtaTree.graphcomponents.spelldefs,
                            lambdalut: _runtimeEtaTree.leafgraph.edges.lambda.sourcelut,
                        }
                    };
                    const leafNodeMethods = getLEAFNodeCoreLogic(_refnode_logic.type, 'methods', lambdactrl);
                    //if (_refnode_logic.type === 'leaflisp')
                    //    console.log('debugging');
                    // register the retrieved methods in the eta tree's nodemethod LUT if not already done so.
                    if (leafNodeMethods && !(nodeuuid in _runtimeEtaTree.leafnodemethods)) {
                        const _nodelambda = _runtimeEtaTree.leafgraph.edges.lambda.sourcelut[nodeuuid] ? _runtimeEtaTree.leafgraph.edges.lambda.sourcelut[nodeuuid] : [];
                        _runtimeEtaTree.leafnodemethods[nodeuuid] = await leafNodeMethods({refnode: nodeuuid, refnodedata, nodelambda:[], contextuallambda:[]});
                        return _runtimeEtaTree.leafnodemethods[nodeuuid];
                    }
                }
                return undefined;
            }
        }
    },
    etaReduceLEAFNode: async ({nodeuuid, contextuallambda}={}) => {
      return {
        _default: inputArr$ => {
          console.error("LEAF Error: runtimeEtaTree.etaReduceLEAFNode() called without first calling initTree().")
          return undefined;
        }
      };
    }, // a memoized function that caches eta reduction of a node with its lambda contexts.
    loadElementJsEsmModule: async (moduleUrl) => {
        if (!(moduleUrl in _runtimeEtaTree.esmcache)) {
            const modulestr = await axios.get(moduleUrl);
            _runtimeEtaTree.esmcache[moduleUrl] = modulestr.data;
        }
        return _runtimeEtaTree.esmcache[moduleUrl];
    },
    initTree: (_leafgraph, _graphcomponents, _leafio, _leaflakeio, _mnemosyne) => { // a func to advance to the rootgraph stage if given the required arguments
      // initialize leafgraph and components for the tree 
      _runtimeEtaTree.config = EtaTreeConfig;
      _runtimeEtaTree.leafgraph = _leafgraph;
      _runtimeEtaTree.graphcomponents = _graphcomponents;
      _runtimeEtaTree.rootgraphstate = "initialized";
      _runtimeEtaTree.leafio = _leafio;
      _runtimeEtaTree.leaflakeio = _leaflakeio;
      _runtimeEtaTree.mnemosyne = _mnemosyne;
      _runtimeEtaTree.esmcache = {};
      if (_runtimeEtaTree.hostEtaTree === undefined) // if current etatree is the root
        etaTreeForest(_runtimeEtaTree).initEtaTreeForest();
      const memcache_resolver = ({nodeuuid, contextuallambda}={}) => JSON.stringify([nodeuuid, ...contextuallambda]);
      const _etaReduceLEAFNode = async ({nodeuuid, contextuallambda}={}) => {
        const _refnode = nodeuuid; //refnodepath[1]; //leafgraph.graph.lambda.outNeighbors(contextuallambda[0])[0]; 
        if (_refnode === "undefined" || _refnode === undefined)
            console.log("start debugging");
        if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(_refnode))
            console.log("start debugging");
        if (["0f35d8bc-36a6-4fe8-b185-f8ed5188b28f"].includes(_refnode))
            console.log("start debugging");
        if (["5f7d8750-8ebd-46ee-9a21-029d4000f452"].includes(_refnode))
            console.log("start debugging");
        const _refnode_logic = _refnode ? _runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(_refnode).leafnode.data.leaf.logic : undefined;

        //if (["7b1f"].includes(nodeuuid.slice(0,4)))
        //    console.log("start debugging");
        const nodelambda = (nodeuuid in _runtimeEtaTree.leafgraph.edges.lambda.sourcelut) ? 
          _runtimeEtaTree.leafgraph.edges.lambda.sourcelut[nodeuuid] :
          [];
        //const nodelambda = runtimeEtaTree.graphcomponents.components.lut.lambda[nodeuuid];
        // spark_dev_note: etaReduceLEAFNode is node-logic agnostic, meaning that variation in node-level logic 
        // shall not affect how it functions. It is a fancy way of saying that etaReduceLEAFNode is a wrapper
        // having no interest in understanding what kind of meaning nodelambda or contextuallambda should bear 
        // in the execution of node's core logic. 
        // etaReduceLEAFNode's primary function is to forward to the node's core logic the incidental need for 
        // eta reduction of the node (nodeuuid) given nodelambda and contextuallambda as the node's logical context.

        let runtime_scope = undefined;
        if (nodeuuid in _runtimeEtaTree.graphcomponents.components.lut) {
          const {scope: component_scope} = _runtimeEtaTree.graphcomponents.components.lut[nodeuuid]; // look up the matching component idx
          runtime_scope = component_scope;
        }
        //const {scope: runtime_scope} = runtimeEtaTree.graphcomponents.components.lut.lambda[nodeuuid]; // look up the matching component scope

        // spark_dev_note: the "corelogic" func (ie. out of _corelib) knows about leaf node specific requirements
        // for lambda context (ie. what to expect in nodelambda and contextuallambda)
        // deal with the initialization of the node core logic with the given logical contexts
        //lambdactrl: {gos: {standardSpellBook: {}, curatedSpellBook: {}, masterSubsDirectory: masterSubsDirectory}}
        //{
        //  gos: {standardSpellbook: {}, curatedSpellbook: {}, masterSubsDirectory: masterSubsDirectory}, 
        //  user: {spellbook:{}, config:node_data}
        //}
        const lambdactrl = {
          gos: {
            standardSpellbook: {},
            curatedSpellbook: {},
            stdlambdalut: {},
            curatedlambdalut: {},
            leafio: _runtimeEtaTree.leafio,
            etaTree: _runtimeEtaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
          }, 
          user: {
            spellbook: _runtimeEtaTree.graphcomponents.spelldefs,
            lambdalut: _runtimeEtaTree.leafgraph.edges.lambda.sourcelut,
          }
        };
        
        try {
            if (['b490aada-daab-4322-9001-14aea8bcb3d3', '97fa68cf-bcc5-44cf-8311-ffa6a1422ac3', 'abb18b4d-b8af-4349-949d-fae21bc142ef', 'e9536f42-df6d-4086-a643-5f3c0b02aac9', 'b5a20ce3-3e67-42cd-9f60-3f70c6acd269', '59fe3646-b338-4ab0-a8a6-d6ad401be4fa'].includes(nodeuuid))
                console.log("start debugging")
            
            if (_refnode_logic.type == "leafasyncflow")
                console.log("start debugging");
            const templateLEAFNodeLogic = getLEAFNodeCoreLogic(_refnode_logic.type, runtime_scope, lambdactrl);
            if (nodeuuid === "undefined" || nodeuuid === undefined)
                console.log("start debugging");
            const refnodedata = _runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid).leafnode.data;

            //if (nodeuuid.slice(0,4) === '270f')
            //    console.log('debug time')
            //if (!Array.isArray(contextuallambda))
            //    console.log(contextuallambda);
            // async eta reduce leaf node's core logic w.r.t. nodelambda and contextuallambda
            //console.log("initializing the LEAF node logic: ", _runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid)?.leafnode.data);
            const leafnodeEtaFunc = await templateLEAFNodeLogic({refnode: nodeuuid, refnodedata, nodelambda, contextuallambda});

            if (['633e5b3e-72b7-4536-8e68-40d0b4902cba'].includes(_refnode))
                console.log("start debugging");
            if (["e36a8dd4-c8df-4dfa-b60c-765eeb5b99fd"].includes(_refnode))
                console.log("start debugging");
            //if (nodeuuid.slice(0,4) === '270f')
            //    console.log('debug time')

            if (runtime_scope === "dataflow") {
            //const wrapped_leafnodeEtaFunc = wrapInputStreamArrayHandler({etafunc: leafnodeEtaFunc});
                return {_default: leafnodeEtaFunc};
            }
            else if (runtime_scope === "lambda") {
                return leafnodeEtaFunc; // lut with _default buried in the object struct or {}
            }
            else {
                console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                        `(${nodeuuid}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) has an undefined scope ${runtime_scope}.`);
                return undefined;
            }
        }
        catch(err) {
            //const _cache = {nodeuuid, runtime_scope};
            console.error(`LEAF Error: running _etaReduceLEAFNode() for node type ${_refnode_logic.type} with runtime scope of ${runtime_scope}:`, err);
        }
        


        // debug
        //const input$ = from([1]); 
        //const input2$ = from([3,5]);
        //const output$ = wrapped_leafnodeEtaFunc([input$, input2$]);
        //let outbuffer = [];
        //output$.pipe(map(x => {
        //  console.log('hello');
        //  console.log(x);
        //}));
        //output$.subscribe({ 
        //  next: x => {
        //    outbuffer = outbuffer.concat(x);
        //    console.log('next: ', x);
        //  },
        //  error: (err) => { // error
        //    console.log('Error: ' + err);
        //  },
        //  complete: () => {
        //    console.log(outbuffer);
        //  },
        //});
        // end of debug

      };
      _runtimeEtaTree.etaReduceLEAFNode = memoize(_etaReduceLEAFNode, memcache_resolver); 
      return _runtimeEtaTree.etaReduceLEAFNode; // return memoized etaReduce func.
    },
  };
  _runtimeEtaTree.initTree(_leafgraph, _graphcomponents, _leafio, _leaflakeio, _mnemosyne);
  _runtimeEtaTree.sessionid = uuid4();
  return _runtimeEtaTree;
};

//// various combining mechanisms nicely explained in 
//// https://indepth.dev/posts/1114/learn-to-combine-rxjs-sequences-with-super-intuitive-interactive-diagrams
//const combineOpDictionary = {
//  merge: {indexed: mergeWith, unindexed: merge},
//  combine: {indexed: zipWith, unindexed: zip},
//  combineLatest: {indexed: combineLatestWith, unindexed: combineLatest},
//  concat: {indexed: concatWith, unindexed: concat},
//  race: {indexed: raceWith, unindexed: race}
//};
////const postcombineOpDictionary = {
////    merge: {indexed: null, unindexed: null},
////    zip: {indexed: zipWith, unindexed: zip},
////    zipLatest: {indexed: combineLatestWith, unindexed: combineLatest},
////    concat: {indexed: concatWith, unindexed: concat},
////    race: {indexed: raceWith, unindexed: race}
////};
//


// curriedLEAFLibDualityInit() returns a js function eta-reduced to the logical context a leaf node, by preconfiguring it as per the arguments passed

export { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree, rxTimeoutStream, doChronosSynchronize, doChronosAsynchronize };
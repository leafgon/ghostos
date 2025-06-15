//import { etaReduceLambdaGraphs, etaReduceDataflowComponent, wrapInputStreamArrayHandler, runtimeEtaTree } from '../../eta';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { map, withLatestFrom, filter, concatMap, share, switchMap } from 'rxjs/operators';
import { combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { doBottle } from '../datautils/bottling.js';

/*
 * _leafoutflowport() is a dataflow-plane-scoped function for the LEAF node of logic type 'leafoutflowport'.
 * it is used to mark the dataflow output port of a dataflow-scoped leaf component graph.
 */
const _leafoutflowport = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        //const _leafnode = contextuallambda; // derivative leafnode
        //const _leafnode_logic = contextuallambda.uuid;
        
        // get the refnode w.r.t. the current leaf node
        //const refnode = refnodepath[0]; //leafgraph.graph.lambda.outNeighbors(contextuallambda[0])[0]; 
        //const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
        //const contextual_lut = refnode ? parseLambdaLUT(contextuallambda, _refnode, _refnode_logic) : undefined;
        // get the refnode w.r.t. the contextuallambda nodes
        // check for parsing error conditions
        //if (!contextuallambda) { 
        //    throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
        //        `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        //}
        //if (!('_default' in contextual_lut)) {
        //  throw `LEAF error: the logical construct built using the ${_refnode_logic.type} node `+
        //        `(${_refnode}) called with args (${JSON.stringify(_refnode_logic.args)}) has no `+
        //        `default defined for its lambda, while being referenced by the leaflambdagraph node (${leafnode}). `+
        //        'A default lambda construct is required by the leaflambdagraph node.';
        //}
        
        // for the derivative nodelambda, look up the list of lambda leaf nodes connected to the defualt lambda entry node.
        // for the derivative contextuallambda, use current node's nodelambda.
        //const _nodelambda = leafgraph.edges.lambda.sourcelut[contextual_lut._default.uuid]; 

        //const thecorelogic = await etaReduceLambdaGraphs(contextual_lut._default.uuid, _nodelambda, _contextuallambda, leafgraph, graphcomponents);
        //const thecorelogic = await etaReduceLambdaGraphs({nodelambda: contextuallambda, contextuallambda: nodelambda});
        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda});
        const node_context = {
            codebase: "leafoutflowport.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };
        return (input$objArr, controlflow$obj) => { // identify function

            const preprocessfunc = (_data_in) => {
                const _rt_cache = {...node_context};
                //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles
                //flowinterface.data_in.next(_data_in);
                const _data_out = _data_in; // do nothing
                return _data_out;
            };

            const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafoutflowport.js", codebase:"/src/ghostos/api/parser/nodelogic/io/leafoutflowport.js"}, {});
            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                console.log("start debugging");
                //const _outflow_data$ = new BehaviorSubject(raceConditionError);
                const _outflow_data$ = new Subject();
    
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    //switchMap(_ctrl_in=> {
                    //    //flowinterface.ctrl_in.next(_ctrl_in);
                    //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
                    //}),
                    map(_ctrl_in => {
                        return _ctrl_in;
                    }),
                    withLatestFrom(..._input$objArr.map(_=>_._stream)),
                    map(_combined_in => {
                        // spark_dev_note: 19/Jun/2023
                        // #databus
                        //const _next_data = _combined_in.slice(1).filter(_data=>
                        //    (_data!==undefined && !(isBottle(_data) && _data._bname === "_databus" && _data._label._type !== "memoryio")));
                        //const _next_data = _combined_in.slice(1).filter(_data=>
                        //    (_data!==undefined));

                        //if (_next_data.length === 1) {
                        //    _outflow_data$.next(_next_data[0]); // publish the next available post-processed data via the data flow subject channel
                        //}
                        //else if (_next_data.length > 1) { 
                        //    _outflow_data$.next(_next_data); // publish the next available post-processed data via the data flow subject channel
                        //}
                        //else { // out only, no input data 
                        //    console.log("LEAF error: leafoutflowport has no input")
                        //    _outflow_data$.next(doBottle("error", "leafoutflowport has no input", {...node_context})); // publish the next available post-processed data via the data flow subject channel
                        //}
                        _outflow_data$.next(_combined_in[1]);
                        return _combined_in[0]; // only pass the ctrl data in the flow;
                    }),
                    share()
                );
                return {_stream: _outflow_data$, _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }

            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
            //const consolidated_input$objArr = [{
            //    _stream: chronosDataflow(
            //        controlflow$obj._stream.pipe(map(_peep_in=>{
            //            return _peep_in;
            //        })), 
            //        input$objArr.map(_$obj=>_$obj._stream.pipe(map(_peep_in=>{
            //            return _peep_in;
            //        }))), 
            //        false, CHRONOSTYPE_SYNC, {time: 10000}
            //    )
            //}];
            const output$obj = driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, 
                {...node_context, metastep: "leaf outflow"}, 
                {
                    leaflogic: _nodeflowfunc, 
                    datalogic: {pre: preprocessfunc}
                }
            );

            return output$obj;
            //if (flowinput$Arr.length > 0) {
            //    const flowinput$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leafoutflowport.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
            //    //const flowinput$ = combineLatest(flowinput$Arr.map(_=>_._stream));// default to combining multiple streams
            //    if (flowinput$obj) {
            //        const flowoutput$ = flowinput$obj._stream.pipe(
            //            map(_unitdata => { // debug window
            //                console.log(`_leafoutflowport(): ${refnode}`, _unitdata);
            //                return _unitdata; //.flat();
            //            })
            //        )
            //        return {_stream: flowoutput$, _control: controlflow$obj}; 
            //    }
            //}
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
            'be defined as a lambda-scoped node.');
        return (flowinput$Arr, controlflow$obj) => { // identify function
            const flowoutput$obj = combineDataflows(flowinput$Arr)
            return {...flowoutput$obj, _control: controlflow$obj}; 
        };
    },
};

export { _leafoutflowport };

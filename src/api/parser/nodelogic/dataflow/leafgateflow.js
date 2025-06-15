import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, mergeMap, catchError, withLatestFrom, filter, skipWhile, concatMap, share, switchMap } from 'rxjs/operators';
import { combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { isBottle } from '../../predicates.js';
import { _leafstdlib_dataflow_api } from '../../../metamodel.js';
import { fetchMultiKeyedData } from '../../../utils/fetchnodedata.js';
import { EMPTY, of, BehaviorSubject, Subject, combineLatest } from 'rxjs';
//import cloneDeep from 'lodash/cloneDeep';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { doBottle } from '../datautils/bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafgateflow.js", codebase:"/src/ghostos/api/parser/nodelogic/dataflow/leafgateflow.js"}, {});
const apidef = _leafstdlib_dataflow_api("leafgateflow");
/*
 * _leafgateflow() is a runtime function for the LEAF node of logic type 'leafgateflow'.
 * it is used to decide the criteria for passing bottles through or not.
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @label.
 * @graphContextual: n/a
 */
const _leafgateflow = {
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
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
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
        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        const {type, args} = refnodedata.leaf.logic;
        const gatekey = fetchMultiKeyedData(apidef.editorconfig.namedatakey, args).toLowerCase();
        const toggledatakey = fetchMultiKeyedData(apidef.editorconfig.toggledatakey, args);

        const getGateTagLabelText = () => {
            const _candidates = Object.keys(reduced_lambda_obj).filter(_key=>(Object.keys(reduced_lambda_obj[_key]).length === 0 ));
            return (_candidates.length > 0) ? _candidates.sort().join(";") : undefined;
        };

        const _gate_tag = getGateTagLabelText();

        const node_context = {
            codebase: "leafgateflow.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => {
            //const flowinput$obj = combineDataflows(refnode, flowinput$Arr);
            //const flowinput$obj = combineDataflows(refnode, input$objArr, false, false, false, {provenance: "leafgateflow.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
            const handleUnbottledData = (_unitdata, _isNOTgate) => {
                const querystrings = _unitdata ? Object.entries(_unitdata).map((entry)=>entry[0]+'='+(typeof entry[1] === 'object' ? JSON.stringify(entry[1]) : entry[1])) : [];
                if (_isNOTgate ? !querystrings.includes(gatekey) : querystrings.includes(gatekey))
                    return _unitdata;
                // evaluate skip condition
                //if (_unitdata)
                //    _unitdata._skip = true;
                //else
                //    _unitdata = {_skip: true};
                //return _unitdata;
                return undefined;
            };

            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                console.log("start debugging");
                const _outflow_data$ = new Subject(); //BehaviorSubject({...raceConditionError, _label: {...node_context}});
    
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    //switchMap(_ctrl_in=> {
                    //    //flowinterface.ctrl_in.next(_ctrl_in);
                    //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_=>_._stream)]);
                    //}),
                    withLatestFrom(..._input$objArr.map(_=>_._stream)),
                    map(_combined_in => {
                        //const _next_data = _combined_in.slice(1).filter(_data=>_data!==undefined);

                        //const unitdataArr = _next_data.length === 1 ? _next_data.flat() : _next_data;
                        const _next_data = _combined_in[1];

                        const do_gateflow = unitdata => {
                            if (isBottle(unitdata)) { 
                                // toggledatakey === true for a NOT gate, toggledatakey === false for a normal gate
                                if ((!toggledatakey && unitdata._bname?.toLowerCase() === gatekey) || (toggledatakey && unitdata._bname?.toLowerCase() !== gatekey)) 
                                    return unitdata;
                                else {
                                    return undefined;
                                }
                            }
                            else if (gatekey === "{crate}") {
                                if (!toggledatakey && unitdata._cratelabel) {
                                    if (_gate_tag === "uncrate")
                                        return Object.keys(unitdata).filter(_key=>_key!=="_cratelabel").map(_key=>unitdata[_key]).flat(); 
                                    else 
                                        return unitdata;
                                }
                                else if (toggledatakey && !unitdata._cratelabel) {
                                    return unitdata;
                                }
                                return undefined;
                            }
                            else {// else exclude the unitdata by returning EMPTY
                                //return EMPTY; // returning this would stop any downstream rx.js stream flow
                                //throw 'EMPTY';
                                //unitdata._skip = true;
                                //return unitdata;
                                //console.log(unitdata);
                                return handleUnbottledData(unitdata, toggledatakey);
                            }
                        };
                        const is_array_input = Array.isArray(_next_data);
                        const gateddata = (is_array_input ? 
                            _next_data.map(
                                _next_datum => do_gateflow(_next_datum)
                            ).filter(_entry => _entry !== undefined) : // filter out any null entries
                            do_gateflow(_next_data)
                        );

                        //let _ctrl_out = undefined;
                        if (gateddata?.length > 0 || (!is_array_input && gateddata !== undefined)) {
                            _outflow_data$.next(gateddata); // publish the next available post-processed data via the data flow subject channel
                            return _combined_in[0]; // only pass the ctrl data in the flow;
                        }
                        //if (gateddata.length > 1) {
                        //    _outflow_data$.next(gateddata); // publish the next available post-processed data via the data flow subject channel
                        //    _ctrl_out = _combined_in[0]; // only pass the ctrl data in the flow;
                        //}
                        //else if (gateddata.length === 1) {
                        //    _outflow_data$.next(gateddata[0]); // publish the next available post-processed data via the data flow subject channel
                        //    _ctrl_out = _combined_in[0]; // only pass the ctrl data in the flow;
                        //}
                        //else {
                        //    console.log("LEAF log: leafgateflow _nodeflowfunc has a gating event in the data plane", _combined_in);
                        //}

                        //return _ctrl_out;
                        return undefined;
                    }),
                    filter(_=>_!==undefined),
                    share()
                );
                return {
                    _stream: _outflow_data$.pipe(
                        map(_in => {
                            return _in;
                        }),
                        share()
                    ), 
                    _control: {..._controlflow$obj, 
                        _stream: _outflow_ctrl$.pipe(
                            map(_in => {
                                return _in;
                            }),
                            share()
                        )
                    }
                };
            }

            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
            const output$obj = driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, 
                {...node_context, metastep: "gateflow "+(toggledatakey ? "NOT gate, " : "normal gate, ")+gatekey}, 
                {leaflogic: _nodeflowfunc, datalogic: {
                    post: (_data_out) => {
                        return _data_out;
                    }
                }}
            );

            return output$obj;

            //if (flowinput$obj) {
            //    //let isgateopen = false;
            //    const gatedoutput$ = flowinput$obj._stream.pipe(
            //        mergeMap(_unitdata => {
            //            const unitdataArr = cloneDeep(Array.isArray(_unitdata) ? _unitdata : [_unitdata]);

            //            if (toggledatakey) { // a NOT gate
            //                return unitdataArr.map(
            //                    unitdata => {
            //                        if (isBottle(unitdata)) { 
            //                            if (unitdata._bname.toLowerCase() !== gatekey) 
            //                                return unitdata;
            //                            else {
            //                                if (unitdata)
            //                                    unitdata._skip = true;
            //                                else
            //                                    unitdata = {_skip: true};

            //                                return unitdata;
            //                            }
            //                        }
            //                        else {// else exclude the unitdata by returning EMPTY
            //                            //return EMPTY; // returning this would stop any downstream rx.js stream flow
            //                            //throw 'EMPTY';
            //                            //unitdata._skip = true;
            //                            //return unitdata;
            //                            //console.log(unitdata);
            //                            return handleUnbottledData(unitdata, toggledatakey);
            //                        }
            //                    }
            //                ).filter(_entry => _entry); // filter out any null entries
            //            }
            //            else { // a normal gate
            //                return unitdataArr.map(
            //                    unitdata => {
            //                        if (isBottle(unitdata)) {
            //                            if (unitdata._bname.toLowerCase() === gatekey) 
            //                                return unitdata;
            //                            else {
            //                                if (unitdata)
            //                                    unitdata._skip = true;
            //                                else
            //                                    unitdata = {_skip: true};

            //                                return unitdata;
            //                            }
            //                        }
            //                        else {
            //                            //return EMPTY; // returning this would stop any downstream rx.js stream flow
            //                            //throw 'EMPTY';
            //                            //const querystrings = unitdata ? Object.entries(unitdata).map((entry)=>entry[0]+'='+(typeof entry[1] === 'object' ? JSON.stringify(entry[1]) : entry[1])) : [];
            //                            //if (querystrings.includes(gatekey))
            //                            //    return unitdata;
            //                            //// evaluate skip condition
            //                            //if (unitdata)
            //                            //    unitdata._skip = true;
            //                            //return unitdata;
            //                            return handleUnbottledData(unitdata, toggledatakey);
            //                        }
            //                    }
            //                ).filter(_entry => _entry); // filter out any null entries
            //            }
            //        }),
            //        skipWhile(unitdata => ('_skip' in unitdata)), // spark_dev_note: for stopping the LEAF dataflow in the current stream without killing off other dataflow streams as part of the whole subscription flow.
            //        //catchError(error => EMPTY),
            //        filter(_=>_)
            //    );

            //    return {_stream: gatedoutput$, _control: controlflow$obj};
            //    //if (isgateopen)
            //    //    return {_stream: gatedoutput$, _control: controlflow$obj};
            //    //else
            //    //    return {_stream: undefined, _control: undefined}; 
            //}
            // spark_dev_note: based on the user-define sync rule, the sync behavior is taken care of by its calling function parseLEAFNode()
            //if (refnodedata.leaf.logic.args.syncrule || 'syncrule' in reduced_lambda_obj) { // a non-empty rule or lambdaFunc argument
            //    //const lambdalabels$ = lambdadata.lambdaFunc ? lambdadata.lambdaFunc(flowinput$) : of([lambdactrl.user.leaf.logic.args.label]);
            //    
            //    const flowoutput$ = flowinput$.pipe(
            //        //withLatestFrom(lambdalabels$), // transforms input stream into tuples of [unitdata, _lambdalabel]
            //        map((_data) => {
            //            console.log(_data);
            //            return _data;
            //        }),
            //        //filter(([unitdata, _lambdalabel]) => (unitdata.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))))), // filter out any non-bottle or non-crate data
            //        filter(_entry => _entry) // filter out any null entries
            //    );

            //    // debug
            //    flowoutput$.pipe(
            //        map((_entry) => {
            //            console.log(_entry);
            //        })
            //    )

            //    return flowoutput$;
            //}
            //else { // no label to label anything with, just return input as output unchanged
            //    return flowinput$; 
            //}
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};
//(inputargs={}) => {
//    const {
//        lambdactrl,
//        lambdadata
//    } = inputargs;
//    //{lambdactrl: {gos: {subsDirectory}, user: {label=''}}, lambdadata: {lambdaFunc=x=>x, graphContextual}}
//
//    return (flowinput$) => {
//        // spark_dev_note: based on the user-define sync rule, the sync behavior is taken care of by its calling function parseLEAFNode()
//        if (lambdactrl.user.leaf.logic.args.gaterule || lambdadata.lambdaFunc) { // a non-empty rule or lambdaFunc argument
//            //const lambdalabels$ = lambdadata.lambdaFunc ? lambdadata.lambdaFunc(flowinput$) : of([lambdactrl.user.leaf.logic.args.label]);
//            
//            const flowoutput$ = flowinput$.pipe(
//                //withLatestFrom(lambdalabels$), // transforms input stream into tuples of [unitdata, _lambdalabel]
//                map((_data) => {
//                    console.log(_data);
//                    return _data;
//                }),
//                //filter(([unitdata, _lambdalabel]) => (unitdata.every(x=>(isBottle(x)||(isCrate(x) && x._crate.every(isBottle)))))), // filter out any non-bottle or non-crate data
//                filter(_entry => _entry) // filter out any null entries
//            );
//
//            // debug
//            flowoutput$.pipe(
//                map((_entry) => {
//                    console.log(_entry);
//                })
//            )
//
//            return flowoutput$;
//        }
//        else { // no label to label anything with, just return input as output unchanged
//            return flowinput$; 
//        }
//    };
//};

export { _leafgateflow };
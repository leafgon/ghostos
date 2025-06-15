import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter, concatMap, switchMap, share } from 'rxjs/operators';
import { mergeDataflows, naiveZipDataflows, combineDataflows, substituteDataflows, concatDataflows, CHRONOSTYPE_ASYNC, chronosDataflow, TIMEOUTBEHAVIOR_BESTEFFORT } from '../../../utils/leafdataflow.js';
import { zip, combineLatest, BehaviorSubject, Subject, of, merge } from 'rxjs';
import { isBottle, isCrate, isEmptyBottle, isPrimitiveType } from '../../predicates.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';
//import { syncDataflows } from '../../../utils/leafdataflow';
import { doBottle } from '../datautils/bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafchronosflow.js", codebase:"/src/ghostos/api/parser/nodelogic/dataflow/leafchronosflow.js"}, {});
/*
 * _leafchronosflow() is a runtime function for the LEAF node of logic type 'leafchronosflow'.
 * it is used to define rules on how to synchronize/asynchronize multiple dataflows wired into the node's input.
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @label.
 * @graphContextual: n/a
 */
const _leafchronosflow = {
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

        const node_context = {
            codebase: "leafchronosflow.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        const _defaultLambda = (('_default' in reduced_lambda_obj) ?
            (_input$objArr, _controlflow$obj) => {
                //const mixflowctrlflow$obj = {..._controlflow$obj};

                const _output$obj = reduced_lambda_obj._default(_input$objArr, _controlflow$obj);
                return _output$obj;
            } :
            (_input$objArr, _controlflow$obj) => {
                const _outflow_data$ = new Subject(); // BehaviorSubject(raceConditionError);
                //const merged_data_in$ = _input$objArr[0]._stream; // merge operation already done under weaveDataflow in eta.js 
                const merged_data_in$ = _input$objArr[0]._stream;

                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    map(_ctrl_in => {
                        return _ctrl_in;
                    }),
                    withLatestFrom(merged_data_in$),
                    //concatMap(_ctrl_in=> {
                    //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_obj=>_obj._stream)]);
                    //}),
                    map(_combined_in => {
                        //const isbottled = ('bottle' in reduced_lambda_obj) ? true : false; // is output bottled?
                        //const isparfait = ('parfait' in reduced_lambda_obj) ? true : false; // is output an array (parfait), plural or singular data array without explicit text labels?
                        //const iscrate = ('crate' in reduced_lambda_obj) ? true : false; // is output a bottle array (crate), a crate here is a parfait without unbottling incoming bottles
                        //const isdict = ('dictionary' in reduced_lambda_obj) ? true : false; // is output a bottle array (crate), a crate here is a parfait without unbottling incoming bottles
                        //const israw = ('raw' in reduced_lambda_obj) ? true : false; // is output an array (parfait), plural or singular data array without explicit text labels?

                        //const _next_data = _combined_in[1];
                        //_outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                        //.map(_unitdata => { // filter incoming bottles
                        //    // mix require bottled input
                        //    return isBottle(_unitdata) ? _unitdata : undefined;
                        //})
                        //const _next_data = [_combined_in[1]].flat().filter(_unitdata => { // filter out undefined or "empty_data"
                        //    //return (_unitdata !== undefined && !isEmptyBottle(_unitdata));
                        //    return (_unitdata !== undefined);
                        //}); 
                        ////if (!israw)
                        ////    _next_data = [...(new Set(_next_data.flat()))]; // flatten and remove duplicates

                        //if (_next_data.includes(undefined))
                        //    console.log("start debugging")
                        //if (_next_data.length > 1)
                        //    _outflow_data$.next(_next_data); // publish the next available post-processed data via the data flow subject channel
                        //else if (_next_data.length === 1)
                        //    _outflow_data$.next(_next_data[0]); // publish the next available post-processed data via the data flow subject channel

                        //return new BehaviorSubject(_combined_in[0]); // only pass the ctrl data in the main flow;
                        _outflow_data$.next(_combined_in[1]);
                        return _combined_in[0];
                    }),
                    share()
                );
                return {
                    _stream: _outflow_data$.pipe(
                        map(x => {
                            //const _rt_cache = {...node_context};
                            return x;
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
        );

        return (input$objArr, controlflow$obj) => {

            //const outflow_data$ = new ReplaySubject(1);
            if (input$objArr.length > 1) {
                const merged_data_in$ = merge(...input$objArr.map((_$obj, idx)=>{ 
                    return _$obj._stream.pipe(
                        map(_data_in=>{
                            const _cache = idx;
                            return _data_in;
                        }),
                        share()
                    );
                })); 

                // determine mode of action
                if ("concat" in reduced_lambda_obj) { // look for a concat label
                    const concatflow$obj = concatDataflows(input$objArr);
                    return {...concatflow$obj, _control: controlflow$obj};
                }
                else if ("merge" in reduced_lambda_obj) {
                    const mergeflow$obj = mergeDataflows(input$objArr);
                    return {...mergeflow$obj, _control: controlflow$obj};
                }
                //else if ("zip" in reduced_lambda_obj) { // zip is the default mix mode
                //    const zippedflow$obj = zipDataflows(refnode, flowinput$Arr, 'main', 'latest' in reduced_lambda_obj, !('wait' in reduced_lambda_obj));// default to zipping multiple streams
                //    //return {_stream: zippedflow$obj._stream.pipe(map(
                //    //    x => {
                //    //        console.log(x);
                //    //        return x;
                //    //    }
                //    //))};
                //    // test
                //    //zippedflow$obj._stream.subscribe({
                //    //    next: x => {
                //    //        console.log(x);
                //    //    }
                //    //})
                //    // end of test
                //    return {...zippedflow$obj, _control: controlflow$obj};
                //}
                else if ("combine" in reduced_lambda_obj) { // zip is the default mix mode
                    const combinedflow$obj = combineDataflows(refnode, input$objArr);// default to zipping multiple streams
                    //const combinedflow$obj = {_stream: combineLatest(flowinput$Arr.map(x=>x._stream)).pipe(map(_=>_.flat()))};// default to zipping multiple streams
                    return {...combinedflow$obj, _control: controlflow$obj};
                }
                else if ("substitute" in reduced_lambda_obj) {
                    const dictionary_keys = Object.keys(reduced_lambda_obj.substitute);

                    return {...substituteDataflows(input$objArr, dictionary_keys), _control: controlflow$obj};

                }
                else { // naive zip is the default mix mode
                    let idxcache = 0;
                    let loopydata_cache = [];
                    let ctrl_in_cache = undefined;
                    let bottle_label = undefined;

                    const blankprefunc = (_data_in) => {
                        const _rt_cache = {idxcache, loopydata_cache};
                        //const _data_out = doUnbottle(undefined, _data_in);
                        const _data_out = _data_in;
                        return _data_out;
                    };

                    const nodectrl$ = controlflow$obj._stream.pipe(
                        map(_ctrl_in => {
                            const _rt_cache = {...node_context};
                            return _ctrl_in;
                        })
                    );
                    //const nodectrl$ = controlflow$obj._stream.pipe(
                    //    concatMap(_ctrl_in=> {
                    //        ctrl_in_cache = _ctrl_in;
                    //        return [of(_ctrl_in), lambdakey$obj._stream];
                    //    }),
                    //    map( ([_ctrl_in, _lambdakey]) => {
                    //        bottle_label = _lambdakey;
                    //        return _ctrl_in;
                    //    })
                    //); 
                    //const _merged_input$objArr = input$objArr.length > 1 ? 
                    //[{
                    //    _stream: merge(...input$objArr.map(_in$obj =>_in$obj._stream)).pipe(
                    //        map(_data_in => {
                    //            return _data_in;
                    //        })
                    //    )
                    //}] :
                    //input$objArr;

                    //const _merged_input$objArr = input$objArr.length > 1 ?
                    //    [{_stream: chronosDataflow(nodectrl$, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_ASYNC, {time: -1}, TIMEOUTBEHAVIOR_BESTEFFORT, {codebase: 'leafchronosflow'})}] :
                    //    input$objArr;

                    const output$obj = driveDataflowByCtrlflow(
                        {_stream: nodectrl$}, [{_stream: merged_data_in$}], undefined, 
                        {...node_context, metastep: "executing leafchronosflow "}, 
                        {
                            leaflogic: _defaultLambda, 
                            datalogic: {pre: blankprefunc}
                        }
                    );
                    return output$obj;
                    //const zippedflow$obj = naiveZipDataflows(flowinput$Arr);// default to zipping multiple streams
                    //const zippedflow$obj = zipDataflows(refnode, flowinput$Arr, 'main', 'latest' in reduced_lambda_obj, !('wait' in reduced_lambda_obj));// default to zipping multiple streams
                    //return {...zippedflow$obj, _control: controlflow$obj};

                    // spark_dev_note: (22/Mar/2023)
                    // #bugreport #mar2023bug1
                    //const combinedflow$obj = combineDataflows(refnode, flowinput$Arr, true, false, true);// default to zipping multiple streams
                    //const outflow_ctrl$ = controlflow$obj._stream.pipe(
                    //    concatMap(_ctrl_in=> {
                    //        //const combinedflow$obj = combineDataflows(refnode, [of(_ctrl_in),...flowinput$Arr], false, false, false, {provenance: "leafmixflow.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
                    //        const combinedflow$ = combineLatest([of(_ctrl_in),...flowinput$Arr.map(_in$obj=>_in$obj._stream)]);
                    //        return combinedflow$;
                    //    }),
                    //    map(_combined_in=> {
                    //        outflow_data$.next(_combined_in.slice(1)); // pass the data without ctrl
                    //        return _combined_in[0]; // only pass the ctrl data in the flow;
                    //    })
                    //);
                    //const outflow$obj = driveDataflowByCtrlflow(controlflow$obj, input$objArr, undefined, node_context);
                    //const outflow_data$ = outflow$obj._stream;
                    //const outflow_ctrl$ = outflow$obj._control._stream;
                    ////const combinedflow$obj = {_stream: combineLatest(flowinput$Arr.map(x=>x._stream)).pipe(
                    ////    map(_=> {
                    ////        if (refnode.slice(0,4) === "9168")
                    ////            console.log("start debugging");
                    ////        return _;
                    ////    }),
                    ////    map(_=>_.flat())
                    ////)};// default to zipping multiple streams
                    //return {_stream: outflow_data$, _control: {_stream: outflow_ctrl$}};
                }

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
            }
            else if (input$objArr.length === 1) {
                // spark_dev_note: (22/Mar/2023)
                // #bugreport #mar2023bug1 #spuriouscombo
                // A critical bug found in the way eta.js weaveDataflows handles multiple inflows
                // by consolidating them into a single inflow upon feeding to the receiving node
                // this invalides the above code block executed when flowinput$Arr.length > 1
                // fix it with highest priority.
                return {...input$objArr[0], _control: controlflow$obj};
            }
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

export { _leafchronosflow };
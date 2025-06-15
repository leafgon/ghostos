import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, withLatestFrom, filter, concatMap, share, switchMap, skipUntil } from 'rxjs/operators';
import { mergeDataflows, naiveZipDataflows, combineDataflows, substituteDataflows, concatDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { zip, combineLatest, BehaviorSubject, of, Subject } from 'rxjs';
import { isBottle, isCrate, isEmptyBottle, isPrimitiveType } from '../../predicates.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafmixflow.js", codebase:"/src/ghostos/api/parser/nodelogic/dataflow/leafmixflow.js"}, {});
/*
 * _leafmixflow() is a runtime function for the LEAF node of logic type 'leafmixflow'.
 * it is used to define rules on how to mix the data contents of multiple dataflows wired into the node's input.
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying a string or a list of strings. 
 * The output of which, if defined, is used preemptively in lieu of @label.
 * @graphContextual: n/a
 */
const _leafmixflow = {
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
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        const node_context = {
            codebase: "leafmixflow.js",
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
                console.log("start debugging");
                const _outflow_data$ = new Subject(); //new BehaviorSubject(raceConditionError);

                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    //switchMap(_ctrl_in=> {
                    //    if (refnode === "090333ee-93f9-4eab-9ae2-2495bef8f388")
                    //        console.log("start debugging, #racecondition");
                    //    return combineLatest([of(_ctrl_in), ..._input$objArr.map(_obj=>_obj._stream)]);
                    //}),
                    withLatestFrom(..._input$objArr.map(_obj=>_obj._stream)),
                    switchMap(_combined_in => {
                        const isbottled = ('bottle' in reduced_lambda_obj) ? true : false; // is output bottled?
                        const isflatten = ('flatten' in reduced_lambda_obj) ? true : false; // is output an array (parfait), plural or singular data array without explicit text labels?
                        const isparfait = ('parfait' in reduced_lambda_obj) ? true : false; // is output an array (parfait), plural or singular data array without explicit text labels?
                        const iscrate = ('crate' in reduced_lambda_obj) ? true : false; // is output a bottle array (crate), a crate here is a parfait without unbottling incoming bottles
                        const isdict = ('dictionary' in reduced_lambda_obj) ? true : false; // is output a bottle array (crate), a crate here is a parfait without unbottling incoming bottles
                        const israw = ('raw' in reduced_lambda_obj) ? true : false; // is output an array (parfait), plural or singular data array without explicit text labels?

                        if (refnode === "5bf0fb01-3c2c-4d85-bfea-4ebef3e8ab3b")
                            console.log("start debugging");
                        let _next_data = undefined;
                        if (isflatten) {

                            _next_data = Array.isArray(_combined_in[1]) ? _combined_in[1].flat() : _combined_in[1];
                            _outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                        }
                        else if (isparfait && !isdict) {
                            // spark_dev_note: 18/Jun/2023
                            // #databus
                            // leafmixflow now passes bottles whose contents are not undefined
                            //const _next_data = _combined_in.slice(1).map(_unitdata=>{return exitDataBus({_bus:_unitdata});}).filter(_data=>_data!==undefined);
                            // _combined_in is supposed to be of length 2, where idx 0 carries the _ctrl_in and
                            // idx 1 carries the consolidated input data stream (ie consolidated_input$objArr)
                            _next_data = [_combined_in[1]].flat().map(_unitdata => { // unbottle all ("*") incoming bottles
                                    // mix require bottled input
                                    return isBottle(_unitdata) ? doUnbottle("*", _unitdata) : undefined;
                                }).filter(_unitdata => { // filter out undefined, null or "empty_data"
                                    return (_unitdata && _unitdata !== "empty_data");
                                }); 
                            if (!israw)
                                _next_data = [...(new Set(_next_data.flat()))]; // flatten and remove duplicates

                            //if (_next_data.length === 1)
                            //    _outflow_data$.next(isbottled ? doBottle("mix", _next_data[0]) : _next_data[0]); // publish the next available post-processed data via the data flow subject channel
                            //else // #racecondition this else clause would transfer downstream [] or an empty data array as well, in order to prevent race condition error.
                            //    _outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                            _outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                        }
                        else if (iscrate && !isdict) {
                            _next_data = [_combined_in[1]].flat().map(_unitdata => { // filter incoming bottles
                                    // mix require bottled input
                                    return isBottle(_unitdata) ? _unitdata : undefined;
                                }).filter(_unitdata => { // filter out undefined or "empty_data"
                                    return (_unitdata !== undefined && !isEmptyBottle(_unitdata));
                                }); 
                            if (!israw)
                                _next_data = [...(new Set(_next_data.flat()))]; // flatten and remove duplicates

                            if (_next_data.length === 1)
                                _outflow_data$.next(isbottled ? doBottle("mix", _next_data[0]) : _next_data[0]); // publish the next available post-processed data via the data flow subject channel
                            else // #racecondition this else clause would transfer downstream [] or an empty data array as well, in order to prevent race condition error.
                                _outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                        }
                        else { // if not a parfait nor a crate, then a dictionary
                            _next_data = {};
                            [_combined_in[1]].flat().filter(_unitdata => { // filter out non-bottle data or "empty_data"
                                return (isBottle(_unitdata) && !isEmptyBottle(_unitdata));
                            }).map(_unitdata => { // unbottle all ("*") incoming bottles
                                const bottle2dict = (_bottle, _dict = {}) => {
                                    const _bname = _bottle._bname;
                                    return {..._dict, [_bname]: doUnbottle("*", _unitdata)};
                                };
                                // mix require bottled input
                                //return isBottle(_unitdata) ? doUnbottle("*", _unitdata) : undefined;
                                if (isBottle(_unitdata)) {
                                    _next_data = bottle2dict(_unitdata, _next_data);
                                    return _unitdata;
                                }
                                return undefined;
                            }); 

                            // spark_dev_note: 31/July/2023
                            // conditional downstream data transfer (resulting in ctrl signal without data signal)
                            // would cause a race condition error downstream, hence the fix below to transfer
                            // data even if it may be empty. (consider it as a nudging data flow)
                            _outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                            //if (!israw) {
                            //    //if (Object.keys(_next_data).length > 0) // filter empty dictionaries
                            //    //else 
                            //    //    console.log("start debugging, potentially causing a race condition error");
                            //}
                            //else { // if "raw" flag is on, send dictionaries in the data flow, whether empty or not.
                            //    _outflow_data$.next(isbottled ? doBottle("mix", _next_data) : _next_data); // publish the next available post-processed data via the data flow subject channel
                            //}
                        }
                        return of(_combined_in[0]); // only pass the ctrl data in the main flow;
                    }),
                    share()
                );
                return {_stream: _outflow_data$.pipe(
                    //skipUntil(_outflow_ctrl$),
                    map(x => {
                        const _rt_cache = {...node_context};
                        return x;
                    }),
                    share()
                ), _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }
        );

        //const zipMultipleArr = (...arr) => Array.from({ length: Math.max(...arr.map(a => a.length)) }, (_, i) => arr.map(a => a[i]));

        //const _re = /[\w\s]*\{([\w]+)\}[\w]*/g;
        //const teststr1 = 'hello{idx}wh';
        //console.log(stringFormat(teststr1, {idx: 'WHAT'}));

        return (input$objArr, controlflow$obj) => {
            //const outflow_data$ = new ReplaySubject(1);
            if (input$objArr.length > 1) {
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

                    const unbottlefunc = (_data_in) => {
                        const _rt_cache = {idxcache, loopydata_cache};
                        //const _data_out = doUnbottle(undefined, _data_in);
                        const _data_out = _data_in;
                        return _data_out;
                    };

                    const nodectrl$ = controlflow$obj._stream;
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

                    //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
                    //chronosDataflow(_flowfunc_output$obj._control._stream, [_flowfunc_output$obj._control._stream, _flowfunc_output$obj._stream], CHRONOSTYPE_SYNC, {time: 10000})
                    //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
                    const output$obj = driveDataflowByCtrlflow(
                        {_stream: nodectrl$}, input$objArr, undefined, 
                        {...node_context, metastep: "executing leafmixflow "}, 
                        {
                            leaflogic: _defaultLambda, 
                            datalogic: {pre: unbottlefunc}
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
                const preflowfunc = (_data_in) => {
                    //const _rt_cache = {idxcache, loopydata_cache};
                    //const _data_out = doUnbottle(undefined, _data_in);
                    const _data_out = _data_in;
                    return _data_out;
                };
                const nodectrl$ = controlflow$obj._stream;
                const output$obj = driveDataflowByCtrlflow(
                    {_stream: nodectrl$}, input$objArr, undefined, 
                    {...node_context, metastep: "executing leafmixflow "}, 
                    {
                        leaflogic: _defaultLambda, 
                        datalogic: {pre: preflowfunc}
                    }
                );
                return output$obj;
                //return {...input$objArr[0], _control: controlflow$obj};
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
//(inputargs={}) => {
//    const {
//        lambdactrl,
//        lambdadata
//    } = inputargs;
//    //{lambdactrl: {gos: {subsDirectory}, user: {label=''}}, lambdadata: {lambdaFunc=x=>x, graphContextual}}
//
//    return (flowinput$) => {
//        // spark_dev_note: based on the user-define sync rule, the sync behavior is taken care of by its calling function parseLEAFNode()
//        if (lambdactrl.user.leaf.logic.args.syncrule || lambdadata.lambdaFunc) { // a non-empty rule or lambdaFunc argument
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

export { _leafmixflow };

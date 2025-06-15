import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { _leafbottle } from '../datautils/index.js';
import { map, withLatestFrom, filter, delay, concatMap, concatAll, switchAll, bufferCount, mergeMap, takeUntil, switchMap, takeWhile, share, finalize } from 'rxjs/operators';
import { flattenArray, mergeDataflows, combineDataflows, chronosDataflow, TIMEOUTBEHAVIOR_BESTEFFORT, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { from, of, mergeAll, BehaviorSubject, ReplaySubject, skip, interval, timer, take, combineLatest, Subject } from 'rxjs';
//import { red } from '@mui/material/colors';
import { isPositiveWholeNumberStr } from '../../predicates.js';
import { driveDataflowByCtrlflow, executeLEAFLogic } from '../../leaf.js';
import { doBottle } from '../datautils/bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafloopyspell.js", codebase:"/src/ghostos/api/parser/nodelogic/abstraction/leafloopyspell.js"}, {});
const getLargestCount = (dict) => {
    if (!dict)
        return 1; // defaults to 1 iteration
    const ampersand = Object.keys(dict).filter(x => x === '&');
    if (ampersand.length > 0)
        return undefined; // infinite loop if ampersand entry exists in dict
    const numberslist = Object.keys(dict).filter(x => isPositiveWholeNumberStr(x)).map(x=>parseInt(x)).sort();
    if (numberslist.length > 0)
        return numberslist[numberslist.length - 1]; // get the largest number available
    else
        return 1;
}

const getLoopInterval = (dict) => {
    // default interval of 1000 ms
    const is_stream = "stream" in dict;
    if (!dict)
        return is_stream ? 1000 : 10;

    if ("interval" in dict) {
        const intervalstr = getLargestCount(dict.interval);
        return isPositiveWholeNumberStr(intervalstr) ? parseInt(intervalstr) : undefined;
    }

    return is_stream ? 1000 : 10;
}

/*
 * _leafloopyspell() is a function in the leaf abstraction library to deal with
 * the concept of executing the logic of a set of lambda components (or lambda subgraphs) against
 * the data in the dataflow plane. It also takes care of the plurality [as well as 
 * the splicing of dataflow data, like the reactive operators 'zip' and 'map' do in series.]
 * (update: splicing is now taken care of by leafmixflow) 
 * [spark_dev_note: an example here to enhance understanding of data plurality and splicing]
 * Unlike spellbook-defined spells (i.e. the _leafspelldef defined spells), improv spells 
 * do not provide any mechanism for referencing the spells elsewhere in leaf constructs.
 * 
 */
const _leafloopyspell = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) {
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        if (["7b1f"].includes(refnode.slice(0,4)))
            console.log("start debugging");
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
        let lambdaresult$obj;

        if (["7b1f"].includes(refnode.slice(0,4)))
            console.log("start debugging");

        const is_bypass = "bypass" in reduced_lambda_obj ? true : false;
        const is_last = "last" in reduced_lambda_obj ? true : false;
        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.

        //const filterDataOfInterest = _leafdataUnbottle({bottlekey:'_leafdeck'});
        //const bottleUp = _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafloopyspell'}}}}, nodelambda: [], contextuallambda});
        const {type, args} = refnodedata.leaf.logic;

        const node_context = {
            codebase: "leafloopyspell.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        const loopcount = getLargestCount(reduced_lambda_obj);
        const loopinterval = getLoopInterval(reduced_lambda_obj);
        const is_forever = "forever" in reduced_lambda_obj;

        if (reduced_lambda_obj && '_default' in reduced_lambda_obj) {
            //const mainloop$ = loopcount > 0 ? interval(loopinterval).pipe(take(loopcount)) : interval(loopinterval);
            const mainloop$ = loopcount > 0 ? timer(0, loopinterval).pipe(take(loopcount)) : timer(0, loopinterval);
            //const loopysubject$ = (new BehaviorSubject()).pipe(skip(1));
            //const loopysubject$ = (new ReplaySubject(loopcount)); // will replay latest result upon subscription;
            //const nodeiosubject_in$ = new ReplaySubject(1);
            //const nodeiosubject_out$ = new ReplaySubject(1);
            //let loopyresultcache = [];

            //if (is_bypass) {
            //    lambdaresult$obj._stream.pipe(take(1)).subscribe({
            //        next: (x) => x,
            //        complete: () => {
            //            console.log("subs completed");
            //        }
            //    });
            //}
            //lambdaresult$obj._stream.forEach(_ => {
            //    if (is_bypass) {
            //        lambda_result.push(inputdata);
            //    }
            //    else {
            //        //lambda_result.push(_.flat()); // aggregate the result of the logic
            //        lambda_result.push(_); // aggregate the result of the logic
            //    }
            //});
            //// now time to combine the three flows
            //const combined_metadata$ = combineDataflows(refnode, [maindata$obj, spellinput$obj], false);
            //return combined_metadata$._stream
            //return is_bypass ? maindata$obj._stream : lambdaresult$obj._stream.pipe(map(_ => _.flat()));

            //const inputsubject$ = (new ReplaySubject(loopcount)); // will replay latest result upon subscription;
            //const inputsubject$ = (new BehaviorSubject()).pipe(skip(1),take(loopcount));
            //const inputsubject$ = (new BehaviorSubject()).pipe(skip(1));
            let islooping = false; // a semaphore 
            if (["7b1f"].includes(refnode.slice(0,4)))
                console.log("start debugging");

            // spark_dev_note: 29/Mar/2023
            // flowinterface, initializeFlowInterface, and _synchronizeFlow copied from eta.js
            // make the sync flow functions into a module down the road for better maintainability.
            const flowinterface = {};

            const initializeFlowInterface = (_curnode, _upstream_ctrlflow$objArr, _upstream_dataflow$objArr) => {
                // iterate through current set of nodes 
                const nodeuuid = _curnode;
                const _inputnodes = lambdactrl.gos.etaTree.leafgraph.graph.dataflow.mapInEdges(nodeuuid, (edge)=>{return lambdactrl.gos.etaTree.leafgraph.graph.dataflow.source(edge)});
                //const _upstream_output$Arr = initializeFlowInterface(_inputnodes);
                if (!(nodeuuid in flowinterface)) {
                    flowinterface[nodeuuid] = {
                        "inputnodes": _inputnodes,
                        "synchronized": false, 
                        "flowcache": {}, // used for enforcing synchronization of multiple flows
                        "initflowcache": () => {
                            flowinterface[nodeuuid].flowcache =
                                flowinterface[nodeuuid].inputnodes?.reduce((cacheLUT, cur_nodeuuid)=>{cacheLUT[cur_nodeuuid] = false; return cacheLUT;}, {});
                        },
                        "recordflow": (_flowuuid) => {
                            flowinterface[nodeuuid].flowcache[_flowuuid] = true
                        },
                        "checksync": () => {
                            const issynced = Object.values(flowinterface[nodeuuid].flowcache).reduce((pred, curbool)=>pred&&curbool, true);
                            return issynced;
                        },
                        "data_in": _upstream_dataflow$objArr.map(_stream$obj=>_stream$obj._stream),
                        "data_out": undefined,
                        "ctrl_in": _upstream_ctrlflow$objArr.map(_stream$obj=>_stream$obj._stream),
                        "ctrl_out": undefined
                    }
                    flowinterface[nodeuuid].initflowcache();
                    if (_inputnodes.length > 1) // synchronized = true, for multiple flows by default
                        flowinterface[nodeuuid].synchronized = true;
                }
                // weave upstream flows to current node's output flow
                //const dataflow_out$ = flowinterface[nodeuuid].data_in
            }
        
            const _synchronizeFlow = (nodeuuid, _upstream_out$objArr, consolidate_dataflow=false) => {
                // get the set of inputnodes wrt the current node or endnodes if current node undefined
                const datainputnodes = (nodeuuid === undefined) ? endnodes : flowinterface[nodeuuid].inputnodes;
                    // initialize flow interface
                const _synced_upstream_out$objArr =
                    _upstream_out$objArr.map((_composite$obj, idx) => {
                        const inputnode = datainputnodes.length > 0 ? datainputnodes[idx]: undefined;
                        return {
                            _stream: _composite$obj._stream,
                            _control: ((nodeuuid && flowinterface[nodeuuid].synchronized) ?
                                {_stream: _composite$obj._control._stream.pipe(
                                    map(_ctrldata => {
                                        flowinterface[nodeuuid].recordflow(inputnode); // record the incidence of flow from the inputnode 
                                        return _ctrldata; 
                                    })
                                )}:
                                {_stream: _composite$obj._control._stream.pipe(
                                    map(_ctrldata => {
                                        return _ctrldata; // do nothing to the control data
                                    })
                                )}
                            )
                        };
                    });
        
                const _upstream_dataflow$objArr = _synced_upstream_out$objArr.map(_=>{return {_stream: _._stream}});
                const _upstream_ctrlflow$Arr = _synced_upstream_out$objArr.map(_=>_._control._stream);
                // consolidate multiple control flows if any, with the traffic control via checksync
        
                // spark_dev_note: (24/Mar/2023)
                // current default consolidation method for control flow is just choosing the first one. 
                // unsure whether this would change down the road, but currently the data passed on the 
                // control flow is the same across the board. 
                // for control flow, it's the incidence of signal that matters, not the content.  
                const _upstream_controlflow$obj = {_stream: ((nodeuuid && flowinterface[nodeuuid].synchronized) ? 
                    combineLatest(_upstream_ctrlflow$Arr).pipe(
                        map( _ctrldataArr => { // array of ctrldata, due to combineLatest
                            const consolidated_ctrldata = _ctrldataArr[0]; 
        
                            if (flowinterface[nodeuuid].checksync()) { // if all incoming data synchronized
                                flowinterface[nodeuuid].initflowcache();
                                return consolidated_ctrldata;
                            }
                            // otherwise 
                            return undefined;
                        }),
                        delay(10), // delay control signal by 10ms, just in case data flow is delayed by a smidgen
                        filter(_data=>_data!==undefined)
                    ):
                    combineLatest(_upstream_ctrlflow$Arr).pipe(
                        map( _ctrldataArr => { // array of ctrldata, due to combineLatest
                            const consolidated_ctrldata = _ctrldataArr[0]; 
                            return consolidated_ctrldata;
                        }),
                        delay(10), // delay control signal by 10ms, just in case data flow is delayed by a smidgen
                        filter(_data=>_data!==undefined)
                    )
                )};
                if (!_upstream_controlflow$obj)
                    console.log("start debugging");
        
                if (!consolidate_dataflow) {
                    return [_upstream_controlflow$obj, _upstream_dataflow$objArr];
                }
                else {
                    const consolidated_dataflow$obj = {
                        _stream: _upstream_controlflow$obj._stream.pipe(withLatestFrom(..._upstream_dataflow$objArr.map(_=>_._stream))).pipe(map(_data=>_data.slice(1)))
                    }
                    return [_upstream_controlflow$obj, consolidated_dataflow$obj];
                }
            };
            
            return (input$objArr, controlflow$obj) => {
                //const mergedinput$obj = mergeDataflows(flowinput$Arr);
                //const mergedinput$obj = combineDataflows(refnode, flowinput$Arr);
                if (["7b1f"].includes(refnode?.slice(0,4)))
                    console.log("start debugging");
                //const mergedinput$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leafloopyspell.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
                const throttled_ctrlflow$obj = {_stream: controlflow$obj._stream.pipe(map(
                    _ctrl_data => 
                    {
                        if (_.throttle(()=>{}, 200)) {
                            console.log("spell executed");
                            return _ctrl_data;
                        }
                        else {
                            console.log("spell throttled");
                            return undefined
                        }
                    }),
                    filter(_data=>_data!==undefined),
                    concatMap(_ctrl_in => {
                        return from([...Array(loopcount).keys()]).pipe(map(_idx => {
                            return {..._ctrl_in, _label: {..._ctrl_in._label, loopyidx: _idx}};
                        }));
                    })
                )}

                //throttled_ctrlflow$obj._stream.pipe(
                //    concatMap(_ctrl_in => {
                //        let relayflowctrl$ = new ReplaySubject(1);
                //        relay_ctrl_in$ = of(_ctrl_in).pipe(
                //            map(_ctrl_data=> {
                //            })
                //        );

                //        return relay_ctrl_in$
                //    })
                //)

                //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
                //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000}, TIMEOUTBEHAVIOR_BESTEFFORT, {codebase: 'leafloopyspell'})}];
                if (!(reduced_lambda_obj && '_default' in reduced_lambda_obj)) { 
                    console.error(`LEAF Error: _leafloopyspell() called without a default dataflow component graph definition.`);
    
                    const defaultout$obj = driveDataflowByCtrlflow(
                        throttled_ctrlflow$obj, input$objArr, undefined, 
                        {...node_context, metastep: "relaying input data as is due to error condition"}
                    );
                    return defaultout$obj;
                }

                //const preprocessed_inflow_data$objArr =  [...Array(loopcount).keys()].map(
                //    loopidx => {
                //        
                //    }
                //);

                //input$objArr.map(_inflow$obj=>{
                //    return _inflow$obj._stream.pipe(map(_inflow_data=>{
                //        return transformation.datalogic.pre(_inflow_data); // do preprocess
                //    }))
                //});

                let idxcache = 0;
                let loopydata_cache = [];
                const preprocessfunc = (_data_in) => {
                    const _rt_cache = {idxcache, loopydata_cache};
                    //const _data_out = exitDataBus({_bus: _data_in});
                    // spark_dev_note: 18/Jun/2023, TBD: to unbottle or not to unbottle
                    // #databus
                    // The leaf version working in the dev branch of designweek
                    // expects a "_databus" bottle created using enterDataBus(), for system-level data exchange.
                    // The final release version of LEAF shall abandon the use of this "_databus" bottle convention
                    // in system-level data exchange, as it is prone to confusing LEAF users in their
                    // LEAF code debugging and reasoning processes. 
                    // From now on, any system-level data exchange in LEAF is explicitly done through bottles using 
                    // user-friendly names that would help make user-level LEAF constructs easier to debug and to reason about.
                    // This new convention will be helpful when some user-level LEAF construct has, in its dataflow space, 
                    // user-level data bottles muddled up with bottles carrying system-level data exchange.
                    // For now, the exitDataBus call here is commented out, and as an interim solution, nothing is done on
                    // the _data_in, and it is simply passed to _data_out as is. 
                    // Now, the onus is on the LEAF construct designers (or users) to only go after the bottles that concern
                    // their use cases, via using leafgate prior to passing data into leafloopyspell.
                    const _data_out = _data_in; 
                    if (!is_bypass)
                        loopydata_cache.push(_data_in);
                    return _data_out;
                };
                
                let loopymetactrl$ = new BehaviorSubject(raceConditionError);
                let loopystopper$ = new ReplaySubject(1);
                let ctrl_in_cache = undefined;
                const loopyctrl$ = throttled_ctrlflow$obj._stream.pipe(
                    switchMap(_ctrl_in=> {
                        //loopymetactrl$ = new ReplaySubject(1);
                        //loopystopper$ = new ReplaySubject(1);

                        ctrl_in_cache = _ctrl_in;
                        loopymetactrl$.next(_ctrl_in); // pass thru the incoming ctrl signal, also acting as the first index call
                        return loopymetactrl$
                    }),
                    takeUntil(loopystopper$)
                ); 

                const output$obj = driveDataflowByCtrlflow(
                    {_stream: loopyctrl$}, input$objArr, undefined, 
                    {...node_context, metastep: "executing a loopy spell with idx "+idxcache}, 
                    {
                        leaflogic: reduced_lambda_obj._default, 
                        datalogic: {
                            pre: preprocessfunc,
                            post: (_data)=> {
                                idxcache += 1; // increment idx
                                if (is_forever || idxcache < loopcount)
                                    loopymetactrl$.next(ctrl_in_cache); // next idx call

                                if (!is_bypass)
                                    return loopydata_cache[0];
                                if ('stream' in reduced_lambda_obj) // results of iteration not buffered
                                    return _data;
                                else
                                    loopydata_cache.push(_data);

                                if (idxcache === loopcount) {
                                    const _buffered_data = [...loopydata_cache]; // shallow copy
                                    // reset the caches
                                    loopydata_cache = [];
                                    idxcache = 0; 
                                    // stop the flow 
                                    //loopystopper$.next(true);
                                    // return what's been buffered
                                    return _buffered_data;
                                }

                                return undefined; // this would get filtered and never reach the data flow
                            }
                        }
                    }
                );

                return output$obj;

                //const lambdaresult$objArr = [...Array(loopcount).keys()].map(_loopidx=> {
                //    const _lambdaresult$obj = reduced_lambda_obj._default([mergedinput$obj], throttled_ctrlflow$obj); 
                //    if (is_bypass) {
                //        return {
                //            _stream: _lambdaresult$obj._stream.pipe(mergeMap(_inputdata=> {
                //                return mergedinput$obj._stream;
                //            })),
                //            _control: _lambdaresult$obj._control
                //        };
                //    }
                //    else {
                //        return _lambdaresult$obj;
                //    }

                //});

                //const [synced_upstream_controlflow$obj, synced_upstream_dataflow$obj] = 
                //('stream' in reduced_lambda_obj) ?  // results of iteration not buffered
                //  (  
                //    [
                //        {
                //            _stream: mergeDataflows(lambdaresult$objArr.map(_obj=>_obj._control._stream)),
                //        }, 
                //        {
                //            _stream: mergeDataflows(lambdaresult$objArr.map(_obj=>_obj._stream))
                //        }
                //    ]
                //  )
                //: (()=>{
                //    // initialize incoming flow for the current node
                //    // initialization of outgoing flow can be done after executing the current node's eta function
                //    initializeFlowInterface(refnode, 
                //        lambdaresult$objArr.map(_=>{ return {_stream: _._control._stream} }),
                //        lambdaresult$objArr.map(_=>{ return {_stream: _._stream }})
                //    ); 
                //    // initialize flow interface 

                //    return _synchronizeFlow(refnode, lambdaresult$objArr, true);
                //})();

                //return {...synced_upstream_dataflow$obj, _control: synced_upstream_controlflow$obj};
            };
        }
        else if (reduced_lambda_obj && 'await' in reduced_lambda_obj) {
            // condition to interpret loopyspell as a rx.js subscription awaiting until an exit condition is met 
            return (input$objArr, controlflow$obj) => {
                const throttled_ctrlflow$obj = {_stream: controlflow$obj._stream.pipe(map(
                    _ctrl_data => 
                    {
                        if (_.throttle(()=>{}, 10)) {
                            console.log("spell executed");
                            return _ctrl_data;
                        }
                        else {
                            console.log("spell throttled");
                            return undefined
                        }
                    }),
                    filter(_data=>_data!==undefined),
                    map(_ctrl_in => {
                        return [...Array(loopcount).keys()].map(_idx => {
                            return {..._ctrl_in, _label: {..._ctrl_in._label, loopyidx: _idx}};
                        });
                    })
                )};

                if (!(reduced_lambda_obj.await && '_default' in reduced_lambda_obj.await)) { 
                    console.error(`LEAF Error: _leafloopyspell() in await mode called without a default dataflow component graph definition.`);
    
                    const defaultout$obj = driveDataflowByCtrlflow(
                        throttled_ctrlflow$obj, input$objArr, undefined, 
                        {...node_context, metastep: "relaying input data as is due to error condition"}
                    );
                    return defaultout$obj;
                }

                let idxcache = 0;
                let loopydata_cache = [];
                const preprocessfunc = (_data_in) => {
                    const _rt_cache = {idxcache, loopydata_cache};
                    //const _data_out = exitDataBus({_bus: _data_in});
                    // spark_dev_note: 18/Jun/2023, TBD: to unbottle or not to unbottle
                    // #databus
                    // The leaf version working in the dev branch of designweek
                    // expects a "_databus" bottle created using enterDataBus(), for system-level data exchange.
                    // The final release version of LEAF shall abandon the use of this "_databus" bottle convention
                    // in system-level data exchange, as it is prone to confusing LEAF users in their
                    // LEAF code debugging and reasoning processes. 
                    // From now on, any system-level data exchange in LEAF is explicitly done through bottles using 
                    // user-friendly names that would help make user-level LEAF constructs easier to debug and to reason about.
                    // This new convention will be helpful when some user-level LEAF construct has, in its dataflow space, 
                    // user-level data bottles muddled up with bottles carrying system-level data exchange.
                    // For now, the exitDataBus call here is commented out, and as an interim solution, nothing is done on
                    // the _data_in, and it is simply passed to _data_out as is. 
                    // Now, the onus is on the LEAF construct designers (or users) to only go after the bottles that concern
                    // their use cases, via using leafgate prior to passing data into leafloopyspell.
                    const _data_out = _data_in; 
                    if (!is_bypass)
                        loopydata_cache.push(_data_in);
                    return _data_out;
                };
                
                //let loopymetactrl$ = new BehaviorSubject(raceConditionError);
                let loopymetactrl$ = new Subject(); 
                let loopymetadata$ = new Subject(); 
                let loopystopper$ = new Subject();
                const relay_data_out$ = new Subject(); //new BehaviorSubject({...raceConditionError, _label: {context: "relay_data_out"}});
                const loopyctrl$ = new Subject(); //new BehaviorSubject({...raceConditionError, _label: {context: "relay_ctrl_out"}});

                let ctrl_in_cache = undefined;
                let op_subs = undefined;

                // construct await function stream
                const await_data_input$ = new Subject(); 
                const await_ctrl_input$ = new Subject(); 
                const await_output$obj = reduced_lambda_obj.await._default([{_stream: await_data_input$}], {_stream: await_ctrl_input$});

                const relay_ctrl_out$ = throttled_ctrlflow$obj._stream.pipe(
                    withLatestFrom(...input$objArr.map(_$obj=>_$obj._stream)),
                    switchMap(_combined_in=> {
                        const _ctrl_in = _combined_in[0];
                        const _data_in = _combined_in[1];
                        ctrl_in_cache = _ctrl_in;

                        if (op_subs !== undefined && !op_subs.closed) {
                            loopymetadata$.next(_data_in);
                            loopymetactrl$.next(_ctrl_in); // pass thru the incoming ctrl signal, also acting as the first index call
                            return loopyctrl$; 
                        }

                        // initialize cache vars
                        idxcache = 0;
                        loopydata_cache = [];
                        loopystopper$.next(); // kill any previously running loopyloop op subscription

                        // now establish a loopyloop op subscription
                        console.log("establishing a new loopyloop op subs");
                        const output$obj = driveDataflowByCtrlflow(
                            {_stream: loopymetactrl$}, [{_stream: loopymetadata$}], undefined, 
                            {...node_context, metastep: "executing a loopy spell with idx "+idxcache}, 
                            {
                                datalogic: {
                                    pre: preprocessfunc,
                                    post: (_data)=> {
                                        idxcache += 1; // increment idx
                                        //if (idxcache < loopcount)
                                        //    loopymetactrl$.next(ctrl_in_cache); // next idx call

                                        if (!is_bypass)
                                            return loopydata_cache[0];
                                        if ('stream' in reduced_lambda_obj) // results of iteration not buffered
                                            return _data;
                                        else
                                            loopydata_cache.push(_data);

                                        if (idxcache === loopcount) {
                                            const _buffered_data = [...loopydata_cache]; // shallow copy
                                            // reset the caches
                                            loopydata_cache = [];
                                            idxcache = 0; 
                                            // stop the flow 
                                            //loopystopper$.next(true);
                                            // return what's been buffered
                                            if (loopcount === 1)
                                                return _buffered_data[0];
                                            else
                                                return _buffered_data;
                                        }

                                        return undefined; // this would get filtered and never reach the data flow
                                    }
                                }
                            }
                        );

                        let _data_cache;
                        op_subs = output$obj._control._stream.pipe(
                            withLatestFrom(output$obj._stream),
                            switchMap(_combined_in => {
                                _data_cache = _combined_in;

                                // relay signals
                                //if (!is_last) {
                                //    relay_data_out$.next(_combined_in[1]);
                                //    relay_ctrl_out$.next(_combined_in[0]);
                                //    loopyctrl$.next(ctrl_in_cache);
                                //}
                                // the following leaflogic evaluates subs exit condition
                                //return executeLEAFLogic(reduced_lambda_obj.await._default, _combined_in[1]);
                                await_data_input$.next(_combined_in[1]);
                                await_ctrl_input$.next(_combined_in[0]);
                                return await_output$obj._control._stream;
                            }),
                            withLatestFrom(await_output$obj._control._stream),
                            withLatestFrom(await_output$obj._stream),
                            map(_combined_await_out => {
                                return _combined_await_out[1]; // only return the data component
                            }),
                            map(_exit_cond=>{
                                console.log("_exit_cond");
                                if (_exit_cond) {
                                    console.log("leafloopyspell exit condition met, stopping loopy spell subscription...");
                                    //loopyctrl$.next(ctrl_in_cache);
                                    relay_data_out$.next(_data_cache[1]);
                                    //ctrl_in_cache = _data_cache[0];
                                    ctrl_in_cache = _data_cache[0];
                                    loopystopper$.next(); // kill the current loopyloop op subscription
                                }
                                return _exit_cond;
                            }),
                            takeUntil(loopystopper$),
                            //takeWhile(_exit_cond => {
                            //    //if (is_last) {
                            //    //    if (_exit_cond) {
                            //    //        relay_data_out$.next(_data_cache[1]);
                            //    //        relay_ctrl_out$.next(_data_cache[0]);
                            //    //        loopyctrl$.next(ctrl_in_cache);
                            //    //    }
                            //    //}
                            //    //else {
                            //    //    relay_data_out$.next(_data_cache[1]);
                            //    //    relay_ctrl_out$.next(_data_cache[0]);
                            //    //}

                            //    if (_exit_cond) {
                            //        console.log("leafloopyspell exit condition met, stopping loopy spell subscription...");
                            //        //loopyctrl$.next(ctrl_in_cache);
                            //        return false;
                            //    }
                            //    return true;
                            //}, true)
                        ).subscribe(
                            {
                                next: _combined_in => {
                                    console.log("leafloopyspell in await mode had a leaf mesg _combined_in arrive: ", _combined_in);
                                },
                                error: _err => {
                                    console.error("leafloopyspell in await mode had an error: ", _err);
                                },
                                complete: () => {
                                    //loopyctrl$.next(_data_cache[0]);
                                    console.log("leafloopyspell in await mode had completed");
                                }
                            }
                        );


                        loopymetadata$.next(_data_in);
                        loopymetactrl$.next(_ctrl_in); // pass thru the incoming ctrl signal, also acting as the first index call
                        //return _ctrl_in;
                        return loopyctrl$; 
                    }),
                    map(_ctrl_in => {
                        return _ctrl_in;
                    }),
                    finalize( () => { 
                        console.log('Finally'); 
                        if (op_subs !== undefined) {
                            op_subs.unsubscribe();
                            op_subs = undefined;
                        }
                    }),
                    filter(_data=>_data!==undefined),
                    share()
                );


                return {
                    _stream: (!(reduced_lambda_obj.final && '_default' in reduced_lambda_obj.final) ? 
                        relay_data_out$.pipe(
                            filter(_outflow_data => JSON.stringify({..._outflow_data, _label: {}}) !== JSON.stringify(raceConditionError)),
                            map(_data_out => {
                                //loopyctrl$.next(ctrl_in_cache);
                                setTimeout(() => {
                                    loopyctrl$.next(ctrl_in_cache);
                                }, 0);
                                return _data_out;
                            }),
                            share()
                        ) :
                        relay_data_out$.pipe(
                            filter(_outflow_data => JSON.stringify({..._outflow_data, _label: {}}) !== JSON.stringify(raceConditionError)),
                            switchMap(_data_out => {
                                return executeLEAFLogic(reduced_lambda_obj.final._default, _data_out);
                            }),
                            map(_data_out => {
                                setTimeout(() => {
                                    loopyctrl$.next(ctrl_in_cache);
                                }, 0);
                                return _data_out;
                            }),
                            share()
                        )
                    ), 
                    _control: {
                        _stream: relay_ctrl_out$.pipe(
                            map(_ctrl_out => {
                                return _ctrl_out;
                            }),
                            share()
                        )
                    }
                }
            };
        }
        else {
            console.error(`LEAF Error: _leafloopyspell() called (${refnode}) is missing a default dataflow component graph definition.`);
            return (input$Arr, controlflow$obj) => {
                const input$obj = mergeDataflows(input$Arr);
                return {...input$obj, _control: controlflow$obj};
            }; // identity function
        }
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const input$obj = mergeDataflows(input$Arr);
                const output$obj = etafunc([input$obj], controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafloopyspell };

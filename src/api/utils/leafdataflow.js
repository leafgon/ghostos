import { race, delay, skip, bufferTime, filter, bufferCount, take, repeat, interval, of, from, zip, map, merge, mergeAll, switchAll, mergeMap, combineLatest, combineLatestWith, withLatestFrom, concatAll, BehaviorSubject, concatMap, Subject, switchMap, share } from 'rxjs';
import { isBottle, isCrate, isErrorBottle, isPrimitiveType } from '../parser/predicates.js';
import { rxTimeoutStream } from '../parser/eta.js';
import { v4 as uuid4, v5 as uuid5 } from 'uuid';
import { doBottle } from '../parser/nodelogic/datautils/bottling.js';

const LEAFBufferTimeSpan = 200; // ms
const LEAFBufferCreationInterval = 100; // ms
const LEAFNodeInflowBufferSize = 100;

// as per https://quickref.me/zip-multiple-arrays
// zipMultipleArrs(['a', 'b', 'c', 'd', 'e'], [1, 2, 3, 4, 5]);   // [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]]
/*
Does it look like a zipper?
        a 1
        b 2
       c   3
      d     4
     e       5
*/
const zipMultipleArrs = (...arr) =>
    Array.from({ length: Math.max(...arr.map(a => a.length)) }, (_, i) => arr.map(a => a[i]));

const isArrayOfArrays = (a) => {
    return a.every(x => Array.isArray(x));
}

const flattenArray = (x) => Array.isArray(x) ? x.flatMap(_x=>_x) : x;

const pickMainStream = (flow$Arr, mainlabel='main') => {
    let mainstream$obj, auxstream$Arr;
    // pick mainstream$
    if (mainlabel) {
        const mainidx = flow$Arr.findIndex(element => mainlabel in element);

        if (mainidx > -1) {
            mainstream$obj = flow$Arr[mainidx];
            auxstream$Arr = flow$Arr.filter((element, idx) => idx !== mainidx);
        }
        else {
            mainstream$obj = flow$Arr[0];
            auxstream$Arr = flow$Arr.slice(1);
        }
    }
    else {
        mainstream$obj = flow$Arr[0];
        auxstream$Arr = flow$Arr.slice(1);
    }

    return {mainstream$obj, auxstream$Arr};
}

// make sure to let the lossy nature of this mode of mixing clearly known as it may make
// leaf debugging real difficult if a lossy mixing isn't wielded well.
const zipDataflows = (nodeuuid, flow$Arr, mainlabel=undefined, pairLatestAux=true, flowUnpairedAux=false) => {
    const filtered$Arr = flow$Arr.filter(x=>x);
    if (filtered$Arr.length > 1) { // zip requires a minimum of two streams
        // https://stackoverflow.com/questions/46602541/rxjs-lossy-form-of-zip-operator <- rubbish
        //const zipped_stream$ = zip(...filtered$Arr.map(_x=>_x.pipe(take(1)))).pipe(repeat());
        // pick mainstream$
        const {mainstream$obj, auxstream$Arr} = pickMainStream(filtered$Arr, mainlabel);
        
        let cursubs = undefined;
        const mainsubject$ = (new BehaviorSubject()).pipe(skip(1)); // skip the default value

        const auxstream$obj = {_stream: combineLatest(auxstream$Arr.map(x=>x._stream)).pipe(
            //bufferTime(LEAFBufferTimeSpan), //, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize,
            map(x => x.flat().flat()),
            //map(x => { // get the latest (ie the last array element) from the buffer
            //    if (x && x.length > 0) 
            //        return x[x.length -1]; 
            //    else 
            //        return x;
            //}),
        )};  
        //const auxstream$obj = combineDataflows(auxstream$Arr);
        // test

        //mainstream$obj._stream.subscribe({
        //    next: x => {
        //        console.log(x);
        //        return x;
        //    }
        //})
        //auxstream$obj._stream.subscribe({
        //    next: x => {
        //        console.log(x);
        //        return x;
        //    }
        //})

        // end of test

        if (pairLatestAux) {
            const mainstream$ = mainstream$obj._stream; //.pipe(multicast(mainsubject$)); // refCount()
            const preoutput$ = mainstream$.pipe(
                delay(LEAFBufferTimeSpan),
                map(
                    x => {
                        console.log(nodeuuid);
                        return x;
                    }
                ),
            //    bufferTime(LEAFBufferTimeSpan),
                map(x => { // get the latest (ie the last array element) from the buffer
                    return ((x.length > 0) ? [x[x.length -1]] : [x]);
                }),
            ).pipe(
                withLatestFrom(
                    race(
                        auxstream$obj._stream,
                        //...auxstream$Arr.map(aux=>aux._stream.pipe(
                        //    bufferTime(LEAFBufferTimeSpan),
                        ////    map(x => { // get the latest (ie the last array element) from the buffer
                        ////        return ((x.length > 0) ? x[x.length -1] : x);
                        ////    }),
                        //)),
                        of([]).pipe(delay(LEAFBufferTimeSpan)), // default in case the above didn't return for some reason
                        //of([]) // default in case the above didn't return for some reason
                    )
                ),
            ).pipe(
                map(x => {
                    //console.log('yeah:', x);
                    if (isArrayOfArrays(x)) {
                        const filteredx = x.flat().filter(x=>x).map(x=>[x]); // remove [undefined] in x
                        const zippedArrs = zipMultipleArrs(...filteredx);
                        //console.log('zippedArrs: ', JSON.stringify(zippedArrs));
                        return zippedArrs; //.flat();
                    }
                    else {
                        if (x)
                            return Array.isArray(x) ? x : [x]; 
                    }
                }),
            )

            //const processedoutput$ = (new BehaviorSubject()).pipe(skip(1))
            //let latestAux = undefined; // a local cache

            //preoutput$.subscribe({
            //    next: (x) => {
            //        const curaux = x[1];
            //        if (curaux.length > 0) {
            //            latestAux = curaux;
            //        }
            //        processedoutput$.next([x[0]].concat(latestAux)); // relay processed flows
            //    },
            //    error: (x) => {
            //        console.log(x);
            //    },
            //    complete: (x) => {
            //        console.log(x);
            //    }
            //});
            return {_stream: preoutput$}; //.pipe(filter(x=>x));
        }
        else {
            // this auxstream$obj subscription block makes mainsubject$ flow solo until auxstream$ gets available
            // at which point the zipped data of mainsubject and auxstream get emitted together
            const subshandle = auxstream$obj._stream.subscribe({
                next: x => {
                    if (!cursubs && x.length === 0) { // [] in aux flow and no innerloop subs (ie initial boundary condition)
                        //const innerloop$ = interval(1000);
                        cursubs = mainstream$obj._stream.subscribe({
                            next: _x => {
                                mainsubject$.next(_x);
                            },
                            complete: () => {
                                cursubs.unsubscribe();
                            }
                        });
                    }
                    else if (x.length > 0) { // upon hitting non-empty aux input flow 
                        //const innerloop$ = interval(1000);
                        if (cursubs) {
                            cursubs.unsubscribe(); // clear previous round's innerloop subscription
                        }
                        cursubs = mainstream$obj._stream.subscribe({
                            next: _x => {
                                mainsubject$.next([_x, x].flat()); // start emitting zipped tuples
                            },
                            complete: () => {
                                if(cursubs)
                                    cursubs.unsubscribe();
                            }
                        });
                    }
                },
                complete: () => {
                    if (subshandle)
                        subshandle.unsubscribe();
                }
            });
            let output$;
            if (flowUnpairedAux) { // this option allows flowing thru the aux streams before the main stream takes place
                // to use switchAll() as per https://indepth.dev/posts/1114/learn-to-combine-rxjs-sequences-with-super-intuitive-interactive-diagrams
                const h = interval(100).pipe(take(2), map(i => [auxstream$obj._stream, mainsubject$][i]));
                output$ = h.pipe(
                    //mergeMap(x => {})
                    switchAll(), // this allows auxstream$ to go through once before mainstream$ becomes ready
                    map(x => {
                        console.log('yeah:', x);
                        if (isArrayOfArrays(x)) {
                            const filteredx = x.flat().filter(x=>x).map(x=>[x]); // remove [undefined] in x
                            const zippedArrs = zipMultipleArrs(...filteredx);
                            console.log('zippedArrs: ', JSON.stringify(zippedArrs));
                            return zippedArrs;
                        }
                        else {
                            if (x)
                                return [x]; 
                        }
                    })
                );
            }
            else { // this option makes aux streams wait for the main stream to occur before they both can flow
                output$ = mainsubject$.pipe(
                    //mergeMap(x => {})
                    map(x => {
                        console.log('yeah:', x);
                        if (isArrayOfArrays(x)) {
                            const filteredx = x.flat().filter(x=>x).map(x=>[x]); // remove [undefined] in x
                            const zippedArrs = zipMultipleArrs(...filteredx);
                            console.log('zippedArrs: ', JSON.stringify(zippedArrs));
                            return zippedArrs;
                        }
                        else {
                            if (x)
                                return [x]; 
                        }
                    })
                );
            }
            return {_stream: output$}; //.pipe(filter(x=>x));
        }
    }
    else if (filtered$Arr.length > 0) {
        return filtered$Arr[0];
    }
};

const naiveZipDataflows = (flow$Arr) => {
    const filtered$Arr = flow$Arr.filter(x=>x);
    if (filtered$Arr.length > 0) {
        const zipflow$ = zip(...filtered$Arr.map(x=>x._stream.pipe(
            bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
            map(x=>flattenArray(x)), // buffering adds additional array layer that needs to be stripped away.
            map( x => {
                console.log("data being zipped:", x);
                return x;
            })
        )));

        const output$ = zipflow$.pipe(
            //mergeMap(x => {})
            map(x => {
                console.log('yeah:', x);
                if (x.length > 1) {
                    const zippedArrs = zipMultipleArrs(...x);
                    console.log('zippedArrs: ', JSON.stringify(zippedArrs));
                    return zippedArrs;
                }
                else {
                    return x;  
                }
            })
        );
        return {_stream: output$};
    }
    //else if (filtered$Arr.length === 1)
    //{
    //    const output$ = filtered$Arr[0]._stream.pipe(x => {
    //        console.log(x);
    //        return x;
    //    });
    //    return {_stream: output$};

    //    //return filtered$Arr[0];
    //}
};

const combineDataflows = (nodeuuid, flow$Arr, isflatten=false, iscomposite=false, exitbus=false, context={}) => {
    if (!("etaTree" in context)) 
        console.log("start debugging");
    
    //console.log('entering combineDataflows()', context, context?.etaTree?.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid)?.leafnode.data);
    const filtered$Arr = flow$Arr.filter(x=>x);
    if (filtered$Arr.length > 1) { // zip requires a minimum of two streams
        //console.log('entering combineDataflows()', context, context?.etaTree?.leafgraph.graph.dataflow.getNodeAttributes(nodeuuid)?.leafnode.data);
        const combinedflow$obj = {
            _stream: of("ctrl_nudge").pipe(
                concatMap(_ctrl_in => {
                    return combineLatest(flow$Arr.map(x=>x._stream)).pipe(map( _=>{
                        //const resolved_ = await Promise.resolve(_); // as per the discussion in https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise
                        if (nodeuuid?.slice(0,4) === "9857")
                            console.log("combineDataflows() stream content:",_, isflatten);

                        const _combined_data = exitbus ? exitDataBus({_bus: _, _flatten: isflatten}) : _;
                        const combined_data = (!exitbus && isflatten && Array.isArray(_combined_data)) ? _combined_data.filter(_=>_).flat() : _combined_data;
                        
                        return combined_data;
                        //if (isflatten)
                        //    return resolved_.flat();
                        //else
                        //    return resolved_;
                    }))
                })
            ),
        };// default to zipping multiple streams
        if (iscomposite) {
            combinedflow$obj._control = {
                _stream: of("ctrl_nudge").pipe(
                    concatMap(_ctrl_in=> {
                        return combineLatest(flow$Arr.map(x=>x?._control?._stream).filter(_=>_)).pipe(map( _=>{
                            // spark_dev_note: (23/Mar/2023)
                            // #ctrl_accio
                            // always flatten control signal, check if this should be an intact accio bottle with 'ctrl_accio'? 
                            return Array.isArray(_) ? _.flat() : _; 
                        }))
                    })
                )
            };
        }

        return combinedflow$obj;
        //// https://stackoverflow.com/questions/46602541/rxjs-lossy-form-of-zip-operator <- rubbish
        ////const zipped_stream$ = zip(...filtered$Arr.map(_x=>_x.pipe(take(1)))).pipe(repeat());
        //// pick mainstream$
        //const {mainstream$obj, auxstream$Arr} = pickMainStream(filtered$Arr);

        //const combined_stream$ = mainstream$obj._stream.pipe(
        //    bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
        //    map(x=>flattenArray(x)),
        //    combineLatestWith(...auxstream$Arr.map(x=>x._stream.pipe(
        //        bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
        //        map(x=>flattenArray(x))
        //    )))
        //); //combineLatest(...filtered$Arr);

        //const output$ = combined_stream$.pipe(
        //    //mergeMap(x => {})
        //    map(x => {
        //        console.log('yeah:', x);
        //        if (isArrayOfArrays(x)) {
        //            const zippedArrs = zipMultipleArrs(...x);
        //            console.log('zippedArrs: ', JSON.stringify(zippedArrs));
        //            return zippedArrs;
        //        }
        //        else {
        //            return [x]; 
        //        }
        //    })
        //);
        //return {_stream: output$.pipe(filter(x=>x))};
    }
    else if (filtered$Arr.length > 0) {
        // spark_dev_note: (22/Mar/2023)
        // currently no check is done wrt the "iscomposite" flag from the argument for single flows,
        // hence any composite flow would be returned as a composite regardless of how the flag is set.
        // have yet to run into edge cases where this may cause issues. till then... ciao
        return {...filtered$Arr[0], _stream: filtered$Arr[0]._stream.pipe(
            map(_data => {
                const _rt_cache = {...context};

                if (nodeuuid?.slice(0,4) === "9857")
                    console.log("combineDataflows() stream content:",_data, isflatten);

                return _data;
            })
        )};
    }
    else {
        return undefined;
    }
};

const substituteDataflows = (flowinput$Arr, dictionary_keys) => {
    const dictflow$Arr = flowinput$Arr.filter(x=>(dictionary_keys.some(_key=>_key in x)));
    const dataflow$Arr = flowinput$Arr.filter(x=>(dictionary_keys.every(_key=>!(_key in x))));
    const stringFormat = (_str, _dict) => {
        return _str.replace(
            /\{([\w\s]+)\}/g,
            function (_, key) { return _dict[key]; });
    };
    const substituteUnitdataByDict = (_unitdata, _dictionary) => {
        if (isBottle(_unitdata)) {
            return {..._unitdata, _content: substituteUnitdataByDict(_unitdata._content, _dictionary)};
        }
        else if (isCrate(_unitdata)) {
            return {..._unitdata, _crate: _unitdata._crate.map( x => substituteUnitdataByDict(x, _dictionary))};
        }
        else if (Array.isArray(_unitdata)) {
            return _unitdata.map( x => substituteUnitdataByDict(x, _dictionary));
        }
        else if (typeof _unitdata === "object")
        {
            //const substitutionList = Object.entries(_unitdata).map((([_key, _val]) => {
            //    const keyval_obj = {};
            //    keyval_obj[_key] = substituteUnitdataByDict(_val, _dictionary);
            //    return keyval_obj;
            //}));
            const substituteobj = Object.assign({}, 
                ...Object.entries(_unitdata).map((([_key, _val]) => {
                    return {[_key]: substituteUnitdataByDict(_val, _dictionary)}
                }))
            );
            return substituteobj
        }
        else if (typeof _unitdata === "string") {
            const formatted_data = stringFormat(_unitdata, _dictionary);
            console.log('inter:', JSON.stringify(formatted_data));
            return formatted_data;
        }
        else { // any other primitive js types such as Number, Boolean, Undefined, Symbol, or BigInt
            return _unitdata; // return untouched
        }
    };
    //let merged_dict = {}
    //dictflow$Arr.map(flow$obj => {
    //    flow$obj._stream.pipe(
    //        map(x => {
    //            merged_dict = {...merged_dict, ...x};
    //        })
    //    );
    //});
    //const merged_dict$obj = mergeDataflows(dictflow$Arr);
    const merged_data$obj = mergeDataflows(dataflow$Arr);
    const zipped_stream$ = merged_data$obj._stream.pipe(
        bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
        map(x => {
            console.log(x);
            return x;
        }),
        map(x=>flattenArray(x)),
        withLatestFrom(...dictflow$Arr.map(x=>x._stream.pipe(
            bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
            map(x=>flattenArray(x))
        ))),
        map(x => {
            console.log(x);
            return x;
        })
    ); //combineLatest(...filtered$Arr);
    const substitutedflow$obj = {
        _stream: zipped_stream$.pipe(
            //map(x=>flattenArray(x)),
            map((_zipped_data)=> {
                console.log(_zipped_data);
                const _data = flattenArray(_zipped_data[0]);
                const _dictlist = flattenArray(_zipped_data.slice(1)).filter(x=>(!Array.isArray(x) && typeof x === 'object'));
                const _dict = Object.assign({}, ..._dictlist); // https://dev.to/devtronic/javascript-map-an-array-of-objects-to-a-dictionary-3f42
                const substituted = substituteUnitdataByDict(_data, _dict);
                console.log(substituted);
                return substituted;
            })
        )
    };
    return substitutedflow$obj;
}

const concatDataflows = (flow$Arr) => {
    const filtered$Arr = flow$Arr.filter(x=>x);
    if (filtered$Arr.length > 1) {
        const concat_stream$ = filtered$Arr.map(x=>x._stream//.pipe(
        //    bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
        //    map(x=>flattenArray(x))
        //)
        ).pipe(concatAll());

        return {_stream: concat_stream$};
    }
    else if (filtered$Arr.length > 0) {
        return filtered$Arr[0];
    }
};

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafdataflow.js", codebase:"/src/ghostos/api/utils/leafdataflow.js"}, {});
const TIMEOUTBEHAVIOR_BESTEFFORT = 0; //"besteffort";
const TIMEOUTBEHAVIOR_ALLORNOTHING = 1; //"allornothing";
const CHRONOSTYPE_SYNC = 0;
const CHRONOSTYPE_ASYNC = 1;
const LEAFDataflowTimeout = -1; // -1 for disabling timeout, 0 or greater for specifing timeout in milliseconds
// spark_dev_note: 18/Jul/2023
// #chronos
// chronosDataflow is a function that takes as input a ctrl$ stream and an array flow$Arr, of size >= 0, of data streams.
// it applies and enforces various rules that govern data events in flow streams, taking place with respect to certain chronological patterns.
// Chronological patterns to underpin the regulation of flow events in LEAF can be defined in terms of chronostype and gates.
// chronostype is used to specify whether a flow stream is synchronized with any other flows or not, hence bears the binary
// value of either CHRONOSTYPE_SYNC (0) or CHRONOSTYPE_ASYNC (1).
// gates is used to specify any flow gating conditions in terms of time, count, bottle-signal and/or lambda-signal, each of which
// can be defined as follows:
//  * time gate is of integer type, -1 or a value >= 0.
//  * count gate is of integer type, -1 or a value >= 0.
//  * bottle gate is of LEAF bottle type, a json of {_bname, _content, _labels}
//  * lambda gate is of LEAF lambda function, a placeholder for future implementation, left undefined atm
//
// other misc setups to consider
//  * time gating timeout behavior
//    - TIMEOUTBEHAVIOR_BESTEFFORT: wait for all streams to resolve either by timeout or by data instance. the resolved data array slice from multiple flow streams may carry timeout error bottles in place of data instances.
//    - TIMEOUTBEHAVIOR_ALLORNOTHING: stop waiting for data resolution as soon as the first timeout occurrs.
//
// metadata: for passing information used for internal js level debugging
// metactrl$: for experimenting with meta control signaling, I don't have specific use for this pipe as yet.
// it has some use in the process of understanding how to make rx.js work as intended, as an alternate way to probe signals being sent through pipes.
const chronosDataflow = (
    ctrl$, 
    flow$Arr, 
    passctrl=false,
    chronostype=CHRONOSTYPE_SYNC, 
    gates={time: LEAFDataflowTimeout, count: -1, bottle: undefined, lambda: undefined}, 
    timeoutBehavior=TIMEOUTBEHAVIOR_BESTEFFORT, metadata={}, metactrl$=undefined,
    traceon=false
) => {
    //flow$Arr is assumed to be without any undefined flow streams, like so obtainable using flow$Arr.filter(x=>x);
    const _pipe_cache = {
        curpipe$Arr: [],
        pipesub$Arr: [],
        data_in: [],
        ctrl_in: undefined,
        floodgates: [],
        isready: true,
        synccount: 0
    };

    const numflows = flow$Arr.length;
    // initialize pipes
    flow$Arr.map((_nextflow$, _curidx) => {
        _pipe_cache.curpipe$Arr.push(_nextflow$);
        _pipe_cache.pipesub$Arr.push(new Subject());
        //_pipe_cache.pipesub$Arr.push(new BehaviorSubject(raceConditionError));
        _pipe_cache.floodgates.push(0);
    });

    //const doCountGate = (_data, _count) => {
    //  if (_count > -1 && _pipe_cache.floodgates[_curidx] === _count) {
    //    console.log("midflow rxTimeoutStream: out of scope:", _curidx, _resolved); return undefined;
    //  }

    //  if (_data._bname !== "error") {
    //    _pipe_cache.floodgates[_curidx] = 1;
    //    console.log("midflow rxTimeoutStream: timed in.", _curidx, _resolved);
    //    clearTimeout(_timerarr[_curidx]);
    //    return _resolved;
    //  }
    //  else {
    //    _pipe_cache.floodgates[_curidx] = 1;
    //    console.log("midflow rxTimeoutStream: timed out.", _curidx, _resolved, Date.now());
    //    return {_bname: "error", _content: "error_bottle", _labels: {_curidx}};
    //  }
    //};

    const _do_switchMap = (_ctrl$, _flow$Arr, _timerarr) => {
        if (_pipe_cache.ctrl_in._bname === "error") {
            console.error("_ctrl_in has error, start debugging");
            if(metadata.endnodes?.includes('d3553691-cdc9-4cc1-815f-e629a94899cd')) {
                console.log("_ctrl_in has error, start debugging");
            }
        }
        console.log("processing idx: ", _pipe_cache.ctrl_in, metadata, Date.now());

        if (metadata.refnode === "df28627c-9d48-4be4-bc67-05813c32dce1")
            console.log("start debugging");
        if (metadata.refnode === "19ec3d65-7361-4a37-95be-c0f30ecedd3f")
            console.log("start debugging");
        const datain$arr = ((gates.time >= 0) ?
            _flow$Arr.map((_nextflow$, _curidx)=> {
                if(_timerarr[_curidx]?.timerref)
                    console.log("start debugging")
                _timerarr[_curidx]?.timerref && clearTimeout(_timerarr[_curidx].timerref);
                _timerarr[_curidx] = {
                    timeruuid: uuid4(),
                    timerref: setTimeout(()=>{
                        //const _rt_cache = {_ctrl_in, metadata};
                        console.log("timeout timer went off", _curidx, metadata);
                        _pipe_cache.pipesub$Arr[_curidx].next({_bname: "error", _content: "error_bottle", _labels: {...metadata, flowidx: _curidx}});
                    }, gates.time)
                };
                console.log("setTimeout():",Date.now(), _curidx, _timerarr[_curidx].timeruuid, _timerarr[_curidx].timerref);
                //_nextflow$.next("test");

                const merged$ = merge(
                    _nextflow$, // data in from the node flow
                    _pipe_cache.pipesub$Arr[_curidx], // time out error
                );
                return merged$.pipe(
                    map(_resolved => {
                        if (gates.count > -1 && _pipe_cache.floodgates[_curidx] === gates.count) {
                            console.log("midflow rxTimeoutStream: out of scope:", _curidx, _resolved); return undefined; }

                        if (_resolved._bname !== "error") {
                            gates.count > -1 && (_pipe_cache.floodgates[_curidx] = 1);
                            console.log("midflow rxTimeoutStream: timed in.", _curidx, _resolved, metadata);
                            if(!_timerarr[_curidx]) 
                                console.log("start debugging")
                            if (_timerarr[_curidx]?.timerref) {
                                clearTimeout(_timerarr[_curidx].timerref);
                                delete _timerarr[_curidx];
                            } 
                            return _resolved;
                        }
                        else {
                            gates.count > -1 && (_pipe_cache.floodgates[_curidx] = 1);
                            console.log("midflow rxTimeoutStream: timed out.", _curidx, _resolved, Date.now(), _pipe_cache.ctrl_in, metadata);
                            return {_bname: "error", _content: "error_bottle", _labels: {_curidx}};
                        }
                    }),
                    //filter(_data_in=>_data_in)
                );
            }) :
            _flow$Arr.map((_nextflow$, _curidx)=> { // case of indeifinitely awaiting all the data flow streams to resolve into an array of data instances at time t.
                return _nextflow$.pipe(
                    map(_resolved => {
                        return _resolved;
                    }),
                    //filter(_data_in=>_data_in)
                );
            })
        );

        return ((datain$arr.length === 1) ? 
            datain$arr[0] :
            ((chronostype === CHRONOSTYPE_SYNC) ? 
                //_ctrl$.pipe(
                //    map(_ctrl_in=> {
                //        console.log("_ctrl_in:", _ctrl_in);
                //        return _ctrl_in;
                //    }),
                //    withLatestFrom(...datain$arr),
                //    map(_combined_in=>{
                //        if (_combined_in?.length === 2)
                //            return _combined_in[1];
                //        else
                //            return _combined_in.slice(1)
                //    })
                //) : 
                combineLatest(datain$arr) :
                merge(...datain$arr)
            )
        );
    }

    // spark_dev_note: 31/July/2023
    // this note explains how synced_pipe$ is created and operated, along with its significance in achieving 
    // temporal synchronicity among multiple streams. 
    // ctrl$ is is the main stream pipe used to carry ctrl data. An instance of ctrl data is a special LEAF bottle
    // called "accio_ctrl" carrying data and metadata about the nature of the current data being passed, including but not limited to,
    // origin, data travel traces, invocation index/order and leafnode uuid among others.
    // chronosDataflow() synchronizes multiple data streams using ctrl cues (ctrl_accio bottles) as a frame of reference.
    // In other words, the incidence of a ctrl_accio bottle in the ctrl pipe is used as a temporal event
    // with which the materialization of data-flow events in respective data stream pipes is regulated or gated.
    // how synced_pipe$ is initially created depends on few parameters such as passctrl and numflows.
    // Somewhat repetitive a coding structure below, differentiating four different options offerred by the permutation of these parameters 
    // is deliberately designed to be so, for the purpose of runtime efficiency that minimizes conditional branches
    // when data flow takes place. 
    const _sync_pipe_cache = {};
    const _empty_bottle = {_bname: "empty", _content: "empty_data", _labels: {codebase: "leafdataflow.js chronosDataflow", ...metadata}};
    const _timerarr = {};
    const bridge_ctrl$ = new BehaviorSubject(undefined);
    const synced_pipe$ = ((passctrl) ?
        ((numflows > 0) ?
            ctrl$.pipe(
                switchMap(_ctrl_in => {
                    _pipe_cache.ctrl_in = _ctrl_in;
                    Object.values(_timerarr).map(_timerref=>{
                        if(!_timerref) 
                            console.log("start debugging")
                        clearTimeout(_timerref.timerref);
                    });
                    //return _ctrl_in;
                    //return _do_switchMap(_pipe_cache.curpipe$Arr.slice(1), _timerarr);
                    bridge_ctrl$.next(_ctrl_in); // relay signal to the bridge  
                    return _do_switchMap(bridge_ctrl$, _pipe_cache.curpipe$Arr, _timerarr);
                }),
                //withLatestFrom(_do_switchMap(_pipe_cache.curpipe$Arr.slice(1), _timerarr)),
                //switchMap(_ctrl_in => {
                //    _sync_pipe_cache._ctrl_in = _ctrl_in;
                //    Object.values(_timerarr).map(_timerref=>{
                //        if (metadata.refnode === "19ec3d65-7361-4a37-95be-c0f30ecedd3f")
                //            console.log("start debugging");
                //        if(!_timerref) 
                //            console.log("start debugging")
                //        clearTimeout(_timerref.timerref);
                //    });
                //    return _do_switchMap(_ctrl_in, _pipe_cache.curpipe$Arr.slice(1), _timerarr);
                //}),
                map(_data_in => {
                    if (metadata.refnode === "19ec3d65-7361-4a37-95be-c0f30ecedd3f")
                        console.log("start debugging");
                    console.log("processing idx after timeout retrieval: ", _data_in, Date.now());
                    if (!_data_in)
                        console.error("error _data_in null");
                    if (_data_in._bname === "error")
                        console.log("error_bottle in, start debugging");
                    return Array.isArray(_data_in) ? [_pipe_cache.ctrl_in, ..._data_in] : [_pipe_cache.ctrl_in, _data_in];
                    //return _data_in;
                }),
            ) :
            ctrl$.pipe(
                map(_ctrl_in => {
                    console.log("processing idx after timeout retrieval: ", _data_in, Date.now());
                    if (_data_in._bname === "error")
                        console.log("error_bottle in, start debugging");
                    return Array.isArray(_ctrl_in) ? [_ctrl_in[0], _empty_bottle] : [_ctrl_in, _empty_bottle];
                }),
            )
        ) :
        ((numflows > 0) ?
            ctrl$.pipe(
                switchMap(_ctrl_in => {
                    _pipe_cache.ctrl_in = _ctrl_in;
                    if (_pipe_cache.ctrl_in === undefined)
                        console.error("_ctrl_in undefined, start debugging");
                    Object.values(_timerarr).map(_timerref=>{
                        if(!_timerref) 
                            console.log("start debugging")
                        clearTimeout(_timerref.timerref);
                    });
                    //return _do_switchMap(_pipe_cache.curpipe$Arr.slice(1), _timerarr);
                    bridge_ctrl$.next(_ctrl_in); // relay signal to the bridge  
                    return _do_switchMap(bridge_ctrl$, _pipe_cache.curpipe$Arr, _timerarr);
                }),
                //withLatestFrom(_do_switchMap(_pipe_cache.curpipe$Arr.slice(1), _timerarr)),
                //switchMap(_ctrl_in => {
                //    Object.values(_timerarr).map(_timerref=>{
                //        if(!_timerref) 
                //            console.log("start debugging")
                //        clearTimeout(_timerref.timerref);
                //    });
                //    return _do_switchMap(_ctrl_in, _pipe_cache.curpipe$Arr.slice(1), _timerarr);
                //}),
                map(_data_in => {
                    if (Array.isArray(_data_in) && _data_in._bname === "error") 
                        console.log("error bottle detected, start debugging", _data_in);
                    console.log("processing idx after timeout retrieval: ", _data_in, Date.now());
                    //if (_data_in._bname === "error")
                    //    console.log("error_bottle in, start debugging");
                    return (Array.isArray(_data_in) && _data_in.length === 1) ? _data_in[0] : _data_in;
                }),
            ) :
            ctrl$.pipe(
                map(_ctrl_in => {
                    console.log("processing idx after timeout retrieval: ", _data_in, Date.now());
                    //if (_data_in._bname === "error")
                    //    console.log("error_bottle in, start debugging");
                    return _empty_bottle;
                }),
            )
        )
    );

    if (metactrl$) {
        const metactrl_sink$ = metactrl$.pipe(
            map(_meta_ctrl=> {
                console.log("metactrl$: isready : ", _meta_ctrl);

                _pipe_cache.isready = _meta_ctrl._content;
                //_pipe_cache.synccount = 0;
                _pipe_cache.floodgates = _pipe_cache.floodgates.map(_gate=>0); // reset floodgates to 0
                return _meta_ctrl;
            })
        );
        const ctrl_sink$ = ctrl$.pipe(
            concatMap(_ctrl=> {
                console.log("ctrl$ in : ", _ctrl);
                //return syncDataflows(of(_ctrl), input$arr, LEAFDataflowTimeout, "besteffort", {});
                return of(_ctrl);
            })
        );
        //const synced_pipe$ = _pipe_cache.curpipe$Arr[numflows]; //.pop(); // faster

        return merge(synced_pipe$, metactrl_sink$, ctrl_sink$);
        //return synced_pipe$;
    }
    else {
        //return _pipe_cache.curpipe$Arr[numflows]; //.pop(); // faster
        return synced_pipe$;
    }
};

// spark_dev_note: 12/July/2023
// #sync #async 
// leaf nodes, by default, wait for all incoming flows to provide input data
// from which output data are produced as per their own functions 
// combineDataflows rely on rx.js combineLatest() to enforce this synchronous dataflow in multiple input streams
// However, combineLatest() has a quirky behaviour, rather a feature than a bug, where
// once multiple input data streams are synchronously combined and returned,
// any subsequent dataflow multiples would fire each time any singole input data stream provides an instance of input data.
// this behaviour is in fact not compatible with the intended data stream combining behaviour of LEAF nodes.
// an alternative implementation strategy will be taken for enforcing this synchronous dataflow.
// that is to skewer each stream from an array of streams in a series like so implemented in syncDataflows. 
// using a series of pipes on each stream.
//const TIMEOUTBEHAVIOR_BESTEFFORT = "besteffort";
//const TIMEOUTBEHAVIOR_ALLORNOTHING = "allornothing";
const syncDataflows = (ctrl$, flow$Arr, syncTimeSpan=LEAFBufferTimeSpan, timeoutBehavior=TIMEOUTBEHAVIOR_BESTEFFORT, metadata={}) => {
    //const filtered$Arr = flow$Arr.filter(x=>x);
    const _pipe_cache = {
        curpipe$Arr: [ctrl$],
        data_in: []
    };

    const numflows = flow$Arr.length;
    if (numflows > 0) {
        flow$Arr.map((_nextflow$, _curidx) => {
            if (!_pipe_cache.curpipe$Arr[_curidx])
                console.log("start debugging");
            _pipe_cache.curpipe$Arr.push(
                _pipe_cache.curpipe$Arr[_curidx].pipe(
                    switchMap(_nudge_in => {
                        if (isErrorBottle(_nudge_in) && (timeoutBehavior === TIMEOUTBEHAVIOR_ALLORNOTHING))
                        {
                            // handle error condition here
                            _nudge_in._label.metadata = {...metadata, flowidx: _curidx-1};
                            return of(_nudge_in); // just return the error bottle to fast track any downstream error handling
                        }
                        // otherwise
                        return rxTimeoutStream(_nextflow$, syncTimeSpan, "/ghostos/api/utils/leafdataflow syncDataflows()", "LEAF Error: flow being sync'ed timed out", {...metadata});
                    }),
                    map(_data_in => {
                        if (isErrorBottle(_data_in))
                            console.log("start debugging");
                        _pipe_cache.data_in.push(_data_in);
                        if (numflows === _curidx+1)     // last data checked in
                            return numflows === 1 ? _pipe_cache.data_in[0] : _pipe_cache.data_in; // return all the collated data
                        return _data_in;
                    })
                )
            );
        });
    }

    //return _pipe_cache.curpipe$Arr.slice(-1)[0];
    return _pipe_cache.curpipe$Arr.pop(); // faster
};

// implementation involving mergeAll as per https://indepth.dev/posts/1114/learn-to-combine-rxjs-sequences-with-super-intuitive-interactive-diagrams
// this function is specifically useful when some of multiple streams in the dataflow
// skip as in the case of leafgateflow.js, where the unskiped streams get salvaged here for
// any downstream operations.
const mergeObservableDataflows = (refnode, flow$Arr, isflatten=true) => {
    const filtered$Arr = flow$Arr.filter(x=>x);
    const arrayLen = filtered$Arr.length;
    if (!refnode) {
        console.log("start debugging");
    }
    if (refnode && refnode.slice(0,4) == "90ad")
        console.log('start debugging');
    if (arrayLen > 1) {
        const merged_stream$ = interval(1).pipe(
            take(arrayLen), 
            map(i => filtered$Arr[i]._stream)
        ).pipe(
            mergeAll()
        ).pipe(
            x => { // peep hole
                console.log(refnode);
                return x.pipe(map(_x => {
                    console.log(_x);
                    if (isflatten && Array.isArray(_x))
                        return _x.flat();
                    else
                        return _x;
                }))
            }
        );
        //const merged_stream$ = merge(...filtered$Arr.map(x=>x._stream.pipe(
        //    x => { // peep hole
        //        console.log(x);
        //        return x.pipe(map(_x => {
        //            console.log(_x);
        //            return _x;
        //        }))
        //    }
        //)
            //.pipe(
        //    bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
        //    map(x=>flattenArray(x))
        //)
        //));

        return {_stream: merged_stream$};
    }
    else if (filtered$Arr.length > 0) {
        return filtered$Arr[0];
    }
};

const mergeDataflows = (flow$Arr) => {
    const filtered$Arr = flow$Arr.filter(x=>x);
    if (filtered$Arr.length > 1) {
        const merged_stream$ = merge(...filtered$Arr.map(x=>x._stream.pipe(
            map(
                _x => { // peep hole
                    console.log(_x);
                    return _x;
                    //return _x.pipe(map(__x => {
                    //    console.log(__x);
                    //    return __x;
                    //}))
                }
            )
        )
            //.pipe(
        //    bufferTime(LEAFBufferTimeSpan, LEAFBufferCreationInterval, LEAFNodeInflowBufferSize),
        //    map(x=>flattenArray(x))
        //)
        ));

        return {_stream: merged_stream$};
    }
    else if (filtered$Arr.length > 0) {
        return filtered$Arr[0];
    }
};

function debounce(fn, ms) {
    let timer;
    return _ => {
        clearTimeout(timer);
        timer = setTimeout(_ => {
            timer = null
            fn.apply(this, arguments)
        }, ms);
    };
}

const enterDataBus = (_data, _metadata) => {
    return doBottle("_databus", _data, { ..._metadata });
}

const _exitDataBus = (_bus, _cond=(_)=>true) => {
    if (isBottle(_bus) && _bus._bname === "_databus" && _cond(_bus))
        return _bus._content;
    else
        return _bus;
}

// spark_dev_note: 15/Jun/2023
// enterDataBus/exitDataBus was introduced to make leaf debugging 'somewhat' easier from the language creator's perspective. 
// this modality of data carrier, when perceived by leaf programmers in the general population, is confusing, at best.
// hence the decision to stop using it.
// from now on the bottle/unbottle function pair is used to encapsulate any user-level 
// as well as any system-level data exchanges between nodes
// the function definitions of enterDataBus/exitDataBus are left as is in the mean time, just in case, ;)
// but their availability as a library function is taken down by 
// excluding their names from the export clause defined at the end of this file.
const exitDataBus = ({_bus, _cond=(_)=>true, _flatten=false}={}) => {
    if (_flatten) 
        return Array.isArray(_bus) ? _bus.map(_b=>_exitDataBus(_b, _cond)).flat().filter(_=>_) : _exitDataBus(_bus, _cond);
    else
        return Array.isArray(_bus) ? _bus.map(_b=>_exitDataBus(_b, _cond)).filter(_=>_) : _exitDataBus(_bus, _cond);
}

export {naiveZipDataflows, zipDataflows, mergeDataflows, chronosDataflow, TIMEOUTBEHAVIOR_ALLORNOTHING, TIMEOUTBEHAVIOR_BESTEFFORT, CHRONOSTYPE_SYNC, CHRONOSTYPE_ASYNC, combineDataflows, mergeObservableDataflows, concatDataflows, substituteDataflows, flattenArray, debounce};
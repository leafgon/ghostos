import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, concatMap, withLatestFrom, filter } from 'rxjs/operators';
import { BehaviorSubject, of, combineLatest } from 'rxjs';
import { _leafbottle, _leafunbottle } from '../datautils/index.js';
import { combineDataflows, mergeDataflows, chronosDataflow, naiveZipDataflows, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { fetchMultiKeyedData } from '../../../utils/fetchnodedata.js';
import { _leafstdlib_dataflow_api } from '../../../metamodel.js';
import { v4 as uuid4 } from 'uuid';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { _leafmixflow } from '../dataflow/index.js';
import { ElemCacheKeyLUT } from './library/index.js';
import { isBottle } from '../../predicates.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';

const leafgon_url = process.env.LEAFGON_URL;
const leaf_apidef = _leafstdlib_dataflow_api("leafdeckdiamond");

/*
 * _leafdeckdiamond() is a runtime function for the LEAFgraph node of logic type 'leafdeckdiamond.
 * it is used to generate a navigable node of type heart upon any club bottled data being passed to the leaf node 
 * via its incoming data flow. 
 * @deckname: a string reference to be used for the new navigable node 
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying data as defined by the lambda component in LEAF. 
 * The lambdaFunc, if defined, represents the 'Model' of the MVI framework, where the user clicking on
 * the corresponding navigable node represents the 'Intent' of MVI. The outcome of executing the lambdaFunc
 * needs to be reflected back to the user somehow, usually by means of gnav.js, whose effect in turn constitutes 
 * the View of MVI.
 * 
 * Upon the leafdeckdiamond node logic executing, a gnav-compatible json object to represent 
 * the leafdeckdiamond in the rhelm of gnav.js is expected to be returned. 
 * 
 * TBD:
 * @graphContextual: n/a 
 * or
 * @graphContextual: a parsed runtime lambda function connected to the graph of which the current node is a member
 * 
 * bottles the node look out for in the dataflow plane for filtering data of interest: 
 * '_leafdeckclub'
 */
//const _leafdeckdiamond = ({logictoggle=false, deckname=''}={}, lambdaFunc=x=>x, graphContextual) => {}
const _leafdeckdiamond = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        //const _defaultLambda = ('_default' in reduced_lambda_obj) ?
        //    (input$Arr) => reduced_lambda_obj._default(input$Arr) :
        //    (input$Arr) => mergeDataflows(input$Arr);

        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.
        //const filterDataOfInterest = await _leafunbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, nodelambda: [], contextuallambda});
        const mixDataflow = await _leafmixflow.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {}}}}, nodelambda: [], contextuallambda});
        // lambdactrl.user.leaf.logic.args.bottlekey || lambdadata.lambdaFunc
        //const bottleUp = await _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckdiamond'}}}}, nodelambda: [], contextuallambda});

        const node_context = {
            codebase: "leafdeckdiamond.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => {
            //const filtered$obj = filterDataOfInterest(input$objArr, controlflow$obj);
            //const filtered$obj = filterDataOfInterest(flowinput$Arr);
            // spark_dev_note: TBD: leafdeckdiamond uses naiveZipDataflows while leafdeckspade 
            // uses combineDataflows, and currently these two have behavioral differences in terms of 
            // what output formats to expect the former returning a list while the latter returns
            // a list of lists. make a decision call to stick to one format and refactor them to
            // have a common input merge behaviors. This would require writing a bunch of jest test
            // cases to have them tested.  
            //const filtered$obj = naiveZipDataflows(flowinput$Arr.map(x=>filterDataOfInterest([x])));

            let idxcache = 0;
            let loopydata_cache = [];
            let ctrl_in_cache = undefined;
            let bottle_label = ["_leafdeckclub"];

            const _stream_cache = {};

            const preprocessfunc = (_data_in) => {
                const _rt_cache = {idxcache, loopydata_cache};
                const _data_in_arr = Array.isArray(_data_in) ? _data_in : [_data_in];
                const _data_out = {clubs: [], nodeinput: []};

                // sort input bottles into two categories and store them in _data_out
                _data_in_arr.map(_datum_in => { 
                    if (isBottle(_datum_in)) {
                        if (_datum_in._bname === bottle_label[0]) {
                            _data_out.clubs.push(doUnbottle(bottle_label, _datum_in))
                        } else if (_datum_in._bname === "nodeinput") {
                            _data_out.nodeinput.push(doUnbottle("nodeinput", _datum_in))
                        }
                    }
                });
                
                return _data_out;
            };

            //const _leafdeckdiamond_leaflogic = (_input$objArr, _controlflow$obj) => {
            //    //const uri$obj = driveDataflowByCtrlflow(
            //    //    controlflow$obj, input$objArr, undefined, node_context, 
            //    //    {
            //    //        leaflogic: urigen,
            //    //        datalogic: {post: (_data) => {
            //    //            _stream_cache[ElemCacheKeyLUT.mediaplayer.URI] = _data;
            //    //            return _data;
            //    //        }}
            //    //    }
            //    //);
        
            //    //const _inflow_ctrl$obj = uri$obj._control;
            //    const _inflow_ctrl$obj = _controlflow$obj;
        
            //    //const _outflow_data$ = new ReplaySubject(1);
            //    const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafdecdiamond.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/leafdeckdiamonds.js"}, {});
            //    const _outflow_data$ = new BehaviorSubject(raceConditionError);
            //    const _ctrl_out$ = _inflow_ctrl$obj._stream.pipe(
            //        concatMap(_ctrl_in => {
            //            _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
        
            //            // perform any input data (read) operations specific to the element here
            //            // like accessing the most up-to-date messages from rx subjects/streams, etc
        
            //            // return data read from the rx stream domain as an array
            //            return (_input$objArr.length === 0 ? 
            //                of([]) : 
            //                combineLatest([..._input$objArr.map(_obj=>_obj._stream)])
            //            );
            //        }),
            //        map(_data_in => {
            //            console.log("testing element _leaflogic: ", _data_in);
            //            // perform any output data (write) operations specific to the element here
            //            // like sending messages to rx subjects, etc
        
            //            if (_data_in.length > 1)
            //                _outflow_data$.next(_data_in);
            //            else if (_data_in.length === 1)
            //                _outflow_data$.next(_data_in[0]);
            //            // return ctrl
            //            return _stream_cache[ElemCacheKeyLUT.CTRLIN];
            //        })
            //    );
        
            //    return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
            //};

            const loopidx = controlflow$obj._config?.loopidx;
            const {type, args} = refnodedata.leaf.logic;
            const _defaultLambda = (('_default' in reduced_lambda_obj) ?
                (_input$objArr, _controlflow$obj) => {
                    const diamondctrlflow$obj = {
                        _stream: _controlflow$obj._stream.pipe(
                            map(_ctrl_in => {
                                return _ctrl_in;
                            })
                        ),
                        _config: {..._controlflow$obj._config}
                    };
                    if (loopidx >= 0) // add loopidx ctrl config data to whatever ctrl data being passed in normally via hammer action in sysmenu.js
                        diamondctrlflow$obj._config.loopidx = loopidx;
                    diamondctrlflow$obj._config.clubrefnode = refnode;
                    const dia$obj = reduced_lambda_obj._default(_input$objArr, _controlflow$obj);

                    return {
                        _stream: dia$obj._stream.pipe(
                            map(_data_in => {
                                return _data_in;
                            })
                        ),
                        _control: {
                            _stream: dia$obj._control._stream.pipe(
                                map(_ctrl_in => {
                                    return _ctrl_in;
                                })
                            )
                        }
                    };
                } :
                (('href' in reduced_lambda_obj && '_default' in reduced_lambda_obj.href) ?
                    (_input$objArr, _controlflow$obj) => {
                        const href$obj = reduced_lambda_obj.href._default(_input$objArr, _controlflow$obj);
                        return {
                            _stream: href$obj._stream.pipe(
                                map(_href_in => {
                                    console.log("redirecting");
                                    if (window.location.href.slice(-_href_in.length) !== _href_in)
                                        window.location.href = _href_in; //relative to domain
                                    return _href_in;
                                })
                            ), 
                            _control: {..._controlflow$obj._control, _stream: href$obj._control._stream.pipe(
                                map(_ctrl_in => {
                                    return _ctrl_in;
                                })
                            )}
                        };
                    } :
                    (_input$objArr, _controlflow$obj) => {
                        const _cache = {...reduced_lambda_obj};
                        console.log("start debugging");
                        return {...mergeDataflows(_input$objArr), _control: _controlflow$obj};
                    }
                )
            );

            const postprocessfunc = (_data_in) => {
                const _rt_cache = {idxcache, loopydata_cache};
                if (!_data_in.clubs)
                    console.log("start debugging");
                const a_club_list = _data_in.clubs.filter(_c=>_c); //Array.isArray(_data_in) ? _data_in : [_data_in];
                //const _nodeinput = _data_in.nodeinput.length === 1 ? _data_in.nodeinput[0] : _data_in.nodeinput;
                const is_lambda_subscription = ("subscribe" in reduced_lambda_obj && a_club_list.length === 0);
                const _data_out = {
                    type: 'leafdeckdiamond',
                    uuid: uuid4(), // random uuid 
                    nodeuuid: refnode,
                    name: fetchMultiKeyedData(leaf_apidef.editorconfig.namedatakey, args),//refnodedata.leaf.logic.args.deckname, // refactor to have deckname concatenated with an index e.g. 'Park1',
                    svgicon: leafgon_url+'/icons/hardware/laptop_mac/materialicons/24px.svg', // refactor to have this set in LEAF
                    description: '{description}', // refactor to have this set in LEAF
                    nodeinput: _data_in.nodeinput,
                    lambdas: { // a dictionary of lambda functions belonging to the 1st tier node
                        // refactor to have this set using the argument lambdaFunc
                        default: 'defaultLambda', // or undefined,
                        defaultLambda: _defaultLambda,
                        bro: (input$) => {return input$}, // somehow break down lambdaFunc to have an arbitrary number of lambda functions destructured here
                    },
                    subscription: is_lambda_subscription,
                    clubs: a_club_list // a list of club-level satellite entries of 1st-tier navigable nodes
                };

                console.log('node logic executed: ' + JSON.stringify(_data_out));

                return doBottle("_leafdeckdiamond", _data_out);
            };

            // wire in node-specific flow functions, if any
            const nodectrl$ = controlflow$obj._stream; 
            //const nodectrl$ = controlflow$obj._stream.pipe(
            //    concatMap(_ctrl_in=> {
            //        ctrl_in_cache = _ctrl_in;
            //        return [of(_ctrl_in), lambdakey$obj._stream];
            //    }),
            //    map( ([_ctrl_in, _lambdakey]) => { // 
            //        bottle_label = _lambdakey;
            //        return _ctrl_in;
            //    })
            //); 

            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
            const output$obj = driveDataflowByCtrlflow(
                {_stream: nodectrl$}, input$objArr, undefined, 
                {...node_context, metastep: "creating a leafdeckdiamond element"},
                {
                    //leaflogic: (input$objArr.length > 0 ? _leafdeckdiamond_leaflogic : undefined),
                    datalogic: {
                        pre: preprocessfunc,
                        post: postprocessfunc
                    }
                }
            );

            //let flowoutput$;

            //// filter out any null entries in the result array
            //const output$Arr = [{_stream: flowoutput$.pipe(filter(_entry=>_entry))}];
            ////return {...(bottleUp(output$Arr, controlflow$obj)), _control: controlflow$obj}; 
            //return {_stream: flowoutput$.pipe(filter(_entry=>_entry)), _control: controlflow$obj}; 
            //// no output on no input
            return {_stream: output$obj._stream.pipe(
                map(_data=> {
                    console.log(_data);
                    return _data;
                })
            ), _control: output$obj._control};
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const output$ = etafunc(input$Arr, controlflow$obj);
                return {_stream: output$, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafdeckdiamond };

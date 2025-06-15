import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, concatMap, withLatestFrom, filter } from 'rxjs/operators';
import { _leafbottle } from '../datautils/index.js';
//import { red } from '@mui/material/colors';
import { mergeDataflows, combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { ReplaySubject, from, of, combineLatest } from 'rxjs';
import { fetchMultiKeyedData } from '../../../utils/fetchnodedata.js';
import { _leafstdlib_dataflow_api } from '../../../metamodel.js';
import { v4 as uuid4 } from 'uuid';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { ElemCacheKeyLUT } from './library/index.js';
import { isBottle } from '../../predicates.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';

const leafgon_url = process.env.LEAFGON_URL;
const leaf_apidef = _leafstdlib_dataflow_api("leafdeckclub");

//const _leafdeckclub = ({logictoggle=false, deckname=''}={}, lambdaFunc=x=>x, graphContextual) => {}
const _leafdeckclub = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.
        //const filterDataOfInterest = _leafdataUnbottle({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, contextuallambda});
        // lambdactrl.user.leaf.logic.args.bottlekey || lambdadata.lambdaFunc
        //const bottleUp = await _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, nodelambda: [], contextuallambda});

        const node_context = {
            codebase: "leafdeckclub.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => {
            let idxcache = 0;
            let loopydata_cache = [];
            let ctrl_in_cache = undefined;
            let bottle_label = undefined;

            const _stream_cache = {};

            const preprocessfunc = (_data_in) => {
                const _rt_cache = {idxcache, loopydata_cache};
                //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles

                const _data_in_arr = Array.isArray(_data_in) ? _data_in : [_data_in];
                const _data_out = {nodeinput: []};

                // sort input bottles into two categories and store them in _data_out
                _data_in_arr.map(_datum_in => { 
                    if (isBottle(_datum_in)) {
                        if (_datum_in._bname === "nodeinput") {
                            _data_out.nodeinput.push(doUnbottle("nodeinput", _datum_in))
                        }
                    }
                });
                
                return _data_out;
            };

            //const _leafdeckclub_leaflogic = (_input$objArr, _controlflow$obj) => {
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
        
            //    const _outflow_data$ = new ReplaySubject(1);
            //    const _ctrl_out$ = _inflow_ctrl$obj._stream.pipe(
            //        concatMap(_ctrl_in => {
            //            _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
        
            //            // perform any input data (read) operations specific to the element here
            //            // like accessing the most up-to-date messages from rx subjects/streams, etc
        
            //            // return data read from the rx stream domain as an array
            //            return combineLatest([..._input$objArr.map(_obj=>_obj._stream)]);
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
                    const diamondctrlflow$obj = {..._controlflow$obj};
                    if (loopidx >= 0) // add loopidx ctrl config data to whatever ctrl data being passed in normally via hammer action in sysmenu.js
                        diamondctrlflow$obj._config.loopidx = loopidx;
                    diamondctrlflow$obj._config.clubrefnode = refnode;
                    const _output$obj = reduced_lambda_obj._default(_input$objArr, diamondctrlflow$obj);
                    return _output$obj;
                } :
                (_input$objArr, _controlflow$obj) => {
                    console.log("start debugging");
                    return {...mergeDataflows(_input$objArr), _control: _controlflow$obj};
                }
            );

            const postprocessfunc = (_data_in) => {
                const _rt_cache = {idxcache, loopydata_cache};
                //const a_club_list = _data_in;
                const is_lambda_subscription = ("subscribe" in reduced_lambda_obj);

                const _data_out = {
                    type: 'leafdeckclub',
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
                };

                console.log('node logic executed: ' + JSON.stringify(_data_out));

                return doBottle("_leafdeckclub", _data_out);
            };

            // wire in node-specific flow functions, if any
            const nodectrl$ = controlflow$obj._stream.pipe(
                map(_in_ctrl => {
                    const _rt_cache = {node_context};
                    return _in_ctrl;
                })
            ); 
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
                {...node_context, metastep: "creating a leafdeckclub element"},
                {
                    //leaflogic: filterDataOfInterest,
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
            //return output$obj;
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
            lambda_lut[key] = (input$Arr) => { // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr, controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafdeckclub };

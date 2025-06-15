import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { map, concatMap, withLatestFrom, filter } from 'rxjs/operators';
import { _leafbottle, _leafunbottle } from '../datautils/index.js';
import { fetchMultiKeyedData } from '../../../utils/fetchnodedata.js';
import { _leafstdlib_dataflow_api } from '../../../metamodel.js';
//import { combineDataflows, naiveZipDataflows, mergeObservableDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow';
import { v4 as uuid4 } from 'uuid';
import { mergeDataflows } from '../../../utils/leafdataflow.js';
import { driveDataflowByCtrlflow } from '../../leaf.js';
import { _leafmixflow } from '../dataflow/index.js';
import { ReplaySubject, combineLatest } from 'rxjs';
import { ElemCacheKeyLUT } from './library/index.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';

const leaf_apidef = _leafstdlib_dataflow_api("leafdeckheart");

/*
 * _leafdeckheart() is a runtime function for the LEAFgraph node of logic type 'leafdeckheart'.
 * it is used to generate a navigable node of type heart upon any diamond bottled data being passed to the leaf node 
 * via its incoming data flow. 
 * @deckname: a string reference to be used for the new navigable node 
 * @lambdaFunc: is a function defined in the context of the calling LEAF graph. It accepts flowinput$ as 
 * input and returns as output a stream carrying data as defined by the lambda component in LEAF. 
 * The lambdaFunc, if defined, represents the 'Model' of the MVI framework, where the user clicking on
 * the corresponding navigable node represents the 'Intent' of MVI. The outcome of executing the lambdaFunc
 * needs to be reflected back to the user somehow, usually by means of gnav.js, whose effect in turn constitutes 
 * the View of MVI.
 * 
 * Upon the leafdeckheart node logic executing, a gnav-compatible json object to represent 
 * the leafdeckheart in the rhelm of gnav.js is expected to be returned. 
 * 
 * TBD:
 * @graphContextual: n/a 
 * or
 * @graphContextual: a parsed runtime lambda function connected to the graph of which the current node is a member
 * 
 * bottles the node look out for in the dataflow plane for filtering data of interest: 
 * '_leafdeckdiamond'
 */
//const _leafdeckheart = ({logictoggle=false, deckname=''}={}, lambdaFunc=x=>x, graphContextual) => {}
const _leafdeckheart = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) { 
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
        const _defaultLambda = ('_default' in reduced_lambda_obj) ?
            (input$Arr, controlflow$obj) => {return {...(reduced_lambda_obj._default(input$Arr, controlflow$obj)), _control: controlflow$obj}} :
            (input$Arr, controlflow$obj) => {return {...mergeDataflows(input$Arr), _control: controlflow$obj}};

        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.
        //const filterDataOfInterestDiamond = await _leafunbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckdiamond'}}}}, nodelambda: [], contextuallambda});
        const mixDataflow = await _leafmixflow.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {}}}}, nodelambda: [], contextuallambda});
        //const filterDataOfInterestClub = await _leafunbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckclub'}}}}, nodelambda: [], contextuallambda});
        // lambdactrl.user.leaf.logic.args.bottlekey || lambdadata.lambdaFunc
        const bottleUp = await _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafdeckheart'}}}}, nodelambda: [], contextuallambda});


        const node_context = {
            codebase: "leafdeckheart.js",
            refnode, 
            leafnode: refnode && lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        return (input$objArr, controlflow$obj) => {
            let idxcache = 0;
            let loopydata_cache = [];
            let ctrl_in_cache = undefined;
            let bottle_label = ["_leafdeckdiamond"];

            const _stream_cache = {};

            const preprocessfunc = (_data_in) => {
                const _rt_cache = {idxcache, loopydata_cache};
                if (node_context.refnode === "02dda89a-6816-4e63-86eb-071b39d5fd51")
                    console.log("start debugging");
                const _data_out = Array.isArray(_data_in) ? 
                    _data_in.map(_datum_in => doUnbottle(bottle_label, _datum_in)).filter(_in=>_in) : 
                    doUnbottle(bottle_label, _data_in); //(isBottle(_data_in) && bottle_label.includes(_data_in._bname)) ? _data_in._content : undefined; //  exitDataBus({_bus: _data_in});
                return _data_out;
            };

            //const _leafdeckheart_leaflogic = (_input$objArr, _controlflow$obj) => {
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
                const a_diamond_list = Array.isArray(_data_in) ? _data_in : [_data_in];
                const _data_out = {
                    type: 'leafdeckheart',
                    uuid: uuid4(), // random uuid 
                    name: fetchMultiKeyedData(leaf_apidef.editorconfig.namedatakey, args), //'Park',
                    description: '{description}', // refactor to have this set in LEAF
                    lambdas: { // a dictionary of lambda functions belonging to the 1st tier node
                        // refactor to have this set using the argument lambdaFunc
                        default: 'defaultLambda', // or undefined,
                        defaultLambda: _defaultLambda,
                        bro: (input$) => {return input$}, // somehow break down lambdaFunc to have an arbitrary number of lambda functions destructured here
                    },
                    diamonds: a_diamond_list // a list of diamond-level satellite entries of 1st-tier navigable nodes
                };

                console.log('node logic executed: ' + JSON.stringify(_data_out));

                return doBottle("screenio", _data_out);
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
                {...node_context, metastep: "creating a leafdeckheart element"},
                {
                    //leaflogic: _leafdeckheart_leaflogic,
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
            return output$obj;
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // note the cross over in the roles of nodelambda and contextuallambda 
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda: contextuallambda, contextuallambda: nodelambda, etaTree: lambdactrl.gos.etaTree});
        const lambda_lut = {};
        Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
            lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr, controlflow$obj);
                return {...output$obj, _control: controlflow$obj};
            }
        });
        return lambda_lut;
    },
};

export { _leafdeckheart };
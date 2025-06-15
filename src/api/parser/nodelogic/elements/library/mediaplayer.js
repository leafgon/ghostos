import { BehaviorSubject, combineLatest, withLatestFrom } from "rxjs";
import { concatMap, map } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { doBottle } from "../../datautils/bottling.js";
//import { driveDataflowByCtrlflow } from "../../../leaf";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in mediaplayer.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/mediaplayer.js"}, {});
/*
 * spark_dev_note: 25/Apr/2023
 * all leaflogic and datalogic functions must be designed to conform to the following spec, 
 * in order to make sure of the inter-operability of newly developed leaf elements 
 * in breezyforest.
 * 
 * leaflogic lives in the rx flow domain, hence is an ideal function to deal with
 * any data i/o existing in that domain. Data in the reactive stream domain is accessable via 
 * invoking leaf lambda functions, normally bearing the function argument signature of ([input$Arr, ctrlflow$obj]), 
 * or via calling any functions or rx inline pipe-map that would provide the logic for statically 
 * manipulating data flown through any locally accessable rx streams of interest. 
 * Please note the convention of variable names post-scripted with the dollar sign ($), denoting the handles for 
 * respective data streams.
 * 
 * datalogic lives in the static data domain. How data i/o happens in this domain is not directly compatible with the stream domain.
 * the two optional datalogic functions, pre and post, are used to "statically" work on data, in terms of taking data input, 
 * performing data transformation/read/write operations, and returning data output, at two temporal data points, respectively 
 * coinciding with the time before (pre) and after (post) the incidence of data flowing through the leaflogic stream domain.
 * 
 */

const cachekeys = {
    URI: "_uri",
};

const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    const urigen = (('uri' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uri)) ? reduced_lambda_obj.uri._default : undefined;
    //const uri$obj = urigen ? executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([])};
    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/mediaplayer.js",
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE], 
        //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
    };
    const _mediaplayer_leaflogic = (input$objArr, controlflow$obj) => {
        const uri$obj = driveDataflowByCtrlflow(
            controlflow$obj, input$objArr, undefined, node_context, 
            {
                leaflogic: urigen,
                datalogic: {post: (_data) => {
                    _stream_cache[ElemCacheKeyLUT.mediaplayer.URI] = _data;
                    return _data;
                }}
            }
        );

        const _inflow_ctrl$obj = uri$obj._control;

        const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _ctrl_out$ = _inflow_ctrl$obj._stream.pipe(
            //concatMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc

            //    // return data read from the rx stream domain as an array
            //    return combineLatest([...input$objArr.map(_obj=>_obj._stream)]);
            //}),
            withLatestFrom(...input$objArr.map(_input=>_input._stream)),
            map(_combined_in => {
                const _data_in = _combined_in[1];
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                _outflow_data$.next(_data_in);
                //if (_data_in.length > 1)
                //    _outflow_data$.next(_data_in);
                //else if (_data_in.length === 1)
                //    _outflow_data$.next(_data_in[0]);
                // return ctrl
                //return _stream_cache[ElemCacheKeyLUT.CTRLIN];
                return _combined_in[0];
            })
        );

        return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
    };

    // put any static data preprocessing logic applied to all incident data, 
    // flown on each incoming edge stream.
    // data preprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_pre = (data_in) => {

        const data_out = data_in;

        return data_out;
    };

    // put any static data postprocessing logic applied to all incident data, 
    // to be flown on the outgoing edge stream.
    // data postprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_post = (data_in) => {
        //const recognizedLambdaConstants = ['uidefs', 'margin', 'fieldwidth'];
        const recognizedLambdaConstants = ['uri'];
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
        //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
        //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)

        const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;
        const node_output = formatElementFlowdata({
            element: {
                nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                type: 'mediaplayer',
                componentdata: {
                    //etaTree: lambdactrl.gos.etaTree,
                    uri: _stream_cache[ElemCacheKeyLUT.mediaplayer.URI], //uidefs,
                    //margin: marginval ? marginval[0] : 1,
                    //fieldwidth: fieldwidthval ? fieldwidthval[0] : '25ch', 
                    ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                },
            }
        }, "screenio");

        return node_output;
    };

    const _leaflogic = _mediaplayer_leaflogic; // codifying the location ("mediaplayer.js") of the logic

    return {
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props, cachekeys};
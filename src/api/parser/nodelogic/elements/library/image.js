import { Subject, combineLatest } from "rxjs";
import { switchMap, map, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
import { isBottle } from "../../../predicates.js";
import { doBottle, doUnbottle } from "../../datautils/bottling.js";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in image.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/image.js"}, {});
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
const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _outflow_data$ = new Subject();
        const _ctrl_out$ = controlflow$obj._stream.pipe(
            withLatestFrom(...input$objArr.map(_obj=>_obj._stream)),
            //switchMap(_combined_in => {

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc

            //    // return data read from the rx stream domain as an array
            //    return combineLatest([...input$objArr.map(_obj=>_obj._stream)]);
            //}),
            map(_combined_in => {
                _stream_cache[ElemCacheKeyLUT.CTRLIN] = _combined_in[0];
                const _data_in = _combined_in[1];
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                // spark_dev_note: 30/Jun/2023
                // _data_in may be [undefined]. currently the error handling of this data flow is just to
                // ignore it by filtering it out. 
                // a proper error handling including informing the user of the error is needed. 
                // implement it.
                // _data_in[0] to remove outter [] added by combineLatest
                //const filtered_data_in = _data_in.filter(_=>_);
                //if (filtered_data_in.length > 1)
                //    _outflow_data$.next(filtered_data_in);
                //else if (filtered_data_in.length === 1)
                //    _outflow_data$.next(filtered_data_in[0]);
                // return ctrl
                _outflow_data$.next(_data_in);
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

        const data_out = [data_in].flat().map(_datum_in => {
            if (isBottle(_datum_in) && _datum_in._bname === "image") {
                return doUnbottle("image",_datum_in);
            }
            return undefined;
        }).filter(_in=>_in);

        if (data_out.length === 1)
            return data_out[0];
        else if (data_out.length > 1)
            return data_out;
    };

    // put any static data postprocessing logic applied to all incident data, 
    // to be flown on the outgoing edge stream.
    // data postprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_post = (data_in) => {
        //const recognizedLambdaConstants = ['uidefs', 'margin', 'fieldwidth'];
        const recognizedLambdaConstants = ['onclose'];
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
        //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
        //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)

        //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;
        const unmountCallback = ('onclose' in reduced_lambda_obj) ? reduced_lambda_obj.onclose : () => {console.log('hello world image')};
        const node_output = formatElementFlowdata({
            element: {
                nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                type: 'image',
                componentdata: {
                    //etaTree: lambdactrl.gos.etaTree,
                    imagelist: Array.isArray(data_in) ? data_in : [data_in],
                    //margin: marginval ? marginval[0] : 1,
                    //fieldwidth: fieldwidthval ? fieldwidthval[0] : '25ch', 
                    ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                },
            }
        }, "screenio");

        return node_output;
    };

    return {
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props};
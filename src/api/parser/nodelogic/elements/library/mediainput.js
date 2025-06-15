import { BehaviorSubject, Subject, combineLatest, of, merge, withLatestFrom } from "rxjs";
import { switchMap, map, share, finalize } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
import { executeLEAFLogic } from "../../../leaf.js";
import { doBottle } from "../../datautils/bottling.js";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in mediainput.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/mediainput.js"}, {});
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
    const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;

    const elementioInput$ = new Subject();

    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _outflow_data$ = new Subject();
        //const uidefs$obj = uidefsgen ? uidefsgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_UIDEFS)}; // executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const margin$obj = margingen ? margingen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_MARGIN)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const fieldwidth$obj = fieldwidthgen ? fieldwidthgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_FIELDWIDTH)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

        const _ctrl_out$ = controlflow$obj._stream.pipe(
            //switchMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    const _data_in$ = combineLatest([...input$objArr.map(_input=>_input._stream)]);

            //    // return data read from the rx stream domain as an array
            //    return _data_in$;
            //}),
            withLatestFrom(...input$objArr.map(_input=>_input._stream)),
            switchMap(_combined_in => {
                _stream_cache[ElemCacheKeyLUT.CTRLIN] = _combined_in[0];
                const _data_in = _combined_in[1];
                const recognizedLambdaConstants = ['image', 'audio', 'video'];
                const curLambdaKeys = Object.keys(reduced_lambda_obj);
                const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                const mediatype = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'image'; // default to 'image' type


                //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
                //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

                // spark_dev_note: #http_dataflow_point // corresponding handles upstream
                //const _uidefs = data_in[0];          // uidefs$obj._stream
                //const _margin_userval = data_in[1];          // margin$obj._stream
                //const _fieldwidth_userval = data_in[2];          // fieldwidth$obj._stream
                let _flowdatain = _data_in;   // [...input$objArr]
                _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

                const _nodeinput = Array.isArray(_flowdatain) ? _flowdatain : [_flowdatain];
                const screenio_output = formatElementFlowdata({
                    element: {
                        nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                        type: 'mediainput',
                        componentdata: {
                            mediatype: mediatype,
                            nodeinput: _nodeinput,
                            callbacks: {
                                onDropAccepted: async (b64imgdata) => {
                                    const ret = reduced_lambda_obj.ondrop?._default ? await executeLEAFLogic(reduced_lambda_obj.ondrop._default, [doBottle("elementinput", b64imgdata), doBottle("nodeinput", _nodeinput)], {}, _stream_cache[ElemCacheKeyLUT.REFNODE]) : undefined;  
                                    // emit an elementio message
                                    const _elementio_mesg = doBottle("elementio", ret);
                                    elementioInput$.next(_elementio_mesg);
                                    console.log("start debugging");
                                }
                            }
                        }
                    }
                }, "screenio");

                const _data_in$ = (screenio_output ? 
                    merge(new BehaviorSubject(screenio_output), elementioInput$) :
                    elementioInput$
                );
                // return data read from the rx stream domain as an array
                return _data_in$;
            }),
            switchMap(_data_in => {
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                _outflow_data$.next(_data_in);
                // return ctrl
                return new BehaviorSubject(_stream_cache[ElemCacheKeyLUT.CTRLIN]);
            }),
            share()
        );

        return {
            _stream: _outflow_data$.pipe(
                    map(_in => {
                        return _in;
                    }),
                    finalize(() => { 
                        console.log('mediainput element data stream ended'); 
                    }),
                    share()
                ), 
            _control: {
                _stream: _ctrl_out$.pipe(
                    map(_in => {
                        return _in;
                    }),
                    finalize(() => { 
                        console.log('mediainput element ctrl stream ended'); 
                    }),
                    share()
                )
            }
        }
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
        
        let _flowdatain = data_in;   // [...input$objArr]
        _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

        return _flowdatain;
    };

    return {
        elementio$: elementioInput$,
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props};
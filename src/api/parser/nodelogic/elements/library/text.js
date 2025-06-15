import { Subject, combineLatest, of } from "rxjs";
import { switchMap, map, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
//import { exitDataBus } from "../../../../utils/leafdataflow";
import { isBottle } from "../../../predicates.js";
import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { doBottle } from "../../datautils/bottling.js";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in text.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/text.js"}, {});
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
    //const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    //const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    //const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/text.js",
        ..._stream_cache
    };

    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        const _outflow_data$ = new Subject(); //new BehaviorSubject(raceConditionError);
        //const uidefs$obj = uidefsgen ? uidefsgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_UIDEFS)}; // executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const margin$obj = margingen ? margingen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_MARGIN)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const fieldwidth$obj = fieldwidthgen ? fieldwidthgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_FIELDWIDTH)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

        const _ctrl_out$ = controlflow$obj._stream.pipe(
            //switchMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

            //    _stream_cache[ElemCacheKeyLUT.RTCONTEXT]._config = {...controlflow$obj._config};

            //    //const uidefs$obj = uidefsgen ? driveDataflowByCtrlflow(
            //    //    {_stream: of(_ctrl_in)}, [{_stream: doBottle("empty_bottle", "empty_data", {refnode: _stream_cache[ElemCacheKeyLUT.REFNODE]})}], undefined, node_context, 
            //    //    {
            //    //        leaflogic: uidefsgen, 
            //    //        datalogic: {
            //    //            post: (_data)=>{
            //    //                _stream_cache["uidefs"] = _data;
            //    //                return _data;
            //    //            }
            //    //        }
            //    //    }
            //    //) : {_stream: of("")};

            //    //const margin$obj = margingen ? driveDataflowByCtrlflow(
            //    //    {_stream: of(_ctrl_in)}, [{_stream: doBottle("empty_bottle", "empty_data", {refnode: _stream_cache[ElemCacheKeyLUT.REFNODE]})}], undefined, node_context, 
            //    //    {
            //    //        leaflogic: margingen, 
            //    //        datalogic: {
            //    //            post: (_data)=>{
            //    //                _stream_cache["margin"] = _data;
            //    //                return _data;
            //    //            }
            //    //        }
            //    //    }
            //    //) : {_stream: of("")};

            //    //const fieldwidth$obj = fieldwidthgen ? driveDataflowByCtrlflow(
            //    //    {_stream: of(_ctrl_in)}, [{_stream: doBottle("empty_bottle", "empty_data", {refnode: _stream_cache[ElemCacheKeyLUT.REFNODE]})}], undefined, node_context, 
            //    //    {
            //    //        leaflogic: fieldwidthgen, 
            //    //        datalogic: {
            //    //            post: (_data)=>{
            //    //                _stream_cache["fieldwidth"] = _data;
            //    //                return _data;
            //    //            }
            //    //        }
            //    //    }
            //    //) : {_stream: of("")};

            //    //return combineLatest([uidefs$obj._stream, margin$obj._stream, fieldwidth$obj._stream]);
            ////({}),
            ////concatMap(_aux_in => {})
            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    const _data_in$ = combineLatest([...input$objArr.map(_input=>_input._stream)]);

            //    // return data read from the rx stream domain as an array
            //    return _data_in$;
            //}),
            withLatestFrom(...input$objArr.map(_input$obj=>_input$obj._stream)),
            //withLatestFrom()
            //concatMap(_ctrl_in => {
            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    const _data_in$ = combineLatest([...input$objArr.map(_input=>_input._stream)]);

            //    // return data read from the rx stream domain as an array
            //    return _data_in$;
            //}),
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

        const recognizedLambdaConstants = ['lambda', 'onsave', 'gspot']; // lambda as in "lambda plane"
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));

        const textsource = 'lambda' in reduced_lambda_obj ? 'lambda' : 'dataflow'; // dataflow as in "dataflow plane"

        //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

        // spark_dev_note: #http_dataflow_point // corresponding handles upstream
        //const _uidefs = data_in[0];          // uidefs$obj._stream
        //const _margin_userval = data_in[1];          // margin$obj._stream
        //const _fieldwidth_userval = data_in[2];          // fieldwidth$obj._stream
        let _flowdatain = undefined;   // [...input$objArr]
        // spark_dev_note: 19/Jun/2023
        // #databus
        //if(isBottle(data_in) && data_in._bname === "_databus") 
        // spark_dev_note: 30/Jun/2023
        // #databus
        // lambda text had been sent over databus in previous implementations.
        // now that databus is obsolete, there is got to be an alternative way to differentiate
        // lambda text sourcing. for now the following rudimentary measure is taken to do this.
        // this needs to be refactored to use more robust measure, maybe using a well defined bottle name 
        // down the road.
        if(isBottle(data_in) && data_in._content?._provenance?.refnodedata) {
            _stream_cache[ElemCacheKeyLUT.RTCONTEXT].lambdarefnodedata = data_in._content?._provenance?.refnodedata;
            _stream_cache[ElemCacheKeyLUT.RTCONTEXT].lambdasourceuuid = data_in._content?._refnode;
            _flowdatain = data_in;
        }
        else {
            _flowdatain = data_in;   // [...input$objArr]
            //_flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality
        }

        //const _lambdarefnodedata = _stream_cache[ElemCacheKeyLUT.]
        // spark_dev_note: interim solution to compilation issue, need to sort this out in a proper fashion
        const controlflow$obj = undefined;


        const node_output = formatElementFlowdata({
            element: {
                nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                type: 'text',
                componentdata: { // this serves as storage config for the text editor component
                    refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
                    textsource: textsource, 
                    //lambdasourceuuid: controlflow$obj._control?._config?.nodeuuid, // config passed from the origin leafnode such as leaflisp. 
                    // spark_dev_note: #ctrlflow_config, controlflow$obj._config passed from leaf.js, via executeLEAFLogic in sysmenu.js
                    lambdarefnodedata: _stream_cache[ElemCacheKeyLUT.RTCONTEXT].lambdarefnodedata, //controlflow$obj._config?.refnodedata, // config passed from the origin leafnode such as leaflisp, data passing setup via registerHammer in sysmenu.js & nodemenu.js . 
                    lambdasourceuuid: _stream_cache[ElemCacheKeyLUT.RTCONTEXT].lambdasourceuuid, //controlflow$obj._config?.nodeuuid, // config passed from the origin leafnode such as leaflisp. 
                    dataflowinput: _flowdatain, //Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]],
                    domain: _stream_cache[ElemCacheKeyLUT.DOMAIN], //_metadata[1], //domain,
                    appid: _stream_cache[ElemCacheKeyLUT.APPID], //_metadata[2], //appid, 
                    ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                }
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
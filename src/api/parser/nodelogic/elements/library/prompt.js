import { BehaviorSubject, Subject, combineLatest, merge, of } from "rxjs";
import { concatMap, filter, map, share, switchMap, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { isBottle } from "../../../predicates.js";
import { doBottle } from "../../datautils/bottling.js";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in prompt.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/prompt.js"}, {});
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
    UIDEFS: "_uidefs",
};

const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;

    const elementioInput$ = new Subject();

    const _TEST_UIDEFS = `[ ; an open square bracket [ denotes the beginning of a list, followed by a matching 
        ; close square bracket ] appearing at the end of this page. you can bring your blinking cursor
        ; to one of the brackets and type Shift-5 (or %) to jump the cursor in between a pair of matching brackets. 
        ; please give it a go, it is a fun way to read any text written in LEAFlisp. 
        ; other helpful command keys to help you navigate LEAFlisp include h j k l with which the blinking cursor
        ; can be moved to the left, down, up and right respectively. Also useful are w b respectively used to command
        ; the cursor to move forward and backward by one word along the line. Shift-v can be used to select one line,
        ; v to select from where the cursor currently is and navigating away from the initial cursor point by using
        ; any mix of the navigation command keys, namely h j k l w and b would allow you to select any range of text of interest.
        ; at which point you could either copy, delete and/or paste the selected text by respectively pressing y, d and p
        ; pressing u would undo the changes you have made going back in time one change by one change as you repeat u in a series. 
        ; Ctrl-r would redo what had been undone. 
        ; using the command keys would require the editor to be in the "command" mode. pressing the escape key would put the editor 
        ; in the "command" mode, while pressing i would put the editor in the "edit" mode in which none of the navigation keys
        ; would work as navigation commands but as entering respective alphabets instead. 
        ; 
        {
          :prompt "setting"
          :backgroundColor "primary.light" 
          ; "primary.dark" | "secondary.light" "secondary.dark"
          :margin "1" 
          ; please note that any positive number in between quotes is accepted here.  
          ; the recommended value however would range from 0 to 20 in almost all general 
          ; usage scenarios where 0 to 5 whould perhaps comprise about 90% of the cases. 
          :fieldWidth "45ch" 
          ; ch is a unit length represented in terms of the width of the letter 0 (zero).
          ; so "15ch" would result in the width as wide as 15 zeros for all the text inputs below. 
          ; please refer to the following site for units in html/css lingo, if you have all the time in the world.
          ; https://www.w3schools.com/cssref/css_units.asp for units
          :buttonWidth "20ch"
          ; likewise, buttonWidth specifies the width of all the buttons declared below. 
        }
        {
          :prompt "text"
          :key "maintext1" ; :key is a user-defined string value, that should be unique within the context of the UI definition.
          :label "LEAF newsletter mailing list" ; a user-defined string label to be displayed on the text input.
          :variant "outlined" ; a text :variant with a choice of "standard", "outlined", or "filled" as its style.
          :multiline true
          :rows "2"
          :InputProps {:readOnly true}
          :defaultValue "Please fill out the info and subscribe to the mailing list."
        }
        {
          :prompt "text"
          ;:key (get (get (get (get uinodes 1) :meta) :label) :id) ; :key is a user-defined string value, that should be unique within the context of the UI definition.
          :key "name" ; :key is a user-defined string value, that should be unique within the context of the UI definition.
          ;:id (get (get (get (get uinodes 1) :meta) :label) :id)
          :fieldWidth "25ch" 
          :required true ;true
          :group 1
          :label "Your name" ;(get (get (get (get uinodes 1) :meta) :label) :text); a user-defined string label to be displayed on the text input.
          :variant "standard" ; a text :variant with a choice of "standard", "outlined", or "filled" as its style.
        }
        {
          :prompt "text"
          :key "email"
          :fieldWidth "25ch" 
          :required true
          :label "Your email"
          :type "email"
          :variant "standard"
        }
        { 
          :prompt "button"
          :color "secondary" 
          ; the value can be of "primary", "secondary", "error", "warning", "info", "success"
          :variant "outlined"
          ; the value can be of "text", "contained", "outlined"
          :key "subscribebtn"
          ; :href "/editor/breezyforest/main"
          ; :href can support a relative path
          :label "Subscribe"
        }
      ]`;
    const _TEST_MARGIN = "";
    const _TEST_FIELDWIDTH = "";

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/prompt.js",
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE], 
        //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
    };

    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _outflow_data$ = new Subject();
        //const uidefs$obj = uidefsgen ? uidefsgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_UIDEFS)}; // executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

        const uidefs$obj =  (uidefsgen ? 
            driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, node_context, 
                {
                    leaflogic: uidefsgen,
                    datalogic: {post: (_data) => {
                        _stream_cache[ElemCacheKeyLUT.prompt.UIDEFS] = _data;
                        return _data;
                    }}
                }
            ) : 
            {_stream: of(_TEST_UIDEFS), _control: {_stream: controlflow$obj._stream}}
        ); 
        //const margin$obj = margingen ? margingen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_MARGIN)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const fieldwidth$obj = fieldwidthgen ? fieldwidthgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_FIELDWIDTH)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

        let traffic_semaphore = false;
        const _ctrl_out$ = uidefs$obj._control._stream.pipe(
            //map(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
            //    return uidefs$obj._stream;
            //}),
            withLatestFrom(uidefs$obj._stream),
            switchMap(merged_in => {
                const _uidefs_in = merged_in[1];
                _stream_cache[ElemCacheKeyLUT.CTRLIN] = merged_in[0];
                // perform any input data (read) operations specific to the element here
                // like accessing the most up-to-date messages from rx subjects/streams, etc
                // spark_dev_note: #http_dataflow_point
                //const _data_in$ = combineLatest([uidefs$obj._stream, margin$obj._stream, fieldwidth$obj._stream, ...input$objArr.map(_input=>_input._stream)]);
                //const _data_in$ = combineLatest([uidefs$obj._stream, ...input$objArr.map(_input=>_input._stream)]);

                // perform basic sanity checks on the contents of _data_in
                // like that of _uidefs 
                const recognizedLambdaConstants = ['uidefs', 'margin', 'fieldwidth']; // a prompt of type "button" can be linked, by name, to a key-labelled lambda func
                const curLambdaKeys = Object.keys(reduced_lambda_obj);
                const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));

                const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
                const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

                // spark_dev_note: #http_dataflow_point // corresponding handles upstream
                //const _uidefs = data_in[0];          // uidefs$obj._stream
                //const _uidefs = _stream_cache[ElemCacheKeyLUT.prompt.UIDEFS];          // uidefs$obj._stream
                const screenio_output = ((isBottle(_uidefs_in) && _uidefs_in._bname === "error") ? 
                    // do nothing by returning undefined
                    undefined :
                    ((Array.isArray(_uidefs_in)) ?
                        formatElementFlowdata({
                            element: {
                                nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                                type: 'prompt',
                                componentdata: {
                                    //etaTree: lambdactrl.gos.etaTree,
                                    nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                                    uidefs: _uidefs_in,
                                    margin: marginval ? marginval[0] : 1,
                                    fieldwidth: fieldwidthval ? fieldwidthval[0] : '25ch', 
                                    ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                                },
                            }
                        }, "screenio") :
                        undefined
                    )
                );

                const _data_in$ = (screenio_output ? 
                    merge(of(screenio_output), elementioInput$) :
                    elementioInput$
                );
                // return data read from the rx stream domain as an array
                return _data_in$;
            }),
            map(_data_in => {
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                //traffic_semaphore = true; // allow the data to flow
                _outflow_data$.next(_data_in);
                //if (_data_in.length > 1)
                //    _outflow_data$.next(_data_in);
                //else if (_data_in.length === 1)
                //    _outflow_data$.next(_data_in[0]);
                // return ctrl
                return _stream_cache[ElemCacheKeyLUT.CTRLIN];
            }),
            share()
        );

        return {
            _stream: _outflow_data$.pipe(
                //filter(_data_out=>isBottle(_data_out)&&_data_out._bname !== "error"),
                //filter(_data_out=>traffic_semaphore),
                filter(_data_out=> JSON.stringify({..._data_out, "_label": {}}) !== JSON.stringify(raceConditionError)),
                map(_data_out=>{
                    console.log(_data_out);
                    return _data_out;
                }),
                share()
            ), 
            _control: {_stream: _ctrl_out$.pipe(
                map(_ctrl_out=>{
                    console.log(_ctrl_out);
                    return _ctrl_out;
                }),
                share()
            )}
        };
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
        //const _margin_userval = data_in[1];          // margin$obj._stream
        //const _fieldwidth_userval = data_in[2];          // fieldwidth$obj._stream
        //let _flowdatain = data_in;   // [...input$objArr]
        //_flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

        //return _flowdatain;
        return data_in;
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

export {props, cachekeys};
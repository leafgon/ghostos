import { BehaviorSubject, Subject, merge, combineLatest, of } from "rxjs";
import { concatMap, switchMap, filter, map, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
import { executeLEAFLogic } from "../../../leaf.js";
import { doBottle, doUnbottle } from "../../datautils/bottling.js";
import { isBottle } from "../../../predicates.js";

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in popup.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/popup.js"}, {});
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
    const iselementio = true; // true by default ('elementio' in reduced_lambda_obj) ? true : false;
    //const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    //const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    //const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;

    //const _outflow_data$ = new BehaviorSubject(raceConditionError);
    const _outflow_data$ = new Subject();
    const elementioInput$ = new Subject();

    const _leaflogic = (input$objArr, controlflow$obj) => {

        const _ctrl_out$ = controlflow$obj._stream.pipe(
            //switchMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
            //    _stream_cache[ElemCacheKeyLUT.RTCONTEXT]._config = {...controlflow$obj._config};

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    const _data_in$ = combineLatest([...input$objArr.map(_input=>_input._stream)]);

            //    // return data read from the rx stream domain as an array
            //    return merge(_data_in$, elementioInput$);
            //}),
            withLatestFrom(...input$objArr.map(_input=>_input._stream)),
            switchMap(_combined_in => {
                const relay_ctrl$ = new BehaviorSubject(_combined_in[0]);
                const relay_data$ = new BehaviorSubject(_combined_in[1]);
                return combineLatest(relay_ctrl$, merge(relay_data$, elementioInput$));
            }),
            switchMap(_combined_in => {
                console.log("testing element _leaflogic: ", _combined_in);
                const _data_in = _combined_in[1];
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc
                //
                // spark_dev_note: 4/May/2023
                // #screenio #bottle
                // _data_in is an array of incoming data, at time t0, from the input dataflow.
                // this data becomes imbedded as children in constructing popup element's jsx visuals.
                // so the incoming data is assumed to be of leafelement types associated to some visualization
                // bottled as "screenio", that would eventually require screenio's attention.
                // the conundrum, here, is to decide whether it is the data transformation responsibility 
                // at the level of leafelement such as popup.js to unbottle incoming control-level bottles such
                // as "screenio". For now, placing the responsibility here makes the most sense, as 
                // the codebase is closest to the occurance of such a data pattern. 
                // This note was left as a gentle reminder to always be wary of test cases ridden with conditions 
                // tricky to grasp, and to systematically navigate in reactive programming. 
                // the assumptions made here as far as its data transformation is concerned:
                // * only bottles named screenio are valid for downstream consumption, hence unbottled
                // * invalid bottles are not needed hence discarded

                const recognizedLambdaConstants = ['headless', 'jester', 'top', 'tt', 'bottom', 'bb', 'left', 'll', 'right', 'rr', 'topleft', 'ttll', 'topright', 'ttrr', 'bottomleft', 'bbll', 'bottomright', 'bbrr', 'center','centre']; // a prompt of type "button" can be linked, by name, to a key-labelled lambda func
                const curLambdaKeys = Object.keys(reduced_lambda_obj);
                const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : undefined;

                const quarantined_data_in = [_data_in].flat().map(_in => {
                    if (!isBottle(_in))
                        return undefined;
                    if (_in._bname === "screenio") {
                        //let _flowdatain = _in;   // [...input$objArr]
                        //_flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality
                        const _child_elements = doUnbottle("screenio", _in);

                        return formatElementFlowdata({
                            element: {
                                nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
                                type: 'popup',
                                componentdata: {
                                    poprect,
                                    headless: ('headless' in reduced_lambda_obj) ? true : false,
                                    ismenu: ('jester' in reduced_lambda_obj) ? true : false,
                                    unmountCallback: async () => {
                                        const _leaflogic = (('onclose' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.onclose)) ? reduced_lambda_obj.onclose._default : undefined;
                                        const _leaflogic_ret = (_leaflogic ?
                                            //await executeLEAFLogic(_leaflogic, [], {...controlflow$obj._config}) : 
                                            await executeLEAFLogic(_leaflogic, [], {..._stream_cache[ElemCacheKeyLUT.RTCONTEXT]._config}) : 
                                            []);

                                        if (iselementio) {
                                            //elementiosubject$.next(doBottle('elementio', {element: 'popup', nodeuuid: refnode, io: {'onclose': _leaflogic_ret}}));
                                            elementioInput$.next(doBottle('elementio', {element: 'popup', nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE], io: {'onclose': _leaflogic_ret}}));
                                        }
                                        return _leaflogic_ret;
                                    },
                                    children: Array.isArray(_child_elements) ? _child_elements : [_child_elements],
                                    ..._stream_cache[ElemCacheKeyLUT.RTCONTEXT],
                                }
                            }
                        }, "screenio");
                        //return doUnbottle("screenio", _in);
                    }
                    else if (_in._bname === "elementio") {
                        return _in;
                    }
                    return undefined;
                }).filter(_=>_);


                if (quarantined_data_in.length > 1)
                    _outflow_data$.next(quarantined_data_in);
                else if (quarantined_data_in.length === 1)
                    _outflow_data$.next(quarantined_data_in[0]);
                // return ctrl
                //return _stream_cache[ElemCacheKeyLUT.CTRLIN];
                return of(_combined_in[0]);
            })
        );

        return {_stream: _outflow_data$.pipe(
            filter(_data_out => JSON.stringify(_data_out) !== JSON.stringify(raceConditionError)),
            map(_data_out=> {
                return _data_out;
            })
        ), _control: {_stream: _ctrl_out$}}
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

export {props};
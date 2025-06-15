import { BehaviorSubject, Subject, combineLatest, of } from "rxjs";
import { switchMap, filter, map, share, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";

import lodashpkg from 'lodash';

import axios from 'axios';
import fetch from 'isomorphic-fetch';
import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { doBottle } from "../../datautils/bottling.js";
import { isBottle } from "../../../predicates.js";
import _ from "lodash";

// locally global constants
const {memoize} = lodashpkg; // nodejs compatible lodash import
const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in href.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library.js"}, {});
const cachekeys = {
    URI: "_href_uri",
};

const GENERIC_URI_NAME = "{*}";
const HREF_REQUEST_BNAME = "href-request";
const URI_FALLBACK_DEFAULT = "https://www.leafgon.com";

/*
example href request bottle looks like so:
{
    _bname: "href-request",
    _content: {
        uri: "",
        data: ""
    },
    _label: {}
}
*/

const axios_instances = {};

const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    const urigen = (('uri' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uri)) ? reduced_lambda_obj.uri._default : undefined;
    //const headergen = (('header' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.header)) ? reduced_lambda_obj.header._default : undefined;

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/href.js",
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE], 
        //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
    };
    //axios_instances[node_context.refnode] = axios.create({});

    const _GENERIC_URI = "{*}";
    //const _DEFAULT_HEADER = "";
    //const axios_instance = axios_instances[node_context.refnode];

    const _elementlogic = async (_data_in) => {
        //_stream_cache[ElemCacheKeyLUT.DATAIN] = _metadata;
        let _uribase = _stream_cache[ElemCacheKeyLUT.href.URI];          // uri$obj._stream
        
        // spark_dev_note: #http_dataflow_point // corresponding handles upstream
        let _flowdatain = _data_in; //.slice(2);   // [...input$objArr]
        _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

        const recognizedLambdaConstants = ['uri','post','put','get','header','?graph'];
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));

        if (_uribase === GENERIC_URI_NAME && isBottle(_flowdatain) && _flowdatain._bname === HREF_REQUEST_BNAME) {
            _uribase = _flowdatain._content.uri ? _flowdatain._content.uri : URI_FALLBACK_DEFAULT;
            //_header = _flowdatain._content.header ? _flowdatain._content.header : _header;
            _flowdatain = _flowdatain._content.data ? _flowdatain._content.data : "";
        }
        //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
        //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)
        const domain = ElemCacheKeyLUT.DOMAIN ? _stream_cache[ElemCacheKeyLUT.DOMAIN] : undefined;
        const appid = ElemCacheKeyLUT.APPID ? _stream_cache[ElemCacheKeyLUT.APPID] : undefined;
        const _uri = validLambdaKeyList.includes('?graph') ? _uribase + `?graph=${domain}/${appid}`: _uribase;

        // memoize this function
        const _do_uri_request_memcache_resolver = ({uri}={}) => JSON.stringify({uri});
        const _do_uri_request = async ({uri}={}) => {
            try {
                console.log("executing href request");
                if (typeof window !== 'undefined' && window.location.href.slice(-uri.length) !== uri)
                    window.location.href = uri; //relative to domain
                return uri;
            }
            catch (err) {
                console.log(err);
                return err;
            }
        };

        const throttled_uri_request = _.throttle(async () => {return await _do_uri_request({uri: _uri})}, 1000); // 1000 ms gap
        const req_result = await throttled_uri_request();
        return req_result;
    };

    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _outflow_data$ = new Subject(); //BehaviorSubject(raceConditionError);
        const uri$obj =  (urigen ? 
            driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, node_context, 
                {
                    leaflogic: urigen,
                    datalogic: {post: (_data) => {
                        _stream_cache[ElemCacheKeyLUT.href.URI] = _data;
                        return _data;
                    }}
                }
            ) : 
            (()=>{
                _stream_cache[ElemCacheKeyLUT.href.URI] = _GENERIC_URI;
                return {_stream: new BehaviorSubject(_GENERIC_URI), _control: {_stream: controlflow$obj._stream}}
            })()
        ); 
        //const header$obj = headergen ? headergen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_HEADER)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const header$obj =  (headergen ? 
        //    driveDataflowByCtrlflow(
        //        controlflow$obj, input$objArr, undefined, node_context, 
        //        {
        //            leaflogic: headergen,
        //            datalogic: {post: (_data) => {
        //                _stream_cache[ElemCacheKeyLUT.http.HEADER] = _data;
        //                return _data;
        //            }}
        //        }
        //    ) : 
        //    (()=>{
        //        _stream_cache[ElemCacheKeyLUT.http.HEADER] = _DEFAULT_HEADER;
        //        return {_stream: new BehaviorSubject(_DEFAULT_HEADER), _control: {_stream: controlflow$obj._stream}}
        //    })()
        //); 

        const merged_ctrl_in$ = uri$obj._control._stream; //combineLatest([uri$obj._control._stream, header$obj._control._stream]);
        const merged_data_in$ = uri$obj._stream; //combineLatest([uri$obj._stream, header$obj._stream]);

        const _ctrl_in$ = merged_ctrl_in$.pipe(
            //switchMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
            //    return merged_data_in$;
            //}),
            withLatestFrom(merged_data_in$),
            map(_aux_data_in => {
                console.log(_aux_data_in);

                //return _stream_cache[ElemCacheKeyLUT.CTRLIN];
                return _aux_data_in[0];
            })
        )
                        
        let traffic_semaphore = false;
        const _ctrl_out$ = _ctrl_in$.pipe(
            withLatestFrom(...input$objArr.map(_in$obj=>_in$obj._stream)),
            switchMap(_combined_in => {
                return _elementlogic(_combined_in.slice(1)); // returns a Promise that gets interpreted the same way a stream would
            }),
            map(_data_in => {
                console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc
                //_elementlogic()

                traffic_semaphore = true; // allow data to flow
                if (_data_in?.length > 1 || !Array.isArray(_data_in))
                    _outflow_data$.next(_data_in);
                else if (_data_in?.length === 1)
                    _outflow_data$.next(_data_in[0]);
                // return ctrl
                return _stream_cache[ElemCacheKeyLUT.CTRLIN]; // return the current ctrl
            }),
            share()
        );

        //return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
        return {
            _stream: _outflow_data$.pipe(
                //filter(_data_out=>isBottle(_data_out)&&_data_out._bname !== error),
                filter(_data_out=>traffic_semaphore),
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
    // data preprocessed and returned from this function will continue to flow in the dataflow stream domain
    // of the current element node.
    const _datalogic_pre = (data_in) => {

        const data_out = data_in;

        return data_out;
    };

    // put any static data postprocessing logic applied to all incident data, 
    // to be flown on the outgoing edge stream.
    // data postprocessed and returned from this function will continue to flow in the dataflow stream domain
    // of the current element node.
    const _datalogic_post = (data_in) => {
        const _urlret = data_in;

        const escapeHtml = (text) => {
            // https://stackoverflow.com/questions/1787322/what-is-the-htmlspecialchars-equivalent-in-javascript/4835406#4835406
            var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
            };
            
            return text.replace(/[&<>"']/g, function(m) { return map[m]; });
        };
        const processAxiosObj = (obj) => {
            const objtype = typeof obj;
            if (objtype === "object") {
                return Array.isArray(obj) ?
                    obj.map(_ => {
                        return processAxiosObj(_);
                    }) :
                    ( obj ?
                        Object.fromEntries(Object.entries(obj).map(([_key, _val]) => {
                            return [_key, processAxiosObj(_val)];
                        })) :
                        obj
                    );
            }
            else if (objtype === "string")
            {
                return escapeHtml(obj);
            }
            else // probably of type "number"
            {
                return obj;
            }
        };
        const node_output = formatElementFlowdata((_urlret?.name && _urlret.name === "AxiosError") ? {error: _urlret.message, data: _urlret.response.data} : processAxiosObj(_urlret), "elementio");

        return node_output;
    };

    return {
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            //post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props, cachekeys};

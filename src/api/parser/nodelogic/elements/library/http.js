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
const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in http.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library.js"}, {});
const cachekeys = {
    URI: "_http_uri",
    HEADER: "_http_header",
    REQUEST_TTL_CACHE: "_http_request_ttl_cache"
};

const GENERIC_URI_NAME = "{*}";
const HTTP_REQUEST_BNAME = "http-request";
const URI_FALLBACK_DEFAULT = "https://www.leafgon.com";

/*
example http request bottle looks like so:
{
    _bname: "http-requst",
    _content: {
        uri: "",
        header: "",
        mode: "get", // or "post", "put"
        data: ""
    },
    _label: {}
}
*/

const axios_instances = {};

const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    const urigen = (('uri' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uri)) ? reduced_lambda_obj.uri._default : undefined;
    const headergen = (('header' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.header)) ? reduced_lambda_obj.header._default : undefined;

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/http.js",
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE], 
        //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
    };
    //axios_instances[node_context.refnode] = axios.create({});

    const _GENERIC_URI = "{*}";
    const _DEFAULT_HEADER = "";
    //const axios_instance = axios_instances[node_context.refnode];

    const _elementlogic = async (_data_in, _ctrl_in={}) => {
        //_stream_cache[ElemCacheKeyLUT.DATAIN] = _metadata;
        let _uribase = _stream_cache[ElemCacheKeyLUT.http.URI];          // uri$obj._stream
        let _header = _stream_cache[ElemCacheKeyLUT.http.HEADER];           // header$obj._stream
        
        // spark_dev_note: #http_dataflow_point // corresponding handles upstream
        let _flowdatain = _data_in; //.slice(2);   // [...input$objArr]
        _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

        const recognizedLambdaConstants = ['uri','post','put','get','header','?graph'];
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));

        let http_mode = ((validLambdaKeyList.includes('post')) ? 
            "post" : 
            (validLambdaKeyList.includes('put') ?
                "put":
                "get"
            )
        );
        if (_uribase === GENERIC_URI_NAME && isBottle(_flowdatain) && _flowdatain._bname === HTTP_REQUEST_BNAME) {
            _uribase = _flowdatain._content.uri ? _flowdatain._content.uri : URI_FALLBACK_DEFAULT;
            _header = _flowdatain._content.header ? _flowdatain._content.header : _header;
            http_mode = _flowdatain._content.mode ? _flowdatain._content.mode : http_mode;
            _flowdatain = _flowdatain._content.data ? _flowdatain._content.data : "";
        }
        //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
        //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)
        const domain = ElemCacheKeyLUT.DOMAIN ? _stream_cache[ElemCacheKeyLUT.DOMAIN] : undefined;
        const appid = ElemCacheKeyLUT.APPID ? _stream_cache[ElemCacheKeyLUT.APPID] : undefined;
        const _uri = validLambdaKeyList.includes('?graph') ? _uribase + `?graph=${domain}/${appid}`: _uribase;

        // prepare auth cookies if the provenance label of the _ctrl_in is "leafgon-nodejs" 
        console.log(`leafelement: http: _ctrl_in: ${JSON.stringify(_ctrl_in)}`);
        let _nodejs_cookies = undefined;
        // find at least one object with _label.provenance = 'leaf-nodejs' in the traces
        _ctrl_in.some(entry =>
          Object.values(entry).some(sub => {
            if (
              typeof sub === 'object' &&
              sub._label?.provenance === 'leaf-nodejs'
            ) {
              console.log(`leafelement: http: _ctrl_in originated from leafgon-nodejs, extracting cookies...`);
              _nodejs_cookies = sub._content;
              return true;
            }
            return false;
          })
        );
        //if (_ctrl_in[0]._label.provenance === "leaf-nodejs") {
        //  console.log(`leafelement: http: _ctrl_in originated from leafgon-nodejs, extracting cookies...`);
        //  _nodejs_cookies = _ctrl_in[0]._content;
        //}

        // memoize this function
        const _do_uri_request_memcache_resolver = ({http_mode, uri}={}) => JSON.stringify({http_mode, uri});
        const _do_uri_request = async ({http_mode, uri}={}) => {
            if (['post', 'put'].includes(http_mode)) { // put, post
                //if (http_mode === 'post') {
                //    if (_header?.X_CSRF_Token)
                //        axios_instance.defaults.headers.post['X-CSRF-Token'] = _header.X_CSRF_Token; // https://github.com/axios/axios/issues/2024
                //    axios_instance.defaults.headers.post = {
                //        ...axios_instance.defaults.headers.post, ..._header,
                //        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                //    };
                //}
                //else if (http_mode === 'put') {
                //    if (_header?.X_CSRF_Token)
                //        axios_instance.defaults.headers.put['X-CSRF-Token'] = _header.X_CSRF_Token; // https://github.com/axios/axios/issues/2024
                //    axios_instance.defaults.headers.put = {
                //        ...axios_instance.defaults.headers.post, ..._header,
                //        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                //    };
                //}
                //axios_instance.defaults.withCredentials = true;
                try {
                    //console.log(_flowdatain);
                    //const resprom = validLambdaKeyList.includes('put') ? 
                    //    axios_instance.put(uri,_flowdatain, { withCredentials: true }) : 
                    //    axios_instance.post(uri,_flowdatain, { withCredentials: true });
                    const resprom = uri ?fetch(
                        uri,
                        {
                            method: http_mode.toUpperCase(), //'POST',
                            mode: "cors",
                            headers: _nodejs_cookies ? {
                                ..._header,
                                Cookie: _nodejs_cookies
                                //'Accept': 'application/json',
                                //'Content-Type': 'application/json'
                            } : {
                                ..._header
                            }, // spark changed from headers, -> headers: headers,
                            credentials: 'include', // https://stackoverflow.com/questions/34558264/fetch-api-with-cookie
                            //body: JSON.stringify({query, variables: (variables || {})}),
                            body: JSON.stringify(_flowdatain), 
                        },
                    ) : of([{data: "LEAF element error: http get request submitted with undefined URI"}]);
                    const res = await resprom;
                    const json_output = await res.json();
                    console.log(res);
                    //return _metadata.push(res.data);
                    //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
                    return json_output;
                }
                catch (err) {
                    console.log(err);
                    if (err.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        console.log(err.response.data);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                        //node_output = formatFlowdata(processAxiosObj(err.response.data), "elementio");
                    } else if (err.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.log(err.request);
                        //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', err.message);
                        //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
                    }
                    console.log(err.config);
                    return err.response;
                }
            }
            else { // get
                try {
                    console.log("executing http get");
                    //axios.defaults.headers.get['X-CSRF-Token'] = _header.X_CSRF_Token; // https://github.com/axios/axios/issues/2024
                    //axios_instance.defaults.headers.get = {
                    //    ...axios_instance.defaults.headers.get, 
                    //    ..._header,
                    //    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                    //};
                    //axios_instance.defaults.withCredentials = true;
                    //const resprom = uri ? axios_instance.get(uri) : of([{data: "LEAF element error: http get request submitted with undefined URI"}]);
                    const resprom = uri ? fetch(
                        uri,
                        {
                            method: 'GET',
                            headers: _nodejs_cookies ? {
                                ..._header,
                                'Accept': 'application/json',
                                Cookie: _nodejs_cookies
                                //'Content-Type': 'application/json'
                            } : {..._header,
                                'Accept': 'application/json'
                            }, // spark changed from headers, -> headers: headers,
                            credentials: 'include', // https://stackoverflow.com/questions/34558264/fetch-api-with-cookie
                            //body: JSON.stringify({query, variables: (variables || {})}),
                        },
                    ) : of([{data: "LEAF element error: http get request submitted with undefined URI"}]);
                    const res = await resprom;
                    //return _metadata.push(res.data);

                    const json_output = await res.json();
                    console.log(res);
                    //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
                    return json_output; //res.data;
                }
                catch (err) {
                    if (err.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        console.error(err.response.data);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                        //node_output = formatFlowdata(processAxiosObj(err.response.data), "elementio");
                    } else if (err.request) {
                        // The request was made but no response was received
                        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                        // http.ClientRequest in node.js
                        console.log(err);
                        //node_output = formatFlowdata(processAxiosObj(err.message), "elementio");
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', err.message);
                        //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
                    }
                    console.log(err.config);
                    return err;
                }
            }
        };

        const throttled_uri_request = _.throttle(async () => {return await _do_uri_request({http_mode, uri: _uri})}, 1000); // 1000 ms gap
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
                        _stream_cache[ElemCacheKeyLUT.http.URI] = _data;
                        return _data;
                    }}
                }
            ) : 
            (()=>{
                _stream_cache[ElemCacheKeyLUT.http.URI] = _GENERIC_URI;
                return {_stream: new BehaviorSubject(_GENERIC_URI), _control: {_stream: controlflow$obj._stream}}
            })()
        ); 
        //const header$obj = headergen ? headergen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_HEADER)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        const header$obj =  (headergen ? 
            driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, node_context, 
                {
                    leaflogic: headergen,
                    datalogic: {post: (_data) => {
                        _stream_cache[ElemCacheKeyLUT.http.HEADER] = _data;
                        return _data;
                    }}
                }
            ) : 
            (()=>{
                _stream_cache[ElemCacheKeyLUT.http.HEADER] = _DEFAULT_HEADER;
                return {_stream: new BehaviorSubject(_DEFAULT_HEADER), _control: {_stream: controlflow$obj._stream}}
            })()
        ); 

        const merged_ctrl_in$ = combineLatest([uri$obj._control._stream, header$obj._control._stream]);
        const merged_data_in$ = combineLatest([uri$obj._stream, header$obj._stream]);

        const _ctrl_in$ = merged_ctrl_in$.pipe(
            //switchMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
            //    return merged_data_in$;
            //}),
            withLatestFrom(merged_data_in$),
            map(_aux_data_in => {
                console.log(_aux_data_in);
                console.log(`leafelement: http: controlflow$obj: ${JSON.stringify(controlflow$obj._config)}, ctrl_data: ${JSON.stringify(_aux_data_in[0])}`);

                //return _stream_cache[ElemCacheKeyLUT.CTRLIN];
                return _aux_data_in[0];
            })
        )
                        
        let traffic_semaphore = false;
        const _ctrl_out$ = _ctrl_in$.pipe(
            //switchMap(_ctrl_in => {
            //    //_stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    const _data_in$ = combineLatest([...input$objArr.map(_input=>_input._stream)]);

            //    // return data read from the rx stream domain as an array
            //    //return combineLatest([...input$objArr.map(_obj=>_obj._stream)]);
            //    return _data_in$;
            //}),
            withLatestFrom(...input$objArr.map(_in$obj=>_in$obj._stream)),
            switchMap(_combined_in => {
                return _elementlogic(_combined_in.slice(1), _combined_in[0]); // returns a Promise that gets interpreted the same way a stream would
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
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props, cachekeys};

import { etaReduceLambdaGraphs, etaReduceDataflowComponent, runtimeEtaTree } from '../../eta.js';
import { concatMap, map, withLatestFrom, filter, multicast, share } from 'rxjs/operators';
import { _leafbottle, _leafunbottle } from '../datautils/index.js';
import { zipDataflows, combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
//import { LEAT3DNavigator } from '../../../leafui/elements/gnav';
import { of, BehaviorSubject, combineLatest, Subject, race } from 'rxjs';
import { executeLEAFLogicInSync, executeLEAFLogic, driveDataflowByCtrlflow } from '../../leaf.js';
import { v4 as uuid4 } from 'uuid';
import axios from 'axios';

import _ from 'lodash';

//https://www.npmjs.com/package/quickjs-emscripten
import { newQuickJSAsyncWASMModule, newQuickJSWASMModule, shouldInterruptAfterDeadline } from "quickjs-emscripten";

import { ElemCacheKeyLUT, initStdElementProps } from './library/index.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leafelement.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/leafelement.js"}, {});
// generateLambdaDataflow() is a function to generate dataflow from invoking LEAF lambda functions defined in _lambda_lut
// and to integrate the dataflow as part of the runtime dataflow stream (_inputdata$) of the current main leaf app, 
// according to the specification in _element_def of lambda functions defined as _val.type of "input".
// _lambda_lut is the reduced_lambda_obj passed by argument from the host node.
const generateLambdaDataflow = (_lambda_lut, _controlflow_config, _element_def, _inputdata$) => {
    // returns a new object with the values at each key mapped using mapFn(value)
    function objectMap(object, mapFn) {
        return Object.keys(object).reduce(function(result, key) {
        result[key] = mapFn(key, object[key])
        return result
        }, {})
    }

    //_element_def = {edges: "input", tagaction: "output", elementio: "label"};

    //const edgesgen = (('edges' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.edges)) ? reduced_lambda_obj.edges._default : undefined;
    const objlist = objectMap(_element_def, (_key, _val) => {
        if (_val.type === "input") {
            const genfunc = ((_key in _lambda_lut) && ('_default' in _lambda_lut[_key])) ? _lambda_lut[_key]._default : undefined;
            
            const genfunc$obj = (genfunc ? executeLEAFLogicInSync(genfunc, _inputdata$, undefined, {..._controlflow_config}, _key) : {_stream: of(_val.default ? _val.default : [])});

            return genfunc$obj;
        }
    });

    // as per the element lambda definition in /scripts/elements/testelement3.js
    // the following object is created.
    // objlist = {edges: {…}, backdrop: {…}, tagvectors: {…}, tagaction: undefined, elementio: undefined}
    // JSON.stringify(objlist) === 
    // '{"edges":{"_stream":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{}}}}}}}}}}},"backdrop":{"_stream":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{}}}}}}}}}}}}},"tagvectors":{"_stream":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{"source":{}}}}}}}}}}}}}}'
    console.log(objlist);
    return objlist;
};
const elementapi = (elejs_context) => {
    const contextoutput = {}; //undefined;
    const elementapi = elejs_context.newObject();
    const apigetinput = elejs_context.newFunction("getinput", () => {
        return elejs_context.newString(JSON.stringify({hello: "world"}));
    });
    const apisetoutput = elejs_context.newFunction("setoutput", async (...args) => {
        const nativeArgs = args.map(elejs_context.dump);
        contextoutput.data = nativeArgs.length > 0 ? nativeArgs[0] : undefined;
    });
    const apiuuid4 = elejs_context.newFunction("uuid4", () => {
        //const nativeArgs = args.map(context.dump);
        //contextoutput = nativeArgs.length > 0 ? nativeArgs[0] : undefined;
        const a_uuid4 = uuid4();
        return elejs_context.newString(a_uuid4);
    });
    elejs_context.setProp(elementapi, "input", apigetinput);
    elejs_context.setProp(elementapi, "output", apisetoutput);
    elejs_context.setProp(elementapi, "uuid4", apiuuid4);
    elejs_context.setProp(elejs_context.global, "elementapi", elementapi);
    // `console.log`
    const logHandle = elejs_context.newFunction("log", (...args) => {
        const nativeArgs = args.map(elejs_context.dump)
        console.log(`(leafElementJS) ${elementname}:`, ...nativeArgs)
    })
    // Partially implement `console` object
    const consoleHandle = elejs_context.newObject();
    elejs_context.setProp(consoleHandle, "log", logHandle);
    elejs_context.setProp(elejs_context.global, "console", consoleHandle);

    return contextoutput;
};


const initWASMModule = _.memoize(async (_refnode, _elemfunc) => {
    const module = new Object();
    module.wasm = await newQuickJSAsyncWASMModule();
    module.jsruntime = module.wasm.newRuntime();
    module.context = module.jsruntime.newContext();
    module.refnode = _refnode;
    //return module;
    const elementconfig = await _elemfunc(module);
    return elementconfig;
});

//let element_data_cache = {};
const _leafelement = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        // space for node type specific init prior to use
        // check for parsing error conditions
        if (!contextuallambda) {
            throw `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
                `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`;
        }
        
        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});

        const _defaultLambda = ('_default' in reduced_lambda_obj) ?
            (input$) => reduced_lambda_obj._default([input$]) :
            (input$) => input$;

        // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
        // if it supported an array of keys to be unbottled in one go.

        //const filterDataOfInterest = _leafdataUnbottle({bottlekey:'_leafdeck'});
        //const bottleUp = _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafelement'}}}}, nodelambda: [], contextuallambda});
        const {type, args} = refnodedata.leaf.logic;


        const elementname = refnodedata.leaf.logic.args.elementname;

        const defaultdomain = lambdactrl.gos.etaTree.hostdomain;
        const defaultappid = lambdactrl.gos.etaTree.hostappid;
        const graphdomain = lambdactrl.gos.etaTree.domain;
        const graphappid = lambdactrl.gos.etaTree.appid;
        const getDomain = (('domain' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.domain)) ? reduced_lambda_obj.domain._default : undefined;
        const getAppid = (('appid' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.appid)) ? reduced_lambda_obj.appid._default : undefined;

        const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
        const edgesgen = (('edges' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.edges)) ? reduced_lambda_obj.edges._default : undefined;
        const iselementio = ('elementio' in reduced_lambda_obj) ? true : false;
        //const backdropgen = (('backdrop' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.backdrop)) ? reduced_lambda_obj.backdrop._default : undefined;
        //const domain = getDomain ? await executeLEAFLogic(getDomain, [], {}) : defaultdomain;
        //const appid = getAppid ? await executeLEAFLogic(getAppid, [], {}) : defaultappid;
        //const uidefs = uidefsgen ? await executeLEAFLogic(uidefsgen, [], {}) : [];
        const formatFlowdata = (data, datakey="defaultio") => { // datakey="defaultio" or "elementio"
            if (!iselementio)
            {
                return data;
            }
            else {
                return doBottle(datakey, data);
            }
        };

        const elementiosubject$ = new BehaviorSubject(raceConditionError);

        //const elementscript = document.createElement("script");
        //elementscript.onload = function (inst) {
        //    console.log("element script ", elementname, " loaded,",elementscript);
        //};
        //elementscript.setAttribute("data-main", "elements/testelement-main");
        //elementscript.src = "/scripts/lib/require.js";
        //document.head.appendChild(elementscript);
        async function loadTestElem (module) {
            //const testmodule = await import("http://localhost/scripts/element/testelement.js");
            //const loadedrequirejs = await axios.get("/scripts/lib/require.js");
            //const path = await import("path");
            //const importsPath = "/scripts/";
            console.log(module);
            const modulecopy = module;
            const _jsruntime = modulecopy.jsruntime;
            _jsruntime.setModuleLoader(async (moduleUrl) => {
                //const modulePath = path.join(importsPath, moduleName);
                //if (!modulePath.startsWith(importsPath)) {
                //    throw new Error("out of bounds")
                //}
                //const modulestr = await axios.get(importsPath+moduleName);

                // regex check for url pattern in moduleUrl for security
                const full_url_regex = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
                '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-zA-Z\!\\@\\d%_.~+]*)*'+ // validate port and path, modified to accomodate exclamation char in url paths
                '(\\?[;&a-zA-Z\\d%_.~+=-]*)?'+ // validate query string
                //'(\\@([0-9.])*)?'+
                '(\\#[-a-zA-Z\\d_]*)?$','i'); // validate fragment locator

                const relative_url_regex = new RegExp('(^\/)([-a-zA-Z0-9\!\\@\\d%_.~+]*\/?)*');

                const regexret = moduleUrl.match(full_url_regex);
                const logSuspiciousModuleUrl = (_url) => {
                    console.log("jsruntime.setModuleLoader(): module is not from esm.sh: ", _url);
                    return _url;
                };
                let _module_url = moduleUrl.match(relative_url_regex) ? moduleUrl.slice(1) : moduleUrl;
                _module_url = regexret ? (["esm.sh"].includes(regexret[2]) ? (regexret[1] ? _module_url : "https://"+_module_url) : logSuspiciousModuleUrl(_module_url)) : "https://esm.sh/"+_module_url;

                //const modulestr = await loadEsmModule(moduleUrl);
                console.log("jsruntime.setModuleLoader(): preprocessed url:", _module_url);
                if (_module_url === "https://esm.sh/v106/mp@0.0.1/es2022/mp.js")
                    console.log("start debugging");
                const modulestr = _module_url ? await lambdactrl.gos.etaTree.loadElementJsEsmModule(_module_url) : "";
                return Buffer.from(modulestr, 'utf-8').toString();
            });
            // evalCodeAsync is required when execution may suspend.
            if (module.context) {
                const _context = module.context;
                const elementapi = _context.newObject();
                const apigetinput = _context.newFunction("getinput", () => {
                    return _context.newString(JSON.stringify({hello: "world"}));
                });
                let contextoutput = undefined;
                const apisetoutput = _context.newFunction("setoutput", async (...args) => {
                    const nativeArgs = args.map(_context.dump);
                    contextoutput = nativeArgs.length > 0 ? nativeArgs[0] : undefined;
                });
                const apiuuid4 = _context.newFunction("uuid4", () => {
                    //const nativeArgs = args.map(context.dump);
                    //contextoutput = nativeArgs.length > 0 ? nativeArgs[0] : undefined;
                    const a_uuid4 = uuid4();
                    return _context.newString(a_uuid4);
                });
                _context.setProp(elementapi, "input", apigetinput);
                _context.setProp(elementapi, "output", apisetoutput);
                _context.setProp(elementapi, "uuid4", apiuuid4);
                _context.setProp(_context.global, "elementapi", elementapi);
                // `console.log`
                const logHandle = _context.newFunction("log", (...args) => {
                    const nativeArgs = args.map(_context.dump)
                    console.log(`(leafElementJS) ${elementname}:`, ...nativeArgs)
                })
                // Partially implement `console` object
                const consoleHandle = _context.newObject()
                _context.setProp(consoleHandle, "log", logHandle)
                _context.setProp(_context.global, "console", consoleHandle)
                const loadedjs = await axios.get("/scripts/elements/testelement3.js");
                // execute elementjs code and get element lambda config dictionary
                try {
                    console.log("testmodule loaded: ", loadedjs);
                    const result = await _context.evalCodeAsync(
                        //loadedrequirejs.data+
                        loadedjs.data+
                        `console.log("returning lambda config");`+
                        `elementapi.output(elementconfig.lambda);`
                        //`console.log(elementapi.input());`+
                        //`const testobj = JSON.parse(elementapi.input());`+
                        //`elementapi.output(testobj);`+
                        //`globalThis.rtoutput=JSON.stringify(output);`
                        //,
                        //{
                        //    shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + 1000),
                        //    memoryLimitBytes: 1024 * 1024,
                        //}
                    );
                    _context.unwrapResult(result).dispose()
                    //const rtoutput = context.getProp(context.global, "rtoutput").consume(context.getString)
                    //console.log(rtoutput);
                }
                catch (err) {
                    console.log(err);
                };
                //return contextoutput;
                const lambdaconfig = contextoutput;
                const _elementconfig = {
                    lambda:  lambdaconfig,
                    main: async (_inputdata) => {
                        try {
                            const result = await _context.evalCodeAsync(
                                //loadedrequirejs.data+
                                loadedjs.data+
                                `console.log("running main");`+
                                //`elementconfig.main(${JSON.stringify(_inputdata)});`
                                `elementapi.output(elementconfig.main(${JSON.stringify(_inputdata)}));`
                                //{
                                //    shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + 1000),
                                //    memoryLimitBytes: 1024 * 1024,
                                //}
                            );
                            _context.unwrapResult(result).dispose();
                            //const resolvedResult = context.resolvePromise(promiseHandle);
                            //contextoutput = await context.resolvePromise(contextoutput);
                            //const resolvedHandle = context.unwrapResult(resolvedResult);
                            //console.log("Result:", context.getString(resolvedHandle));
                            //resolvedHandle.dispose();
                        }
                        catch (err) {
                            console.log(err);
                        };
                        return contextoutput;
                    }
                };

                return _elementconfig;
            }
            return undefined;
        }
        //const elementconfig = await loadTestElem(_module);

        // spark_dev_note: debugging WASM module
        //const elementconfig = await initWASMModule(refnode, loadTestElem);
        //const mainresult = elementconfig.main ? await elementconfig.main({hello: "world"}) : undefined;

        //generateLambdaDataflow(_lambda_lut, _element_def, _inputdata$);
        //const scriptelem = document.getElementById("elementscripttag-"+refnode);
        //if (!scriptelem) {
        //    const elementscriptloader = document.createElement("script");
        //    elementscriptloader.setAttribute("id", "elementscripttag-"+refnode);
        //    elementscriptloader.innerHTML = //"requirejs(['/scripts/elements/testelement']);"
        //        "require.config({\
        //            baseUrl: '/scripts/lib',\
        //            paths: {\
        //                elements: '/scripts/elements'\
        //            }\
        //        });\
        //        require(['elements/testelement'], function (telem) {\
        //            window.leafelements = {test: telem.myfunc};\
        //            console.log('elements/testelement loaded:', telem)});";

        //    //elementscriptloader.src = '/scripts/elements/testelement';

        //    //requirejs(['/scripts/common'], function (common) {\
        //    //    requirejs(['/scripts/elements/testelement']);\
        //    //});
        //        //requirejs(['/scripts/elements/testelement.js'], function (tele){\
        //        //    window.leafelements = {test: tele};\
        //        //    console.log('testelement:',tele);\
        //        //});\
        //        //requirejs(['/scripts/elements/testelement.js']);\
        //    document.head.appendChild(elementscriptloader);
        //}

        if (["f30e", "7a65"].includes(refnode.slice(0,4)))
            console.log("start debugging");

        const node_context = {
            codebase: "leafelement.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
        };

        //element_data_cache[refnode] = {};
        let element_data_cache = {};
        element_data_cache[ElemCacheKeyLUT.LAMBDA_OBJ] = reduced_lambda_obj;
        element_data_cache[ElemCacheKeyLUT.REFNODE] = refnode;
        element_data_cache[ElemCacheKeyLUT.RTCONTEXT] = {graphdomain, graphappid, refnodedata, nodelambda, contextuallambda};
        const _std_elements_props = initStdElementProps(element_data_cache, elementname);

        return (input$objArr, controlflow$obj) => {
            if (refnode?.slice(0,4) === "d1d2")
                console.log("start debugging refnode:", refnode);
            //const merged$obj = combineDataflows(refnode, flowinput$Arr);
            //const merged$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leafelement.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
            //merged$obj._control = controlflow$obj;
            //const resolvedinput$obj = await Promise.all(merged$obj);
            //return resolved_;
            //inflow_ctrl$.connect();

            const _cachecommondata = (_ctrl_in$) => {
                return _ctrl_in$.pipe(
                    map(_ctrl_input=>{
                        element_data_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_input;
                        element_data_cache[ElemCacheKeyLUT.DOMAIN] = lambdactrl.gos.etaTree.domain;
                        element_data_cache[ElemCacheKeyLUT.APPID] = lambdactrl.gos.etaTree.appid;
                        return _ctrl_input;
                    })
                );
            };

            const inflow_ctrl$ = _cachecommondata(controlflow$obj._stream); //.pipe(multicast(()=>new Subject()));

            const _preprocessflow = (_ctrl_in$) => {
                return _ctrl_in$.pipe(
                    concatMap(_ctrl_input=>{
                        const merged_input$ = combineLatest(input$objArr.map(_input=>_input._stream));
                        //const merged_input$ = combineLatest(flowinput$Arr.map(_input=>_input._stream));
                        // spark_dev_note: the rows of executeLEAFLogicInSync here are invoked with runtime ctrl config carrying
                        // information such as loopidx and/or clubrefnode, etc that can provide context to enable indexing in elements being spawned.
                        //const domain$obj = getDomain ? executeLEAFLogicInSync(getDomain, merged_input$, undefined, inflow_ctrl$, {...controlflow$obj._config}) : {_stream: of(defaultdomain), _control: {_stream: inflow_ctrl$}};
                        //domain$obj._control = {...controlflow$obj, _stream: inflow_ctrl$};
                        //const appid$obj = getAppid ? executeLEAFLogicInSync(getAppid, merged_input$, undefined, inflow_ctrl$, {...controlflow$obj._config}) : {_stream: of(defaultappid), _control: {_stream: inflow_ctrl$}};
                        //appid$obj._control = {...controlflow$obj, _stream: inflow_ctrl$};

                        const _ctrl_data$ = of(_ctrl_input);
                        const domain$obj = driveDataflowByCtrlflow(
                            {_stream: _ctrl_data$}, input$objArr, undefined, {...node_context, step: "get the current domain"}, 
                            {
                                leaflogic: getDomain, 
                                datalogic: {
                                    pre: (_data) => {
                                        element_data_cache["_input_data"] = _data;
                                    },
                                    post: (_data)=>{
                                        element_data_cache["domain"] = _data;
                                        return _data;
                                    }
                                }
                            }
                        );
                        const appid$obj = driveDataflowByCtrlflow(
                            domain$obj._control, input$objArr, undefined, {...node_context, step: "get the current domain"}, 
                            {
                                leaflogic: getAppid, 
                                datalogic: {
                                    post: (_data)=>{
                                        element_data_cache["appid"] = _data;
                                        return _data;
                                    }
                                }
                            }
                        );

                        if (["http"].includes(elementname)) {
                            const urigen = (('uri' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uri)) ? reduced_lambda_obj.uri._default : undefined;
                            const headergen = (('header' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.header)) ? reduced_lambda_obj.header._default : undefined;
                            const uri$obj = urigen ? executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
                            //uri$obj._control = {...controlflow$obj, _stream: _ctrl_data$};
                            const header$obj = headergen ? executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
                            //header$obj._control = {...controlflow$obj, _stream: _ctrl_data$};

                            // now time to combine the three flows
                            const http_ctrl$ = combineLatest([domain$obj._control._stream, appid$obj._control._stream, uri$obj._control._stream, header$obj._control._stream]).pipe(map(_combined_ctrl=>_combined_ctrl[0]));

                            const http_cache = {};
                            const combined_metadata$ = http_ctrl$.pipe(
                                map(_http_ctrl=>combineLatest([...input$objArr.map(_input=>_input._stream), domain$obj._stream, appid$obj._stream, uri$obj._stream, header$obj])),
                                concatMap(_metadata=> {
                                    http_cache['_metadata'] = _metadata;
                                    const recognizedLambdaConstants = ['uri','post','put','get','header','?graph'];
                                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                                    const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                                    //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
                                    //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)
                                    const uri = validLambdaKeyList.includes('?graph') ? _metadata[3] + `?graph=${_metadata[1]}/${_metadata[2]}`: _metadata[3];
                                    if (validLambdaKeyList.includes('post') || validLambdaKeyList.includes('put')) {
                                        if (_metadata[4].X_CSRF_Token)
                                            axios.defaults.headers.post['X-CSRF-Token'] = _metadata[4].X_CSRF_Token; // https://github.com/axios/axios/issues/2024
                                        try {
                                            console.log(_metadata[0]);
                                            const res = validLambdaKeyList.includes('put') ? 
                                                axios.put(uri,_metadata[0]) : 
                                                axios.post(uri,_metadata[0]);
                                            console.log(res);
                                            //return _metadata.push(res.data);
                                            //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
                                            return res;
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
                                        }
                                    }
                                    else { // get
                                        try {
                                            console.log("executing http get");
                                            const res = axios.get(uri);
                                            console.log(res);
                                            //return _metadata.push(res.data);
            
                                            //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
                                            return res;
                                        }
                                        catch (err) {
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
                                                console.log(err);
                                                //node_output = formatFlowdata(processAxiosObj(err.message), "elementio");
                                            } else {
                                                // Something happened in setting up the request that triggered an Error
                                                console.log('Error', err.message);
                                                //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
                                            }
                                            console.log(err.config);
                                        }
                                    }

                                }),
                                map( _urlret => {
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
                                                Object.fromEntries(Object.entries(obj).map(([_key, _val]) => {
                                                    return [_key, processAxiosObj(_val)];
                                                }));
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
                                    const _node_output = formatFlowdata(processAxiosObj(_urlret.data), "elementio");
                                    return _node_output;
                                })
                            );
                            return combined_metadata$;
                            //const combined_metadata$ = combineDataflows(refnode, [maindata$obj, domain$obj, appid$obj, uri$obj, header$obj], false);
                            //return combined_metadata$._stream
                        }
                        else if (["mediaplayer"].includes(elementname)) {
                            const urigen = (('uri' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uri)) ? reduced_lambda_obj.uri._default : undefined;
                            const uri$obj = urigen ? executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([])};
                            //uri$obj._control = controlflow$obj;
                            //const header$obj = headergen ? executeLEAFLogicInSync(headergen, of(_data), {...controlflow$obj._config}) : {_stream: of([])};

                            // now time to combine the three flows
                            //const combined_metadata$ = combineDataflows(refnode, [maindata$obj, domain$obj, appid$obj, uri$obj], false);
                            //return combined_metadata$._stream
                            const mediaplayer_ctrl$ = combineLatest([domain$obj._control._stream, appid$obj._control._stream, uri$obj._control._stream]).pipe(map(_combined_ctrl=>_combined_ctrl[0]));
                            const combined_metadata$ = mediaplayer_ctrl$.pipe(map(_mediaplayer_ctrl=>combineLatest([...input$objArr.map(_input=>_input._stream), domain$obj._stream, appid$obj._stream, uri$obj._stream])));
                            return combined_metadata$;
                        }
                        else if (['gnav', 'popup', 'image', 'editor', 'text', 'prompt'].includes(elementname)) {
                            //const uidefs$obj = uidefsgen ? executeLEAFLogicInSync(uidefsgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
                            //const edges$obj = edgesgen ? executeLEAFLogicInSync(edgesgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

                            const uidefs$obj = uidefsgen ? driveDataflowByCtrlflow(
                                appid$obj._control, input$objArr, undefined, node_context, 
                                {
                                    leaflogic: uidefsgen, 
                                    datalogic: {
                                        post: (_data)=>{
                                            element_data_cache["uidefs"] = _data;
                                            return _data;
                                        }
                                    }
                                }
                            ) : undefined;
                            const edges$obj = driveDataflowByCtrlflow(
                                uidefsgen ? uidefs$obj._control : appid$obj._control, input$objArr, undefined, node_context, 
                                {
                                    leaflogic: edgesgen,
                                    datalogic: {post: (_data) => {
                                        element_data_cache["edges"] = _data;
                                        return _data;
                                    }}
                                }
                            );
                            const backdropgen = (('backdrop' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.backdrop)) ? reduced_lambda_obj.backdrop._default : undefined;
                            //const backdrop$obj = (elementname == 'gnav' ? (backdropgen ? executeLEAFLogicInSync(backdropgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of("/assets/test/hubbleinfrared_dark2.jpg"), _control: {_stream: _ctrl_data$}}) : {_stream: of([]), _control: {_stream: _ctrl_data$}});
                            const backdrop$obj = (elementname == 'gnav' ? 
                                (backdropgen ? 
                                    driveDataflowByCtrlflow(
                                        edges$obj._control, input$objArr, undefined, node_context, 
                                        {
                                            leaflogic: backdropgen,
                                            datalogic: {post: (_data) => {
                                                element_data_cache["backdrop"] = _data;
                                                return _data;
                                            }}
                                        }
                                    ) : 
                                    {_stream: of("/assets/test/hubbleinfrared_dark2.jpg"), _control: {_stream: _ctrl_data$}}
                                ) : 
                                {_stream: of([]), _control: {_stream: _ctrl_data$}}
                            );

                            const bgtagvectorsgen = (('tagvectors' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.tagvectors)) ? reduced_lambda_obj.tagvectors._default : undefined;
                            //const bgtagvectors$obj = (elementname == 'gnav' ? (bgtagvectorsgen ? executeLEAFLogicInSync(bgtagvectorsgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}}) : {_stream: of([]), _control: {_stream: _ctrl_data$}});
                            const bgtagvectors$obj = (elementname == 'gnav' ? (bgtagvectorsgen ? driveDataflowByCtrlflow(controlflow$obj, input$objArr, undefined, node_context, {leaflogic: bgtagvectorsgen}) : {_stream: of([]), _control: {_stream: _ctrl_data$}}) : {_stream: of([]), _control: {_stream: _ctrl_data$}});

                            //const element_ctrl$ = combineLatest([
                            //    _ctrl_data$,
                            //    domain$obj._control._stream.pipe(map(_data=>{
                            //        return _data;
                            //    })), 
                            //    appid$obj._control._stream, 
                            //    uidefs$obj._control._stream, 
                            //    edges$obj._control._stream, 
                            //    backdrop$obj._control._stream
                            //]).pipe(
                            //    map(_combined_ctrl=>{
                            //        return _combined_ctrl[0];
                            //    }),
                            //    share()
                            //);
                            const element_ctrl$ = backdrop$obj._control._stream;

                            // now time to combine the three flows
                            //const combined_metadata$ = combineDataflows(refnode, [maindata$obj, domain$obj, appid$obj, uidefs$obj, edges$obj, backdrop$obj, bgtagvectors$obj], false, true);
                            //return combined_metadata$._control._stream.pipe(withLatestFrom(...[maindata$obj._stream, domain$obj._stream, appid$obj._stream, uidefs$obj._stream, edges$obj._stream, backdrop$obj._stream, bgtagvectors$obj._stream]));
                            const combined_metadata$ = element_ctrl$.pipe(map(_element_ctrl=>{
                                //return combineLatest([...flowinput$Arr.map(_input=>_input._stream), domain$obj._stream, appid$obj._stream, uidefs$obj._stream, edges$obj._stream, backdrop$obj._stream]);
                                return [element_data_cache["_input_data"], element_data_cache["domain"], element_data_cache["appid"], element_data_cache["uidefs"], element_data_cache["edges"], element_data_cache["backdrop"]];
                            }));
                            return combined_metadata$;
                        }
                    })
                );
            };

            const postprocessfunc = (_metadata) => {
                //const resolved_data = await Promise.all([_data].flat()); 
                // as per the discussion in https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise
                let node_output = undefined; 

                //{element: {gnav: {nodeuuid, componentloader}}}
                if (elementname === 'gnav') {
                    const graph_options = { 'layout': '3d' };
                    const mock_navnodeedges = [];

                    // spark_dev_note: (22/Mar/2023)
                    // #bugreport #mar2023bug1
                    // _metadata[4] is an un-exited _databus bottle 
                    // fix: to convert undefined data to []
                    //const navnodeedges = _metadata[4].map((edge) => {return {...edge, uuid: uuid4()};});
                    // spark_dev_note: 18/Jun/2023
                    // #databus
                    //const _edgelist = exitDataBus({_bus: _metadata[4]}) 
                    const _edgelist = doUnbottle("edges", _metadata[4]); 
                    const navnodeedges = (_edgelist ? _edgelist : []).map((edge) => {return {...edge, uuid: uuid4()};});

                    const navbackdrop = _metadata[5]; //.map(() => {return {...edge, uuid: uuid4()};});
                    const bgtagvectors = _metadata[6];
                    node_output = formatFlowdata({
                        element: { 
                            nodeuuid: refnode,
                            type: 'gnav',
                            componentdata: {
                                //graph_data: {"nodes": Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]], "edges": mock_navnodeedges},
                                graph_data: {"nodes": Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]], "edges": navnodeedges},
                                backdrop_url: navbackdrop,
                                bgtagvectors: async () => {
                                    const _leaflogic = (('tagvectors' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.tagvectors)) ? reduced_lambda_obj.tagvectors._default : undefined;
                                    const _leaflogic_ret = (_leaflogic ?
                                        await executeLEAFLogic(_leaflogic, [], {...controlflow$obj._config}) : 
                                        []);
                                    return _leaflogic_ret;
                                },
                                tagaction: async (_tagid) => {
//const domain = getDomain ? await executeLEAFLogic(getDomain, [], {}) : defaultdomain;
                                    const tagactionlogic = (('tagaction' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.tagaction)) ? reduced_lambda_obj.tagaction._default : undefined;
                                    const tagaction_ret = (tagactionlogic ?
                                        await executeLEAFLogic(tagactionlogic, _tagid, {...controlflow$obj._config}) : 
                                        _tagid);

                                    if (iselementio)
                                        elementiosubject$.next(doBottle('elementio', {element: 'gnav', nodeuuid: refnode, io: {'tagaction': tagaction_ret}}));
                                    return tagaction_ret;
                                },
                                blankaction: async (_coord) => {
//const domain = getDomain ? await executeLEAFLogic(getDomain, [], {}) : defaultdomain;
                                    const blankactionlogic = (('blankaction' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.blankaction)) ? reduced_lambda_obj.blankaction._default : undefined;
                                    const blankaction_ret = (blankactionlogic ?
                                        await executeLEAFLogic(blankactionlogic, _coord, {...controlflow$obj._config}) : 
                                        _coord);
                                    return blankaction_ret;
                                },
                                graph_options
                            }
                            //componentloader: (_leafio) => {
                            //    //const mock_navnodeedges2 = [
                            //    //// spark_dev_note: determine where the provenance of navnodeedges would be provided. in the bottle? or nowhere?
                            //    //// the following structure is what's used in the leaf graph either for a node or for an edge
                            //    ////        provenance: {  
                            //    ////            graph: {domain: 'storm', appid: 'leafeditor'} // about the graph that initiated the creation of this edge
                            //    ////        },
                            //    //// for now (21 Feb 2022), we're sticking to the following structure for testing purposes
                            //    //    {
                            //    //        //label: '',
                            //    //        source: {uuid: '308bd84f-3af2-478e-ae35-b2842a9bd3a2'}, 
                            //    //        target: {uuid: '308bd84f-3af2-478e-ae35-b2842a9bd3a3'},
                            //    //        uuid: 'aca6bb1e-44c6-41ff-94e6-742888cd8ff2', // an edge id unique in the domain
                            //    //    },
                            //    //];
                            //    const graph_data = {"nodes": Array.isArray(x) ? x : [x], "edges": mock_navnodeedges};
                            //    return <LEAT3DNavigator data={{graph_data: graph_data}} leafio={_leafio} graph_options={graph_options} />
                            //}
                        }
                    }, "screenio");
                }
                else if (elementname === 'popup') {
                    //{element: {nodeuuid, type, componentdata: {unmountCallback, children}}}
                    //const children = ('children' in reduced_lambda_obj) ? reduced_lambda_obj.children() : [];
                    //const unmountCallback = ('onclose' in reduced_lambda_obj) ? reduced_lambda_obj.onclose._default : () => {console.log('hello world popup')};
                    const recognizedLambdaConstants = ['headless', 'top', 'tt', 'bottom', 'bb', 'left', 'll', 'right', 'rr', 'topleft', 'ttll', 'topright', 'ttrr', 'bottomleft', 'bbll', 'bottomright', 'bbrr', 'center','centre'];
                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_)).map(_ => (_ === 'centre') ? 'center': _);
                    const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : undefined;
                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'popup',
                            componentdata: {
                                poprect,
                                headless: ('headless' in reduced_lambda_obj) ? true : false,
                                ismenu: ('jester' in reduced_lambda_obj) ? true : false,
                                unmountCallback: async () => {
                                    const _leaflogic = (('onclose' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.onclose)) ? reduced_lambda_obj.onclose._default : undefined;
                                    const _leaflogic_ret = (_leaflogic ?
                                        await executeLEAFLogic(_leaflogic, [], {...controlflow$obj._config}) : 
                                        []);

                                    if (iselementio)
                                        elementiosubject$.next(doBottle('elementio', {element: 'popup', nodeuuid: refnode, io: {'onclose': _leaflogic_ret}}));
                                    return _leaflogic_ret;
                                },
                                children: Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]],
                                graphdomain, graphappid, refnode, nodelambda, contextuallambda, // passing this leafnode trio along with their graph address, just so the vim editor can parse and invoke the "onsave" lambda function in situ.
                            }
                        }
                    }, "screenio");
                }
                else if (elementname === 'image') {
                    //{element: {nodeuuid, type, componentdata: {unmountCallback, children}}}
                    //const children = ('children' in reduced_lambda_obj) ? reduced_lambda_obj.children() : [];
                    const unmountCallback = ('onclose' in reduced_lambda_obj) ? reduced_lambda_obj.onclose : () => {console.log('hello world image')};
                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'image',
                            componentdata: {
                                children: Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]]
                            }
                        }
                    }, "screenio");
                }
                else if (elementname === 'mediainput') {
                    const recognizedLambdaConstants = ['image', 'audio', 'video'];
                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                    const mediatype = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'image'; // default to 'image' type
                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'mediainput',
                            componentdata: {
                                mediatype: mediatype,
                                nodeinput: Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]],
                                callbacks: {
                                    onDropAccepted: (files, dropevent) => {
                                        console.log("start debugging");
                                    }
                                }
                            }
                        }
                    }, "screenio");
                }
                else if (elementname === 'editor') {

                    const recognizedLambdaConstants = ['top','bottom','left','right','topleft','topright','bottomleft','bottomright','center','centre'];
                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_)).map(_ => (_ === 'centre') ? 'center': _);
                    const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'editor',
                            componentdata: {
                                domain: _metadata[1], //domain,
                                appid: _metadata[2], //appid, 
                            }
                        }
                    }, "screenio");
                }
                else if (elementname === 'text') {
                    const recognizedLambdaConstants = ['lambda', 'onsave', 'gspot']; // lambda as in "lambda plane"
                    //const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    //const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                    const textsource = 'lambda' in reduced_lambda_obj ? 'lambda' : 'dataflow'; // dataflow as in "dataflow plane"

                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'text',
                            componentdata: { // this serves as storage config for the text editor component
                                textsource: textsource, 
                                domain: _metadata[1], //domain,
                                appid: _metadata[2], //appid, 
                                //lambdasourceuuid: controlflow$obj._control?._config?.nodeuuid, // config passed from the origin leafnode such as leaflisp. 
                                lambdarefnodedata: controlflow$obj._config?.refnodedata, // config passed from the origin leafnode such as leaflisp, data passing setup via registerHammer in sysmenu.js & nodemenu.js . 
                                lambdasourceuuid: controlflow$obj._config?.nodeuuid, // config passed from the origin leafnode such as leaflisp. 
                                dataflowinput: _metadata[0], //Array.isArray(_metadata[0]) ? _metadata[0] : [_metadata[0]],
                                graphdomain, graphappid, refnode, nodelambda, contextuallambda, // passing this leafnode trio along with their graph address, just so the vim editor can parse and invoke the "onsave" lambda function in situ.
                            }
                        }
                    }, "screenio");
                }
                else if (elementname === 'prompt') {
                    const recognizedLambdaConstants = ['uidefs', 'margin', 'fieldwidth'];
                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                    //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
                    //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)

                    const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
                    const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;
                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'prompt',
                            componentdata: {
                                //etaTree: lambdactrl.gos.etaTree,
                                uidefs: _metadata[3], //uidefs,
                                margin: marginval ? marginval[0] : 1,
                                fieldwidth: fieldwidthval ? fieldwidthval[0] : '25ch', 
                                graphdomain, graphappid, refnode, nodelambda, contextuallambda,
                            },
                        }
                    }, "screenio");
                }
                else if (elementname === 'http') {
                    node_output = _metadata[0];
                }
                else if (elementname === 'mediaplayer') {
                    //const recognizedLambdaConstants = ['uidefs', 'margin', 'fieldwidth'];
                    const recognizedLambdaConstants = ['uri'];
                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
                    //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
                    //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)

                    const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
                    const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;
                    node_output = formatFlowdata({
                        element: {
                            nodeuuid: refnode,
                            type: 'mediaplayer',
                            componentdata: {
                                //etaTree: lambdactrl.gos.etaTree,
                                uri: _metadata[3], //uidefs,
                                margin: marginval ? marginval[0] : 1,
                                fieldwidth: fieldwidthval ? fieldwidthval[0] : '25ch', 
                                graphdomain, graphappid, refnode, nodelambda, contextuallambda,
                            },
                        }
                    }, "screenio");
                }
                //else if (elementname === 'editor') {
                //    return node_output;
                //}
                // lookup element type
                //console.log('input$ ' + JSON.stringify(input$));
                //console.log('a leafpopupview processed for node ' + deckname + ' with toggle: ' + logictoggle + ', flowinput: ' + node_input);
                //console.log('input: '+ node_input + ' ' + Date.now() + ' ' + JSON.stringify(node_data)); 
                // execute node level logic and optionally set node_output here
                // put together a data object as required by gnav's popup view to function.
                // TBD: node_output = _leafelementslib(type, args);

                //console.log('leafelement node logic executed: ' + JSON.stringify(node_output));
                //return node_output; // ? node_output : node_input; // the default is to return input i as is. return a node defined non-null output otherwise.
                if (iselementio)
                    elementiosubject$.next(node_output);
                return node_output;
                //return elementiosubject$;
            };

            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                console.log("start debugging");
                const _outflow_data$ = new BehaviorSubject(raceConditionError);
    
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    concatMap(_ctrl_in=> {
                        element_data_cache["_input_ctrl"] = _ctrl_in;
                        //flowinterface.ctrl_in.next(_ctrl_in);
                        return _preprocessflow(of(_ctrl_in)); 
                    }),
                    map(_combined_in => {
                        const _next_data = _combined_in.filter(_data=>_data!==undefined);
                        if (_next_data.length > 0) { // in and out, presence of input data indicates the intention of memory write
                            const memorybottle = domemoryio(_next_data);
                            _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
                        }
                        else { // out only, no input data indicates the intention of memory retrieval
                            const memorybottle = domemoryio(undefined);
                            _outflow_data$.next(memorybottle); // publish the next available post-processed data via the data flow subject channel
                        }
                        return element_data_cache["_input_ctrl"]; // only pass the ctrl data in the flow;
                    }),
                    share()
                );
                return {_stream: _outflow_data$, _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }

            //const output$obj = driveDataflowByCtrlflow(
            //    controlflow$obj, input$objArr, undefined, 
            //    {...node_context, metastep: "element "+elementname}, 
            //    {leaflogic: _nodeflowfunc, datalogic: {post: postprocessfunc}}
            //);
            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            //const consolidated_input$objArr = [{_stream: chronosDataflow(controlflow$obj._stream, input$objArr.map(_$obj=>_$obj._stream), false, CHRONOSTYPE_SYNC, {time: 10000})}];
            if ("elementio$" in _std_elements_props) {
                // make elementio$ handle of the current leafelement accessable from etaTree 
                // currently leafelement of type prompt supports this feature.
                lambdactrl.gos.etaTree.leafio.elementioLUT[refnode] = _std_elements_props.elementio$;
            }
            const output$obj = driveDataflowByCtrlflow(
                {_stream: inflow_ctrl$}, input$objArr, undefined, 
                {...node_context, metastep: "element "+elementname}, 
                {
                    leaflogic: _std_elements_props ? _std_elements_props.leaflogic : undefined, 
                    datalogic: {
                        pre: _std_elements_props ? _std_elements_props.datalogic.pre : undefined,
                        post: _std_elements_props ? _std_elements_props.datalogic.post : undefined
                    }
                }
            ); 
            //{_stream: controlflow$obj._stream.pipe(concatMap(_ctrl_in => {return combineLatest(input$objArr.map(_obj=>_obj._stream))})), _control: controlflow$obj._stream};

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
    methods: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        const runtimestate = {configtext: ''};
        return {
            texteditor: {
                setTextSource: (configtext) => {
                    runtimestate.configtext = configtext;

                    // now do the saving up in the lake
                    const node_data = {
                        ...refnodedata
                    };
                    //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                    //console.log(lambdactrl);

                    // keypath = ['lispexpression'] for leaflisp
                    // ['elementconfig'] for leafelement as defined in metamodel.js
                    node_data.leaf.logic.args.elementconfig = configtext;
                    //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current); 
                    //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                    if (!is_interactive)
                        lambdactrl.gos.etaTree.leaflakeio.qm_methods.updateNode({variables: {uuid: refnode, data: encodeUnicode(JSON.stringify(node_data))}});
                },
                getTextSource: () => {
                    //console.log(refnodedata);
                    return refnodedata.leaf.logic.args.elementconfig
                },
            },
            general: {
                getNodeData: () => {
                    return refnodedata;
                },
                getLambdaLUT: async () => {
                    const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
                    const lambda_lut = {};
                    Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
                        lambda_lut[key] = (input$Arr, controlflow$obj) => { // a dataflow-scoped func per key
                            const output$obj = etafunc(input$Arr, controlflow$obj);
                            return {...output$obj, _control: controlflow$obj};
                        }
                    });
                    return lambda_lut;
                },
                setElementName: (name) => {
                    // now do the saving up in the lake
                    const node_data = {
                        ...refnodedata
                    };
                    //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                    //console.log(lambdactrl);

                    // keypath = ['lispexpression'] for leaflisp
                    node_data.leaf.logic.args.elementname = name;
                    //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current); 
                    //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                    lambdactrl.gos.etaTree.leaflakeio.qm_methods.updateNode({variables: {uuid: refnode, data: encodeUnicode(JSON.stringify(node_data))}});
                }
            }
        };
    }
};

export { _leafelement };

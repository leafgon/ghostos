import { etaReduceLambdaGraphs } from "../../eta.js";
import { concatMap, map } from "rxjs/operators";
import { of, combineLatest } from "rxjs";
import { executeLEAFLogicInSync, driveDataflowByCtrlflow } from "../../leaf.js";
import axios from "axios";

//https://www.npmjs.com/package/quickjs-emscripten
//import { newQuickJSAsyncWASMModule } from "quickjs-emscripten";

import { ElemCacheKeyLUT, initStdElementProps } from "./library/index.js";
import { doBottle } from "../datautils/bottling.js";
import { encodeUnicode } from "../../../utils/leafbase64.js";

//const initWASMModule = _.memoize(async (_refnode, _elemfunc) => {
//    const module = new Object();
//    module.wasm = await newQuickJSAsyncWASMModule();
//    module.jsruntime = module.wasm.newRuntime();
//    module.context = module.jsruntime.newContext();
//    module.refnode = _refnode;
//    //return module;
//    const elementconfig = await _elemfunc(module);
//    return elementconfig;
//});

//let element_data_cache = {};
const _leafelement = {
  dataflow:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      // space for node type specific init prior to use
      // check for parsing error conditions
      if (!contextuallambda) {
        throw (
          `LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node ` +
          `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}).`
        );
      }

      const reduced_lambda_obj = await etaReduceLambdaGraphs({
        refnode,
        nodelambda,
        contextuallambda,
        etaTree: lambdactrl.gos.etaTree,
      });

      // spark_dev_note: I think _leafdataUnbottle currently only supports a single key, in the future it would be whole lot more useful
      // if it supported an array of keys to be unbottled in one go.

      //const filterDataOfInterest = _leafdataUnbottle({bottlekey:'_leafdeck'});
      //const bottleUp = _leafbottle.dataflow(lambdactrl)({refnodedata: {leaf: {logic: {args: {bottlekey:'_leafelement'}}}}, nodelambda: [], contextuallambda});
      const elementname = refnodedata.leaf.logic.args.elementname;

      const graphdomain = lambdactrl.gos.etaTree.domain;
      const graphappid = lambdactrl.gos.etaTree.appid;
      const getDomain =
        "domain" in reduced_lambda_obj && "_default" in reduced_lambda_obj.domain
          ? reduced_lambda_obj.domain._default
          : undefined;
      const getAppid =
        "appid" in reduced_lambda_obj && "_default" in reduced_lambda_obj.appid
          ? reduced_lambda_obj.appid._default
          : undefined;

      const uidefsgen =
        "uidefs" in reduced_lambda_obj && "_default" in reduced_lambda_obj.uidefs
          ? reduced_lambda_obj.uidefs._default
          : undefined;
      const edgesgen =
        "edges" in reduced_lambda_obj && "_default" in reduced_lambda_obj.edges
          ? reduced_lambda_obj.edges._default
          : undefined;
      const iselementio = "elementio" in reduced_lambda_obj ? true : false;
      //const backdropgen = (('backdrop' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.backdrop)) ? reduced_lambda_obj.backdrop._default : undefined;
      //const domain = getDomain ? await executeLEAFLogic(getDomain, [], {}) : defaultdomain;
      //const appid = getAppid ? await executeLEAFLogic(getAppid, [], {}) : defaultappid;
      //const uidefs = uidefsgen ? await executeLEAFLogic(uidefsgen, [], {}) : [];
      const formatFlowdata = (data, datakey = "defaultio") => {
        // datakey="defaultio" or "elementio"
        if (!iselementio) {
          return data;
        } else {
          return doBottle(datakey, data);
        }
      };

      //const elementscript = document.createElement("script");
      //elementscript.onload = function (inst) {
      //    console.log("element script ", elementname, " loaded,",elementscript);
      //};
      //elementscript.setAttribute("data-main", "elements/testelement-main");
      //elementscript.src = "/scripts/lib/require.js";
      //document.head.appendChild(elementscript);
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

      if (["f30e", "7a65"].includes(refnode.slice(0, 4))) console.log("start debugging");

      const node_context = {
        codebase: "leafelement.js",
        refnode,
        leafnode:
          lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data,
      };

      //element_data_cache[refnode] = {};
      let element_data_cache = {};
      element_data_cache[ElemCacheKeyLUT.LAMBDA_OBJ] = reduced_lambda_obj;
      element_data_cache[ElemCacheKeyLUT.REFNODE] = refnode;
      element_data_cache[ElemCacheKeyLUT.RTCONTEXT] = {
        graphdomain,
        graphappid,
        refnodedata,
        nodelambda,
        contextuallambda,
      };
      const _std_elements_props = initStdElementProps(element_data_cache, elementname);

      return (input$objArr, controlflow$obj) => {
        if (refnode?.slice(0, 4) === "d1d2") console.log("start debugging refnode:", refnode);
        //const merged$obj = combineDataflows(refnode, flowinput$Arr);
        //const merged$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leafelement.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
        //merged$obj._control = controlflow$obj;
        //const resolvedinput$obj = await Promise.all(merged$obj);
        //return resolved_;
        //inflow_ctrl$.connect();

        const _cachecommondata = (_ctrl_in$) => {
          return _ctrl_in$.pipe(
            map((_ctrl_input) => {
              element_data_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_input;
              element_data_cache[ElemCacheKeyLUT.DOMAIN] = lambdactrl.gos.etaTree.domain;
              element_data_cache[ElemCacheKeyLUT.APPID] = lambdactrl.gos.etaTree.appid;
              return _ctrl_input;
            }),
          );
        };

        const inflow_ctrl$ = _cachecommondata(controlflow$obj._stream); //.pipe(multicast(()=>new Subject()));

        const _preprocessflow = (_ctrl_in$) => {
          return _ctrl_in$.pipe(
            concatMap((_ctrl_input) => {
              const merged_input$ = combineLatest(input$objArr.map((_input) => _input._stream));
              //const merged_input$ = combineLatest(flowinput$Arr.map(_input=>_input._stream));
              // spark_dev_note: the rows of executeLEAFLogicInSync here are invoked with runtime ctrl config carrying
              // information such as loopidx and/or clubrefnode, etc that can provide context to enable indexing in elements being spawned.
              //const domain$obj = getDomain ? executeLEAFLogicInSync(getDomain, merged_input$, undefined, inflow_ctrl$, {...controlflow$obj._config}) : {_stream: of(defaultdomain), _control: {_stream: inflow_ctrl$}};
              //domain$obj._control = {...controlflow$obj, _stream: inflow_ctrl$};
              //const appid$obj = getAppid ? executeLEAFLogicInSync(getAppid, merged_input$, undefined, inflow_ctrl$, {...controlflow$obj._config}) : {_stream: of(defaultappid), _control: {_stream: inflow_ctrl$}};
              //appid$obj._control = {...controlflow$obj, _stream: inflow_ctrl$};

              const _ctrl_data$ = of(_ctrl_input);
              const domain$obj = driveDataflowByCtrlflow(
                { _stream: _ctrl_data$ },
                input$objArr,
                undefined,
                { ...node_context, step: "get the current domain" },
                {
                  leaflogic: getDomain,
                  datalogic: {
                    pre: (_data) => {
                      element_data_cache["_input_data"] = _data;
                    },
                    post: (_data) => {
                      element_data_cache["domain"] = _data;
                      return _data;
                    },
                  },
                },
              );
              const appid$obj = driveDataflowByCtrlflow(
                domain$obj._control,
                input$objArr,
                undefined,
                { ...node_context, step: "get the current domain" },
                {
                  leaflogic: getAppid,
                  datalogic: {
                    post: (_data) => {
                      element_data_cache["appid"] = _data;
                      return _data;
                    },
                  },
                },
              );

              if (["http"].includes(elementname)) {
                const urigen =
                  "uri" in reduced_lambda_obj && "_default" in reduced_lambda_obj.uri
                    ? reduced_lambda_obj.uri._default
                    : undefined;
                const headergen =
                  "header" in reduced_lambda_obj && "_default" in reduced_lambda_obj.header
                    ? reduced_lambda_obj.header._default
                    : undefined;
                const uri$obj = urigen
                  ? executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {
                      ...controlflow$obj._config,
                    })
                  : { _stream: of([]), _control: { _stream: _ctrl_data$ } };
                //uri$obj._control = {...controlflow$obj, _stream: _ctrl_data$};
                const header$obj = headergen
                  ? executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {
                      ...controlflow$obj._config,
                    })
                  : { _stream: of([]), _control: { _stream: _ctrl_data$ } };
                //header$obj._control = {...controlflow$obj, _stream: _ctrl_data$};

                // now time to combine the three flows
                const http_ctrl$ = combineLatest([
                  domain$obj._control._stream,
                  appid$obj._control._stream,
                  uri$obj._control._stream,
                  header$obj._control._stream,
                ]).pipe(map((_combined_ctrl) => _combined_ctrl[0]));

                const http_cache = {};
                const combined_metadata$ = http_ctrl$.pipe(
                  map((_http_ctrl) =>
                    combineLatest([
                      ...input$objArr.map((_input) => _input._stream),
                      domain$obj._stream,
                      appid$obj._stream,
                      uri$obj._stream,
                      header$obj,
                    ]),
                  ),
                  concatMap((_metadata) => {
                    http_cache["_metadata"] = _metadata;
                    const recognizedLambdaConstants = [
                      "uri",
                      "post",
                      "put",
                      "get",
                      "header",
                      "?graph",
                    ];
                    const curLambdaKeys = Object.keys(reduced_lambda_obj);
                    const validLambdaKeyList = recognizedLambdaConstants.filter((_) =>
                      curLambdaKeys.includes(_),
                    );
                    //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
                    //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)
                    const uri = validLambdaKeyList.includes("?graph")
                      ? _metadata[3] + `?graph=${_metadata[1]}/${_metadata[2]}`
                      : _metadata[3];
                    if (validLambdaKeyList.includes("post") || validLambdaKeyList.includes("put")) {
                      if (_metadata[4].X_CSRF_Token)
                        axios.defaults.headers.post["X-CSRF-Token"] = _metadata[4].X_CSRF_Token; // https://github.com/axios/axios/issues/2024
                      try {
                        console.log(_metadata[0]);
                        const res = validLambdaKeyList.includes("put")
                          ? axios.put(uri, _metadata[0])
                          : axios.post(uri, _metadata[0]);
                        console.log(res);
                        //return _metadata.push(res.data);
                        //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
                        return res;
                      } catch (err) {
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
                          console.log("Error", err.message);
                          //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
                        }
                        console.log(err.config);
                      }
                    } else {
                      // get
                      try {
                        console.log("executing http get");
                        const res = axios.get(uri);
                        console.log(res);
                        //return _metadata.push(res.data);

                        //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
                        return res;
                      } catch (err) {
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
                          console.log("Error", err.message);
                          //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
                        }
                        console.log(err.config);
                      }
                    }
                  }),
                  map((_urlret) => {
                    const escapeHtml = (text) => {
                      // https://stackoverflow.com/questions/1787322/what-is-the-htmlspecialchars-equivalent-in-javascript/4835406#4835406
                      var map = {
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#039;",
                      };

                      return text.replace(/[&<>"']/g, function (m) {
                        return map[m];
                      });
                    };
                    const processAxiosObj = (obj) => {
                      const objtype = typeof obj;
                      if (objtype === "object") {
                        return Array.isArray(obj)
                          ? obj.map((_) => {
                              return processAxiosObj(_);
                            })
                          : Object.fromEntries(
                              Object.entries(obj).map(([_key, _val]) => {
                                return [_key, processAxiosObj(_val)];
                              }),
                            );
                      } else if (objtype === "string") {
                        return escapeHtml(obj);
                      } else // probably of type "number"
                      {
                        return obj;
                      }
                    };
                    const _node_output = formatFlowdata(processAxiosObj(_urlret.data), "elementio");
                    return _node_output;
                  }),
                );
                return combined_metadata$;
                //const combined_metadata$ = combineDataflows(refnode, [maindata$obj, domain$obj, appid$obj, uri$obj, header$obj], false);
                //return combined_metadata$._stream
              } else if (["mediaplayer"].includes(elementname)) {
                const urigen =
                  "uri" in reduced_lambda_obj && "_default" in reduced_lambda_obj.uri
                    ? reduced_lambda_obj.uri._default
                    : undefined;
                const uri$obj = urigen
                  ? executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {
                      ...controlflow$obj._config,
                    })
                  : { _stream: of([]) };
                //uri$obj._control = controlflow$obj;
                //const header$obj = headergen ? executeLEAFLogicInSync(headergen, of(_data), {...controlflow$obj._config}) : {_stream: of([])};

                // now time to combine the three flows
                //const combined_metadata$ = combineDataflows(refnode, [maindata$obj, domain$obj, appid$obj, uri$obj], false);
                //return combined_metadata$._stream
                const mediaplayer_ctrl$ = combineLatest([
                  domain$obj._control._stream,
                  appid$obj._control._stream,
                  uri$obj._control._stream,
                ]).pipe(map((_combined_ctrl) => _combined_ctrl[0]));
                const combined_metadata$ = mediaplayer_ctrl$.pipe(
                  map((_mediaplayer_ctrl) =>
                    combineLatest([
                      ...input$objArr.map((_input) => _input._stream),
                      domain$obj._stream,
                      appid$obj._stream,
                      uri$obj._stream,
                    ]),
                  ),
                );
                return combined_metadata$;
              } else if (
                ["gnav", "popup", "image", "editor", "text", "prompt"].includes(elementname)
              ) {
                //const uidefs$obj = uidefsgen ? executeLEAFLogicInSync(uidefsgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
                //const edges$obj = edgesgen ? executeLEAFLogicInSync(edgesgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

                const uidefs$obj = uidefsgen
                  ? driveDataflowByCtrlflow(
                      appid$obj._control,
                      input$objArr,
                      undefined,
                      node_context,
                      {
                        leaflogic: uidefsgen,
                        datalogic: {
                          post: (_data) => {
                            element_data_cache["uidefs"] = _data;
                            return _data;
                          },
                        },
                      },
                    )
                  : undefined;
                const edges$obj = driveDataflowByCtrlflow(
                  uidefsgen ? uidefs$obj._control : appid$obj._control,
                  input$objArr,
                  undefined,
                  node_context,
                  {
                    leaflogic: edgesgen,
                    datalogic: {
                      post: (_data) => {
                        element_data_cache["edges"] = _data;
                        return _data;
                      },
                    },
                  },
                );
                const backdropgen =
                  "backdrop" in reduced_lambda_obj && "_default" in reduced_lambda_obj.backdrop
                    ? reduced_lambda_obj.backdrop._default
                    : undefined;
                //const backdrop$obj = (elementname == 'gnav' ? (backdropgen ? executeLEAFLogicInSync(backdropgen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of("/assets/test/hubbleinfrared_dark2.jpg"), _control: {_stream: _ctrl_data$}}) : {_stream: of([]), _control: {_stream: _ctrl_data$}});
                const backdrop$obj =
                  elementname == "gnav"
                    ? backdropgen
                      ? driveDataflowByCtrlflow(
                          edges$obj._control,
                          input$objArr,
                          undefined,
                          node_context,
                          {
                            leaflogic: backdropgen,
                            datalogic: {
                              post: (_data) => {
                                element_data_cache["backdrop"] = _data;
                                return _data;
                              },
                            },
                          },
                        )
                      : {
                          _stream: of("/assets/test/hubbleinfrared_dark2.jpg"),
                          _control: { _stream: _ctrl_data$ },
                        }
                    : { _stream: of([]), _control: { _stream: _ctrl_data$ } };

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
                const combined_metadata$ = element_ctrl$.pipe(
                  map((_element_ctrl) => {
                    //return combineLatest([...flowinput$Arr.map(_input=>_input._stream), domain$obj._stream, appid$obj._stream, uidefs$obj._stream, edges$obj._stream, backdrop$obj._stream]);
                    return [
                      element_data_cache["_input_data"],
                      element_data_cache["domain"],
                      element_data_cache["appid"],
                      element_data_cache["uidefs"],
                      element_data_cache["edges"],
                      element_data_cache["backdrop"],
                    ];
                  }),
                );
                return combined_metadata$;
              }
            }),
          );
        };
        _preprocessflow(inflow_ctrl$);

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
          { _stream: inflow_ctrl$ },
          input$objArr,
          undefined,
          { ...node_context, metastep: "element " + elementname },
          {
            leaflogic: _std_elements_props ? _std_elements_props.leaflogic : undefined,
            datalogic: {
              pre: _std_elements_props ? _std_elements_props.datalogic.pre : undefined,
              post: _std_elements_props ? _std_elements_props.datalogic.post : undefined,
            },
          },
        );
        //{_stream: controlflow$obj._stream.pipe(concatMap(_ctrl_in => {return combineLatest(input$objArr.map(_obj=>_obj._stream))})), _control: controlflow$obj._stream};

        return output$obj;
      };
    },
  lambda:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      // space for node type specific init prior to use
      // note the cross over in the roles of nodelambda and contextuallambda
      const reduced_lambda_obj = await etaReduceLambdaGraphs({
        refnode,
        nodelambda: contextuallambda,
        contextuallambda: nodelambda,
        etaTree: lambdactrl.gos.etaTree,
      });
      const lambda_lut = {};
      Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
        lambda_lut[key] = (input$Arr, controlflow$obj) => {
          // a dataflow-scoped func per key
          const output$obj = etafunc(input$Arr, controlflow$obj);
          return { ...output$obj, _control: controlflow$obj };
        };
      });
      return lambda_lut;
    },
  methods:
    (lambdactrl) =>
    async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
      const runtimestate = { configtext: "" };
      const is_interactive = false;
      return {
        texteditor: {
          setTextSource: (configtext) => {
            runtimestate.configtext = configtext;

            // now do the saving up in the lake
            const node_data = {
              ...refnodedata,
            };
            //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
            //console.log(lambdactrl);

            // keypath = ['lispexpression'] for leaflisp
            // ['elementconfig'] for leafelement as defined in metamodel.js
            node_data.leaf.logic.args.elementconfig = configtext;
            //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current);
            //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
            if (!is_interactive)
              lambdactrl.gos.etaTree.leaflakeio.qm_methods.updateNode({
                variables: { uuid: refnode, data: encodeUnicode(JSON.stringify(node_data)) },
              });
          },
          getTextSource: () => {
            //console.log(refnodedata);
            return refnodedata.leaf.logic.args.elementconfig;
          },
        },
        general: {
          getNodeData: () => {
            return refnodedata;
          },
          getLambdaLUT: async () => {
            const reduced_lambda_obj = await etaReduceLambdaGraphs({
              refnode,
              nodelambda,
              contextuallambda,
              etaTree: lambdactrl.gos.etaTree,
            });
            const lambda_lut = {};
            Object.entries(reduced_lambda_obj).map(([key, etafunc]) => {
              lambda_lut[key] = (input$Arr, controlflow$obj) => {
                // a dataflow-scoped func per key
                const output$obj = etafunc(input$Arr, controlflow$obj);
                return { ...output$obj, _control: controlflow$obj };
              };
            });
            return lambda_lut;
          },
          setElementName: (name) => {
            // now do the saving up in the lake
            const node_data = {
              ...refnodedata,
            };
            //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
            //console.log(lambdactrl);

            // keypath = ['lispexpression'] for leaflisp
            node_data.leaf.logic.args.elementname = name;
            //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current);
            //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
            lambdactrl.gos.etaTree.leaflakeio.qm_methods.updateNode({
              variables: { uuid: refnode, data: encodeUnicode(JSON.stringify(node_data)) },
            });
          },
        },
      };
    },
};

export { _leafelement };

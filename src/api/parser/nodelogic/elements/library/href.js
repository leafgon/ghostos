import { BehaviorSubject, Subject } from "rxjs";
import { switchMap, filter, map, share, withLatestFrom } from "rxjs/operators";

import { ElemCacheKeyLUT } from "./index.js";

import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { isBottle } from "../../../predicates.js";
import { createSafeLogger } from "../../../runtime/safeLogging.js";
import _ from "lodash";

const runtimeLogger = createSafeLogger({ component: "leafelement.href" });

const cachekeys = {
  URI: "_href_uri",
};

const GENERIC_URI_NAME = "{*}";
const HREF_REQUEST_BNAME = "href-request";
const URI_FALLBACK_DEFAULT = "https://www.leafgon.com";

class HrefNavigationError extends Error {
  constructor(code, message, { details = {} } = {}) {
    super(message);
    this.name = "HrefNavigationError";
    this.code = code;
    this.details = details;
  }
}

const maybeTrimString = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value instanceof URL) {
    return value.href;
  }
  return undefined;
};

const normalizeHrefNavigationCommand = (input = {}) => {
  const content = isBottle(input) && input._bname === HREF_REQUEST_BNAME ? input._content : input;
  if (typeof content === "string" || content instanceof URL) {
    return {
      uri: `${content}`,
    };
  }
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new HrefNavigationError(
      "invalid_href_command",
      "href navigation command must be an object.",
      { details: { input } },
    );
  }
  return {
    uri: content.uri ?? content.url ?? content.href ?? content.target,
    data: content.data,
    replace: content.replace === true,
    currentHref: content.currentHref,
    idempotency: content.idempotency,
    domainCommandId: content.domainCommandId ?? content.commandId ?? content.intentId,
    tenantId: content.tenantId,
    integrationInstanceId: content.integrationInstanceId,
    producerId: content.producerId,
  };
};

const assertHrefNavigationCommand = (command) => {
  const uri = maybeTrimString(command?.uri);
  if (!uri) {
    throw new HrefNavigationError(
      "missing_href_target",
      "href navigation command requires a target URI.",
      { details: { uri: command?.uri } },
    );
  }
  const idempotency = command.idempotency ?? {};
  const hasIdempotencyKey = Boolean(
    idempotency.key ||
    idempotency.domainCommandId ||
    command.domainCommandId ||
    idempotency.allowGraphLocalFallback === true,
  );
  if (!hasIdempotencyKey) {
    throw new HrefNavigationError(
      "missing_href_idempotency",
      "href navigation command requires idempotency metadata.",
      { details: { uri } },
    );
  }
  return {
    ...command,
    uri,
  };
};

const resolveHrefNavigationIdempotency = (command) => {
  const normalized = assertHrefNavigationCommand(command);
  const idempotency = normalized.idempotency ?? {};
  return {
    required: true,
    key: idempotency.key,
    scope: idempotency.scope,
    domainCommandId: idempotency.domainCommandId ?? normalized.domainCommandId,
    tenantId: idempotency.tenantId ?? normalized.tenantId,
    integrationInstanceId: idempotency.integrationInstanceId ?? normalized.integrationInstanceId,
    producerId: idempotency.producerId ?? normalized.producerId,
    allowGraphLocalFallback: idempotency.allowGraphLocalFallback === true,
  };
};

const createBrowserNavigationTarget = () => {
  const location = globalThis.window?.location;
  if (!location) {
    return undefined;
  }
  return {
    get href() {
      return location.href;
    },
    assign: (uri) => {
      location.href = uri;
    },
    replace: (uri) => {
      if (typeof location.replace === "function") {
        location.replace(uri);
      } else {
        location.href = uri;
      }
    },
  };
};

const hrefMatchesCurrentLocation = (currentHref, targetHref) => {
  const current = maybeTrimString(currentHref);
  const target = maybeTrimString(targetHref);
  if (!current || !target) {
    return false;
  }
  return current === target || current.endsWith(target);
};

const executeHrefNavigationCommand = async ({ command, navigationTarget } = {}) => {
  const normalized = assertHrefNavigationCommand(normalizeHrefNavigationCommand(command));
  const target = navigationTarget ?? createBrowserNavigationTarget();
  const currentHref = normalized.currentHref ?? target?.href;
  if (hrefMatchesCurrentLocation(currentHref, normalized.uri)) {
    return {
      status: "noop",
      navigated: false,
      reason: "already_at_target",
      uri: normalized.uri,
      replace: normalized.replace,
    };
  }
  if (!target) {
    return {
      status: "noop",
      navigated: false,
      reason: "missing_navigation_target",
      uri: normalized.uri,
      replace: normalized.replace,
    };
  }
  if (typeof target === "function") {
    await target(normalized.uri, normalized);
  } else if (normalized.replace && typeof target.replace === "function") {
    await target.replace(normalized.uri, normalized);
  } else if (typeof target.assign === "function") {
    await target.assign(normalized.uri, normalized);
  } else if ("href" in target) {
    target.href = normalized.uri;
  } else {
    throw new HrefNavigationError(
      "invalid_navigation_target",
      "href navigation target must be a function or location-like object.",
      { details: { uri: normalized.uri } },
    );
  }
  return {
    status: "navigated",
    navigated: true,
    uri: normalized.uri,
    replace: normalized.replace,
  };
};

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

const initElementInterface = (_stream_cache) => {
  const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
  const urigen =
    "uri" in reduced_lambda_obj && "_default" in reduced_lambda_obj.uri
      ? reduced_lambda_obj.uri._default
      : undefined;
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
    let _uribase = _stream_cache[ElemCacheKeyLUT.href.URI]; // uri$obj._stream

    // spark_dev_note: #http_dataflow_point // corresponding handles upstream
    let _flowdatain = _data_in; //.slice(2);   // [...input$objArr]
    _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

    if (
      _uribase === GENERIC_URI_NAME &&
      isBottle(_flowdatain) &&
      _flowdatain._bname === HREF_REQUEST_BNAME
    ) {
      _uribase = _flowdatain._content.uri ? _flowdatain._content.uri : URI_FALLBACK_DEFAULT;
      //_header = _flowdatain._content.header ? _flowdatain._content.header : _header;
      _flowdatain = _flowdatain._content.data ? _flowdatain._content.data : "";
    }
    //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
    //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)
    const _uri = _uribase;

    const _do_uri_request = async ({ uri } = {}) => {
      try {
        runtimeLogger.debug("executing href request");
        if (typeof window !== "undefined" && window.location.href.slice(-uri.length) !== uri)
          window.location.href = uri; //relative to domain
        return uri;
      } catch (err) {
        runtimeLogger.debug(err);
        return err;
      }
    };

    const throttled_uri_request = _.throttle(async () => {
      return await _do_uri_request({ uri: _uri });
    }, 1000); // 1000 ms gap
    const req_result = await throttled_uri_request();
    return req_result;
  };

  const _leaflogic = (input$objArr, controlflow$obj) => {
    //const _stream_cache = {};
    //const _outflow_data$ = new BehaviorSubject(raceConditionError);
    const _outflow_data$ = new Subject(); //BehaviorSubject(raceConditionError);
    const uri$obj = urigen
      ? driveDataflowByCtrlflow(controlflow$obj, input$objArr, undefined, node_context, {
          leaflogic: urigen,
          datalogic: {
            post: (_data) => {
              _stream_cache[ElemCacheKeyLUT.href.URI] = _data;
              return _data;
            },
          },
        })
      : (() => {
          _stream_cache[ElemCacheKeyLUT.href.URI] = _GENERIC_URI;
          return {
            _stream: new BehaviorSubject(_GENERIC_URI),
            _control: { _stream: controlflow$obj._stream },
          };
        })();
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
      map((_aux_data_in) => {
        runtimeLogger.debug(_aux_data_in);

        //return _stream_cache[ElemCacheKeyLUT.CTRLIN];
        return _aux_data_in[0];
      }),
    );

    let traffic_semaphore = false;
    const _ctrl_out$ = _ctrl_in$.pipe(
      withLatestFrom(...input$objArr.map((_in$obj) => _in$obj._stream)),
      switchMap((_combined_in) => {
        return _elementlogic(_combined_in.slice(1)); // returns a Promise that gets interpreted the same way a stream would
      }),
      map((_data_in) => {
        runtimeLogger.debug("testing element _leaflogic: ", _data_in);
        // perform any output data (write) operations specific to the element here
        // like sending messages to rx subjects, etc
        //_elementlogic()

        traffic_semaphore = true; // allow data to flow
        if (_data_in?.length > 1 || !Array.isArray(_data_in)) _outflow_data$.next(_data_in);
        else if (_data_in?.length === 1) _outflow_data$.next(_data_in[0]);
        // return ctrl
        return _stream_cache[ElemCacheKeyLUT.CTRLIN]; // return the current ctrl
      }),
      share(),
    );

    //return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
    return {
      _stream: _outflow_data$.pipe(
        //filter(_data_out=>isBottle(_data_out)&&_data_out._bname !== error),
        filter((_data_out) => traffic_semaphore),
        map((_data_out) => {
          runtimeLogger.debug(_data_out);
          return _data_out;
        }),
        share(),
      ),
      _control: {
        _stream: _ctrl_out$.pipe(
          map((_ctrl_out) => {
            runtimeLogger.debug(_ctrl_out);
            return _ctrl_out;
          }),
          share(),
        ),
      },
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
  return {
    leaflogic: _leaflogic,
    datalogic: {
      pre: _datalogic_pre,
      //post: _datalogic_post
    },
  };
};

const props = initElementInterface;

export {
  HrefNavigationError,
  assertHrefNavigationCommand,
  cachekeys,
  executeHrefNavigationCommand,
  normalizeHrefNavigationCommand,
  props,
  resolveHrefNavigationIdempotency,
};

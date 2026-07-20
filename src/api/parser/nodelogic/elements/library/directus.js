import { Subject, combineLatest, of } from "rxjs";
import { switchMap, filter, map, share, withLatestFrom } from "rxjs/operators";

import { ElemCacheKeyLUT, formatElementFlowdata } from "./index.js";

import axios from "axios";
import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { isBottle } from "../../../predicates.js";
import { createSafeLogger } from "../../../runtime/safeLogging.js";
import _ from "lodash";

const runtimeLogger = createSafeLogger({ component: "leafelement.directus" });
const DIRECTUS_READ_OPERATIONS = Object.freeze(["get", "read", "list", "query"]);
const DIRECTUS_MUTATION_OPERATIONS = Object.freeze([
  "post",
  "put",
  "patch",
  "delete",
  "create",
  "update",
  "upsert",
]);
const DIRECTUS_REQUEST_BNAME = "directus-request";
const DIRECTUS_MUTATION_BNAME = "directus-mutation";
const RETRYABLE_DIRECTUS_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const cachekeys = {
  //URI: "_directus_uri",
  //HEADER: "_directus_header",
};

class DirectusRuntimeError extends Error {
  constructor(code, message, { statusCode, retryable = false, details = {} } = {}) {
    super(message);
    this.name = "DirectusRuntimeError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
  }
}

const maybeTrimString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeDirectusOperation = (operation = "read") => {
  const normalized = maybeTrimString(operation)?.toLowerCase();
  if (!normalized) {
    throw new DirectusRuntimeError(
      "invalid_directus_operation",
      "Directus operation is required.",
      {
        details: { operation },
      },
    );
  }
  if (
    !DIRECTUS_READ_OPERATIONS.includes(normalized) &&
    !DIRECTUS_MUTATION_OPERATIONS.includes(normalized)
  ) {
    throw new DirectusRuntimeError(
      "unsupported_directus_operation",
      `Unsupported Directus operation: ${normalized}.`,
      { details: { operation } },
    );
  }
  return normalized;
};

const isDirectusReadOperation = (operation) =>
  DIRECTUS_READ_OPERATIONS.includes(normalizeDirectusOperation(operation));

const isDirectusMutationOperation = (operation) =>
  DIRECTUS_MUTATION_OPERATIONS.includes(normalizeDirectusOperation(operation));

const normalizeDirectusRequestCommand = (input = {}) => {
  const content =
    isBottle(input) &&
    (input._bname === DIRECTUS_REQUEST_BNAME || input._bname === DIRECTUS_MUTATION_BNAME)
      ? input._content
      : input;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new DirectusRuntimeError(
      "invalid_directus_command",
      "Directus command must be an object.",
      { details: { input } },
    );
  }
  const credentials = content.credentials ?? {};
  const headers = content.headers ?? content.header ?? {};
  return {
    operation: normalizeDirectusOperation(content.operation ?? content.action ?? content.method),
    endpoint:
      content.endpoint ?? content.baseUrl ?? content.apiBaseUrl ?? content.uri ?? content.url,
    collection: content.collection,
    itemId: content.itemId ?? content.id,
    query: content.query ?? content.params,
    headers,
    token:
      content.token ??
      content.accessToken ??
      content.authToken ??
      credentials.token ??
      credentials.accessToken,
    authorization: content.authorization ?? headers.authorization ?? headers.Authorization,
    body: content.body ?? content.data ?? content.payload,
    idempotency: content.idempotency,
    domainCommandId: content.domainCommandId ?? content.commandId ?? content.intentId,
    tenantId: content.tenantId,
    integrationInstanceId: content.integrationInstanceId,
    producerId: content.producerId,
    sourceId: content.sourceId ?? content.cursor ?? content.subscriptionId,
  };
};

const hasDirectusCredential = (command) =>
  Boolean(maybeTrimString(command.token) || maybeTrimString(command.authorization));

const assertDirectusMutationCommand = (command) => {
  if (!isDirectusMutationOperation(command?.operation)) {
    throw new DirectusRuntimeError(
      "not_directus_mutation",
      "Directus mutation helper requires a mutation operation.",
      { details: { operation: command?.operation } },
    );
  }
  const endpoint = maybeTrimString(command.endpoint);
  if (!endpoint) {
    throw new DirectusRuntimeError(
      "missing_directus_endpoint",
      "Directus mutation requires an endpoint.",
      { details: { endpoint: command?.endpoint } },
    );
  }
  const collection = maybeTrimString(command.collection);
  if (!collection) {
    throw new DirectusRuntimeError(
      "missing_directus_collection",
      "Directus mutation requires a collection.",
      { details: { collection: command?.collection } },
    );
  }
  if (!hasDirectusCredential(command)) {
    throw new DirectusRuntimeError(
      "missing_directus_credential",
      "Directus mutation requires token or authorization metadata.",
      { details: { endpoint, collection } },
    );
  }
  const idempotency = command.idempotency ?? {};
  if (!idempotency.key && !idempotency.domainCommandId && !command.domainCommandId) {
    throw new DirectusRuntimeError(
      "missing_directus_idempotency",
      "Directus mutation requires idempotency metadata.",
      { details: { endpoint, collection, operation: command.operation } },
    );
  }
  return {
    ...command,
    endpoint,
    collection,
  };
};

const resolveDirectusMutationIdempotency = (command) => {
  const normalized = assertDirectusMutationCommand(command);
  const idempotency = normalized.idempotency ?? {};
  return {
    required: true,
    key: idempotency.key,
    scope: idempotency.scope,
    domainCommandId: idempotency.domainCommandId ?? normalized.domainCommandId,
    tenantId: idempotency.tenantId ?? normalized.tenantId,
    integrationInstanceId: idempotency.integrationInstanceId ?? normalized.integrationInstanceId,
    producerId: idempotency.producerId ?? normalized.producerId,
  };
};

const joinDirectusUrl = ({ endpoint, collection, itemId }) => {
  const base = endpoint.replace(/\/+$/, "");
  const path = `/items/${encodeURIComponent(collection)}${
    itemId !== undefined && itemId !== null ? `/${encodeURIComponent(`${itemId}`)}` : ""
  }`;
  return `${base}${path}`;
};

const directusMethodForOperation = (operation) => {
  const normalized = normalizeDirectusOperation(operation);
  if (normalized === "create" || normalized === "post") return "POST";
  if (normalized === "put" || normalized === "upsert") return "PUT";
  if (normalized === "delete") return "DELETE";
  return "PATCH";
};

const resolveDirectusAuthHeaders = (command) => {
  const authorization = maybeTrimString(command.authorization);
  if (authorization) {
    return { Authorization: authorization };
  }
  const token = maybeTrimString(command.token);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildDirectusMutationRequest = (command) => {
  const normalized = assertDirectusMutationCommand(command);
  const method = directusMethodForOperation(normalized.operation);
  return {
    method,
    url: joinDirectusUrl(normalized),
    headers: {
      ...normalized.headers,
      ...resolveDirectusAuthHeaders(normalized),
      Accept: "application/json",
      ...(method === "DELETE" ? {} : { "Content-Type": "application/json" }),
    },
    body: method === "DELETE" ? undefined : (normalized.body ?? {}),
    operation: normalized.operation,
    collection: normalized.collection,
    itemId: normalized.itemId,
  };
};

const parseDirectusResponseBody = async (response) => {
  if (typeof response?.json === "function") {
    return response.json();
  }
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  if (typeof response?.text === "function") {
    return response.text();
  }
  return response;
};

const defaultDirectusTransport = async (request) => {
  if (typeof fetch !== "function") {
    throw new DirectusRuntimeError(
      "missing_directus_transport",
      "Directus mutation execution requires a transport.",
      { details: { request } },
    );
  }
  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });
};

const executeDirectusMutationCommand = async ({
  command,
  transport = defaultDirectusTransport,
} = {}) => {
  const normalized = assertDirectusMutationCommand(normalizeDirectusRequestCommand(command));
  if (typeof transport !== "function") {
    throw new DirectusRuntimeError(
      "missing_directus_transport",
      "Directus mutation execution requires a transport.",
      { details: { endpoint: normalized.endpoint, collection: normalized.collection } },
    );
  }
  const request = buildDirectusMutationRequest(normalized);
  const response = await transport(request, normalized);
  const body = await parseDirectusResponseBody(response);
  const statusCode = response?.status;
  const failed = response?.ok === false || (Number.isInteger(statusCode) && statusCode >= 400);
  if (failed) {
    throw new DirectusRuntimeError(
      `directus_${statusCode ?? "error"}`,
      `Directus mutation failed with status ${statusCode ?? "unknown"}.`,
      {
        statusCode,
        retryable: RETRYABLE_DIRECTUS_STATUSES.has(statusCode),
        details: {
          request,
          response: {
            status: statusCode,
            statusText: response?.statusText,
            body,
          },
        },
      },
    );
  }
  return {
    status: statusCode,
    operation: normalized.operation,
    collection: normalized.collection,
    itemId: normalized.itemId,
    url: request.url,
    data: body,
  };
};

const resolveDirectusReadSourceIdentity = (command) => {
  const normalized = normalizeDirectusRequestCommand(command);
  if (!isDirectusReadOperation(normalized.operation)) {
    throw new DirectusRuntimeError(
      "not_directus_read",
      "Directus source identity requires a read operation.",
      { details: { operation: normalized.operation } },
    );
  }
  const explicitSourceId = maybeTrimString(normalized.sourceId);
  const endpointIdentity = maybeTrimString(normalized.endpoint)?.split(/[?#]/)[0];
  return {
    sourceId:
      explicitSourceId ??
      `directus:${endpointIdentity ?? "unknown"}:${
        maybeTrimString(normalized.collection) ?? "unknown"
      }:${normalized.operation}`,
    collection: normalized.collection,
    operation: normalized.operation,
  };
};

const initElementInterface = (_stream_cache) => {
  const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
  const urigen =
    "uri" in reduced_lambda_obj && "_default" in reduced_lambda_obj.uri
      ? reduced_lambda_obj.uri._default
      : undefined;
  const headergen =
    "header" in reduced_lambda_obj && "_default" in reduced_lambda_obj.header
      ? reduced_lambda_obj.header._default
      : undefined;

  const _elementlogic = async (_data_in) => {
    //_stream_cache[ElemCacheKeyLUT.DATAIN] = _metadata;
    const _header = _stream_cache[ElemCacheKeyLUT.http.HEADER]; // header$obj._stream

    // spark_dev_note: #http_dataflow_point // corresponding handles upstream
    let _flowdatain = _data_in; //.slice(2);   // [...input$objArr]
    _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality
    const recognizedLambdaConstants = ["uri", "post", "put", "get", "header", "?graph"];
    const curLambdaKeys = Object.keys(reduced_lambda_obj);
    const validLambdaKeyList = recognizedLambdaConstants.filter((_) => curLambdaKeys.includes(_));
    //const poprect = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'center';
    //lookupRuntimeLambdaLUT: async (refnode, nodelambda, contextuallambda)
    const _uri = "localhost:51054";

    const _do_uri_request = async ({ http_mode, uri } = {}) => {
      if (["post", "put"].includes(http_mode)) {
        // put, post
        if (_header?.X_CSRF_Token)
          axios.defaults.headers.post["X-CSRF-Token"] = _header.X_CSRF_Token; // https://github.com/axios/axios/issues/2024
        try {
          runtimeLogger.debug(_flowdatain);
          const resprom = validLambdaKeyList.includes("put")
            ? axios.put(uri, _flowdatain)
            : axios.post(uri, _flowdatain);
          const res = await resprom;
          runtimeLogger.debug(res);
          //return _metadata.push(res.data);
          //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
          return res;
        } catch (err) {
          runtimeLogger.debug(err);
          if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            runtimeLogger.debug(err.response.data);
            runtimeLogger.debug(err.response.status);
            runtimeLogger.debug(err.response.headers);
            //node_output = formatFlowdata(processAxiosObj(err.response.data), "elementio");
          } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            runtimeLogger.debug(err.request);
            //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
          } else {
            // Something happened in setting up the request that triggered an Error
            runtimeLogger.debug("Error", err.message);
            //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
          }
          runtimeLogger.debug(err.config);
          return err.response;
        }
      } else {
        // get
        try {
          runtimeLogger.debug("executing http get");
          const resprom = uri
            ? axios.get(uri)
            : of([{ data: "LEAF element error: http get request submitted with undefined URI" }]);
          const res = await resprom;
          runtimeLogger.debug(res);
          //return _metadata.push(res.data);

          //node_output = formatFlowdata(processAxiosObj(res.data), "elementio");
          return res.data;
        } catch (err) {
          if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            runtimeLogger.error(err.response.data);
            runtimeLogger.debug(err.response.status);
            runtimeLogger.debug(err.response.headers);
            //node_output = formatFlowdata(processAxiosObj(err.response.data), "elementio");
          } else if (err.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            runtimeLogger.debug(err);
            //node_output = formatFlowdata(processAxiosObj(err.message), "elementio");
          } else {
            // Something happened in setting up the request that triggered an Error
            runtimeLogger.debug("Error", err.message);
            //node_output = formatFlowdata(processAxiosObj(err.request), "elementio");
          }
          runtimeLogger.debug(err.config);
          return err;
        }
      }
    };

    const http_mode = validLambdaKeyList.includes("post")
      ? "post"
      : validLambdaKeyList.includes("put")
        ? "put"
        : "get";
    const throttled_uri_request = _.throttle(async () => {
      return await _do_uri_request({ http_mode, uri: _uri });
    }, 1000); // 1000 ms gap
    const req_result = await throttled_uri_request();
    return req_result;
  };

  const node_context = {
    codebase: "ghostos/api/parser/nodelogic/elements/library/http.js",
    refnode: _stream_cache[ElemCacheKeyLUT.REFNODE],
    //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
  };

  const _TEST_URI = "https://httpbin.org";
  const _TEST_HEADER = "";
  const _leaflogic = (input$objArr, controlflow$obj) => {
    //const _stream_cache = {};
    //const _outflow_data$ = new BehaviorSubject(raceConditionError);
    const _outflow_data$ = new Subject(); //BehaviorSubject(raceConditionError);
    const uri$obj = urigen
      ? driveDataflowByCtrlflow(controlflow$obj, input$objArr, undefined, node_context, {
          leaflogic: urigen,
          datalogic: {
            post: (_data) => {
              _stream_cache[ElemCacheKeyLUT.http.URI] = _data;
              return _data;
            },
          },
        })
      : { _stream: of(_TEST_URI), _control: { _stream: controlflow$obj._stream } };
    //const header$obj = headergen ? headergen(input$objArr, controlflow$obj) :
    //    {_stream: of(_TEST_HEADER)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
    const header$obj = headergen
      ? driveDataflowByCtrlflow(controlflow$obj, input$objArr, undefined, node_context, {
          leaflogic: headergen,
          datalogic: {
            post: (_data) => {
              _stream_cache[ElemCacheKeyLUT.http.HEADER] = _data;
              return _data;
            },
          },
        })
      : { _stream: of(_TEST_HEADER), _control: { _stream: controlflow$obj._stream } };

    const merged_ctrl_in$ = combineLatest([uri$obj._control._stream, header$obj._control._stream]);
    const merged_data_in$ = combineLatest([uri$obj._stream, header$obj._stream]);

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
  const _datalogic_post = (data_in) => {
    const _urlret = data_in;

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
          : obj
            ? Object.fromEntries(
                Object.entries(obj).map(([_key, _val]) => {
                  return [_key, processAxiosObj(_val)];
                }),
              )
            : obj;
      } else if (objtype === "string") {
        return escapeHtml(obj);
      } else // probably of type "number"
      {
        return obj;
      }
    };
    const node_output = formatElementFlowdata(processAxiosObj(_urlret), "elementio");

    return node_output;
  };

  return {
    leaflogic: _leaflogic,
    datalogic: {
      pre: _datalogic_pre,
      post: _datalogic_post,
    },
  };
};

const props = initElementInterface;

export {
  DIRECTUS_MUTATION_OPERATIONS,
  DIRECTUS_READ_OPERATIONS,
  DirectusRuntimeError,
  assertDirectusMutationCommand,
  buildDirectusMutationRequest,
  cachekeys,
  executeDirectusMutationCommand,
  isDirectusMutationOperation,
  isDirectusReadOperation,
  normalizeDirectusOperation,
  normalizeDirectusRequestCommand,
  props,
  resolveDirectusMutationIdempotency,
  resolveDirectusReadSourceIdentity,
};

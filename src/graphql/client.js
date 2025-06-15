// code taken from the implementation of graphqurl (https://github.com/hasura/graphqurl.git)
// modified by spark@leautomaton.com to function in leaf_editor
// 
import { cloneObject, wsScheme } from './utils.js';
import fetch from 'isomorphic-fetch';
import WebSocket from 'isomorphic-ws';
import { GQL_CONNECTION_INIT, GQL_START, GQL_STOP, GRAPHQL_SUBSCRIPTIONS_PROTOCOL, handler as wsEventHandler } from './events.js';

const createGQLClient = options => {
  const {
    endpoint,
    websocket,
    headers,
    hook,
  } = options;

  const clientContext = {
    endpoint,
    headers: cloneObject(headers || {}),
    websocket: {
      ...websocket,
      endpoint: (websocket && websocket.endpoint) || wsScheme(endpoint),
      parameters: (websocket && websocket.parameters) || {},
      client: null,
      open: false,
      subscriptions: {},
    },
  };

  const executeQuery = async (queryOptions, successCallback, errorCallback) => {
    const {
      query,
      variables,
      headers: headerOverrides,
    } = queryOptions;

    const headers = {
      ...clientContext.headers,
      ...(headerOverrides || {}),
    };
    const isExistContentTypeKey = Object.keys(headers).some(key => /content-type/gi.test(key));
    // spark_dev_note: having the content-type specified on graphql queries/mutations isn't compatible with leaf server
    //if (!isExistContentTypeKey) {
    //  headers['Content-Type'] = 'application/json';
    //}

    try {
      let response;
      //response = await fetch(clientContext.endpoint, {method: 'POST', body: JSON.stringify({"query": "query {getGraph(userid:\"1\", appid:\"2\") {userid appid nodes {uuid label data}}}"})});
      console.log("graphql/client.js executeQuery: ", query);
      response = await fetch(
        clientContext.endpoint,
        {
          method: 'POST',
          headers: headers, // spark changed from headers, -> headers: headers,
          credentials: 'include', // https://stackoverflow.com/questions/34558264/fetch-api-with-cookie
          //body: JSON.stringify({query, variables: (variables || {})}),
          body: query, 
        },
      );
      const responseObj = await response.json();
      if (hook) {
        hook(responseObj);
      }
      if (responseObj.errors) {
        if (errorCallback) {
          errorCallback(responseObj);
        }
        throw responseObj;
      } else {
        if (successCallback) {
          successCallback(responseObj);
        }
        return responseObj;
      }
    } catch (e) {
      console.log(e);
      throw e;
      //if (e.errors) {
      //  throw e;
      //} else {
      //  throw {
      //    errors: [{
      //      message: 'failed to fetch',
      //    }],
      //  };
      //}
    }
  };

  const makeWsClient = async () => {
    try {
        // https://github.com/heineiuo/isomorphic-ws
        const wsConnection = new WebSocket(clientContext.websocket.endpoint, GRAPHQL_SUBSCRIPTIONS_PROTOCOL);
        wsConnection.onerror = (e) => {
            console.log("WebSocket connection error:", e);
        };
        wsConnection.onclose = (e) => {
            console.log("WebSocket connection closed:", e);
        };
        return wsConnection;
    } catch (e) {
        console.log(e);
        throw new Error('Failed to establish the WebSocket connection: ', e);
    }
  };

  const sendWsEvent = data => {
    clientContext.websocket.client.send(JSON.stringify(data));
  };

  const setWsClient = _wsClient => {
    clientContext.websocket.client = _wsClient;

    if (clientContext.websocket.shouldRetry) {
      _wsClient.onclose = () => {
        makeWsClient().then(setWsClient);
      };
    }

    _wsClient.addEventListener('open', () => {
      const payload = {
        ...clientContext.websocket.parameters,
        headers: {
          ...clientContext.headers,
          ...clientContext.websocket.parameters.headers,
        },
      };
      sendWsEvent({
        type: GQL_CONNECTION_INIT,
        payload,
      });
    });

    _wsClient.addEventListener('message', event => {
      wsEventHandler(clientContext.websocket, event);
    });
  };

  const establishWS = () => {
    makeWsClient().then((_wsClient) => {
      console.log('setting websocket for LEAF graphql subscription');
      setWsClient(_wsClient);
    }).catch(e => {
      console.error(e);
    });
    //setWsClient(makeWsClient());
  }

  if (websocket) {
    establishWS();
  }

  const subscribe = (subscriptionOptions, successCallback, errorCallback) => {
    if (!clientContext.websocket.client) {
      console.log('WebSocket connection has not been established');
      return;
    }

    const {
      operationId,
      subscription,
      variables,
      onGraphQLData,
      onGraphQLError,
      onGraphQLComplete,
    } = subscriptionOptions;

    clientContext.websocket.subscriptions[operationId] = {
      onGraphQLData: data => {
        if (onGraphQLData) {
          onGraphQLData(data);
        }
        if (successCallback) {
          successCallback(data);
        }
      },
      onGraphQLComplete: data => {
          onGraphQLComplete && onGraphQLComplete(data);
      },
      onGraphQLError: data => {
        if (onGraphQLError) {
          onGraphQLError(data);
        }
        if (errorCallback) {
          errorCallback(data);
        }
      },
    };

    sendWsEvent({
      type: GQL_START,
      id: operationId,
      payload: {
        query: subscription,
        variables: variables || {},
      },
    });

    return {
      stop: () => {
        sendWsEvent({
          type: GQL_STOP,
          id: operationId,
        });
      },
    };
  };

  const updateHeaders = newHeaders => {
    clientContext.headers = cloneObject(newHeaders);
    if (clientContext.websocket.client) {
      makeWsClient().then(setWsClient).catch(e => {
        console.error(e);
      });
    }
  };

  return {
    query: executeQuery,
    subscribe: subscribe,
    updateHeaders,
    establishWS,
    clientContext,
  };
};

export { createGQLClient };

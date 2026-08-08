/*
 * author: spark@leautomaton.com
 * date: 19th Nov 2021
 */

import { LEAFIOmetamodel } from "../metamodel.js";

import { createGQLClient } from "../../graphql/client.js";
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
import memoize from "lodash/memoize.js";

const SUBS_GRAPH = ({ _domain, _appid, filter = {}, query } = {}) =>
  `
  subscription {
    graph: getGraph(domain: "${_domain}", appid: "${_appid}", filter: ${filter}) ${query}
  }
`;

//#      getGraph(appmode: String!, hostdomain: String!, hostappid: String!, domain: String!, appid: String!, filter: GraphFilter): Graph
//  query {
//    graph: getGraph(appmode: "${_appmode}", hostdomain: "${_hostdomain}", hostappid: "${_hostappid}", domain: "${_domain}", appid: "${_appid}", filter: ${filter}) ${query}
//  }
const QUERY_GRAPH = ({
  _appmode,
  _hostdomain,
  _hostappid,
  _domain,
  _appid,
  filter = {},
  query,
} = {}) =>
  `
  query {
    graph: getGraph(domain: "${_domain}", appid: "${_appid}", filter: ${filter}) ${query}
  }
`;

const MUT_DELNODE = `mutation DeleteNode($uuid: String!) {
  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {uuid}}
}`;

const MUT_UPDATENODE = `mutation UpdateNode($uuid: String!, $data: String!) {
  updateNode(input: {filter: {uuid: {eq: $uuid}}, set: {data: $data}}) {node {uuid}}
}`;

const MUT_ADDNODE = `mutation AddNode($uuid: String!, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {
  addNode(input: [{uuid: $uuid, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {node {uuid}}
}`;

const MUT_ADDEDGE = `mutation AddEdge($uuid: String!, $sourceuuid: String!, $targetuuid: String!, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {
  addEdge(input: [{uuid: $uuid, source: {uuid: $sourceuuid}, target: {uuid: $targetuuid}, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {edge {uuid}}
}`;

const MUT_DELEDGE = `mutation DeleteEdge($uuid: String!) {
  deleteEdge(efilter: {uuid: {eq: $uuid}}) {edge {uuid}}
}`;
//const a_new_uuid = uuidv4();
//const MUT_ADDNODE = `mutation { addNode(input: [{uuid: "${a_new_uuid}", label: "", data: ""}]) {node {label}} }`;
//const MUT_ADDNODE = `mutation { addNode(input: [{label: "ala999", data: ""}]) {node {label}} }`;

// spark_dev_note: TBD: the following config is only valid for testing/debugging.
// for production use, please change it to www.leafgon.com URIs
//const defaultLEAFlakeConfig = {
//  dburi_subs: process.env.LEAFGON_ENDPOINT_SUBS, //"http://localhost:10001/sgraphql",
//  dburi_subs_ws: process.env.LEAFGON_WEBSOCKET_SUBS, //"ws://localhost:10001/sgraphql",
//  dburi_qm: process.env.LEAFGON_ENDPOINT_QM, //"http://localhost:10001/qmgraphql",
//};
const defaultLEAFlakeConfig = {
  dburi_subs: process.env.LEAFGON_ENDPOINT_SUBS || "https://www.leafgon.com/sgraphql",
  dburi_subs_ws: process.env.LEAFGON_WEBSOCKET_SUBS || "wss://www.leafgon.com/sgraphql",
  dburi_qm: process.env.LEAFGON_ENDPOINT_QM || "https://www.leafgon.com/qmgraphql",
};

//const initializeLEAFlakeGQLClient = ({_domain, _appid, _clientConfig=defaultLEAFlakeConfig, _handleChange=blankChangeHandler, _metamodel=LEAFIOmetamodel.breezyforest}={}) => {}
const initializeLEAFlakeGQLClient = ({
  _clientConfig = defaultLEAFlakeConfig,
  _metamodel = LEAFIOmetamodel.breezyforest,
  _sessionid = undefined,
} = {}) => {
  const resolvedClientConfig = { ...defaultLEAFlakeConfig, ...(_clientConfig || {}) };

  //const dburi = metamodel.GQLParameters[metamodel.SubsDirectory.leaflake.gqlclient];
  //const dburi_subs = _clientConfig.dburi_subs;
  //const dburi_qm = _clientConfig.dburi_qm;

  //const endpoint_subs = dburi_subs ? `https://${dburi_subs}`: undefined;
  //const websocket_subs = dburi_subs ? `wss://${dburi_subs}`: undefined; //"www.leafgon.com:10001/sgraphql"
  //const endpoint_qm = dburi_subs ? `https://${dburi_qm}`: undefined;
  //const prodLEAFlakeConfig = _metamodel.GQLParameters.clientconfig_full;
  const endpoint_subs = resolvedClientConfig.dburi_subs
    ? resolvedClientConfig.dburi_subs
    : undefined;
  const websocket_subs = resolvedClientConfig.dburi_subs_ws
    ? resolvedClientConfig.dburi_subs_ws
    : undefined; //"www.leafgon.com:10001/sgraphql"
  const endpoint_qm = resolvedClientConfig.dburi_qm ? resolvedClientConfig.dburi_qm : undefined;
  const client_auth_key = resolvedClientConfig.clientAuthKey
    ? resolvedClientConfig.clientAuthKey
    : undefined;
  //const nfilter = _appid ? `{ appid: {eq: "${_appid}"} }` : '{}';
  const masterquery = _metamodel.GQLParameters.masterquery;

  let leaflakeclientobj = { subscriptions: {}, subs_methods: {}, qm_methods: {} };

  const reconnectGQLClient = ({ gql_subs_client, force = false } = {}) => {
    if (
      force ||
      [WebSocket.CLOSED, WebSocket.CLOSING].includes(
        gql_subs_client.clientContext.websocket.client.readyState,
      )
    ) {
      console.log(
        "LEAF Log: gos.api.leafio.leaflake: WebSocket currently not open or opening. Re-establishing the connection...",
      );
      gql_subs_client.establishWS();
    }
  };

  // establish a client connection for gql query+mutation
  leaflakeclientobj.gql_qm_client =
    endpoint_qm &&
    createGQLClient({
      endpoint: endpoint_qm,
      headers: client_auth_key
        ? {
            //'Content-Type': 'application/json', // should never use this when using fetch
            Accept: "application/json",
            "X-API-Key": client_auth_key,
          }
        : {
            //'Content-Type': 'application/json', // should never use this when using fetch
            Accept: "application/json",
          },
    });

  const gqlsubsclientPromise = new Promise((resolve, reject) => {
    // establish a client connection to subscribe to the backend changes
    leaflakeclientobj.gql_subs_client =
      endpoint_subs && websocket_subs
        ? createGQLClient({
            endpoint: endpoint_subs,
            headers: client_auth_key
              ? {
                  "Content-Type": "application/json",
                  "X-API-Key": client_auth_key,
                }
              : {
                  "Content-Type": "application/json",
                },
            websocket: {
              endpoint: websocket_subs,
              onConnectionSuccess: () => {
                //console.log('gql_subs_client: Connected')
                resolve("gql_subs_client is connected and ready");
              },
              onConnectionError: () => {
                //console.log('gql_subs_client: Connection Error');
                reject("gql_subs_client: Connection Error");
              },
            },
          })
        : undefined;
  });
  console.log("gqlsubsclientPromise is made.");

  const getGraphSubscription = async ({
    _appmode,
    _domain,
    _appid,
    filter = "{}",
    subsCallback,
    errorCallback = undefined,
    variables = undefined,
  } = {}) => {
    gqlsubsclientPromise.then((msg) => {
      // wait till the ws connection promise is resolved for subscription requests
      const generateOperationId = () => {
        let id = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let _i = 0; _i < 5; _i++) {
          id += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return id + (Object.keys(leaflakeclientobj.subscriptions).length + 1);
      };

      const operationId = generateOperationId();
      try {
        console.log(msg);
        const subscription_handle = leaflakeclientobj.gql_subs_client.subscribe(
          {
            operationId,
            subscription: SUBS_GRAPH({ _domain, _appid, filter: filter, query: masterquery }),
            //subscription: getLEAFgqlSubs('temporary_test_appid'),
            onGraphQLData: (event) => {
              console.log("gql_subs_client: onGraphQLData()", event.data);
              if (subsCallback) {
                subsCallback(event.data);
              }
            },
            onGraphQLError: (event) => {
              console.log("gql_subs_client: onGraphQLError()", event);
              if (operationId in leaflakeclientobj.subscriptions) {
                leaflakeclientobj.subscriptions[operationId].stop();
              }
              if (errorCallback) {
                errorCallback(event);
              }
            },
            onGraphQLComplete: (event) => {
              console.log("LEAF Log: gql_subs_client: onGraphQLComplete():", event);
              if (_clientConfig.keepGQLConnected)
                reconnectGQLClient({
                  gql_subs_client: leaflakeclientobj.gql_subs_client,
                  force: true,
                }); // spark_dev_note: determine whether this is desirable
            },
          },
          //subsCallback,
          //errorCallback
        );
        console.log(subscription_handle);
        leaflakeclientobj.subscriptions[operationId] = subscription_handle;
      } catch (error) {
        console.log("Error: getGraphSubscription():", error);
        if (operationId in leaflakeclientobj.subscriptions) {
          leaflakeclientobj.subscriptions[operationId].stop();
        }
      }
    });
  };
  // now define a bunch of graphql qm methods (query or mutation)
  const getGraphQuery_memcache_resolver = ({
    _appmode,
    _hostdomain,
    _hostappid,
    _domain,
    _appid,
    filter = "{}",
    variables,
  } = {}) => JSON.stringify([_domain, _appid, filter, _sessionid]);
  // spark_dev_note: 25/Nov/2023
  // the memcache resolver including hostdomain/hostappid pair as part of the resolution logic is a bit overkill,
  // I am uncertain as of now, though, as to if including that would make sense in some edge cases. Only time will tell.
  const getGraphQuery = memoize(
    ({ _appmode, _hostdomain, _hostappid, _domain, _appid, filter = "{}", variables } = {}) =>
      new Promise((resolve, reject) => {
        const query_options = {
          endpoint: endpoint_qm,
          //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
          //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
          query: JSON.stringify({
            query: QUERY_GRAPH({
              _appmode,
              _hostdomain,
              _hostappid,
              _domain,
              _appid,
              filter: filter,
              query: masterquery,
            }),
            variables: variables || {},
          }),
          //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
          //query: MUT_DELNODE,
          //query: `mutation DeleteNode($uuid: String!) {
          //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
          //}`,
          //variables: {
          //  uuid: el.id,
          //},
        };

        try {
          return leaflakeclientobj.gql_qm_client.query(
            query_options,
            (qmresponse) => {
              // successCallback argument of executeQuery in gos.graphql.client.js
              if ("error" in qmresponse) {
                console.error(
                  "LEAFgon error (critical logical error prevents this app from functioning): ",
                  qmresponse.error,
                  JSON.stringify({ _hostdomain, _hostappid, _domain, _appid }),
                );
              }
              //  console.log(qmresponse.data);
              if (qmresponse.data) {
                //console.log('queryGetGraph(): ', qmresponse.data);
                //_handleChange && _handleChange({ graph: qmresponse.data.graph });
                resolve({ graph: qmresponse.data.graph });
              }
            },
            //(data) => {
            //  console.log('gql_qm_client:query completed with sucess: ', data);
            //},
            //(data) => {
            // console.log('gql_qm_client:query completed with error: ', data);
            //},
          );
        } catch (e) {
          console.log("Error getGraphQuery(): ", e);
          reject({});
        }
      }),
    getGraphQuery_memcache_resolver,
  );

  const mutateAddNode = ({ variables }) => {
    const mut_options = {
      endpoint: endpoint_qm,
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
      //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
      query: JSON.stringify({ query: MUT_ADDNODE, variables: variables || {} }),
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
      //query: MUT_DELNODE,
      //query: `mutation DeleteNode($uuid: String!) {
      //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
      //}`,
      //variables: {
      //  uuid: el.id,
      //},
    };
    try {
      return leaflakeclientobj.gql_qm_client.query(
        mut_options,
        (qmresponse) => {
          // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
          if (qmresponse.data) {
            console.log("mutateAddNode() finished successfully: ", qmresponse.data);
          }
        },
        //(data) => {
        //  console.log('gql_qm_client:query completed with sucess: ', data);
        //},
        //(data) => {
        // console.log('gql_qm_client:query completed with error: ', data);
        //},
      );
    } catch (e) {
      console.log("Error mutateAddNode(): ", e);
    }
  };

  const mutateDelNode = ({ node_uuid }) => {
    //const querystr = MUT_DELNODE; // getLEAFgqlStrDelNode(el.id);
    //const variables = {};
    //const test_query_str1 = JSON.stringify({"query": getLEAFgqlStrDelNode(node_uuid), "variables": (variables || {})});
    //const test_query_str2 = JSON.stringify({"query": MUT_DELNODE, "variables": ({uuid: node_uuid} || {})});
    const mut_options = {
      endpoint: endpoint_qm,
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(node_uuid), "variables": (variables || {})}),
      query: JSON.stringify({ query: MUT_DELNODE, variables: { uuid: node_uuid } }).replace(
        /\\n/g,
        "",
      ),
      //query: MUT_DELNODE,
      //query: `mutation DeleteNode($uuid: String!) {
      //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
      //}`,
      //variables: {
      //  uuid: el.id,
      //},
    };

    try {
      return leaflakeclientobj.gql_qm_client.query(
        mut_options,
        (qmresponse) => {
          // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
          if (qmresponse.data) {
            console.log("mutateDelNode() finished successfully: ", qmresponse.data);
          }
        },
        //(data) => {
        //  console.log('gql_qm_client:query completed with sucess: ', data);
        //},
        //(data) => {
        // console.log('gql_qm_client:query completed with error: ', data);
        //},
      );
      //return qmresponsePromise;
    } catch (e) {
      console.log("Error onElementsRemove(): ", e);
    }
  };

  const mutateUpdateNode = ({ variables }) => {
    const mut_options = {
      endpoint: endpoint_qm,
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
      //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
      query: JSON.stringify({ query: MUT_UPDATENODE, variables: variables || {} }),
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
      //query: MUT_DELNODE,
      //query: `mutation DeleteNode($uuid: String!) {
      //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
      //}`,
      //variables: {
      //  uuid: el.id,
      //},
    };
    try {
      return leaflakeclientobj.gql_qm_client.query(
        mut_options,
        //(data) => {
        //  console.log('gql_qm_client:query completed with sucess: ', data);
        //},
        //(data) => {
        // console.log('gql_qm_client:query completed with error: ', data);
        //},
        (qmresponse) => {
          // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
          if (qmresponse.data) {
            console.log("mutateUpdateNode() finished successfully: ", qmresponse.data);
          }
        },
      );
      //return qmresponsePromise;
    } catch (e) {
      console.log("Error mutateUpdateNode(): ", e);
    }
  };

  const mutateAddEdge = ({ variables }) => {
    const mut_options = {
      endpoint: endpoint_qm,
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
      //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
      query: JSON.stringify({ query: MUT_ADDEDGE, variables: variables || {} }),
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
      //query: MUT_DELNODE,
      //query: `mutation DeleteNode($uuid: String!) {
      //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
      //}`,
      //variables: {
      //  uuid: el.id,
      //},
    };
    try {
      return leaflakeclientobj.gql_qm_client.query(
        mut_options,
        (qmresponse) => {
          // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
          if (qmresponse.data) {
            console.log("mutateAddEdge() finished successfully: ", qmresponse.data);
          }
        },
        //(data) => {
        //  console.log('gql_qm_client:query completed with sucess: ', data);
        //},
        //(data) => {
        // console.log('gql_qm_client:query completed with error: ', data);
        //},
      );
      //return qmresponsePromise;
    } catch (e) {
      console.log("Error mutateAddEdge(): ", e);
    }
  };

  const mutateDelEdge = ({ edge_uuid }) => {
    //const querystr = MUT_DELNODE; // getLEAFgqlStrDelNode(el.id);
    //const test_query_str1 = JSON.stringify({"query": getLEAFgqlStrDelEdge(edge_uuid), "variables": (variables || {})});
    //const query_str = JSON.stringify({"query": MUT_DELEDGE, "variables": ({uuid: edge_uuid} || {})}).replace(/\\n/g, '');
    const mut_options = {
      endpoint: endpoint_qm,
      //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
      //query: JSON.stringify({"query": getLEAFgqlStrDelEdge(edge_uuid), "variables": (variables || {})}),
      query: JSON.stringify({ query: MUT_DELEDGE, variables: { uuid: edge_uuid } }).replace(
        /\\n/g,
        "",
      ),
      //query: MUT_DELNODE,
      //query: `mutation DeleteNode($uuid: String!) {
      //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
      //}`,
      //variables: {
      //  uuid: el.id,
      //},
    };
    try {
      return leaflakeclientobj.gql_qm_client.query(
        mut_options,
        (qmresponse) => {
          // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
          if (qmresponse.data) {
            console.log("mutateDelEdge() finished successfully: ", qmresponse.data);
          }
        },
        //(data) => {
        //  console.log('gql_qm_client:query completed with sucess: ', data);
        //},
        //(data) => {
        // console.log('gql_qm_client:query completed with error: ', data);
        //},
      );
      //return qmresponsePromise;
    } catch (e) {
      console.log("Error onElementsRemove(): ", e);
    }
  };

  if (leaflakeclientobj.gql_subs_client) {
    leaflakeclientobj.subs_methods = {
      queryGraph: getGraphSubscription,
      clientState: () => {
        return leaflakeclientobj.gql_subs_client.clientContext.websocket.client.readyState;
      },
      reconnect: () => {
        reconnectGQLClient({ gql_subs_client: leaflakeclientobj.gql_subs_client });
      },
    };
  }
  if (leaflakeclientobj.gql_qm_client) {
    leaflakeclientobj.qm_methods = {
      queryGraph: getGraphQuery,
      addNode: mutateAddNode,
      updateNode: mutateUpdateNode,
      delNode: mutateDelNode,
      addEdge: mutateAddEdge,
      delEdge: mutateDelEdge,
    };
  }

  return leaflakeclientobj;
};

export { initializeLEAFlakeGQLClient };

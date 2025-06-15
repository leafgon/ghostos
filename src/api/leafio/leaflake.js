/*
 * author: spark@leautomaton.com
 * date: 19th Nov 2021
 */

import { LEAFIOmetamodel } from "../metamodel.js";

import { createGQLClient } from '../../graphql/client.js';
import { encodeUnicode, decodeUnicode } from '../utils/leafbase64.js';
import { _leafstdlib_dataflow_api, _edge_handle_dict, _edge_style_dict } from '../metamodel.js';
import lodashpkg from 'lodash';

const {memoize} = lodashpkg; // nodejs compatible lodash import

const SUBS_GRAPH = ({_domain, _appid, filter={}, query}={}) =>
`
  subscription {
    graph: getGraph(domain: "${_domain}", appid: "${_appid}", filter: ${filter}) ${query}
  }
`;

//#      getGraph(appmode: String!, hostdomain: String!, hostappid: String!, domain: String!, appid: String!, filter: GraphFilter): Graph
//  query {
//    graph: getGraph(appmode: "${_appmode}", hostdomain: "${_hostdomain}", hostappid: "${_hostappid}", domain: "${_domain}", appid: "${_appid}", filter: ${filter}) ${query}
//  }
const QUERY_GRAPH = ({_appmode, _hostdomain, _hostappid, _domain, _appid, filter={}, query}={}) =>
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



const parseGraphNodes = ({graph: {nodes, edges }}={}) => {
    let node_list = [];
    let edge_list = [];
    nodes.map((n) => {
      if (n.data) {
      //let parsed_node_data = JSON.parse(sjcl.codec.base64.toBits(n.data));
        let parsed_node_data = JSON.parse(atob(n.data)); // base64 decode and convert json string to js object
        if (['leafdeckspade', 'leafdeckheart', 'leafdeckdiamond', 'leafdeckclub'].includes(parsed_node_data.leafeditor.type)) {
          const a_node = {
            appid: n.appid,
            uuid: n.uuid, 
            label: n.label,
            type: parsed_node_data ? parsed_node_data.leafeditor.type : null,
            //leafnodetype,
            position: parsed_node_data.leafnav ? parsed_node_data.leafnav.position : null,
            data: { ...parsed_node_data.leafeditor, leaduuid: n.uuid}, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
            style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
          };

          node_list.push(a_node);

          n.out_edges.map((e) => {
            if (e.data) {
              let parsed_edge_data = JSON.parse(atob(e.data)); // base64 decode edge data from the leaf lake and convert its json string to js object
              let parsed_edge_target_data = JSON.parse(atob(e.target.data));
              if (
                parsed_edge_data.leafeditor.type === "leafanchoredge" &&
                ['leafdeckspade', 'leafdeckheart', 'leafdeckdiamond', 'leafdeckclub'].includes(parsed_edge_target_data.leafeditor.type)
              ) {

                const an_edge = {
                  appid: e.appid,
                  uuid: e.uuid,
                  label: e.label,
                  type: parsed_edge_data.leafeditor.type,
                  //leafnodetype,
                  //data: data_obj,
                  source: {uuid: e.source.uuid},
                  target: {uuid: e.target.uuid, data: {...parsed_edge_target_data.leafeditor} },
                  //...edge_handle_dict[parsed_edge_data.leafeditor.type],
                  //style: edge_style_dict[parsed_edge_data.leafeditor.type],
                  //style: {fillOpacity: 0 , },
                  data: { ...parsed_edge_data.leafeditor },
                };

                edge_list.push(an_edge);
              }
            }
            return null;
          });
        }
      }

      return null;
    });

    return {node_list, edge_list};
};

const parseGraphNodesToEditorElements = ({ graph: {nodes, edges }}={}) => {
  let el_list = [];
  nodes.map((n) => {
    if (n.data) {
    //let parsed_node_data = JSON.parse(sjcl.codec.base64.toBits(n.data));
      let parsed_node_data = JSON.parse(decodeUnicode(n.data)); // base64 decode and convert json string to js object
      // spark_dev_note: this is where data.spellname for LEAFSpell is set. the info is supposed to be stored in the node's encoded data field 
      // (4 Mar 2022) currently the info is not stored in the encoded data field, resulting in the loss of spellname string upon dropping the leaf node in the editor
      // (6 Mar 2022) the loss of spellname string issue has been fixed, so the info should be available in the node's encoded data field.
      // however, a different issue arose: due to a refactoring-induced error, leaf node position used by leafeditor is now stored in two different locations.
      // parsed_node.data.leaf.position and parsed_node_data.leaf.appdata.position
      // the leaf.appdata.position is right and leaf.position is wrong. fix it. (6 Mar 2022)
      const apidef = _leafstdlib_dataflow_api(parsed_node_data.leaf.logic.type);
      //const isInvalidName = setupNameInvalidityCheck(parsed_node_data.leaf.logic.type, apidef);
      //const apidef = parsed_node_data ? _leafstdlib_dataflow_api(parsed_node_data.leaf.logic.type) : undefined;
      const a_node = {
        id: n.uuid, // a field required by react-flow-renderer, pls do not remove.
        type: parsed_node_data ? parsed_node_data.leaf.logic.type : null,
        leafapi: apidef,
        //leafnodetype,
        position: parsed_node_data ? parsed_node_data.leaf.appdata.position : null,
        //data: { ...parsed_node_data.leaf.logic.args, leaduuid: n.uuid}, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
        //data: { ...parsed_node_data, leaduuid: n.uuid, isInvalidName: isInvalidName}, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
        data: { ...parsed_node_data, leaduuid: n.uuid, }, //label: n.label, // 'data' here is a react-flow-renderer required field for proprietary data
        style: { border: '1px solid #777', padding: 2, borderRadius: '5px' },
        ispersistent: true // spark_dev_note: a placeholder boolean for implementing the feature to vary visualization of the rendered leaf node depending on whether it is stored up in the LEAFlake or is just being added in the LEAFeditor
      };

      el_list.push(a_node);
    }

    let edges = n.out_edges;

    edges.map((e) => {
      if (e.data) {
        let parsed_edge_data = JSON.parse(decodeUnicode(e.data)); // base64 decode edge data from the leaf lake and convert its json string to js object
        const an_edge = {
          id: e.uuid,
          type: parsed_edge_data.leaf.logic.type,
          //leafnodetype,
          //data: data_obj,
          source: e.source.uuid,
          target: e.target.uuid,
          ..._edge_handle_dict[parsed_edge_data.leaf.logic.type],
          style: _edge_style_dict[parsed_edge_data.leaf.logic.type],
          //style: {fillOpacity: 0 , },
          data: { ...parsed_edge_data.leaf.logic.type },
        };

        el_list.push(an_edge);
      }
      return null;
    });

    return null;
  });

  return el_list;
};

// a blank function only to document the arguments to be used in user-defined callback functions
// graph: {nodes, edges} raw data pulled from leaflake as delivered by gql queries/subscription
//const blankChangeHandler = (state={}, dataOrigin=LEAFIOmetamodel.OriginType.FRONTEND) => {}
const blankChangeHandler = ({ graph: {nodes, edges }}={}) => {
    // do nothing
    console.error('LEAF Error: initializeLEAFlakeGQLClient() was called without specifying the _handleChange function.'+
    'this means nothing useful is done from the current graph update.');
}

// spark_dev_note: TBD: the following config is only valid for testing/debugging.
// for production use, please change it to gdb.leafgon.com URIs
//const defaultLEAFlakeConfig = {
//  dburi_subs: process.env.LEAFGON_ENDPOINT_SUBS, //"http://localhost:10001/sgraphql",
//  dburi_subs_ws: process.env.LEAFGON_WEBSOCKET_SUBS, //"ws://localhost:10001/sgraphql",
//  dburi_qm: process.env.LEAFGON_ENDPOINT_QM, //"http://localhost:10001/qmgraphql",
//};
const defaultLEAFlakeConfig = {
  dburi_subs: process.env.LEAFGON_ENDPOINT_SUBS, //"https://gdb.leafgon.com/sgraphql",
  dburi_subs_ws: process.env.LEAFGON_WEBSOCKET_SUBS, //"wss://gdb.leafgon.com/sgraphql",
  dburi_qm: process.env.LEAFGON_ENDPOINT_QM, //"httpx://gdb.leafgon.com/qmgraphql",
};

//const initializeLEAFlakeGQLClient = ({_domain, _appid, _clientConfig=defaultLEAFlakeConfig, _handleChange=blankChangeHandler, _metamodel=LEAFIOmetamodel.breezyforest}={}) => {}
const initializeLEAFlakeGQLClient = ({_clientConfig=defaultLEAFlakeConfig, _metamodel=LEAFIOmetamodel.breezyforest, _sessionid=undefined}={}) => {
    //const dburi = metamodel.GQLParameters[metamodel.SubsDirectory.leaflake.gqlclient];
    //const dburi_subs = _clientConfig.dburi_subs; 
    //const dburi_qm = _clientConfig.dburi_qm; 
    
    //const endpoint_subs = dburi_subs ? `https://${dburi_subs}`: undefined;
    //const websocket_subs = dburi_subs ? `wss://${dburi_subs}`: undefined; //"www.leafgon.com:10001/sgraphql"
    //const endpoint_qm = dburi_subs ? `https://${dburi_qm}`: undefined;
    //const prodLEAFlakeConfig = _metamodel.GQLParameters.clientconfig_full;
    const endpoint_subs = _clientConfig.dburi_subs ? _clientConfig.dburi_subs: undefined;
    const websocket_subs = _clientConfig.dburi_subs_ws ? _clientConfig.dburi_subs_ws : undefined; //"www.leafgon.com:10001/sgraphql"
    const endpoint_qm = _clientConfig.dburi_qm ? _clientConfig.dburi_qm : undefined;
    const client_auth_key = _clientConfig.clientAuthKey ? _clientConfig.clientAuthKey : undefined;
    //const nfilter = _appid ? `{ appid: {eq: "${_appid}"} }` : '{}';
    const masterquery = _metamodel.GQLParameters.masterquery;

    let leaflakeclientobj = {subscriptions: {}, subs_methods: {}, qm_methods: {}};

    const reconnectGQLClient = ({gql_subs_client, force=false}={}) => {
      if (force || [WebSocket.CLOSED,WebSocket.CLOSING].includes(gql_subs_client.clientContext.websocket.client.readyState)) {
        console.log("LEAF Log: gos.api.leafio.leaflake: WebSocket currently not open or opening. Re-establishing the connection...");
        gql_subs_client.establishWS();
      }
    };
    
    // in case the change initially came from the backend, handleGraphUpdate() takes care of the downstream update chain
    const handleGraphUpdate = ({ data: { graph }, errors }) => {
        if (errors && errors.length > 0) {
        console.log(errors[0])
        };
        //if (nodes && graph_data) {}
        const {nodes, edges } = graph;
        if (nodes) {
            console.log('LEAF Log: gos.api.leafio.leaflake: handleGraphUpdate(): graph update being handled.');
            //const {node_list, edge_list} = parseGraphNodes(nodes);
            //graph_data.nodes = nodes; // update vertices 
            //setGraphData({"nodes": nodes, "edges": graph_data.edges});
            //setGraphData({"nodes": node_list, "edges": edge_list});
            //setNewState({"nodes": node_list, "edges": edge_list}, LEAFIOmetamodel.OriginType.BACKEND); // this sends the message to all subscribers.

            // spark_dev_note: _handleChange is a function passed as an argument, and is defined by API users to do something 
            // in tune with backend graph data changes.
            // The function may or may not involve saving data changes to a local memory
            // _handleChange built using functions available through ghostos/microservices
            // would provide a way to synchronize leaflake graph data changes to client app logic.
            //_handleChange && _handleChange({"nodes": node_list, "edges": edge_list}, LEAFIOmetamodel.OriginType.BACKEND);
            //_handleChange && _handleChange({ graph });
        }; 
        // spark_dev_note: 
        // retrieving edges via graphql subscription call to the backend is deprecated, as nodes.out_edges have enough info to deduce edges from nodes.
        // please remove the chunk of relevant code as soon as possible
        //if (edges && graph_data) { 
        //    console.log('edge list updated');
        //    console.log(edges);
        //    //graph_data.edges = edges; // update edges
        //    setGraphData({"nodes": graph_data.nodes, "edges": edges});
        //};
    };
    const subsCallback = (event) => {
        //console.log(event);
        handleGraphUpdate(event);
    };
    const errorSubsCallback = (error) => {
        console.error('LEAF Error: gos.api.leafio.leaflake: errorSubsCallback():', error);
    };

    // establish a client connection for gql query+mutation
    leaflakeclientobj.gql_qm_client = endpoint_qm && createGQLClient({
      endpoint: endpoint_qm,
      headers: client_auth_key ? {
        //'Content-Type': 'application/json', // should never use this when using fetch
        'Accept': 'application/json',
        'X-API-Key': client_auth_key
      } : {
        //'Content-Type': 'application/json', // should never use this when using fetch
        'Accept': 'application/json'
      }
    });

    const gqlsubsclientPromise = new Promise((resolve, reject) => {
        // establish a client connection to subscribe to the backend changes
        leaflakeclientobj.gql_subs_client = (endpoint_subs && websocket_subs) ? createGQLClient({
            endpoint: endpoint_subs,
            headers: client_auth_key ? {
            'Content-Type': 'application/json',
            'X-API-Key': client_auth_key
            } : {
            'Content-Type': 'application/json',
            },
            websocket: {
                endpoint: websocket_subs,
                onConnectionSuccess: () => {
                    //console.log('gql_subs_client: Connected')
                    resolve("gql_subs_client is connected and ready");

                },
                onConnectionError: () => {
                    //console.log('gql_subs_client: Connection Error');
                    reject('gql_subs_client: Connection Error');
                },
            }
        }) : undefined;

    });
    console.log("gqlsubsclientPromise is made.");

    const getGraphSubscription = async ({_appmode, _domain, _appid, filter='{}', subsCallback, errorCallback=undefined, variables=undefined}={}) => {
        gqlsubsclientPromise.then((msg) => { // wait till the ws connection promise is resolved for subscription requests
            const generateOperationId = () => {
                let id = '';
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
                        subscription: SUBS_GRAPH({_domain, _appid, filter: filter, query: masterquery}),
                        //subscription: getLEAFgqlSubs('temporary_test_appid'),
                        onGraphQLData: (event) => { 
                            console.log('gql_subs_client: onGraphQLData()', event.data);
                            subsCallback && subsCallback(event.data);
                        },
                        onGraphQLError: (event) => { 
                            console.log('gql_subs_client: onGraphQLError()', event);
                            operationId in leaflakeclientobj.subscriptions && leaflakeclientobj.subscriptions[operationId].stop();
                            errorCallback && errorCallback(event);
                        },
                        onGraphQLComplete: (event) => { 
                            console.log('LEAF Log: gql_subs_client: onGraphQLComplete():', event);
                            if (_clientConfig.keepGQLConnected) 
                                reconnectGQLClient({gql_subs_client: leaflakeclientobj.gql_subs_client, force: true}); // spark_dev_note: determine whether this is desirable
                        },
                    },
                    //subsCallback,
                    //errorCallback
                );
                console.log(subscription_handle); 
                leaflakeclientobj.subscriptions[operationId] = subscription_handle;
                
            } catch (error) {
                console.log('Error: getGraphSubscription():', error);
                operationId in leaflakeclientobj.subscriptions && leaflakeclientobj.subscriptions[operationId].stop();
            }
        });
    };
    // now define a bunch of graphql qm methods (query or mutation)
    const getGraphQuery_memcache_resolver = ({_appmode, _hostdomain, _hostappid, _domain, _appid, filter='{}', variables}={}) => JSON.stringify([_domain, _appid, filter, _sessionid]);
    // spark_dev_note: 25/Nov/2023
    // the memcache resolver including hostdomain/hostappid pair as part of the resolution logic is a bit overkill,
    // I am uncertain as of now, though, as to if including that would make sense in some edge cases. Only time will tell. 
    const getGraphQuery = memoize(({_appmode, _hostdomain, _hostappid, _domain, _appid, filter='{}', variables}={}) => new Promise((resolve, reject) => {

      const query_options = {
        endpoint: endpoint_qm,
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
        //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
        query: JSON.stringify({"query": QUERY_GRAPH({_appmode, _hostdomain, _hostappid, _domain, _appid, filter: filter, query: masterquery}), "variables": (variables || {})}),
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
        //query: MUT_DELNODE,
        //query: `mutation DeleteNode($uuid: String!) {
        //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
        //}`,
        //variables: {
        //  uuid: el.id,
        //},
      }

      try {
        leaflakeclientobj.gql_qm_client.query(
          query_options,
          (qmresponse) => { // successCallback argument of executeQuery in gos.graphql.client.js
            if ('error' in qmresponse) {
                console.error("LEAFgon error (critical logical error prevents this app from functioning): ", qmresponse.error, JSON.stringify({_hostdomain, _hostappid, _domain, _appid}));
            }
          //  console.log(qmresponse.data);
            if (qmresponse.data)
            {
              //console.log('queryGetGraph(): ', qmresponse.data);
              //_handleChange && _handleChange({ graph: qmresponse.data.graph });
              resolve({ graph: qmresponse.data.graph });
            }
          }
          //(data) => { 
          //  console.log('gql_qm_client:query completed with sucess: ', data);
          //},
          //(data) => { 
          // console.log('gql_qm_client:query completed with error: ', data);
          //},
        );
      } catch (e) {
        console.log('Error getGraphQuery(): ', e);
        reject({});
      }
    }), getGraphQuery_memcache_resolver);

    const mutateAddNode = ({variables}) => {

      const mut_options = {
        endpoint: endpoint_qm,
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
        //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
        query: JSON.stringify({"query": MUT_ADDNODE, "variables": (variables || {})}),
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
        //query: MUT_DELNODE,
        //query: `mutation DeleteNode($uuid: String!) {
        //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
        //}`,
        //variables: {
        //  uuid: el.id,
        //},
      }
      try {
        leaflakeclientobj.gql_qm_client.query(
          mut_options,
          (qmresponse) => { // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
            if (qmresponse.data)
            {
              console.log('mutateAddNode() finished successfully: ', qmresponse.data);
            }
          }
          //(data) => { 
          //  console.log('gql_qm_client:query completed with sucess: ', data);
          //},
          //(data) => { 
          // console.log('gql_qm_client:query completed with error: ', data);
          //},
        );
      } catch (e) {
        console.log('Error mutateAddNode(): ', e);
      }
    };

    const mutateDelNode = ({node_uuid}) => {
      //const querystr = MUT_DELNODE; // getLEAFgqlStrDelNode(el.id);
      //const variables = {};
      //const test_query_str1 = JSON.stringify({"query": getLEAFgqlStrDelNode(node_uuid), "variables": (variables || {})}); 
      //const test_query_str2 = JSON.stringify({"query": MUT_DELNODE, "variables": ({uuid: node_uuid} || {})}); 
      const mut_options = {
        endpoint: endpoint_qm,
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(node_uuid), "variables": (variables || {})}),
        query: JSON.stringify({"query": MUT_DELNODE, "variables": ({uuid: node_uuid} || {})}).replace(/\\n/g, ''),
        //query: MUT_DELNODE,
        //query: `mutation DeleteNode($uuid: String!) {
        //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
        //}`,
        //variables: {
        //  uuid: el.id,
        //},
      }

      try {
        leaflakeclientobj.gql_qm_client.query(
          mut_options,
          (qmresponse) => { // successCallback argument of executeQuery in gos.graphql.client.js
            //  console.log(qmresponse.data);
            if (qmresponse.data)
            {
              console.log('mutateDelNode() finished successfully: ', qmresponse.data);
            }
          }
          //(data) => { 
          //  console.log('gql_qm_client:query completed with sucess: ', data);
          //},
          //(data) => { 
          // console.log('gql_qm_client:query completed with error: ', data);
          //},
        );
        //return qmresponsePromise;
      } catch (e) {
        console.log('Error onElementsRemove(): ', e);
      }
    }

    const mutateUpdateNode = ({variables}) => {

      const mut_options = {
        endpoint: endpoint_qm,
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
        //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
        query: JSON.stringify({"query": MUT_UPDATENODE, "variables": (variables || {})}),
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
        //query: MUT_DELNODE,
        //query: `mutation DeleteNode($uuid: String!) {
        //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
        //}`,
        //variables: {
        //  uuid: el.id,
        //},
      }
      try {
        leaflakeclientobj.gql_qm_client.query(
          mut_options,
          //(data) => { 
          //  console.log('gql_qm_client:query completed with sucess: ', data);
          //},
          //(data) => { 
          // console.log('gql_qm_client:query completed with error: ', data);
          //},
          (qmresponse) => { // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
            if (qmresponse.data)
            {
              console.log('mutateUpdateNode() finished successfully: ', qmresponse.data);
            }
          }
        );
        //return qmresponsePromise;
      } catch (e) {
        console.log('Error mutateUpdateNode(): ', e);
      }
    };

    const mutateAddEdge = ({variables}) => {

      const mut_options = {
        endpoint: endpoint_qm,
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
        //query: JSON.stringify({"query": getLEAFgqlStrAddNode({id: uuid, type: type, position: position}), "variables": (variables || {})}),
        query: JSON.stringify({"query": MUT_ADDEDGE, "variables": (variables || {})}),
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id), "variables": (variables || {})}),
        //query: MUT_DELNODE,
        //query: `mutation DeleteNode($uuid: String!) {
        //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
        //}`,
        //variables: {
        //  uuid: el.id,
        //},
      }
      try {
        leaflakeclientobj.gql_qm_client.query(
          mut_options,
          (qmresponse) => { // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
            if (qmresponse.data)
            {
              console.log('mutateAddEdge() finished successfully: ', qmresponse.data);
            }
          }
          //(data) => { 
          //  console.log('gql_qm_client:query completed with sucess: ', data);
          //},
          //(data) => { 
          // console.log('gql_qm_client:query completed with error: ', data);
          //},
        );
        //return qmresponsePromise;
      } catch (e) {
        console.log('Error mutateAddEdge(): ', e);
      }
    };

    const mutateDelEdge = ({edge_uuid}) => {
      //const querystr = MUT_DELNODE; // getLEAFgqlStrDelNode(el.id);
      const variables = {};
      //const test_query_str1 = JSON.stringify({"query": getLEAFgqlStrDelEdge(edge_uuid), "variables": (variables || {})}); 
      //const query_str = JSON.stringify({"query": MUT_DELEDGE, "variables": ({uuid: edge_uuid} || {})}).replace(/\\n/g, ''); 
      const mut_options = {
        endpoint: endpoint_qm,
        //query: JSON.stringify({"query": getLEAFgqlStrDelNode(el.id)}).replace(/\\n/g, ''),
        //query: JSON.stringify({"query": getLEAFgqlStrDelEdge(edge_uuid), "variables": (variables || {})}),
        query: JSON.stringify({"query": MUT_DELEDGE, "variables": ({uuid: edge_uuid} || {})}).replace(/\\n/g, ''),
        //query: MUT_DELNODE,
        //query: `mutation DeleteNode($uuid: String!) {
        //  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {label}}
        //}`,
        //variables: {
        //  uuid: el.id,
        //},
      }
      try {
        leaflakeclientobj.gql_qm_client.query(
          mut_options,
          (qmresponse) => { // successCallback argument of executeQuery in gos.graphql.client.js
          //  console.log(qmresponse.data);
            if (qmresponse.data)
            {
              console.log('mutateDelEdge() finished successfully: ', qmresponse.data);
            }
          }
          //(data) => { 
          //  console.log('gql_qm_client:query completed with sucess: ', data);
          //},
          //(data) => { 
          // console.log('gql_qm_client:query completed with error: ', data);
          //},
        );
        //return qmresponsePromise;
      } catch (e) {
        console.log('Error onElementsRemove(): ', e);
      }
    }

    if(leaflakeclientobj.gql_subs_client) {
        leaflakeclientobj.subs_methods = {
            queryGraph: getGraphSubscription,
            clientState: () => {
                return leaflakeclientobj.gql_subs_client.clientContext.websocket.client.readyState;
            },
            reconnect: () => {
                reconnectGQLClient({gql_subs_client: leaflakeclientobj.gql_subs_client});
            },
        };
    }
    if(leaflakeclientobj.gql_qm_client) {
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

export { initializeLEAFlakeGQLClient }

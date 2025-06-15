//import SHA256 from 'crypto-js/sha256';
//import Base64 from 'crypto-js/enc-base64';
//import sjcl from 'sjcl';
//import gql from 'graphql-tag';
import {v4 as uuidv4} from 'uuid';
import {createGQLClient} from '../../../../graphql/client'; //'../../lib/graphql/client';

const endpoint_subs = process.env.LEAFGON_ENDPOINT_SUBS; // "http://localhost:10001/sgraphql";
const websocket_subs = process.env.LEAFGON_WEBSOCKET_SUBS; // "ws://localhost:10001/sgraphql";
const endpoint_qm = process.env.LEAFGON_ENDPOINT_QM; // "http://localhost:10001/qmgraphql";
//const endpoint_subs = "https://www.leafgon.com:10001/sgraphql";
//const websocket_subs = "wss://www.leafgon.com:10001/sgraphql";
//const endpoint_qm = "https://www.leafgon.com:10001/qmgraphql";

const gql_qm_client = createGQLClient({
  endpoint: endpoint_qm,
  headers: {
    //'Content-Type': 'application/json', // should never use this when using fetch
    'Accept': 'application/json'
  }
});

const getLEAFgqlSubs = (graph) => {
  //const nfilter = '{in_edges: {label: {eq: "Alice39-ala2"}}}'
  //const appid2 = SHA256('www.leafgon.com').toString();
  //const appid = Base64.stringify(SHA256('www.leafgon.com'));
  //const appid = sjcl.codec.base64.fromBits(sjcl.hash.sha256.hash(appid_str));
  //const appid = btoa(JSON.stringify(appid_str)); // Base64 encoding of a jsonified string
  //const nfilter = `{appid: {eq: "${appid}"}}`
  //const efilter = `{appid: {eq: "${appid}"}}`
  //const nfilter = appid_str ? `{ appid: {eq: "${appid_str}"} }` : '{}';
  const nfilter = '{}';
  const efilter = '{}';
  const SUBS_GRAPH = `
    subscription {graph:
      getGraph(domain: "${graph.domain}", appid: "${graph.appid}", nfilter: ${nfilter}, efilter: ${efilter}) {
        domain
        appid
        nodes {
          uuid
          out_edges {uuid source {uuid } target {uuid} data}
          data
        }
      }
    }
  `;

  return SUBS_GRAPH;
};

/*
    const new_node = {
      id: node_uuid,
      type,
      leafnodetype,
      position,
      data: data_obj,

      style: { border: '1px solid #777', padding: 2, borderRadius: '5px' }
    };
*/
const getLEAFgqlStrAddNode = (node_input) => {
  const a_new_node = `{uuid: "${node_input.id}", data: {leafeditor: {type: "${node_input.type}", position: "${node_input.position}"}}}`;
  const MUT_AddNode = `
    mutation {
      addNode(input: [${a_new_node}]) {node {uuid}}
    }
  `;
  return MUT_AddNode;
};

const getLEAFgqlStrUpdateNode = (node_input) => {
  const a_new_node = `{uuid: "${node_input.id}", data: {leafeditor: {type: "${node_input.type}", position: "${node_input.position}"}}}`;
  const MUT_UpdateNode = `
    mutation {
      updateNode(input: [${a_new_node}]) {node {uuid}}
    }
  `;
  return MUT_UpdateNode;
};

const getLEAFgqlStrDelNode = (node_uuid) => {
  const MUT_DelNode = `
    mutation {
      deleteNode(nfilter: {uuid: {eq: "${node_uuid}"}}) {node {uuid}}
    }
  `;
  return MUT_DelNode;
};

const getLEAFgqlStrDelEdge = (edge_uuid) => {
  const MUT_DelEdge = `
    mutation {
      deleteEdge(efilter: {uuid: {eq: "${edge_uuid}"}}) {edge {uuid}}
    }
  `;
  return MUT_DelEdge;
};

const MUT_DELNODE = `mutation DeleteNode($uuid: String!) {
  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {uuid}}
}`;

const MUT_UPDATENODE = `mutation UpdateNode($uuid: String!, $data: String!) {
  updateNode(input: {filter: {uuid: {eq: $uuid}}, set: {data: $data}}) {node {uuid}}
}`;
//  updateNode(input: {filter: {uuid: {eq: $uuid}}, set: {label: $label, data: $data}}) {node {label}}

const MUT_ADDNODE = `mutation AddNode($uuid: String!, $leafnodetype: String, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {
  addNode(input: [{uuid: $uuid, leafnodetype: $leafnodetype, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {node {uuid}}
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

//const mutateAddNode2 = async ({uuid, type, position}) => {
const mutateAddNode = async ({variables}) => {

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
  let qmresponse;
  try {
    qmresponse = await gql_qm_client.query(
      mut_options,
      //(data) => { 
      //  console.log('gql_qm_client:query completed with sucess: ', data);
      //},
      //(data) => { 
      // console.log('gql_qm_client:query completed with error: ', data);
      //},
    );
    //.then( () => {
    //  console.log(qmresponse.data);
    //});
    if (qmresponse.data)
    {
      console.log('mutateAddNode(): ', qmresponse.data);
    }
  } catch (e) {
    console.log('Error mutateAddNode(): ', e);
  }
};

const mutateDelNode = async ({node_uuid}) => {
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
  let qmresponse;
  try {
    qmresponse = await gql_qm_client.query(
      mut_options,
      //(data) => { 
      //  console.log('gql_qm_client:query completed with sucess: ', data);
      //},
      //(data) => { 
      // console.log('gql_qm_client:query completed with error: ', data);
      //},
    );
    //.then( () => {
    //  console.log(qmresponse.data);
    //});
    if (qmresponse.data)
    {
      console.log('onElementsRemove(): ', qmresponse.data);
    }
  } catch (e) {
    console.log('Error onElementsRemove(): ', e);
  }
}

const mutateUpdateNode = async ({variables}) => {

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
  let qmresponse;
	try {
	  qmresponse = await gql_qm_client.query(
	    mut_options,
	    //(data) => { 
	    //  console.log('gql_qm_client:query completed with sucess: ', data);
	    //},
	    //(data) => { 
	    // console.log('gql_qm_client:query completed with error: ', data);
	    //},
	  );
	  //.then( () => {
	  //  console.log(qmresponse.data);
	  //});
	  if (qmresponse.data)
	  {
	    console.log('mutateUpdateNode(): ', qmresponse.data);
	  }
	} catch (e) {
	  console.log('Error mutateUpdateNode(): ', e);
	}
};

const mutateAddEdge = async ({variables}) => {

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
  let qmresponse;
  try {
    qmresponse = await gql_qm_client.query(
      mut_options,
      //(data) => { 
      //  console.log('gql_qm_client:query completed with sucess: ', data);
      //},
      //(data) => { 
      // console.log('gql_qm_client:query completed with error: ', data);
      //},
    );
    //.then( () => {
    //  console.log(qmresponse.data);
    //});
    if (qmresponse.data)
    {
      console.log('mutateAddEdge(): ', qmresponse.data);
    }
  } catch (e) {
    console.log('Error mutateAddEdge(): ', e);
  }
};

const mutateDelEdge = async ({edge_uuid}) => {
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
  let qmresponse;
  try {
    qmresponse = await gql_qm_client.query(
      mut_options,
      //(data) => { 
      //  console.log('gql_qm_client:query completed with sucess: ', data);
      //},
      //(data) => { 
      // console.log('gql_qm_client:query completed with error: ', data);
      //},
    );
    //.then( () => {
    //  console.log(qmresponse.data);
    //});
    if (qmresponse.data)
    {
      console.log('onElementsRemove(): ', qmresponse.data);
    }
  } catch (e) {
    console.log('Error onElementsRemove(): ', e);
  }
}

export {getLEAFgqlStrAddNode, getLEAFgqlStrUpdateNode, getLEAFgqlStrDelNode, getLEAFgqlSubs, mutateUpdateNode, mutateAddNode, mutateDelNode, mutateAddEdge, mutateDelEdge, MUT_UPDATENODE, MUT_ADDNODE, MUT_DELNODE, endpoint_subs, websocket_subs, endpoint_qm};

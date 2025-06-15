import { createGQLClient } from '../../graphql/client'; 

import { reconstructLEAFGraph, analyzeLEAFGraph, parseLEAFGraph } from '../../api/parser/leaf';
import {allSimplePaths} from 'graphology-simple-path';

import { useLEAFIOapi, initializeMasterSubsDirectory } from './core';
import { etaReduceDataflowComponent, runtimeEtaTree } from '../../api/parser/eta.js';

import { Observable, range, of, map, from, zip, skip, interval, merge, mergeAll, combineLatest } from 'rxjs';
import { LEAFIOmetamodel } from '../../api/metamodel';
import { initializeLEAFlakeGQLClient } from './leaflake';

//const endpoint_subs = "https://www.leafgon.com:10001/sgraphql";
//const websocket_subs = "wss://www.leafgon.com:10001/sgraphql";
const endpoint_subs = "http://localhost:10001/sgraphql";
const websocket_subs = "ws://localhost:10001/sgraphql";
const domain = "storm";
const appid = 'chicken10';

const nfilter = '{}';
const efilter = '{}';
const SUBS_GRAPH = `
  subscription {graph:
    getGraph(domain: "${domain}", appid: "${appid}", nfilter: ${nfilter}, efilter: ${efilter}) {
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
//const nfilter = appid ? `{ appid: {eq: "${appid}"} }` : '{}';
//const SUBS_GRAPH = `
//  subscription {
//    getGraph(nfilter: ${nfilter}, efilter: {}) {
//      nodes {
//        appid 
//        uuid
//        label
//        out_edges {appid uuid label source {appid uuid label} target {appid uuid label data} data}
//        data
//      }
//    }
//  }
//`;

const parseGraphNodes = (nodes) => {
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

const [masterstateObjInstanceID, masterSubsDirectory] = initializeMasterSubsDirectory('instance1');

//const handleGraphUpdate = (done) => ({ data: { graph: {nodes, edges }}, errors }) => {}
const handleGraphUpdate = (done) => async (data ={}) => {
    const {nodes, edges } = data.graph;
    let paths;
    if (nodes) {
      const leafgraph = reconstructLEAFGraph(nodes, masterSubsDirectory);
      console.log('nodes and edges updated');
      //leafgraph.graph.mapEdges((edge, attributes, source, target, sourceAttributes, targetAttributes) => {
      //  console.log('edge: ', attributes, source, target);
      //});
      const leafcomponents = analyzeLEAFGraph(leafgraph);
      //parseLEAFGraph({...leafgraph, ...leafcomponents});

      // initialize leaf compiler
      const etaTree = runtimeEtaTree(domain, appid, leafgraph, leafcomponents, masterSubsDirectory);
      const main_component = leafcomponents.components.nodegroups.runtime[0];
      const leafGraphRuntime = await etaReduceDataflowComponent({component_members: main_component, contextuallambda: [], etaTree: etaTree});
      etaGraphRuntime = leafGraphRuntime; // store in the file global.

      //paths = allSimplePaths(leafgraph.graph, '4bfd65e3-870c-4e05-abdf-66531c492ae8', 'ce9b9aff-ddb1-443d-b007-ad878765478a');
      //const {node_list, edge_list} = parseGraphNodes(nodes);
      //graph_data.nodes = nodes; // update vertices 
      //setGraphData({"nodes": nodes, "edges": graph_data.edges});
      //setGraphData({"nodes": node_list, "edges": edge_list});
    };
    // spark_dev_note: 
    // retrieving edges via graphql subscription call to the backend is deprecated, as nodes.out_edges have enough info to deduce edges from nodes.
    // please remove the chunk of relevant code as soon as possible
    if (edges) { 
      console.log('edge list updated');
      console.log(edges);
      //graph_data.edges = edges; // update edges
      //setGraphData({"nodes": graph_data.nodes, "edges": edges});
    };
    eventFired = true;
    //const input$ = from([[1,2,3],[4,5,6],[7]]);
    const input$ = from([{a: "helloworld", description: "coolest"},{a: "gotthis", description: "beans"}]);
    //const input$ = from([[1,2,3]]);
    //const input$ = interval(1000);
    //const input$2 = input$.pipe(take(4));
    //const input$ = zip(mybeatlist);
    //const output$ = leafGraphRuntimeLUT.map((runtimeFunc, key) => {})
    const middleinput$ = input$.pipe(map(x => {
      console.log('peephole:', x);
      return x;
    }));
    //const output$ = etaGraphRuntime([middleinput$]);
    const output$obj = etaGraphRuntime([{_stream: middleinput$}]);
    //const output$ = leafGraphRuntimeLUT[0](mybeatlist);
    //const output$ = zip(mybeatlist1);
    //const output$ = zip([input$]);
    console.log('subscribing to a rxjs stream')
    //const output2$ = input$.pipe(
    //  take(4)
      //map((x)=>{console.log('output$: ', x); return x})
    //);
    
    let outbuffer = [];
    output$obj._stream.subscribe({ 
      next: x => {
        outbuffer = outbuffer.concat(x);
        console.log('next: ', x);
      },
      error: (err) => { // error
        console.log('Error: ' + err);
      },
      complete: () => {
        console.log(outbuffer);
        expect(JSON.stringify(outbuffer)).toBe(JSON.stringify([2]));
        done();
      },
    });
};

const curriedSubsCallback = (done) => {
  return (event) => {
      console.log(event);
      handleGraphUpdate(done)(event);
  };
}; 

const errorSubsCallback = (error) => {
    console.log('Error: ', error);
};

var eventFired = undefined;
let etaGraphRuntime = undefined;

function assert(condition, message) {
  if (!condition) {
      throw new Error(message || "Assertion failed");
  }
}

//const gql_subs_client = createClient({
//  endpoint: endpoint_subs,
//  headers: {
//    'Content-Type': 'application/json',
//  },
//  websocket: {
//    endpoint: websocket_subs,
//    onConnectionSuccess: () => {
//      console.log('gql_subs_client: Connected')
//      try {
//        gql_subs_client.subscribe(
//          {
//            //subscription: getLEAFgqlSubs(props.appid),
//            subscription: getLEAFgqlSubs(props.graph),
//            //subscription: getLEAFgqlSubs('temporary_test_appid'),
//            //onGraphQLData: (data) => { console.log('gql_subs_client: onGraphQLData()', data)},
//            //onGraphQLError: (data) => { console.log('gql_subs_client: onGraphQLError()', data)},
//            onGraphQLComplete: (data) => { console.log('gql_subs_client: onGraphQLComplete() called with data:', data)},
//          },
//          subsCallback,
//          errorSubsCallback
//        );
//      } catch (error) {
//        console.log('Error: ', error);
//      }
//    },
//    onConnectionError: () => console.log('gql_subs_client: Connection Error'),
//  }
//});
//it('should emit some_event', function(done){
jest.useFakeTimers();
//jest.useRealTimers();
test('should emit some_event', async (done) => {
  let subscription;
  const gql_subs_client = initializeLEAFlakeGQLClient({
    _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_full,
  });
  const ret1 = await gql_subs_client.qm_methods.queryGraph({_domain: domain, _appid: 'chicken11'});
  gql_subs_client.subs_methods.queryGraph({_domain: domain, _appid: appid, subsCallback: handleGraphUpdate(done)});
  gql_subs_client.subs_methods.queryGraph({_domain: domain, _appid: 'chicken11', subsCallback: handleGraphUpdate(done)});
  //const gql_subs_client = initializeLEAFlakeGQLClient({
  //  _domain: domain, _appid: appid, 
  //  _clientConfig: LEAFIOmetamodel.breezyforest.GQLParameters.clientconfig_full,
  //  _handleChange: handleGraphUpdate(done)});

  //const gql_subs_client = createGQLClient({
  //    endpoint: endpoint_subs,
  //    headers: {
  //        'Content-Type': 'application/json',
  //    },
  //    websocket: {
  //        endpoint: websocket_subs,
  //        onConnectionSuccess: () => {
  //          console.log('gql_subs_client: Connected')
  //          try {
  //            subscription = gql_subs_client.subscribe(
  //              {
  //                  subscription: SUBS_GRAPH,
  //                  //subscription: getLEAFgqlSubs('temporary_test_appid'),
  //                  //onGraphQLData: (data) => { console.log('gql_subs_client: onGraphQLData()', data)},
  //                  //onGraphQLError: (data) => { console.log('gql_subs_client: onGraphQLError()', data)},
  //                  onGraphQLComplete: (data) => { 
  //                    console.log('gql_subs_client: onGraphQLComplete()', data); 
  //                  },
  //              },
  //              curriedSubsCallback(done),
  //              errorSubsCallback
  //            );
  //          } catch (error) {
  //              console.log('Error: ', error);
  //          }
  //        },
  //        onConnectionError: () => console.log('gql_subs_client: Connection Error'),
  //    }
  //});
  //expect(eventFired).toBe(true); // await leaf compilation, till etaGraphRuntime is assigned.
  //setTimeout(async function () {
  //  // wrap up loose ends prior to ending the unit test
  //  //await subscription.stop();
  //  expect(eventFired).toBe(true);
  //  //assert(eventFired, 'Event did not fire in 1000 ms.');
  //  done();
  //  console.log("ending the test");
  //}, 1000); //timeout with an error in one second
  //myObj.on('some_event',function(){
  //  eventFired = true
  //});
  // do something that should trigger the event
  //setTimeout(async () => {
  //}, 4000);

  //console.log("end of the test code");
});

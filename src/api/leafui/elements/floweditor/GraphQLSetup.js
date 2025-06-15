//import { ApolloClient } from '@apollo/client';
//import { getMainDefinition } from 'apollo-utilities';
//import { InMemoryCache } from '@apollo/client';
//import { HttpLink, split, ApolloLink, from } from '@apollo/client';
//import { RetryLink } from '@apollo/client/link/retry';
//import { WebSocketLink } from "@apollo/client/link/ws";
import { GraphQLClient } from 'graphql-hooks'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import memCache from 'graphql-hooks-memcache'

import axios from 'axios'
import { buildAxiosFetch } from '@lifeomic/axios-fetch'


//const endpoint = "gdb.leafgon.com/graphql";
//const endpoint_subs = "ws://localhost:10001/sgraphql";
//const endpoint_qm = "http://localhost:10001/qmgraphql";
//const endpoint_subs = "wss://www.leafgon.com:10001/sgraphql"; // spark_dev_note: www.leafgon.com:10001 same as gdb.leafgon.com
//const endpoint_qm = "https://www.leafgon.com:10001/qmgraphql"; // refactor this port to be closed for public access in the cloud and start only using gdb.leafgon.com
const endpoint_subs = "wss://gdb.leafgon.com/sgraphql"; // spark_dev_note: www.leafgon.com:10001 same as gdb.leafgon.com
const endpoint_qm = "https://gdb.leafgon.com/qmgraphql"; // refactor this port to be closed for public access in the cloud and start only using gdb.leafgon.com
//const endpoint = "rickandmortyapi.com/graphql";

//const wsLink = new WebSocketLink({
//    uri: `wss://${endpoint}`,
//    options: {
//        reconnect: true
//    }
//});

//const httpLink = new HttpLink({ uri: `https://${endpoint}`, headers: {'content-type': 'application/graphql'}});

//const link = new RetryLink().split(
/*
const link = split(
    // split based on query operation type
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
        );
    },
//    wsLink,
//    httpLink
);
const headerMiddleware = new ApolloLink((operation, forward) => {
  // add content-type to the headers
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      content-type: "application/graphql",
    }
  }));

  return forward(operation);
})
*/

const gqlAxios = axios.create()
gqlAxios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    // Handle expired JWT and refresh token
    console.error(error);
  }
)

const gqlHandleError = ({operation, result}) => {
    console.error(result.error);
};

const GRAPHQL_CLIENT = new GraphQLClient({
    cache: memCache(),
    //connectToDevTools: true,
    //link: httpLink,
    //headers: {
    //  'Content-Type': 'application/json', 
    //  'Accept': 'application/json',
    //},
    //url: 'https://gdb.leafgon.com/graphql',
    //subscriptionClient: new SubscriptionClient('wss://gdb.leafgon.com/graphql', {reconnect: true})
    url: endpoint_qm,
    //fetch: buildAxiosFetch(gqlAxios),
    fetch: null,
    subscriptionClient: new SubscriptionClient(endpoint_subs, {reconnect: true}),
    //link: from([
    //    headerMiddleware,
    //    httpLink
    //])
    fetchOptions: {
      mode: 'no-cors',
      //mode: 'same-origin',
    },
});
export default GRAPHQL_CLIENT;

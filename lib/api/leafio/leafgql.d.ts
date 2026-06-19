export function getLEAFgqlEndpoints(): {
    endpoint_subs: string;
    websocket_subs: string;
    endpoint_qm: string;
};
export function setLEAFgqlEndpoints({ endpoint_subs: nextEndpointSubs, websocket_subs: nextWebsocketSubs, endpoint_qm: nextEndpointQm, }?: {}): {
    endpoint_subs: string;
    websocket_subs: string;
    endpoint_qm: string;
};
export function getLEAFgqlStrAddNode(node_input: any): string;
export function getLEAFgqlStrUpdateNode(node_input: any): string;
export function getLEAFgqlStrDelNode(node_uuid: any): string;
export function getLEAFgqlSubs(graph: any): string;
export function mutateUpdateNode({ variables, endpoint }: {
    variables: any;
    endpoint?: string | undefined;
}): Promise<void>;
export function mutateAddNode({ variables, endpoint }: {
    variables: any;
    endpoint?: string | undefined;
}): Promise<void>;
export function mutateDelNode({ node_uuid, endpoint }: {
    node_uuid: any;
    endpoint?: string | undefined;
}): Promise<void>;
export function mutateAddEdge({ variables, endpoint }: {
    variables: any;
    endpoint?: string | undefined;
}): Promise<void>;
export function mutateDelEdge({ edge_uuid, endpoint }: {
    edge_uuid: any;
    endpoint?: string | undefined;
}): Promise<void>;
export const MUT_UPDATENODE: "mutation UpdateNode($uuid: String!, $data: String!) {\n  updateNode(input: {filter: {uuid: {eq: $uuid}}, set: {data: $data}}) {node {uuid}}\n}";
export const MUT_ADDNODE: "mutation AddNode($uuid: String!, $leafnodetype: String, $data: String!, $graphdomain: String!, $graphappid: String!, $provdomain: String!, $provappid: String!) {\n  addNode(input: [{uuid: $uuid, leafnodetype: $leafnodetype, graph: {domain: $graphdomain, appid: $graphappid}, provenance: {domain: $provdomain, appid: $provappid}, data: $data}]) {node {uuid}}\n}";
export const MUT_DELNODE: "mutation DeleteNode($uuid: String!) {\n  deleteNode(nfilter: {uuid: {eq: $uuid}}) {node {uuid}}\n}";
export let endpoint_subs: string;
export let websocket_subs: string;
export let endpoint_qm: string;

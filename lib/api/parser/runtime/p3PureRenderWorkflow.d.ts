export class P3PureRenderPolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export const P3_CORE_NODES: readonly string[];
export const P3_RENDER_ADAPTERS: readonly string[];
export function executeP3CoreNodeByPolicy({ nodeType, event, args, nodeId, observability, }?: {
    args?: {} | undefined;
    nodeId?: any;
    observability?: {} | undefined;
}): any;
export function renderP3AdapterByPolicy({ adapterName, event, config, nodeId, observability, }?: {
    config?: {} | undefined;
    nodeId?: string | undefined;
    observability?: {} | undefined;
}): any;
export function renderP3AdapterPayload({ adapterName, payload, config }: {
    adapterName: any;
    payload: any;
    config?: {} | undefined;
}): {
    type: string;
    text: any;
    imagelist?: undefined;
    innerhtml?: undefined;
    templateVersion?: undefined;
} | {
    type: string;
    imagelist: any[];
    text?: undefined;
    innerhtml?: undefined;
    templateVersion?: undefined;
} | {
    type: string;
    innerhtml: string;
    templateVersion: any;
    text?: undefined;
    imagelist?: undefined;
};
export function transformP3CorePayload({ nodeType, payload, args }: {
    nodeType: any;
    payload: any;
    args?: {} | undefined;
}): any;

export function etaReduceLambdaGraphs({ refnode, nodelambda, contextuallambda, etaTree, addnodelut, metadata, }?: {
    addnodelut?: boolean | undefined;
    metadata?: {} | undefined;
}): Promise<{
    _nodelut: {};
} | {
    _nodelut?: undefined;
}>;
export const etaReduceDataflowComponent: any;
export function runtimeEtaTree(_mode: any, _host_domain: any, _host_appid: any, _domain: any, _appid: any, _leafgraph: any, _graphcomponents: any, _leafio: any, _leaflakeio: any, _mnemosyne: any, _hostEtaTree?: undefined): {
    sessionid: any;
    appmode: any;
    hostdomain: any;
    hostappid: any;
    domain: any;
    appid: any;
    leafgraph: undefined;
    graphcomponents: undefined;
    rootgraphstate: undefined;
    leafio: undefined;
    leaflakeio: undefined;
    mnemosyne: undefined;
    hostEtaTree: undefined;
    leafnodemethods: {};
    lookupRuntimeLambdaLUT: (graphdomain: any, graphappid: any, refnode: any, nodelambda: any, contextuallambda: any, isnodeonly?: boolean) => Promise<{
        _default: (inputArr$: any) => undefined;
    } | {
        _nodelut: {};
    } | {
        _nodelut?: undefined;
    }>;
    lookupLEAFNodeMethods: (nodeuuid: any, _refnodedata?: undefined) => Promise<any>;
    etaReduceLEAFNode: ({ nodeuuid, contextuallambda }?: {}) => Promise<{
        _default: (inputArr$: any) => undefined;
    }>;
    loadElementJsEsmModule: (moduleUrl: any) => Promise<any>;
    initTree: (_leafgraph: any, _graphcomponents: any, _leafio: any, _leaflakeio: any, _mnemosyne: any) => ({ nodeuuid, contextuallambda }?: {}) => Promise<{
        _default: (inputArr$: any) => undefined;
    }>;
};
export function rxTimeoutStream(prom: any, time: any, codebase: any, exception: any, metadata: any): import("rxjs").Observable<any>;
export function doChronosSynchronize(_stream$objArr: any, _gates?: {
    time: number;
    count: number;
}, _nodeflowinterface?: undefined, rt_context?: {}): {
    ctrl: any;
    data: import("rxjs").Observable<any>;
};
export function doChronosAsynchronize(_stream$objArr: any, _gates?: {
    time: number;
    count: number;
}, rt_context?: {}): {
    ctrl: import("rxjs").Observable<unknown>;
    data: import("rxjs").Observable<any>;
};

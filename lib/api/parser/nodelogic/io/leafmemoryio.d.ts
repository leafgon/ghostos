export class MemoryRuntimePolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export namespace _leafmemoryio {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
            _config: any;
        };
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    function methods(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => {
        etatreeforest: {
            initEtaTreeForest: () => void;
            getEtaTree: (graphdomain: any, graphappid: any) => Promise<any>;
            setEtaTree: (graphdomain: any, graphappid: any, etaTree: any, parentname: any) => void;
            removeEtaBush: (graphdomain: any, graphappid: any) => void;
            parseGraphEtaTree: (graphdomain: any, graphappid: any) => Promise<{
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
            }>;
        };
        general: {
            setMasterMemory: (memoryname: any, data: any) => any;
            getMasterMemory: (memoryname: any) => any;
        };
    };
}
export function assertLeafMemoryPersistencePolicy({ persistenceMode }?: {
    persistenceMode?: string | undefined;
}): string;
export function createLeafMemoryCheckpoint({ state, checkpointId }?: {
    checkpointId?: string | undefined;
}): Readonly<{
    checkpointId: string;
    stateVersion: any;
    snapshot: Readonly<{
        current: any;
        history: any;
    }>;
}>;
export function driveLeafMemoryByRuntimePolicy({ memoryname, memoryKey, persistenceMode, inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, observability, }?: {
    memoryKey?: any;
    persistenceMode?: string | undefined;
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    memory: Readonly<{
        checkpoint: (checkpointId: any) => Readonly<{
            checkpointId: string;
            stateVersion: any;
            snapshot: Readonly<{
                current: any;
                history: any;
            }>;
        }>;
        snapshot: () => Readonly<{
            current: any;
            history: any;
        }>;
        validateReplay: ({ targetEventId, checkpoint }?: {}) => any;
    }>;
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _config: any;
    }>;
}>;
export function snapshotLeafMemoryState(state: any): Readonly<{
    current: any;
    history: any;
}>;
export function validateLeafMemoryReplay({ state, targetEventId, checkpoint }?: {}): any;

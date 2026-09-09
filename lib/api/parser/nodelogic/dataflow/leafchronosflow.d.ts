export const CHRONOS_POLICY_NODE_TYPES: Set<string>;
export class ChronosRuntimePolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export namespace _leafchronosflow {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => any>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
}
export function assertChronosTimerEvent(event: any): any;
export function driveLeafChronosByRuntimePolicy({ nodeType, inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, transformation, observability, }?: {
    nodeType?: string | undefined;
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    transformation?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _config: any;
    }>;
}>;
export function resolveChronosRuntimePolicy({ nodeType, mode }?: {
    nodeType?: string | undefined;
    mode?: string | undefined;
}): Readonly<{
    mode: string;
    trigger: "timer";
    join: Readonly<{
        mode: any;
        allowSamplingLatestData: boolean;
    }>;
    timer: any;
    checkpoint: any;
    ordering: any;
    aliasOf: any;
}>;

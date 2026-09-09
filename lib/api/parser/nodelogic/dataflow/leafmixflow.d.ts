export const MIXFLOW_MODE_ALIASES: Readonly<{
    combineLatest: "combineLatest";
    latest: "combineLatest";
    combine: "combine";
    concat: "concat";
    merge: "merge";
    substitute: "substitute";
    default: "default";
}>;
export class MixflowRuntimePolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export namespace _leafmixflow {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => any>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
}
export function driveLeafMixflowByRuntimePolicy({ mode, inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, transformation, observability, }?: {
    mode?: string | undefined;
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
export function resolveLeafMixflowJoinPolicy({ mode }?: {
    mode?: string | undefined;
}): Readonly<{
    mode: "policy";
    mixMode: any;
    trigger: any;
    join: any;
    ordering: any;
}>;

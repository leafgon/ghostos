export class GraphBoundaryDeckPolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function collectParentEventIds(events?: any[], explicitParentEventIds?: any[]): any[];
export function createDeckInitializationDataEvent({ payload, eventId, sourceNodeId, graphInstanceId, sequence, parentEvent, parentEventIds, trace, observability, }?: {
    sourceNodeId?: string | undefined;
    parentEventIds?: never[] | undefined;
    trace?: {} | undefined;
    observability?: {} | undefined;
}): any;
export function createGraphBoundaryInflowDataEvent({ payload, eventId, sourceNodeId, graphInstanceId, sequence, parentEvent, parentEventIds, trigger, trace, observability, }?: {
    sourceNodeId?: string | undefined;
    parentEventIds?: never[] | undefined;
    trigger?: string | undefined;
    trace?: {} | undefined;
    observability?: {} | undefined;
}): any;
export function driveDeckNodeByRuntimePolicy({ role, inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, transformation, observability, }?: {
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    transformation?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: any;
        _config: {};
    }>;
}>;
export function driveGraphOutflowByRuntimePolicy({ inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, transformation, observability, compatibilityMode, }?: {
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    transformation?: {} | undefined;
    observability?: {} | undefined;
    compatibilityMode?: string | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: any;
        _config: {};
    }>;
}>;
export function resolveDeckRuntimePolicy({ role }?: {}): any;

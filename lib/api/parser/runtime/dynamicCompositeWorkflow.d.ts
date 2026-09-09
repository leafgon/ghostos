export class DynamicCompositePolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function assertLeafLispDynamicPolicy({ helpers, declarations }?: {
    helpers?: never[] | undefined;
    declarations?: {} | undefined;
}): Readonly<{
    runtimeTargetKey: "node:leaflisp";
    runtimeClass: "pure_transform";
    trigger: "data";
    pureByDefault: true;
    helpers: readonly (Readonly<{
        name: any;
        sideEffecting: false;
    }> | Readonly<{
        name: any;
        sideEffecting: true;
        idempotencyKey: string;
    }>)[];
}>;
export function assertSideEffectMetadata({ classification, sideEffectMetadata }?: {}): Readonly<{
    required: false;
}> | Readonly<{
    required: true;
    idempotencyKey: string;
    retry: any;
    replay: any;
}>;
export function classifyLambdaGraphTrigger(event: any): Readonly<{
    decision: "execute";
    reason: "data_recompute";
    recompute: true;
    lifecycleControl: false;
    configUpdate: false;
}> | Readonly<{
    decision: "skip";
    reason: `lifecycle_control:${any}`;
    recompute: false;
    lifecycleControl: true;
    configUpdate: false;
}> | Readonly<{
    decision: "skip";
    reason: "config_future_execution_only";
    recompute: false;
    lifecycleControl: false;
    configUpdate: true;
}> | Readonly<{
    decision: "skip";
    reason: "unsupported_control_for_recompute";
    recompute: false;
    lifecycleControl: false;
    configUpdate: false;
}>;
export function createLoopReplayAttemptEvent({ inputEvent, attemptIndex, policy, eventId, sourceNodeId, observability, }?: {
    sourceNodeId?: string | undefined;
    observability?: {} | undefined;
}): any;
export function createNestedGraphExecutionEvent({ inputEvent, payload, eventId, sourceNodeId, graphInstanceId, nestedGraphId, runtimeTargetKey, nestedRuntimeTargetKey, trace, observability, }?: {
    payload?: any;
    sourceNodeId?: string | undefined;
    graphInstanceId?: any;
    runtimeTargetKey?: string | undefined;
    trace?: {} | undefined;
    observability?: {} | undefined;
}): any;
export function driveLambdaGraphByRuntimePolicy({ inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, transformation, observability, }?: {
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
export function executeLeafLispPureDataTransform({ inputEvent, expression, evaluator, eventId, sourceNodeId, helpers, declarations, observability, }?: {
    sourceNodeId?: string | undefined;
    helpers?: never[] | undefined;
    declarations?: {} | undefined;
    observability?: {} | undefined;
}): any;
export function resolveSpellInvocationClassification({ spellName, declaredClassification, inheritedClassification, sideEffectMetadata, }?: {}): Readonly<{
    spellName: any;
    runtimeTargetKey: any;
    runtimeClass: any;
    trigger: any;
    sideEffect: Readonly<{
        required: false;
    }> | Readonly<{
        required: true;
        idempotencyKey: string;
        retry: any;
        replay: any;
    }>;
    inherited: boolean;
}>;
export function validateLoopReplayPolicy({ maxIterations, replayMode, audit, }?: {
    maxIterations?: number | undefined;
    replayMode?: string | undefined;
    audit?: boolean | undefined;
}): Readonly<{
    maxIterations: number;
    replayMode: string;
    audit: boolean;
    bounded: true;
}>;

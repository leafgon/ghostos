export const POLICY_EXECUTION_DECISIONS: Readonly<{
    EXECUTE: "execute";
    SKIP: "skip";
}>;
export const POLICY_EXECUTION_MODES: Readonly<{
    LEGACY: "legacy";
    POLICY: "policy";
}>;
export class PolicyExecutionError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function driveNodeByRuntimePolicy({ inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, policy, transformation, observability, }?: {
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    policy?: {} | undefined;
    transformation?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _config: any;
    }>;
}>;
export function driveNodeWithRuntimeOptions({ runtimeTargetKey, runtimeOptions, runtimeConfig, graphMetadata, nodeMetadata, packageDefaults, buildDefaults, globalOverrides, allowGlobalDebugOverrides, targetPolicy, legacyPolicy, context, observability, ...driverOptions }?: {
    context?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _config: any;
    }>;
}>;
export function normalizePolicy(policy?: {}): Readonly<{
    mode: any;
    trigger: any;
    join: Readonly<{
        mode: any;
        primaryInputIndex: any;
        requiredInputIndexes: any;
        windowSize: any;
        allowSamplingLatestData: boolean;
    }>;
    allowedControlIntents: any;
}>;
export function resolveRuntimeExecutionPolicy({ runtimeTargetKey, runtimeOptions, runtimeConfig, graphMetadata, nodeMetadata, packageDefaults, buildDefaults, globalOverrides, allowGlobalDebugOverrides, targetPolicy, legacyPolicy, }?: {
    targetPolicy?: {
        trigger: string;
    } | undefined;
    legacyPolicy?: {} | undefined;
}): Readonly<{
    runtimeTargetKey: string;
    mode: "policy" | "legacy";
    optedIn: any;
    policy: Readonly<{
        mode: any;
        trigger: any;
        join: Readonly<{
            mode: any;
            primaryInputIndex: any;
            requiredInputIndexes: any;
            windowSize: any;
            allowSamplingLatestData: boolean;
        }>;
        allowedControlIntents: any;
    }>;
    runtimeOptions: any;
    dualTraceExecution: boolean;
}>;
export function selectJoinedInputs({ event, policy, laneIndex, latestData, windows }: {
    event: any;
    policy: any;
    laneIndex: any;
    latestData: any;
    windows: any;
}): any;
export function shouldExecuteByRuntimePolicy({ event, policy, laneIndex, latestData }?: {
    laneIndex?: number | undefined;
    latestData?: never[] | undefined;
}): Readonly<{
    decision: "execute" | "skip";
    reason: string;
    legacyWouldExecute: true;
}>;

export const DEFAULT_FEATURE_FLAGS: Readonly<{
    defaultTriggerMode: "policy";
    enableTriggerPolicy: true;
    dataTriggeredTargets: readonly never[];
    idempotentSideEffects: false;
    dualTraceExecution: false;
}>;
export const DEFAULT_RUNTIME_OPTIONS: Readonly<{
    featureFlags: Readonly<{
        defaultTriggerMode: "policy";
        enableTriggerPolicy: true;
        dataTriggeredTargets: readonly never[];
        idempotentSideEffects: false;
        dualTraceExecution: false;
    }>;
}>;
export class GhostRuntimeOptionsError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function createCallbackRuntimeSinks({ onTrace, onMetric, onLog }?: {}): {
    traceSink: {
        emit: (event: any) => void;
    };
    metricSink: {
        record: (name: any, labels?: {}, value?: number) => void;
    };
    logSink: {
        debug: (event: any) => void;
        info: (event: any) => void;
        warn: (event: any) => void;
        error: (event: any) => void;
    };
};
export function createInMemoryRuntimeSinks(): {
    traceSink: {
        emit: (event: any) => void;
    };
    metricSink: {
        record: (name: any, labels?: {}, value?: number) => void;
    };
    logSink: {
        debug: (event: any) => number;
        info: (event: any) => number;
        warn: (event: any) => number;
        error: (event: any) => number;
    };
    snapshot: () => {
        traces: any[];
        metrics: any[];
        logs: any[];
    };
    clear: () => void;
};
export function createNoopLogSink(): {
    debug: () => void;
    info: () => void;
    warn: () => void;
    error: () => void;
};
export function createNoopMetricSink(): {
    record: () => void;
};
export function createNoopTraceSink(): {
    emit: () => void;
};
export function createSafeLocalLogSink({ component, enabled, sink }?: {
    component?: string | undefined;
}): {
    debug: (event: any) => void;
    info: (event: any) => void;
    warn: (event: any) => void;
    error: (event: any) => void;
};
export function extractRuntimeOptionsFromConfig(config?: {}): any;
export function getRuntimeTargetKey({ type, args }?: {
    args?: {} | undefined;
}): string;
export function resolveGhostRuntimeOptions({ runtimeConfig, graphMetadata, nodeMetadata, packageDefaults, buildDefaults, globalOverrides, allowGlobalDebugOverrides, }?: {
    allowGlobalDebugOverrides?: boolean | undefined;
}): {
    featureFlags: any;
    observability: {
        traceSink: {
            emit: (event: any) => void;
        };
        metricSink: {
            record: (name: any, labels?: {}, value?: number) => void;
        };
        logSink: {
            debug: (event: any) => void;
            info: (event: any) => void;
            warn: (event: any) => void;
            error: (event: any) => void;
        };
    };
};
export function validateRuntimeTargetKey(targetKey: any): string;
export function wrapLogSink(sink?: {
    debug: () => void;
    info: () => void;
    warn: () => void;
    error: () => void;
}): {
    debug: (event: any) => void;
    info: (event: any) => void;
    warn: (event: any) => void;
    error: (event: any) => void;
};
export function wrapMetricSink(sink?: {
    record: () => void;
}): {
    record: (name: any, labels?: {}, value?: number) => void;
};
export function wrapTraceSink(sink?: {
    emit: () => void;
}): {
    emit: (event: any) => void;
};

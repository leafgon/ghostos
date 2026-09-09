export class SideEffectMigrationHarnessError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function createDeterministicIdFactory(): (prefix?: string) => string;
/**
 * Adapts a side-effecting node into the migration test shape without migrating
 * the concrete adapter itself. Future adapter tests should pass:
 * - executeSideEffect: the fake or wrapped side-effect call under assertion.
 * - resolveCommand: maps legacy leaflogic input/control/runtime values to a command object.
 * - resolveIdempotency: maps that command to wrapper idempotency metadata.
 */
export function createSideEffectAdapterMigrationHarness({ adapterName, runtimeTargetKey, nodeId, graphInstanceId, tenantId, integrationInstanceId, producerId, policy, retry, dataInputCount, executeSideEffect, resolveCommand, resolveIdempotency, idempotencyStore, runtimeSinks, idFactory, eventIdFactory, runner, }?: {
    adapterName?: string | undefined;
    runtimeTargetKey?: string | undefined;
    nodeId?: string | undefined;
    graphInstanceId?: string | undefined;
    tenantId?: string | undefined;
    integrationInstanceId?: string | undefined;
    producerId?: string | undefined;
    policy?: Readonly<{
        mode: "policy";
        trigger: "data";
    }> | undefined;
    retry?: Readonly<{
        enabled: true;
        maxAttempts: 2;
        retryableErrors: readonly string[];
    }> | undefined;
    dataInputCount?: number | undefined;
    resolveCommand?: (({ inputValues }: {
        inputValues: any;
    }) => any) | undefined;
    resolveIdempotency?: (({ command, defaults }: {
        command: any;
        defaults: any;
    }) => {
        required: any;
        key: any;
        scope: any;
        domainCommandId: any;
        tenantId: any;
        integrationInstanceId: any;
        producerId: any;
        allowGraphLocalFallback: any;
    }) | undefined;
    runtimeSinks?: {
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
    } | undefined;
    idFactory?: ((prefix?: string) => string) | undefined;
    eventIdFactory?: ((prefix?: string) => string) | undefined;
    runner?: Readonly<{
        run: (options?: {}) => Promise<Readonly<{
            outcome: "suppressed";
            decision: any;
            idempotencyKey: any;
            eventId: any;
            originalEventId: any;
            attempts: readonly never[];
            entry: any;
        }> | Readonly<{
            outcome: "succeeded";
            value: any;
            entry: any;
            attempts: readonly Readonly<{
                attemptId: `${string}-${string}-${string}-${string}-${string}`;
                attemptCount: number;
                eventId: any;
                originalEventId: any;
                idempotencyKey: string;
            }>[];
            idempotencyKey: string;
            eventId: any;
            originalEventId: any;
        }> | Readonly<{
            outcome: "failed";
            error: any;
            entry: any;
            attempts: readonly Readonly<{
                attemptId: `${string}-${string}-${string}-${string}-${string}`;
                attemptCount: number;
                eventId: any;
                originalEventId: any;
                idempotencyKey: string;
            }>[];
            idempotencyKey: string;
            eventId: any;
            originalEventId: any;
        }>>;
    }> | undefined;
}): Readonly<{
    adapterName: string;
    runtimeTargetKey: string;
    nodeId: string;
    graphInstanceId: string;
    store: any;
    runtimeSinks: {
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
    dataInputs: {
        _stream: Subject<any>;
    }[];
    control: {
        _stream: Subject<any>;
        _config: {};
    };
    metaCtrl$: Subject<any>;
    driver: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _control: Readonly<{
            _stream: import("rxjs").Observable<any>;
            _config: any;
        }>;
    }>;
    createCommand: (overrides?: {}) => {
        domainCommandId: string;
        tenantId: string;
        integrationInstanceId: string;
        producerId: string;
        payload: {};
    };
    sendDataCommand: (command?: {
        domainCommandId: string;
        tenantId: string;
        integrationInstanceId: string;
        producerId: string;
        payload: {};
    }, { laneIndex, ...eventOptions }?: {
        laneIndex?: number | undefined;
    }) => Promise<{
        decisions: any[];
        executions: any[];
        outputs: any[];
        snapshot: any;
    }>;
    sendControlTick: ({ intent, legacyControlPayload, ...eventOptions }?: {
        intent?: string | undefined;
    }) => Promise<{
        decisions: any[];
        executions: any[];
        outputs: any[];
        snapshot: any;
    }>;
    sendConfigRefresh: ({ metaControl, configVersion, ...eventOptions }?: {
        metaControl?: boolean | undefined;
        configVersion?: string | undefined;
    }) => Promise<{
        decisions: any[];
        executions: any[];
        outputs: any[];
        snapshot: any;
    }>;
    sendRetry: ({ targetAttemptId, ...eventOptions }?: {
        targetAttemptId?: string | undefined;
    }) => Promise<{
        decisions: any[];
        executions: any[];
        outputs: any[];
        snapshot: any;
    }>;
    sendReplay: ({ targetEventId, ...eventOptions }?: {
        targetEventId?: string | undefined;
    }) => Promise<{
        decisions: any[];
        executions: any[];
        outputs: any[];
        snapshot: any;
    }>;
    flush: () => Promise<any[]>;
    snapshot: () => any;
}>;
import { Subject } from "rxjs";

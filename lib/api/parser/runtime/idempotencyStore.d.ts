export const DEFAULT_ATTEMPT_TIMEOUT_MS: number;
export const DEFAULT_FAILED_TTL_MS: number;
export const DEFAULT_MAX_TERMINAL_ENTRIES: 1024;
export const DEFAULT_SUCCEEDED_TTL_MS: number;
export const DEFAULT_SUPPRESSED_TTL_MS: number;
export const IDEMPOTENCY_RESERVE_DECISIONS: Readonly<{
    RESERVED: "reserved";
    RETRY_RESERVED: "retry_reserved";
    DUPLICATE_IN_FLIGHT: "duplicate_in_flight";
    DUPLICATE_SUCCEEDED: "duplicate_succeeded";
    DUPLICATE_SUPPRESSED: "duplicate_suppressed";
    FAILED_RETRY_BLOCKED: "failed_retry_blocked";
}>;
export const IDEMPOTENCY_STATUSES: Readonly<{
    IN_FLIGHT: "in_flight";
    SUCCEEDED: "succeeded";
    FAILED: "failed";
    SUPPRESSED: "suppressed";
}>;
export const IDEMPOTENCY_STORE_CAPABILITIES: Readonly<{
    MEMORY: "memory";
    DURABLE: "durable";
    SERVER_AUTHORITATIVE: "server-authoritative";
}>;
export class IdempotencyStoreError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export const RETENTION_POLICY_MODES: Readonly<{
    DECLARED: "declared";
    PROVIDER: "provider";
}>;
export function assertProductionIdempotencyStore(store: any, options?: {}): Readonly<{
    class: any;
    atomicReserve: string;
    retention: Readonly<{
        mode: any;
        delegatedTo: string;
    }> | Readonly<{
        mode: any;
        succeededTtlMs: any;
        failedTtlMs: any;
        suppressedTtlMs: any;
        maxEntries: any;
    }>;
    survivesRestart: boolean;
    sharedAcrossWorkers: boolean;
    authoritativeForExternalSideEffects: boolean;
    staleInFlightRecovery: string;
    maxEntries: any;
}>;
export function createFakeDurableBackingStore(): Readonly<{
    records: Map<any, any>;
}>;
export function createFakeDurableIdempotencyStore({ backingStore, clock, maxEntries, succeededTtlMs, failedTtlMs, suppressedTtlMs, traceSink, logSink, }?: {
    backingStore?: Readonly<{
        records: Map<any, any>;
    }> | undefined;
    clock?: (() => number) | undefined;
    maxEntries?: number | undefined;
    succeededTtlMs?: number | undefined;
    failedTtlMs?: number | undefined;
    suppressedTtlMs?: number | undefined;
}): Readonly<{
    capabilities: Readonly<{
        class: any;
        atomicReserve: string;
        retention: Readonly<{
            mode: any;
            delegatedTo: string;
        }> | Readonly<{
            mode: any;
            succeededTtlMs: any;
            failedTtlMs: any;
            suppressedTtlMs: any;
            maxEntries: any;
        }>;
        survivesRestart: boolean;
        sharedAcrossWorkers: boolean;
        authoritativeForExternalSideEffects: boolean;
        staleInFlightRecovery: string;
        maxEntries: any;
    }>;
    reserve: (rawKey: any, rawAttempt?: {}) => Readonly<{
        decision: any;
        shouldExecute: any;
        created: boolean;
        entry: any;
    }>;
    markSucceeded: (key: any, result?: {}, options?: {}) => any;
    markFailed: (key: any, error?: {}, options?: {}) => any;
    markSuppressed: (key: any, reason?: string, options?: {}) => any;
    recoverStaleInFlight: (key: any, options?: {}) => any;
    get: (rawKey: any) => any;
    sweep: (sweepNow?: number) => Readonly<{
        evicted: any[];
        evictedCount: number;
        size: number;
    }>;
    size: () => number;
}>;
export function createFakeServerAuthoritativeIdempotencyStore({ backingStore, clock, traceSink, logSink, }?: {
    backingStore?: Readonly<{
        records: Map<any, any>;
    }> | undefined;
    clock?: (() => number) | undefined;
}): Readonly<{
    capabilities: Readonly<{
        class: any;
        atomicReserve: string;
        retention: Readonly<{
            mode: any;
            delegatedTo: string;
        }> | Readonly<{
            mode: any;
            succeededTtlMs: any;
            failedTtlMs: any;
            suppressedTtlMs: any;
            maxEntries: any;
        }>;
        survivesRestart: boolean;
        sharedAcrossWorkers: boolean;
        authoritativeForExternalSideEffects: boolean;
        staleInFlightRecovery: string;
        maxEntries: any;
    }>;
    reserve: (rawKey: any, rawAttempt?: {}) => Readonly<{
        decision: any;
        shouldExecute: any;
        created: boolean;
        entry: any;
    }>;
    markSucceeded: (key: any, result?: {}, options?: {}) => any;
    markFailed: (key: any, error?: {}, options?: {}) => any;
    markSuppressed: (key: any, reason?: string, options?: {}) => any;
    recoverStaleInFlight: (key: any, options?: {}) => any;
    get: (rawKey: any) => any;
    sweep: (sweepNow?: number) => Readonly<{
        evicted: any[];
        evictedCount: number;
        size: number;
    }>;
    size: () => number;
}>;
export function createIdempotencyStoreCapabilities({ class: capabilityClass, atomicReserve, retention, survivesRestart, sharedAcrossWorkers, authoritativeForExternalSideEffects, staleInFlightRecovery, maxEntries, }: {
    class: any;
    atomicReserve: any;
    retention: any;
    survivesRestart: any;
    sharedAcrossWorkers: any;
    authoritativeForExternalSideEffects: any;
    staleInFlightRecovery: any;
    maxEntries: any;
}): Readonly<{
    class: any;
    atomicReserve: string;
    retention: Readonly<{
        mode: any;
        delegatedTo: string;
    }> | Readonly<{
        mode: any;
        succeededTtlMs: any;
        failedTtlMs: any;
        suppressedTtlMs: any;
        maxEntries: any;
    }>;
    survivesRestart: boolean;
    sharedAcrossWorkers: boolean;
    authoritativeForExternalSideEffects: boolean;
    staleInFlightRecovery: string;
    maxEntries: any;
}>;
export function createMemoryIdempotencyStore({ clock, maxEntries, succeededTtlMs, failedTtlMs, suppressedTtlMs, traceSink, logSink, backingRecords, capabilityOverrides, }?: {
    clock?: (() => number) | undefined;
    maxEntries?: number | undefined;
    succeededTtlMs?: number | undefined;
    failedTtlMs?: number | undefined;
    suppressedTtlMs?: number | undefined;
    capabilityOverrides?: {} | undefined;
}): Readonly<{
    capabilities: Readonly<{
        class: any;
        atomicReserve: string;
        retention: Readonly<{
            mode: any;
            delegatedTo: string;
        }> | Readonly<{
            mode: any;
            succeededTtlMs: any;
            failedTtlMs: any;
            suppressedTtlMs: any;
            maxEntries: any;
        }>;
        survivesRestart: boolean;
        sharedAcrossWorkers: boolean;
        authoritativeForExternalSideEffects: boolean;
        staleInFlightRecovery: string;
        maxEntries: any;
    }>;
    reserve: (rawKey: any, rawAttempt?: {}) => Readonly<{
        decision: any;
        shouldExecute: any;
        created: boolean;
        entry: any;
    }>;
    markSucceeded: (key: any, result?: {}, options?: {}) => any;
    markFailed: (key: any, error?: {}, options?: {}) => any;
    markSuppressed: (key: any, reason?: string, options?: {}) => any;
    recoverStaleInFlight: (key: any, options?: {}) => any;
    get: (rawKey: any) => any;
    sweep: (sweepNow?: number) => Readonly<{
        evicted: any[];
        evictedCount: number;
        size: number;
    }>;
    size: () => number;
}>;
export function createScopedIdempotencyKey({ scope, domainKey }?: {}): string;
export function validateIdempotencyStoreCapability(store: any, { environment, externallyVisibleSideEffect, production }?: {
    environment?: string | undefined;
    externallyVisibleSideEffect?: boolean | undefined;
    production?: boolean | undefined;
}): Readonly<{
    class: any;
    atomicReserve: string;
    retention: Readonly<{
        mode: any;
        delegatedTo: string;
    }> | Readonly<{
        mode: any;
        succeededTtlMs: any;
        failedTtlMs: any;
        suppressedTtlMs: any;
        maxEntries: any;
    }>;
    survivesRestart: boolean;
    sharedAcrossWorkers: boolean;
    authoritativeForExternalSideEffects: boolean;
    staleInFlightRecovery: string;
    maxEntries: any;
}>;
export function validateIdempotencyAttempt(attempt?: {}): Readonly<{
    attemptId: string;
    scope: string;
    retry: Readonly<{
        enabled: boolean;
        maxAttempts: any;
        retryAfterMs: any;
    }>;
    attemptTimeoutMs: any;
    metadata: any;
}>;
export function validateIdempotencyKey(key: any): string;
export function validateIdempotencyScope(scope: any): string;
export function validateIdempotencyStatus(status: any): any;
export function validateRetentionPolicy(retention?: {}): Readonly<{
    mode: any;
    delegatedTo: string;
}> | Readonly<{
    mode: any;
    succeededTtlMs: any;
    failedTtlMs: any;
    suppressedTtlMs: any;
    maxEntries: any;
}>;
export function validateRetryPolicy(retry?: {}): Readonly<{
    enabled: boolean;
    maxAttempts: any;
    retryAfterMs: any;
}>;
export function validateTtlMs(ttlMs: any, field?: string): any;

export const SIDE_EFFECT_OUTCOMES: Readonly<{
    SUCCEEDED: "succeeded";
    SUPPRESSED: "suppressed";
    FAILED: "failed";
}>;
export class SideEffectExecutionError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function createIdempotentSideEffectRunner({ idFactory }?: {
    idFactory?: ((prefix?: string) => `${string}-${string}-${string}-${string}-${string}`) | undefined;
}): Readonly<{
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
}>;
export function executeIdempotentSideEffect({ execute, idempotencyStore, idempotency, retry, runtimeContext, observability, production, environment, externallyVisibleSideEffect, idFactory, }?: {
    retry?: {} | undefined;
    runtimeContext?: {} | undefined;
    observability?: {} | undefined;
    production?: boolean | undefined;
    environment?: string | undefined;
    externallyVisibleSideEffect?: boolean | undefined;
    idFactory?: ((prefix?: string) => `${string}-${string}-${string}-${string}-${string}`) | undefined;
}): Promise<Readonly<{
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
export function resolveSideEffectIdempotency({ idempotency, runtimeContext }?: {
    runtimeContext?: {} | undefined;
}): Readonly<{
    key: string;
    scope: string;
    domainCommandId: any;
    source: "explicit-key";
}> | Readonly<{
    key: string;
    scope: any;
    domainCommandId: any;
    source: "domain-command";
}> | Readonly<{
    key: string;
    scope: any;
    domainCommandId: any;
    source: "graph-local-fallback";
}>;
export function validateSideEffectIdempotencyMetadata(idempotency?: {}): object;

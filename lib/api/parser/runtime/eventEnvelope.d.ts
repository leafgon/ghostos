export const DEFAULT_GRAPH_INSTANCE_ID: "ghostos-runtime";
export const RUNTIME_ENVELOPE_MARKER: "__ghostosRuntimeEnvelope";
export class RuntimeEnvelopeError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function createControlEnvelope({ intent, legacyControlPayload, targetNodeId, eventId, sourceNodeId, graphInstanceId, sequence, createdAt, parentEventIds, trigger, trace, ...rest }?: {
    intent?: string | undefined;
}): any;
export function createDataEnvelope(payload: any, options?: {}): any;
export function createEnvelopeTraceEvent(envelope: any, fields?: {}, { includePayload }?: {
    includePayload?: boolean | undefined;
}): any;
export function createLegacyCompatibilityBridge({ datalogic }?: {
    datalogic?: {} | undefined;
}): {
    datalogic: {
        pre: (value: any) => any;
        post: (value: any) => any;
    };
    unwrapData: (value: any) => any;
    unwrapControl: (value: any) => any;
};
export function createReplayEnvelope(options?: {}): any;
export function createRetryEnvelope(options?: {}): any;
export function createRuntimeContext(envelope: any, extra?: {}): any;
export function createRuntimeEnvelopeFactory({ graphInstanceId, idFactory, clock, }?: {
    graphInstanceId?: string | undefined;
    idFactory?: ((prefix?: string) => `${string}-${string}-${string}-${string}-${string}`) | undefined;
    clock?: (() => string) | undefined;
}): {
    data: (payload: any, options?: {}) => any;
    control: (options?: {}) => any;
    timer: (options?: {}) => any;
    retry: (options?: {}) => any;
    replay: (options?: {}) => any;
};
export function createTimerEnvelope({ timerId, eventId, sourceNodeId, graphInstanceId, sequence, createdAt, parentEventIds, trace, scheduledAt, firedAt, }?: {
    firedAt?: any;
}): any;
export function isRuntimeEnvelope(value: any): boolean;
export function resolvePayloadKind(payload: any): "empty_sentinel" | "bottle" | "raw";
export function unwrapControlForLegacy(value: any): any;
export function unwrapDataForLegacy(value: any): any;
export function unwrapRuntimeEnvelope(value: any): any;

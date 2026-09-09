export const CONTROL_RESOLUTION_MODES: Readonly<{
    COMPATIBILITY: "compatibility";
    STRICT: "strict";
}>;
export class ControlIntentResolverError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function resolveControlIntent(input: any, { mode, eventId, sourceNodeId, targetNodeId, graphInstanceId, sequence, createdAt, parentEventIds, idFactory, }?: {
    mode?: "compatibility" | undefined;
    sourceNodeId?: string | undefined;
    idFactory?: ((prefix?: string) => string) | undefined;
}): any;

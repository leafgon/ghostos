export const CONFIG_BEHAVIORS: Readonly<{
    FUTURE_ONLY: "future-only";
    RECOMPUTE_PURE: "recompute-pure";
    REOPEN_SOURCE: "reopen-source";
    RECONFIGURE_SIDE_EFFECT: "reconfigure-side-effect";
}>;
export class ConfigSemanticsError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function assertConfigBehaviorAllowed({ behavior, classification, retainedInput, replayPolicy, }?: {
    behavior?: "future-only" | undefined;
    classification?: {} | undefined;
    retainedInput?: boolean | undefined;
}): Readonly<{
    behavior: "future-only";
    replayAllowed: true;
}> | Readonly<{
    behavior: "future-only";
    replayAllowed: false;
}>;
export function canonicalizeConfig(value: any, options?: {}, seen?: WeakSet<object>): any;
export function configContainsSecrets(value: any, seen?: WeakSet<object>): any;
export function createSourceReopenPlan({ previousSourceEventIds, newSourceEventIds, configUpdate, }?: {
    previousSourceEventIds?: never[] | undefined;
    newSourceEventIds?: never[] | undefined;
}): Readonly<{
    reopen: false;
    emitSourceEventIds: never[];
    suppressedDuplicateSourceEventIds: never[];
}> | Readonly<{
    reopen: true;
    emitSourceEventIds: any[];
    suppressedDuplicateSourceEventIds: any[];
}>;
export function fingerprintConfig({ config, configVersion, configFingerprintKey, classification, }?: {}): Readonly<{
    configVersion: any;
    configFingerprint: string;
    configFingerprintPrefix: string;
    secretBearing: any;
}>;
export function resolveConfigUpdate({ previousConfigState, config, configVersion, configFingerprintKey, graphInstanceId, nodeId, runtimeTargetKey, classification, behavior, retainedInput, replayPolicy, eventId, observability, }?: {
    graphInstanceId?: string | undefined;
    behavior?: "future-only" | undefined;
    retainedInput?: boolean | undefined;
    observability?: {} | undefined;
}): Readonly<{
    graphInstanceId: string;
    nodeId: any;
    runtimeTargetKey: any;
    configChanged: boolean;
    behavior: "future-only";
    replayAllowed: boolean;
    replayedPriorData: false;
    controlEnvelope: any;
    configVersion: any;
    configFingerprint: string;
    configFingerprintPrefix: string;
    secretBearing: any;
}>;

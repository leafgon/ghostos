export const DEVICE_ADAPTER_POLICIES: Readonly<{
    mediainput: Readonly<{
        runtimeTargetKey: "leafelement:mediainput";
        lifecycleIntents: readonly string[];
        lifecycleCapabilities: Readonly<{
            start: "start";
            stop: "stop";
            pause: "pause";
            resume: "resume";
        }>;
        sourceIdentity: "browser-best-effort";
    }>;
    midi: Readonly<{
        runtimeTargetKey: "leafelement:midi";
        lifecycleIntents: readonly string[];
        lifecycleCapabilities: Readonly<{
            start: "open";
            stop: "close";
            pause: "pause";
            resume: "resume";
        }>;
        sourceIdentity: "device-message-id-or-sequence";
        commandCapability: "sendMidi";
        commandIdentityRequired: true;
    }>;
    sound: Readonly<{
        runtimeTargetKey: "leafelement:sound";
        lifecycleIntents: readonly string[];
        lifecycleCapabilities: Readonly<{
            start: "start";
            stop: "stop";
            pause: "pause";
            resume: "resume";
        }>;
        commandCapability: "executeSoundCommand";
        commandIdentityRequired: true;
    }>;
}>;
export class DeviceAdapterPolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function applyDeviceLifecycleControl({ adapterName, host, control, traceSink }?: {}): Readonly<{
    adapterName: any;
    intent: any;
    status: "applied";
    result: any;
}>;
export function assertDeviceCommandIdentity({ adapterName, command }: {
    adapterName: any;
    command?: {} | undefined;
}): any;
export function createBrowserLocalCommandGuard(): Readonly<{
    reserve: (commandId: any) => boolean;
    snapshot: () => Readonly<{
        commandIds: readonly any[];
    }>;
}>;
export function driveDeviceCommandByRuntimePolicy({ adapterName, host, commandGuard, inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, observability, }?: {
    commandGuard?: Readonly<{
        reserve: (commandId: any) => boolean;
        snapshot: () => Readonly<{
            commandIds: readonly any[];
        }>;
    }> | undefined;
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _config: any;
    }>;
}>;
export function executeDeviceCommand({ adapterName, command, host, commandGuard, traceSink, eventContext, }?: {
    command?: {} | undefined;
    commandGuard?: Readonly<{
        reserve: (commandId: any) => boolean;
        snapshot: () => Readonly<{
            commandIds: readonly any[];
        }>;
    }> | undefined;
    eventContext?: {} | undefined;
}): Readonly<{
    adapterName: any;
    commandId: any;
    status: "duplicate_suppressed";
}> | Readonly<{
    adapterName: any;
    commandId: any;
    status: "executed";
    result: any;
}>;
export function normalizeDeviceSourceRecord({ adapterName, record, graphInstanceId, sourceNodeId, sequence, parentEventIds, }?: {
    record?: {} | undefined;
    graphInstanceId?: string | undefined;
    sourceNodeId?: string | undefined;
    sequence?: number | undefined;
    parentEventIds?: never[] | undefined;
}): any;
export function resolveDeviceAdapterPolicy(adapterName: any): any;

export const UI_BRIDGE_POLICIES: Readonly<{
    leafscreenio: Readonly<{
        role: "screen";
        renderTrigger: "data";
        sourceEvents: true;
        typedControl: readonly string[];
        commandIdentityRequired: false;
    }>;
    gnav: Readonly<{
        role: "navigation";
        renderTrigger: "data";
        sourceEvents: true;
        typedControl: readonly string[];
        commandIdentityRequired: true;
    }>;
    popup: Readonly<{
        role: "popup";
        renderTrigger: "data";
        sourceEvents: true;
        typedControl: readonly string[];
        commandIdentityRequired: true;
    }>;
    editor: Readonly<{
        role: "editor";
        renderTrigger: "data";
        sourceEvents: true;
        typedControl: readonly string[];
        commandIdentityRequired: false;
    }>;
    prompt: Readonly<{
        role: "prompt";
        renderTrigger: "data";
        sourceEvents: true;
        typedControl: readonly string[];
        commandIdentityRequired: false;
    }>;
    mediaplayer: Readonly<{
        role: "media";
        renderTrigger: "data";
        sourceEvents: false;
        typedControl: readonly string[];
        commandIdentityRequired: true;
    }>;
    form: Readonly<{
        role: "form";
        renderTrigger: "data";
        sourceEvents: true;
        typedControl: readonly string[];
        commandIdentityRequired: false;
    }>;
}>;
export const UI_CONTROL_INTENTS: readonly string[];
export class UiBridgePolicyError extends Error {
    constructor(message: any, details?: {});
    code: string;
    details: {};
}
export function assertRepeatableCommandIdentity({ adapterName, command }?: {
    command?: {} | undefined;
}): Readonly<{
    required: false;
}> | Readonly<{
    required: true;
    commandId: string;
}>;
export function createUiBridgeRuntime({ adapterName, nodeId, runtimeTargetKey, host, observability, }?: {
    adapterName?: string | undefined;
    nodeId?: any;
    runtimeTargetKey?: string | undefined;
    host?: Readonly<{
        render: () => undefined;
        control: () => undefined;
    }> | undefined;
    observability?: {} | undefined;
}): Readonly<{
    adapterName: string;
    policy: any;
    renderDataEvent: (event: any) => any;
    handleControlEvent: (event: any) => Readonly<{
        handled: false;
        reason: "config_future_behavior_only" | "unsupported_control_intent";
    }> | Readonly<{
        handled: true;
        intent: any;
        result: undefined;
    }>;
    emitSourceEvent: ({ action, payload, eventId, sourceNodeId, graphInstanceId, sequence, parentEvent, parentEventIds, trace, }?: {
        sourceNodeId?: string | undefined;
        parentEventIds?: never[] | undefined;
        trace?: {} | undefined;
    }) => any;
    snapshot: () => any;
}>;
export function createUiControlEnvelope({ intent, eventId, sourceNodeId, targetNodeId, graphInstanceId, sequence, parentEventIds, command, trace, }?: {
    sourceNodeId?: string | undefined;
    parentEventIds?: never[] | undefined;
    command?: {} | undefined;
    trace?: {} | undefined;
}): any;
export function resolveUiBridgePolicy({ adapterName }?: {
    adapterName?: string | undefined;
}): any;

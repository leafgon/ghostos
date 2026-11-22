export const DEFAULT_TIMEOUT_MS: 15000;
export class HippocampusRuntimeError extends Error {
    constructor(code: any, message?: any, { retryable, details }?: {
        details?: {} | undefined;
    });
    code: any;
    retryable: boolean;
    details: {};
}
export namespace cachekeys {
    let CONFIG: string;
}
export function executeElementHippocampusIntent(rawIntent: any, executionContext: any, config: any): Promise<{
    _bname: string;
    _content: {
        schemaVersion: string;
        intentId: any;
        operation: any;
        ok: boolean;
        status: string;
        deploymentId: any;
        requestId: string;
        http: {
            status: any;
            retryable: any;
        };
    };
    _label: {
        parentEventId?: string | undefined;
        eventId: string;
    };
} | {
    schema: string;
    ok: boolean;
    status: string;
    replayed: boolean;
    bindings: any;
    versions: any;
    result: any;
} | {
    schema: string;
    ok: boolean;
    status: string;
    replayed: boolean;
    bindings: {
        tenantId: string;
        deploymentId: any;
        graphDomain: string;
        graphApp: string;
        spellRef: string;
        elementNodeId: string;
        profile: {
            profileSpellRef: string;
            profileId: string;
            profileVersion: string;
            profileDigest: string;
            allowlistReleaseId: string;
            allowlistManifestDigest: string;
            allowlistEntryDigest: string;
        };
        configurationDigest: any;
        operationRef: any;
        requestId: string;
    };
    error: {
        schema: string;
        code: any;
        message: any;
        retryable: boolean;
    };
}>;
export function executeHippocampusIntentCommand({ command, transport, config, executionContext, }?: {
    config?: {} | undefined;
    executionContext?: {} | undefined;
}): Promise<{
    _bname: string;
    _content: {
        schemaVersion: string;
        intentId: any;
        operation: any;
        ok: boolean;
        status: string;
        deploymentId: any;
        requestId: string;
        http: {
            status: any;
            retryable: any;
        };
    };
    _label: {
        parentEventId?: string | undefined;
        eventId: string;
    };
} | {
    schema: string;
    ok: boolean;
    status: string;
    replayed: boolean;
    bindings: any;
    versions: any;
    result: any;
}>;
export function normalizeHippocampusIntentCommand(input?: {}): Readonly<{
    schemaVersion: string;
    intentId: string;
    operation: string;
    deploymentId: string;
    instanceId: string | undefined;
    options: {
        idempotencyKey: string | undefined;
        timeoutMs: number | undefined;
        maxAttempts: number | undefined;
    };
    inputLabel: {
        eventId: string | undefined;
        parentEventId: string | undefined;
    } | undefined;
}> | Readonly<{
    schema: string;
    operation: string;
    configurationId: string;
    configurationDigest: string;
    operationRef: string;
}>;
export function props(streamCache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: Observable<any>;
        _control: {
            _stream: any;
        };
    };
    datalogic: {
        pre: (dataIn: any) => any;
        post: (dataIn: any) => any;
    };
};
export function resolveHippocampusIntentIdempotency(command: any): {
    required: boolean;
    key?: undefined;
    scope?: undefined;
    domainCommandId?: undefined;
} | {
    required: boolean;
    key: any;
    scope: any;
    domainCommandId: any;
};
import { Observable } from "rxjs";

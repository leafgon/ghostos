export class HermesConfigError extends Error {
    constructor(message: any, details?: {});
    code: string;
    status: number;
    details: {};
}
export class HermesDomainError extends Error {
    constructor(code: any, message: any, { status, retryable, details }?: {
        status?: number | undefined;
        retryable?: boolean | undefined;
        details?: {} | undefined;
    });
    code: any;
    status: number;
    retryable: boolean;
    details: {};
}
export namespace cachekeys {
    let CONFIG: string;
    let CURSOR: string;
    let LAST_READ_AT: string;
    let READ_STREAM: string;
    let READ_STREAMS: string;
    let DATA_SUBSCRIBER_COUNT: string;
}
export function executeHermesEgressCommand({ command, config, transport }?: {
    config?: {} | undefined;
}): Promise<{
    status: any;
    commandId: string;
    instanceId: string;
    requestId: any;
    response: any;
}>;
export function normalizeHermesEgressCommand(input: any, { config }?: {
    config?: {} | undefined;
}): {
    schemaVersion: string;
    commandId: string;
    correlationId: string;
    producerId: string;
    instanceId: string;
    guildId: string;
    channelId: string;
    type: string;
    payload: any;
};
export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: Observable<any>;
        _control: {
            _stream: Observable<any>;
        };
    };
    datalogic: {
        pre: (data_in: any) => any;
        post: (data_in: any) => any;
    };
};
export function resolveHermesEgressIdempotency(command: any, { scope }?: {}): {
    required: boolean;
    scope: any;
    domainCommandId: string;
    producerId: string;
    integrationInstanceId: string;
};
export function resolveHermesSourceRecordIdentity(record?: {}, { instanceId, parentEventIds }?: {
    parentEventIds?: never[] | undefined;
}): {
    sourceId: string | undefined;
    eventId: string | undefined;
    cursor: string | undefined;
    sequence: any;
    parentEventIds: any[];
};
import { Observable } from "rxjs";

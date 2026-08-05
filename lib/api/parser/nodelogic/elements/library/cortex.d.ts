export class CortexConfigError extends Error {
    constructor(message: any, details?: {});
    code: string;
    httpStatus: any;
    details: {};
}
export class CortexRuntimeError extends Error {
    constructor(code: any, message: any, { httpStatus, retryable, details }?: {
        httpStatus?: undefined;
        retryable?: boolean | undefined;
        details?: {} | undefined;
    });
    code: any;
    httpStatus: any;
    retryable: boolean;
    details: {};
}
export namespace cachekeys {
    let CONFIG: string;
    let FIFO: string;
    let POLL_LIST: string;
    let IDEMPOTENCY_RECORDS: string;
    let DATA_SUBSCRIBER_COUNT: string;
}
export function executeCortexSubmissionCommand({ command, config, transport }?: {
    config?: {} | undefined;
}): Promise<{
    status: string;
    idempotencyKey: any;
    requestId: string;
    jobId: string;
    statusUrl: string;
    eventsUrl: string;
    resultUrl: string;
}>;
export function normalizeCortexSubmissionCommand({ intentBottle, refnode }: {
    intentBottle: any;
    refnode: any;
}): {
    intent: any;
    intentBottle: any;
    normalizedIntent: {
        schemaVersion: string;
        cortexInstanceId: string;
        workloadType: string;
        priority: string;
        mode: string;
        payloadRef: {
            uri: string;
            inline: any;
            mimeType: string;
            sizeBytes: number;
            checksum: string;
        };
    };
    requestBody: {
        idempotencyKey: string;
        schemaVersion: string;
        cortexInstanceId: string;
        workloadType: string;
        priority: string;
        mode: string;
        payloadRef: {
            uri: string;
            inline: any;
            mimeType: string;
            sizeBytes: number;
            checksum: string;
        };
    };
    idempotencyKey: string;
    intentId: string | undefined;
    refnode: any;
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
export function resolveCortexPollSourceIdentity(outcome?: {}, { parentEventIds }?: {
    parentEventIds?: never[] | undefined;
}): {
    sourceId: string | undefined;
    jobId: string | undefined;
    requestId: string | undefined;
    status: string | undefined;
    parentEventIds: any[];
};
export function resolveCortexSubmissionIdempotency(command: any): {
    required: boolean;
    key: any;
    scope: string;
    domainCommandId: any;
    producerId: any;
    integrationInstanceId: any;
};
import { Observable } from "rxjs";

export const HTTP_SAFE_READ_METHODS: readonly string[];
export const HTTP_WRITE_METHODS: readonly string[];
export class HttpRuntimeError extends Error {
    constructor(code: any, message: any, { statusCode, retryable, details }?: {
        retryable?: boolean | undefined;
        details?: {} | undefined;
    });
    code: any;
    statusCode: any;
    retryable: boolean;
    details: {};
}
export function assertHttpWriteCommand(command: any): any;
export namespace cachekeys {
    let URI: string;
    let HEADER: string;
    let REQUEST_TTL_CACHE: string;
}
export function executeHttpFetchCommand({ command, fetchImpl }?: {
    fetchImpl?: typeof fetch | undefined;
}): Promise<{
    status: number;
    method: any;
    uri: any;
    data: any;
}>;
export function isHttpSafeReadMethod(method: any): boolean;
export function isHttpWriteMethod(method: any): boolean;
export function normalizeHttpRequestCommand(input?: {}): {
    method: string;
    uri: any;
    headers: any;
    body: any;
    idempotency: any;
    domainCommandId: any;
    tenantId: any;
    integrationInstanceId: any;
    producerId: any;
};
export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: import("rxjs").Observable<any>;
        };
    };
    datalogic: {
        pre: (data_in: any) => any;
        post: (data_in: any) => any;
    };
};
export function resolveHttpWriteIdempotency(command: any): {
    required: boolean;
    key: any;
    scope: any;
    domainCommandId: any;
    tenantId: any;
    integrationInstanceId: any;
    producerId: any;
};

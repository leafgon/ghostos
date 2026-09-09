export const DIRECTUS_MUTATION_OPERATIONS: readonly string[];
export const DIRECTUS_READ_OPERATIONS: readonly string[];
export class DirectusRuntimeError extends Error {
    constructor(code: any, message: any, { statusCode, retryable, details }?: {
        retryable?: boolean | undefined;
        details?: {} | undefined;
    });
    code: any;
    statusCode: any;
    retryable: boolean;
    details: {};
}
export function assertDirectusMutationCommand(command: any): any;
export function buildDirectusMutationRequest(command: any): {
    method: string;
    url: string;
    headers: any;
    body: any;
    operation: any;
    collection: any;
    itemId: any;
};
export const cachekeys: {};
export function executeDirectusMutationCommand({ command, transport, }?: {
    transport?: ((request: any) => Promise<Response>) | undefined;
}): Promise<{
    status: number;
    operation: any;
    collection: any;
    itemId: any;
    url: string;
    data: any;
}>;
export function isDirectusMutationOperation(operation: any): boolean;
export function isDirectusReadOperation(operation: any): boolean;
export function normalizeDirectusOperation(operation?: string): string;
export function normalizeDirectusRequestCommand(input?: {}): {
    operation: string;
    endpoint: any;
    collection: any;
    itemId: any;
    query: any;
    headers: any;
    token: any;
    authorization: any;
    body: any;
    idempotency: any;
    domainCommandId: any;
    tenantId: any;
    integrationInstanceId: any;
    producerId: any;
    sourceId: any;
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
export function resolveDirectusMutationIdempotency(command: any): {
    required: boolean;
    key: any;
    scope: any;
    domainCommandId: any;
    tenantId: any;
    integrationInstanceId: any;
    producerId: any;
};
export function resolveDirectusReadSourceIdentity(command: any): {
    sourceId: string;
    collection: any;
    operation: string;
};

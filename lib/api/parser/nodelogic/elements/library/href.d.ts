export class HrefNavigationError extends Error {
    constructor(code: any, message: any, { details }?: {
        details?: {} | undefined;
    });
    code: any;
    details: {};
}
export function assertHrefNavigationCommand(command: any): any;
export namespace cachekeys {
    let URI: string;
}
export function executeHrefNavigationCommand({ command, navigationTarget }?: {}): Promise<{
    status: string;
    navigated: boolean;
    reason: string;
    uri: any;
    replace: any;
} | {
    status: string;
    navigated: boolean;
    uri: any;
    replace: any;
    reason?: undefined;
}>;
export function normalizeHrefNavigationCommand(input?: {}): {
    uri: string;
    data?: undefined;
    replace?: undefined;
    currentHref?: undefined;
    idempotency?: undefined;
    domainCommandId?: undefined;
    tenantId?: undefined;
    integrationInstanceId?: undefined;
    producerId?: undefined;
} | {
    uri: any;
    data: any;
    replace: boolean;
    currentHref: any;
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
            _stream: any;
        };
    };
    datalogic: {
        pre: (data_in: any) => any;
    };
};
export function resolveHrefNavigationIdempotency(command: any): {
    required: boolean;
    key: any;
    scope: any;
    domainCommandId: any;
    tenantId: any;
    integrationInstanceId: any;
    producerId: any;
    allowGraphLocalFallback: boolean;
};

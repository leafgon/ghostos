export const CIRCULAR: "[circular]";
export const REDACTED: "[redacted]";
export const REDACTED_SIGNED_URL: "[redacted signed url]";
export const SAFE_TRACE_FIELD_NAMES: Set<string>;
export function createSafeLogger({ component, enabled, sink, }?: {
    enabled?: (() => boolean) | undefined;
    sink?: Console | undefined;
}): {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    log: (...args: any[]) => void;
    trace: (eventName: any, fields?: {}, options?: {}) => void;
};
export function pickSafeTraceFields(fields?: {}, allowedFields?: Set<string>): {
    [k: string]: any;
};
export function redactValue(value: any, seen?: WeakSet<object>): any;
export namespace runtimeLogger {
    function debug(...args: any[]): void;
    function info(...args: any[]): void;
    function warn(...args: any[]): void;
    function error(...args: any[]): void;
    function log(...args: any[]): void;
    function trace(eventName: any, fields?: {}, options?: {}): void;
}

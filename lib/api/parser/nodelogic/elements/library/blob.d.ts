export const ALLOWED_CONTENT_TYPES: readonly string[];
export class BlobRuntimeError extends Error {
    constructor(code: any, message?: any, options?: {});
    code: any;
    retryable: boolean;
    details: any;
}
export const DATA_FILE_SCHEMA_VERSION: "ghostos.blob_data_file.v1";
export const DEFAULT_MAX_OBJECT_BYTES: number;
export const FAILURE_SCHEMA_VERSION: "ghostos.blob_failure.v1";
export const FETCH_SCHEMA_VERSION: "ghostos.blob_fetch_bottle.v1";
export const STORE_SCHEMA_VERSION: "ghostos.blob_store_bottle.v1";
export function assignDeterministicObjectId({ contentHash, contentType, contentLength }: {
    contentHash: any;
    contentType: any;
    contentLength: any;
}): Promise<string>;
export function createBlobFailure(code: any, { retryable, safeMessage, correlationId }?: {
    retryable?: boolean | undefined;
    safeMessage?: any;
}): {
    schemaVersion: string;
    code: any;
    retryable: boolean;
    safeMessage: any;
    correlationId: any;
};
export function createInMemoryBlobStorageAdapter({ accountName, containerName, maxObjectBytes, }?: {
    accountName?: string | undefined;
    containerName?: string | undefined;
    maxObjectBytes?: number | undefined;
}): {
    maxObjectBytes: number;
    executionCounts: {
        resolveRuntimeFileRef: number;
        putObject: number;
        getObject: number;
        headObject: number;
        deleteObject: number;
    };
    getExecutionCounts: () => {
        resolveRuntimeFileRef: number;
        putObject: number;
        getObject: number;
        headObject: number;
        deleteObject: number;
    };
    registerRuntimeFileRef: (ref: any, payloadRef: any) => void;
    resolveRuntimeFileRef: (input: any) => Promise<{
        kind: any;
        ref: any;
        contentHash: any;
    }>;
    headObject: (input: any) => Promise<any>;
    putObject: (input: any) => Promise<{
        schemaVersion: string;
        blobElementId: any;
        objectId: any;
        objectType: string;
        contentType: any;
        contentLength: any;
        contentHash: any;
        storage: {
            accountName: any;
            containerName: any;
            blobName: any;
        };
        etag: string;
        assetRevision: any;
        lastModifiedAt: string;
    }>;
    getObject: (input: any) => Promise<any>;
    deleteObject: (input: any) => Promise<any>;
};
export function createLeafServerBlobStorageAdapter({ baseUrl, fetchImpl, credentials, }?: {
    baseUrl?: string | undefined;
    fetchImpl?: typeof fetch | undefined;
    credentials?: string | undefined;
}): {
    resolveRuntimeFileRef: (input: any) => Promise<any>;
    headObject: (input: any) => Promise<{
        schemaVersion: string;
        blobElementId: any;
        objectId: any;
        objectType: string;
        contentType: any;
        contentLength: number | undefined;
        contentHash: any;
        storage: undefined;
        etag: any;
        assetRevision: number | undefined;
        lastModifiedAt: any;
    }>;
    putObject: (input: any) => Promise<any>;
    getObject: (input: any) => Promise<any>;
    deleteObject: (input: any) => Promise<any>;
};
export function executeBlobBottle(bottle: any, executionContext: any): Promise<{
    schemaVersion: string;
    code: any;
    retryable: boolean;
    safeMessage: any;
    correlationId: any;
} | {
    schemaVersion: string;
    blobElementId: any;
    objectId: any;
    objectType: any;
    contentType: any;
    contentLength: any;
    contentHash: any;
    storage: any;
    etag: any;
    assetRevision: any;
    lastModifiedAt: any;
}>;
export function executeBlobFetchBottle(rawBottle: any, executionContext: any): Promise<{
    schemaVersion: string;
    code: any;
    retryable: boolean;
    safeMessage: any;
    correlationId: any;
} | {
    schemaVersion: string;
    blobElementId: any;
    objectId: any;
    objectType: any;
    contentType: any;
    contentLength: any;
    contentHash: any;
    storage: any;
    etag: any;
    assetRevision: any;
    lastModifiedAt: any;
}>;
export function executeBlobStoreBottle(rawBottle: any, executionContext: any): Promise<{
    schemaVersion: string;
    code: any;
    retryable: boolean;
    safeMessage: any;
    correlationId: any;
} | {
    schemaVersion: string;
    blobElementId: any;
    objectId: any;
    objectType: any;
    contentType: any;
    contentLength: any;
    contentHash: any;
    storage: any;
    etag: any;
    assetRevision: any;
    lastModifiedAt: any;
}>;
export function normalizeBlobObjectId(value: any): any;
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
import { Observable } from "rxjs";

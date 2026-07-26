import { BehaviorSubject, Subject, firstValueFrom } from "rxjs";
import { describe, expect, it } from "vitest";

import { LEAFELEMENT_ADAPTER_REGISTRY } from "./index.js";
import {
  STORE_SCHEMA_VERSION,
  FETCH_SCHEMA_VERSION,
  createInMemoryBlobStorageAdapter,
  executeBlobFetchBottle,
  executeBlobStoreBottle,
  normalizeBlobObjectId,
  props as blobProps,
} from "./blob.js";

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;

const createContext = (overrides = {}) => {
  const adapter = overrides.blobStorageAdapter ?? createInMemoryBlobStorageAdapter();
  return {
    tenantId: "tenant-a",
    graphDomainId: "domain-a",
    graphAppId: "app-a",
    actorRef: "user:owner-a",
    correlationId: "corr-a",
    blobStorageAdapter: adapter,
    ...overrides,
  };
};

const storeBottle = (overrides = {}) => ({
  schemaVersion: STORE_SCHEMA_VERSION,
  operation: "create",
  blobElementId: "blob-node-uuid",
  requestedObjectId: "logo",
  contentType: "image/png",
  contentLength: 12345,
  contentHash: HASH_A,
  payloadRef: {
    kind: "inline-bytes",
    ref: "inline-a",
  },
  ...overrides,
});

const fetchBottle = (objectId = "logo", overrides = {}) => ({
  schemaVersion: FETCH_SCHEMA_VERSION,
  blobElementId: "blob-node-uuid",
  objectId,
  ...overrides,
});

describe("leafelement:blob contract helpers", () => {
  it("registers the blob element adapter", () => {
    expect(LEAFELEMENT_ADAPTER_REGISTRY.blob).toBeTypeOf("function");
  });

  it("stores and fetches deterministic data-file metadata through the fake adapter", async () => {
    const context = createContext();
    const stored = await executeBlobStoreBottle(storeBottle(), context);
    expect(stored).toMatchObject({
      schemaVersion: "ghostos.blob_data_file.v1",
      blobElementId: "blob-node-uuid",
      objectId: "logo",
      objectType: "file",
      contentType: "image/png",
      contentLength: 12345,
      contentHash: HASH_A,
      assetRevision: 1,
      storage: {
        accountName: "test-account",
        containerName: "test-container",
      },
    });
    expect(stored.storage.blobName).toBe("tenant-a/domain-a/app-a/blob-node-uuid/logo");

    const fetched = await executeBlobFetchBottle(fetchBottle("logo"), context);
    expect(fetched).toEqual(stored);
    expect(context.blobStorageAdapter.getExecutionCounts()).toMatchObject({
      headObject: 1,
      putObject: 1,
      getObject: 1,
    });
  });

  it("assigns stable object IDs and treats same-content assigned creates as idempotent", async () => {
    const context = createContext();
    const bottle = storeBottle({ requestedObjectId: undefined });
    const first = await executeBlobStoreBottle(bottle, context);
    const second = await executeBlobStoreBottle(bottle, context);

    expect(first.objectId).toMatch(/^[a-z2-7]{32}$/);
    expect(second).toEqual(first);
    expect(context.blobStorageAdapter.getExecutionCounts()).toMatchObject({
      headObject: 2,
      putObject: 1,
    });
  });

  it("rejects duplicate requested object IDs unless overwrite provides the current revision", async () => {
    const context = createContext();
    const first = await executeBlobStoreBottle(storeBottle(), context);
    const duplicate = await executeBlobStoreBottle(storeBottle(), context);
    expect(duplicate).toMatchObject({
      schemaVersion: "ghostos.blob_failure.v1",
      code: "duplicate_object_id",
      retryable: false,
      correlationId: "corr-a",
    });

    const overwritten = await executeBlobStoreBottle(
      storeBottle({
        operation: "overwrite",
        expectedAssetRevision: first.assetRevision,
        contentHash: HASH_B,
      }),
      context,
    );
    expect(overwritten.assetRevision).toBe(2);
    expect(overwritten.contentHash).toBe(HASH_B);

    const stale = await executeBlobStoreBottle(
      storeBottle({
        operation: "overwrite",
        expectedAssetRevision: first.assetRevision,
        contentHash: HASH_A,
      }),
      context,
    );
    expect(stale.code).toBe("asset_revision_mismatch");
  });

  it("returns typed failures for unsafe IDs, unsupported content, oversized objects, and fetch guards", async () => {
    expect(() => normalizeBlobObjectId("_leafgon-cache")).toThrow(/reserved/i);
    expect(() => normalizeBlobObjectId("../logo")).toThrow(/single safe path segment/i);
    expect(() => normalizeBlobObjectId("logo icon")).toThrow(/not allowed/i);

    const context = createContext({ blobStorageAdapter: createInMemoryBlobStorageAdapter() });
    await executeBlobStoreBottle(storeBottle(), context);

    await expect(
      executeBlobStoreBottle(storeBottle({ contentType: "text/html" }), context),
    ).resolves.toMatchObject({ code: "unsupported_content_type" });
    await expect(
      executeBlobStoreBottle(storeBottle({ contentLength: 11, requestedObjectId: "big" }), {
        ...context,
        maxBlobObjectBytes: 10,
      }),
    ).resolves.toMatchObject({ code: "oversized_object" });
    await expect(executeBlobFetchBottle(fetchBottle("missing"), context)).resolves.toMatchObject({
      code: "missing_object",
    });
    await expect(
      executeBlobFetchBottle(fetchBottle("logo", { expectedContentHash: HASH_B }), context),
    ).resolves.toMatchObject({ code: "hash_mismatch" });
  });

  it("fails closed when execution context or adapter methods are missing", async () => {
    const adapter = createInMemoryBlobStorageAdapter();
    const result = await executeBlobStoreBottle(storeBottle(), {
      tenantId: "tenant-a",
      graphDomainId: "domain-a",
      graphAppId: "app-a",
      actorRef: "user:owner-a",
      correlationId: "corr-a",
      blobStorageAdapter: adapter,
    });
    expect(result.objectId).toBe("logo");

    const missingContext = await executeBlobStoreBottle(storeBottle({ requestedObjectId: "x" }), {
      tenantId: "tenant-a",
      graphDomainId: "domain-a",
      graphAppId: "app-a",
      actorRef: "user:owner-a",
      correlationId: "corr-a",
      blobStorageAdapter: {},
    });
    expect(missingContext).toMatchObject({
      code: "missing_execution_context",
      correlationId: "corr-a",
    });
    expect(adapter.getExecutionCounts().putObject).toBe(1);
  });

  it("resolves runtime-file-ref payloads once before storage writes", async () => {
    const adapter = createInMemoryBlobStorageAdapter();
    adapter.registerRuntimeFileRef("runtime-ref-a", {
      tenantId: "tenant-a",
      graphDomainId: "domain-a",
      graphAppId: "app-a",
      blobElementId: "blob-node-uuid",
      contentHash: HASH_A,
    });
    const context = createContext({ blobStorageAdapter: adapter });
    const result = await executeBlobStoreBottle(
      storeBottle({
        requestedObjectId: "runtime-ref-object",
        payloadRef: {
          kind: "runtime-file-ref",
          ref: "runtime-ref-a",
        },
      }),
      context,
    );
    expect(result.objectId).toBe("runtime-ref-object");
    expect(adapter.getExecutionCounts()).toMatchObject({
      resolveRuntimeFileRef: 1,
      putObject: 1,
    });

    const reused = await executeBlobStoreBottle(
      storeBottle({
        requestedObjectId: "runtime-ref-object-2",
        payloadRef: {
          kind: "runtime-file-ref",
          ref: "runtime-ref-a",
        },
      }),
      context,
    );
    expect(reused.code).toBe("invalid_payload_ref");
  });

  it("exposes fake head/get/delete counters without production storage credentials", async () => {
    const adapter = createInMemoryBlobStorageAdapter();
    const context = createContext({ blobStorageAdapter: adapter });
    const stored = await executeBlobStoreBottle(storeBottle(), context);
    const deleted = await adapter.deleteObject({
      tenantId: context.tenantId,
      graphDomainId: context.graphDomainId,
      graphAppId: context.graphAppId,
      blobElementId: stored.blobElementId,
      objectId: stored.objectId,
      expectedAssetRevision: stored.assetRevision,
      correlationId: context.correlationId,
    });
    expect(deleted.objectId).toBe("logo");
    expect(adapter.getExecutionCounts().deleteObject).toBe(1);
  });

  it("executes through the blob adapter dataflow with host-injected context", async () => {
    const context = createContext();
    const adapter = blobProps({}).leaflogic;
    const input$ = new BehaviorSubject(storeBottle({ requestedObjectId: "flow-logo" }));
    const ctrl$ = new Subject();
    const flow = adapter([{ _stream: input$ }], {
      _stream: ctrl$,
      _config: {
        blobExecutionContext: context,
      },
    });
    const outputPromise = firstValueFrom(flow._stream);
    const ctrlPromise = firstValueFrom(flow._control._stream);

    ctrl$.next({ frame: 1 });

    const output = await outputPromise;
    await ctrlPromise;
    expect(output).toMatchObject({
      schemaVersion: "ghostos.blob_data_file.v1",
      objectId: "flow-logo",
    });
    expect(context.blobStorageAdapter.getExecutionCounts().putObject).toBe(1);
  });
});

import { execFileSync } from "node:child_process";
import { BehaviorSubject, Subject, firstValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { LEAFELEMENT_ADAPTER_REGISTRY } from "./index.js";
import {
  STORE_SCHEMA_VERSION,
  FETCH_SCHEMA_VERSION,
  LIST_SCHEMA_VERSION,
  createInMemoryBlobStorageAdapter,
  createLeafServerBlobStorageAdapter,
  executeBlobBottle,
  executeBlobFetchBottle,
  executeBlobListBottle,
  executeBlobStoreBottle,
  normalizeIdempotencyKey,
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
    blobElementId: "blob-node-uuid",
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

const listBottle = (overrides = {}) => ({
  schemaVersion: LIST_SCHEMA_VERSION,
  blobElementId: "blob-node-uuid",
  ...overrides,
});

const jsonResponse = ({ status = 200, body = {}, headers = {} } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) => headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()],
  },
  json: async () => body,
  text: async () => JSON.stringify(body),
});

const emptyHeadResponse = ({ status }) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: () => undefined,
  },
  json: async () => {
    throw new Error("HEAD responses do not have a JSON body");
  },
  text: async () => "",
});

describe("leafelement:blob contract helpers", () => {
  it("registers the blob element adapter", () => {
    expect(LEAFELEMENT_ADAPTER_REGISTRY.blob).toBeTypeOf("function");
  });

  it("exposes blob helpers through the package ESM entrypoint", async () => {
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import('./lib/index.esm.js').then((m) => console.log([typeof m.createInMemoryBlobStorageAdapter, typeof m.createLeafServerBlobStorageAdapter, typeof m.executeBlobBottle, typeof m.executeBlobListBottle].join(' ')))",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(output.trim()).toBe("function function function function");
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

  it("lists scoped blob objects in stable cursor pages", async () => {
    const context = createContext();
    for (const objectId of ["charlie", "alpha", "bravo"]) {
      await executeBlobStoreBottle(storeBottle({ requestedObjectId: objectId }), context);
    }
    await executeBlobStoreBottle(storeBottle({ requestedObjectId: "excluded" }), {
      ...context,
      graphAppId: "other-app",
    });

    const firstPage = await executeBlobListBottle(listBottle({ limit: 2 }), context);
    expect(firstPage).toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [{ objectId: "alpha" }, { objectId: "bravo" }],
    });
    expect(firstPage.nextCursor).toBe("bravo");

    await expect(
      executeBlobListBottle(listBottle({ limit: 2, cursor: firstPage.nextCursor }), context),
    ).resolves.toMatchObject({
      items: [{ objectId: "charlie" }],
      nextCursor: null,
    });
    expect(context.blobStorageAdapter.getExecutionCounts()).toMatchObject({ listObjects: 2 });
  });

  it("preserves enriched blob-list metadata fields", async () => {
    const adapter = createInMemoryBlobStorageAdapter();
    adapter.listObjects = async () => ({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [
        {
          schemaVersion: "ghostos.blob_data_file.v1",
          blobElementId: "blob-node-uuid",
          objectId: "logo",
          objectType: "file",
          contentType: "image/png",
          contentLength: 123,
          contentHash: HASH_A,
          etag: "etag-1",
          assetRevision: 1,
          lastModifiedAt: "2026-08-25T00:00:00Z",
          assetUrls: [
            "https://assets.leafgon.com/_leafgon/api/v1/page-assets/@page/storage/logo",
            null,
          ],
          objectMetadata: {
            schemaVersion: "leafgon.blob_asset_object_metadata.v1",
            objectId: "logo",
            spellName: "storage",
          },
        },
      ],
      nextCursor: null,
    });
    const context = createContext({
      blobStorageAdapter: adapter,
    });

    await expect(executeBlobListBottle(listBottle(), context)).resolves.toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [
        {
          objectId: "logo",
          assetUrls: ["https://assets.leafgon.com/_leafgon/api/v1/page-assets/@page/storage/logo"],
          objectMetadata: {
            schemaVersion: "leafgon.blob_asset_object_metadata.v1",
            objectId: "logo",
            spellName: "storage",
          },
        },
      ],
      nextCursor: null,
    });
  });

  it("defaults blob-list schemaVersion and blobElementId from GhostOS context", async () => {
    const context = createContext();
    await executeBlobStoreBottle(storeBottle({ requestedObjectId: "alpha" }), context);

    const result = await executeBlobBottle(
      {
        _bname: "blob-list",
        _content: {},
      },
      context,
    );

    expect(result).toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [{ objectId: "alpha" }],
      nextCursor: null,
    });
  });

  it("rejects invalid blob list limits before calling storage", async () => {
    const context = createContext();
    await expect(executeBlobListBottle(listBottle({ limit: 101 }), context)).resolves.toMatchObject(
      {
        schemaVersion: "ghostos.blob_failure.v1",
        code: "invalid_blob_bottle",
      },
    );
    expect(context.blobStorageAdapter.getExecutionCounts()).toMatchObject({ listObjects: 0 });
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
      executeBlobStoreBottle(storeBottle({ contentType: "image/svg+xml" }), context),
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

  it("allows owner/editor HTML, JavaScript, and PDF blob object content types", async () => {
    const context = createContext({ blobStorageAdapter: createInMemoryBlobStorageAdapter() });

    await expect(
      executeBlobStoreBottle(
        storeBottle({ requestedObjectId: "html-page", contentType: "text/html" }),
        context,
      ),
    ).resolves.toMatchObject({
      objectId: "html-page",
      contentType: "text/html",
    });
    await expect(
      executeBlobStoreBottle(
        storeBottle({ requestedObjectId: "module-js", contentType: "text/javascript" }),
        context,
      ),
    ).resolves.toMatchObject({
      objectId: "module-js",
      contentType: "text/javascript",
    });
    await expect(
      executeBlobStoreBottle(
        storeBottle({ requestedObjectId: "document-pdf", contentType: "application/pdf" }),
        context,
      ),
    ).resolves.toMatchObject({
      objectId: "document-pdf",
      contentType: "application/pdf",
    });
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
    const adapter = blobProps({ _refnode: "blob-node-uuid" }).leaflogic;
    const input$ = new BehaviorSubject(
      storeBottle({ blobElementId: undefined, requestedObjectId: "flow-logo" }),
    );
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

  it("accepts runtime context from runtimeOptions for browser-hosted execution", async () => {
    const context = createContext();
    const adapter = blobProps({ _refnode: "blob-node-uuid" }).leaflogic;
    const input$ = new BehaviorSubject(
      storeBottle({ blobElementId: undefined, requestedObjectId: "runtime-options-logo" }),
    );
    const ctrl$ = new Subject();
    const flow = adapter([{ _stream: input$ }], {
      _stream: ctrl$,
      _config: {
        runtimeOptions: {
          runtimeContext: {
            blobExecutionContext: context,
          },
        },
      },
    });
    const outputPromise = firstValueFrom(flow._stream);
    const ctrlPromise = firstValueFrom(flow._control._stream);

    ctrl$.next({ frame: 1 });

    expect(await outputPromise).toMatchObject({
      schemaVersion: "ghostos.blob_data_file.v1",
      objectId: "runtime-options-logo",
    });
    await ctrlPromise;
    expect(context.blobStorageAdapter.getExecutionCounts().putObject).toBe(1);
  });

  it("falls back to a host-provided global blob execution context factory", async () => {
    const context = createContext();
    const adapter = blobProps({ _refnode: "blob-node-uuid" }).leaflogic;
    const input$ = new BehaviorSubject({ schemaVersion: LIST_SCHEMA_VERSION, limit: 50 });
    const ctrl$ = new Subject();
    const globalFactory = vi.fn(() => ({ ...context, correlationId: "corr-global" }));
    const previousFactory = globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__;
    const previousContext = globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__;
    globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__ = globalFactory;
    delete globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__;
    try {
      const flow = adapter([{ _stream: input$ }], {
        _stream: ctrl$,
        _config: {},
      });
      const outputPromise = firstValueFrom(flow._stream);
      const ctrlPromise = firstValueFrom(flow._control._stream);

      ctrl$.next({ frame: 1 });

      expect(await outputPromise).toMatchObject({
        schemaVersion: "ghostos.blob_data_file_page.v1",
        items: [],
      });
      await ctrlPromise;
      expect(globalFactory).toHaveBeenCalled();
      expect(context.blobStorageAdapter.getExecutionCounts().listObjects).toBe(1);
    } finally {
      if (previousFactory === undefined) {
        delete globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__;
      } else {
        globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__ = previousFactory;
      }
      if (previousContext === undefined) {
        delete globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__;
      } else {
        globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__ = previousContext;
      }
    }
  });

  it("prefers explicit blob execution context over global fallback context", async () => {
    const configuredContext = createContext();
    const fallbackContext = createContext({ correlationId: "corr-fallback" });
    const adapter = blobProps({ _refnode: "blob-node-uuid" }).leaflogic;
    const input$ = new BehaviorSubject({ schemaVersion: LIST_SCHEMA_VERSION, limit: 50 });
    const ctrl$ = new Subject();
    const previousFactory = globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__;
    const previousContext = globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__;
    globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__ = () => fallbackContext;
    delete globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__;
    try {
      const flow = adapter([{ _stream: input$ }], {
        _stream: ctrl$,
        _config: {
          blobExecutionContext: configuredContext,
        },
      });
      const outputPromise = firstValueFrom(flow._stream);
      const ctrlPromise = firstValueFrom(flow._control._stream);

      ctrl$.next({ frame: 1 });

      expect(await outputPromise).toMatchObject({
        schemaVersion: "ghostos.blob_data_file_page.v1",
        items: [],
      });
      await ctrlPromise;
      expect(configuredContext.blobStorageAdapter.getExecutionCounts().listObjects).toBe(1);
      expect(fallbackContext.blobStorageAdapter.getExecutionCounts().listObjects).toBe(0);
    } finally {
      if (previousFactory === undefined) {
        delete globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__;
      } else {
        globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT_FACTORY__ = previousFactory;
      }
      if (previousContext === undefined) {
        delete globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__;
      } else {
        globalThis.__LEAFGON_BLOB_EXECUTION_CONTEXT__ = previousContext;
      }
    }
  });

  it("binds list bottles to the executing blob element", async () => {
    const context = createContext();
    const adapter = blobProps({ _refnode: "blob-node-uuid" }).leaflogic;
    const input$ = new BehaviorSubject({ schemaVersion: LIST_SCHEMA_VERSION, limit: 50 });
    const ctrl$ = new Subject();
    const flow = adapter([{ _stream: input$ }], {
      _stream: ctrl$,
      _config: { blobExecutionContext: context },
    });
    const outputPromise = firstValueFrom(flow._stream);
    const ctrlPromise = firstValueFrom(flow._control._stream);

    ctrl$.next({ frame: 1 });

    expect(await outputPromise).toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [],
    });
    await ctrlPromise;
    expect(context.blobStorageAdapter.getExecutionCounts().listObjects).toBe(1);
  });

  it("rejects a bottle that targets a different blob element", async () => {
    const context = createContext();
    const adapter = blobProps({ _refnode: "blob-node-uuid" }).leaflogic;
    const input$ = new BehaviorSubject(listBottle({ blobElementId: "another-node" }));
    const ctrl$ = new Subject();
    const flow = adapter([{ _stream: input$ }], {
      _stream: ctrl$,
      _config: { blobExecutionContext: context },
    });
    const outputPromise = firstValueFrom(flow._stream);
    const ctrlPromise = firstValueFrom(flow._control._stream);

    ctrl$.next({ frame: 1 });

    expect(await outputPromise).toMatchObject({
      schemaVersion: "ghostos.blob_failure.v1",
      code: "invalid_blob_bottle",
    });
    await ctrlPromise;
  });

  it("maps the host adapter to the first-party leaf-server blob storage API", async () => {
    const storedMetadata = {
      schemaVersion: "ghostos.blob_data_file.v1",
      blobElementId: "blob-node-uuid",
      objectId: "logo",
      objectType: "file",
      contentType: "image/png",
      contentLength: 12345,
      contentHash: HASH_A,
      storage: {
        accountName: "server-account",
        containerName: "server-container",
        blobName: "tenant-a/domain-a/app-a/blob-node-uuid/logo",
      },
      etag: "etag-1",
      assetRevision: 1,
      lastModifiedAt: "2026-07-26T00:00:00Z",
    };
    const fetchImpl = vi.fn(async (url, init) => {
      if (init.method === "HEAD") {
        return emptyHeadResponse({ status: 404 });
      }
      if (url.endsWith("/api/v1/blob-storage/runtime-file-refs/runtime-ref-a:resolve")) {
        return jsonResponse({
          body: {
            payloadRef: { kind: "temp-file", ref: "runtime-ref-a" },
            contentType: "image/png",
            contentLength: 12345,
            contentHash: HASH_A,
          },
        });
      }
      if (init.method === "PUT" || init.method === "GET" || init.method === "DELETE") {
        return jsonResponse({ body: storedMetadata });
      }
      return jsonResponse({
        status: 500,
        body: {
          schemaVersion: "ghostos.blob_failure.v1",
          code: "storage_unavailable",
          retryable: true,
          safeMessage: "Unexpected request.",
          correlationId: "corr-a",
        },
      });
    });
    const adapter = createLeafServerBlobStorageAdapter({
      baseUrl: "https://www.leafgon.com",
      fetchImpl,
      operationIdFactory: () => "operation-00000001",
    });
    const context = createContext({
      blobStorageAdapter: adapter,
      blobOperationIdFactory: () => "operation-00000001",
    });

    const stored = await executeBlobStoreBottle(
      storeBottle({
        payloadRef: {
          kind: "runtime-file-ref",
          ref: "runtime-ref-a",
        },
      }),
      context,
    );
    await adapter.getObject({
      tenantId: context.tenantId,
      graphDomainId: context.graphDomainId,
      graphAppId: context.graphAppId,
      blobElementId: stored.blobElementId,
      objectId: stored.objectId,
      correlationId: context.correlationId,
    });
    await adapter.deleteObject({
      tenantId: context.tenantId,
      graphDomainId: context.graphDomainId,
      graphAppId: context.graphAppId,
      blobElementId: stored.blobElementId,
      objectId: stored.objectId,
      expectedAssetRevision: stored.assetRevision,
      correlationId: context.correlationId,
    });

    expect(stored).toEqual(storedMetadata);
    const urls = fetchImpl.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      "https://www.leafgon.com/api/v1/blob-storage/objects/domain-a/app-a/blob-node-uuid/logo",
      "https://www.leafgon.com/api/v1/blob-storage/runtime-file-refs/runtime-ref-a:resolve",
      "https://www.leafgon.com/api/v1/blob-storage/objects/domain-a/app-a/blob-node-uuid/logo",
      "https://www.leafgon.com/api/v1/blob-storage/objects/domain-a/app-a/blob-node-uuid/logo",
      "https://www.leafgon.com/api/v1/blob-storage/objects/domain-a/app-a/blob-node-uuid/logo",
    ]);
    expect(urls.some((url) => url.includes("/_leafgon/api/v1/page-assets/"))).toBe(false);

    const putBody = JSON.parse(fetchImpl.mock.calls[2][1].body);
    expect(putBody).toMatchObject({
      contentType: "image/png",
      contentLength: 12345,
      contentHash: HASH_A,
      operation: "create",
      correlationId: "corr-a",
    });
    expect(putBody).not.toHaveProperty("tenantId");
    expect(putBody).not.toHaveProperty("actorRef");
    expect(putBody).not.toHaveProperty("storage");
    expect(putBody).not.toHaveProperty("storageAccountName");
    expect(fetchImpl.mock.calls[2][1].headers["Idempotency-Key"]).toBe("operation-00000001");
    expect(fetchImpl.mock.calls[4][1].headers["Idempotency-Key"]).toBe("operation-00000001");
  });

  it("keeps mutation IDs stable across transport retries and rejects unsafe metadata", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ body: { assetRevision: 1 } }));
    const operationIdFactory = vi
      .fn()
      .mockReturnValueOnce("operation-00000001")
      .mockReturnValueOnce("operation-00000002");
    const adapter = createLeafServerBlobStorageAdapter({ fetchImpl, operationIdFactory });
    const putCommand = {
      graphDomainId: "domain-a",
      graphAppId: "app-a",
      blobElementId: "blob-node-uuid",
      objectId: "logo",
      contentType: "image/png",
      contentLength: 12345,
      contentHash: HASH_A,
      payloadRef: { kind: "temp-file", ref: "runtime-ref-a" },
      operation: "create",
    };

    await adapter.putObject(putCommand);
    await adapter.putObject(putCommand);
    await adapter.putObject({ ...putCommand });

    expect(fetchImpl.mock.calls.map(([, request]) => request.headers["Idempotency-Key"])).toEqual([
      "operation-00000001",
      "operation-00000001",
      "operation-00000002",
    ]);
    expect(operationIdFactory).toHaveBeenCalledTimes(2);
    expect(() => normalizeIdempotencyKey("short")).toThrowError(
      expect.objectContaining({ code: "invalid_idempotency_key" }),
    );
    await expect(
      adapter.putObject({ ...putCommand, idempotencyKey: "contains spaces 000" }),
    ).rejects.toMatchObject({ code: "invalid_idempotency_key" });
    await expect(adapter.deleteObject({ ...putCommand })).rejects.toMatchObject({
      code: "missing_expected_asset_revision",
    });
  });

  it("requests list pages then enriches items through the contract list route", async () => {
    const fetchImpl = vi.fn(async (_url, request) => {
      if (request.method === "GET") {
        return jsonResponse({
          body: {
            schemaVersion: "ghostos.blob_data_file_page.v1",
            items: [
              {
                schemaVersion: "ghostos.blob_data_file.v1",
                blobElementId: "blob-node-uuid",
                objectId: "logo",
                objectType: "file",
                contentType: "image/png",
                contentLength: 123,
                contentHash: HASH_A,
              },
            ],
            nextCursor: null,
          },
        });
      }
      return jsonResponse({
        body: {
          schemaVersion: "ghostos.blob_list_file.v1",
          blobElementId: "blob-node-uuid",
          items: [
            {
              objectId: "logo",
              assetUrls: [
                "https://assets.leafgon.com/_leafgon/api/v1/page-assets/@page/storage/logo",
              ],
              objectMetadata: {
                schemaVersion: "leafgon.blob_asset_object_metadata.v1",
                objectId: "logo",
              },
            },
          ],
        },
      });
    });
    const adapter = createLeafServerBlobStorageAdapter({ fetchImpl });

    const page = await adapter.listObjects({
      tenantId: "tenant-a",
      graphDomainId: "domain-a",
      graphAppId: "app-a",
      blobElementId: "blob-node-uuid",
      limit: 25,
      cursor: "opaque+cursor",
      correlationId: "corr-a",
    });

    expect(page).toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [
        {
          objectId: "logo",
          assetUrls: ["https://assets.leafgon.com/_leafgon/api/v1/page-assets/@page/storage/logo"],
          objectMetadata: {
            schemaVersion: "leafgon.blob_asset_object_metadata.v1",
            objectId: "logo",
          },
        },
      ],
      nextCursor: null,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/v1/blob-storage/objects/domain-a/app-a/blob-node-uuid?limit=25&cursor=opaque%2Bcursor",
      { method: "GET", credentials: "include" },
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/v1/blob-storage/objects/domain-a/app-a/blob-node-uuid:list",
      {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "ghostos.blob_list_bottle.v1",
          objectIds: ["logo"],
          correlationId: "corr-a",
        }),
      },
    );
  });

  it("falls back to plain list pages when list contract enrichment fails", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          body: {
            schemaVersion: "ghostos.blob_data_file_page.v1",
            items: [{ objectId: "logo", contentHash: HASH_A }],
            nextCursor: null,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          status: 404,
          body: {
            schemaVersion: "ghostos.blob_failure.v1",
            code: "missing_object",
            retryable: false,
            safeMessage: "Missing object.",
          },
        }),
      );
    const adapter = createLeafServerBlobStorageAdapter({ fetchImpl });

    await expect(
      adapter.listObjects({
        tenantId: "tenant-a",
        graphDomainId: "domain-a",
        graphAppId: "app-a",
        blobElementId: "blob-node-uuid",
        limit: 10,
      }),
    ).resolves.toMatchObject({
      schemaVersion: "ghostos.blob_data_file_page.v1",
      items: [{ objectId: "logo", contentHash: HASH_A }],
      nextCursor: null,
    });
  });

  it("returns metadata for leaf-server HEAD responses and typed failures for denied responses", async () => {
    const adapter = createLeafServerBlobStorageAdapter({
      fetchImpl: vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            status: 200,
            headers: {
              "x-blob-content-hash": HASH_A,
              "x-blob-content-type": "image/png",
              "x-blob-content-length": "12345",
              "x-blob-asset-revision": "7",
              etag: "etag-7",
              "last-modified": "2026-07-26T00:00:00Z",
            },
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            status: 403,
            body: {
              schemaVersion: "ghostos.blob_failure.v1",
              code: "storage_denied",
              retryable: false,
              safeMessage: "Page access is denied.",
              correlationId: "corr-a",
            },
          }),
        ),
    });

    await expect(
      adapter.headObject({
        graphDomainId: "domain-a",
        graphAppId: "app-a",
        blobElementId: "blob-node-uuid",
        objectId: "logo",
      }),
    ).resolves.toMatchObject({
      schemaVersion: "ghostos.blob_data_file.v1",
      objectId: "logo",
      contentHash: HASH_A,
      assetRevision: 7,
    });
    await expect(
      adapter.getObject({
        graphDomainId: "domain-a",
        graphAppId: "app-a",
        blobElementId: "blob-node-uuid",
        objectId: "logo",
      }),
    ).rejects.toMatchObject({ code: "storage_denied" });
  });
});

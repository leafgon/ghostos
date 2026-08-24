import { Observable, Subject, from, of } from "rxjs";
import { concatMap, map, share, startWith, withLatestFrom } from "rxjs/operators";

const STORE_SCHEMA_VERSION = "ghostos.blob_store_bottle.v1";
const FETCH_SCHEMA_VERSION = "ghostos.blob_fetch_bottle.v1";
const LIST_SCHEMA_VERSION = "ghostos.blob_list_bottle.v1";
const DATA_FILE_SCHEMA_VERSION = "ghostos.blob_data_file.v1";
const DATA_FILE_PAGE_SCHEMA_VERSION = "ghostos.blob_data_file_page.v1";
const FAILURE_SCHEMA_VERSION = "ghostos.blob_failure.v1";
const DEFAULT_MAX_OBJECT_BYTES = 10 * 1024 * 1024;
const DEFAULT_BLOB_LIST_LIMIT = 50;
const MAX_BLOB_LIST_LIMIT = 100;
const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const HASH_RE = /^sha256:[0-9a-f]{64}$/i;
const OBJECT_ID_RE = /^[A-Za-z0-9._~-]+$/;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._~-]{16,128}$/;

const ALLOWED_CONTENT_TYPES = Object.freeze([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/html",
  "text/plain",
  "text/css",
  "text/javascript",
  "application/json",
  "application/javascript",
  "application/pdf",
  "font/woff2",
]);

const FAILURE_MESSAGES = Object.freeze({
  invalid_object_id: "Object ID is not allowed.",
  reserved_object_id: "Object ID is reserved.",
  path_traversal: "Object ID must be a single safe path segment.",
  unsupported_content_type: "Content type is not allowed.",
  oversized_object: "Object exceeds the configured size limit.",
  hash_mismatch: "Object content hash did not match the expected hash.",
  duplicate_object_id: "Object ID already exists.",
  asset_revision_mismatch: "Asset revision did not match.",
  missing_object: "Object was not found.",
  storage_unavailable: "Blob storage is unavailable.",
  storage_denied: "Blob storage denied the operation.",
  invalid_payload_ref: "Payload reference is invalid.",
  missing_execution_context: "Blob execution context is missing.",
  invalid_blob_bottle: "Blob bottle is invalid.",
  invalid_idempotency_key: "Idempotency key is invalid.",
  missing_expected_asset_revision: "Expected asset revision is required.",
});

class BlobRuntimeError extends Error {
  constructor(code, message = FAILURE_MESSAGES[code] ?? "Blob operation failed.", options = {}) {
    super(message);
    this.name = "BlobRuntimeError";
    this.code = code;
    this.retryable = options.retryable === true;
    this.details = options.details ?? {};
  }
}

const isPlainObject = (value) => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
};

const isFailure = (value) => value?.schemaVersion === FAILURE_SCHEMA_VERSION;

const unwrapBottle = (value) => {
  if (value && typeof value === "object" && "_content" in value && "_bname" in value) {
    return value._content;
  }
  return value;
};

const createBlobFailure = (
  code,
  { retryable = false, safeMessage = FAILURE_MESSAGES[code], correlationId } = {},
) => ({
  schemaVersion: FAILURE_SCHEMA_VERSION,
  code,
  retryable,
  safeMessage: safeMessage ?? FAILURE_MESSAGES[code] ?? "Blob operation failed.",
  correlationId,
});

const asRuntimeError = (error) => {
  if (error instanceof BlobRuntimeError) {
    return error;
  }
  if (isFailure(error)) {
    return new BlobRuntimeError(error.code, error.safeMessage, {
      retryable: error.retryable,
    });
  }
  return new BlobRuntimeError("storage_unavailable", FAILURE_MESSAGES.storage_unavailable, {
    retryable: true,
  });
};

const failureFromError = (error, correlationId) => {
  const runtimeError = asRuntimeError(error);
  return createBlobFailure(runtimeError.code, {
    retryable: runtimeError.retryable,
    safeMessage: runtimeError.message,
    correlationId,
  });
};

const isSafeInteger = (value) => Number.isSafeInteger(value) && value >= 0;

const normalizeIdempotencyKey = (value) => {
  if (typeof value !== "string" || !IDEMPOTENCY_KEY_RE.test(value)) {
    throw new BlobRuntimeError("invalid_idempotency_key");
  }
  return value;
};

const defaultBlobOperationIdFactory = () => {
  const operationId = globalThis.crypto?.randomUUID?.();
  if (!operationId) {
    throw new BlobRuntimeError("storage_unavailable", "UUID generation is unavailable.", {
      retryable: true,
    });
  }
  return operationId;
};

const assertHash = (contentHash) => {
  if (typeof contentHash !== "string" || !HASH_RE.test(contentHash)) {
    throw new BlobRuntimeError("hash_mismatch", "Content hash must be sha256:<64 hex>.");
  }
  return contentHash.toLowerCase();
};

const resolveObjectIdFailure = (value) => {
  if (typeof value !== "string") {
    return "invalid_object_id";
  }
  const objectId = value.trim();
  if (!objectId || objectId !== value || objectId === ".") {
    return "invalid_object_id";
  }
  if (
    objectId === ".." ||
    objectId.includes("/") ||
    objectId.includes("\\") ||
    /%2e|%2f|%5c/i.test(objectId)
  ) {
    return "path_traversal";
  }
  const hasControlOrWhitespace = [...objectId].some((char) => {
    const codePoint = char.codePointAt(0);
    return codePoint <= 31 || codePoint === 127 || /\s/.test(char);
  });
  if (hasControlOrWhitespace || !OBJECT_ID_RE.test(objectId)) {
    return "invalid_object_id";
  }
  if (objectId.toLowerCase().startsWith("_leafgon")) {
    return "reserved_object_id";
  }
  return undefined;
};

const normalizeBlobObjectId = (value) => {
  const failureCode = resolveObjectIdFailure(value);
  if (failureCode) {
    throw new BlobRuntimeError(failureCode);
  }
  return value.trim();
};

const bytesToHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const hexToBytes = (hex) => {
  const bytes = [];
  for (let index = 0; index < hex.length; index += 2) {
    bytes.push(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  return bytes;
};

const base32Lower = (bytes) => {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
};

const sha256Hex = async (value) => {
  const cryptoImpl = globalThis.crypto;
  if (!cryptoImpl?.subtle) {
    throw new BlobRuntimeError("storage_unavailable", "SHA-256 is unavailable.", {
      retryable: true,
    });
  }
  const digest = await cryptoImpl.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
};

const assignDeterministicObjectId = async ({ contentHash, contentType, contentLength }) => {
  const seed = `${contentHash}\n${contentType}\n${contentLength}`;
  const digestHex = await sha256Hex(seed);
  return base32Lower(hexToBytes(digestHex)).slice(0, 32);
};

const normalizeContentType = (contentType) => {
  if (typeof contentType !== "string") {
    throw new BlobRuntimeError("unsupported_content_type");
  }
  const normalized = contentType.trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.includes(normalized)) {
    throw new BlobRuntimeError("unsupported_content_type");
  }
  return normalized;
};

const resolveMaxObjectBytes = (executionContext) => {
  const configured =
    executionContext?.maxBlobObjectBytes ?? executionContext?.blobStorageAdapter?.maxObjectBytes;
  if (configured === undefined || configured === null) {
    return DEFAULT_MAX_OBJECT_BYTES;
  }
  const parsed = Number.parseInt(`${configured}`, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return DEFAULT_MAX_OBJECT_BYTES;
  }
  return Math.min(parsed, DEFAULT_MAX_OBJECT_BYTES);
};

const validateContentLength = (contentLength, maxObjectBytes) => {
  if (!isSafeInteger(contentLength)) {
    throw new BlobRuntimeError("oversized_object");
  }
  if (contentLength > maxObjectBytes) {
    throw new BlobRuntimeError("oversized_object");
  }
  return contentLength;
};

const requireBlobExecutionContext = (executionContext) => {
  const adapter = executionContext?.blobStorageAdapter;
  const missing =
    !executionContext?.tenantId ||
    !executionContext?.graphDomainId ||
    !executionContext?.graphAppId ||
    !executionContext?.actorRef ||
    !executionContext?.correlationId ||
    !adapter ||
    ["resolveRuntimeFileRef", "putObject", "getObject", "headObject", "deleteObject"].some(
      (method) => typeof adapter?.[method] !== "function",
    );
  if (missing) {
    throw new BlobRuntimeError("missing_execution_context");
  }
  return executionContext;
};

const resolveBlobExecutionContext = (streamCache, controlflow = {}) => {
  const config = controlflow?._config ?? {};
  return (
    config.blobExecutionContext ??
    config.runtimeContext?.blobExecutionContext ??
    config.runtimeContext ??
    streamCache?.runtimeContext ??
    streamCache?.blobExecutionContext
  );
};

const callStorage = async (method, adapter, input) => {
  try {
    const result = await adapter[method](input);
    if (isFailure(result)) {
      throw new BlobRuntimeError(result.code, result.safeMessage, {
        retryable: result.retryable,
      });
    }
    return result;
  } catch (error) {
    throw asRuntimeError(error);
  }
};

const tryHeadObject = async (adapter, input) => {
  try {
    return await callStorage("headObject", adapter, input);
  } catch (error) {
    const runtimeError = asRuntimeError(error);
    if (runtimeError.code === "missing_object") {
      return undefined;
    }
    throw runtimeError;
  }
};

const normalizeBlobMetadata = (metadata, { blobElementId, objectId }) => {
  if (!isPlainObject(metadata)) {
    throw new BlobRuntimeError("storage_unavailable", "Blob storage returned invalid metadata.", {
      retryable: true,
    });
  }
  return {
    schemaVersion: DATA_FILE_SCHEMA_VERSION,
    blobElementId: metadata.blobElementId ?? blobElementId,
    objectId: metadata.objectId ?? objectId,
    objectType: metadata.objectType ?? "file",
    contentType: metadata.contentType,
    contentLength: metadata.contentLength,
    contentHash: metadata.contentHash,
    storage: metadata.storage,
    etag: metadata.etag,
    assetRevision: metadata.assetRevision,
    lastModifiedAt: metadata.lastModifiedAt,
  };
};

const commonStorageInput = (executionContext, bottle, objectId) => ({
  tenantId: executionContext.tenantId,
  graphDomainId: executionContext.graphDomainId,
  graphAppId: executionContext.graphAppId,
  actorRef: executionContext.actorRef,
  blobElementId: bottle.blobElementId,
  objectId,
  correlationId: executionContext.correlationId,
});

const executeBlobStoreBottle = async (rawBottle, executionContext) => {
  try {
    const bottle = unwrapBottle(rawBottle);
    requireBlobExecutionContext(executionContext);
    if (!isPlainObject(bottle) || bottle.schemaVersion !== STORE_SCHEMA_VERSION) {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    const operation = bottle.operation ?? "create";
    if (!["create", "overwrite"].includes(operation)) {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    if (typeof bottle.blobElementId !== "string" || bottle.blobElementId.trim() === "") {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    const contentType = normalizeContentType(bottle.contentType);
    const contentHash = assertHash(bottle.contentHash);
    const contentLength = validateContentLength(
      bottle.contentLength,
      resolveMaxObjectBytes(executionContext),
    );
    if (!isPlainObject(bottle.payloadRef) || !bottle.payloadRef.kind) {
      throw new BlobRuntimeError("invalid_payload_ref");
    }
    if (operation === "overwrite" && bottle.expectedAssetRevision === undefined) {
      throw new BlobRuntimeError("asset_revision_mismatch");
    }

    const requestedObjectId =
      bottle.requestedObjectId === undefined
        ? undefined
        : normalizeBlobObjectId(bottle.requestedObjectId);
    if (operation === "overwrite" && requestedObjectId === undefined) {
      throw new BlobRuntimeError("invalid_object_id");
    }
    const objectId =
      requestedObjectId ??
      (await assignDeterministicObjectId({ contentHash, contentType, contentLength }));

    let payloadRef = bottle.payloadRef;
    const adapter = executionContext.blobStorageAdapter;
    const baseInput = commonStorageInput(executionContext, bottle, objectId);
    const idempotencyKey = normalizeIdempotencyKey(
      executionContext.blobOperationIdFactory?.() ?? defaultBlobOperationIdFactory(),
    );
    const existing = await tryHeadObject(adapter, baseInput);

    if (operation === "create" && existing) {
      if (!requestedObjectId && existing.contentHash === contentHash) {
        return normalizeBlobMetadata(existing, { blobElementId: bottle.blobElementId, objectId });
      }
      throw new BlobRuntimeError("duplicate_object_id");
    }
    if (operation === "overwrite") {
      if (!existing) {
        throw new BlobRuntimeError("missing_object");
      }
      if (existing.assetRevision !== bottle.expectedAssetRevision) {
        throw new BlobRuntimeError("asset_revision_mismatch");
      }
    }

    if (payloadRef.kind === "runtime-file-ref") {
      const resolved = await callStorage("resolveRuntimeFileRef", adapter, {
        ref: payloadRef.ref,
        tenantId: executionContext.tenantId,
        graphDomainId: executionContext.graphDomainId,
        graphAppId: executionContext.graphAppId,
        blobElementId: bottle.blobElementId,
        contentHash,
        correlationId: executionContext.correlationId,
      });
      if (resolved?.contentHash && resolved.contentHash !== contentHash) {
        throw new BlobRuntimeError("hash_mismatch");
      }
      payloadRef = resolved.payloadRef ?? resolved;
    }

    const stored = await callStorage("putObject", adapter, {
      ...baseInput,
      contentType,
      contentLength,
      contentHash,
      payloadRef,
      operation,
      idempotencyKey,
      expectedAssetRevision: bottle.expectedAssetRevision,
    });
    if (stored.contentHash && stored.contentHash !== contentHash) {
      throw new BlobRuntimeError("hash_mismatch");
    }
    return normalizeBlobMetadata(stored, { blobElementId: bottle.blobElementId, objectId });
  } catch (error) {
    return failureFromError(error, executionContext?.correlationId);
  }
};

const executeBlobFetchBottle = async (rawBottle, executionContext) => {
  try {
    const bottle = unwrapBottle(rawBottle);
    requireBlobExecutionContext(executionContext);
    if (!isPlainObject(bottle) || bottle.schemaVersion !== FETCH_SCHEMA_VERSION) {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    if (typeof bottle.blobElementId !== "string" || bottle.blobElementId.trim() === "") {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    const objectId = normalizeBlobObjectId(bottle.objectId);
    const fetched = await callStorage("getObject", executionContext.blobStorageAdapter, {
      ...commonStorageInput(executionContext, bottle, objectId),
      expectedAssetRevision: bottle.expectedAssetRevision,
      expectedContentHash: bottle.expectedContentHash,
    });
    if (
      bottle.expectedAssetRevision !== undefined &&
      fetched.assetRevision !== bottle.expectedAssetRevision
    ) {
      throw new BlobRuntimeError("asset_revision_mismatch");
    }
    if (
      bottle.expectedContentHash !== undefined &&
      fetched.contentHash !== bottle.expectedContentHash
    ) {
      throw new BlobRuntimeError("hash_mismatch");
    }
    return normalizeBlobMetadata(fetched, { blobElementId: bottle.blobElementId, objectId });
  } catch (error) {
    return failureFromError(error, executionContext?.correlationId);
  }
};

const executeBlobListBottle = async (rawBottle, executionContext) => {
  try {
    const bottle = unwrapBottle(rawBottle);
    requireBlobExecutionContext(executionContext);
    if (!isPlainObject(bottle) || bottle.schemaVersion !== LIST_SCHEMA_VERSION) {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    if (typeof bottle.blobElementId !== "string" || bottle.blobElementId.trim() === "") {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    const limit = bottle.limit ?? DEFAULT_BLOB_LIST_LIMIT;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_BLOB_LIST_LIMIT) {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    if (
      bottle.cursor !== undefined &&
      bottle.cursor !== null &&
      (typeof bottle.cursor !== "string" || bottle.cursor.length === 0)
    ) {
      throw new BlobRuntimeError("invalid_blob_bottle");
    }
    const adapter = executionContext.blobStorageAdapter;
    if (typeof adapter.listObjects !== "function") {
      throw new BlobRuntimeError("missing_execution_context");
    }
    const page = await callStorage("listObjects", adapter, {
      tenantId: executionContext.tenantId,
      graphDomainId: executionContext.graphDomainId,
      graphAppId: executionContext.graphAppId,
      actorRef: executionContext.actorRef,
      blobElementId: bottle.blobElementId,
      correlationId: executionContext.correlationId,
      limit,
      cursor: bottle.cursor,
    });
    if (!isPlainObject(page) || !Array.isArray(page.items)) {
      throw new BlobRuntimeError("storage_unavailable");
    }
    return {
      schemaVersion: DATA_FILE_PAGE_SCHEMA_VERSION,
      items: page.items.map((item) =>
        normalizeBlobMetadata(item, {
          blobElementId: bottle.blobElementId,
          objectId: item?.objectId,
        }),
      ),
      nextCursor: page.nextCursor ?? null,
    };
  } catch (error) {
    return failureFromError(error, executionContext?.correlationId);
  }
};

const resolveLeafServerBlobStorageUrl = ({ baseUrl = "", path }) => {
  const normalizedBase = `${baseUrl ?? ""}`.replace(/\/+$/, "");
  const normalizedPath = `${path ?? ""}`.replace(/^\/+/, "");
  if (!normalizedBase) {
    return `/${normalizedPath}`;
  }
  return `${normalizedBase}/${normalizedPath}`;
};

const encodeLeafServerPathSegment = (value) => encodeURIComponent(`${value ?? ""}`);

const leafServerObjectPath = ({ graphDomainId, graphAppId, blobElementId, objectId }) =>
  [
    "api/v1/blob-storage/objects",
    encodeLeafServerPathSegment(graphDomainId),
    encodeLeafServerPathSegment(graphAppId),
    encodeLeafServerPathSegment(blobElementId),
    encodeLeafServerPathSegment(objectId),
  ].join("/");

const leafServerObjectCollectionPath = ({ graphDomainId, graphAppId, blobElementId }) =>
  [
    "api/v1/blob-storage/objects",
    encodeLeafServerPathSegment(graphDomainId),
    encodeLeafServerPathSegment(graphAppId),
    encodeLeafServerPathSegment(blobElementId),
  ].join("/");

const leafServerJsonRequest = (body) => ({
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
});

const parseLeafServerBlobFailure = async (response) => {
  try {
    const payload = await response.json();
    if (isFailure(payload)) {
      return payload;
    }
    return createBlobFailure("storage_unavailable", {
      retryable: response?.status >= 500,
      safeMessage: payload?.error?.message,
    });
  } catch (_error) {
    return createBlobFailure("storage_unavailable", {
      retryable: response?.status >= 500,
    });
  }
};

const parseLeafServerHeadFailure = (response) => {
  if (response?.status === 404) {
    return createBlobFailure("missing_object");
  }
  if (response?.status === 401 || response?.status === 403) {
    return createBlobFailure("storage_denied");
  }
  return createBlobFailure("storage_unavailable", {
    retryable: response?.status >= 500,
  });
};

const readLeafServerBlobJson = async (response) => {
  const payload = await response.json();
  if (isFailure(payload)) {
    throw new BlobRuntimeError(payload.code, payload.safeMessage, {
      retryable: payload.retryable,
    });
  }
  return payload;
};

const requireLeafServerFetch = (fetchImpl) => {
  if (typeof fetchImpl !== "function") {
    throw new BlobRuntimeError("missing_execution_context", "Leaf-server blob fetch is missing.");
  }
  return fetchImpl;
};

const createLeafServerHeadMetadata = (input, response) => {
  const headers = response?.headers;
  const header = (name) =>
    typeof headers?.get === "function"
      ? (headers.get(name) ?? headers.get(name.toLowerCase()))
      : undefined;
  const revision = Number.parseInt(header("x-blob-asset-revision") ?? "", 10);
  const length = Number.parseInt(header("x-blob-content-length") ?? "", 10);
  return {
    schemaVersion: DATA_FILE_SCHEMA_VERSION,
    blobElementId: input.blobElementId,
    objectId: input.objectId,
    objectType: "file",
    contentType: header("x-blob-content-type"),
    contentLength: Number.isSafeInteger(length) ? length : undefined,
    contentHash: header("x-blob-content-hash"),
    storage: undefined,
    etag: header("etag"),
    assetRevision: Number.isSafeInteger(revision) ? revision : undefined,
    lastModifiedAt: header("last-modified"),
  };
};

const requestLeafServerBlobStorage = async ({
  baseUrl,
  credentials,
  fetchImpl,
  method,
  path,
  body,
  headers,
}) => {
  const request = {
    method,
    credentials,
  };
  if (body !== undefined) {
    Object.assign(request, leafServerJsonRequest(body));
  }
  if (headers !== undefined) {
    request.headers = { ...(request.headers ?? {}), ...headers };
  }
  const response = await fetchImpl(resolveLeafServerBlobStorageUrl({ baseUrl, path }), request);
  if (!response?.ok) {
    throw asRuntimeError(await parseLeafServerBlobFailure(response));
  }
  return response;
};

const createLeafServerBlobStorageAdapter = ({
  baseUrl = "",
  fetchImpl = globalThis.fetch,
  credentials = "include",
  operationIdFactory = defaultBlobOperationIdFactory,
} = {}) => {
  const resolvedFetch = requireLeafServerFetch(fetchImpl);
  const operationIds = new WeakMap();
  const resolveMutationId = (input) => {
    if (!isPlainObject(input)) {
      throw new BlobRuntimeError("invalid_idempotency_key");
    }
    const explicit = input.idempotencyKey;
    if (explicit !== undefined) {
      return normalizeIdempotencyKey(explicit);
    }
    const existing = operationIds.get(input);
    if (existing) {
      return existing;
    }
    const generated = normalizeIdempotencyKey(operationIdFactory());
    operationIds.set(input, generated);
    return generated;
  };
  return {
    resolveRuntimeFileRef: async (input) => {
      const ref = encodeLeafServerPathSegment(input.ref);
      const response = await requestLeafServerBlobStorage({
        baseUrl,
        credentials,
        fetchImpl: resolvedFetch,
        method: "POST",
        path: `api/v1/blob-storage/runtime-file-refs/${ref}:resolve`,
        body: {
          graphDomainId: input.graphDomainId,
          graphAppId: input.graphAppId,
          blobElementId: input.blobElementId,
          contentHash: input.contentHash,
          correlationId: input.correlationId,
        },
      });
      return readLeafServerBlobJson(response);
    },
    headObject: async (input) => {
      const path = leafServerObjectPath(input);
      const response = await resolvedFetch(resolveLeafServerBlobStorageUrl({ baseUrl, path }), {
        method: "HEAD",
        credentials,
      });
      if (!response?.ok) {
        throw asRuntimeError(parseLeafServerHeadFailure(response));
      }
      return createLeafServerHeadMetadata(input, response);
    },
    putObject: async (input) => {
      const idempotencyKey = resolveMutationId(input);
      const response = await requestLeafServerBlobStorage({
        baseUrl,
        credentials,
        fetchImpl: resolvedFetch,
        method: "PUT",
        path: leafServerObjectPath(input),
        headers: { "Idempotency-Key": idempotencyKey },
        body: {
          contentType: input.contentType,
          contentLength: input.contentLength,
          contentHash: input.contentHash,
          payloadRef: input.payloadRef,
          operation: input.operation,
          expectedAssetRevision: input.expectedAssetRevision,
          correlationId: input.correlationId,
        },
      });
      return readLeafServerBlobJson(response);
    },
    getObject: async (input) => {
      const response = await requestLeafServerBlobStorage({
        baseUrl,
        credentials,
        fetchImpl: resolvedFetch,
        method: "GET",
        path: leafServerObjectPath(input),
      });
      return readLeafServerBlobJson(response);
    },
    listObjects: async (input) => {
      const query = [`limit=${encodeURIComponent(input.limit)}`];
      if (input.cursor) {
        query.push(`cursor=${encodeURIComponent(input.cursor)}`);
      }
      const response = await requestLeafServerBlobStorage({
        baseUrl,
        credentials,
        fetchImpl: resolvedFetch,
        method: "GET",
        path: `${leafServerObjectCollectionPath(input)}?${query.join("&")}`,
      });
      return readLeafServerBlobJson(response);
    },
    deleteObject: async (input) => {
      if (!Number.isSafeInteger(input?.expectedAssetRevision) || input.expectedAssetRevision < 1) {
        throw new BlobRuntimeError("missing_expected_asset_revision");
      }
      const idempotencyKey = resolveMutationId(input);
      const response = await requestLeafServerBlobStorage({
        baseUrl,
        credentials,
        fetchImpl: resolvedFetch,
        method: "DELETE",
        path: leafServerObjectPath(input),
        headers: { "Idempotency-Key": idempotencyKey },
        body: {
          expectedAssetRevision: input.expectedAssetRevision,
          correlationId: input.correlationId,
        },
      });
      return readLeafServerBlobJson(response);
    },
  };
};

const executeBlobBottle = async (bottle, executionContext) => {
  const content = unwrapBottle(bottle);
  if (content?.schemaVersion === STORE_SCHEMA_VERSION) {
    return executeBlobStoreBottle(content, executionContext);
  }
  if (content?.schemaVersion === FETCH_SCHEMA_VERSION) {
    return executeBlobFetchBottle(content, executionContext);
  }
  if (content?.schemaVersion === LIST_SCHEMA_VERSION) {
    return executeBlobListBottle(content, executionContext);
  }
  return createBlobFailure("invalid_blob_bottle", {
    correlationId: executionContext?.correlationId,
  });
};

const createMetadata = (input, revision) => ({
  schemaVersion: DATA_FILE_SCHEMA_VERSION,
  blobElementId: input.blobElementId,
  objectId: input.objectId,
  objectType: "file",
  contentType: input.contentType,
  contentLength: input.contentLength,
  contentHash: input.contentHash,
  storage: {
    accountName: input.accountName,
    containerName: input.containerName,
    blobName: input.blobName,
  },
  etag: `etag-${revision}`,
  assetRevision: revision,
  lastModifiedAt: new Date(revision * 1000).toISOString(),
});

const createInMemoryBlobStorageAdapter = ({
  accountName = "test-account",
  containerName = "test-container",
  maxObjectBytes = DEFAULT_MAX_OBJECT_BYTES,
} = {}) => {
  const objects = new Map();
  const runtimeRefs = new Map();
  const executionCounts = {
    resolveRuntimeFileRef: 0,
    putObject: 0,
    getObject: 0,
    listObjects: 0,
    headObject: 0,
    deleteObject: 0,
  };
  const keyFor = ({ tenantId, graphDomainId, graphAppId, blobElementId, objectId }) =>
    [tenantId, graphDomainId, graphAppId, blobElementId, objectId].join("/");
  const blobNameFor = ({ tenantId, graphDomainId, graphAppId, blobElementId, objectId }) =>
    `${tenantId}/${graphDomainId}/${graphAppId}/${blobElementId}/${objectId}`;

  return {
    maxObjectBytes,
    executionCounts,
    getExecutionCounts: () => ({ ...executionCounts }),
    registerRuntimeFileRef: (ref, payloadRef) => {
      runtimeRefs.set(ref, { ...payloadRef, consumed: false });
    },
    resolveRuntimeFileRef: async (input) => {
      executionCounts.resolveRuntimeFileRef += 1;
      const entry = runtimeRefs.get(input.ref);
      if (!entry || entry.consumed) {
        throw new BlobRuntimeError("invalid_payload_ref");
      }
      if (entry.tenantId && entry.tenantId !== input.tenantId) {
        throw new BlobRuntimeError("storage_denied");
      }
      if (entry.graphDomainId && entry.graphDomainId !== input.graphDomainId) {
        throw new BlobRuntimeError("storage_denied");
      }
      if (entry.graphAppId && entry.graphAppId !== input.graphAppId) {
        throw new BlobRuntimeError("storage_denied");
      }
      if (entry.blobElementId && entry.blobElementId !== input.blobElementId) {
        throw new BlobRuntimeError("storage_denied");
      }
      if (entry.contentHash && entry.contentHash !== input.contentHash) {
        throw new BlobRuntimeError("invalid_payload_ref");
      }
      entry.consumed = true;
      return {
        kind: entry.kind ?? "temp-file",
        ref: input.ref,
        contentHash: input.contentHash,
      };
    },
    headObject: async (input) => {
      executionCounts.headObject += 1;
      const object = objects.get(keyFor(input));
      if (!object) {
        throw new BlobRuntimeError("missing_object");
      }
      return object;
    },
    putObject: async (input) => {
      executionCounts.putObject += 1;
      const key = keyFor(input);
      const existing = objects.get(key);
      if (input.operation === "create" && existing) {
        throw new BlobRuntimeError("duplicate_object_id");
      }
      if (input.operation === "overwrite" && !existing) {
        throw new BlobRuntimeError("missing_object");
      }
      if (
        input.operation === "overwrite" &&
        input.expectedAssetRevision !== undefined &&
        existing?.assetRevision !== input.expectedAssetRevision
      ) {
        throw new BlobRuntimeError("asset_revision_mismatch");
      }
      const revision = existing ? existing.assetRevision + 1 : 1;
      const metadata = createMetadata(
        {
          ...input,
          accountName,
          containerName,
          blobName: blobNameFor(input),
        },
        revision,
      );
      objects.set(key, metadata);
      return metadata;
    },
    getObject: async (input) => {
      executionCounts.getObject += 1;
      const object = objects.get(keyFor(input));
      if (!object) {
        throw new BlobRuntimeError("missing_object");
      }
      if (
        input.expectedAssetRevision !== undefined &&
        object.assetRevision !== input.expectedAssetRevision
      ) {
        throw new BlobRuntimeError("asset_revision_mismatch");
      }
      if (
        input.expectedContentHash !== undefined &&
        object.contentHash !== input.expectedContentHash
      ) {
        throw new BlobRuntimeError("hash_mismatch");
      }
      return object;
    },
    listObjects: async (input) => {
      executionCounts.listObjects += 1;
      const prefix = keyFor({ ...input, objectId: "" });
      const items = [...objects.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([, object]) => object)
        .sort((left, right) => left.objectId.localeCompare(right.objectId))
        .filter((object) => !input.cursor || object.objectId > input.cursor);
      const pageItems = items.slice(0, input.limit);
      return {
        schemaVersion: DATA_FILE_PAGE_SCHEMA_VERSION,
        items: pageItems,
        nextCursor: items.length > input.limit ? pageItems.at(-1).objectId : null,
      };
    },
    deleteObject: async (input) => {
      executionCounts.deleteObject += 1;
      const key = keyFor(input);
      const object = objects.get(key);
      if (!object) {
        throw new BlobRuntimeError("missing_object");
      }
      if (
        input.expectedAssetRevision !== undefined &&
        object.assetRevision !== input.expectedAssetRevision
      ) {
        throw new BlobRuntimeError("asset_revision_mismatch");
      }
      objects.delete(key);
      return object;
    },
  };
};

const initElementInterface = (streamCache) => {
  const _leaflogic = (input$objArr, controlflow$obj) => {
    const _outflow_data$ = new Subject();
    const inputStreams =
      input$objArr.length === 0
        ? [of(undefined)]
        : input$objArr.map((input) => input._stream.pipe(startWith(undefined)));
    const _ctrl_out$ = controlflow$obj._stream.pipe(
      withLatestFrom(...inputStreams),
      concatMap(([ctrl, ...inputValues]) => {
        const command = inputValues.find((value) => value !== undefined) ?? ctrl;
        const executionContext = resolveBlobExecutionContext(streamCache, controlflow$obj);
        return from(executeBlobBottle(command, executionContext)).pipe(
          map((output) => ({ ctrl, output })),
        );
      }),
      map(({ ctrl, output }) => {
        _outflow_data$.next(output);
        return ctrl;
      }),
      share(),
    );

    const trackedData$ = new Observable((subscriber) => {
      const sub = _outflow_data$.subscribe(subscriber);
      return () => sub.unsubscribe();
    });

    return {
      _stream: trackedData$,
      _control: {
        _stream: _ctrl_out$,
      },
    };
  };

  return {
    leaflogic: _leaflogic,
    datalogic: {
      pre: (dataIn) => dataIn,
      post: (dataIn) => dataIn,
    },
  };
};

const props = initElementInterface;

export {
  ALLOWED_CONTENT_TYPES,
  BlobRuntimeError,
  DATA_FILE_SCHEMA_VERSION,
  DATA_FILE_PAGE_SCHEMA_VERSION,
  DEFAULT_BLOB_LIST_LIMIT,
  DEFAULT_MAX_OBJECT_BYTES,
  FAILURE_SCHEMA_VERSION,
  FETCH_SCHEMA_VERSION,
  LIST_SCHEMA_VERSION,
  MAX_BLOB_LIST_LIMIT,
  STORE_SCHEMA_VERSION,
  assignDeterministicObjectId,
  createBlobFailure,
  createInMemoryBlobStorageAdapter,
  createLeafServerBlobStorageAdapter,
  executeBlobBottle,
  executeBlobFetchBottle,
  executeBlobListBottle,
  executeBlobStoreBottle,
  normalizeBlobObjectId,
  normalizeIdempotencyKey,
  props,
};

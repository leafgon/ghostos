import { Observable, Subject, from, of } from "rxjs";
import { concatMap, map, share, startWith, withLatestFrom } from "rxjs/operators";

import { ElemCacheKeyLUT } from "./index.js";

import { doUnbottle } from "../../datautils/bottling.js";
import { createSafeLogger } from "../../../runtime/safeLogging.js";

const runtimeLogger = createSafeLogger({ component: "leafelement.hippocampus" });

const INTENT_SCHEMA = "hippocampus-element-intent.v1";
const OUTCOME_SCHEMA = "hippocampus-element-outcome.v1";
const SAFE_ERROR_SCHEMA = "hippocampus-safe-error.v1";
const DEFAULT_TIMEOUT_MS = 15000;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
const BOUNDED_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:/#-]*$/;
const CONTRACT_NAME_RE = /^[a-z][a-z0-9-]*\.v[1-9][0-9]*$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OPERATION_TO_FIELDS = Object.freeze({
  configure: Object.freeze([
    "schema",
    "operation",
    "configurationId",
    "configurationDigest",
    "operationRef",
    "expectedAppliedConfigurationDigest",
    "idempotencyKey",
  ]),
  get: Object.freeze([
    "schema",
    "operation",
    "configurationId",
    "configurationDigest",
    "operationRef",
    "input",
  ]),
  query: Object.freeze([
    "schema",
    "operation",
    "configurationId",
    "configurationDigest",
    "operationRef",
    "input",
  ]),
  "semantic-search": Object.freeze([
    "schema",
    "operation",
    "configurationId",
    "configurationDigest",
    "operationRef",
    "input",
  ]),
  command: Object.freeze([
    "schema",
    "operation",
    "configurationId",
    "configurationDigest",
    "operationRef",
    "idempotencyKey",
    "expectedVersions",
    "input",
  ]),
});

const OPERATION_TO_ALLOWED_OPERATION_REFS = Object.freeze({
  configure: new Set(["hippocampus-configure.v1"]),
  get: new Set(["hippocampus-get.v1", "hippocampus-read.v1"]),
  query: new Set(["hippocampus-query.v1"]),
  "semantic-search": new Set(["hippocampus-semantic-search.v1"]),
  command: new Set(["hippocampus-command.v1"]),
});

const SAFE_ERROR_MESSAGES = Object.freeze({
  "malformed-intent": "Intent is malformed.",
  "unsupported-version": "Contract version is not supported.",
  "authorization-denied": "Authorization denied.",
  "scope-mismatch": "Request scope does not match.",
  "configuration-not-applied": "Configuration is not applied.",
  "configuration-conflict": "Applied configuration does not match.",
  "configuration-invalid": "Configuration is invalid.",
  "migration-rejected": "Schema migration was rejected.",
  "lifecycle-conflict": "Expected lifecycle version does not match.",
  "legal-hold-active": "Legal hold prevents this lifecycle operation.",
  "operation-not-configured": "Operation is not configured.",
  "version-conflict": "Expected entity version does not match.",
  "idempotency-conflict": "Idempotency key was reused with different input.",
  "budget-exceeded": "Configured budget is exhausted.",
  "switch-disabled": "Required capability is disabled.",
  "payload-too-large": "Payload exceeds the configured limit.",
  "dependency-unavailable": "Hippocampus dependency is unavailable.",
  timeout: "Hippocampus operation timed out.",
  "result-correlation-mismatch": "Result correlation does not match.",
  "internal-error": "Hippocampus operation failed.",
});

const SAFE_ERROR_CODES = new Set(Object.keys(SAFE_ERROR_MESSAGES));
const RETRYABLE_CODES = new Set(["dependency-unavailable", "timeout", "configuration-not-applied"]);

const FORBIDDEN_INPUT_KEYS = new Set([
  "baseurl",
  "url",
  "endpoint",
  "callback",
  "callbackurl",
  "headers",
  "authorization",
  "credentials",
  "sql",
  "statement",
]);

const cachekeys = {
  CONFIG: "_hippocampus_config",
};

class HippocampusRuntimeError extends Error {
  constructor(
    code,
    message = SAFE_ERROR_MESSAGES[code] ?? SAFE_ERROR_MESSAGES["internal-error"],
    { retryable, details = {} } = {},
  ) {
    super(message);
    this.name = "HippocampusRuntimeError";
    this.code = SAFE_ERROR_CODES.has(code) ? code : "internal-error";
    this.retryable = typeof retryable === "boolean" ? retryable : RETRYABLE_CODES.has(this.code);
    this.details = details;
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

const maybeTrimString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const assertBoundedId = (value, field) => {
  const normalized = maybeTrimString(value);
  if (!normalized || normalized.length > 128 || !BOUNDED_ID_RE.test(normalized)) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field, value },
    });
  }
  return normalized;
};

const assertDigest = (value, field) => {
  const normalized = maybeTrimString(value);
  if (!normalized || !DIGEST_RE.test(normalized)) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field, value },
    });
  }
  return normalized;
};

const assertContractName = (value, field) => {
  const normalized = maybeTrimString(value);
  if (!normalized || normalized.length > 128 || !CONTRACT_NAME_RE.test(normalized)) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field, value },
    });
  }
  return normalized;
};

const assertNoForbiddenInputFields = (value, path = "input") => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      assertNoForbiddenInputFields(entry, `${path}[${index}]`);
    });
    return;
  }
  if (!isPlainObject(value)) {
    return;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    const canonicalKey = `${key}`.trim().toLowerCase();
    if (FORBIDDEN_INPUT_KEYS.has(canonicalKey)) {
      throw new HippocampusRuntimeError("malformed-intent", undefined, {
        details: { field: `${path}.${key}` },
      });
    }
    assertNoForbiddenInputFields(nestedValue, `${path}.${key}`);
  });
};

const normalizeExpectedVersion = (value, index) => {
  if (!isPlainObject(value)) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field: `expectedVersions[${index}]`, value },
    });
  }
  const keys = Object.keys(value);
  if (
    keys.length !== 3 ||
    !keys.every((key) => ["entityRef", "recordRef", "version"].includes(key))
  ) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field: `expectedVersions[${index}]`, value },
    });
  }

  const version = Number.parseInt(`${value.version}`, 10);
  if (!Number.isSafeInteger(version) || version < 0) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field: `expectedVersions[${index}].version`, value: value.version },
    });
  }

  return Object.freeze({
    entityRef: assertBoundedId(value.entityRef, `expectedVersions[${index}].entityRef`),
    recordRef: assertBoundedId(value.recordRef, `expectedVersions[${index}].recordRef`),
    version,
  });
};

const unwrapCommandInput = (input) => {
  const intentBottle = doUnbottle("intent", input);
  if (intentBottle !== undefined) {
    return intentBottle;
  }
  if (isPlainObject(input) && "_bname" in input && "_content" in input) {
    return input._content;
  }
  return input;
};

const normalizeHippocampusIntentCommand = (input = {}) => {
  const raw = unwrapCommandInput(input);
  if (!isPlainObject(raw)) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field: "intent", value: raw },
    });
  }

  const schema = assertBoundedId(raw.schema, "schema");
  if (schema !== INTENT_SCHEMA) {
    throw new HippocampusRuntimeError("unsupported-version", undefined, {
      details: { field: "schema", value: raw.schema },
    });
  }

  const operation = maybeTrimString(raw.operation);
  if (!operation || !(operation in OPERATION_TO_FIELDS)) {
    throw new HippocampusRuntimeError("malformed-intent", undefined, {
      details: { field: "operation", value: raw.operation },
    });
  }

  const allowedFields = OPERATION_TO_FIELDS[operation];
  Object.keys(raw).forEach((field) => {
    if (!allowedFields.includes(field)) {
      throw new HippocampusRuntimeError("malformed-intent", undefined, {
        details: { field },
      });
    }
  });

  const normalized = {
    schema,
    operation,
    configurationId: assertBoundedId(raw.configurationId, "configurationId"),
    configurationDigest: assertDigest(raw.configurationDigest, "configurationDigest"),
    operationRef: assertContractName(raw.operationRef, "operationRef"),
  };

  const allowedOperationRefs = OPERATION_TO_ALLOWED_OPERATION_REFS[operation];
  if (!allowedOperationRefs?.has(normalized.operationRef)) {
    throw new HippocampusRuntimeError("unsupported-version", undefined, {
      details: {
        field: "operationRef",
        value: normalized.operationRef,
        operation,
      },
    });
  }

  if (operation === "configure") {
    normalized.expectedAppliedConfigurationDigest =
      raw.expectedAppliedConfigurationDigest === null
        ? null
        : assertDigest(
            raw.expectedAppliedConfigurationDigest,
            "expectedAppliedConfigurationDigest",
          );
    normalized.idempotencyKey = assertBoundedId(raw.idempotencyKey, "idempotencyKey");
  }

  if (["get", "query", "semantic-search"].includes(operation)) {
    if (!isPlainObject(raw.input)) {
      throw new HippocampusRuntimeError("malformed-intent", undefined, {
        details: { field: "input", value: raw.input },
      });
    }
    assertNoForbiddenInputFields(raw.input);
    normalized.input = JSON.parse(JSON.stringify(raw.input));
  }

  if (operation === "command") {
    normalized.idempotencyKey = assertBoundedId(raw.idempotencyKey, "idempotencyKey");
    if (!Array.isArray(raw.expectedVersions)) {
      throw new HippocampusRuntimeError("malformed-intent", undefined, {
        details: { field: "expectedVersions", value: raw.expectedVersions },
      });
    }
    if (raw.expectedVersions.length > 64) {
      throw new HippocampusRuntimeError("malformed-intent", undefined, {
        details: { field: "expectedVersions.length", value: raw.expectedVersions.length },
      });
    }
    normalized.expectedVersions = raw.expectedVersions.map((entry, index) =>
      normalizeExpectedVersion(entry, index),
    );

    if (!isPlainObject(raw.input)) {
      throw new HippocampusRuntimeError("malformed-intent", undefined, {
        details: { field: "input", value: raw.input },
      });
    }
    assertNoForbiddenInputFields(raw.input);
    normalized.input = JSON.parse(JSON.stringify(raw.input));
  }

  return Object.freeze(normalized);
};

const resolveHippocampusIntentIdempotency = (command) => {
  const normalized = normalizeHippocampusIntentCommand(command);
  if (!["configure", "command"].includes(normalized.operation)) {
    return {
      required: false,
    };
  }
  return {
    required: true,
    key: normalized.idempotencyKey,
    scope: normalized.operationRef,
    domainCommandId: normalized.idempotencyKey,
  };
};

const resolvePositiveInteger = ({ value, field, fallback, min = 1, max = 120000 }) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(`${value}`, 10);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new HippocampusRuntimeError("configuration-invalid", undefined, {
      details: { field, value },
    });
  }
  return parsed;
};

const resolveTransport = ({ transport, config = {}, executionContext = {} } = {}) => {
  const direct = [
    transport,
    config.transport,
    config.executeIntent,
    executionContext.executeIntent,
    executionContext.hippocampusExecuteIntent,
  ].find((candidate) => typeof candidate === "function");
  if (direct) {
    return direct;
  }

  const adapterObject = [
    config.adapter,
    executionContext.adapter,
    executionContext.hippocampusAdapter,
    executionContext.host?.hippocampus,
    executionContext.host,
  ].find((candidate) => isPlainObject(candidate));

  if (typeof adapterObject?.executeIntent === "function") {
    return adapterObject.executeIntent.bind(adapterObject);
  }
  if (typeof adapterObject?.execute === "function") {
    return adapterObject.execute.bind(adapterObject);
  }

  throw new HippocampusRuntimeError("configuration-invalid", undefined, {
    details: { field: "transport" },
  });
};

const normalizeTransportOutcome = (outcome, command, executionContext = {}) => {
  if (!isPlainObject(outcome)) {
    throw new HippocampusRuntimeError("internal-error", undefined, {
      details: { field: "outcome", value: outcome },
    });
  }

  const schema = maybeTrimString(outcome.schema);
  if (schema && schema !== OUTCOME_SCHEMA) {
    throw new HippocampusRuntimeError("unsupported-version", undefined, {
      details: { field: "outcome.schema", value: outcome.schema },
    });
  }

  const bindings = isPlainObject(outcome.bindings) ? outcome.bindings : undefined;
  if (!bindings) {
    throw new HippocampusRuntimeError("result-correlation-mismatch", undefined, {
      details: {
        field: "bindings",
        reason: "missing_bindings",
      },
    });
  }

  const expectedBindings = normalizeOutcomeBindings({ command, executionContext });
  [
    "tenantId",
    "deploymentId",
    "graphDomain",
    "graphApp",
    "spellRef",
    "elementNodeId",
    "configurationDigest",
    "operationRef",
    "requestId",
  ].forEach((field) => {
    const actual = maybeTrimString(bindings[field]);
    const expected = maybeTrimString(expectedBindings[field]);
    if (!actual || !expected || actual !== expected) {
      throw new HippocampusRuntimeError("result-correlation-mismatch", undefined, {
        details: {
          field: `bindings.${field}`,
          expected,
          actual: bindings[field],
        },
      });
    }
  });

  if (!isPlainObject(bindings.profile)) {
    throw new HippocampusRuntimeError("result-correlation-mismatch", undefined, {
      details: {
        field: "bindings.profile",
        reason: "missing_profile",
      },
    });
  }

  [
    "profileSpellRef",
    "profileId",
    "profileVersion",
    "profileDigest",
    "allowlistReleaseId",
    "allowlistManifestDigest",
    "allowlistEntryDigest",
  ].forEach((field) => {
    const actual = maybeTrimString(bindings.profile[field]);
    const expected = maybeTrimString(expectedBindings.profile[field]);
    if (!actual || !expected || actual !== expected) {
      throw new HippocampusRuntimeError("result-correlation-mismatch", undefined, {
        details: {
          field: `bindings.profile.${field}`,
          expected,
          actual: bindings.profile[field],
        },
      });
    }
  });

  const error = isPlainObject(outcome.error) ? outcome.error : undefined;
  if (outcome.ok === false || outcome.status === "failed" || error) {
    const code = SAFE_ERROR_CODES.has(error?.code) ? error.code : "internal-error";
    throw new HippocampusRuntimeError(code, SAFE_ERROR_MESSAGES[code], {
      retryable:
        typeof error?.retryable === "boolean" ? error.retryable : RETRYABLE_CODES.has(code),
      details: {
        outcome,
      },
    });
  }

  return {
    schema: schema ?? OUTCOME_SCHEMA,
    ok: outcome.ok !== false,
    status: maybeTrimString(outcome.status) ?? "returned",
    replayed: outcome.replayed === true,
    bindings,
    versions: Array.isArray(outcome.versions) ? outcome.versions : [],
    result: isPlainObject(outcome.result) ? outcome.result : {},
  };
};

const toRuntimeError = (error) => {
  if (error instanceof HippocampusRuntimeError) {
    return error;
  }
  if (error?.name === "AbortError") {
    return new HippocampusRuntimeError("timeout", undefined, {
      retryable: true,
      details: { reason: error.message },
    });
  }

  const message = maybeTrimString(error?.message);
  const status = Number.parseInt(`${error?.status ?? error?.statusCode ?? ""}`, 10);

  if (SAFE_ERROR_CODES.has(error?.code)) {
    return new HippocampusRuntimeError(error.code, SAFE_ERROR_MESSAGES[error.code], {
      retryable:
        typeof error.retryable === "boolean" ? error.retryable : RETRYABLE_CODES.has(error.code),
      details: { reason: message },
    });
  }

  if ([401, 403].includes(status)) {
    return new HippocampusRuntimeError("authorization-denied", undefined, {
      retryable: false,
      details: { status, reason: message },
    });
  }
  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) {
    return new HippocampusRuntimeError("dependency-unavailable", undefined, {
      retryable: true,
      details: { status, reason: message },
    });
  }
  if (status === 409) {
    return new HippocampusRuntimeError("version-conflict", undefined, {
      retryable: false,
      details: { status, reason: message },
    });
  }

  return new HippocampusRuntimeError("internal-error", undefined, {
    retryable: false,
    details: {
      reason: message,
    },
  });
};

const executeHippocampusIntentCommand = async ({
  command,
  transport,
  config = {},
  executionContext = {},
} = {}) => {
  const normalizedCommand = normalizeHippocampusIntentCommand(command);
  const executeIntent = resolveTransport({ transport, config, executionContext });
  const timeoutMs = resolvePositiveInteger({
    value: config.timeoutMs,
    field: "timeoutMs",
    fallback: DEFAULT_TIMEOUT_MS,
    min: 1,
    max: 120000,
  });

  try {
    const response = await executeIntent({
      intent: normalizedCommand,
      command: normalizedCommand,
      timeoutMs,
      executionContext,
      config,
    });
    if (response && typeof response.json === "function") {
      const jsonBody = await response.json();
      return normalizeTransportOutcome(jsonBody, normalizedCommand, executionContext);
    }
    return normalizeTransportOutcome(response, normalizedCommand, executionContext);
  } catch (error) {
    throw toRuntimeError(error);
  }
};

const defaultUuid = () => "00000000-0000-4000-8000-000000000000";

const defaultDigest = () => `sha256:${"0".repeat(64)}`;

const defaultProfile = () => ({
  profileSpellRef: "breezyforest/hippocampus-profiles#standard",
  profileId: "standard",
  profileVersion: "v1",
  profileDigest: defaultDigest(),
  allowlistReleaseId: "allowlist-v1",
  allowlistManifestDigest: defaultDigest(),
  allowlistEntryDigest: defaultDigest(),
});

const normalizeProfileBinding = (profile = {}) => {
  const fallback = defaultProfile();
  return {
    profileSpellRef: assertBoundedId(
      profile.profileSpellRef ?? fallback.profileSpellRef,
      "profile.profileSpellRef",
    ),
    profileId: assertBoundedId(profile.profileId ?? fallback.profileId, "profile.profileId"),
    profileVersion: assertBoundedId(
      profile.profileVersion ?? fallback.profileVersion,
      "profile.profileVersion",
    ),
    profileDigest: assertDigest(
      profile.profileDigest ?? fallback.profileDigest,
      "profile.profileDigest",
    ),
    allowlistReleaseId: assertBoundedId(
      profile.allowlistReleaseId ?? fallback.allowlistReleaseId,
      "profile.allowlistReleaseId",
    ),
    allowlistManifestDigest: assertDigest(
      profile.allowlistManifestDigest ?? fallback.allowlistManifestDigest,
      "profile.allowlistManifestDigest",
    ),
    allowlistEntryDigest: assertDigest(
      profile.allowlistEntryDigest ?? fallback.allowlistEntryDigest,
      "profile.allowlistEntryDigest",
    ),
  };
};

const normalizeOutcomeBindings = ({ command, executionContext = {} }) => {
  const elementNodeId = maybeTrimString(executionContext.elementNodeId);
  const bindings = {
    tenantId: assertBoundedId(executionContext.tenantId ?? "tenant-unknown", "tenantId"),
    deploymentId:
      maybeTrimString(executionContext.deploymentId) && UUID_RE.test(executionContext.deploymentId)
        ? executionContext.deploymentId
        : defaultUuid(),
    graphDomain: assertBoundedId(
      executionContext.graphDomain ?? "graph-domain-unknown",
      "graphDomain",
    ),
    graphApp: assertBoundedId(executionContext.graphApp ?? "graph-app-unknown", "graphApp"),
    spellRef: assertBoundedId(executionContext.spellRef ?? "spell-unknown", "spellRef"),
    elementNodeId: elementNodeId && UUID_RE.test(elementNodeId) ? elementNodeId : defaultUuid(),
    profile: normalizeProfileBinding(executionContext.profile),
    configurationDigest: command.configurationDigest ?? defaultDigest(),
    operationRef: command.operationRef ?? "hippocampus-configure.v1",
    requestId: assertBoundedId(executionContext.requestId ?? "request-unknown", "requestId"),
  };
  return bindings;
};

const failureOutcomeForError = ({ command, executionContext, error }) => {
  const runtimeError = toRuntimeError(error);
  return {
    schema: OUTCOME_SCHEMA,
    ok: false,
    status: "failed",
    replayed: false,
    bindings: normalizeOutcomeBindings({ command, executionContext }),
    error: {
      schema: SAFE_ERROR_SCHEMA,
      code: runtimeError.code,
      message: SAFE_ERROR_MESSAGES[runtimeError.code] ?? SAFE_ERROR_MESSAGES["internal-error"],
      retryable: runtimeError.retryable === true,
    },
  };
};

const resolveHippocampusExecutionContext = (streamCache, controlflowObj = {}) => {
  const runtimeContext = {
    ...(streamCache?.[ElemCacheKeyLUT.RTCONTEXT] ?? {}),
    ...(controlflowObj?._config ?? {}),
  };

  return {
    runtimeContext,
    tenantId: runtimeContext.tenantId,
    graphDomain: runtimeContext.graphDomain ?? runtimeContext.domain,
    graphApp: runtimeContext.graphApp ?? runtimeContext.appid,
    spellRef: runtimeContext.spellRef ?? runtimeContext.spellId,
    elementNodeId: runtimeContext.elementNodeId ?? streamCache?.[ElemCacheKeyLUT.REFNODE],
    deploymentId: runtimeContext.deploymentId,
    requestId: runtimeContext.requestId,
    profile: runtimeContext.profile ?? runtimeContext.hippocampusProfile,
    adapter: runtimeContext.hippocampusAdapter ?? runtimeContext.hippocampus?.adapter,
    host: runtimeContext.host,
    executeIntent: runtimeContext.executeHippocampusIntent,
    hippocampusAdapter: runtimeContext.hippocampusAdapter,
  };
};

const resolveElementConfig = (streamCache, executionContext) => {
  const runtimeConfig =
    executionContext?.runtimeContext?.hippocampusConfig ??
    executionContext?.runtimeContext?.hippocampus?.config ??
    streamCache?.[cachekeys.CONFIG] ??
    {};
  streamCache[cachekeys.CONFIG] = runtimeConfig;
  return runtimeConfig;
};

const executeElementHippocampusIntent = async (rawIntent, executionContext, config) => {
  try {
    return await executeHippocampusIntentCommand({
      command: rawIntent,
      config,
      executionContext,
    });
  } catch (error) {
    runtimeLogger.error({
      event: "hippocampus_intent_failed",
      error,
      elementNodeId: executionContext?.elementNodeId,
    });
    const normalizedCommand = (() => {
      try {
        return normalizeHippocampusIntentCommand(rawIntent);
      } catch (_normalizeError) {
        return {
          configurationDigest: defaultDigest(),
          operationRef: "hippocampus-configure.v1",
        };
      }
    })();
    return failureOutcomeForError({
      command: normalizedCommand,
      executionContext,
      error,
    });
  }
};

const initElementInterface = (streamCache) => {
  const _leaflogic = (input$objArr, controlflow$obj) => {
    const outflowData$ = new Subject();
    const inputStreams =
      input$objArr.length === 0
        ? [of(undefined)]
        : input$objArr.map((input) => input._stream.pipe(startWith(undefined)));

    const ctrlOut$ = controlflow$obj._stream.pipe(
      withLatestFrom(...inputStreams),
      concatMap(([ctrl, ...inputValues]) => {
        const command = inputValues.find((value) => value !== undefined) ?? ctrl;
        const executionContext = resolveHippocampusExecutionContext(streamCache, controlflow$obj);
        const config = resolveElementConfig(streamCache, executionContext);

        return from(executeElementHippocampusIntent(command, executionContext, config)).pipe(
          map((output) => ({ ctrl, output })),
        );
      }),
      map(({ ctrl, output }) => {
        outflowData$.next(output);
        return ctrl;
      }),
      share(),
    );

    const trackedData$ = new Observable((subscriber) => {
      const sub = outflowData$.subscribe(subscriber);
      return () => sub.unsubscribe();
    });

    return {
      _stream: trackedData$,
      _control: {
        _stream: ctrlOut$,
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
  DEFAULT_TIMEOUT_MS,
  HippocampusRuntimeError,
  cachekeys,
  executeElementHippocampusIntent,
  executeHippocampusIntentCommand,
  normalizeHippocampusIntentCommand,
  props,
  resolveHippocampusIntentIdempotency,
};

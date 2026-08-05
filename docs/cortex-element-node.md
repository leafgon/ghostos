# Cortex Element Node

The `cortex` leafelement is runtime node logic for calling leaf-server's public
Cortex APIs. It consumes bottles named `intent` and emits bottles named
`outcome`.

Bottle values use the standard runtime wrapper:

```ts
type Bottle<TContent = unknown, TLabel = Record<string, unknown>> = {
  _bname: string;
  _content: TContent;
  _label: TLabel;
};
```

This document describes the `_content` schema for `intent` and `outcome`
bottles. The implementation lives in
`src/api/parser/nodelogic/elements/library/cortex.js`.

## Intent Bottle

The cortex node accepts only bottles with `_bname: "intent"`.

```ts
type CortexIntentBottle = Bottle<CortexIntentContent>;

type CortexIntentContent = {
  schemaVersion?: "v1";
  cortexInstanceId: string;
  workloadType: CortexWorkloadType;
  priority: CortexPriority;
  mode?: CortexMode;
  payloadRef?: CortexInputPayloadRef;

  idempotencyKey?: string;
  intentId?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  providerHints?: Record<string, unknown>;
  costBudgetUsd?: number;

  intentType?: unknown;
  action?: unknown;
  actorId?: unknown;
  targetId?: unknown;
  subject?: unknown;
  payload?: unknown;
  constraints?: unknown;

  [extraField: string]: unknown;
};

type CortexWorkloadType = "chat" | "vision" | "embedding" | "transcription" | "agent" | "tool";

type CortexPriority = "p0_interactive" | "p1_interactive" | "p2_batch";

type CortexMode = "sync" | "async";

type CortexInputPayloadRef =
  | {
      uri: string;
      inline?: never;
      mimeType?: string;
      sizeBytes?: number;
      checksum?: string;
    }
  | {
      inline: unknown;
      uri?: never;
      mimeType?: string;
      sizeBytes?: number;
      checksum?: string;
    };
```

Validation rules:

- `schemaVersion` defaults to `"v1"` when omitted or blank. Explicit values
  must be `"v1"`.
- `cortexInstanceId` is always filled by the cortex node from the leaf element
  UUID before validation and request construction. Client-supplied values are
  overwritten.
- `workloadType` must be one of the `CortexWorkloadType` values.
- `priority` must be one of the `CortexPriority` values.
- `mode` defaults to `"async"` when omitted or blank. Explicit values must be
  `"sync"` or `"async"`.
- `payloadRef`, when present, must contain exactly one of `uri` or `inline`.
- If `payloadRef` is omitted and `payload` is present, the node reconstructs
  `payloadRef` as `{ inline: payload }` for the normalized Cortex request.
- `payloadRef.uri`, when used, must be a non-empty string after trimming.
- `payloadRef.sizeBytes`, when present, must be an integer greater than or
  equal to `0`.
- `idempotencyKey`, when present, must be 8 to 256 characters matching
  `/^[A-Za-z0-9._:-]{8,256}$/`.
- `timeoutMs` is omitted when absent or blank so Cortex can apply its server
  policy. Explicit values must be an integer from `1` through `3600000`.
- `maxAttempts` is omitted when absent or blank so Cortex can apply its server
  policy. Explicit values must be an integer from `1` through `1000`.
- `providerHints`, when present, must be a plain object.
- `costBudgetUsd`, when present, must be a number greater than or equal to `0`.

Callback fields are rejected:

```ts
type RejectedCallbackField =
  | "callback"
  | "callbackUrl"
  | "callbackUri"
  | "callbackHeaders"
  | "callbackMethod"
  | "callbacks"
  | "webhook"
  | "webhookUrl";
```

Authority and transport fields are not forwarded to Cortex. This includes
fields such as `tenantId`, `jobId`, `traceId`, `spanId`, `headers`,
`authorization`, `credentials`, `baseUrl`, `apiBaseUrl`, `jobsPath`,
`retryCount`, `requestId`, and `responseId`.

If `idempotencyKey` is absent, the node derives one by hashing canonical JSON
from the executing `refnode`, stable bottle identity, normalized Cortex request
body, and stable semantic fields. Stable bottle identity contains the bottle
name plus `_label.refnode`, `_label.source`, `_label.tag`, and
`_label.intentId` when present. Stable semantic fields include `schemaVersion`,
`intentType`, `action`, `actorId`, `targetId`, `subject`, `payload`, and
`constraints`. Volatile fields such as timestamps, transport fields, request
IDs, response IDs, credentials, and headers are excluded from the derived key.

The emitted `intentId` is resolved from the first available non-empty value:

- `intent._content.intentId`
- `intent._label.intentId`
- `intent._label.tag`

Content `intentId` is used for outcome correlation. It is not included in the
derived idempotency key unless also provided as `_label.intentId` or
`_label.tag`.

## Outcome Bottle

The cortex node emits bottles with `_bname: "outcome"`.

```ts
type CortexOutcomeBottle = Bottle<CortexOutcomeContent>;

type CortexOutcomeContent = {
  schemaVersion: "v1";
  ok: boolean;
  status: CortexOutcomeStatus;
  mode: CortexMode;
  refnode?: string;
  intentId?: string;
  idempotencyKey: string;
  requestId?: string;
  jobId?: string;
  workload: CortexOutcomeWorkload;
  result?: CortexOutcomeResult;
  error?: CortexOutcomeError;
  timestamps: CortexOutcomeTimestamps;
};

type CortexOutcomeStatus = "succeeded" | "failed" | "cancelled" | "timed_out" | "error";

type CortexOutcomeWorkload = {
  cortexInstanceId: string;
  workloadType: CortexWorkloadType;
  priority: CortexPriority;
  operationTypeDerived: `ai.jobs.command:${CortexWorkloadType}:${CortexMode}`;
};

type CortexOutcomeResult = {
  kind: "uri" | "inline" | "metadata";
  value?: unknown;
  uri?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
};

type CortexOutcomeError = {
  code: string;
  message: string;
  httpStatus?: number;
  retryable: boolean;
  details?: {
    field?: string;
    reason?: string;
    requestId?: string;
    jobId?: string;
    retryAfterMs?: number;
  };
};

type CortexOutcomeTimestamps = {
  submittedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
};
```

Status mapping:

- Cortex result statuses `completed` and `succeeded` emit
  `status: "succeeded"` with `ok: true`.
- Cortex result status `failed` emits `status: "failed"` with `ok: false`.
- Cortex result statuses `cancelled` and `canceled` emit
  `status: "cancelled"` with `ok: false`.
- Cortex result statuses `timed_out` and `timeout` emit
  `status: "timed_out"` with `ok: false`.
- Validation failures, configuration errors, API errors, malformed responses,
  and unexpected runtime errors emit `status: "error"` with `ok: false`.

`result` is present only for successful outcomes. It is derived from the
allow-listed Cortex result body returned by `GET /api/cortex/jobs/<job_id>/result`.
leaf-server success responses currently use this shape:

```json
{
  "schemaVersion": "v1",
  "jobId": "<job_id>",
  "status": "completed",
  "result": {
    "inline": {
      "...": "provider response payload"
    }
  },
  "requestId": "<leaf-server request id>"
}
```

The emitted outcome maps that response to:

- `kind: "inline"` and `value` equal to the provider response payload when the
  result object contains `inline`.
- `kind: "uri"` when the result object contains `uri`.

The mapper also accepts the older result-envelope shape with
`result.payloadRef`:

- `kind: "uri"` when the result payload reference contains `uri`.
- `kind: "inline"` when the result payload reference contains `inline`, or
  when a non-object payload reference is returned.
- `kind: "metadata"` when no payload reference exists but result metadata is
  available.

`error` is present for failed, cancelled, timed-out, and error outcomes. Error
details are allow-listed to `field`, `reason`, `requestId`, `jobId`, and
`retryAfterMs`.

Terminal failure responses from leaf-server currently use this shape:

```json
{
  "schemaVersion": "v1",
  "jobId": "<job_id>",
  "status": "failed|cancelled|timed_out",
  "result": null,
  "error": {
    "code": "<safe error code>",
    "category": "<safe category>"
  },
  "requestId": "<leaf-server request id>"
}
```

For terminal failures, `result: null` is not emitted in the outcome result.
The outcome status is mapped from the terminal response status and `error` is
populated from the safe error fields.

Raw Cortex API envelopes and unrecognized response fields are not passed
through to downstream nodes.

## Runtime Behavior

Both `mode: "sync"` and `mode: "async"` use the same runtime path:

1. Submit a normalized request body to `/api/cortex/jobs`.
2. Expect a `202 accepted` response containing `jobId`, `requestId`,
   `statusUrl`, `eventsUrl`, and `resultUrl`.
3. Poll `resultUrl` until the result is terminal or configured polling bounds
   are exhausted.
4. Emit exactly one `outcome` bottle for each accepted waiter.

The default GET polling interval is `2000` milliseconds. It can be overridden
with `pollIntervalMs` in the cortex node configuration.

Repeated intents with the same idempotency key share one effective Cortex
submission. When the shared job completes, each waiter receives an `outcome`
with its own resolved `intentId`.

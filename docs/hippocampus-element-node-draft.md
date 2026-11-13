# Hippocampus Element Node (Draft Contract)

Status: draft for implementation work tracked by `leafgon/ghostos#112` and
`leafgon/hippocampus#36/#38/#41`.

This document defines a concrete test contract for wiring
`leafelement(hippocampus)` in GhostOS with deterministic inport/outport bottle
shapes, leaf-server request mapping, response mapping, and ready-to-use JSON
fixtures.

## 1. Scope

- This is an implementation draft to unblock adapter work and tests.
- It is intentionally aligned with existing Hippocampus control-plane and
  data-plane routes already implemented in `leafgon/hippocampus`.
- It mirrors the style used by `docs/cortex-element-node.md`.

## 2. LEAF Bottle Examples (Inport/Outport)

The adapter consumes `intent` bottles and emits `outcome` bottles.

### 2.1 Example inport bottle (`query`)

```json
{
  "_bname": "intent",
  "_content": {
    "schemaVersion": "hippocampus-intent.v1alpha1",
    "intentId": "intent-query-001",
    "operation": "query",
    "deploymentId": "f8d8d870-8815-5e5a-971f-d3c0bad1d504",
    "table": "notes",
    "payload": {
      "filter": {
        "status": {
          "op": "eq",
          "value": "active"
        }
      },
      "order_by": [
        {
          "field": "id",
          "direction": "asc"
        }
      ],
      "limit": 20
    },
    "options": {
      "timeoutMs": 15000,
      "maxAttempts": 2,
      "idempotencyKey": "idem-query-001"
    }
  },
  "_label": {
    "eventId": "evt-001",
    "parentEventId": "evt-root-001"
  }
}
```

### 2.2 Example outport bottle (`query` success)

```json
{
  "_bname": "outcome",
  "_content": {
    "schemaVersion": "hippocampus-outcome.v1alpha1",
    "intentId": "intent-query-001",
    "operation": "query",
    "ok": true,
    "status": "succeeded",
    "deploymentId": "f8d8d870-8815-5e5a-971f-d3c0bad1d504",
    "requestId": "req-query-001",
    "http": {
      "status": 200,
      "retryable": false
    },
    "result": {
      "records": [
        {
          "id": "1",
          "record": {
            "id": 1,
            "title": "Hello",
            "status": "active"
          }
        }
      ],
      "next_page_token": null,
      "total": null
    }
  },
  "_label": {
    "eventId": "evt-002",
    "parentEventId": "evt-001"
  }
}
```

### 2.3 Example outport bottle (`command` failure)

```json
{
  "_bname": "outcome",
  "_content": {
    "schemaVersion": "hippocampus-outcome.v1alpha1",
    "intentId": "intent-command-001",
    "operation": "command",
    "ok": false,
    "status": "failed",
    "deploymentId": "f8d8d870-8815-5e5a-971f-d3c0bad1d504",
    "requestId": "req-cmd-001",
    "http": {
      "status": 409,
      "retryable": false
    },
    "error": {
      "code": "VERSION_CONFLICT",
      "message": "expected version did not match current version",
      "retryable": false,
      "details": {
        "table": "documents",
        "id": "1",
        "expected": 0,
        "current": 1
      }
    }
  },
  "_label": {
    "eventId": "evt-003",
    "parentEventId": "evt-001"
  }
}
```

## 3. Adapter Intent Contract (GhostOS-side)

`_content` for `intent` bottles:

```json
{
  "schemaVersion": "hippocampus-intent.v1alpha1",
  "intentId": "intent-<stable-id>",
  "operation": "configure|get|query|semantic-search|command",
  "deploymentId": "<deployment-uuid>",
  "table": "<table-name>",
  "recordId": "<primary-key-string>",
  "embeddingName": "<embedding-name>",
  "commandName": "<command-name>",
  "payload": {},
  "options": {
    "idempotencyKey": "idem-<8..256 chars>",
    "timeoutMs": 15000,
    "maxAttempts": 2
  }
}
```

Field requirements by operation:

- `configure`
  - requires `payload` matching control-plane v2 configuration payload.
  - adapter calls:
    - `PUT /internal/v2/deployments/{deployment_id}/configuration`
    - `GET /internal/v2/deployments/{deployment_id}/configuration` (optional read-back step)
- `get`
  - requires `table`, `recordId`.
  - adapter calls:
    - `GET /api/hippocampus/{deployment_id}/records/{table}/{recordId}`
- `query`
  - requires `table`, `payload` (query body).
  - adapter calls:
    - `POST /api/hippocampus/{deployment_id}/records/{table}:query`
- `semantic-search`
  - requires `embeddingName`, `payload` (search body).
  - adapter calls:
    - `POST /api/hippocampus/{deployment_id}/search/{embeddingName}`
- `command`
  - requires `commandName`, `payload` (named command body).
  - adapter calls:
    - `POST /api/hippocampus/{deployment_id}/commands/{commandName}:execute`

Host-owned constraints (fail-closed):

- Endpoint/base URL, auth headers, caller identity, trusted tenant/deployment
  binding, and retries are host/runtime managed and not accepted from user
  payload fields.
- Any intent that tries to set authority/transport fields (`headers`,
  `authorization`, `baseUrl`, `apiBaseUrl`, `jobsPath`, `credentials`) MUST be
  rejected as `INVALID_REQUEST`.

## 4. Leaf-server Success/Failure Fixture Contract

Leaf-server response body expectations for mapping (data-plane proxy and
control-plane config route):

- Success responses preserve Hippocampus response bodies and include
  `request_id` when provided by backend.
- Error responses use stable envelope:

```json
{
  "error": {
    "code": "<SAFE_CODE>",
    "message": "<safe message>",
    "retryable": false,
    "details": {}
  },
  "request_id": "<request-id>"
}
```

Expected fixture files (ready for tests):

- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.query.success.json`
- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.command.success.json`
- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.configure.success.json`
- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.version-conflict.json`
- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.idempotency-conflict.json`
- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.dependency-unavailable.json`
- `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.configuration-scope-conflict.json`

Companion expected outport fixtures:

- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.query.success.json`
- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.query.retryable-error.json`
- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.command.success.json`
- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.command.version-conflict.json`
- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.command.idempotency-conflict.json`
- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.configure.success.json`
- `tests/fixtures/hippocampus-adapter-contract/outport.outcome.configure.scope-conflict.json`

## 5. Adapter Outcome Contract (GhostOS outport)

`_content` for `outcome` bottles:

```json
{
  "schemaVersion": "hippocampus-outcome.v1alpha1",
  "intentId": "intent-<stable-id>",
  "operation": "configure|get|query|semantic-search|command",
  "ok": true,
  "status": "succeeded|failed|timed_out|error",
  "deploymentId": "<deployment-uuid>",
  "requestId": "<leaf-server request id>",
  "http": {
    "status": 200,
    "retryable": false
  },
  "result": {},
  "error": {
    "code": "<safe code>",
    "message": "<safe message>",
    "retryable": false,
    "details": {}
  }
}
```

Status mapping:

- `2xx` -> `ok=true`, `status="succeeded"`, `result` present.
- `4xx` with contract-safe domain errors
  (`VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `CONFIGURATION_SCOPE_CONFLICT`,
  `INVALID_REQUEST`, `RECORD_NOT_FOUND`, `DEPLOYMENT_NOT_FOUND`) ->
  `ok=false`, `status="failed"`.
- `409` with `OPERATION_IN_PROGRESS` and `retryable=true` ->
  `ok=false`, `status="failed"`, `error.retryable=true`.
- `503` with `DEPENDENCY_UNAVAILABLE` ->
  `ok=false`, `status="error"`, `error.retryable=true`.
- client timeout or retry budget exhaustion ->
  `ok=false`, `status="timed_out"`, `error.code="REQUEST_TIMEOUT"`.

## 6. Concrete Server-side Adapter Contract (Intent/Outcome + Test Vectors)

The server-side adapter interface consumed by GhostOS runtime:

```ts
type HippocampusAdapterSubmitInput = {
  intent: HippocampusIntent;
  hostContext: {
    requestId: string;
    graphDomain: string;
    graphApp: string;
    spellId: string;
    nodeId: string;
    tenantId: string;
    deploymentId: string;
    timeoutMs: number;
  };
};

type HippocampusAdapterSubmitOutput = HippocampusOutcome;
```

Behavioral rules:

- Adapter MUST derive final deployment binding from `hostContext`; mismatched
  `intent.deploymentId` fails closed.
- Adapter MUST inject `X-Request-Id` on every call.
- Adapter MUST inject `Idempotency-Key` for mutating operations:
  - `configure`, `command`.
- Adapter MUST not leak credentials, signed assertion tokens, or transport
  internals in outcomes.

### 6.1 Test vectors

- `TV-001 query success`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.query.success.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.query.success.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.query.success.json`

- `TV-002 command success`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.command.success.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.command.success.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.command.success.json`

- `TV-003 command version conflict`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.command.version-conflict.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.version-conflict.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.command.version-conflict.json`

- `TV-004 retryable dependency unavailable`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.query.retryable.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.dependency-unavailable.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.query.retryable-error.json`

- `TV-005 configure success`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.configure.success.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.configure.success.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.configure.success.json`

- `TV-006 configure scope conflict`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.configure.scope-conflict.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.configuration-scope-conflict.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.configure.scope-conflict.json`

- `TV-007 command idempotency conflict`
  - input fixture:
    - `tests/fixtures/hippocampus-adapter-contract/inport.intent.command.idempotency-conflict.json`
  - leaf-server fixture:
    - `tests/fixtures/hippocampus-adapter-contract/leaf-server.response.error.idempotency-conflict.json`
  - expected outcome:
    - `tests/fixtures/hippocampus-adapter-contract/outport.outcome.command.idempotency-conflict.json`

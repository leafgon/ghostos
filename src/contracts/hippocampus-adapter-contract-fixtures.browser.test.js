import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const fixtureRoot = join(process.cwd(), "tests", "fixtures", "hippocampus-adapter-contract");

function readJson(name) {
  return JSON.parse(readFileSync(join(fixtureRoot, name), "utf8"));
}

function withoutRequestId(body) {
  const cloned = JSON.parse(JSON.stringify(body));
  delete cloned.request_id;
  return cloned;
}

function outcomeStatus(httpStatus, error) {
  if (httpStatus >= 200 && httpStatus < 300) {
    return "succeeded";
  }
  if (httpStatus === 503 && error?.code === "DEPENDENCY_UNAVAILABLE" && error?.retryable === true) {
    return "error";
  }
  return "failed";
}

function mapIntentToOutcome(intentBottle, leafServerResponse, options = {}) {
  const { eventId = `evt-outcome-${intentBottle._label.eventId}` } = options;
  const { httpStatus, body } = leafServerResponse;
  const success = httpStatus >= 200 && httpStatus < 300;

  const outcome = {
    _bname: "outcome",
    _content: {
      schemaVersion: "hippocampus-outcome.v1alpha1",
      intentId: intentBottle._content.intentId,
      operation: intentBottle._content.operation,
      ok: success,
      status: outcomeStatus(httpStatus, body.error),
      deploymentId: intentBottle._content.deploymentId,
      requestId: body.request_id,
      http: {
        status: httpStatus,
        retryable: success ? false : Boolean(body.error?.retryable),
      },
    },
    _label: {
      eventId,
      parentEventId: intentBottle._label.eventId,
    },
  };

  if (success) {
    outcome._content.result = withoutRequestId(body);
  } else {
    outcome._content.error = body.error;
  }

  return outcome;
}

const vectors = [
  {
    id: "TV-001",
    inport: "inport.intent.query.success.json",
    leafServer: "leaf-server.response.query.success.json",
    outport: "outport.outcome.query.success.json",
  },
  {
    id: "TV-002",
    inport: "inport.intent.command.success.json",
    leafServer: "leaf-server.response.command.success.json",
    outport: "outport.outcome.command.success.json",
  },
  {
    id: "TV-003",
    inport: "inport.intent.command.version-conflict.json",
    leafServer: "leaf-server.response.error.version-conflict.json",
    outport: "outport.outcome.command.version-conflict.json",
  },
  {
    id: "TV-004",
    inport: "inport.intent.query.retryable.json",
    leafServer: "leaf-server.response.error.dependency-unavailable.json",
    outport: "outport.outcome.query.retryable-error.json",
  },
  {
    id: "TV-005",
    inport: "inport.intent.configure.success.json",
    leafServer: "leaf-server.response.configure.success.json",
    outport: "outport.outcome.configure.success.json",
  },
  {
    id: "TV-006",
    inport: "inport.intent.configure.scope-conflict.json",
    leafServer: "leaf-server.response.error.configuration-scope-conflict.json",
    outport: "outport.outcome.configure.scope-conflict.json",
  },
  {
    id: "TV-007",
    inport: "inport.intent.command.idempotency-conflict.json",
    leafServer: "leaf-server.response.error.idempotency-conflict.json",
    outport: "outport.outcome.command.idempotency-conflict.json",
  },
];

const expectedFixtureJsonFiles = new Set([
  "inport.intent.command.idempotency-conflict.json",
  "inport.intent.command.success.json",
  "inport.intent.command.version-conflict.json",
  "inport.intent.configure.scope-conflict.json",
  "inport.intent.configure.success.json",
  "inport.intent.query.retryable.json",
  "inport.intent.query.success.json",
  "leaf-server.response.command.success.json",
  "leaf-server.response.configure.success.json",
  "leaf-server.response.error.configuration-scope-conflict.json",
  "leaf-server.response.error.dependency-unavailable.json",
  "leaf-server.response.error.idempotency-conflict.json",
  "leaf-server.response.error.version-conflict.json",
  "leaf-server.response.query.success.json",
  "outport.outcome.command.idempotency-conflict.json",
  "outport.outcome.command.success.json",
  "outport.outcome.command.version-conflict.json",
  "outport.outcome.configure.scope-conflict.json",
  "outport.outcome.configure.success.json",
  "outport.outcome.query.retryable-error.json",
  "outport.outcome.query.success.json",
]);

describe("hippocampus adapter contract fixtures", () => {
  it("includes only the expected fixture JSON files", () => {
    const actual = new Set(readdirSync(fixtureRoot).filter((name) => name.endsWith(".json")));
    expect(actual).toEqual(expectedFixtureJsonFiles);
  });

  it("matches inport to leaf-server and outport mapping for TV-001..TV-007", () => {
    for (const vector of vectors) {
      const inport = readJson(vector.inport);
      const leafServer = readJson(vector.leafServer);
      const outport = readJson(vector.outport);

      expect(inport._bname, `${vector.id} inport bottle name`).toBe("intent");
      expect(outport._bname, `${vector.id} outport bottle name`).toBe("outcome");

      expect(inport._content.schemaVersion, `${vector.id} inport schema`).toBe(
        "hippocampus-intent.v1alpha1",
      );
      expect(outport._content.schemaVersion, `${vector.id} outport schema`).toBe(
        "hippocampus-outcome.v1alpha1",
      );

      expect(outport._content.intentId, `${vector.id} intent id`).toBe(inport._content.intentId);
      expect(outport._content.operation, `${vector.id} operation`).toBe(inport._content.operation);
      expect(outport._content.deploymentId, `${vector.id} deployment binding`).toBe(
        inport._content.deploymentId,
      );
      expect(outport._label.parentEventId, `${vector.id} event lineage`).toBe(
        inport._label.eventId,
      );

      expect(outport._content.requestId, `${vector.id} request id`).toBe(
        leafServer.body.request_id,
      );
      expect(outport._content.http.status, `${vector.id} http status`).toBe(leafServer.httpStatus);

      if (leafServer.httpStatus >= 200 && leafServer.httpStatus < 300) {
        expect(outport._content.ok, `${vector.id} success ok`).toBe(true);
        expect(outport._content.status, `${vector.id} success status`).toBe("succeeded");
        expect(outport._content.http.retryable, `${vector.id} success retryable`).toBe(false);
        expect(outport._content.error, `${vector.id} success error omitted`).toBeUndefined();
        expect(outport._content.result, `${vector.id} success result`).toEqual(
          withoutRequestId(leafServer.body),
        );
        continue;
      }

      expect(outport._content.ok, `${vector.id} failure ok`).toBe(false);
      expect(outport._content.error, `${vector.id} failure error present`).toEqual(
        leafServer.body.error,
      );
      expect(outport._content.http.retryable, `${vector.id} failure retryable`).toBe(
        leafServer.body.error.retryable,
      );

      if (
        leafServer.httpStatus === 503 &&
        leafServer.body.error.code === "DEPENDENCY_UNAVAILABLE" &&
        leafServer.body.error.retryable === true
      ) {
        expect(outport._content.status, `${vector.id} dependency unavailable status`).toBe("error");
      } else {
        expect(outport._content.status, `${vector.id} domain failure status`).toBe("failed");
      }
    }
  });

  it("reference mapper reproduces expected outport fixtures for TV-001..TV-007", () => {
    for (const vector of vectors) {
      const inport = readJson(vector.inport);
      const leafServer = readJson(vector.leafServer);
      const expectedOutport = readJson(vector.outport);

      const mapped = mapIntentToOutcome(inport, leafServer, {
        eventId: expectedOutport._label.eventId,
      });

      expect(mapped, `${vector.id} reference mapper output`).toEqual(expectedOutport);
    }
  });
});

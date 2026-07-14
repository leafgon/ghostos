import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ReplaySubject, firstValueFrom, of } from "rxjs";
import { take, toArray } from "rxjs/operators";

import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { doBottle } from "../../datautils/bottling.js";
import { ElemCacheKeyLUT, initStdElementProps } from "./index.js";

const TEST_REFNODE = "c03c5006-8feb-4bdd-a9de-a2afde5b06ee";
const TEST_INSTANCE_ID = "7ccf6732-9f1b-4b4d-92bd-08ae5724b650";

const makeConfigLambda = (config) => {
  return (_input$objArr, controlflow$obj) => {
    return {
      _stream: of(config),
      _control: { _stream: controlflow$obj._stream },
    };
  };
};

const makeJsonResponse = (status, body, headers = {}) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key) => headers[key.toLowerCase()] ?? headers[key] ?? null,
    },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
};

const requestHref = (requestUrl) => {
  return typeof requestUrl === "string" ? requestUrl : requestUrl?.href;
};

const acceptedResponse = (jobId, requestId = `req-${jobId}`) => {
  return {
    schemaVersion: "v1",
    jobId,
    status: "accepted",
    requestId,
    statusUrl: `/api/cortex/jobs/${jobId}`,
    eventsUrl: `/api/cortex/jobs/${jobId}/events`,
    resultUrl: `/api/cortex/jobs/${jobId}/result`,
  };
};

const completedResponse = (
  jobId,
  requestId = `req-result-${jobId}`,
  payloadRef = { inline: "ok" },
) => {
  return {
    schemaVersion: "v1",
    jobId,
    status: "completed",
    requestId,
    result: {
      payloadRef,
    },
    token: "must-not-leak",
    apiKey: "must-not-leak",
    authorization: "must-not-leak",
  };
};

const baseIntentContent = (overrides = {}) => {
  return {
    schemaVersion: "v1",
    cortexInstanceId: TEST_INSTANCE_ID,
    workloadType: "chat",
    priority: "p1_interactive",
    mode: "sync",
    payloadRef: {
      inline: {
        prompt: "hello",
      },
    },
    idempotencyKey: "idem-sync-1",
    ...overrides,
  };
};

const intentBottle = (overrides = {}, label = {}) => {
  return doBottle("intent", baseIntentContent(overrides), label);
};

const initCortexFlow = (config = {}) => {
  const streamCache = {
    [ElemCacheKeyLUT.LAMBDA_OBJ]: {
      _default: makeConfigLambda({
        pollIntervalMs: 0,
        requestTimeoutMs: 1000,
        maxPollAttempts: 5,
        totalTimeoutMs: 10000,
        ...config,
      }),
    },
    [ElemCacheKeyLUT.REFNODE]: TEST_REFNODE,
    [ElemCacheKeyLUT.RTCONTEXT]: {
      graphdomain: "breezyforest",
      graphappid: "jestleafspell",
      refnode: TEST_REFNODE,
      nodelambda: [],
      contextuallambda: [],
    },
  };
  const cortexProps = initStdElementProps(streamCache, "cortex");
  const datainput$ = new ReplaySubject(1);
  const ctrlinput$ = new ReplaySubject(1);

  const output$obj = driveDataflowByCtrlflow(
    { _stream: ctrlinput$, _config: {} },
    [{ _stream: datainput$ }],
    undefined,
    {
      codebase: "cortex.browser.test.js",
      refnode: TEST_REFNODE,
    },
    {
      leaflogic: cortexProps.leaflogic,
      datalogic: cortexProps.datalogic,
    },
  );

  return { output$obj, datainput$, ctrlinput$, cortexProps };
};

const collectOutputs = async ({
  output$obj,
  datainput$,
  ctrlinput$,
  dataIn,
  count = 1,
  ctrlIn = { _bname: "accio" },
}) => {
  const ctrlSub = output$obj._control._stream.subscribe(() => {});
  try {
    const outPromise = firstValueFrom(output$obj._stream.pipe(take(count), toArray()));
    datainput$.next(dataIn);
    ctrlinput$.next(ctrlIn);
    return await outPromise;
  } finally {
    ctrlSub.unsubscribe();
  }
};

describe("cortex leafelement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves cortex from _std_elements_lut", () => {
    const { cortexProps } = initCortexFlow();
    expect(cortexProps).toBeDefined();
    expect(typeof cortexProps.leaflogic).toBe("function");
    expect(typeof cortexProps.datalogic.pre).toBe("function");
    expect(typeof cortexProps.datalogic.post).toBe("function");
  });

  it("submits sync mode as accepted work and polls resultUrl until completed", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-sync-1")))
      .mockResolvedValueOnce(
        makeJsonResponse(409, {
          error: { code: "not_ready", message: "Job result is not ready." },
          requestId: "req-not-ready",
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse(
          200,
          completedResponse("job-sync-1", "req-done", { inline: { answer: "hi" } }),
        ),
      );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle(
        { mode: "sync", idempotencyKey: "idem-sync-1" },
        { intentId: "intent-sync" },
      ),
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    const [requestUrl, requestInit] = global.fetch.mock.calls[0];
    expect(requestHref(requestUrl)).toBe("/api/cortex/jobs");
    expect(requestInit.method).toBe("POST");
    const submittedBody = JSON.parse(requestInit.body);
    expect(submittedBody.mode).toBe("sync");
    expect(submittedBody.idempotencyKey).toBe("idem-sync-1");
    expect(submittedBody.cortexInstanceId).toBe(TEST_REFNODE);

    expect(output._bname).toBe("outcome");
    expect(output._content.ok).toBe(true);
    expect(output._content.status).toBe("succeeded");
    expect(output._content.mode).toBe("sync");
    expect(output._content.intentId).toBe("intent-sync");
    expect(output._content.requestId).toBe("req-done");
    expect(output._content.jobId).toBe("job-sync-1");
    expect(output._content.result).toEqual({
      kind: "inline",
      value: { answer: "hi" },
      uri: undefined,
      mimeType: undefined,
      sizeBytes: undefined,
      checksum: undefined,
    });
    expect(output._content.workload.cortexInstanceId).toBe(TEST_REFNODE);
    expect(output._content.workload.operationTypeDerived).toBe("ai.jobs.command:chat:sync");
  });

  it("overwrites caller-supplied cortexInstanceId with the leaf element uuid", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-element-instance")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-element-instance")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({
        idempotencyKey: "idem-element-instance",
        cortexInstanceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    });

    const submittedBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(submittedBody.cortexInstanceId).toBe(TEST_REFNODE);
    expect(output._content.workload.cortexInstanceId).toBe(TEST_REFNODE);
  });

  it("defaults missing optional intent fields", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-default-schema")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-default-schema")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({
        idempotencyKey: "idem-default-schema",
        schemaVersion: undefined,
        mode: undefined,
        timeoutMs: undefined,
        maxAttempts: undefined,
      }),
    });

    const submittedBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(submittedBody.schemaVersion).toBe("v1");
    expect(submittedBody.mode).toBe("async");
    expect(submittedBody.timeoutMs).toBe(2000);
    expect(submittedBody.maxAttempts).toBe(2);
    expect(output._content.mode).toBe("async");
    expect(output._content.status).toBe("succeeded");
  });

  it("submits async mode through the same accepted response and maps uri payloadRef results", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-async-1")))
      .mockResolvedValueOnce(
        makeJsonResponse(
          200,
          completedResponse("job-async-1", "req-async-done", {
            uri: "s3://bucket/result.json",
            mimeType: "application/json",
            sizeBytes: 42,
            checksum: "sha256:abc",
          }),
        ),
      );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ mode: "async", idempotencyKey: "idem-async-1" }),
    });

    expect(JSON.parse(global.fetch.mock.calls[0][1].body).mode).toBe("async");
    expect(output._content.mode).toBe("async");
    expect(output._content.result).toEqual({
      kind: "uri",
      value: undefined,
      uri: "s3://bucket/result.json",
      mimeType: "application/json",
      sizeBytes: 42,
      checksum: "sha256:abc",
    });
    expect(output._content.workload.operationTypeDerived).toBe("ai.jobs.command:chat:async");
  });

  it("maps leaf-server result.inline responses as inline outcome results", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-direct-result")))
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          schemaVersion: "v1",
          jobId: "job-direct-result",
          status: "completed",
          requestId: "req-direct-result",
          result: {
            inline: {
              answer: "hi",
              usage: {
                inputTokens: 3,
                outputTokens: 1,
              },
            },
          },
        }),
      );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: "idem-direct-result" }),
    });

    expect(output._content.ok).toBe(true);
    expect(output._content.result).toEqual({
      kind: "inline",
      value: {
        answer: "hi",
        usage: {
          inputTokens: 3,
          outputTokens: 1,
        },
      },
      uri: undefined,
      mimeType: undefined,
      sizeBytes: undefined,
      checksum: undefined,
    });
  });

  it("uses a 2 second default interval between GET result polls", async () => {
    vi.useFakeTimers();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-default-poll")))
      .mockResolvedValueOnce(
        makeJsonResponse(409, {
          error: { code: "not_ready", message: "Job result is not ready." },
        }),
      )
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-default-poll")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow({ pollIntervalMs: undefined });
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    const outPromise = firstValueFrom(output$obj._stream.pipe(take(1), toArray()));

    try {
      datainput$.next(intentBottle({ idempotencyKey: "idem-default-poll" }));
      ctrlinput$.next({ _bname: "accio" });
      await vi.advanceTimersByTimeAsync(2);
      await vi.advanceTimersByTimeAsync(0);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1999);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);

      const [output] = await outPromise;
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(output._content.status).toBe("succeeded");
    } finally {
      ctrlSub.unsubscribe();
    }
  });

  it.each([
    ["failed", "failed", "model_failed"],
    ["cancelled", "cancelled", "cancelled_by_user"],
    ["canceled", "cancelled", "cancelled_by_user"],
    ["timed_out", "timed_out", "deadline_exceeded"],
  ])("maps terminal %s result status to %s outcomes", async (apiStatus, outcomeStatus, code) => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse(`job-${apiStatus}`)))
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          schemaVersion: "v1",
          jobId: `job-${apiStatus}`,
          status: apiStatus,
          requestId: `req-${apiStatus}`,
          error: {
            code,
            message: `${apiStatus} message`,
          },
        }),
      );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: `idem-${apiStatus}` }),
    });

    expect(output._content.ok).toBe(false);
    expect(output._content.status).toBe(outcomeStatus);
    expect(output._content.error.code).toBe(code);
    expect(output._content.error.message).toBe(`${apiStatus} message`);
  });

  it("emits deterministic error outcomes for non-retryable submit API errors", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      makeJsonResponse(400, {
        error: {
          code: "validation_failed",
          message: "bad request",
        },
        requestId: "req-bad",
      }),
    );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: "idem-bad-submit" }),
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(output._content.ok).toBe(false);
    expect(output._content.status).toBe("error");
    expect(output._content.error).toMatchObject({
      code: "validation_failed",
      message: "bad request",
      httpStatus: 400,
      retryable: false,
    });
  });

  it("retries retryable submit HTTP statuses within the bounded retry budget", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeJsonResponse(503, {
          error: { code: "upstream_unavailable", message: "try later" },
        }),
      )
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-retry-submit")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-retry-submit")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow({ maxSubmitAttempts: 2 });
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: "idem-retry-submit" }),
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(output._content.status).toBe("succeeded");
  });

  it("emits deterministic error outcomes for non-retryable result polling statuses", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-poll-404")))
      .mockResolvedValueOnce(
        makeJsonResponse(404, {
          error: { code: "not_found", message: "missing result" },
          requestId: "req-404",
        }),
      );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: "idem-poll-404" }),
    });

    expect(output._content.status).toBe("error");
    expect(output._content.error).toMatchObject({
      code: "not_found",
      message: "missing result",
      httpStatus: 404,
      retryable: false,
    });
  });

  it("emits timeout outcomes when polling bounds are exhausted", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-timeout")))
      .mockResolvedValue(makeJsonResponse(409, { error: { code: "not_ready" } }));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow({ maxPollAttempts: 1 });
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: "idem-timeout" }),
    });

    expect(output._content.ok).toBe(false);
    expect(output._content.status).toBe("timed_out");
    expect(output._content.error.code).toBe("poll_timeout");
  });

  it("dedupes repeated identical intents by idempotency key without duplicate effective submission", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-dedupe")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-dedupe")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const repeatedIntent = intentBottle({ idempotencyKey: "idem-dedupe" });
    const outputs = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: [repeatedIntent, repeatedIntent],
      count: 2,
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][1].method).toBe("POST");
    expect(global.fetch.mock.calls[1][1].method).toBe("GET");
    expect(outputs).toHaveLength(2);
    expect(outputs.map((output) => output._content.idempotencyKey)).toEqual([
      "idem-dedupe",
      "idem-dedupe",
    ]);
  });

  it("derives stable idempotency keys with sorted canonical JSON and excludes volatile fields", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-derived")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-derived")));

    const left = intentBottle(
      {
        idempotencyKey: undefined,
        providerHints: { z: "last", a: "first" },
        payload: { keep: "same", issuedAt: "2026-07-13T12:00:00Z" },
        issuedAt: "2026-07-13T12:00:00Z",
        requestId: "volatile-left",
      },
      { source: "test-source" },
    );
    const right = intentBottle(
      {
        idempotencyKey: undefined,
        providerHints: { a: "first", z: "last" },
        payload: { issuedAt: "2026-07-13T12:30:00Z", keep: "same" },
        issuedAt: "2026-07-13T12:30:00Z",
        requestId: "volatile-right",
      },
      { source: "test-source" },
    );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const outputs = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: [left, right],
      count: 2,
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(outputs[0]._content.idempotencyKey).toMatch(/^[0-9a-f]{64}$/);
    expect(outputs[1]._content.idempotencyKey).toBe(outputs[0]._content.idempotencyKey);
  });

  it("uses distinct intentId labels to intentionally submit otherwise identical derived intents", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-repeat-a")))
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-repeat-b")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-repeat-a")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-repeat-b")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const outputs = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: [
        intentBottle({ idempotencyKey: undefined }, { intentId: "repeat-a" }),
        intentBottle({ idempotencyKey: undefined }, { intentId: "repeat-b" }),
      ],
      count: 2,
    });

    expect(global.fetch.mock.calls.filter(([_url, init]) => init.method === "POST")).toHaveLength(
      2,
    );
    expect(outputs[0]._content.idempotencyKey).not.toBe(outputs[1]._content.idempotencyKey);
    expect(outputs.map((output) => output._content.intentId)).toEqual(["repeat-a", "repeat-b"]);
  });

  it("submits FIFO intents before polling and emits outcomes in completion order", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-first")))
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-second")))
      .mockResolvedValueOnce(makeJsonResponse(409, { error: { code: "not_ready" } }))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-second")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-first")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const outputs = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: [
        intentBottle({ idempotencyKey: "idem-first" }, { intentId: "first" }),
        intentBottle({ idempotencyKey: "idem-second" }, { intentId: "second" }),
      ],
      count: 2,
    });

    expect(global.fetch.mock.calls.slice(0, 2).map(([_url, init]) => init.method)).toEqual([
      "POST",
      "POST",
    ]);
    expect(outputs.map((output) => output._content.intentId)).toEqual(["second", "first"]);
  });

  it.each([
    ["unsupported workloadType", { workloadType: "audio" }],
    ["unsupported priority", { priority: "urgent" }],
    ["unsupported mode", { mode: "stream" }],
    ["invalid payloadRef", { payloadRef: { uri: "s3://a", inline: "b" } }],
    ["rejected callback field", { callbackUrl: "https://example.test/callback" }],
    ["invalid explicit idempotencyKey", { idempotencyKey: "bad" }],
  ])("validates and rejects %s", async (_label, overrides) => {
    global.fetch = vi.fn();
    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle(overrides),
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(output._bname).toBe("outcome");
    expect(output._content.ok).toBe(false);
    expect(output._content.status).toBe("error");
    expect(output._content.error.code).toBe("validation_failed");
  });

  it("does not forward client-supplied authority or transport fields from intent content", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-authority")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-authority")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({
        idempotencyKey: "idem-authority",
        tenantId: "tenant-from-client",
        traceId: "trace-from-client",
        operationTypeDerived: "forged",
        headers: { "X-Intent-Header": "forged" },
        baseUrl: "https://forged.example",
      }),
    });

    const submittedBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(submittedBody).not.toHaveProperty("tenantId");
    expect(submittedBody).not.toHaveProperty("traceId");
    expect(submittedBody).not.toHaveProperty("operationTypeDerived");
    expect(submittedBody).not.toHaveProperty("headers");
    expect(submittedBody).not.toHaveProperty("baseUrl");
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty("X-Intent-Header");
  });

  it("does not emit non-allow-listed or secret-like response fields in outcomes", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-safe-outcome")))
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          ...completedResponse("job-safe-outcome"),
          unknownEnvelope: "must-not-leak",
          secret: "must-not-leak",
          password: "must-not-leak",
        }),
      );

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow();
    const [output] = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: intentBottle({ idempotencyKey: "idem-safe-outcome" }),
    });

    const serialized = JSON.stringify(output._content);
    expect(serialized).not.toContain("must-not-leak");
    expect(output._content).not.toHaveProperty("unknownEnvelope");
    expect(output._content).not.toHaveProperty("secret");
    expect(output._content).not.toHaveProperty("password");
  });

  it("uses config-only custom headers without hashing or emitting intent headers", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(202, acceptedResponse("job-config-headers")))
      .mockResolvedValueOnce(makeJsonResponse(200, completedResponse("job-config-headers")));

    const { output$obj, datainput$, ctrlinput$ } = initCortexFlow({
      headers: {
        "X-Config-Header": "configured",
      },
    });
    const outputs = await collectOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: [
        intentBottle({ idempotencyKey: undefined }, { source: "same" }),
        intentBottle(
          {
            idempotencyKey: undefined,
            headers: {
              "X-Intent-Header": "ignored",
            },
          },
          { source: "same" },
        ),
      ],
      count: 2,
    });

    expect(global.fetch.mock.calls[0][1].headers["X-Config-Header"]).toBe("configured");
    expect(global.fetch.mock.calls[0][1].headers).not.toHaveProperty("X-Intent-Header");
    expect(outputs[0]._content.idempotencyKey).toBe(outputs[1]._content.idempotencyKey);
    expect(JSON.stringify(outputs[0]._content)).not.toContain("X-Config-Header");
    expect(JSON.stringify(outputs[0]._content)).not.toContain("X-Intent-Header");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { ReplaySubject, firstValueFrom, of } from "rxjs";
import { take, toArray } from "rxjs/operators";

import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { ElemCacheKeyLUT, initStdElementProps } from "./index.js";

const TEST_REFNODE = "hermes-test-refnode";
const TEST_INSTANCE_ID = "7ccf6732-9f1b-4b4d-92bd-08ae5724b650";
const TEST_COMMAND = {
  schemaVersion: "v1",
  commandId: "0f1580e9-1111-4d5c-9d44-c5ceaf814f5a",
  correlationId: "corr-1",
  producerId: "ghostos-hermes-test",
  instanceId: TEST_INSTANCE_ID,
  guildId: "123456789012345678",
  channelId: "223456789012345678",
  type: "send_message",
  payload: {
    text: "hello",
    embeds: [],
    allowedMentions: {},
    replyToMessageId: null,
  },
  issuedAt: "2026-07-02T11:59:00Z",
  expiresAt: "2026-07-02T12:10:00Z",
};

const EMPTY_SENTINEL_INPUTS = [
  {
    label: "empty_bottle + empty_data",
    bottle: { _bname: "empty_bottle", _content: "empty_data" },
  },
  {
    label: "empty_bottle + null",
    bottle: { _bname: "empty_bottle", _content: null },
  },
  {
    label: "empty_bottle + undefined",
    bottle: { _bname: "empty_bottle", _content: undefined },
  },
  {
    label: "empty + empty_data",
    bottle: { _bname: "empty", _content: "empty_data" },
  },
  {
    label: "empty + null",
    bottle: { _bname: "empty", _content: null },
  },
  {
    label: "empty + undefined",
    bottle: { _bname: "empty", _content: undefined },
  },
];

const makeConfigLambda = (config) => {
  return (_input$objArr, controlflow$obj) => {
    return {
      _stream: of(config),
      _control: { _stream: controlflow$obj._stream },
    };
  };
};

const makeJsonResponse = (status, body) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key) => (key === "content-type" ? "application/json" : null),
    },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
};

const requestHref = (requestUrl) => {
  return typeof requestUrl === "string" ? requestUrl : requestUrl?.href;
};

const initHermesFlow = (reducedLambdaObj = {}) => {
  const streamCache = {
    [ElemCacheKeyLUT.LAMBDA_OBJ]: reducedLambdaObj,
    [ElemCacheKeyLUT.REFNODE]: TEST_REFNODE,
    [ElemCacheKeyLUT.RTCONTEXT]: {
      graphdomain: "breezyforest",
      graphappid: "jestleafspell",
      refnode: TEST_REFNODE,
      nodelambda: [],
      contextuallambda: [],
    },
  };
  const hermesProps = initStdElementProps(streamCache, "hermes");
  const datainput$ = new ReplaySubject(1);
  const ctrlinput$ = new ReplaySubject(1);

  const output$obj = driveDataflowByCtrlflow(
    { _stream: ctrlinput$, _config: {} },
    [{ _stream: datainput$ }],
    undefined,
    {
      codebase: "hermes.browser.test.js",
      refnode: TEST_REFNODE,
    },
    {
      leaflogic: hermesProps.leaflogic,
      datalogic: hermesProps.datalogic,
    },
  );

  return { output$obj, datainput$, ctrlinput$, hermesProps };
};

const runTick = async ({
  output$obj,
  datainput$,
  ctrlinput$,
  dataIn,
  ctrlIn = { _bname: "accio" },
}) => {
  const ctrlSub = output$obj._control._stream.subscribe(() => {});
  try {
    const outPromise = firstValueFrom(output$obj._stream.pipe(take(1)));
    datainput$.next(dataIn);
    ctrlinput$.next(ctrlIn);
    return await outPromise;
  } finally {
    ctrlSub.unsubscribe();
  }
};

const runTickCollect = async ({
  output$obj,
  datainput$,
  ctrlinput$,
  dataIn,
  count,
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

const runCtrlTickCollectAllOutputs = async ({
  output$obj,
  datainput$,
  ctrlinput$,
  dataIn,
  ctrlIn = { _bname: "accio" },
}) => {
  const outputs = [];
  const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
  const ctrlSub = output$obj._control._stream.subscribe(() => {});
  try {
    datainput$.next(dataIn);
    ctrlinput$.next(ctrlIn);
    await new Promise((resolve) => setTimeout(resolve, 20));
    return outputs;
  } finally {
    ctrlSub.unsubscribe();
    outSub.unsubscribe();
  }
};

describe("hermes leafelement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves hermes from _std_elements_lut", () => {
    const { hermesProps } = initHermesFlow();
    expect(hermesProps).toBeDefined();
    expect(typeof hermesProps.leaflogic).toBe("function");
    expect(typeof hermesProps.datalogic.pre).toBe("function");
    expect(typeof hermesProps.datalogic.post).toBe("function");
  });

  it("mode=write with valid command payload calls write fetch once and emits success", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(makeJsonResponse(202, { status: "accepted", requestId: "req-1" }));

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow();
    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: TEST_COMMAND,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = global.fetch.mock.calls[0];
    expect(requestHref(requestUrl)).toContain("/api/hermes/egress-commands");
    expect(requestInit.method).toBe("POST");

    expect(output._bname).toBe("elementio");
    expect(output._content.element).toBe("hermes");
    expect(output._content.mode).toBe("write");
    expect(output._content.ok).toBe(true);
    expect(output._content.data.status).toBe("accepted");
    expect(output._content.meta.instanceId).toBe(TEST_INSTANCE_ID);
    expect(output._content.meta.commandId).toBe(TEST_COMMAND.commandId);
  });

  it.each(EMPTY_SENTINEL_INPUTS)(
    "mode=write with sentinel input skips write API call and emits no output ($label)",
    async ({ bottle }) => {
      global.fetch = vi.fn();
      const { output$obj, datainput$, ctrlinput$ } = initHermesFlow();
      const outputs = await runCtrlTickCollectAllOutputs({
        output$obj,
        datainput$,
        ctrlinput$,
        dataIn: bottle,
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(outputs).toHaveLength(0);
    },
  );

  it("mode=both with sentinel input skips write and still runs read path", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(200, {
        schemaVersion: "v1",
        events: [
          {
            eventId: "evt_both_1",
            sequence: 1,
            instanceId: TEST_INSTANCE_ID,
            payload: { text: "read-only-event" },
          },
        ],
        nextCursor: "cursor-both-1",
        hasMore: false,
        requestId: "req-read-both-1",
      }),
    );

    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "both",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { _bname: "empty", _content: null },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = global.fetch.mock.calls[0];
    expect(requestHref(requestUrl)).toContain("/api/hermes/integration/events");
    expect(requestInit.method).toBe("GET");
    expect(output._bname).toBe("elementio");
    expect(output._content.mode).toBe("read");
    expect(output._content.ok).toBe(true);
    expect(output._content.data.event.eventId).toBe("evt_both_1");
  });

  it("routes subscribed Hermes events to output stream in read mode", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          schemaVersion: "v1",
          events: [
            {
              eventId: "evt_1",
              sequence: 1,
              instanceId: TEST_INSTANCE_ID,
              payload: { text: "one" },
            },
          ],
          nextCursor: "cursor-1",
          hasMore: true,
          requestId: "req-read-1",
        }),
      )
      .mockResolvedValueOnce(
        makeJsonResponse(200, {
          schemaVersion: "v1",
          events: [
            {
              eventId: "evt_2",
              sequence: 2,
              instanceId: TEST_INSTANCE_ID,
              payload: { text: "two" },
            },
          ],
          nextCursor: "cursor-2",
          hasMore: false,
          requestId: "req-read-2",
        }),
      );

    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const firstOutput = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
    });
    const secondOutput = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
      ctrlIn: { _bname: "accio", idx: 2 },
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstReadHref = requestHref(global.fetch.mock.calls[0][0]);
    const secondReadHref = requestHref(global.fetch.mock.calls[1][0]);
    expect(firstReadHref).toContain("/api/hermes/integration/events");
    expect(firstReadHref).toContain(`instanceId=${encodeURIComponent(TEST_INSTANCE_ID)}`);
    expect(firstReadHref).not.toContain("cursor=");
    expect(secondReadHref).toContain("cursor=cursor-1");

    expect(firstOutput._bname).toBe("elementio");
    expect(firstOutput._content.mode).toBe("read");
    expect(firstOutput._content.ok).toBe(true);
    expect(firstOutput._content.data.event.eventId).toBe("evt_1");

    expect(secondOutput._bname).toBe("elementio");
    expect(secondOutput._content.mode).toBe("read");
    expect(secondOutput._content.ok).toBe(true);
    expect(secondOutput._content.data.event.eventId).toBe("evt_2");
  });

  it("fails fast with explicit deterministic error bottle for invalid read config", async () => {
    global.fetch = vi.fn();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(output._bname).toBe("error");
    expect(output._content.code).toBe("validation_failed");
    expect(output._content.message).toContain("instanceId");
    expect(output._content.element).toBe("hermes");
  });

  it("emits deterministic machine-readable write errors without leaking secrets", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(409, {
        error: {
          code: "idempotency_conflict",
          message: "Command idempotency key conflicts with different payload.",
          details: {
            commandId: TEST_COMMAND.commandId,
            token: "super-secret-token",
          },
        },
        requestId: "req-conflict",
      }),
    );

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow();
    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: TEST_COMMAND,
    });

    expect(output._bname).toBe("elementio");
    expect(output._content.mode).toBe("write");
    expect(output._content.ok).toBe(false);
    expect(output._content.error.code).toBe("idempotency_conflict");
    expect(output._content.error.status).toBe(409);
    expect(output._content.error.details.commandId).toBe(TEST_COMMAND.commandId);
    expect(output._content.error.details.token).toBe("[redacted]");
  });

  it("fails write validation deterministically before submitting malformed commands", async () => {
    global.fetch = vi.fn();
    const malformedCommand = {
      ...TEST_COMMAND,
    };
    delete malformedCommand.commandId;

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow();
    const output = await runTickCollect({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: malformedCommand,
      count: 1,
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(output[0]._bname).toBe("elementio");
    expect(output[0]._content.mode).toBe("write");
    expect(output[0]._content.ok).toBe(false);
    expect(output[0]._content.error.code).toBe("validation_failed");
    expect(output[0]._content.error.message).toContain("commandId");
    expect(output[0]._content.error.status).toBe(400);
  });

  it("mode=write with explicit error bottle skips write and preserves error passthrough", async () => {
    global.fetch = vi.fn();
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow();
    const upstreamErrorBottle = {
      _bname: "error",
      _content: {
        type: "critical",
        code: "upstream_error",
        message: "Simulated upstream failure",
      },
    };

    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: upstreamErrorBottle,
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(output._bname).toBe("error");
    expect(output._content.code).toBe("upstream_error");
    expect(output._content.message).toBe("Simulated upstream failure");
  });
});

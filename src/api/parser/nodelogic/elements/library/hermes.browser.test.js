import { describe, expect, it, vi, beforeEach } from "vitest";
import { ReplaySubject, firstValueFrom, of } from "rxjs";
import { startWith, take, toArray } from "rxjs/operators";

import { driveDataflowByCtrlflow } from "../../../leaf.js";
import { ElemCacheKeyLUT, initStdElementProps } from "./index.js";

const TEST_REFNODE = "e03c5006-8feb-4bdd-a9de-a2afde5b06ee";
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

const initHermesFlowWithConfig = (config) => {
  return initHermesFlow({
    _default: makeConfigLambda(config),
  });
};

const makeFakeEventSourceRuntime = () => {
  const instances = [];

  class FakeEventSource {
    constructor(url, init = {}) {
      this.url = url;
      this.init = init;
      this.closed = false;
      this.listeners = new Map();
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      instances.push(this);
    }

    addEventListener(eventName, listener) {
      const nextListeners = this.listeners.get(eventName) ?? [];
      nextListeners.push(listener);
      this.listeners.set(eventName, nextListeners);
    }

    removeEventListener(eventName, listener) {
      const nextListeners = this.listeners.get(eventName) ?? [];
      this.listeners.set(
        eventName,
        nextListeners.filter((entry) => entry !== listener),
      );
    }

    emit(eventName, payload = {}) {
      const nextListeners = this.listeners.get(eventName) ?? [];
      nextListeners.forEach((listener) => listener(payload));
      if (eventName === "open" && typeof this.onopen === "function") {
        this.onopen(payload);
      }
      if (eventName === "message" && typeof this.onmessage === "function") {
        this.onmessage(payload);
      }
      if (eventName === "error" && typeof this.onerror === "function") {
        this.onerror(payload);
      }
    }

    close() {
      this.closed = true;
    }
  }

  return {
    instances,
    eventSourceFactory: (url, init) => {
      return new FakeEventSource(url, init);
    },
  };
};

const makeSseProbeResponse = (status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      cancel: vi.fn().mockResolvedValue(undefined),
    },
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

const makeBinaryResponse = (status, body, headers = {}) => {
  const bytes = new globalThis.TextEncoder().encode(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key) => headers[key.toLowerCase()] ?? headers[key] ?? null,
    },
    arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer),
  };
};

const makeSseEnvelopeEvent = ({
  eventId,
  sequence,
  kind = "discord.message",
  discordEventType = "MESSAGE_CREATE",
  text = "hello",
  error = null,
  payload = {},
}) => {
  return {
    schemaVersion: "v1",
    eventId,
    sequence,
    kind,
    instanceId: TEST_INSTANCE_ID,
    payload: {
      discord: {
        eventType: discordEventType,
      },
      content: {
        text,
      },
      error,
      ...payload,
    },
  };
};

const makePublicSseEvent = ({ eventId, text = "hello" }) => {
  return {
    schemaVersion: "v1",
    eventId,
    instanceId: TEST_INSTANCE_ID,
    guildId: "123456789012345678",
    channelId: "223456789012345678",
    kind: "MESSAGE_CREATE",
    createdAt: "2026-07-18T12:00:00.000Z",
    content: {
      text,
      attachments: [],
    },
    channel: {
      channelId: "223456789012345678",
      name: "general",
      type: "GUILD_TEXT",
      metadataStatus: "resolved",
    },
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
  const seededDataInput$ = datainput$.pipe(startWith(undefined));
  const ctrlinput$ = new ReplaySubject(1);

  const output$obj = driveDataflowByCtrlflow(
    { _stream: ctrlinput$, _config: {} },
    [{ _stream: seededDataInput$ }],
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
    global.EventSource = undefined;
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

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
      mode: "write",
    });
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
    const requestBody = JSON.parse(requestInit.body);
    expect(requestBody.commandId).toBe(TEST_COMMAND.commandId);
    expect(requestBody.issuedAt).toBeUndefined();
    expect(requestBody.expiresAt).toBeUndefined();

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
      const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
        mode: "write",
      });
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
        readTransport: "poll",
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

  it("mode=read with channelName filters sends repeated canonical query params", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(200, {
        schemaVersion: "v1",
        events: [
          {
            eventId: "evt_named_channel_1",
            sequence: 1,
            instanceId: TEST_INSTANCE_ID,
            channelId: "223456789012345678",
            content: { text: "named-channel-event" },
          },
        ],
        nextCursor: "cursor-named-channel-1",
        hasMore: false,
        requestId: "req-named-channel-1",
      }),
    );

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
      mode: "read",
      readTransport: "poll",
      instanceId: TEST_INSTANCE_ID,
      guildId: "123456789012345678",
      channelName: ["general", "support"],
      pollIntervalMs: 0,
    });

    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { _bname: "empty", _content: null },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const requestUrl = `${global.fetch.mock.calls[0][0]}`;
    const requestParams = requestUrl.split("?")[1].split("&");
    const channelNameValues = requestParams
      .filter((entry) => entry.startsWith("channelName="))
      .map((entry) => decodeURIComponent(entry.slice("channelName=".length)));
    expect(requestUrl).toContain("/api/hermes/integration/events?");
    expect(channelNameValues).toEqual(["general", "support"]);
    expect(requestParams.some((entry) => entry.startsWith("channelNames="))).toBe(false);
    expect(output._content.ok).toBe(true);
    expect(output._content.data.event.eventId).toBe("evt_named_channel_1");
  });

  it("mode=read with readTransport=sse opens stream without data input and emits pushed events", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [probeUrl, probeInit] = global.fetch.mock.calls[0];
      expect(requestHref(probeUrl)).toContain("/api/hermes/integration/events");
      expect(requestHref(probeUrl)).not.toContain("/api/hermes/integration/events/stream");
      expect(probeInit.method).toBe("HEAD");
      expect(probeInit.headers.Accept).toBe("text/event-stream");
      expect(instances).toHaveLength(1);
      expect(instances[0].url).toContain("/api/hermes/integration/events");
      expect(instances[0].url).not.toContain("/api/hermes/integration/events/stream");
      expect(outputs).toHaveLength(0);

      instances[0].emit("open", { type: "open" });

      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_sse_1",
            sequence: 1,
            text: "from-sse",
          }),
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(outputs).toHaveLength(1);
      expect(outputs[0]._bname).toBe("elementio");
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_sse_1");
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse emits public payloads and reconnects with SSE id cursor", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await vi.advanceTimersByTimeAsync(50);
      expect(instances).toHaveLength(1);

      const sseCursor = "opaque.cursor/one==";
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        lastEventId: sseCursor,
        data: JSON.stringify(
          makePublicSseEvent({
            eventId: "evt_public_sse_1",
            text: "from-public-contract",
          }),
        ),
      });
      await vi.advanceTimersByTimeAsync(50);

      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.cursor).toBe(sseCursor);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_public_sse_1");
      expect(outputs[0]._content.data.event.kind).toBe("MESSAGE_CREATE");

      instances[0].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(1200);

      expect(instances).toHaveLength(2);
      expect(instances[1].url).toContain(`cursor=${encodeURIComponent(sseCursor)}`);
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
      vi.useRealTimers();
    }
  });

  it("mode=read with readTransport=sse opens stream when control flow is subscribed", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(instances).toHaveLength(1);
    } finally {
      ctrlSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse keeps stream active while subscribers remain and closes when all unsubscribe", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outSub = output$obj._stream.subscribe(() => {});
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(instances).toHaveLength(1);
      expect(instances[0].closed).toBe(false);

      outSub.unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(instances[0].closed).toBe(false);

      ctrlSub.unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(instances[0].closed).toBe(true);

      ctrlinput$.next({ _bname: "accio", idx: 2 });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(instances).toHaveLength(1);
    } finally {
      if (!ctrlSub.closed) {
        ctrlSub.unsubscribe();
      }
      if (!outSub.closed) {
        outSub.unsubscribe();
      }
    }
  });

  it("mode=read with readTransport=sse ignores default unnamed message events", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("message", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_sse_message_1",
            sequence: 11,
            text: "from-default-message",
          }),
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(0);
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse does not classify post-open close as auth failure", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const traceSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_sse_close_1",
            sequence: 12,
            text: "close-soon",
          }),
        ),
      });
      instances[0].emit("error", { type: "error" });
      await new Promise((resolve) => setTimeout(resolve, 20));

      const traceLines = traceSpy.mock.calls.map(([message]) => `${message}`);
      expect(traceLines.some((line) => line.includes("event=sse.auth.fail"))).toBe(false);
      expect(
        traceLines.some((line) => line.includes("event=sse.lifecycle.reconnect_scheduled")),
      ).toBe(true);
    } finally {
      ctrlSub.unsubscribe();
      traceSpy.mockRestore();
    }
  });

  it("mode=read with readTransport=sse marks authResolved after preflight 200 before first frame", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const traceSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("error", { type: "error" });
      await new Promise((resolve) => setTimeout(resolve, 20));

      const traceLines = traceSpy.mock.calls.map(([message]) => `${message}`);
      expect(
        traceLines.some(
          (line) =>
            line.includes("event=sse.lifecycle.error") &&
            line.includes("authResolved=true") &&
            line.includes("lastHttpStatus=200"),
        ),
      ).toBe(true);
    } finally {
      ctrlSub.unsubscribe();
      traceSpy.mockRestore();
    }
  });

  it("mode=read with readTransport=sse emits explicit auth fail for preflight 401", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(401));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [probeUrl, probeInit] = global.fetch.mock.calls[0];
    expect(requestHref(probeUrl)).toContain("/api/hermes/integration/events");
    expect(requestHref(probeUrl)).not.toContain("/api/hermes/integration/events/stream");
    expect(probeInit.method).toBe("HEAD");
    expect(probeInit.headers.Accept).toBe("text/event-stream");
    expect(instances).toHaveLength(0);
    expect(output._content.mode).toBe("read");
    expect(output._content.ok).toBe(false);
    expect(output._content.error.code).toBe("auth_unauthorized");
    expect(output._content.error.status).toBe(401);
    expect(output._content.error.details.reason).toBe("http_401");
  });

  it("mode=read with readTransport=sse filters out runtime.observed noise without payload error", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_runtime_observed_1",
            sequence: 20,
            kind: "runtime.observed",
            discordEventType: "STATUS_UPDATE",
            text: null,
            error: null,
          }),
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(0);
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse keeps runtime.observed when payload.error is not null", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_runtime_observed_error_1",
            sequence: 21,
            kind: "runtime.observed",
            discordEventType: "STATUS_UPDATE",
            text: null,
            error: { code: "upstream_error", message: "simulated" },
          }),
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_runtime_observed_error_1");
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse dispatches wrapped user message payloads", async () => {
    global.fetch = vi.fn().mockImplementation((requestUrl) => {
      const href = requestHref(requestUrl);
      if (href.includes("https://cdn.example.test/diagram.png")) {
        return Promise.resolve(
          makeBinaryResponse(200, "image-bytes", { "content-type": "image/png" }),
        );
      }
      return Promise.resolve(makeSseProbeResponse(200));
    });
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      const attachments = [
        {
          id: "att-1",
          filename: "diagram.png",
          contentType: "image/png",
          url: "https://cdn.example.test/diagram.png",
          size: 1234,
        },
      ];
      instances[0].emit("hermes.event", {
        data: JSON.stringify({
          schemaVersion: "v1",
          eventId: "evt_wrapped_user_message_1",
          sequence: 24,
          kind: "discord.message",
          payload: {
            discord: {
              eventType: "STATUS_UPDATE",
            },
            content: {
              text: null,
            },
            event: {
              discord: {
                eventType: "MESSAGE_CREATE",
              },
              content: {
                text: "wrapped-user-message",
                attachments,
              },
            },
          },
        }),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      const expectedAttachments = [
        {
          id: "att-1",
          filename: "diagram.png",
          contentType: "image/png",
          url: "data:image/png;base64,aW1hZ2UtYnl0ZXM=",
          size: 1234,
        },
      ];
      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_wrapped_user_message_1");
      expect(outputs[0]._content.data.event.content.attachments).toEqual(expectedAttachments);
      expect(outputs[0]._content.data.event.payload.event.content.attachments).toEqual(
        expectedAttachments,
      );
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse keeps runtime.observed when wrapped user message is present", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify({
          schemaVersion: "v1",
          eventId: "evt_runtime_observed_wrapped_1",
          sequence: 25,
          kind: "runtime.observed",
          data: {
            event: {
              discord: {
                eventType: "MESSAGE_CREATE",
              },
              content: {
                text: "wrapped-runtime-message",
              },
            },
          },
        }),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_runtime_observed_wrapped_1");
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse dispatches discord.message.received with payload.content string", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify({
          schemaVersion: "v1",
          eventId: "evt_discord_message_received_1",
          sequence: 26,
          kind: "discord.message.received",
          payload: {
            content: "hello-from-discord-received",
          },
        }),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_discord_message_received_1");
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse dispatches message events with non-empty attachments and no text", async () => {
    global.fetch = vi.fn().mockImplementation((requestUrl) => {
      const href = requestHref(requestUrl);
      if (href.includes("/photo.jpg")) {
        return Promise.resolve(
          makeBinaryResponse(200, "photo-bytes", { "content-type": "image/jpeg" }),
        );
      }
      return Promise.resolve(makeSseProbeResponse(200));
    });
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const attachments = [
      {
        id: "att-only-1",
        contentType: "image/jpeg",
        url: "https://cdn.example.test/attachments/1527498821528195215/1529135833767219370/photo.jpg?ex=6a60d638&is=6a5f84b8&hm=abc",
        size: 2048,
      },
    ];
    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_sse_attachment_only_1",
            sequence: 28,
            discordEventType: "MESSAGE_CREATE",
            text: null,
            payload: {
              content: {
                text: null,
                attachments,
              },
            },
          }),
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      const expectedAttachments = [
        {
          id: "att-only-1",
          filename: "photo.jpg",
          contentType: "image/jpeg",
          url: "data:image/jpeg;base64,cGhvdG8tYnl0ZXM=",
          size: 2048,
        },
      ];
      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_sse_attachment_only_1");
      expect(outputs[0]._content.data.event.content.attachments).toEqual(expectedAttachments);
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse filters discord.message.received when explicit bot actor flag is true", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify({
          schemaVersion: "v1",
          eventId: "evt_discord_message_received_bot_1",
          sequence: 27,
          kind: "discord.message.received",
          payload: {
            content: "bot-authored-message",
            author: {
              bot: true,
            },
          },
        }),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(0);
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=sse filters non-message Discord events and null text payloads", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseProbeResponse(200));
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await new Promise((resolve) => setTimeout(resolve, 20));
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_filtered_non_message_create_1",
            sequence: 22,
            discordEventType: "MESSAGE_UPDATE",
            text: "updated-content",
          }),
        ),
      });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_filtered_null_text_1",
            sequence: 23,
            discordEventType: "MESSAGE_CREATE",
            text: null,
          }),
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outputs).toHaveLength(0);
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
    }
  });

  it("mode=read with readTransport=auto falls back to poll when SSE is unavailable", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(200, {
        schemaVersion: "v1",
        events: [
          {
            eventId: "evt_poll_fallback_1",
            sequence: 1,
            instanceId: TEST_INSTANCE_ID,
            payload: { text: "poll-fallback" },
          },
        ],
        nextCursor: "cursor-poll-fallback-1",
        hasMore: false,
        requestId: "req-poll-fallback-1",
      }),
    );

    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "auto",
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
      dataIn: { ignore: true },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(requestHref(global.fetch.mock.calls[0][0])).toContain("/api/hermes/integration/events");
    expect(output._content.mode).toBe("read");
    expect(output._content.ok).toBe(true);
    expect(output._content.data.event.eventId).toBe("evt_poll_fallback_1");
  });

  it("mode=read with readTransport=auto keeps reconnecting for authenticated short no-frame closures without poll fallback", async () => {
    vi.useFakeTimers();
    const traceSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    global.fetch = vi.fn().mockImplementation((_requestUrl, requestInit = {}) => {
      if (requestInit.method === "HEAD") {
        return Promise.resolve(makeSseProbeResponse(200));
      }
      return Promise.resolve(makeJsonResponse(200, { schemaVersion: "v1", events: [] }));
    });
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "auto",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      datainput$.next({ ignore: true });
      ctrlinput$.next({ _bname: "accio" });
      await vi.advanceTimersByTimeAsync(50);
      expect(outputs).toHaveLength(0);
      expect(instances).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      instances[0].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(1200);
      expect(instances).toHaveLength(2);

      instances[1].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(1600);
      expect(instances).toHaveLength(3);

      instances[2].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(2500);
      expect(instances.length).toBeGreaterThanOrEqual(4);

      const requestMethods = global.fetch.mock.calls.map(([_requestUrl, requestInit = {}]) => {
        return requestInit.method;
      });
      expect(requestMethods.filter((method) => method === "HEAD")).toHaveLength(1);
      expect(requestMethods.some((method) => method === "GET")).toBe(false);

      const traceLines = traceSpy.mock.calls.map(([message]) => `${message}`);
      expect(
        traceLines.some(
          (line) =>
            line.includes("event=sse.lifecycle.fallback_poll_enabled") &&
            line.includes("reason=max_no_frame_retries"),
        ),
      ).toBe(false);
      expect(
        traceLines.some(
          (line) =>
            line.includes("event=sse.lifecycle.reconnect_scheduled") &&
            line.includes("reason=stream_closed_no_frame_authenticated"),
        ),
      ).toBe(true);
    } finally {
      traceSpy.mockRestore();
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
      vi.useRealTimers();
    }
  });

  it("mode=read with readTransport=auto falls back to poll only after repeated no-frame SSE errors", async () => {
    vi.useFakeTimers();
    const traceSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    global.fetch = vi.fn().mockImplementation((_requestUrl, requestInit = {}) => {
      if (requestInit.method === "HEAD") {
        return Promise.resolve(makeSseProbeResponse(503));
      }
      return Promise.resolve(
        makeJsonResponse(200, {
          schemaVersion: "v1",
          events: [
            {
              eventId: "evt_poll_after_error_1",
              sequence: 1,
              instanceId: TEST_INSTANCE_ID,
              payload: { text: "after-stream-error" },
            },
          ],
          nextCursor: "cursor-poll-after-error-1",
          hasMore: false,
          requestId: "req-poll-after-error-1",
        }),
      );
    });
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "auto",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      datainput$.next({ ignore: true });
      ctrlinput$.next({ _bname: "accio" });
      await vi.advanceTimersByTimeAsync(50);
      expect(outputs).toHaveLength(0);
      expect(instances).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      instances[0].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(1200);

      expect(instances).toHaveLength(2);
      instances[1].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(1600);

      expect(instances).toHaveLength(3);
      instances[2].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(50);

      datainput$.next({ ignore: true });
      ctrlinput$.next({ _bname: "accio", idx: 2 });
      await vi.advanceTimersByTimeAsync(50);

      const requestMethods = global.fetch.mock.calls.map(([_requestUrl, requestInit = {}]) => {
        return requestInit.method;
      });
      expect(requestMethods.some((method) => method === "GET")).toBe(true);
      expect(outputs).toHaveLength(1);
      expect(outputs[0]._content.mode).toBe("read");
      expect(outputs[0]._content.ok).toBe(true);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_poll_after_error_1");
      const traceLines = traceSpy.mock.calls.map(([message]) => `${message}`);
      expect(
        traceLines.some(
          (line) =>
            line.includes("event=sse.lifecycle.fallback_poll_enabled") &&
            line.includes("reason=max_no_frame_retries"),
        ),
      ).toBe(true);
      expect(
        traceLines.some(
          (line) =>
            line.includes("event=sse.auth.fail") && line.includes("reason=max_no_frame_retries"),
        ),
      ).toBe(false);
    } finally {
      traceSpy.mockRestore();
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
      vi.useRealTimers();
    }
  });

  it("dedupes repeated SSE events across reconnects by message id", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockImplementation((_requestUrl, requestInit = {}) => {
      if (requestInit.method === "HEAD") {
        return Promise.resolve(makeSseProbeResponse(200));
      }
      return Promise.resolve(makeJsonResponse(200, { schemaVersion: "v1", events: [] }));
    });
    const { instances, eventSourceFactory } = makeFakeEventSourceRuntime();
    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readTransport: "sse",
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        pollIntervalMs: 0,
        eventSourceFactory,
      }),
    };
    const { output$obj, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const outputs = [];
    const outSub = output$obj._stream.subscribe((output) => outputs.push(output));
    const ctrlSub = output$obj._control._stream.subscribe(() => {});
    try {
      ctrlinput$.next({ _bname: "accio" });
      await vi.advanceTimersByTimeAsync(50);
      instances[0].emit("open", { type: "open" });
      instances[0].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_dedupe_1",
            sequence: 1,
            text: "first",
          }),
        ),
      });
      await vi.advanceTimersByTimeAsync(50);

      instances[0].emit("error", { type: "error" });
      await vi.advanceTimersByTimeAsync(1200);
      expect(instances).toHaveLength(2);

      instances[1].emit("open", { type: "open" });
      instances[1].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_dedupe_1",
            sequence: 1,
            text: "duplicate",
          }),
        ),
      });
      instances[1].emit("hermes.event", {
        data: JSON.stringify(
          makeSseEnvelopeEvent({
            eventId: "evt_dedupe_2",
            sequence: 2,
            text: "second",
          }),
        ),
      });
      await vi.advanceTimersByTimeAsync(50);

      expect(outputs).toHaveLength(2);
      expect(outputs[0]._content.data.event.eventId).toBe("evt_dedupe_1");
      expect(outputs[1]._content.data.event.eventId).toBe("evt_dedupe_2");
    } finally {
      ctrlSub.unsubscribe();
      outSub.unsubscribe();
      vi.useRealTimers();
    }
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
        readTransport: "poll",
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

  it("emits read output for non-events Hermes instance responses", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(200, {
        instanceId: TEST_INSTANCE_ID,
        guildId: "123456789012345678",
        channelId: "223456789012345678",
        status: "connected",
        memberCount: 4,
        requestId: "req-instance-1",
      }),
    );

    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        readPath: `/hermes-instances/${TEST_INSTANCE_ID}`,
        instanceId: TEST_INSTANCE_ID,
        readTransport: "poll",
        pollIntervalMs: 0,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);

    const output = await runTick({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = global.fetch.mock.calls[0];
    expect(requestHref(requestUrl)).toContain(`/hermes-instances/${TEST_INSTANCE_ID}`);
    expect(requestInit.method).toBe("GET");

    expect(output._bname).toBe("elementio");
    expect(output._content.mode).toBe("read");
    expect(output._content.ok).toBe(true);
    expect(output._content.data.event.instanceId).toBe(TEST_INSTANCE_ID);
    expect(output._content.data.event.status).toBe("connected");
  });

  it("does not emit read output for metadata-only non-events responses", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(200, {
        requestId: "req-empty",
        hasMore: false,
      }),
    );

    const reducedLambdaObj = {
      _default: makeConfigLambda({
        mode: "read",
        instanceId: TEST_INSTANCE_ID,
        readTransport: "poll",
        pollIntervalMs: 0,
      }),
    };
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlow(reducedLambdaObj);
    const outputs = await runCtrlTickCollectAllOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(outputs).toHaveLength(0);
  });

  it("mode=read falls back to refnode instanceId when instanceId is omitted", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeJsonResponse(200, {
        schemaVersion: "v1",
        events: [],
        hasMore: false,
        requestId: "req-refnode-fallback",
      }),
    );
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
      mode: "read",
      readTransport: "poll",
      pollIntervalMs: 0,
    });
    await runCtrlTickCollectAllOutputs({
      output$obj,
      datainput$,
      ctrlinput$,
      dataIn: { ignore: true },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = global.fetch.mock.calls[0];
    expect(requestInit.method).toBe("GET");
    expect(requestHref(requestUrl)).toContain(`instanceId=${encodeURIComponent(TEST_REFNODE)}`);
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

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
      mode: "write",
    });
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

    const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
      mode: "write",
    });
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
    const { output$obj, datainput$, ctrlinput$ } = initHermesFlowWithConfig({
      mode: "write",
    });
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

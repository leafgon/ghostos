import { describe, expect, it, vi } from "vitest";

import { createRuntimeEnvelopeFactory, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import {
  UI_CONTROL_INTENTS,
  UiBridgePolicyError,
  assertRepeatableCommandIdentity,
  createUiBridgeRuntime,
  createUiControlEnvelope,
  resolveUiBridgePolicy,
} from "./uiBridgeWorkflow.js";
import {
  resolveLeafElementRuntimeClassification,
  resolveNodeRuntimeClassification,
} from "./nodeClassification.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import { createDeterministicIdFactory } from "./sideEffectMigrationHarness.js";

const createEventFactory = (graphInstanceId = "ui-bridge-policy") =>
  createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

describe("UI bridge runtime policy helpers", () => {
  it("classifies leafscreenio and P2 UI adapters with sink/source bridge metadata", () => {
    expect(UI_CONTROL_INTENTS).toEqual([
      "ui_clear",
      "ui_close",
      "ui_refresh",
      "media_play",
      "media_pause",
      "media_stop",
    ]);
    expect(resolveNodeRuntimeClassification({ type: "leafscreenio", args: {} })).toMatchObject({
      runtimeClass: "ui_sink_source_bridge",
      trigger: "data",
      ui: {
        role: "screen",
        renderTrigger: "data",
        sourceEvents: true,
        suppressControlReplay: true,
        typedControl: ["ui_clear", "ui_refresh", "ui_close"],
      },
    });
    expect(resolveLeafElementRuntimeClassification("gnav")).toMatchObject({
      runtimeClass: "ui_sink_source_bridge",
      ui: {
        role: "navigation",
        commandIdentityRequired: true,
      },
    });
    expect(resolveLeafElementRuntimeClassification("mediaplayer")).toMatchObject({
      runtimeClass: "sink",
      ui: {
        role: "media",
        sourceEvents: false,
        typedControl: ["media_play", "media_pause", "media_stop"],
        commandIdentityRequired: true,
      },
    });
    expect(resolveUiBridgePolicy({ adapterName: "form" })).toMatchObject({
      role: "form",
      renderTrigger: "data",
      sourceEvents: true,
    });
  });

  it("renders display updates on data and suppresses generic control/config ticks", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const render = vi.fn((payload) => ({
      rendered: true,
      value: payload.value,
      authorization: payload.authorization,
    }));
    const runtime = createUiBridgeRuntime({
      adapterName: "editor",
      nodeId: "editor-node",
      runtimeTargetKey: "leafelement:editor",
      host: { render },
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const dataEvent = eventFactory.data(
      {
        value: "document",
        authorization: "Bearer abc123",
      },
      {
        eventId: "render-data-1",
        sourceNodeId: "model",
        parentEventIds: ["source-event"],
      },
    );
    const controlTick = eventFactory.control({
      eventId: "legacy-control-1",
      sourceNodeId: "runtime",
      targetNodeId: "editor-node",
      intent: "legacy_tick",
    });
    const configTick = eventFactory.control({
      eventId: "config-1",
      sourceNodeId: "runtime",
      targetNodeId: "editor-node",
      intent: "refresh_config",
    });

    const rendered = runtime.renderDataEvent(dataEvent);
    expect(runtime.renderDataEvent(controlTick)).toBeUndefined();
    expect(runtime.handleControlEvent(configTick)).toEqual({
      handled: false,
      reason: "config_future_behavior_only",
    });

    expect(render).toHaveBeenCalledTimes(1);
    expect(unwrapRuntimeEnvelope(rendered)).toEqual({
      rendered: true,
      value: "document",
      authorization: "Bearer abc123",
    });
    expect(rendered.trace.parentEventIds).toEqual(["render-data-1", "source-event"]);
    expect(
      sinks.snapshot().traces.map((event) => [event.event, event.decision, event.reason]),
    ).toEqual([
      ["ui_bridge_render_decision", "render", "data"],
      ["ui_bridge_render_decision", "skip", "not_data"],
      ["ui_bridge_control_decision", "skip", "config_future_behavior_only"],
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("emits user input, submissions, navigation, and close actions as source data events", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const parentEvent = eventFactory.data(
      {
        view: "form",
        token: "secret-token",
      },
      {
        eventId: "render-parent",
        sourceNodeId: "form-model",
      },
    );
    const formRuntime = createUiBridgeRuntime({
      adapterName: "form",
      nodeId: "form-node",
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const popupRuntime = createUiBridgeRuntime({
      adapterName: "popup",
      nodeId: "popup-node",
      observability: {
        traceSink: sinks.traceSink,
      },
    });

    const submission = formRuntime.emitSourceEvent({
      action: "submit",
      payload: {
        fields: { name: "Leaf" },
        cookie: "sessionid=abc",
      },
      eventId: "form-submit-1",
      parentEvent,
    });
    const close = popupRuntime.emitSourceEvent({
      action: "close",
      payload: { reason: "user" },
      eventId: "popup-close-1",
      parentEventIds: ["popup-render-1"],
    });

    expect(submission).toMatchObject({
      eventId: "form-submit-1",
      eventKind: "data",
      sourceNodeId: "form-node:source",
      trace: {
        trigger: "ui_source",
        uiBridge: "form",
        action: "submit",
        parentEventIds: ["render-parent"],
      },
    });
    expect(close).toMatchObject({
      eventId: "popup-close-1",
      eventKind: "data",
      sourceNodeId: "popup-node:source",
      trace: {
        trigger: "ui_source",
        uiBridge: "popup",
        action: "close",
        parentEventIds: ["popup-render-1"],
      },
    });
    expect(sinks.snapshot().traces.map((event) => event.event)).toEqual([
      "ui_bridge_source_event",
      "ui_bridge_source_event",
    ]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("handles typed UI/media controls separately from data, retry, replay, and legacy ticks", () => {
    const sinks = createInMemoryRuntimeSinks();
    const control = vi.fn((intent, command) => ({
      intent,
      commandId: command.commandId,
      ok: true,
    }));
    const promptRuntime = createUiBridgeRuntime({
      adapterName: "prompt",
      nodeId: "prompt-node",
      host: { control },
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const mediaRuntime = createUiBridgeRuntime({
      adapterName: "mediaplayer",
      nodeId: "media-node",
      host: { control },
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    const clear = createUiControlEnvelope({
      intent: "ui_clear",
      eventId: "prompt-clear-1",
      targetNodeId: "prompt-node",
      command: { scope: "input" },
    });
    const retry = createUiControlEnvelope({
      intent: "ui_refresh",
      eventId: "prompt-refresh-1",
      targetNodeId: "prompt-node",
      command: { source: "button" },
    });
    const play = createUiControlEnvelope({
      intent: "media_play",
      eventId: "media-play-1",
      targetNodeId: "media-node",
      command: {
        commandId: "media-command-1",
        uri: "song.mp3",
      },
    });
    const invalidPlay = createUiControlEnvelope({
      intent: "media_play",
      eventId: "media-play-2",
      targetNodeId: "media-node",
      command: {
        uri: "song.mp3",
      },
    });

    expect(promptRuntime.handleControlEvent(clear)).toEqual({
      handled: true,
      intent: "ui_clear",
      result: {
        intent: "ui_clear",
        commandId: undefined,
        ok: true,
      },
    });
    expect(promptRuntime.handleControlEvent(retry)).toMatchObject({
      handled: true,
      intent: "ui_refresh",
    });
    expect(mediaRuntime.handleControlEvent(play)).toMatchObject({
      handled: true,
      intent: "media_play",
      result: {
        commandId: "media-command-1",
      },
    });
    expect(() => mediaRuntime.handleControlEvent(invalidPlay)).toThrow(UiBridgePolicyError);
    expect(() =>
      assertRepeatableCommandIdentity({
        adapterName: "gnav",
        command: {},
      }),
    ).toThrow(UiBridgePolicyError);
    expect(
      assertRepeatableCommandIdentity({
        adapterName: "gnav",
        command: { commandId: "nav-1" },
      }),
    ).toEqual({
      required: true,
      commandId: "nav-1",
    });
    expect(sinks.snapshot().traces.map((event) => [event.decision, event.reason])).toEqual([
      ["control", "ui_clear"],
      ["control", "ui_refresh"],
      ["control", "media_play"],
    ]);
  });

  it("covers leafscreenio sink/source split and works with no-op browser hosts", () => {
    const eventFactory = createEventFactory();
    const screen = createUiBridgeRuntime({
      adapterName: "leafscreenio",
      nodeId: "screen-node",
    });
    const renderEvent = eventFactory.data(
      {
        frame: "home",
      },
      {
        eventId: "screen-render-1",
        sourceNodeId: "screen-model",
      },
    );

    const rendered = screen.renderDataEvent(renderEvent);
    const source = screen.emitSourceEvent({
      action: "click",
      payload: {
        target: "save",
      },
      eventId: "screen-click-1",
      parentEvent: rendered,
    });

    expect(unwrapRuntimeEnvelope(rendered)).toEqual({ frame: "home" });
    expect(rendered.trace).toMatchObject({
      uiBridge: "leafscreenio",
      role: "screen",
      parentEventIds: ["screen-render-1"],
    });
    expect(source.trace.parentEventIds).toEqual([
      "screen-render-1:leafscreenio:render",
      "screen-render-1",
    ]);
    expect(screen.snapshot()).toMatchObject({
      renderHistory: [
        {
          adapterName: "leafscreenio",
          nodeId: "screen-node",
          eventId: "screen-render-1",
        },
      ],
      sourceHistory: [
        {
          adapterName: "leafscreenio",
          action: "click",
          eventId: "screen-click-1",
        },
      ],
    });
  });
});

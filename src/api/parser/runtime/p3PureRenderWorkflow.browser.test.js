import { describe, expect, it } from "vitest";

import { createRuntimeEnvelopeFactory, unwrapRuntimeEnvelope } from "./eventEnvelope.js";
import { executeP3CoreNodeByPolicy, renderP3AdapterByPolicy } from "./p3PureRenderWorkflow.js";
import {
  resolveLeafElementRuntimeClassification,
  resolveNodeRuntimeClassification,
} from "./nodeClassification.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import { createDeterministicIdFactory } from "./sideEffectMigrationHarness.js";

const createEventFactory = (graphInstanceId = "p3-pure-render-policy") =>
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

describe("P3 pure transform and render policy helpers", () => {
  it("classifies P3 core nodes and render adapters with deterministic data policies", () => {
    ["leaflabel", "leafdelabel", "leafbottle", "leafunbottle", "leafcrate"].forEach((nodeType) => {
      expect(resolveNodeRuntimeClassification({ type: nodeType, args: {} })).toMatchObject({
        runtimeClass: "pure_transform",
        trigger: "data",
        priority: "P3",
        p3: {
          deterministic: true,
          preservesParentEventIds: true,
          suppressControlReplay: true,
          configUpdates: "future-only",
        },
      });
    });
    ["text", "image", "html"].forEach((elementname) => {
      expect(resolveLeafElementRuntimeClassification(elementname)).toMatchObject({
        trigger: "data",
        priority: "P3",
        p3: {
          deterministic: true,
          hiddenExternalSideEffects: false,
        },
      });
    });
    expect(resolveNodeRuntimeClassification({ type: "leafunbottle", args: {} })).toMatchObject({
      p3: {
        filterNoOutput: true,
      },
    });
  });

  it("executes each core P3 node on data with deterministic outputs and parent IDs", () => {
    const eventFactory = createEventFactory();
    const data = eventFactory.data(
      {
        b: 2,
        a: 1,
        token: "secret-token",
      },
      {
        eventId: "p3-data-1",
        sourceNodeId: "source",
        parentEventIds: ["root-event"],
      },
    );
    const label = executeP3CoreNodeByPolicy({
      nodeType: "leaflabel",
      event: data,
      args: { label: "kind" },
    });
    const delabel = executeP3CoreNodeByPolicy({
      nodeType: "leafdelabel",
      event: label,
    });
    const bottle = executeP3CoreNodeByPolicy({
      nodeType: "leafbottle",
      event: delabel,
      args: { bottlekey: "payload" },
    });
    const unbottle = executeP3CoreNodeByPolicy({
      nodeType: "leafunbottle",
      event: bottle,
      args: { bottlekey: "payload" },
    });
    const crate = executeP3CoreNodeByPolicy({
      nodeType: "leafcrate",
      event: unbottle,
      args: { label: "crate" },
    });

    expect(unwrapRuntimeEnvelope(label)).toEqual({
      label: "kind",
      value: { b: 2, a: 1, token: "secret-token" },
    });
    expect(unwrapRuntimeEnvelope(delabel)).toEqual({ b: 2, a: 1, token: "secret-token" });
    expect(unwrapRuntimeEnvelope(bottle)).toMatchObject({
      _bname: "payload",
      _content: { b: 2, a: 1, token: "secret-token" },
    });
    expect(unwrapRuntimeEnvelope(unbottle)).toEqual({ b: 2, a: 1, token: "secret-token" });
    expect(unwrapRuntimeEnvelope(crate)).toEqual({
      _cratelabel: { tag: "crate" },
      payload: { a: 1, b: 2, token: "secret-token" },
    });
    expect(label.trace.parentEventIds).toEqual(["p3-data-1", "root-event"]);
    expect(crate.trace.parentEventIds).toContain(
      "p3-data-1:leaflabel:out:leafdelabel:out:leafbottle:out:leafunbottle:out",
    );
  });

  it("suppresses control/config ticks and traces missing unbottle keys as no-output", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const control = eventFactory.control({
      eventId: "control-1",
      sourceNodeId: "runtime",
      targetNodeId: "leaflabel",
      intent: "legacy_tick",
    });
    const config = eventFactory.control({
      eventId: "config-1",
      sourceNodeId: "runtime",
      targetNodeId: "leaflabel",
      intent: "refresh_config",
    });
    const data = eventFactory.data(
      { _bname: "other", _content: "ignored", _label: {} },
      { eventId: "bottle-other" },
    );

    expect(
      executeP3CoreNodeByPolicy({
        nodeType: "leaflabel",
        event: control,
        observability: { traceSink: sinks.traceSink },
      }),
    ).toBeUndefined();
    expect(
      executeP3CoreNodeByPolicy({
        nodeType: "leaflabel",
        event: config,
        observability: { traceSink: sinks.traceSink },
      }),
    ).toBeUndefined();
    expect(
      executeP3CoreNodeByPolicy({
        nodeType: "leafunbottle",
        event: data,
        args: { bottlekey: "payload" },
        observability: { traceSink: sinks.traceSink },
      }),
    ).toBeUndefined();
    expect(
      sinks.snapshot().traces.map((event) => [event.event, event.decision, event.reason]),
    ).toEqual([
      ["p3_core_policy_decision", "skip", "not_data"],
      ["p3_core_policy_decision", "skip", "config_future_only"],
      ["p3_core_no_output", "no-output", "filtered_or_missing_input"],
    ]);
  });

  it("renders text, image, and html adapters deterministically without hidden external effects", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    const data = eventFactory.data(
      {
        title: "Leaf",
        text: "Hello",
        image: "leaf.png",
        authorization: "Bearer abc123",
      },
      {
        eventId: "render-data-1",
        sourceNodeId: "render-source",
        parentEventIds: ["root-render"],
      },
    );
    const text = renderP3AdapterByPolicy({
      adapterName: "text",
      event: data,
      observability: { traceSink: sinks.traceSink },
    });
    const image = renderP3AdapterByPolicy({
      adapterName: "image",
      event: data,
      observability: { traceSink: sinks.traceSink },
    });
    const html = renderP3AdapterByPolicy({
      adapterName: "html",
      event: data,
      config: {
        version: "template-v1",
        configFingerprintPrefix: "abcd1234",
        template: "<h1>{{title}}</h1><p>{{text}}</p>",
      },
      observability: { traceSink: sinks.traceSink },
    });

    expect(unwrapRuntimeEnvelope(text)).toEqual({ type: "text", text: "Hello" });
    expect(unwrapRuntimeEnvelope(image)).toEqual({
      type: "image",
      imagelist: [
        {
          title: "Leaf",
          text: "Hello",
          image: "leaf.png",
          authorization: "Bearer abc123",
        },
      ],
    });
    expect(unwrapRuntimeEnvelope(html)).toEqual({
      type: "html",
      innerhtml: "<h1>Leaf</h1><p>Hello</p>",
      templateVersion: undefined,
    });
    expect(html.trace.parentEventIds).toEqual(["render-data-1", "root-render"]);
    assertNoSecretLeak(sinks.snapshot().traces);
  });

  it("applies HTML/template config on future data only and does not replay retained input", () => {
    const eventFactory = createEventFactory();
    const sinks = createInMemoryRuntimeSinks();
    let config = {
      version: "template-v1",
      configFingerprintPrefix: "aaaa1111",
      template: "<span>{{value}}</span>",
    };
    const firstData = eventFactory.data({ value: "one" }, { eventId: "html-data-1" });
    const first = renderP3AdapterByPolicy({
      adapterName: "html",
      event: firstData,
      config,
      observability: { traceSink: sinks.traceSink },
    });
    const configTick = eventFactory.control({
      eventId: "html-config",
      sourceNodeId: "runtime",
      targetNodeId: "html-node",
      intent: "refresh_config",
    });
    config = {
      version: "template-v2",
      configFingerprintPrefix: "bbbb2222",
      template: "<strong>{{value}}</strong>",
    };
    const noReplay = renderP3AdapterByPolicy({
      adapterName: "html",
      event: configTick,
      config,
      observability: { traceSink: sinks.traceSink },
    });
    const second = renderP3AdapterByPolicy({
      adapterName: "html",
      event: eventFactory.data({ value: "two" }, { eventId: "html-data-2" }),
      config,
      observability: { traceSink: sinks.traceSink },
    });

    expect(unwrapRuntimeEnvelope(first).innerhtml).toBe("<span>one</span>");
    expect(noReplay).toBeUndefined();
    expect(unwrapRuntimeEnvelope(second).innerhtml).toBe("<strong>two</strong>");
    expect(
      sinks.snapshot().traces.map((event) => [event.decision, event.reason, event.configVersion]),
    ).toEqual([
      ["render", "data", "template-v1"],
      ["skip", "config_future_only", "template-v2"],
      ["render", "data", "template-v2"],
    ]);
  });
});

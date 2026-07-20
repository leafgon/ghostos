import { describe, expect, it } from "vitest";

import { _leafstdlib_dataflow_api } from "../../metamodel.js";
import {
  initStdElementProps,
  listWiredLeafElementNames,
} from "../nodelogic/elements/library/index.js";
import { listRunnableLeafNodeTypes } from "../breezyforest.js";
import {
  NodeClassificationError,
  assertLeafElementAdapterSupported,
  assertNodeAllowedForNewGraphs,
  listClassifiedLeafElementNames,
  resolveLeafElementRuntimeClassification,
  resolveNodeRuntimeClassification,
  validateRuntimeTargetKey,
  validateTriggerPolicy,
} from "./nodeClassification.js";

const allowedElementNames = () => {
  return _leafstdlib_dataflow_api("leafelement").editorconfig.allowednames;
};

describe("node runtime classification inventory", () => {
  it("classifies every metadata-declared node type", () => {
    const metadataNodeTypes = Object.keys(_leafstdlib_dataflow_api());

    expect(metadataNodeTypes.length).toBeGreaterThan(0);
    metadataNodeTypes.forEach((nodeType) => {
      const classification = resolveNodeRuntimeClassification({ type: nodeType, args: {} });
      expect(classification.runtimeTargetKey).toBe(`node:${nodeType}`);
      expect(classification.trigger).toBeDefined();
      expect(classification.runtimeClass).toBeDefined();
    });
  });

  it("classifies every exported runnable dispatch key without parsing source", () => {
    const runnableNodeTypes = listRunnableLeafNodeTypes();

    expect(runnableNodeTypes).toContain("leaflisp");
    runnableNodeTypes.forEach((nodeType) => {
      const classification = resolveNodeRuntimeClassification({
        type: nodeType,
        args: nodeType === "leafelement" ? { elementname: "http" } : {},
      });
      expect(classification.runtimeTargetKey).toMatch(/^(node|leafelement):/);
    });
  });

  it("classifies every allowed leafelement name as wired or explicitly blocked", () => {
    const allowedNames = allowedElementNames();
    const classifiedNames = listClassifiedLeafElementNames();

    expect(allowedNames.sort()).toEqual(classifiedNames.sort());
    allowedNames.forEach((elementname) => {
      const classification = resolveLeafElementRuntimeClassification(elementname);
      expect(classification.runtimeTargetKey).toBe(`leafelement:${elementname}`);
      expect(classification.wired === true || classification.rejectForNewGraphs === true).toBe(
        true,
      );
    });
  });

  it("tracks wired adapter names separately from allowed metadata names", () => {
    const wiredNames = listWiredLeafElementNames();

    expect(wiredNames).toEqual(
      expect.arrayContaining(["http", "href", "directus", "hermes", "cortex", "gnav", "popup"]),
    );
    expect(wiredNames).not.toContain("rancher");
    expect(wiredNames).not.toContain("token");
    expect(wiredNames).not.toContain("hippocampus");
  });

  it("rejects obsolete and legacy dispatch-only node types for new graphs", () => {
    ["leafradioRX", "leafradioTX", "leafgnav", "leafpopupview"].forEach((nodeType) => {
      expect(() => assertNodeAllowedForNewGraphs({ type: nodeType })).toThrow(
        NodeClassificationError,
      );
    });
  });

  it("dispatches leafelement classification by args.elementname", () => {
    const http = resolveNodeRuntimeClassification({
      type: "leafelement",
      args: { elementname: "http" },
    });
    const text = resolveNodeRuntimeClassification({
      type: "leafelement",
      args: { elementname: "text" },
    });

    expect(http.runtimeTargetKey).toBe("leafelement:http");
    expect(http.runtimeClass).toBe("side_effecting_action");
    expect(text.runtimeTargetKey).toBe("leafelement:text");
    expect(text.runtimeClass).toBe("sink");
  });

  it("fails fast for allowed leafelement names without wired adapters", () => {
    ["token", "rancher", "hippocampus"].forEach((elementname) => {
      const classification = resolveLeafElementRuntimeClassification(elementname);
      expect(classification.rejectForNewGraphs).toBe(true);
      expect(classification.wired).toBe(false);
      expect(() => assertLeafElementAdapterSupported(elementname)).toThrow(NodeClassificationError);
    });
  });

  it("keeps adapter files that are not allowed names unreachable", () => {
    const streamCache = {
      _lambda_obj: {},
      _refnode: "test-node",
    };

    expect(allowedElementNames()).not.toContain("openai");
    expect(listWiredLeafElementNames()).not.toContain("openai");
    expect(initStdElementProps(streamCache, "openai")).toBeUndefined();
    expect(() => resolveLeafElementRuntimeClassification("openai")).toThrow(
      NodeClassificationError,
    );
  });

  it("flags P0 adapters until idempotency, retry, replay, and redaction metadata are present", () => {
    ["http", "href", "directus", "hermes", "cortex", "rancher"].forEach((elementname) => {
      const classification = resolveLeafElementRuntimeClassification(elementname);

      expect(classification.priority).toBe("P0");
      expect(classification.migrationGate).toMatchObject({
        requiresMigrationBeforeDataTrigger: true,
        idempotency: { required: true },
        retry: { required: true },
        replay: { required: true },
        redaction: { required: true },
      });
    });
  });

  it("rejects unknown trigger policies and malformed target keys", () => {
    expect(() => validateTriggerPolicy("sometimes")).toThrow(NodeClassificationError);
    expect(() => validateRuntimeTargetKey("http")).toThrow();
    expect(() => validateRuntimeTargetKey("node:leafelement")).toThrow();
    expect(() => validateRuntimeTargetKey("leafelement:http")).not.toThrow();
  });
});

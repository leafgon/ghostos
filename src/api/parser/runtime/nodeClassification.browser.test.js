import { describe, expect, it } from "vitest";

import { _leafstdlib_dataflow_api } from "../../metamodel.js";
import {
  LEAFELEMENT_ADAPTER_REGISTRY,
  initStdElementProps,
  listWiredLeafElementNames,
} from "../nodelogic/elements/library/index.js";
import { props as rancherAdapterProps } from "../nodelogic/elements/library/rancher.js";
import {
  LEAF_NODE_CORE_LOGIC_REGISTRY,
  LEAF_NODE_CORE_LOGIC_TYPES,
  getLEAFNodeCoreLogic,
  listRunnableLeafNodeTypes,
} from "../breezyforest.js";
import {
  NodeClassificationError,
  RUNTIME_CLASSES,
  assertLeafElementAdapterSupported,
  assertNodeAllowedForNewGraphs,
  assertRuntimeExecutionModeled,
  listClassifiedLeafElementNames,
  listClassifiedNodeTypes,
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

  it("keeps exported dispatch keys and getLEAFNodeCoreLogic on the same registry", () => {
    const registryKeys = Object.keys(LEAF_NODE_CORE_LOGIC_REGISTRY);

    expect(LEAF_NODE_CORE_LOGIC_TYPES).toEqual(registryKeys);
    expect(listRunnableLeafNodeTypes()).toEqual(registryKeys);
    registryKeys.forEach((nodeType) => {
      const definition = LEAF_NODE_CORE_LOGIC_REGISTRY[nodeType]();
      expect(definition?.dataflow || definition?.lambda).toBeDefined();
    });
    expect(typeof getLEAFNodeCoreLogic("leafanchor", "dataflow", {})).toBe("function");
    expect(typeof getLEAFNodeCoreLogic("leafasyncflow", "dataflow", {})).toBe("function");
    expect(getLEAFNodeCoreLogic("leafsyncflow", "dataflow", {})).toBeUndefined();
  });

  it("represents every P4 inventory decision explicitly", () => {
    const p4Classifications = [
      ...listClassifiedNodeTypes()
        .map((type) => resolveNodeRuntimeClassification({ type, args: {} }))
        .filter((classification) => classification.priority === "P4"),
      ...listClassifiedLeafElementNames()
        .map((elementname) => resolveLeafElementRuntimeClassification(elementname))
        .filter((classification) => classification.priority === "P4"),
    ];
    const inventoryStates = p4Classifications.map((classification) => [
      classification.runtimeTargetKey,
      classification.inventory?.state,
    ]);

    expect(p4Classifications.length).toBeGreaterThan(0);
    p4Classifications.forEach((classification) => {
      expect(classification.inventory).toBeDefined();
      expect([
        "obsolete",
        "blocked",
        "metadata-only",
        "declaration-only",
        "legacy-only",
        "explicitly-wired",
      ]).toContain(classification.inventory.state);
    });
    expect(inventoryStates).toEqual(
      expect.arrayContaining([
        ["node:leafradioRX", "obsolete"],
        ["node:leafradioTX", "obsolete"],
        ["node:leafgnav", "legacy-only"],
        ["node:leafpopupview", "legacy-only"],
        ["node:leafanchor", "metadata-only"],
        ["node:leafspelldef", "declaration-only"],
        ["node:leafsyncflow", "metadata-only"],
        ["leafelement:token", "blocked"],
      ]),
    );
  });

  it("classifies every allowed leafelement name as wired or explicitly blocked", () => {
    const allowedNames = allowedElementNames();
    const classifiedNames = listClassifiedLeafElementNames();

    expect(allowedNames.sort()).toEqual(classifiedNames.sort());
    allowedNames.forEach((elementname) => {
      const classification = resolveLeafElementRuntimeClassification(elementname);
      expect(classification.runtimeTargetKey).toBe(`leafelement:${elementname}`);
      expect(
        classification.wired === true ||
          classification.rejectForNewGraphs === true ||
          (classification.runtimeClass === RUNTIME_CLASSES.STRUCTURAL &&
            classification.inventory?.runtimeExecution === "none"),
      ).toBe(true);
    });
  });

  it("allows domain topology metadata in new graphs without a runtime adapter", () => {
    const domain = resolveLeafElementRuntimeClassification("domain");

    expect(allowedElementNames()).toContain("domain");
    expect(listWiredLeafElementNames()).not.toContain("domain");
    expect(domain).toMatchObject({
      runtimeTargetKey: "leafelement:domain",
      runtimeClass: RUNTIME_CLASSES.STRUCTURAL,
      trigger: "none",
      status: "metadata_only",
      wired: false,
      rejectForNewGraphs: false,
      inventory: { state: "metadata-only", runtimeExecution: "none" },
    });
    expect(() =>
      assertNodeAllowedForNewGraphs({
        type: "leafelement",
        args: { elementname: "domain" },
      }),
    ).not.toThrow();
    expect(() =>
      assertRuntimeExecutionModeled({
        type: "leafelement",
        args: { elementname: "domain" },
      }),
    ).toThrow("leafelement:domain does not have modeled runtime execution.");
  });

  it("tracks wired adapter names separately from allowed metadata names", () => {
    const wiredNames = listWiredLeafElementNames();

    expect(wiredNames).toEqual(
      expect.arrayContaining([
        "http",
        "href",
        "directus",
        "hermes",
        "cortex",
        "hippocampus",
        "gnav",
        "popup",
        "blob",
      ]),
    );
    expect(wiredNames).not.toContain("rancher");
    expect(wiredNames).not.toContain("token");
  });

  it("classifies hippocampus as a wired side-effecting adapter", () => {
    const classification = resolveLeafElementRuntimeClassification("hippocampus");

    expect(classification).toMatchObject({
      runtimeTargetKey: "leafelement:hippocampus",
      runtimeClass: "side_effecting_action",
      trigger: "data",
      priority: "P0",
      status: "supported",
      wired: true,
      rejectForNewGraphs: false,
      idempotency: { required: true },
      inventory: { state: "explicitly-wired", runtimeExecution: "modeled" },
    });
    expect(() => assertLeafElementAdapterSupported("hippocampus")).not.toThrow();
    expect(() =>
      assertNodeAllowedForNewGraphs({
        type: "leafelement",
        args: { elementname: "hippocampus" },
      }),
    ).not.toThrow();
    expect(() =>
      assertRuntimeExecutionModeled({
        type: "leafelement",
        args: { elementname: "hippocampus" },
      }),
    ).not.toThrow();
  });

  it("keeps the Rancher adapter source present but unreachable until migrated", () => {
    const streamCache = {
      _lambda_obj: {},
      _refnode: "test-node",
    };
    const classification = resolveLeafElementRuntimeClassification("rancher");

    expect(allowedElementNames()).toContain("rancher");
    expect(typeof rancherAdapterProps).toBe("function");
    expect(listWiredLeafElementNames()).not.toContain("rancher");
    expect(initStdElementProps(streamCache, "rancher")).toBeUndefined();
    expect(classification).toMatchObject({
      runtimeTargetKey: "leafelement:rancher",
      runtimeClass: "blocked",
      trigger: "none",
      priority: "P0",
      status: "blocked",
      wired: false,
      rejectForNewGraphs: true,
    });
    expect(() => assertLeafElementAdapterSupported("rancher")).toThrow(
      "leafelement:rancher is not supported by a wired adapter.",
    );
    expect(() =>
      assertNodeAllowedForNewGraphs({
        type: "leafelement",
        args: { elementname: "rancher" },
      }),
    ).toThrow("leafelement:rancher is not allowed in new graphs.");
  });

  it("rejects obsolete and legacy dispatch-only node types for new graphs", () => {
    ["leafradioRX", "leafradioTX", "leafgnav", "leafpopupview"].forEach((nodeType) => {
      expect(() => assertNodeAllowedForNewGraphs({ type: nodeType })).toThrow(
        NodeClassificationError,
      );
    });
  });

  it("fails fast before runtime execution for obsolete, blocked, and metadata-only targets", () => {
    [
      { type: "leafradioRX" },
      { type: "leafradioTX" },
      { type: "leafgnav" },
      { type: "leafpopupview" },
      { type: "leafanchor" },
      { type: "leafspelldef" },
      { type: "leafsyncflow" },
      { type: "leafelement", args: { elementname: "token" } },
    ].forEach((target) => {
      expect(() => assertRuntimeExecutionModeled(target)).toThrow(NodeClassificationError);
    });
    expect(() => assertRuntimeExecutionModeled({ type: "leaflabel" })).not.toThrow();
  });

  it("keeps structural and declaration metadata from accidental runtime execution", () => {
    const leafanchor = resolveNodeRuntimeClassification({ type: "leafanchor", args: {} });
    const leafspelldef = resolveNodeRuntimeClassification({ type: "leafspelldef", args: {} });

    expect(leafanchor).toMatchObject({
      runtimeClass: "metadata",
      trigger: "none",
      inventory: { state: "metadata-only", runtimeExecution: "none" },
    });
    expect(leafspelldef).toMatchObject({
      runtimeClass: "metadata",
      trigger: "none",
      inventory: { state: "declaration-only", runtimeExecution: "none" },
    });
  });

  it("keeps leafsyncflow as an explicit metadata-only placeholder", () => {
    const leafsyncflow = resolveNodeRuntimeClassification({ type: "leafsyncflow", args: {} });

    expect(listRunnableLeafNodeTypes()).not.toContain("leafsyncflow");
    expect(leafsyncflow).toMatchObject({
      runtimeClass: "metadata",
      trigger: "none",
      status: "metadata_only",
      inventory: { state: "metadata-only", runtimeExecution: "none" },
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
    ["token", "rancher"].forEach((elementname) => {
      const classification = resolveLeafElementRuntimeClassification(elementname);
      expect(classification.rejectForNewGraphs).toBe(true);
      expect(classification.wired).toBe(false);
      expect(() => assertLeafElementAdapterSupported(elementname)).toThrow(
        "is not supported by a wired adapter",
      );
    });
  });

  it("keeps adapter files that are not allowed names unreachable", () => {
    const streamCache = {
      _lambda_obj: {},
      _refnode: "test-node",
    };

    ["openai", "wizardryelements"].forEach((elementname) => {
      expect(allowedElementNames()).not.toContain(elementname);
      expect(Object.keys(LEAFELEMENT_ADAPTER_REGISTRY)).not.toContain(elementname);
      expect(listWiredLeafElementNames()).not.toContain(elementname);
      expect(initStdElementProps(streamCache, elementname)).toBeUndefined();
      expect(() => resolveLeafElementRuntimeClassification(elementname)).toThrow(
        NodeClassificationError,
      );
    });
  });

  it("flags P0 adapters until idempotency, retry, replay, and redaction metadata are present", () => {
    ["http", "href", "directus", "hermes", "cortex", "hippocampus", "rancher", "blob"].forEach(
      (elementname) => {
        const classification = resolveLeafElementRuntimeClassification(elementname);

        expect(classification.priority).toBe("P0");
        expect(classification.migrationGate).toMatchObject({
          requiresMigrationBeforeDataTrigger: true,
          idempotency: { required: true },
          retry: { required: true },
          replay: { required: true },
          redaction: { required: true },
        });
      },
    );
  });

  it("rejects unknown trigger policies and malformed target keys", () => {
    expect(() => validateTriggerPolicy("sometimes")).toThrow(NodeClassificationError);
    expect(() => validateRuntimeTargetKey("http")).toThrow();
    expect(() => validateRuntimeTargetKey("node:leafelement")).toThrow();
    expect(() => validateRuntimeTargetKey("leafelement:http")).not.toThrow();
  });
});

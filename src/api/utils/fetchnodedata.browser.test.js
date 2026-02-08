import { describe, expect, it } from "vitest";
import { fetchMultiKeyedData, setMultiKeyedData } from "./fetchnodedata.js";

describe("fetchnodedata", () => {
  it("fetches nested values by key path", () => {
    const data = { leaf: { logic: { type: "leafspell" } } };

    expect(fetchMultiKeyedData(["leaf", "logic", "type"], data)).toBe("leafspell");
  });

  it("returns undefined when keys are missing", () => {
    const data = { leaf: { logic: {} } };

    expect(fetchMultiKeyedData(["leaf", "missing"], data)).toBeUndefined();
  });

  it("mutates nested values when the path exists", () => {
    const data = { leaf: { logic: { type: "leafspell" } } };

    setMultiKeyedData(["leaf", "logic", "type"], data, "leafgraph");

    expect(data.leaf.logic.type).toBe("leafgraph");
  });
});

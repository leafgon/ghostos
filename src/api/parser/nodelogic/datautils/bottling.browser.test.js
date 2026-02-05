import { describe, expect, it } from "vitest";
import { doBottle, doUnbottle, EmptyBottle } from "./bottling.js";

describe("bottling", () => {
  it("wraps and unwraps data with a matching key", () => {
    const payload = { value: 42 };
    const bottle = doBottle("data", payload, { source: "test" });

    expect(bottle).toEqual({
      _bname: "data",
      _content: payload,
      _label: { source: "test" },
    });
    expect(doUnbottle("data", bottle)).toBe(payload);
  });

  it("returns undefined for non-matching keys", () => {
    const bottle = doBottle("alpha", "value");

    expect(doUnbottle("beta", bottle)).toBeUndefined();
  });

  it("supports wildcard unbottling", () => {
    const bottle = doBottle("gamma", 123);

    expect(doUnbottle("*", bottle)).toBe(123);
  });

  it("exposes a reusable empty bottle", () => {
    expect(EmptyBottle).toEqual({
      _bname: "empty_bottle",
      _content: "empty_data",
      _label: {},
    });
  });
});

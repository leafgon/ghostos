import { describe, expect, it } from "vitest";
import { decodeUnicode, encodeUnicode } from "./leafbase64.js";

describe("leafbase64", () => {
  it("round-trips unicode strings via encode/decode", () => {
    const input = "JavaScript is fun \u{1F389}";
    const encoded = encodeUnicode(input);

    expect(typeof encoded).toBe("string");
    expect(decodeUnicode(encoded)).toBe(input);
  });

  it("round-trips plain ASCII", () => {
    const input = "leaf-graph-123";

    expect(decodeUnicode(encodeUnicode(input))).toBe(input);
  });
});

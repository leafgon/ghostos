import { describe, expect, it } from "vitest";
import { SHA1 } from "./crypto.js";

describe("crypto", () => {
  it("hashes known inputs", () => {
    expect(SHA1("abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });
});

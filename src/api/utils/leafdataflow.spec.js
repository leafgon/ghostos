import { describe, expect, test } from "vitest";
import { chronosDataflow } from "./leafdataflow";

describe("leaf dataflow: util dataflow functions test", () => {
  test("testing chronosDataflow()", async () => {
    expect(typeof chronosDataflow).toBe("function");
  });
});

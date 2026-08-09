import { describe, expect, it } from "vitest";

import { _leafstdlib_dataflow_api } from "./metamodel.js";

describe("LEAF standard-library metamodel", () => {
  it("creates leaflisp nodes with the canonical leaf.object field", () => {
    const leaflisp = _leafstdlib_dataflow_api("leaflisp");

    expect(leaflisp.leaf).toMatchObject({
      logic: {
        type: "leaflisp",
        args: { lispexpression: "" },
      },
      object: null,
    });
  });
});

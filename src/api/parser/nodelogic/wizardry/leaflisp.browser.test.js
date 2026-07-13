import { createLEAFlispRuntime, executeLEAFlisp } from "./leaflisp.js";

describe("executeLEAFlisp", () => {
  it("executes leaflisp code with input data bound as inport", () => {
    const result = executeLEAFlisp(2, "(return (+ inport 3))");

    expect(result).toBe(5);
  });

  it("executes leaflisp code against object input data", () => {
    const result = executeLEAFlisp(
      { count: 2, label: "leaf" },
      "(return {:count (+ (get inport :count) 3) :label (get inport :label)})",
    );

    expect(result).toEqual({ count: 5, label: "leaf" });
  });

  it("supports a custom input binding and extra bindings", () => {
    const result = executeLEAFlisp("leaf", "(return (+ prefix input))", {
      inputBinding: "input",
      bindings: { prefix: "hello " },
    });

    expect(result).toBe("hello leaf");
  });

  it("can reuse a caller-provided leaflisp runtime", () => {
    const runtimeLEAFlisp = createLEAFlispRuntime();

    const first = executeLEAFlisp([1, 2, 3], "(return (get inport 1))", { runtimeLEAFlisp });
    const second = executeLEAFlisp({ value: 4 }, "(return (+ (get inport :value) 1))", {
      runtimeLEAFlisp,
    });

    expect(first).toBe(2);
    expect(second).toBe(5);
  });

  it("throws execution errors with leaflisp context", () => {
    expect(() => executeLEAFlisp(1, "(return (+ inport missing-value))")).toThrow(/LEAFlisp error/);
  });
});

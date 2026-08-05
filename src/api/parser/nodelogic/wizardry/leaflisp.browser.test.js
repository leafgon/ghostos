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

  it("parses JSON strings into leaflisp values", () => {
    const result = executeLEAFlisp(
      [],
      '(return (parse-json "{\\"hello\\":true,\\"count\\":0,\\"label\\":\\"\\",\\"nothing\\":null}"))',
    );

    expect(result).toEqual({
      hello: true,
      count: 0,
      label: "",
      nothing: null,
    });
  });

  it("preserves falsy values in parsed JSON arrays", () => {
    const numbers = executeLEAFlisp([], '(return (parse-json "[0,1]"))');
    const bools = executeLEAFlisp([], '(return (parse-json "[false,true]"))');
    const strings = executeLEAFlisp([], '(return (parse-json "[\\"\\",\\"leaf\\"]"))');
    const nulls = executeLEAFlisp([], '(return (parse-json "[null,null]"))');

    expect(numbers).toEqual([0, 1]);
    expect(bools).toEqual([false, true]);
    expect(strings).toEqual(["", "leaf"]);
    expect(nulls).toEqual([null, null]);
  });

  it("keeps parse focused on numeric strings", () => {
    expect(executeLEAFlisp([], '(return (parse "42"))')).toBe(42);
    expect(() => executeLEAFlisp([], '(return (parse "{\\"hello\\":true}"))')).toThrow(
      /Invalid number/,
    );
  });

  it("throws a parse-json error for malformed JSON", () => {
    let thrown;
    try {
      executeLEAFlisp([], '(return (parse-json "{\\"hello\\":}"))', {
        refnode: "json-parser-node",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown.message).toMatch(/Invalid JSON string/);
    expect(thrown.message).not.toContain("line: NaN");
    expect(thrown.message).not.toContain('{"hello":}');
  });

  it("throws execution errors with leaflisp context", () => {
    expect(() => executeLEAFlisp(1, "(return (+ inport missing-value))")).toThrow(/LEAFlisp error/);
  });
});

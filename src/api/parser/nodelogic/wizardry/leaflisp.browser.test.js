import { BehaviorSubject, firstValueFrom } from "rxjs";

import { _leaflisp, createLEAFlispRuntime, executeLEAFlisp, runLEAFlispcode } from "./leaflisp.js";

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

  it("preserves numbers when bottling nested http request payloads", () => {
    const result = executeLEAFlisp(
      [],
      '(bottle "http-request" {:uri "http://localhost:8080/v1/operations" :header {:content-type "application/json"} :mode "post" :data {:profile "profile-001" :operationId "op-01" :operation "add" :operands [1 2]}})',
    );

    expect(result).toEqual({
      _bname: "http-request",
      _content: {
        uri: "http://localhost:8080/v1/operations",
        header: { "content-type": "application/json" },
        mode: "post",
        data: {
          profile: "profile-001",
          operationId: "op-01",
          operation: "add",
          operands: [1, 2],
        },
      },
      _label: {},
    });
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

  it("normalizes escaped physical line continuations in JSON strings", () => {
    const malformedProviderJson = '{"answer":"First paragraph.\\\n\\\r\nSecond paragraph."}';

    expect(executeLEAFlisp(malformedProviderJson, "(return (parse-json inport))")).toEqual({
      answer: "First paragraph.\n\nSecond paragraph.",
    });
  });

  it("throws execution errors with leaflisp context", () => {
    expect(() => executeLEAFlisp(1, "(return (+ inport missing-value))")).toThrow(/LEAFlisp error/);
  });

  it("supports now-ms for current timestamp retrieval", () => {
    const before = Date.now();
    const now = executeLEAFlisp([], "(return (now-ms))");
    const after = Date.now();

    expect(typeof now).toBe("number");
    expect(Number.isFinite(now)).toBe(true);
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });

  it("supports sleep-ms in expressions", async () => {
    const result = await Promise.resolve(executeLEAFlisp(2, "(return (sleep-ms 5 (+ inport 3)))"));

    expect(result).toBe(5);
  });
});

describe("runLEAFlispcode", () => {
  it("preserves numeric values in graph-node output", () => {
    const runtimeLEAFlisp = createLEAFlispRuntime();
    const run = (code) => runLEAFlispcode(code, "number-output", runtimeLEAFlisp, "local", 0);

    expect(run("(return 42)")).toEqual([0, 42]);
    expect(run("(return [1 2.5])")).toEqual([0, [1, 2.5]]);
    expect(run("(return {:count 2 :nested {:ratio 1.5}})")).toEqual([
      0,
      { count: 2, nested: { ratio: 1.5 } },
    ]);
  });

  it("handles async leaflisp execution results", async () => {
    const runtimeLEAFlisp = createLEAFlispRuntime();
    const result = await Promise.resolve(
      runLEAFlispcode("(return (sleep-ms 5 42))", "number-output", runtimeLEAFlisp, "local", 0),
    );

    expect(result).toEqual([0, 42]);
  });
});

describe("leaflisp lambda scope", () => {
  it("exposes runtimeconfig and blobexecutioncontext bindings for lambda-scoped eval", async () => {
    const lambdactrl = {
      gos: {
        etaTree: {
          domain: "breezyforest",
          appid: "guides",
          gRuntimeLEAFlisp: createLEAFlispRuntime(),
        },
      },
    };
    const lambdaFactory = _leaflisp.lambda(lambdactrl);
    const lambdaLUT = await lambdaFactory({
      refnode: "leaflisp-lambda-node",
      refnodedata: {
        leaf: {
          logic: {
            type: "leaflisp",
            args: {
              lispexpression:
                "(return {:tenant (get blobexecutioncontext :tenantId) :idx loopyindex :club clubref})",
            },
          },
        },
      },
      nodelambda: [],
      contextuallambda: [],
    });

    const input$ = new BehaviorSubject({});
    const ctrl$ = new BehaviorSubject({ _bname: "accio" });
    const output$obj = lambdaLUT._default([{ _stream: input$ }], {
      _stream: ctrl$,
      _config: {
        loopidx: 2,
        clubrefnode: "blob-config",
        blobExecutionContext: {
          tenantId: "tenant-a",
        },
      },
    });

    const outputPromise = firstValueFrom(output$obj._stream);
    const controlSubscription = output$obj._control._stream.subscribe();

    const output = await outputPromise;
    controlSubscription.unsubscribe();

    expect(output).toEqual({
      tenant: "tenant-a",
      idx: 2,
      club: "blob-config",
    });
  });

  it("treats empty lispexpression as pass-through", async () => {
    const lambdactrl = {
      gos: {
        etaTree: {
          domain: "breezyforest",
          appid: "guides",
          gRuntimeLEAFlisp: createLEAFlispRuntime(),
        },
      },
    };
    const lambdaFactory = _leaflisp.lambda(lambdactrl);
    const lambdaLUT = await lambdaFactory({
      refnode: "leaflisp-empty-node",
      refnodedata: {
        leaf: {
          logic: {
            type: "leaflisp",
            args: {
              lispexpression: "",
            },
          },
        },
      },
      nodelambda: [],
      contextuallambda: [],
    });

    const input$ = new BehaviorSubject({ hello: "world" });
    const ctrl$ = new BehaviorSubject({ _bname: "accio" });
    const output$obj = lambdaLUT._default([{ _stream: input$ }], {
      _stream: ctrl$,
      _config: {},
    });

    const outputPromise = firstValueFrom(output$obj._stream);
    const controlSubscription = output$obj._control._stream.subscribe();

    const output = await outputPromise;
    controlSubscription.unsubscribe();

    expect(output).toEqual({ hello: "world" });
  });

  it("sleep-ms suspends only the invoking node", async () => {
    const lambdactrl = {
      gos: {
        etaTree: {
          domain: "breezyforest",
          appid: "guides",
          gRuntimeLEAFlisp: createLEAFlispRuntime(),
        },
      },
    };
    const lambdaFactory = _leaflisp.lambda(lambdactrl);

    const slowLambdaLUT = await lambdaFactory({
      refnode: "leaflisp-slow-node",
      refnodedata: {
        leaf: {
          logic: {
            type: "leaflisp",
            args: {
              lispexpression: '(return (sleep-ms 30 {:node "slow" :value (get inport :value)}))',
            },
          },
        },
      },
      nodelambda: [],
      contextuallambda: [],
    });

    const fastLambdaLUT = await lambdaFactory({
      refnode: "leaflisp-fast-node",
      refnodedata: {
        leaf: {
          logic: {
            type: "leaflisp",
            args: {
              lispexpression: '(return {:node "fast" :value (get inport :value)})',
            },
          },
        },
      },
      nodelambda: [],
      contextuallambda: [],
    });

    const slowInput$ = new BehaviorSubject({ value: 1 });
    const fastInput$ = new BehaviorSubject({ value: 2 });
    const slowCtrl$ = new BehaviorSubject({ _bname: "accio" });
    const fastCtrl$ = new BehaviorSubject({ _bname: "accio" });

    const slowOutputObj = slowLambdaLUT._default([{ _stream: slowInput$ }], {
      _stream: slowCtrl$,
      _config: {},
    });
    const fastOutputObj = fastLambdaLUT._default([{ _stream: fastInput$ }], {
      _stream: fastCtrl$,
      _config: {},
    });

    const slowOutputPromise = firstValueFrom(slowOutputObj._stream);
    const fastOutputPromise = firstValueFrom(fastOutputObj._stream);
    const slowControlSubscription = slowOutputObj._control._stream.subscribe();
    const fastControlSubscription = fastOutputObj._control._stream.subscribe();

    const firstResolved = await Promise.race([
      fastOutputPromise.then(() => "fast"),
      slowOutputPromise.then(() => "slow"),
    ]);
    expect(firstResolved).toBe("fast");

    const fastOutput = await fastOutputPromise;
    const slowOutput = await slowOutputPromise;

    slowControlSubscription.unsubscribe();
    fastControlSubscription.unsubscribe();

    expect(fastOutput).toEqual({ node: "fast", value: 2 });
    expect(slowOutput).toEqual({ node: "slow", value: 1 });
  });
});

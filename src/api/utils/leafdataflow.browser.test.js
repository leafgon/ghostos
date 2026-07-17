import { describe, expect, it } from "vitest";
import { Subject } from "rxjs";

import { CHRONOSTYPE_SYNC, chronosDataflow, combineDataflows } from "./leafdataflow.js";

describe("leaf dataflow synchronization", () => {
  it("combineDataflows waits for a new value from every source before each output", () => {
    const sourceA$ = new Subject();
    const sourceB$ = new Subject();
    const output = [];

    combineDataflows("test-node", [{ _stream: sourceA$ }, { _stream: sourceB$ }])._stream.subscribe(
      (value) => output.push(value),
    );

    sourceA$.next("a1");
    expect(output).toEqual([]);

    sourceB$.next("b1");
    expect(output).toEqual([["a1", "b1"]]);

    sourceA$.next("a2");
    expect(output).toEqual([["a1", "b1"]]);

    sourceB$.next("b2");
    expect(output).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);
  });

  it("chronosDataflow sync mode waits for a new value from every source before each output", () => {
    const ctrl$ = new Subject();
    const sourceA$ = new Subject();
    const sourceB$ = new Subject();
    const output = [];

    chronosDataflow(ctrl$, [sourceA$, sourceB$], false, CHRONOSTYPE_SYNC).subscribe((value) =>
      output.push(value),
    );

    ctrl$.next("ctrl1");
    sourceA$.next("a1");
    expect(output).toEqual([]);

    sourceB$.next("b1");
    expect(output).toEqual([["a1", "b1"]]);

    sourceA$.next("a2");
    expect(output).toEqual([["a1", "b1"]]);

    sourceB$.next("b2");
    expect(output).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);
  });
});

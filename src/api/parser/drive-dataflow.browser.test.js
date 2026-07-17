import { describe, expect, it } from "vitest";
import { Subject } from "rxjs";

import { driveDataflowByCtrlflow } from "./leaf.js";

const waitForAsyncRelay = () => new Promise((resolve) => setTimeout(resolve, 5));

describe("driveDataflowByCtrlflow", () => {
  it("waits for a new value from every direct input before each multi-input output", async () => {
    const ctrl$ = new Subject();
    const sourceA$ = new Subject();
    const sourceB$ = new Subject();
    const output = [];

    const output$obj = driveDataflowByCtrlflow(
      { _stream: ctrl$, _config: {} },
      [{ _stream: sourceA$ }, { _stream: sourceB$ }],
      undefined,
      { refnode: "test-node" },
    );

    const dataSubscription = output$obj._stream.subscribe((value) => output.push(value));
    const ctrlSubscription = output$obj._control._stream.subscribe();

    ctrl$.next({ seq: 1 });
    sourceA$.next("a1");
    await waitForAsyncRelay();
    expect(output).toEqual([]);

    sourceB$.next("b1");
    await waitForAsyncRelay();
    expect(output).toEqual([["a1", "b1"]]);

    ctrl$.next({ seq: 2 });
    sourceA$.next("a2");
    await waitForAsyncRelay();
    expect(output).toEqual([["a1", "b1"]]);

    sourceB$.next("b2");
    await waitForAsyncRelay();
    expect(output).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);

    dataSubscription.unsubscribe();
    ctrlSubscription.unsubscribe();
  });
});

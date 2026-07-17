import { describe, expect, it } from "vitest";
import { Subject } from "rxjs";

import { _leafchronosflow } from "./leafchronosflow.js";

const buildLambdaCtrl = () => ({
  gos: {
    etaTree: {
      graphcomponents: {
        components: {
          lut: {},
        },
      },
      leafgraph: {
        graph: {
          dataflow: {
            getNodeAttributes: () => ({
              leafnode: {
                data: {
                  leaf: {
                    logic: {
                      type: "leafchronosflow",
                      args: {},
                    },
                  },
                },
              },
            }),
          },
        },
      },
    },
  },
});

describe("leafchronosflow", () => {
  it("passes default multi-source input data asynchronously", async () => {
    const dataflowlogic = await _leafchronosflow.dataflow(buildLambdaCtrl())({
      refnode: "chronos-node",
      refnodedata: {
        leaf: {
          logic: {
            type: "leafchronosflow",
            args: {},
          },
        },
      },
      nodelambda: [],
      contextuallambda: [],
    });

    const sourceA$ = new Subject();
    const sourceB$ = new Subject();
    const ctrl$ = new Subject();
    const output = [];

    const output$obj = dataflowlogic([{ _stream: sourceA$ }, { _stream: sourceB$ }], {
      _stream: ctrl$,
      _config: {},
    });
    const subscription = output$obj._stream.subscribe((value) => output.push(value));

    sourceA$.next("a1");
    expect(output).toEqual(["a1"]);

    sourceB$.next("b1");
    expect(output).toEqual(["a1", "b1"]);

    sourceA$.next("a2");
    expect(output).toEqual(["a1", "b1", "a2"]);

    subscription.unsubscribe();
  });
});

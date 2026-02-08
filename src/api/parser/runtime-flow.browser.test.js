import { describe, expect, it } from "vitest";
import { Buffer } from "buffer";
import { BehaviorSubject, firstValueFrom } from "rxjs";

import { reconstructLEAFGraph, analyzeLEAFGraph } from "./leaf.js";
import { runtimeEtaTree, etaReduceDataflowComponent } from "./eta.js";
import { init_gRuntimeLEAFlisp } from "./nodelogic/wizardry/leaflisp.js";
import { doBottle } from "./nodelogic/datautils/bottling.js";

const toBase64Str = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64");

const buildMinimalGraph = () => {
  const inflowNode = {
    uuid: "node-in",
    out_edges: [
      {
        uuid: "edge-1",
        source: { uuid: "node-in" },
        target: { uuid: "node-out" },
        data: toBase64Str({
          leaf: { api: "breezyforest", logic: { type: "leafdataedge" } },
        }),
      },
    ],
    data: toBase64Str({
      leaf: {
        logic: { type: "leafinflowport", args: {} },
        api: "breezyforest",
        appdata: { position: { x: 0, y: 0 } },
      },
    }),
  };

  const outflowNode = {
    uuid: "node-out",
    out_edges: [],
    data: toBase64Str({
      leaf: {
        logic: { type: "leafoutflowport", args: {} },
        api: "breezyforest",
        appdata: { position: { x: 100, y: 0 } },
      },
    }),
  };

  return [inflowNode, outflowNode];
};

describe("runtime flow", () => {
  it("runs the main dataflow with RxJS signaling", async () => {
    const nodes = buildMinimalGraph();
    const leafgraph = reconstructLEAFGraph(nodes);
    const leafcomponents = analyzeLEAFGraph(leafgraph);

    const main_component = leafcomponents.components.nodegroups.runtime[0];
    expect(main_component).toBeDefined();
    expect(main_component.length).toBeGreaterThan(0);

    const leafio = {
      getCurLEAFIOState: () => ({}),
      getMasterSubsDir: () => ({}),
      setNewLEAFIOState: () => true,
      setLEAFIOCallback: () => {},
    };

    const leaflakeio = {
      qm_methods: {
        queryGraph: async () => ({ graph: { nodes: [] } }),
      },
    };

    const mainMnemosyne = { current: {} };
    const etaTree = runtimeEtaTree(
      "nav",
      "local",
      "test",
      "local",
      "test",
      leafgraph,
      leafcomponents,
      leafio,
      leaflakeio,
      mainMnemosyne,
    );

    etaTree.gRuntimeLEAFlisp = init_gRuntimeLEAFlisp(etaTree, {
      data: doBottle("accio", "data_accio"),
      ctrl: doBottle("accio", "ctrl_accio"),
    });

    const leafGraphRuntime = await etaReduceDataflowComponent({
      refnode: "main",
      component_members: main_component,
      contextuallambda: [],
      etaTree,
    });

    const dataBottle = doBottle("accio", { payload: "hello" });
    const ctrlBottle = doBottle("accio", "ctrl");

    const datainput$ = new BehaviorSubject(dataBottle);
    const ctrlinput$ = new BehaviorSubject(ctrlBottle);

    const controlflow = { _stream: ctrlinput$, _config: {} };
    const mainloop_output_obj = leafGraphRuntime([{ _stream: datainput$ }], controlflow);

    const ctrlSubscription = mainloop_output_obj._control._stream.subscribe();
    const outputPromise = firstValueFrom(mainloop_output_obj._stream);

    datainput$.next(dataBottle);
    ctrlinput$.next(ctrlBottle);

    const output = await outputPromise;
    ctrlSubscription.unsubscribe();
    expect(output).toEqual(dataBottle);
  });
});

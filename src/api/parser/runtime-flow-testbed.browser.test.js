import { describe, expect, it } from "vitest";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { reconstructLEAFGraph, analyzeLEAFGraph } from "./leaf.js";
import { runtimeEtaTree, etaReduceDataflowComponent } from "./eta.js";
import { init_gRuntimeLEAFlisp } from "./nodelogic/wizardry/leaflisp.js";
import { doBottle } from "./nodelogic/datautils/bottling.js";

const loadTestbedNodes = async () => {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(moduleDir, "../../../tests/breezyforest-testbed.json");
  const payload = JSON.parse(await readFile(fixturePath, "utf-8"));
  const nodes = payload?.data?.graph?.nodes;

  if (!Array.isArray(nodes)) {
    throw new Error("Expected breezyforest-testbed.json to include graph nodes.");
  }

  return nodes;
};

describe("runtime flow (testbed)", () => {
  it("runs the testbed graph via the runtime pipeline", async () => {
    const nodes = await loadTestbedNodes();
    const leafgraph = reconstructLEAFGraph(nodes);
    const leafcomponents = analyzeLEAFGraph(leafgraph);

    const runtime_components = leafcomponents.components.nodegroups.runtime;
    const lambda_components = leafcomponents.components.nodegroups.lambda;

    let component = runtime_components[0];
    let refnode = "main";

    if (!component) {
      component = lambda_components.find(
        (candidate) => leafcomponents.components.lut[candidate[0]]?.scope === "dataflow",
      );
      refnode = component ? component[0] : refnode;
    }

    expect(component).toBeDefined();
    expect(component.length).toBeGreaterThan(0);

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
      "breezyforest",
      "testbed",
      "breezyforest",
      "testbed",
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
      refnode,
      component_members: component,
      contextuallambda: [],
      etaTree,
    });

    const dataPayload = { hello: "world" };
    const ctrlBottle = doBottle("accio", "ctrl");

    const datainput$ = new BehaviorSubject(dataPayload);
    const ctrlinput$ = new BehaviorSubject(ctrlBottle);

    const controlflow = { _stream: ctrlinput$, _config: {} };
    const mainloop_output_obj = leafGraphRuntime([{ _stream: datainput$ }], controlflow);

    const ctrlSubscription = mainloop_output_obj._control._stream.subscribe();
    const outputPromise = firstValueFrom(mainloop_output_obj._stream);

    datainput$.next(dataPayload);
    ctrlinput$.next(ctrlBottle);

    const output = await outputPromise;
    ctrlSubscription.unsubscribe();

    expect(output).toBe("world");
  }, 15000);
});

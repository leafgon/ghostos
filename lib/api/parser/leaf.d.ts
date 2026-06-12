export const _version: string;
export function reconstructLEAFGraph(nodes: any, masterSubsDirectory: any): {
    graph: {
        lambda: Graph<import("graphology-types").Attributes, import("graphology-types").Attributes, import("graphology-types").Attributes>;
        dataflow: Graph<import("graphology-types").Attributes, import("graphology-types").Attributes, import("graphology-types").Attributes>;
    };
    thespade: {
        uuid: undefined;
    };
    edges: {
        data: {
            sources: Set<any>;
            targets: Set<any>;
        };
        lambda: {
            sources: Set<any>;
            targets: Set<any>;
            sourcelut: {};
        };
        anchor: {
            targets: Set<any>;
        };
    };
};
export function analyzeLEAFGraph(leafgraph: any): {
    spelldefs: {};
    leafconfig: undefined;
    components: {
        nodegroups: {
            runtime: any[];
            lambda: any[];
            anchored: any[];
        };
        lut: {};
    };
};
export function executeLEAFLogic(leaflogic: any, data_input: any, runtimeconfig?: {}, refnode?: undefined, ctrl_input?: undefined): Promise<any>;
export function subscribeToLEAFLogic(leaflogic: any, input: any, runtimeconfig: any, stopper$: any): Promise<void>;
export function executeLEAFLogicInSync(leaflogic: any, input$: any, output$inst: any, ctrlinput$: any, runtimeconfig: any, flowname?: undefined): any;
export function driveDataflowByCtrlflow(inflow_ctrl$obj: any, data_inflow$objArr: any, meta_ctrl_in$: any, context?: {}, transformation?: {
    leaflogic: undefined;
    datalogic: {
        pre: undefined;
        post: undefined;
    };
}): {
    _stream: import("rxjs").Observable<any>;
    _control: {
        _stream: any;
        _config: any;
    };
};
export function leafTraceFlow(_prevtraces: any, _curtrace: any, consolelog?: boolean): any;
export function parseAddressableGraph(addrstr: any, _etaTree: any, _refnode: any): Promise<{} | undefined>;
export function timeoutPromise(prom: any, time: any, codebase: any, exception: any, metadata: any): Promise<any>;
import Graph from "graphology";

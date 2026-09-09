export namespace _leafgateflow {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
            _config: any;
        };
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
}
export function driveLeafGateflowByRuntimePolicy({ gatekey, toggledatakey, gateTag, inflowCtrlObj, dataInflowObjArr, metaCtrl$, context, observability, }?: {
    toggledatakey?: boolean | undefined;
    dataInflowObjArr?: never[] | undefined;
    context?: {} | undefined;
    observability?: {} | undefined;
}): Readonly<{
    _stream: import("rxjs").Observable<any>;
    _control: Readonly<{
        _stream: import("rxjs").Observable<any>;
        _config: any;
    }>;
}>;
export function evaluateLeafGateflowData({ value, gatekey, toggledatakey, gateTag }?: {
    toggledatakey?: boolean | undefined;
}): any;

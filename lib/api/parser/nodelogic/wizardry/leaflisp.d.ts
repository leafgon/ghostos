export namespace _leaflisp {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
            _config: any;
        };
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$Arr: any, controlflow$obj: any) => any>;
    function methods(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
        version: string;
        nodequery: (flowinput$obj: any) => any;
        nodemethod: (flowinput$obj: any) => {};
    }>;
}
export function parseJsonToLEAFlisp(x: any, depth?: number, isdictval?: boolean): any;
export function runLEAFlispcode(_lispcode: any, refnode: any, _runtimeLEAFlisp: any, _leafaddress: any, _preamble_len?: number): any[];
export function init_gRuntimeLEAFlisp(_etaTree: any, accio_bottles: any): PocketLisp;
import { PocketLisp } from "../../../parser/leaflisp/plispdist/index.js";

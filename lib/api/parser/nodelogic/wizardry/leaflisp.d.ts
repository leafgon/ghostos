export namespace _leaflisp {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
            _config: any;
        };
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
        _default: (input$objArr: any, controlflow$obj: any) => {
            _stream: Subject<any>;
            _control: any;
        };
    }>;
    function methods(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
        version: string;
        nodequery: (flowinput$obj: any) => any;
        nodemethod: (flowinput$obj: any) => {};
    }>;
}
export function createLEAFlispRuntime({ globals, _probefunc, _tracefunc }?: {
    globals?: {} | undefined;
}): PocketLisp;
export function executeLEAFlisp(inputData: any, leaflispCode: any, options?: {}): any;
export function parseJsonToLEAFlisp(x: any, depth?: number, isdictval?: boolean): any;
export function runLEAFlispcode(_lispcode: any, refnode: any, _runtimeLEAFlisp: any, _leafaddress: any, _preamble_len?: number): any;
export function init_gRuntimeLEAFlisp(_etaTree: any, accio_bottles: any): PocketLisp;
import { Subject } from "rxjs";
import { PocketLisp } from "../../../parser/leaflisp/plispdist/index.js";

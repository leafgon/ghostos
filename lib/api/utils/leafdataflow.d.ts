export function naiveZipDataflows(flow$Arr: any): {
    _stream: import("rxjs").Observable<readonly unknown[]>;
} | undefined;
export function zipDataflows(nodeuuid: any, flow$Arr: any, mainlabel?: undefined, pairLatestAux?: boolean, flowUnpairedAux?: boolean): any;
export function mergeDataflows(flow$Arr: any): any;
export function chronosDataflow(ctrl$: any, flow$Arr: any, passctrl?: boolean, chronostype?: number, gates?: {
    time: number;
    count: number;
    bottle: undefined;
    lambda: undefined;
}, timeoutBehavior?: number, metadata?: {}, metactrl$?: undefined, traceon?: boolean): any;
export const TIMEOUTBEHAVIOR_ALLORNOTHING: 1;
export const TIMEOUTBEHAVIOR_BESTEFFORT: 0;
export const CHRONOSTYPE_SYNC: 0;
export const CHRONOSTYPE_ASYNC: 1;
export function combineDataflows(nodeuuid: any, flow$Arr: any, isflatten?: boolean, iscomposite?: boolean, exitbus?: boolean, context?: {}): any;
export function mergeObservableDataflows(refnode: any, flow$Arr: any, isflatten?: boolean): any;
export function concatDataflows(flow$Arr: any): any;
export function substituteDataflows(flowinput$Arr: any, dictionary_keys: any): {
    _stream: any;
};
export function flattenArray(x: any): any;
export function debounce(fn: any, ms: any): (_: any) => void;

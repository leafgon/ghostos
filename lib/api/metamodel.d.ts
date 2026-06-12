export namespace LEAFIOmetamodel {
    namespace breezyforest {
        let _version: string;
        let _nickname: string;
        namespace scaffold {
            namespace map {
                namespace leaf {
                    namespace logic {
                        let type: string;
                        let args: {};
                    }
                    namespace provenance {
                        let api: string;
                        let uuid: string;
                        namespace graph {
                            let appuuid: string;
                            let name: string;
                            let version: string;
                        }
                    }
                    let appdata: {};
                }
            }
            namespace directory {
                let api_1: string[];
                export { api_1 as api };
                let logic_1: string[];
                export { logic_1 as logic };
                let type_1: string[];
                export { type_1 as type };
                let args_1: string[];
                export { args_1 as args };
                let provenance_1: string[];
                export { provenance_1 as provenance };
                let uuid_1: string[];
                export { uuid_1 as uuid };
                export let leafapp: string[];
                let appdata_1: string[];
                export { appdata_1 as appdata };
            }
            function fetch(n_e: any, crawlkey: any): any;
        }
        namespace originType {
            let FRONTEND: number;
            let BACKEND: number;
            let SCREEN: number;
        }
        namespace subsDirectory {
            let readmefirst: {};
            namespace leaflake {
                namespace bridges {
                    let gql: string;
                }
            }
            let appintent: {};
            let appmodel: {};
            let appview: {};
            let osview: {};
            let osview2: {};
            let dataflowplane: {};
            let appcache: {};
        }
        namespace IOAccessPermission {
            let Owner: number;
            let Observer: number;
            let Contributor: number;
            let All: number;
        }
        namespace IOStateGroundZero {
            let dirOfSubjects: {};
            let subsCache: {};
            let subscriptions: {};
            let callbacks: {};
            let permissions: {};
        }
        namespace GQLParameters {
            namespace clientconfig_full {
                export let keepGQLConnected: boolean;
                export { endpoint_subs as dburi_subs };
                export { websocket_subs as dburi_subs_ws };
                export { endpoint_qm as dburi_qm };
            }
            namespace clientconfig_sub {
                let keepGQLConnected_1: boolean;
                export { keepGQLConnected_1 as keepGQLConnected };
                export { endpoint_subs as dburi_subs };
                export { websocket_subs as dburi_subs_ws };
            }
            namespace clientconfig_qm {
                export { endpoint_qm as dburi_qm };
            }
            let masterquery: string;
        }
        namespace LEAFdictionary {
            export { map };
        }
    }
}
export function _leafstdlib_dataflow_api(type: any): any;
export namespace _breezyforeststdlib_hierarchy {
    let io: string[];
    let elements: string[];
    let abstraction: string[];
    let dataflow: string[];
    let arcane: string[];
}
export namespace _edge_handle_dict {
    namespace leaflambdaedge {
        let sourceHandle: string;
        let targetHandle: string;
    }
    namespace leafanchoredge {
        let sourceHandle_1: string;
        export { sourceHandle_1 as sourceHandle };
        let targetHandle_1: string;
        export { targetHandle_1 as targetHandle };
    }
    namespace leafdataedge {
        let sourceHandle_2: string;
        export { sourceHandle_2 as sourceHandle };
        let targetHandle_2: string;
        export { targetHandle_2 as targetHandle };
    }
}
export namespace _edge_style_dict {
    export namespace leaflambdaedge_1 {
        let stroke: string;
        let fillOpacity: number;
    }
    export { leaflambdaedge_1 as leaflambdaedge };
    export namespace leafanchoredge_1 {
        let stroke_1: string;
        export { stroke_1 as stroke };
        let fillOpacity_1: number;
        export { fillOpacity_1 as fillOpacity };
    }
    export { leafanchoredge_1 as leafanchoredge };
    export namespace leafdataedge_1 {
        let stroke_2: string;
        export { stroke_2 as stroke };
        let fillOpacity_2: number;
        export { fillOpacity_2 as fillOpacity };
    }
    export { leafdataedge_1 as leafdataedge };
}
export namespace _breezyforeststdlib_name {
    let outport: string;
    let inport: string;
    let screenio: string;
    let memoryio: string;
    let spade: string;
    let heart: string;
    let diamond: string;
    let club: string;
    let element: string;
    let anchor: string;
    let leafgraph: string;
    let lambda: string;
    let spelldef: string;
    let spell: string;
    let loopyspell: string;
    let label: string;
    let delabel: string;
    let bottle: string;
    let unbottle: string;
    let crate: string;
    let config: string;
    let chronos: string;
    let async: string;
    let sync: string;
    let mix: string;
    let gate: string;
    let leaflisp: string;
}
declare const endpoint_subs: string | undefined;
declare const websocket_subs: string | undefined;
declare const endpoint_qm: string | undefined;
import { map as map_1 } from "rxjs/operators";
export {};

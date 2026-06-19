export function useLEAFIOapi({ _LEAFappList, stateObjInstanceID, dirOfSubjects, permissions, metamodel, }?: {
    _LEAFappList?: never[] | undefined;
    stateObjInstanceID?: string | undefined;
    dirOfSubjects?: {} | undefined;
    permissions?: {} | undefined;
    metamodel?: {
        breezyforest: {
            _version: string;
            _nickname: string;
            scaffold: {
                map: {
                    leaf: {
                        logic: {
                            type: string;
                            args: {};
                        };
                        provenance: {
                            api: string;
                            uuid: string;
                            graph: {
                                appuuid: string;
                                name: string;
                                version: string;
                            };
                        };
                        appdata: {};
                    };
                };
                directory: {
                    api: string[];
                    logic: string[];
                    type: string[];
                    args: string[];
                    provenance: string[];
                    uuid: string[];
                    leafapp: string[];
                    appdata: string[];
                };
                fetch: (n_e: any, crawlkey: any) => any;
            };
            originType: {
                FRONTEND: number;
                BACKEND: number;
                SCREEN: number;
            };
            subsDirectory: {
                readmefirst: {};
                leaflake: {
                    bridges: {
                        gql: string;
                    };
                };
                appintent: {};
                appmodel: {};
                appview: {};
                osview: {};
                osview2: {};
                dataflowplane: {};
                appcache: {};
            };
            IOAccessPermission: {
                Owner: number;
                Observer: number;
                Contributor: number;
                All: number;
            };
            IOStateGroundZero: {
                dirOfSubjects: {};
                subsCache: {};
                subscriptions: {};
                callbacks: {};
                permissions: {};
            };
            GQLParameters: {
                clientconfig_full: {
                    keepGQLConnected: boolean;
                    dburi_subs: string | undefined;
                    dburi_subs_ws: string | undefined;
                    dburi_qm: string | undefined;
                };
                clientconfig_sub: {
                    keepGQLConnected: boolean;
                    dburi_subs: string | undefined;
                    dburi_subs_ws: string | undefined;
                };
                clientconfig_qm: {
                    dburi_qm: string | undefined;
                };
                masterquery: string;
            };
            LEAFdictionary: {
                map: typeof import("rxjs").map;
            };
        };
    } | undefined;
}): {
    getCurLEAFIOState: () => any;
    getMasterSubsDir: () => any;
    setNewLEAFIOState: (key: any, state: any, dataOrigin?: number) => number | true;
    setLEAFIOCallback: (key: any, callerid: any, callbackFunc?: null) => void;
};
export function initLEAFIOapi({ _LEAFappList, stateObjInstanceID, dirOfSubjects, permissions, metamodel, }?: {
    _LEAFappList?: never[] | undefined;
    stateObjInstanceID?: string | undefined;
    dirOfSubjects?: {} | undefined;
    permissions?: {} | undefined;
    metamodel?: {
        breezyforest: {
            _version: string;
            _nickname: string;
            scaffold: {
                map: {
                    leaf: {
                        logic: {
                            type: string;
                            args: {};
                        };
                        provenance: {
                            api: string;
                            uuid: string;
                            graph: {
                                appuuid: string;
                                name: string;
                                version: string;
                            };
                        };
                        appdata: {};
                    };
                };
                directory: {
                    api: string[];
                    logic: string[];
                    type: string[];
                    args: string[];
                    provenance: string[];
                    uuid: string[];
                    leafapp: string[];
                    appdata: string[];
                };
                fetch: (n_e: any, crawlkey: any) => any;
            };
            originType: {
                FRONTEND: number;
                BACKEND: number;
                SCREEN: number;
            };
            subsDirectory: {
                readmefirst: {};
                leaflake: {
                    bridges: {
                        gql: string;
                    };
                };
                appintent: {};
                appmodel: {};
                appview: {};
                osview: {};
                osview2: {};
                dataflowplane: {};
                appcache: {};
            };
            IOAccessPermission: {
                Owner: number;
                Observer: number;
                Contributor: number;
                All: number;
            };
            IOStateGroundZero: {
                dirOfSubjects: {};
                subsCache: {};
                subscriptions: {};
                callbacks: {};
                permissions: {};
            };
            GQLParameters: {
                clientconfig_full: {
                    keepGQLConnected: boolean;
                    dburi_subs: string | undefined;
                    dburi_subs_ws: string | undefined;
                    dburi_qm: string | undefined;
                };
                clientconfig_sub: {
                    keepGQLConnected: boolean;
                    dburi_subs: string | undefined;
                    dburi_subs_ws: string | undefined;
                };
                clientconfig_qm: {
                    dburi_qm: string | undefined;
                };
                masterquery: string;
            };
            LEAFdictionary: {
                map: typeof import("rxjs").map;
            };
        };
    } | undefined;
}): {
    getCurLEAFIOState: () => any;
    getMasterSubsDir: () => any;
    setNewLEAFIOState: (key: any, state: any, dataOrigin?: number) => number | true;
    setLEAFIOCallback: (key: any, callerid: any, callbackFunc?: null) => void;
    destructLEAFIOobj: () => void;
};
export function initializeMasterSubsDirectory(_stateObjInstanceID: any, _LEAFappList?: any[], _metamodel?: {
    breezyforest: {
        _version: string;
        _nickname: string;
        scaffold: {
            map: {
                leaf: {
                    logic: {
                        type: string;
                        args: {};
                    };
                    provenance: {
                        api: string;
                        uuid: string;
                        graph: {
                            appuuid: string;
                            name: string;
                            version: string;
                        };
                    };
                    appdata: {};
                };
            };
            directory: {
                api: string[];
                logic: string[];
                type: string[];
                args: string[];
                provenance: string[];
                uuid: string[];
                leafapp: string[];
                appdata: string[];
            };
            fetch: (n_e: any, crawlkey: any) => any;
        };
        originType: {
            FRONTEND: number;
            BACKEND: number;
            SCREEN: number;
        };
        subsDirectory: {
            readmefirst: {};
            leaflake: {
                bridges: {
                    gql: string;
                };
            };
            appintent: {};
            appmodel: {};
            appview: {};
            osview: {};
            osview2: {};
            dataflowplane: {};
            appcache: {};
        };
        IOAccessPermission: {
            Owner: number;
            Observer: number;
            Contributor: number;
            All: number;
        };
        IOStateGroundZero: {
            dirOfSubjects: {};
            subsCache: {};
            subscriptions: {};
            callbacks: {};
            permissions: {};
        };
        GQLParameters: {
            clientconfig_full: {
                keepGQLConnected: boolean;
                dburi_subs: string | undefined;
                dburi_subs_ws: string | undefined;
                dburi_qm: string | undefined;
            };
            clientconfig_sub: {
                keepGQLConnected: boolean;
                dburi_subs: string | undefined;
                dburi_subs_ws: string | undefined;
            };
            clientconfig_qm: {
                dburi_qm: string | undefined;
            };
            masterquery: string;
        };
        LEAFdictionary: {
            map: typeof import("rxjs").map;
        };
    };
}): any[];
export function initializeSubsMain(): {
    handle$: BehaviorSubject<any>;
    doWrite: (_data: any) => void;
    doSubscribe: (_eventCallback: any) => import("rxjs").Subscription;
    doUnsubscribe: (subscription: any) => any;
    doAddAddressee: (gqlrequest: any, nodeuuid: any) => void;
};
import { BehaviorSubject } from "rxjs";

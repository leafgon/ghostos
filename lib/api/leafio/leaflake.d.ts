export function initializeLEAFlakeGQLClient({ _clientConfig, _metamodel, _sessionid, }?: {
    _clientConfig?: {
        dburi_subs: string;
        dburi_subs_ws: string;
        dburi_qm: string;
    } | undefined;
    _metamodel?: {
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
    } | undefined;
    _sessionid?: undefined;
}): {
    subscriptions: {};
    subs_methods: {};
    qm_methods: {};
};

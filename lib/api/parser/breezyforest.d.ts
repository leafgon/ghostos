export const LEAF_NODE_CORE_LOGIC_REGISTRY: Readonly<{
    leafoutflowport: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any, controlflow$obj: any) => any>;
    };
    leafinflowport: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => any>;
    };
    leafscreenio: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any, controlflow$obj: any) => any>;
    };
    leafmemoryio: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => {
            etatreeforest: {
                initEtaTreeForest: () => void;
                getEtaTree: (graphdomain: any, graphappid: any) => Promise<any>;
                setEtaTree: (graphdomain: any, graphappid: any, etaTree: any, parentname: any) => void;
                removeEtaBush: (graphdomain: any, graphappid: any) => void;
                parseGraphEtaTree: (graphdomain: any, graphappid: any) => Promise<{
                    sessionid: any;
                    appmode: any;
                    hostdomain: any;
                    hostappid: any;
                    domain: any;
                    appid: any;
                    leafgraph: undefined;
                    graphcomponents: undefined;
                    rootgraphstate: undefined;
                    leafio: undefined;
                    leaflakeio: undefined;
                    mnemosyne: undefined;
                    hostEtaTree: undefined;
                    leafnodemethods: {};
                    lookupRuntimeLambdaLUT: (graphdomain: any, graphappid: any, refnode: any, nodelambda: any, contextuallambda: any, isnodeonly?: boolean) => Promise<{
                        _default: (inputArr$: any) => undefined;
                    } | {
                        _nodelut: {};
                    } | {
                        _nodelut?: undefined;
                    }>;
                    lookupLEAFNodeMethods: (nodeuuid: any, _refnodedata?: undefined) => Promise<any>;
                    etaReduceLEAFNode: ({ nodeuuid, contextuallambda }?: {}) => Promise<{
                        _default: (inputArr$: any) => undefined;
                    }>;
                    loadElementJsEsmModule: (moduleUrl: any) => Promise<any>;
                    initTree: (_leafgraph: any, _graphcomponents: any, _leafio: any, _leaflakeio: any, _mnemosyne: any) => ({ nodeuuid, contextuallambda }?: {}) => Promise<{
                        _default: (inputArr$: any) => undefined;
                    }>;
                }>;
            };
            general: {
                setMasterMemory: (memoryname: any, data: any) => any;
                getMasterMemory: (memoryname: any) => any;
            };
        };
    };
    leafdeckspade: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => (//};
        { refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafdeckheart: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafdeckdiamond: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafdeckclub: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafgnav: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafpopupview: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafelement: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
            texteditor: {
                setTextSource: (configtext: any) => void;
                getTextSource: () => any;
            };
            general: {
                getNodeData: () => any;
                getLambdaLUT: () => Promise<{}>;
                setElementName: (name: any) => void;
            };
        }>;
    };
    leafgraph: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{} | undefined>;
        _lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{} | undefined>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leaflambdagraph: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$Arr: any, controlflow$obj: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafanchor: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<undefined>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<undefined>;
    };
    leafspell: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<any>;
    };
    leafspelldef: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$Arr: any, controlflow$obj: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafloopyspell: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$Arr: any, controlflow$obj: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafchronosflow: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafasyncflow: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafmixflow: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => any>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafgateflow: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leaflisp: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
            _default: (input$objArr: any, controlflow$obj: any) => {
                _stream: import("rxjs").Subject<any>;
                _control: any;
            };
        }>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
            version: string;
            nodequery: (flowinput$obj: any) => any;
            nodemethod: (flowinput$obj: any) => {};
        }>;
    };
    leaflabel: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
            _nodelut: {};
        } | {
            _nodelut?: undefined;
        }>;
    };
    leafdelabel: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any, controlflow$obj: any) => {
            _stream: any;
            _control: any;
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<any>;
    };
    leafbottle: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafunbottle: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: {
                _stream: any;
                _config: any;
            };
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafcrate: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
            _stream: import("rxjs").Observable<any>;
            _control: any;
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    };
    leafconfig: () => {
        dataflow: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any, controlflow$obj: any) => {
            _stream: any;
            _control: any;
        }>;
        lambda: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
        methods: (lambdactrl: any) => ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
            config: {
                getConfigData: () => Promise<any>;
            };
        }>;
    };
}>;
export const LEAF_NODE_CORE_LOGIC_TYPES: readonly string[];
export function getLEAFNodeCoreLogic(type: any, scope: any, lambdactrl: any): any;
export function listRunnableLeafNodeTypes(): string[];

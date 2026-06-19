export namespace _leafconfig {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any, controlflow$obj: any) => {
        _stream: any;
        _control: any;
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    function methods(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
        config: {
            getConfigData: () => Promise<any>;
        };
    }>;
}

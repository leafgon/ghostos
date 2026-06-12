export namespace _leafelement {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
            _config: any;
        };
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{}>;
    function methods(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<{
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
}

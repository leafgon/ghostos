export namespace _leafoutflowport {
    function dataflow(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
            _config: any;
        };
    }>;
    function lambda(lambdactrl: any): ({ refnode, refnodedata, nodelambda, contextuallambda }?: {}) => Promise<(flowinput$Arr: any, controlflow$obj: any) => any>;
}

export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: import("rxjs").Observable<any>;
        };
    };
    datalogic: {
        pre: (data_in: any) => any;
        post: (data_in: any) => any;
    };
};
export const cachekeys: {};

export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: Observable<any>;
        _control: {
            _stream: Observable<any>;
        };
    };
    datalogic: {
        pre: (data_in: any) => any;
        post: (data_in: any) => any;
    };
};
export namespace cachekeys {
    let CONFIG: string;
    let CURSOR: string;
    let LAST_READ_AT: string;
    let READ_STREAM: string;
    let READ_STREAMS: string;
    let DATA_SUBSCRIBER_COUNT: string;
}
import { Observable } from "rxjs";

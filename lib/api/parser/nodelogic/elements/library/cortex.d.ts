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
    let FIFO: string;
    let POLL_LIST: string;
    let IDEMPOTENCY_RECORDS: string;
    let DATA_SUBSCRIBER_COUNT: string;
}
import { Observable } from "rxjs";

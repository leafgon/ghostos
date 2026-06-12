export function props(_stream_cache: any): {
    elementio$: Subject<any>;
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<any>;
        _control: {
            _stream: any;
        };
    };
    datalogic: {
        pre: (data_in: any) => any;
        post: (data_in: any) => any;
    };
};
export namespace cachekeys {
    let UIDEFS: string;
}
import { Subject } from "rxjs";

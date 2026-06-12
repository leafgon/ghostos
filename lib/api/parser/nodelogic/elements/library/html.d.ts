export function props(_stream_cache: any): {
    elementio$: Subject<any>;
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: Subject<any>;
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
    let TEMPLATE: string;
}
import { Subject } from "rxjs";

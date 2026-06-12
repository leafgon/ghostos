export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: Subject<any>;
        _control: {
            _stream: any;
        };
    };
    datalogic: {
        pre: (_data_in: any) => any;
        post: (data_in: any) => any;
    };
};
export namespace cachekeys {
    let EDGES: string;
    let BACKDROP: string;
}
import { Subject } from "rxjs";

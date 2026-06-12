export function props(_stream_cache: any): {
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
import { Subject } from "rxjs";

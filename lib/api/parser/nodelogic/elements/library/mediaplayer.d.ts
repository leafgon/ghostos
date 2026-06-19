export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: BehaviorSubject<{
            _bname: any;
            _content: any;
            _label: {};
        }>;
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
    let URI: string;
}
import { BehaviorSubject } from "rxjs";

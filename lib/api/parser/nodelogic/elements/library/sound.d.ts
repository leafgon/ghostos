export function props(_stream_cache: any): {
    leaflogic: (input$objArr: any, controlflow$obj: any) => {
        _stream: import("rxjs").Observable<undefined>;
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
    let CONFIG: string;
    let SOUNDSTAGE: string;
    let CONFIG_PROMISE: string;
}
export function midi_notenum2pitchname(_notenum: any, nameidx?: number): string;

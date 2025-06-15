import { BehaviorSubject, Subject, combineLatest, merge, of } from "rxjs";
import { bufferTime, concatMap, map, share, filter, switchMap } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
//import {JZZ} from 'jzz'; // midi interface
import jzzpkg from 'jzz'; 
//import Wad from "web-audio-daw";
//const Wad = () => {};
import { isBottle, isEmptyBottle } from "../../../predicates.js";
import { doBottle, doUnbottle } from "../../datautils/bottling.js";

const {JZZ} = jzzpkg; // nodejs friendly import

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in midi.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/midi.js"}, {});
const midi_base_notenum = 24;
const midi_base_pitchnum = 1;
const midi_base_notenum2pitch_lut = {
    24: ["C"],
    25: ["C#", "Db"],
    26: ["D"],
    27: ["D#", "Eb"],
    28: ["E"],
    29: ["F"],
    30: ["F#", "Gb"],
    31: ["G"],
    32: ["G#", "Ab"],
    33: ["A"],
    34: ["A#", "Bb"],
    35: ["B"],
}
const midi_notenum2pitchname = (_notenum, nameidx=0) => {
    const pitchnum = midi_base_pitchnum + Math.floor((_notenum - midi_base_notenum)/12);
    const corresponding_base_notenum = _notenum - 12*(pitchnum-1);

    return midi_base_notenum2pitch_lut[corresponding_base_notenum][nameidx]+String(pitchnum)
};

/*
 * spark_dev_note: 25/Apr/2023
 * all leaflogic and datalogic functions must be designed to conform to the following spec, 
 * in order to make sure of the inter-operability of newly developed leaf elements 
 * in breezyforest.
 * 
 * leaflogic lives in the rx flow domain, hence is an ideal function to deal with
 * any data i/o existing in that domain. Data in the reactive stream domain is accessable via 
 * invoking leaf lambda functions, normally bearing the function argument signature of ([input$Arr, ctrlflow$obj]), 
 * or via calling any functions or rx inline pipe-map that would provide the logic for statically 
 * manipulating data flown through any locally accessable rx streams of interest. 
 * Please note the convention of variable names post-scripted with the dollar sign ($), denoting the handles for 
 * respective data streams.
 * 
 * datalogic lives in the static data domain. How data i/o happens in this domain is not directly compatible with the stream domain.
 * the two optional datalogic functions, pre and post, are used to "statically" work on data, in terms of taking data input, 
 * performing data transformation/read/write operations, and returning data output, at two temporal data points, respectively 
 * coinciding with the time before (pre) and after (post) the incidence of data flowing through the leaflogic stream domain.
 * 
 */
const initElementInterface = (_stream_cache) => {
    const reduced_lambda_obj = _stream_cache[ElemCacheKeyLUT.LAMBDA_OBJ];
    //const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    //const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    //const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;

    const midiInput$ = new Subject();
    //const wad = new Wad({
    //    source: 'sine',
    //    tuna   : {
    //        Overdrive : {
    //            outputGain: 0.5,         //0 to 1+
    //            drive: 0.7,              //0 to 1
    //            curveAmount: 1,          //0 to 1
    //            algorithmIndex: 0,       //0 to 5, selects one of our drive algorithms
    //            bypass: 0
    //        },
    //        Chorus : {
    //            intensity: 0.3,  //0 to 1
    //            rate: 4,         //0.001 to 8
    //            stereoPhase: 0,  //0 to 180
    //            bypass: 0
    //        }
    //    }
    //});
    //const beatwad = new Wad({
    //    source: '/assets/sound/Berklee44v1/anklung_1.wav',
    //});
    let beats = -1;
    const midiMessageReceived = ev => {
        beats = (beats + 1)%24; // https://en.wikipedia.org/wiki/MIDI_beat_clock
        if (beats === 0) {
            console.log("beat", Date.now(), ev);
            const pitchname = "C4";
            //beatwad.play({pitch: pitchname, label: pitchname});
            //wad.play();
        }
        console.log('midiMessageReceived', Date.now(), ev)
        const [cmd, noteNumber, velocity, _from] = ev
        midiInput$.next(doBottle("_midi_in", {cmd, noteNumber, velocity}, {timestamp: Date.now()}));
        //if ([144].includes(ev[0]))
        //{
        //    // navigator web midi
        //    //const [cmd, noteNumber] = ev.data
        //    //const velocity = ev.data.length > 2 ? ev.data[2] : 0
        //    // using jzz midi interface
        //    const [cmd, noteNumber, velocity, _from] = ev
        //    //const velocity = ev.data.length > 2 ? ev.data[2] : 0

        //    if (cmd && noteNumber) {
        //        console.log("midi message: ", cmd, noteNumber, velocity);
        //        //const pitchname = midi_notenum2pitchname(noteNumber);
        //        //beatwad.play({pitch: pitchname, label: pitchname});
        //        midiInput$.next(doBottle("_midi_in", {cmd, noteNumber, velocity}, {timestamp: Date.now()}));
        //    }
        //    //this.props.cb({
        //    //    cmd,
        //    //    noteNumber,
        //    //    velocity,
        //    //})
        //}
        //else if ([191].includes(ev[0]))
        //{
        //    const [cmd, noteNumber, velocity, _from] = ev
        //    if (cmd && noteNumber === 118 && velocity === 0) {
        //        console.log("midi message: ", cmd, noteNumber, velocity);
        //        //const pitchname = midi_notenum2pitchname(noteNumber);
        //        //beatwad.play({pitch: pitchname, label: pitchname});
        //        //midiInput$.next(doBottle("_midi_in", {cmd, noteNumber, velocity}, {timestamp: Date.now()}));
        //        midiInput$.next(doBottle("soundinit", {soundnode_trail: []}));
        //    }
        //}
    };

    const onMIDISuccess = midiAccess => {
        let inputs = midiAccess.inputs.values()
        for (let input = inputs.next();
             input && !input.done;
             input = inputs.next()) {
            input.value.onmidimessage = midiMessageReceived
        }
    }

    const onMIDIFailure = () => console.log('Problem!')

    //navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
    const midi_device = {}; 
    //const midiMap = (_event) => {
    //    console.log(_event.receivedTime, _event.receivedData);
    //};

    //Wad.assignMidiMap(midiMap);


    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        const _outflow_data$ = new Subject();
        //const uidefs$obj = uidefsgen ? uidefsgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_UIDEFS)}; // executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const margin$obj = margingen ? margingen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_MARGIN)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const fieldwidth$obj = fieldwidthgen ? fieldwidthgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_FIELDWIDTH)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};

        const _ctrl_out$ = controlflow$obj._stream.pipe(
            switchMap(_ctrl_in => {
                _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
                if (! ("default" in midi_device))
                    midi_device["default"] = JZZ().openMidiIn().or('Error: Cannot open MIDI In port').and(
                        (_midi) => {console.log('MIDI-In: ', _midi); }
                    ).connect(midiMessageReceived);
                // perform any input data (read) operations specific to the element here
                // like accessing the most up-to-date messages from rx subjects/streams, etc
                // spark_dev_note: #http_dataflow_point
                const _data_in$ = merge(...input$objArr.map(_input=>_input._stream), midiInput$);

                // return data read from the rx stream domain as an array
                return _data_in$;
            }),

            //bufferTime(5),
            //filter(_=>_.length>0),
            map(_data_in => {
                //console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc
                if (!Array.isArray(_data_in) && _data_in._bname === "error")
                    console.log("start debugging");

                const processed_in = (Array.isArray(_data_in) ? _data_in : [_data_in]).map(_bottle=> {
                    if (_bottle._bname === "_data_in") {
                        if (!isEmptyBottle(_bottle._content))
                            return doUnbottle("*", _bottle);
                        else
                            return undefined;
                    }
                    else if (isBottle(_bottle)) //["_midi_in", "soundconfig", "soundinit",etc].includes_bottle._bname
                        return _bottle;
                }).filter(_b=>_b);

                console.log("midi message to be registered in nodeflowinterface", _data_in);
                
                if (processed_in.length > 0)
                    _outflow_data$.next(processed_in);
                //if (_data_in.length > 1)
                //    _outflow_data$.next(_data_in);
                //else if (_data_in.length === 1)
                //    _outflow_data$.next(_data_in[0]);
                //// return ctrl
                return _stream_cache[ElemCacheKeyLUT.CTRLIN];
            }),
            share()
        );

        return {_stream: _outflow_data$, _control: {_stream: _ctrl_out$}}
    };

    // put any static data preprocessing logic applied to all incident data, 
    // flown on each incoming edge stream.
    // data preprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_pre = (data_in) => {

        const data_out = doBottle("_data_in", data_in);

        return data_out;
    };

    //let saw = new globalThis.Wad({source : 'sawtooth'});
    // put any static data postprocessing logic applied to all incident data, 
    // to be flown on the outgoing edge stream.
    // data postprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_post = (data_in) => {
        const recognizedLambdaConstants = ['image', 'audio', 'video'];
        const curLambdaKeys = Object.keys(reduced_lambda_obj);
        const validLambdaKeyList = recognizedLambdaConstants.filter(_ => curLambdaKeys.includes(_));
        const mediatype = validLambdaKeyList.length > 0 ? validLambdaKeyList[0] : 'image'; // default to 'image' type


        //data_in.map(_in_bottle=> {
        //    if (_in_bottle._bname === "_midi_in") {
        //        if (_in_bottle._content.velocity > 0) {
        //            const pitchname = midi_notenum2pitchname(_in_bottle._content.noteNumber);
        //            wad.play({pitch: pitchname, label: pitchname});
        //        }
        //        else {
        //            const pitchname = midi_notenum2pitchname(_in_bottle._content.noteNumber);
        //            console.log("wad.stop() ", pitchname)
        //            wad.stop(pitchname);
        //        }
        //    }
        //})
        //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

        // spark_dev_note: #http_dataflow_point // corresponding handles upstream
        //const _uidefs = data_in[0];          // uidefs$obj._stream
        //const _margin_userval = data_in[1];          // margin$obj._stream
        //const _fieldwidth_userval = data_in[2];          // fieldwidth$obj._stream
        let _flowdatain = data_in;   // [...input$objArr]
        _flowdatain = _flowdatain.length === 1 ? _flowdatain[0] : _flowdatain; // take care of data plurality

        //const node_output = formatElementFlowdata({
        //    element: {
        //        nodeuuid: _stream_cache[ElemCacheKeyLUT.REFNODE],
        //        type: 'midi',
        //        componentdata: {
        //            mediatype: mediatype,
        //            nodeinput: Array.isArray(_flowdatain) ? _flowdatain : [_flowdatain],
        //            callbacks: {
        //                onDropAccepted: (files, dropevent) => {
        //                    console.log("start debugging");
        //                }
        //            }
        //        }
        //    }
        //}, "screenio");
        const node_output = _flowdatain;

        return node_output;
    };

    return {
        leaflogic: _leaflogic,
        datalogic: {
            pre: _datalogic_pre,
            post: _datalogic_post
        }
    };
};


const props = initElementInterface;

export {props};
import { BehaviorSubject, Subject, combineLatest, merge, of } from "rxjs";
import { bufferTime, concatMap, map, share, filter, switchMap, withLatestFrom } from 'rxjs/operators';

import {ElemCacheKeyLUT, formatElementFlowdata} from "./index.js";
//import {JZZ} from 'jzz'; // midi interface
import jzzpkg from 'jzz';
import { executeLEAFLogic } from "../../../leaf.js";
import { EmptyBottle, doBottle, doUnbottle } from "../../datautils/bottling.js";
import { cacheSoundStageNode, connectCachedSoundStageNodes, destroySoundStageNode, doConfigureEffect, doConfigureInstrument, doConfigureSource, doConfigureTarget, initializeToneState } from "./sound_lib.js";
import { isEmptyBottle } from "../../../predicates.js";

const {JZZ} = jzzpkg;

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in sound.js", codebase:"/src/ghostos/api/parser/nodelogic/elements/library/sound.js"}, {});

const cachekeys = {
    CONFIG: "_sound_config",
    SOUNDSTAGE: "_daw_object",
};

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
    const defaultgen = ('_default' in reduced_lambda_obj) ? reduced_lambda_obj._default : undefined;
    const ispoly = true; //('poly' in reduced_lambda_obj);

    const is_instrument = ("instrument" in reduced_lambda_obj) || ("inst" in reduced_lambda_obj);
    const is_source = ("source" in reduced_lambda_obj) || ("src" in reduced_lambda_obj);
    const is_effect = ("effect" in reduced_lambda_obj) || ("fx" in reduced_lambda_obj); // an effect here is what an audionode is in web audio api terms
    const is_target = ("target" in reduced_lambda_obj) || ("trg" in reduced_lambda_obj);

    //const _DEFAULT_SOUND_CONFIG = {
    //    source: 'sine',
    //    tuna: {
    //        Overdrive: {
    //            outputGain: 0.5,         //0 to 1+
    //            drive: 0.7,              //0 to 1
    //            curveAmount: 1,          //0 to 1
    //            algorithmIndex: 0,       //0 to 5, selects one of our drive algorithms
    //            bypass: 0,
    //        },
    //        Chorus: {
    //            intensity: 0.3,  //0 to 1
    //            rate: 4,         //0.001 to 8
    //            stereoPhase: 0,  //0 to 180
    //            bypass: 0,
    //        }
    //    }
    //};
    const _DEFAULT_SOUND_CONFIG = {
        audionode: {
            type: "gain", 
            value: 0.5,
        },
        source: {
            type: "oscillator", // "oscillator", "omnioscillator", "lfo", "player", "noise", 
            options: {
                type: "sine", // "sine", "sawtooth", "square", "triangle", "fm", "am", "fat", "pwm", "pulse" etc
            }
        },
        timing: { // any options relevant to those of "transport" in tone.js lingo
            bpm: 150,
        },
        instrument: {
            type: "polysynth", // "amsynth", "duosynth", "fmsynth", "membranesynth", "metalsynth", "monosynth", "noisesynth", "plucksynth", "polysynth", "sampler", "synth"
            voice: "synth", // "undefined", or one of "synth", "monosynth", "fmsynth", "duosynth", "amsynth"
            options: {

            }
        },

        //tuna: {
        //    Overdrive: {
        //        outputGain: 0.5,         //0 to 1+
        //        drive: 0.7,              //0 to 1
        //        curveAmount: 1,          //0 to 1
        //        algorithmIndex: 0,       //0 to 5, selects one of our drive algorithms
        //        bypass: 0,
        //    },
        //    Chorus: {
        //        intensity: 0.3,  //0 to 1
        //        rate: 4,         //0.001 to 8
        //        stereoPhase: 0,  //0 to 180
        //        bypass: 0,
        //    }
        //}
    };
    //const _DEFAULT_CONFIG = ispoly ? {"poly": {}, "0":_DEFAULT_SOUND_CONFIG} : _DEFAULT_SOUND_CONFIG;
    
    //const beatwad = new Wad({
    //    source: '/assets/sound/Berklee44v1/anklung_1.wav',
    //});
    //const uidefsgen = (('uidefs' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.uidefs)) ? reduced_lambda_obj.uidefs._default : undefined;
    //const margingen = (('margin' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.margin)) ? reduced_lambda_obj.margin._default : undefined;
    //const fieldwidthgen = (('fieldwidth' in reduced_lambda_obj) && ('_default' in reduced_lambda_obj.fieldwidth)) ? reduced_lambda_obj.fieldwidth._default : undefined;

    //const midiInput$ = new Subject();

    //const midiMessageReceived = ev => {
    //    //console.log('midiMessageReceived', ev)
    //    if ([144].includes(ev[0]))
    //    {
    //        // navigator web midi
    //        //const [cmd, noteNumber] = ev.data
    //        //const velocity = ev.data.length > 2 ? ev.data[2] : 0
    //        // using jzz midi interface
    //        const [cmd, noteNumber, velocity, _from] = ev
    //        //const velocity = ev.data.length > 2 ? ev.data[2] : 0

    //        if (cmd && noteNumber) {
    //            //console.log("midi message: ", cmd, noteNumber, velocity);
    //            midiInput$.next(doBottle("_midi_in", {cmd, noteNumber, velocity}));
    //        }
    //        //this.props.cb({
    //        //    cmd,
    //        //    noteNumber,
    //        //    velocity,
    //        //})
    //    }
    //};

    //const onMIDISuccess = midiAccess => {
    //    let inputs = midiAccess.inputs.values()
    //    for (let input = inputs.next();
    //         input && !input.done;
    //         input = inputs.next()) {
    //        input.value.onmidimessage = midiMessageReceived
    //    }
    //}

    //const onMIDIFailure = () => console.log('Problem!')

    //navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure)
    //const midiMap = (_event) => {
    //    console.log(_event.receivedTime, _event.receivedData);
    //};

    //Wad.assignMidiMap(midiMap);

    const node_context = {
        codebase: "ghostos/api/parser/nodelogic/elements/library/sound.js",
        refnode: _stream_cache[ElemCacheKeyLUT.REFNODE], 
        //leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data
    };

    const ctrl_trigger_bottle = doBottle('accio', 'ctrl_accio');
    const data_trigger_bottle = doBottle('accio', 'data_accio');

    // this is a one-off execution of defaultgen() isolated from the main flow.
    const default_config_prom = (defaultgen ?
        executeLEAFLogic(defaultgen, data_trigger_bottle, {}, node_context.refnode) : //.then(_config=>{
            //_stream_cache[ElemCacheKeyLUT.sound.CONFIG] = _config
        //});
        Promise.resolve(_DEFAULT_SOUND_CONFIG));


    // do the sound node configuration
    default_config_prom.then(_config=>{
        // now that _config is resolved do the following configuration steps.
        _stream_cache[ElemCacheKeyLUT.sound.CONFIG] = _config; // store the current config in cache
        //onConfigBottle(doBottle("soundconfig", _config));
    });

    // onInitBottle is a bottle handler, triggered when a leaf bottle named "soundinit" arrives in the input port of the leaf dataflow stream
    // of a sound element.
    const onInitBottle = (_ibottle=undefined) => {
        if (_ibottle) {
            console.log("_ibottle:", _ibottle, _stream_cache[ElemCacheKeyLUT.REFNODE])
            const _sourcenodeuuid = _ibottle._content.soundnode_trail.slice(-1)[0];
            const _targetnodeuuid = _stream_cache[ElemCacheKeyLUT.REFNODE];
            if (is_target) {
                doConfigureTarget(_sourcenodeuuid);
            }
            else if (_sourcenodeuuid && _targetnodeuuid)
                connectCachedSoundStageNodes(_sourcenodeuuid, _targetnodeuuid);
        }

        return {..._ibottle, _content: {soundnode_trail: _ibottle._content.soundnode_trail.concat(_stream_cache[ElemCacheKeyLUT.REFNODE])}}
    };

    // onConfigBottle is a bottle handler, triggered when a leaf bottle named "soundconfig" arrives in the input port of the leaf dataflow stream
    // of a sound element.
    const onConfigBottle = (_cbottle=undefined) => {
        let newconfig;
        if (_cbottle) {
            // change the config and create a daw obj to replace an old one, if any.
            newconfig = doUnbottle("soundconfig", _cbottle);

            // now that _config is resolved do the following configuration steps.
            _stream_cache[ElemCacheKeyLUT.sound.CONFIG] = newconfig; // store the current config in cache
        }
        else {
            newconfig = _stream_cache[ElemCacheKeyLUT.sound.CONFIG]
        }

        let _soundnode;
        if (is_instrument) {
            _soundnode = doConfigureInstrument(_stream_cache[ElemCacheKeyLUT.REFNODE], newconfig);
            //_soundnode.toDestination();
        }
        else if (is_source) {
            _soundnode = doConfigureSource(newconfig);
        }
        else if (is_effect) {
            _soundnode = doConfigureEffect(_stream_cache[ElemCacheKeyLUT.REFNODE], newconfig, _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE] !== undefined);
        }
        else {
            // default is an effect 
            _soundnode = doConfigureEffect(_stream_cache[ElemCacheKeyLUT.REFNODE], newconfig);
        }

        //delete _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE];
        //destroySoundStageNode(_stream_cache[ElemCacheKeyLUT.REFNODE]); // destroy if any previously instantiated soundnode exists
        _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE] = _soundnode;
        cacheSoundStageNode(_stream_cache[ElemCacheKeyLUT.REFNODE], _soundnode);


        //const newconfigkeys = Object.keys(newconfig);
        //if (ispoly) {
        //    newconfig = newconfigkeys.map(_configkey => {
        //        if (_configkey in _stream_cache[ElemCacheKeyLUT.sound.CONFIG]) { // if a sound config exists for the given config key
        //            if (JSON.stringify(_stream_cache[ElemCacheKeyLUT.sound.CONFIG][_configkey]) != JSON.stringify(newconfig[_configkey])) { // if the new config has difference.
        //                if (ispoly) {
        //                    //const _new_wad = new Wad(newconfig[_configkey]);
        //                    //const _new_tone = toneinstrument_lut[]
        //                    _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE][_configkey] = _new_wad;
        //                    _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"].remove(_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE][_configkey]);
        //                    _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"].add(_new_wad);
        //                    _stream_cache[ElemCacheKeyLUT.sound.CONFIG][_configkey] = newconfig[_configkey];
        //                }
        //                return newconfig[_configkey];
        //            }
        //            return undefined;
        //        }
        //        else if (!(_configkey in _stream_cache[ElemCacheKeyLUT.sound.CONFIG])) {
        //            const _new_wad = new Wad(newconfig[_configkey]);
        //            _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE][_configkey] = _new_wad;
        //            _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"].add(_new_wad);
        //            _stream_cache[ElemCacheKeyLUT.sound.CONFIG][_configkey] = newconfig[_configkey];
        //            return newconfig[_configkey];
        //        }
        //    });
        //}
        //else {

        //    // spark_dev_note: 10/July/2023
        //    // too sleepy to continue wrapping up tonight. will continue tomorrow.
        //    // currently the soundconfig bottle handling block isn't complete.
        //}
        //_stream_cache[ElemCacheKeyLUT.sound.CONFIG] = {..._stream_cache[ElemCacheKeyLUT.sound.CONFIG], ...newconfig};
        //_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE] = new Wad(_stream_cache[ElemCacheKeyLUT.sound.CONFIG]);
    };

    const _leaflogic = (input$objArr, controlflow$obj) => {
        //const _stream_cache = {};
        //const _outflow_data$ = new BehaviorSubject(raceConditionError);
        
        const _outflow_data$ = new BehaviorSubject(undefined);
        //const uidefs$obj = uidefsgen ? uidefsgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_UIDEFS)}; // executeLEAFLogicInSync(urigen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const margin$obj = margingen ? margingen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_MARGIN)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const fieldwidth$obj = fieldwidthgen ? fieldwidthgen(input$objArr, controlflow$obj) :
        //    {_stream: of(_TEST_FIELDWIDTH)}; //executeLEAFLogicInSync(headergen, merged_input$, undefined, _ctrl_data$, {...controlflow$obj._config}) : {_stream: of([]), _control: {_stream: _ctrl_data$}};
        //const wadconfig$obj =  (defaultgen ? 
        //    driveDataflowByCtrlflow(
        //        {_stream: of(ctrl_trigger_bottle)}, [{_stream: of(data_trigger_bottle)}], undefined, node_context, 
        //        {
        //            leaflogic: defaultgen,
        //            datalogic: {post: (_data) => {
        //                _stream_cache[ElemCacheKeyLUT.wad.CONFIG] = _data;
        //                _stream_cache[ElemCacheKeyLUT.wad.WADOBJ] = new Wad(_data);
        //                return _stream_cache[ElemCacheKeyLUT.wad.WADOBJ];
        //            }}
        //        }
        //    ) : 
        //    {_stream: of(_DEFAULT_CONFIG), _control: {_stream: controlflow$obj._stream}}
        //); 
        //const midi_device = JZZ().openMidiIn().or('Error: Cannot open MIDI In port').and(
        //    (_midi) => {console.log('MIDI-In: ', _midi, Wad.midiInputs);}
        //).connect(midiMessageReceived);

        const _ctrl_out$ = controlflow$obj._stream.pipe(
            map(_ctrl_in => {
                _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;
                return _ctrl_in;
            }),
            //switchMap(_ctrl_in => {
            //    _stream_cache[ElemCacheKeyLUT.CTRLIN] = _ctrl_in;

            //    // perform any input data (read) operations specific to the element here
            //    // like accessing the most up-to-date messages from rx subjects/streams, etc
            //    // spark_dev_note: #http_dataflow_point
            //    //const _data_in$ = combineLatest([wadconfig$obj._stream, ...input$objArr.map(_input=>_input._stream)]);
            //    
            //    const _data_in$ =  combineLatest(input$objArr.map(_input=>_input._stream));

            //    // return data read from the rx stream domain as an array
            //    return _data_in$;
            //}),
            withLatestFrom(...input$objArr.map(_input=>_input._stream)),
            //switchMap(_ctrl_in=> {
            //    const _data_in$ = merge(...input$objArr.map(_input=>_input._stream));
            //    return _data_in$;
            //}),
            //bufferTime(20),
            //filter(_=>_.length>0),
            map(_combined_in => {
                //console.log("testing element _leaflogic: ", _data_in);
                // perform any output data (write) operations specific to the element here
                // like sending messages to rx subjects, etc

                const processed_in = _combined_in.slice(1).flat().map(_bottle=> {
                    if (_bottle._bname === "_data_in")
                        return doUnbottle("*", _bottle);
                    else if (_bottle._bname === "_midi_in") {
                        const {cmd, noteNumber, velocity} = _bottle._content;
                        return _bottle;
                    }
                    else if (_bottle._bname === "soundconfig") 
                        onConfigBottle(_bottle);
                    else if (_bottle._bname === "soundinit") 
                        return onInitBottle(_bottle);
                    return undefined;
                }).filter(_b=>_b);

                if (processed_in.length > 0)
                    _outflow_data$.next(processed_in);

                //if (processed_in.length === 1)
                //    _outflow_data$.next(processed_in[0]);
                //else if (processed_in.length > 1)
                //    _outflow_data$.next(processed_in);
                
                //if (_data_in.length > 1)
                //    _outflow_data$.next(_data_in);
                //else if (_data_in.length === 1)
                //    _outflow_data$.next(_data_in[0]);
                //// return ctrl
                return _stream_cache[ElemCacheKeyLUT.CTRLIN];
            }),
            share()
        );

        return {
            _stream: _outflow_data$.pipe(
                filter(_=>_)
            ), 
            _control: {_stream: _ctrl_out$}}
    };

    // put any static data preprocessing logic applied to all incident data, 
    // flown on each incoming edge stream.
    // data preprocessed and returned from this function will continue to flow in the data domain
    // of the current element node.
    const _datalogic_pre = (data_in) => {

        //const data_out = doBottle("_data_in", data_in);
        const data_out = data_in;
        if (!_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE] && !is_target) {
            onConfigBottle(); // first call
            //console.error("LEAF Error: leaf sound element was used before initialization");
            //try {
                //_stream_cache[ElemCacheKeyLUT.sound.CONFIG] = await default_config_prom;
                //const 
                //_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE] = //ispoly ? {"0": new Wad(_stream_cache[ElemCacheKeyLUT.sound.CONFIG]["0"])} : new Wad(_stream_cache[ElemCacheKeyLUT.sound.CONFIG]);
                //if (ispoly) {
                //    _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"] = new Wad.Poly(_stream_cache[ElemCacheKeyLUT.sound.CONFIG]["poly"]);
                //    _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"].add(_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["0"]);
                //}
            //}
            //catch (err) {
            //    console.log(err);
            //    //delete _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE];
            //}
        }

        if (is_target)
            initializeToneState();

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


        if (!Array.isArray(data_in))
            console.log("start debugging");
        const filtered_data_in = data_in.map(_in_bottle=> {
            if (_in_bottle._bname === "_midi_in") {
                console.log(_in_bottle._content);
                const soundstageobj = _stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE];
                if (_in_bottle._content.velocity > 0) {
                    const pitchname = midi_notenum2pitchname(_in_bottle._content.noteNumber);
                    const duration = _in_bottle._content.duration; // optional, may be undefined
                    //_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"].play({pitch: pitchname, label: pitchname});
                    if (duration) 
                        soundstageobj.triggerAttackRelease(pitchname, duration);
                    else
                        soundstageobj.triggerAttack(pitchname)
                    //_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE].play({pitch: pitchname, label: pitchname});
                }
                else {
                    const pitchname = midi_notenum2pitchname(_in_bottle._content.noteNumber);
                    console.log("daw stop() ", pitchname)
                    //_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE]["poly"].stop(pitchname);
                    //_stream_cache[ElemCacheKeyLUT.sound.SOUNDSTAGE].stop(pitchname);
                    soundstageobj.triggerRelease(pitchname);
                }
                return EmptyBottle;
            }
            return _in_bottle;
        })
        //const marginval = reduced_lambda_obj.margin ? Object.keys(reduced_lambda_obj.margin) : undefined;
        //const fieldwidthval = reduced_lambda_obj.fieldwidth ? Object.keys(reduced_lambda_obj.fieldwidth) : undefined;

        // spark_dev_note: #http_dataflow_point // corresponding handles upstream
        //const _uidefs = data_in[0];          // uidefs$obj._stream
        //const _margin_userval = data_in[1];          // margin$obj._stream
        //const _fieldwidth_userval = data_in[2];          // fieldwidth$obj._stream
        let _flowdatain = filtered_data_in;   // [...input$objArr]
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

export {props, cachekeys, midi_notenum2pitchname};
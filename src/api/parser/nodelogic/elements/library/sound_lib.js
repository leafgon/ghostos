//import tonepkg from "tone";
//import { Tone } from "tone/build/esm/core/Tone";
import * as tonepkg from "tone";

const { Synth, AMSynth, DuoSynth, FMSynth, MembraneSynth, MetalSynth, MonoSynth, NoiseSynth, PluckSynth, PolySynth, Sampler, Transport } = tonepkg;

const toneinstrument_lut = {
    "synth": {
        "new": (options) => {return new Synth(options);}
    },
    "amsynth": {
        "new": (options) => {return new AMSynth(options);}
    },
    "duosynth": {
        "new": (options) => {return new DuoSynth(options);},
    },
    "fmsynth": {
        "new": (options) => {return new FMSynth(options);},
    },
    "membranesynth": {
        "new": (options) => {return new MembraneSynth(options);}
    },
    "metalsynth": {
        "new": (options) => {return new MetalSynth(options);}
    },
    "monosynth": {
        "new": (options) => {return new MonoSynth(options);}
    },
    "noisesynth": {
        "new": (options) => {return new NoiseSynth(options);}
    },
    "plucksynth": {
        "new": (options) => {return new PluckSynth(options);}
    },
    "polysynth": {
        "new": (voice, options) => {return new PolySynth(voice, options);}
    },
    "sampler": {
        "new": (options) => {return new Sampler(options);}
    },
};

// "synth", "monosynth", "fmsynth", "duosynth", "amsynth"
const tonevoice_lut = {
    "synth": Synth, // default
    "monosynth": MonoSynth,
    "fmsynth": FMSynth,
    "duosyntho": DuoSynth,
    "amsynth": AMSynth
};

const toneeffect_lut = {
    "autofilter": {
        "new": (options) => {return new tonepkg.AutoFilter(options);}
    },
    "bitcrusher": {
        "new": (options) => {return new tonepkg.BitCrusher(options);}
    },
    "chebyshev": {
        "new": (options) => {return new tonepkg.Chebyshev(options);}
    },
    "pitchshift": {
        "new": (options) => {return new tonepkg.PitchShift(options);}
    },
};

const doConfigureInstrument = (refnode, _config, is_reset=false) => {
    // for instruments, _config should have "instrument" among its keys

    try {
        if (_config?.instrument) {
            const _instrument = (!is_reset ? 
                toneinstrument_lut[_config.instrument.type]?.new(
                    (_config.instrument.voice ? tonevoice_lut[_config.instrument.voice] : Synth),
                    _config.instrument.options
                ) :
                ((()=>{
                    globalThis.sound[refnode].set(_config.instrument.options); 
                    return globalThis.sound[refnode]; 
                })())
            );
            return _instrument;
        }

        //return undefined;
        throw "instrument is not defined in the config";
    }
    catch (err) {
        console.error(`LEAF Error: a leafsound element ${refnode} could not be configured, returning error:`, err);

        return undefined;
    }
    return undefined;
};

const doConfigureEffect = (refnode, _config, is_reset=false) => {
    // for instruments, _config should have "instrument" among its keys

    try {
        if (_config?.effect) {
            
            const _effect = (!is_reset ? 
                toneeffect_lut[_config.effect.type]?.new(
                    _config.effect.options
                ) :
                ((()=>{
                    globalThis.sound[refnode].set(_config.effect.options); 
                    return globalThis.sound[refnode]; 
                })())
            );
            return _effect;
        }

        //return undefined;
        throw "effect is not defined in the config";
    }
    catch (err) {
        console.error("LEAF Error: a leafsound element `${refnode}` could not be configured, returning error:", err);

        return undefined;
    }
};

const doConfigureSource = (_config) => {
    // TBI
    return undefined;
};

const doConfigureTarget = (nodeuuid) => {
    globalThis.sound[nodeuuid].toDestination();
    return undefined;
};


const initializeSoundStage = () => {
    globalThis.sound = {};
};

const initializeToneState = () => {
    if (tonepkg.Transport.state !== 'started') {
        tonepkg.start();
        tonepkg.Transport.start();
    } else {
        //Tone.Transport.stop();
    }
}

const cacheSoundStageNode = (nodeuuid, _soundnode) => {
    globalThis.sound[nodeuuid] = _soundnode;
}

// spark_dev_note: 15/Sep/2023
// currently unsure whether web audio sound nodes would need to be 
// explicitly disconnected from any connected nodes upon getting destroyed.
// just assuming and hoping that the web audio api would handle this automtically.
const connectCachedSoundStageNodes = (nodeuuid1, nodeuuid2) => {
    globalThis.sound[nodeuuid1].connect(globalThis.sound[nodeuuid2])
}

const disconnectCachedSoundStageNodes = (nodeuuid1, nodeuuid2) => {
    globalThis.sound[nodeuuid1].disconnect(globalThis.sound[nodeuuid2])
}

const destroySoundStageNode = (nodeuuid) => {
    if (globalThis.sound[nodeuuid]) {
        globalThis.sound[nodeuuid].dispose();
        delete globalThis.sound[nodeuuid];
    }
}

export { doConfigureInstrument, doConfigureSource, doConfigureTarget, doConfigureEffect, initializeSoundStage, initializeToneState, cacheSoundStageNode, destroySoundStageNode, connectCachedSoundStageNodes, disconnectCachedSoundStageNodes };
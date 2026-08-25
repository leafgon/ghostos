let toneModulePromise;

const resetToneModulePromise = () => {
  toneModulePromise = undefined;
};

const loadToneModule = async () => {
  if (!toneModulePromise) {
    toneModulePromise = import("tone")
      .then((toneModule) => toneModule?.default ?? toneModule)
      .catch((error) => {
        resetToneModulePromise();
        throw error;
      });
  }

  return toneModulePromise;
};

const resolveToneCtor = (toneModule, constructorName) => {
  const constructor = toneModule?.[constructorName];
  if (typeof constructor !== "function") {
    throw new Error(`Tone constructor '${constructorName}' is not available.`);
  }

  return constructor;
};

const doConfigureInstrument = async (refnode, _config, is_reset = false) => {
  try {
    if (_config?.instrument) {
      if (is_reset) {
        globalThis.sound[refnode].set(_config.instrument.options);
        return globalThis.sound[refnode];
      }

      const toneModule = await loadToneModule();
      const toneConstructors = {
        Synth: resolveToneCtor(toneModule, "Synth"),
        AMSynth: resolveToneCtor(toneModule, "AMSynth"),
        DuoSynth: resolveToneCtor(toneModule, "DuoSynth"),
        FMSynth: resolveToneCtor(toneModule, "FMSynth"),
        MembraneSynth: resolveToneCtor(toneModule, "MembraneSynth"),
        MetalSynth: resolveToneCtor(toneModule, "MetalSynth"),
        MonoSynth: resolveToneCtor(toneModule, "MonoSynth"),
        NoiseSynth: resolveToneCtor(toneModule, "NoiseSynth"),
        PluckSynth: resolveToneCtor(toneModule, "PluckSynth"),
        PolySynth: resolveToneCtor(toneModule, "PolySynth"),
        Sampler: resolveToneCtor(toneModule, "Sampler"),
      };

      const toneinstrument_lut = {
        synth: {
          new: (_voice, options) => {
            return new toneConstructors.Synth(options);
          },
        },
        amsynth: {
          new: (_voice, options) => {
            return new toneConstructors.AMSynth(options);
          },
        },
        duosynth: {
          new: (_voice, options) => {
            return new toneConstructors.DuoSynth(options);
          },
        },
        fmsynth: {
          new: (_voice, options) => {
            return new toneConstructors.FMSynth(options);
          },
        },
        membranesynth: {
          new: (_voice, options) => {
            return new toneConstructors.MembraneSynth(options);
          },
        },
        metalsynth: {
          new: (_voice, options) => {
            return new toneConstructors.MetalSynth(options);
          },
        },
        monosynth: {
          new: (_voice, options) => {
            return new toneConstructors.MonoSynth(options);
          },
        },
        noisesynth: {
          new: (_voice, options) => {
            return new toneConstructors.NoiseSynth(options);
          },
        },
        plucksynth: {
          new: (_voice, options) => {
            return new toneConstructors.PluckSynth(options);
          },
        },
        polysynth: {
          new: (voice, options) => {
            return new toneConstructors.PolySynth(voice, options);
          },
        },
        sampler: {
          new: (_voice, options) => {
            return new toneConstructors.Sampler(options);
          },
        },
      };

      const tonevoice_lut = {
        synth: toneConstructors.Synth,
        monosynth: toneConstructors.MonoSynth,
        fmsynth: toneConstructors.FMSynth,
        duosynth: toneConstructors.DuoSynth,
        amsynth: toneConstructors.AMSynth,
      };

      const instrumentType = _config.instrument.type?.toLowerCase();
      const voiceType = _config.instrument.voice?.toLowerCase();
      const selectedVoice = voiceType ? tonevoice_lut[voiceType] : toneConstructors.Synth;

      return toneinstrument_lut[instrumentType]?.new(selectedVoice, _config.instrument.options);
    }

    throw new Error("instrument is not defined in the config");
  } catch (err) {
    console.error(
      `LEAF Error: a leafsound element ${refnode} could not be configured, returning error:`,
      err,
    );

    return undefined;
  }
};

const doConfigureEffect = async (refnode, _config, is_reset = false) => {
  try {
    if (_config?.effect) {
      if (is_reset) {
        globalThis.sound[refnode].set(_config.effect.options);
        return globalThis.sound[refnode];
      }

      const toneModule = await loadToneModule();
      const toneeffect_lut = {
        autofilter: {
          new: (options) => {
            return new (resolveToneCtor(toneModule, "AutoFilter"))(options);
          },
        },
        bitcrusher: {
          new: (options) => {
            return new (resolveToneCtor(toneModule, "BitCrusher"))(options);
          },
        },
        chebyshev: {
          new: (options) => {
            return new (resolveToneCtor(toneModule, "Chebyshev"))(options);
          },
        },
        pitchshift: {
          new: (options) => {
            return new (resolveToneCtor(toneModule, "PitchShift"))(options);
          },
        },
      };

      return toneeffect_lut[_config.effect.type?.toLowerCase()]?.new(_config.effect.options);
    }

    throw new Error("effect is not defined in the config");
  } catch (err) {
    console.error(
      `LEAF Error: a leafsound element ${refnode} could not be configured, returning error:`,
      err,
    );

    return undefined;
  }
};

const doConfigureSource = (_config) => {
  return undefined;
};

const doConfigureTarget = (nodeuuid) => {
  globalThis.sound[nodeuuid].toDestination();
  return undefined;
};

const initializeSoundStage = () => {
  globalThis.sound = {};
};

const initializeToneState = async () => {
  const toneModule = await loadToneModule();

  if (toneModule.Transport.state !== "started") {
    await toneModule.start();
    toneModule.Transport.start();
  }
};

const cacheSoundStageNode = (nodeuuid, _soundnode) => {
  globalThis.sound[nodeuuid] = _soundnode;
};

const connectCachedSoundStageNodes = (nodeuuid1, nodeuuid2) => {
  globalThis.sound[nodeuuid1].connect(globalThis.sound[nodeuuid2]);
};

const disconnectCachedSoundStageNodes = (nodeuuid1, nodeuuid2) => {
  globalThis.sound[nodeuuid1].disconnect(globalThis.sound[nodeuuid2]);
};

const destroySoundStageNode = (nodeuuid) => {
  if (globalThis.sound[nodeuuid]) {
    globalThis.sound[nodeuuid].dispose();
    delete globalThis.sound[nodeuuid];
  }
};

export {
  doConfigureInstrument,
  doConfigureSource,
  doConfigureTarget,
  doConfigureEffect,
  initializeSoundStage,
  initializeToneState,
  cacheSoundStageNode,
  destroySoundStageNode,
  connectCachedSoundStageNodes,
  disconnectCachedSoundStageNodes,
};

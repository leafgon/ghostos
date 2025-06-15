
import {props as _mediaplayer, cachekeys as _mediaplayer_cachekeys} from './mediaplayer.js';
import {props as _prompt, cachekeys as _prompt_cachekeys} from './prompt.js';
import {props as _popup} from './popup.js';
import {props as _editor} from './editor.js';
import {props as _text} from './text.js';
import {props as _image} from './image.js';
import {props as _mediainput} from './mediainput.js';
import {props as _midi} from './midi.js';
import {props as _sound, cachekeys as _sound_cachekeys} from './sound.js';
import {props as _gnav, cachekeys as _gnav_cachekeys} from './gnav.js';
import {props as _http, cachekeys as _http_cachekeys} from './http.js';
import {props as _href, cachekeys as _href_cachekeys} from './href.js';
import {props as _html, cachekeys as _html_cachekeys} from './html.js';
import {props as _form, cachekeys as _form_cachekeys} from './form.js';
import {props as _directus, cachekeys as _directus_cachekeys} from './directus.js';
import { doBottle } from '../../datautils/bottling.js';

const ElemCacheKeyLUT = 
{
    LAMBDA_OBJ: "_lambda_obj",
    REFNODE: "_refnode",
    RTCONTEXT: "_rtcontext",
    CTRLIN: "_ctrl_in",
    DATAIN: "_data_in",
    DOMAIN: "_domain",
    APPID: "_appid",
    http: _http_cachekeys,
    href: _href_cachekeys,
    gnav: _gnav_cachekeys,
    prompt: _prompt_cachekeys,
    mediaplayer: _mediaplayer_cachekeys,
    sound: _sound_cachekeys,
    html: _html_cachekeys,
};

// datakey="defaultio", "screenio" or "elementio", may expand further as the usage scenario expands
const formatElementFlowdata = (data, datakey="defaultio", iselementio=true) => { 
    if (iselementio) {
        return doBottle(datakey, data);
    }

    // otherwise, datakey === "defaultio"
    return data; // return without bottling
};

const _std_elements_lut = {
    mediaplayer: _mediaplayer,
    http: _http,
    gnav: _gnav,
    popup: _popup,
    image: _image,
    editor: _editor,
    text: _text,
    prompt: _prompt,
    mediainput: _mediainput,
    midi: _midi,
    sound: _sound,
    html: _html,
    href: _href,
    form: _form,
    directus: _directus,
};

const initStdElementProps = (_cache, elementname) => {
    if (Object.keys(_std_elements_lut).includes(elementname) && _std_elements_lut[elementname])
        return {..._std_elements_lut[elementname](_cache)};
    else
        return undefined;
};


export {initStdElementProps, formatElementFlowdata, ElemCacheKeyLUT};

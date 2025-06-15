//import { processLEAFlisp } from '../../leaflisp';
import { map, withLatestFrom, filter, concatMap, share, switchMap } from 'rxjs/operators';
import { BehaviorSubject, Subject, combineLatest, of } from 'rxjs';
import { mergeDataflows, combineDataflows, chronosDataflow, CHRONOSTYPE_SYNC } from '../../../utils/leafdataflow.js';
import { v4 as uuid4, v5 as uuid5 } from 'uuid';
import axios from 'axios';

import { PocketLisp, simpleFunction } from '../../../parser/leaflisp/plispdist/index.js'; //'../../../parser/leaflisp/pocket-lisp'; //
import { literals, runtime, utils, plHashMap, plVector, plString, plBool, plNumber, 
    PLHashMap, PLVector, PLFractionNumber, PLNumber, PLBool, PLString, plFractionNumber,
    assertNumeric, isScientific, parseDecimalString, parseScientificString,
    assert as lisp_assert,
    StdRuntimeError
} from '../../../parser/leaflisp/plispstdlib/index.js';
import { encodeUnicode } from '../../../utils/leafbase64.js';
//import { result } from 'lodash';
import { etaReduceLambdaGraphs } from '../../eta.js';
import assert from 'assert';
//import { _leafLISPHelpText } from './leaflisphelp';
import { driveDataflowByCtrlflow, executeLEAFLogic, executeLEAFLogicInSync, parseAddressableGraph } from '../../leaf.js';
import { _leafgraph, _leafanchor } from '../abstraction/index.js';
import { _common_methods } from '../common.js';
//import { memoize } from 'lodash';
import _ from 'lodash';
import { isBottle } from '../../predicates.js';
import { doBottle, doUnbottle } from '../datautils/bottling.js';

const raceConditionError = doBottle("error", {type: "critical", message: "LEAF core error: race condition detected in leaflisp.js", codebase:"/src/ghostos/api/parser/nodelogic/wizardry/leaflisp.js"}, {});
const leafgon_env_type = process.env.LEAFGON_ENV_TYPE;
// a predicate to test if object has _datatype, making it one of labelled base data types
const isValuedObj = (_data) => (typeof _data === 'object' && '_datatype' in _data);

// convert json into leaflisp 
const _indentlen = 2;
const _indentstr = "  "; // 2 whitespaces 
const generateIndentsByDepth = (depth) => {
    return (depth > 0) ? _indentstr.repeat(depth) : "";
};

const debuggerGlobal = {
    trace: [],
    probe: []
};

// leaflisp textual representation is generated using a pretty formatter logic 
const parseJsonToLEAFlisp = (x, depth=0, isdictval=false) => {
    const inputtype = typeof(x); // type of the value
    //console.log('input type: ', inputtype);
    //const previndentstr = generateIndentsByDepth(depth-1);
    const curindentstr = generateIndentsByDepth(depth);
    const nextindentstr = generateIndentsByDepth(depth+1);
    return (
      // for string types, escape \ and "
      inputtype === 'string' ? (isdictval ? '' : curindentstr)+`"${x.replace(/\\/g, '\\\\').replace(/"/g, '\\\"')}"\n` : 
      (inputtype === 'object' ? 
          (Array.isArray(x) ? ((isdictval ? '' : curindentstr)+(depth == 0 ? '[\n' : '[\n')+ (`${x.map((value) => parseJsonToLEAFlisp(value, depth+1)).join('')}`) + curindentstr+(depth == 0 ? ']\n' : ']\n')) :
                              ([null, undefined].includes(x) ? (isdictval ? '' : curindentstr)+'null\n' :
                              ((isdictval ? '' : curindentstr)+(depth == 0 ? '{\n' : '{\n')+ (`${Object.entries(x).map(([key, value]) => nextindentstr+':'+key + ' ' + parseJsonToLEAFlisp(value, depth+1, true)).join('')}`) + curindentstr+(depth == 0 ? '}\n' : '}\n')))) :
      (inputtype === 'boolean' ? (isdictval ? '' : curindentstr)+(x ? 'true\n' : 'false\n') :
      (inputtype === 'number' ? (isdictval ? '' : curindentstr)+String(x)+'\n' :
          (isdictval ? '' : curindentstr)+'null\n' // a catch-all js to leaflisp conversion including undefined types
      )))
    );
//  (
//    (x != undefined) ? 
//      :
//    (isdictval ? '' : curindentstr)+'null\n');
};

function toFixed(x) {
    if (Math.abs(x) < 1.0) {
        var e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10,e-1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        var e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10,e);
            x += (new Array(e+1)).join('0');
        }
    }
    return x;
}

//https://stackoverflow.com/questions/1685680/how-to-avoid-scientific-notation-for-large-numbers-in-javascript
/******************************************************************
 * Converts e-Notation Numbers to Plain Numbers
 ******************************************************************
 * @function eToNumber(number)
 * @version  1.00
 * @param   {e nottation Number} valid Number in exponent format.
 *          pass number as a string for very large 'e' numbers or with large fractions
 *          (none 'e' number returned as is).
 * @return  {string}  a decimal number string.
 * @author  Mohsen Alyafei
 * @date    17 Jan 2020
 * Note: No check is made for NaN or undefined input numbers.
 *
 *****************************************************************/
 function eToNumber(num) {
    let sign = "";
    (num += "").charAt(0) == "-" && (num = num.substring(1), sign = "-");
    let arr = num.split(/[e]/ig);
    if (arr.length < 2) return sign + num;
    let dot = (.1).toLocaleString().substr(1, 1), n = arr[0], exp = +arr[1],
        w = (n = n.replace(/^0+/, '')).replace(dot, ''),
      pos = n.split(dot)[1] ? n.indexOf(dot) + exp : w.length + exp,
      L   = pos - w.length, s = "" + BigInt(w);
      w   = exp >= 0 ? (L >= 0 ? s + "0".repeat(L) : r()) : (pos <= 0 ? "0" + dot + "0".repeat(Math.abs(pos)) + s : r());
    L= w.split(dot); if (L[0]==0 && L[1]==0 || (+w==0 && +s==0) ) w = 0; //** added 9/10/2021
    return sign + w;
    function r() {return w.replace(new RegExp(`^(.{${pos}})(.)`), `$1${dot}$2`)}
}

const parseJsonToLEAFlispObj = (x, isfirst=true) => {
    if (x == undefined) {
        //return runtime.null;
        return runtime.Nothing;
    }
    const inputtype = typeof(x); // type of the value
    //console.log('input type: ', inputtype);
    return (
    inputtype === 'string' ? plString(x) : 
    (inputtype === 'object' ? 
        (Array.isArray(x) ? (plVector(...x.filter(_=>_).map((value) => parseJsonToLEAFlispObj(value, false)))) :
                            ([null, undefined].includes(x) ? runtime.Nothing :
                            (plHashMap(...(Object.entries(x).map(([key, value]) => [plString(key), parseJsonToLEAFlispObj(value, false)]).flat()))))) :
    (inputtype === 'boolean' ? plBool(x) :
    (inputtype === 'number' ? plNumber(x.toString().includes('e') ? eToNumber(x) : x) :
    runtime.Nothing // a catch-all js to leaflisp conversion including undefined types
    //plString("undefined")
    ))));
};

const isPLNumberTypeInstance = (_) => {
    return (_ instanceof PLFractionNumber || _ instanceof PLNumber);
};

//const parseLEAFlispObjToJson = (x) => {
//    const inputtype = typeof(x);
//    return (
//        (inputtype !== 'object' ? 
//            x : // base js type
//            (!(x instanceof PLBase) ? 
//                (x) : // a non-PLBase js object type
//                ((x instanceof PLHashMap) ?
//                    (
//                        //parseLEAFlispObjToJson(x.toJSON())
//                        x.toJSON()
//                    ) :
//                    (
//                        isPLNumberTypeInstance(x) ? 
//                        (x.toJS()) : 
//                        ()
//                    )
//                )
//            )
//        )
//    );
//}

const leafLISPStdLib = ({_probefunc, _tracefunc}=args) => {return {
    'return': (val) => {
        return val 
    },
    'outport': (val) => {return val},
    'undefined': runtime.Nothing,
    'nil': runtime.Nothing,
    'null': runtime.Nothing,
    'trace': (trace) => {
        const _trace = trace.toJSON();
        try {
            _tracefunc && _tracefunc(_trace);
            //console.error("debugging trace, trace temporarily disabled")
        } catch (error) {
            console.log(error);
            //return plNumber(-1);
            return trace;
        } 
        //return plNumber(0);
        return trace;
    },
    'probe': (trace) => {
        const _trace = trace.toJSON();
        try {
            _probefunc && _probefunc(_trace);
        } catch (error) {
            console.log(error);
            return trace;
        } 
        return trace;
    },
    'format': (_string, _data) => {
        const jsdata = _data.toJSON();
        const jsfstr = _string.toJS();

        const var_re = /\$\{([^{}]*)\}/gm;
        const formatted_str = jsfstr.replace(var_re, (m0,m1)=>{
          const m1_trimmed = m1.replace(/\s*/g,""); // remove whitespaces
          return `\${this.${m1_trimmed}}`; // add this. to the var name
        });

        // Wrap in proxy to stringify objects
        const fillTemplate = function(templateString, templateVars) {
            const proxy = new Proxy(templateVars, {
              get: (target, prop) => {
                const value = target[prop];
                if (typeof value === "object" && value !== null) {
                  // Stringify and escape all double quotes
                  return JSON.stringify(value).replace(/"/g, '\"');
                }
                return value;
              }
            });
            return new Function("return `"+templateString +"`;").call(proxy);
        }

        return plString(fillTemplate(formatted_str.replace(/"/g, '\"'), jsdata)); 
    },
    'isnil': (_nil) => {
        const _n = _nil; //.toJSON();
        return plBool(_nil == "null" || _n.constructor == runtime.Nothing.constructor)
    },
    'isbottle': (_bottle) => {
        const _b = _bottle.toJSON();
        return plBool(isBottle(_b));
    },
    'islist': (_list) => {
        const _l = _list.toJSON();
        return plBool(Array.isArray(_l));
    },
    'flatten': (_list) => {
        const _l = _list.toJSON();
        return parseJsonToLEAFlispObj(_l.flat().filter(_=>_), false);
    },
    'join': (_list, _joinch) => {
        const _l = _list.toJSON();
        return plString(_l.join(_joinch)); 
    },
    'bottle': (bkey, bdata) => {
        if (bkey.constructor !== PLString)
            throw new StdRuntimeError(`Expected '${PLString.kind ?? PLString.name}', but got '${getObjectName(bkey.value)}'.`);
        const _bkey = bkey.toJSON();
        const _bdata = bdata.toJSON();

        const bottled_data = (typeof _bdata === "object" && !Array.isArray(_bdata) && "_content" in _bdata && "_label" in _bdata) ? {_bname: _bkey, _content: _bdata._content, _label: _bdata._label} : {_bname: _bkey, _content: _bdata, _label: {}};
        return parseJsonToLEAFlispObj(bottled_data);
    },
    'getbottle': (bottlelist, bkey) => {
        if (bottlelist.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(bottlelist.value)}'.`);
        //const _bottlelist = bottlelist.value.map(x => x.value);
        //const _thebottle = _bottlelist.filter(_bottle => (_bottle?.get("_bname"))?._value === bkey._value);
        const _thebottle = bottlelist.value.filter(_b=>_b.value.get("_bname").value === bkey.value);
        if (_thebottle.length === 1)
            return _thebottle[0];
        else if (_thebottle.length > 1)
            return _thebottle;
        else
            return undefined;
    },
    'unbottle': (bottle) => {
        if (bottle.constructor !== PLHashMap)
            throw new StdRuntimeError(`Expected '${PLHashMap.kind ?? PLHashMap.name}', but got '${getObjectName(bottle.value)}'.`);
        return bottle.value.get("_content");
    },
    'regexp': (targetstr, expstr) => {
        const flag_re = /\/(.*)\/(.*)/;
        const restr = expstr.toJSON().match(flag_re);
        const re = new RegExp(restr[1], restr[2]);
        const jsoned_targetstr = targetstr.toJSON();
        const datatype = typeof(jsoned_targetstr);
        const re_match = (datatype === "string" ? jsoned_targetstr.match(re): []);
        //return re_match;
        const parsed_result = parseJsonToLEAFlispObj(re_match ? re_match : []);
        //console.log(parsed_result);
        return parsed_result;
    },
    'min': (numlist) => {
        if (numlist.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(numlist.value)}'.`);
        const _numlist = numlist.value.map(x => x.value);
        const min_x = Math.min(..._numlist);
        return plNumber(min_x);
    },
    'max': (numlist) => {
        if (numlist.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(numlist.value)}'.`);
        const _numlist = numlist.value.map(x => x.value);
        const max_x = Math.max(..._numlist);
        return plNumber(max_x);
    },
    'parse': (_str) => {
        //const num_re = /(^(\d*)((e(\d+)){0,1}$|$)|^(\d*)\.(\d*))$/;
        const target_str = _str.toJSON();
        //const re_match = (typeof target_str === "string") ? target_str.match(num_re) : undefined;
        //if (re_match) {
        //    if (re_match.length === 3) // integer
        //        return plNumber(parseInt(target_str));
        //    else if (re_match.length === 4) // float
        //        return plFractionNumber(parseFloat(target_str));
        //    else if (re_match.length === 5) // scientific notation
        //        return plFractionNumber()
        //}
        assertNumeric(target_str);
        let parsednum;
        if (isScientific(target_str))
            parsednum = parseScientificString(target_str);
        else
            parsednum = parseDecimalString(target_str);
        if (parsednum.decimals === 0)
            return plNumber(parsednum.intValue);
        else
            return plNumber(parsednum.intValue, parsednum.decimals)
    },
    'merge-dict': (hashmap1, hashmap2) => {
        if (hashmap1.constructor !== PLHashMap)
            throw new StdRuntimeError(`Expected '${PLHashMap.kind ?? PLHashMap.name}', but got '${getObjectName(hashmap1.value)}'.`);
        if (hashmap2.constructor !== PLHashMap)
            throw new StdRuntimeError(`Expected '${PLHashMap.kind ?? PLHashMap.name}', but got '${getObjectName(hashmap2.value)}'.`);
        const _dict1 = hashmap1.toJSON();
        const _dict2 = hashmap2.toJSON();
        const _merged_dict = {..._dict1, ..._dict2};
        return parseJsonToLEAFlispObj(_merged_dict);
    },
    'make-dict': (keys, values) => {
        if (keys.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(keys.value)}'.`);
        if (values.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(values.value)}'.`);
        const _keys = keys.toJSON();
        const _values = values.toJSON();
        const _new_dict = [...Array(_keys.length).keys()].reduce((acc, idx) => {return {...acc, [_keys[idx]]: _values[idx]}}, {});
        return parseJsonToLEAFlispObj(_new_dict);
    },
    'concat': (list1, list2) => {
        if (list1.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(list1.value)}'.`);
        if (list2.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(list2.value)}'.`);
        console.log(list1, list2);
        return plVector(...list1.value.concat(list2.value));
    },
    'gload': (libstr) => {
        loadAdditionalRuntimeLib(libstr.toJSON(), plisp_instance);
    },
    'uuid4': () => {
        return plString(uuid4());
    },
    'uuid5': (uri) => {
        const uuid_val = uuid5(uri.toString(), uuid5.URL); // uuid deterministically generated based on domain and appid
        //console.log(uuid_val);
        return plString(uuid_val);
    },
    '*': (arg1, arg2) => {
        return plNumber(arg1*arg2);
    },
    '/': (arg1, arg2) => {
        return plNumber(arg1/arg2);
    },
    '+': (arg1, arg2) => {
        //console.log(arg1);
      return (isNaN(arg1.value) || isNaN(arg2.value)) ? arg1.add(arg2) : plNumber(arg1.value + arg2.value);
        //const a_result = arg1+arg2;
        //return isNaN(a_result) ? plString(a_result) : plNumber(a_result);
    },
    '-': (arg1, arg2) => {
        return plNumber(arg1-arg2);
    },
    'tofixed': (arg1, arg2) => {
        return plString(Number(arg1).toFixed(arg2));
        //const target_str = arg1.toJSON();
        //const target_str = Number(arg1).toFixed(arg2);
        //assertNumeric(target_str);
        //let parsednum;
        //if (isScientific(target_str))
        //    parsednum = parseScientificString(target_str);
        //else
        //    parsednum = parseDecimalString(target_str);
        //if (parsednum.decimals === 0)
        //    return plNumber(parsednum.intValue);
        //else
        //    return plNumber(parsednum.intValue, parsednum.decimals)
    }
}};
const leafLISPImageLib = {
    'resize': (_b64img, _sizes, _keepratio) => {
        //const num_re = /(^(\d*)((e(\d+)){0,1}$|$)|^(\d*)\.(\d*))$/;
        //const target_str = _str.toJSON();
        ////const re_match = (typeof target_str === "string") ? target_str.match(num_re) : undefined;
        ////if (re_match) {
        ////    if (re_match.length === 3) // integer
        ////        return plNumber(parseInt(target_str));
        ////    else if (re_match.length === 4) // float
        ////        return plFractionNumber(parseFloat(target_str));
        ////    else if (re_match.length === 5) // scientific notation
        ////        return plFractionNumber()
        ////}
        //assertNumeric(target_str);
        //let parsednum;
        //if (isScientific(target_str))
        //    parsednum = parseScientificString(target_str);
        //else
        //    parsednum = parseDecimalString(target_str);
        //if (parsednum.decimals === 0)
        //    return plNumber(parsednum.intValue);
        //else
        //    return plNumber(parsednum.intValue, parsednum.decimals)
    },
}

// a function to initialize a globally-scoped runtimeLEAFlisp instance,
// App.js runs this and handles the global instance reference as soon as the master etaTree is initialized.
const init_gRuntimeLEAFlisp = (_etaTree, accio_bottles) => {
    const cheatTextPromise = async () => {
        const lambdactrl = {
            gos: {
                standardSpellbook: {},
                curatedSpellbook: {},
                stdlambdalut: {},
                curatedlambdalut: {},
                leafio: _etaTree.leafio,
                etaTree: _etaTree, // a bit redundant way of passing down information, refactor to be reduced to pass down only what's needed down the road
            }, 
            user: {
                spellbook: _etaTree.graphcomponents.spelldefs,
                lambdalut: _etaTree.leafgraph.edges.lambda.sourcelut,
            }
        };
        const leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leaflisp-help', graphaddrstr: 'breezyforest/leaflisp-help'};
        const getLEAFGraph = _leafgraph.lambda(lambdactrl)({refnode: "leaflisp_runtime", refnodedata: {leaf: {logic: {args: leafgraph_args}}}, nodelambda: [], contextuallambda: []});
        const leafgraph = await getLEAFGraph; //.then((response) => {}) // async call to get leafgraph
        
        const cheatsheet = leafgraph?.cheatsheet ? await executeLEAFLogic(leafgraph.cheatsheet._default, accio_bottles.data, {}) : [];
        //return plString(cheatsheet);
        //console.log(cheatsheet);
        return cheatsheet;
    };
    const getObjectName = (obj) => obj?.constructor?.kind ?? obj?.constructor?.name ?? 'unknown';
    const plNumListFn1 = (jsfn) => (numlist) => {
        //typeCheck(PLVector, numlist);
        if (numlist.constructor !== PLVector)
            throw new StdRuntimeError(`Expected '${PLVector.kind ?? PLVector.name}', but got '${getObjectName(numlist.value)}'.`);
        try {
          return plNumber(jsfn(numlist.toJSON()))
        } catch (error) {
          throw new StdRuntimeError(`Invalid argument for ${jsfn.name}: ${numlist.value}`)
        }
    }

    const helptext = {}; 
    cheatTextPromise().then(
        _helpdict => {helptext.cheatsheet = _helpdict;}
    );
    const leafLISPREPLStdLib = {
        'cheat': () => {
            const _helptext = {};
            _helptext["help"] = "-LEAFlisp help text----------------------------------------------\n--------------------------------------------------------------------------\n";
            Object.keys(helptext.cheatsheet).map(_cmd => {
                _helptext[_cmd] = (_cmd in helptext.cheatsheet) ?  helptext.cheatsheet[_cmd] :
                    `LEAFlisp error: no help is available for an unknown command ${_cmd}.`;
            });
            return parseJsonToLEAFlispObj(_helptext);
            //return parseJsonToLEAFlispObj(helptext.cheatsheet.cheatsheet);
        },
        'help': (commands) => {
            const _helptext = {};
            const _commands = commands.toJSON();
            
            //const testhashmap = plHashMap(plString(":hello"), plString("world"));
            if (_commands.length > 0) {
                _helptext["help"] = "-LEAFlisp help text----------------------------------------------\n--------------------------------------------------------------------------\n";
                _commands.map(_cmd => {
                    _helptext[_cmd] = (_cmd in helptext.cheatsheet) ?  helptext.cheatsheet[_cmd] :
                        `LEAFlisp error: no help is available for an unknown command ${_cmd}.`;
                });
                return parseJsonToLEAFlispObj(_helptext);
            }
            else {
                //return parseJsonToLEAFlispObj(helptext.cheatsheet.cheatsheet);
                _helptext["help"] = "-LEAFlisp help text----------------------------------------------\n--------------------------------------------------------------------------\n";
                Object.keys(helptext.cheatsheet).map(_cmd => {
                    _helptext[_cmd] = (_cmd in helptext.cheatsheet) ?  helptext.cheatsheet[_cmd] :
                        `LEAFlisp error: no help is available for an unknown command ${_cmd}.`;
                });
                return parseJsonToLEAFlispObj(_helptext);
            }
            //return plString(_leafLISPHelpText);
        },
    };
    const plisp_instance = new PocketLisp(
        {
            globals: {
                ...runtime,
                ...leafLISPStdLib({}),
                ...leafLISPREPLStdLib,
                //stdout: value => {lispstdout = value;},
                //'help': () => {
                //    return plString(_leafLISPHelpText);
                //},
            },
            utils
        },
        literals
    );
    return plisp_instance;
};

const _leafLISPAddOnLibraryList = ["linear-algebra"];
const _leafLISPAddOnLibraries = {
    "linear-algebra": {
        "lp": (arg_a, arg_b) => {
            //console.log(arg_a, arg_b);
            return plHashMap(plString("a"), arg_a, plString("b"), arg_b);
        }
    }
}
const loadAdditionalRuntimeLib = (_libstr, _gRuntimeLEAFlisp) => {
    if (_leafLISPAddOnLibraryList.includes(_libstr)) {
        Object.entries(_leafLISPAddOnLibraries[_libstr]).map(([namekey, libfunc]) => {
            _gRuntimeLEAFlisp.interpreter.globals.define(namekey, simpleFunction(libfunc)); // as per interpreter.ts under pocket-lisp/src
        });
    }
}

const runLEAFlispcode = (_lispcode, refnode, _runtimeLEAFlisp, _leafaddress, _preamble_len=0) => {
    try {
        if (refnode?.slice(0,4) === "1f5b")
            console.log("start debugging");
        const result = _runtimeLEAFlisp.insituexecute(_lispcode);
        //return result;
        //if (result instanceof PLHashMap || result instanceof PLVector || result instanceof PLBool ||
        //    result instanceof PLFractionNumber || result instanceof PLNumber || result instanceof PLString) 
        try {
        //    return (result instanceof PLHashMap) ? result.toJSON() : result.toJS();
            const jsonized_result = result.toJSON();
            //lisp_assert(jsonized_result == undefined);
            return [0, jsonized_result];
        }
        catch (e)
        {
            //lisp_assert(result != undefined);
            //return [0, "LEAFlisp error: result undefined"];
            return [0, null]; // null is JSON compliant, undefined isn't
        }
    }
    catch (e) {
        let errlist = [];
        if ('errors' in e) {
            for (let err of e.errors) {
                const msg = e.type === 'Parser' ? `line: ${err.line - _preamble_len} - ${err.message}` : `line: ${err.position?.line - _preamble_len} - ${err.message}`;
                const leaflisp_errmsg = `LEAFlisp error: {refnode: ${refnode}}: ${msg}`;
                console.error(leaflisp_errmsg);

                errlist.push(
                    doBottle("error",
                    {
                        address: _leafaddress, 
                        refnode: refnode,
                        message: leaflisp_errmsg
                    })
                );
            }
        }
        else {
            errlist.push(`LEAFlisp error: ${refnode}: unidentified execution failure. please check your leaflisp code for anomalies. exception: ${e.message}`)
        }
        return [-1, errlist];
    }
};

const hijackTestURL = (_lispcode) => {
    const lispcode_url_hijacker_re_global = /((https?):\/\/(www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/g;
    const lispcode_url_hijacker_re = /(.*)(https?):\/\/(www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)(.*)/;

    const re_match = _lispcode.match(lispcode_url_hijacker_re_global)
    //console.log(re_match);
    //[
    //  '(+ "https://www.leafgon.com/auth/public/self-service/login/flows?id=" inport)',
    //  '(+ "',
    //  'https',
    //  'www.',
    //  'leafgon.com',
    //  '/auth/public/self-service/login/flows?id=',
    //  '" inport)',
    //  index: 0,
    //  input: '(+ "https://www.leafgon.com/auth/public/self-service/login/flows?id=" inport)',
    //  groups: undefined
    //]

    const matchKratosURLPath = (path) => {
        const kratos_re = /^\/auth\/public\/(.*)$/;
        const kratos_match = path.match(kratos_re);
        if (kratos_match)
            return ("/" + kratos_match[1]);
        else
            return undefined;
    };

    const _processed_lispcode = re_match ? re_match.reduce((acc, a_url) =>
    {
        // now re on each url found
        const url_match = a_url.match(lispcode_url_hijacker_re);
        let hijacked_url = a_url;
        if (url_match  && url_match[4] === "leafgon.com") {
        //console.log(url_match);
        //const kratos_path = matchKratosURLPath(url_match[5]);
        //hijacked_url = kratos_path ?
        //    (url_match[1] + "http://localhost:4433" + kratos_path + url_match[6]) :
        //    (url_match[1] + "http://localhost:3880" + url_match[5] + url_match[6]);
        hijacked_url = (url_match[1] + "http://localhost" + url_match[5] + url_match[6]);

        //console.log(hijacked_url);
        }

        return acc.replaceAll(a_url, hijacked_url);
    },
    _lispcode
    ) : _lispcode;

    return _processed_lispcode;
};

/*
 * _leaflisp() is a runtime function for the LEAFgraph node of logic type 'leaflisp'
 * @lispexpression: a LEAFlisp expression in a string
 * @lambdaFunc: currently, the lambda function connected to the current node is always expected to be null 
 * as the node-level lambdaFunc is not permitted for this type of node yet.
 * @graphContextual: is NOT to be used for this node type either, hence is always expected to be null. 
 */
//const _leaflisp = ({lispexpression=''}={}, lambdaFunc, graphContextual) => {}
let is_interactive_lut = {};
const _leaflisp = {
    dataflow: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => { //(inputargs) => {}
        //const {
        //    lambdactrl, //: {gos: {subsDirectory}, user: {lispexpression=''}}, 
        //    lambdadata  //: {lambdaFunc=x=>x, graphContextual}
        //}=inputargs;
        // spark_dev_note: The game plan down the road, possibly part of breezyforest, is to add support 
        // for lambdaFunc in LEAFlisp expressions. Need to work on potential usage scenarios first. 

        //const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
        //const runtimeLEAFlisp = processLEAFlisp(refnodedata.leaf.logic.args.lispexpression);
        let lispstdout;
        let runtimeLEAFlisp;
        let spawnVIMEditor = undefined;

        const probeGraph = _.memoize(async () => {
            const graphaddrstr = "breezyforest/probe";
            const _probegraph = await parseAddressableGraph(graphaddrstr, lambdactrl.gos.etaTree, "leaflisp"); 

            return _probegraph;
        });
        const cur_address = lambdactrl.gos.etaTree.domain+"/"+lambdactrl.gos.etaTree.appid;
        const popupDebuggerTraceWindow = (_tracedata, _refnode=refnode, tracemax=0) => {
            probeGraph().then((_probegraph) => {
                if (Object.entries(_probegraph).length > 0) {
                    if (tracemax > 0 && debuggerGlobal.trace.length === tracemax) {
                        debuggerGlobal.trace.shift();
                    }
                    debuggerGlobal.trace.push({
                        timestamp: Date.now(), 
                        address: cur_address,
                        refnode: refnode,
                        trace: _tracedata
                    });
                    executeLEAFLogic(_probegraph.probe._default, debuggerGlobal.trace, {}, _refnode).then((_ret) => {
                        //debuggerGlobal.trace = doUnbottle("screenio", _ret);
                        console.log("LEAFlisp debug: a debugger probe launched with traces: ", _ret);
                    });
                } else {
                    // spark_dev_note: 4/July/2023
                    // #todo
                    // consolidate all LEAF error messages to a single location from which to refer to a specific message as follows.
                    console.error("LEAFlisp error: a debugger probe graph unavailable or not parsed successfully, error traces would not be shown: ");
                }
            });
        };

        const popupDebuggerProbeWindow = (_tracedata, _refnode=refnode, probemax=1) => {
            probeGraph().then((_probegraph) => {
                if (Object.entries(_probegraph).length > 0) {
                    if (probemax > 0 && debuggerGlobal.probe.length === probemax) {
                        debuggerGlobal.probe.shift();
                    }
                    debuggerGlobal.probe.push({
                        timestamp: Date.now(), 
                        address: cur_address,
                        refnode: refnode,
                        trace: _tracedata
                    });
                    executeLEAFLogic(_probegraph.probe._default, debuggerGlobal.probe, {}, _refnode).then((_ret) => {
                        //debuggerGlobal.trace = doUnbottle("screenio", _ret);
                        console.log("LEAFlisp debug: a debugger probe launched with traces: ", _ret);
                    });
                } else {
                    // spark_dev_note: 4/July/2023
                    // #todo
                    // consolidate all LEAF error messages to a single location from which to refer to a specific message as follows.
                    console.error("LEAFlisp error: a debugger probe graph unavailable or not parsed successfully, error traces would not be shown: ");
                }
            });
        };


        const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
        //lambdactrl.etaTree.leafnodemethods[refnode].setLispCode(lispcode);
        // spark_dev_note: it is "inevitable" to use hard-coded leafgon.com uri as part of
        // building leaflisp breezyforest system ui constructs such as login, registration, etc
        // and this interferes with using localhost uris during testing.
        // the following snippet of code does search and replace during testing.
        // example '(+ "https://www.leafgon.com/auth/public/self-service/login/flows?id=" inport)'
        // the url re as per https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
        //const lispcode = hijackTestURL(refnodedata.leaf.logic.args.lispexpression);
        is_interactive_lut[refnode] = ("interactive" in reduced_lambda_obj ? true : false); 
        const is_interactive = is_interactive_lut[refnode];
        
        const lispcode = (leafgon_env_type === "development") ? hijackTestURL(refnodedata.leaf.logic.args.lispexpression) : refnodedata.leaf.logic.args.lispexpression;

        const convertlisptojs = (obj) => {
            if (obj)
                return (obj instanceof PLHashMap) ? obj.toJSON() : obj.toJS();
        };

        if ("global" in reduced_lambda_obj) {
            runtimeLEAFlisp = lambdactrl.gos.etaTree.gRuntimeLEAFlisp;
        }
        else { // runtime env is local in scope (i.e. an isolated env instance per leaflisp node)
            runtimeLEAFlisp = new PocketLisp(
                {
                    globals: {
                        ...runtime,
                        //stdout: value => {lispstdout = value;},
                        ...leafLISPStdLib({_probefunc: popupDebuggerProbeWindow, _tracefunc: popupDebuggerTraceWindow}),
                    },
                    utils
                },
                literals
            );
        }

        const is_rewritable = ("rewrite" in reduced_lambda_obj);
        const is_bottlemode = ("bottle" in reduced_lambda_obj); // bottle mode pre-empts rewrite mode

        if (refnode.slice(0,4) == "59fe") {
            console.log("start debugging.");
        } 

        const node_context = {
            codebase: "leaflisp.js",
            refnode, 
            leafnode: lambdactrl.gos.etaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data,
            leafaddress: lambdactrl.gos.etaTree.domain + "/" + lambdactrl.gos.etaTree.appid
        };

        const leafnodeioInput$ = new Subject();
        if (is_interactive) {
            // register the dataflow message handle in the etaTree under its elementio lut
            lambdactrl.gos.etaTree.leafio.elementioLUT[refnode] = leafnodeioInput$;

            // retrieve and parse breezyforest/leaflisp for interactive invocation of the "vim" spell
            const _leafgraph_args = {graphuuid: '', domain: 'breezyforest', appid: 'leaflisp', graphaddrstr: 'breezyforest/leaflisp'};
            const getLEAFLispInteractiveGraph = _leafgraph.lambda(lambdactrl)({refnode: "leaflisp_runtime_interactive", refnodedata: {leaf: {logic: {args: _leafgraph_args}}}, nodelambda: [], contextuallambda: []});
            const _leaflispgraph = await getLEAFLispInteractiveGraph; //.then((response) => {}) // async call to get leafgraph

            // calling the following function will invoke the vim spell defined in breezyforest/leaflisp
            // the effect of which is to spawn a vim editor window
            spawnVIMEditor = () => {
                const _inputbottle = doBottle(
                    "dataevent",
                    {
                        //_type: "touchio",
                        //_command: "i",
                        //_targetid: e.target.id,
                        _refnode: refnode,
                        _provenance: {domain: lambdactrl.gos.etaTree.domain, appid: lambdactrl.gos.etaTree.appid, refnodedata: node_context.leafnode, codebase: "leaflisp.js"}
                    },
                    {}
                );
                executeLEAFLogic(_leaflispgraph.vim._default, _inputbottle, {});
            };
        }

        return (input$objArr, controlflow$obj) => {
            if (refnode.slice(0,4) == "59fe") {
                console.log("start debugging.");
            } 
            const loopidx = controlflow$obj?._config?.loopidx;
            const clubrefnode = controlflow$obj?._config?.clubrefnode;

            const preprocessfunc = (_data_in) => {
                const _rt_cache = {...node_context};
                //const _data_out = doUnbottle(undefined, _data_in); // unbottle all bottles
                //flowinterface.data_in.next(_data_in);
                if (refnode === '5e6f52db-0af5-4e04-84ce-3e9af504a3d3')
                    console.log("start debugging");
                const _data_out = _data_in; // do nothing
                return _data_out;
            };

            const doleaflisp = (node_input, _lispcode=lispcode) => { // node_input is expected to be an array, the calling function, parseLEAFNode (leaf.js) ensures this
                //const lispinput = parseJsonToLEAFlisp(JSON.parse(node_input));
                //const lispinput = parseJsonToLEAFlisp(typeof node_input === 'string' ? JSON.parse(node_input) : node_input);
                if (refnode.slice(0,4) == "6212") {
                    console.log("start debugging.");
                }
                // spark_dev_note: 19/Jun/2023
                // #databus
                //const _payload = node_input !== undefined ? exitDataBus({_bus: node_input}) : undefined;
                //const _payload = node_input !== undefined ? doUnbottle("*", node_input) : undefined;
                const _payload = node_input;

                // spark_dev_note:
                // #bugreport: (22/Mar/2023) #mar2023bug1
                // a bug was found when amnesia memoryio or initial blank memory referring
                // returns undefined. undefined gets translated to 'nil' in leaflisp
                // which causes the gnav element to crash.
                // this entirely prevents the leaf editor from displaying the code to apply 
                // fixes at the leaflisp level.
                // a temporary fix is to convert all undefined payloads into []
                // once leaflisp code changes is applied, make sure to revert back undefined:nil conversion
                //
                //const lispinput = parseJsonToLEAFlisp(_payload);
                const lispinput = parseJsonToLEAFlisp((_payload == undefined) ? [] : _payload);
                //const wiredlispcode = `(def stdin ${lispinput})${lispcode}`;
                //console.log(controlflow$obj);
                let wiredlispcode = `(def inport ${lispinput})`;
                if (loopidx >= 0)
                    wiredlispcode += `(def loopyindex ${loopidx})`;
                if (clubrefnode)
                    wiredlispcode += `(def clubref "${clubrefnode}")`;
                const preamble_len = wiredlispcode.split(/\r\n|\r|\n/).length; // count the length of lines in string
                wiredlispcode += `${_lispcode}`;

                try {
                    const [errcode, lispresult] = runLEAFlispcode(wiredlispcode, refnode, runtimeLEAFlisp, node_context.leafaddress, preamble_len);

                    if (errcode === -1) {
                        // spark_dev_note: 4/July/2023
                        // add a function to popup a probe/inspection window here 
                        console.log("LEAFlisp execution:", lispresult[0]);
                        popupDebuggerProbeWindow(lispresult, refnode);
                    }
                    return lispresult;
                } catch (error) {
                    throw new StdRuntimeError(`LEAFlisp Error: ${error}`);
                }
            };

            const _nodeflowfunc = (_input$objArr, _controlflow$obj) => {
                //console.log("start debugging");
                const _outflow_data$ = new Subject(); //new BehaviorSubject(raceConditionError);
    
                let traffic_semaphore = false;
                let _lispcode = lispcode;
                const _outflow_ctrl$ = (
                  is_rewritable ? 
                    _controlflow$obj._stream.pipe(
                        map(_ctrl_in => {
                            return _ctrl_in;
                        }),
                        withLatestFrom(..._input$objArr.map(_=>_._stream)),
                        map(_combined_in => {
                            if (globalThis.DEBUG) {

                            }
                            //const _next_data = _combined_in.slice(1).filter(_data=>_data!==undefined);
                            let _next_data = _combined_in[1];

                            //const _next_data = _combined_in.slice(1).map(_unitdata=>{return exitDataBus({_bus:_unitdata});}).filter(_data=>_data!==undefined);
                            //const _flat_data = [...(new Set(_next_data.flat()))]; // flatten and remove duplicates
                            if (isBottle(_next_data) && _next_data._bname === "rewrite") {
                                const _rewrite_data = doUnbottle("*", _next_data);
                                // now rewrite
                                // now do the saving up in the lake
                                const node_data = {
                                    ...refnodedata
                                };
                                //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                                //console.log(lambdactrl);

                                // keypath = ['lispexpression'] for leaflisp

                                const lispinput = parseJsonToLEAFlisp((_rewrite_data == undefined) ? [] : _rewrite_data);
                                node_data.leaf.logic.args.lispexpression = lispinput;
                                refnodedata.leaf.logic.args.lispexpression = lispinput;
                                _lispcode = (leafgon_env_type === "development") ? hijackTestURL(lispinput) : lispinput;
                                //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current); 
                                //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                                lambdactrl.gos.etaTree.leaflakeio.qm_methods.updateNode({variables: {uuid: refnode, data: encodeUnicode(JSON.stringify(node_data))}});

                                _next_data = undefined;
                            }

                            if (_next_data != undefined) {
                                traffic_semaphore = true;
                                const dolispresult = doleaflisp(_next_data);
                                _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel

                                //if (_next_data.length > 1) {  
                                //    const dolispresult = doleaflisp(_next_data, _lispcode);
                                //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //}
                                //else if (_next_data.length === 1) { 
                                //    const dolispresult = doleaflisp(_next_data[0], _lispcode);
                                //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //}
                                //else { // out only, no input data indicates the intention of memory retrieval of a constant
                                //    const dolispresult = doleaflisp(undefined, _lispcode);
                                //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //}
                                return _combined_in[0]; // only pass the ctrl data in the flow;
                            }

                            return undefined;
                        }),
                        filter(_=>_!==undefined),
                        share()
                    ) :
                    (
                      is_bottlemode ? 
                        _controlflow$obj._stream.pipe(
                          map(_ctrl_in => {
                              return _ctrl_in;
                          }),
                          withLatestFrom(..._input$objArr.map(_=>_._stream)),
                          map(_combined_in => {
                              if (globalThis.DEBUG) {

                              }
                              //const _next_data = _combined_in.slice(1).filter(_data=>_data!==undefined);
                              const _next_data = _combined_in[1];

                              if (isBottle(_next_data) && _next_data._bname === "codebottle") {
                                  const _codebottle = doUnbottle("*", _next_data);
                                //const _next_data = _combined_in.slice(1).map(_unitdata=>{return exitDataBus({_bus:_unitdata});}).filter(_data=>_data!==undefined);
                                //const _flat_data = [...(new Set([_next_data].flat()))]; // flatten and remove duplicates


                                traffic_semaphore = true;
                                const _bottle_data = _codebottle["data"];
                                const _bottle_code = _codebottle["code"];
                                const dolispresult = doleaflisp(_bottle_data, _bottle_code);
                                _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //if (_next_data.length > 1) {  
                                //    const dolispresult = doleaflisp(_next_data);
                                //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //}
                                //else if (_next_data.length === 1) { 
                                //    const dolispresult = doleaflisp(_next_data[0]);
                                //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //}
                                //else { // out only, no input data indicates the intention of memory retrieval of a constant
                                //    const dolispresult = doleaflisp(undefined);
                                //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                                //}
                                return _combined_in[0]; // only pass the ctrl data in the flow;
                              }
                              return undefined;
                          }),
                          filter(_=>_!==undefined),
                          share()
                        ) :
                        _controlflow$obj._stream.pipe(
                          map(_ctrl_in => {
                              return _ctrl_in;
                          }),
                          withLatestFrom(..._input$objArr.map(_=>_._stream)),
                          map(_combined_in => {
                              if (globalThis.DEBUG) {

                              }
                              //const _next_data = _combined_in.slice(1).filter(_data=>_data!==undefined);
                              const _next_data = _combined_in[1];

                              //const _next_data = _combined_in.slice(1).map(_unitdata=>{return exitDataBus({_bus:_unitdata});}).filter(_data=>_data!==undefined);
                              //const _flat_data = [...(new Set([_next_data].flat()))]; // flatten and remove duplicates


                              if (refnode === "f71edebb-85b4-452b-b39a-99ecf3c50ca3" || refnode === "1f5b9eaa-cabd-4059-9574-3f0bda95a2ad")
                                  console.log("start debugging");
                              traffic_semaphore = true;
                              const dolispresult = doleaflisp(_next_data);
                              _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                              //if (_next_data.length > 1) {  
                              //    const dolispresult = doleaflisp(_next_data);
                              //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                              //}
                              //else if (_next_data.length === 1) { 
                              //    const dolispresult = doleaflisp(_next_data[0]);
                              //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                              //}
                              //else { // out only, no input data indicates the intention of memory retrieval of a constant
                              //    const dolispresult = doleaflisp(undefined);
                              //    _outflow_data$.next(dolispresult); // publish the next available post-processed data via the data flow subject channel
                              //}
                              return _combined_in[0]; // only pass the ctrl data in the flow;
                          }),
                          share()
                        )
                    )
                );
                return {_stream: _outflow_data$.pipe(
                    filter(_data_out=>traffic_semaphore),
                    map(_data_out=>{
                        console.log(_data_out);
                        return _data_out;
                    }),
                    share()
                ), _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }

            const _nodeflowfunc_interactive = (_input$objArr, _controlflow$obj) => {
                //console.log("start debugging");
                const _outflow_data$ = new Subject(); //new BehaviorSubject(raceConditionError);
    
                let traffic_semaphore = false;
                let _lispcode = lispcode;
                const _outflow_ctrl$ = _controlflow$obj._stream.pipe(
                    map(_ctrl_in => {
                        if (spawnVIMEditor)
                            spawnVIMEditor();
                        return _ctrl_in;
                    }),
                    withLatestFrom(..._input$objArr.map(_=>_._stream)),
                    switchMap(_combined_in => {
                        const relay_ctrl$ = new BehaviorSubject(_combined_in[0]);
                        //const relay_data$ = new BehaviorSubject(_combined_in[1]);
                        return combineLatest(relay_ctrl$, leafnodeioInput$);
                    }),
                    map(_combined_in => {
                        if (globalThis.DEBUG) {

                        }
                        const _next_data = _combined_in[1];

                        traffic_semaphore = true;

                        _outflow_data$.next(_next_data); // publish the next available post-processed data via the data flow subject channel
                        return _combined_in[0]; // only pass the ctrl data in the flow;
                    }),
                    share()
                );
                return {_stream: _outflow_data$.pipe(
                    filter(_data_out=>traffic_semaphore),
                    map(_data_out=>{
                        console.log(_data_out);
                        return _data_out;
                    }),
                    share()
                ), _control: {..._controlflow$obj, _stream: _outflow_ctrl$}};
            }

            if (refnode === "a3f0a480-0054-40f3-888c-8910c0230900")
                console.log("start debugging")
            // spark_dev_note: 12/July/2023
            // #sync #async 
            // leaf nodes, by default, wait for all incoming flows to provide input data
            // from which output data are produced as per their own functions 
            // combineDataflows rely on rx.js combineLatest() to enforce this synchronous dataflow in multiple input streams
            // However, combineLatest() has a quirky behaviour, rather a feature than a bug, where
            // once multiple input data streams are synchronously combined and returned,
            // any subsequent dataflow multiples would fire each time any singole input data stream provides an instance of input data.
            // this behaviour is in fact not compatible with the intended data stream combining behaviour of LEAF nodes.
            // an alternative implementation strategy will be taken for enforcing this synchronous dataflow.
            // that is to skewer each stream in series. 
            //const consolidated_input$objArr = [{
            //    _stream: chronosDataflow(
            //        controlflow$obj._stream.pipe(map(_peep_in=>{
            //            return _peep_in;
            //        })), 
            //        input$objArr.map(_$obj=>_$obj._stream.pipe(map(_peep_in=>{
            //            return _peep_in;
            //        }))), 
            //        false, CHRONOSTYPE_SYNC, {time: 10000}
            //    )
            //}];
            //const consolidated_input$objArr = [combineDataflows(refnode, input$objArr)];
            const output$obj = driveDataflowByCtrlflow(
                controlflow$obj, input$objArr, undefined, 
                {...node_context, metastep: "invoking leaflisp"}, 
                {leaflogic: is_interactive ? _nodeflowfunc_interactive : _nodeflowfunc, datalogic: {pre: preprocessfunc}}
            );

            return output$obj;

            ////const flowinput$obj = combineDataflows(refnode, flowinput$Arr);
            //const flowinput$obj = combineDataflows(refnode, flowinput$Arr, false, false, false, {provenance: "leaflisp.js", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
            ////const flowinput$ = combineLatest(flowinput$Arr.map(_=>_._stream)).pipe(map(_=>_.flat()));
            ////const flowoutput$ = graphContextual(flowinput$); 
            ////return flowoutput$;
            //const loopidx = controlflow$obj?._config?.loopidx;
            //const clubrefnode = controlflow$obj?._config?.clubrefnode;
            //if (refnode.slice(0,4) == "59fe") {
            //    console.log("start debugging.");
            //}
            //if (flowinput$obj) {
            //    const flowoutput$ = flowinput$obj._stream.pipe(
            //        map(node_input=>{ // node_input is expected to be an array, the calling function, parseLEAFNode (leaf.js) ensures this
            //            //return node_input.map((_input) => {
            //            //    //console.log('input$ ' + JSON.stringify(input$));
            //            //    console.log('a leaflisp processed for node with expression: ' + refnodedata.leaf.logic.args.lispexpression + ', flowinput: ' + node_input);
            //            //    // execute node level logic and optionally set node_output here

            //            //    //return filter(predicate)(flowinput);
            //            //    //return isValuedObj(_input) ? {..._input, _value: runtimeLEAFlisp(_input._value)} : runtimeLEAFlisp(_input);
            //            //    const inputdata = isValuedObj(_input) ? {..._input, _value: _input._value} : _input;
            //            //    const lispinput = parseJsonToLEAFlisp(inputdata);
            //            //    const wiredlispcode = `(def stdin ${lispinput})${lispcode}`;
            //            //    const lispresult = run(wiredlispcode);
            //            //    return lispresult;
            //            //})
            //            //const lispinput = parseJsonToLEAFlisp(JSON.parse(node_input));
            //            //const lispinput = parseJsonToLEAFlisp(typeof node_input === 'string' ? JSON.parse(node_input) : node_input);
            //            if (refnode.slice(0,4) == "6212") {
            //                console.log("start debugging.");
            //            }
            //            const _payload = exitDataBus({_bus: node_input});

            //            // spark_dev_note:
            //            // #bugreport: (22/Mar/2023) #mar2023bug1
            //            // a bug was found when amnesia memoryio or initial blank memory referring
            //            // returns undefined. undefined gets translated to 'nil' in leaflisp
            //            // which causes the gnav element to crash.
            //            // this entirely prevents the leaf editor from displaying the code to apply 
            //            // fixes at the leaflisp level.
            //            // a temporary fix is to convert all undefined payloads into []
            //            // once leaflisp code changes is applied, make sure to revert back undefined:nil conversion
            //            //
            //            //const lispinput = parseJsonToLEAFlisp(_payload);
            //            const lispinput = parseJsonToLEAFlisp((_payload === undefined) ? [] : _payload);
            //            //const wiredlispcode = `(def stdin ${lispinput})${lispcode}`;
            //            console.log(controlflow$obj);
            //            let wiredlispcode = `(def inport ${lispinput})`;
            //            if (loopidx >= 0)
            //                wiredlispcode += `(def loopyindex ${loopidx})`;
            //            if (clubrefnode)
            //                wiredlispcode += `(def clubref "${clubrefnode}")`;
            //            wiredlispcode += `${lispcode}`;
            //            const [errcode, lispresult] = runLEAFlispcode(wiredlispcode, refnode, runtimeLEAFlisp);

            //            if (errcode === -1)
            //                console.log("LEAFlisp execution:", lispresult[0]);
            //            return lispresult;
            //        })
            //    );
            //    return {_stream: flowoutput$, _control: controlflow$obj};
            //}
            //else { // if in-flow is undefined then the lisp expression functions as a constant
            //    // do run lisp expression with zero input
            //    //runtimeLEAFlisp();
            //    // test lisp expression 
            //    //const runtimeLEAFlisp2 = processLEAFlisp("(list 912)");
            //    //const runtimeLEAFlisp2 = processLEAFlisp("(list {:a (quote hello) :description (quote cool beanz) :c 3} {:a (quote world) :description (quote world2) :c 3})");
            //    if (refnode.slice(0,4) == "59fe") {
            //        console.log("start debugging.");
            //    }
            //    const flowoutput$ = controlflow$obj._stream.pipe(
            //        map(ctrl_input => {
            //            if (refnode.slice(0,4) == "59fe") {
            //                console.log("start debugging.");
            //            }
            //            let configuredlispcode = "";
            //            if (loopidx >= 0)
            //                configuredlispcode += `(def loopyindex ${loopidx})`;
            //            if (clubrefnode)
            //                configuredlispcode += `(def clubref "${clubrefnode}")`;
            //            configuredlispcode += `${lispcode}`;
            //            const [errcode, lispresult] = runLEAFlispcode(configuredlispcode, refnode, runtimeLEAFlisp);

            //            if (errcode === -1)
            //                console.log("LEAFlisp execution:", lispresult[0]);
            //            return lispresult; 
            //        })
            //    );

            //    return {_stream: flowoutput$, _control: controlflow$obj};
            //}
        };
    },
    lambda: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {

        //const refnode_logic = runtimeEtaTree.leafgraph.graph.dataflow.getNodeAttributes(refnode).leafnode.data.leaf.logic;
        console.error(`LEAF error: the logical construct built using the ${refnodedata.leaf.logic.type} node `+
            `(${refnode}) called with args (${JSON.stringify(refnodedata.leaf.logic.args)}) cannot `+
            'be defined as a lambda-scoped node.');
        return (input$Arr, controlflow$obj) => {
            //const input$obj = combineDataflows(refnode, input$Arr);
            const input$obj = combineDataflows(refnode, input$Arr, false, false, false, {provenance: "leaflisp.js lambda", refnode, etaTree: lambdactrl.gos.etaTree});// default to merging multiple streams
            return {...input$obj, _control: controlflow$obj};
        }
    },
    methods: (lambdactrl) => async ({refnode, refnodedata, nodelambda, contextuallambda}={}) => {
        const runtimestate = {lispcode: ''};
        const commonmethods = _common_methods(lambdactrl)({refnode, refnodedata, nodelambda, contextuallambda});
        //const reduced_lambda_obj = lambdactrl.gos.etaTree.etaReduceLEAFNode({nodeuuid: refnode, contextuallambda: contextuallambda});
        //const lambdafuncLUTPromise = lambdactrl.gos.etaTree.lookupRuntimeLambdaLUT(graphdomain, graphappid, refnode, nodelambda, contextuallambda);
        //const reduced_lambda_obj = await etaReduceLambdaGraphs({refnode, nodelambda, contextuallambda, etaTree: lambdactrl.gos.etaTree});
        //const is_interactive = ("interactive" in reduced_lambda_obj ? true : false); 
        const is_interactive = is_interactive_lut[refnode];

        if (refnode === "4c73462c-724e-4e77-9a94-596709ab62f0")
            console.log("start debugging");
        return {
            ...commonmethods,
            isinteractive: is_interactive,
            texteditor: {
                setTextSource: (lispcode) => {
                    runtimestate.lispcode = lispcode;

                    // now do the saving up in the lake
                    const node_data = {
                        ...refnodedata
                    };
                    //delete node_data.leaduuid; // must remove any data that are locally added and only consumed by leafeditor
                    //console.log(lambdactrl);

                    // keypath = ['lispexpression'] for leaflisp
                    node_data.leaf.logic.args.lispexpression = lispcode;
                    //setMultiKeyedData(editorconfig.current.keypath, node_data.leaf.logic.args, editortext.current); 
                    //mutateUpdateNode({variables: {uuid: editorconfig.current.node_data.leaduuid, data: encodeUnicode(JSON.stringify(node_data))}});
                    if (!is_interactive)
                        lambdactrl.gos.etaTree.leaflakeio.qm_methods.updateNode({variables: {uuid: refnode, data: encodeUnicode(JSON.stringify(node_data))}});
                },
                getTextSource: () => {
                    //console.log(refnodedata);
                    //return runtimestate.lispcode;
                    return refnodedata.leaf.logic.args.lispexpression
                },
            },
            general: {
                getNodeData: () => {
                    return refnodedata;
                },
                executeLEAFlisp: (lispcode) => {
                    return run(lispcode);
                }
            }
        };
    }
};

export { _leaflisp, parseJsonToLEAFlisp, runLEAFlispcode, init_gRuntimeLEAFlisp };

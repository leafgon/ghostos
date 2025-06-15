const constFn = (fn) => () => fn;
var baseFn = { const: constFn };

class StdRuntimeError extends Error {
    constructor(error) {
        if (typeof error === 'string') {
            super(error);
        }
        else {
            super(error.message);
            this.stack = error.stack;
        }
    }
}

var Ordering;
(function (Ordering) {
    Ordering[Ordering["Less"] = 0] = "Less";
    Ordering[Ordering["Equal"] = 1] = "Equal";
    Ordering[Ordering["Greater"] = 2] = "Greater";
})(Ordering || (Ordering = {}));

class PLBool {
    constructor(_value) {
        this._value = _value;
    }
    static fromJS(value) {
        return new PLBool(value);
    }
    static fromStr(str) {
        switch (str.value) {
            case 'true':
                return new PLBool(true);
            case 'false':
                return new PLBool(false);
            default:
                throw new StdRuntimeError(`Invalid boolean: "${str.value}".`);
        }
    }
    get value() {
        return this._value;
    }
    not() {
        return new PLBool(!this._value);
    }
    and(other) {
        return new PLBool(this._value && other._value);
    }
    or(other) {
        return new PLBool(this._value || other._value);
    }
    equals(other) {
        return new PLBool(this._value === other._value);
    }
    partialCmp(other) {
        if (this.value === other.value) {
            return Ordering.Equal;
        }
        else if (this.value) {
            return Ordering.Greater;
        }
        else {
            return Ordering.Less;
        }
    }
    copy() {
        return new PLBool(this._value);
    }
    toString() {
        return this._value ? 'true' : 'false';
    }
    toJS() {
        return this._value;
    }
    toJSON() {
        return this.toJS();
    }
    debugTypeOf() {
        return plString(PLBool.kind);
    }
}
PLBool.kind = 'Bool';
///

const plBool = (value) => new PLBool(value);
const plBoolConstructor = (value) => {
    typeCheck(PLBool, value);
    return value;
};
const parseBool = (value) => PLBool.fromStr(plString(value));

class PLString {
    constructor(_value) {
        this._value = _value;
    }
    static fromJS(value) {
        return new PLString(value);
    }
    static fromStr(value) {
        return value.copy();
    }
    get value() {
        return this._value;
    }
    add(other) {
        return new PLString(this._value + other.value);
    }
    index(idx) {
        var _a;
        if (Number.isInteger(idx.value)) {
            return new PLString((_a = this._value.charAt(idx.value)) !== null && _a !== void 0 ? _a : '');
        }
        else {
            return new PLString('');
        }
    }
    slice(start, end) {
        return new PLString(this.value.slice(start.value, end.value));
    }
    equals(other) {
        return plBool(this._value === other.value);
    }
    partialCmp(other) {
        const ord = this._value.localeCompare(other.value);
        if (ord < 0)
            return Ordering.Less;
        if (ord === 0)
            return Ordering.Equal;
        return Ordering.Greater;
    }
    copy() {
        return new PLString(this._value);
    }
    toJS() {
        return this._value;
    }
    toJSON() {
        return this.toJS();
    }
    toString() {
        return `${this._value}`;
    }
    debugTypeOf() {
        return new PLString(PLString.kind);
    }
    contains(item) {
        return plBool(this.value.indexOf(item.value) > -1);
    }
    count() {
        return plNumber(this.value.length);
    }
}
PLString.kind = 'String';

const plString = (value = '') => new PLString(value);
const plStringConstructor = (value) => {
    typeCheck(PLString, value);
    return value;
};

class NothingClass {
    constructor() {
        this._value = null;
    }

    static fromStr(str) {
        switch (str.value) {
            case 'undefined':
            case 'nil':
            case 'null':
                return new NothingClass();
            default:
                throw new StdRuntimeError(`Invalid Nothing literal: "${str.value}".`);
        }
    }
    get value() {
        return null;
    }
    equals(other) {
        return plBool(this._value == other._value);
    }
    not() {
        return plBool(true);
    }
    toJS() {
        return null;
    }
    toJSON() {
        return null;
    }
    toString() {
        return 'null'; //`${this._value}`; 
    }
    debugTypeOf() {
        return plString(NothingClass.kind);
    }
}
NothingClass.kind = 'null';
const Nothing = new NothingClass();

const plNothing = (value) => new NothingClass(value);
const plNothingConstructor = (value) => {
    typeCheck(NothingClass, value);
    return value;
};
const parseNothing = (value) => NothingClass.fromStr(plString(value));

// https://stackoverflow.com/questions/596467/how-do-i-convert-a-float-number-to-a-whole-number-in-javascript
const toInt = (a) => ~~a;
const isNothing = (value) => value == undefined || value == null || value == Nothing;

///
const assert = (val, msg) => {
    if (val) {
        throw new StdRuntimeError(msg);
    }
    return true;
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const assertType = (a, b) => assert(a.constructor !== b.constructor, `Type Error! Expected '${getObjectName(a)}', but got '${getObjectName(b)}'`);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const typeCheck = (type, value) => { var _a; return assert(type !== value.constructor, `Expected '${(_a = type.kind) !== null && _a !== void 0 ? _a : type.name}', but got '${getObjectName(value)}'.`); };
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const assertImpl = (instance, method) => assert(!instance[method], `"${method.toString()}" is not defined on ${instance}`);
const assertInteger = (val) => assert(!Number.isInteger(val), `Expected integer number', but got '${val}'.`);
const assertNothing = (value, msg) => {
    assert(isNothing(value), msg);
    return value;
};
const getObjectName = (obj) => { var _a, _b, _c, _d; return (_d = (_b = (_a = obj === null || obj === void 0 ? void 0 : obj.constructor) === null || _a === void 0 ? void 0 : _a.kind) !== null && _b !== void 0 ? _b : (_c = obj === null || obj === void 0 ? void 0 : obj.constructor) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : 'unknown'; };

function plNumber(value, decimals = 0) {
    if (typeof value === 'string') {
        assertNumeric(value);
        const decimalObj = isScientific(value) ? parseScientificString(value) : parseDecimalString(value);
        return plNumber(decimalObj.intValue, decimalObj.decimals);
    }
    else if (Number.isInteger(value) || decimals !== 0) {
        assertInteger(value);
        assertInteger(decimals);
        return new PLNumber(value, decimals);
    }
    else {
        return plNumber(value.toString());
    }
}
function plIntegerConstructor(value) {
    typeCheck(PLNumber, value);
    assert(!value.isInteger().value, 'Expected integer, but got float number.');
    return value;
}
function plFloatConstructor(value) {
    typeCheck(PLNumber, value);
    return value;
}
function assertNumeric(strValue) {
    return assert(strValue === '' || isNaN(Number(strValue)), `Invalid number: "${strValue}"`);
}
function isScientific(strValue) {
    if (strValue.startsWith('0')) {
        return /^0[eE]0$/.test(strValue);
    }
    else {
        return /^[-+]?[1-9](\.\d+)?[eE][-+]?\d+$/.test(strValue);
    }
}
function parseScientificString(strValue) {
    assert(!isScientific(strValue), `Input is not in scientific form: "${strValue}"`);
    const parts = strValue.split(/[eE]/);
    const decimalObject = parseDecimalString(parts[0]);
    const exponential = parseInt(parts[1]);
    if (decimalObject.decimals > exponential) {
        decimalObject.decimals -= exponential;
    }
    else {
        decimalObject.intValue *= Math.pow(10, exponential - decimalObject.decimals);
        decimalObject.decimals = 0;
    }
    return decimalObject;
}
function parseDecimalString(strValue) {
    var _a;
    assertNumeric(strValue);
    const [, fraction] = strValue.split('.');
    const decimals = (_a = fraction === null || fraction === void 0 ? void 0 : fraction.length) !== null && _a !== void 0 ? _a : 0;
    const intValue = parseInt(strValue.replace('.', ''));
    return { intValue, decimals };
}
function simplifyDecimal(intValueOld, decimalsOld) {
    if (intValueOld === 0) {
        return { intValue: 0, decimals: 0 };
    }
    while (intValueOld > Number.MAX_SAFE_INTEGER || (intValueOld % 10 === 0 && decimalsOld > 0)) {
        const str = intValueOld.toString();
        intValueOld = parseInt(str.substring(0, str.length - 1));
        decimalsOld -= 1;
    }
    return { intValue: intValueOld, decimals: decimalsOld };
}
function expandDecimals(d1, d2) {
    const maxDecimal = Math.max(d1.decimals, d2.decimals);
    const intValue1 = d1.intValue * Math.pow(10, maxDecimal - d1.decimals);
    const intValue2 = d2.intValue * Math.pow(10, maxDecimal - d2.decimals);
    return { maxDecimal, intValue1, intValue2 };
}
function getDecimalString(intValue, decimals) {
    return (intValue / Math.pow(10, decimals)).toFixed(decimals);
}
function modulo(dividend, divisor) {
    const num = dividend.value;
    const mod = divisor.value;
    assertInteger(num);
    assertInteger(mod);
    assert(mod < 1, `Modulo (${mod}) must be positive.`);
    assert(num < 0, `Number (${num}) cannot be negative.`);
    const remainder = num % mod;
    return plNumber(remainder);
}
var numFn = {
    modulo,
};

/**
 * Greatest common divisor - Euclid's algorithm
 */
const gcd = (a, b) => {
    return a === b || !a ? b : !b ? a : gcd(b, a % b);
};
const isBelowEpsilon = (x) => {
    return Math.abs(x) <= Number.EPSILON;
};
const floatEq = (a, b) => {
    return isBelowEpsilon(a - b);
};

//import { expandDecimals, getDecimalString, simplifyDecimal, DecimalResult } from './numberFn'
const MAX_DECIMALS = 12;
class PLNumber {
    constructor(intValue, decimals = 0) {
        const decimalObj = simplifyDecimal(intValue, decimals);
        this._decimals = decimalObj.decimals;
        this._intValue = decimalObj.intValue;
    }
    get intValue() {
        return this._intValue;
    }
    get decimals() {
        return this._decimals;
    }
    get value() {
        return this._intValue * Math.pow(10, -this._decimals);
    }
    equals(d) {
        return plBool(floatEq(this.value, d.value));
    }
    negate() {
        return new PLNumber(-this.intValue, this.decimals);
    }
    add(d) {
        const decimalObj = expandDecimals(this, d);
        const totalIntValue = decimalObj.intValue1 + decimalObj.intValue2;
        return new PLNumber(totalIntValue, decimalObj.maxDecimal);
    }
    subtract(d) {
        const decimalObj = expandDecimals(this, d);
        const totalIntValue = decimalObj.intValue1 - decimalObj.intValue2;
        return new PLNumber(totalIntValue, decimalObj.maxDecimal);
    }
    multiply(d) {
        return new PLNumber(this.intValue * d.intValue, this.decimals + d.decimals);
    }
    divide(d) {
        if (d.intValue === 0) {
            throw new StdRuntimeError('Cannot divide by zero!');
        }
        const decimalObj = expandDecimals(this, d);
        const divideIntValue = Math.round((decimalObj.intValue1 / decimalObj.intValue2) * Math.pow(10, MAX_DECIMALS));
        return new PLNumber(divideIntValue, MAX_DECIMALS);
    }
    partialCmp(other) {
        const decimalObj = expandDecimals(this, other);
        if (decimalObj.intValue1 < decimalObj.intValue2)
            return Ordering.Less;
        if (decimalObj.intValue1 > decimalObj.intValue2)
            return Ordering.Greater;
        return Ordering.Equal;
    }
    toJS() {
        return this.intValue / Math.pow(10, this.decimals);
    }
    toString() {
        return `${getDecimalString(this.intValue, this.decimals)}`;
    }
    copy() {
        return new PLNumber(this.intValue, this.decimals);
    }
    debugTypeOf() {
        return plString(PLNumber.kind);
    }
    isInteger() {
        return plBool(this.decimals === 0);
    }
    //public toJSON(): DecimalResult {
    //  return {
    //    intValue: this._intValue,
    //    decimals: this._decimals,
    //  }
    //}
    toJSON() {
        return this.toString(); // spark_dev_note: TBD: check if this would be the best resolution to js <-> leaflisp data conversion
    }
}
PLNumber.kind = 'Number';

const plNumFn1 = (fn) => (x) => {
    typeCheck(PLNumber, x);
    try {
        return plNumber(fn(x.value));
    }
    catch (error) {
        throw new StdRuntimeError(`Invalid argument for ${fn.name}: ${x.value}`);
    }
};
const plNumFn2 = (fn) => (x, y) => {
    typeCheck(PLNumber, x);
    typeCheck(PLNumber, y);
    return plNumber(fn(x.value, y.value));
};
//const plNumListFn1 = (fn: (x: number[]) => number) => (x: PLVector<any>) => {
//  typeCheck(PLVector, x)
//  try {
//    return plNumber(fn(x.toJSON()))
//  } catch (error) {
//    throw new StdRuntimeError(`Invalid argument for ${fn.name}: ${x.value}`)
//  }
//}
/// constants
const E = plNumber(Math.E);
const LN2 = plNumber(Math.LN2);
const LN10 = plNumber(Math.LN10);
const LOG2E = plNumber(Math.LOG2E);
const LOG10E = plNumber(Math.LOG10E);
const PI = plNumber(Math.PI);
const SQRT1_2 = plNumber(Math.SQRT1_2);
const SQRT2 = plNumber(Math.SQRT2);
/// base
const abs = plNumFn1(Math.abs);
const sign = plNumFn1(Math.sign);
const min = plNumFn2((a, b) => Math.min(a, b));
const max = plNumFn2((a, b) => Math.max(a, b));
//export const min = plNumListFn1((x: number[]) => Math.min(...x))
//export const max = plNumListFn1((x: number[]) => Math.max(...x))
const floor = plNumFn1(Math.floor);
const round = plNumFn1(Math.round);
const ceil = plNumFn1(Math.ceil);
const trunc = plNumFn1(Math.trunc);
/// arithmetic
const cbrt = plNumFn1(Math.cbrt);
const sqrt = plNumFn1(Math.sqrt);
const exp = plNumFn1(Math.exp);
const pow = plNumFn2(Math.pow);
const log = plNumFn1(Math.log);
const log2 = plNumFn1(Math.log2);
const log10 = plNumFn1(Math.log10);
/// trigonometry
const DEG_TO_RAD = Math.PI / 180;
const deg2rad = (x) => x.multiply(plNumber(DEG_TO_RAD));
const rad2deg = (x) => x.divide(plNumber(DEG_TO_RAD));
const sin = plNumFn1((val) => {
    const rem = val % Math.PI;
    return isBelowEpsilon(rem) || isBelowEpsilon(rem - Math.PI) ? 0 : Math.sin(val);
});
const asin = plNumFn1(Math.asin);
const asinh = plNumFn1(Math.asinh);
const cos = plNumFn1(Math.cos);
const acos = plNumFn1(Math.acos);
const acosh = plNumFn1(Math.acosh);
const tan = plNumFn1(Math.tan);
const atan = plNumFn1(Math.atan);
const atan2 = plNumFn2(Math.atan2);
const atanh = plNumFn1(Math.atanh);

var math = /*#__PURE__*/Object.freeze({
  __proto__: null,
  E: E,
  LN2: LN2,
  LN10: LN10,
  LOG2E: LOG2E,
  LOG10E: LOG10E,
  PI: PI,
  SQRT1_2: SQRT1_2,
  SQRT2: SQRT2,
  abs: abs,
  sign: sign,
  min: min,
  max: max,
  floor: floor,
  round: round,
  ceil: ceil,
  trunc: trunc,
  cbrt: cbrt,
  sqrt: sqrt,
  exp: exp,
  pow: pow,
  log: log,
  log2: log2,
  log10: log10,
  deg2rad: deg2rad,
  rad2deg: rad2deg,
  sin: sin,
  asin: asin,
  asinh: asinh,
  cos: cos,
  acos: acos,
  acosh: acosh,
  tan: tan,
  atan: atan,
  atan2: atan2,
  atanh: atanh
});

const str = (value) => plString(value.toString());
const toJSON = (value) => {
    let js = null;
    if (typeof value.toJSON === 'function') {
        js = value.toJSON();
    }
    else if (typeof value.toJS === 'function') {
        js = value.toJS();
    }
    return plString(JSON.stringify(js));
};
//
const debugTypeOf = (v) => {
    const result = v['debugTypeOf'] ? v.debugTypeOf() : plString('<unknown>');
    return result instanceof String ? plString(result) : result;
};
//
const copy = (item) => {
    assertImpl(item, 'copy');
    return item.copy();
};
const deepCopy = (item) => {
    var _a;
    assertImpl(item, 'copy');
    if (item.deepCopy) {
        return (_a = item.deepCopy) === null || _a === void 0 ? void 0 : _a.call(item);
    }
    else {
        return copy(item);
    }
};
var typeClassBaseFn = {
    typeof: debugTypeOf,
    copy,
    'deep-copy': deepCopy,
    str,
    'to-json': toJSON,
};

const equals = (a, b) => {
    if (a.constructor !== b.constructor)
        return plBool(false);
    //assertType(a, b);
    return a.equals(b);
};
const notEquals = (a, b) => {
    return equals(a, b).not();
};
///
const lessThen = (a, b) => {
    assertType(a, b);
    const lt = a.lt;
    return typeof lt === 'function' ? lt(b) : plBool(a.partialCmp(b) === Ordering.Less);
};
const lessOrEqual = (a, b) => {
    return plBool(equals(a, b).value || lessThen(a, b).value);
};
const greaterThen = (a, b) => {
    assertType(a, b);
    const gt = a.gt;
    return typeof gt === 'function' ? gt(b) : plBool(a.partialCmp(b) === Ordering.Greater);
};
const greaterOrEqual = (a, b) => {
    return plBool(equals(a, b).value || greaterThen(a, b).value);
};
var typeClassCmpFn = {
    '==': equals,
    '!=': notEquals,
    '<': lessThen,
    '<=': lessOrEqual,
    '>': greaterThen,
    '>=': greaterOrEqual,
};

const count = (collection) => {
    return collection.count();
};
function contains(item, collection) {
    return collection.contains(item);
}
function slice$1(start, end, container) {
    return container.slice(start, end);
}
function map(fn, f) {
    return f.map((x) => this.evalFn(fn, [x]));
}
function filter(fn, f) {
    return f.filter((x) => this.evalFn(fn, [x]));
}
function reduce(init, fn, f) {
    return f.reduce(init, (accumulator, item) => this.evalFn(fn, [accumulator, item]));
}
var typeClassIter = {
    count,
    contains,
    map,
    filter,
    reduce,
    slice: slice$1,
};

const not = (a) => {
    return a.not();
};
//
const and = (a, b) => {
    return a.and(b);
};
//
const or = (a, b) => {
    return a.or(b);
};
//
const negate = (a) => {
    return a.negate();
};
//
const add = (a, b) => {
    assertType(a, b);
    return a.add(b);
};
const subtract = (a, b) => {
    assertType(a, b);
    return a.subtract(b);
};
//
const multiply = (a, b) => {
    assertType(a, b);
    return a.multiply(b);
};
//
const divide = (a, b) => {
    assertType(a, b);
    return a.divide(b);
};
//
const get = (data, idx) => {
    return data.index(idx);
};
//
var typeClassOps = { negate, not, and, or, '+': add, '-': subtract, '*': multiply, '/': divide, get };

class PLVector {
    constructor(value) {
        value.map((item) => assertType(value[0], item));
        this._value = value;
    }
    get value() {
        return this._value;
    }
    contains(item) {
        return plBool(this.value.find((el) => equals(el, item).value) !== undefined);
    }
    add(a) {
        return new PLVector(this._value.concat(a.value));
    }
    count() {
        var _a;
        return new PLNumber((_a = this._value.length) !== null && _a !== void 0 ? _a : 0);
    }
    map(fn) {
        return new PLVector(this.value.map((item) => fn(item)));
    }
    filter(fn) {
        return new PLVector(this.value.filter((item) => fn(item).toJS()));
    }
    reverse() {
        return new PLVector(this.value.reverse());
    }
    reduce(init, fn) {
        return this.value.reduce(fn, init);
    }
    intersperse(elem) {
        const lastIdx = this.value.length - 1;
        return new PLVector(this.value.reduce((res, item, idx) => {
            res.push(item);
            if (idx < lastIdx) {
                res.push(elem);
            }
            return res;
        }, []));
    }
    toJS() {
        return this.value.map((i) => i.toJS());
    }
    toJSON() {
        return this.value.map((i) => i.toJSON());
    }
    toString() {
        return `[${this._value.map((i) => i.toString()).join(',')}]`;
    }
    // spark_dev_note: the initial implementation throws an error
    // upon hitting a non-existent item index.
    // the desired behaviour in leaf & gos is to return undefined type
    // so the useful concept of the lack of a keyed item could be 
    // used in building a leaf logic.
    // the following code was refactored to reflect this change.
    index(idx) {
        typeCheck(PLNumber, idx);
        const value = assertNothing(this.value[idx.value], `Vector index ${idx.toString()} is not defined`);
        return value;
    }
    slice(start, end) {
        typeCheck(PLNumber, start);
        typeCheck(PLNumber, end);
        return new PLVector(this.value.slice(start.value, end.value));
    }
    copy() {
        return new PLVector([...this._value]);
    }
    deepCopy() {
        return new PLVector(this._value.map((i) => copy(i)));
    }
    debugTypeOf() {
        return plString(PLVector.kind);
    }
}
PLVector.kind = 'Vector';

//import { Nothing } from '../maybe/Nothing'
function plVector(...value) {
    return new PLVector(value);
}
const sum = (list) => {
    typeCheck(PLVector, list);
    return list.reduce(plNumber(0), add);
};
const prod = (list) => {
    typeCheck(PLVector, list);
    return list.reduce(plNumber(1), multiply);
};
const intersperse = (separator, list) => {
    typeCheck(PLVector, list);
    return list.intersperse(separator);
};
const join = (list) => {
    typeCheck(PLVector, list);
    return list.reduce(plString(''), add);
};
const joinWith = (separator, list) => {
    typeCheck(PLVector, list);
    return list.intersperse(separator).reduce(plString(''), add);
};
const numList = (separator, list) => {
    typeCheck(PLVector, list);
    return list.map(x => plString(x.toString())).intersperse(separator).reduce(plString(''), add);
};
// spark_dev_note: try catch block for returning Nothing upon hitting non-existent data
// typescript type checking is picky about return types
// making returning Nothing a potentially messy solution
// so reverted back and decided to introduce try catch block upstream
const head = (list) => {
    typeCheck(PLVector, list);
    const value = assertNothing(list.value[0], 'Vector is empty');
    //value = list.value[0];
    return value;
};
// spark_dev_note: try catch block for returning Nothing upon hitting non-existent data
const tail = (list) => {
    typeCheck(PLVector, list);
    assertNothing(list.value.length, 'Vector is not defined correctly');
    const value = plVector(...list.value.slice(1));
    return value;
};
const reverse = (list) => {
    typeCheck(PLVector, list);
    return plVector(...list.value.reverse());
};
// spark_dev_note: other vector keymap retrieval operators
// including head, tail, index were refactored to return Nothing
// upon unsuccessful retrieval, except slice here as
// it would make more sense to get error raised for its use.
// at least for now. (17 Mar 2022)
const slice = (list, start, end) => {
    typeCheck(PLVector, list);
    typeCheck(PLNumber, end);
    typeCheck(PLNumber, start);
    assertNothing(list.value.length, 'Vector is not defined correctly');
    return plVector(...list.value.slice(start.value, end.value));
};
var vectorFn = {
    sum,
    prod,
    intersperse,
    join,
    'join-with': joinWith,
    'num-list': numList,
    head,
    reverse,
    slice,
    tail,
};

const rand = Math.random;
/**
 * Return the next random floating point number in the range [0.0, 1.0).
 */
const random = () => plNumber(rand());
/**
 * Return a random integer N such that a <= N <= b.
 */
const randomInt = (a, b) => {
    const ai = toInt(a.value);
    const bi = toInt(b.value);
    return plNumber(toInt(ai + rand() * (bi - ai)));
};
/**
 * Shuffle vector
 */
const shuffle = (v) => {
    const vv = [...v.value];
    // based on: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    let j, x, i;
    for (i = vv.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = vv[i];
        vv[i] = vv[j];
        vv[j] = x;
    }
    return plVector(...vv);
};

const range = (start, len, step) => {
    const from = start.value;
    const d = step.value;
    const length = toInt(len.value);
    let x = from;
    const arr = [];
    for (let i = 0; i < length; i++) {
        arr.push(plNumber(x));
        x += d;
    }
    return plVector(...arr);
};
const range0 = (len) => {
    const length = toInt(len.value);
    return plVector(...Array.from({ length }, (_v, idx) => plNumber(idx)));
};

var modules = /*#__PURE__*/Object.freeze({
  __proto__: null,
  random: random,
  randomInt: randomInt,
  shuffle: shuffle,
  range: range,
  range0: range0
});

class Just {
    constructor(_value) {
        this._value = _value;
    }
    get value() {
        return this._value;
    }
    toJS() {
        var _a, _b;
        return (_b = (_a = this._value) === null || _a === void 0 ? void 0 : _a.toJS) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    toJSON() {
        return this.toJS();
    }
    toString() {
        return `Just(${this._value.toString()})`;
    }
    debugTypeOf() {
        return plString(Just.kind);
    }
}
Just.kind = 'Just';

const maybe = (value) => {
    if (isNothing(value)) {
        return Nothing;
    }
    else {
        return new Just(value);
    }
};

const chunk = (ary, chunkSize = 2) => {
    const newAry = [];
    const end = ary.length;
    for (let i = 0; i < end; i += chunkSize) {
        newAry.push(ary.slice(i, i + chunkSize));
    }
    return newAry;
};

class PLHashMap {
    constructor(list = []) {
        if (list.length % 2 !== 0) {
            throw new StdRuntimeError('Invalid hash map definition.\nDefinition must contains key value pairs');
        }
        const entries = chunk(list).map(([key, value]) => {
            if (PLString !== key.constructor) {
                throw new StdRuntimeError('Invalid hash map definition.\n Keys are must be string or keyword');
            }
            return [key.value, value];
        });
        this._value = new Map(entries);
    }
    get value() {
        return this._value;
    }
    toJS() {
        return new Map(Array.from(this._value.entries()).map(([k, v]) => [k, v instanceof PLNumber ? v.toString() : v.toJS()]));
    }
    toJSON() {
        return Array.from(this._value.entries()).reduce((obj, [k, v]) => {
            obj[k] = v.toJSON();
            return obj;
        }, {});
    }
    toString() {
        return `{${Array.from(this._value.entries())
            .map(([k, v]) => `${k.toString()} -> ${v.toString()}`)
            .join(', ')}}`;
    }
    debugTypeOf() {
        return plString(PLHashMap.kind);
    }
    // spark_dev_note: the initial implementation throws an error
    // upon hitting a non-existent item index.
    // the desired behaviour in leaf & gos is to return undefined type
    // so the useful concept of the lack of a keyed item could be 
    // used in building a leaf logic.
    // the following code was refactored to reflect this change.
    index(idx) {
        typeCheck(PLString, idx);
        //const item = assertNothing(this._value.get(idx.value), `HashMap key ${idx.toString()} not defined`);
        try {
          const item = this._value.get(idx.value)
          return isNothing(item) ? new NothingClass() : item;
        }
        catch (error) {
          return new NothingClass();
        }
    }
}
PLHashMap.kind = 'HashMap';

const plHashMap = (...list) => new PLHashMap(list);
const keys = (map) => {
    typeCheck(PLHashMap, map);
    return plVector(...Array.from(map.value.keys()).map((k) => plString(k)));
};
const values = (map) => {
    typeCheck(PLHashMap, map);
    return plVector(...Array.from(map.value.values()));
};
var hashMapFn = {
    keys,
    values,
    "hash-map": plHashMap,
};

class PLSet {
    constructor(list) {
        const arr = list.value;
        arr.map((item) => assertType(arr[0], item));
        // Filter out identical items
        this._value = arr.reduce((list, item) => {
            if (!list.find((el) => equals(el, item).value)) {
                list.push(item);
            }
            return list;
        }, []);
    }
    get value() {
        return this._value;
    }
    contains(item) {
        return plBool(this.value.find((el) => equals(el, item).value) !== undefined);
    }
    union(a) {
        return new PLSet(plVector(...this._value.concat(a.value)));
    }
    difference(a) {
        return new PLSet(plVector(...this.value.filter((item) => !a.contains(item).value)));
    }
    intersection(a) {
        return new PLSet(plVector(...this.value.concat(a.value).filter((el) => a.contains(el).value && this.contains(el).value)));
    }
    symmetricDifference(a) {
        return new PLSet(plVector(...this.value.concat(a.value).filter((el) => !(a.contains(el).value && this.contains(el).value))));
    }
    count() {
        var _a;
        return new PLNumber((_a = this._value.length) !== null && _a !== void 0 ? _a : 0);
    }
    map(fn) {
        return new PLSet(plVector(...this.value.map(fn)));
    }
    filter(fn) {
        return new PLSet(plVector(...this.value.filter((item) => fn(item).toJS())));
    }
    reduce(init, fn) {
        return this.value.reduce(fn, init);
    }
    toJS() {
        return this.value.map((i) => i.toJS());
    }
    toJSON() {
        return this.value.map((i) => i.toJSON());
    }
    toString() {
        return `[${this.value.map((i) => i.toString()).join(',')}]`;
    }
    copy() {
        return new PLSet(plVector(...this.value));
    }
    deepCopy() {
        return new PLSet(plVector(...this.value.map((i) => copy(i))));
    }
    debugTypeOf() {
        return plString(PLSet.kind);
    }
}
PLSet.kind = 'Set';

const plSet = (value) => new PLSet(value);
function set2list(set) {
    return plVector(...set.value);
}
function union(a, b) {
    return a.union(b);
}
function difference(a, b) {
    return a.difference(b);
}
function intersection(a, b) {
    return a.intersection(b);
}
function symmetricDifference(a, b) {
    return a.symmetricDifference(b);
}
var setFn = {
    Set: plSet,
    'set-2-list': set2list,
    'set-union': union,
    'set-diff': difference,
    'set-intersection': intersection,
    'set-symmetric-difference': symmetricDifference,
};

const isValid = (n, d) => {
    return Number.isInteger(n) && Number.isInteger(d) && d !== 0;
};

class PLFractionNumber {
    constructor(numerator, denominator) {
        if (!isValid(numerator, denominator)) {
            throw new StdRuntimeError('Invalid fraction number parameters!');
        }
        if (denominator < 0) {
            numerator *= -1;
            denominator *= -1;
        }
        const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
        this._n = numerator / divisor;
        this._d = denominator / divisor;
    }
    get numerator() {
        return this._n;
    }
    get denominator() {
        return this._d;
    }
    equals(a) {
        return plBool(this.numerator === a.numerator && this.denominator === a.denominator);
    }
    negate() {
        return new PLFractionNumber(-this._n, this._d);
    }
    add(a) {
        const numerator = this.numerator * a.denominator + this.denominator * a.numerator;
        const denominator = this.denominator * a.denominator;
        return new PLFractionNumber(numerator, denominator);
    }
    subtract(a) {
        const numerator = this.numerator * a.denominator - this.denominator * a.numerator;
        const denominator = this.denominator * a.denominator;
        return new PLFractionNumber(numerator, denominator);
    }
    multiply(a) {
        const numerator = this.numerator * a.numerator;
        const denominator = this.denominator * a.denominator;
        return new PLFractionNumber(numerator, denominator);
    }
    divide(a) {
        const numerator = this.numerator * a.denominator;
        const denominator = this.denominator * a.numerator;
        return new PLFractionNumber(numerator, denominator);
    }
    partialCmp(other) {
        const lcm = (this._d * other._d) / gcd(this._d, other._d);
        const a = (this._n * lcm) / this._d;
        const b = (other._n * lcm) / other._d;
        if (a < b)
            return Ordering.Less;
        if (a > b)
            return Ordering.Greater;
        return Ordering.Equal;
    }
    toJS() {
        return {
            numerator: this._n,
            denominator: this._d,
        };
    }
    //public toJSON(): FractionNumberRecord {
    //  return this.toJS()
    //}
    toJSON() {
        return this.toString();
    }
    toString() {
        return `${this._n}/${this._d}`;
    }
    copy() {
        return new PLFractionNumber(this._n, this._d);
    }
    debugTypeOf() {
        return plString(PLFractionNumber.kind);
    }
}
PLFractionNumber.kind = 'Fraction';

const plFractionNumber = (n, d) => {
    return new PLFractionNumber(n, d);
};
const plFractionNumberConstructor = (n, d) => {
    assert(!n.isInteger().value, 'Numerator must be integer');
    assert(!d.isInteger().value, 'Denominator must be integer');
    return new PLFractionNumber(n.toJS(), d.toJS());
};
const str2plFractionNumber = (str) => {
    const [n, d] = str.split('/').map(parseFloat);
    if (isValid(n, d)) {
        return new PLFractionNumber(n, d);
    }
    else {
        throw new StdRuntimeError(`Invalid fraction number: ${str}.`);
    }
};
const reciprocal = (fn) => {
    typeCheck(PLFractionNumber, fn);
    return plFractionNumber(fn.denominator, fn.numerator);
};
const number2fraction = (accuracy, number) => {
    const acc = accuracy.value;
    assert(acc < 1 || !Number.isInteger(acc), `Accuracy must be a positive integer number instead of ${acc}`);
    const base = number.value;
    const denominator = Math.pow(10, acc);
    return plFractionNumber(Math.round(base * denominator), denominator);
};
const fraction2number = (number) => {
    return plNumber(number.numerator).divide(plNumber(number.denominator));
};
var fractionNumberFn = {
    ['number-2-fraction']: number2fraction,
    ['fraction-2-number']: fraction2number,
    reciprocal,
};

const unboxing = (x) => x.toJS();

const identity = (x) => x;
const literals = {
    Bool: {
        parser: parseBool,
        factory: plBoolConstructor,
    },
    Nothing: {
        parser: parseNothing,
        factory: plNothingConstructor,
    },
    Int: {
        parser: plNumber,
        factory: plIntegerConstructor,
    },
    Float: {
        parser: plNumber,
        factory: plFloatConstructor,
    },
    FractionNumber: {
        parser: str2plFractionNumber,
        factory: plFractionNumberConstructor,
    },
    String: {
        parser: plString,
        factory: plStringConstructor,
    },
    Vector: {
        parser: identity,
        factory: plVector,
    },
    HashMap: {
        parser: identity,
        factory: plHashMap,
    },
};
const runtime = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, typeClassBaseFn), typeClassCmpFn), typeClassIter), typeClassOps), baseFn), math), numFn), fractionNumberFn), vectorFn), hashMapFn), setFn), modules), { maybe,
    Nothing });
const utils = {
    unboxing,
};

export { Ordering, PLBool, NothingClass, PLFractionNumber, PLHashMap, PLNumber, PLString, PLVector, StdRuntimeError, add, and, assert, assertNumeric, contains, copy, count, debugTypeOf, deepCopy, divide, equals, filter, get, greaterOrEqual, greaterThen, identity, isScientific, lessOrEqual, lessThen, literals, map, multiply, negate, not, notEquals, or, parseDecimalString, parseScientificString, plBool, plFractionNumber, plHashMap, plNumber, plString, plVector, reduce, runtime, slice$1 as slice, str, subtract, toJSON, utils };

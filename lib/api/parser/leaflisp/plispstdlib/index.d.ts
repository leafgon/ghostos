export var Ordering: any;
export class PLBool {
    static fromJS(value: any): PLBool;
    static fromStr(str: any): PLBool;
    constructor(_value: any);
    _value: any;
    get value(): any;
    not(): PLBool;
    and(other: any): PLBool;
    or(other: any): PLBool;
    equals(other: any): PLBool;
    partialCmp(other: any): any;
    copy(): PLBool;
    toString(): "true" | "false";
    toJS(): any;
    toJSON(): any;
    debugTypeOf(): PLString;
}
export namespace PLBool {
    let kind: string;
}
export class NothingClass {
    static fromStr(str: any): NothingClass;
    _value: any;
    get value(): null;
    equals(other: any): PLBool;
    not(): PLBool;
    toJS(): null;
    toJSON(): null;
    toString(): string;
    debugTypeOf(): PLString;
}
export namespace NothingClass {
    let kind_1: string;
    export { kind_1 as kind };
}
export class PLFractionNumber {
    constructor(numerator: any, denominator: any);
    _n: number;
    _d: number;
    get numerator(): number;
    get denominator(): number;
    equals(a: any): PLBool;
    negate(): PLFractionNumber;
    add(a: any): PLFractionNumber;
    subtract(a: any): PLFractionNumber;
    multiply(a: any): PLFractionNumber;
    divide(a: any): PLFractionNumber;
    partialCmp(other: any): any;
    toJS(): {
        numerator: number;
        denominator: number;
    };
    toJSON(): string;
    toString(): string;
    copy(): PLFractionNumber;
    debugTypeOf(): PLString;
}
export namespace PLFractionNumber {
    let kind_2: string;
    export { kind_2 as kind };
}
export class PLHashMap {
    constructor(list?: any[]);
    _value: Map<any, any>;
    get value(): Map<any, any>;
    toJS(): Map<any, any>;
    toJSON(): {};
    toString(): string;
    debugTypeOf(): PLString;
    index(idx: any): any;
}
export namespace PLHashMap {
    let kind_3: string;
    export { kind_3 as kind };
}
export class PLNumber {
    constructor(intValue: any, decimals?: number);
    _decimals: any;
    _intValue: any;
    get intValue(): any;
    get decimals(): any;
    get value(): number;
    equals(d: any): PLBool;
    negate(): PLNumber;
    add(d: any): PLNumber;
    subtract(d: any): PLNumber;
    multiply(d: any): PLNumber;
    divide(d: any): PLNumber;
    partialCmp(other: any): any;
    toJS(): number;
    toString(): string;
    copy(): PLNumber;
    debugTypeOf(): PLString;
    isInteger(): PLBool;
    toJSON(): string;
}
export namespace PLNumber {
    let kind_4: string;
    export { kind_4 as kind };
}
export class PLString {
    static fromJS(value: any): PLString;
    static fromStr(value: any): any;
    constructor(_value: any);
    _value: any;
    get value(): any;
    add(other: any): PLString;
    index(idx: any): PLString;
    slice(start: any, end: any): PLString;
    equals(other: any): PLBool;
    partialCmp(other: any): any;
    copy(): PLString;
    toJS(): any;
    toJSON(): any;
    toString(): string;
    debugTypeOf(): PLString;
    contains(item: any): PLBool;
    count(): PLNumber;
}
export namespace PLString {
    let kind_5: string;
    export { kind_5 as kind };
}
export class PLVector {
    constructor(value: any);
    _value: any;
    get value(): any;
    contains(item: any): PLBool;
    add(a: any): PLVector;
    count(): PLNumber;
    map(fn: any): PLVector;
    filter(fn: any): PLVector;
    reverse(): PLVector;
    reduce(init: any, fn: any): any;
    intersperse(elem: any): PLVector;
    toJS(): any;
    toJSON(): any;
    toString(): string;
    index(idx: any): any;
    slice(start: any, end: any): PLVector;
    copy(): PLVector;
    deepCopy(): PLVector;
    debugTypeOf(): PLString;
}
export namespace PLVector {
    let kind_6: string;
    export { kind_6 as kind };
}
export class StdRuntimeError extends Error {
    constructor(error: any);
    stack: any;
}
export function add(a: any, b: any): any;
export function and(a: any, b: any): any;
export function assert(val: any, msg: any): boolean;
export function assertNumeric(strValue: any): boolean;
export function contains(item: any, collection: any): any;
export function copy(item: any): any;
export function count(collection: any): any;
export function debugTypeOf(v: any): any;
export function deepCopy(item: any): any;
export function divide(a: any, b: any): any;
export function equals(a: any, b: any): any;
export function filter(fn: any, f: any): any;
export function get(data: any, idx: any): any;
export function greaterOrEqual(a: any, b: any): PLBool;
export function greaterThen(a: any, b: any): any;
export function identity(x: any): any;
export function isScientific(strValue: any): boolean;
export function lessOrEqual(a: any, b: any): PLBool;
export function lessThen(a: any, b: any): any;
export namespace literals {
    namespace Bool {
        export { parseBool as parser };
        export { plBoolConstructor as factory };
    }
    namespace Nothing {
        export { parseNothing as parser };
        export { plNothingConstructor as factory };
    }
    namespace Int {
        export { plNumber as parser };
        export { plIntegerConstructor as factory };
    }
    namespace Float {
        export { plNumber as parser };
        export { plFloatConstructor as factory };
    }
    namespace FractionNumber {
        export { str2plFractionNumber as parser };
        export { plFractionNumberConstructor as factory };
    }
    namespace String {
        export { plString as parser };
        export { plStringConstructor as factory };
    }
    namespace Vector {
        export { identity as parser };
        export { plVector as factory };
    }
    namespace HashMap {
        export { identity as parser };
        export { plHashMap as factory };
    }
}
export function map(fn: any, f: any): any;
export function multiply(a: any, b: any): any;
export function negate(a: any): any;
export function not(a: any): any;
export function notEquals(a: any, b: any): any;
export function or(a: any, b: any): any;
export function parseDecimalString(strValue: any): {
    intValue: number;
    decimals: any;
};
export function parseScientificString(strValue: any): {
    intValue: number;
    decimals: any;
};
export function plBool(value: any): PLBool;
export function plFractionNumber(n: any, d: any): PLFractionNumber;
export function plHashMap(...list: any[]): PLHashMap;
export function plNumber(value: any, decimals?: number): PLNumber;
export function plString(value?: string): PLString;
export function plVector(...value: any[]): PLVector;
export function reduce(init: any, fn: any, f: any): any;
export const runtime: {
    typeof: (v: any) => any;
    copy: (item: any) => any;
    "deep-copy": (item: any) => any;
    str: (value: any) => PLString;
    "to-json": (value: any) => PLString;
} & {
    "==": (a: any, b: any) => any;
    "!=": (a: any, b: any) => any;
    "<": (a: any, b: any) => any;
    "<=": (a: any, b: any) => PLBool;
    ">": (a: any, b: any) => any;
    ">=": (a: any, b: any) => PLBool;
} & {
    count: (collection: any) => any;
    contains: typeof contains;
    map: typeof map;
    filter: typeof filter;
    reduce: typeof reduce;
    slice: typeof slice$1;
} & {
    negate: (a: any) => any;
    not: (a: any) => any;
    and: (a: any, b: any) => any;
    or: (a: any, b: any) => any;
    "+": (a: any, b: any) => any;
    "-": (a: any, b: any) => any;
    "*": (a: any, b: any) => any;
    "/": (a: any, b: any) => any;
    get: (data: any, idx: any) => any;
} & {
    const: (fn: any) => () => any;
} & Readonly<{
    __proto__: null;
    E: PLNumber;
    LN2: PLNumber;
    LN10: PLNumber;
    LOG2E: PLNumber;
    LOG10E: PLNumber;
    PI: PLNumber;
    SQRT1_2: PLNumber;
    SQRT2: PLNumber;
    abs: (x: any) => PLNumber;
    sign: (x: any) => PLNumber;
    min: (x: any, y: any) => PLNumber;
    max: (x: any, y: any) => PLNumber;
    floor: (x: any) => PLNumber;
    round: (x: any) => PLNumber;
    ceil: (x: any) => PLNumber;
    trunc: (x: any) => PLNumber;
    cbrt: (x: any) => PLNumber;
    sqrt: (x: any) => PLNumber;
    exp: (x: any) => PLNumber;
    pow: (x: any, y: any) => PLNumber;
    log: (x: any) => PLNumber;
    log2: (x: any) => PLNumber;
    log10: (x: any) => PLNumber;
    deg2rad: (x: any) => any;
    rad2deg: (x: any) => any;
    sin: (x: any) => PLNumber;
    asin: (x: any) => PLNumber;
    asinh: (x: any) => PLNumber;
    cos: (x: any) => PLNumber;
    acos: (x: any) => PLNumber;
    acosh: (x: any) => PLNumber;
    tan: (x: any) => PLNumber;
    atan: (x: any) => PLNumber;
    atan2: (x: any, y: any) => PLNumber;
    atanh: (x: any) => PLNumber;
}> & {
    modulo: typeof modulo;
} & {
    "number-2-fraction": (accuracy: any, number: any) => PLFractionNumber;
    "fraction-2-number": (number: any) => PLNumber;
    reciprocal: (fn: any) => PLFractionNumber;
} & {
    sum: (list: any) => any;
    prod: (list: any) => any;
    intersperse: (separator: any, list: any) => any;
    join: (list: any) => any;
    "join-with": (separator: any, list: any) => any;
    "num-list": (separator: any, list: any) => any;
    head: (list: any) => any;
    reverse: (list: any) => PLVector;
    slice: (list: any, start: any, end: any) => PLVector;
    tail: (list: any) => PLVector;
} & {
    keys: (map: any) => PLVector;
    values: (map: any) => PLVector;
    "hash-map": (...list: any[]) => PLHashMap;
} & {
    Set: (value: any) => PLSet;
    "set-2-list": typeof set2list;
    "set-union": typeof union;
    "set-diff": typeof difference;
    "set-intersection": typeof intersection;
    "set-symmetric-difference": typeof symmetricDifference;
} & Readonly<{
    __proto__: null;
    random: () => PLNumber;
    randomInt: (a: any, b: any) => PLNumber;
    shuffle: (v: any) => PLVector;
    range: (start: any, len: any, step: any) => PLVector;
    range0: (len: any) => PLVector;
}> & {
    maybe: (value: any) => NothingClass | Just;
    Nothing: NothingClass;
};
declare function slice$1(start: any, end: any, container: any): any;
export function str(value: any): PLString;
export function subtract(a: any, b: any): any;
export function toJSON(value: any): PLString;
export namespace utils {
    export { unboxing };
}
declare function parseBool(value: any): PLBool;
declare function plBoolConstructor(value: any): any;
declare function parseNothing(value: any): NothingClass;
declare function plNothingConstructor(value: any): any;
declare function plIntegerConstructor(value: any): any;
declare function plFloatConstructor(value: any): any;
declare function str2plFractionNumber(str: any): PLFractionNumber;
declare function plFractionNumberConstructor(n: any, d: any): PLFractionNumber;
declare function plStringConstructor(value: any): any;
declare function modulo(dividend: any, divisor: any): PLNumber;
declare class PLSet {
    constructor(list: any);
    _value: any;
    get value(): any;
    contains(item: any): PLBool;
    union(a: any): PLSet;
    difference(a: any): PLSet;
    intersection(a: any): PLSet;
    symmetricDifference(a: any): PLSet;
    count(): PLNumber;
    map(fn: any): PLSet;
    filter(fn: any): PLSet;
    reduce(init: any, fn: any): any;
    toJS(): any;
    toJSON(): any;
    toString(): string;
    copy(): PLSet;
    deepCopy(): PLSet;
    debugTypeOf(): PLString;
}
declare namespace PLSet {
    let kind_7: string;
    export { kind_7 as kind };
}
declare function set2list(set: any): PLVector;
declare function union(a: any, b: any): any;
declare function difference(a: any, b: any): any;
declare function intersection(a: any, b: any): any;
declare function symmetricDifference(a: any, b: any): any;
declare class Just {
    constructor(_value: any);
    _value: any;
    get value(): any;
    toJS(): any;
    toJSON(): any;
    toString(): string;
    debugTypeOf(): PLString;
}
declare namespace Just {
    let kind_8: string;
    export { kind_8 as kind };
}
declare function unboxing(x: any): any;
export { slice$1 as slice };

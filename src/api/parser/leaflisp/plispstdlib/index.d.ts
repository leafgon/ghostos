import { PLLiterals, Interpreter, PLCallable } from 'pocket-lisp';
declare const identity: <T>(x: T) => T;
declare const literals: PLLiterals;
// eslint-disable-next-line @typescript-eslint/no-empty-interface,@typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface,@typescript-eslint/no-unused-vars
interface Box<T> {
}
interface SerializeToJS<T> {
    toJS(): T;
}
interface SerializeToString {
    toString(): string;
}
interface FromJS<JS, T> {
    fromJS(data: JS): T;
}
interface FromStr<T> {
    fromStr(source: PLString): T;
}
interface Debug {
    debugTypeOf(): PLString;
}
interface Copy<T> {
    copy(): T;
    deepCopy?(): T;
}
/**
 * a.equals(a) === true (reflexivity)
 * a.equals(b) === b.equals(a) (symmetry)
 * If a.equals(b) and b.equals(c), then a.equals(c) (transitivity)
 */
interface PartialEq<T> {
    // Setoid a => a ~> a -> Boolean
    equals(b: T): PLBool;
}
declare enum Ordering {
    Less = 0,
    Equal = 1,
    Greater = 2
}
interface PartialOrd<T extends PartialEq<T>> {
    partialCmp(other: T): Ordering;
    lt?(other: T): PLBool;
    le?(other: T): PLBool;
    gt?(other: T): PLBool;
    ge?(other: T): PLBool;
}
interface Not {
    not(): PLBool;
}
interface And<T> {
    and(a: T): PLBool;
}
interface Or<T> {
    or(a: T): PLBool;
}
interface Negate<T> {
    negate(): T;
}
interface Add<T> {
    add(a: T): T;
}
interface Multiple<T> {
    multiple(a: T): T;
}
interface Divide<T> {
    divide(a: T): T;
}
interface Index<Idx, Return> {
    index(idx: Idx): Return;
}
declare class PLBool implements PLBase, PartialEq<PLBool>, Not, And<PLBool>, Or<PLBool>, PartialEq<PLBool>, PartialOrd<PLBool>, Copy<PLBool> {
    private _value;
    static kind: string;
    static fromJS(value: boolean): PLBool;
    static fromStr(str: PLString): PLBool;
    constructor(_value: boolean);
    get value(): boolean;
    not(): PLBool;
    and(other: PLBool): PLBool;
    or(other: PLBool): PLBool;
    equals(other: PLBool): PLBool;
    partialCmp(other: PLBool): Ordering;
    copy(): PLBool;
    toString(): string;
    toJS(): boolean;
    toJSON(): boolean;
    debugTypeOf(): PLString;
}
declare const not: (a: Not) => PLBool;
//
declare const and: <T>(a: And<T>, b: T) => PLBool;
//
declare const or: <T>(a: Or<T>, b: T) => PLBool;
//
declare const negate: (a: Negate<any>) => PLBool;
//
declare const add: <T>(a: Add<T>, b: T) => T;
//
interface Subtract<T> {
    subtract(a: T): T;
}
declare const subtract: <T>(a: Subtract<T>, b: T) => T;
//
declare const multiple: <T>(a: Multiple<T>, b: T) => T;
//
declare const divide: <T>(a: Divide<T>, b: T) => T;
//
declare const get: <Idx, Item extends PLBase>(data: Index<Idx, Item>, idx: Idx) => Item;
declare const _default: {
    negate: (a: Negate<any>) => PLBool;
    not: (a: Not) => PLBool;
    and: <T>(a: And<T>, b: T) => PLBool;
    or: <T_1>(a: Or<T_1>, b: T_1) => PLBool;
    "+": <T_2>(a: Add<T_2>, b: T_2) => T_2;
    "-": <T_3>(a: Subtract<T_3>, b: T_3) => T_3;
    "*": <T_4>(a: Multiple<T_4>, b: T_4) => T_4;
    "/": <T_5>(a: Divide<T_5>, b: T_5) => T_5;
    get: <Idx, Item extends PLBase>(data: Index<Idx, Item>, idx: Idx) => Item;
};
declare class PLNumber implements PLBase, PartialEq<PLNumber>, Add<PLNumber>, Subtract<PLNumber>, Multiple<PLNumber>, Divide<PLNumber>, Negate<PLNumber>, PartialOrd<PLNumber>, Copy<PLNumber> {
    static kind: string;
    private readonly _intValue;
    private readonly _decimals;
    constructor(intValue: number, decimals?: number);
    get intValue(): number;
    get decimals(): number;
    get value(): number;
    equals(d: PLNumber): PLBool;
    negate(): PLNumber;
    add(d: PLNumber): PLNumber;
    subtract(d: PLNumber): PLNumber;
    multiple(d: PLNumber): PLNumber;
    divide(d: PLNumber): PLNumber;
    partialCmp(other: PLNumber): Ordering;
    toJS(): number;
    toString(): string;
    copy(): PLNumber;
    debugTypeOf(): PLString;
    isInteger(): PLBool;
    //public toJSON(): DecimalResult {
    //  return {
    //    intValue: this._intValue,
    //    decimals: this._decimals,
    //  }
    //}
    toJSON(): string;
}
interface Container<Item> {
    count(): PLNumber;
    contains(item: PartialEq<Item>): PLBool;
}
interface Slice<Item> {
    slice(start: PLNumber, end: PLNumber): Slice<Item>;
}
interface Iterable<Item> extends Container<Item> {
    map<MapItem extends PLBase>(fn: (item: Item) => MapItem): Box<MapItem>;
    filter(fn: (item: Item) => PLBool): Box<Item>;
    reduce<Result>(init: Result, fn: (acc: Result, item: Item) => Result): Result;
}
declare class PLString implements PLBase, Index<PLNumber, PLString>, PartialEq<PLString>, PartialOrd<PLString>, Copy<PLString>, Container<PLString>, Slice<PLString> {
    private _value;
    static kind: string;
    static fromJS(value: string): PLString;
    static fromStr(value: PLString): PLString;
    constructor(_value: string);
    get value(): string;
    add(other: PLString): PLString;
    index(idx: PLNumber): PLString;
    slice(start: PLNumber, end: PLNumber): PLString;
    equals(other: PLString): PLBool;
    partialCmp(other: PLString): Ordering;
    copy(): PLString;
    toJS(): string;
    toJSON(): string;
    toString(): string;
    debugTypeOf(): PLString;
    contains(item: PartialEq<PLString>): PLBool;
    count(): PLNumber;
}
declare const str: (value: SerializeToString) => PLString;
interface BoxedValue<T> extends SerializeToJS<T> {
    toString: () => string;
}
declare const toJSON: (value: any) => PLString;
//
declare const debugTypeOf: (variable: Debug) => PLString;
//
declare const copy: <T extends Copy<any>>(item: T) => T;
declare const deepCopy: <T extends Copy<any>>(item: T) => T;
declare const _default: {
    typeof: (variable: Debug) => PLString;
    copy: <T extends Copy<any>>(item: T) => T;
    "deep-copy": <T_1 extends Copy<any>>(item: T_1) => T_1;
    str: (value: SerializeToString) => PLString;
    "to-json": (value: any) => PLString;
};
declare const equals: <T>(a: PartialEq<T>, b: T) => PLBool;
declare const notEquals: <T>(a: PartialEq<T>, b: T) => PLBool;
///
declare const lessThen: <T extends PartialOrd<any>>(a: T, b: T) => PLBool;
declare const lessOrEqual: <T extends PartialOrd<any> & PartialEq<any>>(a: T, b: T) => PLBool;
declare const greaterThen: <T extends PartialOrd<any>>(a: T, b: T) => PLBool;
declare const greaterOrEqual: <T extends PartialOrd<any> & PartialEq<any>>(a: T, b: T) => PLBool;
declare const _default: {
    "==": <T>(a: PartialEq<T>, b: T) => PLBool;
    "!=": <T_1>(a: PartialEq<T_1>, b: T_1) => PLBool;
    "<": <T_2 extends PartialOrd<any>>(a: T_2, b: T_2) => PLBool;
    "<=": <T_3 extends PartialOrd<any> & PartialEq<any>>(a: T_3, b: T_3) => PLBool;
    ">": <T_4 extends PartialOrd<any>>(a: T_4, b: T_4) => PLBool;
    ">=": <T_5 extends PartialOrd<any> & PartialEq<any>>(a: T_5, b: T_5) => PLBool;
};
declare const count: (collection: Container<unknown>) => PLNumber;
declare function contains<T extends PLBase, Item extends PartialEq<T>>(item: Item, collection: Container<T>): PLBool;
declare function slice<T extends PLBase>(start: PLNumber, end: PLNumber, container: Slice<T>): Slice<T>;
declare function map<T extends PLBase, B extends PLBase>(this: Interpreter, fn: PLCallable, f: Iterable<T>): Box<B>;
declare function filter<T extends PLBase>(this: Interpreter, fn: PLCallable, f: Iterable<T>): Box<T>;
declare function reduce<T extends PLBase, Result>(this: Interpreter, init: Result, fn: PLCallable, f: Iterable<T>): Result;
declare const _default: {
    count: (collection: Container<unknown>) => PLNumber;
    contains: typeof contains;
    map: typeof map;
    filter: typeof filter;
    reduce: typeof reduce;
    slice: typeof slice;
};
interface PLBase extends SerializeToJS<unknown>, SerializeToString, Debug {
    toString(): string;
    toJS(): any;
    toJSON(): any;
    debugTypeOf(): PLString;
}
declare class Just<T extends PLBase> implements PLBase {
    private _value;
    static kind: string;
    constructor(_value: T);
    get value(): T;
    toJS<Return>(): Return;
    toJSON<Return>(): Return;
    toString(): string;
    debugTypeOf(): PLString;
}
declare class NothingClass implements PLBase {
    static kind: string;
    get value(): NothingClass;
    toJS(): undefined;
    toJSON(): undefined;
    toString(): string;
    debugTypeOf(): PLString;
}
declare const Nothing: NothingClass;
type Maybe<T extends PLBase> = Just<T> | typeof Nothing;
interface StrictArray<Item> extends Array<Item> {
    filter(predicate: (value: Item, index: number, array: Item[]) => boolean, thisArg?: any): Item[];
    find(predicate: (value: Item, index: number, obj: Item[]) => unknown, thisArg?: any): Item | undefined;
    find(predicate: (value: Item, index: number, obj: Item[]) => unknown, thisArg?: any): number | undefined;
    concat(...items: ConcatArray<Item>[]): StrictArray<Item>;
}
type VectorItem = PLBase;
declare class PLVector<Item extends VectorItem> implements PLBase, Add<PLVector<Item>>, Iterable<Item>, Copy<PLVector<Item>>, Slice<PLVector<Item>> {
    static kind: string;
    private readonly _value;
    constructor(value: StrictArray<Item>);
    get value(): StrictArray<Item>;
    contains(item: PartialEq<Item>): PLBool;
    add(a: PLVector<any>): PLVector<any>;
    count(): PLNumber;
    map<MapItem extends VectorItem>(fn: (item: Item) => MapItem): PLVector<MapItem>;
    filter(fn: (item: Item) => PLBool): PLVector<Item>;
    reverse(): PLVector<Item>;
    reduce<Result>(init: Result, fn: (acc: Result, item: Item) => Result): Result;
    intersperse(elem: Item): PLVector<Item>;
    toJS<Item = unknown>(): Item[];
    toJSON<Item = unknown>(): Item[];
    toString(): string;
    // spark_dev_note: the initial implementation throws an error
    // upon hitting a non-existent item index.
    // the desired behaviour in leaf & gos is to return undefined type
    // so the useful concept of the lack of a keyed item could be
    // used in building a leaf logic.
    // the following code was refactored to reflect this change.
    index(idx: PLNumber): Item;
    slice(start: PLNumber, end: PLNumber): PLVector<Item>;
    copy(): PLVector<Item>;
    deepCopy(): PLVector<Item>;
    debugTypeOf(): PLString;
}
type SetItem = PLBase;
declare class PLSet<Item extends SetItem> implements PLBase, Iterable<Item>, Copy<PLSet<Item>> {
    static kind: string;
    private readonly _value;
    constructor(list: PLVector<Item>);
    get value(): Item[];
    contains(item: PartialEq<PLBase>): PLBool;
    union(a: PLSet<Item>): PLSet<Item>;
    difference(a: PLSet<Item>): PLSet<Item>;
    intersection(a: PLSet<Item>): PLSet<Item>;
    symmetricDifference(a: PLSet<Item>): PLSet<Item>;
    count(): PLNumber;
    map<MapItem extends SetItem>(fn: (item: Item) => MapItem): PLSet<MapItem>;
    filter(fn: (item: Item) => PLBool): PLSet<Item>;
    reduce<Result>(init: Result, fn: (acc: Result, item: Item) => Result): Result;
    toJS<Item = unknown>(): Item[];
    toJSON<Item = unknown>(): Item[];
    toString(): string;
    copy(): PLSet<Item>;
    deepCopy(): PLSet<Item>;
    debugTypeOf(): PLString;
}
declare function set2list<T extends PLBase>(set: PLSet<T>): PLVector<T>;
declare function union<T extends PLBase>(a: PLSet<T>, b: PLSet<T>): PLSet<T>;
declare function difference<T extends PLBase>(a: PLSet<T>, b: PLSet<T>): PLSet<T>;
declare function intersection<T extends PLBase>(a: PLSet<T>, b: PLSet<T>): PLSet<T>;
declare function symmetricDifference<T extends PLBase>(a: PLSet<T>, b: PLSet<T>): PLSet<T>;
declare const _default: {
    Set: <T extends PLBase>(value: PLVector<T>) => PLSet<T>;
    "set-2-list": typeof set2list;
    "set-union": typeof union;
    "set-diff": typeof difference;
    "set-intersection": typeof intersection;
    "set-symmetric-difference": typeof symmetricDifference;
};
declare class PLHashMap<Item extends PLBase> implements PLBase, Index<PLString, Item> {
    static kind: string;
    private readonly _value;
    constructor(list?: unknown[]);
    get value(): Map<string, Item>;
    toJS(): Map<string, PLNumber | any>;
    toJSON<Return = Record<string, unknown>>(): Return;
    toString(): string;
    debugTypeOf(): PLString;
    // spark_dev_note: the initial implementation throws an error
    // upon hitting a non-existent item index.
    // the desired behaviour in leaf & gos is to return undefined type
    // so the useful concept of the lack of a keyed item could be
    // used in building a leaf logic.
    // the following code was refactored to reflect this change.
    index(idx: PLString): Item;
}
///
interface FractionNumberRecord {
    numerator: number;
    denominator: number;
}
declare class PLFractionNumber implements PLBase, PartialEq<PLFractionNumber>, Add<PLFractionNumber>, Subtract<PLFractionNumber>, Multiple<PLFractionNumber>, Divide<PLFractionNumber>, Negate<PLFractionNumber>, PartialOrd<PLFractionNumber>, Copy<PLFractionNumber> {
    static kind: string;
    private readonly _n;
    private readonly _d;
    constructor(numerator: number, denominator: number);
    get numerator(): number;
    get denominator(): number;
    equals(a: PLFractionNumber): PLBool;
    negate(): PLFractionNumber;
    add(a: PLFractionNumber): PLFractionNumber;
    subtract(a: PLFractionNumber): PLFractionNumber;
    multiple(a: PLFractionNumber): PLFractionNumber;
    divide(a: PLFractionNumber): PLFractionNumber;
    partialCmp(other: PLFractionNumber): Ordering;
    toJS(): FractionNumberRecord;
    //public toJSON(): FractionNumberRecord {
    //  return this.toJS()
    //}
    toJSON(): string;
    toString(): string;
    copy(): PLFractionNumber;
    debugTypeOf(): PLString;
}
interface DecimalResult {
    intValue: number;
    decimals: number;
}
declare function plNumber(value: string): PLNumber;
declare function plNumber(value: number, decimals?: number): PLNumber;
declare function assertNumeric(strValue: string): boolean;
declare function isScientific(strValue: string): boolean;
declare function parseScientificString(strValue: string): DecimalResult;
declare function parseDecimalString(strValue: string): DecimalResult;
declare function modulo(dividend: PLNumber, divisor: PLNumber): PLNumber;
declare const _default: {
    modulo: typeof modulo;
};
declare const runtime: {
    maybe: <T extends PLBase>(v: any) => Maybe<T>;
    Nothing: NothingClass;
    random: () => PLNumber;
    randomInt: (a: PLNumber, b: PLNumber) => PLNumber;
    shuffle: (v: PLVector<any>) => PLVector<any>;
    range: (start: PLNumber, len: PLNumber, step: PLNumber) => PLVector<PLNumber>;
    range0: (len: PLNumber) => PLVector<PLNumber>;
    Set: <T extends PLBase>(value: PLVector<T>) => PLSet<T>;
    'set-2-list': typeof set2list;
    'set-union': typeof union;
    'set-diff': typeof difference;
    'set-intersection': typeof intersection;
    'set-symmetric-difference': typeof symmetricDifference;
    keys: (map: PLHashMap<any>) => PLVector<PLString>;
    values: (map: PLHashMap<any>) => PLVector<any>;
    "hash-map": <T_1 extends PLBase>(...list: unknown[]) => PLHashMap<T_1>;
    sum: (list: PLVector<PLNumber>) => PLNumber;
    prod: (list: PLVector<PLNumber>) => PLNumber;
    intersperse: <T_2 extends PLBase>(separator: T_2, list: PLVector<T_2>) => PLVector<T_2>;
    join: (list: PLVector<PLString>) => PLString;
    'join-with': (separator: PLString, list: PLVector<PLString>) => PLString;
    'num-list': (separator: PLString, list: PLVector<PLNumber>) => PLString;
    head: <T_3 extends PLBase>(list: PLVector<T_3>) => T_3;
    reverse: <T_4 extends PLBase>(list: PLVector<T_4>) => PLVector<T_4>;
    slice: <T_5 extends PLBase>(list: PLVector<T_5>, start: PLNumber, end: PLNumber) => PLVector<T_5>;
    tail: <T_6 extends PLBase>(list: PLVector<T_6>) => PLVector<T_6>;
    "number-2-fraction": (accuracy: PLNumber, number: PLNumber) => PLFractionNumber;
    "fraction-2-number": (number: PLFractionNumber) => PLNumber;
    reciprocal: (fn: PLFractionNumber) => PLFractionNumber;
    modulo: typeof modulo;
    E: PLNumber;
    LN2: PLNumber;
    LN10: PLNumber;
    LOG2E: PLNumber;
    LOG10E: PLNumber;
    PI: PLNumber;
    SQRT1_2: PLNumber;
    SQRT2: PLNumber;
    abs: (x: PLNumber) => PLNumber;
    sign: (x: PLNumber) => PLNumber;
    min: (x: PLNumber, y: PLNumber) => PLNumber;
    max: (x: PLNumber, y: PLNumber) => PLNumber;
    floor: (x: PLNumber) => PLNumber;
    round: (x: PLNumber) => PLNumber;
    ceil: (x: PLNumber) => PLNumber;
    trunc: (x: PLNumber) => PLNumber;
    cbrt: (x: PLNumber) => PLNumber;
    sqrt: (x: PLNumber) => PLNumber;
    exp: (x: PLNumber) => PLNumber;
    pow: (x: PLNumber, y: PLNumber) => PLNumber;
    log: (x: PLNumber) => PLNumber;
    log2: (x: PLNumber) => PLNumber;
    log10: (x: PLNumber) => PLNumber;
    deg2rad: (x: PLNumber) => PLNumber;
    rad2deg: (x: PLNumber) => PLNumber;
    sin: (x: PLNumber) => PLNumber;
    asin: (x: PLNumber) => PLNumber;
    asinh: (x: PLNumber) => PLNumber;
    cos: (x: PLNumber) => PLNumber;
    acos: (x: PLNumber) => PLNumber;
    acosh: (x: PLNumber) => PLNumber;
    tan: (x: PLNumber) => PLNumber;
    atan: (x: PLNumber) => PLNumber;
    atan2: (x: PLNumber, y: PLNumber) => PLNumber;
    atanh: (x: PLNumber) => PLNumber;
    const: (fn: unknown) => () => unknown;
    negate: (a: Negate<any>) => PLBool;
    not: (a: Not) => PLBool;
    and: <T_7>(a: And<T_7>, b: T_7) => PLBool;
    or: <T_8>(a: Or<T_8>, b: T_8) => PLBool;
    '+': <T_9>(a: Add<T_9>, b: T_9) => T_9;
    '-': <T_10>(a: Subtract<T_10>, b: T_10) => T_10;
    '*': <T_11>(a: Multiple<T_11>, b: T_11) => T_11;
    '/': <T_12>(a: Divide<T_12>, b: T_12) => T_12;
    get: <Idx, Item extends PLBase>(data: Index<Idx, Item>, idx: Idx) => Item;
    count: (collection: Container<unknown>) => PLNumber;
    contains: typeof contains;
    map: typeof map;
    filter: typeof filter;
    reduce: typeof reduce;
    '==': <T_13>(a: PartialEq<T_13>, b: T_13) => PLBool;
    '!=': <T_14>(a: PartialEq<T_14>, b: T_14) => PLBool;
    '<': <T_15 extends PartialOrd<any>>(a: T_15, b: T_15) => PLBool;
    '<=': <T_16 extends PartialOrd<any> & PartialEq<any>>(a: T_16, b: T_16) => PLBool;
    '>': <T_17 extends PartialOrd<any>>(a: T_17, b: T_17) => PLBool;
    '>=': <T_18 extends PartialOrd<any> & PartialEq<any>>(a: T_18, b: T_18) => PLBool;
    typeof: (variable: Debug) => PLString;
    copy: <T_19 extends Copy<any>>(item: T_19) => T_19;
    'deep-copy': <T_20 extends Copy<any>>(item: T_20) => T_20;
    str: (value: SerializeToString) => PLString;
    'to-json': (value: any) => PLString;
};
declare const utils: {
    unboxing: (x: SerializeToJS<unknown>) => unknown;
};
declare const plBool: (value: boolean) => PLBool;
declare const plString: (value?: string) => PLString;
declare const plFractionNumber: (n: number, d: number) => PLFractionNumber;
declare const _default: {
    "number-2-fraction": (accuracy: PLNumber, number: PLNumber) => PLFractionNumber;
    "fraction-2-number": (number: PLFractionNumber) => PLNumber;
    reciprocal: (fn: PLFractionNumber) => PLFractionNumber;
};
declare const plHashMap: <T extends PLBase>(...list: unknown[]) => PLHashMap<T>;
declare const _default: {
    keys: (map: PLHashMap<any>) => PLVector<PLString>;
    values: (map: PLHashMap<any>) => PLVector<any>;
    "hash-map": <T extends PLBase>(...list: unknown[]) => PLHashMap<T>;
};
///
declare const assert: (val: boolean, msg: string) => boolean;
declare class StdRuntimeError extends Error {
    constructor(error: Error | string);
}
//import { Nothing } from '../maybe/Nothing'
declare function plVector<T extends PLBase>(...value: StrictArray<T>): PLVector<T>;
declare const _default: {
    sum: (list: PLVector<PLNumber>) => PLNumber;
    prod: (list: PLVector<PLNumber>) => PLNumber;
    intersperse: <T extends PLBase>(separator: T, list: PLVector<T>) => PLVector<T>;
    join: (list: PLVector<PLString>) => PLString;
    "join-with": (separator: PLString, list: PLVector<PLString>) => PLString;
    "num-list": (separator: PLString, list: PLVector<PLNumber>) => PLString;
    head: <T_1 extends PLBase>(list: PLVector<T_1>) => T_1;
    reverse: <T_2 extends PLBase>(list: PLVector<T_2>) => PLVector<T_2>;
    slice: <T_3 extends PLBase>(list: PLVector<T_3>, start: PLNumber, end: PLNumber) => PLVector<T_3>;
    tail: <T_4 extends PLBase>(list: PLVector<T_4>) => PLVector<T_4>;
};
export { identity, literals, runtime, utils, PLBool, PLNumber, PLFractionNumber, PLString, PLVector, PLHashMap, str, BoxedValue, toJSON, debugTypeOf, copy, deepCopy, _default, equals, notEquals, lessThen, lessOrEqual, greaterThen, greaterOrEqual, count, contains, slice, map, filter, reduce, not, and, or, negate, add, Subtract, subtract, multiple, divide, get, Copy, Debug, FromStr, FromJS, SerializeToString, SerializeToJS, Box, PartialOrd, PartialEq, Ordering, Iterable, Container, Index, Divide, Multiple, Add, Negate, Or, And, Not, plBool, plString, plFractionNumber, plHashMap, plNumber, assertNumeric, isScientific, parseDecimalString, parseScientificString, assert, StdRuntimeError, plVector };

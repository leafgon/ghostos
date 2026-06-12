export class Interpreter {
    constructor(options: any, literals: any);
    globals: Environment;
    currentEnv: Environment;
    lastLiteral: any;
    lastPrint: any;
    execLiteral: (literal: any, env: any) => any;
    options: any;
    interpret(program: any): any;
    evalFn(fn: any, args: any): any;
    execList(literal: any, env: any): any;
    getGlobalNames(): string[];
    clearEnv(): void;
}
export class Parser {
    constructor(scanner: any, literals?: {
        Bool: {
            parser: (x: any) => boolean;
            factory: BooleanConstructor;
        };
        Nothing: {
            parser: (x: any) => boolean;
            factory: () => never;
        };
        Int: {
            parser: (x: any) => number;
            factory: NumberConstructor;
        };
        Float: {
            parser: typeof parseFloat;
            factory: NumberConstructor;
        };
        String: {
            parser: (str: any) => any;
            factory: StringConstructor;
        };
        FractionNumber: {
            parser: (str: any) => any;
            factory: () => never;
        };
        Vector: {
            parser: () => never;
            factory: () => never;
        };
        HashMap: {
            parser: () => never;
            factory: () => never;
        };
    });
    scanner: any;
    literals: {
        Bool: {
            parser: (x: any) => boolean;
            factory: BooleanConstructor;
        };
        Nothing: {
            parser: (x: any) => boolean;
            factory: () => never;
        };
        Int: {
            parser: (x: any) => number;
            factory: NumberConstructor;
        };
        Float: {
            parser: typeof parseFloat;
            factory: NumberConstructor;
        };
        String: {
            parser: (str: any) => any;
            factory: StringConstructor;
        };
        FractionNumber: {
            parser: (str: any) => any;
            factory: () => never;
        };
        Vector: {
            parser: () => never;
            factory: () => never;
        };
        HashMap: {
            parser: () => never;
            factory: () => never;
        };
    };
    hadError: boolean;
    panicMode: boolean;
    current: Token;
    _program: any[];
    _errors: any[];
    dispatchMode: boolean;
    missingParser: (name: any) => void;
    parse(): {
        hasError: boolean;
        program: any[];
        errors: any[];
    };
    get program(): any[];
    get errors(): any[];
    advance(): void;
    consume(type: any, message: any): void;
    errorAtCurrent(message: any): void;
    errorAt(token: any, message: any): void;
    isEnd(): boolean;
    peek(): Token;
    expression(): any;
    makeLiteral(literalType: any, parserFn: any, token: any): Literal;
    advanceUntil(endToken: any): any;
    formatDispatch(): any;
    anonymousFunction(body: any): Literal;
    closeParentheses(tt: any): ")" | "}" | "]" | undefined;
    checkLiteralParsers(): void;
}
export class PocketLisp {
    constructor(options: any, literals: any);
    literals: any;
    interpreter: Interpreter;
    insituexecute(source: any): any;
    execute(source: any): any;
    evalFn(fn: any, args: any): any;
}
export class RuntimeError extends Error {
    constructor(error: any, position: any);
    stack: any;
    _position: any;
    get position(): any;
}
export namespace RuntimeError {
    let kind: string;
}
export class Scanner {
    constructor(source: any);
    source: any;
    start: number;
    current: number;
    line: number;
    isEnd(): boolean;
    advance(): any;
    peek(): any;
    peekNext(): any;
    makeToken(type: any): Token;
    makeStringToken(): Token;
    errorToken(message: any): Token;
    identifier(): Token;
    makeIdentifierToken(): Token;
    keyword(): Token;
    number(): Token;
    string(): Token;
    skipWhitespace(): number | undefined;
    scanToken(): Token;
    scanAllToken(): Token[];
}
export class SnippetPosition {
    constructor(source: any, startIndex: any, endIndex: any, line: any);
    source: any;
    startIndex: any;
    endIndex: any;
    line: any;
    offset: number | undefined;
    get start(): number;
    get end(): number;
    get length(): number;
    getLineOffset(): number;
}
export namespace SnippetPosition {
    let unknown: SnippetPosition;
}
export function simpleFunction(fn: any, arity: any): PLFunction;
declare class Environment {
    constructor(enclosing?: null);
    enclosing: any;
    values: any;
    locked: any;
    define(name: any, value: any, locked?: boolean): void;
    get(name: any): any;
    assign(name: any, value: any): any;
    getNames(): string[];
    get parent(): any;
}
declare class Token {
    constructor(type: any, value: any, position: any);
    type: any;
    value: any;
    position: any;
}
declare namespace Token {
    let INIT: Token;
}
declare class Literal {
    constructor(kind: any, value: any, position: any);
    kind: any;
    value: any;
    position: any;
}
declare class PLFunction {
    constructor(_fn: any, _arity: any, _resolveIds?: boolean, _toString?: string);
    _fn: any;
    _arity: any;
    _resolveIds: boolean;
    _toString: string;
    call(interpreter: any, env: any, args: any): any;
    get arity(): any;
    toString(): string;
    toJS(): string;
    debugTypeOf(): string;
}
declare namespace PLFunction {
    let kind_1: string;
    export { kind_1 as kind };
}
export {};

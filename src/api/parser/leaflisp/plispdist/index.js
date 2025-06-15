/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const isDigit = (c) => c !== undefined && c >= '0' && c <= '9';
// spark_dev_note: 16/Sept/2023 refactoring to allow '-' in dictionary key
const isAlpha = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || c == '.' || c == '-';
const isKeywordAlpha = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || c == '.' || c == '-' || c == ':';
const isSymbol = (c) => '=+-*/\\&%$_!<>?'.includes(c);

class SnippetPosition {
    constructor(source, startIndex, endIndex, line) {
        this.source = source;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.line = line;
        this.offset = undefined;
    }
    get start() {
        return this.startIndex - (this.line <= 1 ? 0 : this.getLineOffset());
    }
    get end() {
        return this.endIndex - (this.line <= 1 ? 0 : this.getLineOffset());
    }
    get length() {
        return this.endIndex - this.startIndex;
    }
    getLineOffset() {
        var _a;
        if (this.offset === undefined) {
            const re = new RegExp(`(\n)`, `mg`);
            let result = null;
            for (let i = 1; i < this.line; i++) {
                result = re.exec(this.source);
            }
            this.offset = (_a = result === null || result === void 0 ? void 0 : result.index) !== null && _a !== void 0 ? _a : 0;
        }
        return this.offset;
    }
}
SnippetPosition.unknown = new SnippetPosition('', -1, -1, -1);

var TokenType;
(function (TokenType) {
    TokenType[TokenType["Init"] = 0] = "Init";
    TokenType[TokenType["LeftParen"] = 1] = "LeftParen";
    TokenType[TokenType["RightParen"] = 2] = "RightParen";
    TokenType[TokenType["LeftBrace"] = 3] = "LeftBrace";
    TokenType[TokenType["RightBrace"] = 4] = "RightBrace";
    TokenType[TokenType["LeftSquare"] = 5] = "LeftSquare";
    TokenType[TokenType["RightSquare"] = 6] = "RightSquare";
    TokenType[TokenType["Dispatch"] = 7] = "Dispatch";
    TokenType[TokenType["True"] = 8] = "True";
    TokenType[TokenType["False"] = 9] = "False";
    TokenType[TokenType["Identifier"] = 10] = "Identifier";
    TokenType[TokenType["Keyword"] = 11] = "Keyword";
    TokenType[TokenType["String"] = 12] = "String";
    TokenType[TokenType["Integer"] = 13] = "Integer";
    TokenType[TokenType["Float"] = 14] = "Float";
    TokenType[TokenType["FractionNumber"] = 15] = "FractionNumber";
    TokenType[TokenType["Error"] = 16] = "Error";
    TokenType[TokenType["EOF"] = 17] = "EOF";
    TokenType[TokenType["Nothing"] = 18] = "Nothing";
})(TokenType || (TokenType = {}));
class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }
}
Token.INIT = new Token(TokenType.Init, '', new SnippetPosition('', 0, 0, 0));

class Scanner {
    constructor(source) {
        this.source = source;
        this.start = 0;
        this.current = 0;
        this.line = 1;
    }
    isEnd() {
        return this.source.length === this.current;
    }
    advance() {
        this.current += 1;
        return this.source[this.current - 1];
    }
    peek() {
        return this.source[this.current];
    }
    peekNext() {
        return this.source[this.current + 1];
    }
    makeToken(type) {
        const { start, line, current, source } = this;
        const isKeyword = type === TokenType.Keyword;
        const value = source.substring(isKeyword ? start + 1 : start, current);
        return new Token(type, value, new SnippetPosition(source, start, current, line));
    }
    makeStringToken() {
        const { start, line, current, source } = this;
        const str = source
            .substring(start + 1, current - 1)
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\')
            .replace(/\\"/g, '"');
        return new Token(TokenType.String, str, new SnippetPosition(source, start, current, line));
    }
    errorToken(message) {
        const { start, line, current, source } = this;
        return new Token(TokenType.Error, message, new SnippetPosition(source, start, current, line));
    }
    identifier() {
        for (;;) {
            const peek = this.peek();
            if (!(peek && (isAlpha(peek) || isDigit(peek) || isSymbol(peek)))) {
                break;
            }
            this.advance();
        }
        return this.makeIdentifierToken();
    }
    makeIdentifierToken() {
        const { start, current, source } = this;
        const id = source.substring(start, current);
        switch (id) {
            case 'true':
                return this.makeToken(TokenType.True);
            case 'false':
                return this.makeToken(TokenType.False);
            case 'null':
                return this.makeToken(TokenType.Nothing);
            default:
                return this.makeToken(TokenType.Identifier);
        }
    }
    keyword() {
        if (!isKeywordAlpha(this.peek()) && !isDigit(this.peek())) {
            return this.makeToken(TokenType.Identifier);
        }
        while (isKeywordAlpha(this.peek()) || isDigit(this.peek())) {
            this.advance();
        }
        return this.makeToken(TokenType.Keyword);
    }
    number() {
        while (isDigit(this.peek()))
            this.advance();
        if (this.peek() === '.' && isDigit(this.peekNext())) {
            this.advance();
            while (isDigit(this.peek()))
                this.advance();
            return this.makeToken(TokenType.Float);
        }
        else if (this.peek() === '/') {
            if (!isDigit(this.peekNext())) {
                return this.errorToken('Unterminated fraction number');
            }
            this.advance();
            while (isDigit(this.peek()))
                this.advance();
            return this.makeToken(TokenType.FractionNumber);
        }
        return this.makeToken(TokenType.Integer);
    }
    string() {
        while (this.peek() !== '"' && !this.isEnd()) {
            if (this.peek() === '\n')
                this.line += 1;
            if (this.peek() === '\\')
                this.advance();
            this.advance();
        }
        if (this.isEnd())
            return this.errorToken('Unterminated string');
        this.advance();
        return this.makeStringToken();
    }
    skipWhitespace() {
        let ws_count = 0;
        while (true) {
            const c = this.peek();
            switch (c) {
                case ' ':
                case '\r':
                case '\t':
                case ',':
                    this.advance();
                    break;
                case '\n':
                    this.line += 1;
                    this.advance();
                    break;
                case ';':
                    if (this.peekNext() === '#') {
                        this.advance();
                        this.advance();
                        while (this.peek() !== '#' && this.peekNext() !== ';' && !this.isEnd()) {
                            if (this.peek() === '\n')
                                this.line += 1;
                            this.advance();
                        }
                        this.advance();
                        this.advance();
                    }
                    else {
                        while (this.peek() !== '\n' && !this.isEnd())
                            this.advance();
                    }
                    break;
                default:
                    return;
            }
            ws_count += 1;
        }
        return ws_count;
    }
    scanToken() {
        const preceding_ws_count = this.skipWhitespace();
        this.start = this.current;
        if (this.isEnd()) {
            return this.makeToken(TokenType.EOF);
        }
        const char = this.advance();
        if (isDigit(char) || (char === '-' && isDigit(this.peek()))) {
            return this.number();
        }
        if ((isAlpha(char) || isSymbol(char)) && !isDigit(char)) {
            return this.identifier();
        }
        switch (char) {
            case '(':
                return this.makeToken(TokenType.LeftParen);
            case ')':
                return this.makeToken(TokenType.RightParen);
            case '{':
                return this.makeToken(TokenType.LeftBrace);
            case '}':
                return this.makeToken(TokenType.RightBrace);
            case '[':
                return this.makeToken(TokenType.LeftSquare);
            case ']':
                return this.makeToken(TokenType.RightSquare);
            case '#':
                return this.makeToken(TokenType.Dispatch);
            case ':':
                return this.keyword();
            case '"':
                return this.string();
        }
        return this.errorToken(`Unexpected character '${char}'.`);
    }
    scanAllToken() {
        const tokens = [];
        while (!this.isEnd()) {
            tokens.push(this.scanToken());
        }
        return tokens;
    }
}

var LiteralType;
(function (LiteralType) {
    LiteralType["Boolean"] = "bool";
    LiteralType["Integer"] = "int";
    LiteralType["Float"] = "float";
    LiteralType["FractionNumber"] = "fractionNumber";
    LiteralType["String"] = "string";
    LiteralType["Keyword"] = "keyword";
    LiteralType["Identifier"] = "identifier";
    LiteralType["List"] = "list";
    LiteralType["Nothing"] = "null";
})(LiteralType || (LiteralType = {}));
class Literal {
    constructor(kind, value, position) {
        this.kind = kind;
        this.value = value;
        this.position = position;
    }
}

class RuntimeError extends Error {
    constructor(error, position) {
        if (typeof error === 'string') {
            super(error);
        }
        else {
            super(error.message);
            this.stack = error.stack;
        }
        this._position = position;
    }
    get position() {
        return this._position;
    }
}
RuntimeError.kind = 'RuntimeError';

const identity = (x) => x;
const assert = (val, msg) => {
    if (val)
        throw new RuntimeError(msg);
    return true;
};
const assetParamLength = (args, expected, msg) => assert(args.length !== expected, msg || `Expected ${expected} argument${expected > 1 ? 's' : ''}, but got ${args.length}.`);
const assertParamType = (literal, ...types) => assert(types.find((t) => t === literal.kind) === undefined, `Invalid function parameter, actual: '${literal.kind}', expected: '${types.join(' or ')}'.`);
function reduceLiterals(literal, fn) {
    let acc = [];
    const walk = (literal) => {
        switch (literal.kind) {
            case LiteralType.Boolean:
            case LiteralType.Nothing:
            case LiteralType.Integer:
            case LiteralType.Float:
            case LiteralType.FractionNumber:
            case LiteralType.String:
            case LiteralType.Keyword:
            case LiteralType.Identifier:
                return (acc = fn(acc, literal));
            case LiteralType.List:
                literal.value.map(walk);
                return (acc = fn(acc, literal));
        }
    };
    walk(literal);
    return acc;
}

const notImplementedConstructor = (name) => () => {
    throw new RuntimeError(`${name} is not implemented.`);
};
const notImplementedLiteral = (name) => ({
    parser: () => {
        throw new RuntimeError(`${name} is not implemented.`);
    },
    factory: notImplementedConstructor(name),
});
const defaultLiterals = {
    Bool: {
        parser: (x) => x === 'true',
        factory: Boolean,
    },
    Nothing: {
        parser: (x) => x == 'null',
        factory: notImplementedConstructor('NULL'),
    },
    Int: {
        parser: (x) => parseInt(x, 10),
        factory: Number,
    },
    Float: {
        parser: parseFloat,
        factory: Number,
    },
    String: {
        parser: (str) => str,
        factory: String,
    },
    FractionNumber: {
        parser: (str) => str,
        factory: notImplementedConstructor('FractionNumber'),
    },
    Vector: notImplementedLiteral('Vector'),
    HashMap: notImplementedLiteral('HashMap'),
};

///
const FN_IDENTIFIER = 'fn';
const VECTOR_IDENTIFIER = 'Vector';
const MAP_IDENTIFIER = 'HashMap';
///
class Parser {
    constructor(scanner, literals = defaultLiterals) {
        this.scanner = scanner;
        this.literals = literals;
        this.hadError = false;
        this.panicMode = false;
        this.current = Token.INIT;
        this._program = [];
        this._errors = [];
        this.dispatchMode = false;
        this.missingParser = (name) => {
            this.errorAtCurrent(`Missing parser '${name}'.`);
        };
    }
    parse() {
        try {
            this.checkLiteralParsers();
            this.advance();
            while (!this.isEnd()) {
                const exp = this.expression();
                if (exp) {
                    this._program.push(exp);
                }
            }
            this.consume(TokenType.EOF, 'Expect end of program.');
        }
        finally {
            return {
                hasError: this.hadError,
                program: this.program,
                errors: this.errors,
            };
        }
    }
    get program() {
        return this._program;
    }
    get errors() {
        return this._errors;
    }
    ///
    advance() {
        while (true) {
            this.current = this.scanner.scanToken();
            if (this.current.type !== TokenType.Error)
                break;
            this.errorAtCurrent(this.current.value);
        }
    }
    consume(type, message) {
        if (this.current.type == type) {
            this.advance();
            return;
        }
        this.errorAtCurrent(message);
    }
    errorAtCurrent(message) {
        this.errorAt(this.current, message);
    }
    errorAt(token, message) {
        if (this.panicMode)
            return;
        this._errors.push({
            position: token.position,
            message,
        });
        this.hadError = true;
        throw new Error(message);
    }
    isEnd() {
        return this.peek().type === TokenType.EOF;
    }
    peek() {
        return this.current;
    }
    expression() {
        const token = this.current;
        const { Bool, FractionNumber, Int, Float, String, Nothing } = this.literals;
        switch (token.type) {
            case TokenType.True:
                return this.makeLiteral(LiteralType.Boolean, Bool.parser, token);
            case TokenType.False:
                return this.makeLiteral(LiteralType.Boolean, Bool.parser, token);
            case TokenType.Nothing:
                return this.makeLiteral(LiteralType.Nothing, Nothing.parser, token);
            case TokenType.Integer:
                return this.makeLiteral(LiteralType.Integer, Int.parser, token);
            case TokenType.Float:
                return this.makeLiteral(LiteralType.Float, Float.parser, token);
            case TokenType.FractionNumber:
                return this.makeLiteral(LiteralType.FractionNumber, FractionNumber.parser, token);
            case TokenType.String:
                return this.makeLiteral(LiteralType.String, String.parser, token);
            case TokenType.Identifier:
                return this.makeLiteral(LiteralType.Identifier, identity, token);
            case TokenType.Keyword:
                return this.makeLiteral(LiteralType.Keyword, String.parser, token);
            case TokenType.LeftParen:
                return new Literal(LiteralType.List, this.advanceUntil(TokenType.RightParen), token.position);
            case TokenType.LeftSquare:
                return new Literal(LiteralType.List, [
                    new Literal(LiteralType.Identifier, VECTOR_IDENTIFIER, token.position),
                    ...this.advanceUntil(TokenType.RightSquare),
                ], token.position);
            case TokenType.LeftBrace:
                return new Literal(LiteralType.List, [
                    new Literal(LiteralType.Identifier, MAP_IDENTIFIER, token.position),
                    ...this.advanceUntil(TokenType.RightBrace),
                ], token.position);
            case TokenType.Dispatch:
                return this.formatDispatch();
            default:
                this.errorAtCurrent(`Unknown token: '${token.value}'.`);
                return undefined;
        }
    }
    makeLiteral(literalType, parserFn, token) {
        const literal = new Literal(literalType, parserFn(this.current.value), token.position);
        this.advance();
        return literal;
    }
    advanceUntil(endToken) {
        const literals = [];
        this.advance();
        for (;;) {
            if (this.current.type === endToken || this.isEnd())
                break;
            const exp = this.expression();
            literals.push(exp);
        }
        this.consume(endToken, `Expected '${this.closeParentheses(endToken)}'.`);
        return literals;
    }
    formatDispatch() {
        this.advance();
        if (this.dispatchMode) {
            this.errorAtCurrent(`Nested dispatch expression not allowed.`);
        }
        this.dispatchMode = true;
        const expression = this.expression();
        if (!expression || expression.kind !== LiteralType.List) {
            this.errorAtCurrent(`List expression expected after dispatch, but get '${expression && expression.kind}'.`);
        }
        const body = expression;
        let newExpression = body;
        switch (body.value[0].value) {
            case MAP_IDENTIFIER:
                this.errorAtCurrent('Invalid dispatch: #{...}.');
                break;
            case VECTOR_IDENTIFIER:
                this.errorAtCurrent('Invalid dispatch: #[...].');
                break;
            default:
                newExpression = this.anonymousFunction(body);
        }
        this.dispatchMode = false;
        return newExpression;
    }
    anonymousFunction(body) {
        const numberOfArgs = reduceLiterals(body, (acc, l) => {
            if (l.kind === LiteralType.Identifier) {
                const ll = l;
                if (/^%\d+$/.test(ll.value)) {
                    acc.push(parseInt(ll.value.substr(1)));
                }
            }
            return acc;
        })
            .sort((a, b) => a - b)
            .reverse()[0];
        const argsIds = Array.from({ length: numberOfArgs }, (_value, key) => new Literal(LiteralType.Identifier, `%${key + 1}`, body.position));
        const args = new Literal(LiteralType.List, [new Literal(LiteralType.Identifier, VECTOR_IDENTIFIER, body.position), ...argsIds], body.position);
        return new Literal(LiteralType.List, [new Literal(LiteralType.Identifier, FN_IDENTIFIER, body.position), args, body], body.position);
    }
    closeParentheses(tt) {
        switch (tt) {
            case TokenType.RightParen:
                return ')';
            case TokenType.RightBrace:
                return '}';
            case TokenType.RightSquare:
                return ']';
        }
    }
    checkLiteralParsers() {
        const { Bool, FractionNumber, Int, Float, String, Nothing } = this.literals;
        Bool.parser || this.missingParser('Bool');
        Int.parser || this.missingParser('Int');
        Float.parser || this.missingParser('Float');
        FractionNumber.parser || this.missingParser('FractionNumber');
        String.parser || this.missingParser('String');
        Nothing.parser || this.missingParser('Nothing');
    }
}

const NATIVE_FN_NAME = '<native function>';

class PLFunction {
    constructor(_fn, _arity, _resolveIds = true, _toString = NATIVE_FN_NAME) {
        this._fn = _fn;
        this._arity = _arity;
        this._resolveIds = _resolveIds;
        this._toString = _toString;
    }
    call(interpreter, env, args) {
        const argDiff = this.arity - args.length;
        const argValues = this._resolveIds
            ? args.map((arg) => (arg.kind === LiteralType.Identifier ? interpreter.execLiteral(arg, env) : arg))
            : args;
        if (this.arity === -1 || argDiff === 0) {
            // Function accept arbitrary amount of arguments (-1) or got the right the expected amount  number of args
            return this._fn(interpreter, env, argValues);
        }
        else if (argDiff > 0) {
            // Got less args -> create a new function with the remaining args
            const curryFn = (interpreter, env, argsRest) => {
                return this._fn(interpreter, env, [...argValues, ...argsRest]);
            };
            return new PLFunction(curryFn, argDiff, this._resolveIds, this.toString());
        }
        else {
            // Got more args
            // the return value must be callable otherwise it will fails
            const result = this._fn(interpreter, env, argValues.slice(0, this.arity));
            if (result instanceof PLFunction) {
                return result.call(interpreter, env, argValues.slice(this.arity));
            }
            else {
                return assert(true, `Expected ${this.arity} argument${this.arity > 1 ? 's' : ''}, but got ${args.length}.`);
            }
        }
    }
    get arity() {
        return this._arity;
    }
    toString() {
        return this._toString === NATIVE_FN_NAME ? NATIVE_FN_NAME : `<${this._toString} function>`;
    }
    toJS() {
        return this.toString();
    }
    debugTypeOf() {
        return PLFunction.kind;
    }
}
PLFunction.kind = 'Function';
const createFunction = (options) => {
    var _a;
    return new PLFunction(options.fn, options.arity, (_a = options.resolveArgsIdentifiers) !== null && _a !== void 0 ? _a : true, options.name || options.fn.name);
};
const simpleFunction = (fn, arity) => createFunction({
    name: fn.name,
    arity: arity !== null && arity !== void 0 ? arity : fn.length,
    fn: (interpreter, env, parameters) => {
        const evaluatedParams = parameters.map((p) => interpreter.execLiteral(p, env), interpreter);
        return fn.apply(interpreter, evaluatedParams);
    },
    resolveArgsIdentifiers: true,
});

const constFn = createFunction({
    name: 'const',
    arity: 1,
    fn: (_interpreter, _env, args) => {
        assert(args.length !== 1, `Const expected 1 argument, but got ${args.length}.`);
        const [value] = args;
        return createFunction({
            name: 'const',
            arity: -1,
            fn: (interpreter, env) => {
                return interpreter.execLiteral(value, env);
            },
        });
    },
});

const def = createFunction({
    name: 'def',
    arity: 2,
    resolveArgsIdentifiers: false,
    fn: (interpreter, env, args) => {
        assetParamLength(args, 2);
        const [id, value] = args;
        assertParamType(id, LiteralType.Identifier);
        const evaluatedValue = interpreter.execLiteral(value, env);
        env.define(id.value, evaluatedValue);
        return evaluatedValue;
    },
});

const defn = createFunction({
    name: 'defn',
    arity: -1,
    resolveArgsIdentifiers: false,
    fn: (interpreter, env, args) => {
        assetParamLength(args, 3);
        const [id, fnArgs, body] = args;
        const def = env.get('def');
        return def.call(interpreter, env, [
            id,
            new Literal(LiteralType.List, [new Literal(LiteralType.Identifier, FN_IDENTIFIER, SnippetPosition.unknown), fnArgs, body], SnippetPosition.unknown),
        ]);
    },
});

const ifFn = createFunction({
    name: 'if',
    arity: 3,
    fn: (interpreter, env, args) => {
        assetParamLength(args, 3);
        const [condition, thenBranch, elseBranch] = args;
        const conditionEval = interpreter.execLiteral(condition, env);
        const conditionRes = interpreter.options.utils.unboxing(conditionEval);
        if (conditionRes === true) {
            return interpreter.execLiteral(thenBranch, env);
        }
        if (conditionRes === false) {
            return interpreter.execLiteral(elseBranch, env);
        }
        throw new RuntimeError(`Expected boolean value in the if condition, but get '${conditionRes}'`);
    },
});

const caseFn = createFunction({
    arity: -1,
    name: 'case',
    fn: (interpreter, env, args) => {
        assert(args.length < 2, `Case expected at least 2 argument, but got ${args.length}.`);
        const [condition, ...cases] = args;
        const conditionValue = interpreter.execLiteral(condition, env);
        for (const caseBranch of cases) {
            assertParamType(caseBranch, LiteralType.List);
            const listContent = caseBranch.value;
            assetParamLength(listContent, 2, `Case branch expected list with ${2} items, but got ${listContent.length}`);
            const [caseLiteral, caseResult] = listContent;
            const caseFn = interpreter.execLiteral(caseLiteral, env);
            const unboxedCaseFn = interpreter.options.utils.unboxing(caseFn);
            assert(!(unboxedCaseFn === 'else' || caseFn instanceof PLFunction), 'Case branch must start with a function or :else.');
            let caseValue = false;
            if (unboxedCaseFn === 'else') {
                caseValue = true;
            }
            else {
                const caseFnValue = interpreter.evalFn(caseFn, [conditionValue]);
                const caseFnValueUB = interpreter.options.utils.unboxing(caseFnValue);
                assert(!(typeof caseFnValueUB === 'boolean'), 'Case branch function must return with Bool.');
                caseValue = caseFnValueUB;
            }
            if (caseValue) {
                return interpreter.execLiteral(caseResult, env);
            }
        }
        assert(true, `At least one of the case branch must match with the condition: ${conditionValue}`);
    },
});

class Environment {
    constructor(enclosing = null) {
        this.enclosing = enclosing;
        this.values = Object.create(null);
        this.locked = Object.create(null);
    }
    define(name, value, locked = false) {
        if (!this.locked[name]) {
            this.values[name] = value;
            if (locked)
                this.locked[name] = true;
        }
        else {
            throw new RuntimeError(`'${name}' is locked and it is not re-definable.`);
        }
    }
    get(name) {
        if (this.values[name]) {
            return this.values[name];
        }
        else if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }
        else {
            throw new RuntimeError(`Undefined identifier: '${name}'.`);
        }
    }
    assign(name, value) {
        if (this.values[name]) {
            this.values[name] = value;
        }
        else if (this.enclosing !== null) {
            return this.enclosing.assign(name, value);
        }
        else {
            throw new RuntimeError(`Undefined identifier: '${name}'.`);
        }
    }
    getNames() {
        return Object.keys(this.values);
    }
    get parent() {
        return this.enclosing;
    }
}

const fn = createFunction({
    name: 'fn',
    arity: -1,
    resolveArgsIdentifiers: false,
    fn: (_interpreter, env, args) => {
        assetParamLength(args, 2);
        const [fnArgNamesList, fnBody] = args;
        assertParamType(fnArgNamesList, LiteralType.List);
        const fnArgNames = fnArgNamesList.value.slice(1);
        fnArgNames.map((id) => assertParamType(id, LiteralType.Identifier));
        return createFunction({
            name: 'lambda',
            arity: fnArgNames.length,
            fn: (interpreter, callEnv, fnArgs) => {
                assetParamLength(fnArgs, fnArgNames.length);
                const closure = new Environment(env);
                fnArgNames.forEach((id, idx) => {
                    const arg = interpreter.execLiteral(fnArgs[idx], callEnv);
                    closure.define(id.value, arg);
                });
                const result = interpreter.execLiteral(fnBody, closure);
                interpreter.clearEnv();
                return result;
            },
        });
    },
});

const doFn = createFunction({
    name: 'do',
    arity: -1,
    fn: (interpreter, env, args) => {
        assert(args.length < 1, `Expected at least 1 argument, but got ${args.length}.`);
        return args.map((literal) => interpreter.execLiteral(literal, env)).pop();
    },
});

const sideEffectFn = createFunction({
    name: 'side-effect',
    arity: -1,
    fn: (interpreter, env, args) => {
        assert(args.length < 1, `Eff expected at least 1 argument, but got ${args.length}.`);
        const [fn, ...fnArgs] = args;
        const fnEval = interpreter.execLiteral(fn, env);
        assert(!(fnEval instanceof PLFunction), 'Eff first parameter must be a function.');
        return createFunction({
            name: 'side-effect',
            arity: -1,
            fn: (interpreter) => {
                return interpreter.evalFn(fnEval, fnArgs);
            },
        });
    },
});

const defaultOptions = {
    stdout: undefined,
    lockedGlobals: true,
    globals: {},
    utils: {
        unboxing: identity,
    },
};
///
const DATA_STRUCT_CONSTRUCTORS = [VECTOR_IDENTIFIER, MAP_IDENTIFIER];
class Interpreter {
    constructor(options, literals) {
        this.globals = new Environment();
        this.currentEnv = this.globals;
        this.lastLiteral = undefined;
        this.lastPrint = undefined;
        this.execLiteral = (literal, env) => {
            this.currentEnv = env;
            this.lastLiteral = literal;
            switch (literal.kind) {
                case LiteralType.Boolean:
                case LiteralType.Integer:
                case LiteralType.Float:
                case LiteralType.FractionNumber:
                case LiteralType.String:
                case LiteralType.Keyword:
                case LiteralType.Nothing:
                    return literal.value;
                case LiteralType.Identifier:
                    return env.get(literal.value);
                case LiteralType.List:
                    return this.execList(literal, env);
                default:
                    return literal;
            }
        };
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
        const { stdout, globals, lockedGlobals } = this.options;
        const plLiterals = Object.assign(Object.assign({}, defaultLiterals), literals);
        Object.keys(plLiterals).forEach((key) => {
            const fn = plLiterals[key].factory;
            const arity = DATA_STRUCT_CONSTRUCTORS.includes(key) ? -1 : fn.length;
            this.globals.define(key, simpleFunction(fn, arity));
        });
        this.globals.define('print', simpleFunction((arg) => { var _a; return (stdout || console.log)(arg, (_a = this.lastPrint) === null || _a === void 0 ? void 0 : _a.position); }, -1));
        this.globals.define('const', constFn);
        this.globals.define('def', def);
        this.globals.define('defn', defn);
        this.globals.define('if', ifFn);
        this.globals.define('case', caseFn);
        this.globals.define('fn', fn);
        this.globals.define('do', doFn);
        this.globals.define('side-effect', sideEffectFn);
        Object.keys(globals).forEach((key) => {
            const value = globals[key];
            let item = value;
            if (typeof value === 'function' && value.toString() !== NATIVE_FN_NAME) {
                item = simpleFunction(value);
            }
            this.globals.define(key, item, lockedGlobals);
        });
    }
    interpret(program) {
        let returnVal = undefined;
        this.lastLiteral = program[0];
        try {
            for (const literal of program) {
                this.lastLiteral = literal;
                returnVal = this.execLiteral(literal, this.globals);
            }
        }
        catch (error) {
            if (error['king'] === RuntimeError.kind) {
                throw error;
            }
            else {
                throw new RuntimeError(error, this.lastLiteral.position);
            }
        }
        return returnVal;
    }
    evalFn(fn, args) {
        return fn.call(this, this.currentEnv, args);
    }
    execList(literal, env) {
        const [fnId, ...args] = literal.value;
        if (fnId.value === 'print') {
            this.lastPrint = fnId;
        }
        const fn = this.execLiteral(fnId, env);
        if (typeof fn.call === 'function') {
            return fn.call(this, env, args);
        }
        throw new RuntimeError(`'${fn}' is not a function`, literal.position);
    }
    getGlobalNames() {
        return this.globals.getNames();
    }
    clearEnv() {
        if (this.currentEnv.parent !== null) {
            this.currentEnv = this.currentEnv.parent;
        }
    }
}

var ErrorTypes;
(function (ErrorTypes) {
    ErrorTypes["Parser"] = "Parser";
    ErrorTypes["Runtime"] = "Runtime";
})(ErrorTypes || (ErrorTypes = {}));
class PocketLisp {
    constructor(options, literals) {
        this.literals = literals;
        this.interpreter = new Interpreter(options, literals);
    }
    insituexecute(source) {
        const scanner = new Scanner(source);
        const parser = new Parser(scanner, this.literals);
        const parserResult = parser.parse();
        if (parserResult.hasError) {
            throw { type: ErrorTypes.Parser, errors: parserResult.errors };
        }
        else {
            try {
                return this.interpreter.interpret(parserResult.program);
            }
            catch (error) {
                throw {
                    type: ErrorTypes.Runtime,
                    errors: [{ message: error.message, position: error.position }],
                };
            }
        }
    }
    execute(source) {
        return __awaiter(this, void 0, void 0, function* () {
            const scanner = new Scanner(source);
            const parser = new Parser(scanner, this.literals);
            const parserResult = parser.parse();
            if (parserResult.hasError) {
                throw { type: ErrorTypes.Parser, errors: parserResult.errors };
            }
            else {
                try {
                    this.interpreter.interpret(parserResult.program);
                }
                catch (error) {
                    throw {
                        type: ErrorTypes.Runtime,
                        errors: [{ message: error.message, position: error.position }],
                    };
                }
            }
        });
    }
    evalFn(fn, args) {
        return this.interpreter.evalFn(fn, args);
    }
}

export { Interpreter, Parser, PocketLisp, RuntimeError, Scanner, SnippetPosition, simpleFunction };
//# sourceMappingURL=index.mjs.map

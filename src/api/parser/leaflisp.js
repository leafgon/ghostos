/*
 * author: spark@leautomaton.com
 * date: 5 Jan 2022
 * Implementation for parsing a minimal Lisp dialect dubbed 'LEAFlisp' into javascript
 * 
 * References:
 * Based on lispy: https://norvig.com/lispy.html
 * Based on https://github.com/inexorabletash/jisp
 */

const _version = '1.0';

const leaflisp = (runtime_env) => {

  function truth(t) { return Array.isArray(t) ? t.length : t; }

  function _eval(x, env) {
    env = env || runtime_env;
    const xtype = typeof x;
    if (xtype === 'string') // all strings are symbols; variable reference
      return env.find(x).get(x);
    if (!Array.isArray(x)) 
    {
      if (xtype === 'object') { // a non-array object is a dictionary
        let d = {}; // d for dictionary
        //console.log('_eval dictionary: ', JSON.stringify(x));
        Object.entries(x).map(([key, value]) => { d[key] = _eval(value, env); })
        return d;
      }
      // constant literal
      return x;
    }
    if (x[0] === 'quote') // (quote exp)
      return x.slice(1).join(' ');
    if (x[0] === 'if') // (if test conseq alt)
      return _eval(truth(_eval(x[1], env)) ? x[2] : x[3], env);
    if (x[0] === 'set!') // (set! var exp)
      return env.find(x[1]).set(x[1], _eval(x[1], env));
    if (x[0] === 'define') // (define var exp)
      return env.set(x[1], _eval(x[2], env));
    if (x[0] === 'lambda') // (lambda (var*) exp)
      return function() { return _eval(x[2], new Env(x[1], arguments, env)); };
    if (x[0] === 'begin') { // (begin exp*)
      let val;
      for (let i = 1; i < x.length; ++i)
        val = _eval(x[i], env);
      return val;
    }
    // (proc exp*)
    let exps = x.map(function(exp) { return _eval(exp, env); });
    let proc = exps.shift();
    //console.log('proc: ', proc, ', exp: ', exps);
    //console.log('proc type: ', typeof(proc));
    return typeof(proc) === 'function' ? proc.apply(null, exps) : proc;
  }

  function parse(s) {
    return read_from(tokenize(s));
  }

  function tokenize(s) {
    return s.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/\{/g, ' { ').replace(/\}/g, ' } ').replace(/^\s+|\s+$/g, '').split(/\s+/g);
  }

  function read_from(tokens) {
    if (!tokens.length)
      throw new SyntaxError('unexpected EOF while reading');
    let token = tokens.shift();
    if ('(' === token) {
      let l = [];
      while (tokens[0] !== ')') {
        l.push(read_from(tokens));
      }
      tokens.shift(); // ')'
      return l;
    } else if ('{' === token) {
      let d = {}; // d for dictionary
      while (tokens[0] !== '}')  {
        let protokey = tokens.shift(); // expects a dictionary key of the form :key
        let key = (protokey[0] === ':') ? protokey.slice(1) : null;
        if (!key) {
          throw new SyntaxError('unexpected key: ' + protokey)
        }
        d[key] = read_from(tokens);
      }
      tokens.shift(); // '}'
      return d;
    } else if ('}' === token) {
      throw new SyntaxError('unexpected )');
    } else if (')' === token) {
      throw new SyntaxError('unexpected )');
    } else {
      return atom(token);
    }
  }

  function atom(token) {
    let number = Number(token);
    if (!isNaN(number) || token === 'NaN')
      return number;
    return String(token);
  }

  function to_string(exp) {
    if (Array.isArray(exp))
      return '(' + exp.map(to_string).join(' ') + ')';
    return String(exp);
  }

  function repl(str) {
    //console.log('repl: ' + str);
    let result = _eval(parse(str));
    //console.log('repl result: ' + result);
    //return result === undefined ? undefined : to_string(result);
    return result === undefined ? undefined : result;
  }

  //global.repl = repl;
  return repl;

};
//}(global));

// constructor function for a runtime leaflisp env to be attached to a leaflisp parser, invoked by new Env(...)
function Env(params, args, outer) {
  this.outer = outer;
  this.dict = Object.create(null);
  this.get = function(v) { return this.dict['$'+v]; };
  this.set = function(v, val) { this.dict['$'+v] = val; };
  this.find = function(v) {
    if (('$'+v) in this.dict)
      return this;
    return this.outer ? this.outer.find(v) : null;
  };

  if (params && args) {
    for (let i = 0; i < params.length; ++i)
      this.set(params[i], args[i]);
  }
}


//let global_env = new Env();
let runtime_env = new Env();
//const sortedStringify = (x, isfirst=true) =>
//{
//  return (isfirst ? JSON.stringify(Array.isArray(x) ? x.map(x2 => sortedStringify(x2, false)).sort() : x) : (Array.isArray(x) ? x.map(x2 => sortedStringify(x2, false)).sort() : x));
//};

/*
 * stringifiedSort() stringifies all objects following a recursive sort.
 */
const sortedStringify = (x, isfirst=true) => {
  const inputtype = typeof(x);
  return ((inputtype === 'object') ? (isfirst ? JSON.stringify(Object.entries(x).map(x2=> [x2[0], sortedStringify(x2[1], false)]).sort()) :
    (Object.entries(x).map(x2=> [x2[0], sortedStringify(x2[1], false)]).sort())) : 
    JSON.stringify(x));
};

let env_init = {
  '+': function() { return [].reduce.call(arguments, function(a, b) { return a + b; }); },
  '-': function(a, b) { return a-b; },
  '*': function() { return [].reduce.call(arguments, function(a, b) { return a * b; }); },
  '/': function(a, b) { return a/b; },
  '%': function(a, b) { return a%b; },
  'and': function(a, b) { return a && b; },
  'or': function(a, b) { return a || b; },
  'not': function(a) { return !a; },
  '>': function(a, b) { return a > b; },
  '<': function(a, b) { return a < b; },
  '>=': function(a, b) { return a >= b; },
  '<=': function(a, b) { return a <= b; },
  '=': function(a, b) { return a == b; },
  ':': function(a, b) { return b[a]; }, 
  '...': function(a, b) { 
    const result = {...a}; 
    Object.entries(b).forEach(([key, val]) => {result[key] = val}); 
    return result;
  },
  'in?': function(a, b) {
    //console.log('in? called with ', JSON.stringify(a), JSON.stringify(b)); 
    //console.log('in? called with ', a, b); 
    const isarray = Array.isArray(a);
    return Object.entries(a).some(  // some() would return true as soon as an entry evaluates to be so, otherwise return false
      ([key, x]) => {
        let xobj = {};
        xobj[key] = x;
        //console.log('sortedStringify(x): ', sortedStringify(x));
        //console.log('sortedStringify([key, x]): ', sortedStringify(xobj));
        //console.log('sortedStringify(b): ', sortedStringify(b));
        return isarray ? (sortedStringify(x) === sortedStringify(b)) : (sortedStringify(xobj) === sortedStringify(b)); // test for equality
      }
    );
  },
  'equal?': function(a, b) { return a === b; },
  'eq?': function(a, b) { return a === b; },
  'length': function(a) { return a.length; },
  'cons': function(a, b) { return [a].concat(b); },
  'car': function(a) { return a[0]; },
  'cdr': function(a) { return a.slice(1); },
  'append': function(a, b) { return a.concat(b); },
  //'list': function() { console.log('list called with ', JSON.stringify(arguments)); return [].slice.call(arguments); },
  'list': function() { return [].slice.call(arguments); },
  'list?': function(a) { return Array.isArray(a); },
  'null?': function(a) { return Array.isArray(a) && !a.length; },
  'symbol?': function(a) { return typeof a === 'string'; },
  'MathPI': Math.PI,
  'MathE': Math.E,
  'MathLN10': Math.LN10,
  'MathLN2': Math.LN2,
  'MathLOG10E': Math.LOG10E,
  'MathLOG2E': Math.LOG2E,
  'MathSQRT2': Math.SQRT2,
  'False': false,
  'True': true,
  'Null': null
};
Object.keys(env_init).forEach(function(key) {
  runtime_env.set(key, env_init[key]);
});
['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp',
  'floor', 'log', 'log10', 'log2', 'max', 'min', 'pow', 'random', 'round', 'sin',
  'sqrt', 'tan'].forEach(function(n) {
  runtime_env.set(n, Math[n]);
});

const lispparser = leaflisp(runtime_env);

function processLEAFlisp(str) {
  // convert js into leaflisp 
  const parseInput = (x, isfirst=true) => {
    const inputtype = typeof(x); // type of the value
    //console.log('input type: ', inputtype);
    return (
      inputtype === 'string' ? `(quote ${x})` : 
//      (inputtype === 'object' ? (isfirst ? `${Object.entries(x[1]).map(([key, value]) => parseInput(value, false)).join(' ')}` : `(list ${Object.entries(x[1]).map(([key, value]) => parseInput(value, false)).join(' ')})`) :
      (inputtype === 'object' ? 
        (Array.isArray(x) ? ((isfirst ? '(list ' : '(list ') + (`${x.map((value) => parseInput(value, false)).join(' ')}`) + (isfirst ? ')' : ')')) :
                            ((isfirst ? '{' : '{') + (`${Object.entries(x).map(([key, value]) => ':'+key + ' ' + parseInput(value, false)).join(' ')}`) + (isfirst ? '}' : '}'))) :
      (inputtype === 'boolean' ? (x ? 'True' : 'False') :
      (inputtype === 'number' ? x :
      'Null' // a catch-all js to leaflisp conversion including undefined types
    ))));
  };

  return (...input) => { // input is an array of variable number of entries
    try {
      //console.log('processLEAFlisp() in: ' + input);
      // input is a list of input args, the following reduce() call returns a space separated juxtaposition of arguments for lisp compatibility
      // e.g. ['hello', 'world'] would be reduced to a string 'hello world '
      const lispexpression = input ? 
//          console.log('processLEAFlisp: ' + Array.isArray(input));
//          const parsedinput = `(list ${(Array.isArray(input) ? input : [input]).map(
//            x => parseInput(x, true)
//          ).join(' ')})`;
//          console.log('parsedinput: ', JSON.stringify(parsedinput));
//          return `(${str} ${parsedinput})`;
          //`(${str} (list ${(Array.isArray(input) ? input : [input]).map(
          //  (x) => parseInput(x)
          //).join(' ')}))`
          `(${str} ${input.reduce((_prev,_arg) => _prev+parseInput(_arg)+' ','')})` 
          : str;
      //console.log('lispexpression: ' + lispexpression);
      // (lambda (x) (in? x (list 3 (list 1 (quote world2)) (quote world)))) (list 1 (quote hello) (list (quote world) (list 1 (quote world2)) 3))
      //var out = repl(str);
      let out = lispparser(lispexpression);
      //console.log("out: " + out);
      //if (out === undefined)
      //  return;
      //else
      if (out)
        return out;
      else
        return false;
    } catch (e) {
      console.error('Error in lisp statement: ' + str, e);
      return false;
    }
  };
}
function processStaticLEAFlisp(str) {
  try {
    //console.log(str);
    //var out = repl(str);
    let out = lispparser(str);
    //console.log("out: " + JSON.stringify(out));
    if (out)
      return out;
    else
      return false;
  } catch (e) {
    console.error('Error in lisp statement: ' + str, e);
    return false;
  } 
}

export { processLEAFlisp, processStaticLEAFlisp }

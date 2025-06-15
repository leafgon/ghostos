import { PocketLisp } from '../../../parser/leaflisp/plispdist';//pocket-lisp';
import { literals, runtime, utils, PLNumber, PLVector, PLHashMap, PLString, plHashMap, plString } from '../../../parser/leaflisp/plispstdlib';
import { Parser } from '../../../parser/leaflisp/plispdist';
import { Scanner } from '../../../parser/leaflisp/plispdist';
import { Interpreter } from '../../../parser/leaflisp/plispdist';
//import { InterpreterOptions } from '../../../parser/leaflisp/plispdist'

const interpret = (src, options) =>
  new Interpreter(options).interpret(new Parser(new Scanner(src)).parse().program);

describe('leaflisp', () => {
    describe('test out the concept of using stdin/stdout', () => {
        const fakejsinput = {hello: "world"};
        const fakeplinput = new PLHashMap([new PLString("hello"), "world"]);
        console.log("plhashmap:", fakeplinput);

        // convert js into leaflisp 
        const parseInput = (x, isfirst=true) => {
            const inputtype = typeof(x); // type of the value
            //console.log('input type: ', inputtype);
            return (
            inputtype === 'string' ? `"${x}"` : 
        //      (inputtype === 'object' ? (isfirst ? `${Object.entries(x[1]).map(([key, value]) => parseInput(value, false)).join(' ')}` : `(list ${Object.entries(x[1]).map(([key, value]) => parseInput(value, false)).join(' ')})`) :
            (inputtype === 'object' ? 
                (Array.isArray(x) ? ((isfirst ? '[' : '[') + (`${x.map((value) => parseInput(value, false)).join(' ')}`) + (isfirst ? ']' : ']')) :
                                    ((isfirst ? '{' : '{') + (`${Object.entries(x).map(([key, value]) => ':'+key + ' ' + parseInput(value, false)).join(' ')}`) + (isfirst ? '}' : '}'))) :
            (inputtype === 'boolean' ? (x ? 'True' : 'False') :
            (inputtype === 'number' ? x :
            'Null' // a catch-all js to leaflisp conversion including undefined types
            ))));
        };

        //const parsedinput = parseInput({hello: [{lalo: {property: "full of shit"}}]});
        const parsedinput = parseInput(1);
        console.log("parseInput():", parsedinput);

        //console.log("plhashmap unboxing:", utils.unboxing(fakeplinput));
        //console.log("plhashmap tojs:", fakeplinput.toJS());
        it('test simple lisp construct', async () => {
            const stdin = (x) => x;
            const lispoptions = {
                globals: {
                    ...runtime, 
                    stdin: (x) => x,
                    //map: (x, y) => y.map(_ => x),
                    //print: x => console.log(utils.unboxing(x)),
                    return: (val) => {return val }, //expect(utils.unboxing(val)).toBe(3)}, 
                    //"+": (a,b) => a+b,
                },
                utils
            }
            const pl = new PocketLisp(
                lispoptions,
                literals
            );
            const run = sourceCode => {
                try {
                    //return pl.insituexecute(`(return (${sourceCode} ${parsedinput}))`)
                    const result = pl.insituexecute(sourceCode);
                    return (result instanceof PLHashMap) ? result.toJSON() : result.toJS();
                } catch (e) {
                    for (let err of e.errors) {
                        const msg = e.type === 'Parser' ? `line: ${err.line} - ${err.message}` : err.message
                        console.log(msg)
                    }
                }
            }
            //await pl.execute('(stdout (+ 1 2))')
            try {
                //await run(`(print (map (side-effect random) [1 2 3]))`)
                //const result = run(`(stdout (get {:hello "world"} "hello"))`);
                //const result = run(`(return {:hello [{:hello "world"} "is" {:cond "descending"} {:lalo {:property "full of shit"}}]})`);
                const result = run(`(return ((fn [x] (+ x 1)) ${parsedinput}))`);
                const result2 = run(`(return {:hello [{:hello "world"} {:is "never"} {:cond "descending"} {:lalo {:property "full of shit"}}]})`);
                console.log('lisp execution done:', JSON.stringify(result));
                console.log('lisp execution done:', JSON.stringify(result2));
                //await run(`(stdout (map (side-effect random) [1 2 3]))(print [1 2 3])`)
            }
            catch (err) {
                console.log(err);
            }
            //interpret(`(get [1 2 3] 0)`, lispoptions);
            //interpret(`(print 1)`, lispoptions);
            //interpret(`(print (map (side-effect random) [1 2 3]))`, lispoptions);
            //interpret(`(stdout (+ 1 2))`, lispoptions);
        })

        it('should be able to process stdin/stdout along with a chunk of lisp code', async () => {
            const stdin = (x) => x;
            const pl = new PocketLisp({
                    globals: {
                        ...runtime, 
                        stdin: (x) => x,
                        map: (x, y) => y.map(_ => x),
                        //stdout: (val) => {expect(unboxing(val)).toBe((new PLVector([new PLNumber(1, 0), new PLNumber(2,0)]))._value); return val},
                        stdout: (val) => {expect(utils.unboxing(val)).toBe([1, 2]); return val},
                    },
                    utils
                },
                literals
            )
            await pl.execute('(def hello (slice [1 2 3] 0 2))(print hello)(stdout hello)')
        })
    })
})
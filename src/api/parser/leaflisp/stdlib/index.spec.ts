import { PocketLisp } from 'pocket-lisp';
import { literals, runtime, utils } from '.';
import { unboxing } from './fn/common';

describe('stdlib', () => {
  it('testing some leaflisp constructs', () => {
    
    const tests = [
      { input: '(print (get [1 2 3] 0))', output: 1 },
      { input: '(print (get {:hel "hello" :wo "world"} :hel))', output: "hello"},
      { input: '(print (range 1 3 1))', output: [1,2,3]},
      { input: '(print (get {:hel "hello" :wo "world"} :hel2))', output: "hello"}
//      { input: '(print 1)', output: 1 },
    ];

    const pocketLisp = (expectedVal: any) => new PocketLisp(
      {
        globals: {
          ...runtime,
          print: (val: any) => {
            expect(unboxing(val)).toEqual(expectedVal)
          },
        },
        stdout: value => console.log(value, false),
        utils
      },
      literals
    );

    tests.map(({ input, output }) => {

      const run = async (expr: any) => {
        try {
          await pocketLisp(output).execute(expr);
        } catch (e: any) {
          for (let err of e.errors) {
            const msg = e.type === 'Parser' ? `line: ${err.line} - ${err.message}` : err.message;
            console.log(msg, true);
          }
        }
      };

      run(input);
    });

  });
})


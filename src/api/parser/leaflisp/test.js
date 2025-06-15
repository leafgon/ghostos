import { Interpreter, Parser, Scanner } from './plispdist/index.js'
import { runtime } from './plispstdlib/index.js'

//export const initInterpret = (src: string, globals: InterpreterOptions['globals']): Interpreter =>
//  new Interpreter({ globals }).interpret(new Parser(new Scanner(src)).parse().program)
lispsrc = '{:hello "world"}';
scanner = new Scanner(lispsrc);
console.log(JSON.stringify(scanner));

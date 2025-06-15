import { Interpreter, Parser, Scanner } from './plispdist'
import { runtime } from './plispstdlib'

//export const initInterpret = (src: string, globals: InterpreterOptions['globals']): Interpreter =>
//  new Interpreter({ globals }).interpret(new Parser(new Scanner(src)).parse().program)
lispsrc = '{:hello "world"}';
scanner = new Scanner(lispsrc);
console.log(JSON.stringify(scanner));

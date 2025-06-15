
const _leafLISPHelpText = 
"LEAFlisp cheatsheet: \n\
--------------------------------------------------------------------------\n\
- type conversion: -------------------------------------------------------\n\
-------------------\n\
parse:  a function to convert a string representation of a number into \n\
        either an integer or a floating point number with which to perform \n\
        any arithmetic operations in LEAFlisp. \n\
        usage: (parse <a-num-string of type string>) returns a number, \n\
        of type integer or float, representing the parsed value. \n\
------- \n\
str:    a function to convert a number, of type integer or float, into its \n\
        string representation.\n\
--------------------------------------------------------------------------\n\
- math constants: --------------------------------------------------------\n\
-------------------\n\
PI, E, LN2, LN10, LOG2E, LOG10E, SQRT1_2, SQRT2 \n\
--------------------------------------------------------------------------\n\
- numerical functions: ---------------------------------------------------\n\
-------------------\n\
abs, sign, min, max, floor, round, ceil, trunc \n\
-------------------\n\
cbrt, sqrt, exp, pow, log, log2, log10 \n\
--------------------------------------------------------------------------\n\
- trigonometry functions: \n\
-------------------\n\
sin, asin, asinh, cos, acos, acosh, tan, atan, atan2, atanh  \n\
--------------------------------------------------------------------------\n\
- random functions: \n\
-------------------\n\
random:     generates a random floating point number x, where 0 <= x < 1 \n\
            usage: (random)\n\
------- \n\
randomInt:  generates a random integer x, where a <= x <= b \n\
            usage: (randomeInt <a:integer> <b:integer>)\n\
------- \n\
shuffle:    generates a randomly shuffled list of an input list v \n\
            usage: (shuffle <v:list>)\n\
\n\
--------------------------------------------------------------------------\n\
- list functions: \n\
-------------------\n\
range0:     generates a list comprising a range of integers of a specified\n\
            length starting from 0.\n\
            usage: (range0 <length:integer>)\n\
";

export { _leafLISPHelpText };
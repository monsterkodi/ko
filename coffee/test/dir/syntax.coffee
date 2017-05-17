
class Class extends Other

    constructor:-> @this
    @static:()-> @that
    method: () -> text
    ugly : (  ) => @func arg
    arg: (@arg) -> 666
    str: (a='s') -> "STR"

func = -> return call()
foo: bar: 0
foo:
    bar:
        [0,'a', "b"]
@
@member+1
@method() ? 1
@call 'hello' and @call 'bla' or @fark

a = 0.01
b = 1.0
c = 23

for i in [0...Math.max(2,1)]
    for i in [0...3]
        for i in [0..3]
            for i in [0.3]
                log i

# return "hello" 'hello'
"""hello #{}\'\"\"' " world""" "\'"
''
'a'
""
"a"
"\""
'\''
'"'
'""'
'"""'
'a\'a'
"'"
"''"
"a\"a"
" ab #{1} ab "
">#{ 1 + "hello #{1+a} cool #{ seems.to 'work' }" }<"
{ a: 100 }; "{a:100}"



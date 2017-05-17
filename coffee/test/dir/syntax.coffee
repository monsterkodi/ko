
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
b=1.0
c=1 
c = 23

''
'a'
""
"a"
'"'
'""'
'"""'
'a\'a'
"'"
"''"
"a\"a"
"a#{1}b"
">#{"#{1+a}"}<"
">#{ 1 and 2 }<"
{ }; "{}"



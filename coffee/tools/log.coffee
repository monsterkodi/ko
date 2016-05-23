#000       0000000    0000000 
#000      000   000  000      
#000      000   000  000  0000
#000      000   000  000   000
#0000000   0000000    0000000 

str = (o) -> 
    if typeof o == 'object'
        if o._str?
            o._str()
        else
            "\n" + noon.stringify o, 
            circular: true
    else
        String o

log = -> console.log (str(s) for s in [].slice.call arguments, 0).join " "

module.exports = log
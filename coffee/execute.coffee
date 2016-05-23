#00000000  000   000  00000000   0000000  000   000  000000000  00000000
#000        000 000   000       000       000   000     000     000     
#0000000     00000    0000000   000       000   000     000     0000000 
#000        000 000   000       000       000   000     000     000     
#00000000  000   000  00000000   0000000   0000000      000     00000000

noon   = require 'noon'
colors = require 'colors'

str = (o) -> 
    if typeof o == 'object'
        "\n" + noon.stringify o, 
        colors:   true
        circular: true
    else
        colors.yellow.bold String o

log = -> console.log (str(s) for s in [].slice.call arguments, 0).join " "

class Execute
        
    @init: (cfg={}) => 
        log 'constructor', cfg

    @execute: (line) =>
        log 'execute', line

module.exports = Execute


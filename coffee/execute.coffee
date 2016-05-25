#00000000  000   000  00000000   0000000  000   000  000000000  00000000
#000        000 000   000       000       000   000     000     000     
#0000000     00000    0000000   000       000   000     000     0000000 
#000        000 000   000       000       000   000     000     000     
#00000000  000   000  00000000   0000000   0000000      000     00000000

noon     = require 'noon'
colors   = require 'colors'
coffee   = require 'coffee-script'
electron = require 'electron'
ipc      = electron.ipcMain

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
        log 'Execute constructor', cfg

    @execute: (code) =>
        # log 'execute', code
        try
            r = coffee.eval code
            log 'result', r
            ipc.send 'execute-result', r
        catch e
            console.error colors.red.bold '[ERROR]', colors.red e

module.exports = Execute


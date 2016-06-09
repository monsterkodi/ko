#  0000000   000   000  000   0000000  000   000
# 000   000  000   000  000  000       000  000 
# 000 00 00  000   000  000  000       0000000  
# 000 0000   000   000  000  000       000  000 
#  00000 00   0000000   000   0000000  000   000

log     = require '../tools/log'
Command = require '../commandline/command'

class Quick extends Command

    constructor: ->
        
        @shortcut = 'command+p'
        
        super
        
    execute: (command) ->
        
        super command
        
module.exports = Quick
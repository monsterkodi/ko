# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
Command = require '../commandline/command'
split   = require '../split'

class Find extends Command

    constructor: ->
        
        super
        
    execute: (command) ->
        
        super command
        
        window.editor.markTextForSearch command
        split.focusOnEditor()
        
module.exports = Find
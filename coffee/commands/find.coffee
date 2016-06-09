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
        
        @shortcut = 'command+f'
        
        super
        
    execute: (command) ->
        
        super command
        
        window.editor.markTextForSearch command
        if window.editor.searchRanges.length
            split.focusOnEditor()
        
module.exports = Find
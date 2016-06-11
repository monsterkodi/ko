# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
Command = require '../commandline/command'

class Find extends Command

    constructor: ->
        
        @shortcut = 'command+f'
        
        super
        
    execute: (command) ->
        
        super command
        
        editor = window.editor
        editor.highlightText command
        if editor.searchRanges.length
            return 'editor' 
        
module.exports = Find
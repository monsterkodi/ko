# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
Command = require '../commandline/command'

class Find extends Command

    constructor: (@commandline) ->
        
        @shortcuts = ["command+f", "command+alt+f", "command+shift+f"]
        @caseSensitive = false
        super
        
    start: (combo) ->
        @caseSensitive = combo == @shortcuts[1]
        @setName "Find" if @caseSensitive
        @setName "Search" if combo == @shortcuts[2]
        super combo
        
    execute: (command) ->
        
        super command
        
        editor = window.editor
        editor.highlightText command, 
            caseSensitive: @caseSensitive
        if editor.highlights.length
            focus: 'editor' 
        
module.exports = Find
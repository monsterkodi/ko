# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
Command = require '../commandline/command'

class Find extends Command

    constructor: (@commandline) ->
        @shortcuts = ["command+f", "ctrl+f", "alt+f"]
        @caseSensitive = false
        @regexpSearch = false
        super
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (combo) ->
        @caseSensitive = combo == @shortcuts[1]
        @regexpSearch = combo == @shortcuts[2]
        @setName "Find" if @caseSensitive
        @setName "/find/" if @regexpSearch
        super combo

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (command) ->
        if editor = window.editorWithClassName @focus
            if command.length
                editor.highlightText command, 
                    caseSensitive: @caseSensitive
                    regexp: @regexpSearch
                    select: 'keep'
            else
                editor.clearHighlights()
    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        super command
        if editor = window.editorWithClassName @focus
            
            editor.highlightText command, 
                caseSensitive: @caseSensitive
                regexp: @regexpSearch
                select: 'after'
                
            if editor.highlights.length
                focus: @focus 
        else
            log "find.execute warning! no editor for @focus #{@focus}?"
      
module.exports = Find
# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
Command = require '../commandline/command'

class Find extends Command

    constructor: (@commandline) ->
        @shortcuts = ["command+f", "ctrl+f", "alt+f", "ctrl+alt+f", "command+alt+f", "ctrl+command+f"]
        @types     = ['str',  'Str',   'reg',    'Reg',    'fuzzy', 'glob']
        @names     = ['find', 'FinD',  '/find/', '/FinD/', 'fiZd',  'f*nd']
        super
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (combo) ->
        index = @shortcuts.indexOf combo
        @type = @types[index]
        @setName @names[index]
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
                    type:   @type
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
                type: @type
                select: 'after'
                
            if editor.highlights.length
                focus: @focus 
        else
            log "find.execute warning! no editor for @focus #{@focus}?"
      
module.exports = Find
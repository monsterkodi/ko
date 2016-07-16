# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  

log     = require '../tools/log'
Command = require '../commandline/command'

class Find extends Command

    constructor: (@commandline) ->
        @shortcuts = ["command+f", "ctrl+f", "alt+f", "alt+ctrl+f", "command+alt+f", "command+ctrl+f"]
        @types     = ['str',  'Str',   'reg',    'Reg',    'fuzzy', 'glob']
        @names     = ['find', 'Find',  '/find/', '/Find/', 'fiZd',  'f*nd']
        super @commandline
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (@combo) ->
        @type = @types[@shortcuts.indexOf @combo]
        super @combo

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
        else
            log "find.execute warning! no editor for @focus #{@focus}?"
      
module.exports = Find
# 00000000  000  000   000  0000000  
# 000       000  0000  000  000   000
# 000000    000  000 0 000  000   000
# 000       000  000  0000  000   000
# 000       000  000   000  0000000  
{
log}    = require 'kxk'
Command = require '../commandline/command'

class Find extends Command

    constructor: (@commandline) ->
        @shortcuts = ["command+f", "ctrl+f", "alt+f", "alt+ctrl+f", "command+alt+f", "command+ctrl+f"]
        @types     = ['str',  'Str',   'reg',    'Reg',    'fuzzy', 'glob']
        @names     = ['find', 'Find',  '/find/', '/Find/', 'fiZd',  'f*nd']
        super @commandline
       
    historyKey: -> @name
    
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
        super command
        if editor = window.editorWithName @focus
            if command.length
                if @type in ['reg', 'Reg'] and command.trim() in ['^', '$', '^$']
                    editor.clearHighlights()
                else
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
        command = super command
        if editor = window.editorWithName @focus
            editor.highlightText command, 
                type: @type
                select: 'after'
        else
            log "find.execute warning! no editor for @focus #{@focus}?"
        text:   command
        select: true
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        switch combo
            when 'shift+enter', 'command+shift+g'
                if editor = window.editorWithName @focus
                    editor.highlightText @getText(),
                        type: @type
                        select: 'before'
                    return
            when 'command+g' 
                if editor = window.editorWithName @focus
                    @execute @getText()    
                    return
            when 'tab'
                if editor = window.editorWithName @focus
                    editor.focus()
                    return
        super mod, key, combo, event
      
module.exports = Find

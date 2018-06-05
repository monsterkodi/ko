###
 0000000    0000000   000000000   0000000 
000        000   000     000     000   000
000  0000  000   000     000     000   000
000   000  000   000     000     000   000
 0000000    0000000      000      0000000 
###

{ clamp, post, log, _ } = require 'kxk'

Command = require '../commandline/command'

class Goto extends Command

    constructor: (commandline) ->
        
        super commandline
        
        @names     = ['goto', 'selecto']

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (name) ->
        super name
        @showList()
        @showItems @listItems() 
        @select 0
        @positionList()
        text: @commandList.line(0)
        select: true
     
    # 000      000   0000000  000000000  000  000000000  00000000  00     00   0000000
    # 000      000  000          000     000     000     000       000   000  000     
    # 000      000  0000000      000     000     000     0000000   000000000  0000000 
    # 000      000       000     000     000     000     000       000 0 000       000
    # 0000000  000  0000000      000     000     000     00000000  000   000  0000000 
    
    listItems: () -> 
        
        items = []
        @types = {}
        
        files = post.get 'indexer', 'files'
        funcs = files[window.editor.currentFile]?.funcs
        funcs ?= []
        
        for func in funcs
            items.push text: func.name, line:'▸', clss:'method'
            @types[func.name] = 'func'
            
        clsss = post.get 'indexer', 'classes'
        for k in _.keys clsss
            name = k
            items.push text: k, line:'●', clss:'class'
            @types[name] = 'class'
            
        items

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        command = super command
        
        if /^\-?\d+$/.test command # goto line number
            line = parseInt command
            editor = @receivingEditor()
            return error "no editor? focus: #{@receiver}" if not editor?
            if line < 0
                line = editor.numLines() + line
            else 
                line -= 1
            line = clamp 0, editor.numLines()-1, line
            editor.singleCursorAtPos [0,line], extend: @name == 'selecto'
            editor.scroll.cursorToTop()
            focus: @receiver
            do: "show #{editor.name}"
        else if command.length
            type = @types[command] ? 'func'
            window.editor.jumpTo command, type:type, dontList: true, extend: @name == 'selecto'
            focus: 'editor'
            do: "show editor"
        else
            text: ''
                    
module.exports = Goto

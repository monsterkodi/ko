#  0000000    0000000   000000000   0000000 
# 000        000   000     000     000   000
# 000  0000  000   000     000     000   000
# 000   000  000   000     000     000   000
#  0000000    0000000      000      0000000 
{
clamp,
log
}        = require 'kxk'
Command  = require '../commandline/command'
_        = require 'lodash'
electron = require 'electron'

ipc = electron.ipcRenderer

class Goto extends Command

    constructor: (@commandline) ->
        
        @shortcuts = ['command+;', 'command+shift+;']
        @names     = ['goto', 'selecto']
        super @commandline

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (@combo) ->
        super @combo
        @showList()
        @showItems @listItems() 
        @select 0
        @positionList()
        text: @commandList.lines[0]
        select: true
     
    # 000      000   0000000  000000000  000  000000000  00000000  00     00   0000000
    # 000      000  000          000     000     000     000       000   000  000     
    # 000      000  0000000      000     000     000     0000000   000000000  0000000 
    # 000      000       000     000     000     000     000       000 0 000       000
    # 0000000  000  0000000      000     000     000     00000000  000   000  0000000 
    
    listItems: () -> 
        files = ipc.sendSync 'indexer', 'files'
        funcs = files[window.editor.currentFile].funcs
        funcNames = ({text: info[2], line:'▸', clss:'method'} for info in funcs)
        clsss = ipc.sendSync 'indexer', 'classes'
        @clssNames = ({text: k, line:'●', clss:'class'} for k in _.keys clsss)
        funcNames.concat @clssNames

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        command = super command
        if /^\-?\d+$/.test command
            line = parseInt command
            editor = window.editorWithClassName @focus
            if line < 0
                line = editor.lines.length + line
            else 
                line -= 1
            line = clamp 0, editor.lines.length-1, line
            editor.singleCursorAtPos [0,line], @name == 'selecto'
            editor.scrollCursorToTop()
            focus: @focus
            do: "reveal #{editor.name}"
        else if command.length
            window.editor.jumpTo command, dontList: true, select: @name == 'selecto'
            focus: '.editor'
            do: "reveal editor"
        else
            text: ''
                    
module.exports = Goto

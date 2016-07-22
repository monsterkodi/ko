#  0000000    0000000   000000000   0000000 
# 000        000   000     000     000   000
# 000  0000  000   000     000     000   000
# 000   000  000   000     000     000   000
#  0000000    0000000      000      0000000 
{
clamp
}        = require '../tools/tools'
log      = require '../tools/log'
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
        @select -1
        # text = @last()
        # text = '-1' if not text?.length
        # text:   text
        select: true
     
    # 000      000   0000000  000000000  000  000000000  00000000  00     00   0000000
    # 000      000  000          000     000     000     000       000   000  000     
    # 000      000  0000000      000     000     000     0000000   000000000  0000000 
    # 000      000       000     000     000     000     000       000 0 000       000
    # 0000000  000  0000000      000     000     000     00000000  000   000  0000000 
    
    listItems: () -> 
        files = ipc.sendSync 'indexer', 'files'
        funcs = files[window.editor.currentFile].funcs
        funcNames = (info[2] for info in funcs)
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        command = command.trim()
        if /^\-?\d+$/.test command
            line = parseInt command
            super command
            editor = window.editorWithClassName @focus
            if line < 0
                line = editor.lines.length + line
            else 
                line -= 1
            line = clamp 0, editor.lines.length-1, line
            editor.singleCursorAtPos [0,line], @name == 'selecto'
            editor.scrollCursorToTop()
            focus: @focus
        else if command.length and @name != 'selecto'
            super command
            window.editor.jumpTo command
            focus: @focus
        else
            text: ''
                    
module.exports = Goto

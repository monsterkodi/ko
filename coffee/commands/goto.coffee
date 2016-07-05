#  0000000    0000000   000000000   0000000 
# 000        000   000     000     000   000
# 000  0000  000   000     000     000   000
# 000   000  000   000     000     000   000
#  0000000    0000000      000      0000000 
{
clamp
}       = require '../tools/tools'
log     = require '../tools/log'
Command = require '../commandline/command'
_       = require 'lodash'

class Goto extends Command

    constructor: (@commandline) ->
        
        @shortcuts = ['command+;', 'command+shift+;']
        @names     = ['goto', 'selecto']
        super 

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (combo) ->
        @setName @names[@shortcuts.indexOf combo]
        super combo
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        line = parseInt command
        if _.isNumber(line) and not _.isNaN(line)
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
        else
            text: ''
                    
module.exports = Goto
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
        
        @shortcuts = ['command+;']
        super 
        
    execute: (command) ->
        
        line = parseInt command
        if _.isNumber(line) and not _.isNaN(line)
            super command
            editor = window.editor
            if line < 0
                line = editor.lines.length + line
            else 
                line -= 1
            line = clamp 0, editor.lines.length-1, line
            editor.selectNone()
            editor.setCursor 0, line

            focus: @focus
        else
            text: ''
                    
module.exports = Goto
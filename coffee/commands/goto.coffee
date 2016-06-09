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
split   = require '../split'

class Goto extends Command

    constructor: ->
        
        @shortcut = 'command+;'
        
        super
        
    execute: (command) ->
        
        super command
        line = parseInt command
        if line != NaN
            editor = window.editor
            if line < 0
                line = editor.lines.length + line
            line = clamp 0, editor.lines.length-1, line
            editor.selectNone()
            editor.moveCursorToLineIndex line
            split.focusOnEditor()
        
module.exports = Goto
# 00     00   0000000    0000000  00000000    0000000 
# 000   000  000   000  000       000   000  000   000
# 000000000  000000000  000       0000000    000   000
# 000 0 000  000   000  000       000   000  000   000
# 000   000  000   000   0000000  000   000   0000000 

log     = require '../tools/log'
Command = require '../commandline/command'
_       = require 'lodash'

class Macro extends Command

    constructor: (@commandline) ->
        
        @shortcuts = ['command+m']
        @names     = ['macro']
        super @commandline

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (combo) ->
        @setName @names[@shortcuts.indexOf combo]
        super combo
        text: @last() ? "dbg"
        select: true
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        super command
        editor = window.editor
        cp = editor.cursorPos()
        switch command
            when 'dbg'
                indent = editor.indentStringForLineAtIndex cp[1]
                insert = indent + 'log "'
                for t in editor.textsInRanges editor.selections
                    insert += "#{t}:\#{#{t}} "
                insert = insert.trimRight()
                insert += '"'
                li = if editor.isCursorInIndent() then cp[1] else cp[1]+1
                editor.do.start()
                editor.do.insert li, insert
                editor.singleCursorAtPos [editor.lines[li].length, li]
                editor.do.end()
                return text: ''
        focus: '.'+editor.name
                    
module.exports = Macro

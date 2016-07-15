# 00     00   0000000    0000000  00000000    0000000 
# 000   000  000   000  000       000   000  000   000
# 000000000  000000000  000       0000000    000   000
# 000 0 000  000   000  000       000   000  000   000
# 000   000  000   000   0000000  000   000   0000000 
{
fileExists,
last}      = require '../tools/tools'
log        = require '../tools/log'
Command    = require '../commandline/command'
_          = require 'lodash'
atomicFile = require 'write-file-atomic'
path       = require 'path'
electron   = require 'electron'
ipc        = electron.ipcRenderer

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
        args = command.split /\s+/
        command = args.shift()
        switch command
            
            when 'inv' 
                editor.showInvisibles = !editor.showInvisibles
                editor.updateLines()
                
            when 'dbg'
                li = if editor.isCursorInIndent() then cp[1] else cp[1]+1
                indent = editor.indentStringForLineAtIndex li
                insert = indent + 'log "'
                insert += editor.funcInfoAtLineIndex li
                lst = args.length and parseInt args[0] or 0
                args.shift() if lst
                if args.length
                    vs = args
                else
                    cw = editor.wordsAtCursors editor.positionsNotInRanges editor.cursors, editor.selections
                    sw = editor.textsInRanges editor.selections
                    vs = _.uniq cw.concat sw                
                for ti in [0...vs.length - lst]
                    t = vs[ti]
                    insert += "#{t}:\#{#{t}} "
                insert = insert.trimRight()
                insert += '"'
                if lst
                    insert += (", #{vs[ti]}" for ti in [vs.length - lst...vs.length]).join ''
                editor.do.start()
                editor.do.insert li, insert
                editor.singleCursorAtPos [editor.lines[li].length, li]
                editor.do.end()
                return focus: '.'+editor.name
            
            when 'class'
                clss = args.length and args[0] or last editor.textsInRanges(editor.selections)
                clss ?= 'Class'
                file = path.join path.dirname(editor.currentFile), clss.toLowerCase() + '.coffee'
                if fileExists file
                    return text: "file #{file} exists!"
                text = """
                \#> #{clss}
                
                class #{clss}
                    
                    constructor: () ->
                        
                        
                module.exports = #{clss}
                
                """
                atomicFile file, text, encoding: 'utf8', (err) =>
                    if not err?
                        ipc.send 'newWindowWithFile', file
                return focus: '.'+editor.name
            
        text: ''
                    
module.exports = Macro

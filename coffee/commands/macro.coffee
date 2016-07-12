# 00     00   0000000    0000000  00000000    0000000 
# 000   000  000   000  000       000   000  000   000
# 000000000  000000000  000       0000000    000   000
# 000 0 000  000   000  000       000   000  000   000
# 000   000  000   000   0000000  000   000   0000000 
{
fileExists,
last}    = require '../tools/tools'
log      = require '../tools/log'
Command  = require '../commandline/command'
_        = require 'lodash'
fs       = require 'fs'
path     = require 'path'
electron = require 'electron'
ipc      = electron.ipcRenderer

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
        log "command:#{command} args:#{args}"
        switch command
            when 'dbg'
                li = if editor.isCursorInIndent() then cp[1] else cp[1]+1
                indent = editor.indentStringForLineAtIndex li
                insert = indent + 'log "'
                r = args.length and args or editor.textsInRanges editor.selections
                for t in r
                    insert += "#{t}:\#{#{t}} "
                insert = insert.trimRight()
                insert += '"'
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
                fs.writeFileSync file, text
                ipc.send 'newWindowWithFile', file
                return focus: '.'+editor.name
            
        text: ''
                    
module.exports = Macro

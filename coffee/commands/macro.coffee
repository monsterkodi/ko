# 00     00   0000000    0000000  00000000    0000000 
# 000   000  000   000  000       000   000  000   000
# 000000000  000000000  000       0000000    000   000
# 000 0 000  000   000  000       000   000  000   000
# 000   000  000   000   0000000  000   000   0000000 
{
fileExists,
last}      = require '../tools/tools'
log        = require '../tools/log'
indexer    = require '../indexer'
Command    = require '../commandline/command'
_          = require 'lodash'
atomicFile = require 'write-file-atomic'
path       = require 'path'
electron   = require 'electron'

ipc        = electron.ipcRenderer

class Macro extends Command

    constructor: (@commandline) ->
        
        @shortcuts = ['command+m']
        @macros    = ['dbg', 'class', 'inv', 'req']
        @names     = ['macro']
        super @commandline

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (@combo) ->
        super @combo
        text = @last()
        text = 'dbg' if not text?.length
        text:   text
        select: true

    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
    
    listItems: () -> @macros.concat super()
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        command = super command
        
        editor  = window.editor
        cp      = editor.cursorPos()
        args    = command.split /\s+/
        command = args.shift()
        
        wordsInArgsOrCursorsOrSelection = (args, opt) ->
            if args.length
                return args
            else
                cw = editor.wordsAtCursors editor.positionsNotInRanges(editor.cursors, editor.selections), opt
                sw = editor.textsInRanges editor.selections
                ws = _.uniq cw.concat sw
                ws.filter (w) -> w.trim().length
        
        switch command
            
            # 000  000   000  000   000
            # 000  0000  000  000   000
            # 000  000 0 000   000 000 
            # 000  000  0000     000   
            # 000  000   000      0    
            when 'inv' 
                editor.showInvisibles = !editor.showInvisibles
                editor.updateLines()
            
            # 00000000   00000000   0000000 
            # 000   000  000       000   000
            # 0000000    0000000   000 00 00
            # 000   000  000       000 0000 
            # 000   000  00000000   00000 00
            when 'req'
                words = wordsInArgsOrCursorsOrSelection args
                lastIndex = 0
                texts = []
                for word in words
                    val = {lodash: '_'}[word]   ? word
                    pth = {'_': 'lodash'}[word] ? word.toLowerCase()
                    # todo search project for path
                    for li in [Math.min(editor.lines.length-1, 100)..0]
                        m = editor.lines[li].match indexer.requireRegExp
                        if m?[1]? and m?[2]?
                            break if m[1] == val and m[2] == pth
                            if editor.lines[li].trim().length and editor.lines[li].search(/^\s*\#/) != 0
                                lastIndex = Math.max lastIndex, li+1
                    if li <= 0
                        texts.push "#{val} = require '#{pth}'"
                        
                if texts.length
                    editor.do.start()
                    for text in texts.reversed()
                        log "insert text #{text} at #{lastIndex+1}"
                        editor.do.insert lastIndex, text
                    editor.moveCursorsDown false, texts.length
                    editor.do.end()
                    return do: "focus #{editor.name}"

            # 0000000    0000000     0000000 
            # 000   000  000   000  000      
            # 000   000  0000000    000  0000
            # 000   000  000   000  000   000
            # 0000000    0000000     0000000 
            when 'dbg'
                li = if editor.isCursorInIndent() then cp[1] else cp[1]+1
                indent = editor.indentStringForLineAtIndex li
                insert = indent + 'log "'
                insert += editor.funcInfoAtLineIndex li
                lst = args.length and parseInt args[0] or 0
                args.shift() if lst
                words = wordsInArgsOrCursorsOrSelection args, include: "#@.-"
                for ti in [0...words.length - lst]
                    t = words[ti]
                    insert += "#{t}:\#{#{t}} "
                insert = insert.trimRight()
                insert += '"'
                if lst
                    insert += (", #{words[ti]}" for ti in [words.length - lst...words.length]).join ''
                editor.do.start()
                editor.do.insert li, insert
                editor.singleCursorAtPos [editor.lines[li].length, li]
                editor.do.end()
                focus: '.'+editor.name

            #  0000000  000       0000000    0000000   0000000
            # 000       000      000   000  000       000     
            # 000       000      000000000  0000000   0000000 
            # 000       000      000   000       000       000
            #  0000000  0000000  000   000  0000000   0000000 
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
                    if err?
                        log 'writing class skeleton failed', err
                        return
                    ipc.send 'newWindowWithFile', file
                return focus: '.'+editor.name
            
        text: ''
                    
module.exports = Macro

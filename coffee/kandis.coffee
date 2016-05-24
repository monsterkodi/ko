#000   000   0000000   000   000  0000000    000   0000000
#000  000   000   000  0000  000  000   000  000  000     
#0000000    000000000  000 0 000  000   000  000  0000000 
#000  000   000   000  000  0000  000   000  000       000
#000   000  000   000  000   000  0000000    000  0000000 

electron    = require 'electron'
ansiKeycode = require 'ansi-keycode'
noon        = require 'noon'
editor      = require './editor'
keyname     = require './tools/keyname'
drag        = require './tools/drag'
pos         = require './tools/pos'
log         = require './tools/log'
{sw,sh}     = require './tools/tools'
ipc         = electron.ipcRenderer

encode = require('html-entities').XmlEntities.encode
line   = ""

$ = (id) -> document.getElementById id

# 0000000  00000000   000      000  000000000
#000       000   000  000      000     000   
#0000000   00000000   000      000     000   
#     000  000        000      000     000   
#0000000   000        0000000  000     000   

enterHeight = 200
minEnterHeight = 100
minScrollHeight = 24
splitAt = (y) ->
    $('scroll').style.height = "#{y}px"
    $('split').style.top = "#{y}px"
    $('enter').style.top = "#{y+10}px"
    enterHeight = sh()-y

splitAt sh()-enterHeight

editor.cursorSpan = "<span id=\"cursor\"></span>"
$('input').innerHTML = editor.cursorSpan

split = new drag
    target:  'split'
    minPos: pos 0,minScrollHeight
    maxPos: pos sw(), sh()-minEnterHeight
    onStart: (drag) -> log 'start', drag.pos
    onMove:  (drag) -> splitAt drag.cpos.y
    onStop:  (drag) -> log 'stop', drag.pos    

#00000000   00000000   0000000  000  0000000  00000000
#000   000  000       000       000     000   000     
#0000000    0000000   0000000   000    000    0000000 
#000   000  000            000  000   000     000     
#000   000  00000000  0000000   000  0000000  00000000

window.onresize = ->
    split.maxPos = pos sw(), sh()-minEnterHeight
    splitAt Math.max minScrollHeight, sh()-enterHeight

#000   000  00000000  000   000  0000000     0000000   000   000  000   000
#000  000   000        000 000   000   000  000   000  000 0 000  0000  000
#0000000    0000000     00000    000   000  000   000  000000000  000 0 000
#000  000   000          000     000   000  000   000  000   000  000  0000
#000   000  00000000     000     0000000     0000000   00     00  000   000

document.onkeydown = (event) ->
    key = keyname.ofEvent event
    switch key
        when 'esc'                       then return window.close()
        when 'down', 'right', 'up', 'left' 
                                              editor.moveCursor(key)
        when 'enter'                     then editor.insertNewline()
        when 'delete', 'ctrl+backspace'  then editor.deleteForward()     
        when 'backspace'                 then editor.deleteBackward()     
        when 'command+j'                 then editor.joinLine()
        when 'ctrl+a'                    then editor.moveCursorToStartOfLine()
        when 'ctrl+e'                    then editor.moveCursorToEndOfLine()
        else
            mod = keyname.modifiersOfEvent event
            if mod and ((not key) or key.substr(mod.length+1) == 'right click')
                return
            if ansiKeycode(event)?.length == 1
                editor.insertCharacter ansiKeycode event
            else
                log key
    $('input').innerHTML = editor.html()
    $('cursor')?.scrollIntoViewIfNeeded()
    


#000   000   0000000   000   000  0000000    000   0000000
#000  000   000   000  0000  000  000   000  000  000     
#0000000    000000000  000 0 000  000   000  000  0000000 
#000  000   000   000  000  0000  000   000  000       000
#000   000  000   000  000   000  0000000    000  0000000 

electron    = require 'electron'
ansiKeycode = require 'ansi-keycode'
noon        = require 'noon'
editor      = require './editor'
prefs       = require './tools/prefs'
keyinfo     = require './tools/keyinfo'
drag        = require './tools/drag'
pos         = require './tools/pos'
log         = require './tools/log'
{sw,sh}     = require './tools/tools'
ipc         = electron.ipcRenderer
clipboard   = electron.clipboard
remote      = electron.remote

encode = require('html-entities').XmlEntities.encode
line   = ""

$ = (id) -> document.getElementById id

#00000000   00000000   00000000  00000000   0000000
#000   000  000   000  000       000       000     
#00000000   0000000    0000000   000000    0000000 
#000        000   000  000       000            000
#000        000   000  00000000  000       0000000 

log remote.app?, remote.app?.getPath('userData')
prefs.init "#{remote.app?.getPath('userData')}/kandis.json",
    split: 300

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
    log 'setting split', y
    prefs.set 'split', y

splitAt prefs.get 'split', 100

splitDrag = new drag
    target:  'split'
    cursor:  'ns-resize'
    minPos: pos 0,minScrollHeight
    maxPos: pos sw(), sh()-minEnterHeight
    onStart: (drag) -> log 'start', drag.pos
    onMove:  (drag) -> splitAt drag.cpos.y
    onStop:  (drag) -> log 'stop', drag.pos    

# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor.init 'input'
if true
    editor.lines = [
        "for a in [0...1]"
        "    console.log a"
        ""
        "    "
        ""
        "console.log done"
    ]
    editor.update()

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = ->
    splitDrag.maxPos = pos sw(), sh()-minEnterHeight
    splitAt Math.max minScrollHeight, sh()-enterHeight
    ipc.send 'bounds'

# 00     00   0000000   000   000   0000000  00000000
# 000   000  000   000  000   000  000       000     
# 000000000  000   000  000   000  0000000   0000000 
# 000 0 000  000   000  000   000       000  000     
# 000   000   0000000    0000000   0000000   00000000
     
inputDrag = new drag
    target:  editor.id
    cursor:  'default'
    onStart: (drag, event) -> 
        editor.startSelection event.shiftKey
        editor.moveCursorToPos editor.posForEvent event
        editor.endSelection event.shiftKey
        editor.update()
    
    onMove:  (drag, event) -> 
        editor.startSelection true
        editor.moveCursorToPos editor.posForEvent event
        editor.update()
        
    onStop:  (drag, event) -> 
        log 'stop', drag.pos    
      
$(editor.id).ondblclick = (event) ->
    pos   = editor.posForEvent event
    range = editor.rangeForWordAtPos pos
    editor.selectRange range
    editor.update()

# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event
    
    # log "key:", key, "mod:", mod, "combo:", combo
    return if not combo
    switch key
        when 'esc'                               then return window.close()
        when 'right click'                       then return
        when 'down', 'right', 'up', 'left' 
            editor.startSelection event.shiftKey
            if event.metaKey
                if key == 'left'
                    editor.moveCursorToStartOfLine()
                else if key == 'right'
                    editor.moveCursorToEndOfLine()
            else
                editor.moveCursor key
        else
            switch combo
                when 'enter'                     then editor.insertNewline()
                when 'delete', 'ctrl+backspace'  then editor.deleteForward()     
                when 'backspace'                 then editor.deleteBackward()     
                when 'command+j'                 then editor.joinLine()
                when 'command+v'                 then editor.insertText clipboard.readText()
                when 'ctrl+a'                    then editor.moveCursorToStartOfLine()
                when 'ctrl+e'                    then editor.moveCursorToEndOfLine()
                when 'ctrl+shift+a'
                        editor.startSelection true
                        editor.moveCursorToStartOfLine()
                when 'ctrl+shift+e'
                        editor.startSelection true
                        editor.moveCursorToEndOfLine()
                else
                    if ansiKeycode(event)?.length == 1
                        editor.insertCharacter ansiKeycode event
                    else
                        log combo
    editor.endSelection event.shiftKey
    editor.update()
    $('cursor')?.scrollIntoViewIfNeeded()
    


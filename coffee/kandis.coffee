#000   000   0000000   000   000  0000000    000   0000000
#000  000   000   000  0000  000  000   000  000  000     
#0000000    000000000  000 0 000  000   000  000  0000000 
#000  000   000   000  000  0000  000   000  000       000
#000   000  000   000  000   000  0000000    000  0000000 

electron   = require 'electron'
noon       = require 'noon'
HtmlEditor = require './htmleditor'
prefs      = require './tools/prefs'
keyinfo    = require './tools/keyinfo'
drag       = require './tools/drag'
pos        = require './tools/pos'
log        = require './tools/log'
str        = require './tools/str'
encode     = require './tools/encode'
{sw,sh,$}  = require './tools/tools'

ipc    = electron.ipcRenderer
remote = electron.remote
 
editorText  = """

true   
"""
# for i in [0...100]
#     editorText += "#{i}\n"

#00000000   00000000   00000000  00000000   0000000
#000   000  000   000  000       000       000     
#00000000   0000000    0000000   000000    0000000 
#000        000   000  000       000            000
#000        000   000  00000000  000       0000000 

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
    $('editor').style.top = "#{y+10}px"
    enterHeight = sh()-y
    editor?.resized()
    prefs.set 'split', y

splitDrag = new drag
    target: 'split'
    cursor: 'ns-resize'
    minPos: pos 0,minScrollHeight
    maxPos: pos sw(), sh()-minEnterHeight
    onMove: (drag) -> splitAt drag.cpos.y

# 00000000   00000000   0000000  000   000  000      000000000
# 000   000  000       000       000   000  000         000   
# 0000000    0000000   0000000   000   000  000         000   
# 000   000  000            000  000   000  000         000   
# 000   000  00000000  0000000    0000000   0000000     000   

ipc.on 'execute-result', (event, arg) =>
    log 'execute-result:', arg, typeof arg
    $('scroll').innerHTML += encode str arg
    $('scroll').innerHTML += "<br>"

# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor = new HtmlEditor $('input'), 'input'
editor.setText editorText
editor.elem.focus()
editor.elem.ondblclick = (event) ->
    range = editor.rangeForWordAtPos editor.posForEvent event
    editor.selectRange range
    editor.update()

splitAt prefs.get 'split', 100

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = =>
    splitDrag.maxPos = pos sw(), sh()-minEnterHeight
    splitAt Math.max minScrollHeight, sh()-enterHeight
    ipc.send 'bounds'

# 00     00   0000000   000   000   0000000  00000000
# 000   000  000   000  000   000  000       000     
# 000000000  000   000  000   000  0000000   0000000 
# 000 0 000  000   000  000   000       000  000     
# 000   000   0000000    0000000   0000000   00000000
     
inputDrag = new drag
    target:  editor.elem
    cursor:  'default'
    onStart: (drag, event) -> 
        editor.elem.focus()
        editor.startSelection event.shiftKey
        editor.moveCursorToPos editor.posForEvent event
        editor.endSelection event.shiftKey
        editor.update()
    
    onMove:  (drag, event) -> 
        editor.startSelection true
        editor.moveCursorToPos editor.posForEvent event
        editor.update()
              
# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event
    # log "document key:", key, "mod:", mod, "combo:", combo
    return if not combo
    switch key
        when 'esc'                               then return window.close()
        when 'right click'                       then return
        else
            switch combo
                when 'command+r', 'command+enter'
                    return ipc.send 'execute', editor.text()
    


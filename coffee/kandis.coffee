#000   000   0000000   000   000  0000000    000   0000000
#000  000   000   000  0000  000  000   000  000  000     
#0000000    000000000  000 0 000  000   000  000  0000000 
#000  000   000   000  000  0000  000   000  000       000
#000   000  000   000  000   000  0000000    000  0000000 

electron    = require 'electron'
noon        = require 'noon'
Editor      = require './editor'
prefs       = require './tools/prefs'
keyinfo     = require './tools/keyinfo'
drag        = require './tools/drag'
pos         = require './tools/pos'
log         = require './tools/log'
str         = require './tools/str'
encode      = require './tools/encode'
{sw,sh,$}   = require './tools/tools'
ipc         = electron.ipcRenderer
remote      = electron.remote
 
editorText  = "console.log 'can\\'t load', 'hello'"

__ignore = """

# "-123 \#{sda} asd \#{123}", "-123 \#{sda} asd \#{123}"
"-123 \#{sda} asd \#{123 + "qwe" + 'qwe'}", "-123 \#{sda} asd \#{123}"
'123 \#{sda} asd \#{123}', '123 \#{sda} asd \#{123}'

\#{sda} asd \#{123}
"    +1 "
"+1 -2"
"-123 "
"-1.3,+123,-2.3"
"-2143.4"
"[1.23]"
"(0.5)"
'+6.6'
"[1..2]"
"[2...3]"
"[123]"

123
123 
    +1 
    -2
+1 -2
-123
-123 
-1.3,+123,-2.3
-2143.4
[1.23]
(0.5)
+6.6
[1..2]
[2...3]
[123]

a, 13, -2 , +4, b-4, b+5
b+5
c+6

q23
q23-23.12a
123a
-123a
-1.3a
-2143.4a
+6.6a

123s
a123
[2....3]

1
2.34
a = 56
b: 7.8
a: 90

array = [
    null
    true
    false
    undefined
]
obj = 
    a: 1
    b: 4.5
    c: -15.0
    d: 'str'
    e: "str"
    f: \"\"\"
    str
    \"\"\"
    
obj["e"][3]
"""
__ignore = """
    
log = require 'log'
    
class test
    
    @staticVar = ''
    
    @staticFunc: => return @
    
    constructor = () ->

    func: (arg) ->
        for i in ( a for a in l if true )
            continue if i < 10
            break
        console.log arg
        
    func2: (a,b,err) =>
        error err
        
f = (args) ->
    for a in [0..1]
        for b in [arg.length...-16]
            log a, b 
"""

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
    prefs.set 'split', y

splitAt prefs.get 'split', 100

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

editor = new Editor $('input'), 'input'
if true
    editor.lines = editorText.split '\n'
    editor.update()
editor.elem.focus()
editor.elem.ondblclick = (event) ->
    range = editor.rangeForWordAtPos editor.posForEvent event
    editor.selectRange range
    editor.update()

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
    


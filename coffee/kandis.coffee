# 000   000   0000000   000   000  0000000    000   0000000
# 000  000   000   000  0000  000  000   000  000  000     
# 0000000    000000000  000 0 000  000   000  000  0000000 
# 000  000   000   000  000  0000  000   000  000       000
# 000   000  000   000  000   000  0000000    000  0000000 

electron   = require 'electron'
noon       = require 'noon'
fs         = require 'fs'
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
 
# editorText = fs.readFileSync "#{__dirname}/../coffee/kandis.coffee", encoding: 'UTF8'
editorText = fs.readFileSync "#{__dirname}/../coffee/htmleditor.coffee", encoding: 'UTF8'

# editorText = """
# lx = clamp 0, @elem.clientWidth,  event.clientX - br.left
# ly = clamp 0, @elem.clientHeight, event.clientY - br.top
# [parseInt(Math.floor((Math.max(0, sl + lx-10))/@charSize[0])),
#  parseInt(Math.floor((Math.max(0, st + ly))/@charSize[1])) + @topIndex]
# 
# updateScrollbar: ->
#     if @bufferHeight < @viewHeight()
#         @scrollRight.style.top    = "0"
#         @scrollRight.style.height = "0"
#     else
#         vh           = Math.min @editorHeight, @viewHeight()
#         scrollTop    = parseInt (@scroll / @bufferHeight) * vh
#         scrollHeight = parseInt (@editorHeight / @bufferHeight) * vh
#         scrollHeight = Math.max scrollHeight, parseInt @lineHeight/4
#         scrollTop    = Math.min scrollTop, @viewHeight()-scrollHeight
#         scrollTop    = Math.max 0, scrollTop
#                 
#         @scrollRight.style.top    = "\#{scrollTop}.px"
#         @scrollRight.style.height = "\#{scrollHeight}.px"
# """
        
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init "#{remote.app?.getPath('userData')}/kandis.json",
    split: 300

#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

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
editor.setText editorText if editorText?
editor.elem.focus()

splitAt prefs.get 'split', 100

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = =>
    splitDrag.maxPos = pos sw(), sh()-minEnterHeight
    ipc.send 'bounds'
              
# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event
    # log "document key:", key, "mod:", mod, "combo:", combo
    return if not combo
    
    switch combo
        when 'command+r', 'command+enter' then return ipc.send 'execute', editor.text()
        when 'command+alt+i'              then return ipc.send 'toggleDevTools'
        when 'command+alt+ctrl+l'         then return ipc.send 'reloadWindow'
    
    switch key
        when 'esc'         then return window.close()
        when 'right click' then return
    


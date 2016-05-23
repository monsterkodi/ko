#000   000   0000000   000   000  0000000    000   0000000
#000  000   000   000  0000  000  000   000  000  000     
#0000000    000000000  000 0 000  000   000  000  0000000 
#000  000   000   000  000  0000  000   000  000       000
#000   000  000   000  000   000  0000000    000  0000000 

electron  = require 'electron'
keyname   = require './tools/keyname'
drag      = require './tools/drag'
pos       = require './tools/pos'
{sw,sh}   = require './tools/tools'
noon      = require 'noon'
log       = require './tools/log'
ipc       = electron.ipcRenderer
encode    = require('html-entities').XmlEntities.encode

$ = (id) -> document.getElementById id

# 0000000  00000000   000      000  000000000
#000       000   000  000      000     000   
#0000000   00000000   000      000     000   
#     000  000        000      000     000   
#0000000   000        0000000  000     000   

enterHeight = 200
minEnterHeight = 100
minScrollHeight = 0
splitAt = (y) ->
    $('scroll').style.height = "#{y}px"
    $('split').style.top = "#{y}px"
    $('enter').style.top = "#{y+10}px"
    enterHeight = sh()-y

splitAt sh()-enterHeight

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
    splitAt Math.max 0, sh()-enterHeight

#000   000  00000000  000   000  0000000     0000000   000   000  000   000
#000  000   000        000 000   000   000  000   000  000 0 000  0000  000
#0000000    0000000     00000    000   000  000   000  000000000  000 0 000
#000  000   000          000     000   000  000   000  000   000  000  0000
#000   000  00000000     000     0000000     0000000   00     00  000   000

document.onkeydown = (event) ->
    key = keyname.ofEvent event
    switch key
        when 'esc'              then return window.close()
        when 'down', 'right'    then return highlight current-1
        when 'up'  , 'left'     then return highlight current+1
        when 'home', 'page up'  then return highlight buffers.length-1
        when 'end', 'page down' then return highlight 0
        when 'enter'            then return doPaste()
        when 'backspace', 'command+backspace' then return ipc.send "del", current
    log key



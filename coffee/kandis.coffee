# 000   000   0000000   000   000  0000000    000   0000000
# 000  000   000   000  0000  000  000   000  000  000     
# 0000000    000000000  000 0 000  000   000  000  0000000 
# 000  000   000   000  000  0000  000   000  000       000
# 000   000  000   000  000   000  0000000    000  0000000 

electron   = require 'electron'
noon       = require 'noon'
fs         = require 'fs'
EditorView = require './editor/view'
prefs      = require './tools/prefs'
keyinfo    = require './tools/keyinfo'
resolve    = require './tools/resolve'
drag       = require './tools/drag'
pos        = require './tools/pos'
log        = require './tools/log'
str        = require './tools/str'
encode     = require './tools/encode'
{sw,sh,$,del} = require './tools/tools'

ipc    = electron.ipcRenderer
remote = electron.remote
dialog = remote.dialog
    
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init "#{remote.app?.getPath('userData')}/kandis.json",
    split: 300

addToRecent = (file) ->
    recent = prefs.get 'recentFiles', []
    del recent, file
    recent.unshift file
    while recent.length > prefs.get 'recentFilesLength', 10
        recent.pop()
    prefs.set 'recentFiles', recent
                 
# 00000000  000  000      00000000
# 000       000  000      000     
# 000000    000  000      0000000 
# 000       000  000      000     
# 000       000  0000000  00000000

loadFile = (file) ->
    addToRecent file
    editor.setText fs.readFileSync file, encoding: 'UTF8'

openFile = ->
    dialog.showOpenDialog 
        title: "Open File"
        defaultPath: resolve '.'
        properties: ['openFile']
        filters: [
                name: 'Coffee-Script', extensions: ['coffee']
                name: 'All Files', extensions: ['*']
        ]
        , (files) =>
            if files?.length
                loadFile resolve files[0]

saveFileAs = ->
    dialog.showSaveDialog 
        title: "Save File As"
        defaultPath: currentFile
        properties: ['openFile']
        filters: [
                name: 'Coffee-Script', extensions: ['coffee']
                name: 'All Files', extensions: ['*']
        ]
        , (file) => 
            if file
                addToRecent file
                saveFile file
         
saveFile = (file) ->
    fs.writeFileSync file ? editor.currentFile, editor.text(), encoding: 'UTF8'
         
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
    $('split' ).style.top = "#{y}px"
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

# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'executeResult', (event, arg) =>
    log 'executeResult:', arg, typeof arg
    $('scroll').innerHTML += encode str arg
    $('scroll').innerHTML += "<br>"
    
ipc.on 'openFile',   openFile
ipc.on 'saveFileAs', saveFileAs
ipc.on 'saveFile',   => saveFile()
ipc.on 'loadFile',  (event, file) => loadFile file

# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor = new EditorView $('input'), 'input'
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
        when 'command+n'                  then return ipc.send 'newFile'
    
    switch key
        when 'esc'         then return window.close()
        when 'right click' then return
    


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
winID  = null
editor = null
    
enterHeight     = 200
minEnterHeight  = 100
minScrollHeight = 24

# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init "#{remote.app?.getPath('userData')}/kandis.json"

addToRecent = (file) ->
    recent = prefs.get 'recentFiles', []
    del recent, file
    recent.unshift file
    while recent.length > prefs.get 'recentFilesLength', 10
        recent.pop()
    prefs.set 'recentFiles', recent
    
#  0000000  000000000   0000000   000000000  00000000
# 000          000     000   000     000     000     
# 0000000      000     000000000     000     0000000 
#      000     000     000   000     000     000     
# 0000000      000     000   000     000     00000000
        
setState = (key, value) ->
    if winID
        prefs.setPath "windows.#{winID}.#{key}", value
    
getState = (key, value) ->
    return value if not winID
    prefs.getPath "windows.#{winID}.#{key}", value
    
# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'executeResult', (event, arg) =>
    log 'executeResult:', arg, typeof arg
    $('scroll').innerHTML += encode str arg
    $('scroll').innerHTML += "<br>"
    
ipc.on 'openFile',   => openFile()
ipc.on 'cloneFile',  => ipc.send 'newWindowWithFile', editor.currentFile
ipc.on 'saveFileAs', => saveFileAs()
ipc.on 'saveFile',   => saveFile()
ipc.on 'loadFile', (event, file) => loadFile file
ipc.on 'setWinID', (event, id) => 
    winID = id
    splitAt getState 'split', minScrollHeight
    setState 'file', editor.currentFile # file might be loaded before id got sent
                 
# 00000000  000  000      00000000
# 000       000  000      000     
# 000000    000  000      0000000 
# 000       000  000      000     
# 000       000  0000000  00000000

saveFile = (file) =>
    file ?= editor.currentFile
    log 'save', file
    fs.writeFileSync file, editor.text(), encoding: 'UTF8'
    editor.currentFile = file
    setState 'file', file

loadFile = (file) =>
    log 'load', file
    addToRecent file
    editor.setText fs.readFileSync file, encoding: 'UTF8'
    editor.currentFile = file
    setState 'file', file

openFile = =>
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

saveFileAs = =>
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
                  
#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

splitAt = (y) ->
    # log 'splitAt', y
    $('.split-top').style.height = "#{y}px"
    $('.split-handle' ).style.top = "#{y}px"
    $('.split-bot').style.top = "#{y+10}px"
    enterHeight = sh()-y
    splitDrag.setMinMax pos(0, minScrollHeight), pos(0, sh()-minEnterHeight)
    editor?.resized()
    setState 'split', y

splitDrag = new drag
    target: $('.split-handle')
    cursor: 'ns-resize'
    onMove: (drag) -> splitAt drag.cpos.y

# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor = new EditorView $('.editor')
editor.setText editorText if editorText?
editor.view.focus()

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = =>
    # log 'resize', sw(), sh()
    if sh()
        splitDrag.setMinMax pos(0, minScrollHeight), pos(0, sh()-minEnterHeight)
        ipc.send 'saveBounds', winID if winID?
        editor?.resized()
              
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
        when 'command+alt+i'              then return ipc.send 'toggleDevTools', winID
        

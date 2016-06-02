# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00

electron   = require 'electron'
noon       = require 'noon'
path       = require 'path'
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
pkg         = require "../package.json"
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

prefs.init "#{remote.app?.getPath('userData')}/#{pkg.name}.json"

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
    # log 'setState', key, value
    if winID
        prefs.setPath "windows.#{winID}.#{key}", value
    
getState = (key, value) ->
    return value if not winID
    # log 'getState', key, value, prefs.getPath "windows.#{winID}.#{key}", value
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
ipc.on 'openFile', (event, options) => openFile options
ipc.on 'cloneFile',  => ipc.send 'newWindowWithFile', editor.currentFile
ipc.on 'reloadFile', => loadFile editor.currentFile
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
    log 'save:', file
    if not file?
        saveFileAs()
        return
    fs.writeFileSync file, editor.text(), encoding: 'UTF8'
    editor.currentFile = file
    setState 'file', file

loadFile = (file) =>
    # log 'load:', file
    addToRecent file
    editor.setText fs.readFileSync file, encoding: 'UTF8'
    editor.currentFile = file
    setState 'file', file

# 0000000    000   0000000   000       0000000    0000000 
# 000   000  000  000   000  000      000   000  000      
# 000   000  000  000000000  000      000   000  000  0000
# 000   000  000  000   000  000      000   000  000   000
# 0000000    000  000   000  0000000   0000000    0000000 

fileListForPathList = (paths) ->
    files = []
    for p in paths
        try
            stat = fs.statSync p
            if stat.isDirectory()
                dirfiles = fs.readdirSync(p)
                dirfiles = (path.join(p,f) for f in dirfiles)
                dirfiles = (f for f in dirfiles when fs.statSync(f).isFile())
                files = files.concat dirfiles
            else if stat.isFile()
                files.push p
        catch err
            log err
    log 'files', files
    files

openFile = (options) =>
    dir = path.dirname editor.currentFile if editor.currentFile
    dir ?= resolve '.'
    dialog.showOpenDialog 
        title: "Open File"
        defaultPath: getState 'openFilePath',  dir
        properties: ['openFile', 'openDirectory', 'multiSelections']
        filters: [
                name: 'Coffee-Script', extensions: ['coffee']
                name: 'All Files', extensions: ['*']
        ]
        , (files) =>
            if files?.length
                # log 'open:', files
                files = fileListForPathList files
                if files.length >= 10
                    answer = dialog.showMessageBox
                        type: 'warning'
                        buttons: ['Cancel', 'Open All']
                        defaultId: 0
                        cancelId: 0
                        title: "A Lot of Files Warning"
                        message: "You have selected #{files.length} files."
                        detail: "Are you sure you want to open that many files?"
                    return if answer != 1
                setState 'openFilePath', path.dirname files[0]                    
                if not options?.newWindow
                    loadFile resolve files.shift()
                for file in files
                    ipc.send 'newWindowWithFile', file

saveFileAs = =>
    dialog.showSaveDialog 
        title: "Save File As"
        defaultPath: editor.currentFile
        properties: ['openFile', 'createDirectory']
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
        when 'command+enter' then return ipc.send 'execute', editor.text()
        when 'command+alt+i' then return ipc.send 'toggleDevTools', winID
        

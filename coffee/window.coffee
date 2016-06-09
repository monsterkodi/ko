# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00

electron    = require 'electron'
path        = require 'path'
fs          = require 'fs'
split       = require './split'
View        = require './editor/view'
Commandline = require './commandline/commandline'
prefs       = require './tools/prefs'
keyinfo     = require './tools/keyinfo'
drag        = require './tools/drag'
pos         = require './tools/pos'
log         = require './tools/log'
str         = require './tools/str'
encode      = require './tools/encode'
pkg         = require "../package.json"
{sw,sh,$,
 del,clamp,
 fileList,
 fileExists,
 resolve}  = require './tools/tools'

ipc    = electron.ipcRenderer
remote = electron.remote
dialog = remote.dialog
winID  = null
editor = null
    
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
    return if not winID
    if winID
        prefs.setPath "windows.#{winID}.#{key}", value
    
getState = (key, value) ->
    return value if not winID
    # log 'getState', key, value, prefs.getPath "windows.#{winID}.#{key}", value
    prefs.getPath "windows.#{winID}.#{key}", value
    
delState = (key) ->
    return if not winID
    prefs.setPath "windows.#{winID}.#{key}", null
    
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
    log "setWinID: ", id
    split.init id
    s = getState 'fontSize'
    setFontSize s if s

    if getState 'file'
        loadFile getState 'file'
    else
        setState 'file', editor.currentFile # files might be loaded before id got sent
        editor.displayLines 0

    ipc.send 'reloadMenu'
                 
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
    editor.setCurrentFile null
    fs.writeFileSync file, editor.text(), encoding: 'UTF8'
    editor.setCurrentFile file
    setState 'file', file

loadFile = (file) =>    
    if fileExists file
        log 'load:', file
        addToRecent file
        editor.setCurrentFile file
        editor.setText fs.readFileSync file, encoding: 'UTF8'
        setState 'file', file
        ipc.send 'reloadMenu'

openFiles = (files) =>
    log 'openFiles:', files
    if files?.length
        files = fileList files
        log 'open:', files
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
        return files

window.openFiles = openFiles
window.loadFile = loadFile

# 0000000    000   0000000   000       0000000    0000000 
# 000   000  000  000   000  000      000   000  000      
# 000   000  000  000000000  000      000   000  000  0000
# 000   000  000  000   000  000      000   000  000   000
# 0000000    000  000   000  0000000   0000000    0000000 

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
        , openFiles

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
                  
# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor = new View $('.editor')
editor.setText editorText if editorText?
editor.view.focus()
window.editor = editor

#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  

window.commandline = new Commandline $('.commandline-editor')

$('.titlebar').ondblclick = (event) => ipc.send 'maximizeWindow', winID

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = =>
    # log 'resize', sw(), sh()
    if sh()
        ipc.send 'saveBounds', winID if winID?
        split.resized()
        editor?.resized()
    
window.onunload = =>
    editor.setCurrentFile null # to stop watcher

# 00000000   0000000   000   000  000000000   0000000  000  0000000  00000000
# 000       000   000  0000  000     000     000       000     000   000     
# 000000    000   000  000 0 000     000     0000000   000    000    0000000 
# 000       000   000  000  0000     000          000  000   000     000     
# 000        0000000   000   000     000     0000000   000  0000000  00000000
    
setFontSize = (s) => 
    s = clamp 2, 100, s
    setState "fontSize", s
    editor.setFontSize s
    editor.refreshLines()
    
changeFontSize = (d) => 
    setFontSize clamp 2, 100, editor.size.fontSize + d
    
resetFontSize = => 
    delState 'fontSize'
    setFontSize prefs.get 'fontSize', 15
              
# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event
    # log "document key:", key, "mod:", mod, "combo:", combo
    
    return if not combo
    
    return if 'unhandled' != window.commandline.globalModKeyComboEvent mod, key, combo, event
        return
    
    switch combo
        when 'command+enter' then return ipc.send 'execute', editor.text()
        when 'command+alt+i' then return ipc.send 'toggleDevTools', winID
        when 'command+='     then return changeFontSize +1
        when 'command+-'     then return changeFontSize -1
        when 'command+0'     then return resetFontSize()
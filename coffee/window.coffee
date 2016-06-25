# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00

electron    = require 'electron'
path        = require 'path'
fs          = require 'fs'
_           = require 'lodash'
Split       = require './split'
View        = require './editor/view'
Commandline = require './commandline/commandline'
Terminal    = require './terminal/terminal'
LogView     = require './logview/logview'
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
logview = null
terminal = null
commandline = null
    
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
   
setState = window.setState = (key, value) ->
    # log 'setState', key, value
    return if not winID
    if winID
        prefs.setPath "windows.#{winID}.#{key}", value
    
getState = window.getState = (key, value) ->
    return value if not winID
    # log 'getState', key, value, prefs.getPath "windows.#{winID}.#{key}", value
    prefs.getPath "windows.#{winID}.#{key}", value
    
delState = window.delState = (key) ->
    return if not winID
    prefs.setPath "windows.#{winID}.#{key}", null
    
# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'executeResult', (event, arg) => terminal.appendText str arg
ipc.on 'openFile', (event, options) => openFile options
ipc.on 'cloneFile',  => ipc.send 'newWindowWithFile', editor.currentFile
ipc.on 'reloadFile', => 
    # log "window.ipc.reloadFile"
    loadFile editor.currentFile
ipc.on 'saveFileAs', => saveFileAs()
ipc.on 'saveFile',   => saveFile()
ipc.on 'loadFile', (event, file) => 
    log "window.ipc.loadFile #{file}"
    loadFile file
ipc.on 'setWinID', (event, id) => 
    # log "window.ipc.setWinID #{id} #{window.split?}"
    winID = window.winID = id
    window.split?.setWinID id    
                 
# 00000000  000  000      00000000
# 000       000  000      000     
# 000000    000  000      0000000 
# 000       000  000      000     
# 000       000  0000000  00000000

saveFile = (file) =>
    file ?= editor.currentFile
    log 'window.saveFile file:', file
    if not file?
        saveFileAs()
        return
    txt = editor.text()
    editor.setCurrentFile null # to stop watcher and reset scroll
    fs.writeFileSync file, txt, encoding: 'UTF8'
    editor.setCurrentFile file
    setState 'file', file

loadFile = (file) =>  
    log 'window.loadFile file:', file
    if fileExists file
        addToRecent file
        editor.setCurrentFile null # to stop watcher and reset scroll
        editor.setCurrentFile file
        setState 'file', file
        ipc.send 'reloadMenu'

openFiles = (ofiles, options) =>
    # log 'openFiles:', ofiles    
    if ofiles?.length
        files = fileList ofiles, ignoreHidden: false
        # log 'open:', files
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
        if files.length == 0
            log 'window.openFiles.warning: no files for?', ofiles
            return []
        setState 'openFilePath', path.dirname files[0]                    
        if not options?.newWindow
            log "window.openFiles not new window"
            loadFile resolve files.shift()
        for file in files
            ipc.send 'newWindowWithFile', file
        return ofiles

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
        , (files) => openFiles files, options

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

$('.titlebar').ondblclick = (event) => ipc.send 'maximizeWindow', winID

#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

split = window.split = new Split()
split.on 'paneHeight', (e) =>
    # log "window.on.split.paneHeight", e
    if e.paneIndex == 0
        terminal.resized()
    if e.paneIndex == 2
        editor.resized()
    if e.paneIndex == 3
        logview.resized()

# 000000000  00000000  00000000   00     00  000  000   000   0000000   000    
#    000     000       000   000  000   000  000  0000  000  000   000  000    
#    000     0000000   0000000    000000000  000  000 0 000  000000000  000    
#    000     000       000   000  000 0 000  000  000  0000  000   000  000    
#    000     00000000  000   000  000   000  000  000   000  000   000  0000000

terminal = window.terminal = new Terminal '.terminal'

# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor = window.editor = new View '.editor'
editor.setText editorText if editorText?
editor.view.focus()

window.editorWithName = (n) ->
    switch n
        when 'editor'   then editor
        when 'command'  then commandline
        when 'terminal' then terminal
        when 'logview'  then logview
        
window.editorWithClassName = (n) ->
    switch n
        when '.editor'      then editor
        when '.commandline' then commandline
        when '.terminal'    then terminal
        when '.logview'     then logview    

# 000       0000000    0000000   000   000  000  00000000  000   000
# 000      000   000  000        000   000  000  000       000 0 000
# 000      000   000  000  0000   000 000   000  0000000   000000000
# 000      000   000  000   000     000     000  000       000   000
# 0000000   0000000    0000000       0      000  00000000  00     00

logview = window.logview = new LogView '.logview'

#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  

commandline = window.commandline = new Commandline '.commandline-editor'

# commandline.startCommand 'term', 'command+t'
# commandline.setLines ['color-ls -l index.html']
# commandline.execute()
                  
# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = =>
    # log "window.onresize sh #{sh()}"
    if sh()
        ipc.send 'saveBounds', winID if winID?
        split.resized()

window.onload = =>
    # log "window.onload sh #{sh()} #{window.split?}"
    split.resized()
    
window.onunload = =>
    editor.setCurrentFile null # to stop watcher (and reset scroll?)

# 00000000   0000000   000   000  000000000   0000000  000  0000000  00000000
# 000       000   000  0000  000     000     000       000     000   000     
# 000000    000   000  000 0 000     000     0000000   000    000    0000000 
# 000       000   000  000  0000     000          000  000   000     000     
# 000        0000000   000   000     000     0000000   000  0000000  00000000
    
setFontSize = (s) => 
    s = clamp 2, 100, s
    setState "fontSize", s
    editor.setFontSize s
    log "setFontSize loadFile #{editor.currentFile}" if editor.currentFile?
    loadFile editor.currentFile if editor.currentFile?
    
changeFontSize = (d) => 
    setFontSize clamp 2, 100, editor.size.fontSize + d
    
resetFontSize = => 
    delState 'fontSize'
    setFontSize prefs.get 'fontSize', 15

s = getState 'fontSize'
setFontSize s if s

# 0000000   0000000    0000000   00     00
#    000   000   000  000   000  000   000
#   000    000   000  000   000  000000000
#  000     000   000  000   000  000 0 000
# 0000000   0000000    0000000   000   000
    
resetZoom: -> 
    webframe.setZoomFactor 1
    editor.resized()
    logview.resized()
    
changeZoom: (d) -> 
    z = webframe.getZoomFactor() 
    z *= 1+d/20
    z = clamp 0.36, 5.23, z
    webframe.setZoomFactor z
    editor.resized()
    logview.resized()
              
# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event
    # log "document key:", key, "mod:", mod, "combo:", combo
    
    return if not combo
    
    if 'unhandled' != window.commandline.globalModKeyComboEvent mod, key, combo, event
        return
    
    switch combo
        when 'command+enter'    then return ipc.send 'execute', editor.text()
        when 'command+alt+i'    then return ipc.send 'toggleDevTools', winID
        when 'command+alt+k'    then return window.split.toggleLog()
        when 'command+k'        then return window.split.showOrClearLog()
        when 'command+='        then return changeFontSize +1
        when 'command+-'        then return changeFontSize -1
        when 'command+0'        then return resetFontSize()
        when 'command+shift+='  then return @changeZoom +1
        when 'command+shift+-'  then return @changeZoom -1
        when 'command+shift+0'  then return @resetZoom()
        
                
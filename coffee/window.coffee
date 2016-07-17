# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00
{
last,
sw,sh,$,
fileList,
fileExists,
del,clamp,
resolve}    = require './tools/tools'
Split       = require './split'
View        = require './editor/view'
Commandline = require './commandline/commandline'
Terminal    = require './terminal/terminal'
LogView     = require './logview/logview'
Titlebar    = require './titlebar'
Navigate    = require './navigate'
Info        = require './editor/info'
prefs       = require './tools/prefs'
keyinfo     = require './tools/keyinfo'
drag        = require './tools/drag'
pos         = require './tools/pos'
log         = require './tools/log'
str         = require './tools/str'
encode      = require './tools/encode'
_           = require 'lodash'
fs          = require 'fs'
path        = require 'path'
electron    = require 'electron'
atomicFile  = require 'write-file-atomic'
pkg         = require "../package.json"

ipc         = electron.ipcRenderer
remote      = electron.remote
dialog      = remote.dialog
winID       = null
editor      = null
logview     = null
terminal    = null
commandline = null

# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init()
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
    return if not winID
    if winID
        prefs.set "windows:#{winID}:#{key}", value
    
getState = window.getState = (key, value) ->
    return value if not winID
    prefs.get "windows:#{winID}:#{key}", value
    
delState = window.delState = (key) ->
    return if not winID
    prefs.del "windows:#{winID}:#{key}"

# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'shellCommandData',  (event, cmdData) => commandline.commands['term'].onShellCommandData cmdData
ipc.on 'executeResult',     (event, arg) => terminal.appendText str arg
ipc.on 'singleCursorAtPos', (event, pos) => 
    log "singleCursorAtPos #{editor?}", pos
    editor.singleCursorAtPos pos
ipc.on 'openFile',          (event, options) => openFile options
ipc.on 'focusEditor',       (event) => split.focus '.editor'
ipc.on 'cloneFile',  => ipc.send 'newWindowWithFile', editor.currentFile
ipc.on 'reloadFile', => loadFile editor.currentFile, reload: true, dontSave: true
ipc.on 'saveFileAs', => saveFileAs()
ipc.on 'saveFile',   => saveFile()
ipc.on 'loadFile', (event, file) => loadFile file
ipc.on 'setWinID', (event, id) => 
    winID = window.winID = id
    window.split?.setWinID id 
    editor.updateTitlebar()
    
ipc.on 'fileLinesChanged', (event, file, lineChanges) =>
    if file == editor.currentFile
        editor.applyForeignLineChanges lineChanges
                 
# 00000000  000  000      00000000
# 000       000  000      000     
# 000000    000  000      0000000 
# 000       000  000      000     
# 000       000  0000000  00000000

#  0000000   0000000   000   000  00000000
# 000       000   000  000   000  000     
# 0000000   000000000   000 000   0000000 
#      000  000   000     000     000     
# 0000000   000   000      0      00000000

saveFile = (file) =>
    file ?= editor.currentFile
    # log "window.saveFile file:#{file}"
    if not file?
        saveFileAs()
        return
    atomicFile file, editor.text(), encoding: 'utf8', (err) =>
        editor.setCurrentFile null # to stop watcher and reset scroll
        if err?
            alert err
        else
            editor.setCurrentFile file
            setState 'file', file

# 000       0000000    0000000   0000000  
# 000      000   000  000   000  000   000
# 000      000   000  000000000  000   000
# 000      000   000  000   000  000   000
# 0000000   0000000   000   000  0000000  

loadFile = (file, opt) =>  
    [file,line] = file.split ':'
    if file != editor.currentFile or opt?.reload
        return if not fileExists file
        
        if editor.currentFile? and not opt?.dontSave and editor.do.hasLineChanges() 
            saveChanges = [_.clone(editor.currentFile), _.clone(editor.text())]
            atomicFile saveChanges[0], saveChanges[1], encoding: 'utf8'
            
        addToRecent file        
        editor.setCurrentFile null # to stop watcher and reset scroll
        editor.setCurrentFile file
        ipc.send 'fileLoaded', file, winID
        setState 'file', file
        commandline.fileLoaded file
    
    window.split.reveal 'editor'
        
    if line?
        editor.singleCursorAtPos [0, parseInt(line)-1] 
        editor.scrollCursorToTop()        
  
#  0000000   00000000   00000000  000   000        00000000  000  000      00000000   0000000
# 000   000  000   000  000       0000  000        000       000  000      000       000     
# 000   000  00000000   0000000   000 0 000        000000    000  000      0000000   0000000 
# 000   000  000        000       000  0000        000       000  000      000            000
#  0000000   000        00000000  000   000        000       000  0000000  00000000  0000000 

openFiles = (ofiles, options) => # called from file dialog and open command
    if ofiles?.length
        files = fileList ofiles, ignoreHidden: false
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
            file = resolve files.shift()
            if not ipc.sendSync 'activateWindowWithFile', file
                loadFile file
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

# 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     000      0000000   0000000    000000000  0000000  
#    000     000     000     000      000       000   000  000   000  000   000
#    000     000     000     0000000  00000000  0000000    000   000  000   000

titlebar = window.titlebar = new Titlebar
navigate = window.navigate = new Navigate

#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

split = window.split = new Split()
split.on 'split', =>
    terminal.resized()
    commandline.resized()
    editor.resized()
    logview.resized()

# 000000000  00000000  00000000   00     00  000  000   000   0000000   000    
#    000     000       000   000  000   000  000  0000  000  000   000  000    
#    000     0000000   0000000    000000000  000  000 0 000  000000000  000    
#    000     000       000   000  000 0 000  000  000  0000  000   000  000    
#    000     00000000  000   000  000   000  000  000   000  000   000  0000000

terminal = window.terminal = new Terminal '.terminal'
terminal.on 'fileLineChange', (file, lineChange) =>
    ipc.send 'winFileLinesChanged', -1, file, [lineChange]

# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

editor = window.editor = new View '.editor'

#  0000000   0000000   00     00  00     00   0000000   000   000  0000000  
# 000       000   000  000   000  000   000  000   000  0000  000  000   000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000  

commandline = window.commandline = new Commandline '.commandline-editor'

# 000       0000000    0000000   000   000  000  00000000  000   000
# 000      000   000  000        000   000  000  000       000 0 000
# 000      000   000  000  0000   000 000   000  0000000   000000000
# 000      000   000  000   000     000     000  000       000   000
# 0000000   0000000    0000000       0      000  00000000  00     00

logview = window.logview = new LogView '.logview'

# 000  000   000  00000000   0000000 
# 000  0000  000  000       000   000
# 000  000 0 000  000000    000   000
# 000  000  0000  000       000   000
# 000  000   000  000        0000000 

info = window.info = new Info editor

editor.setText editorText if editorText?
editor.view.focus()

editor.on 'changed', (changeInfo, action) =>
    return if changeInfo.foreign
    if changeInfo.sorted.length and action.lines.length
        ipc.send 'winFileLinesChanged', winID, editor.currentFile, action.lines
        navigate.addFilePos
            file: editor.currentFile
            pos:  editor.cursorPos()

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

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = ->
    split.resized()
    ipc.send 'saveBounds', winID if winID?

window.onload   = => split.resized()
window.onunload = => editor.setCurrentFile null, noSaveScroll: true # to stop watcher

# 00000000   0000000   000   000  000000000   0000000  000  0000000  00000000
# 000       000   000  0000  000     000     000       000     000   000     
# 000000    000   000  000 0 000     000     0000000   000    000    0000000 
# 000       000   000  000  0000     000          000  000   000     000     
# 000        0000000   000   000     000     0000000   000  0000000  00000000
    
setFontSize = (s) => 
    s = clamp 8, 80, s
    setState "fontSize", s
    editor.setFontSize s
    loadFile editor.currentFile, reload:true if editor.currentFile?
    
changeFontSize = (d) => setFontSize editor.size.fontSize + d
    
resetFontSize = => 
    delState 'fontSize'
    setFontSize prefs.get 'fontSize', editor.fontSizeDefault

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

# 00000000   0000000    0000000  000   000   0000000
# 000       000   000  000       000   000  000     
# 000000    000   000  000       000   000  0000000 
# 000       000   000  000       000   000       000
# 000        0000000    0000000   0000000   0000000 

window.onblur  = (event) -> window.editor.updateTitlebar()
window.onfocus = (event) -> 
    window.editor.updateTitlebar()
    if document.activeElement.className == 'body'
        if split.editorVisible()
            split.focus '.editor'
        else
            split.focus '.commandline-editor'
              
# 000   000  00000000  000   000
# 000  000   000        000 000 
# 0000000    0000000     00000  
# 000  000   000          000   
# 000   000  00000000     000   

document.onkeydown = (event) ->
    {mod, key, combo} = keyinfo.forEvent event

    return if not combo
    return if 'unhandled' != window.titlebar   .globalModKeyComboEvent mod, key, combo, event
    return if 'unhandled' != window.commandline.globalModKeyComboEvent mod, key, combo, event

    stop = (event) ->
        event.preventDefault()
        event.stopPropagation()        

    for i in [1..9]
        if combo is "command+#{i}" or combo is "alt+#{i}"
            ipc.send 'activateWindow', i
            return stop event
        
    switch combo
        when 'command+enter'     then return ipc.send 'execute', editor.text()
        when 'command+alt+i'     then return ipc.send 'toggleDevTools', winID
        when 'command+alt+k'     then return split.toggleLog()
        when 'command+k'         then return split.showOrClearLog()
        when 'command+='         then return changeFontSize +1
        when 'command+-'         then return changeFontSize -1
        when 'command+0'         then return resetFontSize()
        when 'command+shift+='   then return @changeZoom +1
        when 'command+shift+-'   then return @changeZoom -1
        when 'command+shift+0'   then return @resetZoom()
        when 'alt+`'             then return titlebar.showList()
        when 'alt+ctrl+left'     then return stop event, navigate.backward()
        when 'alt+ctrl+right'    then return stop event, navigate.forward()
        
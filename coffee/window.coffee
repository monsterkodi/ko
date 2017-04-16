# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00

{ splitFilePos, stopEvent, fileExists, fileList, resolve, keyinfo, clamp,
sw,sh, prefs, drag, pos, str, os, fs, post, path, error, log, $, _
}           = require 'kxk'
Split       = require './split'
FileEditor  = require './editor/fileeditor'
Area        = require './area/area'
Commandline = require './commandline/commandline'
Terminal    = require './terminal'
LogView     = require './logview'
Titlebar    = require './titlebar'
Navigate    = require './navigate'
FPS         = require './tools/fps'
Info        = require './editor/info'
encode      = require './tools/encode'
electron    = require 'electron'
atomicFile  = require 'write-file-atomic'
pkg         = require '../package.json'

remote      = electron.remote
dialog      = remote.dialog
Browser     = remote.BrowserWindow
win         = remote.getCurrentWindow()
winID       = win.id
editor      = null
logview     = null
terminal    = null
commandline = null

domain = require('domain').create()
domain.on 'error', (err) -> error "unhandled error: #{err}"
window.onerror = (event, source, line, col, err) -> 
    f = require('sorcery').loadSync(source.replace /coffee/g, 'js')
    if f?
        l = f.trace(line)
        s = "▲ #{l.source}:#{l.line} ▲ [ERROR] #{err}"
    else
        s = "▲ [ERROR] #{err}"
    post.toWin 'error', s
    post.toWin 'slog', s
    console.log s
    
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init()
addToRecent = (file) ->
    recent = prefs.get 'recentFiles', []
    _.pull recent, file
    recent.unshift file
    while recent.length > prefs.get 'recentFilesLength', 10
        recent.pop()
    prefs.set 'recentFiles', recent
    commandline.commands.open.setHistory recent.reversed()
    
#  0000000  000000000   0000000   000000000  00000000
# 000          000     000   000     000     000     
# 0000000      000     000000000     000     0000000 
#      000     000     000   000     000     000     
# 0000000      000     000   000     000     00000000
   
setState = window.setState = (key, value) -> prefs.set "windows:#{winID}:#{key}", value
getState = window.getState = (key, value) -> prefs.get "windows:#{winID}:#{key}", value
delState = window.delState = (key)        -> prefs.del "windows:#{winID}:#{key}"

# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

post.on 'shellCallbackData', (cmdData) -> commandline.commands['term'].onShellCallbackData cmdData
post.on 'singleCursorAtPos', (pos, opt) -> 
    editor.singleCursorAtPos pos, opt
    editor.scrollCursorToTop()
post.on 'openFile',          (options) -> openFile options
post.on 'focusEditor', -> split.focus 'editor'
post.on 'cloneFile',   -> post.toMain 'newWindowWithFile', editor.currentFile
post.on 'reloadFile',  -> reloadFile()
post.on 'saveFileAs',  -> saveFileAs()
post.on 'saveFile',    -> saveFile()
post.on 'loadFile', (file) -> loadFile file
post.on 'fileLinesChanged', (file, lineChanges) ->
    if file == editor.currentFile
        editor.applyForeignLineChanges lineChanges

# 000   000  000  000   000  00     00   0000000   000  000   000  
# 000 0 000  000  0000  000  000   000  000   000  000  0000  000  
# 000000000  000  000 0 000  000000000  000000000  000  000 0 000  
# 000   000  000  000  0000  000 0 000  000   000  000  000  0000  
# 00     00  000  000   000  000   000  000   000  000  000   000  

winMain = -> 
    window.winID = winID
    editor.updateTitlebar()
    
    s = getState 'fontSize'
    editor.setFontSize s if s
    
    if getState 'centerText'
        screenWidth = screenSize().width
        editor.centerText sw() == screenWidth, 0
        
    fps.toggle() if getState 'fps'
                     
#  0000000   0000000   000   000  00000000
# 000       000   000  000   000  000     
# 0000000   000000000   000 000   0000000 
#      000  000   000     000     000     
# 0000000   000   000      0      00000000

saveFile = (file) ->
    file ?= editor.currentFile
    if not file?
        saveFileAs()
        return
    editor.stopWatcher()
    
    if fileExists file
        stat = fs.statSync file
        mode = stat.mode
    else
        mode = 438
        
    atomicFile file, editor.text(), { encoding: 'utf8', mode: mode }, (err) ->
        editor.saveScrollCursorsAndSelections()
        if err?
            alert err
        else
            editor.setCurrentFile file
            post.toMain 'fileSaved', file, winID
            setState 'file', file

saveChanges = ->
    if editor.currentFile? and editor.do.hasLineChanges() and fileExists editor.currentFile
        atomicFile editor.currentFile, _.clone(editor.text()), encoding: 'utf8', (err) ->
            if err? then log "saving changes to #{file} failed", err

# 000       0000000    0000000   0000000  
# 000      000   000  000   000  000   000
# 000      000   000  000000000  000   000
# 000      000   000  000   000  000   000
# 0000000   0000000   000   000  0000000  

reloadFile = ->
    loadFile editor.currentFile, 
        reload:          true
        dontSave:        true

loadFile = (file, opt={}) ->
    return if not file? or not file.length
    editor.saveScrollCursorsAndSelections() if opt.reload
    [file,pos] = splitFilePos file
    file = resolve file
    if file != editor.currentFile or opt?.reload
        if not fileExists file
            error "window.loadFile -- no such file:", file
            return
            
        if not opt?.dontSave then saveChanges()            
            
        addToRecent file
        post.toMain 'navigate', 
            action: 'addFilePos'
            file: editor.currentFile
            pos:  editor.cursorPos()
            for: 'load'
        
        editor.setCurrentFile null, opt  # to stop watcher and reset scroll
        editor.setCurrentFile file, opt
        post.toMain 'fileLoaded', file, winID
        setState 'file', file
        commandline.fileLoaded file
    
    window.split.show 'editor'
        
    if pos[0] or pos[1] 
        editor.singleCursorAtPos pos
        editor.scrollCursorToTop()        
  
openFile = loadFile  
  
#  0000000   00000000   00000000  000   000        00000000  000  000      00000000   0000000
# 000   000  000   000  000       0000  000        000       000  000      000       000     
# 000   000  00000000   0000000   000 0 000        000000    000  000      0000000   0000000 
# 000   000  000        000       000  0000        000       000  000      000            000
#  0000000   000        00000000  000   000        000       000  0000000  00000000  0000000 

openFiles = (ofiles, options) -> # called from file dialog and open command
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
            log 'window.openFiles.warning: no files for:', ofiles
            return []
        setState 'openFilePath', path.dirname files[0]                    
        if not options?.newWindow
            file = resolve files.shift()
            if not post.get 'activateWindowWithFile', file
                loadFile file
        for file in files
            post.toMain 'newWindowWithFile', file
        return ofiles

window.openFiles = openFiles
window.openFile  = openFile
window.loadFile  = loadFile

# 0000000    000   0000000   000       0000000    0000000 
# 000   000  000  000   000  000      000   000  000      
# 000   000  000  000000000  000      000   000  000  0000
# 000   000  000  000   000  000      000   000  000   000
# 0000000    000  000   000  0000000   0000000    0000000 

openFile = (options) ->
    dir = path.dirname editor.currentFile if editor.currentFile
    dir ?= resolve '.'
    dialog.showOpenDialog 
        title: "Open File"
        defaultPath: getState 'openFilePath',  dir
        properties: ['openFile', 'openDirectory', 'multiSelections']
        filters: [
            name: 'Coffee-Script', extensions: ['coffee']
        ,
            name: 'All Files', extensions: ['*']
        ]
        , (files) -> openFiles files, options

saveFileAs = ->
    dialog.showSaveDialog 
        title: "Save File As"
        defaultPath: editor.currentFile
        properties: ['openFile', 'createDirectory']
        filters: [
            name: 'Coffee-Script', extensions: ['coffee']
        ,
            name: 'All Files', extensions: ['*']
        ]
        , (file) -> 
            if file
                addToRecent file
                saveFile file

titlebar = window.titlebar = new Titlebar
navigate = window.navigate = new Navigate

#  0000000  00000000   000      000  000000000
# 000       000   000  000      000     000   
# 0000000   00000000   000      000     000   
#      000  000        000      000     000   
# 0000000   000        0000000  000     000   

split = window.split = new Split()
split.on 'split', (s) ->
    area.resized()
    terminal.resized()
    commandline.resized()
    editor.resized()
    logview.resized()
    setState 'split', s

terminal = window.terminal = new Terminal 'terminal'

terminal.on 'fileLineChange', (file, lineChange) -> # sends changes to all windows
    post.toAllWins 'winFileLinesChanged', -1, file, [lineChange]

area        = window.area        = new Area 'area'
editor      = window.editor      = new FileEditor 'editor'
commandline = window.commandline = new Commandline 'commandline-editor'
logview     = window.logview     = new LogView 'logview'
info        = window.info        = new Info editor

editor.on 'changed', (changeInfo) ->
    return if changeInfo.foreign
    if changeInfo.changes.length
        post.toOtherWins 'winFileLinesChanged', winID, editor.currentFile, changeInfo.changes
        navigate.addFilePos file: editor.currentFile, pos: editor.cursorPos()

window.editorWithName = (n) ->
    switch n
        when 'editor'   then editor
        when 'command', 'commandline' then commandline
        when 'terminal' then terminal
        when 'logview'  then logview
        else editor
        
fps = window.fps = new FPS()

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000     
# 0000000    0000000   0000000   000    000    0000000 
# 000   000  000            000  000   000     000     
# 000   000  00000000  0000000   000  0000000  00000000

screenSize = -> electron.screen.getPrimaryDisplay().workAreaSize
    
win.on 'move', -> setState 'bounds', win.getBounds()
window.onresize = ->
    split.resized()
    setState 'bounds', win.getBounds()
    if getState 'centerText', false
        screenWidth = screenSize().width
        editor.centerText sw() == screenWidth, 0

window.onload = -> 
    split.resized()
    info.reload()
    
window.onunload = -> 
    saveChanges()
    editor.setCurrentFile null, noSaveScroll: true # to stop watcher

# 0000000   0000000  00000000   00000000  00000000  000   000   0000000  000   000   0000000   000000000
#000       000       000   000  000       000       0000  000  000       000   000  000   000     000   
#0000000   000       0000000    0000000   0000000   000 0 000  0000000   000000000  000   000     000   
#     000  000       000   000  000       000       000  0000       000  000   000  000   000     000   
#0000000    0000000  000   000  00000000  00000000  000   000  0000000   000   000   0000000      000   

screenShot = ->
    win.capturePage (img) ->
        file = 'screenShot.png'
        remote.require('fs').writeFile file, img.toPng(), (err) -> 
            log 'saving screenshot failed', err if err?
            log "screenshot saved to #{file}"

#  0000000  00000000  000   000  000000000  00000000  00000000       000000000  00000000  000   000  000000000
# 000       000       0000  000     000     000       000   000         000     000        000 000      000   
# 000       0000000   000 0 000     000     0000000   0000000           000     0000000     00000       000   
# 000       000       000  0000     000     000       000   000         000     000        000 000      000   
#  0000000  00000000  000   000     000     00000000  000   000         000     00000000  000   000     000   

toggleCenterText = ->
    if not getState 'centerText', false
        setState 'centerText', true
        editor.centerText sw() == screenSize().width
    else
        setState 'centerText', false
        editor.centerText false

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000     
# 000000    000   000  000 0 000     000        0000000   000    000    0000000 
# 000       000   000  000  0000     000             000  000   000     000     
# 000        0000000   000   000     000        0000000   000  0000000  00000000
    
setFontSize = (s) -> 
    s = clamp 8, 80, s
    setState "fontSize", s
    editor.setFontSize s
    loadFile editor.currentFile, reload:true if editor.currentFile?
    
changeFontSize = (d) -> setFontSize editor.size.fontSize + d
    
resetFontSize = -> 
    delState 'fontSize'
    setFontSize editor.fontSizeDefault

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
            split.focus 'editor'
        else
            split.focus 'commandline-editor'
              
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

    for i in [1..9]
        if combo is "alt+#{i}"
            post.toMain 'activateWindow', i
            return stopEvent event
    
    switch combo
        when 'command+alt+i'     then return post.toMain 'toggleDevTools', winID
        when 'ctrl+w' # close current file  
            editor.setCurrentFile null
            editor.setText ''
            post.toMain 'fileLoaded', '', winID
            return
        when 'f3'                 then return screenShot()
        when 'command+\\'         then return toggleCenterText()
        when 'command+k'          then return commandline.clear()
        when 'command+alt+k'      then return split.toggleLog()
        when 'command+alt+ctrl+k' then return split.showOrClearLog()
        when 'command+='          then return changeFontSize +1
        when 'command+-'          then return changeFontSize -1
        when 'command+0'          then return resetFontSize()
        when 'command+shift+='    then return @changeZoom +1
        when 'command+shift+-'    then return @changeZoom -1
        when 'command+shift+0'    then return @resetZoom()
        when 'alt+`'              then return titlebar.showList()
        when 'command+ctrl+left'  then return stopEvent event, navigate.backward()
        when 'command+ctrl+right' then return stopEvent event, navigate.forward()
        when 'command+shift+y'    then return split.maximizeEditor()

winMain()

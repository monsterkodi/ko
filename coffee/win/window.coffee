# 000   000  000  000   000  0000000     0000000   000   000
# 000 0 000  000  0000  000  000   000  000   000  000 0 000
# 000000000  000  000 0 000  000   000  000   000  000000000
# 000   000  000  000  0000  000   000  000   000  000   000
# 00     00  000  000   000  0000000     0000000   00     00

{ splitFilePos, stopEvent, fileExists, fileList, resolve, keyinfo, clamp,
sw,sh, prefs, drag, pos, str, os, fs, post, path, error, log, $, _
}           = require 'kxk'
Split       = require './split'
Terminal    = require './terminal'
Titlebar    = require './titlebar'
LogView     = require './logview'
Area        = require '../area/area'
Info        = require '../editor/info'
FileEditor  = require '../editor/fileeditor'
Commandline = require '../commandline/commandline'
Navigate    = require '../main/navigate'
FPS         = require '../tools/fps'
encode      = require '../tools/encode'
electron    = require 'electron'
atomicFile  = require 'write-file-atomic'
pkg         = require '../../package.json'

remote      = electron.remote
dialog      = remote.dialog
Browser     = remote.BrowserWindow
win         = window.win   = remote.getCurrentWindow()
winID       = window.winID = win.id
editor      = null
logview     = null
area        = null
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
    post.emit 'error', s
    post.emit 'slog', s
    console.log s
    
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init()
window.prefs = prefs

addToRecent = (file) ->
    recent = prefs.get 'recentFiles', []
    _.pull recent, file
    recent.unshift file
    while recent.length > prefs.get 'recentFilesLength', 10
        recent.pop()
    prefs.set 'recentFiles', recent
    commandline.commands.open.setHistory recent.reverse()
    
#  0000000  000000000   0000000   000000000  00000000
# 000          000     000   000     000     000     
# 0000000      000     000000000     000     0000000 
#      000     000     000   000     000     000     
# 0000000      000     000   000     000     00000000
   
getState = (key, value) -> prefs.get "windows:#{winID}:#{key}", value
delState = (key)        -> prefs.del "windows:#{winID}:#{key}"
setState = (key, value) -> 
    # log "window.setState key:#{key}", value
    prefs.set "windows:#{winID}:#{key}", value

window.setState = setState
window.getState = getState
window.delState = delState

saveState = -> 
    editor.saveScrollCursorsAndSelections()
    post.toMain 'stateSaved'

# 00000000    0000000    0000000  000000000  
# 000   000  000   000  000          000     
# 00000000   000   000  0000000      000     
# 000        000   000       000     000     
# 000         0000000   0000000      000     

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
post.on 'saveState',   -> saveState()
post.on 'loadFile', (file) -> loadFile file
post.on 'fileLinesChanged', (file, lineChanges) ->
    if file == editor.currentFile
        editor.applyForeignLineChanges lineChanges
        
post.on 'postEditorState', -> 
    post.toAll 'editorState', winID, 
        lines:      editor.lines() 
        cursors:    editor.cursors() 
        main:       editor.mainCursor()
        selections: editor.selections()
        highlights: editor.highlights()

post.on 'ping', (wID, argA, argB) -> post.toWin wID, 'pong', winID, argA, argB

# 000   000  000  000   000  00     00   0000000   000  000   000  
# 000 0 000  000  0000  000  000   000  000   000  000  0000  000  
# 000000000  000  000 0 000  000000000  000000000  000  000 0 000  
# 000   000  000  000  0000  000 0 000  000   000  000  000  0000  
# 00     00  000  000   000  000   000  000   000  000  000   000  

winMain = -> 
    
    # 000  000   000  000  000000000  
    # 000  0000  000  000     000     
    # 000  000 0 000  000     000     
    # 000  000  0000  000     000     
    # 000  000   000  000     000     

    titlebar    = window.titlebar    = new Titlebar
    navigate    = window.navigate    = new Navigate
    split       = window.split       = new Split()
    terminal    = window.terminal    = new Terminal 'terminal'
    area        = window.area        = new Area 'area'
    editor      = window.editor      = new FileEditor 'editor'
    commandline = window.commandline = new Commandline 'commandline-editor'
    logview     = window.logview     = new LogView 'logview'
    info        = window.info        = new Info editor
    fps         = window.fps         = new FPS()

    split.on 'split', (s) ->
        area.resized()
        terminal.resized()
        commandline.resized()
        editor.resized()
        logview.resized()
    
    terminal.on 'fileLineChange', (file, lineChange) -> # sends changes to all windows
        post.toWins 'fileLinesChanged', file, [lineChange]
    
    editor.on 'changed', (changeInfo) ->
        return if changeInfo.foreign
        if changeInfo.changes.length
            post.toOtherWins 'fileLinesChanged', editor.currentFile, changeInfo.changes
            navigate.addFilePos file: editor.currentFile, pos: editor.cursorPos()

    editor.updateTitlebar()
    
    s = getState 'fontSize'
    editor.setFontSize s if s
    
    if getState 'centerText'
        screenWidth = screenSize().width
        editor.centerText sw() == screenWidth, 0
        
    fps.toggle() if getState 'fps'
    
    commandline.restoreState()
    split.restoreState()

window.onload = -> 
    split.resized()
    info.reload()
    
# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

window.editorWithName = (n) ->
    switch n
        when 'editor'   then editor
        when 'command', 'commandline' then commandline
        when 'terminal' then terminal
        when 'logview'  then logview
        else editor
                 
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
            editor.emit 'save'
            editor.setCurrentFile file
            post.toMain 'fileSaved', file, winID
            setState 'file', file

saveChanges = ->
    
    if editor.currentFile? and editor.do.hasLineChanges() and fileExists editor.currentFile
        stat = fs.statSync editor.currentFile
        atomicFile editor.currentFile, editor.text(), { encoding: 'utf8', mode: stat.mode }, (err) ->            
            return error "window.saveChanges failed #{err}" if err

# 000   000  000   000  000       0000000    0000000   0000000    
# 000   000  0000  000  000      000   000  000   000  000   000  
# 000   000  000 0 000  000      000   000  000000000  000   000  
# 000   000  000  0000  000      000   000  000   000  000   000  
#  0000000   000   000  0000000   0000000   000   000  0000000    

window.onunload = ->
    saveChanges()
    editor.setText ''
    post.toMain 'fileLoaded', '', winID # to clear prefs?
    editor.setCurrentFile null # to stop watcher

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
    # return if not file? or not file.length
    editor.saveScrollCursorsAndSelections()
    
    if file?
        [file, pos] = splitFilePos file
        file = resolve file
        
    if file != editor.currentFile or opt?.reload
        
        # log 'loadFile', file, editor.currentFile, opt
        
        if file? and not fileExists file
            # return error "window.loadFile -- no such file:", file
            file = null
            
        if not opt?.dontSave then saveChanges()
            
        post.toMain 'navigate', 
            action: 'addFilePos'
            file: editor.currentFile
            pos:  editor.cursorPos()
            for: 'load'
        
        editor.setCurrentFile null, opt  # to stop watcher and reset scroll
        
        if file?
            addToRecent file if file?
            editor.setCurrentFile file, opt
            post.toOthers 'fileLoaded', file, winID
            commandline.fileLoaded file
            
        setState 'file', file
    
    window.split.show 'editor'
        
    if pos? and pos[0] or pos[1] 
        editor.singleCursorAtPos pos
        editor.scrollCursorToTop()        
  
openFile = loadFile  
  
#  0000000   00000000   00000000  000   000        00000000  000  000      00000000   0000000
# 000   000  000   000  000       0000  000        000       000  000      000       000     
# 000   000  00000000   0000000   000 0 000        000000    000  000      0000000   0000000 
# 000   000  000        000       000  0000        000       000  000      000            000
#  0000000   000        00000000  000   000        000       000  0000000  00000000  0000000 

openFiles = (ofiles, options) -> # called from file dialog and open command and browser
    
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
        
        if not options?.newWindow and not options?.newTab
            file = resolve files.shift()
            loadFile file
            
        for file in files
            if options?.newWindow
                post.toMain 'newWindowWithFile', file
            else
                post.emit 'newTabWithFile', file
            
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
        when 'command+alt+i'      then return post.toMain 'toggleDevTools', winID
        when 'ctrl+w'             then return loadFile ''
        when 'f3'                 then return screenShot()
        when 'command+\\'         then return toggleCenterText()
        when 'command+k'          then return commandline.clear()
        when 'command+alt+k'      then return split.toggleLog()
        when 'alt+ctrl+left'      then return stopEvent event, post.toMain 'activatePrevWindow', winID
        when 'alt+ctrl+right'     then return stopEvent event, post.toMain 'activateNextWindow', winID
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

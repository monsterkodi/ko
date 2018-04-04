###
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
###

{ stopEvent, fileList, keyinfo, atomic, prefs, state, stash, first, reversed, childp, 
  drag, noon, post, slash, clamp, pos, str, sw, sh, os, fs, empty, log, error, _ } = require 'kxk'

Split       = require './split'
Terminal    = require './terminal'
Titlebar    = require './titlebar'
Menu        = require './menu'
LogView     = require './logview'
Info        = require './info'
Area        = require '../stage/area'
Editor      = require '../editor/editor'
Commandline = require '../commandline/commandline'
FileEditor  = require '../editor/fileeditor'
Navigate    = require '../main/navigate'
FPS         = require '../tools/fps'
CWD         = require '../tools/cwd'
scheme      = require '../tools/scheme'
electron    = require 'electron'
pkg         = require '../../package.json'

remote      = electron.remote
dialog      = remote.dialog
Browser     = remote.BrowserWindow
win         = window.win   = remote.getCurrentWindow()
winID       = window.winID = win.id
editor      = null
mainmenu    = null
logview     = null
area        = null
terminal    = null
commandline = null
titlebar    = null
tabs        = null

# post.debug()

window.onerror = (event, source, line, col, err) ->

    f = require('sorcery').loadSync(source.replace /coffee/g, 'js')
    if f?
        l = f.trace(line)
        s = "▲ #{source}:#{l.line} ▲ [ERROR] #{err}"
    else
        s = "▲ [ERROR] #{err} #{slash.tilde source}:#{line}:#{col}"
    post.emit 'error', s
    post.emit 'slog', s
    console.log s


# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000
# 00000000   0000000    0000000   000000    0000000
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000

prefs.init()
state.init()
window.prefs = prefs
window.state = state
window.stash = new stash "win/#{winID}"

post.setMaxListeners 20

addToRecent = (file) ->

    recent = state.get 'recentFiles', []
    return if file == first recent
    _.pull recent, file
    recent.unshift file
    while recent.length > prefs.get 'recentFilesLength', 20
        recent.pop()

    state.set 'recentFiles', recent
    commandline.commands.open.setHistory reversed recent

saveStash = ->

    post.emit 'stash'
    editor.saveScrollCursorsAndSelections()
    window.stash.save()
    post.toMain 'stashSaved'

restoreWin = ->

    if bounds = window.stash.get 'bounds'
        win.setBounds bounds

    if window.stash.get 'devTools'
        win.webContents.openDevTools()

# 00000000    0000000    0000000  000000000
# 000   000  000   000  000          000
# 00000000   000   000  0000000      000
# 000        000   000       000     000
# 000         0000000   0000000      000

post.on 'shellCallbackData', (cmdData) -> commandline.commands['term'].onShellCallbackData cmdData
post.on 'singleCursorAtPos', (pos, opt) ->
    editor.singleCursorAtPos pos, opt
    editor.scroll.cursorToTop()
post.on 'focusEditor',       -> split.focus 'editor'
post.on 'cloneFile',         -> post.toMain 'newWindowWithFile', editor.currentFile
post.on 'reloadFile',        -> reloadFile()
post.on 'reloadWin',         -> reloadWin()
post.on 'saveFileAs',        -> saveFileAs()
post.on 'saveFile',          -> saveFile()
post.on 'saveStash',         -> saveStash()
post.on 'openFile',   (opt)  -> openFileDialog opt
post.on 'reloadTab', (file)  -> reloadTab file
post.on 'loadFile',  (file)  -> loadFile  file
post.on 'loadFiles', (files, opt) -> openFiles files, opt
post.on 'menuAction', (action, args) -> menuAction action, args
post.on 'editorFocus', (editor) ->
    window.setLastFocus editor.name
    window.focusEditor = editor
    window.textEditor = editor if editor.name != 'commandline-editor'

# testing related ...

post.on 'mainlog', -> log.apply log, arguments 

post.on 'ping', (wID, argA, argB) -> post.toWin wID, 'pong', winID, argA, argB
post.on 'postEditorState', ->
    post.toAll 'editorState', winID,
        lines:      editor.lines()
        cursors:    editor.cursors()
        main:       editor.mainCursor()
        selections: editor.selections()
        highlights: editor.highlights()

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
    tabs        = window.tabs        = titlebar.tabs
    navigate    = window.navigate    = new Navigate
    split       = window.split       = new Split()
    terminal    = window.terminal    = new Terminal 'terminal'
    area        = window.area        = new Area 'area'
    editor      = window.editor      = new FileEditor 'editor'
    commandline = window.commandline = new Commandline 'commandline-editor'
    logview     = window.logview     = new LogView 'logview'
    info        = window.info        = new Info editor
    mainmenu    = window.mainmenu    = new Menu 'menu'
    fps         = window.fps         = new FPS()
    cwd         = window.cwd         = new CWD()

    window.textEditor = window.focusEditor = editor
    window.lastFocus = editor.name

    restoreWin()

    split.on 'split', (s) ->
        area.resized()
        terminal.resized()
        commandline.resized()
        editor.resized()
        logview.resized()

    terminal.on 'fileSearchResultChange', (file, lineChange) -> # sends changes to all windows
        post.toWins 'fileLineChanges', file, [lineChange]

    editor.on 'changed', (changeInfo) ->
        return if changeInfo.foreign
        if changeInfo.changes.length
            post.toOtherWins 'fileLineChanges', editor.currentFile, changeInfo.changes
            navigate.addFilePos file: editor.currentFile, pos: editor.cursorPos()

    s = window.stash.get 'fontSize', prefs.get 'editorFontSize', 19
    editor.setFontSize s if s

    if window.stash.get 'centerText'
        editor.centerText true, 0

    post.emit 'restore'
    win.show()
    editor.focus()

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

    if slash.fileExists file
        stat = fs.statSync file
        mode = stat.mode
    else
        mode = 438

    isWritable = (p) ->
        try
            fs.accessSync slash.resolve(p), fs.R_OK | fs.W_OK
            return true
        catch
            return false
        
    atomic file, editor.text(), { encoding: 'utf8', mode: mode }, (err) ->

        editor.saveScrollCursorsAndSelections()

        if not empty err
            if err.code == 'EPERM' and slash.win()
                p = slash.resolve file
                try
                    childp.exec "p4 edit #{slash.unslash(p)}", (err) ->
                        return error "p4 edit failed", err if not empty err
                        if isWritable p
                            saveFile p
                            return
                        else
                            log 'still not writable?', p
                catch err
                    error "can't p4 edit", err
                return
            error "saving file #{file}:", err
            split.show 'logview'
        else
            fileSavedSuccessfully file

fileSavedSuccessfully = (file) ->
    
    editor.setCurrentFile      file
    post.toOthers 'fileSaved', file, window.winID
    post.emit     'saved',     file
            
window.saveChanges = ->

    if editor.currentFile? and editor.do.hasLineChanges() and slash.fileExists editor.currentFile
        stat = fs.statSync editor.currentFile
        atomic editor.currentFile, editor.text(), { encoding: 'utf8', mode: stat.mode }, (err) ->
            return error "window.saveChanges failed #{err}" if err

#  0000000   000   000   0000000  000       0000000    0000000  00000000
# 000   000  0000  000  000       000      000   000  000       000
# 000   000  000 0 000  000       000      000   000  0000000   0000000
# 000   000  000  0000  000       000      000   000       000  000
#  0000000   000   000   0000000  0000000   0000000   0000000   00000000

onMove  = -> window.stash.set 'bounds', win.getBounds()

clearListeners = ->

    document.removeEventListener 'keydown', onKeyDown
    win.removeListener 'close', onClose
    win.removeListener 'move',  onMove
    win.webContents.removeAllListeners 'devtools-opened'
    win.webContents.removeAllListeners 'devtools-closed'

onClose = ->

    window.saveChanges()
    editor.setText ''
    editor.stopWatcher()
    window.stash.clear()
    clearListeners()

#  0000000   000   000  000       0000000    0000000   0000000
# 000   000  0000  000  000      000   000  000   000  000   000
# 000   000  000 0 000  000      000   000  000000000  000   000
# 000   000  000  0000  000      000   000  000   000  000   000
#  0000000   000   000  0000000   0000000   000   000  0000000

window.onload = ->

    split.resized()
    info.reload()
    win.on 'close', onClose
    win.on 'move',  onMove
    win.webContents.on 'devtools-opened', -> window.stash.set 'devTools', true
    win.webContents.on 'devtools-closed', -> window.stash.set 'devTools'

# 00000000   00000000  000       0000000    0000000   0000000
# 000   000  000       000      000   000  000   000  000   000
# 0000000    0000000   000      000   000  000000000  000   000
# 000   000  000       000      000   000  000   000  000   000
# 000   000  00000000  0000000   0000000   000   000  0000000

reloadWin = ->

    saveStash()
    clearListeners()
    editor.stopWatcher()
    win.webContents.reloadIgnoringCache()

# 000       0000000    0000000   0000000
# 000      000   000  000   000  000   000
# 000      000   000  000000000  000   000
# 000      000   000  000   000  000   000
# 0000000   0000000   000   000  0000000

reloadFile = ->

    loadFile editor.currentFile,
        reload:   true
        dontSave: true

    if editor.currentFile?
        post.toOtherWins 'reloadTab', editor.currentFile

reloadTab = (file) ->
    if file == editor?.currentFile
        loadFile editor?.currentFile,
            reload:   true
            dontSave: true
    else
        post.emit 'revertFile', file

loadFile = (file, opt={}) ->

    file = null if file? and file.length <= 0

    editor.saveScrollCursorsAndSelections()

    if file?
        [file, pos] = slash.splitFilePos file
        file = slash.resolve file

    if file != editor?.currentFile or opt?.reload
        if file? and not slash.fileExists file
            file = null

        if not opt?.dontSave
            window.saveChanges()

        editor.clear skip:file?

        if file?

            addToRecent file

            if tab = tabs.tab file
                tab.setActive()

            editor.setCurrentFile file, opt

            post.toOthers 'fileLoaded', file, winID
            post.emit 'cwdSet', slash.dir file

    window.split.raise 'editor'

    if pos? and pos[0] or pos[1]
        editor.singleCursorAtPos pos
        editor.scroll.cursorToTop()

#  0000000   00000000   00000000  000   000        00000000  000  000      00000000   0000000
# 000   000  000   000  000       0000  000        000       000  000      000       000
# 000   000  00000000   0000000   000 0 000        000000    000  000      0000000   0000000
# 000   000  000        000       000  0000        000       000  000      000            000
#  0000000   000        00000000  000   000        000       000  0000000  00000000  0000000

openFiles = (ofiles, options) -> # called from file dialog, open command and browser

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

        window.stash.set 'openFilePath', slash.dirname files[0]

        if not options?.newWindow and not options?.newTab
            file = slash.resolve files.shift()
            loadFile file

        for file in files
            if options?.newWindow
                post.toMain 'newWindowWithFile', file
            else
                post.emit 'newTabWithFile', file

        return ofiles

window.openFiles        = openFiles
window.openFileDialog   = openFileDialog
window.loadFile         = loadFile

# 0000000    000   0000000   000       0000000    0000000
# 000   000  000  000   000  000      000   000  000
# 000   000  000  000000000  000      000   000  000  0000
# 000   000  000  000   000  000      000   000  000   000
# 0000000    000  000   000  0000000   0000000    0000000

openFileDialog = (opt) ->

    dir = slash.dirname editor.currentFile if editor?.currentFile
    dir ?= slash.resolve '.'
    dialog.showOpenDialog
        title: "Open File"
        defaultPath: window.stash.get 'openFilePath',  dir
        # properties: ['openFile', 'openDirectory', 'multiSelections']
        properties: ['openFile', 'multiSelections']
        filters: [
            name: 'All Files', extensions: ['*']
        ,
            name: 'CoffeeScript', extensions: ['coffee']
        ]
        , (files) -> openFiles files, opt

saveFileAs = ->

    dialog.showSaveDialog
        title: "Save File As"
        defaultPath: slash.unslash slash.dir editor.currentFile
        properties: ['openFile', 'createDirectory']
        # filters: [ name: 'All Files', extensions: ['*'] , name: 'Coffee-Script', extensions: ['coffee'] ]
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

window.onresize = ->

    split.resized()
    window.stash.set 'bounds', win.getBounds()
    if window.stash.get 'centerText', false
        editor.centerText true, 200

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

    if state.get "invisibles|#{editor.currentFile}", false
        editor.toggleInvisibles()
        restoreInvisibles = true
        
    if not window.stash.get 'centerText', false
        window.stash.set 'centerText', true
        editor.centerText true
    else
        window.stash.set 'centerText', false
        editor.centerText false
        
    if restoreInvisibles
        editor.toggleInvisibles()

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000
# 000000    000   000  000 0 000     000        0000000   000    000    0000000
# 000       000   000  000  0000     000             000  000   000     000
# 000        0000000   000   000     000        0000000   000  0000000  00000000

setFontSize = (s) ->
        
    s = prefs.get('editorFontSize', 19) if not _.isFinite s
    s = clamp 8, 100, s

    # log s
    
    window.stash.set "fontSize", s
    editor.setFontSize s
    loadFile editor.currentFile, reload:true if editor.currentFile?

changeFontSize = (d) ->
    
    if      editor.size.fontSize >= 30
        f = 4
    else if editor.size.fontSize >= 50
        f = 10
    else if editor.size.fontSize >= 20
        f = 2
    else
        f = 1
    setFontSize editor.size.fontSize + f*d

resetFontSize = ->
    
    defaultFontSize = prefs.get 'editorFontSize', 19
    window.stash.set 'fontSize', defaultFontSize
    setFontSize defaultFontSize

addToShelf = ->
    
    fileBrowser = commandline.commands.browse.browser
    return if window.lastFocus == 'shelf'
    if window.lastFocus.startsWith fileBrowser.name
        path = fileBrowser.columnWithName(window.lastFocus).activePath()
    else
        path = editor.currentFile
    post.emit 'addToShelf', path

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

window.onblur  = (event) -> post.emit 'winFocus', false
window.onfocus = (event) ->
    post.emit 'winFocus', true
    if document.activeElement.className == 'body'
        if split.editorVisible()
            split.focus 'editor'
        else
            split.focus 'commandline-editor'

window.setLastFocus = (name) ->
    # log "window.setLastFocus #{name}"
    window.lastFocus = name

# 00     00  00000000  000   000  000   000      0000000    0000000  000000000  000   0000000   000   000
# 000   000  000       0000  000  000   000     000   000  000          000     000  000   000  0000  000
# 000000000  0000000   000 0 000  000   000     000000000  000          000     000  000   000  000 0 000
# 000 0 000  000       000  0000  000   000     000   000  000          000     000  000   000  000  0000
# 000   000  00000000  000   000   0000000      000   000   0000000     000     000   0000000   000   000

menuAction = (name, args) ->

    # log "window.menuAction0 #{name} #{args}"

    if action = Editor.actionWithName name
        # log 'menuAction', name, action
        if action.key? and _.isFunction window.focusEditor[action.key]
            window.focusEditor[action.key] args
            return

    if 'unhandled' != window.commandline.handleMenuAction name
        return

    switch name

        when 'doMacro'               then return window.commandline.commands.macro.execute args
        when 'Undo'                  then return @window.focusEditor.do.undo()
        when 'Redo'                  then return @window.focusEditor.do.redo()
        when 'Cut'                   then return @window.focusEditor.cut()
        when 'Copy'                  then return @window.focusEditor.copy()
        when 'Paste'                 then return @window.focusEditor.paste()
        when 'New Tab'               then return post.emit 'newEmptyTab'
        when 'Toggle Scheme'         then return scheme.toggle()
        when 'Toggle Center Text'    then return toggleCenterText()
        when 'Font Size Increase'    then return changeFontSize +1
        when 'Font Size Decrease'    then return changeFontSize -1
        when 'Font Size Reset'       then return resetFontSize()
        when 'Open Window List'      then return titlebar.showList()
        when 'Navigate Backward'     then return navigate.backward()
        when 'Navigate Forward'      then return navigate.forward()
        when 'Maximize Editor'       then return split.maximizeEditor()
        when 'Add to Shelf'          then return addToShelf()
        when 'Toggle History'        then return window.commandline.commands.browse.browser.shelf.toggleHistory()
        when 'Activate Next Tab'     then return window.tabs.navigate 'right'
        when 'Activate Previous Tab' then return window.tabs.navigate 'left'
        when 'Move Tab Left'         then return window.tabs.move 'left'
        when 'Move Tab Right'        then return window.tabs.move 'right'
        when 'Toggle Menu'           then return window.mainmenu.toggle()
        when 'Show Menu'             then return window.mainmenu.show()
        when 'Hide Menu'             then return window.mainmenu.hide()
        when 'Open DevTools'         then return win.webContents.openDevTools()
        when 'Open...'               then return openFileDialog()
        when 'Open In New Tab...'    then return openFileDialog newTab: true
        when 'Open In New Window...' then return openFileDialog newWindow: true
        when 'Save'                  then return saveFile()
        when 'Save As ...'           then return saveFileAs()
        when 'Reload'                then return reloadFile()
        when 'Reload Window'         then return reloadWin()
        when 'Close Tab or Window'   then return post.emit 'closeTabOrWindow'
        when 'Close Other Tabs'      then return post.emit 'closeOtherTabs'
        when 'Close Window'          then return post.emit 'closeWindow'
        when 'Maximize'              then return post.toMain 'maximizeWindow', winID
        when 'Minimize'              then return win.minimize()
        when 'Fullscreen'            then return win.setFullScreen !win.isFullScreen()
        
        when 'Preferences'           
            # log 'prefs.store.file', prefs.store.file
            return openFiles [prefs.store.file], newTab:true

    switch name
        when 'Cycle Windows' then args = winID
    
    log "unhandled menu action! ------------ posting to main '#{name}' args: #{args}"
    
    post.toMain 'menuAction', name, args

window.menuAction = menuAction

# 000   000  00000000  000   000
# 000  000   000        000 000
# 0000000    0000000     00000
# 000  000   000          000
# 000   000  00000000     000

onKeyDown = (event) ->

    { mod, key, combo, char } = keyinfo.forEvent event
    handleModKeyComboCharEvent mod, key, combo, char, event

handleModKeyComboCharEvent = (mod, key, combo, char, event) ->

    return if not combo

    return stopEvent(event) if 'unhandled' != window.mainmenu   .globalModKeyComboEvent mod, key, combo, event
    return stopEvent(event) if 'unhandled' != window.titlebar   .globalModKeyComboEvent mod, key, combo, event
    return stopEvent(event) if 'unhandled' != window.commandline.globalModKeyComboEvent mod, key, combo, event

    for i in [1..9]
        if combo is "alt+#{i}"
            return stopEvent event, post.toMain 'activateWindow', i

    switch combo
        # when 'f3'                 then return stopEvent event, screenShot()
        when 'command+alt+k', 'alt+ctrl+k' then return stopEvent event, split.toggleLog()
        when 'alt+k'
            if window.focusEditor == window.editor then window.logview.clear() else window.focusEditor.clear()
            return stopEvent event
        when 'command+shift+='    then return stopEvent event, @changeZoom +1
        when 'command+shift+-'    then return stopEvent event, @changeZoom -1
        when 'command+shift+0'    then return stopEvent event, @resetZoom()
        when 'command+alt+y'      then return stopEvent event, split.do 'minimize editor'

    # log 'handleModKeyComboCharEvent2', mod, key, combo, char

document.addEventListener 'keydown', onKeyDown

winMain()

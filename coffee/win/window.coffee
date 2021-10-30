###
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
###

{ _, args, clamp, klog, post, prefs, scheme, stash, stopEvent, store, win } = require 'kxk'

Split       = require './split'
Terminal    = require './terminal'
Tabs        = require './tabs'
Titlebar    = require './titlebar'
Info        = require './info'
FileHandler = require './filehandler'
FileWatcher = require '../tools/watcher'
Editor      = require '../editor/editor'
Commandline = require '../commandline/commandline'
FileEditor  = require '../editor/fileeditor'
Navigate    = require '../main/navigate'
FPS         = require '../tools/fps'
CWD         = require '../tools/cwd'
scheme      = require '../tools/scheme'
projects    = require '../tools/projects'
electron    = require 'electron'
pkg         = require '../../package.json'

editor      = null
mainmenu    = null
terminal    = null
commandline = null
titlebar    = null
tabs        = null
filehandler = null
filewatcher = null

# 000   000  000  000   000  0000000     0000000   000   000  
# 000 0 000  000  0000  000  000   000  000   000  000 0 000  
# 000000000  000  000 0 000  000   000  000   000  000000000  
# 000   000  000  000  0000  000   000  000   000  000   000  
# 00     00  000  000   000  0000000     0000000   00     00  

class Window extends win
    
    @: ->

        super
            dir:            __dirname
            menuTemplate:   require './menu'
            pkg:            require '../../package.json'
            menu:           '../../coffee/menu.noon'
            icon:           '../../img/menu@2x.png'
            scheme:         false
    
        window.stash = new stash "win/#{@id}" separator:'|'
            
        filehandler = window.filehandler = new FileHandler
        filewatcher = window.filewatcher = new FileWatcher
        tabs        = window.tabs        = new Tabs window.titlebar.elem
        titlebar    =                      new Titlebar
        navigate    = window.navigate    = new Navigate()
        split       = window.split       = new Split()
        terminal    = window.terminal    = new Terminal 'terminal'
        editor      = window.editor      = new FileEditor 'editor'
        commandline = window.commandline = new Commandline 'commandline-editor'
        info        = window.info        = new Info editor
        fps         = window.fps         = new FPS()
        cwd         = window.cwd         = new CWD()
    
        window.textEditor = window.focusEditor = editor
        window.setLastFocus editor.name
    
        restoreWin()
        scheme.set prefs.get 'scheme' 'dark'
    
        terminal.on 'fileSearchResultChange' (file, lineChange) -> # sends changes to all windows
            post.toWins 'fileLineChanges' file, [lineChange]
    
        editor.on 'changed' (changeInfo) ->
            return if changeInfo.foreign
            if changeInfo.changes.length
                post.toOtherWins 'fileLineChanges' editor.currentFile, changeInfo.changes
                navigate.addFilePos file: editor.currentFile, pos: editor.cursorPos()
    
        s = window.stash.get 'fontSize' prefs.get 'editorFontSize' 19
        editor.setFontSize s if s
    
        if window.stash.get 'centerText'
            editor.centerText true 0
    
        post.emit 'restore'
        editor.focus()

    onMoved: (bounds) => window.stash.set 'bounds' bounds
        
    # 00     00  00000000  000   000  000   000      0000000    0000000  000000000  000   0000000   000   000
    # 000   000  000       0000  000  000   000     000   000  000          000     000  000   000  0000  000
    # 000000000  0000000   000 0 000  000   000     000000000  000          000     000  000   000  000 0 000
    # 000 0 000  000       000  0000  000   000     000   000  000          000     000  000   000  000  0000
    # 000   000  00000000  000   000   0000000      000   000   0000000     000     000   0000000   000   000
    
    onMenuAction: (name, args) =>
    
        # klog 'ko.window.onMenuAction' name, args
        
        if action = Editor.actionWithName name
            if action.key? and _.isFunction window.focusEditor[action.key]
                window.focusEditor[action.key] args.actarg
                return
    
        if 'unhandled' != window.commandline.handleMenuAction name, args
            return
    
        switch name
    
            when 'doMacro'               then return window.commandline.commands.macro.execute args.actarg
            when 'Undo'                  then return window.focusEditor.do.undo()
            when 'Redo'                  then return window.focusEditor.do.redo()
            when 'Cut'                   then return window.focusEditor.cut()
            when 'Copy'                  then return window.focusEditor.copy()
            when 'Paste'                 then return window.focusEditor.paste()
            when 'New Tab'               then return post.emit 'newEmptyTab'
            when 'New Window'            then return post.toMain 'newWindowWithFile' editor.currentFile
            when 'Toggle Scheme'         then return scheme.toggle()
            when 'Toggle Center Text'    then return toggleCenterText()
            when 'Increase'              then return changeFontSize +1
            when 'Decrease'              then return changeFontSize -1
            when 'Reset'                 then return resetFontSize()
            when 'Open Window List'      then return titlebar.showList()
            when 'Navigate Backward'     then return navigate.backward()
            when 'Navigate Forward'      then return navigate.forward()
            when 'Maximize Editor'       then return split.maximizeEditor()
            when 'Add to Shelf'          then return addToShelf()
            when 'Toggle History'        then return window.filebrowser.shelf.toggleHistory()
            when 'Activate Next Tab'     then return window.tabs.navigate 'right'
            when 'Activate Previous Tab' then return window.tabs.navigate 'left'
            when 'Move Tab Left'         then return window.tabs.move 'left'
            when 'Move Tab Right'        then return window.tabs.move 'right'
            when 'Open...'               then return post.emit 'openFile'
            when 'Open In New Tab...'    then return post.emit 'openFile' newTab: true
            when 'Open In New Window...' then return post.emit 'openFile' newWindow: true
            when 'Save'                  then return post.emit 'saveFile'
            when 'Save All'              then return post.emit 'saveAll'
            when 'Save As ...'           then return post.emit 'saveFileAs'
            when 'Revert'                then return post.emit 'reloadFile'
            # when 'Reload'                then return reloadWin()
            when 'Close Tab or Window'   then return post.emit 'closeTabOrWindow'
            when 'Close Other Tabs'      then return post.emit 'closeOtherTabs'
            when 'Close Other Windows'   then return post.toOtherWins 'closeWindow'
            when 'Clear List'            
                window.state.set 'recentFiles' []
                window.titlebar.refreshMenu()
                return 
            when 'Preferences'           then return post.emit 'openFiles' [prefs.store.file], newTab:true
            when 'Cycle Windows'         then args = @id
    
        # log "unhandled menu action! posting to main '#{name}' args:", args
    
        super name, args
            
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000
# 00000000   0000000    0000000   000000    0000000
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000

window.state = new store 'state' separator:'|'
window.prefs = prefs

post.setMaxListeners 20

saveStash = ->

    klog 'window.saveStash'
    post.emit 'stash'
    editor.saveScrollCursorsAndSelections()
    window.stash.save()  

restoreWin = ->

    klog 'ko.window.restoreWin'
    if bounds = window.stash.get 'bounds'
        window.win.setBounds bounds

    if window.stash.get 'devTools'
        post.emit 'menuAction' 'devtools'

# 00000000    0000000    0000000  000000000
# 000   000  000   000  000          000
# 00000000   000   000  0000000      000
# 000        000   000       000     000
# 000         0000000   0000000      000

post.on 'singleCursorAtPos' (pos, opt) -> # browser double click and newTabWithFile :l:c
    editor.singleCursorAtPos pos, opt 
    editor.scroll.cursorToTop()
post.on 'focusEditor'  -> split.focus 'editor'
post.on 'cloneFile'    -> post.toMain 'newWindowWithFile' editor.currentFile
post.on 'closeWindow'  -> post.emit 'menuAction' 'Close'
post.on 'saveStash'    -> saveStash()
post.on 'editorFocus' (editor) ->
    window.setLastFocus editor.name
    window.focusEditor = editor
    window.textEditor = editor if editor.name != 'commandline-editor'

post.on 'devTools' (open) -> 
    klog "ko.window.post.on devTools #{open}"

post.on 'mainlog' -> klog.apply klog, arguments

post.on 'ping' (wID, argA, argB) -> post.toWin wID, 'pong' window.winID, argA, argB
post.on 'postEditorState' ->
    post.toAll 'editorState' window.winID,
        lines:      editor.lines()
        cursors:    editor.cursors()
        main:       editor.mainCursor()
        selections: editor.selections()
        highlights: editor.highlights()

# 00000000  0000000    000  000000000   0000000   00000000
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000

window.editorWithName = (n) ->

    switch n
        when 'editor'   then editor
        when 'command' 'commandline' then commandline
        when 'terminal' then terminal
        else editor

#  0000000   000   000   0000000  000       0000000    0000000  00000000
# 000   000  0000  000  000       000      000   000  000       000
# 000   000  000 0 000  000       000      000   000  0000000   0000000
# 000   000  000  0000  000       000      000   000       000  000
#  0000000   000   000   0000000  0000000   0000000   0000000   00000000

onClose = ->

    post.emit 'saveChanges'
    editor.setText ''
    # editor.stopWatcher()

    if Browser.getAllWindows().length > 1
        window.stash.clear()

#  0000000   000   000  000       0000000    0000000   0000000
# 000   000  0000  000  000      000   000  000   000  000   000
# 000   000  000 0 000  000      000   000  000000000  000   000
# 000   000  000  0000  000      000   000  000   000  000   000
#  0000000   000   000  0000000   0000000   000   000  0000000

window.onload = ->

    split.resized()
    info.reload()

# 00000000   00000000  000       0000000    0000000   0000000
# 000   000  000       000      000   000  000   000  000   000
# 0000000    0000000   000      000   000  000000000  000   000
# 000   000  000       000      000   000  000   000  000   000
# 000   000  00000000  0000000   0000000   000   000  0000000

reloadWin = ->

    saveStash()
    clearListeners()
    post.toMain 'reloadWin' winID:window.winID, file:editor.currentFile

# 00000000   00000000   0000000  000  0000000  00000000
# 000   000  000       000       000     000   000
# 0000000    0000000   0000000   000    000    0000000
# 000   000  000            000  000   000     000
# 000   000  00000000  0000000   000  0000000  00000000

window.onresize = ->

    # klog 'ko.window.onresize'
    split.resized()
    window.win.onMoved window.win.getBounds()
    if window.stash.get 'centerText' false
        editor.centerText true, 200

post.on 'split' (s) ->

    filebrowser.resized()
    terminal.resized()
    commandline.resized()
    editor.resized()

#  0000000  00000000  000   000  000000000  00000000  00000000       000000000  00000000  000   000  000000000
# 000       000       0000  000     000     000       000   000         000     000        000 000      000
# 000       0000000   000 0 000     000     0000000   0000000           000     0000000     00000       000
# 000       000       000  0000     000     000       000   000         000     000        000 000      000
#  0000000  00000000  000   000     000     00000000  000   000         000     00000000  000   000     000

toggleCenterText = ->

    if window.state.get "invisibles|#{editor.currentFile}" false
        editor.toggleInvisibles()
        restoreInvisibles = true

    if not window.stash.get 'centerText' false
        window.stash.set 'centerText' true
        editor.centerText true
    else
        window.stash.set 'centerText' false
        editor.centerText false

    if restoreInvisibles
        editor.toggleInvisibles()

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000
# 000000    000   000  000 0 000     000        0000000   000    000    0000000
# 000       000   000  000  0000     000             000  000   000     000
# 000        0000000   000   000     000        0000000   000  0000000  00000000

setFontSize = (s) ->

    s = prefs.get('editorFontSize' 19) if not _.isFinite s
    s = clamp 8 100 s

    window.stash.set "fontSize" s
    editor.setFontSize s
    if editor.currentFile?
        post.emit 'loadFile' editor.currentFile, reload:true

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

    defaultFontSize = prefs.get 'editorFontSize' 19
    window.stash.set 'fontSize' defaultFontSize
    setFontSize defaultFontSize

addToShelf = ->

    return if window.lastFocus == 'shelf'
    fb = window.filebrowser
    if window.lastFocus.startsWith fb.name
        path = fb.columnWithName(window.lastFocus).activePath()
    else
        path = editor.currentFile
    post.emit 'addToShelf' path

# 0000000   0000000    0000000   00     00
#    000   000   000  000   000  000   000
#   000    000   000  000   000  000000000
#  000     000   000  000   000  000 0 000
# 0000000   0000000    0000000   000   000

resetZoom: ->

    webframe.setZoomFactor 1
    editor.resized()

changeZoom: (d) ->
    
    z = webframe.getZoomFactor()
    z *= 1+d/20
    z = clamp 0.36 5.23 z
    webframe.setZoomFactor z
    editor.resized()

# 00000000   0000000    0000000  000   000   0000000
# 000       000   000  000       000   000  000
# 000000    000   000  000       000   000  0000000
# 000       000   000  000       000   000       000
# 000        0000000    0000000   0000000   0000000

window.onblur  = (event) -> post.emit 'winFocus' false
window.onfocus = (event) ->
    post.emit 'winFocus' true
    if document.activeElement.className == 'body'
        if split.editorVisible()
            split.focus 'editor'
        else
            split.focus 'commandline-editor'

window.setLastFocus = (name) -> 
    # klog 'setLastFocus' name
    window.lastFocus = name

# 000   000  00000000  000   000
# 000  000   000        000 000
# 0000000    0000000     00000
# 000  000   000          000
# 000   000  00000000     000

onCombo = (combo, info) ->

    return if not combo

    { mod, key, combo, char, event } = info

    return stopEvent(event) if 'unhandled' != window.commandline.globalModKeyComboEvent mod, key, combo, event
    return stopEvent(event) if 'unhandled' != titlebar.globalModKeyComboEvent mod, key, combo, event

    for i in [1..9]
        if combo is "alt+#{i}"
            return stopEvent event, post.toMain 'activateWindow' i

    switch combo
        when 'f3'                 then return stopEvent event, screenShot()
        when 'command+shift+='    then return stopEvent event, @changeZoom +1
        when 'command+shift+-'    then return stopEvent event, @changeZoom -1
        when 'command+shift+0'    then return stopEvent event, @resetZoom()
        when 'command+alt+y'      then return stopEvent event, split.do 'minimize editor'

post.on 'combo' onCombo

new Window

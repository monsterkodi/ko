# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000
{
first,
fileList,
fileExists,
resolve}      = require './tools/tools'
prefs         = require './tools/prefs'
log           = require './tools/log'
str           = require './tools/str'
pkg           = require '../package.json'
Execute       = require './execute'
Navigate      = require './navigate'
Indexer       = require './indexer'
MainMenu      = require './mainmenu'
_             = require 'lodash'
fs            = require 'fs'
noon          = require 'noon'
colors        = require 'colors'
electron      = require 'electron'
app           = electron.app
BrowserWindow = electron.BrowserWindow
Tray          = electron.Tray
Menu          = electron.Menu
clipboard     = electron.clipboard
ipc           = electron.ipcMain
dialog        = electron.dialog
disableSnap   = false
main          = undefined # < created in app.on 'ready'
navigate      = undefined # <
tray          = undefined # < created in Main.constructor
coffeeExecute = undefined # <
openFiles     = []
wins          = []

#  0000000   00000000    0000000    0000000
# 000   000  000   000  000        000     
# 000000000  0000000    000  0000  0000000 
# 000   000  000   000  000   000       000
# 000   000  000   000   0000000   0000000 

args  = require('karg') """

#{pkg.name}

    filelist  . ? files to open           . **
    show      . ? open window on startup  . = true
    prefs     . ? show preferences        . = false
    noprefs   . ? don't load preferences  . = false
    verbose   . ? log more                . = false
    DevTools  . ? open developer tools    . = false
    debug     .                             = false
    test      .                             = false
    
version  #{pkg.version}

""", dontExit: true

if not args?
    app.exit(0) 

if args.verbose
    log colors.white.bold "\nko", colors.gray "v#{pkg.version}\n"
    log colors.yellow.bold 'process'
    p = cwd: process.cwd()
    log noon.stringify p, colors:true
    log colors.yellow.bold 'args'
    log noon.stringify args, colors:true
    log ''

# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init "#{app.getPath('appData')}/#{pkg.name}/ko.noon", shortcut: 'F2'

if args.prefs
    log colors.yellow.bold 'prefs'
    if fileExists prefs.path
        log noon.stringify noon.load(prefs.path), colors:true

mostRecentFile = -> first prefs.get 'recentFiles'

# 000   000  000  000   000   0000000
# 000 0 000  000  0000  000  000     
# 000000000  000  000 0 000  0000000 
# 000   000  000  000  0000       000
# 00     00  000  000   000  0000000 

wins        = -> BrowserWindow.getAllWindows().sort (a,b) -> a.id - b.id 
activeWin   = -> BrowserWindow.getFocusedWindow()
visibleWins = -> (w for w in wins() when w?.isVisible() and not w?.isMinimized())
winWithID   = (winID) ->
    wid = parseInt winID
    for w in wins()
        return w if w.id == wid

# 0000000     0000000    0000000  000   000
# 000   000  000   000  000       000  000 
# 000   000  000   000  000       0000000  
# 000   000  000   000  000       000  000 
# 0000000     0000000    0000000  000   000

hideDock = ->
    return if prefs.get 'trayOnly', false
    app.dock.hide() if app.dock

# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'alias',                  (event, dict)   => main.alias event, dict
ipc.on 'newWindowWithFile',      (event, file)   => main.newWindowWithFile file
ipc.on 'activateWindowWithFile', (event, file)   => event.returnValue = main.activateWindowWithFile file
ipc.on 'toggleDevTools',         (event)         => event.sender.toggleDevTools()
ipc.on 'execute',                (event, arg)    => event.sender.send 'executeResult', coffeeExecute.execute arg
ipc.on 'executeCoffee',          (event, cfg)    => coffeeExecute.executeCoffee cfg
ipc.on 'maximizeWindow',         (event, winID)  => main.toggleMaximize winWithID winID
ipc.on 'activateWindow',         (event, winID)  => main.activateWindowWithID winID
ipc.on 'saveBounds',             (event, winID)  => main.saveWinBounds winWithID winID
ipc.on 'reloadWindow',           (event, winID)  => main.reloadWin winWithID winID
ipc.on 'prefSet',                (event, k, v)   => prefs.set k, v
ipc.on 'prefGet',                (event, k, d)   => event.returnValue = prefs.get k, d
ipc.on 'reloadMenu',             ()              => main.reloadMenu() # still in use?
ipc.on 'navigate',               (event, action) => event.returnValue = navigate.action action
ipc.on 'indexer',                (event, item)   => event.returnValue = main.indexer[item]
ipc.on 'winInfos',               (event)         => 
    infos = []
    for w in wins()
        infos.push 
            id: w.id
            file: w.currentFile            
    event.returnValue = infos

ipc.on 'fileLoaded', (event, file, winID) => 
    winWithID(winID).currentFile = file 
    main.indexer.indexFile file

ipc.on 'winFileLinesChanged', (event, winID, file, lineChanges) => 
    return if not winID
    for w in wins()
        if w.id != winID
            w.webContents.send 'fileLinesChanged', file, lineChanges
            
winShells = {}

ipc.on 'shellCommand', (event, cfg) => 
    if winShells[cfg.winID]?
        winShells[cfg.winID].term cfg
    else
        winShells[cfg.winID] = new Execute cfg
                        
# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

class Main
    
    constructor: (openFiles) -> 
        
        if app.makeSingleInstance @otherInstanceStarted
            log 'other instance already active -> quit'
            app.exit 0
            return

        @indexer      = new Indexer
        coffeeExecute = new Execute main: @

        tray = new Tray "#{__dirname}/../img/menu.png"
        tray.on 'click', @toggleWindows
                                
        app.setName pkg.productName
                                
        electron.globalShortcut.register prefs.get('shortcut'), @toggleWindows
            
        @restoreWindows() if not args.noprefs and not openFiles.length
        
        if not openFiles.length and args.filelist.length
            openFiles = fileList args.filelist
            
        if openFiles.length
            for file in openFiles
                @createWindow file            

        if not wins().length
            if args.show
                w = @createWindow mostRecentFile()
        
        if args.DevTools
            wins()?[0]?.webContents.openDevTools()

        MainMenu.init @

        setTimeout @showWindows, 10
        
    # 000   000  000  000   000  0000000     0000000   000   000   0000000
    # 000 0 000  000  0000  000  000   000  000   000  000 0 000  000     
    # 000000000  000  000 0 000  000   000  000   000  000000000  0000000 
    # 000   000  000  000  0000  000   000  000   000  000   000       000
    # 00     00  000  000   000  0000000     0000000   00     00  0000000 
        
    wins:        wins
    winWithID:   winWithID
    activeWin:   activeWin
    visibleWins: visibleWins
    
    reloadMenu: => MainMenu.init @
        
    reloadWin: (win) ->
        if win?
            dev = win.webContents.isDevToolsOpened()
            if dev
                win.webContents.closeDevTools()
                setTimeout win.webContents.reloadIgnoringCache, 100
            else
                win.webContents.reloadIgnoringCache()

    toggleMaximize: (win) ->
        disableSnap = true
        if win.isMaximized()
            win.unmaximize() 
        else
            win.maximize()
        disableSnap = false

    saveWinBounds: (win) ->
        prefs.set "windows:#{win.id}:bounds",win.getBounds()
    
    toggleWindows: =>
        if wins().length
            if visibleWins().length
                if activeWin()
                    @hideWindows()
                else
                    @raiseWindows()
            else
                @showWindows()
        else
            @createWindow()

    hideWindows: =>
        for w in wins()
            w.hide()
            hideDock()
            
    showWindows: =>
        for w in wins()
            w.show()
            app.dock.show()
            
    raiseWindows: =>
        if visibleWins().length
            for w in visibleWins()
                w.showInactive()
            visibleWins()[0].showInactive()
            visibleWins()[0].focus()

    activateNextWindow: (win) =>
        allWindows = wins()
        for w in allWindows
            if w == win
                i = 1 + allWindows.indexOf w
                i = 0 if i >= allWindows.length
                @activateWindowWithID allWindows[i].id
                return

    activateWindowWithID: (wid) =>
        w = winWithID wid
        return if not w?
        if not w.isVisible() 
            w.show()
        w.focus()

    activateWindowWithFile: (file) =>
        for w in wins()
            if w.currentFile == file
                @activateWindowWithID w.id
                return w.id
        null

    closeOtherWindows:=>
        for w in wins()
            if w != activeWin()
                @closeWindow w
    
    closeWindow: (w) => w?.close()
    
    closeWindows: =>
        for w in wins()
            @closeWindow w
        hideDock()
            
    closeWindowsAndQuit: => 
        @closeWindows()
        @quit()
      
    #  0000000  000000000   0000000    0000000  000   000
    # 000          000     000   000  000       000  000 
    # 0000000      000     000000000  000       0000000  
    #      000     000     000   000  000       000  000 
    # 0000000      000     000   000   0000000  000   000
     
    screenSize: -> electron.screen.getPrimaryDisplay().workAreaSize
    
    stackWindows: ->
        {width, height} = @screenSize()
        ww = height + 122
        wl = visibleWins()
        for w in wl
            w.showInactive()
            w.setBounds
                x:      parseInt (width-ww)/2
                y:      parseInt 0
                width:  parseInt ww
                height: parseInt height
        activeWin().show()
        
    windowsAreStacked: ->
        wl = visibleWins()
        return false if not wl.length
        return false if wl.length == 1 and wl[0].getBounds().width == @screenSize().width
        w0 = wl[0].getBounds()
        for wi in [1...wl.length]
            if not _.isEqual wl[wi].getBounds(), w0
                return false
        true
        
    #  0000000   00000000   00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000  000   000  0000  000  000        000     
    # 000000000  0000000    0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000  000   000  000  0000  000   000  000     
    # 000   000  000   000  000   000  000   000  000   000   0000000   00000000
        
    arrangeWindows: =>
        disableSnap = true
        frameSize = 6
        wl = visibleWins()
        {width, height} = @screenSize()
        if not @windowsAreStacked()
            @stackWindows()
        else if wl.length == 1
            wl[0].showInactive()
            wl[0].setBounds
                x:      0
                y:      0
                width:  width
                height: height
        else if wl.length == 2 or wl.length == 3
            w = width/wl.length
            for i in [0...wl.length]
                wl[i].showInactive()
                wl[i].setBounds
                    x:      parseInt i * w - (i > 0 and frameSize/2 or 0)
                    width:  parseInt w + ((i == 0 or i == wl.length-1) and frameSize/2 or frameSize)
                    y:      parseInt 0
                    height: parseInt height
        else if wl.length
            w2 = parseInt wl.length/2
            rh = height
            for i in [0...w2]
                w = width/w2
                wl[i].showInactive()
                wl[i].setBounds
                    x:      parseInt i * w - (i > 0 and frameSize/2 or 0)
                    width:  parseInt w + ((i == 0 or i == w2-1) and frameSize/2 or frameSize)
                    y:      parseInt 0
                    height: parseInt rh/2
            for i in [w2...wl.length]
                w = width/(wl.length-w2)
                wl[i].showInactive()
                wl[i].setBounds
                    x:      parseInt (i-w2) * w - (i-w2 > 0 and frameSize/2 or 0)
                    y:      parseInt rh/2+23 
                    width:  parseInt w + ((i-w2 == 0 or i == wl.length-1) and frameSize/2 or frameSize)
                    height: parseInt rh/2
        disableSnap = false
                
    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000     
    # 0000000    0000000   0000000      000     000   000  0000000    0000000 
    # 000   000  000            000     000     000   000  000   000  000     
    # 000   000  00000000  0000000      000      0000000   000   000  00000000
    
    restoreWindows: ->
        windows = prefs.get 'windows', {}
        sequenced = {}
        i = 0
        for k, w of windows
            if w.file
                i += 1
                sequenced[i] = w
        prefs.set 'windows', sequenced
        for k, w of sequenced
            @restoreWin w
                
    restoreWin: (state) ->
        w = @createWindow state.file
        w.setBounds state.bounds if state.bounds?
        w.webContents.openDevTools() if state.devTools
        w.showInactive()
        w.focus()
                
    #  0000000  00000000   00000000   0000000   000000000  00000000
    # 000       000   000  000       000   000     000     000     
    # 000       0000000    0000000   000000000     000     0000000 
    # 000       000   000  000       000   000     000     000     
    #  0000000  000   000  00000000  000   000     000     00000000
       
    newWindowWithFile: (file, pos) -> @createWindow(file, pos).id
            
    createWindow: (openFile, pos) ->
        
        {width, height} = @screenSize()
        ww = height + 122
        
        win = new BrowserWindow
            x:               parseInt (width-ww)/2
            y:               0
            width:           ww
            height:          height
            minWidth:        140
            minHeight:       130
            useContentSize:  true
            fullscreenable:  true
            show:            true
            hasShadow:       false
            backgroundColor: '#000'
            titleBarStyle:   'hidden'

        win.loadURL "file://#{__dirname}/../index.html"
        app.dock.show()
        win.on 'close',  @onCloseWin
        win.on 'move',   @onMoveWin
        win.on 'resize', @onResizeWin
                
        winReady = => win.webContents.send 'setWinID', win.id
                        
        winLoaded = =>
            if openFile?
                win.currentFile = openFile
                win.webContents.send 'loadFile', openFile
                win.webContents.send 'singleCursorAtPos', pos if pos?
                openFile = null
            else
                file = prefs.get "windows:#{win.id}:file"
                if file?
                    win.currentFile = file
                    win.webContents.send 'loadFile', file
                    
            saveState = =>                 
                @saveWinBounds win
                @reloadMenu()
                    
            setTimeout saveState, 1000
        
        win.webContents.on 'dom-ready',       winReady
        win.webContents.on 'did-finish-load', winLoaded
        win 
    
    onMoveWin: (event) => @saveWinBounds event.sender
    
    # 00000000   00000000   0000000  000  0000000  00000000
    # 000   000  000       000       000     000   000     
    # 0000000    0000000   0000000   000    000    0000000 
    # 000   000  000            000  000   000     000     
    # 000   000  00000000  0000000   000  0000000  00000000
    
    onResizeWin: (event) => 
        return if disableSnap
        frameSize = 6
        wb = event.sender.getBounds()
        for w in wins()
            continue if w == event.sender
            b = w.getBounds()
            if b.height == wb.height and b.y == wb.y
                if b.x < wb.x 
                    if b.x+b.width-wb.x > -200
                        w.showInactive()
                        w.setBounds 
                            x:      b.x
                            y:      b.y
                            width:  wb.x - b.x + frameSize
                            height: b.height
                else if b.x+b.width > wb.x+wb.width
                    if b.x-wb.x-wb.width < 200
                        w.showInactive()
                        w.setBounds
                            x:      wb.x+wb.width-frameSize
                            y:      b.y
                            width:  b.x+b.width - (wb.x+wb.width-frameSize)
                            height: b.height
    
    onCloseWin: (event) =>
        prefs.del "windows:#{event.sender.id}"
        if visibleWins().length == 1
            hideDock()
        
    otherInstanceStarted: (args, dir) =>
        if not visibleWins().length
            @toggleWindows()
            
        for arg in args.slice(2)
            continue if arg.startsWith '-'
            file = arg
            if not arg.startsWith '/'
                file = resolve dir + '/' + arg
            @createWindow file
            
        if !activeWin()
            visibleWins()[0]?.focus()
        
    quit: => 
        prefs.save (ok) =>
            app.exit 0
            process.exit 0
    
    #  0000000   000      000   0000000    0000000
    # 000   000  000      000  000   000  000     
    # 000000000  000      000  000000000  0000000 
    # 000   000  000      000  000   000       000
    # 000   000  0000000  000  000   000  0000000 
    
    alias: (event, dict) =>
        aliasFile = "#{app.getPath('appData')}/#{pkg.name}/alias.noon"
        if dict?
            noon.save aliasFile, dict
        if fileExists aliasFile
            event.returnValue = noon.load aliasFile
        else
            event.returnValue = {}
    
    #  0000000   0000000     0000000   000   000  000000000
    # 000   000  000   000  000   000  000   000     000   
    # 000000000  0000000    000   000  000   000     000   
    # 000   000  000   000  000   000  000   000     000   
    # 000   000  0000000     0000000    0000000      000   
    
    showAbout: =>    
        cwd = __dirname
        w = new BrowserWindow
            dir:             cwd
            preloadWindow:   true
            resizable:       true
            frame:           true
            show:            true
            center:          true
            backgroundColor: '#333'            
            width:           400
            height:          420
        w.loadURL "file://#{cwd}/../about.html"
        w.on 'openFileDialog', @createWindow

    log: -> log (str(s) for s in [].slice.call arguments, 0).join " " if args.verbose
    dbg: -> log (str(s) for s in [].slice.call arguments, 0).join " " if args.debug
            
#  0000000   00000000   00000000         0000000   000   000
# 000   000  000   000  000   000       000   000  0000  000
# 000000000  00000000   00000000        000   000  000 0 000
# 000   000  000        000        000  000   000  000  0000
# 000   000  000        000        000   0000000   000   000

app.on 'activate', (event, hasVisibleWindows) => #log "app.on activate #{hasVisibleWindows}"
app.on 'browser-window-focus', (event, win)   => #log "app.on browser-window-focus #{win.id}"

app.on 'open-file', (event, path) => 
    if not main?
        openFiles.push path
    else
        main.createWindow path
    event.preventDefault()

app.on 'ready', => 
    main     = new Main openFiles
    navigate = new Navigate main
    
app.on 'window-all-closed', ->
    
app.setName pkg.productName


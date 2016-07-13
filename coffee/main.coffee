# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

{first,
 fileList,
 fileExists,
 resolve}     = require './tools/tools'
prefs         = require './tools/prefs'
log           = require './tools/log'
str           = require './tools/str'
pkg           = require '../package.json'
Execute       = require './execute'
Indexer       = require './indexer'
MainMenu      = require './mainmenu'
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
tray          = undefined
main          = undefined
execute       = undefined
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
    debug     . ? debug mode              . = false
    DevTools  . ? open developer tools    . = false
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

prefs.init "#{app.getPath('appData')}/#{pkg.name}/ko.noon",
    shortcut: 'F2'
    
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

ipc.on 'execute',           (event, arg)   => event.sender.send 'executeResult', execute.execute arg
ipc.on 'toggleDevTools',    (event)        => event.sender.toggleDevTools()
ipc.on 'newWindowWithFile', (event, file)  => main.createWindow file
ipc.on 'fileLoaded',        (event, file)  => main.indexer.indexFile file
ipc.on 'maximizeWindow',    (event, winID) => main.toggleMaximize winWithID winID
ipc.on 'saveBounds',        (event, winID) => main.saveWinBounds winWithID winID
ipc.on 'focusWindow',       (event, winID) => main.focusWindow winWithID winID
ipc.on 'reloadWindow',      (event, winID) => main.reloadWin winWithID winID
ipc.on 'prefSet',           (event, k, v)  => prefs.set k, v
ipc.on 'prefGet',           (event, k, d)  => event.returnValue = prefs.get k, d
ipc.on 'reloadMenu',        ()             => main.reloadMenu() # still in use?

ipc.on 'winFileLinesChanged', (event, winID, file, lineChanges) => 
    return if not winID
    for w in wins()
        if w.id != winID
            w.webContents.send 'fileLinesChanged', file, lineChanges
            
ipc.on 'indexer', (event, item) => event.returnValue = main.indexer[item]

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

        @indexer = new Indexer

        tray = new Tray "#{__dirname}/../img/menu.png"
        tray.on 'click', @toggleWindows
                                
        app.setName pkg.productName
                                
        electron.globalShortcut.register prefs.get('shortcut'), @toggleWindows
            
        @restoreWindows() if not args.noprefs and not openFiles.length
        
        if not openFiles.length and args.filelist.length
            openFiles = fileList args.filelist
            @dbg "Main.constructor openFiles = fileList args.filelist: #{openFiles}"
            
        if openFiles.length
            for file in openFiles
                @dbg "Main.constructor openFiles.file: #{file}"
                @createWindow file            

        if not wins().length
            if args.show
                @dbg "Main.constructor open recent file: #{mostRecentFile()}" 
                w = @createWindow mostRecentFile()
        
        if args.DevTools
            log "open dev tools", wins()?[0]?
            wins()?[0]?.webContents.openDevTools()

        MainMenu.init @

        setTimeout @showWindows, 10
        
    # 000   000  000  000   000  0000000     0000000   000   000   0000000
    # 000 0 000  000  0000  000  000   000  000   000  000 0 000  000     
    # 000000000  000  000 0 000  000   000  000   000  000000000  0000000 
    # 000   000  000  000  0000  000   000  000   000  000   000       000
    # 00     00  000  000   000  0000000     0000000   00     00  0000000 
        
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
        if win.isMaximized()
            win.unmaximize() 
        else
            win.maximize()

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

    focusWindow: (win) => 
        win?.focus()
                
    focusNextWindow: (win) =>
        allWindows = wins()
        for w in allWindows
            if w == win
                i = 1 + allWindows.indexOf w
                i = 0 if i >= allWindows.length
                @focusWindow allWindows[i]
                return

    activateWindowWithID: (wid) =>
        w = winWithID wid
        return if not w?
        if not w.isVisible() 
            w.show()
        w.focus()

    closeOtherWindows:=>
        for w in wins()
            if w != activeWin()
                @closeWindow w
    
    closeWindow: (w) =>
        # prefs.del "windows:#{w.id}"
        w?.close()
    
    closeWindows: =>
        for w in wins()
            @closeWindow w
        hideDock()
            
    closeWindowsAndQuit: => 
        @closeWindows()
        @quit()
        
    #  0000000   00000000   00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000  000   000  0000  000  000        000     
    # 000000000  0000000    0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000  000   000  000  0000  000   000  000     
    # 000   000  000   000  000   000  000   000  000   000   0000000   00000000
        
    arrangeWindows: ->
        animate = false
        frameSize = 6
        wl = visibleWins()
        {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
        if wl.length == 1
            wl[0].showInactive()
            wl[0].setBounds
                x:      parseInt (width-height)/2
                y:      parseInt 0
                width:  parseInt height
                height: parseInt height
            , animate
        else if wl.length == 2 or wl.length == 3
            w = width/wl.length
            for i in [0...wl.length]
                wl[i].showInactive()
                wl[i].setBounds
                    x:      parseInt i * w - (i > 0 and frameSize/2 or 0)
                    width:  parseInt w + ((i == 0 or i == wl.length-1) and frameSize/2 or frameSize)
                    y:      parseInt 0
                    height: parseInt height
                , animate
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
                , animate
            for i in [w2...wl.length]
                w = width/(wl.length-w2)
                wl[i].showInactive()
                wl[i].setBounds
                    x:      parseInt (i-w2) * w - (i-w2 > 0 and frameSize/2 or 0)
                    y:      parseInt rh/2+23 
                    width:  parseInt w + ((i-w2 == 0 or i == wl.length-1) and frameSize/2 or frameSize)
                    height: parseInt rh/2
                , animate
                
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
        @dbg "main.restoreWindows #{Object.keys sequenced}"
        for k, w of sequenced
            @restoreWin w
                
    restoreWin: (state) ->
        # @dbg "main.restoreWin", #{state}
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
            
    createWindow: (openFile) ->
        win = new BrowserWindow
            width:           1000
            height:          1200
            minWidth:        140
            minHeight:       130
            useContentSize:  true
            backgroundColor: '#000'
            fullscreenable:  true
            show:            true
            hasShadow:       false
            titleBarStyle:   'hidden'
                    
        win.loadURL "file://#{__dirname}/../index.html"
        app.dock.show()
        win.on 'close',  @onCloseWin
        win.on 'move',   @onMoveWin
        win.on 'resize', @onResizeWin
                
        winReady = =>
            # @dbg "main.createWindow.winReady send setWinID #{win.id}"
            win.webContents.send 'setWinID', win.id
                        
        winLoaded = =>
            if openFile?
                @dbg "main.createWindow.winLoaded send loadFile openFile: #{openFile}"
                win.webContents.send 'loadFile', openFile
                openFile = null
            else
                file = prefs.get "windows:#{win.id}:file"
                if file?
                    win.webContents.send 'loadFile', file
                    
            saveState = =>                 
                @saveWinBounds win
                @reloadMenu()
                    
            setTimeout saveState, 1000
        
        win.webContents.on 'dom-ready',         winReady
        win.webContents.on 'did-finish-load',   winLoaded
                
        win 
    
    onMoveWin: (event) => @saveWinBounds event.sender
    
    # 00000000   00000000   0000000  000  0000000  00000000
    # 000   000  000       000       000     000   000     
    # 0000000    0000000   0000000   000    000    0000000 
    # 000   000  000            000  000   000     000     
    # 000   000  00000000  0000000   000  0000000  00000000
    
    onResizeWin: (event) => 
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
        @dbg "main.onCloseWin #{event.sender.id}"
        
    otherInstanceStarted: (args, dir) =>
        @log "main.otherInstanceStarted args args: #{args} dir: #{dir}"
        if not visibleWins().length
            @toggleWindows()
            
        for arg in args.slice(2)
            continue if arg.startsWith '-'
            file = arg
            if not arg.startsWith '/'
                file = resolve dir + '/' + arg
            @log 'create', file
            @createWindow file
            
        if !activeWin()
            visibleWins()[0]?.focus()
        
    quit: => 
        prefs.save (ok) =>
            @dbg "prefs saved ok:#{ok}"
            @dbg "main.quit app.exit 0"
            app.exit 0
            @dbg "main.quit process.exit 0"
            process.exit 0
    
    #  0000000   0000000     0000000   000   000  000000000
    # 000   000  000   000  000   000  000   000     000   
    # 000000000  0000000    000   000  000   000     000   
    # 000   000  000   000  000   000  000   000     000   
    # 000   000  0000000     0000000    0000000      000   
    
    showAbout: =>    
        cwd = __dirname
        w = new BrowserWindow
            dir:           cwd
            preloadWindow: true
            resizable:     true
            frame:         true
            show:          true
            center:        true
            backgroundColor: '#333'            
            width:         400
            height:        420
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

app.on 'ready', => main = new Main openFiles
    
app.on 'window-all-closed', ->
    
app.setName pkg.productName


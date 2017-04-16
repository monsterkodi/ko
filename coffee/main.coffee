# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

{ splitFilePos, fileExists, dirExists, fileList, resolve,
about, prefs, store, noon, post, fs, str, log, _
}             = require 'kxk'
pkg           = require '../package.json'
Execute       = require './execute'
Navigate      = require './navigate'
Indexer       = require './indexer'
MainMenu      = require './mainmenu'
colors        = require 'colors'
electron      = require 'electron'
childp        = require 'child_process'
app           = electron.app
BrowserWindow = electron.BrowserWindow
Tray          = electron.Tray
Menu          = electron.Menu
clipboard     = electron.clipboard
dialog        = electron.dialog
disableSnap   = false
main          = undefined # < created in app.on 'ready'
navigate      = undefined # <
tray          = undefined # < created in Main.constructor
coffeeExecute = undefined # <
openFiles     = []
wins          = []
WIN_SNAP_DIST = 150

process.env.NODE_ENV = 'production'

#  0000000   00000000    0000000    0000000
# 000   000  000   000  000        000     
# 000000000  0000000    000  0000  0000000 
# 000   000  000   000  000   000       000
# 000   000  000   000   0000000   0000000 

args  = require('karg') """

#{pkg.productName}

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

app.exit 0 if not args?

if process.cwd() == '/'
    process.chdir resolve '~'
while args.filelist.length and dirExists _.first args.filelist
    process.chdir args.filelist.shift()
    
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

prefs.init shortcut: 'F2'
alias = new store 'alias'

if args.prefs
    log colors.yellow.bold 'prefs'
    log noon.stringify prefs.store, colors:true

mostRecentFile = -> _.first prefs.get 'recentFiles'

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

post.onGet 'activateWindowWithFile', (file) -> main.activateWindowWithFile file
post.onGet 'winInfos', -> 
    infos = []
    for w in wins()
        infos.push 
            id: w.id
            file: w.currentFile            
    infos

post.on 'newWindowWithFile',      (file)   -> main.createWindow file
post.on 'toggleDevTools',         (winID)  -> winWithID(winID).toggleDevTools()
post.on 'restartShell',           (cfg)    -> winShells[cfg.winID].restartShell()
post.on 'maximizeWindow',         (winID)  -> main.toggleMaximize winWithID winID
post.on 'activateWindow',         (winID)  -> main.activateWindowWithID winID
post.on 'reloadWindow',           (winID)  -> main.reloadWin winWithID winID

post.on 'fileLoaded', (file, winID) -> 
    winWithID(winID).currentFile = file 
    main.indexer.indexFile file

post.on 'fileSaved', (file, winID) -> main.indexer.indexFile file, refresh: true

post.on 'winFileLinesChanged', (winID, file, lineChanges) -> # use post to otherWins instead
    return if not winID
    for w in wins()
        if w.id != winID
            post.toWin w.id, 'fileLinesChanged', file, lineChanges
            
winShells = {}

post.on 'shellCommand', (cfg) -> 
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
            app.exit 0
            return

        MainMenu.init @

        @indexer      = new Indexer
        coffeeExecute = new Execute main: @

        tray = new Tray "#{__dirname}/../img/menu.png"
        tray.on 'click', @toggleWindows
                                
        app.setName pkg.productName
                                
        electron.globalShortcut.register prefs.get('shortcut'), @toggleWindows
            
        if not openFiles.length and args.filelist.length
            openFiles = fileList args.filelist
            
        if openFiles.length
            for file in openFiles
                @createWindow file            
        else
            @restoreWindows() if not args.noprefs

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
            
    reloadWin: (win) -> win?.webContents.reloadIgnoringCache()

    toggleMaximize: (win) ->
        disableSnap = true
        if win.isMaximized()
            win.unmaximize() 
        else
            win.maximize()
        disableSnap = false
    
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

    hideWindows: ->
        for w in wins()
            w.hide()
            hideDock()
            
    showWindows: ->
        for w in wins()
            w.show()
            app.dock.show()
            
    raiseWindows: ->
        if visibleWins().length
            for w in visibleWins()
                w.showInactive()
            visibleWins()[0].showInactive()
            visibleWins()[0].focus()

    activateNextWindow: (win) ->
        allWindows = wins()
        for w in allWindows
            if w == win
                i = 1 + allWindows.indexOf w
                i = 0 if i >= allWindows.length
                @activateWindowWithID allWindows[i].id
                return

    activateWindowWithID: (wid) ->
        w = winWithID wid
        return if not w?
        if not w.isVisible() 
            w.show()
        else
            w.focus()

    activateWindowWithFile: (file) ->
        [file, pos] = splitFilePos file
        for w in wins()
            if w.currentFile == file
                @activateWindowWithID w.id
                post.toWin w.id, 'singleCursorAtPos', pos if pos?
                return w.id
        null

    closeOtherWindows:=>
        for w in wins()
            if w != activeWin()
                @closeWindow w
    
    closeWindow: (w) -> w?.close()
    
    closeWindows: =>
        for w in wins()
            @closeWindow w
        hideDock()
                  
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
        w.setFullScreen false for w in wl
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
            disableSnap = false
            return
        
        w.setFullScreen false for w in wl
            
        if wl.length == 1
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
       
    createWindow: (openFile) ->
        
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
            show:            false
            hasShadow:       false
            webPreferences:
                scrollBounce: true
            backgroundColor: '#000'
            titleBarStyle:   'hidden'

        win.loadURL "file://#{__dirname}/index.html"
        app.dock.show()
        win.on 'close',  @onCloseWin
        win.on 'resize', @onResizeWin
                                        
        winLoaded = ->
            if openFile?
                win.currentFile = splitFilePos(openFile)[0]
                post.toWin win.id, 'loadFile', openFile
                openFile = null
                win.show()
                win.focus()
            else
                file = prefs.get "windows:#{win.id}:file"
                if file?
                    win.currentFile = file
                    post.toWin win.id, 'loadFile', file
                else
                    win.show()
                            
        win.webContents.on 'did-finish-load', winLoaded
        win 
     
    # 00000000   00000000   0000000  000  0000000  00000000
    # 000   000  000       000       000     000   000     
    # 0000000    0000000   0000000   000    000    0000000 
    # 000   000  000            000  000   000     000     
    # 000   000  00000000  0000000   000  0000000  00000000
    
    onResizeWin: (event) -> 
        return if disableSnap
        frameSize = 6
        wb = event.sender.getBounds()
        for w in wins()
            continue if w == event.sender
            b = w.getBounds()
            if b.height == wb.height and b.y == wb.y
                if b.x < wb.x 
                    if Math.abs(b.x+b.width-wb.x) < WIN_SNAP_DIST
                        w.showInactive()
                        w.setBounds 
                            x:      b.x
                            y:      b.y
                            width:  wb.x - b.x + frameSize
                            height: b.height
                else if b.x+b.width > wb.x+wb.width
                    if Math.abs(wb.x+wb.width-b.x) < WIN_SNAP_DIST
                        w.showInactive()
                        w.setBounds
                            x:      wb.x+wb.width-frameSize
                            y:      b.y
                            width:  b.x+b.width - (wb.x+wb.width-frameSize)
                            height: b.height
    
    onCloseWin: (event) ->
        prefs.del "windows:#{event.sender.id}"
        if visibleWins().length == 1
            hideDock()
        
    otherInstanceStarted: (args, dir) =>
        if not visibleWins().length
            @toggleWindows()

        if !activeWin()
            visibleWins()[0]?.focus()

        for arg in args.slice(2)
            continue if arg.startsWith '-'
            file = arg
            if not arg.startsWith '/'
                file = path.join resolve(dir), arg
            [fpath, pos] = splitFilePos file
            if not fileExists fpath
                continue
            w = @activateWindowWithFile file
            w = @createWindow file if not w?
                    
    quit: -> 
        app.exit     0
        process.exit 0
        
    #  0000000   0000000     0000000   000   000  000000000
    # 000   000  000   000  000   000  000   000     000   
    # 000000000  0000000    000   000  000   000     000   
    # 000   000  000   000  000   000  000   000     000   
    # 000   000  0000000     0000000    0000000      000   
    
    showAbout: -> about img: "#{__dirname}/../img/about.png", pkg: pkg   
            
#  0000000   00000000   00000000         0000000   000   000
# 000   000  000   000  000   000       000   000  0000  000
# 000000000  00000000   00000000        000   000  000 0 000
# 000   000  000        000        000  000   000  000  0000
# 000   000  000        000        000   0000000   000   000

app.on 'open-file', (event, path) -> 
    if not main?
        openFiles.push path
    else
        main.createWindow path
    event.preventDefault()

app.on 'ready', -> 
    main     = new Main openFiles
    navigate = new Navigate main
    
app.on 'window-all-closed', ->
    
app.setName pkg.productName


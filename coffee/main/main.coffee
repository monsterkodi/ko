# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

{ fileList, childp, about, prefs, store, noon, post, slash, os, fs, str, empty, error, _ } = require 'kxk'

pkg      = require '../../package.json'
Execute  = require './execute'
Navigate = require './navigate'
Indexer  = require './indexer'
pug      = require 'pug'
colors   = require 'colors'
electron = require 'electron'
Menu     = if os.platform() == 'win32' then require './menu-win' else require './menu'

{ BrowserWindow, Tray, app, clipboard, dialog } = electron

disableSnap   = false
main          = undefined # < created in app.on 'ready'
tray          = undefined # < created in Main.constructor
coffeeExecute = undefined # <
openFiles     = []
WIN_SNAP_DIST = 150

slog = require('kxk').log.slog
slog.filepad = slog.filepad + 5
log = ->
    s = (str(s) for s in [].slice.call arguments, 0).join " "
    slog s

post.on 'slog', (s) -> console.log s

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

version  #{pkg.version}

""", dontExit: true

app.exit 0 if not args?

if process.cwd() == '/'
    process.chdir slash.resolve '~'
while args.filelist.length and slash.dirExists _.first args.filelist
    process.chdir args.filelist.shift()

if args.verbose
    log colors.white.bold "\nko", colors.gray "v#{pkg.version}\n"
    log noon.stringify {cwd: process.cwd()}, colors:true
    log colors.yellow.bold '\nargs'
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
    log colors.green.bold 'prefs file:', prefs.store.file
    log noon.stringify prefs.store.data, colors:true

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

    return if os.platform() == 'win32'
    return if prefs.get 'trayOnly', false
    app.dock?.hide()

# 00000000    0000000    0000000  000000000
# 000   000  000   000  000          000
# 00000000   000   000  0000000      000
# 000        000   000       000     000
# 000         0000000   0000000      000

post.onGet 'debugMode', -> args.debug
post.onGet 'winInfos',  -> (id: w.id for w in wins())
post.onGet 'logSync',   ->
    console.log.apply console, [].slice.call(arguments, 0)
    return true

post.on 'restartShell',       (cfg)   -> winShells[cfg.winID].restartShell()
post.on 'newWindowWithFile',  (file)  -> main.createWindow file:file
post.on 'maximizeWindow',     (winID) -> main.toggleMaximize winWithID winID
post.on 'activateWindow',     (winID) -> main.activateWindowWithID winID
post.on 'activateNextWindow', (winID) -> main.activateNextWindow winID
post.on 'activatePrevWindow', (winID) -> main.activatePrevWindow winID
post.on 'fileSaved',    (file, winID) -> main.indexer.indexFile file, refresh: true
post.on 'fileLoaded',   (file, winID) -> main.indexer.indexFile file
post.on 'ping', (winID, argA, argB) -> post.toWin winID, 'pong', 'main', argA, argB
post.on 'winlog',       (winID, text) -> console.log "#{winID}>>> " + text

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

        log 'Main.constructor'
        # if app.makeSingleInstance @otherInstanceStarted
        #     log 'single instance'
        #     app.exit 0
        #     return

        @indexer      = new Indexer
        coffeeExecute = new Execute main: @

        if os.platform() != 'win32'
            tray = new Tray "#{__dirname}/../../img/menu.png"
            tray.on 'click', @toggleWindows

        app.setName pkg.productName

        electron.globalShortcut.register prefs.get('shortcut'), @toggleWindows

        if not openFiles.length and args.filelist.length
            openFiles = fileList args.filelist

        @moveWindowStashes()

        if openFiles.length
            for file in openFiles
                @createWindow file:file
        else
            @restoreWindows() if not args.noprefs

        if not wins().length
            if args.show
                w = @createWindow file:mostRecentFile()

        if args.DevTools
            wins()?[0]?.webContents.openDevTools()

        Menu.init @

    # 000   000  000  000   000  0000000     0000000   000   000   0000000
    # 000 0 000  000  0000  000  000   000  000   000  000 0 000  000
    # 000000000  000  000 0 000  000   000  000   000  000000000  0000000
    # 000   000  000  000  0000  000   000  000   000  000   000       000
    # 00     00  000  000   000  0000000     0000000   00     00  0000000

    wins:        wins()
    winWithID:   winWithID
    activeWin:   activeWin
    visibleWins: visibleWins

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
        @

    showWindows: ->

        for w in wins()
            w.show()
            app.dock?.show()
        @

    raiseWindows: ->

        if visibleWins().length
            for w in visibleWins()
                w.showInactive()
            visibleWins()[0].showInactive()
            visibleWins()[0].focus()
        @

    activateNextWindow: (win) ->

        if _.isNumber win then win = winWithID win
        allWindows = wins()
        for w in allWindows
            if w == win
                i = 1 + allWindows.indexOf w
                i = 0 if i >= allWindows.length
                @activateWindowWithID allWindows[i].id
                return w
        null

    activatePrevWindow: (win) ->

        if _.isNumber win then win = winWithID win
        allWindows = wins()
        for w in allWindows
            if w == win
                i = -1 + allWindows.indexOf w
                i = allWindows.length-1 if i < 0
                @activateWindowWithID allWindows[i].id
                return w
        null

    activateWindowWithID: (wid) ->

        w = winWithID wid
        return if not w?
        if not w.isVisible()
            w.show()
        else
            w.focus()
        w

    closeOtherWindows: =>

        for w in wins()
            if w != activeWin()
                @closeWindow w

    closeWindow: (w) -> w?.close()

    closeWindows: =>

        for w in wins()
            @closeWindow w
        hideDock()

    postDelayedNumWins: ->

        clearTimeout @postDelayedNumWinsTimer
        postNumWins = ->
            post.toWins 'numWins', wins().length
        @postDelayedNumWinsTimer = setTimeout postNumWins, 300

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

    moveWindowStashes: ->

        userData = slash.path app.getPath 'userData'
        stashDir = slash.join userData, 'win'
        if slash.dirExists stashDir
            fs.moveSync stashDir, slash.join(userData, 'old'), overwrite: true

    restoreWindows: ->

        userData = slash.path app.getPath 'userData'
        log 'restoreWindows userData', userData
        fs.ensureDirSync userData
        stashFiles = fileList slash.join(userData, 'old'), matchExt: ['.noon']
        if not empty stashFiles
            log 'restoreWindows stashFiles', stashFiles
            for file in stashFiles
                @createWindow restore:file

    #  0000000  00000000   00000000   0000000   000000000  00000000
    # 000       000   000  000       000   000     000     000
    # 000       0000000    0000000   000000000     000     0000000
    # 000       000   000  000       000   000     000     000
    #  0000000  000   000  00000000  000   000     000     00000000

    createWindow: (opt) ->

        opt ?= {}

        log 'Main.createWindow', opt

        {width, height} = @screenSize()
        ww = height + 122

        scheme = prefs.get 'scheme', 'dark'

        cfg =
            x:                parseInt (width-ww)/2
            y:                0
            width:            ww
            height:           height
            minWidth:         140
            minHeight:        130
            useContentSize:   true
            fullscreenable:   true
            acceptFirstMouse: true
            show:             false
            hasShadow:        true
            backgroundColor:  scheme == 'bright' and "#fff" or '#000'
            titleBarStyle:    'hidden'
            autoHideMenuBar:  true

        if os.platform() == 'win32'
            cfg.icon = slash.path __dirname + '/../img/ko.ico'

        win = new BrowserWindow cfg

        if opt.restore?
            newStash = slash.join app.getPath('userData'), 'win', "#{win.id}.noon"
            fs.copySync opt.restore, newStash

        htmlFile  = slash.resolve "#{__dirname}/../#{scheme}.html"
        if not slash.fileExists htmlFile
            pugRender = pug.compileFile slash.path "#{__dirname}/../../pug/index.pug"
            html = pugRender scheme: scheme
            fs.writeFileSync htmlFile, html, 'utf8'

        win.loadURL slash.fileUrl htmlFile

        app.dock?.show()

        win.on 'close',  @onCloseWin
        win.on 'resize', @onResizeWin

        winLoaded = ->

            log 'createWindow.winLoaded id', win.id

            if opt.files?
                log 'createWindow.winLoaded loadFiles', opt.files
                post.toWin win.id, 'loadFiles', opt.files
            else if opt.file?
                log 'createWindow.winLoaded loadFile', opt.file
                post.toWin win.id, 'loadFile', opt.file
            else
                log 'createWindow.winLoaded no file to open?'

            post.toWins 'winLoaded', win.id
            post.toWins 'numWins', wins().length

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

    onCloseWin: (event) =>

        wid = event.sender.id
        log 'onCloseWin id', wid
        if wins().length == 1
            if os.platform() == 'win32'
                @quit()
                return
            else
                hideDock()
        post.toAll 'winClosed', wid
        @postDelayedNumWins()

    otherInstanceStarted: (args, dir) =>

        if not visibleWins().length
            @toggleWindows()

        if not activeWin()
            visibleWins()[0]?.focus()

        files = []
        for arg in args.slice(2)
            continue if arg.startsWith '-'
            file = arg
            if not arg.startsWith '/'
                file = slash.join slash.resolve(dir), arg
            [fpath, pos] = slash.splitFilePos file
            if slash.fileExists fpath
                files.push file

        @createWindow files:files

    quit: ->

        toSave = wins().length

        log 'Main.quit windows to save', toSave

        if toSave
            post.toWins 'saveStash'
            post.on 'stashSaved', ->
                toSave -= 1
                log 'Main.quit stashSaved', toSave
                if toSave == 0
                    prefs.save()
                    log 'Main.quit exit'
                    app.exit     0
                    process.exit 0
            return
        else
            prefs.save()
            log 'Main.quit exit'
            app.exit     0
            process.exit 0

    #  0000000   0000000     0000000   000   000  000000000
    # 000   000  000   000  000   000  000   000     000
    # 000000000  0000000    000   000  000   000     000
    # 000   000  000   000  000   000  000   000     000
    # 000   000  0000000     0000000    0000000      000

    showAbout: -> about img: "#{__dirname}/../../img/about.png", pkg: pkg, color: "#fff"

#  0000000   00000000   00000000         0000000   000   000
# 000   000  000   000  000   000       000   000  0000  000
# 000000000  00000000   00000000        000   000  000 0 000
# 000   000  000        000        000  000   000  000  0000
# 000   000  000        000        000   0000000   000   000

app.on 'open-file', (event, file) ->

    if not main?
        openFiles.push file
    else
        main.createWindow file:file
    event.preventDefault()

app.on 'ready', ->

    main          = new Main openFiles
    main.navigate = new Navigate main

app.on 'window-all-closed', ->
    if os.platform() == 'win32'
        log 'app.on window-all-closed'
        app.quit()

app.setName pkg.productName


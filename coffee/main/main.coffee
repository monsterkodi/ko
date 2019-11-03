###
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
###

{ post, filelist, colors, first, slash, valid, store, prefs, empty, args, noon, app, win, udp, fs, _ } = require 'kxk'

# post.debug()
# log.slog.debug = true

pkg      = require '../../package.json'
electron = require 'electron'

Navigate = require './navigate'
Indexer  = require './indexer'

{ BrowserWindow, clipboard, dialog } = electron

disableSnap   = false
main          = undefined
openFiles     = []
WIN_SNAP_DIST = 150

# process.env.NODE_ENV = 'production' # ???
    
mostRecentFile = -> first state.get 'recentFiles'

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

# 00000000    0000000    0000000  000000000
# 000   000  000   000  000          000
# 00000000   000   000  0000000      000
# 000        000   000       000     000
# 000         0000000   0000000      000

post.onGet 'debugMode' -> args.debug
post.onGet 'winInfos'  -> (id: w.id for w in wins())
post.onGet 'logSync'   ->
    console.log.apply console, [].slice.call(arguments, 0)
    return true

post.on 'throwError'                 -> throw new Error 'err'
post.on 'newWindowWithFile'  (file)  -> main.createWindowWithFile file:file
post.on 'activateWindow'     (winID) -> main.activateWindowWithID winID
post.on 'activateNextWindow' (winID) -> main.activateNextWindow winID
post.on 'activatePrevWindow' (winID) -> main.activatePrevWindow winID

post.on 'menuAction'   (action, arg) -> main?.onMenuAction action, arg
post.on 'ping' (winID, argA, argB) -> post.toWin winID, 'pong' 'main' argA, argB
post.on 'winlog'       (winID, text) -> 
    if args.verbose
        log "#{winID}>>> " + text

# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

class Main extends app

    @: (openFiles) ->
        
        super
            dir:        __dirname
            dirs:       ['../' '../browser' '../commandline' '../commands' '../editor' '../git' '../main' '../tools' '../win']
            pkg:        pkg
            shortcut:   'Alt+F1'
            index:      '../index.html'
            icon:       '../../img/app.ico'
            tray:       '../../img/menu@2x.png'
            about:      '../../img/about.png'
            aboutDebug: false
            onShow:     -> main.onShow()
            onOtherInstance: (args, dir) -> main.onOtherInstance args, dir
            width:      1000
            height:     1000
            minWidth:   240
            minHeight:  230
            args: """
                filelist  files to open           **
                prefs     show preferences        false
                noprefs   don't load preferences  false
                state     show state              false
                nostate   don't load state        false
                verbose   log more                false
                """
            
        @opt.onQuit = @quit
                
        if process.cwd() == '/'
            process.chdir slash.resolve '~'
            
        while valid(args.filelist) and slash.dirExists first args.filelist
            process.chdir args.filelist.shift()
        
        if args.verbose
            log colors.white.bold "\nko", colors.gray "v#{pkg.version}\n"
            log noon.stringify {cwd: process.cwd()}, colors:true
            log colors.yellow.bold '\nargs'
            log noon.stringify args, colors:true
            log ''

        global.state = new store 'state' separator: '|'

        alias = new store 'alias'
        
        if args.prefs
            log colors.yellow.bold 'prefs'
            log colors.green.bold 'prefs file:', prefs.store.file
            log noon.stringify prefs.store.data, colors:true
        
        if args.state
            log colors.yellow.bold 'state'
            log colors.green.bold 'state file:', global.state.file
            log noon.stringify global.state.data, colors:true
            
        @indexer = new Indexer

        if not openFiles.length and valid args.filelist
            openFiles = filelist args.filelist, ignoreHidden:false

        @moveWindowStashes()
        
        @openFiles = openFiles
        
    #  0000000   000   000   0000000  000   000   0000000   000   000  
    # 000   000  0000  000  000       000   000  000   000  000 0 000  
    # 000   000  000 0 000  0000000   000000000  000   000  000000000  
    # 000   000  000  0000       000  000   000  000   000  000   000  
    #  0000000   000   000  0000000   000   000   0000000   00     00  
    
    onShow: =>

        { width, height } = @screenSize()
        
        @opt.width  = height + 122
        @opt.height = height
         
        if valid @openFiles
            for file in @openFiles
                @createWindowWithFile file:file
            delete @openFiles
        else
            @restoreWindows() if not args.nostate
        
        if not wins().length
            if recent = mostRecentFile()
                @createWindowWithFile file:recent 
            else
                @createWindowWithEmpty()

    #  0000000    0000000  000000000  000   0000000   000   000  
    # 000   000  000          000     000  000   000  0000  000  
    # 000000000  000          000     000  000   000  000 0 000  
    # 000   000  000          000     000  000   000  000  0000  
    # 000   000   0000000     000     000   0000000   000   000  
    
    onMenuAction: (action, arg) =>

        switch action
            when 'Cycle Windows'    then @activateNextWindow arg
            when 'Arrange Windows'  then @arrangeWindows()
            when 'New Window'       then @createWindow()
            
    # 000   000  000  000   000  0000000     0000000   000   000   0000000
    # 000 0 000  000  0000  000  000   000  000   000  000 0 000  000
    # 000000000  000  000 0 000  000   000  000   000  000000000  0000000
    # 000   000  000  000  0000  000   000  000   000  000   000       000
    # 00     00  000  000   000  0000000     0000000   00     00  0000000

    wins:        wins()
    winWithID:   winWithID
    activeWin:   activeWin
    visibleWins: visibleWins

    createWindowWithFile: (opt) ->
        
        win = @createWindow (win) -> 
            post.toWin win.id, 'openFiles', [opt.file]
        win

    createWindowWithEmpty: ->
        
        win = @createWindow (win) -> 
            post.toWin win.id, 'newEmptyTab'
        win
        
    toggleWindows: (cb) =>

        if valid wins()
            
            if valid visibleWins()
                
                if activeWin()
                    @hideWindows()
                else
                    @raiseWindows()
            else
                @showWindows()
                
            cb first visibleWins()
        else
            @createWindow cb

    hideWindows: ->

        for w in wins()
            w.hide()
            @hideDock()
        @

    showWindows: ->

        for w in wins()
            w.show()
            @showDock()
        @

    raiseWindows: ->

        if valid visibleWins()
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
        return false if empty wl
        
        for w in wl
            if w.isFullScreen()
                w.setFullScreen false 
        
        bounds = wl[0].getBounds()
                
        return false if wl.length == 1 and bounds.width == @screenSize().width
        
        for wi in [1...wl.length]
            if not _.isEqual wl[wi].getBounds(), bounds
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
        { width, height } = @screenSize()

        if not @windowsAreStacked()
            @stackWindows()
            disableSnap = false
            return

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
        
        throw new Error 'test'

    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000
    # 0000000    0000000   0000000      000     000   000  0000000    0000000
    # 000   000  000            000     000     000   000  000   000  000
    # 000   000  00000000  0000000      000      0000000   000   000  00000000

    moveWindowStashes: ->
        
        stashDir = slash.join @userData, 'win'
        if slash.dirExists stashDir
            fs.moveSync stashDir, slash.join(@userData, 'old'), overwrite: true

    restoreWindows: ->

        fs.ensureDirSync @userData
        for file in filelist(slash.join(@userData, 'old'), matchExt:'noon')
            win = @createWindow()
            newStash = slash.join @userData, 'win', "#{win.id}.noon"
            fs.copySync file, newStash

    toggleWindowFromTray: => 
            
        if valid wins()
            for win in wins()
                win.show()
        else
            @moveWindowStashes()
            @restoreWindows()
                
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
        if wins().length == 1
            if slash.win()
                @quit()
                return
            else
                @hideDock()
        post.toAll 'winClosed', wid
        @postDelayedNumWins()

    #  0000000   000000000  000   000  00000000  00000000       000  000   000   0000000  000000000  
    # 000   000     000     000   000  000       000   000      000  0000  000  000          000     
    # 000   000     000     000000000  0000000   0000000        000  000 0 000  0000000      000     
    # 000   000     000     000   000  000       000   000      000  000  0000       000     000     
    #  0000000      000     000   000  00000000  000   000      000  000   000  0000000      000     

    activateOneWindow: (cb) ->
    
        if empty visibleWins()
            @toggleWindows cb
            return

        if not activeWin()
            if win = visibleWins()[0]
                if slash.win()
                    wxw = require 'wxw'   
                    wxw 'raise' slash.resolve process.argv[0]
                win.focus()
                cb win
            else
                cb null
        else
            if slash.win()
                wxw = require 'wxw'   
                wxw 'raise' slash.resolve process.argv[0]
            cb visibleWins()[0]
            
    onOtherInstance: (args, dir) =>

        log 'onOtherInstance dir:',  dir
        log 'onOtherInstance args:', args
        
        @activateOneWindow (win) ->

            files = []
            if first(args)?.endsWith "#{pkg.name}.exe"
                fileargs = args.slice 1
            else
                fileargs = args.slice 2
    
            for arg in fileargs
                continue if arg.startsWith '-'
                file = arg
                if slash.isRelative file
                    file = slash.join slash.resolve(dir), arg
                [fpath, pos] = slash.splitFilePos file
                if slash.exists fpath
                    files.push file
    
            log 'onOtherInstance files', files
                            
            post.toWin win.id, 'openFiles', files, newTab:true

    #  0000000   000   000  000  000000000  
    # 000   000  000   000  000     000     
    # 000 00 00  000   000  000     000     
    # 000 0000   000   000  000     000     
    #  00000 00   0000000   000     000     
    
    quit: =>

        toSave = wins().length

        if toSave
            post.toWins 'saveStash'
            post.on 'stashSaved', =>
                toSave -= 1
                if toSave == 0
                    global.state.save()
                    @exitApp()
            'delay'
        else
            global.state.save()
            
#  0000000   00000000   00000000         0000000   000   000
# 000   000  000   000  000   000       000   000  0000  000
# 000000000  00000000   00000000        000   000  000 0 000
# 000   000  000        000        000  000   000  000  0000
# 000   000  000        000        000   0000000   000   000

electron.app.on 'open-file', (event, file) ->

    if not main?
        openFiles.push file
    else
        if electron.app.isReady()
            main.activateOneWindow (win) ->
                post.toWin win.id, 'openFiles', [file] 
        else
            main.createWindowWithFile file:file
        
    event.preventDefault()

electron.app.on 'window-all-closed', -> log 'window-all-closed'

# 000   000  0000000    00000000     
# 000   000  000   000  000   000    
# 000   000  000   000  00000000     
# 000   000  000   000  000          
#  0000000   0000000    000          

onUDP = (file) ->
    main.activateOneWindow (win) ->
        post.toWin win.id, 'openFiles', [file] 

koReceiver = new udp port:9779, onMsg:onUDP

main          = new Main openFiles
main.navigate = new Navigate main

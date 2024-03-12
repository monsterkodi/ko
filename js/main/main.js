// monsterkodi/kode 0.257.0

var _k_ = {first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, each_r: function (o) {return Array.isArray(o) ? [] : typeof o == 'string' ? o.split('') : {}}, extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var activeWin, app, args, BrowserWindow, disableSnap, electron, filelist, fs, Indexer, klog, kolor, main, Main, mostRecentFile, Navigate, openFiles, pkg, post, prefs, slash, store, udp, visibleWins, win, WIN_SNAP_DIST, wins, winWithID, _

_ = require('kxk')._
app = require('kxk').app
args = require('kxk').args
filelist = require('kxk').filelist
first = require('kxk').first
fs = require('kxk').fs
klog = require('kxk').klog
kolor = require('kxk').kolor
noon = require('kxk').noon
post = require('kxk').post
prefs = require('kxk').prefs
slash = require('kxk').slash
store = require('kxk').store
udp = require('kxk').udp
win = require('kxk').win

pkg = require('../../package.json')
electron = require('electron')
Navigate = require('./navigate')
Indexer = require('./indexer')
BrowserWindow = electron.BrowserWindow
disableSnap = false
main = undefined
openFiles = []
WIN_SNAP_DIST = 150

mostRecentFile = function ()
{
    return _k_.first(state.get('recentFiles'))
}

wins = function ()
{
    return BrowserWindow.getAllWindows().sort(function (a, b)
    {
        return a.id - b.id
    })
}

activeWin = function ()
{
    return BrowserWindow.getFocusedWindow()
}

visibleWins = function ()
{
    var w, ws

    ws = []
    var list = _k_.list(wins())
    for (var _39_10_ = 0; _39_10_ < list.length; _39_10_++)
    {
        w = list[_39_10_]
        if ((w != null ? w.isVisible() : undefined) && !(w != null ? w.isMinimized() : undefined))
        {
            ws.push(w)
        }
    }
    return ws
}

winWithID = function (winID)
{
    var w, wid

    wid = parseInt(winID)
    var list = _k_.list(wins())
    for (var _46_10_ = 0; _46_10_ < list.length; _46_10_++)
    {
        w = list[_46_10_]
        if (w.id === wid)
        {
            return w
        }
    }
}
post.onGet('debugMode',function ()
{
    return args.debug
})
post.onGet('winInfos',function ()
{
    return     (function (o) {
        var r_56_33_ = _k_.each_r(o)
        for (var k in o)
        {   
            var m = (function (w)
        {
            return {id:w.id}
        })(o[k])
            if (m != null)
            {
                r_56_33_[k] = m
            }
        }
        return typeof o == 'string' ? r_56_33_.join('') : r_56_33_
    })(wins())
})
post.onGet('logSync',function ()
{
    console.log.apply(console,[].slice.call(arguments,0))
    return true
})
post.on('throwError',function ()
{
    throw new Error('err')
})
post.on('newWindowWithFile',function (file)
{
    return main.createWindowWithFile({file:file})
})
post.on('activateWindow',function (winID)
{
    return main.activateWindowWithID(winID)
})
post.on('activateNextWindow',function (winID)
{
    return main.activateNextWindow(winID)
})
post.on('activatePrevWindow',function (winID)
{
    return main.activatePrevWindow(winID)
})
post.on('arrangeWindows',function ()
{
    return main.arrangeWindows()
})
post.on('menuAction',function (action, arg)
{
    return (main != null ? main.onMenuAction(action,arg) : undefined)
})
post.on('ping',function (winID, argA, argB)
{
    return post.toWin(winID,'pong','main',argA,argB)
})
post.on('winlog',function (winID, text)
{
    if (args.verbose)
    {
        console.log(`${winID}>> ` + text)
    }
})

Main = (function ()
{
    _k_.extend(Main, app)
    function Main (openFiles)
    {
        this["quit"] = this["quit"].bind(this)
        this["reloadWin"] = this["reloadWin"].bind(this)
        this["onOtherInstance"] = this["onOtherInstance"].bind(this)
        this["toggleWindowFromTray"] = this["toggleWindowFromTray"].bind(this)
        this["arrangeWindows"] = this["arrangeWindows"].bind(this)
        this["toggleWindows"] = this["toggleWindows"].bind(this)
        this["createWindow"] = this["createWindow"].bind(this)
        this["onUDP"] = this["onUDP"].bind(this)
        this["onShow"] = this["onShow"].bind(this)
        Main.__super__.constructor.call(this,{pkg:pkg,dir:__dirname,dirs:['../','../browser','../commandline','../commands','../editor','../editor/actions','../git','../main','../tools','../win'],shortcut:'CmdOrCtrl+F1',index:'../index.html',icon:'../../img/app.ico',tray:'../../img/menu@2x.png',about:'../../img/about.png',aboutDebug:false,saveBounds:false,onShow:function ()
        {
            return main.onShow()
        },onOtherInstance:function (args, dir)
        {
            return main.onOtherInstance(args,dir)
        },width:1000,height:1000,minWidth:240,minHeight:230,args:`ko
    filelist    files to open               **
    prefs       show preferences            = false
    noprefs     don't load preferences      = false
    state       show state                  = false
    nostate     don't load state            = false
    verbose     log more                    = false
    devtools    open developer tools        = false  -D
    watch       watch sources for changes   = false`})
        this.opt.onQuit = this.quit
        if (process.cwd() === '/')
        {
            process.chdir(slash.resolve('~'))
        }
        while (!_k_.empty((args.filelist)) && slash.dirExists(_k_.first(args.filelist)))
        {
            process.chdir(args.filelist.shift())
        }
        if (args.verbose)
        {
            console.log(kolor.white(kolor.bold("\nko",kolor.gray(`v${pkg.version}\n`))))
            console.log(noon.stringify({cwd:process.cwd()},{colors:true}))
            console.log(kolor.yellow(kolor.bold('\nargs')))
            console.log(noon.stringify(args,{colors:true}))
            console.log('')
        }
        global.state = new store('state',{separator:'|'})
        if (args.state)
        {
            console.log(kolor.yellow(kolor.bold('state')))
            console.log(kolor.green(kolor.bold('state file:',global.state.file)))
            console.log(noon.stringify(global.state.data,{colors:true}))
        }
        this.indexer = new Indexer
        if (!openFiles.length && !_k_.empty(args.filelist))
        {
            openFiles = filelist(args.filelist,{ignoreHidden:false})
        }
        this.moveWindowStashes()
        post.on('reloadWin',this.reloadWin)
        this.openFiles = openFiles
    }

    Main.prototype["onShow"] = function ()
    {
        var file, height, recent, width, _163_50_, _164_42_

        width = this.screenSize().width
        height = this.screenSize().height

        this.opt.width = height + 122
        this.opt.height = height
        if (args.prefs)
        {
            console.log(kolor.yellow(kolor.bold('prefs')))
            console.log(kolor.green(kolor.bold((prefs.store != null ? prefs.store.file : undefined))))
            console.log(noon.stringify((prefs.store != null ? prefs.store.data : undefined),{colors:true}))
        }
        if (!_k_.empty(this.openFiles))
        {
            var list = _k_.list(this.openFiles)
            for (var _167_21_ = 0; _167_21_ < list.length; _167_21_++)
            {
                file = list[_167_21_]
                this.createWindowWithFile({file:file})
            }
            delete this.openFiles
        }
        else
        {
            if (!args.nostate)
            {
                this.restoreWindows()
            }
        }
        if (!wins().length)
        {
            if (recent = mostRecentFile())
            {
                this.createWindowWithFile({file:recent})
            }
            else
            {
                this.createWindowWithEmpty()
            }
        }
        return new udp({port:9777,onMsg:this.onUDP})
    }

    Main.prototype["onUDP"] = function (file)
    {
        return this.activateOneWindow(function (win)
        {
            return post.toWin(win.id,'openFiles',[file])
        })
    }

    Main.prototype["wins"] = function ()
    {
        return wins()
    }

    Main.prototype["winWithID"] = function (id)
    {
        return winWithID(id)
    }

    Main.prototype["activeWin"] = function ()
    {
        return activeWin()
    }

    Main.prototype["visibleWins"] = function ()
    {
        return visibleWins()
    }

    Main.prototype["createWindow"] = function (cb)
    {
        win = Main.__super__.createWindow.call(this,cb)
        return win.on('close',function (e)
        {
            return post.toWin(e.sender.id,'clearStash')
        })
    }

    Main.prototype["onWinClose"] = function (e)
    {
        return Main.__super__.onWinClose.call(this,e)
    }

    Main.prototype["createWindowWithFile"] = function (opt)
    {
        win = this.createWindow(function (win)
        {
            return post.toWin(win.id,'openFiles',[opt.file])
        })
        return win
    }

    Main.prototype["createWindowWithEmpty"] = function ()
    {
        win = this.createWindow(function (win)
        {
            return post.toWin(win.id,'newEmptyTab')
        })
        return win
    }

    Main.prototype["toggleWindows"] = function (cb)
    {
        if (!_k_.empty(wins()))
        {
            if (!_k_.empty(visibleWins()))
            {
                if (activeWin())
                {
                    this.hideWindows()
                }
                else
                {
                    this.raiseWindows()
                }
            }
            else
            {
                this.showWindows()
            }
            return cb(_k_.first(visibleWins()))
        }
        else
        {
            return this.createWindow(cb)
        }
    }

    Main.prototype["hideWindows"] = function ()
    {
        var w

        var list = _k_.list(wins())
        for (var _242_14_ = 0; _242_14_ < list.length; _242_14_++)
        {
            w = list[_242_14_]
            w.hide()
            this.hideDock()
        }
        return this
    }

    Main.prototype["showWindows"] = function ()
    {
        var w

        var list = _k_.list(wins())
        for (var _249_14_ = 0; _249_14_ < list.length; _249_14_++)
        {
            w = list[_249_14_]
            w.show()
            this.showDock()
        }
        return this
    }

    Main.prototype["raiseWindows"] = function ()
    {
        var w

        if (!_k_.empty(visibleWins()))
        {
            var list = _k_.list(visibleWins())
            for (var _257_18_ = 0; _257_18_ < list.length; _257_18_++)
            {
                w = list[_257_18_]
                w.showInactive()
            }
            visibleWins()[0].showInactive()
            visibleWins()[0].focus()
        }
        return this
    }

    Main.prototype["activateNextWindow"] = function (win)
    {
        var allWindows, i, w

        if (_k_.isNum(win))
        {
            win = winWithID(win)
        }
        allWindows = wins()
        var list = _k_.list(allWindows)
        for (var _267_14_ = 0; _267_14_ < list.length; _267_14_++)
        {
            w = list[_267_14_]
            if (w === win)
            {
                i = 1 + allWindows.indexOf(w)
                if (i >= allWindows.length)
                {
                    i = 0
                }
                this.activateWindowWithID(allWindows[i].id)
                return w
            }
        }
        return null
    }

    Main.prototype["activatePrevWindow"] = function (win)
    {
        var allWindows, i, w

        if (_k_.isNum(win))
        {
            win = winWithID(win)
        }
        allWindows = wins()
        var list = _k_.list(allWindows)
        for (var _279_14_ = 0; _279_14_ < list.length; _279_14_++)
        {
            w = list[_279_14_]
            if (w === win)
            {
                i = -1 + allWindows.indexOf(w)
                if (i < 0)
                {
                    i = allWindows.length - 1
                }
                this.activateWindowWithID(allWindows[i].id)
                return w
            }
        }
        return null
    }

    Main.prototype["activateWindowWithID"] = function (wid)
    {
        var w

        w = winWithID(wid)
        if (!(w != null))
        {
            return
        }
        if (!w.isVisible())
        {
            w.show()
        }
        else
        {
            w.focus()
        }
        return w
    }

    Main.prototype["screenSize"] = function ()
    {
        return electron.screen.getPrimaryDisplay().workAreaSize
    }

    Main.prototype["stackWindows"] = function ()
    {
        var height, w, width, wl, ww, x, y, _307_81_

        x = electron.screen.getDisplayMatching((this.activeWin() != null ? this.activeWin().getBounds() : undefined)).workArea.x
        y = electron.screen.getDisplayMatching((this.activeWin() != null ? this.activeWin().getBounds() : undefined)).workArea.y
        width = electron.screen.getDisplayMatching((this.activeWin() != null ? this.activeWin().getBounds() : undefined)).workArea.width
        height = electron.screen.getDisplayMatching((this.activeWin() != null ? this.activeWin().getBounds() : undefined)).workArea.height

        ww = height + 122
        wl = visibleWins()
        var list = _k_.list(wl)
        for (var _310_14_ = 0; _310_14_ < list.length; _310_14_++)
        {
            w = list[_310_14_]
            w.showInactive()
            w.setBounds({x:x + parseInt((width - ww) / 2),y:y,width:parseInt(ww),height:parseInt(height)})
        }
        return activeWin().show()
    }

    Main.prototype["windowsAreStacked"] = function ()
    {
        var bounds, height, w, wi, width, wl

        wl = visibleWins()
        if (_k_.empty(wl))
        {
            return false
        }
        var list = _k_.list(wl)
        for (var _324_14_ = 0; _324_14_ < list.length; _324_14_++)
        {
            w = list[_324_14_]
            if (w.isFullScreen())
            {
                w.setFullScreen(false)
            }
        }
        bounds = (wl[0] != null ? wl[0].getBounds() : undefined)
        width = electron.screen.getDisplayMatching(bounds).workAreaSize.width
        height = electron.screen.getDisplayMatching(bounds).workAreaSize.height

        if (wl.length === 1 && bounds.width === width)
        {
            return false
        }
        for (var _334_19_ = wi = 1, _334_23_ = wl.length; (_334_19_ <= _334_23_ ? wi < wl.length : wi > wl.length); (_334_19_ <= _334_23_ ? ++wi : --wi))
        {
            if (!_.isEqual((wl[wi] != null ? wl[wi].getBounds() : undefined),bounds))
            {
                return false
            }
        }
        return true
    }

    Main.prototype["arrangeWindows"] = function ()
    {
        var display, frameSize, height, i, rh, w, w2, width, wl, x, y, _350_65_

        disableSnap = true
        frameSize = 6
        wl = visibleWins()
        display = electron.screen.getDisplayMatching((this.activeWin() != null ? this.activeWin().getBounds() : undefined))
        x = display.workArea.x
        y = display.workArea.y
        width = display.workArea.width
        height = display.workArea.height

        if (!this.windowsAreStacked())
        {
            this.stackWindows()
            disableSnap = false
            return
        }
        if (wl.length === 1)
        {
            wl[0].showInactive()
            wl[0].setBounds(display.workArea)
        }
        else if (wl.length === 2 || wl.length === 3)
        {
            w = width / wl.length
            for (var _363_22_ = i = 0, _363_26_ = wl.length; (_363_22_ <= _363_26_ ? i < wl.length : i > wl.length); (_363_22_ <= _363_26_ ? ++i : --i))
            {
                wl[i].showInactive()
                wl[i].setBounds({x:x + parseInt(i * w - (i > 0 && frameSize / 2 || 0)),width:parseInt(w + ((i === 0 || i === wl.length - 1) && frameSize / 2 || frameSize)),y:y + parseInt(0),height:parseInt(height)})
            }
        }
        else if (wl.length)
        {
            w2 = parseInt(wl.length / 2)
            rh = height
            for (var _373_22_ = i = 0, _373_26_ = w2; (_373_22_ <= _373_26_ ? i < w2 : i > w2); (_373_22_ <= _373_26_ ? ++i : --i))
            {
                w = width / w2
                wl[i].showInactive()
                wl[i].setBounds({x:x + parseInt(i * w - (i > 0 && frameSize / 2 || 0)),width:parseInt(w + ((i === 0 || i === w2 - 1) && frameSize / 2 || frameSize)),y:y + parseInt(0),height:parseInt(rh / 2)})
            }
            for (var _381_22_ = i = w2, _381_27_ = wl.length; (_381_22_ <= _381_27_ ? i < wl.length : i > wl.length); (_381_22_ <= _381_27_ ? ++i : --i))
            {
                w = width / (wl.length - w2)
                wl[i].showInactive()
                wl[i].setBounds({x:x + parseInt((i - w2) * w - (i - w2 > 0 && frameSize / 2 || 0)),y:parseInt(rh / 2 + 23),width:y + parseInt(w + ((i - w2 === 0 || i === wl.length - 1) && frameSize / 2 || frameSize)),height:parseInt(rh / 2)})
            }
        }
        return disableSnap = false
    }

    Main.prototype["moveWindowStashes"] = function ()
    {
        var stashDir

        stashDir = slash.join(this.userData,'win')
        if (slash.dirExists(stashDir))
        {
            return fs.moveSync(stashDir,slash.join(this.userData,'old'),{overwrite:true})
        }
    }

    Main.prototype["restoreWindows"] = function ()
    {
        var file, newStash

        fs.ensureDirSync(this.userData)
        var list = _k_.list(filelist(slash.join(this.userData,'old'),{matchExt:'noon'}))
        for (var _406_17_ = 0; _406_17_ < list.length; _406_17_++)
        {
            file = list[_406_17_]
            win = this.createWindow()
            newStash = slash.join(this.userData,'win',`${win.id}.noon`)
            fs.copySync(file,newStash)
        }
    }

    Main.prototype["toggleWindowFromTray"] = function ()
    {
        if (!_k_.empty(wins()))
        {
            var list = _k_.list(wins())
            for (var _414_20_ = 0; _414_20_ < list.length; _414_20_++)
            {
                win = list[_414_20_]
                win.show()
            }
        }
        else
        {
            this.moveWindowStashes()
            return this.restoreWindows()
        }
    }

    Main.prototype["onResizeWin"] = function (event)
    {
        var b, frameSize, w, wb, _430_25_

        if (disableSnap)
        {
            return
        }
        frameSize = 6
        wb = (event.sender != null ? event.sender.getBounds() : undefined)
        klog('ko.main.onResizeWin')
        var list = _k_.list(wins())
        for (var _434_14_ = 0; _434_14_ < list.length; _434_14_++)
        {
            w = list[_434_14_]
            if (w === event.sender)
            {
                continue
            }
            b = (w != null ? w.getBounds() : undefined)
            if (b.height === wb.height && b.y === wb.y)
            {
                if (b.x < wb.x)
                {
                    if (Math.abs(b.x + b.width - wb.x) < WIN_SNAP_DIST)
                    {
                        w.showInactive()
                        w.setBounds({x:b.x,y:b.y,width:wb.x - b.x + frameSize,height:b.height})
                    }
                }
                else if (b.x + b.width > wb.x + wb.width)
                {
                    if (Math.abs(wb.x + wb.width - b.x) < WIN_SNAP_DIST)
                    {
                        w.showInactive()
                        w.setBounds({x:wb.x + wb.width - frameSize,y:b.y,width:b.x + b.width - (wb.x + wb.width - frameSize),height:b.height})
                    }
                }
            }
        }
    }

    Main.prototype["activateOneWindow"] = function (cb)
    {
        var wxw

        if (_k_.empty(visibleWins()))
        {
            this.toggleWindows(cb)
            return
        }
        if (!activeWin())
        {
            if (win = visibleWins()[0])
            {
                if (slash.win())
                {
                    wxw = require('wxw')
                    wxw('raise',slash.resolve(process.argv[0]))
                }
                win.focus()
                return cb(win)
            }
            else
            {
                return cb(null)
            }
        }
        else
        {
            if (slash.win())
            {
                wxw = require('wxw')
                wxw('raise',slash.resolve(process.argv[0]))
            }
            return cb(visibleWins()[0])
        }
    }

    Main.prototype["onOtherInstance"] = function (args, dir)
    {
        return this.activateOneWindow(function (win)
        {
            var arg, file, fileargs, files, fpath, pos, _487_26_

            files = []
            if ((_k_.first(args) != null ? _k_.first(args).endsWith(`${pkg.name}.exe`) : undefined))
            {
                fileargs = args.slice(1)
            }
            else
            {
                fileargs = args.slice(2)
            }
            var list = _k_.list(fileargs)
            for (var _492_20_ = 0; _492_20_ < list.length; _492_20_++)
            {
                arg = list[_492_20_]
                if (arg.startsWith('-'))
                {
                    continue
                }
                file = arg
                if (slash.isRelative(file))
                {
                    file = slash.join(slash.resolve(dir),arg)
                }
                var _497_29_ = slash.splitFilePos(file); fpath = _497_29_[0]; pos = _497_29_[1]

                if (slash.exists(fpath))
                {
                    files.push(file)
                }
            }
            post.toWin(win.id,'openFiles',files,{newTab:true})
            win.show()
            return win.focus()
        })
    }

    Main.prototype["reloadWin"] = function (o)
    {
        if (win = winWithID(o.winID))
        {
            win.webContents.reloadIgnoringCache()
            return post.toWin(win.id,'openFiles',o.file)
        }
    }

    Main.prototype["quit"] = function ()
    {
        var toSave

        toSave = wins().length
        if (toSave)
        {
            post.on('stashSaved',(function ()
            {
                toSave -= 1
                if (toSave === 0)
                {
                    global.state.save()
                    return this.exitApp()
                }
            }).bind(this))
            post.toWins('saveStash')
            return 'delay'
        }
        else
        {
            return global.state.save()
        }
    }

    return Main
})()

electron.app.on('open-file',function (event, file)
{
    if (!(main != null))
    {
        openFiles.push(file)
    }
    else
    {
        if (electron.app.isReady())
        {
            main.activateOneWindow(function (win)
            {
                return post.toWin(win.id,'openFiles',[file])
            })
        }
        else
        {
            main.createWindowWithFile({file:file})
        }
    }
    return event.preventDefault()
})
main = new Main(openFiles)
main.navigate = new Navigate(main)
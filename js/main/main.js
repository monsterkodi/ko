// koffee 1.19.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Indexer, Main, Navigate, WIN_SNAP_DIST, _, activeWin, app, args, disableSnap, electron, empty, filelist, first, fs, klog, kolor, main, mostRecentFile, noon, openFiles, pkg, post, prefs, ref, slash, store, udp, valid, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), _ = ref._, app = ref.app, args = ref.args, empty = ref.empty, filelist = ref.filelist, first = ref.first, fs = ref.fs, klog = ref.klog, kolor = ref.kolor, noon = ref.noon, post = ref.post, prefs = ref.prefs, slash = ref.slash, store = ref.store, udp = ref.udp, valid = ref.valid, win = ref.win;

pkg = require('../../package.json');

electron = require('electron');

Navigate = require('./navigate');

Indexer = require('./indexer');

BrowserWindow = electron.BrowserWindow;

disableSnap = false;

main = void 0;

openFiles = [];

WIN_SNAP_DIST = 150;

mostRecentFile = function() {
    return first(state.get('recentFiles'));
};

wins = function() {
    return BrowserWindow.getAllWindows().sort(function(a, b) {
        return a.id - b.id;
    });
};

activeWin = function() {
    return BrowserWindow.getFocusedWindow();
};

visibleWins = function() {
    var j, len, ref1, results, w;
    ref1 = wins();
    results = [];
    for (j = 0, len = ref1.length; j < len; j++) {
        w = ref1[j];
        if ((w != null ? w.isVisible() : void 0) && !(w != null ? w.isMinimized() : void 0)) {
            results.push(w);
        }
    }
    return results;
};

winWithID = function(winID) {
    var j, len, ref1, w, wid;
    wid = parseInt(winID);
    ref1 = wins();
    for (j = 0, len = ref1.length; j < len; j++) {
        w = ref1[j];
        if (w.id === wid) {
            return w;
        }
    }
};

post.onGet('debugMode', function() {
    return args.debug;
});

post.onGet('winInfos', function() {
    var j, len, ref1, results, w;
    ref1 = wins();
    results = [];
    for (j = 0, len = ref1.length; j < len; j++) {
        w = ref1[j];
        results.push({
            id: w.id
        });
    }
    return results;
});

post.onGet('logSync', function() {
    console.log.apply(console, [].slice.call(arguments, 0));
    return true;
});

post.on('throwError', function() {
    throw new Error('err');
});

post.on('newWindowWithFile', function(file) {
    return main.createWindowWithFile({
        file: file
    });
});

post.on('activateWindow', function(winID) {
    return main.activateWindowWithID(winID);
});

post.on('activateNextWindow', function(winID) {
    return main.activateNextWindow(winID);
});

post.on('activatePrevWindow', function(winID) {
    return main.activatePrevWindow(winID);
});

post.on('menuAction', function(action, arg) {
    return main != null ? main.onMenuAction(action, arg) : void 0;
});

post.on('ping', function(winID, argA, argB) {
    return post.toWin(winID, 'pong', 'main', argA, argB);
});

post.on('winlog', function(winID, text) {
    if (args.verbose) {
        return console.log((winID + ">> ") + text);
    }
});

Main = (function(superClass) {
    extend(Main, superClass);

    function Main(openFiles) {
        this.quit = bind(this.quit, this);
        this.reloadWin = bind(this.reloadWin, this);
        this.onOtherInstance = bind(this.onOtherInstance, this);
        this.toggleWindowFromTray = bind(this.toggleWindowFromTray, this);
        this.arrangeWindows = bind(this.arrangeWindows, this);
        this.toggleWindows = bind(this.toggleWindows, this);
        this.onMenuAction_OLD = bind(this.onMenuAction_OLD, this);
        this.onUDP = bind(this.onUDP, this);
        this.onShow = bind(this.onShow, this);
        var alias;
        Main.__super__.constructor.call(this, {
            pkg: pkg,
            dir: __dirname,
            dirs: ['../', '../browser', '../commandline', '../commands', '../editor', '../editor/actions', '../git', '../main', '../tools', '../win'],
            shortcut: 'CmdOrCtrl+F1',
            index: '../index.html',
            icon: '../../img/app.ico',
            tray: '../../img/menu@2x.png',
            about: '../../img/about.png',
            aboutDebug: false,
            saveBounds: false,
            onShow: function() {
                return main.onShow();
            },
            onOtherInstance: function(args, dir) {
                return main.onOtherInstance(args, dir);
            },
            width: 1000,
            height: 1000,
            minWidth: 240,
            minHeight: 230,
            args: "filelist  files to open           **\nprefs     show preferences        false\nnoprefs   don't load preferences  false\nstate     show state              false\nnostate   don't load state        false\nverbose   log more                false"
        });
        this.opt.onQuit = this.quit;
        if (process.cwd() === '/') {
            process.chdir(slash.resolve('~'));
        }
        while (valid(args.filelist) && slash.dirExists(first(args.filelist))) {
            process.chdir(args.filelist.shift());
        }
        if (args.verbose) {
            console.log(kolor.white(kolor.bold("\nko", kolor.gray("v" + pkg.version + "\n"))));
            console.log(noon.stringify({
                cwd: process.cwd()
            }, {
                colors: true
            }));
            console.log(kolor.yellow(kolor.bold('\nargs')));
            console.log(noon.stringify(args, {
                colors: true
            }));
            console.log('');
        }
        global.state = new store('state', {
            separator: '|'
        });
        alias = new store('alias');
        if (args.state) {
            console.log(kolor.yellow(kolor.bold('state')));
            console.log(kolor.green(kolor.bold('state file:', global.state.file)));
            console.log(noon.stringify(global.state.data, {
                colors: true
            }));
        }
        this.indexer = new Indexer;
        if (!openFiles.length && valid(args.filelist)) {
            openFiles = filelist(args.filelist, {
                ignoreHidden: false
            });
        }
        this.moveWindowStashes();
        post.on('reloadWin', this.reloadWin);
        this.openFiles = openFiles;
    }

    Main.prototype.onShow = function() {
        var file, height, j, len, recent, ref1, ref2, ref3, ref4, width;
        ref1 = this.screenSize(), width = ref1.width, height = ref1.height;
        this.opt.width = height + 122;
        this.opt.height = height;
        if (args.prefs) {
            console.log(kolor.yellow(kolor.bold('prefs')));
            console.log(kolor.green(kolor.bold((ref2 = prefs.store) != null ? ref2.file : void 0)));
            console.log(noon.stringify((ref3 = prefs.store) != null ? ref3.data : void 0, {
                colors: true
            }));
        }
        if (valid(this.openFiles)) {
            ref4 = this.openFiles;
            for (j = 0, len = ref4.length; j < len; j++) {
                file = ref4[j];
                this.createWindowWithFile({
                    file: file
                });
            }
            delete this.openFiles;
        } else {
            if (!args.nostate) {
                this.restoreWindows();
            }
        }
        if (!wins().length) {
            if (recent = mostRecentFile()) {
                this.createWindowWithFile({
                    file: recent
                });
            } else {
                this.createWindowWithEmpty();
            }
        }
        return new udp({
            port: 9779,
            onMsg: this.onUDP
        });
    };

    Main.prototype.onUDP = function(file) {
        return this.activateOneWindow(function(win) {
            return post.toWin(win.id, 'openFiles', [file]);
        });
    };

    Main.prototype.onMenuAction_OLD = function(action, arg) {
        switch (action) {
            case 'Cycle Windows':
                return this.activateNextWindow(arg);
            case 'Arrange Windows':
                return this.arrangeWindows();
            case 'New Window':
                return this.createWindow();
        }
    };

    Main.prototype.wins = wins();

    Main.prototype.winWithID = winWithID;

    Main.prototype.activeWin = activeWin;

    Main.prototype.visibleWins = visibleWins;

    Main.prototype.createWindowWithFile = function(opt) {
        win = this.createWindow(function(win) {
            return post.toWin(win.id, 'openFiles', [opt.file]);
        });
        return win;
    };

    Main.prototype.createWindowWithEmpty = function() {
        win = this.createWindow(function(win) {
            return post.toWin(win.id, 'newEmptyTab');
        });
        return win;
    };

    Main.prototype.toggleWindows = function(cb) {
        if (valid(wins())) {
            if (valid(visibleWins())) {
                if (activeWin()) {
                    this.hideWindows();
                } else {
                    this.raiseWindows();
                }
            } else {
                this.showWindows();
            }
            return cb(first(visibleWins()));
        } else {
            return this.createWindow(cb);
        }
    };

    Main.prototype.hideWindows = function() {
        var j, len, ref1, w;
        ref1 = wins();
        for (j = 0, len = ref1.length; j < len; j++) {
            w = ref1[j];
            w.hide();
            this.hideDock();
        }
        return this;
    };

    Main.prototype.showWindows = function() {
        var j, len, ref1, w;
        ref1 = wins();
        for (j = 0, len = ref1.length; j < len; j++) {
            w = ref1[j];
            w.show();
            this.showDock();
        }
        return this;
    };

    Main.prototype.raiseWindows = function() {
        var j, len, ref1, w;
        if (valid(visibleWins())) {
            ref1 = visibleWins();
            for (j = 0, len = ref1.length; j < len; j++) {
                w = ref1[j];
                w.showInactive();
            }
            visibleWins()[0].showInactive();
            visibleWins()[0].focus();
        }
        return this;
    };

    Main.prototype.activateNextWindow = function(win) {
        var allWindows, i, j, len, w;
        if (_.isNumber(win)) {
            win = winWithID(win);
        }
        allWindows = wins();
        for (j = 0, len = allWindows.length; j < len; j++) {
            w = allWindows[j];
            if (w === win) {
                i = 1 + allWindows.indexOf(w);
                if (i >= allWindows.length) {
                    i = 0;
                }
                this.activateWindowWithID(allWindows[i].id);
                return w;
            }
        }
        return null;
    };

    Main.prototype.activatePrevWindow = function(win) {
        var allWindows, i, j, len, w;
        if (_.isNumber(win)) {
            win = winWithID(win);
        }
        allWindows = wins();
        for (j = 0, len = allWindows.length; j < len; j++) {
            w = allWindows[j];
            if (w === win) {
                i = -1 + allWindows.indexOf(w);
                if (i < 0) {
                    i = allWindows.length - 1;
                }
                this.activateWindowWithID(allWindows[i].id);
                return w;
            }
        }
        return null;
    };

    Main.prototype.activateWindowWithID = function(wid) {
        var w;
        w = winWithID(wid);
        if (w == null) {
            return;
        }
        if (!w.isVisible()) {
            w.show();
        } else {
            w.focus();
        }
        return w;
    };

    Main.prototype.screenSize = function() {
        return electron.screen.getPrimaryDisplay().workAreaSize;
    };

    Main.prototype.stackWindows = function() {
        var height, j, len, ref1, w, width, wl, ww;
        ref1 = this.screenSize(), width = ref1.width, height = ref1.height;
        ww = height + 122;
        wl = visibleWins();
        for (j = 0, len = wl.length; j < len; j++) {
            w = wl[j];
            w.showInactive();
            w.setBounds({
                x: parseInt((width - ww) / 2),
                y: parseInt(0),
                width: parseInt(ww),
                height: parseInt(height)
            });
        }
        return activeWin().show();
    };

    Main.prototype.windowsAreStacked = function() {
        var bounds, j, k, len, ref1, w, wi, wl;
        wl = visibleWins();
        if (empty(wl)) {
            return false;
        }
        for (j = 0, len = wl.length; j < len; j++) {
            w = wl[j];
            if (w.isFullScreen()) {
                w.setFullScreen(false);
            }
        }
        bounds = wl[0].getBounds();
        if (wl.length === 1 && bounds.width === this.screenSize().width) {
            return false;
        }
        for (wi = k = 1, ref1 = wl.length; 1 <= ref1 ? k < ref1 : k > ref1; wi = 1 <= ref1 ? ++k : --k) {
            if (!_.isEqual(wl[wi].getBounds(), bounds)) {
                return false;
            }
        }
        return true;
    };

    Main.prototype.arrangeWindows = function() {
        var frameSize, height, i, j, k, l, ref1, ref2, ref3, ref4, ref5, rh, w, w2, width, wl;
        disableSnap = true;
        frameSize = 6;
        wl = visibleWins();
        ref1 = this.screenSize(), width = ref1.width, height = ref1.height;
        if (!this.windowsAreStacked()) {
            this.stackWindows();
            disableSnap = false;
            return;
        }
        if (wl.length === 1) {
            wl[0].showInactive();
            wl[0].setBounds({
                x: 0,
                y: 0,
                width: width,
                height: height
            });
        } else if (wl.length === 2 || wl.length === 3) {
            w = width / wl.length;
            for (i = j = 0, ref2 = wl.length; 0 <= ref2 ? j < ref2 : j > ref2; i = 0 <= ref2 ? ++j : --j) {
                wl[i].showInactive();
                wl[i].setBounds({
                    x: parseInt(i * w - (i > 0 && frameSize / 2 || 0)),
                    width: parseInt(w + ((i === 0 || i === wl.length - 1) && frameSize / 2 || frameSize)),
                    y: parseInt(0),
                    height: parseInt(height)
                });
            }
        } else if (wl.length) {
            w2 = parseInt(wl.length / 2);
            rh = height;
            for (i = k = 0, ref3 = w2; 0 <= ref3 ? k < ref3 : k > ref3; i = 0 <= ref3 ? ++k : --k) {
                w = width / w2;
                wl[i].showInactive();
                wl[i].setBounds({
                    x: parseInt(i * w - (i > 0 && frameSize / 2 || 0)),
                    width: parseInt(w + ((i === 0 || i === w2 - 1) && frameSize / 2 || frameSize)),
                    y: parseInt(0),
                    height: parseInt(rh / 2)
                });
            }
            for (i = l = ref4 = w2, ref5 = wl.length; ref4 <= ref5 ? l < ref5 : l > ref5; i = ref4 <= ref5 ? ++l : --l) {
                w = width / (wl.length - w2);
                wl[i].showInactive();
                wl[i].setBounds({
                    x: parseInt((i - w2) * w - (i - w2 > 0 && frameSize / 2 || 0)),
                    y: parseInt(rh / 2 + 23),
                    width: parseInt(w + ((i - w2 === 0 || i === wl.length - 1) && frameSize / 2 || frameSize)),
                    height: parseInt(rh / 2)
                });
            }
        }
        disableSnap = false;
        throw new Error('test');
    };

    Main.prototype.moveWindowStashes = function() {
        var stashDir;
        stashDir = slash.join(this.userData, 'win');
        if (slash.dirExists(stashDir)) {
            return fs.moveSync(stashDir, slash.join(this.userData, 'old'), {
                overwrite: true
            });
        }
    };

    Main.prototype.restoreWindows = function() {
        var file, j, len, newStash, ref1, results;
        fs.ensureDirSync(this.userData);
        ref1 = filelist(slash.join(this.userData, 'old'), {
            matchExt: 'noon'
        });
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            file = ref1[j];
            win = this.createWindow();
            newStash = slash.join(this.userData, 'win', win.id + ".noon");
            results.push(fs.copySync(file, newStash));
        }
        return results;
    };

    Main.prototype.toggleWindowFromTray = function() {
        var j, len, ref1, results;
        if (valid(wins())) {
            ref1 = wins();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                win = ref1[j];
                results.push(win.show());
            }
            return results;
        } else {
            this.moveWindowStashes();
            return this.restoreWindows();
        }
    };

    Main.prototype.onResizeWin = function(event) {
        var b, frameSize, j, len, ref1, results, w, wb;
        if (disableSnap) {
            return;
        }
        frameSize = 6;
        wb = event.sender.getBounds();
        klog('ko.main.onResizeWin');
        ref1 = wins();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            w = ref1[j];
            if (w === event.sender) {
                continue;
            }
            b = w.getBounds();
            if (b.height === wb.height && b.y === wb.y) {
                if (b.x < wb.x) {
                    if (Math.abs(b.x + b.width - wb.x) < WIN_SNAP_DIST) {
                        w.showInactive();
                        results.push(w.setBounds({
                            x: b.x,
                            y: b.y,
                            width: wb.x - b.x + frameSize,
                            height: b.height
                        }));
                    } else {
                        results.push(void 0);
                    }
                } else if (b.x + b.width > wb.x + wb.width) {
                    if (Math.abs(wb.x + wb.width - b.x) < WIN_SNAP_DIST) {
                        w.showInactive();
                        results.push(w.setBounds({
                            x: wb.x + wb.width - frameSize,
                            y: b.y,
                            width: b.x + b.width - (wb.x + wb.width - frameSize),
                            height: b.height
                        }));
                    } else {
                        results.push(void 0);
                    }
                } else {
                    results.push(void 0);
                }
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Main.prototype.activateOneWindow = function(cb) {
        var wxw;
        if (empty(visibleWins())) {
            this.toggleWindows(cb);
            return;
        }
        if (!activeWin()) {
            if (win = visibleWins()[0]) {
                if (slash.win()) {
                    wxw = require('wxw');
                    wxw('raise', slash.resolve(process.argv[0]));
                }
                win.focus();
                return cb(win);
            } else {
                return cb(null);
            }
        } else {
            if (slash.win()) {
                wxw = require('wxw');
                wxw('raise', slash.resolve(process.argv[0]));
            }
            return cb(visibleWins()[0]);
        }
    };

    Main.prototype.onOtherInstance = function(args, dir) {
        return this.activateOneWindow(function(win) {
            var arg, file, fileargs, files, fpath, j, len, pos, ref1, ref2;
            files = [];
            if ((ref1 = first(args)) != null ? ref1.endsWith(pkg.name + ".exe") : void 0) {
                fileargs = args.slice(1);
            } else {
                fileargs = args.slice(2);
            }
            for (j = 0, len = fileargs.length; j < len; j++) {
                arg = fileargs[j];
                if (arg.startsWith('-')) {
                    continue;
                }
                file = arg;
                if (slash.isRelative(file)) {
                    file = slash.join(slash.resolve(dir), arg);
                }
                ref2 = slash.splitFilePos(file), fpath = ref2[0], pos = ref2[1];
                if (slash.exists(fpath)) {
                    files.push(file);
                }
            }
            post.toWin(win.id, 'openFiles', files, {
                newTab: true
            });
            win.show();
            return win.focus();
        });
    };

    Main.prototype.reloadWin = function(arg1) {
        var file, ref1, ref2, winID;
        winID = (ref1 = arg1.winID) != null ? ref1 : null, file = (ref2 = arg1.file) != null ? ref2 : null;
        if (win = winWithID(winID)) {
            win.webContents.reloadIgnoringCache();
            return post.toWin(win.id, 'openFiles', file);
        }
    };

    Main.prototype.quit = function() {
        var toSave;
        toSave = wins().length;
        klog('ko.quit', toSave);
        if (toSave) {
            post.on('stashSaved', (function(_this) {
                return function() {
                    toSave -= 1;
                    klog('ko.quit stashSaved', toSave);
                    if (toSave === 0) {
                        global.state.save();
                        return _this.exitApp();
                    }
                };
            })(this));
            post.toWins('saveStash');
            return 'delay';
        } else {
            return global.state.save();
        }
    };

    return Main;

})(app);

electron.app.on('open-file', function(event, file) {
    if (main == null) {
        openFiles.push(file);
    } else {
        if (electron.app.isReady()) {
            main.activateOneWindow(function(win) {
                return post.toWin(win.id, 'openFiles', [file]);
            });
        } else {
            main.createWindowWithFile({
                file: file
            });
        }
    }
    return event.preventDefault();
});

main = new Main(openFiles);

main.navigate = new Navigate(main);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseVFBQUE7SUFBQTs7OztBQVFBLE1BQThHLE9BQUEsQ0FBUSxLQUFSLENBQTlHLEVBQUUsU0FBRixFQUFLLGFBQUwsRUFBVSxlQUFWLEVBQWdCLGlCQUFoQixFQUF1Qix1QkFBdkIsRUFBaUMsaUJBQWpDLEVBQXdDLFdBQXhDLEVBQTRDLGVBQTVDLEVBQWtELGlCQUFsRCxFQUF5RCxlQUF6RCxFQUErRCxlQUEvRCxFQUFxRSxpQkFBckUsRUFBNEUsaUJBQTVFLEVBQW1GLGlCQUFuRixFQUEwRixhQUExRixFQUErRixpQkFBL0YsRUFBc0c7O0FBS3RHLEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVgsYUFBQSxHQUFnQixRQUFRLENBQUM7O0FBRXpCLFdBQUEsR0FBZ0I7O0FBQ2hCLElBQUEsR0FBZ0I7O0FBQ2hCLFNBQUEsR0FBZ0I7O0FBQ2hCLGFBQUEsR0FBZ0I7O0FBSWhCLGNBQUEsR0FBaUIsU0FBQTtXQUFHLEtBQUEsQ0FBTSxLQUFLLENBQUMsR0FBTixDQUFVLGFBQVYsQ0FBTjtBQUFIOztBQVFqQixJQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxhQUFkLENBQUEsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFDLENBQUQsRUFBRyxDQUFIO2VBQVMsQ0FBQyxDQUFDLEVBQUYsR0FBTyxDQUFDLENBQUM7SUFBbEIsQ0FBbkM7QUFBSDs7QUFDZCxTQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxnQkFBZCxDQUFBO0FBQUg7O0FBQ2QsV0FBQSxHQUFjLFNBQUE7QUFBRyxR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MDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgYXBwLCBhcmdzLCBlbXB0eSwgZmlsZWxpc3QsIGZpcnN0LCBmcywga2xvZywga29sb3IsIG5vb24sIHBvc3QsIHByZWZzLCBzbGFzaCwgc3RvcmUsIHVkcCwgdmFsaWQsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jIHBvc3QuZGVidWcoKVxuIyBsb2cuc2xvZy5kZWJ1ZyA9IHRydWVcblxucGtnICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5OYXZpZ2F0ZSA9IHJlcXVpcmUgJy4vbmF2aWdhdGUnXG5JbmRleGVyICA9IHJlcXVpcmUgJy4vaW5kZXhlcidcblxuQnJvd3NlcldpbmRvdyA9IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3dcblxuZGlzYWJsZVNuYXAgICA9IGZhbHNlXG5tYWluICAgICAgICAgID0gdW5kZWZpbmVkXG5vcGVuRmlsZXMgICAgID0gW11cbldJTl9TTkFQX0RJU1QgPSAxNTBcblxuIyBwcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJyAjID8/P1xuICAgIFxubW9zdFJlY2VudEZpbGUgPSAtPiBmaXJzdCBzdGF0ZS5nZXQgJ3JlY2VudEZpbGVzJ1xuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2lucyAgICAgICAgPSAtPiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5zb3J0IChhLGIpIC0+IGEuaWQgLSBiLmlkXG5hY3RpdmVXaW4gICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG52aXNpYmxlV2lucyA9IC0+ICh3IGZvciB3IGluIHdpbnMoKSB3aGVuIHc/LmlzVmlzaWJsZSgpIGFuZCBub3Qgdz8uaXNNaW5pbWl6ZWQoKSlcblxud2luV2l0aElEICAgPSAod2luSUQpIC0+XG5cbiAgICB3aWQgPSBwYXJzZUludCB3aW5JRFxuICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICByZXR1cm4gdyBpZiB3LmlkID09IHdpZFxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub25HZXQgJ2RlYnVnTW9kZScgLT4gYXJncy5kZWJ1Z1xucG9zdC5vbkdldCAnd2luSW5mb3MnICAtPiAoaWQ6IHcuaWQgZm9yIHcgaW4gd2lucygpKVxucG9zdC5vbkdldCAnbG9nU3luYycgICAtPlxuICAgIGNvbnNvbGUubG9nLmFwcGx5IGNvbnNvbGUsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuICAgIHJldHVybiB0cnVlXG5cbnBvc3Qub24gJ3Rocm93RXJyb3InICAgICAgICAgICAgICAgICAtPiB0aHJvdyBuZXcgRXJyb3IgJ2VycidcbnBvc3Qub24gJ25ld1dpbmRvd1dpdGhGaWxlJyAgKGZpbGUpICAtPiBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxucG9zdC5vbiAnYWN0aXZhdGVXaW5kb3cnICAgICAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVXaW5kb3dXaXRoSUQgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlTmV4dFdpbmRvdycgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlTmV4dFdpbmRvdyB3aW5JRFxucG9zdC5vbiAnYWN0aXZhdGVQcmV2V2luZG93JyAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVQcmV2V2luZG93IHdpbklEXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nICAgKGFjdGlvbiwgYXJnKSAtPiBtYWluPy5vbk1lbnVBY3Rpb24gYWN0aW9uLCBhcmdcbnBvc3Qub24gJ3BpbmcnICh3aW5JRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3aW5JRCwgJ3BvbmcnICdtYWluJyBhcmdBLCBhcmdCXG5wb3N0Lm9uICd3aW5sb2cnICAgICAgICh3aW5JRCwgdGV4dCkgLT4gXG4gICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgIGxvZyBcIiN7d2luSUR9Pj4gXCIgKyB0ZXh0XG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG5jbGFzcyBNYWluIGV4dGVuZHMgYXBwXG5cbiAgICBAOiAob3BlbkZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIHBrZzogICAgICAgIHBrZ1xuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBkaXJzOiAgICAgICBbJy4uLycgXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2Jyb3dzZXInICcuLi9jb21tYW5kbGluZScgJy4uL2NvbW1hbmRzJyAnLi4vZWRpdG9yJyAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2dpdCcgJy4uL21haW4nICcuLi90b29scycgJy4uL3dpbiddXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQ21kT3JDdHJsK0YxJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJy4uL2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uLy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZVxuICAgICAgICAgICAgc2F2ZUJvdW5kczogZmFsc2VcbiAgICAgICAgICAgIG9uU2hvdzogICAgIC0+IG1haW4ub25TaG93KClcbiAgICAgICAgICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgLT4gbWFpbi5vbk90aGVySW5zdGFuY2UgYXJncywgZGlyXG4gICAgICAgICAgICB3aWR0aDogICAgICAxMDAwXG4gICAgICAgICAgICBoZWlnaHQ6ICAgICAxMDAwXG4gICAgICAgICAgICBtaW5XaWR0aDogICAyNDBcbiAgICAgICAgICAgIG1pbkhlaWdodDogIDIzMFxuICAgICAgICAgICAgYXJnczogXCJcIlwiXG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgIGZpbGVzIHRvIG9wZW4gICAgICAgICAgICoqXG4gICAgICAgICAgICAgICAgcHJlZnMgICAgIHNob3cgcHJlZmVyZW5jZXMgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9wcmVmcyAgIGRvbid0IGxvYWQgcHJlZmVyZW5jZXMgIGZhbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUgICAgIHNob3cgc3RhdGUgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9zdGF0ZSAgIGRvbid0IGxvYWQgc3RhdGUgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgdmVyYm9zZSAgIGxvZyBtb3JlICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wdC5vblF1aXQgPSBAcXVpdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBwcm9jZXNzLmN3ZCgpID09ICcvJ1xuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgXG4gICAgICAgIHdoaWxlIHZhbGlkKGFyZ3MuZmlsZWxpc3QpIGFuZCBzbGFzaC5kaXJFeGlzdHMgZmlyc3QgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBhcmdzLmZpbGVsaXN0LnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICAgICAgbG9nIGtvbG9yLndoaXRlIGtvbG9yLmJvbGQgXCJcXG5rb1wiLCBrb2xvci5ncmF5IFwidiN7cGtnLnZlcnNpb259XFxuXCJcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSB7Y3dkOiBwcm9jZXNzLmN3ZCgpfSwgY29sb3JzOnRydWVcbiAgICAgICAgICAgIGxvZyBrb2xvci55ZWxsb3cga29sb3IuYm9sZCAnXFxuYXJncydcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBhcmdzLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nICcnXG5cbiAgICAgICAgZ2xvYmFsLnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOiAnfCdcblxuICAgICAgICBhbGlhcyA9IG5ldyBzdG9yZSAnYWxpYXMnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGFyZ3Muc3RhdGVcbiAgICAgICAgICAgIGxvZyBrb2xvci55ZWxsb3cga29sb3IuYm9sZCAnc3RhdGUnXG4gICAgICAgICAgICBsb2cga29sb3IuZ3JlZW4ga29sb3IuYm9sZCAnc3RhdGUgZmlsZTonIGdsb2JhbC5zdGF0ZS5maWxlXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgZ2xvYmFsLnN0YXRlLmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgQGluZGV4ZXIgPSBuZXcgSW5kZXhlclxuXG4gICAgICAgIGlmIG5vdCBvcGVuRmlsZXMubGVuZ3RoIGFuZCB2YWxpZCBhcmdzLmZpbGVsaXN0XG4gICAgICAgICAgICBvcGVuRmlsZXMgPSBmaWxlbGlzdCBhcmdzLmZpbGVsaXN0LCBpZ25vcmVIaWRkZW46ZmFsc2VcblxuICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAncmVsb2FkV2luJyBAcmVsb2FkV2luXG4gICAgICAgIFxuICAgICAgICBAb3BlbkZpbGVzID0gb3BlbkZpbGVzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAgXG4gICAgb25TaG93OiA9PlxuXG4gICAgICAgIHsgd2lkdGgsIGhlaWdodCB9ID0gQHNjcmVlblNpemUoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAb3B0LndpZHRoICA9IGhlaWdodCArIDEyMlxuICAgICAgICBAb3B0LmhlaWdodCA9IGhlaWdodFxuICAgICAgXG4gICAgICAgIGlmIGFyZ3MucHJlZnNcbiAgICAgICAgICAgIGxvZyBrb2xvci55ZWxsb3cga29sb3IuYm9sZCAncHJlZnMnXG4gICAgICAgICAgICBsb2cga29sb3IuZ3JlZW4ga29sb3IuYm9sZCBwcmVmcy5zdG9yZT8uZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHByZWZzLnN0b3JlPy5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQG9wZW5GaWxlc1xuICAgICAgICAgICAgZm9yIGZpbGUgaW4gQG9wZW5GaWxlc1xuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAb3BlbkZpbGVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpIGlmIG5vdCBhcmdzLm5vc3RhdGVcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCB3aW5zKCkubGVuZ3RoXG4gICAgICAgICAgICBpZiByZWNlbnQgPSBtb3N0UmVjZW50RmlsZSgpXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6cmVjZW50IFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRW1wdHkoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBuZXcgdWRwIHBvcnQ6OTc3OSwgb25Nc2c6QG9uVURQXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgICAgICAgIFxuICAgIFxuICAgIG9uVURQOiAoZmlsZSkgPT5cbiAgICAgICAgQGFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW2ZpbGVdIFxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25NZW51QWN0aW9uX09MRDogKGFjdGlvbiwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgIHRoZW4gQGFjdGl2YXRlTmV4dFdpbmRvdyBhcmdcbiAgICAgICAgICAgIHdoZW4gJ0FycmFuZ2UgV2luZG93cycgIHRoZW4gQGFycmFuZ2VXaW5kb3dzKClcbiAgICAgICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgIHRoZW4gQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwXG5cbiAgICB3aW5zOiAgICAgICAgd2lucygpXG4gICAgd2luV2l0aElEOiAgIHdpbldpdGhJRFxuICAgIGFjdGl2ZVdpbjogICBhY3RpdmVXaW5cbiAgICB2aXNpYmxlV2luczogdmlzaWJsZVdpbnNcblxuICAgIGNyZWF0ZVdpbmRvd1dpdGhGaWxlOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbb3B0LmZpbGVdXG4gICAgICAgIHdpblxuXG4gICAgY3JlYXRlV2luZG93V2l0aEVtcHR5OiAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnbmV3RW1wdHlUYWInXG4gICAgICAgIHdpblxuICAgICAgICBcbiAgICB0b2dnbGVXaW5kb3dzOiAoY2IpID0+XG5cbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgICAgICAgICBAaGlkZVdpbmRvd3MoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHJhaXNlV2luZG93cygpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHNob3dXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNiIGZpcnN0IHZpc2libGVXaW5zKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNyZWF0ZVdpbmRvdyBjYlxuXG4gICAgaGlkZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LmhpZGUoKVxuICAgICAgICAgICAgQGhpZGVEb2NrKClcbiAgICAgICAgQFxuXG4gICAgc2hvd1dpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LnNob3coKVxuICAgICAgICAgICAgQHNob3dEb2NrKClcbiAgICAgICAgQFxuXG4gICAgcmFpc2VXaW5kb3dzOiAtPlxuXG4gICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIGZvciB3IGluIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLmZvY3VzKClcbiAgICAgICAgQFxuXG4gICAgYWN0aXZhdGVOZXh0V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IDEgKyBhbGxXaW5kb3dzLmluZGV4T2Ygd1xuICAgICAgICAgICAgICAgIGkgPSAwIGlmIGkgPj0gYWxsV2luZG93cy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlUHJldldpbmRvdzogKHdpbikgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyIHdpbiB0aGVuIHdpbiA9IHdpbldpdGhJRCB3aW5cbiAgICAgICAgYWxsV2luZG93cyA9IHdpbnMoKVxuICAgICAgICBmb3IgdyBpbiBhbGxXaW5kb3dzXG4gICAgICAgICAgICBpZiB3ID09IHdpblxuICAgICAgICAgICAgICAgIGkgPSAtMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IGFsbFdpbmRvd3MubGVuZ3RoLTEgaWYgaSA8IDBcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlV2luZG93V2l0aElEOiAod2lkKSAtPlxuXG4gICAgICAgIHcgPSB3aW5XaXRoSUQgd2lkXG4gICAgICAgIHJldHVybiBpZiBub3Qgdz9cbiAgICAgICAgaWYgbm90IHcuaXNWaXNpYmxlKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHcuZm9jdXMoKVxuICAgICAgICB3XG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgc3RhY2tXaW5kb3dzOiAtPlxuICAgICAgICBcbiAgICAgICAge3dpZHRoLCBoZWlnaHR9ID0gQHNjcmVlblNpemUoKVxuICAgICAgICB3dyA9IGhlaWdodCArIDEyMlxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCAod2lkdGgtd3cpLzJcbiAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHd3XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgYWN0aXZlV2luKCkuc2hvdygpXG5cbiAgICB3aW5kb3dzQXJlU3RhY2tlZDogLT5cbiAgICAgICAgXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgZW1wdHkgd2xcbiAgICAgICAgXG4gICAgICAgIGZvciB3IGluIHdsXG4gICAgICAgICAgICBpZiB3LmlzRnVsbFNjcmVlbigpXG4gICAgICAgICAgICAgICAgdy5zZXRGdWxsU2NyZWVuIGZhbHNlIFxuICAgICAgICBcbiAgICAgICAgYm91bmRzID0gd2xbMF0uZ2V0Qm91bmRzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHdsLmxlbmd0aCA9PSAxIGFuZCBib3VuZHMud2lkdGggPT0gQHNjcmVlblNpemUoKS53aWR0aFxuICAgICAgICBcbiAgICAgICAgZm9yIHdpIGluIFsxLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbCB3bFt3aV0uZ2V0Qm91bmRzKCksIGJvdW5kc1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGFycmFuZ2VXaW5kb3dzOiA9PlxuXG4gICAgICAgIGRpc2FibGVTbmFwID0gdHJ1ZVxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcblxuICAgICAgICBpZiBub3QgQHdpbmRvd3NBcmVTdGFja2VkKClcbiAgICAgICAgICAgIEBzdGFja1dpbmRvd3MoKVxuICAgICAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgd2wubGVuZ3RoID09IDFcbiAgICAgICAgICAgIHdsWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB3bFswXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIDBcbiAgICAgICAgICAgICAgICB5OiAgICAgIDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHdpZHRoXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGggPT0gMiBvciB3bC5sZW5ndGggPT0gM1xuICAgICAgICAgICAgdyA9IHdpZHRoL3dsLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCBpICogdyAtIChpID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpID09IDAgb3IgaSA9PSB3bC5sZW5ndGgtMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgaGVpZ2h0XG4gICAgICAgIGVsc2UgaWYgd2wubGVuZ3RoXG4gICAgICAgICAgICB3MiA9IHBhcnNlSW50IHdsLmxlbmd0aC8yXG4gICAgICAgICAgICByaCA9IGhlaWdodFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53Ml1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvdzJcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHcyLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgICAgIGZvciBpIGluIFt3Mi4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvKHdsLmxlbmd0aC13MilcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IChpLXcyKSAqIHcgLSAoaS13MiA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgcmgvMisyM1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGktdzIgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICd0ZXN0J1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG1vdmVXaW5kb3dTdGFzaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgc3Rhc2hEaXIgPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbidcbiAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHN0YXNoRGlyXG4gICAgICAgICAgICBmcy5tb3ZlU3luYyBzdGFzaERpciwgc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgb3ZlcndyaXRlOiB0cnVlXG5cbiAgICByZXN0b3JlV2luZG93czogLT5cblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jIEB1c2VyRGF0YVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBtYXRjaEV4dDonbm9vbicpXG4gICAgICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIG5ld1N0YXNoID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nIFwiI3t3aW4uaWR9Lm5vb25cIlxuICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcblxuICAgIHRvZ2dsZVdpbmRvd0Zyb21UcmF5OiA9PiBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIGZvciB3aW4gaW4gd2lucygpXG4gICAgICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uUmVzaXplV2luOiAoZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGRpc2FibGVTbmFwXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2IgPSBldmVudC5zZW5kZXIuZ2V0Qm91bmRzKClcbiAgICAgICAgXG4gICAgICAgIGtsb2cgJ2tvLm1haW4ub25SZXNpemVXaW4nXG4gICAgICAgIFxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHcgPT0gZXZlbnQuc2VuZGVyXG4gICAgICAgICAgICBiID0gdy5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgaWYgYi5oZWlnaHQgPT0gd2IuaGVpZ2h0IGFuZCBiLnkgPT0gd2IueVxuICAgICAgICAgICAgICAgIGlmIGIueCA8IHdiLnhcbiAgICAgICAgICAgICAgICAgICAgaWYgTWF0aC5hYnMoYi54K2Iud2lkdGgtd2IueCkgPCBXSU5fU05BUF9ESVNUXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICAgICAgYi54XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogICAgICBiLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHdiLnggLSBiLnggKyBmcmFtZVNpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBiLngrYi53aWR0aCA+IHdiLngrd2Iud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgaWYgTWF0aC5hYnMod2IueCt3Yi53aWR0aC1iLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHdiLngrd2Iud2lkdGgtZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogICAgICBiLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogIGIueCtiLndpZHRoIC0gKHdiLngrd2Iud2lkdGgtZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYi5oZWlnaHRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG5cbiAgICBhY3RpdmF0ZU9uZVdpbmRvdzogKGNiKSAtPlxuICAgIFxuICAgICAgICBpZiBlbXB0eSB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICBAdG9nZ2xlV2luZG93cyBjYlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgbm90IGFjdGl2ZVdpbigpXG4gICAgICAgICAgICBpZiB3aW4gPSB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgIFxuICAgICAgICAgICAgICAgICAgICB3eHcgJ3JhaXNlJyBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgY2Igd2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dycgICBcbiAgICAgICAgICAgICAgICB3eHcgJ3JhaXNlJyBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgY2IgdmlzaWJsZVdpbnMoKVswXVxuICAgICAgICAgICAgXG4gICAgb25PdGhlckluc3RhbmNlOiAoYXJncywgZGlyKSA9PlxuXG4gICAgICAgICMgbG9nICdvbk90aGVySW5zdGFuY2UgZGlyOicgIGRpclxuICAgICAgICAjIGxvZyAnb25PdGhlckluc3RhbmNlIGFyZ3M6JyBhcmdzXG4gICAgICAgIFxuICAgICAgICBAYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cblxuICAgICAgICAgICAgZmlsZXMgPSBbXVxuICAgICAgICAgICAgaWYgZmlyc3QoYXJncyk/LmVuZHNXaXRoIFwiI3twa2cubmFtZX0uZXhlXCJcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZpbGVhcmdzID0gYXJncy5zbGljZSAyXG4gICAgXG4gICAgICAgICAgICBmb3IgYXJnIGluIGZpbGVhcmdzXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgYXJnLnN0YXJ0c1dpdGggJy0nXG4gICAgICAgICAgICAgICAgZmlsZSA9IGFyZ1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guam9pbiBzbGFzaC5yZXNvbHZlKGRpciksIGFyZ1xuICAgICAgICAgICAgICAgIFtmcGF0aCwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBmaWxlXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guZXhpc3RzIGZwYXRoXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2ggZmlsZVxuICAgIFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIGZpbGVzLCBuZXdUYWI6dHJ1ZVxuICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICAgICAgd2luLmZvY3VzKClcbiAgICAgICAgICAgIFxuICAgIHJlbG9hZFdpbjogKHdpbklEOiwgZmlsZTopID0+XG4gICAgICAgIFxuICAgICAgICBpZiB3aW4gPSB3aW5XaXRoSUQgd2luSURcbiAgICAgICAgICAgIHdpbi53ZWJDb250ZW50cy5yZWxvYWRJZ25vcmluZ0NhY2hlKClcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMCAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBxdWl0OiA9PlxuXG4gICAgICAgIHRvU2F2ZSA9IHdpbnMoKS5sZW5ndGhcbiAgICAgICAga2xvZyAna28ucXVpdCcgdG9TYXZlXG4gICAgICAgIGlmIHRvU2F2ZVxuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcgPT5cbiAgICAgICAgICAgICAgICB0b1NhdmUgLT0gMVxuICAgICAgICAgICAgICAgIGtsb2cgJ2tvLnF1aXQgc3Rhc2hTYXZlZCcgdG9TYXZlIFxuICAgICAgICAgICAgICAgIGlmIHRvU2F2ZSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5zdGF0ZS5zYXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGV4aXRBcHAoKVxuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3NhdmVTdGFzaCdcbiAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5lbGVjdHJvbi5hcHAub24gJ29wZW4tZmlsZScgKGV2ZW50LCBmaWxlKSAtPlxuXG4gICAgaWYgbm90IG1haW4/XG4gICAgICAgIG9wZW5GaWxlcy5wdXNoIGZpbGVcbiAgICBlbHNlXG4gICAgICAgIGlmIGVsZWN0cm9uLmFwcC5pc1JlYWR5KClcbiAgICAgICAgICAgIG1haW4uYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cbiAgICAgICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW2ZpbGVdIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxuICAgICAgICBcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbm1haW4gICAgICAgICAgPSBuZXcgTWFpbiBvcGVuRmlsZXNcbm1haW4ubmF2aWdhdGUgPSBuZXcgTmF2aWdhdGUgbWFpblxuIl19
//# sourceURL=../../coffee/main/main.coffee
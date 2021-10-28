// koffee 1.14.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Indexer, Main, Navigate, WIN_SNAP_DIST, _, activeWin, app, args, disableSnap, electron, empty, filelist, first, fs, klog, koReceiver, kolor, main, mostRecentFile, noon, onUDP, openFiles, pkg, post, prefs, ref, slash, store, udp, valid, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

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
                return this.createWindowWithFile({
                    file: recent
                });
            } else {
                return this.createWindowWithEmpty();
            }
        }
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
        console.log('onOtherInstance dir:', dir);
        console.log('onOtherInstance args:', args);
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
            console.log('onOtherInstance files', files);
            return post.toWin(win.id, 'openFiles', files, {
                newTab: true
            });
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

onUDP = function(file) {
    return main.activateOneWindow(function(win) {
        return post.toWin(win.id, 'openFiles', [file]);
    });
};

koReceiver = new udp({
    port: 9779,
    onMsg: onUDP
});

main = new Main(openFiles);

main.navigate = new Navigate(main);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNFJBQUE7SUFBQTs7OztBQVFBLE1BQThHLE9BQUEsQ0FBUSxLQUFSLENBQTlHLEVBQUUsU0FBRixFQUFLLGFBQUwsRUFBVSxlQUFWLEVBQWdCLGlCQUFoQixFQUF1Qix1QkFBdkIsRUFBaUMsaUJBQWpDLEVBQXdDLFdBQXhDLEVBQTRDLGVBQTVDLEVBQWtELGlCQUFsRCxFQUF5RCxlQUF6RCxFQUErRCxlQUEvRCxFQUFxRSxpQkFBckUsRUFBNEUsaUJBQTVFLEVBQW1GLGlCQUFuRixFQUEwRixhQUExRixFQUErRixpQkFBL0YsRUFBc0c7O0FBS3RHLEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVgsYUFBQSxHQUFnQixRQUFRLENBQUM7O0FBRXpCLFdBQUEsR0FBZ0I7O0FBQ2hCLElBQUEsR0FBZ0I7O0FBQ2hCLFNBQUEsR0FBZ0I7O0FBQ2hCLGFBQUEsR0FBZ0I7O0FBSWhCLGNBQUEsR0FBaUIsU0FBQTtXQUFHLEtBQUEsQ0FBTSxLQUFLLENBQUMsR0FBTixDQUFVLGFBQVYsQ0FBTjtBQUFIOztBQVFqQixJQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxhQUFkLENBQUEsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFDLENBQUQsRUFBRyxDQUFIO2VBQVMsQ0FBQyxDQUFDLEVBQUYsR0FBTyxDQUFDLENBQUM7SUFBbEIsQ0FBbkM7QUFBSDs7QUFDZCxTQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxnQkFBZCxDQUFBO0FBQUg7O0FBQ2QsV0FBQSxHQUFjLFNBQUE7QUFBRyxR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LENBQUMsUUFBTCxHQUFnQixJQUFJLFFBQUosQ0FBYSxJQUFiIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgYXBwLCBhcmdzLCBlbXB0eSwgZmlsZWxpc3QsIGZpcnN0LCBmcywga2xvZywga29sb3IsIG5vb24sIHBvc3QsIHByZWZzLCBzbGFzaCwgc3RvcmUsIHVkcCwgdmFsaWQsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jIHBvc3QuZGVidWcoKVxuIyBsb2cuc2xvZy5kZWJ1ZyA9IHRydWVcblxucGtnICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5OYXZpZ2F0ZSA9IHJlcXVpcmUgJy4vbmF2aWdhdGUnXG5JbmRleGVyICA9IHJlcXVpcmUgJy4vaW5kZXhlcidcblxuQnJvd3NlcldpbmRvdyA9IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3dcblxuZGlzYWJsZVNuYXAgICA9IGZhbHNlXG5tYWluICAgICAgICAgID0gdW5kZWZpbmVkXG5vcGVuRmlsZXMgICAgID0gW11cbldJTl9TTkFQX0RJU1QgPSAxNTBcblxuIyBwcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJyAjID8/P1xuICAgIFxubW9zdFJlY2VudEZpbGUgPSAtPiBmaXJzdCBzdGF0ZS5nZXQgJ3JlY2VudEZpbGVzJ1xuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2lucyAgICAgICAgPSAtPiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5zb3J0IChhLGIpIC0+IGEuaWQgLSBiLmlkXG5hY3RpdmVXaW4gICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG52aXNpYmxlV2lucyA9IC0+ICh3IGZvciB3IGluIHdpbnMoKSB3aGVuIHc/LmlzVmlzaWJsZSgpIGFuZCBub3Qgdz8uaXNNaW5pbWl6ZWQoKSlcblxud2luV2l0aElEICAgPSAod2luSUQpIC0+XG5cbiAgICB3aWQgPSBwYXJzZUludCB3aW5JRFxuICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICByZXR1cm4gdyBpZiB3LmlkID09IHdpZFxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub25HZXQgJ2RlYnVnTW9kZScgLT4gYXJncy5kZWJ1Z1xucG9zdC5vbkdldCAnd2luSW5mb3MnICAtPiAoaWQ6IHcuaWQgZm9yIHcgaW4gd2lucygpKVxucG9zdC5vbkdldCAnbG9nU3luYycgICAtPlxuICAgIGNvbnNvbGUubG9nLmFwcGx5IGNvbnNvbGUsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuICAgIHJldHVybiB0cnVlXG5cbnBvc3Qub24gJ3Rocm93RXJyb3InICAgICAgICAgICAgICAgICAtPiB0aHJvdyBuZXcgRXJyb3IgJ2VycidcbnBvc3Qub24gJ25ld1dpbmRvd1dpdGhGaWxlJyAgKGZpbGUpICAtPiBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxucG9zdC5vbiAnYWN0aXZhdGVXaW5kb3cnICAgICAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVXaW5kb3dXaXRoSUQgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlTmV4dFdpbmRvdycgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlTmV4dFdpbmRvdyB3aW5JRFxucG9zdC5vbiAnYWN0aXZhdGVQcmV2V2luZG93JyAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVQcmV2V2luZG93IHdpbklEXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nICAgKGFjdGlvbiwgYXJnKSAtPiBtYWluPy5vbk1lbnVBY3Rpb24gYWN0aW9uLCBhcmdcbnBvc3Qub24gJ3BpbmcnICh3aW5JRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3aW5JRCwgJ3BvbmcnICdtYWluJyBhcmdBLCBhcmdCXG5wb3N0Lm9uICd3aW5sb2cnICAgICAgICh3aW5JRCwgdGV4dCkgLT4gXG4gICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgIGxvZyBcIiN7d2luSUR9Pj4gXCIgKyB0ZXh0XG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG5jbGFzcyBNYWluIGV4dGVuZHMgYXBwXG5cbiAgICBAOiAob3BlbkZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIHBrZzogICAgICAgIHBrZ1xuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBkaXJzOiAgICAgICBbJy4uLycgXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2Jyb3dzZXInICcuLi9jb21tYW5kbGluZScgJy4uL2NvbW1hbmRzJyAnLi4vZWRpdG9yJyAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2dpdCcgJy4uL21haW4nICcuLi90b29scycgJy4uL3dpbiddXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQ21kT3JDdHJsK0YxJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJy4uL2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uLy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZVxuICAgICAgICAgICAgc2F2ZUJvdW5kczogZmFsc2VcbiAgICAgICAgICAgIG9uU2hvdzogICAgIC0+IG1haW4ub25TaG93KClcbiAgICAgICAgICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgLT4gbWFpbi5vbk90aGVySW5zdGFuY2UgYXJncywgZGlyXG4gICAgICAgICAgICB3aWR0aDogICAgICAxMDAwXG4gICAgICAgICAgICBoZWlnaHQ6ICAgICAxMDAwXG4gICAgICAgICAgICBtaW5XaWR0aDogICAyNDBcbiAgICAgICAgICAgIG1pbkhlaWdodDogIDIzMFxuICAgICAgICAgICAgYXJnczogXCJcIlwiXG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgIGZpbGVzIHRvIG9wZW4gICAgICAgICAgICoqXG4gICAgICAgICAgICAgICAgcHJlZnMgICAgIHNob3cgcHJlZmVyZW5jZXMgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9wcmVmcyAgIGRvbid0IGxvYWQgcHJlZmVyZW5jZXMgIGZhbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUgICAgIHNob3cgc3RhdGUgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9zdGF0ZSAgIGRvbid0IGxvYWQgc3RhdGUgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgdmVyYm9zZSAgIGxvZyBtb3JlICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wdC5vblF1aXQgPSBAcXVpdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBwcm9jZXNzLmN3ZCgpID09ICcvJ1xuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgXG4gICAgICAgIHdoaWxlIHZhbGlkKGFyZ3MuZmlsZWxpc3QpIGFuZCBzbGFzaC5kaXJFeGlzdHMgZmlyc3QgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBhcmdzLmZpbGVsaXN0LnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICAgICAgbG9nIGtvbG9yLndoaXRlIGtvbG9yLmJvbGQgXCJcXG5rb1wiLCBrb2xvci5ncmF5IFwidiN7cGtnLnZlcnNpb259XFxuXCJcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSB7Y3dkOiBwcm9jZXNzLmN3ZCgpfSwgY29sb3JzOnRydWVcbiAgICAgICAgICAgIGxvZyBrb2xvci55ZWxsb3cga29sb3IuYm9sZCAnXFxuYXJncydcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBhcmdzLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nICcnXG5cbiAgICAgICAgZ2xvYmFsLnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOiAnfCdcblxuICAgICAgICBhbGlhcyA9IG5ldyBzdG9yZSAnYWxpYXMnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGFyZ3Muc3RhdGVcbiAgICAgICAgICAgIGxvZyBrb2xvci55ZWxsb3cga29sb3IuYm9sZCAnc3RhdGUnXG4gICAgICAgICAgICBsb2cga29sb3IuZ3JlZW4ga29sb3IuYm9sZCAnc3RhdGUgZmlsZTonIGdsb2JhbC5zdGF0ZS5maWxlXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgZ2xvYmFsLnN0YXRlLmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgQGluZGV4ZXIgPSBuZXcgSW5kZXhlclxuXG4gICAgICAgIGlmIG5vdCBvcGVuRmlsZXMubGVuZ3RoIGFuZCB2YWxpZCBhcmdzLmZpbGVsaXN0XG4gICAgICAgICAgICBvcGVuRmlsZXMgPSBmaWxlbGlzdCBhcmdzLmZpbGVsaXN0LCBpZ25vcmVIaWRkZW46ZmFsc2VcblxuICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAncmVsb2FkV2luJyBAcmVsb2FkV2luXG4gICAgICAgIFxuICAgICAgICBAb3BlbkZpbGVzID0gb3BlbkZpbGVzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAgXG4gICAgb25TaG93OiA9PlxuXG4gICAgICAgIHsgd2lkdGgsIGhlaWdodCB9ID0gQHNjcmVlblNpemUoKVxuICAgICAgICBcbiAgICAgICAgQG9wdC53aWR0aCAgPSBoZWlnaHQgKyAxMjJcbiAgICAgICAgQG9wdC5oZWlnaHQgPSBoZWlnaHRcbiAgICAgIFxuICAgICAgICBpZiBhcmdzLnByZWZzXG4gICAgICAgICAgICBsb2cga29sb3IueWVsbG93IGtvbG9yLmJvbGQgJ3ByZWZzJ1xuICAgICAgICAgICAgbG9nIGtvbG9yLmdyZWVuIGtvbG9yLmJvbGQgcHJlZnMuc3RvcmU/LmZpbGVcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBwcmVmcy5zdG9yZT8uZGF0YSwgY29sb3JzOnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBvcGVuRmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIEBvcGVuRmlsZXNcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgICAgICBkZWxldGUgQG9wZW5GaWxlc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVzdG9yZVdpbmRvd3MoKSBpZiBub3QgYXJncy5ub3N0YXRlXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgd2lucygpLmxlbmd0aFxuICAgICAgICAgICAgaWYgcmVjZW50ID0gbW9zdFJlY2VudEZpbGUoKVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOnJlY2VudCBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEVtcHR5KClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25NZW51QWN0aW9uX09MRDogKGFjdGlvbiwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgIHRoZW4gQGFjdGl2YXRlTmV4dFdpbmRvdyBhcmdcbiAgICAgICAgICAgIHdoZW4gJ0FycmFuZ2UgV2luZG93cycgIHRoZW4gQGFycmFuZ2VXaW5kb3dzKClcbiAgICAgICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgIHRoZW4gQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwXG5cbiAgICB3aW5zOiAgICAgICAgd2lucygpXG4gICAgd2luV2l0aElEOiAgIHdpbldpdGhJRFxuICAgIGFjdGl2ZVdpbjogICBhY3RpdmVXaW5cbiAgICB2aXNpYmxlV2luczogdmlzaWJsZVdpbnNcblxuICAgIGNyZWF0ZVdpbmRvd1dpdGhGaWxlOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbb3B0LmZpbGVdXG4gICAgICAgIHdpblxuXG4gICAgY3JlYXRlV2luZG93V2l0aEVtcHR5OiAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnbmV3RW1wdHlUYWInXG4gICAgICAgIHdpblxuICAgICAgICBcbiAgICB0b2dnbGVXaW5kb3dzOiAoY2IpID0+XG5cbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgICAgICAgICBAaGlkZVdpbmRvd3MoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHJhaXNlV2luZG93cygpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHNob3dXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNiIGZpcnN0IHZpc2libGVXaW5zKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNyZWF0ZVdpbmRvdyBjYlxuXG4gICAgaGlkZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LmhpZGUoKVxuICAgICAgICAgICAgQGhpZGVEb2NrKClcbiAgICAgICAgQFxuXG4gICAgc2hvd1dpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LnNob3coKVxuICAgICAgICAgICAgQHNob3dEb2NrKClcbiAgICAgICAgQFxuXG4gICAgcmFpc2VXaW5kb3dzOiAtPlxuXG4gICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIGZvciB3IGluIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLmZvY3VzKClcbiAgICAgICAgQFxuXG4gICAgYWN0aXZhdGVOZXh0V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IDEgKyBhbGxXaW5kb3dzLmluZGV4T2Ygd1xuICAgICAgICAgICAgICAgIGkgPSAwIGlmIGkgPj0gYWxsV2luZG93cy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlUHJldldpbmRvdzogKHdpbikgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyIHdpbiB0aGVuIHdpbiA9IHdpbldpdGhJRCB3aW5cbiAgICAgICAgYWxsV2luZG93cyA9IHdpbnMoKVxuICAgICAgICBmb3IgdyBpbiBhbGxXaW5kb3dzXG4gICAgICAgICAgICBpZiB3ID09IHdpblxuICAgICAgICAgICAgICAgIGkgPSAtMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IGFsbFdpbmRvd3MubGVuZ3RoLTEgaWYgaSA8IDBcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlV2luZG93V2l0aElEOiAod2lkKSAtPlxuXG4gICAgICAgIHcgPSB3aW5XaXRoSUQgd2lkXG4gICAgICAgIHJldHVybiBpZiBub3Qgdz9cbiAgICAgICAgaWYgbm90IHcuaXNWaXNpYmxlKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHcuZm9jdXMoKVxuICAgICAgICB3XG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgc3RhY2tXaW5kb3dzOiAtPlxuICAgICAgICBcbiAgICAgICAge3dpZHRoLCBoZWlnaHR9ID0gQHNjcmVlblNpemUoKVxuICAgICAgICB3dyA9IGhlaWdodCArIDEyMlxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCAod2lkdGgtd3cpLzJcbiAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHd3XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgYWN0aXZlV2luKCkuc2hvdygpXG5cbiAgICB3aW5kb3dzQXJlU3RhY2tlZDogLT5cbiAgICAgICAgXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgZW1wdHkgd2xcbiAgICAgICAgXG4gICAgICAgIGZvciB3IGluIHdsXG4gICAgICAgICAgICBpZiB3LmlzRnVsbFNjcmVlbigpXG4gICAgICAgICAgICAgICAgdy5zZXRGdWxsU2NyZWVuIGZhbHNlIFxuICAgICAgICBcbiAgICAgICAgYm91bmRzID0gd2xbMF0uZ2V0Qm91bmRzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHdsLmxlbmd0aCA9PSAxIGFuZCBib3VuZHMud2lkdGggPT0gQHNjcmVlblNpemUoKS53aWR0aFxuICAgICAgICBcbiAgICAgICAgZm9yIHdpIGluIFsxLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbCB3bFt3aV0uZ2V0Qm91bmRzKCksIGJvdW5kc1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGFycmFuZ2VXaW5kb3dzOiA9PlxuXG4gICAgICAgIGRpc2FibGVTbmFwID0gdHJ1ZVxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcblxuICAgICAgICBpZiBub3QgQHdpbmRvd3NBcmVTdGFja2VkKClcbiAgICAgICAgICAgIEBzdGFja1dpbmRvd3MoKVxuICAgICAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgd2wubGVuZ3RoID09IDFcbiAgICAgICAgICAgIHdsWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB3bFswXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIDBcbiAgICAgICAgICAgICAgICB5OiAgICAgIDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHdpZHRoXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGggPT0gMiBvciB3bC5sZW5ndGggPT0gM1xuICAgICAgICAgICAgdyA9IHdpZHRoL3dsLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCBpICogdyAtIChpID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpID09IDAgb3IgaSA9PSB3bC5sZW5ndGgtMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgaGVpZ2h0XG4gICAgICAgIGVsc2UgaWYgd2wubGVuZ3RoXG4gICAgICAgICAgICB3MiA9IHBhcnNlSW50IHdsLmxlbmd0aC8yXG4gICAgICAgICAgICByaCA9IGhlaWdodFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53Ml1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvdzJcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHcyLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgICAgIGZvciBpIGluIFt3Mi4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvKHdsLmxlbmd0aC13MilcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IChpLXcyKSAqIHcgLSAoaS13MiA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgcmgvMisyM1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGktdzIgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICd0ZXN0J1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG1vdmVXaW5kb3dTdGFzaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgc3Rhc2hEaXIgPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbidcbiAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHN0YXNoRGlyXG4gICAgICAgICAgICBmcy5tb3ZlU3luYyBzdGFzaERpciwgc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgb3ZlcndyaXRlOiB0cnVlXG5cbiAgICByZXN0b3JlV2luZG93czogLT5cblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jIEB1c2VyRGF0YVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBtYXRjaEV4dDonbm9vbicpXG4gICAgICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIG5ld1N0YXNoID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nIFwiI3t3aW4uaWR9Lm5vb25cIlxuICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcblxuICAgIHRvZ2dsZVdpbmRvd0Zyb21UcmF5OiA9PiBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIGZvciB3aW4gaW4gd2lucygpXG4gICAgICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uUmVzaXplV2luOiAoZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGRpc2FibGVTbmFwXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2IgPSBldmVudC5zZW5kZXIuZ2V0Qm91bmRzKClcbiAgICAgICAgXG4gICAgICAgIGtsb2cgJ2tvLm1haW4ub25SZXNpemVXaW4nXG4gICAgICAgIFxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIHcgPT0gZXZlbnQuc2VuZGVyXG4gICAgICAgICAgICBiID0gdy5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgaWYgYi5oZWlnaHQgPT0gd2IuaGVpZ2h0IGFuZCBiLnkgPT0gd2IueVxuICAgICAgICAgICAgICAgIGlmIGIueCA8IHdiLnhcbiAgICAgICAgICAgICAgICAgICAgaWYgTWF0aC5hYnMoYi54K2Iud2lkdGgtd2IueCkgPCBXSU5fU05BUF9ESVNUXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICAgICAgYi54XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogICAgICBiLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHdiLnggLSBiLnggKyBmcmFtZVNpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG4gICAgICAgICAgICAgICAgZWxzZSBpZiBiLngrYi53aWR0aCA+IHdiLngrd2Iud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgaWYgTWF0aC5hYnMod2IueCt3Yi53aWR0aC1iLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHdiLngrd2Iud2lkdGgtZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogICAgICBiLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogIGIueCtiLndpZHRoIC0gKHdiLngrd2Iud2lkdGgtZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYi5oZWlnaHRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG5cbiAgICBhY3RpdmF0ZU9uZVdpbmRvdzogKGNiKSAtPlxuICAgIFxuICAgICAgICBpZiBlbXB0eSB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICBAdG9nZ2xlV2luZG93cyBjYlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgbm90IGFjdGl2ZVdpbigpXG4gICAgICAgICAgICBpZiB3aW4gPSB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgIFxuICAgICAgICAgICAgICAgICAgICB3eHcgJ3JhaXNlJyBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgY2Igd2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dycgICBcbiAgICAgICAgICAgICAgICB3eHcgJ3JhaXNlJyBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgY2IgdmlzaWJsZVdpbnMoKVswXVxuICAgICAgICAgICAgXG4gICAgb25PdGhlckluc3RhbmNlOiAoYXJncywgZGlyKSA9PlxuXG4gICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGRpcjonICBkaXJcbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgYXJnczonIGFyZ3NcbiAgICAgICAgXG4gICAgICAgIEBhY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuXG4gICAgICAgICAgICBmaWxlcyA9IFtdXG4gICAgICAgICAgICBpZiBmaXJzdChhcmdzKT8uZW5kc1dpdGggXCIje3BrZy5uYW1lfS5leGVcIlxuICAgICAgICAgICAgICAgIGZpbGVhcmdzID0gYXJncy5zbGljZSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmlsZWFyZ3MgPSBhcmdzLnNsaWNlIDJcbiAgICBcbiAgICAgICAgICAgIGZvciBhcmcgaW4gZmlsZWFyZ3NcbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBhcmcuc3RhcnRzV2l0aCAnLSdcbiAgICAgICAgICAgICAgICBmaWxlID0gYXJnXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5qb2luIHNsYXNoLnJlc29sdmUoZGlyKSwgYXJnXG4gICAgICAgICAgICAgICAgW2ZwYXRoLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGZpbGVcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5leGlzdHMgZnBhdGhcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaCBmaWxlXG4gICAgXG4gICAgICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBmaWxlcycgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBmaWxlcywgbmV3VGFiOnRydWVcblxuXG4gICAgcmVsb2FkV2luOiAod2luSUQ6LCBmaWxlOikgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHdpbiA9IHdpbldpdGhJRCB3aW5JRFxuICAgICAgICAgICAgd2luLndlYkNvbnRlbnRzLnJlbG9hZElnbm9yaW5nQ2FjaGUoKVxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAgMDAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHF1aXQ6ID0+XG5cbiAgICAgICAgdG9TYXZlID0gd2lucygpLmxlbmd0aFxuICAgICAgICBrbG9nICdrby5xdWl0JyB0b1NhdmVcbiAgICAgICAgaWYgdG9TYXZlXG4gICAgICAgICAgICBwb3N0Lm9uICdzdGFzaFNhdmVkJyA9PlxuICAgICAgICAgICAgICAgIHRvU2F2ZSAtPSAxXG4gICAgICAgICAgICAgICAga2xvZyAna28ucXVpdCBzdGFzaFNhdmVkJyB0b1NhdmUgXG4gICAgICAgICAgICAgICAgaWYgdG9TYXZlID09IDBcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgICAgICAgICBAZXhpdEFwcCgpXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnc2F2ZVN0YXNoJ1xuICAgICAgICAgICAgJ2RlbGF5J1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBnbG9iYWwuc3RhdGUuc2F2ZSgpXG4gICAgICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbmVsZWN0cm9uLmFwcC5vbiAnb3Blbi1maWxlJyAoZXZlbnQsIGZpbGUpIC0+XG5cbiAgICBpZiBub3QgbWFpbj9cbiAgICAgICAgb3BlbkZpbGVzLnB1c2ggZmlsZVxuICAgIGVsc2VcbiAgICAgICAgaWYgZWxlY3Ryb24uYXBwLmlzUmVhZHkoKVxuICAgICAgICAgICAgbWFpbi5hY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuICAgICAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbZmlsZV0gXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgIFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgICAgICAgIFxuXG5vblVEUCA9IChmaWxlKSAtPlxuICAgIG1haW4uYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cbiAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIFtmaWxlXSBcblxua29SZWNlaXZlciA9IG5ldyB1ZHAgcG9ydDo5Nzc5LCBvbk1zZzpvblVEUFxuXG5tYWluICAgICAgICAgID0gbmV3IE1haW4gb3BlbkZpbGVzXG5tYWluLm5hdmlnYXRlID0gbmV3IE5hdmlnYXRlIG1haW5cbiJdfQ==
//# sourceURL=../../coffee/main/main.coffee
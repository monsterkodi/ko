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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNFJBQUE7SUFBQTs7OztBQVFBLE1BQThHLE9BQUEsQ0FBUSxLQUFSLENBQTlHLEVBQUUsU0FBRixFQUFLLGFBQUwsRUFBVSxlQUFWLEVBQWdCLGlCQUFoQixFQUF1Qix1QkFBdkIsRUFBaUMsaUJBQWpDLEVBQXdDLFdBQXhDLEVBQTRDLGVBQTVDLEVBQWtELGlCQUFsRCxFQUF5RCxlQUF6RCxFQUErRCxlQUEvRCxFQUFxRSxpQkFBckUsRUFBNEUsaUJBQTVFLEVBQW1GLGlCQUFuRixFQUEwRixhQUExRixFQUErRixpQkFBL0YsRUFBc0c7O0FBS3RHLEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVgsYUFBQSxHQUFnQixRQUFRLENBQUM7O0FBRXpCLFdBQUEsR0FBZ0I7O0FBQ2hCLElBQUEsR0FBZ0I7O0FBQ2hCLFNBQUEsR0FBZ0I7O0FBQ2hCLGFBQUEsR0FBZ0I7O0FBSWhCLGNBQUEsR0FBaUIsU0FBQTtXQUFHLEtBQUEsQ0FBTSxLQUFLLENBQUMsR0FBTixDQUFVLGFBQVYsQ0FBTjtBQUFIOztBQVFqQixJQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxhQUFkLENBQUEsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFDLENBQUQsRUFBRyxDQUFIO2VBQVMsQ0FBQyxDQUFDLEVBQUYsR0FBTyxDQUFDLENBQUM7SUFBbEIsQ0FBbkM7QUFBSDs7QUFDZCxTQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxnQkFBZCxDQUFBO0FBQUg7O0FBQ2QsV0FBQSxHQUFjLFNBQUE7QUFBRyxR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IDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGFwcCwgYXJncywgZW1wdHksIGZpbGVsaXN0LCBmaXJzdCwgZnMsIGtsb2csIGtvbG9yLCBub29uLCBwb3N0LCBwcmVmcywgc2xhc2gsIHN0b3JlLCB1ZHAsIHZhbGlkLCB3aW4gfSA9IHJlcXVpcmUgJ2t4aydcblxuIyBwb3N0LmRlYnVnKClcbiMgbG9nLnNsb2cuZGVidWcgPSB0cnVlXG5cbnBrZyAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcblxuTmF2aWdhdGUgPSByZXF1aXJlICcuL25hdmlnYXRlJ1xuSW5kZXhlciAgPSByZXF1aXJlICcuL2luZGV4ZXInXG5cbkJyb3dzZXJXaW5kb3cgPSBlbGVjdHJvbi5Ccm93c2VyV2luZG93XG5cbmRpc2FibGVTbmFwICAgPSBmYWxzZVxubWFpbiAgICAgICAgICA9IHVuZGVmaW5lZFxub3BlbkZpbGVzICAgICA9IFtdXG5XSU5fU05BUF9ESVNUID0gMTUwXG5cbiMgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSAncHJvZHVjdGlvbicgIyA/Pz9cbiAgICBcbm1vc3RSZWNlbnRGaWxlID0gLT4gZmlyc3Qgc3RhdGUuZ2V0ICdyZWNlbnRGaWxlcydcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbnMgICAgICAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuc29ydCAoYSxiKSAtPiBhLmlkIC0gYi5pZFxuYWN0aXZlV2luICAgPSAtPiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKVxudmlzaWJsZVdpbnMgPSAtPiAodyBmb3IgdyBpbiB3aW5zKCkgd2hlbiB3Py5pc1Zpc2libGUoKSBhbmQgbm90IHc/LmlzTWluaW1pemVkKCkpXG5cbndpbldpdGhJRCAgID0gKHdpbklEKSAtPlxuXG4gICAgd2lkID0gcGFyc2VJbnQgd2luSURcbiAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgcmV0dXJuIHcgaWYgdy5pZCA9PSB3aWRcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uR2V0ICdkZWJ1Z01vZGUnIC0+IGFyZ3MuZGVidWdcbnBvc3Qub25HZXQgJ3dpbkluZm9zJyAgLT4gKGlkOiB3LmlkIGZvciB3IGluIHdpbnMoKSlcbnBvc3Qub25HZXQgJ2xvZ1N5bmMnICAgLT5cbiAgICBjb25zb2xlLmxvZy5hcHBseSBjb25zb2xlLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcbiAgICByZXR1cm4gdHJ1ZVxuXG5wb3N0Lm9uICd0aHJvd0Vycm9yJyAgICAgICAgICAgICAgICAgLT4gdGhyb3cgbmV3IEVycm9yICdlcnInXG5wb3N0Lm9uICduZXdXaW5kb3dXaXRoRmlsZScgIChmaWxlKSAgLT4gbWFpbi5jcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbnBvc3Qub24gJ2FjdGl2YXRlV2luZG93JyAgICAgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlV2luZG93V2l0aElEIHdpbklEXG5wb3N0Lm9uICdhY3RpdmF0ZU5leHRXaW5kb3cnICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZU5leHRXaW5kb3cgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlUHJldldpbmRvdycgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlUHJldldpbmRvdyB3aW5JRFxuXG5wb3N0Lm9uICdtZW51QWN0aW9uJyAgIChhY3Rpb24sIGFyZykgLT4gbWFpbj8ub25NZW51QWN0aW9uIGFjdGlvbiwgYXJnXG5wb3N0Lm9uICdwaW5nJyAod2luSUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd2luSUQsICdwb25nJyAnbWFpbicgYXJnQSwgYXJnQlxucG9zdC5vbiAnd2lubG9nJyAgICAgICAod2luSUQsIHRleHQpIC0+IFxuICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICBsb2cgXCIje3dpbklEfT4+IFwiICsgdGV4dFxuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgQDogKG9wZW5GaWxlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBwa2c6ICAgICAgICBwa2dcbiAgICAgICAgICAgIGRpcjogICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgZGlyczogICAgICAgWycuLi8nIFxuICAgICAgICAgICAgICAgICAgICAgICAgICcuLi9icm93c2VyJyAnLi4vY29tbWFuZGxpbmUnICcuLi9jb21tYW5kcycgJy4uL2VkaXRvcicgJy4uL2VkaXRvci9hY3Rpb25zJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICcuLi9naXQnICcuLi9tYWluJyAnLi4vdG9vbHMnICcuLi93aW4nXVxuICAgICAgICAgICAgc2hvcnRjdXQ6ICAgJ0NtZE9yQ3RybCtGMSdcbiAgICAgICAgICAgIGluZGV4OiAgICAgICcuLi9pbmRleC5odG1sJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgJy4uLy4uL2ltZy9hcHAuaWNvJ1xuICAgICAgICAgICAgdHJheTogICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIGFib3V0OiAgICAgICcuLi8uLi9pbWcvYWJvdXQucG5nJ1xuICAgICAgICAgICAgYWJvdXREZWJ1ZzogZmFsc2VcbiAgICAgICAgICAgIHNhdmVCb3VuZHM6IGZhbHNlXG4gICAgICAgICAgICBvblNob3c6ICAgICAtPiBtYWluLm9uU2hvdygpXG4gICAgICAgICAgICBvbk90aGVySW5zdGFuY2U6IChhcmdzLCBkaXIpIC0+IG1haW4ub25PdGhlckluc3RhbmNlIGFyZ3MsIGRpclxuICAgICAgICAgICAgd2lkdGg6ICAgICAgMTAwMFxuICAgICAgICAgICAgaGVpZ2h0OiAgICAgMTAwMFxuICAgICAgICAgICAgbWluV2lkdGg6ICAgMjQwXG4gICAgICAgICAgICBtaW5IZWlnaHQ6ICAyMzBcbiAgICAgICAgICAgIGFyZ3M6IFwiXCJcIlxuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICBmaWxlcyB0byBvcGVuICAgICAgICAgICAqKlxuICAgICAgICAgICAgICAgIHByZWZzICAgICBzaG93IHByZWZlcmVuY2VzICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIG5vcHJlZnMgICBkb24ndCBsb2FkIHByZWZlcmVuY2VzICBmYWxzZVxuICAgICAgICAgICAgICAgIHN0YXRlICAgICBzaG93IHN0YXRlICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIG5vc3RhdGUgICBkb24ndCBsb2FkIHN0YXRlICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIHZlcmJvc2UgICBsb2cgbW9yZSAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgIEBvcHQub25RdWl0ID0gQHF1aXRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcHJvY2Vzcy5jd2QoKSA9PSAnLydcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgc2xhc2gucmVzb2x2ZSAnfidcbiAgICAgICAgICAgIFxuICAgICAgICB3aGlsZSB2YWxpZChhcmdzLmZpbGVsaXN0KSBhbmQgc2xhc2guZGlyRXhpc3RzIGZpcnN0IGFyZ3MuZmlsZWxpc3RcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgYXJncy5maWxlbGlzdC5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBpZiBhcmdzLnZlcmJvc2VcbiAgICAgICAgICAgIGxvZyBrb2xvci53aGl0ZSBrb2xvci5ib2xkIFwiXFxua29cIiwga29sb3IuZ3JheSBcInYje3BrZy52ZXJzaW9ufVxcblwiXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkge2N3ZDogcHJvY2Vzcy5jd2QoKX0sIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cga29sb3IueWVsbG93IGtvbG9yLmJvbGQgJ1xcbmFyZ3MnXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgYXJncywgY29sb3JzOnRydWVcbiAgICAgICAgICAgIGxvZyAnJ1xuXG4gICAgICAgIGdsb2JhbC5zdGF0ZSA9IG5ldyBzdG9yZSAnc3RhdGUnIHNlcGFyYXRvcjogJ3wnXG5cbiAgICAgICAgYWxpYXMgPSBuZXcgc3RvcmUgJ2FsaWFzJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBhcmdzLnN0YXRlXG4gICAgICAgICAgICBsb2cga29sb3IueWVsbG93IGtvbG9yLmJvbGQgJ3N0YXRlJ1xuICAgICAgICAgICAgbG9nIGtvbG9yLmdyZWVuIGtvbG9yLmJvbGQgJ3N0YXRlIGZpbGU6JyBnbG9iYWwuc3RhdGUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGdsb2JhbC5zdGF0ZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIEBpbmRleGVyID0gbmV3IEluZGV4ZXJcblxuICAgICAgICBpZiBub3Qgb3BlbkZpbGVzLmxlbmd0aCBhbmQgdmFsaWQgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgb3BlbkZpbGVzID0gZmlsZWxpc3QgYXJncy5maWxlbGlzdCwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ3JlbG9hZFdpbicgQHJlbG9hZFdpblxuICAgICAgICBcbiAgICAgICAgQG9wZW5GaWxlcyA9IG9wZW5GaWxlc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgIFxuICAgIG9uU2hvdzogPT5cblxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcbiAgICAgICAgXG4gICAgICAgIEBvcHQud2lkdGggID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIEBvcHQuaGVpZ2h0ID0gaGVpZ2h0XG4gICAgICBcbiAgICAgICAgaWYgYXJncy5wcmVmc1xuICAgICAgICAgICAgbG9nIGtvbG9yLnllbGxvdyBrb2xvci5ib2xkICdwcmVmcydcbiAgICAgICAgICAgIGxvZyBrb2xvci5ncmVlbiBrb2xvci5ib2xkIHByZWZzLnN0b3JlPy5maWxlXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgcHJlZnMuc3RvcmU/LmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAb3BlbkZpbGVzXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBAb3BlbkZpbGVzXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxuICAgICAgICAgICAgZGVsZXRlIEBvcGVuRmlsZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKCkgaWYgbm90IGFyZ3Mubm9zdGF0ZVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHdpbnMoKS5sZW5ndGhcbiAgICAgICAgICAgIGlmIHJlY2VudCA9IG1vc3RSZWNlbnRGaWxlKClcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpyZWNlbnQgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhFbXB0eSgpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uTWVudUFjdGlvbl9PTEQ6IChhY3Rpb24sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyAgICB0aGVuIEBhY3RpdmF0ZU5leHRXaW5kb3cgYXJnXG4gICAgICAgICAgICB3aGVuICdBcnJhbmdlIFdpbmRvd3MnICB0aGVuIEBhcnJhbmdlV2luZG93cygpXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICB0aGVuIEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMFxuXG4gICAgd2luczogICAgICAgIHdpbnMoKVxuICAgIHdpbldpdGhJRDogICB3aW5XaXRoSURcbiAgICBhY3RpdmVXaW46ICAgYWN0aXZlV2luXG4gICAgdmlzaWJsZVdpbnM6IHZpc2libGVXaW5zXG5cbiAgICBjcmVhdGVXaW5kb3dXaXRoRmlsZTogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3cgKHdpbikgLT4gXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW29wdC5maWxlXVxuICAgICAgICB3aW5cblxuICAgIGNyZWF0ZVdpbmRvd1dpdGhFbXB0eTogLT5cbiAgICAgICAgXG4gICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3cgKHdpbikgLT4gXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ25ld0VtcHR5VGFiJ1xuICAgICAgICB3aW5cbiAgICAgICAgXG4gICAgdG9nZ2xlV2luZG93czogKGNiKSA9PlxuXG4gICAgICAgIGlmIHZhbGlkIHdpbnMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgYWN0aXZlV2luKClcbiAgICAgICAgICAgICAgICAgICAgQGhpZGVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEByYWlzZVdpbmRvd3MoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBzaG93V2luZG93cygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjYiBmaXJzdCB2aXNpYmxlV2lucygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjcmVhdGVXaW5kb3cgY2JcblxuICAgIGhpZGVXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgdy5oaWRlKClcbiAgICAgICAgICAgIEBoaWRlRG9jaygpXG4gICAgICAgIEBcblxuICAgIHNob3dXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgdy5zaG93KClcbiAgICAgICAgICAgIEBzaG93RG9jaygpXG4gICAgICAgIEBcblxuICAgIHJhaXNlV2luZG93czogLT5cblxuICAgICAgICBpZiB2YWxpZCB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICBmb3IgdyBpbiB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdmlzaWJsZVdpbnMoKVswXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdmlzaWJsZVdpbnMoKVswXS5mb2N1cygpXG4gICAgICAgIEBcblxuICAgIGFjdGl2YXRlTmV4dFdpbmRvdzogKHdpbikgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyIHdpbiB0aGVuIHdpbiA9IHdpbldpdGhJRCB3aW5cbiAgICAgICAgYWxsV2luZG93cyA9IHdpbnMoKVxuICAgICAgICBmb3IgdyBpbiBhbGxXaW5kb3dzXG4gICAgICAgICAgICBpZiB3ID09IHdpblxuICAgICAgICAgICAgICAgIGkgPSAxICsgYWxsV2luZG93cy5pbmRleE9mIHdcbiAgICAgICAgICAgICAgICBpID0gMCBpZiBpID49IGFsbFdpbmRvd3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGFjdGl2YXRlV2luZG93V2l0aElEIGFsbFdpbmRvd3NbaV0uaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gd1xuICAgICAgICBudWxsXG5cbiAgICBhY3RpdmF0ZVByZXZXaW5kb3c6ICh3aW4pIC0+XG5cbiAgICAgICAgaWYgXy5pc051bWJlciB3aW4gdGhlbiB3aW4gPSB3aW5XaXRoSUQgd2luXG4gICAgICAgIGFsbFdpbmRvd3MgPSB3aW5zKClcbiAgICAgICAgZm9yIHcgaW4gYWxsV2luZG93c1xuICAgICAgICAgICAgaWYgdyA9PSB3aW5cbiAgICAgICAgICAgICAgICBpID0gLTEgKyBhbGxXaW5kb3dzLmluZGV4T2Ygd1xuICAgICAgICAgICAgICAgIGkgPSBhbGxXaW5kb3dzLmxlbmd0aC0xIGlmIGkgPCAwXG4gICAgICAgICAgICAgICAgQGFjdGl2YXRlV2luZG93V2l0aElEIGFsbFdpbmRvd3NbaV0uaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gd1xuICAgICAgICBudWxsXG5cbiAgICBhY3RpdmF0ZVdpbmRvd1dpdGhJRDogKHdpZCkgLT5cblxuICAgICAgICB3ID0gd2luV2l0aElEIHdpZFxuICAgICAgICByZXR1cm4gaWYgbm90IHc/XG4gICAgICAgIGlmIG5vdCB3LmlzVmlzaWJsZSgpXG4gICAgICAgICAgICB3LnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3LmZvY3VzKClcbiAgICAgICAgd1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBzY3JlZW5TaXplOiAtPiBlbGVjdHJvbi5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemVcblxuICAgIHN0YWNrV2luZG93czogLT5cbiAgICAgICAgXG4gICAgICAgIHt3aWR0aCwgaGVpZ2h0fSA9IEBzY3JlZW5TaXplKClcbiAgICAgICAgd3cgPSBoZWlnaHQgKyAxMjJcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIGZvciB3IGluIHdsXG4gICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgKHdpZHRoLXd3KS8yXG4gICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3d1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgaGVpZ2h0XG4gICAgICAgIGFjdGl2ZVdpbigpLnNob3coKVxuXG4gICAgd2luZG93c0FyZVN0YWNrZWQ6IC0+XG4gICAgICAgIFxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGVtcHR5IHdsXG4gICAgICAgIFxuICAgICAgICBmb3IgdyBpbiB3bFxuICAgICAgICAgICAgaWYgdy5pc0Z1bGxTY3JlZW4oKVxuICAgICAgICAgICAgICAgIHcuc2V0RnVsbFNjcmVlbiBmYWxzZSBcbiAgICAgICAgXG4gICAgICAgIGJvdW5kcyA9IHdsWzBdLmdldEJvdW5kcygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiB3bC5sZW5ndGggPT0gMSBhbmQgYm91bmRzLndpZHRoID09IEBzY3JlZW5TaXplKCkud2lkdGhcbiAgICAgICAgXG4gICAgICAgIGZvciB3aSBpbiBbMS4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwgd2xbd2ldLmdldEJvdW5kcygpLCBib3VuZHNcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBhcnJhbmdlV2luZG93czogPT5cblxuICAgICAgICBkaXNhYmxlU25hcCA9IHRydWVcbiAgICAgICAgZnJhbWVTaXplID0gNlxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgeyB3aWR0aCwgaGVpZ2h0IH0gPSBAc2NyZWVuU2l6ZSgpXG5cbiAgICAgICAgaWYgbm90IEB3aW5kb3dzQXJlU3RhY2tlZCgpXG4gICAgICAgICAgICBAc3RhY2tXaW5kb3dzKClcbiAgICAgICAgICAgIGRpc2FibGVTbmFwID0gZmFsc2VcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIHdsLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICB3bFswXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgd2xbMF0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgeDogICAgICAwXG4gICAgICAgICAgICAgICAgeTogICAgICAwXG4gICAgICAgICAgICAgICAgd2lkdGg6ICB3aWR0aFxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIGVsc2UgaWYgd2wubGVuZ3RoID09IDIgb3Igd2wubGVuZ3RoID09IDNcbiAgICAgICAgICAgIHcgPSB3aWR0aC93bC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgaSAqIHcgLSAoaSA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaSA9PSAwIG9yIGkgPT0gd2wubGVuZ3RoLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IGhlaWdodFxuICAgICAgICBlbHNlIGlmIHdsLmxlbmd0aFxuICAgICAgICAgICAgdzIgPSBwYXJzZUludCB3bC5sZW5ndGgvMlxuICAgICAgICAgICAgcmggPSBoZWlnaHRcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4udzJdXG4gICAgICAgICAgICAgICAgdyA9IHdpZHRoL3cyXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCBpICogdyAtIChpID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpID09IDAgb3IgaSA9PSB3Mi0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCByaC8yXG4gICAgICAgICAgICBmb3IgaSBpbiBbdzIuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgdyA9IHdpZHRoLyh3bC5sZW5ndGgtdzIpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCAoaS13MikgKiB3IC0gKGktdzIgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IHJoLzIrMjNcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpLXcyID09IDAgb3IgaSA9PSB3bC5sZW5ndGgtMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCByaC8yXG4gICAgICAgIGRpc2FibGVTbmFwID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIHRocm93IG5ldyBFcnJvciAndGVzdCdcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBtb3ZlV2luZG93U3Rhc2hlczogLT5cbiAgICAgICAgXG4gICAgICAgIHN0YXNoRGlyID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nXG4gICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzdGFzaERpclxuICAgICAgICAgICAgZnMubW92ZVN5bmMgc3Rhc2hEaXIsIHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG92ZXJ3cml0ZTogdHJ1ZVxuXG4gICAgcmVzdG9yZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyBAdXNlckRhdGFcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZWxpc3Qoc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgbWF0Y2hFeHQ6J25vb24nKVxuICAgICAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgICAgICBuZXdTdGFzaCA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJyBcIiN7d2luLmlkfS5ub29uXCJcbiAgICAgICAgICAgIGZzLmNvcHlTeW5jIGZpbGUsIG5ld1N0YXNoXG5cbiAgICB0b2dnbGVXaW5kb3dGcm9tVHJheTogPT4gXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBmb3Igd2luIGluIHdpbnMoKVxuICAgICAgICAgICAgICAgIHdpbi5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvblJlc2l6ZVdpbjogKGV2ZW50KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBkaXNhYmxlU25hcFxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdiID0gZXZlbnQuc2VuZGVyLmdldEJvdW5kcygpXG4gICAgICAgIFxuICAgICAgICBrbG9nICdrby5tYWluLm9uUmVzaXplV2luJ1xuICAgICAgICBcbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiB3ID09IGV2ZW50LnNlbmRlclxuICAgICAgICAgICAgYiA9IHcuZ2V0Qm91bmRzKClcbiAgICAgICAgICAgIGlmIGIuaGVpZ2h0ID09IHdiLmhlaWdodCBhbmQgYi55ID09IHdiLnlcbiAgICAgICAgICAgICAgICBpZiBiLnggPCB3Yi54XG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKGIueCtiLndpZHRoLXdiLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIGIueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICB3Yi54IC0gYi54ICsgZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgYi54K2Iud2lkdGggPiB3Yi54K3diLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKHdiLngrd2Iud2lkdGgtYi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICB3Yi54K3diLndpZHRoLWZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBiLngrYi53aWR0aCAtICh3Yi54K3diLndpZHRoLWZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuXG4gICAgYWN0aXZhdGVPbmVXaW5kb3c6IChjYikgLT5cbiAgICBcbiAgICAgICAgaWYgZW1wdHkgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgQHRvZ2dsZVdpbmRvd3MgY2JcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIG5vdCBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgaWYgd2luID0gdmlzaWJsZVdpbnMoKVswXVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dycgICBcbiAgICAgICAgICAgICAgICAgICAgd3h3ICdyYWlzZScgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMF1cbiAgICAgICAgICAgICAgICB3aW4uZm9jdXMoKVxuICAgICAgICAgICAgICAgIGNiIHdpblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICB3eHcgPSByZXF1aXJlICd3eHcnICAgXG4gICAgICAgICAgICAgICAgd3h3ICdyYWlzZScgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMF1cbiAgICAgICAgICAgIGNiIHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgIFxuICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgPT5cblxuICAgICAgICAjIGxvZyAnb25PdGhlckluc3RhbmNlIGRpcjonICBkaXJcbiAgICAgICAgIyBsb2cgJ29uT3RoZXJJbnN0YW5jZSBhcmdzOicgYXJnc1xuICAgICAgICBcbiAgICAgICAgQGFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG5cbiAgICAgICAgICAgIGZpbGVzID0gW11cbiAgICAgICAgICAgIGlmIGZpcnN0KGFyZ3MpPy5lbmRzV2l0aCBcIiN7cGtnLm5hbWV9LmV4ZVwiXG4gICAgICAgICAgICAgICAgZmlsZWFyZ3MgPSBhcmdzLnNsaWNlIDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMlxuICAgIFxuICAgICAgICAgICAgZm9yIGFyZyBpbiBmaWxlYXJnc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIGFyZy5zdGFydHNXaXRoICctJ1xuICAgICAgICAgICAgICAgIGZpbGUgPSBhcmdcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW4gc2xhc2gucmVzb2x2ZShkaXIpLCBhcmdcbiAgICAgICAgICAgICAgICBbZnBhdGgsIHBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3MgZmlsZVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmV4aXN0cyBmcGF0aFxuICAgICAgICAgICAgICAgICAgICBmaWxlcy5wdXNoIGZpbGVcbiAgICBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBmaWxlcywgbmV3VGFiOnRydWVcbiAgICAgICAgICAgIHdpbi5zaG93KClcbiAgICAgICAgICAgIHdpbi5mb2N1cygpXG5cblxuICAgIHJlbG9hZFdpbjogKHdpbklEOiwgZmlsZTopID0+XG4gICAgICAgIFxuICAgICAgICBpZiB3aW4gPSB3aW5XaXRoSUQgd2luSURcbiAgICAgICAgICAgIHdpbi53ZWJDb250ZW50cy5yZWxvYWRJZ25vcmluZ0NhY2hlKClcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMCAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBxdWl0OiA9PlxuXG4gICAgICAgIHRvU2F2ZSA9IHdpbnMoKS5sZW5ndGhcbiAgICAgICAga2xvZyAna28ucXVpdCcgdG9TYXZlXG4gICAgICAgIGlmIHRvU2F2ZVxuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcgPT5cbiAgICAgICAgICAgICAgICB0b1NhdmUgLT0gMVxuICAgICAgICAgICAgICAgIGtsb2cgJ2tvLnF1aXQgc3Rhc2hTYXZlZCcgdG9TYXZlIFxuICAgICAgICAgICAgICAgIGlmIHRvU2F2ZSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5zdGF0ZS5zYXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGV4aXRBcHAoKVxuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3NhdmVTdGFzaCdcbiAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5lbGVjdHJvbi5hcHAub24gJ29wZW4tZmlsZScgKGV2ZW50LCBmaWxlKSAtPlxuXG4gICAgaWYgbm90IG1haW4/XG4gICAgICAgIG9wZW5GaWxlcy5wdXNoIGZpbGVcbiAgICBlbHNlXG4gICAgICAgIGlmIGVsZWN0cm9uLmFwcC5pc1JlYWR5KClcbiAgICAgICAgICAgIG1haW4uYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cbiAgICAgICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW2ZpbGVdIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxuICAgICAgICBcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgICAgICAgICBcblxub25VRFAgPSAoZmlsZSkgLT5cbiAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbZmlsZV0gXG5cbmtvUmVjZWl2ZXIgPSBuZXcgdWRwIHBvcnQ6OTc3OSwgb25Nc2c6b25VRFBcblxubWFpbiAgICAgICAgICA9IG5ldyBNYWluIG9wZW5GaWxlc1xubWFpbi5uYXZpZ2F0ZSA9IG5ldyBOYXZpZ2F0ZSBtYWluXG4iXX0=
//# sourceURL=../../coffee/main/main.coffee
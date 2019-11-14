// koffee 1.4.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Indexer, Main, Navigate, WIN_SNAP_DIST, _, activeWin, app, args, clipboard, colors, dialog, disableSnap, electron, empty, filelist, first, fs, koReceiver, main, mostRecentFile, noon, onUDP, openFiles, pkg, post, prefs, ref, slash, store, udp, valid, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, colors = ref.colors, first = ref.first, slash = ref.slash, valid = ref.valid, store = ref.store, prefs = ref.prefs, empty = ref.empty, args = ref.args, noon = ref.noon, app = ref.app, win = ref.win, udp = ref.udp, fs = ref.fs, _ = ref._;

pkg = require('../../package.json');

electron = require('electron');

Navigate = require('./navigate');

Indexer = require('./indexer');

BrowserWindow = electron.BrowserWindow, clipboard = electron.clipboard, dialog = electron.dialog;

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
        this.onMenuAction = bind(this.onMenuAction, this);
        this.onShow = bind(this.onShow, this);
        var alias;
        Main.__super__.constructor.call(this, {
            dir: __dirname,
            dirs: ['../', '../browser', '../commandline', '../commands', '../editor', '../git', '../main', '../tools', '../win'],
            pkg: pkg,
            shortcut: 'Alt+F1',
            index: '../index.html',
            icon: '../../img/app.ico',
            tray: '../../img/menu@2x.png',
            about: '../../img/about.png',
            aboutDebug: false,
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
            console.log(colors.white.bold("\nko", colors.gray("v" + pkg.version + "\n")));
            console.log(noon.stringify({
                cwd: process.cwd()
            }, {
                colors: true
            }));
            console.log(colors.yellow.bold('\nargs'));
            console.log(noon.stringify(args, {
                colors: true
            }));
            console.log('');
        }
        global.state = new store('state', {
            separator: '|'
        });
        alias = new store('alias');
        if (args.prefs) {
            console.log(colors.yellow.bold('prefs'));
            console.log(colors.green.bold('prefs file:', prefs.store.file));
            console.log(noon.stringify(prefs.store.data, {
                colors: true
            }));
        }
        if (args.state) {
            console.log(colors.yellow.bold('state'));
            console.log(colors.green.bold('state file:', global.state.file));
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
        var file, height, j, len, recent, ref1, ref2, width;
        ref1 = this.screenSize(), width = ref1.width, height = ref1.height;
        this.opt.width = height + 122;
        this.opt.height = height;
        if (valid(this.openFiles)) {
            ref2 = this.openFiles;
            for (j = 0, len = ref2.length; j < len; j++) {
                file = ref2[j];
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

    Main.prototype.onMenuAction = function(action, arg) {
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
        if (toSave) {
            post.toWins('saveStash');
            post.on('stashSaved', (function(_this) {
                return function() {
                    toSave -= 1;
                    if (toSave === 0) {
                        global.state.save();
                        return _this.exitApp();
                    }
                };
            })(this));
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

electron.app.on('window-all-closed', function() {
    return console.log('window-all-closed');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMFNBQUE7SUFBQTs7OztBQVFBLE1BQXlHLE9BQUEsQ0FBUSxLQUFSLENBQXpHLEVBQUUsZUFBRixFQUFRLHVCQUFSLEVBQWtCLG1CQUFsQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLGlCQUF4QyxFQUErQyxpQkFBL0MsRUFBc0QsaUJBQXRELEVBQTZELGlCQUE3RCxFQUFvRSxlQUFwRSxFQUEwRSxlQUExRSxFQUFnRixhQUFoRixFQUFxRixhQUFyRixFQUEwRixhQUExRixFQUErRixXQUEvRixFQUFtRzs7QUFLbkcsR0FBQSxHQUFXLE9BQUEsQ0FBUSxvQkFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFVBQVI7O0FBRVgsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztBQUNYLE9BQUEsR0FBVyxPQUFBLENBQVEsV0FBUjs7QUFFVCxzQ0FBRixFQUFpQiw4QkFBakIsRUFBNEI7O0FBRTVCLFdBQUEsR0FBZ0I7O0FBQ2hCLElBQUEsR0FBZ0I7O0FBQ2hCLFNBQUEsR0FBZ0I7O0FBQ2hCLGFBQUEsR0FBZ0I7O0FBSWhCLGNBQUEsR0FBaUIsU0FBQTtXQUFHLEtBQUEsQ0FBTSxLQUFLLENBQUMsR0FBTixDQUFVLGFBQVYsQ0FBTjtBQUFIOztBQVFqQixJQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxhQUFkLENBQUEsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFDLENBQUQsRUFBRyxDQUFIO2VBQVMsQ0FBQyxDQUFDLEVBQUYsR0FBTyxDQUFDLENBQUM7SUFBbEIsQ0FBbkM7QUFBSDs7QUFDZCxTQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxnQkFBZCxDQUFBO0FBQUg7O0FBQ2QsV0FBQSxHQUFjLFNBQUE7QUFBRyxRQUFBO0FBQUM7QUFBQTtTQUFBLHNDQUFBOzt5QkFBdUIs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bjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgZmlsZWxpc3QsIGNvbG9ycywgZmlyc3QsIHNsYXNoLCB2YWxpZCwgc3RvcmUsIHByZWZzLCBlbXB0eSwgYXJncywgbm9vbiwgYXBwLCB3aW4sIHVkcCwgZnMsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuIyBwb3N0LmRlYnVnKClcbiMgbG9nLnNsb2cuZGVidWcgPSB0cnVlXG5cbnBrZyAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcblxuTmF2aWdhdGUgPSByZXF1aXJlICcuL25hdmlnYXRlJ1xuSW5kZXhlciAgPSByZXF1aXJlICcuL2luZGV4ZXInXG5cbnsgQnJvd3NlcldpbmRvdywgY2xpcGJvYXJkLCBkaWFsb2cgfSA9IGVsZWN0cm9uXG5cbmRpc2FibGVTbmFwICAgPSBmYWxzZVxubWFpbiAgICAgICAgICA9IHVuZGVmaW5lZFxub3BlbkZpbGVzICAgICA9IFtdXG5XSU5fU05BUF9ESVNUID0gMTUwXG5cbiMgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSAncHJvZHVjdGlvbicgIyA/Pz9cbiAgICBcbm1vc3RSZWNlbnRGaWxlID0gLT4gZmlyc3Qgc3RhdGUuZ2V0ICdyZWNlbnRGaWxlcydcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbnMgICAgICAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuc29ydCAoYSxiKSAtPiBhLmlkIC0gYi5pZFxuYWN0aXZlV2luICAgPSAtPiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKVxudmlzaWJsZVdpbnMgPSAtPiAodyBmb3IgdyBpbiB3aW5zKCkgd2hlbiB3Py5pc1Zpc2libGUoKSBhbmQgbm90IHc/LmlzTWluaW1pemVkKCkpXG5cbndpbldpdGhJRCAgID0gKHdpbklEKSAtPlxuXG4gICAgd2lkID0gcGFyc2VJbnQgd2luSURcbiAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgcmV0dXJuIHcgaWYgdy5pZCA9PSB3aWRcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uR2V0ICdkZWJ1Z01vZGUnIC0+IGFyZ3MuZGVidWdcbnBvc3Qub25HZXQgJ3dpbkluZm9zJyAgLT4gKGlkOiB3LmlkIGZvciB3IGluIHdpbnMoKSlcbnBvc3Qub25HZXQgJ2xvZ1N5bmMnICAgLT5cbiAgICBjb25zb2xlLmxvZy5hcHBseSBjb25zb2xlLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcbiAgICByZXR1cm4gdHJ1ZVxuXG5wb3N0Lm9uICd0aHJvd0Vycm9yJyAgICAgICAgICAgICAgICAgLT4gdGhyb3cgbmV3IEVycm9yICdlcnInXG5wb3N0Lm9uICduZXdXaW5kb3dXaXRoRmlsZScgIChmaWxlKSAgLT4gbWFpbi5jcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbnBvc3Qub24gJ2FjdGl2YXRlV2luZG93JyAgICAgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlV2luZG93V2l0aElEIHdpbklEXG5wb3N0Lm9uICdhY3RpdmF0ZU5leHRXaW5kb3cnICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZU5leHRXaW5kb3cgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlUHJldldpbmRvdycgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlUHJldldpbmRvdyB3aW5JRFxuXG5wb3N0Lm9uICdtZW51QWN0aW9uJyAgIChhY3Rpb24sIGFyZykgLT4gbWFpbj8ub25NZW51QWN0aW9uIGFjdGlvbiwgYXJnXG5wb3N0Lm9uICdwaW5nJyAod2luSUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd2luSUQsICdwb25nJyAnbWFpbicgYXJnQSwgYXJnQlxucG9zdC5vbiAnd2lubG9nJyAgICAgICAod2luSUQsIHRleHQpIC0+IFxuICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICBsb2cgXCIje3dpbklEfT4+IFwiICsgdGV4dFxuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgQDogKG9wZW5GaWxlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIGRpcnM6ICAgICAgIFsnLi4vJyAnLi4vYnJvd3NlcicgJy4uL2NvbW1hbmRsaW5lJyAnLi4vY29tbWFuZHMnICcuLi9lZGl0b3InICcuLi9naXQnICcuLi9tYWluJyAnLi4vdG9vbHMnICcuLi93aW4nXVxuICAgICAgICAgICAgcGtnOiAgICAgICAgcGtnXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQWx0K0YxJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJy4uL2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uLy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZVxuICAgICAgICAgICAgb25TaG93OiAgICAgLT4gbWFpbi5vblNob3coKVxuICAgICAgICAgICAgb25PdGhlckluc3RhbmNlOiAoYXJncywgZGlyKSAtPiBtYWluLm9uT3RoZXJJbnN0YW5jZSBhcmdzLCBkaXJcbiAgICAgICAgICAgIHdpZHRoOiAgICAgIDEwMDBcbiAgICAgICAgICAgIGhlaWdodDogICAgIDEwMDBcbiAgICAgICAgICAgIG1pbldpZHRoOiAgIDI0MFxuICAgICAgICAgICAgbWluSGVpZ2h0OiAgMjMwXG4gICAgICAgICAgICBhcmdzOiBcIlwiXCJcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCAgZmlsZXMgdG8gb3BlbiAgICAgICAgICAgKipcbiAgICAgICAgICAgICAgICBwcmVmcyAgICAgc2hvdyBwcmVmZXJlbmNlcyAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBub3ByZWZzICAgZG9uJ3QgbG9hZCBwcmVmZXJlbmNlcyAgZmFsc2VcbiAgICAgICAgICAgICAgICBzdGF0ZSAgICAgc2hvdyBzdGF0ZSAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBub3N0YXRlICAgZG9uJ3QgbG9hZCBzdGF0ZSAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICB2ZXJib3NlICAgbG9nIG1vcmUgICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICBAb3B0Lm9uUXVpdCA9IEBxdWl0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHByb2Nlc3MuY3dkKCkgPT0gJy8nXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIHNsYXNoLnJlc29sdmUgJ34nXG4gICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgdmFsaWQoYXJncy5maWxlbGlzdCkgYW5kIHNsYXNoLmRpckV4aXN0cyBmaXJzdCBhcmdzLmZpbGVsaXN0XG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIGFyZ3MuZmlsZWxpc3Quc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgICAgICBsb2cgY29sb3JzLndoaXRlLmJvbGQgXCJcXG5rb1wiLCBjb2xvcnMuZ3JheSBcInYje3BrZy52ZXJzaW9ufVxcblwiXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkge2N3ZDogcHJvY2Vzcy5jd2QoKX0sIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cgY29sb3JzLnllbGxvdy5ib2xkICdcXG5hcmdzJ1xuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGFyZ3MsIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cgJydcblxuICAgICAgICBnbG9iYWwuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJyBzZXBhcmF0b3I6ICd8J1xuXG4gICAgICAgIGFsaWFzID0gbmV3IHN0b3JlICdhbGlhcydcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3MucHJlZnNcbiAgICAgICAgICAgIGxvZyBjb2xvcnMueWVsbG93LmJvbGQgJ3ByZWZzJ1xuICAgICAgICAgICAgbG9nIGNvbG9ycy5ncmVlbi5ib2xkICdwcmVmcyBmaWxlOicsIHByZWZzLnN0b3JlLmZpbGVcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBwcmVmcy5zdG9yZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgYXJncy5zdGF0ZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAnc3RhdGUnXG4gICAgICAgICAgICBsb2cgY29sb3JzLmdyZWVuLmJvbGQgJ3N0YXRlIGZpbGU6JywgZ2xvYmFsLnN0YXRlLmZpbGVcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBnbG9iYWwuc3RhdGUuZGF0YSwgY29sb3JzOnRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBAaW5kZXhlciA9IG5ldyBJbmRleGVyXG5cbiAgICAgICAgaWYgbm90IG9wZW5GaWxlcy5sZW5ndGggYW5kIHZhbGlkIGFyZ3MuZmlsZWxpc3RcbiAgICAgICAgICAgIG9wZW5GaWxlcyA9IGZpbGVsaXN0IGFyZ3MuZmlsZWxpc3QsIGlnbm9yZUhpZGRlbjpmYWxzZVxuXG4gICAgICAgIEBtb3ZlV2luZG93U3Rhc2hlcygpXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdyZWxvYWRXaW4nIEByZWxvYWRXaW5cbiAgICAgICAgXG4gICAgICAgIEBvcGVuRmlsZXMgPSBvcGVuRmlsZXNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICBcbiAgICBvblNob3c6ID0+XG5cbiAgICAgICAgeyB3aWR0aCwgaGVpZ2h0IH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIFxuICAgICAgICBAb3B0LndpZHRoICA9IGhlaWdodCArIDEyMlxuICAgICAgICBAb3B0LmhlaWdodCA9IGhlaWdodFxuICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBvcGVuRmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIEBvcGVuRmlsZXNcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgICAgICBkZWxldGUgQG9wZW5GaWxlc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVzdG9yZVdpbmRvd3MoKSBpZiBub3QgYXJncy5ub3N0YXRlXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgd2lucygpLmxlbmd0aFxuICAgICAgICAgICAgaWYgcmVjZW50ID0gbW9zdFJlY2VudEZpbGUoKVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOnJlY2VudCBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEVtcHR5KClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25NZW51QWN0aW9uOiAoYWN0aW9uLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgdGhlbiBAYWN0aXZhdGVOZXh0V2luZG93IGFyZ1xuICAgICAgICAgICAgd2hlbiAnQXJyYW5nZSBXaW5kb3dzJyAgdGhlbiBAYXJyYW5nZVdpbmRvd3MoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgdGhlbiBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDBcblxuICAgIHdpbnM6ICAgICAgICB3aW5zKClcbiAgICB3aW5XaXRoSUQ6ICAgd2luV2l0aElEXG4gICAgYWN0aXZlV2luOiAgIGFjdGl2ZVdpblxuICAgIHZpc2libGVXaW5zOiB2aXNpYmxlV2luc1xuXG4gICAgY3JlYXRlV2luZG93V2l0aEZpbGU6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIFtvcHQuZmlsZV1cbiAgICAgICAgd2luXG5cbiAgICBjcmVhdGVXaW5kb3dXaXRoRW1wdHk6IC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICduZXdFbXB0eVRhYidcbiAgICAgICAgd2luXG4gICAgICAgIFxuICAgIHRvZ2dsZVdpbmRvd3M6IChjYikgPT5cblxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGFjdGl2ZVdpbigpXG4gICAgICAgICAgICAgICAgICAgIEBoaWRlV2luZG93cygpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcmFpc2VXaW5kb3dzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAc2hvd1dpbmRvd3MoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2IgZmlyc3QgdmlzaWJsZVdpbnMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY3JlYXRlV2luZG93IGNiXG5cbiAgICBoaWRlV2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuaGlkZSgpXG4gICAgICAgICAgICBAaGlkZURvY2soKVxuICAgICAgICBAXG5cbiAgICBzaG93V2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgICAgICBAc2hvd0RvY2soKVxuICAgICAgICBAXG5cbiAgICByYWlzZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgZm9yIHcgaW4gdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uZm9jdXMoKVxuICAgICAgICBAXG5cbiAgICBhY3RpdmF0ZU5leHRXaW5kb3c6ICh3aW4pIC0+XG5cbiAgICAgICAgaWYgXy5pc051bWJlciB3aW4gdGhlbiB3aW4gPSB3aW5XaXRoSUQgd2luXG4gICAgICAgIGFsbFdpbmRvd3MgPSB3aW5zKClcbiAgICAgICAgZm9yIHcgaW4gYWxsV2luZG93c1xuICAgICAgICAgICAgaWYgdyA9PSB3aW5cbiAgICAgICAgICAgICAgICBpID0gMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IDAgaWYgaSA+PSBhbGxXaW5kb3dzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVQcmV2V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IC0xICsgYWxsV2luZG93cy5pbmRleE9mIHdcbiAgICAgICAgICAgICAgICBpID0gYWxsV2luZG93cy5sZW5ndGgtMSBpZiBpIDwgMFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVXaW5kb3dXaXRoSUQ6ICh3aWQpIC0+XG5cbiAgICAgICAgdyA9IHdpbldpdGhJRCB3aWRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCB3P1xuICAgICAgICBpZiBub3Qgdy5pc1Zpc2libGUoKVxuICAgICAgICAgICAgdy5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdy5mb2N1cygpXG4gICAgICAgIHdcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24uc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICBzdGFja1dpbmRvd3M6IC0+XG4gICAgICAgIFxuICAgICAgICB7d2lkdGgsIGhlaWdodH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIHd3ID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICBmb3IgdyBpbiB3bFxuICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50ICh3aWR0aC13dykvMlxuICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgd3dcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IGhlaWdodFxuICAgICAgICBhY3RpdmVXaW4oKS5zaG93KClcblxuICAgIHdpbmRvd3NBcmVTdGFja2VkOiAtPlxuICAgICAgICBcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBlbXB0eSB3bFxuICAgICAgICBcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIGlmIHcuaXNGdWxsU2NyZWVuKClcbiAgICAgICAgICAgICAgICB3LnNldEZ1bGxTY3JlZW4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBib3VuZHMgPSB3bFswXS5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgd2wubGVuZ3RoID09IDEgYW5kIGJvdW5kcy53aWR0aCA9PSBAc2NyZWVuU2l6ZSgpLndpZHRoXG4gICAgICAgIFxuICAgICAgICBmb3Igd2kgaW4gWzEuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsIHdsW3dpXS5nZXRCb3VuZHMoKSwgYm91bmRzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgYXJyYW5nZVdpbmRvd3M6ID0+XG5cbiAgICAgICAgZGlzYWJsZVNuYXAgPSB0cnVlXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHsgd2lkdGgsIGhlaWdodCB9ID0gQHNjcmVlblNpemUoKVxuXG4gICAgICAgIGlmIG5vdCBAd2luZG93c0FyZVN0YWNrZWQoKVxuICAgICAgICAgICAgQHN0YWNrV2luZG93cygpXG4gICAgICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiB3bC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgd2xbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHdsWzBdLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgIHg6ICAgICAgMFxuICAgICAgICAgICAgICAgIHk6ICAgICAgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgd2lkdGhcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICBlbHNlIGlmIHdsLmxlbmd0aCA9PSAyIG9yIHdsLmxlbmd0aCA9PSAzXG4gICAgICAgICAgICB3ID0gd2lkdGgvd2wubGVuZ3RoXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGhcbiAgICAgICAgICAgIHcyID0gcGFyc2VJbnQgd2wubGVuZ3RoLzJcbiAgICAgICAgICAgIHJoID0gaGVpZ2h0XG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLncyXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC93MlxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgaSAqIHcgLSAoaSA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaSA9PSAwIG9yIGkgPT0gdzItMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICAgICAgZm9yIGkgaW4gW3cyLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC8od2wubGVuZ3RoLXcyKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgKGktdzIpICogdyAtIChpLXcyID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCByaC8yKzIzXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaS13MiA9PSAwIG9yIGkgPT0gd2wubGVuZ3RoLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgJ3Rlc3QnXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgbW92ZVdpbmRvd1N0YXNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBzdGFzaERpciA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJ1xuICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc3Rhc2hEaXJcbiAgICAgICAgICAgIGZzLm1vdmVTeW5jIHN0YXNoRGlyLCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBvdmVyd3JpdGU6IHRydWVcblxuICAgIHJlc3RvcmVXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMgQHVzZXJEYXRhXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVsaXN0KHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG1hdGNoRXh0Oidub29uJylcbiAgICAgICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgbmV3U3Rhc2ggPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbicsIFwiI3t3aW4uaWR9Lm5vb25cIlxuICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcblxuICAgIHRvZ2dsZVdpbmRvd0Zyb21UcmF5OiA9PiBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIGZvciB3aW4gaW4gd2lucygpXG4gICAgICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uUmVzaXplV2luOiAoZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGRpc2FibGVTbmFwXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2IgPSBldmVudC5zZW5kZXIuZ2V0Qm91bmRzKClcbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiB3ID09IGV2ZW50LnNlbmRlclxuICAgICAgICAgICAgYiA9IHcuZ2V0Qm91bmRzKClcbiAgICAgICAgICAgIGlmIGIuaGVpZ2h0ID09IHdiLmhlaWdodCBhbmQgYi55ID09IHdiLnlcbiAgICAgICAgICAgICAgICBpZiBiLnggPCB3Yi54XG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKGIueCtiLndpZHRoLXdiLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIGIueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICB3Yi54IC0gYi54ICsgZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgYi54K2Iud2lkdGggPiB3Yi54K3diLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKHdiLngrd2Iud2lkdGgtYi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICB3Yi54K3diLndpZHRoLWZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBiLngrYi53aWR0aCAtICh3Yi54K3diLndpZHRoLWZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuXG4gICAgYWN0aXZhdGVPbmVXaW5kb3c6IChjYikgLT5cbiAgICBcbiAgICAgICAgaWYgZW1wdHkgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgQHRvZ2dsZVdpbmRvd3MgY2JcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIG5vdCBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgaWYgd2luID0gdmlzaWJsZVdpbnMoKVswXVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dycgICBcbiAgICAgICAgICAgICAgICAgICAgd3h3ICdyYWlzZScgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMF1cbiAgICAgICAgICAgICAgICB3aW4uZm9jdXMoKVxuICAgICAgICAgICAgICAgIGNiIHdpblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICB3eHcgPSByZXF1aXJlICd3eHcnICAgXG4gICAgICAgICAgICAgICAgd3h3ICdyYWlzZScgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMF1cbiAgICAgICAgICAgIGNiIHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgIFxuICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgPT5cblxuICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBkaXI6JywgIGRpclxuICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBhcmdzOicsIGFyZ3NcbiAgICAgICAgXG4gICAgICAgIEBhY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuXG4gICAgICAgICAgICBmaWxlcyA9IFtdXG4gICAgICAgICAgICBpZiBmaXJzdChhcmdzKT8uZW5kc1dpdGggXCIje3BrZy5uYW1lfS5leGVcIlxuICAgICAgICAgICAgICAgIGZpbGVhcmdzID0gYXJncy5zbGljZSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmlsZWFyZ3MgPSBhcmdzLnNsaWNlIDJcbiAgICBcbiAgICAgICAgICAgIGZvciBhcmcgaW4gZmlsZWFyZ3NcbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBhcmcuc3RhcnRzV2l0aCAnLSdcbiAgICAgICAgICAgICAgICBmaWxlID0gYXJnXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guaXNSZWxhdGl2ZSBmaWxlXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5qb2luIHNsYXNoLnJlc29sdmUoZGlyKSwgYXJnXG4gICAgICAgICAgICAgICAgW2ZwYXRoLCBwb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGZpbGVcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5leGlzdHMgZnBhdGhcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaCBmaWxlXG4gICAgXG4gICAgICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBmaWxlcycgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBmaWxlcywgbmV3VGFiOnRydWVcblxuXG4gICAgcmVsb2FkV2luOiAod2luSUQ6LCBmaWxlOikgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIHdpbiA9IHdpbldpdGhJRCB3aW5JRFxuICAgICAgICAgICAgd2luLndlYkNvbnRlbnRzLnJlbG9hZElnbm9yaW5nQ2FjaGUoKVxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAgMDAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHF1aXQ6ID0+XG5cbiAgICAgICAgdG9TYXZlID0gd2lucygpLmxlbmd0aFxuXG4gICAgICAgIGlmIHRvU2F2ZVxuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3NhdmVTdGFzaCdcbiAgICAgICAgICAgIHBvc3Qub24gJ3N0YXNoU2F2ZWQnID0+XG4gICAgICAgICAgICAgICAgdG9TYXZlIC09IDFcbiAgICAgICAgICAgICAgICBpZiB0b1NhdmUgPT0gMFxuICAgICAgICAgICAgICAgICAgICBnbG9iYWwuc3RhdGUuc2F2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBleGl0QXBwKClcbiAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5lbGVjdHJvbi5hcHAub24gJ29wZW4tZmlsZScsIChldmVudCwgZmlsZSkgLT5cblxuICAgIGlmIG5vdCBtYWluP1xuICAgICAgICBvcGVuRmlsZXMucHVzaCBmaWxlXG4gICAgZWxzZVxuICAgICAgICBpZiBlbGVjdHJvbi5hcHAuaXNSZWFkeSgpXG4gICAgICAgICAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIFtmaWxlXSBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWFpbi5jcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbiAgICAgICAgXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG5lbGVjdHJvbi5hcHAub24gJ3dpbmRvdy1hbGwtY2xvc2VkJywgLT4gbG9nICd3aW5kb3ctYWxsLWNsb3NlZCdcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgICAgICAgIFxuXG5vblVEUCA9IChmaWxlKSAtPlxuICAgIG1haW4uYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cbiAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBbZmlsZV0gXG5cbmtvUmVjZWl2ZXIgPSBuZXcgdWRwIHBvcnQ6OTc3OSwgb25Nc2c6b25VRFBcblxubWFpbiAgICAgICAgICA9IG5ldyBNYWluIG9wZW5GaWxlc1xubWFpbi5uYXZpZ2F0ZSA9IG5ldyBOYXZpZ2F0ZSBtYWluXG4iXX0=
//# sourceURL=../../coffee/main/main.coffee
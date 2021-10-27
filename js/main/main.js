// koffee 1.14.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Indexer, Main, Navigate, WIN_SNAP_DIST, _, activeWin, app, args, clipboard, dialog, disableSnap, electron, empty, filelist, first, fs, klog, koReceiver, kolor, main, mostRecentFile, noon, onUDP, openFiles, pkg, post, prefs, ref, slash, store, udp, valid, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), _ = ref._, app = ref.app, args = ref.args, empty = ref.empty, filelist = ref.filelist, first = ref.first, fs = ref.fs, klog = ref.klog, kolor = ref.kolor, noon = ref.noon, post = ref.post, prefs = ref.prefs, slash = ref.slash, store = ref.store, udp = ref.udp, valid = ref.valid, win = ref.win;

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
        if (toSave) {
            post.toWins('saveStash');
            return post.on('stashSaved', (function(_this) {
                return function() {
                    toSave -= 1;
                    if (toSave === 0) {
                        global.state.save();
                        _this.exitApp();
                    }
                    return 'delay';
                };
            })(this));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK1NBQUE7SUFBQTs7OztBQVFBLE1BQThHLE9BQUEsQ0FBUSxLQUFSLENBQTlHLEVBQUUsU0FBRixFQUFLLGFBQUwsRUFBVSxlQUFWLEVBQWdCLGlCQUFoQixFQUF1Qix1QkFBdkIsRUFBaUMsaUJBQWpDLEVBQXdDLFdBQXhDLEVBQTRDLGVBQTVDLEVBQWtELGlCQUFsRCxFQUF5RCxlQUF6RCxFQUErRCxlQUEvRCxFQUFxRSxpQkFBckUsRUFBNEUsaUJBQTVFLEVBQW1GLGlCQUFuRixFQUEwRixhQUExRixFQUErRixpQkFBL0YsRUFBc0c7O0FBS3RHLEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVQsc0NBQUYsRUFBaUIsOEJBQWpCLEVBQTRCOztBQUU1QixXQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUNoQixTQUFBLEdBQWdCOztBQUNoQixhQUFBLEdBQWdCOztBQUloQixjQUFBLEdBQWlCLFNBQUE7V0FBRyxLQUFBLENBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLENBQU47QUFBSDs7QUFRakIsSUFBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsYUFBZCxDQUFBLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsU0FBQyxDQUFELEVBQUcsQ0FBSDtlQUFTLENBQUMsQ0FBQyxFQUFGLEdBQU8sQ0FBQyxDQUFDO0lBQWxCLENBQW5DO0FBQUg7O0FBQ2QsU0FBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsZ0JBQWQsQ0FBQTtBQUFIOztBQUNkLFdBQUEsR0FBYyxTQUFBO0FB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QUFUOztBQUNoQixJQUFJLENBQUMsUUFBTCxHQUFnQixJQUFJLFFBQUosQ0FBYSxJQUFiIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgYXBwLCBhcmdzLCBlbXB0eSwgZmlsZWxpc3QsIGZpcnN0LCBmcywga2xvZywga29sb3IsIG5vb24sIHBvc3QsIHByZWZzLCBzbGFzaCwgc3RvcmUsIHVkcCwgdmFsaWQsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jIHBvc3QuZGVidWcoKVxuIyBsb2cuc2xvZy5kZWJ1ZyA9IHRydWVcblxucGtnICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5OYXZpZ2F0ZSA9IHJlcXVpcmUgJy4vbmF2aWdhdGUnXG5JbmRleGVyICA9IHJlcXVpcmUgJy4vaW5kZXhlcidcblxueyBCcm93c2VyV2luZG93LCBjbGlwYm9hcmQsIGRpYWxvZyB9ID0gZWxlY3Ryb25cblxuZGlzYWJsZVNuYXAgICA9IGZhbHNlXG5tYWluICAgICAgICAgID0gdW5kZWZpbmVkXG5vcGVuRmlsZXMgICAgID0gW11cbldJTl9TTkFQX0RJU1QgPSAxNTBcblxuIyBwcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJyAjID8/P1xuICAgIFxubW9zdFJlY2VudEZpbGUgPSAtPiBmaXJzdCBzdGF0ZS5nZXQgJ3JlY2VudEZpbGVzJ1xuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2lucyAgICAgICAgPSAtPiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5zb3J0IChhLGIpIC0+IGEuaWQgLSBiLmlkXG5hY3RpdmVXaW4gICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG52aXNpYmxlV2lucyA9IC0+ICh3IGZvciB3IGluIHdpbnMoKSB3aGVuIHc/LmlzVmlzaWJsZSgpIGFuZCBub3Qgdz8uaXNNaW5pbWl6ZWQoKSlcblxud2luV2l0aElEICAgPSAod2luSUQpIC0+XG5cbiAgICB3aWQgPSBwYXJzZUludCB3aW5JRFxuICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICByZXR1cm4gdyBpZiB3LmlkID09IHdpZFxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub25HZXQgJ2RlYnVnTW9kZScgLT4gYXJncy5kZWJ1Z1xucG9zdC5vbkdldCAnd2luSW5mb3MnICAtPiAoaWQ6IHcuaWQgZm9yIHcgaW4gd2lucygpKVxucG9zdC5vbkdldCAnbG9nU3luYycgICAtPlxuICAgIGNvbnNvbGUubG9nLmFwcGx5IGNvbnNvbGUsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuICAgIHJldHVybiB0cnVlXG5cbnBvc3Qub24gJ3Rocm93RXJyb3InICAgICAgICAgICAgICAgICAtPiB0aHJvdyBuZXcgRXJyb3IgJ2VycidcbnBvc3Qub24gJ25ld1dpbmRvd1dpdGhGaWxlJyAgKGZpbGUpICAtPiBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxucG9zdC5vbiAnYWN0aXZhdGVXaW5kb3cnICAgICAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVXaW5kb3dXaXRoSUQgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlTmV4dFdpbmRvdycgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlTmV4dFdpbmRvdyB3aW5JRFxucG9zdC5vbiAnYWN0aXZhdGVQcmV2V2luZG93JyAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVQcmV2V2luZG93IHdpbklEXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nICAgKGFjdGlvbiwgYXJnKSAtPiBtYWluPy5vbk1lbnVBY3Rpb24gYWN0aW9uLCBhcmdcbnBvc3Qub24gJ3BpbmcnICh3aW5JRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3aW5JRCwgJ3BvbmcnICdtYWluJyBhcmdBLCBhcmdCXG5wb3N0Lm9uICd3aW5sb2cnICAgICAgICh3aW5JRCwgdGV4dCkgLT4gXG4gICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgIGxvZyBcIiN7d2luSUR9Pj4gXCIgKyB0ZXh0XG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG5jbGFzcyBNYWluIGV4dGVuZHMgYXBwXG5cbiAgICBAOiAob3BlbkZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIHBrZzogICAgICAgIHBrZ1xuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBkaXJzOiAgICAgICBbJy4uLycgXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2Jyb3dzZXInICcuLi9jb21tYW5kbGluZScgJy4uL2NvbW1hbmRzJyAnLi4vZWRpdG9yJyAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2dpdCcgJy4uL21haW4nICcuLi90b29scycgJy4uL3dpbiddXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQ21kT3JDdHJsK0YxJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJy4uL2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uLy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZVxuICAgICAgICAgICAgb25TaG93OiAgICAgLT4gbWFpbi5vblNob3coKVxuICAgICAgICAgICAgb25PdGhlckluc3RhbmNlOiAoYXJncywgZGlyKSAtPiBtYWluLm9uT3RoZXJJbnN0YW5jZSBhcmdzLCBkaXJcbiAgICAgICAgICAgIHdpZHRoOiAgICAgIDEwMDBcbiAgICAgICAgICAgIGhlaWdodDogICAgIDEwMDBcbiAgICAgICAgICAgIG1pbldpZHRoOiAgIDI0MFxuICAgICAgICAgICAgbWluSGVpZ2h0OiAgMjMwXG4gICAgICAgICAgICBhcmdzOiBcIlwiXCJcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCAgZmlsZXMgdG8gb3BlbiAgICAgICAgICAgKipcbiAgICAgICAgICAgICAgICBwcmVmcyAgICAgc2hvdyBwcmVmZXJlbmNlcyAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBub3ByZWZzICAgZG9uJ3QgbG9hZCBwcmVmZXJlbmNlcyAgZmFsc2VcbiAgICAgICAgICAgICAgICBzdGF0ZSAgICAgc2hvdyBzdGF0ZSAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBub3N0YXRlICAgZG9uJ3QgbG9hZCBzdGF0ZSAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICB2ZXJib3NlICAgbG9nIG1vcmUgICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICBAb3B0Lm9uUXVpdCA9IEBxdWl0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHByb2Nlc3MuY3dkKCkgPT0gJy8nXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIHNsYXNoLnJlc29sdmUgJ34nXG4gICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgdmFsaWQoYXJncy5maWxlbGlzdCkgYW5kIHNsYXNoLmRpckV4aXN0cyBmaXJzdCBhcmdzLmZpbGVsaXN0XG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIGFyZ3MuZmlsZWxpc3Quc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgICAgICBsb2cga29sb3Iud2hpdGUga29sb3IuYm9sZCBcIlxcbmtvXCIsIGtvbG9yLmdyYXkgXCJ2I3twa2cudmVyc2lvbn1cXG5cIlxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHtjd2Q6IHByb2Nlc3MuY3dkKCl9LCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nIGtvbG9yLnllbGxvdyBrb2xvci5ib2xkICdcXG5hcmdzJ1xuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGFyZ3MsIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cgJydcblxuICAgICAgICBnbG9iYWwuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJyBzZXBhcmF0b3I6ICd8J1xuXG4gICAgICAgIGFsaWFzID0gbmV3IHN0b3JlICdhbGlhcydcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgYXJncy5zdGF0ZVxuICAgICAgICAgICAgbG9nIGtvbG9yLnllbGxvdyBrb2xvci5ib2xkICdzdGF0ZSdcbiAgICAgICAgICAgIGxvZyBrb2xvci5ncmVlbiBrb2xvci5ib2xkICdzdGF0ZSBmaWxlOicgZ2xvYmFsLnN0YXRlLmZpbGVcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBnbG9iYWwuc3RhdGUuZGF0YSwgY29sb3JzOnRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBAaW5kZXhlciA9IG5ldyBJbmRleGVyXG5cbiAgICAgICAgaWYgbm90IG9wZW5GaWxlcy5sZW5ndGggYW5kIHZhbGlkIGFyZ3MuZmlsZWxpc3RcbiAgICAgICAgICAgIG9wZW5GaWxlcyA9IGZpbGVsaXN0IGFyZ3MuZmlsZWxpc3QsIGlnbm9yZUhpZGRlbjpmYWxzZVxuXG4gICAgICAgIEBtb3ZlV2luZG93U3Rhc2hlcygpXG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdyZWxvYWRXaW4nIEByZWxvYWRXaW5cbiAgICAgICAgXG4gICAgICAgIEBvcGVuRmlsZXMgPSBvcGVuRmlsZXNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICBcbiAgICBvblNob3c6ID0+XG5cbiAgICAgICAgeyB3aWR0aCwgaGVpZ2h0IH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIFxuICAgICAgICBAb3B0LndpZHRoICA9IGhlaWdodCArIDEyMlxuICAgICAgICBAb3B0LmhlaWdodCA9IGhlaWdodFxuICAgICAgXG4gICAgICAgIGlmIGFyZ3MucHJlZnNcbiAgICAgICAgICAgIGxvZyBrb2xvci55ZWxsb3cga29sb3IuYm9sZCAncHJlZnMnXG4gICAgICAgICAgICBsb2cga29sb3IuZ3JlZW4ga29sb3IuYm9sZCBwcmVmcy5zdG9yZT8uZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHByZWZzLnN0b3JlPy5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQG9wZW5GaWxlc1xuICAgICAgICAgICAgZm9yIGZpbGUgaW4gQG9wZW5GaWxlc1xuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAb3BlbkZpbGVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpIGlmIG5vdCBhcmdzLm5vc3RhdGVcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCB3aW5zKCkubGVuZ3RoXG4gICAgICAgICAgICBpZiByZWNlbnQgPSBtb3N0UmVjZW50RmlsZSgpXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6cmVjZW50IFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRW1wdHkoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb25fT0xEOiAoYWN0aW9uLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgdGhlbiBAYWN0aXZhdGVOZXh0V2luZG93IGFyZ1xuICAgICAgICAgICAgd2hlbiAnQXJyYW5nZSBXaW5kb3dzJyAgdGhlbiBAYXJyYW5nZVdpbmRvd3MoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgdGhlbiBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDBcblxuICAgIHdpbnM6ICAgICAgICB3aW5zKClcbiAgICB3aW5XaXRoSUQ6ICAgd2luV2l0aElEXG4gICAgYWN0aXZlV2luOiAgIGFjdGl2ZVdpblxuICAgIHZpc2libGVXaW5zOiB2aXNpYmxlV2luc1xuXG4gICAgY3JlYXRlV2luZG93V2l0aEZpbGU6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIFtvcHQuZmlsZV1cbiAgICAgICAgd2luXG5cbiAgICBjcmVhdGVXaW5kb3dXaXRoRW1wdHk6IC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICduZXdFbXB0eVRhYidcbiAgICAgICAgd2luXG4gICAgICAgIFxuICAgIHRvZ2dsZVdpbmRvd3M6IChjYikgPT5cblxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGFjdGl2ZVdpbigpXG4gICAgICAgICAgICAgICAgICAgIEBoaWRlV2luZG93cygpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcmFpc2VXaW5kb3dzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAc2hvd1dpbmRvd3MoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2IgZmlyc3QgdmlzaWJsZVdpbnMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY3JlYXRlV2luZG93IGNiXG5cbiAgICBoaWRlV2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuaGlkZSgpXG4gICAgICAgICAgICBAaGlkZURvY2soKVxuICAgICAgICBAXG5cbiAgICBzaG93V2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgICAgICBAc2hvd0RvY2soKVxuICAgICAgICBAXG5cbiAgICByYWlzZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgZm9yIHcgaW4gdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uZm9jdXMoKVxuICAgICAgICBAXG5cbiAgICBhY3RpdmF0ZU5leHRXaW5kb3c6ICh3aW4pIC0+XG5cbiAgICAgICAgaWYgXy5pc051bWJlciB3aW4gdGhlbiB3aW4gPSB3aW5XaXRoSUQgd2luXG4gICAgICAgIGFsbFdpbmRvd3MgPSB3aW5zKClcbiAgICAgICAgZm9yIHcgaW4gYWxsV2luZG93c1xuICAgICAgICAgICAgaWYgdyA9PSB3aW5cbiAgICAgICAgICAgICAgICBpID0gMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IDAgaWYgaSA+PSBhbGxXaW5kb3dzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVQcmV2V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IC0xICsgYWxsV2luZG93cy5pbmRleE9mIHdcbiAgICAgICAgICAgICAgICBpID0gYWxsV2luZG93cy5sZW5ndGgtMSBpZiBpIDwgMFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVXaW5kb3dXaXRoSUQ6ICh3aWQpIC0+XG5cbiAgICAgICAgdyA9IHdpbldpdGhJRCB3aWRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCB3P1xuICAgICAgICBpZiBub3Qgdy5pc1Zpc2libGUoKVxuICAgICAgICAgICAgdy5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdy5mb2N1cygpXG4gICAgICAgIHdcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24uc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICBzdGFja1dpbmRvd3M6IC0+XG4gICAgICAgIFxuICAgICAgICB7d2lkdGgsIGhlaWdodH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIHd3ID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICBmb3IgdyBpbiB3bFxuICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50ICh3aWR0aC13dykvMlxuICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgd3dcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IGhlaWdodFxuICAgICAgICBhY3RpdmVXaW4oKS5zaG93KClcblxuICAgIHdpbmRvd3NBcmVTdGFja2VkOiAtPlxuICAgICAgICBcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBlbXB0eSB3bFxuICAgICAgICBcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIGlmIHcuaXNGdWxsU2NyZWVuKClcbiAgICAgICAgICAgICAgICB3LnNldEZ1bGxTY3JlZW4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBib3VuZHMgPSB3bFswXS5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgd2wubGVuZ3RoID09IDEgYW5kIGJvdW5kcy53aWR0aCA9PSBAc2NyZWVuU2l6ZSgpLndpZHRoXG4gICAgICAgIFxuICAgICAgICBmb3Igd2kgaW4gWzEuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsIHdsW3dpXS5nZXRCb3VuZHMoKSwgYm91bmRzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgYXJyYW5nZVdpbmRvd3M6ID0+XG5cbiAgICAgICAgZGlzYWJsZVNuYXAgPSB0cnVlXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHsgd2lkdGgsIGhlaWdodCB9ID0gQHNjcmVlblNpemUoKVxuXG4gICAgICAgIGlmIG5vdCBAd2luZG93c0FyZVN0YWNrZWQoKVxuICAgICAgICAgICAgQHN0YWNrV2luZG93cygpXG4gICAgICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiB3bC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgd2xbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHdsWzBdLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgIHg6ICAgICAgMFxuICAgICAgICAgICAgICAgIHk6ICAgICAgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgd2lkdGhcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICBlbHNlIGlmIHdsLmxlbmd0aCA9PSAyIG9yIHdsLmxlbmd0aCA9PSAzXG4gICAgICAgICAgICB3ID0gd2lkdGgvd2wubGVuZ3RoXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGhcbiAgICAgICAgICAgIHcyID0gcGFyc2VJbnQgd2wubGVuZ3RoLzJcbiAgICAgICAgICAgIHJoID0gaGVpZ2h0XG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLncyXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC93MlxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgaSAqIHcgLSAoaSA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaSA9PSAwIG9yIGkgPT0gdzItMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICAgICAgZm9yIGkgaW4gW3cyLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC8od2wubGVuZ3RoLXcyKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgKGktdzIpICogdyAtIChpLXcyID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCByaC8yKzIzXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaS13MiA9PSAwIG9yIGkgPT0gd2wubGVuZ3RoLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgJ3Rlc3QnXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgbW92ZVdpbmRvd1N0YXNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBzdGFzaERpciA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJ1xuICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc3Rhc2hEaXJcbiAgICAgICAgICAgIGZzLm1vdmVTeW5jIHN0YXNoRGlyLCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBvdmVyd3JpdGU6IHRydWVcblxuICAgIHJlc3RvcmVXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMgQHVzZXJEYXRhXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVsaXN0KHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG1hdGNoRXh0Oidub29uJylcbiAgICAgICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgbmV3U3Rhc2ggPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbicgXCIje3dpbi5pZH0ubm9vblwiXG4gICAgICAgICAgICBmcy5jb3B5U3luYyBmaWxlLCBuZXdTdGFzaFxuXG4gICAgdG9nZ2xlV2luZG93RnJvbVRyYXk6ID0+IFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIHdpbnMoKVxuICAgICAgICAgICAgZm9yIHdpbiBpbiB3aW5zKClcbiAgICAgICAgICAgICAgICB3aW4uc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtb3ZlV2luZG93U3Rhc2hlcygpXG4gICAgICAgICAgICBAcmVzdG9yZVdpbmRvd3MoKVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgb25SZXNpemVXaW46IChldmVudCkgLT5cblxuICAgICAgICByZXR1cm4gaWYgZGlzYWJsZVNuYXBcbiAgICAgICAgZnJhbWVTaXplID0gNlxuICAgICAgICB3YiA9IGV2ZW50LnNlbmRlci5nZXRCb3VuZHMoKVxuICAgICAgICBcbiAgICAgICAga2xvZyAna28ubWFpbi5vblJlc2l6ZVdpbidcbiAgICAgICAgXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgY29udGludWUgaWYgdyA9PSBldmVudC5zZW5kZXJcbiAgICAgICAgICAgIGIgPSB3LmdldEJvdW5kcygpXG4gICAgICAgICAgICBpZiBiLmhlaWdodCA9PSB3Yi5oZWlnaHQgYW5kIGIueSA9PSB3Yi55XG4gICAgICAgICAgICAgICAgaWYgYi54IDwgd2IueFxuICAgICAgICAgICAgICAgICAgICBpZiBNYXRoLmFicyhiLngrYi53aWR0aC13Yi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICBiLnhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAgICAgIGIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgd2IueCAtIGIueCArIGZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYi5oZWlnaHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGIueCtiLndpZHRoID4gd2IueCt3Yi53aWR0aFxuICAgICAgICAgICAgICAgICAgICBpZiBNYXRoLmFicyh3Yi54K3diLndpZHRoLWIueCkgPCBXSU5fU05BUF9ESVNUXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICAgICAgd2IueCt3Yi53aWR0aC1mcmFtZVNpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAgICAgIGIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgYi54K2Iud2lkdGggLSAod2IueCt3Yi53aWR0aC1mcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcblxuICAgIGFjdGl2YXRlT25lV2luZG93OiAoY2IpIC0+XG4gICAgXG4gICAgICAgIGlmIGVtcHR5IHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIEB0b2dnbGVXaW5kb3dzIGNiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBub3QgYWN0aXZlV2luKClcbiAgICAgICAgICAgIGlmIHdpbiA9IHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICB3eHcgPSByZXF1aXJlICd3eHcnICAgXG4gICAgICAgICAgICAgICAgICAgIHd4dyAncmFpc2UnIHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzBdXG4gICAgICAgICAgICAgICAgd2luLmZvY3VzKClcbiAgICAgICAgICAgICAgICBjYiB3aW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjYiBudWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgIFxuICAgICAgICAgICAgICAgIHd4dyAncmFpc2UnIHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzBdXG4gICAgICAgICAgICBjYiB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICBcbiAgICBvbk90aGVySW5zdGFuY2U6IChhcmdzLCBkaXIpID0+XG5cbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZGlyOicgIGRpclxuICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBhcmdzOicgYXJnc1xuICAgICAgICBcbiAgICAgICAgQGFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG5cbiAgICAgICAgICAgIGZpbGVzID0gW11cbiAgICAgICAgICAgIGlmIGZpcnN0KGFyZ3MpPy5lbmRzV2l0aCBcIiN7cGtnLm5hbWV9LmV4ZVwiXG4gICAgICAgICAgICAgICAgZmlsZWFyZ3MgPSBhcmdzLnNsaWNlIDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMlxuICAgIFxuICAgICAgICAgICAgZm9yIGFyZyBpbiBmaWxlYXJnc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIGFyZy5zdGFydHNXaXRoICctJ1xuICAgICAgICAgICAgICAgIGZpbGUgPSBhcmdcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW4gc2xhc2gucmVzb2x2ZShkaXIpLCBhcmdcbiAgICAgICAgICAgICAgICBbZnBhdGgsIHBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3MgZmlsZVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmV4aXN0cyBmcGF0aFxuICAgICAgICAgICAgICAgICAgICBmaWxlcy5wdXNoIGZpbGVcbiAgICBcbiAgICAgICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGZpbGVzJyBmaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIGZpbGVzLCBuZXdUYWI6dHJ1ZVxuXG5cbiAgICByZWxvYWRXaW46ICh3aW5JRDosIGZpbGU6KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgd2luID0gd2luV2l0aElEIHdpbklEXG4gICAgICAgICAgICB3aW4ud2ViQ29udGVudHMucmVsb2FkSWdub3JpbmdDYWNoZSgpXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcXVpdDogPT5cblxuICAgICAgICB0b1NhdmUgPSB3aW5zKCkubGVuZ3RoXG5cbiAgICAgICAgaWYgdG9TYXZlXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnc2F2ZVN0YXNoJ1xuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcgPT5cbiAgICAgICAgICAgICAgICB0b1NhdmUgLT0gMVxuICAgICAgICAgICAgICAgIGlmIHRvU2F2ZSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5zdGF0ZS5zYXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGV4aXRBcHAoKVxuICAgICAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5lbGVjdHJvbi5hcHAub24gJ29wZW4tZmlsZScgKGV2ZW50LCBmaWxlKSAtPlxuXG4gICAgaWYgbm90IG1haW4/XG4gICAgICAgIG9wZW5GaWxlcy5wdXNoIGZpbGVcbiAgICBlbHNlXG4gICAgICAgIGlmIGVsZWN0cm9uLmFwcC5pc1JlYWR5KClcbiAgICAgICAgICAgIG1haW4uYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cbiAgICAgICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW2ZpbGVdIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxuICAgICAgICBcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbmVsZWN0cm9uLmFwcC5vbiAnd2luZG93LWFsbC1jbG9zZWQnIC0+IGxvZyAnd2luZG93LWFsbC1jbG9zZWQnXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgICAgICAgICBcblxub25VRFAgPSAoZmlsZSkgLT5cbiAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbZmlsZV0gXG5cbmtvUmVjZWl2ZXIgPSBuZXcgdWRwIHBvcnQ6OTc3OSwgb25Nc2c6b25VRFBcblxubWFpbiAgICAgICAgICA9IG5ldyBNYWluIG9wZW5GaWxlc1xubWFpbi5uYXZpZ2F0ZSA9IG5ldyBOYXZpZ2F0ZSBtYWluXG4iXX0=
//# sourceURL=../../coffee/main/main.coffee
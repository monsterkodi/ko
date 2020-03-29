// koffee 1.12.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Indexer, Main, Navigate, WIN_SNAP_DIST, _, activeWin, app, args, clipboard, dialog, disableSnap, electron, empty, filelist, first, fs, koReceiver, kolor, main, mostRecentFile, noon, onUDP, openFiles, pkg, post, prefs, ref, slash, store, udp, valid, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), _ = ref._, app = ref.app, args = ref.args, empty = ref.empty, filelist = ref.filelist, first = ref.first, fs = ref.fs, kolor = ref.kolor, noon = ref.noon, post = ref.post, prefs = ref.prefs, slash = ref.slash, store = ref.store, udp = ref.udp, valid = ref.valid, win = ref.win;

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
            dirs: ['../', '../browser', '../commandline', '../commands', '../editor', '../editor/actions', '../git', '../main', '../tools', '../win'],
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseVNBQUE7SUFBQTs7OztBQVFBLE1BQXdHLE9BQUEsQ0FBUSxLQUFSLENBQXhHLEVBQUUsU0FBRixFQUFLLGFBQUwsRUFBVSxlQUFWLEVBQWdCLGlCQUFoQixFQUF1Qix1QkFBdkIsRUFBaUMsaUJBQWpDLEVBQXdDLFdBQXhDLEVBQTRDLGlCQUE1QyxFQUFtRCxlQUFuRCxFQUF5RCxlQUF6RCxFQUErRCxpQkFBL0QsRUFBc0UsaUJBQXRFLEVBQTZFLGlCQUE3RSxFQUFvRixhQUFwRixFQUF5RixpQkFBekYsRUFBZ0c7O0FBS2hHLEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVQsc0NBQUYsRUFBaUIsOEJBQWpCLEVBQTRCOztBQUU1QixXQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUNoQixTQUFBLEdBQWdCOztBQUNoQixhQUFBLEdBQWdCOztBQUloQixjQUFBLEdBQWlCLFNBQUE7V0FBRyxLQUFBLENBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLENBQU47QUFBSDs7QUFRakIsSUFBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsYUFBZCxDQUFBLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsU0FBQyxDQUFELEVBQUcsQ0FBSDtlQUFTLENBQUMsQ0FBQyxFQUFGLEdBQU8sQ0FBQyxDQUFDO0lBQWxCLENBQW5DO0FBQUg7O0FBQ2QsU0FBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsZ0JBQWQsQ0FBQTtBQUFIOztBQUNkLFdBQUEsR0FBYyxTQUFBO0FBQUcsUUFBQTtBQUFD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UUFBSixDQUFhLElBQWIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBfLCBhcHAsIGFyZ3MsIGVtcHR5LCBmaWxlbGlzdCwgZmlyc3QsIGZzLCBrb2xvciwgbm9vbiwgcG9zdCwgcHJlZnMsIHNsYXNoLCBzdG9yZSwgdWRwLCB2YWxpZCwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cbiMgcG9zdC5kZWJ1ZygpXG4jIGxvZy5zbG9nLmRlYnVnID0gdHJ1ZVxuXG5wa2cgICAgICA9IHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbmVsZWN0cm9uID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbk5hdmlnYXRlID0gcmVxdWlyZSAnLi9uYXZpZ2F0ZSdcbkluZGV4ZXIgID0gcmVxdWlyZSAnLi9pbmRleGVyJ1xuXG57IEJyb3dzZXJXaW5kb3csIGNsaXBib2FyZCwgZGlhbG9nIH0gPSBlbGVjdHJvblxuXG5kaXNhYmxlU25hcCAgID0gZmFsc2Vcbm1haW4gICAgICAgICAgPSB1bmRlZmluZWRcbm9wZW5GaWxlcyAgICAgPSBbXVxuV0lOX1NOQVBfRElTVCA9IDE1MFxuXG4jIHByb2Nlc3MuZW52Lk5PREVfRU5WID0gJ3Byb2R1Y3Rpb24nICMgPz8/XG4gICAgXG5tb3N0UmVjZW50RmlsZSA9IC0+IGZpcnN0IHN0YXRlLmdldCAncmVjZW50RmlsZXMnXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5zICAgICAgICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLnNvcnQgKGEsYikgLT4gYS5pZCAtIGIuaWRcbmFjdGl2ZVdpbiAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRGb2N1c2VkV2luZG93KClcbnZpc2libGVXaW5zID0gLT4gKHcgZm9yIHcgaW4gd2lucygpIHdoZW4gdz8uaXNWaXNpYmxlKCkgYW5kIG5vdCB3Py5pc01pbmltaXplZCgpKVxuXG53aW5XaXRoSUQgICA9ICh3aW5JRCkgLT5cblxuICAgIHdpZCA9IHBhcnNlSW50IHdpbklEXG4gICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgIHJldHVybiB3IGlmIHcuaWQgPT0gd2lkXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbkdldCAnZGVidWdNb2RlJyAtPiBhcmdzLmRlYnVnXG5wb3N0Lm9uR2V0ICd3aW5JbmZvcycgIC0+IChpZDogdy5pZCBmb3IgdyBpbiB3aW5zKCkpXG5wb3N0Lm9uR2V0ICdsb2dTeW5jJyAgIC0+XG4gICAgY29uc29sZS5sb2cuYXBwbHkgY29uc29sZSwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG4gICAgcmV0dXJuIHRydWVcblxucG9zdC5vbiAndGhyb3dFcnJvcicgICAgICAgICAgICAgICAgIC0+IHRocm93IG5ldyBFcnJvciAnZXJyJ1xucG9zdC5vbiAnbmV3V2luZG93V2l0aEZpbGUnICAoZmlsZSkgIC0+IG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG5wb3N0Lm9uICdhY3RpdmF0ZVdpbmRvdycgICAgICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZVdpbmRvd1dpdGhJRCB3aW5JRFxucG9zdC5vbiAnYWN0aXZhdGVOZXh0V2luZG93JyAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVOZXh0V2luZG93IHdpbklEXG5wb3N0Lm9uICdhY3RpdmF0ZVByZXZXaW5kb3cnICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZVByZXZXaW5kb3cgd2luSURcblxucG9zdC5vbiAnbWVudUFjdGlvbicgICAoYWN0aW9uLCBhcmcpIC0+IG1haW4/Lm9uTWVudUFjdGlvbiBhY3Rpb24sIGFyZ1xucG9zdC5vbiAncGluZycgKHdpbklELCBhcmdBLCBhcmdCKSAtPiBwb3N0LnRvV2luIHdpbklELCAncG9uZycgJ21haW4nIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3dpbmxvZycgICAgICAgKHdpbklELCB0ZXh0KSAtPiBcbiAgICBpZiBhcmdzLnZlcmJvc2VcbiAgICAgICAgbG9nIFwiI3t3aW5JRH0+PiBcIiArIHRleHRcblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbmNsYXNzIE1haW4gZXh0ZW5kcyBhcHBcblxuICAgIEA6IChvcGVuRmlsZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBkaXJzOiAgICAgICBbJy4uLycgXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2Jyb3dzZXInICcuLi9jb21tYW5kbGluZScgJy4uL2NvbW1hbmRzJyAnLi4vZWRpdG9yJyAnLi4vZWRpdG9yL2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgICAgICAgJy4uL2dpdCcgJy4uL21haW4nICcuLi90b29scycgJy4uL3dpbiddXG4gICAgICAgICAgICBwa2c6ICAgICAgICBwa2dcbiAgICAgICAgICAgIHNob3J0Y3V0OiAgICdBbHQrRjEnXG4gICAgICAgICAgICBpbmRleDogICAgICAnLi4vaW5kZXguaHRtbCdcbiAgICAgICAgICAgIGljb246ICAgICAgICcuLi8uLi9pbWcvYXBwLmljbydcbiAgICAgICAgICAgIHRyYXk6ICAgICAgICcuLi8uLi9pbWcvbWVudUAyeC5wbmcnXG4gICAgICAgICAgICBhYm91dDogICAgICAnLi4vLi4vaW1nL2Fib3V0LnBuZydcbiAgICAgICAgICAgIGFib3V0RGVidWc6IGZhbHNlXG4gICAgICAgICAgICBvblNob3c6ICAgICAtPiBtYWluLm9uU2hvdygpXG4gICAgICAgICAgICBvbk90aGVySW5zdGFuY2U6IChhcmdzLCBkaXIpIC0+IG1haW4ub25PdGhlckluc3RhbmNlIGFyZ3MsIGRpclxuICAgICAgICAgICAgd2lkdGg6ICAgICAgMTAwMFxuICAgICAgICAgICAgaGVpZ2h0OiAgICAgMTAwMFxuICAgICAgICAgICAgbWluV2lkdGg6ICAgMjQwXG4gICAgICAgICAgICBtaW5IZWlnaHQ6ICAyMzBcbiAgICAgICAgICAgIGFyZ3M6IFwiXCJcIlxuICAgICAgICAgICAgICAgIGZpbGVsaXN0ICBmaWxlcyB0byBvcGVuICAgICAgICAgICAqKlxuICAgICAgICAgICAgICAgIHByZWZzICAgICBzaG93IHByZWZlcmVuY2VzICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIG5vcHJlZnMgICBkb24ndCBsb2FkIHByZWZlcmVuY2VzICBmYWxzZVxuICAgICAgICAgICAgICAgIHN0YXRlICAgICBzaG93IHN0YXRlICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIG5vc3RhdGUgICBkb24ndCBsb2FkIHN0YXRlICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIHZlcmJvc2UgICBsb2cgbW9yZSAgICAgICAgICAgICAgICBmYWxzZVxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgIEBvcHQub25RdWl0ID0gQHF1aXRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgcHJvY2Vzcy5jd2QoKSA9PSAnLydcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgc2xhc2gucmVzb2x2ZSAnfidcbiAgICAgICAgICAgIFxuICAgICAgICB3aGlsZSB2YWxpZChhcmdzLmZpbGVsaXN0KSBhbmQgc2xhc2guZGlyRXhpc3RzIGZpcnN0IGFyZ3MuZmlsZWxpc3RcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgYXJncy5maWxlbGlzdC5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBpZiBhcmdzLnZlcmJvc2VcbiAgICAgICAgICAgIGxvZyBrb2xvci53aGl0ZSBrb2xvci5ib2xkIFwiXFxua29cIiwga29sb3IuZ3JheSBcInYje3BrZy52ZXJzaW9ufVxcblwiXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkge2N3ZDogcHJvY2Vzcy5jd2QoKX0sIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cga29sb3IueWVsbG93IGtvbG9yLmJvbGQgJ1xcbmFyZ3MnXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgYXJncywgY29sb3JzOnRydWVcbiAgICAgICAgICAgIGxvZyAnJ1xuXG4gICAgICAgIGdsb2JhbC5zdGF0ZSA9IG5ldyBzdG9yZSAnc3RhdGUnIHNlcGFyYXRvcjogJ3wnXG5cbiAgICAgICAgYWxpYXMgPSBuZXcgc3RvcmUgJ2FsaWFzJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBhcmdzLnN0YXRlXG4gICAgICAgICAgICBsb2cga29sb3IueWVsbG93IGtvbG9yLmJvbGQgJ3N0YXRlJ1xuICAgICAgICAgICAgbG9nIGtvbG9yLmdyZWVuIGtvbG9yLmJvbGQgJ3N0YXRlIGZpbGU6JyBnbG9iYWwuc3RhdGUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGdsb2JhbC5zdGF0ZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIEBpbmRleGVyID0gbmV3IEluZGV4ZXJcblxuICAgICAgICBpZiBub3Qgb3BlbkZpbGVzLmxlbmd0aCBhbmQgdmFsaWQgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgb3BlbkZpbGVzID0gZmlsZWxpc3QgYXJncy5maWxlbGlzdCwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ3JlbG9hZFdpbicgQHJlbG9hZFdpblxuICAgICAgICBcbiAgICAgICAgQG9wZW5GaWxlcyA9IG9wZW5GaWxlc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgIFxuICAgIG9uU2hvdzogPT5cblxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcbiAgICAgICAgXG4gICAgICAgIEBvcHQud2lkdGggID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIEBvcHQuaGVpZ2h0ID0gaGVpZ2h0XG4gICAgICBcbiAgICAgICAgaWYgYXJncy5wcmVmc1xuICAgICAgICAgICAgbG9nIGtvbG9yLnllbGxvdyBrb2xvci5ib2xkICdwcmVmcydcbiAgICAgICAgICAgIGxvZyBrb2xvci5ncmVlbiBrb2xvci5ib2xkIHByZWZzLnN0b3JlPy5maWxlXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgcHJlZnMuc3RvcmU/LmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAb3BlbkZpbGVzXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBAb3BlbkZpbGVzXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxuICAgICAgICAgICAgZGVsZXRlIEBvcGVuRmlsZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKCkgaWYgbm90IGFyZ3Mubm9zdGF0ZVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHdpbnMoKS5sZW5ndGhcbiAgICAgICAgICAgIGlmIHJlY2VudCA9IG1vc3RSZWNlbnRGaWxlKClcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpyZWNlbnQgXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhFbXB0eSgpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uTWVudUFjdGlvbjogKGFjdGlvbiwgYXJnKSA9PlxuXG4gICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgIHRoZW4gQGFjdGl2YXRlTmV4dFdpbmRvdyBhcmdcbiAgICAgICAgICAgIHdoZW4gJ0FycmFuZ2UgV2luZG93cycgIHRoZW4gQGFycmFuZ2VXaW5kb3dzKClcbiAgICAgICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgIHRoZW4gQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwXG5cbiAgICB3aW5zOiAgICAgICAgd2lucygpXG4gICAgd2luV2l0aElEOiAgIHdpbldpdGhJRFxuICAgIGFjdGl2ZVdpbjogICBhY3RpdmVXaW5cbiAgICB2aXNpYmxlV2luczogdmlzaWJsZVdpbnNcblxuICAgIGNyZWF0ZVdpbmRvd1dpdGhGaWxlOiAob3B0KSAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbb3B0LmZpbGVdXG4gICAgICAgIHdpblxuXG4gICAgY3JlYXRlV2luZG93V2l0aEVtcHR5OiAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnbmV3RW1wdHlUYWInXG4gICAgICAgIHdpblxuICAgICAgICBcbiAgICB0b2dnbGVXaW5kb3dzOiAoY2IpID0+XG5cbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgICAgICAgICBAaGlkZVdpbmRvd3MoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHJhaXNlV2luZG93cygpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHNob3dXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNiIGZpcnN0IHZpc2libGVXaW5zKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNyZWF0ZVdpbmRvdyBjYlxuXG4gICAgaGlkZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LmhpZGUoKVxuICAgICAgICAgICAgQGhpZGVEb2NrKClcbiAgICAgICAgQFxuXG4gICAgc2hvd1dpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LnNob3coKVxuICAgICAgICAgICAgQHNob3dEb2NrKClcbiAgICAgICAgQFxuXG4gICAgcmFpc2VXaW5kb3dzOiAtPlxuXG4gICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIGZvciB3IGluIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLmZvY3VzKClcbiAgICAgICAgQFxuXG4gICAgYWN0aXZhdGVOZXh0V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IDEgKyBhbGxXaW5kb3dzLmluZGV4T2Ygd1xuICAgICAgICAgICAgICAgIGkgPSAwIGlmIGkgPj0gYWxsV2luZG93cy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlUHJldldpbmRvdzogKHdpbikgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyIHdpbiB0aGVuIHdpbiA9IHdpbldpdGhJRCB3aW5cbiAgICAgICAgYWxsV2luZG93cyA9IHdpbnMoKVxuICAgICAgICBmb3IgdyBpbiBhbGxXaW5kb3dzXG4gICAgICAgICAgICBpZiB3ID09IHdpblxuICAgICAgICAgICAgICAgIGkgPSAtMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IGFsbFdpbmRvd3MubGVuZ3RoLTEgaWYgaSA8IDBcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlV2luZG93V2l0aElEOiAod2lkKSAtPlxuXG4gICAgICAgIHcgPSB3aW5XaXRoSUQgd2lkXG4gICAgICAgIHJldHVybiBpZiBub3Qgdz9cbiAgICAgICAgaWYgbm90IHcuaXNWaXNpYmxlKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHcuZm9jdXMoKVxuICAgICAgICB3XG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgc3RhY2tXaW5kb3dzOiAtPlxuICAgICAgICBcbiAgICAgICAge3dpZHRoLCBoZWlnaHR9ID0gQHNjcmVlblNpemUoKVxuICAgICAgICB3dyA9IGhlaWdodCArIDEyMlxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCAod2lkdGgtd3cpLzJcbiAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHd3XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgYWN0aXZlV2luKCkuc2hvdygpXG5cbiAgICB3aW5kb3dzQXJlU3RhY2tlZDogLT5cbiAgICAgICAgXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgZW1wdHkgd2xcbiAgICAgICAgXG4gICAgICAgIGZvciB3IGluIHdsXG4gICAgICAgICAgICBpZiB3LmlzRnVsbFNjcmVlbigpXG4gICAgICAgICAgICAgICAgdy5zZXRGdWxsU2NyZWVuIGZhbHNlIFxuICAgICAgICBcbiAgICAgICAgYm91bmRzID0gd2xbMF0uZ2V0Qm91bmRzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHdsLmxlbmd0aCA9PSAxIGFuZCBib3VuZHMud2lkdGggPT0gQHNjcmVlblNpemUoKS53aWR0aFxuICAgICAgICBcbiAgICAgICAgZm9yIHdpIGluIFsxLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbCB3bFt3aV0uZ2V0Qm91bmRzKCksIGJvdW5kc1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGFycmFuZ2VXaW5kb3dzOiA9PlxuXG4gICAgICAgIGRpc2FibGVTbmFwID0gdHJ1ZVxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcblxuICAgICAgICBpZiBub3QgQHdpbmRvd3NBcmVTdGFja2VkKClcbiAgICAgICAgICAgIEBzdGFja1dpbmRvd3MoKVxuICAgICAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgd2wubGVuZ3RoID09IDFcbiAgICAgICAgICAgIHdsWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB3bFswXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIDBcbiAgICAgICAgICAgICAgICB5OiAgICAgIDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHdpZHRoXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGggPT0gMiBvciB3bC5sZW5ndGggPT0gM1xuICAgICAgICAgICAgdyA9IHdpZHRoL3dsLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCBpICogdyAtIChpID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpID09IDAgb3IgaSA9PSB3bC5sZW5ndGgtMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgaGVpZ2h0XG4gICAgICAgIGVsc2UgaWYgd2wubGVuZ3RoXG4gICAgICAgICAgICB3MiA9IHBhcnNlSW50IHdsLmxlbmd0aC8yXG4gICAgICAgICAgICByaCA9IGhlaWdodFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53Ml1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvdzJcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHcyLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgICAgIGZvciBpIGluIFt3Mi4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvKHdsLmxlbmd0aC13MilcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IChpLXcyKSAqIHcgLSAoaS13MiA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgcmgvMisyM1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGktdzIgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICd0ZXN0J1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG1vdmVXaW5kb3dTdGFzaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgc3Rhc2hEaXIgPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbidcbiAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHN0YXNoRGlyXG4gICAgICAgICAgICBmcy5tb3ZlU3luYyBzdGFzaERpciwgc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgb3ZlcndyaXRlOiB0cnVlXG5cbiAgICByZXN0b3JlV2luZG93czogLT5cblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jIEB1c2VyRGF0YVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBtYXRjaEV4dDonbm9vbicpXG4gICAgICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIG5ld1N0YXNoID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nIFwiI3t3aW4uaWR9Lm5vb25cIlxuICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcblxuICAgIHRvZ2dsZVdpbmRvd0Zyb21UcmF5OiA9PiBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIGZvciB3aW4gaW4gd2lucygpXG4gICAgICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uUmVzaXplV2luOiAoZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGRpc2FibGVTbmFwXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2IgPSBldmVudC5zZW5kZXIuZ2V0Qm91bmRzKClcbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiB3ID09IGV2ZW50LnNlbmRlclxuICAgICAgICAgICAgYiA9IHcuZ2V0Qm91bmRzKClcbiAgICAgICAgICAgIGlmIGIuaGVpZ2h0ID09IHdiLmhlaWdodCBhbmQgYi55ID09IHdiLnlcbiAgICAgICAgICAgICAgICBpZiBiLnggPCB3Yi54XG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKGIueCtiLndpZHRoLXdiLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIGIueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICB3Yi54IC0gYi54ICsgZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgYi54K2Iud2lkdGggPiB3Yi54K3diLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKHdiLngrd2Iud2lkdGgtYi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICB3Yi54K3diLndpZHRoLWZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBiLngrYi53aWR0aCAtICh3Yi54K3diLndpZHRoLWZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuXG4gICAgYWN0aXZhdGVPbmVXaW5kb3c6IChjYikgLT5cbiAgICBcbiAgICAgICAgaWYgZW1wdHkgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgQHRvZ2dsZVdpbmRvd3MgY2JcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIG5vdCBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgaWYgd2luID0gdmlzaWJsZVdpbnMoKVswXVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dycgICBcbiAgICAgICAgICAgICAgICAgICAgd3h3ICdyYWlzZScgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMF1cbiAgICAgICAgICAgICAgICB3aW4uZm9jdXMoKVxuICAgICAgICAgICAgICAgIGNiIHdpblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNiIG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICB3eHcgPSByZXF1aXJlICd3eHcnICAgXG4gICAgICAgICAgICAgICAgd3h3ICdyYWlzZScgc2xhc2gucmVzb2x2ZSBwcm9jZXNzLmFyZ3ZbMF1cbiAgICAgICAgICAgIGNiIHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgIFxuICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgPT5cblxuICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBkaXI6JyAgZGlyXG4gICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGFyZ3M6JyBhcmdzXG4gICAgICAgIFxuICAgICAgICBAYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cblxuICAgICAgICAgICAgZmlsZXMgPSBbXVxuICAgICAgICAgICAgaWYgZmlyc3QoYXJncyk/LmVuZHNXaXRoIFwiI3twa2cubmFtZX0uZXhlXCJcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZpbGVhcmdzID0gYXJncy5zbGljZSAyXG4gICAgXG4gICAgICAgICAgICBmb3IgYXJnIGluIGZpbGVhcmdzXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgYXJnLnN0YXJ0c1dpdGggJy0nXG4gICAgICAgICAgICAgICAgZmlsZSA9IGFyZ1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guam9pbiBzbGFzaC5yZXNvbHZlKGRpciksIGFyZ1xuICAgICAgICAgICAgICAgIFtmcGF0aCwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBmaWxlXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guZXhpc3RzIGZwYXRoXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2ggZmlsZVxuICAgIFxuICAgICAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZmlsZXMnIGZpbGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgZmlsZXMsIG5ld1RhYjp0cnVlXG5cblxuICAgIHJlbG9hZFdpbjogKHdpbklEOiwgZmlsZTopID0+XG4gICAgICAgIFxuICAgICAgICBpZiB3aW4gPSB3aW5XaXRoSUQgd2luSURcbiAgICAgICAgICAgIHdpbi53ZWJDb250ZW50cy5yZWxvYWRJZ25vcmluZ0NhY2hlKClcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBmaWxlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMCAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBxdWl0OiA9PlxuXG4gICAgICAgIHRvU2F2ZSA9IHdpbnMoKS5sZW5ndGhcblxuICAgICAgICBpZiB0b1NhdmVcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdzYXZlU3Rhc2gnXG4gICAgICAgICAgICBwb3N0Lm9uICdzdGFzaFNhdmVkJyA9PlxuICAgICAgICAgICAgICAgIHRvU2F2ZSAtPSAxXG4gICAgICAgICAgICAgICAgaWYgdG9TYXZlID09IDBcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgICAgICAgICBAZXhpdEFwcCgpXG4gICAgICAgICAgICAnZGVsYXknXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGdsb2JhbC5zdGF0ZS5zYXZlKClcbiAgICAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuZWxlY3Ryb24uYXBwLm9uICdvcGVuLWZpbGUnIChldmVudCwgZmlsZSkgLT5cblxuICAgIGlmIG5vdCBtYWluP1xuICAgICAgICBvcGVuRmlsZXMucHVzaCBmaWxlXG4gICAgZWxzZVxuICAgICAgICBpZiBlbGVjdHJvbi5hcHAuaXNSZWFkeSgpXG4gICAgICAgICAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIFtmaWxlXSBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWFpbi5jcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbiAgICAgICAgXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG5lbGVjdHJvbi5hcHAub24gJ3dpbmRvdy1hbGwtY2xvc2VkJyAtPiBsb2cgJ3dpbmRvdy1hbGwtY2xvc2VkJ1xuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAgICAgICAgXG5cbm9uVURQID0gKGZpbGUpIC0+XG4gICAgbWFpbi5hY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW2ZpbGVdIFxuXG5rb1JlY2VpdmVyID0gbmV3IHVkcCBwb3J0Ojk3NzksIG9uTXNnOm9uVURQXG5cbm1haW4gICAgICAgICAgPSBuZXcgTWFpbiBvcGVuRmlsZXNcbm1haW4ubmF2aWdhdGUgPSBuZXcgTmF2aWdhdGUgbWFpblxuIl19
//# sourceURL=../../coffee/main/main.coffee
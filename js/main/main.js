// koffee 1.11.0

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

ref = require('kxk'), _ = ref._, app = ref.app, args = ref.args, colors = ref.colors, empty = ref.empty, filelist = ref.filelist, first = ref.first, fs = ref.fs, noon = ref.noon, post = ref.post, prefs = ref.prefs, slash = ref.slash, store = ref.store, udp = ref.udp, valid = ref.valid, win = ref.win;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvbWFpbiIsInNvdXJjZXMiOlsibWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMFNBQUE7SUFBQTs7OztBQVFBLE1BQXlHLE9BQUEsQ0FBUSxLQUFSLENBQXpHLEVBQUUsU0FBRixFQUFLLGFBQUwsRUFBVSxlQUFWLEVBQWdCLG1CQUFoQixFQUF3QixpQkFBeEIsRUFBK0IsdUJBQS9CLEVBQXlDLGlCQUF6QyxFQUFnRCxXQUFoRCxFQUFvRCxlQUFwRCxFQUEwRCxlQUExRCxFQUFnRSxpQkFBaEUsRUFBdUUsaUJBQXZFLEVBQThFLGlCQUE5RSxFQUFxRixhQUFyRixFQUEwRixpQkFBMUYsRUFBaUc7O0FBS2pHLEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVQsc0NBQUYsRUFBaUIsOEJBQWpCLEVBQTRCOztBQUU1QixXQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUNoQixTQUFBLEdBQWdCOztBQUNoQixhQUFBLEdBQWdCOztBQUloQixjQUFBLEdBQWlCLFNBQUE7V0FBRyxLQUFBLENBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLENBQU47QUFBSDs7QUFRakIsSUFBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsYUFBZCxDQUFBLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsU0FBQyxDQUFELEVBQUcsQ0FBSDtlQUFTLENBQUMsQ0FBQyxFQUFGLEdBQU8sQ0FBQyxDQUFDO0lBQWxCLENBQW5DO0FBQUg7O0FBQ2QsU0FBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsZ0JBQWQsQ0FBQTtBQUFIOztBQUNkLFdBQUEsR0FBYyxTQUFBO0FBQUcsUUFBQTtBQUFD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MCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgYXBwLCBhcmdzLCBjb2xvcnMsIGVtcHR5LCBmaWxlbGlzdCwgZmlyc3QsIGZzLCBub29uLCBwb3N0LCBwcmVmcywgc2xhc2gsIHN0b3JlLCB1ZHAsIHZhbGlkLCB3aW4gfSA9IHJlcXVpcmUgJ2t4aydcblxuIyBwb3N0LmRlYnVnKClcbiMgbG9nLnNsb2cuZGVidWcgPSB0cnVlXG5cbnBrZyAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcblxuTmF2aWdhdGUgPSByZXF1aXJlICcuL25hdmlnYXRlJ1xuSW5kZXhlciAgPSByZXF1aXJlICcuL2luZGV4ZXInXG5cbnsgQnJvd3NlcldpbmRvdywgY2xpcGJvYXJkLCBkaWFsb2cgfSA9IGVsZWN0cm9uXG5cbmRpc2FibGVTbmFwICAgPSBmYWxzZVxubWFpbiAgICAgICAgICA9IHVuZGVmaW5lZFxub3BlbkZpbGVzICAgICA9IFtdXG5XSU5fU05BUF9ESVNUID0gMTUwXG5cbiMgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPSAncHJvZHVjdGlvbicgIyA/Pz9cbiAgICBcbm1vc3RSZWNlbnRGaWxlID0gLT4gZmlyc3Qgc3RhdGUuZ2V0ICdyZWNlbnRGaWxlcydcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbnMgICAgICAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuc29ydCAoYSxiKSAtPiBhLmlkIC0gYi5pZFxuYWN0aXZlV2luICAgPSAtPiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKVxudmlzaWJsZVdpbnMgPSAtPiAodyBmb3IgdyBpbiB3aW5zKCkgd2hlbiB3Py5pc1Zpc2libGUoKSBhbmQgbm90IHc/LmlzTWluaW1pemVkKCkpXG5cbndpbldpdGhJRCAgID0gKHdpbklEKSAtPlxuXG4gICAgd2lkID0gcGFyc2VJbnQgd2luSURcbiAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgcmV0dXJuIHcgaWYgdy5pZCA9PSB3aWRcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uR2V0ICdkZWJ1Z01vZGUnIC0+IGFyZ3MuZGVidWdcbnBvc3Qub25HZXQgJ3dpbkluZm9zJyAgLT4gKGlkOiB3LmlkIGZvciB3IGluIHdpbnMoKSlcbnBvc3Qub25HZXQgJ2xvZ1N5bmMnICAgLT5cbiAgICBjb25zb2xlLmxvZy5hcHBseSBjb25zb2xlLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcbiAgICByZXR1cm4gdHJ1ZVxuXG5wb3N0Lm9uICd0aHJvd0Vycm9yJyAgICAgICAgICAgICAgICAgLT4gdGhyb3cgbmV3IEVycm9yICdlcnInXG5wb3N0Lm9uICduZXdXaW5kb3dXaXRoRmlsZScgIChmaWxlKSAgLT4gbWFpbi5jcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbnBvc3Qub24gJ2FjdGl2YXRlV2luZG93JyAgICAgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlV2luZG93V2l0aElEIHdpbklEXG5wb3N0Lm9uICdhY3RpdmF0ZU5leHRXaW5kb3cnICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZU5leHRXaW5kb3cgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlUHJldldpbmRvdycgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlUHJldldpbmRvdyB3aW5JRFxuXG5wb3N0Lm9uICdtZW51QWN0aW9uJyAgIChhY3Rpb24sIGFyZykgLT4gbWFpbj8ub25NZW51QWN0aW9uIGFjdGlvbiwgYXJnXG5wb3N0Lm9uICdwaW5nJyAod2luSUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd2luSUQsICdwb25nJyAnbWFpbicgYXJnQSwgYXJnQlxucG9zdC5vbiAnd2lubG9nJyAgICAgICAod2luSUQsIHRleHQpIC0+IFxuICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICBsb2cgXCIje3dpbklEfT4+IFwiICsgdGV4dFxuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgQDogKG9wZW5GaWxlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIGRpcnM6ICAgICAgIFsnLi4vJyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAnLi4vYnJvd3NlcicgJy4uL2NvbW1hbmRsaW5lJyAnLi4vY29tbWFuZHMnICcuLi9lZGl0b3InICcuLi9lZGl0b3IvYWN0aW9ucydcbiAgICAgICAgICAgICAgICAgICAgICAgICAnLi4vZ2l0JyAnLi4vbWFpbicgJy4uL3Rvb2xzJyAnLi4vd2luJ11cbiAgICAgICAgICAgIHBrZzogICAgICAgIHBrZ1xuICAgICAgICAgICAgc2hvcnRjdXQ6ICAgJ0FsdCtGMSdcbiAgICAgICAgICAgIGluZGV4OiAgICAgICcuLi9pbmRleC5odG1sJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgJy4uLy4uL2ltZy9hcHAuaWNvJ1xuICAgICAgICAgICAgdHJheTogICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIGFib3V0OiAgICAgICcuLi8uLi9pbWcvYWJvdXQucG5nJ1xuICAgICAgICAgICAgYWJvdXREZWJ1ZzogZmFsc2VcbiAgICAgICAgICAgIG9uU2hvdzogICAgIC0+IG1haW4ub25TaG93KClcbiAgICAgICAgICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgLT4gbWFpbi5vbk90aGVySW5zdGFuY2UgYXJncywgZGlyXG4gICAgICAgICAgICB3aWR0aDogICAgICAxMDAwXG4gICAgICAgICAgICBoZWlnaHQ6ICAgICAxMDAwXG4gICAgICAgICAgICBtaW5XaWR0aDogICAyNDBcbiAgICAgICAgICAgIG1pbkhlaWdodDogIDIzMFxuICAgICAgICAgICAgYXJnczogXCJcIlwiXG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgIGZpbGVzIHRvIG9wZW4gICAgICAgICAgICoqXG4gICAgICAgICAgICAgICAgcHJlZnMgICAgIHNob3cgcHJlZmVyZW5jZXMgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9wcmVmcyAgIGRvbid0IGxvYWQgcHJlZmVyZW5jZXMgIGZhbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUgICAgIHNob3cgc3RhdGUgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9zdGF0ZSAgIGRvbid0IGxvYWQgc3RhdGUgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgdmVyYm9zZSAgIGxvZyBtb3JlICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wdC5vblF1aXQgPSBAcXVpdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBwcm9jZXNzLmN3ZCgpID09ICcvJ1xuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgXG4gICAgICAgIHdoaWxlIHZhbGlkKGFyZ3MuZmlsZWxpc3QpIGFuZCBzbGFzaC5kaXJFeGlzdHMgZmlyc3QgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBhcmdzLmZpbGVsaXN0LnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy53aGl0ZS5ib2xkIFwiXFxua29cIiwgY29sb3JzLmdyYXkgXCJ2I3twa2cudmVyc2lvbn1cXG5cIlxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHtjd2Q6IHByb2Nlc3MuY3dkKCl9LCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAnXFxuYXJncydcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBhcmdzLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nICcnXG5cbiAgICAgICAgZ2xvYmFsLnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOiAnfCdcblxuICAgICAgICBhbGlhcyA9IG5ldyBzdG9yZSAnYWxpYXMnXG4gICAgICAgIFxuICAgICAgICBpZiBhcmdzLnByZWZzXG4gICAgICAgICAgICBsb2cgY29sb3JzLnllbGxvdy5ib2xkICdwcmVmcydcbiAgICAgICAgICAgIGxvZyBjb2xvcnMuZ3JlZW4uYm9sZCAncHJlZnMgZmlsZTonIHByZWZzLnN0b3JlLmZpbGVcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBwcmVmcy5zdG9yZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgYXJncy5zdGF0ZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAnc3RhdGUnXG4gICAgICAgICAgICBsb2cgY29sb3JzLmdyZWVuLmJvbGQgJ3N0YXRlIGZpbGU6JyBnbG9iYWwuc3RhdGUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGdsb2JhbC5zdGF0ZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIEBpbmRleGVyID0gbmV3IEluZGV4ZXJcblxuICAgICAgICBpZiBub3Qgb3BlbkZpbGVzLmxlbmd0aCBhbmQgdmFsaWQgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgb3BlbkZpbGVzID0gZmlsZWxpc3QgYXJncy5maWxlbGlzdCwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ3JlbG9hZFdpbicgQHJlbG9hZFdpblxuICAgICAgICBcbiAgICAgICAgQG9wZW5GaWxlcyA9IG9wZW5GaWxlc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgIFxuICAgIG9uU2hvdzogPT5cblxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcbiAgICAgICAgXG4gICAgICAgIEBvcHQud2lkdGggID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIEBvcHQuaGVpZ2h0ID0gaGVpZ2h0XG4gICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQG9wZW5GaWxlc1xuICAgICAgICAgICAgZm9yIGZpbGUgaW4gQG9wZW5GaWxlc1xuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAb3BlbkZpbGVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpIGlmIG5vdCBhcmdzLm5vc3RhdGVcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCB3aW5zKCkubGVuZ3RoXG4gICAgICAgICAgICBpZiByZWNlbnQgPSBtb3N0UmVjZW50RmlsZSgpXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6cmVjZW50IFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRW1wdHkoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChhY3Rpb24sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyAgICB0aGVuIEBhY3RpdmF0ZU5leHRXaW5kb3cgYXJnXG4gICAgICAgICAgICB3aGVuICdBcnJhbmdlIFdpbmRvd3MnICB0aGVuIEBhcnJhbmdlV2luZG93cygpXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICB0aGVuIEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMFxuXG4gICAgd2luczogICAgICAgIHdpbnMoKVxuICAgIHdpbldpdGhJRDogICB3aW5XaXRoSURcbiAgICBhY3RpdmVXaW46ICAgYWN0aXZlV2luXG4gICAgdmlzaWJsZVdpbnM6IHZpc2libGVXaW5zXG5cbiAgICBjcmVhdGVXaW5kb3dXaXRoRmlsZTogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3cgKHdpbikgLT4gXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgW29wdC5maWxlXVxuICAgICAgICB3aW5cblxuICAgIGNyZWF0ZVdpbmRvd1dpdGhFbXB0eTogLT5cbiAgICAgICAgXG4gICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3cgKHdpbikgLT4gXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ25ld0VtcHR5VGFiJ1xuICAgICAgICB3aW5cbiAgICAgICAgXG4gICAgdG9nZ2xlV2luZG93czogKGNiKSA9PlxuXG4gICAgICAgIGlmIHZhbGlkIHdpbnMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgYWN0aXZlV2luKClcbiAgICAgICAgICAgICAgICAgICAgQGhpZGVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEByYWlzZVdpbmRvd3MoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBzaG93V2luZG93cygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjYiBmaXJzdCB2aXNpYmxlV2lucygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjcmVhdGVXaW5kb3cgY2JcblxuICAgIGhpZGVXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgdy5oaWRlKClcbiAgICAgICAgICAgIEBoaWRlRG9jaygpXG4gICAgICAgIEBcblxuICAgIHNob3dXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgdy5zaG93KClcbiAgICAgICAgICAgIEBzaG93RG9jaygpXG4gICAgICAgIEBcblxuICAgIHJhaXNlV2luZG93czogLT5cblxuICAgICAgICBpZiB2YWxpZCB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICBmb3IgdyBpbiB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdmlzaWJsZVdpbnMoKVswXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdmlzaWJsZVdpbnMoKVswXS5mb2N1cygpXG4gICAgICAgIEBcblxuICAgIGFjdGl2YXRlTmV4dFdpbmRvdzogKHdpbikgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyIHdpbiB0aGVuIHdpbiA9IHdpbldpdGhJRCB3aW5cbiAgICAgICAgYWxsV2luZG93cyA9IHdpbnMoKVxuICAgICAgICBmb3IgdyBpbiBhbGxXaW5kb3dzXG4gICAgICAgICAgICBpZiB3ID09IHdpblxuICAgICAgICAgICAgICAgIGkgPSAxICsgYWxsV2luZG93cy5pbmRleE9mIHdcbiAgICAgICAgICAgICAgICBpID0gMCBpZiBpID49IGFsbFdpbmRvd3MubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGFjdGl2YXRlV2luZG93V2l0aElEIGFsbFdpbmRvd3NbaV0uaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gd1xuICAgICAgICBudWxsXG5cbiAgICBhY3RpdmF0ZVByZXZXaW5kb3c6ICh3aW4pIC0+XG5cbiAgICAgICAgaWYgXy5pc051bWJlciB3aW4gdGhlbiB3aW4gPSB3aW5XaXRoSUQgd2luXG4gICAgICAgIGFsbFdpbmRvd3MgPSB3aW5zKClcbiAgICAgICAgZm9yIHcgaW4gYWxsV2luZG93c1xuICAgICAgICAgICAgaWYgdyA9PSB3aW5cbiAgICAgICAgICAgICAgICBpID0gLTEgKyBhbGxXaW5kb3dzLmluZGV4T2Ygd1xuICAgICAgICAgICAgICAgIGkgPSBhbGxXaW5kb3dzLmxlbmd0aC0xIGlmIGkgPCAwXG4gICAgICAgICAgICAgICAgQGFjdGl2YXRlV2luZG93V2l0aElEIGFsbFdpbmRvd3NbaV0uaWRcbiAgICAgICAgICAgICAgICByZXR1cm4gd1xuICAgICAgICBudWxsXG5cbiAgICBhY3RpdmF0ZVdpbmRvd1dpdGhJRDogKHdpZCkgLT5cblxuICAgICAgICB3ID0gd2luV2l0aElEIHdpZFxuICAgICAgICByZXR1cm4gaWYgbm90IHc/XG4gICAgICAgIGlmIG5vdCB3LmlzVmlzaWJsZSgpXG4gICAgICAgICAgICB3LnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3LmZvY3VzKClcbiAgICAgICAgd1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBzY3JlZW5TaXplOiAtPiBlbGVjdHJvbi5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemVcblxuICAgIHN0YWNrV2luZG93czogLT5cbiAgICAgICAgXG4gICAgICAgIHt3aWR0aCwgaGVpZ2h0fSA9IEBzY3JlZW5TaXplKClcbiAgICAgICAgd3cgPSBoZWlnaHQgKyAxMjJcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIGZvciB3IGluIHdsXG4gICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgKHdpZHRoLXd3KS8yXG4gICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3d1xuICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgaGVpZ2h0XG4gICAgICAgIGFjdGl2ZVdpbigpLnNob3coKVxuXG4gICAgd2luZG93c0FyZVN0YWNrZWQ6IC0+XG4gICAgICAgIFxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGVtcHR5IHdsXG4gICAgICAgIFxuICAgICAgICBmb3IgdyBpbiB3bFxuICAgICAgICAgICAgaWYgdy5pc0Z1bGxTY3JlZW4oKVxuICAgICAgICAgICAgICAgIHcuc2V0RnVsbFNjcmVlbiBmYWxzZSBcbiAgICAgICAgXG4gICAgICAgIGJvdW5kcyA9IHdsWzBdLmdldEJvdW5kcygpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiB3bC5sZW5ndGggPT0gMSBhbmQgYm91bmRzLndpZHRoID09IEBzY3JlZW5TaXplKCkud2lkdGhcbiAgICAgICAgXG4gICAgICAgIGZvciB3aSBpbiBbMS4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIG5vdCBfLmlzRXF1YWwgd2xbd2ldLmdldEJvdW5kcygpLCBib3VuZHNcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBhcnJhbmdlV2luZG93czogPT5cblxuICAgICAgICBkaXNhYmxlU25hcCA9IHRydWVcbiAgICAgICAgZnJhbWVTaXplID0gNlxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgeyB3aWR0aCwgaGVpZ2h0IH0gPSBAc2NyZWVuU2l6ZSgpXG5cbiAgICAgICAgaWYgbm90IEB3aW5kb3dzQXJlU3RhY2tlZCgpXG4gICAgICAgICAgICBAc3RhY2tXaW5kb3dzKClcbiAgICAgICAgICAgIGRpc2FibGVTbmFwID0gZmFsc2VcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIHdsLmxlbmd0aCA9PSAxXG4gICAgICAgICAgICB3bFswXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgd2xbMF0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgeDogICAgICAwXG4gICAgICAgICAgICAgICAgeTogICAgICAwXG4gICAgICAgICAgICAgICAgd2lkdGg6ICB3aWR0aFxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIGVsc2UgaWYgd2wubGVuZ3RoID09IDIgb3Igd2wubGVuZ3RoID09IDNcbiAgICAgICAgICAgIHcgPSB3aWR0aC93bC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgaSAqIHcgLSAoaSA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaSA9PSAwIG9yIGkgPT0gd2wubGVuZ3RoLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IGhlaWdodFxuICAgICAgICBlbHNlIGlmIHdsLmxlbmd0aFxuICAgICAgICAgICAgdzIgPSBwYXJzZUludCB3bC5sZW5ndGgvMlxuICAgICAgICAgICAgcmggPSBoZWlnaHRcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4udzJdXG4gICAgICAgICAgICAgICAgdyA9IHdpZHRoL3cyXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCBpICogdyAtIChpID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpID09IDAgb3IgaSA9PSB3Mi0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCByaC8yXG4gICAgICAgICAgICBmb3IgaSBpbiBbdzIuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgdyA9IHdpZHRoLyh3bC5sZW5ndGgtdzIpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCAoaS13MikgKiB3IC0gKGktdzIgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IHJoLzIrMjNcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpLXcyID09IDAgb3IgaSA9PSB3bC5sZW5ndGgtMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCByaC8yXG4gICAgICAgIGRpc2FibGVTbmFwID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIHRocm93IG5ldyBFcnJvciAndGVzdCdcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBtb3ZlV2luZG93U3Rhc2hlczogLT5cbiAgICAgICAgXG4gICAgICAgIHN0YXNoRGlyID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nXG4gICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzdGFzaERpclxuICAgICAgICAgICAgZnMubW92ZVN5bmMgc3Rhc2hEaXIsIHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG92ZXJ3cml0ZTogdHJ1ZVxuXG4gICAgcmVzdG9yZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyBAdXNlckRhdGFcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZWxpc3Qoc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgbWF0Y2hFeHQ6J25vb24nKVxuICAgICAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgICAgICBuZXdTdGFzaCA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJyBcIiN7d2luLmlkfS5ub29uXCJcbiAgICAgICAgICAgIGZzLmNvcHlTeW5jIGZpbGUsIG5ld1N0YXNoXG5cbiAgICB0b2dnbGVXaW5kb3dGcm9tVHJheTogPT4gXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBmb3Igd2luIGluIHdpbnMoKVxuICAgICAgICAgICAgICAgIHdpbi5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvblJlc2l6ZVdpbjogKGV2ZW50KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBkaXNhYmxlU25hcFxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdiID0gZXZlbnQuc2VuZGVyLmdldEJvdW5kcygpXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgY29udGludWUgaWYgdyA9PSBldmVudC5zZW5kZXJcbiAgICAgICAgICAgIGIgPSB3LmdldEJvdW5kcygpXG4gICAgICAgICAgICBpZiBiLmhlaWdodCA9PSB3Yi5oZWlnaHQgYW5kIGIueSA9PSB3Yi55XG4gICAgICAgICAgICAgICAgaWYgYi54IDwgd2IueFxuICAgICAgICAgICAgICAgICAgICBpZiBNYXRoLmFicyhiLngrYi53aWR0aC13Yi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICBiLnhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAgICAgIGIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgd2IueCAtIGIueCArIGZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYi5oZWlnaHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGIueCtiLndpZHRoID4gd2IueCt3Yi53aWR0aFxuICAgICAgICAgICAgICAgICAgICBpZiBNYXRoLmFicyh3Yi54K3diLndpZHRoLWIueCkgPCBXSU5fU05BUF9ESVNUXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICAgICAgd2IueCt3Yi53aWR0aC1mcmFtZVNpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAgICAgIGIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgYi54K2Iud2lkdGggLSAod2IueCt3Yi53aWR0aC1mcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcblxuICAgIGFjdGl2YXRlT25lV2luZG93OiAoY2IpIC0+XG4gICAgXG4gICAgICAgIGlmIGVtcHR5IHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIEB0b2dnbGVXaW5kb3dzIGNiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBub3QgYWN0aXZlV2luKClcbiAgICAgICAgICAgIGlmIHdpbiA9IHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgICAgICB3eHcgPSByZXF1aXJlICd3eHcnICAgXG4gICAgICAgICAgICAgICAgICAgIHd4dyAncmFpc2UnIHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzBdXG4gICAgICAgICAgICAgICAgd2luLmZvY3VzKClcbiAgICAgICAgICAgICAgICBjYiB3aW5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjYiBudWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgIFxuICAgICAgICAgICAgICAgIHd4dyAncmFpc2UnIHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzBdXG4gICAgICAgICAgICBjYiB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICBcbiAgICBvbk90aGVySW5zdGFuY2U6IChhcmdzLCBkaXIpID0+XG5cbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZGlyOicgIGRpclxuICAgICAgICBsb2cgJ29uT3RoZXJJbnN0YW5jZSBhcmdzOicgYXJnc1xuICAgICAgICBcbiAgICAgICAgQGFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG5cbiAgICAgICAgICAgIGZpbGVzID0gW11cbiAgICAgICAgICAgIGlmIGZpcnN0KGFyZ3MpPy5lbmRzV2l0aCBcIiN7cGtnLm5hbWV9LmV4ZVwiXG4gICAgICAgICAgICAgICAgZmlsZWFyZ3MgPSBhcmdzLnNsaWNlIDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMlxuICAgIFxuICAgICAgICAgICAgZm9yIGFyZyBpbiBmaWxlYXJnc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIGFyZy5zdGFydHNXaXRoICctJ1xuICAgICAgICAgICAgICAgIGZpbGUgPSBhcmdcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW4gc2xhc2gucmVzb2x2ZShkaXIpLCBhcmdcbiAgICAgICAgICAgICAgICBbZnBhdGgsIHBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3MgZmlsZVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmV4aXN0cyBmcGF0aFxuICAgICAgICAgICAgICAgICAgICBmaWxlcy5wdXNoIGZpbGVcbiAgICBcbiAgICAgICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGZpbGVzJyBmaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIGZpbGVzLCBuZXdUYWI6dHJ1ZVxuXG5cbiAgICByZWxvYWRXaW46ICh3aW5JRDosIGZpbGU6KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgd2luID0gd2luV2l0aElEIHdpbklEXG4gICAgICAgICAgICB3aW4ud2ViQ29udGVudHMucmVsb2FkSWdub3JpbmdDYWNoZSgpXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycgZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcXVpdDogPT5cblxuICAgICAgICB0b1NhdmUgPSB3aW5zKCkubGVuZ3RoXG5cbiAgICAgICAgaWYgdG9TYXZlXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnc2F2ZVN0YXNoJ1xuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcgPT5cbiAgICAgICAgICAgICAgICB0b1NhdmUgLT0gMVxuICAgICAgICAgICAgICAgIGlmIHRvU2F2ZSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5zdGF0ZS5zYXZlKClcbiAgICAgICAgICAgICAgICAgICAgQGV4aXRBcHAoKVxuICAgICAgICAgICAgJ2RlbGF5J1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBnbG9iYWwuc3RhdGUuc2F2ZSgpXG4gICAgICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbmVsZWN0cm9uLmFwcC5vbiAnb3Blbi1maWxlJyAoZXZlbnQsIGZpbGUpIC0+XG5cbiAgICBpZiBub3QgbWFpbj9cbiAgICAgICAgb3BlbkZpbGVzLnB1c2ggZmlsZVxuICAgIGVsc2VcbiAgICAgICAgaWYgZWxlY3Ryb24uYXBwLmlzUmVhZHkoKVxuICAgICAgICAgICAgbWFpbi5hY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuICAgICAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJyBbZmlsZV0gXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgIFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuZWxlY3Ryb24uYXBwLm9uICd3aW5kb3ctYWxsLWNsb3NlZCcgLT4gbG9nICd3aW5kb3ctYWxsLWNsb3NlZCdcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgICAgICAgIFxuXG5vblVEUCA9IChmaWxlKSAtPlxuICAgIG1haW4uYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cbiAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnIFtmaWxlXSBcblxua29SZWNlaXZlciA9IG5ldyB1ZHAgcG9ydDo5Nzc5LCBvbk1zZzpvblVEUFxuXG5tYWluICAgICAgICAgID0gbmV3IE1haW4gb3BlbkZpbGVzXG5tYWluLm5hdmlnYXRlID0gbmV3IE5hdmlnYXRlIG1haW5cbiJdfQ==
//# sourceURL=../../coffee/main/main.coffee
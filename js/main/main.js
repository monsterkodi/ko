// koffee 1.4.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Indexer, Main, Navigate, WIN_SNAP_DIST, _, activeWin, app, args, clipboard, colors, dialog, disableSnap, electron, empty, filelist, first, fs, klog, koReceiver, main, mostRecentFile, noon, onUDP, openFiles, os, pkg, post, prefs, ref, slash, store, udp, valid, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, colors = ref.colors, first = ref.first, empty = ref.empty, prefs = ref.prefs, store = ref.store, slash = ref.slash, valid = ref.valid, store = ref.store, noon = ref.noon, args = ref.args, win = ref.win, app = ref.app, udp = ref.udp, os = ref.os, fs = ref.fs, klog = ref.klog, _ = ref._;

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
        return console.log((winID + ">>> ") + text);
    }
});

Main = (function(superClass) {
    extend(Main, superClass);

    function Main(openFiles) {
        this.quit = bind(this.quit, this);
        this.onOtherInstance = bind(this.onOtherInstance, this);
        this.onCloseWin = bind(this.onCloseWin, this);
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

    Main.prototype.onCloseWin = function(event) {
        var wid;
        wid = event.sender.id;
        if (wins().length === 1) {
            if (slash.win()) {
                this.quit();
                return;
            } else {
                this.hideDock();
            }
        }
        post.toAll('winClosed', wid);
        return this.postDelayedNumWins();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb1RBQUE7SUFBQTs7OztBQVFBLE1BQTBILE9BQUEsQ0FBUSxLQUFSLENBQTFILEVBQUUsZUFBRixFQUFRLHVCQUFSLEVBQWtCLG1CQUFsQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLGlCQUF4QyxFQUErQyxpQkFBL0MsRUFBc0QsaUJBQXRELEVBQTZELGlCQUE3RCxFQUFvRSxpQkFBcEUsRUFBMkUsZUFBM0UsRUFBaUYsZUFBakYsRUFBdUYsYUFBdkYsRUFBNEYsYUFBNUYsRUFBaUcsYUFBakcsRUFBc0csV0FBdEcsRUFBMEcsV0FBMUcsRUFBOEcsZUFBOUcsRUFBb0g7O0FBS3BILEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVQsc0NBQUYsRUFBaUIsOEJBQWpCLEVBQTRCOztBQUU1QixXQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUNoQixTQUFBLEdBQWdCOztBQUNoQixhQUFBLEdBQWdCOztBQUloQixjQUFBLEdBQWlCLFNBQUE7V0FBRyxLQUFBLENBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLENBQU47QUFBSDs7QUFRakIsSUFBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsYUFBZCxDQUFBLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsU0FBQyxDQUFELEVBQUcsQ0FBSDtlQUFTLENBQUMsQ0FBQyxFQUFGLEdBQU8sQ0FBQyxDQUFDO0lBQWxCLENBQW5DO0FBQUg7O0FBQ2QsU0FBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsZ0JBQWQsQ0FBQTtBQUFIOztBQUNkLFdBQUEsR0FBYyxTQUFBO0FB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QUFnQixJQUFJLFFBQUosQ0FBYSxJQUFiIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgZmlsZWxpc3QsIGNvbG9ycywgZmlyc3QsIGVtcHR5LCBwcmVmcywgc3RvcmUsIHNsYXNoLCB2YWxpZCwgc3RvcmUsIG5vb24sIGFyZ3MsIHdpbiwgYXBwLCB1ZHAsIG9zLCBmcywga2xvZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jIHBvc3QuZGVidWcoKVxuIyBsb2cuc2xvZy5kZWJ1ZyA9IHRydWVcblxucGtnICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5OYXZpZ2F0ZSA9IHJlcXVpcmUgJy4vbmF2aWdhdGUnXG5JbmRleGVyICA9IHJlcXVpcmUgJy4vaW5kZXhlcidcblxueyBCcm93c2VyV2luZG93LCBjbGlwYm9hcmQsIGRpYWxvZyB9ID0gZWxlY3Ryb25cblxuZGlzYWJsZVNuYXAgICA9IGZhbHNlXG5tYWluICAgICAgICAgID0gdW5kZWZpbmVkXG5vcGVuRmlsZXMgICAgID0gW11cbldJTl9TTkFQX0RJU1QgPSAxNTBcblxuIyBwcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJyAjID8/P1xuICAgIFxubW9zdFJlY2VudEZpbGUgPSAtPiBmaXJzdCBzdGF0ZS5nZXQgJ3JlY2VudEZpbGVzJ1xuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2lucyAgICAgICAgPSAtPiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5zb3J0IChhLGIpIC0+IGEuaWQgLSBiLmlkXG5hY3RpdmVXaW4gICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG52aXNpYmxlV2lucyA9IC0+ICh3IGZvciB3IGluIHdpbnMoKSB3aGVuIHc/LmlzVmlzaWJsZSgpIGFuZCBub3Qgdz8uaXNNaW5pbWl6ZWQoKSlcblxud2luV2l0aElEICAgPSAod2luSUQpIC0+XG5cbiAgICB3aWQgPSBwYXJzZUludCB3aW5JRFxuICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICByZXR1cm4gdyBpZiB3LmlkID09IHdpZFxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub25HZXQgJ2RlYnVnTW9kZScsIC0+IGFyZ3MuZGVidWdcbnBvc3Qub25HZXQgJ3dpbkluZm9zJywgIC0+IChpZDogdy5pZCBmb3IgdyBpbiB3aW5zKCkpXG5wb3N0Lm9uR2V0ICdsb2dTeW5jJywgICAtPlxuICAgIGNvbnNvbGUubG9nLmFwcGx5IGNvbnNvbGUsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuICAgIHJldHVybiB0cnVlXG5cbnBvc3Qub24gJ3Rocm93RXJyb3InLCAgICAgICAgICAgICAgICAgLT4gdGhyb3cgbmV3IEVycm9yICdlcnInXG5wb3N0Lm9uICduZXdXaW5kb3dXaXRoRmlsZScsICAoZmlsZSkgIC0+IG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG5wb3N0Lm9uICdhY3RpdmF0ZVdpbmRvdycsICAgICAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVXaW5kb3dXaXRoSUQgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlTmV4dFdpbmRvdycsICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZU5leHRXaW5kb3cgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlUHJldldpbmRvdycsICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZVByZXZXaW5kb3cgd2luSURcblxucG9zdC5vbiAnbWVudUFjdGlvbicsICAgKGFjdGlvbiwgYXJnKSAtPiBtYWluPy5vbk1lbnVBY3Rpb24gYWN0aW9uLCBhcmdcbnBvc3Qub24gJ3BpbmcnLCAod2luSUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd2luSUQsICdwb25nJywgJ21haW4nLCBhcmdBLCBhcmdCXG5wb3N0Lm9uICd3aW5sb2cnLCAgICAgICAod2luSUQsIHRleHQpIC0+IFxuICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICBsb2cgXCIje3dpbklEfT4+PiBcIiArIHRleHRcblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbmNsYXNzIE1haW4gZXh0ZW5kcyBhcHBcblxuICAgIGNvbnN0cnVjdG9yOiAob3BlbkZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgZGlyczogICAgICAgWycuLi8nLCAnLi4vYnJvd3NlcicsICcuLi9jb21tYW5kbGluZScsICcuLi9jb21tYW5kcycsICcuLi9lZGl0b3InLCAnLi4vZ2l0JywgJy4uL21haW4nLCAnLi4vdG9vbHMnLCAnLi4vd2luJ11cbiAgICAgICAgICAgIHBrZzogICAgICAgIHBrZ1xuICAgICAgICAgICAgc2hvcnRjdXQ6ICAgJ0FsdCtGMSdcbiAgICAgICAgICAgIGluZGV4OiAgICAgICcuLi9pbmRleC5odG1sJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgJy4uLy4uL2ltZy9hcHAuaWNvJ1xuICAgICAgICAgICAgdHJheTogICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIGFib3V0OiAgICAgICcuLi8uLi9pbWcvYWJvdXQucG5nJ1xuICAgICAgICAgICAgYWJvdXREZWJ1ZzogZmFsc2VcbiAgICAgICAgICAgIG9uU2hvdzogICAgIC0+IG1haW4ub25TaG93KClcbiAgICAgICAgICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgLT4gbWFpbi5vbk90aGVySW5zdGFuY2UgYXJncywgZGlyXG4gICAgICAgICAgICB3aWR0aDogICAgICAxMDAwXG4gICAgICAgICAgICBoZWlnaHQ6ICAgICAxMDAwXG4gICAgICAgICAgICBtaW5XaWR0aDogICAyNDBcbiAgICAgICAgICAgIG1pbkhlaWdodDogIDIzMFxuICAgICAgICAgICAgYXJnczogXCJcIlwiXG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgIGZpbGVzIHRvIG9wZW4gICAgICAgICAgICoqXG4gICAgICAgICAgICAgICAgcHJlZnMgICAgIHNob3cgcHJlZmVyZW5jZXMgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9wcmVmcyAgIGRvbid0IGxvYWQgcHJlZmVyZW5jZXMgIGZhbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUgICAgIHNob3cgc3RhdGUgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9zdGF0ZSAgIGRvbid0IGxvYWQgc3RhdGUgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgdmVyYm9zZSAgIGxvZyBtb3JlICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wdC5vblF1aXQgPSBAcXVpdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBwcm9jZXNzLmN3ZCgpID09ICcvJ1xuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgXG4gICAgICAgIHdoaWxlIHZhbGlkKGFyZ3MuZmlsZWxpc3QpIGFuZCBzbGFzaC5kaXJFeGlzdHMgZmlyc3QgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBhcmdzLmZpbGVsaXN0LnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy53aGl0ZS5ib2xkIFwiXFxua29cIiwgY29sb3JzLmdyYXkgXCJ2I3twa2cudmVyc2lvbn1cXG5cIlxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHtjd2Q6IHByb2Nlc3MuY3dkKCl9LCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAnXFxuYXJncydcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBhcmdzLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nICcnXG5cbiAgICAgICAgZ2xvYmFsLnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScsIHNlcGFyYXRvcjogJ3wnXG5cbiAgICAgICAgYWxpYXMgPSBuZXcgc3RvcmUgJ2FsaWFzJ1xuICAgICAgICBcbiAgICAgICAgaWYgYXJncy5wcmVmc1xuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAncHJlZnMnXG4gICAgICAgICAgICBsb2cgY29sb3JzLmdyZWVuLmJvbGQgJ3ByZWZzIGZpbGU6JywgcHJlZnMuc3RvcmUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHByZWZzLnN0b3JlLmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBhcmdzLnN0YXRlXG4gICAgICAgICAgICBsb2cgY29sb3JzLnllbGxvdy5ib2xkICdzdGF0ZSdcbiAgICAgICAgICAgIGxvZyBjb2xvcnMuZ3JlZW4uYm9sZCAnc3RhdGUgZmlsZTonLCBnbG9iYWwuc3RhdGUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGdsb2JhbC5zdGF0ZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIEBpbmRleGVyID0gbmV3IEluZGV4ZXJcblxuICAgICAgICBpZiBub3Qgb3BlbkZpbGVzLmxlbmd0aCBhbmQgdmFsaWQgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgb3BlbkZpbGVzID0gZmlsZWxpc3QgYXJncy5maWxlbGlzdCwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgXG4gICAgICAgIEBvcGVuRmlsZXMgPSBvcGVuRmlsZXNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICBcbiAgICBvblNob3c6ID0+XG5cbiAgICAgICAgeyB3aWR0aCwgaGVpZ2h0IH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIFxuICAgICAgICBAb3B0LndpZHRoICA9IGhlaWdodCArIDEyMlxuICAgICAgICBAb3B0LmhlaWdodCA9IGhlaWdodFxuICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBvcGVuRmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIEBvcGVuRmlsZXNcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgICAgICBkZWxldGUgQG9wZW5GaWxlc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVzdG9yZVdpbmRvd3MoKSBpZiBub3QgYXJncy5ub3N0YXRlXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgd2lucygpLmxlbmd0aFxuICAgICAgICAgICAgaWYgcmVjZW50ID0gbW9zdFJlY2VudEZpbGUoKVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOnJlY2VudCBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEVtcHR5KClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25NZW51QWN0aW9uOiAoYWN0aW9uLCBhcmcpID0+XG5cbiAgICAgICAgc3dpdGNoIGFjdGlvblxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgdGhlbiBAYWN0aXZhdGVOZXh0V2luZG93IGFyZ1xuICAgICAgICAgICAgd2hlbiAnQXJyYW5nZSBXaW5kb3dzJyAgdGhlbiBAYXJyYW5nZVdpbmRvd3MoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgdGhlbiBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDBcblxuICAgIHdpbnM6ICAgICAgICB3aW5zKClcbiAgICB3aW5XaXRoSUQ6ICAgd2luV2l0aElEXG4gICAgYWN0aXZlV2luOiAgIGFjdGl2ZVdpblxuICAgIHZpc2libGVXaW5zOiB2aXNpYmxlV2luc1xuXG4gICAgY3JlYXRlV2luZG93V2l0aEZpbGU6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBbb3B0LmZpbGVdXG4gICAgICAgIHdpblxuXG4gICAgY3JlYXRlV2luZG93V2l0aEVtcHR5OiAtPlxuICAgICAgICBcbiAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdyAod2luKSAtPiBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnbmV3RW1wdHlUYWInXG4gICAgICAgIHdpblxuICAgICAgICBcbiAgICB0b2dnbGVXaW5kb3dzOiAoY2IpID0+XG5cbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBhY3RpdmVXaW4oKVxuICAgICAgICAgICAgICAgICAgICBAaGlkZVdpbmRvd3MoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHJhaXNlV2luZG93cygpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHNob3dXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNiIGZpcnN0IHZpc2libGVXaW5zKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNyZWF0ZVdpbmRvdyBjYlxuXG4gICAgaGlkZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LmhpZGUoKVxuICAgICAgICAgICAgQGhpZGVEb2NrKClcbiAgICAgICAgQFxuXG4gICAgc2hvd1dpbmRvd3M6IC0+XG5cbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICB3LnNob3coKVxuICAgICAgICAgICAgQHNob3dEb2NrKClcbiAgICAgICAgQFxuXG4gICAgcmFpc2VXaW5kb3dzOiAtPlxuXG4gICAgICAgIGlmIHZhbGlkIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIGZvciB3IGluIHZpc2libGVXaW5zKClcbiAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB2aXNpYmxlV2lucygpWzBdLmZvY3VzKClcbiAgICAgICAgQFxuXG4gICAgYWN0aXZhdGVOZXh0V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IDEgKyBhbGxXaW5kb3dzLmluZGV4T2Ygd1xuICAgICAgICAgICAgICAgIGkgPSAwIGlmIGkgPj0gYWxsV2luZG93cy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlUHJldldpbmRvdzogKHdpbikgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyIHdpbiB0aGVuIHdpbiA9IHdpbldpdGhJRCB3aW5cbiAgICAgICAgYWxsV2luZG93cyA9IHdpbnMoKVxuICAgICAgICBmb3IgdyBpbiBhbGxXaW5kb3dzXG4gICAgICAgICAgICBpZiB3ID09IHdpblxuICAgICAgICAgICAgICAgIGkgPSAtMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IGFsbFdpbmRvd3MubGVuZ3RoLTEgaWYgaSA8IDBcbiAgICAgICAgICAgICAgICBAYWN0aXZhdGVXaW5kb3dXaXRoSUQgYWxsV2luZG93c1tpXS5pZFxuICAgICAgICAgICAgICAgIHJldHVybiB3XG4gICAgICAgIG51bGxcblxuICAgIGFjdGl2YXRlV2luZG93V2l0aElEOiAod2lkKSAtPlxuXG4gICAgICAgIHcgPSB3aW5XaXRoSUQgd2lkXG4gICAgICAgIHJldHVybiBpZiBub3Qgdz9cbiAgICAgICAgaWYgbm90IHcuaXNWaXNpYmxlKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHcuZm9jdXMoKVxuICAgICAgICB3XG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgc3RhY2tXaW5kb3dzOiAtPlxuICAgICAgICBcbiAgICAgICAge3dpZHRoLCBoZWlnaHR9ID0gQHNjcmVlblNpemUoKVxuICAgICAgICB3dyA9IGhlaWdodCArIDEyMlxuICAgICAgICB3bCA9IHZpc2libGVXaW5zKClcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCAod2lkdGgtd3cpLzJcbiAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHd3XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgYWN0aXZlV2luKCkuc2hvdygpXG5cbiAgICB3aW5kb3dzQXJlU3RhY2tlZDogLT5cbiAgICAgICAgXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgZW1wdHkgd2xcbiAgICAgICAgXG4gICAgICAgIGZvciB3IGluIHdsXG4gICAgICAgICAgICBpZiB3LmlzRnVsbFNjcmVlbigpXG4gICAgICAgICAgICAgICAgdy5zZXRGdWxsU2NyZWVuIGZhbHNlIFxuICAgICAgICBcbiAgICAgICAgYm91bmRzID0gd2xbMF0uZ2V0Qm91bmRzKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIHdsLmxlbmd0aCA9PSAxIGFuZCBib3VuZHMud2lkdGggPT0gQHNjcmVlblNpemUoKS53aWR0aFxuICAgICAgICBcbiAgICAgICAgZm9yIHdpIGluIFsxLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgaWYgbm90IF8uaXNFcXVhbCB3bFt3aV0uZ2V0Qm91bmRzKCksIGJvdW5kc1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB0cnVlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGFycmFuZ2VXaW5kb3dzOiA9PlxuXG4gICAgICAgIGRpc2FibGVTbmFwID0gdHJ1ZVxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcblxuICAgICAgICBpZiBub3QgQHdpbmRvd3NBcmVTdGFja2VkKClcbiAgICAgICAgICAgIEBzdGFja1dpbmRvd3MoKVxuICAgICAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgd2wubGVuZ3RoID09IDFcbiAgICAgICAgICAgIHdsWzBdLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICB3bFswXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIDBcbiAgICAgICAgICAgICAgICB5OiAgICAgIDBcbiAgICAgICAgICAgICAgICB3aWR0aDogIHdpZHRoXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGggPT0gMiBvciB3bC5sZW5ndGggPT0gM1xuICAgICAgICAgICAgdyA9IHdpZHRoL3dsLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgd2xbaV0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICB3bFtpXS5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgeDogICAgICBwYXJzZUludCBpICogdyAtIChpID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBwYXJzZUludCB3ICsgKChpID09IDAgb3IgaSA9PSB3bC5sZW5ndGgtMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgaGVpZ2h0XG4gICAgICAgIGVsc2UgaWYgd2wubGVuZ3RoXG4gICAgICAgICAgICB3MiA9IHBhcnNlSW50IHdsLmxlbmd0aC8yXG4gICAgICAgICAgICByaCA9IGhlaWdodFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi53Ml1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvdzJcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHcyLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgICAgIGZvciBpIGluIFt3Mi4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3ID0gd2lkdGgvKHdsLmxlbmd0aC13MilcbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IChpLXcyKSAqIHcgLSAoaS13MiA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgcmgvMisyM1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGktdzIgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IHJoLzJcbiAgICAgICAgZGlzYWJsZVNuYXAgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yICd0ZXN0J1xuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcblxuICAgIG1vdmVXaW5kb3dTdGFzaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgc3Rhc2hEaXIgPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbidcbiAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHN0YXNoRGlyXG4gICAgICAgICAgICBmcy5tb3ZlU3luYyBzdGFzaERpciwgc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgb3ZlcndyaXRlOiB0cnVlXG5cbiAgICByZXN0b3JlV2luZG93czogLT5cblxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jIEB1c2VyRGF0YVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBtYXRjaEV4dDonbm9vbicpXG4gICAgICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgIG5ld1N0YXNoID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nLCBcIiN7d2luLmlkfS5ub29uXCJcbiAgICAgICAgICAgIGZzLmNvcHlTeW5jIGZpbGUsIG5ld1N0YXNoXG5cbiAgICB0b2dnbGVXaW5kb3dGcm9tVHJheTogPT4gXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgd2lucygpXG4gICAgICAgICAgICBmb3Igd2luIGluIHdpbnMoKVxuICAgICAgICAgICAgICAgIHdpbi5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvblJlc2l6ZVdpbjogKGV2ZW50KSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBkaXNhYmxlU25hcFxuICAgICAgICBmcmFtZVNpemUgPSA2XG4gICAgICAgIHdiID0gZXZlbnQuc2VuZGVyLmdldEJvdW5kcygpXG4gICAgICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICAgICAgY29udGludWUgaWYgdyA9PSBldmVudC5zZW5kZXJcbiAgICAgICAgICAgIGIgPSB3LmdldEJvdW5kcygpXG4gICAgICAgICAgICBpZiBiLmhlaWdodCA9PSB3Yi5oZWlnaHQgYW5kIGIueSA9PSB3Yi55XG4gICAgICAgICAgICAgICAgaWYgYi54IDwgd2IueFxuICAgICAgICAgICAgICAgICAgICBpZiBNYXRoLmFicyhiLngrYi53aWR0aC13Yi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICBiLnhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAgICAgIGIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgd2IueCAtIGIueCArIGZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYi5oZWlnaHRcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGIueCtiLndpZHRoID4gd2IueCt3Yi53aWR0aFxuICAgICAgICAgICAgICAgICAgICBpZiBNYXRoLmFicyh3Yi54K3diLndpZHRoLWIueCkgPCBXSU5fU05BUF9ESVNUXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB3LnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6ICAgICAgd2IueCt3Yi53aWR0aC1mcmFtZVNpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiAgICAgIGIueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgYi54K2Iud2lkdGggLSAod2IueCt3Yi53aWR0aC1mcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuXG4gICAgb25DbG9zZVdpbjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHdpZCA9IGV2ZW50LnNlbmRlci5pZFxuICAgICAgICBpZiB3aW5zKCkubGVuZ3RoID09IDFcbiAgICAgICAgICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgQHF1aXQoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBoaWRlRG9jaygpXG4gICAgICAgIHBvc3QudG9BbGwgJ3dpbkNsb3NlZCcsIHdpZFxuICAgICAgICBAcG9zdERlbGF5ZWROdW1XaW5zKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG5cbiAgICBhY3RpdmF0ZU9uZVdpbmRvdzogKGNiKSAtPlxuICAgIFxuICAgICAgICBpZiBlbXB0eSB2aXNpYmxlV2lucygpXG4gICAgICAgICAgICBAdG9nZ2xlV2luZG93cyBjYlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgbm90IGFjdGl2ZVdpbigpXG4gICAgICAgICAgICBpZiB3aW4gPSB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgIFxuICAgICAgICAgICAgICAgICAgICB3eHcgJ3JhaXNlJyBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgY2Igd2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dycgICBcbiAgICAgICAgICAgICAgICB3eHcgJ3JhaXNlJyBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgY2IgdmlzaWJsZVdpbnMoKVswXVxuICAgICAgICAgICAgXG4gICAgb25PdGhlckluc3RhbmNlOiAoYXJncywgZGlyKSA9PlxuXG4gICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGRpcjonLCAgZGlyXG4gICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGFyZ3M6JywgYXJnc1xuICAgICAgICBcbiAgICAgICAgQGFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG5cbiAgICAgICAgICAgIGZpbGVzID0gW11cbiAgICAgICAgICAgIGlmIGZpcnN0KGFyZ3MpPy5lbmRzV2l0aCBcIiN7cGtnLm5hbWV9LmV4ZVwiXG4gICAgICAgICAgICAgICAgZmlsZWFyZ3MgPSBhcmdzLnNsaWNlIDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMlxuICAgIFxuICAgICAgICAgICAgZm9yIGFyZyBpbiBmaWxlYXJnc1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIGFyZy5zdGFydHNXaXRoICctJ1xuICAgICAgICAgICAgICAgIGZpbGUgPSBhcmdcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc1JlbGF0aXZlIGZpbGVcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHNsYXNoLmpvaW4gc2xhc2gucmVzb2x2ZShkaXIpLCBhcmdcbiAgICAgICAgICAgICAgICBbZnBhdGgsIHBvc10gPSBzbGFzaC5zcGxpdEZpbGVQb3MgZmlsZVxuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmV4aXN0cyBmcGF0aFxuICAgICAgICAgICAgICAgICAgICBmaWxlcy5wdXNoIGZpbGVcbiAgICBcbiAgICAgICAgICAgIGxvZyAnb25PdGhlckluc3RhbmNlIGZpbGVzJywgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJywgZmlsZXMsIG5ld1RhYjp0cnVlXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAgMDAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHF1aXQ6ID0+XG5cbiAgICAgICAgdG9TYXZlID0gd2lucygpLmxlbmd0aFxuXG4gICAgICAgIGlmIHRvU2F2ZVxuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3NhdmVTdGFzaCdcbiAgICAgICAgICAgIHBvc3Qub24gJ3N0YXNoU2F2ZWQnLCA9PlxuICAgICAgICAgICAgICAgIHRvU2F2ZSAtPSAxXG4gICAgICAgICAgICAgICAgaWYgdG9TYXZlID09IDBcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgICAgICAgICBAZXhpdEFwcCgpXG4gICAgICAgICAgICAnZGVsYXknXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGdsb2JhbC5zdGF0ZS5zYXZlKClcbiAgICAgICAgICAgIFxuIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuZWxlY3Ryb24uYXBwLm9uICdvcGVuLWZpbGUnLCAoZXZlbnQsIGZpbGUpIC0+XG5cbiAgICBpZiBub3QgbWFpbj9cbiAgICAgICAgb3BlbkZpbGVzLnB1c2ggZmlsZVxuICAgIGVsc2VcbiAgICAgICAgaWYgZWxlY3Ryb24uYXBwLmlzUmVhZHkoKVxuICAgICAgICAgICAgbWFpbi5hY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuICAgICAgICAgICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJywgW2ZpbGVdIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtYWluLmNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6ZmlsZVxuICAgICAgICBcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cbmVsZWN0cm9uLmFwcC5vbiAnd2luZG93LWFsbC1jbG9zZWQnLCAtPiBsb2cgJ3dpbmRvdy1hbGwtY2xvc2VkJ1xuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAgICAgICAgICAgXG5cbm9uVURQID0gKGZpbGUpIC0+XG4gICAgbWFpbi5hY3RpdmF0ZU9uZVdpbmRvdyAod2luKSAtPlxuICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycsIFtmaWxlXSBcblxua29SZWNlaXZlciA9IG5ldyB1ZHAgcG9ydDo5Nzc5LCBvbk1zZzpvblVEUFxuXG5tYWluICAgICAgICAgID0gbmV3IE1haW4gb3BlbkZpbGVzXG5tYWluLm5hdmlnYXRlID0gbmV3IE5hdmlnYXRlIG1haW5cbiJdfQ==
//# sourceURL=../../coffee/main/main.coffee
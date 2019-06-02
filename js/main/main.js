// koffee 0.56.0

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
        var file, height, j, len, ref1, ref2, width;
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
            return this.createWindowWithFile({
                file: mostRecentFile()
            });
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
        var file, j, len, newStash, results, stashFiles;
        fs.ensureDirSync(this.userData);
        stashFiles = filelist(slash.join(this.userData, 'old'), {
            matchExt: 'noon'
        });
        if (!empty(stashFiles)) {
            results = [];
            for (j = 0, len = stashFiles.length; j < len; j++) {
                file = stashFiles[j];
                win = this.createWindow();
                newStash = slash.join(this.userData, 'win', win.id + ".noon");
                results.push(fs.copySync(file, newStash));
            }
            return results;
        }
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
        if (empty(visibleWins())) {
            console.log('toggleWindows');
            this.toggleWindows(cb);
            return;
        }
        if (!activeWin()) {
            if (win = visibleWins()[0]) {
                win.focus();
                return cb(win);
            } else {
                return cb(null);
            }
        } else {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb1RBQUE7SUFBQTs7OztBQVFBLE1BQTBILE9BQUEsQ0FBUSxLQUFSLENBQTFILEVBQUUsZUFBRixFQUFRLHVCQUFSLEVBQWtCLG1CQUFsQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLGlCQUF4QyxFQUErQyxpQkFBL0MsRUFBc0QsaUJBQXRELEVBQTZELGlCQUE3RCxFQUFvRSxpQkFBcEUsRUFBMkUsZUFBM0UsRUFBaUYsZUFBakYsRUFBdUYsYUFBdkYsRUFBNEYsYUFBNUYsRUFBaUcsYUFBakcsRUFBc0csV0FBdEcsRUFBMEcsV0FBMUcsRUFBOEcsZUFBOUcsRUFBb0g7O0FBS3BILEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVQsc0NBQUYsRUFBaUIsOEJBQWpCLEVBQTRCOztBQUU1QixXQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUNoQixTQUFBLEdBQWdCOztBQUNoQixhQUFBLEdBQWdCOztBQUloQixjQUFBLEdBQWlCLFNBQUE7V0FBRyxLQUFBLENBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLENBQU47QUFBSDs7QUFRakIsSUFBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsYUFBZCxDQUFBLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsU0FBQyxDQUFELEVBQUcsQ0FBSDtlQUFTLENBQUMsQ0FBQyxFQUFGLEdBQU8sQ0FBQyxDQUFDO0lBQWxCLENBQW5DO0FBQUg7O0FBQ2QsU0FBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsZ0JBQWQsQ0FBQTtBQUFIOztBQUNkLFdBQUEsR0FBYyxTQUFBO0FBQUcsUUFBQTtBQUFDO0FBQUE7U0FBQSxzQ0FBQTs7eUJBQXVCLENBQUMsQ0FBRSxTQUFILENBQUEsV0FBQSxJQUFtQixjQUFJLENBQUMsQ0FBRSxXQUFILENBQUE7eUJBQTlDOztBQUFBOztBQUFKOztBQUVkLFNBQUEsR0FBYyxTQUFDLEtBQUQ7QUFFVixRQUFBO0lBQUEsR0FBQSxHQUFNLFFBQUEsQ0FBUyxLQUFUO0FBQ047QUFBQSxTQUFBLHNDQUFBOztRQUNJLElBQVksQ0FBQyxDQUFDLEVBQUYsS0FBUSxHQUFwQjtBQUFBLG1CQUFPLEVBQVA7O0FBREo7QUFIVTs7QUFZZCxJQUFJLENBQUMsS0FBTCxDQUFXLFdBQVgsRUFBd0IsU0FBQTtXQUFHLElBQUksQ0FBQztBQUFSLENBQXhCOztBQUNBLElBQUksQ0FBQyxLQUFMLENBQVcsVUFBWCxFQUF3QixTQUFBO0FBQUcsUUFBQTtBQUFDO0FBQUE7U0FBQSxzQ0FBQTs7cUJBQUE7WUFBQSxFQUFBLEVBQUksQ0FBQyxDQUFDLEVBQU47O0FBQUE7O0FBQUosQ0FBeEI7O0FBQ0EsSUFBSSxDQUFDLEtBQUwsQ0FBVyxTQUFYLEVBQXdCLFNBQUE7SUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFaLENBQWtCLE9BQWxCLEVBQTJCLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBVCxDQUFjLFNBQWQsRUFBeUIsQ0FBekIsQ0FBM0I7QUFDQSxXQUFPO0FBRmEsQ0FBeEI7O0FBSUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXNDLFNBQUE7QUFBRyxVQUFNLElBQUksS0FBSixDQUFVLEtBQVY7QUFBVCxDQUF0Qzs7QUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLG1CQUFSLEVBQThCLFNBQUMsSUFBRDtXQUFXLElBQUksQ0FBQyxvQkFBTCxDQUEwQjtRQUFBLElBQUEsRUFBSyxJQUFMO0tBQTFCO0FBQVgsQ0FBOUI7O0FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxnQkFBUixFQUE4QixTQUFDLEtBQUQ7V0FBVyxJQUFJLENBQUMsb0JBQUwsQ0FBMEIsS0FBMUI7QUFBWCxDQUE5Qjs7QUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLG9CQUFSLEVBQThCLFNBQUMsS0FBRDtXQUFXLElBQUksQ0FBQyxrQkFBTCxDQUF3QixLQUF4QjtBQUFYLENBQTlCOztBQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsb0JBQVIsRUFBOEIsU0FBQyxLQUFEO1dBQVcsSUFBSSxDQUFDLGtCQUFMLENBQXdCLEtBQXhCO0FBQVgsQ0FBOUI7O0FBRUEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXdCLFNBQUMsTUFBRCxFQUFTLEdBQVQ7MEJBQWlCLElBQUksQ0FBRSxZQUFOLENBQW1CLE1BQW5CLEVBQTJCLEdBQTNCO0FBQWpCLENBQXhCOztBQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFnQixTQUFDLEtBQUQsRUFBUSxJQUFSLEVBQWMsSUFBZDtXQUF1QixJQUFJLENBQUMsS0FBTCxDQUFXLEtBQVgsRUFBa0IsTUFBbEIsRUFBMEIsTUFBMUIsRUFBa0MsSUFBbEMsRUFBd0MsSUFBeEM7QUFBdkIsQ0FBaEI7O0FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxRQUFSLEVBQXdCLFNBQUMsS0FBRCxFQUFRLElBQVI7SUFDcEIsSUFBRyxJQUFJLENBQUMsT0FBUjtlQUNHLE9BQUEsQ0FBQyxHQUFELENBQUssQ0FBRyxLQUFELEdBQU8sTUFBVCxDQUFBLEdBQWlCLElBQXRCLEVBREg7O0FBRG9CLENBQXhCOztBQVVNOzs7SUFFVyxjQUFDLFNBQUQ7Ozs7Ozs7OztBQUVULFlBQUE7UUFBQSxzQ0FDSTtZQUFBLEdBQUEsRUFBWSxTQUFaO1lBQ0EsSUFBQSxFQUFZLENBQUMsS0FBRCxFQUFRLFlBQVIsRUFBc0IsZ0JBQXRCLEVBQXdDLGFBQXhDLEVBQXVELFdBQXZELEVBQW9FLFFBQXBFLEVBQThFLFNBQTlFLEVBQXlGLFVBQXpGLEVBQXFHLFFBQXJHLENBRFo7WUFFQSxHQUFBLEVBQVksR0FGWjtZQUdBLFFBQUEsRUFBWSxjQUhaO1lBSUEsS0FBQSxFQUFZLGVBSlo7WUFLQSxJQUFBLEVBQVksbUJBTFo7WUFNQSxJQUFBLEVBQVksdUJBTlo7WUFPQSxLQUFBLEVBQVkscUJBUFo7WUFRQSxVQUFBLEVBQVksS0FSWjtZQVNBLE1BQUEsRUFBWSxTQUFBO3VCQUFHLElBQUksQ0FBQyxNQUFMLENBQUE7WUFBSCxDQVRaO1lBVUEsZUFBQSxFQUFpQixTQUFDLElBQUQsRUFBTyxHQUFQO3VCQUFlLElBQUksQ0FBQyxlQUFMLENBQXFCLElBQXJCLEVBQTJCLEdBQTNCO1lBQWYsQ0FWakI7WUFXQSxLQUFBLEVBQVksSUFYWjtZQVlBLE1BQUEsRUFBWSxJQVpaO1lBYUEsUUFBQSxFQUFZLEdBYlo7WUFjQSxTQUFBLEVBQVksR0FkWjtZQWVBLElBQUEsRUFBTSxtUEFmTjtTQURKO1FBeUJBLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxHQUFjLElBQUMsQ0FBQTtRQUVmLElBQUcsT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFBLEtBQWlCLEdBQXBCO1lBQ0ksT0FBTyxDQUFDLEtBQVIsQ0FBYyxLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBZCxFQURKOztBQUdBLGVBQU0sS0FBQSxDQUFNLElBQUksQ0FBQyxRQUFYLENBQUEsSUFBeUIsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsS0FBQSxDQUFNLElBQUksQ0FBQyxRQUFYLENBQWhCLENBQS9CO1lBQ0ksT0FBTyxDQUFDLEtBQVIsQ0FBYyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQWQsQ0FBQSxDQUFkO1FBREo7UUFHQSxJQUFHLElBQUksQ0FBQyxPQUFSO1lBQ0csT0FBQSxDQUFDLEdBQUQsQ0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQWIsQ0FBa0IsTUFBbEIsRUFBMEIsTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFBLEdBQUksR0FBRyxDQUFDLE9BQVIsR0FBZ0IsSUFBNUIsQ0FBMUIsQ0FBTDtZQUE4RCxPQUFBLENBQzdELEdBRDZELENBQ3pELElBQUksQ0FBQyxTQUFMLENBQWU7Z0JBQUMsR0FBQSxFQUFLLE9BQU8sQ0FBQyxHQUFSLENBQUEsQ0FBTjthQUFmLEVBQXFDO2dCQUFBLE1BQUEsRUFBTyxJQUFQO2FBQXJDLENBRHlEO1lBQ1QsT0FBQSxDQUNwRCxHQURvRCxDQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQWQsQ0FBbUIsUUFBbkIsQ0FEZ0Q7WUFDckIsT0FBQSxDQUMvQixHQUQrQixDQUMzQixJQUFJLENBQUMsU0FBTCxDQUFlLElBQWYsRUFBcUI7Z0JBQUEsTUFBQSxFQUFPLElBQVA7YUFBckIsQ0FEMkI7WUFDSyxPQUFBLENBQ3BDLEdBRG9DLENBQ2hDLEVBRGdDLEVBSnhDOztRQU9BLE1BQU0sQ0FBQyxLQUFQLEdBQWUsSUFBSSxLQUFKLENBQVUsT0FBVixFQUFtQjtZQUFBLFNBQUEsRUFBVyxHQUFYO1NBQW5CO1FBRWYsS0FBQSxHQUFRLElBQUksS0FBSixDQUFVLE9BQVY7UUFFUixJQUFHLElBQUksQ0FBQyxLQUFSO1lBQ0csT0FBQSxDQUFDLEdBQUQsQ0FBSyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQWQsQ0FBbUIsT0FBbkIsQ0FBTDtZQUErQixPQUFBLENBQzlCLEdBRDhCLENBQzFCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBYixDQUFrQixhQUFsQixFQUFpQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQTdDLENBRDBCO1lBQ3VCLE9BQUEsQ0FDckQsR0FEcUQsQ0FDakQsSUFBSSxDQUFDLFNBQUwsQ0FBZSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQTNCLEVBQWlDO2dCQUFBLE1BQUEsRUFBTyxJQUFQO2FBQWpDLENBRGlELEVBRnpEOztRQUtBLElBQUcsSUFBSSxDQUFDLEtBQVI7WUFDRyxPQUFBLENBQUMsR0FBRCxDQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBZCxDQUFtQixPQUFuQixDQUFMO1lBQStCLE9BQUEsQ0FDOUIsR0FEOEIsQ0FDMUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFiLENBQWtCLGFBQWxCLEVBQWlDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBOUMsQ0FEMEI7WUFDd0IsT0FBQSxDQUN0RCxHQURzRCxDQUNsRCxJQUFJLENBQUMsU0FBTCxDQUFlLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBNUIsRUFBa0M7Z0JBQUEsTUFBQSxFQUFPLElBQVA7YUFBbEMsQ0FEa0QsRUFGMUQ7O1FBS0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO1FBRWYsSUFBRyxDQUFJLFNBQVMsQ0FBQyxNQUFkLElBQXlCLEtBQUEsQ0FBTSxJQUFJLENBQUMsUUFBWCxDQUE1QjtZQUNJLFNBQUEsR0FBWSxRQUFBLENBQVMsSUFBSSxDQUFDLFFBQWQsRUFBd0I7Z0JBQUEsWUFBQSxFQUFhLEtBQWI7YUFBeEIsRUFEaEI7O1FBR0EsSUFBQyxDQUFBLGlCQUFELENBQUE7UUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhO0lBL0RKOzttQkF1RWIsTUFBQSxHQUFRLFNBQUE7QUFFSixZQUFBO1FBQUEsT0FBb0IsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFwQixFQUFFLGtCQUFGLEVBQVM7UUFFVCxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsR0FBYyxNQUFBLEdBQVM7UUFDdkIsSUFBQyxDQUFBLEdBQUcsQ0FBQyxNQUFMLEdBQWM7UUFFZCxJQUFHLEtBQUEsQ0FBTSxJQUFDLENBQUEsU0FBUCxDQUFIO0FBQ0k7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksSUFBQyxDQUFBLG9CQUFELENBQXNCO29CQUFBLElBQUEsRUFBSyxJQUFMO2lCQUF0QjtBQURKO1lBRUEsT0FBTyxJQUFDLENBQUEsVUFIWjtTQUFBLE1BQUE7WUFLSSxJQUFxQixDQUFJLElBQUksQ0FBQyxPQUE5QjtnQkFBQSxJQUFDLENBQUEsY0FBRCxDQUFBLEVBQUE7YUFMSjs7UUFPQSxJQUFHLENBQUksSUFBQSxDQUFBLENBQU0sQ0FBQyxNQUFkO21CQUNJLElBQUMsQ0FBQSxvQkFBRCxDQUFzQjtnQkFBQSxJQUFBLEVBQUssY0FBQSxDQUFBLENBQUw7YUFBdEIsRUFESjs7SUFkSTs7bUJBdUJSLFlBQUEsR0FBYyxTQUFDLE1BQUQsRUFBUyxHQUFUO0FBRVYsZ0JBQU8sTUFBUDtBQUFBLGlCQUNTLGVBRFQ7dUJBQ2lDLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixHQUFwQjtBQURqQyxpQkFFUyxpQkFGVDt1QkFFaUMsSUFBQyxDQUFBLGNBQUQsQ0FBQTtBQUZqQyxpQkFHUyxZQUhUO3VCQUdpQyxJQUFDLENBQUEsWUFBRCxDQUFBO0FBSGpDO0lBRlU7O21CQWVkLElBQUEsR0FBYSxJQUFBLENBQUE7O21CQUNiLFNBQUEsR0FBYTs7bUJBQ2IsU0FBQSxHQUFhOzttQkFDYixXQUFBLEdBQWE7O21CQUViLG9CQUFBLEdBQXNCLFNBQUMsR0FBRDtRQUVsQixHQUFBLEdBQU0sSUFBQyxDQUFBLFlBQUQsQ0FBYyxTQUFDLEdBQUQ7bUJBQ2hCLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLEVBQWYsRUFBbUIsV0FBbkIsRUFBZ0MsQ0FBQyxHQUFHLENBQUMsSUFBTCxDQUFoQztRQURnQixDQUFkO2VBRU47SUFKa0I7O21CQU10QixhQUFBLEdBQWUsU0FBQyxFQUFEO1FBRVgsSUFBRyxLQUFBLENBQU0sSUFBQSxDQUFBLENBQU4sQ0FBSDtZQUVJLElBQUcsS0FBQSxDQUFNLFdBQUEsQ0FBQSxDQUFOLENBQUg7Z0JBRUksSUFBRyxTQUFBLENBQUEsQ0FBSDtvQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBREo7aUJBQUEsTUFBQTtvQkFHSSxJQUFDLENBQUEsWUFBRCxDQUFBLEVBSEo7aUJBRko7YUFBQSxNQUFBO2dCQU9JLElBQUMsQ0FBQSxXQUFELENBQUEsRUFQSjs7bUJBU0EsRUFBQSxDQUFHLEtBQUEsQ0FBTSxXQUFBLENBQUEsQ0FBTixDQUFILEVBWEo7U0FBQSxNQUFBO21CQWFJLElBQUMsQ0FBQSxZQUFELENBQWMsRUFBZCxFQWJKOztJQUZXOzttQkFpQmYsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO0FBQUE7QUFBQSxhQUFBLHNDQUFBOztZQUNJLENBQUMsQ0FBQyxJQUFGLENBQUE7WUFDQSxJQUFDLENBQUEsUUFBRCxDQUFBO0FBRko7ZUFHQTtJQUxTOzttQkFPYixXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksQ0FBQyxDQUFDLElBQUYsQ0FBQTtZQUNBLElBQUMsQ0FBQSxRQUFELENBQUE7QUFGSjtlQUdBO0lBTFM7O21CQU9iLFlBQUEsR0FBYyxTQUFBO0FBRVYsWUFBQTtRQUFBLElBQUcsS0FBQSxDQUFNLFdBQUEsQ0FBQSxDQUFOLENBQUg7QUFDSTtBQUFBLGlCQUFBLHNDQUFBOztnQkFDSSxDQUFDLENBQUMsWUFBRixDQUFBO0FBREo7WUFFQSxXQUFBLENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBRSxDQUFDLFlBQWpCLENBQUE7WUFDQSxXQUFBLENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQWpCLENBQUEsRUFKSjs7ZUFLQTtJQVBVOzttQkFTZCxrQkFBQSxHQUFvQixTQUFDLEdBQUQ7QUFFaEIsWUFBQTtRQUFBLElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxHQUFYLENBQUg7WUFBdUIsR0FBQSxHQUFNLFNBQUEsQ0FBVSxHQUFWLEVBQTdCOztRQUNBLFVBQUEsR0FBYSxJQUFBLENBQUE7QUFDYixhQUFBLDRDQUFBOztZQUNJLElBQUcsQ0FBQSxLQUFLLEdBQVI7Z0JBQ0ksQ0FBQSxHQUFJLENBQUEsR0FBSSxVQUFVLENBQUMsT0FBWCxDQUFtQixDQUFuQjtnQkFDUixJQUFTLENBQUEsSUFBSyxVQUFVLENBQUMsTUFBekI7b0JBQUEsQ0FBQSxHQUFJLEVBQUo7O2dCQUNBLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsRUFBcEM7QUFDQSx1QkFBTyxFQUpYOztBQURKO2VBTUE7SUFWZ0I7O21CQVlwQixrQkFBQSxHQUFvQixTQUFDLEdBQUQ7QUFFaEIsWUFBQTtRQUFBLElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxHQUFYLENBQUg7WUFBdUIsR0FBQSxHQUFNLFNBQUEsQ0FBVSxHQUFWLEVBQTdCOztRQUNBLFVBQUEsR0FBYSxJQUFBLENBQUE7QUFDYixhQUFBLDRDQUFBOztZQUNJLElBQUcsQ0FBQSxLQUFLLEdBQVI7Z0JBQ0ksQ0FBQSxHQUFJLENBQUMsQ0FBRCxHQUFLLFVBQVUsQ0FBQyxPQUFYLENBQW1CLENBQW5CO2dCQUNULElBQTJCLENBQUEsR0FBSSxDQUEvQjtvQkFBQSxDQUFBLEdBQUksVUFBVSxDQUFDLE1BQVgsR0FBa0IsRUFBdEI7O2dCQUNBLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsRUFBcEM7QUFDQSx1QkFBTyxFQUpYOztBQURKO2VBTUE7SUFWZ0I7O21CQVlwQixvQkFBQSxHQUFzQixTQUFDLEdBQUQ7QUFFbEIsWUFBQTtRQUFBLENBQUEsR0FBSSxTQUFBLENBQVUsR0FBVjtRQUNKLElBQWMsU0FBZDtBQUFBLG1CQUFBOztRQUNBLElBQUcsQ0FBSSxDQUFDLENBQUMsU0FBRixDQUFBLENBQVA7WUFDSSxDQUFDLENBQUMsSUFBRixDQUFBLEVBREo7U0FBQSxNQUFBO1lBR0ksQ0FBQyxDQUFDLEtBQUYsQ0FBQSxFQUhKOztlQUlBO0lBUmtCOzttQkFnQnRCLFVBQUEsR0FBWSxTQUFBO2VBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxpQkFBaEIsQ0FBQSxDQUFtQyxDQUFDO0lBQXZDOzttQkFFWixZQUFBLEdBQWMsU0FBQTtBQUVWLFlBQUE7UUFBQSxPQUFrQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQWxCLEVBQUMsa0JBQUQsRUFBUTtRQUNSLEVBQUEsR0FBSyxNQUFBLEdBQVM7UUFDZCxFQUFBLEdBQUssV0FBQSxDQUFBO0FBQ0wsYUFBQSxvQ0FBQTs7WUFDSSxDQUFDLENBQUMsWUFBRixDQUFBO1lBQ0EsQ0FBQyxDQUFDLFNBQUYsQ0FDSTtnQkFBQSxDQUFBLEVBQVEsUUFBQSxDQUFTLENBQUMsS0FBQSxHQUFNLEVBQVAsQ0FBQSxHQUFXLENBQXBCLENBQVI7Z0JBQ0EsQ0FBQSxFQUFRLFFBQUEsQ0FBUyxDQUFULENBRFI7Z0JBRUEsS0FBQSxFQUFRLFFBQUEsQ0FBUyxFQUFULENBRlI7Z0JBR0EsTUFBQSxFQUFRLFFBQUEsQ0FBUyxNQUFULENBSFI7YUFESjtBQUZKO2VBT0EsU0FBQSxDQUFBLENBQVcsQ0FBQyxJQUFaLENBQUE7SUFaVTs7bUJBY2QsaUJBQUEsR0FBbUIsU0FBQTtBQUVmLFlBQUE7UUFBQSxFQUFBLEdBQUssV0FBQSxDQUFBO1FBQ0wsSUFBZ0IsS0FBQSxDQUFNLEVBQU4sQ0FBaEI7QUFBQSxtQkFBTyxNQUFQOztBQUVBLGFBQUEsb0NBQUE7O1lBQ0ksSUFBRyxDQUFDLENBQUMsWUFBRixDQUFBLENBQUg7Z0JBQ0ksQ0FBQyxDQUFDLGFBQUYsQ0FBZ0IsS0FBaEIsRUFESjs7QUFESjtRQUlBLE1BQUEsR0FBUyxFQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBTixDQUFBO1FBRVQsSUFBZ0IsRUFBRSxDQUFDLE1BQUgsS0FBYSxDQUFiLElBQW1CLE1BQU0sQ0FBQyxLQUFQLEtBQWdCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYSxDQUFDLEtBQWpFO0FBQUEsbUJBQU8sTUFBUDs7QUFFQSxhQUFVLHlGQUFWO1lBQ0ksSUFBRyxDQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsRUFBRyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFNBQVAsQ0FBQSxDQUFWLEVBQThCLE1BQTlCLENBQVA7QUFDSSx1QkFBTyxNQURYOztBQURKO2VBR0E7SUFoQmU7O21CQXdCbkIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLFdBQUEsR0FBYztRQUNkLFNBQUEsR0FBWTtRQUNaLEVBQUEsR0FBSyxXQUFBLENBQUE7UUFDTCxPQUFvQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQXBCLEVBQUUsa0JBQUYsRUFBUztRQUVULElBQUcsQ0FBSSxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFQO1lBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBQTtZQUNBLFdBQUEsR0FBYztBQUNkLG1CQUhKOztRQUtBLElBQUcsRUFBRSxDQUFDLE1BQUgsS0FBYSxDQUFoQjtZQUNJLEVBQUcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxZQUFOLENBQUE7WUFDQSxFQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBTixDQUNJO2dCQUFBLENBQUEsRUFBUSxDQUFSO2dCQUNBLENBQUEsRUFBUSxDQURSO2dCQUVBLEtBQUEsRUFBUSxLQUZSO2dCQUdBLE1BQUEsRUFBUSxNQUhSO2FBREosRUFGSjtTQUFBLE1BT0ssSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWIsSUFBa0IsRUFBRSxDQUFDLE1BQUgsS0FBYSxDQUFsQztZQUNELENBQUEsR0FBSSxLQUFBLEdBQU0sRUFBRSxDQUFDO0FBQ2IsaUJBQVMsdUZBQVQ7Z0JBQ0ksRUFBRyxDQUFBLENBQUEsQ0FBRSxDQUFDLFlBQU4sQ0FBQTtnQkFDQSxFQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBTixDQUNJO29CQUFBLENBQUEsRUFBUSxRQUFBLENBQVMsQ0FBQSxHQUFJLENBQUosR0FBUSxDQUFDLENBQUEsR0FBSSxDQUFKLElBQVUsU0FBQSxHQUFVLENBQXBCLElBQXlCLENBQTFCLENBQWpCLENBQVI7b0JBQ0EsS0FBQSxFQUFRLFFBQUEsQ0FBUyxDQUFBLEdBQUksQ0FBQyxDQUFDLENBQUEsS0FBSyxDQUFMLElBQVUsQ0FBQSxLQUFLLEVBQUUsQ0FBQyxNQUFILEdBQVUsQ0FBMUIsQ0FBQSxJQUFpQyxTQUFBLEdBQVUsQ0FBM0MsSUFBZ0QsU0FBakQsQ0FBYixDQURSO29CQUVBLENBQUEsRUFBUSxRQUFBLENBQVMsQ0FBVCxDQUZSO29CQUdBLE1BQUEsRUFBUSxRQUFBLENBQVMsTUFBVCxDQUhSO2lCQURKO0FBRkosYUFGQztTQUFBLE1BU0EsSUFBRyxFQUFFLENBQUMsTUFBTjtZQUNELEVBQUEsR0FBSyxRQUFBLENBQVMsRUFBRSxDQUFDLE1BQUgsR0FBVSxDQUFuQjtZQUNMLEVBQUEsR0FBSztBQUNMLGlCQUFTLGdGQUFUO2dCQUNJLENBQUEsR0FBSSxLQUFBLEdBQU07Z0JBQ1YsRUFBRyxDQUFBLENBQUEsQ0FBRSxDQUFDLFlBQU4sQ0FBQTtnQkFDQSxFQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBTixDQUNJO29CQUFBLENBQUEsRUFBUSxRQUFBLENBQVMsQ0FBQSxHQUFJLENBQUosR0FBUSxDQUFDLENBQUEsR0FBSSxDQUFKLElBQVUsU0FBQSxHQUFVLENBQXBCLElBQXlCLENBQTFCLENBQWpCLENBQVI7b0JBQ0EsS0FBQSxFQUFRLFFBQUEsQ0FBUyxDQUFBLEdBQUksQ0FBQyxDQUFDLENBQUEsS0FBSyxDQUFMLElBQVUsQ0FBQSxLQUFLLEVBQUEsR0FBRyxDQUFuQixDQUFBLElBQTBCLFNBQUEsR0FBVSxDQUFwQyxJQUF5QyxTQUExQyxDQUFiLENBRFI7b0JBRUEsQ0FBQSxFQUFRLFFBQUEsQ0FBUyxDQUFULENBRlI7b0JBR0EsTUFBQSxFQUFRLFFBQUEsQ0FBUyxFQUFBLEdBQUcsQ0FBWixDQUhSO2lCQURKO0FBSEo7QUFRQSxpQkFBUyxxR0FBVDtnQkFDSSxDQUFBLEdBQUksS0FBQSxHQUFNLENBQUMsRUFBRSxDQUFDLE1BQUgsR0FBVSxFQUFYO2dCQUNWLEVBQUcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxZQUFOLENBQUE7Z0JBQ0EsRUFBRyxDQUFBLENBQUEsQ0FBRSxDQUFDLFNBQU4sQ0FDSTtvQkFBQSxDQUFBLEVBQVEsUUFBQSxDQUFTLENBQUMsQ0FBQSxHQUFFLEVBQUgsQ0FBQSxHQUFTLENBQVQsR0FBYSxDQUFDLENBQUEsR0FBRSxFQUFGLEdBQU8sQ0FBUCxJQUFhLFNBQUEsR0FBVSxDQUF2QixJQUE0QixDQUE3QixDQUF0QixDQUFSO29CQUNBLENBQUEsRUFBUSxRQUFBLENBQVMsRUFBQSxHQUFHLENBQUgsR0FBSyxFQUFkLENBRFI7b0JBRUEsS0FBQSxFQUFRLFFBQUEsQ0FBUyxDQUFBLEdBQUksQ0FBQyxDQUFDLENBQUEsR0FBRSxFQUFGLEtBQVEsQ0FBUixJQUFhLENBQUEsS0FBSyxFQUFFLENBQUMsTUFBSCxHQUFVLENBQTdCLENBQUEsSUFBb0MsU0FBQSxHQUFVLENBQTlDLElBQW1ELFNBQXBELENBQWIsQ0FGUjtvQkFHQSxNQUFBLEVBQVEsUUFBQSxDQUFTLEVBQUEsR0FBRyxDQUFaLENBSFI7aUJBREo7QUFISixhQVhDOztRQW1CTCxXQUFBLEdBQWM7QUFFZCxjQUFNLElBQUksS0FBSixDQUFVLE1BQVY7SUFqRE07O21CQXlEaEIsaUJBQUEsR0FBbUIsU0FBQTtBQUVmLFlBQUE7UUFBQSxRQUFBLEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QjtRQUNYLElBQUcsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsUUFBaEIsQ0FBSDttQkFDSSxFQUFFLENBQUMsUUFBSCxDQUFZLFFBQVosRUFBc0IsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixDQUF0QixFQUFvRDtnQkFBQSxTQUFBLEVBQVcsSUFBWDthQUFwRCxFQURKOztJQUhlOzttQkFNbkIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUMsQ0FBQSxRQUFsQjtRQUNBLFVBQUEsR0FBYSxRQUFBLENBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixDQUFULEVBQXVDO1lBQUEsUUFBQSxFQUFTLE1BQVQ7U0FBdkM7UUFDYixJQUFHLENBQUksS0FBQSxDQUFNLFVBQU4sQ0FBUDtBQUNJO2lCQUFBLDRDQUFBOztnQkFDSSxHQUFBLEdBQU0sSUFBQyxDQUFBLFlBQUQsQ0FBQTtnQkFDTixRQUFBLEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixFQUFnQyxHQUFHLENBQUMsRUFBTCxHQUFRLE9BQXZDOzZCQUNYLEVBQUUsQ0FBQyxRQUFILENBQVksSUFBWixFQUFrQixRQUFsQjtBQUhKOzJCQURKOztJQUpZOzttQkFVaEIsb0JBQUEsR0FBc0IsU0FBQTtBQUVsQixZQUFBO1FBQUEsSUFBRyxLQUFBLENBQU0sSUFBQSxDQUFBLENBQU4sQ0FBSDtBQUNJO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUNJLEdBQUcsQ0FBQyxJQUFKLENBQUE7QUFESjsyQkFESjtTQUFBLE1BQUE7WUFJSSxJQUFDLENBQUEsaUJBQUQsQ0FBQTttQkFDQSxJQUFDLENBQUEsY0FBRCxDQUFBLEVBTEo7O0lBRmtCOzttQkFldEIsV0FBQSxHQUFhLFNBQUMsS0FBRDtBQUVULFlBQUE7UUFBQSxJQUFVLFdBQVY7QUFBQSxtQkFBQTs7UUFDQSxTQUFBLEdBQVk7UUFDWixFQUFBLEdBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFiLENBQUE7QUFDTDtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksSUFBWSxDQUFBLEtBQUssS0FBSyxDQUFDLE1BQXZCO0FBQUEseUJBQUE7O1lBQ0EsQ0FBQSxHQUFJLENBQUMsQ0FBQyxTQUFGLENBQUE7WUFDSixJQUFHLENBQUMsQ0FBQyxNQUFGLEtBQVksRUFBRSxDQUFDLE1BQWYsSUFBMEIsQ0FBQyxDQUFDLENBQUYsS0FBTyxFQUFFLENBQUMsQ0FBdkM7Z0JBQ0ksSUFBRyxDQUFDLENBQUMsQ0FBRixHQUFNLEVBQUUsQ0FBQyxDQUFaO29CQUNJLElBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFDLENBQUMsQ0FBRixHQUFJLENBQUMsQ0FBQyxLQUFOLEdBQVksRUFBRSxDQUFDLENBQXhCLENBQUEsR0FBNkIsYUFBaEM7d0JBQ0ksQ0FBQyxDQUFDLFlBQUYsQ0FBQTtxQ0FDQSxDQUFDLENBQUMsU0FBRixDQUNJOzRCQUFBLENBQUEsRUFBUSxDQUFDLENBQUMsQ0FBVjs0QkFDQSxDQUFBLEVBQVEsQ0FBQyxDQUFDLENBRFY7NEJBRUEsS0FBQSxFQUFRLEVBQUUsQ0FBQyxDQUFILEdBQU8sQ0FBQyxDQUFDLENBQVQsR0FBYSxTQUZyQjs0QkFHQSxNQUFBLEVBQVEsQ0FBQyxDQUFDLE1BSFY7eUJBREosR0FGSjtxQkFBQSxNQUFBOzZDQUFBO3FCQURKO2lCQUFBLE1BUUssSUFBRyxDQUFDLENBQUMsQ0FBRixHQUFJLENBQUMsQ0FBQyxLQUFOLEdBQWMsRUFBRSxDQUFDLENBQUgsR0FBSyxFQUFFLENBQUMsS0FBekI7b0JBQ0QsSUFBRyxJQUFJLENBQUMsR0FBTCxDQUFTLEVBQUUsQ0FBQyxDQUFILEdBQUssRUFBRSxDQUFDLEtBQVIsR0FBYyxDQUFDLENBQUMsQ0FBekIsQ0FBQSxHQUE4QixhQUFqQzt3QkFDSSxDQUFDLENBQUMsWUFBRixDQUFBO3FDQUNBLENBQUMsQ0FBQyxTQUFGLENBQ0k7NEJBQUEsQ0FBQSxFQUFRLEVBQUUsQ0FBQyxDQUFILEdBQUssRUFBRSxDQUFDLEtBQVIsR0FBYyxTQUF0Qjs0QkFDQSxDQUFBLEVBQVEsQ0FBQyxDQUFDLENBRFY7NEJBRUEsS0FBQSxFQUFRLENBQUMsQ0FBQyxDQUFGLEdBQUksQ0FBQyxDQUFDLEtBQU4sR0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFILEdBQUssRUFBRSxDQUFDLEtBQVIsR0FBYyxTQUFmLENBRnRCOzRCQUdBLE1BQUEsRUFBUSxDQUFDLENBQUMsTUFIVjt5QkFESixHQUZKO3FCQUFBLE1BQUE7NkNBQUE7cUJBREM7aUJBQUEsTUFBQTt5Q0FBQTtpQkFUVDthQUFBLE1BQUE7cUNBQUE7O0FBSEo7O0lBTFM7O21CQTBCYixVQUFBLEdBQVksU0FBQyxLQUFEO0FBRVIsWUFBQTtRQUFBLEdBQUEsR0FBTSxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ25CLElBQUcsSUFBQSxDQUFBLENBQU0sQ0FBQyxNQUFQLEtBQWlCLENBQXBCO1lBQ0ksSUFBRyxLQUFLLENBQUMsR0FBTixDQUFBLENBQUg7Z0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUNBLHVCQUZKO2FBQUEsTUFBQTtnQkFJSSxJQUFDLENBQUEsUUFBRCxDQUFBLEVBSko7YUFESjs7UUFNQSxJQUFJLENBQUMsS0FBTCxDQUFXLFdBQVgsRUFBd0IsR0FBeEI7ZUFDQSxJQUFDLENBQUEsa0JBQUQsQ0FBQTtJQVZROzttQkFrQlosaUJBQUEsR0FBbUIsU0FBQyxFQUFEO1FBRWYsSUFBRyxLQUFBLENBQU0sV0FBQSxDQUFBLENBQU4sQ0FBSDtZQUNHLE9BQUEsQ0FBQyxHQUFELENBQUssZUFBTDtZQUNDLElBQUMsQ0FBQSxhQUFELENBQWUsRUFBZjtBQUNBLG1CQUhKOztRQUtBLElBQUcsQ0FBSSxTQUFBLENBQUEsQ0FBUDtZQUNJLElBQUcsR0FBQSxHQUFNLFdBQUEsQ0FBQSxDQUFjLENBQUEsQ0FBQSxDQUF2QjtnQkFJSSxHQUFHLENBQUMsS0FBSixDQUFBO3VCQUNBLEVBQUEsQ0FBRyxHQUFILEVBTEo7YUFBQSxNQUFBO3VCQU9JLEVBQUEsQ0FBRyxJQUFILEVBUEo7YUFESjtTQUFBLE1BQUE7bUJBVUksRUFBQSxDQUFHLFdBQUEsQ0FBQSxDQUFjLENBQUEsQ0FBQSxDQUFqQixFQVZKOztJQVBlOzttQkFtQm5CLGVBQUEsR0FBaUIsU0FBQyxJQUFELEVBQU8sR0FBUDtRQUVkLE9BQUEsQ0FBQyxHQUFELENBQUssc0JBQUwsRUFBOEIsR0FBOUI7UUFBaUMsT0FBQSxDQUNoQyxHQURnQyxDQUM1Qix1QkFENEIsRUFDSCxJQURHO2VBR2hDLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixTQUFDLEdBQUQ7QUFFZixnQkFBQTtZQUFBLEtBQUEsR0FBUTtZQUNSLHVDQUFjLENBQUUsUUFBYixDQUF5QixHQUFHLENBQUMsSUFBTCxHQUFVLE1BQWxDLFVBQUg7Z0JBQ0ksUUFBQSxHQUFXLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxFQURmO2FBQUEsTUFBQTtnQkFHSSxRQUFBLEdBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLEVBSGY7O0FBS0EsaUJBQUEsMENBQUE7O2dCQUNJLElBQVksR0FBRyxDQUFDLFVBQUosQ0FBZSxHQUFmLENBQVo7QUFBQSw2QkFBQTs7Z0JBQ0EsSUFBQSxHQUFPO2dCQUNQLElBQUcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsQ0FBSDtvQkFDSSxJQUFBLEdBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBWCxFQUErQixHQUEvQixFQURYOztnQkFFQSxPQUFlLEtBQUssQ0FBQyxZQUFOLENBQW1CLElBQW5CLENBQWYsRUFBQyxlQUFELEVBQVE7Z0JBQ1IsSUFBRyxLQUFLLENBQUMsTUFBTixDQUFhLEtBQWIsQ0FBSDtvQkFDSSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsRUFESjs7QUFOSjtZQVNBLE9BQUEsQ0FBQSxHQUFBLENBQUksdUJBQUosRUFBNkIsS0FBN0I7bUJBRUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFHLENBQUMsRUFBZixFQUFtQixXQUFuQixFQUFnQyxLQUFoQyxFQUF1QztnQkFBQSxNQUFBLEVBQU8sSUFBUDthQUF2QztRQW5CZSxDQUFuQjtJQUxhOzttQkFnQ2pCLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTtRQUFBLE1BQUEsR0FBUyxJQUFBLENBQUEsQ0FBTSxDQUFDO1FBRWhCLElBQUcsTUFBSDtZQUNJLElBQUksQ0FBQyxNQUFMLENBQVksV0FBWjtZQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFzQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO29CQUNsQixNQUFBLElBQVU7b0JBQ1YsSUFBRyxNQUFBLEtBQVUsQ0FBYjt3QkFDSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQWIsQ0FBQTsrQkFDQSxLQUFDLENBQUEsT0FBRCxDQUFBLEVBRko7O2dCQUZrQjtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEI7bUJBS0EsUUFQSjtTQUFBLE1BQUE7bUJBU0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFiLENBQUEsRUFUSjs7SUFKRTs7OztHQXphUzs7QUE4Ym5CLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBYixDQUFnQixXQUFoQixFQUE2QixTQUFDLEtBQUQsRUFBUSxJQUFSO0lBRXpCLElBQU8sWUFBUDtRQUNJLFNBQVMsQ0FBQyxJQUFWLENBQWUsSUFBZixFQURKO0tBQUEsTUFBQTtRQUdJLElBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFiLENBQUEsQ0FBSDtZQUNJLElBQUksQ0FBQyxpQkFBTCxDQUF1QixTQUFDLEdBQUQ7dUJBQ25CLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLEVBQWYsRUFBbUIsV0FBbkIsRUFBZ0MsQ0FBQyxJQUFELENBQWhDO1lBRG1CLENBQXZCLEVBREo7U0FBQSxNQUFBO1lBSUksSUFBSSxDQUFDLG9CQUFMLENBQTBCO2dCQUFBLElBQUEsRUFBSyxJQUFMO2FBQTFCLEVBSko7U0FISjs7V0FTQSxLQUFLLENBQUMsY0FBTixDQUFBO0FBWHlCLENBQTdCOztBQWFBLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBYixDQUFnQixtQkFBaEIsRUFBcUMsU0FBQTtXQUFDLE9BQUEsQ0FBRSxHQUFGLENBQU0sbUJBQU47QUFBRCxDQUFyQzs7QUFRQSxLQUFBLEdBQVEsU0FBQyxJQUFEO1dBQ0osSUFBSSxDQUFDLGlCQUFMLENBQXVCLFNBQUMsR0FBRDtlQUNuQixJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxFQUFmLEVBQW1CLFdBQW5CLEVBQWdDLENBQUMsSUFBRCxDQUFoQztJQURtQixDQUF2QjtBQURJOztBQUlSLFVBQUEsR0FBYSxJQUFJLEdBQUosQ0FBUTtJQUFBLElBQUEsRUFBSyxJQUFMO0lBQVcsS0FBQSxFQUFNLEtBQWpCO0NBQVI7O0FBRWIsSUFBQSxHQUFnQixJQUFJLElBQUosQ0FBUyxTQUFUOztBQUNoQixJQUFJLENBQUMsUUFBTCxHQUFnQixJQUFJLFFBQUosQ0FBYSxJQUFiIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgZmlsZWxpc3QsIGNvbG9ycywgZmlyc3QsIGVtcHR5LCBwcmVmcywgc3RvcmUsIHNsYXNoLCB2YWxpZCwgc3RvcmUsIG5vb24sIGFyZ3MsIHdpbiwgYXBwLCB1ZHAsIG9zLCBmcywga2xvZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG4jIHBvc3QuZGVidWcoKVxuIyBsb2cuc2xvZy5kZWJ1ZyA9IHRydWVcblxucGtnICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5OYXZpZ2F0ZSA9IHJlcXVpcmUgJy4vbmF2aWdhdGUnXG5JbmRleGVyICA9IHJlcXVpcmUgJy4vaW5kZXhlcidcblxueyBCcm93c2VyV2luZG93LCBjbGlwYm9hcmQsIGRpYWxvZyB9ID0gZWxlY3Ryb25cblxuZGlzYWJsZVNuYXAgICA9IGZhbHNlXG5tYWluICAgICAgICAgID0gdW5kZWZpbmVkXG5vcGVuRmlsZXMgICAgID0gW11cbldJTl9TTkFQX0RJU1QgPSAxNTBcblxuIyBwcm9jZXNzLmVudi5OT0RFX0VOViA9ICdwcm9kdWN0aW9uJyAjID8/P1xuICAgIFxubW9zdFJlY2VudEZpbGUgPSAtPiBmaXJzdCBzdGF0ZS5nZXQgJ3JlY2VudEZpbGVzJ1xuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2lucyAgICAgICAgPSAtPiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5zb3J0IChhLGIpIC0+IGEuaWQgLSBiLmlkXG5hY3RpdmVXaW4gICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG52aXNpYmxlV2lucyA9IC0+ICh3IGZvciB3IGluIHdpbnMoKSB3aGVuIHc/LmlzVmlzaWJsZSgpIGFuZCBub3Qgdz8uaXNNaW5pbWl6ZWQoKSlcblxud2luV2l0aElEICAgPSAod2luSUQpIC0+XG5cbiAgICB3aWQgPSBwYXJzZUludCB3aW5JRFxuICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICByZXR1cm4gdyBpZiB3LmlkID09IHdpZFxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub25HZXQgJ2RlYnVnTW9kZScsIC0+IGFyZ3MuZGVidWdcbnBvc3Qub25HZXQgJ3dpbkluZm9zJywgIC0+IChpZDogdy5pZCBmb3IgdyBpbiB3aW5zKCkpXG5wb3N0Lm9uR2V0ICdsb2dTeW5jJywgICAtPlxuICAgIGNvbnNvbGUubG9nLmFwcGx5IGNvbnNvbGUsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuICAgIHJldHVybiB0cnVlXG5cbnBvc3Qub24gJ3Rocm93RXJyb3InLCAgICAgICAgICAgICAgICAgLT4gdGhyb3cgbmV3IEVycm9yICdlcnInXG5wb3N0Lm9uICduZXdXaW5kb3dXaXRoRmlsZScsICAoZmlsZSkgIC0+IG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG5wb3N0Lm9uICdhY3RpdmF0ZVdpbmRvdycsICAgICAod2luSUQpIC0+IG1haW4uYWN0aXZhdGVXaW5kb3dXaXRoSUQgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlTmV4dFdpbmRvdycsICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZU5leHRXaW5kb3cgd2luSURcbnBvc3Qub24gJ2FjdGl2YXRlUHJldldpbmRvdycsICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZVByZXZXaW5kb3cgd2luSURcblxucG9zdC5vbiAnbWVudUFjdGlvbicsICAgKGFjdGlvbiwgYXJnKSAtPiBtYWluPy5vbk1lbnVBY3Rpb24gYWN0aW9uLCBhcmdcbnBvc3Qub24gJ3BpbmcnLCAod2luSUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd2luSUQsICdwb25nJywgJ21haW4nLCBhcmdBLCBhcmdCXG5wb3N0Lm9uICd3aW5sb2cnLCAgICAgICAod2luSUQsIHRleHQpIC0+IFxuICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICBsb2cgXCIje3dpbklEfT4+PiBcIiArIHRleHRcblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbmNsYXNzIE1haW4gZXh0ZW5kcyBhcHBcblxuICAgIGNvbnN0cnVjdG9yOiAob3BlbkZpbGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgZGlyczogICAgICAgWycuLi8nLCAnLi4vYnJvd3NlcicsICcuLi9jb21tYW5kbGluZScsICcuLi9jb21tYW5kcycsICcuLi9lZGl0b3InLCAnLi4vZ2l0JywgJy4uL21haW4nLCAnLi4vdG9vbHMnLCAnLi4vd2luJ11cbiAgICAgICAgICAgIHBrZzogICAgICAgIHBrZ1xuICAgICAgICAgICAgc2hvcnRjdXQ6ICAgJ0NtZE9yQ3RybCtGMSdcbiAgICAgICAgICAgIGluZGV4OiAgICAgICcuLi9pbmRleC5odG1sJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgJy4uLy4uL2ltZy9hcHAuaWNvJ1xuICAgICAgICAgICAgdHJheTogICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIGFib3V0OiAgICAgICcuLi8uLi9pbWcvYWJvdXQucG5nJ1xuICAgICAgICAgICAgYWJvdXREZWJ1ZzogZmFsc2VcbiAgICAgICAgICAgIG9uU2hvdzogICAgIC0+IG1haW4ub25TaG93KClcbiAgICAgICAgICAgIG9uT3RoZXJJbnN0YW5jZTogKGFyZ3MsIGRpcikgLT4gbWFpbi5vbk90aGVySW5zdGFuY2UgYXJncywgZGlyXG4gICAgICAgICAgICB3aWR0aDogICAgICAxMDAwXG4gICAgICAgICAgICBoZWlnaHQ6ICAgICAxMDAwXG4gICAgICAgICAgICBtaW5XaWR0aDogICAyNDBcbiAgICAgICAgICAgIG1pbkhlaWdodDogIDIzMFxuICAgICAgICAgICAgYXJnczogXCJcIlwiXG4gICAgICAgICAgICAgICAgZmlsZWxpc3QgIGZpbGVzIHRvIG9wZW4gICAgICAgICAgICoqXG4gICAgICAgICAgICAgICAgcHJlZnMgICAgIHNob3cgcHJlZmVyZW5jZXMgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9wcmVmcyAgIGRvbid0IGxvYWQgcHJlZmVyZW5jZXMgIGZhbHNlXG4gICAgICAgICAgICAgICAgc3RhdGUgICAgIHNob3cgc3RhdGUgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgbm9zdGF0ZSAgIGRvbid0IGxvYWQgc3RhdGUgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgdmVyYm9zZSAgIGxvZyBtb3JlICAgICAgICAgICAgICAgIGZhbHNlXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wdC5vblF1aXQgPSBAcXVpdFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBwcm9jZXNzLmN3ZCgpID09ICcvJ1xuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBzbGFzaC5yZXNvbHZlICd+J1xuICAgICAgICAgICAgXG4gICAgICAgIHdoaWxlIHZhbGlkKGFyZ3MuZmlsZWxpc3QpIGFuZCBzbGFzaC5kaXJFeGlzdHMgZmlyc3QgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBhcmdzLmZpbGVsaXN0LnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3MudmVyYm9zZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy53aGl0ZS5ib2xkIFwiXFxua29cIiwgY29sb3JzLmdyYXkgXCJ2I3twa2cudmVyc2lvbn1cXG5cIlxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHtjd2Q6IHByb2Nlc3MuY3dkKCl9LCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAnXFxuYXJncydcbiAgICAgICAgICAgIGxvZyBub29uLnN0cmluZ2lmeSBhcmdzLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgbG9nICcnXG5cbiAgICAgICAgZ2xvYmFsLnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScsIHNlcGFyYXRvcjogJ3wnXG5cbiAgICAgICAgYWxpYXMgPSBuZXcgc3RvcmUgJ2FsaWFzJ1xuICAgICAgICBcbiAgICAgICAgaWYgYXJncy5wcmVmc1xuICAgICAgICAgICAgbG9nIGNvbG9ycy55ZWxsb3cuYm9sZCAncHJlZnMnXG4gICAgICAgICAgICBsb2cgY29sb3JzLmdyZWVuLmJvbGQgJ3ByZWZzIGZpbGU6JywgcHJlZnMuc3RvcmUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IHByZWZzLnN0b3JlLmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBhcmdzLnN0YXRlXG4gICAgICAgICAgICBsb2cgY29sb3JzLnllbGxvdy5ib2xkICdzdGF0ZSdcbiAgICAgICAgICAgIGxvZyBjb2xvcnMuZ3JlZW4uYm9sZCAnc3RhdGUgZmlsZTonLCBnbG9iYWwuc3RhdGUuZmlsZVxuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGdsb2JhbC5zdGF0ZS5kYXRhLCBjb2xvcnM6dHJ1ZVxuICAgICAgICAgICAgXG4gICAgICAgIEBpbmRleGVyID0gbmV3IEluZGV4ZXJcblxuICAgICAgICBpZiBub3Qgb3BlbkZpbGVzLmxlbmd0aCBhbmQgdmFsaWQgYXJncy5maWxlbGlzdFxuICAgICAgICAgICAgb3BlbkZpbGVzID0gZmlsZWxpc3QgYXJncy5maWxlbGlzdCwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICAgICAgXG4gICAgICAgIEBvcGVuRmlsZXMgPSBvcGVuRmlsZXNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICBcbiAgICBvblNob3c6ID0+XG5cbiAgICAgICAgeyB3aWR0aCwgaGVpZ2h0IH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIFxuICAgICAgICBAb3B0LndpZHRoICA9IGhlaWdodCArIDEyMlxuICAgICAgICBAb3B0LmhlaWdodCA9IGhlaWdodFxuICAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBvcGVuRmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIEBvcGVuRmlsZXNcbiAgICAgICAgICAgICAgICBAY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgICAgICBkZWxldGUgQG9wZW5GaWxlc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcmVzdG9yZVdpbmRvd3MoKSBpZiBub3QgYXJncy5ub3N0YXRlXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgd2lucygpLmxlbmd0aFxuICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6bW9zdFJlY2VudEZpbGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChhY3Rpb24sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyAgICB0aGVuIEBhY3RpdmF0ZU5leHRXaW5kb3cgYXJnXG4gICAgICAgICAgICB3aGVuICdBcnJhbmdlIFdpbmRvd3MnICB0aGVuIEBhcnJhbmdlV2luZG93cygpXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICB0aGVuIEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgIyBsb2cgJ3VuaGFuZGxlZCBtZW51QWN0aW9uJywgYWN0aW9uLCBhcmdcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDBcblxuICAgIHdpbnM6ICAgICAgICB3aW5zKClcbiAgICB3aW5XaXRoSUQ6ICAgd2luV2l0aElEXG4gICAgYWN0aXZlV2luOiAgIGFjdGl2ZVdpblxuICAgIHZpc2libGVXaW5zOiB2aXNpYmxlV2luc1xuXG4gICAgY3JlYXRlV2luZG93V2l0aEZpbGU6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBbb3B0LmZpbGVdXG4gICAgICAgIHdpblxuICAgIFxuICAgIHRvZ2dsZVdpbmRvd3M6IChjYikgPT5cblxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGFjdGl2ZVdpbigpXG4gICAgICAgICAgICAgICAgICAgIEBoaWRlV2luZG93cygpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcmFpc2VXaW5kb3dzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAc2hvd1dpbmRvd3MoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2IgZmlyc3QgdmlzaWJsZVdpbnMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY3JlYXRlV2luZG93IGNiXG5cbiAgICBoaWRlV2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuaGlkZSgpXG4gICAgICAgICAgICBAaGlkZURvY2soKVxuICAgICAgICBAXG5cbiAgICBzaG93V2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgICAgICBAc2hvd0RvY2soKVxuICAgICAgICBAXG5cbiAgICByYWlzZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgZm9yIHcgaW4gdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uZm9jdXMoKVxuICAgICAgICBAXG5cbiAgICBhY3RpdmF0ZU5leHRXaW5kb3c6ICh3aW4pIC0+XG5cbiAgICAgICAgaWYgXy5pc051bWJlciB3aW4gdGhlbiB3aW4gPSB3aW5XaXRoSUQgd2luXG4gICAgICAgIGFsbFdpbmRvd3MgPSB3aW5zKClcbiAgICAgICAgZm9yIHcgaW4gYWxsV2luZG93c1xuICAgICAgICAgICAgaWYgdyA9PSB3aW5cbiAgICAgICAgICAgICAgICBpID0gMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IDAgaWYgaSA+PSBhbGxXaW5kb3dzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVQcmV2V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IC0xICsgYWxsV2luZG93cy5pbmRleE9mIHdcbiAgICAgICAgICAgICAgICBpID0gYWxsV2luZG93cy5sZW5ndGgtMSBpZiBpIDwgMFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVXaW5kb3dXaXRoSUQ6ICh3aWQpIC0+XG5cbiAgICAgICAgdyA9IHdpbldpdGhJRCB3aWRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCB3P1xuICAgICAgICBpZiBub3Qgdy5pc1Zpc2libGUoKVxuICAgICAgICAgICAgdy5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdy5mb2N1cygpXG4gICAgICAgIHdcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24uc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICBzdGFja1dpbmRvd3M6IC0+XG4gICAgICAgIFxuICAgICAgICB7d2lkdGgsIGhlaWdodH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIHd3ID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICBmb3IgdyBpbiB3bFxuICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50ICh3aWR0aC13dykvMlxuICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgd3dcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IGhlaWdodFxuICAgICAgICBhY3RpdmVXaW4oKS5zaG93KClcblxuICAgIHdpbmRvd3NBcmVTdGFja2VkOiAtPlxuICAgICAgICBcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBlbXB0eSB3bFxuICAgICAgICBcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIGlmIHcuaXNGdWxsU2NyZWVuKClcbiAgICAgICAgICAgICAgICB3LnNldEZ1bGxTY3JlZW4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBib3VuZHMgPSB3bFswXS5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgd2wubGVuZ3RoID09IDEgYW5kIGJvdW5kcy53aWR0aCA9PSBAc2NyZWVuU2l6ZSgpLndpZHRoXG4gICAgICAgIFxuICAgICAgICBmb3Igd2kgaW4gWzEuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsIHdsW3dpXS5nZXRCb3VuZHMoKSwgYm91bmRzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgYXJyYW5nZVdpbmRvd3M6ID0+XG5cbiAgICAgICAgZGlzYWJsZVNuYXAgPSB0cnVlXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHsgd2lkdGgsIGhlaWdodCB9ID0gQHNjcmVlblNpemUoKVxuXG4gICAgICAgIGlmIG5vdCBAd2luZG93c0FyZVN0YWNrZWQoKVxuICAgICAgICAgICAgQHN0YWNrV2luZG93cygpXG4gICAgICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiB3bC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgd2xbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHdsWzBdLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgIHg6ICAgICAgMFxuICAgICAgICAgICAgICAgIHk6ICAgICAgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgd2lkdGhcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICBlbHNlIGlmIHdsLmxlbmd0aCA9PSAyIG9yIHdsLmxlbmd0aCA9PSAzXG4gICAgICAgICAgICB3ID0gd2lkdGgvd2wubGVuZ3RoXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGhcbiAgICAgICAgICAgIHcyID0gcGFyc2VJbnQgd2wubGVuZ3RoLzJcbiAgICAgICAgICAgIHJoID0gaGVpZ2h0XG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLncyXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC93MlxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgaSAqIHcgLSAoaSA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaSA9PSAwIG9yIGkgPT0gdzItMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICAgICAgZm9yIGkgaW4gW3cyLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC8od2wubGVuZ3RoLXcyKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgKGktdzIpICogdyAtIChpLXcyID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCByaC8yKzIzXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaS13MiA9PSAwIG9yIGkgPT0gd2wubGVuZ3RoLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgJ3Rlc3QnXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgbW92ZVdpbmRvd1N0YXNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBzdGFzaERpciA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJ1xuICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc3Rhc2hEaXJcbiAgICAgICAgICAgIGZzLm1vdmVTeW5jIHN0YXNoRGlyLCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBvdmVyd3JpdGU6IHRydWVcblxuICAgIHJlc3RvcmVXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMgQHVzZXJEYXRhXG4gICAgICAgIHN0YXNoRmlsZXMgPSBmaWxlbGlzdCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBtYXRjaEV4dDonbm9vbidcbiAgICAgICAgaWYgbm90IGVtcHR5IHN0YXNoRmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIHN0YXNoRmlsZXNcbiAgICAgICAgICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgICAgICBuZXdTdGFzaCA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJywgXCIje3dpbi5pZH0ubm9vblwiXG4gICAgICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcblxuICAgIHRvZ2dsZVdpbmRvd0Zyb21UcmF5OiA9PiBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIGZvciB3aW4gaW4gd2lucygpXG4gICAgICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uUmVzaXplV2luOiAoZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGRpc2FibGVTbmFwXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2IgPSBldmVudC5zZW5kZXIuZ2V0Qm91bmRzKClcbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiB3ID09IGV2ZW50LnNlbmRlclxuICAgICAgICAgICAgYiA9IHcuZ2V0Qm91bmRzKClcbiAgICAgICAgICAgIGlmIGIuaGVpZ2h0ID09IHdiLmhlaWdodCBhbmQgYi55ID09IHdiLnlcbiAgICAgICAgICAgICAgICBpZiBiLnggPCB3Yi54XG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKGIueCtiLndpZHRoLXdiLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIGIueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICB3Yi54IC0gYi54ICsgZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgYi54K2Iud2lkdGggPiB3Yi54K3diLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKHdiLngrd2Iud2lkdGgtYi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICB3Yi54K3diLndpZHRoLWZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBiLngrYi53aWR0aCAtICh3Yi54K3diLndpZHRoLWZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG5cbiAgICBvbkNsb3NlV2luOiAoZXZlbnQpID0+XG5cbiAgICAgICAgd2lkID0gZXZlbnQuc2VuZGVyLmlkXG4gICAgICAgIGlmIHdpbnMoKS5sZW5ndGggPT0gMVxuICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICBAcXVpdCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGhpZGVEb2NrKClcbiAgICAgICAgcG9zdC50b0FsbCAnd2luQ2xvc2VkJywgd2lkXG4gICAgICAgIEBwb3N0RGVsYXllZE51bVdpbnMoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcblxuICAgIGFjdGl2YXRlT25lV2luZG93OiAoY2IpIC0+XG4gICAgXG4gICAgICAgIGlmIGVtcHR5IHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIGxvZyAndG9nZ2xlV2luZG93cydcbiAgICAgICAgICAgIEB0b2dnbGVXaW5kb3dzIGNiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBub3QgYWN0aXZlV2luKClcbiAgICAgICAgICAgIGlmIHdpbiA9IHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgICAgICAjIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgIyAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAjICAgICB3eHcuZm9yZWdyb3VuZCBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgY2Igd2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjYiB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICBcbiAgICBvbk90aGVySW5zdGFuY2U6IChhcmdzLCBkaXIpID0+XG5cbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZGlyOicsICBkaXJcbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgYXJnczonLCBhcmdzXG4gICAgICAgIFxuICAgICAgICBAYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cblxuICAgICAgICAgICAgZmlsZXMgPSBbXVxuICAgICAgICAgICAgaWYgZmlyc3QoYXJncyk/LmVuZHNXaXRoIFwiI3twa2cubmFtZX0uZXhlXCJcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZpbGVhcmdzID0gYXJncy5zbGljZSAyXG4gICAgXG4gICAgICAgICAgICBmb3IgYXJnIGluIGZpbGVhcmdzXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgYXJnLnN0YXJ0c1dpdGggJy0nXG4gICAgICAgICAgICAgICAgZmlsZSA9IGFyZ1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guam9pbiBzbGFzaC5yZXNvbHZlKGRpciksIGFyZ1xuICAgICAgICAgICAgICAgIFtmcGF0aCwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBmaWxlXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guZXhpc3RzIGZwYXRoXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2ggZmlsZVxuICAgIFxuICAgICAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZmlsZXMnLCBmaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBmaWxlcywgbmV3VGFiOnRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcXVpdDogPT5cblxuICAgICAgICB0b1NhdmUgPSB3aW5zKCkubGVuZ3RoXG5cbiAgICAgICAgaWYgdG9TYXZlXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnc2F2ZVN0YXNoJ1xuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcsID0+XG4gICAgICAgICAgICAgICAgdG9TYXZlIC09IDFcbiAgICAgICAgICAgICAgICBpZiB0b1NhdmUgPT0gMFxuICAgICAgICAgICAgICAgICAgICBnbG9iYWwuc3RhdGUuc2F2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBleGl0QXBwKClcbiAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5lbGVjdHJvbi5hcHAub24gJ29wZW4tZmlsZScsIChldmVudCwgZmlsZSkgLT5cblxuICAgIGlmIG5vdCBtYWluP1xuICAgICAgICBvcGVuRmlsZXMucHVzaCBmaWxlXG4gICAgZWxzZVxuICAgICAgICBpZiBlbGVjdHJvbi5hcHAuaXNSZWFkeSgpXG4gICAgICAgICAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBbZmlsZV0gXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgIFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuZWxlY3Ryb24uYXBwLm9uICd3aW5kb3ctYWxsLWNsb3NlZCcsIC0+IGxvZyAnd2luZG93LWFsbC1jbG9zZWQnXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgICAgICAgICBcblxub25VRFAgPSAoZmlsZSkgLT5cbiAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJywgW2ZpbGVdIFxuXG5rb1JlY2VpdmVyID0gbmV3IHVkcCBwb3J0Ojk3NzksIG9uTXNnOm9uVURQXG5cbm1haW4gICAgICAgICAgPSBuZXcgTWFpbiBvcGVuRmlsZXNcbm1haW4ubmF2aWdhdGUgPSBuZXcgTmF2aWdhdGUgbWFpblxuIl19
//# sourceURL=../../coffee/main/main.coffee
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb1RBQUE7SUFBQTs7OztBQVFBLE1BQTBILE9BQUEsQ0FBUSxLQUFSLENBQTFILEVBQUUsZUFBRixFQUFRLHVCQUFSLEVBQWtCLG1CQUFsQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLGlCQUF4QyxFQUErQyxpQkFBL0MsRUFBc0QsaUJBQXRELEVBQTZELGlCQUE3RCxFQUFvRSxpQkFBcEUsRUFBMkUsZUFBM0UsRUFBaUYsZUFBakYsRUFBdUYsYUFBdkYsRUFBNEYsYUFBNUYsRUFBaUcsYUFBakcsRUFBc0csV0FBdEcsRUFBMEcsV0FBMUcsRUFBOEcsZUFBOUcsRUFBb0g7O0FBS3BILEdBQUEsR0FBVyxPQUFBLENBQVEsb0JBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxPQUFBLEdBQVcsT0FBQSxDQUFRLFdBQVI7O0FBRVQsc0NBQUYsRUFBaUIsOEJBQWpCLEVBQTRCOztBQUU1QixXQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUNoQixTQUFBLEdBQWdCOztBQUNoQixhQUFBLEdBQWdCOztBQUloQixjQUFBLEdBQWlCLFNBQUE7V0FBRyxLQUFBLENBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLENBQU47QUFBSDs7QUFRakIsSUFBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsYUFBZCxDQUFBLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsU0FBQyxDQUFELEVBQUcsQ0FBSDtlQUFTLENBQUMsQ0FBQyxFQUFGLEdBQU8sQ0FBQyxDQUFDO0lBQWxCLENBQW5DO0FBQUg7O0FBQ2QsU0FBQSxHQUFjLFNBQUE7V0FBRyxhQUFhLENBQUMsZ0JBQWQsQ0FBQTtBQUFIOztBQUNkLFdBQUEsR0FBYyxTQUFBO0FB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LENBQXVCLFNBQUMsR0FBRDt1QkFDbkIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFHLENBQUMsRUFBZixFQUFtQixXQUFuQixFQUFnQyxDQUFDLElBQUQsQ0FBaEM7WUFEbUIsQ0FBdkIsRUFESjtTQUFBLE1BQUE7WUFJSSxJQUFJLENBQUMsb0JBQUwsQ0FBMEI7Z0JBQUEsSUFBQSxFQUFLLElBQUw7YUFBMUIsRUFKSjtTQUhKOztXQVNBLEtBQUssQ0FBQyxjQUFOLENBQUE7QUFYeUIsQ0FBN0I7O0FBYUEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFiLENBQWdCLG1CQUFoQixFQUFxQyxTQUFBO1dBQUMsT0FBQSxDQUFFLEdBQUYsQ0FBTSxtQkFBTjtBQUFELENBQXJDOztBQVFBLEtBQUEsR0FBUSxTQUFDLElBQUQ7V0FDSixJQUFJLENBQUMsaUJBQUwsQ0FBdUIsU0FBQyxHQUFEO2VBQ25CLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLEVBQWYsRUFBbUIsV0FBbkIsRUFBZ0MsQ0FBQyxJQUFELENBQWhDO0lBRG1CLENBQXZCO0FBREk7O0FBSVIsVUFBQSxHQUFhLElBQUksR0FBSixDQUFRO0lBQUEsSUFBQSxFQUFLLElBQUw7SUFBVyxLQUFBLEVBQU0sS0FBakI7Q0FBUjs7QUFFYixJQUFBLEdBQWdCLElBQUksSUFBSixDQUFTLFNBQVQ7O0FBQ2hCLElBQUksQ0FBQyxRQUFMLEdBQWdCLElBQUksUUFBSixDQUFhLElBQWIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBmaWxlbGlzdCwgY29sb3JzLCBmaXJzdCwgZW1wdHksIHByZWZzLCBzdG9yZSwgc2xhc2gsIHZhbGlkLCBzdG9yZSwgbm9vbiwgYXJncywgd2luLCBhcHAsIHVkcCwgb3MsIGZzLCBrbG9nLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbiMgcG9zdC5kZWJ1ZygpXG4jIGxvZy5zbG9nLmRlYnVnID0gdHJ1ZVxuXG5wa2cgICAgICA9IHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbmVsZWN0cm9uID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbk5hdmlnYXRlID0gcmVxdWlyZSAnLi9uYXZpZ2F0ZSdcbkluZGV4ZXIgID0gcmVxdWlyZSAnLi9pbmRleGVyJ1xuXG57IEJyb3dzZXJXaW5kb3csIGNsaXBib2FyZCwgZGlhbG9nIH0gPSBlbGVjdHJvblxuXG5kaXNhYmxlU25hcCAgID0gZmFsc2Vcbm1haW4gICAgICAgICAgPSB1bmRlZmluZWRcbm9wZW5GaWxlcyAgICAgPSBbXVxuV0lOX1NOQVBfRElTVCA9IDE1MFxuXG4jIHByb2Nlc3MuZW52Lk5PREVfRU5WID0gJ3Byb2R1Y3Rpb24nICMgPz8/XG4gICAgXG5tb3N0UmVjZW50RmlsZSA9IC0+IGZpcnN0IHN0YXRlLmdldCAncmVjZW50RmlsZXMnXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5zICAgICAgICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLnNvcnQgKGEsYikgLT4gYS5pZCAtIGIuaWRcbmFjdGl2ZVdpbiAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRGb2N1c2VkV2luZG93KClcbnZpc2libGVXaW5zID0gLT4gKHcgZm9yIHcgaW4gd2lucygpIHdoZW4gdz8uaXNWaXNpYmxlKCkgYW5kIG5vdCB3Py5pc01pbmltaXplZCgpKVxuXG53aW5XaXRoSUQgICA9ICh3aW5JRCkgLT5cblxuICAgIHdpZCA9IHBhcnNlSW50IHdpbklEXG4gICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgIHJldHVybiB3IGlmIHcuaWQgPT0gd2lkXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbkdldCAnZGVidWdNb2RlJywgLT4gYXJncy5kZWJ1Z1xucG9zdC5vbkdldCAnd2luSW5mb3MnLCAgLT4gKGlkOiB3LmlkIGZvciB3IGluIHdpbnMoKSlcbnBvc3Qub25HZXQgJ2xvZ1N5bmMnLCAgIC0+XG4gICAgY29uc29sZS5sb2cuYXBwbHkgY29uc29sZSwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG4gICAgcmV0dXJuIHRydWVcblxucG9zdC5vbiAndGhyb3dFcnJvcicsICAgICAgICAgICAgICAgICAtPiB0aHJvdyBuZXcgRXJyb3IgJ2VycidcbnBvc3Qub24gJ25ld1dpbmRvd1dpdGhGaWxlJywgIChmaWxlKSAgLT4gbWFpbi5jcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbnBvc3Qub24gJ2FjdGl2YXRlV2luZG93JywgICAgICh3aW5JRCkgLT4gbWFpbi5hY3RpdmF0ZVdpbmRvd1dpdGhJRCB3aW5JRFxucG9zdC5vbiAnYWN0aXZhdGVOZXh0V2luZG93JywgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlTmV4dFdpbmRvdyB3aW5JRFxucG9zdC5vbiAnYWN0aXZhdGVQcmV2V2luZG93JywgKHdpbklEKSAtPiBtYWluLmFjdGl2YXRlUHJldldpbmRvdyB3aW5JRFxuXG5wb3N0Lm9uICdtZW51QWN0aW9uJywgICAoYWN0aW9uLCBhcmcpIC0+IG1haW4/Lm9uTWVudUFjdGlvbiBhY3Rpb24sIGFyZ1xucG9zdC5vbiAncGluZycsICh3aW5JRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3aW5JRCwgJ3BvbmcnLCAnbWFpbicsIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3dpbmxvZycsICAgICAgICh3aW5JRCwgdGV4dCkgLT4gXG4gICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgIGxvZyBcIiN7d2luSUR9Pj4+IFwiICsgdGV4dFxuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgY29uc3RydWN0b3I6IChvcGVuRmlsZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBkaXJzOiAgICAgICBbJy4uLycsICcuLi9icm93c2VyJywgJy4uL2NvbW1hbmRsaW5lJywgJy4uL2NvbW1hbmRzJywgJy4uL2VkaXRvcicsICcuLi9naXQnLCAnLi4vbWFpbicsICcuLi90b29scycsICcuLi93aW4nXVxuICAgICAgICAgICAgcGtnOiAgICAgICAgcGtnXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQWx0K0YxJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJy4uL2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uLy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZVxuICAgICAgICAgICAgb25TaG93OiAgICAgLT4gbWFpbi5vblNob3coKVxuICAgICAgICAgICAgb25PdGhlckluc3RhbmNlOiAoYXJncywgZGlyKSAtPiBtYWluLm9uT3RoZXJJbnN0YW5jZSBhcmdzLCBkaXJcbiAgICAgICAgICAgIHdpZHRoOiAgICAgIDEwMDBcbiAgICAgICAgICAgIGhlaWdodDogICAgIDEwMDBcbiAgICAgICAgICAgIG1pbldpZHRoOiAgIDI0MFxuICAgICAgICAgICAgbWluSGVpZ2h0OiAgMjMwXG4gICAgICAgICAgICBhcmdzOiBcIlwiXCJcbiAgICAgICAgICAgICAgICBmaWxlbGlzdCAgZmlsZXMgdG8gb3BlbiAgICAgICAgICAgKipcbiAgICAgICAgICAgICAgICBwcmVmcyAgICAgc2hvdyBwcmVmZXJlbmNlcyAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBub3ByZWZzICAgZG9uJ3QgbG9hZCBwcmVmZXJlbmNlcyAgZmFsc2VcbiAgICAgICAgICAgICAgICBzdGF0ZSAgICAgc2hvdyBzdGF0ZSAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBub3N0YXRlICAgZG9uJ3QgbG9hZCBzdGF0ZSAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICB2ZXJib3NlICAgbG9nIG1vcmUgICAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICBAb3B0Lm9uUXVpdCA9IEBxdWl0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHByb2Nlc3MuY3dkKCkgPT0gJy8nXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIHNsYXNoLnJlc29sdmUgJ34nXG4gICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgdmFsaWQoYXJncy5maWxlbGlzdCkgYW5kIHNsYXNoLmRpckV4aXN0cyBmaXJzdCBhcmdzLmZpbGVsaXN0XG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIGFyZ3MuZmlsZWxpc3Quc2hpZnQoKVxuICAgICAgICBcbiAgICAgICAgaWYgYXJncy52ZXJib3NlXG4gICAgICAgICAgICBsb2cgY29sb3JzLndoaXRlLmJvbGQgXCJcXG5rb1wiLCBjb2xvcnMuZ3JheSBcInYje3BrZy52ZXJzaW9ufVxcblwiXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkge2N3ZDogcHJvY2Vzcy5jd2QoKX0sIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cgY29sb3JzLnllbGxvdy5ib2xkICdcXG5hcmdzJ1xuICAgICAgICAgICAgbG9nIG5vb24uc3RyaW5naWZ5IGFyZ3MsIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBsb2cgJydcblxuICAgICAgICBnbG9iYWwuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJywgc2VwYXJhdG9yOiAnfCdcblxuICAgICAgICBhbGlhcyA9IG5ldyBzdG9yZSAnYWxpYXMnXG4gICAgICAgIFxuICAgICAgICBpZiBhcmdzLnByZWZzXG4gICAgICAgICAgICBsb2cgY29sb3JzLnllbGxvdy5ib2xkICdwcmVmcydcbiAgICAgICAgICAgIGxvZyBjb2xvcnMuZ3JlZW4uYm9sZCAncHJlZnMgZmlsZTonLCBwcmVmcy5zdG9yZS5maWxlXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgcHJlZnMuc3RvcmUuZGF0YSwgY29sb3JzOnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGFyZ3Muc3RhdGVcbiAgICAgICAgICAgIGxvZyBjb2xvcnMueWVsbG93LmJvbGQgJ3N0YXRlJ1xuICAgICAgICAgICAgbG9nIGNvbG9ycy5ncmVlbi5ib2xkICdzdGF0ZSBmaWxlOicsIGdsb2JhbC5zdGF0ZS5maWxlXG4gICAgICAgICAgICBsb2cgbm9vbi5zdHJpbmdpZnkgZ2xvYmFsLnN0YXRlLmRhdGEsIGNvbG9yczp0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgQGluZGV4ZXIgPSBuZXcgSW5kZXhlclxuXG4gICAgICAgIGlmIG5vdCBvcGVuRmlsZXMubGVuZ3RoIGFuZCB2YWxpZCBhcmdzLmZpbGVsaXN0XG4gICAgICAgICAgICBvcGVuRmlsZXMgPSBmaWxlbGlzdCBhcmdzLmZpbGVsaXN0LCBpZ25vcmVIaWRkZW46ZmFsc2VcblxuICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICBcbiAgICAgICAgQG9wZW5GaWxlcyA9IG9wZW5GaWxlc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgIFxuICAgIG9uU2hvdzogPT5cblxuICAgICAgICB7IHdpZHRoLCBoZWlnaHQgfSA9IEBzY3JlZW5TaXplKClcbiAgICAgICAgXG4gICAgICAgIEBvcHQud2lkdGggID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIEBvcHQuaGVpZ2h0ID0gaGVpZ2h0XG4gICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQG9wZW5GaWxlc1xuICAgICAgICAgICAgZm9yIGZpbGUgaW4gQG9wZW5GaWxlc1xuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRmlsZSBmaWxlOmZpbGVcbiAgICAgICAgICAgIGRlbGV0ZSBAb3BlbkZpbGVzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEByZXN0b3JlV2luZG93cygpIGlmIG5vdCBhcmdzLm5vc3RhdGVcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCB3aW5zKCkubGVuZ3RoXG4gICAgICAgICAgICBpZiByZWNlbnQgPSBtb3N0UmVjZW50RmlsZSgpXG4gICAgICAgICAgICAgICAgQGNyZWF0ZVdpbmRvd1dpdGhGaWxlIGZpbGU6cmVjZW50IFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjcmVhdGVXaW5kb3dXaXRoRW1wdHkoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChhY3Rpb24sIGFyZykgPT5cblxuICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyAgICB0aGVuIEBhY3RpdmF0ZU5leHRXaW5kb3cgYXJnXG4gICAgICAgICAgICB3aGVuICdBcnJhbmdlIFdpbmRvd3MnICB0aGVuIEBhcnJhbmdlV2luZG93cygpXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICB0aGVuIEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMFxuXG4gICAgd2luczogICAgICAgIHdpbnMoKVxuICAgIHdpbldpdGhJRDogICB3aW5XaXRoSURcbiAgICBhY3RpdmVXaW46ICAgYWN0aXZlV2luXG4gICAgdmlzaWJsZVdpbnM6IHZpc2libGVXaW5zXG5cbiAgICBjcmVhdGVXaW5kb3dXaXRoRmlsZTogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3cgKHdpbikgLT4gXG4gICAgICAgICAgICBwb3N0LnRvV2luIHdpbi5pZCwgJ29wZW5GaWxlcycsIFtvcHQuZmlsZV1cbiAgICAgICAgd2luXG5cbiAgICBjcmVhdGVXaW5kb3dXaXRoRW1wdHk6IC0+XG4gICAgICAgIFxuICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93ICh3aW4pIC0+IFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICduZXdFbXB0eVRhYidcbiAgICAgICAgd2luXG4gICAgICAgIFxuICAgIHRvZ2dsZVdpbmRvd3M6IChjYikgPT5cblxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGFjdGl2ZVdpbigpXG4gICAgICAgICAgICAgICAgICAgIEBoaWRlV2luZG93cygpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcmFpc2VXaW5kb3dzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAc2hvd1dpbmRvd3MoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2IgZmlyc3QgdmlzaWJsZVdpbnMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY3JlYXRlV2luZG93IGNiXG5cbiAgICBoaWRlV2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuaGlkZSgpXG4gICAgICAgICAgICBAaGlkZURvY2soKVxuICAgICAgICBAXG5cbiAgICBzaG93V2luZG93czogLT5cblxuICAgICAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgICAgIHcuc2hvdygpXG4gICAgICAgICAgICBAc2hvd0RvY2soKVxuICAgICAgICBAXG5cbiAgICByYWlzZVdpbmRvd3M6IC0+XG5cbiAgICAgICAgaWYgdmFsaWQgdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgZm9yIHcgaW4gdmlzaWJsZVdpbnMoKVxuICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHZpc2libGVXaW5zKClbMF0uZm9jdXMoKVxuICAgICAgICBAXG5cbiAgICBhY3RpdmF0ZU5leHRXaW5kb3c6ICh3aW4pIC0+XG5cbiAgICAgICAgaWYgXy5pc051bWJlciB3aW4gdGhlbiB3aW4gPSB3aW5XaXRoSUQgd2luXG4gICAgICAgIGFsbFdpbmRvd3MgPSB3aW5zKClcbiAgICAgICAgZm9yIHcgaW4gYWxsV2luZG93c1xuICAgICAgICAgICAgaWYgdyA9PSB3aW5cbiAgICAgICAgICAgICAgICBpID0gMSArIGFsbFdpbmRvd3MuaW5kZXhPZiB3XG4gICAgICAgICAgICAgICAgaSA9IDAgaWYgaSA+PSBhbGxXaW5kb3dzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVQcmV2V2luZG93OiAod2luKSAtPlxuXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgd2luIHRoZW4gd2luID0gd2luV2l0aElEIHdpblxuICAgICAgICBhbGxXaW5kb3dzID0gd2lucygpXG4gICAgICAgIGZvciB3IGluIGFsbFdpbmRvd3NcbiAgICAgICAgICAgIGlmIHcgPT0gd2luXG4gICAgICAgICAgICAgICAgaSA9IC0xICsgYWxsV2luZG93cy5pbmRleE9mIHdcbiAgICAgICAgICAgICAgICBpID0gYWxsV2luZG93cy5sZW5ndGgtMSBpZiBpIDwgMFxuICAgICAgICAgICAgICAgIEBhY3RpdmF0ZVdpbmRvd1dpdGhJRCBhbGxXaW5kb3dzW2ldLmlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdcbiAgICAgICAgbnVsbFxuXG4gICAgYWN0aXZhdGVXaW5kb3dXaXRoSUQ6ICh3aWQpIC0+XG5cbiAgICAgICAgdyA9IHdpbldpdGhJRCB3aWRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCB3P1xuICAgICAgICBpZiBub3Qgdy5pc1Zpc2libGUoKVxuICAgICAgICAgICAgdy5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdy5mb2N1cygpXG4gICAgICAgIHdcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24uc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICBzdGFja1dpbmRvd3M6IC0+XG4gICAgICAgIFxuICAgICAgICB7d2lkdGgsIGhlaWdodH0gPSBAc2NyZWVuU2l6ZSgpXG4gICAgICAgIHd3ID0gaGVpZ2h0ICsgMTIyXG4gICAgICAgIHdsID0gdmlzaWJsZVdpbnMoKVxuICAgICAgICBmb3IgdyBpbiB3bFxuICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50ICh3aWR0aC13dykvMlxuICAgICAgICAgICAgICAgIHk6ICAgICAgcGFyc2VJbnQgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgd3dcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50IGhlaWdodFxuICAgICAgICBhY3RpdmVXaW4oKS5zaG93KClcblxuICAgIHdpbmRvd3NBcmVTdGFja2VkOiAtPlxuICAgICAgICBcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBlbXB0eSB3bFxuICAgICAgICBcbiAgICAgICAgZm9yIHcgaW4gd2xcbiAgICAgICAgICAgIGlmIHcuaXNGdWxsU2NyZWVuKClcbiAgICAgICAgICAgICAgICB3LnNldEZ1bGxTY3JlZW4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBib3VuZHMgPSB3bFswXS5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgd2wubGVuZ3RoID09IDEgYW5kIGJvdW5kcy53aWR0aCA9PSBAc2NyZWVuU2l6ZSgpLndpZHRoXG4gICAgICAgIFxuICAgICAgICBmb3Igd2kgaW4gWzEuLi53bC5sZW5ndGhdXG4gICAgICAgICAgICBpZiBub3QgXy5pc0VxdWFsIHdsW3dpXS5nZXRCb3VuZHMoKSwgYm91bmRzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgYXJyYW5nZVdpbmRvd3M6ID0+XG5cbiAgICAgICAgZGlzYWJsZVNuYXAgPSB0cnVlXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2wgPSB2aXNpYmxlV2lucygpXG4gICAgICAgIHsgd2lkdGgsIGhlaWdodCB9ID0gQHNjcmVlblNpemUoKVxuXG4gICAgICAgIGlmIG5vdCBAd2luZG93c0FyZVN0YWNrZWQoKVxuICAgICAgICAgICAgQHN0YWNrV2luZG93cygpXG4gICAgICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiB3bC5sZW5ndGggPT0gMVxuICAgICAgICAgICAgd2xbMF0uc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgIHdsWzBdLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgIHg6ICAgICAgMFxuICAgICAgICAgICAgICAgIHk6ICAgICAgMFxuICAgICAgICAgICAgICAgIHdpZHRoOiAgd2lkdGhcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICBlbHNlIGlmIHdsLmxlbmd0aCA9PSAyIG9yIHdsLmxlbmd0aCA9PSAzXG4gICAgICAgICAgICB3ID0gd2lkdGgvd2wubGVuZ3RoXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLndsLmxlbmd0aF1cbiAgICAgICAgICAgICAgICB3bFtpXS5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNldEJvdW5kc1xuICAgICAgICAgICAgICAgICAgICB4OiAgICAgIHBhcnNlSW50IGkgKiB3IC0gKGkgPiAwIGFuZCBmcmFtZVNpemUvMiBvciAwKVxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogIHBhcnNlSW50IHcgKyAoKGkgPT0gMCBvciBpID09IHdsLmxlbmd0aC0xKSBhbmQgZnJhbWVTaXplLzIgb3IgZnJhbWVTaXplKVxuICAgICAgICAgICAgICAgICAgICB5OiAgICAgIHBhcnNlSW50IDBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBwYXJzZUludCBoZWlnaHRcbiAgICAgICAgZWxzZSBpZiB3bC5sZW5ndGhcbiAgICAgICAgICAgIHcyID0gcGFyc2VJbnQgd2wubGVuZ3RoLzJcbiAgICAgICAgICAgIHJoID0gaGVpZ2h0XG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLncyXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC93MlxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgaSAqIHcgLSAoaSA+IDAgYW5kIGZyYW1lU2l6ZS8yIG9yIDApXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaSA9PSAwIG9yIGkgPT0gdzItMSkgYW5kIGZyYW1lU2l6ZS8yIG9yIGZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICAgICAgZm9yIGkgaW4gW3cyLi4ud2wubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHcgPSB3aWR0aC8od2wubGVuZ3RoLXcyKVxuICAgICAgICAgICAgICAgIHdsW2ldLnNob3dJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgd2xbaV0uc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgIHg6ICAgICAgcGFyc2VJbnQgKGktdzIpICogdyAtIChpLXcyID4gMCBhbmQgZnJhbWVTaXplLzIgb3IgMClcbiAgICAgICAgICAgICAgICAgICAgeTogICAgICBwYXJzZUludCByaC8yKzIzXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAgcGFyc2VJbnQgdyArICgoaS13MiA9PSAwIG9yIGkgPT0gd2wubGVuZ3RoLTEpIGFuZCBmcmFtZVNpemUvMiBvciBmcmFtZVNpemUpXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQgcmgvMlxuICAgICAgICBkaXNhYmxlU25hcCA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgJ3Rlc3QnXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuXG4gICAgbW92ZVdpbmRvd1N0YXNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBzdGFzaERpciA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJ1xuICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc3Rhc2hEaXJcbiAgICAgICAgICAgIGZzLm1vdmVTeW5jIHN0YXNoRGlyLCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBvdmVyd3JpdGU6IHRydWVcblxuICAgIHJlc3RvcmVXaW5kb3dzOiAtPlxuXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMgQHVzZXJEYXRhXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVsaXN0KHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG1hdGNoRXh0Oidub29uJylcbiAgICAgICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgbmV3U3Rhc2ggPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbicsIFwiI3t3aW4uaWR9Lm5vb25cIlxuICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcblxuICAgIHRvZ2dsZVdpbmRvd0Zyb21UcmF5OiA9PiBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiB2YWxpZCB3aW5zKClcbiAgICAgICAgICAgIGZvciB3aW4gaW4gd2lucygpXG4gICAgICAgICAgICAgICAgd2luLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgICAgICAgICAgQHJlc3RvcmVXaW5kb3dzKClcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uUmVzaXplV2luOiAoZXZlbnQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIGRpc2FibGVTbmFwXG4gICAgICAgIGZyYW1lU2l6ZSA9IDZcbiAgICAgICAgd2IgPSBldmVudC5zZW5kZXIuZ2V0Qm91bmRzKClcbiAgICAgICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgICAgICBjb250aW51ZSBpZiB3ID09IGV2ZW50LnNlbmRlclxuICAgICAgICAgICAgYiA9IHcuZ2V0Qm91bmRzKClcbiAgICAgICAgICAgIGlmIGIuaGVpZ2h0ID09IHdiLmhlaWdodCBhbmQgYi55ID09IHdiLnlcbiAgICAgICAgICAgICAgICBpZiBiLnggPCB3Yi54XG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKGIueCtiLndpZHRoLXdiLngpIDwgV0lOX1NOQVBfRElTVFxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zaG93SW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdy5zZXRCb3VuZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiAgICAgIGIueFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICB3Yi54IC0gYi54ICsgZnJhbWVTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBiLmhlaWdodFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgYi54K2Iud2lkdGggPiB3Yi54K3diLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIGlmIE1hdGguYWJzKHdiLngrd2Iud2lkdGgtYi54KSA8IFdJTl9TTkFQX0RJU1RcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2hvd0luYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHcuc2V0Qm91bmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogICAgICB3Yi54K3diLndpZHRoLWZyYW1lU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6ICAgICAgYi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICBiLngrYi53aWR0aCAtICh3Yi54K3diLndpZHRoLWZyYW1lU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGIuaGVpZ2h0XG5cbiAgICBvbkNsb3NlV2luOiAoZXZlbnQpID0+XG5cbiAgICAgICAgd2lkID0gZXZlbnQuc2VuZGVyLmlkXG4gICAgICAgIGlmIHdpbnMoKS5sZW5ndGggPT0gMVxuICAgICAgICAgICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgICAgICAgICBAcXVpdCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGhpZGVEb2NrKClcbiAgICAgICAgcG9zdC50b0FsbCAnd2luQ2xvc2VkJywgd2lkXG4gICAgICAgIEBwb3N0RGVsYXllZE51bVdpbnMoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcblxuICAgIGFjdGl2YXRlT25lV2luZG93OiAoY2IpIC0+XG4gICAgXG4gICAgICAgIGlmIGVtcHR5IHZpc2libGVXaW5zKClcbiAgICAgICAgICAgIGxvZyAndG9nZ2xlV2luZG93cydcbiAgICAgICAgICAgIEB0b2dnbGVXaW5kb3dzIGNiXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBub3QgYWN0aXZlV2luKClcbiAgICAgICAgICAgIGlmIHdpbiA9IHZpc2libGVXaW5zKClbMF1cbiAgICAgICAgICAgICAgICAjIGlmIHNsYXNoLndpbigpXG4gICAgICAgICAgICAgICAgIyAgICAgd3h3ID0gcmVxdWlyZSAnd3h3JyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAjICAgICB3eHcuZm9yZWdyb3VuZCBzbGFzaC5yZXNvbHZlIHByb2Nlc3MuYXJndlswXVxuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpXG4gICAgICAgICAgICAgICAgY2Igd2luXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY2IgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjYiB2aXNpYmxlV2lucygpWzBdXG4gICAgICAgICAgICBcbiAgICBvbk90aGVySW5zdGFuY2U6IChhcmdzLCBkaXIpID0+XG5cbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZGlyOicsICBkaXJcbiAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgYXJnczonLCBhcmdzXG4gICAgICAgIFxuICAgICAgICBAYWN0aXZhdGVPbmVXaW5kb3cgKHdpbikgLT5cblxuICAgICAgICAgICAgZmlsZXMgPSBbXVxuICAgICAgICAgICAgaWYgZmlyc3QoYXJncyk/LmVuZHNXaXRoIFwiI3twa2cubmFtZX0uZXhlXCJcbiAgICAgICAgICAgICAgICBmaWxlYXJncyA9IGFyZ3Muc2xpY2UgMVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZpbGVhcmdzID0gYXJncy5zbGljZSAyXG4gICAgXG4gICAgICAgICAgICBmb3IgYXJnIGluIGZpbGVhcmdzXG4gICAgICAgICAgICAgICAgY29udGludWUgaWYgYXJnLnN0YXJ0c1dpdGggJy0nXG4gICAgICAgICAgICAgICAgZmlsZSA9IGFyZ1xuICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzUmVsYXRpdmUgZmlsZVxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gc2xhc2guam9pbiBzbGFzaC5yZXNvbHZlKGRpciksIGFyZ1xuICAgICAgICAgICAgICAgIFtmcGF0aCwgcG9zXSA9IHNsYXNoLnNwbGl0RmlsZVBvcyBmaWxlXG4gICAgICAgICAgICAgICAgaWYgc2xhc2guZXhpc3RzIGZwYXRoXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2ggZmlsZVxuICAgIFxuICAgICAgICAgICAgbG9nICdvbk90aGVySW5zdGFuY2UgZmlsZXMnLCBmaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBmaWxlcywgbmV3VGFiOnRydWVcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcXVpdDogPT5cblxuICAgICAgICB0b1NhdmUgPSB3aW5zKCkubGVuZ3RoXG5cbiAgICAgICAgaWYgdG9TYXZlXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnc2F2ZVN0YXNoJ1xuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcsID0+XG4gICAgICAgICAgICAgICAgdG9TYXZlIC09IDFcbiAgICAgICAgICAgICAgICBpZiB0b1NhdmUgPT0gMFxuICAgICAgICAgICAgICAgICAgICBnbG9iYWwuc3RhdGUuc2F2ZSgpXG4gICAgICAgICAgICAgICAgICAgIEBleGl0QXBwKClcbiAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZ2xvYmFsLnN0YXRlLnNhdmUoKVxuICAgICAgICAgICAgXG4jICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5lbGVjdHJvbi5hcHAub24gJ29wZW4tZmlsZScsIChldmVudCwgZmlsZSkgLT5cblxuICAgIGlmIG5vdCBtYWluP1xuICAgICAgICBvcGVuRmlsZXMucHVzaCBmaWxlXG4gICAgZWxzZVxuICAgICAgICBpZiBlbGVjdHJvbi5hcHAuaXNSZWFkeSgpXG4gICAgICAgICAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgICAgICAgICAgcG9zdC50b1dpbiB3aW4uaWQsICdvcGVuRmlsZXMnLCBbZmlsZV0gXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1haW4uY3JlYXRlV2luZG93V2l0aEZpbGUgZmlsZTpmaWxlXG4gICAgICAgIFxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuZWxlY3Ryb24uYXBwLm9uICd3aW5kb3ctYWxsLWNsb3NlZCcsIC0+IGxvZyAnd2luZG93LWFsbC1jbG9zZWQnXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgICAgICAgICBcblxub25VRFAgPSAoZmlsZSkgLT5cbiAgICBtYWluLmFjdGl2YXRlT25lV2luZG93ICh3aW4pIC0+XG4gICAgICAgIHBvc3QudG9XaW4gd2luLmlkLCAnb3BlbkZpbGVzJywgW2ZpbGVdIFxuXG5rb1JlY2VpdmVyID0gbmV3IHVkcCBwb3J0Ojk3NzksIG9uTXNnOm9uVURQXG5cbm1haW4gICAgICAgICAgPSBuZXcgTWFpbiBvcGVuRmlsZXNcbm1haW4ubmF2aWdhdGUgPSBuZXcgTmF2aWdhdGUgbWFpblxuIl19
//# sourceURL=../../coffee/main/main.coffee
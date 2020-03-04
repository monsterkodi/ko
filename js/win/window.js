// koffee 1.11.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var Browser, CWD, Commandline, Editor, FPS, FileEditor, FileHandler, Info, Navigate, Split, Tabs, Terminal, Titlebar, Window, _, addToShelf, args, changeFontSize, clamp, clearListeners, commandline, dialog, editor, electron, filehandler, klog, mainmenu, onClose, onCombo, onMove, pkg, post, prefs, projects, ref, reloadWin, remote, resetFontSize, restoreWin, saveStash, scheme, setFontSize, stash, stopEvent, store, tabs, terminal, titlebar, toggleCenterText, win, winID,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, prefs = ref.prefs, store = ref.store, stash = ref.stash, clamp = ref.clamp, args = ref.args, win = ref.win, klog = ref.klog, _ = ref._;

Split = require('./split');

Terminal = require('./terminal');

Tabs = require('./tabs');

Titlebar = require('./titlebar');

Info = require('./info');

FileHandler = require('./filehandler');

Editor = require('../editor/editor');

Commandline = require('../commandline/commandline');

FileEditor = require('../editor/fileeditor');

Navigate = require('../main/navigate');

FPS = require('../tools/fps');

CWD = require('../tools/cwd');

scheme = require('../tools/scheme');

projects = require('../tools/projects');

electron = require('electron');

pkg = require('../../package.json');

remote = electron.remote;

dialog = remote.dialog;

Browser = remote.BrowserWindow;

editor = null;

mainmenu = null;

terminal = null;

commandline = null;

titlebar = null;

tabs = null;

filehandler = null;

Window = (function(superClass) {
    extend(Window, superClass);

    function Window() {
        this.onMenuAction = bind(this.onMenuAction, this);
        var cwd, fps, info, navigate, s, split;
        Window.__super__.constructor.call(this, {
            dir: __dirname,
            menuTemplate: require('./menu'),
            pkg: require('../../package.json'),
            menu: '../../coffee/menu.noon',
            icon: '../../img/menu@2x.png',
            scheme: false
        });
        filehandler = window.filehandler = new FileHandler;
        tabs = window.tabs = new Tabs(window.titlebar.elem);
        titlebar = new Titlebar;
        navigate = window.navigate = new Navigate();
        split = window.split = new Split();
        terminal = window.terminal = new Terminal('terminal');
        editor = window.editor = new FileEditor('editor');
        commandline = window.commandline = new Commandline('commandline-editor');
        info = window.info = new Info(editor);
        fps = window.fps = new FPS();
        cwd = window.cwd = new CWD();
        window.textEditor = window.focusEditor = editor;
        window.lastFocus = editor.name;
        restoreWin();
        scheme.set(prefs.get('scheme', 'dark'));
        terminal.on('fileSearchResultChange', function(file, lineChange) {
            return post.toWins('fileLineChanges', file, [lineChange]);
        });
        editor.on('changed', function(changeInfo) {
            if (changeInfo.foreign) {
                return;
            }
            if (changeInfo.changes.length) {
                post.toOtherWins('fileLineChanges', editor.currentFile, changeInfo.changes);
                return navigate.addFilePos({
                    file: editor.currentFile,
                    pos: editor.cursorPos()
                });
            }
        });
        s = window.stash.get('fontSize', prefs.get('editorFontSize', 19));
        if (s) {
            editor.setFontSize(s);
        }
        if (window.stash.get('centerText')) {
            editor.centerText(true, 0);
        }
        post.emit('restore');
        editor.focus();
    }

    Window.prototype.onMenuAction = function(name, args) {
        var action;
        if (action = Editor.actionWithName(name)) {
            if ((action.key != null) && _.isFunction(window.focusEditor[action.key])) {
                window.focusEditor[action.key](args.actarg);
                return;
            }
        }
        if ('unhandled' !== window.commandline.handleMenuAction(name, args)) {
            return;
        }
        switch (name) {
            case 'doMacro':
                return window.commandline.commands.macro.execute(args.actarg);
            case 'Undo':
                return window.focusEditor["do"].undo();
            case 'Redo':
                return window.focusEditor["do"].redo();
            case 'Cut':
                return window.focusEditor.cut();
            case 'Copy':
                return window.focusEditor.copy();
            case 'Paste':
                return window.focusEditor.paste();
            case 'New Tab':
                return post.emit('newEmptyTab');
            case 'New Window':
                return post.toMain('newWindowWithFile', editor.currentFile);
            case 'Toggle Scheme':
                return scheme.toggle();
            case 'Toggle Center Text':
                return toggleCenterText();
            case 'Increase':
                return changeFontSize(+1);
            case 'Decrease':
                return changeFontSize(-1);
            case 'Reset':
                return resetFontSize();
            case 'Open Window List':
                return titlebar.showList();
            case 'Navigate Backward':
                return navigate.backward();
            case 'Navigate Forward':
                return navigate.forward();
            case 'Maximize Editor':
                return split.maximizeEditor();
            case 'Add to Shelf':
                return addToShelf();
            case 'Toggle History':
                return window.filebrowser.shelf.toggleHistory();
            case 'Activate Next Tab':
                return window.tabs.navigate('right');
            case 'Activate Previous Tab':
                return window.tabs.navigate('left');
            case 'Move Tab Left':
                return window.tabs.move('left');
            case 'Move Tab Right':
                return window.tabs.move('right');
            case 'Open...':
                return post.emit('openFile');
            case 'Open In New Tab...':
                return post.emit('openFile', {
                    newTab: true
                });
            case 'Open In New Window...':
                return post.emit('openFile', {
                    newWindow: true
                });
            case 'Save':
                return post.emit('saveFile');
            case 'Save All':
                return post.emit('saveAll');
            case 'Save As ...':
                return post.emit('saveFileAs');
            case 'Revert':
                return post.emit('reloadFile');
            case 'Reload':
                return reloadWin();
            case 'Close Tab or Window':
                return post.emit('closeTabOrWindow');
            case 'Close Other Tabs':
                return post.emit('closeOtherTabs');
            case 'Close Other Windows':
                return post.toOtherWins('closeWindow');
            case 'Fullscreen':
                return win.setFullScreen(!win.isFullScreen());
            case 'Clear List':
                return window.state.set('recentFiles', []);
            case 'Preferences':
                return post.emit('openFiles', [prefs.store.file], {
                    newTab: true
                });
            case 'Cycle Windows':
                args = winID;
        }
        return Window.__super__.onMenuAction.call(this, name, args);
    };

    return Window;

})(win);

win = window.win = remote.getCurrentWindow();

winID = window.winID = win.id;

window.state = new store('state', {
    separator: '|'
});

window.prefs = prefs;

window.stash = new stash("win/" + winID, {
    separator: '|'
});

post.setMaxListeners(20);

saveStash = function() {
    post.emit('stash');
    editor.saveScrollCursorsAndSelections();
    window.stash.save();
    return post.toMain('stashSaved');
};

restoreWin = function() {
    var bounds;
    if (bounds = window.stash.get('bounds')) {
        win.setBounds(bounds);
    }
    if (window.stash.get('devTools')) {
        return win.webContents.openDevTools();
    }
};

post.on('singleCursorAtPos', function(pos, opt) {
    editor.singleCursorAtPos(pos, opt);
    return editor.scroll.cursorToTop();
});

post.on('focusEditor', function() {
    return split.focus('editor');
});

post.on('cloneFile', function() {
    return post.toMain('newWindowWithFile', editor.currentFile);
});

post.on('closeWindow', function() {
    return window.win.close();
});

post.on('saveStash', function() {
    return saveStash();
});

post.on('editorFocus', function(editor) {
    window.setLastFocus(editor.name);
    window.focusEditor = editor;
    if (editor.name !== 'commandline-editor') {
        return window.textEditor = editor;
    }
});

post.on('mainlog', function() {
    return klog.apply(klog, arguments);
});

post.on('ping', function(wID, argA, argB) {
    return post.toWin(wID, 'pong', winID, argA, argB);
});

post.on('postEditorState', function() {
    return post.toAll('editorState', winID, {
        lines: editor.lines(),
        cursors: editor.cursors(),
        main: editor.mainCursor(),
        selections: editor.selections(),
        highlights: editor.highlights()
    });
});

window.editorWithName = function(n) {
    switch (n) {
        case 'editor':
            return editor;
        case 'command':
        case 'commandline':
            return commandline;
        case 'terminal':
            return terminal;
        default:
            return editor;
    }
};

onMove = function() {
    return window.stash.set('bounds', win.getBounds());
};

clearListeners = function() {
    win.removeListener('close', onClose);
    win.removeListener('move', onMove);
    win.webContents.removeAllListeners('devtools-opened');
    return win.webContents.removeAllListeners('devtools-closed');
};

onClose = function() {
    post.emit('saveChanges');
    editor.setText('');
    editor.stopWatcher();
    if (Browser.getAllWindows().length > 1) {
        window.stash.clear();
    }
    return clearListeners();
};

window.onload = function() {
    split.resized();
    info.reload();
    win.on('close', onClose);
    win.on('move', onMove);
    win.webContents.on('devtools-opened', function() {
        return window.stash.set('devTools', true);
    });
    return win.webContents.on('devtools-closed', function() {
        return window.stash.set('devTools');
    });
};

reloadWin = function() {
    saveStash();
    clearListeners();
    editor.stopWatcher();
    return post.toMain('reloadWin', {
        winID: win.id,
        file: editor.currentFile
    });
};

window.onresize = function() {
    split.resized();
    window.stash.set('bounds', win.getBounds());
    if (window.stash.get('centerText', false)) {
        return editor.centerText(true, 200);
    }
};

post.on('split', function(s) {
    filebrowser.resized();
    terminal.resized();
    commandline.resized();
    return editor.resized();
});

toggleCenterText = function() {
    var restoreInvisibles;
    if (window.state.get("invisibles|" + editor.currentFile, false)) {
        editor.toggleInvisibles();
        restoreInvisibles = true;
    }
    if (!window.stash.get('centerText', false)) {
        window.stash.set('centerText', true);
        editor.centerText(true);
    } else {
        window.stash.set('centerText', false);
        editor.centerText(false);
    }
    if (restoreInvisibles) {
        return editor.toggleInvisibles();
    }
};

setFontSize = function(s) {
    if (!_.isFinite(s)) {
        s = prefs.get('editorFontSize', 19);
    }
    s = clamp(8, 100, s);
    window.stash.set("fontSize", s);
    editor.setFontSize(s);
    if (editor.currentFile != null) {
        return post.emit('loadFile', editor.currentFile, {
            reload: true
        });
    }
};

changeFontSize = function(d) {
    var f;
    if (editor.size.fontSize >= 30) {
        f = 4;
    } else if (editor.size.fontSize >= 50) {
        f = 10;
    } else if (editor.size.fontSize >= 20) {
        f = 2;
    } else {
        f = 1;
    }
    return setFontSize(editor.size.fontSize + f * d);
};

resetFontSize = function() {
    var defaultFontSize;
    defaultFontSize = prefs.get('editorFontSize', 19);
    window.stash.set('fontSize', defaultFontSize);
    return setFontSize(defaultFontSize);
};

addToShelf = function() {
    var fileBrowser, path;
    fileBrowser = window.filebrowser;
    if (window.lastFocus === 'shelf') {
        return;
    }
    if (window.lastFocus.startsWith(fileBrowser.name)) {
        path = fileBrowser.columnWithName(window.lastFocus).activePath();
    } else {
        path = editor.currentFile;
    }
    return post.emit('addToShelf', path);
};

({
    resetZoom: function() {
        webframe.setZoomFactor(1);
        return editor.resized();
    },
    changeZoom: function(d) {
        var z;
        z = webframe.getZoomFactor();
        z *= 1 + d / 20;
        z = clamp(0.36, 5.23, z);
        webframe.setZoomFactor(z);
        return editor.resized();
    }
});

window.onblur = function(event) {
    return post.emit('winFocus', false);
};

window.onfocus = function(event) {
    post.emit('winFocus', true);
    if (document.activeElement.className === 'body') {
        if (split.editorVisible()) {
            return split.focus('editor');
        } else {
            return split.focus('commandline-editor');
        }
    }
};

window.setLastFocus = function(name) {
    return window.lastFocus = name;
};

onCombo = function(combo, info) {
    var char, event, i, j, key, mod;
    if (!combo) {
        return;
    }
    mod = info.mod, key = info.key, combo = info.combo, char = info.char, event = info.event;
    if ('unhandled' !== window.commandline.globalModKeyComboEvent(mod, key, combo, event)) {
        return stopEvent(event);
    }
    if ('unhandled' !== titlebar.globalModKeyComboEvent(mod, key, combo, event)) {
        return stopEvent(event);
    }
    for (i = j = 1; j <= 9; i = ++j) {
        if (combo === ("alt+" + i)) {
            return stopEvent(event, post.toMain('activateWindow', i));
        }
    }
    switch (combo) {
        case 'f3':
            return stopEvent(event, screenShot());
        case 'command+shift+=':
            return stopEvent(event, this.changeZoom(+1));
        case 'command+shift+-':
            return stopEvent(event, this.changeZoom(-1));
        case 'command+shift+0':
            return stopEvent(event, this.resetZoom());
        case 'command+alt+y':
            return stopEvent(event, split["do"]('minimize editor'));
    }
};

post.on('combo', onCombo);

new Window;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa2RBQUE7SUFBQTs7OztBQVFBLE1BQXNFLE9BQUEsQ0FBUSxLQUFSLENBQXRFLEVBQUUsZUFBRixFQUFRLHlCQUFSLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsaUJBQWpDLEVBQXdDLGlCQUF4QyxFQUErQyxlQUEvQyxFQUFxRCxhQUFyRCxFQUEwRCxlQUExRCxFQUFnRTs7QUFFaEUsS0FBQSxHQUFjLE9BQUEsQ0FBUSxTQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsWUFBUjs7QUFDZCxJQUFBLEdBQWMsT0FBQSxDQUFRLFFBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGVBQVI7O0FBQ2QsTUFBQSxHQUFjLE9BQUEsQ0FBUSxrQkFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLDRCQUFSOztBQUNkLFVBQUEsR0FBYyxPQUFBLENBQVEsc0JBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxrQkFBUjs7QUFDZCxHQUFBLEdBQWMsT0FBQSxDQUFRLGNBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsaUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxtQkFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFVBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxvQkFBUjs7QUFFZCxNQUFBLEdBQWMsUUFBUSxDQUFDOztBQUN2QixNQUFBLEdBQWMsTUFBTSxDQUFDOztBQUNyQixPQUFBLEdBQWMsTUFBTSxDQUFDOztBQUNyQixNQUFBLEdBQWM7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QUFWLEVBQWlCLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBUyxpQkFBVCxDQUFqQjtBQUwxQztBQWJNOztBQW9CVixJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBZ0IsT0FBaEI7O0FBRUEsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBwcmVmcywgc3RvcmUsIHN0YXNoLCBjbGFtcCwgYXJncywgd2luLCBrbG9nLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblNwbGl0ICAgICAgID0gcmVxdWlyZSAnLi9zcGxpdCdcblRlcm1pbmFsICAgID0gcmVxdWlyZSAnLi90ZXJtaW5hbCdcblRhYnMgICAgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuVGl0bGViYXIgICAgPSByZXF1aXJlICcuL3RpdGxlYmFyJ1xuSW5mbyAgICAgICAgPSByZXF1aXJlICcuL2luZm8nXG5GaWxlSGFuZGxlciA9IHJlcXVpcmUgJy4vZmlsZWhhbmRsZXInXG5FZGl0b3IgICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9lZGl0b3InXG5Db21tYW5kbGluZSA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmRsaW5lJ1xuRmlsZUVkaXRvciAgPSByZXF1aXJlICcuLi9lZGl0b3IvZmlsZWVkaXRvcidcbk5hdmlnYXRlICAgID0gcmVxdWlyZSAnLi4vbWFpbi9uYXZpZ2F0ZSdcbkZQUyAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZnBzJ1xuQ1dEICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9jd2QnXG5zY2hlbWUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcbnByb2plY3RzICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcHJvamVjdHMnXG5lbGVjdHJvbiAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5cbnJlbW90ZSAgICAgID0gZWxlY3Ryb24ucmVtb3RlXG5kaWFsb2cgICAgICA9IHJlbW90ZS5kaWFsb2dcbkJyb3dzZXIgICAgID0gcmVtb3RlLkJyb3dzZXJXaW5kb3dcbmVkaXRvciAgICAgID0gbnVsbFxubWFpbm1lbnUgICAgPSBudWxsXG50ZXJtaW5hbCAgICA9IG51bGxcbmNvbW1hbmRsaW5lID0gbnVsbFxudGl0bGViYXIgICAgPSBudWxsXG50YWJzICAgICAgICA9IG51bGxcbmZpbGVoYW5kbGVyID0gbnVsbFxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuY2xhc3MgV2luZG93IGV4dGVuZHMgd2luXG4gICAgXG4gICAgQDogLT5cblxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgbWVudVRlbXBsYXRlOiAgIHJlcXVpcmUgJy4vbWVudSdcbiAgICAgICAgICAgIHBrZzogICAgICAgICAgICByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBtZW51OiAgICAgICAgICAgJy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgICAgICAgICBpY29uOiAgICAgICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIHNjaGVtZTogICAgICAgICBmYWxzZVxuICAgIFxuICAgICAgICBmaWxlaGFuZGxlciA9IHdpbmRvdy5maWxlaGFuZGxlciA9IG5ldyBGaWxlSGFuZGxlclxuICAgICAgICB0YWJzICAgICAgICA9IHdpbmRvdy50YWJzICAgICAgICA9IG5ldyBUYWJzIHdpbmRvdy50aXRsZWJhci5lbGVtXG4gICAgICAgIHRpdGxlYmFyICAgID0gICAgICAgICAgICAgICAgICAgICAgbmV3IFRpdGxlYmFyXG4gICAgICAgIG5hdmlnYXRlICAgID0gd2luZG93Lm5hdmlnYXRlICAgID0gbmV3IE5hdmlnYXRlKClcbiAgICAgICAgc3BsaXQgICAgICAgPSB3aW5kb3cuc3BsaXQgICAgICAgPSBuZXcgU3BsaXQoKVxuICAgICAgICB0ZXJtaW5hbCAgICA9IHdpbmRvdy50ZXJtaW5hbCAgICA9IG5ldyBUZXJtaW5hbCAndGVybWluYWwnXG4gICAgICAgIGVkaXRvciAgICAgID0gd2luZG93LmVkaXRvciAgICAgID0gbmV3IEZpbGVFZGl0b3IgJ2VkaXRvcidcbiAgICAgICAgY29tbWFuZGxpbmUgPSB3aW5kb3cuY29tbWFuZGxpbmUgPSBuZXcgQ29tbWFuZGxpbmUgJ2NvbW1hbmRsaW5lLWVkaXRvcidcbiAgICAgICAgaW5mbyAgICAgICAgPSB3aW5kb3cuaW5mbyAgICAgICAgPSBuZXcgSW5mbyBlZGl0b3JcbiAgICAgICAgZnBzICAgICAgICAgPSB3aW5kb3cuZnBzICAgICAgICAgPSBuZXcgRlBTKClcbiAgICAgICAgY3dkICAgICAgICAgPSB3aW5kb3cuY3dkICAgICAgICAgPSBuZXcgQ1dEKClcbiAgICBcbiAgICAgICAgd2luZG93LnRleHRFZGl0b3IgPSB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICAgICAgd2luZG93Lmxhc3RGb2N1cyA9IGVkaXRvci5uYW1lXG4gICAgXG4gICAgICAgIHJlc3RvcmVXaW4oKVxuICAgICAgICBzY2hlbWUuc2V0IHByZWZzLmdldCAnc2NoZW1lJyAnZGFyaydcbiAgICBcbiAgICAgICAgdGVybWluYWwub24gJ2ZpbGVTZWFyY2hSZXN1bHRDaGFuZ2UnIChmaWxlLCBsaW5lQ2hhbmdlKSAtPiAjIHNlbmRzIGNoYW5nZXMgdG8gYWxsIHdpbmRvd3NcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdmaWxlTGluZUNoYW5nZXMnIGZpbGUsIFtsaW5lQ2hhbmdlXVxuICAgIFxuICAgICAgICBlZGl0b3Iub24gJ2NoYW5nZWQnIChjaGFuZ2VJbmZvKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZUluZm8uZm9yZWlnblxuICAgICAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHBvc3QudG9PdGhlcldpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycgZWRpdG9yLmN1cnJlbnRGaWxlLCBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgICAgICBuYXZpZ2F0ZS5hZGRGaWxlUG9zIGZpbGU6IGVkaXRvci5jdXJyZW50RmlsZSwgcG9zOiBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICBcbiAgICAgICAgcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZvbnRTaXplJyBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgICAgICBlZGl0b3Iuc2V0Rm9udFNpemUgcyBpZiBzXG4gICAgXG4gICAgICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnXG4gICAgICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAwXG4gICAgXG4gICAgICAgIHBvc3QuZW1pdCAncmVzdG9yZSdcbiAgICAgICAgZWRpdG9yLmZvY3VzKClcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9uTWVudUFjdGlvbjogKG5hbWUsIGFyZ3MpID0+XG4gICAgXG4gICAgICAgIGlmIGFjdGlvbiA9IEVkaXRvci5hY3Rpb25XaXRoTmFtZSBuYW1lXG4gICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XSBhcmdzLmFjdGFyZ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuaGFuZGxlTWVudUFjdGlvbiBuYW1lLCBhcmdzXG4gICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgc3dpdGNoIG5hbWVcbiAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgYXJncy5hY3RhcmdcbiAgICAgICAgICAgIHdoZW4gJ1VuZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICAgICAgd2hlbiAnQ29weScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY29weSgpXG4gICAgICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgU2NoZW1lJyAgICAgICAgIHRoZW4gcmV0dXJuIHNjaGVtZS50b2dnbGUoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgICAgIHdoZW4gJ0luY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgLTFcbiAgICAgICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgICAgICB3aGVuICdPcGVuIFdpbmRvdyBMaXN0JyAgICAgIHRoZW4gcmV0dXJuIHRpdGxlYmFyLnNob3dMaXN0KClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEJhY2t3YXJkJyAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuYmFja3dhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ01heGltaXplIEVkaXRvcicgICAgICAgdGhlbiByZXR1cm4gc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgICAgICB0aGVuIHJldHVybiBhZGRUb1NoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgTmV4dCBUYWInICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBQcmV2aW91cyBUYWInIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgUmlnaHQnICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4uLi4nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3VGFiOiB0cnVlXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBXaW5kb3cuLi4nIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnU2F2ZScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFzIC4uLicgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGVBcydcbiAgICAgICAgICAgIHdoZW4gJ1JldmVydCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdyZWxvYWRGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnUmVsb2FkJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgVGFiIG9yIFdpbmRvdycgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlVGFiT3JXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBUYWJzJyAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VPdGhlclRhYnMnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnRnVsbHNjcmVlbicgICAgICAgICAgICB0aGVuIHJldHVybiB3aW4uc2V0RnVsbFNjcmVlbiAhd2luLmlzRnVsbFNjcmVlbigpXG4gICAgICAgICAgICB3aGVuICdDbGVhciBMaXN0JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycgW3ByZWZzLnN0b3JlLmZpbGVdLCBuZXdUYWI6dHJ1ZVxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgICAgICB0aGVuIGFyZ3MgPSB3aW5JRFxuICAgIFxuICAgICAgICAjIGxvZyBcInVuaGFuZGxlZCBtZW51IGFjdGlvbiEgcG9zdGluZyB0byBtYWluICcje25hbWV9JyBhcmdzOlwiLCBhcmdzXG4gICAgXG4gICAgICAgIHN1cGVyIG5hbWUsIGFyZ3NcbiAgICBcbndpbiAgID0gd2luZG93LndpbiAgID0gcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKVxud2luSUQgPSB3aW5kb3cud2luSUQgPSB3aW4uaWRcbiAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOid8J1xud2luZG93LnByZWZzID0gcHJlZnNcbndpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je3dpbklEfVwiIHNlcGFyYXRvcjonfCdcblxucG9zdC5zZXRNYXhMaXN0ZW5lcnMgMjBcblxuc2F2ZVN0YXNoID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc3Rhc2gnXG4gICAgZWRpdG9yLnNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9ucygpXG4gICAgd2luZG93LnN0YXNoLnNhdmUoKVxuICAgIHBvc3QudG9NYWluICdzdGFzaFNhdmVkJ1xuXG5yZXN0b3JlV2luID0gLT5cblxuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luLnNldEJvdW5kcyBib3VuZHNcblxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2RldlRvb2xzJ1xuICAgICAgICB3aW4ud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uICdzaW5nbGVDdXJzb3JBdFBvcycgKHBvcywgb3B0KSAtPiAjIGJyb3dzZXIgZG91YmxlIGNsaWNrIGFuZCBuZXdUYWJXaXRoRmlsZSA6bDpjXG4gICAgZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIHBvcywgb3B0IFxuICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxucG9zdC5vbiAnZm9jdXNFZGl0b3InICAtPiBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xucG9zdC5vbiAnY2xvbmVGaWxlJyAgICAtPiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxucG9zdC5vbiAnY2xvc2VXaW5kb3cnICAtPiB3aW5kb3cud2luLmNsb3NlKClcbnBvc3Qub24gJ3NhdmVTdGFzaCcgICAgLT4gc2F2ZVN0YXNoKClcbnBvc3Qub24gJ2VkaXRvckZvY3VzJyAoZWRpdG9yKSAtPlxuICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgZWRpdG9yLm5hbWVcbiAgICB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICB3aW5kb3cudGV4dEVkaXRvciA9IGVkaXRvciBpZiBlZGl0b3IubmFtZSAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG4jIHRlc3RpbmcgcmVsYXRlZCAuLi5cblxucG9zdC5vbiAnbWFpbmxvZycgLT4ga2xvZy5hcHBseSBrbG9nLCBhcmd1bWVudHNcblxucG9zdC5vbiAncGluZycgKHdJRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3SUQsICdwb25nJyB3aW5JRCwgYXJnQSwgYXJnQlxucG9zdC5vbiAncG9zdEVkaXRvclN0YXRlJyAtPlxuICAgIHBvc3QudG9BbGwgJ2VkaXRvclN0YXRlJyB3aW5JRCxcbiAgICAgICAgbGluZXM6ICAgICAgZWRpdG9yLmxpbmVzKClcbiAgICAgICAgY3Vyc29yczogICAgZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICBtYWluOiAgICAgICBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHNlbGVjdGlvbnM6IGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgaGlnaGxpZ2h0czogZWRpdG9yLmhpZ2hsaWdodHMoKVxuXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxud2luZG93LmVkaXRvcldpdGhOYW1lID0gKG4pIC0+XG5cbiAgICBzd2l0Y2ggblxuICAgICAgICB3aGVuICdlZGl0b3InICAgdGhlbiBlZGl0b3JcbiAgICAgICAgd2hlbiAnY29tbWFuZCcgJ2NvbW1hbmRsaW5lJyB0aGVuIGNvbW1hbmRsaW5lXG4gICAgICAgIHdoZW4gJ3Rlcm1pbmFsJyB0aGVuIHRlcm1pbmFsXG4gICAgICAgIGVsc2UgZWRpdG9yXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbk1vdmUgID0gLT4gd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW4uZ2V0Qm91bmRzKClcblxuY2xlYXJMaXN0ZW5lcnMgPSAtPlxuXG4gICAgd2luLnJlbW92ZUxpc3RlbmVyICdjbG9zZScgb25DbG9zZVxuICAgIHdpbi5yZW1vdmVMaXN0ZW5lciAnbW92ZScgIG9uTW92ZVxuICAgIHdpbi53ZWJDb250ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMgJ2RldnRvb2xzLW9wZW5lZCdcbiAgICB3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1jbG9zZWQnXG5cbm9uQ2xvc2UgPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzYXZlQ2hhbmdlcydcbiAgICBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgIGVkaXRvci5zdG9wV2F0Y2hlcigpXG5cbiAgICBpZiBCcm93c2VyLmdldEFsbFdpbmRvd3MoKS5sZW5ndGggPiAxXG4gICAgICAgIHdpbmRvdy5zdGFzaC5jbGVhcigpXG5cbiAgICBjbGVhckxpc3RlbmVycygpXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5kb3cub25sb2FkID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIGluZm8ucmVsb2FkKClcbiAgICB3aW4ub24gJ2Nsb3NlJyBvbkNsb3NlXG4gICAgd2luLm9uICdtb3ZlJyAgb25Nb3ZlXG4gICAgd2luLndlYkNvbnRlbnRzLm9uICdkZXZ0b29scy1vcGVuZWQnIC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2RldlRvb2xzJyB0cnVlXG4gICAgd2luLndlYkNvbnRlbnRzLm9uICdkZXZ0b29scy1jbG9zZWQnIC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2RldlRvb2xzJ1xuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbnJlbG9hZFdpbiA9IC0+XG5cbiAgICBzYXZlU3Rhc2goKVxuICAgIGNsZWFyTGlzdGVuZXJzKClcbiAgICBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuICAgIHBvc3QudG9NYWluICdyZWxvYWRXaW4nIHdpbklEOndpbi5pZCwgZmlsZTplZGl0b3IuY3VycmVudEZpbGVcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxud2luZG93Lm9ucmVzaXplID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycgd2luLmdldEJvdW5kcygpXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSwgMjAwXG5cbnBvc3Qub24gJ3NwbGl0JyAocykgLT5cblxuICAgIGZpbGVicm93c2VyLnJlc2l6ZWQoKVxuICAgIHRlcm1pbmFsLnJlc2l6ZWQoKVxuICAgIGNvbW1hbmRsaW5lLnJlc2l6ZWQoKVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbnRvZ2dsZUNlbnRlclRleHQgPSAtPlxuXG4gICAgaWYgd2luZG93LnN0YXRlLmdldCBcImludmlzaWJsZXN8I3tlZGl0b3IuY3VycmVudEZpbGV9XCIsIGZhbHNlXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcbiAgICAgICAgcmVzdG9yZUludmlzaWJsZXMgPSB0cnVlXG5cbiAgICBpZiBub3Qgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgdHJ1ZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlXG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCBmYWxzZVxuXG4gICAgaWYgcmVzdG9yZUludmlzaWJsZXNcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbnNldEZvbnRTaXplID0gKHMpIC0+XG5cbiAgICBzID0gcHJlZnMuZ2V0KCdlZGl0b3JGb250U2l6ZScgMTkpIGlmIG5vdCBfLmlzRmluaXRlIHNcbiAgICBzID0gY2xhbXAgOCAxMDAgc1xuXG4gICAgd2luZG93LnN0YXNoLnNldCBcImZvbnRTaXplXCIgc1xuICAgIGVkaXRvci5zZXRGb250U2l6ZSBzXG4gICAgaWYgZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBlZGl0b3IuY3VycmVudEZpbGUsIHJlbG9hZDp0cnVlXG5cbmNoYW5nZUZvbnRTaXplID0gKGQpIC0+XG5cbiAgICBpZiAgICAgIGVkaXRvci5zaXplLmZvbnRTaXplID49IDMwXG4gICAgICAgIGYgPSA0XG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSA1MFxuICAgICAgICBmID0gMTBcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDIwXG4gICAgICAgIGYgPSAyXG4gICAgZWxzZVxuICAgICAgICBmID0gMVxuICAgIHNldEZvbnRTaXplIGVkaXRvci5zaXplLmZvbnRTaXplICsgZipkXG5cbnJlc2V0Rm9udFNpemUgPSAtPlxuXG4gICAgZGVmYXVsdEZvbnRTaXplID0gcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICB3aW5kb3cuc3Rhc2guc2V0ICdmb250U2l6ZScgZGVmYXVsdEZvbnRTaXplXG4gICAgc2V0Rm9udFNpemUgZGVmYXVsdEZvbnRTaXplXG5cbmFkZFRvU2hlbGYgPSAtPlxuXG4gICAgZmlsZUJyb3dzZXIgPSB3aW5kb3cuZmlsZWJyb3dzZXJcbiAgICByZXR1cm4gaWYgd2luZG93Lmxhc3RGb2N1cyA9PSAnc2hlbGYnXG4gICAgaWYgd2luZG93Lmxhc3RGb2N1cy5zdGFydHNXaXRoIGZpbGVCcm93c2VyLm5hbWVcbiAgICAgICAgcGF0aCA9IGZpbGVCcm93c2VyLmNvbHVtbldpdGhOYW1lKHdpbmRvdy5sYXN0Rm9jdXMpLmFjdGl2ZVBhdGgoKVxuICAgIGVsc2VcbiAgICAgICAgcGF0aCA9IGVkaXRvci5jdXJyZW50RmlsZVxuICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFxuXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMgICAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgIDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5yZXNldFpvb206IC0+XG5cbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIDFcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbmNoYW5nZVpvb206IChkKSAtPlxuICAgIFxuICAgIHogPSB3ZWJmcmFtZS5nZXRab29tRmFjdG9yKClcbiAgICB6ICo9IDErZC8yMFxuICAgIHogPSBjbGFtcCAwLjM2IDUuMjMgelxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgelxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbndpbmRvdy5vbmJsdXIgID0gKGV2ZW50KSAtPiBwb3N0LmVtaXQgJ3dpbkZvY3VzJyBmYWxzZVxud2luZG93Lm9uZm9jdXMgPSAoZXZlbnQpIC0+XG4gICAgcG9zdC5lbWl0ICd3aW5Gb2N1cycgdHJ1ZVxuICAgIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xhc3NOYW1lID09ICdib2R5J1xuICAgICAgICBpZiBzcGxpdC5lZGl0b3JWaXNpYmxlKClcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdlZGl0b3InXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG5cbndpbmRvdy5zZXRMYXN0Rm9jdXMgPSAobmFtZSkgLT5cbiAgICB3aW5kb3cubGFzdEZvY3VzID0gbmFtZVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxub25Db21ibyA9IChjb21ibywgaW5mbykgLT5cblxuICAgIHJldHVybiBpZiBub3QgY29tYm9cblxuICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCB9ID0gaW5mb1xuXG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHRpdGxlYmFyLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgZm9yIGkgaW4gWzEuLjldXG4gICAgICAgIGlmIGNvbWJvIGlzIFwiYWx0KyN7aX1cIlxuICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgcG9zdC50b01haW4gJ2FjdGl2YXRlV2luZG93JyBpXG5cbiAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgd2hlbiAnZjMnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNjcmVlblNob3QoKVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Kz0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gKzFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCstJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tIC0xXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrMCcgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAcmVzZXRab29tKClcbiAgICAgICAgd2hlbiAnY29tbWFuZCthbHQreScgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNwbGl0LmRvICdtaW5pbWl6ZSBlZGl0b3InXG5cbnBvc3Qub24gJ2NvbWJvJyBvbkNvbWJvXG5cbm5ldyBXaW5kb3dcbiJdfQ==
//# sourceURL=../../coffee/win/window.coffee
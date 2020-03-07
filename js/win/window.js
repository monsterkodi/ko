// koffee 1.12.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var Browser, CWD, Commandline, Editor, FPS, FileEditor, FileHandler, FileWatcher, Info, Navigate, Split, Tabs, Terminal, Titlebar, Window, _, addToShelf, args, changeFontSize, clamp, clearListeners, commandline, dialog, editor, electron, filehandler, filewatcher, klog, mainmenu, onClose, onCombo, onMove, pkg, post, prefs, projects, ref, reloadWin, remote, resetFontSize, restoreWin, saveStash, scheme, setFontSize, stash, stopEvent, store, tabs, terminal, titlebar, toggleCenterText, win, winID,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), _ = ref._, args = ref.args, clamp = ref.clamp, klog = ref.klog, post = ref.post, prefs = ref.prefs, scheme = ref.scheme, stash = ref.stash, stopEvent = ref.stopEvent, store = ref.store, win = ref.win;

Split = require('./split');

Terminal = require('./terminal');

Tabs = require('./tabs');

Titlebar = require('./titlebar');

Info = require('./info');

FileHandler = require('./filehandler');

FileWatcher = require('../tools/watcher');

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

filewatcher = null;

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
        filewatcher = window.filewatcher = new FileWatcher;
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
                window.state.set('recentFiles', []);
                window.titlebar.refreshMenu();
                return;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNGVBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjLFFBQVEsQ0FBQzs7QUFDdkIsTUFBQSxHQUFjLE1BQU0sQ0FBQzs7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U0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFqQjtBQUoxQyxhQUtTLGVBTFQ7QUFLbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsS0FBSyxFQUFDLEVBQUQsRUFBTCxDQUFTLGlCQUFULENBQWpCO0FBTDFDO0FBYk07O0FBb0JWLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFnQixPQUFoQjs7QUFFQSxJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBfLCBhcmdzLCBjbGFtcCwga2xvZywgcG9zdCwgcHJlZnMsIHNjaGVtZSwgc3Rhc2gsIHN0b3BFdmVudCwgc3RvcmUsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TcGxpdCAgICAgICA9IHJlcXVpcmUgJy4vc3BsaXQnXG5UZXJtaW5hbCAgICA9IHJlcXVpcmUgJy4vdGVybWluYWwnXG5UYWJzICAgICAgICA9IHJlcXVpcmUgJy4vdGFicydcblRpdGxlYmFyICAgID0gcmVxdWlyZSAnLi90aXRsZWJhcidcbkluZm8gICAgICAgID0gcmVxdWlyZSAnLi9pbmZvJ1xuRmlsZUhhbmRsZXIgPSByZXF1aXJlICcuL2ZpbGVoYW5kbGVyJ1xuRmlsZVdhdGNoZXIgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuRWRpdG9yICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvZWRpdG9yJ1xuQ29tbWFuZGxpbmUgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kbGluZSdcbkZpbGVFZGl0b3IgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2ZpbGVlZGl0b3InXG5OYXZpZ2F0ZSAgICA9IHJlcXVpcmUgJy4uL21haW4vbmF2aWdhdGUnXG5GUFMgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZwcydcbkNXRCAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvY3dkJ1xuc2NoZW1lICAgICAgPSByZXF1aXJlICcuLi90b29scy9zY2hlbWUnXG5wcm9qZWN0cyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuZWxlY3Ryb24gICAgPSByZXF1aXJlICdlbGVjdHJvbidcbnBrZyAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuXG5yZW1vdGUgICAgICA9IGVsZWN0cm9uLnJlbW90ZVxuZGlhbG9nICAgICAgPSByZW1vdGUuZGlhbG9nXG5Ccm93c2VyICAgICA9IHJlbW90ZS5Ccm93c2VyV2luZG93XG5lZGl0b3IgICAgICA9IG51bGxcbm1haW5tZW51ICAgID0gbnVsbFxudGVybWluYWwgICAgPSBudWxsXG5jb21tYW5kbGluZSA9IG51bGxcbnRpdGxlYmFyICAgID0gbnVsbFxudGFicyAgICAgICAgPSBudWxsXG5maWxlaGFuZGxlciA9IG51bGxcbmZpbGV3YXRjaGVyID0gbnVsbFxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuY2xhc3MgV2luZG93IGV4dGVuZHMgd2luXG4gICAgXG4gICAgQDogLT5cblxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgbWVudVRlbXBsYXRlOiAgIHJlcXVpcmUgJy4vbWVudSdcbiAgICAgICAgICAgIHBrZzogICAgICAgICAgICByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBtZW51OiAgICAgICAgICAgJy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgICAgICAgICBpY29uOiAgICAgICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIHNjaGVtZTogICAgICAgICBmYWxzZVxuICAgIFxuICAgICAgICBmaWxlaGFuZGxlciA9IHdpbmRvdy5maWxlaGFuZGxlciA9IG5ldyBGaWxlSGFuZGxlclxuICAgICAgICBmaWxld2F0Y2hlciA9IHdpbmRvdy5maWxld2F0Y2hlciA9IG5ldyBGaWxlV2F0Y2hlclxuICAgICAgICB0YWJzICAgICAgICA9IHdpbmRvdy50YWJzICAgICAgICA9IG5ldyBUYWJzIHdpbmRvdy50aXRsZWJhci5lbGVtXG4gICAgICAgIHRpdGxlYmFyICAgID0gICAgICAgICAgICAgICAgICAgICAgbmV3IFRpdGxlYmFyXG4gICAgICAgIG5hdmlnYXRlICAgID0gd2luZG93Lm5hdmlnYXRlICAgID0gbmV3IE5hdmlnYXRlKClcbiAgICAgICAgc3BsaXQgICAgICAgPSB3aW5kb3cuc3BsaXQgICAgICAgPSBuZXcgU3BsaXQoKVxuICAgICAgICB0ZXJtaW5hbCAgICA9IHdpbmRvdy50ZXJtaW5hbCAgICA9IG5ldyBUZXJtaW5hbCAndGVybWluYWwnXG4gICAgICAgIGVkaXRvciAgICAgID0gd2luZG93LmVkaXRvciAgICAgID0gbmV3IEZpbGVFZGl0b3IgJ2VkaXRvcidcbiAgICAgICAgY29tbWFuZGxpbmUgPSB3aW5kb3cuY29tbWFuZGxpbmUgPSBuZXcgQ29tbWFuZGxpbmUgJ2NvbW1hbmRsaW5lLWVkaXRvcidcbiAgICAgICAgaW5mbyAgICAgICAgPSB3aW5kb3cuaW5mbyAgICAgICAgPSBuZXcgSW5mbyBlZGl0b3JcbiAgICAgICAgZnBzICAgICAgICAgPSB3aW5kb3cuZnBzICAgICAgICAgPSBuZXcgRlBTKClcbiAgICAgICAgY3dkICAgICAgICAgPSB3aW5kb3cuY3dkICAgICAgICAgPSBuZXcgQ1dEKClcbiAgICBcbiAgICAgICAgd2luZG93LnRleHRFZGl0b3IgPSB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICAgICAgd2luZG93Lmxhc3RGb2N1cyA9IGVkaXRvci5uYW1lXG4gICAgXG4gICAgICAgIHJlc3RvcmVXaW4oKVxuICAgICAgICBzY2hlbWUuc2V0IHByZWZzLmdldCAnc2NoZW1lJyAnZGFyaydcbiAgICBcbiAgICAgICAgdGVybWluYWwub24gJ2ZpbGVTZWFyY2hSZXN1bHRDaGFuZ2UnIChmaWxlLCBsaW5lQ2hhbmdlKSAtPiAjIHNlbmRzIGNoYW5nZXMgdG8gYWxsIHdpbmRvd3NcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdmaWxlTGluZUNoYW5nZXMnIGZpbGUsIFtsaW5lQ2hhbmdlXVxuICAgIFxuICAgICAgICBlZGl0b3Iub24gJ2NoYW5nZWQnIChjaGFuZ2VJbmZvKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZUluZm8uZm9yZWlnblxuICAgICAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHBvc3QudG9PdGhlcldpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycgZWRpdG9yLmN1cnJlbnRGaWxlLCBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgICAgICBuYXZpZ2F0ZS5hZGRGaWxlUG9zIGZpbGU6IGVkaXRvci5jdXJyZW50RmlsZSwgcG9zOiBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICBcbiAgICAgICAgcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZvbnRTaXplJyBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgICAgICBlZGl0b3Iuc2V0Rm9udFNpemUgcyBpZiBzXG4gICAgXG4gICAgICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnXG4gICAgICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlIDBcbiAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdyZXN0b3JlJ1xuICAgICAgICBlZGl0b3IuZm9jdXMoKVxuXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgXG4gICAgb25NZW51QWN0aW9uOiAobmFtZSwgYXJncykgPT5cbiAgICBcbiAgICAgICAgaWYgYWN0aW9uID0gRWRpdG9yLmFjdGlvbldpdGhOYW1lIG5hbWVcbiAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5oYW5kbGVNZW51QWN0aW9uIG5hbWUsIGFyZ3NcbiAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBzd2l0Y2ggbmFtZVxuICAgIFxuICAgICAgICAgICAgd2hlbiAnZG9NYWNybycgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMubWFjcm8uZXhlY3V0ZSBhcmdzLmFjdGFyZ1xuICAgICAgICAgICAgd2hlbiAnVW5kbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8udW5kbygpXG4gICAgICAgICAgICB3aGVuICdSZWRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby5yZWRvKClcbiAgICAgICAgICAgIHdoZW4gJ0N1dCcgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmN1dCgpXG4gICAgICAgICAgICB3aGVuICdDb3B5JyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jb3B5KClcbiAgICAgICAgICAgIHdoZW4gJ1Bhc3RlJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLnBhc3RlKClcbiAgICAgICAgICAgIHdoZW4gJ05ldyBUYWInICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICduZXdFbXB0eVRhYidcbiAgICAgICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBTY2hlbWUnICAgICAgICAgdGhlbiByZXR1cm4gc2NoZW1lLnRvZ2dsZSgpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgQ2VudGVyIFRleHQnICAgIHRoZW4gcmV0dXJuIHRvZ2dsZUNlbnRlclRleHQoKVxuICAgICAgICAgICAgd2hlbiAnSW5jcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSArMVxuICAgICAgICAgICAgd2hlbiAnRGVjcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSAtMVxuICAgICAgICAgICAgd2hlbiAnUmVzZXQnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZXNldEZvbnRTaXplKClcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gV2luZG93IExpc3QnICAgICAgdGhlbiByZXR1cm4gdGl0bGViYXIuc2hvd0xpc3QoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgQmFja3dhcmQnICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5iYWNrd2FyZCgpXG4gICAgICAgICAgICB3aGVuICdOYXZpZ2F0ZSBGb3J3YXJkJyAgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmZvcndhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTWF4aW1pemUgRWRpdG9yJyAgICAgICB0aGVuIHJldHVybiBzcGxpdC5tYXhpbWl6ZUVkaXRvcigpXG4gICAgICAgICAgICB3aGVuICdBZGQgdG8gU2hlbGYnICAgICAgICAgIHRoZW4gcmV0dXJuIGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIEhpc3RvcnknICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZmlsZWJyb3dzZXIuc2hlbGYudG9nZ2xlSGlzdG9yeSgpXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBOZXh0IFRhYicgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ0FjdGl2YXRlIFByZXZpb3VzIFRhYicgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdNb3ZlIFRhYiBMZWZ0JyAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdNb3ZlIFRhYiBSaWdodCcgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnT3Blbi4uLicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJ1xuICAgICAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgVGFiLi4uJyAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJyBuZXdUYWI6IHRydWVcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFdpbmRvdy4uLicgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3V2luZG93OiB0cnVlXG4gICAgICAgICAgICB3aGVuICdTYXZlJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGUnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFsbCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUFsbCdcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUgQXMgLi4uJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZUFzJ1xuICAgICAgICAgICAgd2hlbiAnUmV2ZXJ0JyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3JlbG9hZEZpbGUnXG4gICAgICAgICAgICB3aGVuICdSZWxvYWQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBUYWIgb3IgV2luZG93JyAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VUYWJPcldpbmRvdydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFRhYnMnICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZU90aGVyVGFicydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFdpbmRvd3MnICAgdGhlbiByZXR1cm4gcG9zdC50b090aGVyV2lucyAnY2xvc2VXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdGdWxsc2NyZWVuJyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbi5zZXRGdWxsU2NyZWVuICF3aW4uaXNGdWxsU2NyZWVuKClcbiAgICAgICAgICAgIHdoZW4gJ0NsZWFyIExpc3QnICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2luZG93LnN0YXRlLnNldCAncmVjZW50RmlsZXMnIFtdXG4gICAgICAgICAgICAgICAgd2luZG93LnRpdGxlYmFyLnJlZnJlc2hNZW51KClcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICB3aGVuICdQcmVmZXJlbmNlcycgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGVzJyBbcHJlZnMuc3RvcmUuZmlsZV0sIG5ld1RhYjp0cnVlXG4gICAgICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyAgICAgICAgIHRoZW4gYXJncyA9IHdpbklEXG4gICAgXG4gICAgICAgICMgbG9nIFwidW5oYW5kbGVkIG1lbnUgYWN0aW9uISBwb3N0aW5nIHRvIG1haW4gJyN7bmFtZX0nIGFyZ3M6XCIsIGFyZ3NcbiAgICBcbiAgICAgICAgc3VwZXIgbmFtZSwgYXJnc1xuICAgIFxud2luICAgPSB3aW5kb3cud2luICAgPSByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpXG53aW5JRCA9IHdpbmRvdy53aW5JRCA9IHdpbi5pZFxuICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuXG53aW5kb3cuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJyBzZXBhcmF0b3I6J3wnXG53aW5kb3cucHJlZnMgPSBwcmVmc1xud2luZG93LnN0YXNoID0gbmV3IHN0YXNoIFwid2luLyN7d2luSUR9XCIgc2VwYXJhdG9yOid8J1xuXG5wb3N0LnNldE1heExpc3RlbmVycyAyMFxuXG5zYXZlU3Rhc2ggPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzdGFzaCdcbiAgICBlZGl0b3Iuc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zKClcbiAgICB3aW5kb3cuc3Rhc2guc2F2ZSgpXG4gICAgcG9zdC50b01haW4gJ3N0YXNoU2F2ZWQnXG5cbnJlc3RvcmVXaW4gPSAtPlxuXG4gICAgaWYgYm91bmRzID0gd2luZG93LnN0YXNoLmdldCAnYm91bmRzJ1xuICAgICAgICB3aW4uc2V0Qm91bmRzIGJvdW5kc1xuXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnZGV2VG9vbHMnXG4gICAgICAgIHdpbi53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub24gJ3NpbmdsZUN1cnNvckF0UG9zJyAocG9zLCBvcHQpIC0+ICMgYnJvd3NlciBkb3VibGUgY2xpY2sgYW5kIG5ld1RhYldpdGhGaWxlIDpsOmNcbiAgICBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgcG9zLCBvcHQgXG4gICAgZWRpdG9yLnNjcm9sbC5jdXJzb3JUb1RvcCgpXG5wb3N0Lm9uICdmb2N1c0VkaXRvcicgIC0+IHNwbGl0LmZvY3VzICdlZGl0b3InXG5wb3N0Lm9uICdjbG9uZUZpbGUnICAgIC0+IHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG5wb3N0Lm9uICdjbG9zZVdpbmRvdycgIC0+IHdpbmRvdy53aW4uY2xvc2UoKVxucG9zdC5vbiAnc2F2ZVN0YXNoJyAgICAtPiBzYXZlU3Rhc2goKVxucG9zdC5vbiAnZWRpdG9yRm9jdXMnIChlZGl0b3IpIC0+XG4gICAgd2luZG93LnNldExhc3RGb2N1cyBlZGl0b3IubmFtZVxuICAgIHdpbmRvdy5mb2N1c0VkaXRvciA9IGVkaXRvclxuICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gZWRpdG9yIGlmIGVkaXRvci5uYW1lICE9ICdjb21tYW5kbGluZS1lZGl0b3InXG5cbiMgdGVzdGluZyByZWxhdGVkIC4uLlxuXG5wb3N0Lm9uICdtYWlubG9nJyAtPiBrbG9nLmFwcGx5IGtsb2csIGFyZ3VtZW50c1xuXG5wb3N0Lm9uICdwaW5nJyAod0lELCBhcmdBLCBhcmdCKSAtPiBwb3N0LnRvV2luIHdJRCwgJ3BvbmcnIHdpbklELCBhcmdBLCBhcmdCXG5wb3N0Lm9uICdwb3N0RWRpdG9yU3RhdGUnIC0+XG4gICAgcG9zdC50b0FsbCAnZWRpdG9yU3RhdGUnIHdpbklELFxuICAgICAgICBsaW5lczogICAgICBlZGl0b3IubGluZXMoKVxuICAgICAgICBjdXJzb3JzOiAgICBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgIG1haW46ICAgICAgIGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgc2VsZWN0aW9uczogZWRpdG9yLnNlbGVjdGlvbnMoKVxuICAgICAgICBoaWdobGlnaHRzOiBlZGl0b3IuaGlnaGxpZ2h0cygpXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG53aW5kb3cuZWRpdG9yV2l0aE5hbWUgPSAobikgLT5cblxuICAgIHN3aXRjaCBuXG4gICAgICAgIHdoZW4gJ2VkaXRvcicgICB0aGVuIGVkaXRvclxuICAgICAgICB3aGVuICdjb21tYW5kJyAnY29tbWFuZGxpbmUnIHRoZW4gY29tbWFuZGxpbmVcbiAgICAgICAgd2hlbiAndGVybWluYWwnIHRoZW4gdGVybWluYWxcbiAgICAgICAgZWxzZSBlZGl0b3JcblxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbm9uTW92ZSAgPSAtPiB3aW5kb3cuc3Rhc2guc2V0ICdib3VuZHMnIHdpbi5nZXRCb3VuZHMoKVxuXG5jbGVhckxpc3RlbmVycyA9IC0+XG5cbiAgICB3aW4ucmVtb3ZlTGlzdGVuZXIgJ2Nsb3NlJyBvbkNsb3NlXG4gICAgd2luLnJlbW92ZUxpc3RlbmVyICdtb3ZlJyAgb25Nb3ZlXG4gICAgd2luLndlYkNvbnRlbnRzLnJlbW92ZUFsbExpc3RlbmVycyAnZGV2dG9vbHMtb3BlbmVkJ1xuICAgIHdpbi53ZWJDb250ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMgJ2RldnRvb2xzLWNsb3NlZCdcblxub25DbG9zZSA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3NhdmVDaGFuZ2VzJ1xuICAgIGVkaXRvci5zZXRUZXh0ICcnXG4gICAgIyBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuXG4gICAgaWYgQnJvd3Nlci5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID4gMVxuICAgICAgICB3aW5kb3cuc3Rhc2guY2xlYXIoKVxuXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICBpbmZvLnJlbG9hZCgpXG4gICAgd2luLm9uICdjbG9zZScgb25DbG9zZVxuICAgIHdpbi5vbiAnbW92ZScgIG9uTW92ZVxuICAgIHdpbi53ZWJDb250ZW50cy5vbiAnZGV2dG9vbHMtb3BlbmVkJyAtPiB3aW5kb3cuc3Rhc2guc2V0ICdkZXZUb29scycgdHJ1ZVxuICAgIHdpbi53ZWJDb250ZW50cy5vbiAnZGV2dG9vbHMtY2xvc2VkJyAtPiB3aW5kb3cuc3Rhc2guc2V0ICdkZXZUb29scydcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG5yZWxvYWRXaW4gPSAtPlxuXG4gICAgc2F2ZVN0YXNoKClcbiAgICBjbGVhckxpc3RlbmVycygpXG4gICAgcG9zdC50b01haW4gJ3JlbG9hZFdpbicgd2luSUQ6d2luLmlkLCBmaWxlOmVkaXRvci5jdXJyZW50RmlsZVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG53aW5kb3cub25yZXNpemUgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW4uZ2V0Qm91bmRzKClcbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAyMDBcblxucG9zdC5vbiAnc3BsaXQnIChzKSAtPlxuXG4gICAgZmlsZWJyb3dzZXIucmVzaXplZCgpXG4gICAgdGVybWluYWwucmVzaXplZCgpXG4gICAgY29tbWFuZGxpbmUucmVzaXplZCgpXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxudG9nZ2xlQ2VudGVyVGV4dCA9IC0+XG5cbiAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwiaW52aXNpYmxlc3wje2VkaXRvci5jdXJyZW50RmlsZX1cIiwgZmFsc2VcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICByZXN0b3JlSW52aXNpYmxlcyA9IHRydWVcblxuICAgIGlmIG5vdCB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyB0cnVlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWVcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IGZhbHNlXG5cbiAgICBpZiByZXN0b3JlSW52aXNpYmxlc1xuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuc2V0Rm9udFNpemUgPSAocykgLT5cblxuICAgIHMgPSBwcmVmcy5nZXQoJ2VkaXRvckZvbnRTaXplJyAxOSkgaWYgbm90IF8uaXNGaW5pdGUgc1xuICAgIHMgPSBjbGFtcCA4IDEwMCBzXG5cbiAgICB3aW5kb3cuc3Rhc2guc2V0IFwiZm9udFNpemVcIiBzXG4gICAgZWRpdG9yLnNldEZvbnRTaXplIHNcbiAgICBpZiBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZSwgcmVsb2FkOnRydWVcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cblxuICAgIGlmICAgICAgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMzBcbiAgICAgICAgZiA9IDRcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDUwXG4gICAgICAgIGYgPSAxMFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMjBcbiAgICAgICAgZiA9IDJcbiAgICBlbHNlXG4gICAgICAgIGYgPSAxXG4gICAgc2V0Rm9udFNpemUgZWRpdG9yLnNpemUuZm9udFNpemUgKyBmKmRcblxucmVzZXRGb250U2l6ZSA9IC0+XG5cbiAgICBkZWZhdWx0Rm9udFNpemUgPSBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcbiAgICBzZXRGb250U2l6ZSBkZWZhdWx0Rm9udFNpemVcblxuYWRkVG9TaGVsZiA9IC0+XG5cbiAgICBmaWxlQnJvd3NlciA9IHdpbmRvdy5maWxlYnJvd3NlclxuICAgIHJldHVybiBpZiB3aW5kb3cubGFzdEZvY3VzID09ICdzaGVsZidcbiAgICBpZiB3aW5kb3cubGFzdEZvY3VzLnN0YXJ0c1dpdGggZmlsZUJyb3dzZXIubmFtZVxuICAgICAgICBwYXRoID0gZmlsZUJyb3dzZXIuY29sdW1uV2l0aE5hbWUod2luZG93Lmxhc3RGb2N1cykuYWN0aXZlUGF0aCgpXG4gICAgZWxzZVxuICAgICAgICBwYXRoID0gZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoXG5cbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyAgICAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAgMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbnJlc2V0Wm9vbTogLT5cblxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgMVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuY2hhbmdlWm9vbTogKGQpIC0+XG4gICAgXG4gICAgeiA9IHdlYmZyYW1lLmdldFpvb21GYWN0b3IoKVxuICAgIHogKj0gMStkLzIwXG4gICAgeiA9IGNsYW1wIDAuMzYgNS4yMyB6XG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciB6XG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxud2luZG93Lm9uYmx1ciAgPSAoZXZlbnQpIC0+IHBvc3QuZW1pdCAnd2luRm9jdXMnIGZhbHNlXG53aW5kb3cub25mb2N1cyA9IChldmVudCkgLT5cbiAgICBwb3N0LmVtaXQgJ3dpbkZvY3VzJyB0cnVlXG4gICAgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbGFzc05hbWUgPT0gJ2JvZHknXG4gICAgICAgIGlmIHNwbGl0LmVkaXRvclZpc2libGUoKVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2VkaXRvcidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxud2luZG93LnNldExhc3RGb2N1cyA9IChuYW1lKSAtPlxuICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBuYW1lXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG5vbkNvbWJvID0gKGNvbWJvLCBpbmZvKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuXG4gICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IH0gPSBpbmZvXG5cbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gdGl0bGViYXIuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICBmb3IgaSBpbiBbMS4uOV1cbiAgICAgICAgaWYgY29tYm8gaXMgXCJhbHQrI3tpfVwiXG4gICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBwb3N0LnRvTWFpbiAnYWN0aXZhdGVXaW5kb3cnIGlcblxuICAgIHN3aXRjaCBjb21ib1xuICAgICAgICB3aGVuICdmMycgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc2NyZWVuU2hvdCgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrPScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSArMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCswJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEByZXNldFpvb20oKVxuICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt5JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcblxucG9zdC5vbiAnY29tYm8nIG9uQ29tYm9cblxubmV3IFdpbmRvd1xuIl19
//# sourceURL=../../coffee/win/window.coffee
// koffee 1.11.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNGVBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjLFFBQVEsQ0FBQzs7QUFDdkIsTUFBQSxHQUFjLE1BQU0sQ0FBQzs7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LENBQUEsQ0FBakI7QUFKMUMsYUFLUyxlQUxUO0FBS21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBUyxpQkFBVCxDQUFqQjtBQUwxQztBQWJNOztBQW9CVixJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBZ0IsT0FBaEI7O0FBRUEsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgXywgYXJncywgY2xhbXAsIGtsb2csIHBvc3QsIHByZWZzLCBzY2hlbWUsIHN0YXNoLCBzdG9wRXZlbnQsIHN0b3JlLCB3aW4gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3BsaXQgICAgICAgPSByZXF1aXJlICcuL3NwbGl0J1xuVGVybWluYWwgICAgPSByZXF1aXJlICcuL3Rlcm1pbmFsJ1xuVGFicyAgICAgICAgPSByZXF1aXJlICcuL3RhYnMnXG5UaXRsZWJhciAgICA9IHJlcXVpcmUgJy4vdGl0bGViYXInXG5JbmZvICAgICAgICA9IHJlcXVpcmUgJy4vaW5mbydcbkZpbGVIYW5kbGVyID0gcmVxdWlyZSAnLi9maWxlaGFuZGxlcidcbkZpbGVXYXRjaGVyID0gcmVxdWlyZSAnLi4vdG9vbHMvd2F0Y2hlcidcbkVkaXRvciAgICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2VkaXRvcidcbkNvbW1hbmRsaW5lID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZGxpbmUnXG5GaWxlRWRpdG9yICA9IHJlcXVpcmUgJy4uL2VkaXRvci9maWxlZWRpdG9yJ1xuTmF2aWdhdGUgICAgPSByZXF1aXJlICcuLi9tYWluL25hdmlnYXRlJ1xuRlBTICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9mcHMnXG5DV0QgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2N3ZCdcbnNjaGVtZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvc2NoZW1lJ1xucHJvamVjdHMgICAgPSByZXF1aXJlICcuLi90b29scy9wcm9qZWN0cydcbmVsZWN0cm9uICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5wa2cgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcblxucmVtb3RlICAgICAgPSBlbGVjdHJvbi5yZW1vdGVcbmRpYWxvZyAgICAgID0gcmVtb3RlLmRpYWxvZ1xuQnJvd3NlciAgICAgPSByZW1vdGUuQnJvd3NlcldpbmRvd1xuZWRpdG9yICAgICAgPSBudWxsXG5tYWlubWVudSAgICA9IG51bGxcbnRlcm1pbmFsICAgID0gbnVsbFxuY29tbWFuZGxpbmUgPSBudWxsXG50aXRsZWJhciAgICA9IG51bGxcbnRhYnMgICAgICAgID0gbnVsbFxuZmlsZWhhbmRsZXIgPSBudWxsXG5maWxld2F0Y2hlciA9IG51bGxcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG5cbmNsYXNzIFdpbmRvdyBleHRlbmRzIHdpblxuICAgIFxuICAgIEA6IC0+XG5cbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIG1lbnVUZW1wbGF0ZTogICByZXF1aXJlICcuL21lbnUnXG4gICAgICAgICAgICBwa2c6ICAgICAgICAgICAgcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuICAgICAgICAgICAgbWVudTogICAgICAgICAgICcuLi8uLi9jb2ZmZWUvbWVudS5ub29uJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgICAgICcuLi8uLi9pbWcvbWVudUAyeC5wbmcnXG4gICAgICAgICAgICBzY2hlbWU6ICAgICAgICAgZmFsc2VcbiAgICBcbiAgICAgICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICAgICAgZmlsZXdhdGNoZXIgPSB3aW5kb3cuZmlsZXdhdGNoZXIgPSBuZXcgRmlsZVdhdGNoZXJcbiAgICAgICAgdGFicyAgICAgICAgPSB3aW5kb3cudGFicyAgICAgICAgPSBuZXcgVGFicyB3aW5kb3cudGl0bGViYXIuZWxlbVxuICAgICAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgICAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgICAgIHNwbGl0ICAgICAgID0gd2luZG93LnNwbGl0ICAgICAgID0gbmV3IFNwbGl0KClcbiAgICAgICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgICAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgICAgIGNvbW1hbmRsaW5lID0gd2luZG93LmNvbW1hbmRsaW5lID0gbmV3IENvbW1hbmRsaW5lICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgICAgIGN3ZCAgICAgICAgID0gd2luZG93LmN3ZCAgICAgICAgID0gbmV3IENXRCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBlZGl0b3IubmFtZVxuICAgIFxuICAgICAgICByZXN0b3JlV2luKClcbiAgICAgICAgc2NoZW1lLnNldCBwcmVmcy5nZXQgJ3NjaGVtZScgJ2RhcmsnXG4gICAgXG4gICAgICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJyAoZmlsZSwgbGluZUNoYW5nZSkgLT4gIyBzZW5kcyBjaGFuZ2VzIHRvIGFsbCB3aW5kb3dzXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBmaWxlLCBbbGluZUNoYW5nZV1cbiAgICBcbiAgICAgICAgZWRpdG9yLm9uICdjaGFuZ2VkJyAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2VJbmZvLmZvcmVpZ25cbiAgICAgICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnIGVkaXRvci5jdXJyZW50RmlsZSwgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICAgICAgbmF2aWdhdGUuYWRkRmlsZVBvcyBmaWxlOiBlZGl0b3IuY3VycmVudEZpbGUsIHBvczogZWRpdG9yLmN1cnNvclBvcygpXG4gICAgXG4gICAgICAgIHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmb250U2l6ZScgcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICAgICAgZWRpdG9yLnNldEZvbnRTaXplIHMgaWYgc1xuICAgIFxuICAgICAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0J1xuICAgICAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSwgMFxuICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ3Jlc3RvcmUnXG4gICAgICAgIGVkaXRvci5mb2N1cygpXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChuYW1lLCBhcmdzKSA9PlxuICAgIFxuICAgICAgICBpZiBhY3Rpb24gPSBFZGl0b3IuYWN0aW9uV2l0aE5hbWUgbmFtZVxuICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV0gYXJncy5hY3RhcmdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmhhbmRsZU1lbnVBY3Rpb24gbmFtZSwgYXJnc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIHN3aXRjaCBuYW1lXG4gICAgXG4gICAgICAgICAgICB3aGVuICdkb01hY3JvJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5tYWNyby5leGVjdXRlIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICB3aGVuICdVbmRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby51bmRvKClcbiAgICAgICAgICAgIHdoZW4gJ1JlZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnJlZG8oKVxuICAgICAgICAgICAgd2hlbiAnQ3V0JyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY3V0KClcbiAgICAgICAgICAgIHdoZW4gJ0NvcHknICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmNvcHkoKVxuICAgICAgICAgICAgd2hlbiAnUGFzdGUnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IucGFzdGUoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFRhYicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ25ld0VtcHR5VGFiJ1xuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBDZW50ZXIgVGV4dCcgICAgdGhlbiByZXR1cm4gdG9nZ2xlQ2VudGVyVGV4dCgpXG4gICAgICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplICsxXG4gICAgICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgICAgICB3aGVuICdSZXNldCcgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBXaW5kb3cgTGlzdCcgICAgICB0aGVuIHJldHVybiB0aXRsZWJhci5zaG93TGlzdCgpXG4gICAgICAgICAgICB3aGVuICdOYXZpZ2F0ZSBCYWNrd2FyZCcgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmJhY2t3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEZvcndhcmQnICAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuZm9yd2FyZCgpXG4gICAgICAgICAgICB3aGVuICdNYXhpbWl6ZSBFZGl0b3InICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgSGlzdG9yeScgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5maWxlYnJvd3Nlci5zaGVsZi50b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgIHdoZW4gJ0FjdGl2YXRlIE5leHQgVGFiJyAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgUHJldmlvdXMgVGFiJyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIExlZnQnICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIFJpZ2h0JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdPcGVuLi4uJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBUYWIuLi4nICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1RhYjogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgV2luZG93Li4uJyB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJyBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUgQWxsJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlQWxsJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBcyAuLi4nICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlQXMnXG4gICAgICAgICAgICB3aGVuICdSZXZlcnQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAncmVsb2FkRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ1JlbG9hZCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVsb2FkV2luKClcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIFRhYiBvciBXaW5kb3cnICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZVRhYk9yV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgVGFicycgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlT3RoZXJUYWJzJ1xuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgV2luZG93cycgICB0aGVuIHJldHVybiBwb3N0LnRvT3RoZXJXaW5zICdjbG9zZVdpbmRvdydcbiAgICAgICAgICAgIHdoZW4gJ0Z1bGxzY3JlZW4nICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luLnNldEZ1bGxTY3JlZW4gIXdpbi5pc0Z1bGxTY3JlZW4oKVxuICAgICAgICAgICAgd2hlbiAnQ2xlYXIgTGlzdCcgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuc3RhdGUuc2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICAgICAgICAgIHdoZW4gJ1ByZWZlcmVuY2VzJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZXMnIFtwcmVmcy5zdG9yZS5maWxlXSwgbmV3VGFiOnRydWVcbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgICAgICAgdGhlbiBhcmdzID0gd2luSURcbiAgICBcbiAgICAgICAgIyBsb2cgXCJ1bmhhbmRsZWQgbWVudSBhY3Rpb24hIHBvc3RpbmcgdG8gbWFpbiAnI3tuYW1lfScgYXJnczpcIiwgYXJnc1xuICAgIFxuICAgICAgICBzdXBlciBuYW1lLCBhcmdzXG4gICAgXG53aW4gICA9IHdpbmRvdy53aW4gICA9IHJlbW90ZS5nZXRDdXJyZW50V2luZG93KClcbndpbklEID0gd2luZG93LndpbklEID0gd2luLmlkXG4gICAgICAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG5cbndpbmRvdy5zdGF0ZSA9IG5ldyBzdG9yZSAnc3RhdGUnIHNlcGFyYXRvcjonfCdcbndpbmRvdy5wcmVmcyA9IHByZWZzXG53aW5kb3cuc3Rhc2ggPSBuZXcgc3Rhc2ggXCJ3aW4vI3t3aW5JRH1cIiBzZXBhcmF0b3I6J3wnXG5cbnBvc3Quc2V0TWF4TGlzdGVuZXJzIDIwXG5cbnNhdmVTdGFzaCA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3N0YXNoJ1xuICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgIHdpbmRvdy5zdGFzaC5zYXZlKClcbiAgICBwb3N0LnRvTWFpbiAnc3Rhc2hTYXZlZCdcblxucmVzdG9yZVdpbiA9IC0+XG5cbiAgICBpZiBib3VuZHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdib3VuZHMnXG4gICAgICAgIHdpbi5zZXRCb3VuZHMgYm91bmRzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdkZXZUb29scydcbiAgICAgICAgd2luLndlYkNvbnRlbnRzLm9wZW5EZXZUb29scygpXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbiAnc2luZ2xlQ3Vyc29yQXRQb3MnIChwb3MsIG9wdCkgLT4gIyBicm93c2VyIGRvdWJsZSBjbGljayBhbmQgbmV3VGFiV2l0aEZpbGUgOmw6Y1xuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdCBcbiAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbnBvc3Qub24gJ2ZvY3VzRWRpdG9yJyAgLT4gc3BsaXQuZm9jdXMgJ2VkaXRvcidcbnBvc3Qub24gJ2Nsb25lRmlsZScgICAgLT4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gd2luZG93Lndpbi5jbG9zZSgpXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxuIyB0ZXN0aW5nIHJlbGF0ZWQgLi4uXG5cbnBvc3Qub24gJ21haW5sb2cnIC0+IGtsb2cuYXBwbHkga2xvZywgYXJndW1lbnRzXG5cbnBvc3Qub24gJ3BpbmcnICh3SUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd0lELCAncG9uZycgd2luSUQsIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3Bvc3RFZGl0b3JTdGF0ZScgLT5cbiAgICBwb3N0LnRvQWxsICdlZGl0b3JTdGF0ZScgd2luSUQsXG4gICAgICAgIGxpbmVzOiAgICAgIGVkaXRvci5saW5lcygpXG4gICAgICAgIGN1cnNvcnM6ICAgIGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgbWFpbjogICAgICAgZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBzZWxlY3Rpb25zOiBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgIGhpZ2hsaWdodHM6IGVkaXRvci5oaWdobGlnaHRzKClcblxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbndpbmRvdy5lZGl0b3JXaXRoTmFtZSA9IChuKSAtPlxuXG4gICAgc3dpdGNoIG5cbiAgICAgICAgd2hlbiAnZWRpdG9yJyAgIHRoZW4gZWRpdG9yXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQnICdjb21tYW5kbGluZScgdGhlbiBjb21tYW5kbGluZVxuICAgICAgICB3aGVuICd0ZXJtaW5hbCcgdGhlbiB0ZXJtaW5hbFxuICAgICAgICBlbHNlIGVkaXRvclxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxub25Nb3ZlICA9IC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycgd2luLmdldEJvdW5kcygpXG5cbmNsZWFyTGlzdGVuZXJzID0gLT5cblxuICAgIHdpbi5yZW1vdmVMaXN0ZW5lciAnY2xvc2UnIG9uQ2xvc2VcbiAgICB3aW4ucmVtb3ZlTGlzdGVuZXIgJ21vdmUnICBvbk1vdmVcbiAgICB3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1vcGVuZWQnXG4gICAgd2luLndlYkNvbnRlbnRzLnJlbW92ZUFsbExpc3RlbmVycyAnZGV2dG9vbHMtY2xvc2VkJ1xuXG5vbkNsb3NlID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc2F2ZUNoYW5nZXMnXG4gICAgZWRpdG9yLnNldFRleHQgJydcbiAgICAjIGVkaXRvci5zdG9wV2F0Y2hlcigpXG5cbiAgICBpZiBCcm93c2VyLmdldEFsbFdpbmRvd3MoKS5sZW5ndGggPiAxXG4gICAgICAgIHdpbmRvdy5zdGFzaC5jbGVhcigpXG5cbiAgICBjbGVhckxpc3RlbmVycygpXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5kb3cub25sb2FkID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIGluZm8ucmVsb2FkKClcbiAgICB3aW4ub24gJ2Nsb3NlJyBvbkNsb3NlXG4gICAgd2luLm9uICdtb3ZlJyAgb25Nb3ZlXG4gICAgd2luLndlYkNvbnRlbnRzLm9uICdkZXZ0b29scy1vcGVuZWQnIC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2RldlRvb2xzJyB0cnVlXG4gICAgd2luLndlYkNvbnRlbnRzLm9uICdkZXZ0b29scy1jbG9zZWQnIC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2RldlRvb2xzJ1xuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbnJlbG9hZFdpbiA9IC0+XG5cbiAgICBzYXZlU3Rhc2goKVxuICAgIGNsZWFyTGlzdGVuZXJzKClcbiAgICAjIGVkaXRvci5zdG9wV2F0Y2hlcigpXG4gICAgcG9zdC50b01haW4gJ3JlbG9hZFdpbicgd2luSUQ6d2luLmlkLCBmaWxlOmVkaXRvci5jdXJyZW50RmlsZVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG53aW5kb3cub25yZXNpemUgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW4uZ2V0Qm91bmRzKClcbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAyMDBcblxucG9zdC5vbiAnc3BsaXQnIChzKSAtPlxuXG4gICAgZmlsZWJyb3dzZXIucmVzaXplZCgpXG4gICAgdGVybWluYWwucmVzaXplZCgpXG4gICAgY29tbWFuZGxpbmUucmVzaXplZCgpXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxudG9nZ2xlQ2VudGVyVGV4dCA9IC0+XG5cbiAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwiaW52aXNpYmxlc3wje2VkaXRvci5jdXJyZW50RmlsZX1cIiwgZmFsc2VcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICByZXN0b3JlSW52aXNpYmxlcyA9IHRydWVcblxuICAgIGlmIG5vdCB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyB0cnVlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWVcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IGZhbHNlXG5cbiAgICBpZiByZXN0b3JlSW52aXNpYmxlc1xuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuc2V0Rm9udFNpemUgPSAocykgLT5cblxuICAgIHMgPSBwcmVmcy5nZXQoJ2VkaXRvckZvbnRTaXplJyAxOSkgaWYgbm90IF8uaXNGaW5pdGUgc1xuICAgIHMgPSBjbGFtcCA4IDEwMCBzXG5cbiAgICB3aW5kb3cuc3Rhc2guc2V0IFwiZm9udFNpemVcIiBzXG4gICAgZWRpdG9yLnNldEZvbnRTaXplIHNcbiAgICBpZiBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZSwgcmVsb2FkOnRydWVcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cblxuICAgIGlmICAgICAgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMzBcbiAgICAgICAgZiA9IDRcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDUwXG4gICAgICAgIGYgPSAxMFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMjBcbiAgICAgICAgZiA9IDJcbiAgICBlbHNlXG4gICAgICAgIGYgPSAxXG4gICAgc2V0Rm9udFNpemUgZWRpdG9yLnNpemUuZm9udFNpemUgKyBmKmRcblxucmVzZXRGb250U2l6ZSA9IC0+XG5cbiAgICBkZWZhdWx0Rm9udFNpemUgPSBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcbiAgICBzZXRGb250U2l6ZSBkZWZhdWx0Rm9udFNpemVcblxuYWRkVG9TaGVsZiA9IC0+XG5cbiAgICBmaWxlQnJvd3NlciA9IHdpbmRvdy5maWxlYnJvd3NlclxuICAgIHJldHVybiBpZiB3aW5kb3cubGFzdEZvY3VzID09ICdzaGVsZidcbiAgICBpZiB3aW5kb3cubGFzdEZvY3VzLnN0YXJ0c1dpdGggZmlsZUJyb3dzZXIubmFtZVxuICAgICAgICBwYXRoID0gZmlsZUJyb3dzZXIuY29sdW1uV2l0aE5hbWUod2luZG93Lmxhc3RGb2N1cykuYWN0aXZlUGF0aCgpXG4gICAgZWxzZVxuICAgICAgICBwYXRoID0gZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoXG5cbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyAgICAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAgMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbnJlc2V0Wm9vbTogLT5cblxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgMVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuY2hhbmdlWm9vbTogKGQpIC0+XG4gICAgXG4gICAgeiA9IHdlYmZyYW1lLmdldFpvb21GYWN0b3IoKVxuICAgIHogKj0gMStkLzIwXG4gICAgeiA9IGNsYW1wIDAuMzYgNS4yMyB6XG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciB6XG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxud2luZG93Lm9uYmx1ciAgPSAoZXZlbnQpIC0+IHBvc3QuZW1pdCAnd2luRm9jdXMnIGZhbHNlXG53aW5kb3cub25mb2N1cyA9IChldmVudCkgLT5cbiAgICBwb3N0LmVtaXQgJ3dpbkZvY3VzJyB0cnVlXG4gICAgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbGFzc05hbWUgPT0gJ2JvZHknXG4gICAgICAgIGlmIHNwbGl0LmVkaXRvclZpc2libGUoKVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2VkaXRvcidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxud2luZG93LnNldExhc3RGb2N1cyA9IChuYW1lKSAtPlxuICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBuYW1lXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG5vbkNvbWJvID0gKGNvbWJvLCBpbmZvKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuXG4gICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IH0gPSBpbmZvXG5cbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gdGl0bGViYXIuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICBmb3IgaSBpbiBbMS4uOV1cbiAgICAgICAgaWYgY29tYm8gaXMgXCJhbHQrI3tpfVwiXG4gICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBwb3N0LnRvTWFpbiAnYWN0aXZhdGVXaW5kb3cnIGlcblxuICAgIHN3aXRjaCBjb21ib1xuICAgICAgICB3aGVuICdmMycgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc2NyZWVuU2hvdCgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrPScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSArMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCswJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEByZXNldFpvb20oKVxuICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt5JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcblxucG9zdC5vbiAnY29tYm8nIG9uQ29tYm9cblxubmV3IFdpbmRvd1xuIl19
//# sourceURL=../../coffee/win/window.coffee
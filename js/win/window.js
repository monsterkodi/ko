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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNGVBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjLFFBQVEsQ0FBQzs7QUFDdkIsTUFBQSxHQUFjLE1BQU0sQ0FBQzs7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LENBQUEsQ0FBakI7QUFKMUMsYUFLUyxlQUxUO0FBS21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBUyxpQkFBVCxDQUFqQjtBQUwxQztBQWJNOztBQW9CVixJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBZ0IsT0FBaEI7O0FBRUEsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgXywgYXJncywgY2xhbXAsIGtsb2csIHBvc3QsIHByZWZzLCBzY2hlbWUsIHN0YXNoLCBzdG9wRXZlbnQsIHN0b3JlLCB3aW4gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3BsaXQgICAgICAgPSByZXF1aXJlICcuL3NwbGl0J1xuVGVybWluYWwgICAgPSByZXF1aXJlICcuL3Rlcm1pbmFsJ1xuVGFicyAgICAgICAgPSByZXF1aXJlICcuL3RhYnMnXG5UaXRsZWJhciAgICA9IHJlcXVpcmUgJy4vdGl0bGViYXInXG5JbmZvICAgICAgICA9IHJlcXVpcmUgJy4vaW5mbydcbkZpbGVIYW5kbGVyID0gcmVxdWlyZSAnLi9maWxlaGFuZGxlcidcbkZpbGVXYXRjaGVyID0gcmVxdWlyZSAnLi4vdG9vbHMvd2F0Y2hlcidcbkVkaXRvciAgICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2VkaXRvcidcbkNvbW1hbmRsaW5lID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZGxpbmUnXG5GaWxlRWRpdG9yICA9IHJlcXVpcmUgJy4uL2VkaXRvci9maWxlZWRpdG9yJ1xuTmF2aWdhdGUgICAgPSByZXF1aXJlICcuLi9tYWluL25hdmlnYXRlJ1xuRlBTICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9mcHMnXG5DV0QgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2N3ZCdcbnNjaGVtZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvc2NoZW1lJ1xucHJvamVjdHMgICAgPSByZXF1aXJlICcuLi90b29scy9wcm9qZWN0cydcbmVsZWN0cm9uICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5wa2cgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcblxucmVtb3RlICAgICAgPSBlbGVjdHJvbi5yZW1vdGVcbmRpYWxvZyAgICAgID0gcmVtb3RlLmRpYWxvZ1xuQnJvd3NlciAgICAgPSByZW1vdGUuQnJvd3NlcldpbmRvd1xuZWRpdG9yICAgICAgPSBudWxsXG5tYWlubWVudSAgICA9IG51bGxcbnRlcm1pbmFsICAgID0gbnVsbFxuY29tbWFuZGxpbmUgPSBudWxsXG50aXRsZWJhciAgICA9IG51bGxcbnRhYnMgICAgICAgID0gbnVsbFxuZmlsZWhhbmRsZXIgPSBudWxsXG5maWxld2F0Y2hlciA9IG51bGxcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG5cbmNsYXNzIFdpbmRvdyBleHRlbmRzIHdpblxuICAgIFxuICAgIEA6IC0+XG5cbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIG1lbnVUZW1wbGF0ZTogICByZXF1aXJlICcuL21lbnUnXG4gICAgICAgICAgICBwa2c6ICAgICAgICAgICAgcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuICAgICAgICAgICAgbWVudTogICAgICAgICAgICcuLi8uLi9jb2ZmZWUvbWVudS5ub29uJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgICAgICcuLi8uLi9pbWcvbWVudUAyeC5wbmcnXG4gICAgICAgICAgICBzY2hlbWU6ICAgICAgICAgZmFsc2VcbiAgICBcbiAgICAgICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICAgICAgZmlsZXdhdGNoZXIgPSB3aW5kb3cuZmlsZXdhdGNoZXIgPSBuZXcgRmlsZVdhdGNoZXJcbiAgICAgICAgdGFicyAgICAgICAgPSB3aW5kb3cudGFicyAgICAgICAgPSBuZXcgVGFicyB3aW5kb3cudGl0bGViYXIuZWxlbVxuICAgICAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgICAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgICAgIHNwbGl0ICAgICAgID0gd2luZG93LnNwbGl0ICAgICAgID0gbmV3IFNwbGl0KClcbiAgICAgICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgICAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgICAgIGNvbW1hbmRsaW5lID0gd2luZG93LmNvbW1hbmRsaW5lID0gbmV3IENvbW1hbmRsaW5lICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgICAgIGN3ZCAgICAgICAgID0gd2luZG93LmN3ZCAgICAgICAgID0gbmV3IENXRCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBlZGl0b3IubmFtZVxuICAgIFxuICAgICAgICByZXN0b3JlV2luKClcbiAgICAgICAgc2NoZW1lLnNldCBwcmVmcy5nZXQgJ3NjaGVtZScgJ2RhcmsnXG4gICAgXG4gICAgICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJyAoZmlsZSwgbGluZUNoYW5nZSkgLT4gIyBzZW5kcyBjaGFuZ2VzIHRvIGFsbCB3aW5kb3dzXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBmaWxlLCBbbGluZUNoYW5nZV1cbiAgICBcbiAgICAgICAgZWRpdG9yLm9uICdjaGFuZ2VkJyAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2VJbmZvLmZvcmVpZ25cbiAgICAgICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnIGVkaXRvci5jdXJyZW50RmlsZSwgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICAgICAgbmF2aWdhdGUuYWRkRmlsZVBvcyBmaWxlOiBlZGl0b3IuY3VycmVudEZpbGUsIHBvczogZWRpdG9yLmN1cnNvclBvcygpXG4gICAgXG4gICAgICAgIHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmb250U2l6ZScgcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICAgICAgZWRpdG9yLnNldEZvbnRTaXplIHMgaWYgc1xuICAgIFxuICAgICAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0J1xuICAgICAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSAwXG4gICAgXG4gICAgICAgIHBvc3QuZW1pdCAncmVzdG9yZSdcbiAgICAgICAgZWRpdG9yLmZvY3VzKClcblxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9uTWVudUFjdGlvbjogKG5hbWUsIGFyZ3MpID0+XG4gICAgXG4gICAgICAgIGlmIGFjdGlvbiA9IEVkaXRvci5hY3Rpb25XaXRoTmFtZSBuYW1lXG4gICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XSBhcmdzLmFjdGFyZ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuaGFuZGxlTWVudUFjdGlvbiBuYW1lLCBhcmdzXG4gICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgc3dpdGNoIG5hbWVcbiAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgYXJncy5hY3RhcmdcbiAgICAgICAgICAgIHdoZW4gJ1VuZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICAgICAgd2hlbiAnQ29weScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY29weSgpXG4gICAgICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgU2NoZW1lJyAgICAgICAgIHRoZW4gcmV0dXJuIHNjaGVtZS50b2dnbGUoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgICAgIHdoZW4gJ0luY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgLTFcbiAgICAgICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgICAgICB3aGVuICdPcGVuIFdpbmRvdyBMaXN0JyAgICAgIHRoZW4gcmV0dXJuIHRpdGxlYmFyLnNob3dMaXN0KClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEJhY2t3YXJkJyAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuYmFja3dhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ01heGltaXplIEVkaXRvcicgICAgICAgdGhlbiByZXR1cm4gc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgICAgICB0aGVuIHJldHVybiBhZGRUb1NoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgTmV4dCBUYWInICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBQcmV2aW91cyBUYWInIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgUmlnaHQnICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4uLi4nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3VGFiOiB0cnVlXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBXaW5kb3cuLi4nIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnU2F2ZScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFzIC4uLicgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGVBcydcbiAgICAgICAgICAgIHdoZW4gJ1JldmVydCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdyZWxvYWRGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnUmVsb2FkJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgVGFiIG9yIFdpbmRvdycgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlVGFiT3JXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBUYWJzJyAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VPdGhlclRhYnMnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnRnVsbHNjcmVlbicgICAgICAgICAgICB0aGVuIHJldHVybiB3aW4uc2V0RnVsbFNjcmVlbiAhd2luLmlzRnVsbFNjcmVlbigpXG4gICAgICAgICAgICB3aGVuICdDbGVhciBMaXN0JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycgW3ByZWZzLnN0b3JlLmZpbGVdLCBuZXdUYWI6dHJ1ZVxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgICAgICB0aGVuIGFyZ3MgPSB3aW5JRFxuICAgIFxuICAgICAgICAjIGxvZyBcInVuaGFuZGxlZCBtZW51IGFjdGlvbiEgcG9zdGluZyB0byBtYWluICcje25hbWV9JyBhcmdzOlwiLCBhcmdzXG4gICAgXG4gICAgICAgIHN1cGVyIG5hbWUsIGFyZ3NcbiAgICBcbndpbiAgID0gd2luZG93LndpbiAgID0gcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKVxud2luSUQgPSB3aW5kb3cud2luSUQgPSB3aW4uaWRcbiAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOid8J1xud2luZG93LnByZWZzID0gcHJlZnNcbndpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je3dpbklEfVwiIHNlcGFyYXRvcjonfCdcblxucG9zdC5zZXRNYXhMaXN0ZW5lcnMgMjBcblxuc2F2ZVN0YXNoID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc3Rhc2gnXG4gICAgZWRpdG9yLnNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9ucygpXG4gICAgd2luZG93LnN0YXNoLnNhdmUoKVxuICAgIHBvc3QudG9NYWluICdzdGFzaFNhdmVkJ1xuXG5yZXN0b3JlV2luID0gLT5cblxuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luLnNldEJvdW5kcyBib3VuZHNcblxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2RldlRvb2xzJ1xuICAgICAgICB3aW4ud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uICdzaW5nbGVDdXJzb3JBdFBvcycgKHBvcywgb3B0KSAtPiAjIGJyb3dzZXIgZG91YmxlIGNsaWNrIGFuZCBuZXdUYWJXaXRoRmlsZSA6bDpjXG4gICAgZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIHBvcywgb3B0IFxuICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxucG9zdC5vbiAnZm9jdXNFZGl0b3InICAtPiBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xucG9zdC5vbiAnY2xvbmVGaWxlJyAgICAtPiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxucG9zdC5vbiAnY2xvc2VXaW5kb3cnICAtPiB3aW5kb3cud2luLmNsb3NlKClcbnBvc3Qub24gJ3NhdmVTdGFzaCcgICAgLT4gc2F2ZVN0YXNoKClcbnBvc3Qub24gJ2VkaXRvckZvY3VzJyAoZWRpdG9yKSAtPlxuICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgZWRpdG9yLm5hbWVcbiAgICB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICB3aW5kb3cudGV4dEVkaXRvciA9IGVkaXRvciBpZiBlZGl0b3IubmFtZSAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG4jIHRlc3RpbmcgcmVsYXRlZCAuLi5cblxucG9zdC5vbiAnbWFpbmxvZycgLT4ga2xvZy5hcHBseSBrbG9nLCBhcmd1bWVudHNcblxucG9zdC5vbiAncGluZycgKHdJRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3SUQsICdwb25nJyB3aW5JRCwgYXJnQSwgYXJnQlxucG9zdC5vbiAncG9zdEVkaXRvclN0YXRlJyAtPlxuICAgIHBvc3QudG9BbGwgJ2VkaXRvclN0YXRlJyB3aW5JRCxcbiAgICAgICAgbGluZXM6ICAgICAgZWRpdG9yLmxpbmVzKClcbiAgICAgICAgY3Vyc29yczogICAgZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICBtYWluOiAgICAgICBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHNlbGVjdGlvbnM6IGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgaGlnaGxpZ2h0czogZWRpdG9yLmhpZ2hsaWdodHMoKVxuXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxud2luZG93LmVkaXRvcldpdGhOYW1lID0gKG4pIC0+XG5cbiAgICBzd2l0Y2ggblxuICAgICAgICB3aGVuICdlZGl0b3InICAgdGhlbiBlZGl0b3JcbiAgICAgICAgd2hlbiAnY29tbWFuZCcgJ2NvbW1hbmRsaW5lJyB0aGVuIGNvbW1hbmRsaW5lXG4gICAgICAgIHdoZW4gJ3Rlcm1pbmFsJyB0aGVuIHRlcm1pbmFsXG4gICAgICAgIGVsc2UgZWRpdG9yXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbk1vdmUgID0gLT4gd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW4uZ2V0Qm91bmRzKClcblxuY2xlYXJMaXN0ZW5lcnMgPSAtPlxuXG4gICAgd2luLnJlbW92ZUxpc3RlbmVyICdjbG9zZScgb25DbG9zZVxuICAgIHdpbi5yZW1vdmVMaXN0ZW5lciAnbW92ZScgIG9uTW92ZVxuICAgIHdpbi53ZWJDb250ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMgJ2RldnRvb2xzLW9wZW5lZCdcbiAgICB3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1jbG9zZWQnXG5cbm9uQ2xvc2UgPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzYXZlQ2hhbmdlcydcbiAgICBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgICMgZWRpdG9yLnN0b3BXYXRjaGVyKClcblxuICAgIGlmIEJyb3dzZXIuZ2V0QWxsV2luZG93cygpLmxlbmd0aCA+IDFcbiAgICAgICAgd2luZG93LnN0YXNoLmNsZWFyKClcblxuICAgIGNsZWFyTGlzdGVuZXJzKClcblxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbmRvdy5vbmxvYWQgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgaW5mby5yZWxvYWQoKVxuICAgIHdpbi5vbiAnY2xvc2UnIG9uQ2xvc2VcbiAgICB3aW4ub24gJ21vdmUnICBvbk1vdmVcbiAgICB3aW4ud2ViQ29udGVudHMub24gJ2RldnRvb2xzLW9wZW5lZCcgLT4gd2luZG93LnN0YXNoLnNldCAnZGV2VG9vbHMnIHRydWVcbiAgICB3aW4ud2ViQ29udGVudHMub24gJ2RldnRvb2xzLWNsb3NlZCcgLT4gd2luZG93LnN0YXNoLnNldCAnZGV2VG9vbHMnXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxucmVsb2FkV2luID0gLT5cblxuICAgIHNhdmVTdGFzaCgpXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuICAgICMgZWRpdG9yLnN0b3BXYXRjaGVyKClcbiAgICBwb3N0LnRvTWFpbiAncmVsb2FkV2luJyB3aW5JRDp3aW4uaWQsIGZpbGU6ZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbndpbmRvdy5vbnJlc2l6ZSA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICB3aW5kb3cuc3Rhc2guc2V0ICdib3VuZHMnIHdpbi5nZXRCb3VuZHMoKVxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUsIDIwMFxuXG5wb3N0Lm9uICdzcGxpdCcgKHMpIC0+XG5cbiAgICBmaWxlYnJvd3Nlci5yZXNpemVkKClcbiAgICB0ZXJtaW5hbC5yZXNpemVkKClcbiAgICBjb21tYW5kbGluZS5yZXNpemVkKClcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG50b2dnbGVDZW50ZXJUZXh0ID0gLT5cblxuICAgIGlmIHdpbmRvdy5zdGF0ZS5nZXQgXCJpbnZpc2libGVzfCN7ZWRpdG9yLmN1cnJlbnRGaWxlfVwiLCBmYWxzZVxuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG4gICAgICAgIHJlc3RvcmVJbnZpc2libGVzID0gdHJ1ZVxuXG4gICAgaWYgbm90IHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIHRydWVcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZVxuICAgIGVsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgZmFsc2VcblxuICAgIGlmIHJlc3RvcmVJbnZpc2libGVzXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG5zZXRGb250U2l6ZSA9IChzKSAtPlxuXG4gICAgcyA9IHByZWZzLmdldCgnZWRpdG9yRm9udFNpemUnIDE5KSBpZiBub3QgXy5pc0Zpbml0ZSBzXG4gICAgcyA9IGNsYW1wIDggMTAwIHNcblxuICAgIHdpbmRvdy5zdGFzaC5zZXQgXCJmb250U2l6ZVwiIHNcbiAgICBlZGl0b3Iuc2V0Rm9udFNpemUgc1xuICAgIGlmIGVkaXRvci5jdXJyZW50RmlsZT9cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuXG5jaGFuZ2VGb250U2l6ZSA9IChkKSAtPlxuXG4gICAgaWYgICAgICBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAzMFxuICAgICAgICBmID0gNFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gNTBcbiAgICAgICAgZiA9IDEwXG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAyMFxuICAgICAgICBmID0gMlxuICAgIGVsc2VcbiAgICAgICAgZiA9IDFcbiAgICBzZXRGb250U2l6ZSBlZGl0b3Iuc2l6ZS5mb250U2l6ZSArIGYqZFxuXG5yZXNldEZvbnRTaXplID0gLT5cblxuICAgIGRlZmF1bHRGb250U2l6ZSA9IHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgd2luZG93LnN0YXNoLnNldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuICAgIHNldEZvbnRTaXplIGRlZmF1bHRGb250U2l6ZVxuXG5hZGRUb1NoZWxmID0gLT5cblxuICAgIGZpbGVCcm93c2VyID0gd2luZG93LmZpbGVicm93c2VyXG4gICAgcmV0dXJuIGlmIHdpbmRvdy5sYXN0Rm9jdXMgPT0gJ3NoZWxmJ1xuICAgIGlmIHdpbmRvdy5sYXN0Rm9jdXMuc3RhcnRzV2l0aCBmaWxlQnJvd3Nlci5uYW1lXG4gICAgICAgIHBhdGggPSBmaWxlQnJvd3Nlci5jb2x1bW5XaXRoTmFtZSh3aW5kb3cubGFzdEZvY3VzKS5hY3RpdmVQYXRoKClcbiAgICBlbHNlXG4gICAgICAgIHBhdGggPSBlZGl0b3IuY3VycmVudEZpbGVcbiAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhcblxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jICAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgICAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxucmVzZXRab29tOiAtPlxuXG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciAxXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG5jaGFuZ2Vab29tOiAoZCkgLT5cbiAgICBcbiAgICB6ID0gd2ViZnJhbWUuZ2V0Wm9vbUZhY3RvcigpXG4gICAgeiAqPSAxK2QvMjBcbiAgICB6ID0gY2xhbXAgMC4zNiA1LjIzIHpcbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIHpcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG53aW5kb3cub25ibHVyICA9IChldmVudCkgLT4gcG9zdC5lbWl0ICd3aW5Gb2N1cycgZmFsc2VcbndpbmRvdy5vbmZvY3VzID0gKGV2ZW50KSAtPlxuICAgIHBvc3QuZW1pdCAnd2luRm9jdXMnIHRydWVcbiAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSA9PSAnYm9keSdcbiAgICAgICAgaWYgc3BsaXQuZWRpdG9yVmlzaWJsZSgpXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG53aW5kb3cuc2V0TGFzdEZvY3VzID0gKG5hbWUpIC0+XG4gICAgd2luZG93Lmxhc3RGb2N1cyA9IG5hbWVcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbm9uQ29tYm8gPSAoY29tYm8sIGluZm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IGNvbWJvXG5cbiAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgfSA9IGluZm9cblxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB0aXRsZWJhci5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgIGZvciBpIGluIFsxLi45XVxuICAgICAgICBpZiBjb21ibyBpcyBcImFsdCsje2l9XCJcbiAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHBvc3QudG9NYWluICdhY3RpdmF0ZVdpbmRvdycgaVxuXG4gICAgc3dpdGNoIGNvbWJvXG4gICAgICAgIHdoZW4gJ2YzJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzY3JlZW5TaG90KClcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCs9JyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tICsxXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrLScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSAtMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0KzAnICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHJlc2V0Wm9vbSgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3knICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzcGxpdC5kbyAnbWluaW1pemUgZWRpdG9yJ1xuXG5wb3N0Lm9uICdjb21ibycgb25Db21ib1xuXG5uZXcgV2luZG93XG4iXX0=
//# sourceURL=../../coffee/win/window.coffee
// koffee 1.14.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var CWD, Commandline, Editor, FPS, FileEditor, FileHandler, FileWatcher, Info, Navigate, Split, Tabs, Terminal, Titlebar, Window, _, addToShelf, args, changeFontSize, clamp, clearListeners, commandline, editor, electron, filehandler, filewatcher, klog, mainmenu, onClose, onCombo, onMove, pkg, post, prefs, projects, ref, reloadWin, resetFontSize, restoreWin, saveStash, scheme, setFontSize, stash, stopEvent, store, tabs, terminal, titlebar, toggleCenterText, win,
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
        window.stash = new stash("win/" + this.id, {
            separator: '|'
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
        klog('ko.window.onMenuAction', name, args);
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
            case 'Close Tab or Window':
                return post.emit('closeTabOrWindow');
            case 'Close Other Tabs':
                return post.emit('closeOtherTabs');
            case 'Close Other Windows':
                return post.toOtherWins('closeWindow');
            case 'Clear List':
                window.state.set('recentFiles', []);
                window.titlebar.refreshMenu();
                return;
            case 'Preferences':
                return post.emit('openFiles', [prefs.store.file], {
                    newTab: true
                });
            case 'Cycle Windows':
                args = this.id;
        }
        return Window.__super__.onMenuAction.call(this, name, args);
    };

    return Window;

})(win);

window.state = new store('state', {
    separator: '|'
});

window.prefs = prefs;

post.setMaxListeners(20);

saveStash = function() {
    post.emit('stash');
    editor.saveScrollCursorsAndSelections();
    window.stash.save();
    return post.toMain('stashSaved');
};

restoreWin = function() {
    var bounds;
    klog('ko.window.restoreWin');
    if (bounds = window.stash.get('bounds')) {
        window.win.setBounds(bounds);
    }
    if (window.stash.get('devTools')) {
        return post.emit('menuAction', 'devtools');
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
    return post.emit('menuAction', 'Close');
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

post.on('devTools', function(open) {
    return klog("ko.window.post.on devTools " + open);
});

post.on('mainlog', function() {
    return klog.apply(klog, arguments);
});

post.on('ping', function(wID, argA, argB) {
    return post.toWin(wID, 'pong', window.winID, argA, argB);
});

post.on('postEditorState', function() {
    return post.toAll('editorState', window.winID, {
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
    klog('ko.window.onMove');
    return window.stash.set('bounds', window.win.getBounds());
};

clearListeners = function() {};

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
    return info.reload();
};

reloadWin = function() {
    saveStash();
    clearListeners();
    return post.toMain('reloadWin', {
        winID: window.winID,
        file: editor.currentFile
    });
};

window.onresize = function() {
    split.resized();
    window.stash.set('bounds', window.win.getBounds());
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNGNBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2Qs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LG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUksQ0FBQyxNQUFMLENBQVksZ0JBQVosRUFBNkIsQ0FBN0IsQ0FBakIsRUFEWDs7QUFESjtBQUlBLFlBQU8sS0FBUDtBQUFBLGFBQ1MsSUFEVDtBQUNtQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixVQUFBLENBQUEsQ0FBakI7QUFEMUMsYUFFUyxpQkFGVDtBQUVtQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsQ0FBYixDQUFqQjtBQUYxQyxhQUdTLGlCQUhUO0FBR21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBSDFDLGFBSVMsaUJBSlQ7QUFJbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFqQjtBQUoxQyxhQUtTLGVBTFQ7QUFLbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsS0FBSyxFQUFDLEVBQUQsRUFBTCxDQUFTLGlCQUFULENBQWpCO0FBTDFDO0FBYk07O0FBb0JWLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFnQixPQUFoQjs7QUFFQSxJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBfLCBhcmdzLCBjbGFtcCwga2xvZywgcG9zdCwgcHJlZnMsIHNjaGVtZSwgc3Rhc2gsIHN0b3BFdmVudCwgc3RvcmUsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TcGxpdCAgICAgICA9IHJlcXVpcmUgJy4vc3BsaXQnXG5UZXJtaW5hbCAgICA9IHJlcXVpcmUgJy4vdGVybWluYWwnXG5UYWJzICAgICAgICA9IHJlcXVpcmUgJy4vdGFicydcblRpdGxlYmFyICAgID0gcmVxdWlyZSAnLi90aXRsZWJhcidcbkluZm8gICAgICAgID0gcmVxdWlyZSAnLi9pbmZvJ1xuRmlsZUhhbmRsZXIgPSByZXF1aXJlICcuL2ZpbGVoYW5kbGVyJ1xuRmlsZVdhdGNoZXIgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuRWRpdG9yICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvZWRpdG9yJ1xuQ29tbWFuZGxpbmUgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kbGluZSdcbkZpbGVFZGl0b3IgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2ZpbGVlZGl0b3InXG5OYXZpZ2F0ZSAgICA9IHJlcXVpcmUgJy4uL21haW4vbmF2aWdhdGUnXG5GUFMgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZwcydcbkNXRCAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvY3dkJ1xuc2NoZW1lICAgICAgPSByZXF1aXJlICcuLi90b29scy9zY2hlbWUnXG5wcm9qZWN0cyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuZWxlY3Ryb24gICAgPSByZXF1aXJlICdlbGVjdHJvbidcbnBrZyAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuXG5lZGl0b3IgICAgICA9IG51bGxcbm1haW5tZW51ICAgID0gbnVsbFxudGVybWluYWwgICAgPSBudWxsXG5jb21tYW5kbGluZSA9IG51bGxcbnRpdGxlYmFyICAgID0gbnVsbFxudGFicyAgICAgICAgPSBudWxsXG5maWxlaGFuZGxlciA9IG51bGxcbmZpbGV3YXRjaGVyID0gbnVsbFxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuY2xhc3MgV2luZG93IGV4dGVuZHMgd2luXG4gICAgXG4gICAgQDogLT5cblxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgbWVudVRlbXBsYXRlOiAgIHJlcXVpcmUgJy4vbWVudSdcbiAgICAgICAgICAgIHBrZzogICAgICAgICAgICByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBtZW51OiAgICAgICAgICAgJy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgICAgICAgICBpY29uOiAgICAgICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIHNjaGVtZTogICAgICAgICBmYWxzZVxuICAgIFxuICAgICAgICB3aW5kb3cuc3Rhc2ggPSBuZXcgc3Rhc2ggXCJ3aW4vI3tAaWR9XCIgc2VwYXJhdG9yOid8J1xuICAgICAgICAgICAgXG4gICAgICAgIGZpbGVoYW5kbGVyID0gd2luZG93LmZpbGVoYW5kbGVyID0gbmV3IEZpbGVIYW5kbGVyXG4gICAgICAgIGZpbGV3YXRjaGVyID0gd2luZG93LmZpbGV3YXRjaGVyID0gbmV3IEZpbGVXYXRjaGVyXG4gICAgICAgIHRhYnMgICAgICAgID0gd2luZG93LnRhYnMgICAgICAgID0gbmV3IFRhYnMgd2luZG93LnRpdGxlYmFyLmVsZW1cbiAgICAgICAgdGl0bGViYXIgICAgPSAgICAgICAgICAgICAgICAgICAgICBuZXcgVGl0bGViYXJcbiAgICAgICAgbmF2aWdhdGUgICAgPSB3aW5kb3cubmF2aWdhdGUgICAgPSBuZXcgTmF2aWdhdGUoKVxuICAgICAgICBzcGxpdCAgICAgICA9IHdpbmRvdy5zcGxpdCAgICAgICA9IG5ldyBTcGxpdCgpXG4gICAgICAgIHRlcm1pbmFsICAgID0gd2luZG93LnRlcm1pbmFsICAgID0gbmV3IFRlcm1pbmFsICd0ZXJtaW5hbCdcbiAgICAgICAgZWRpdG9yICAgICAgPSB3aW5kb3cuZWRpdG9yICAgICAgPSBuZXcgRmlsZUVkaXRvciAnZWRpdG9yJ1xuICAgICAgICBjb21tYW5kbGluZSA9IHdpbmRvdy5jb21tYW5kbGluZSA9IG5ldyBDb21tYW5kbGluZSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICBpbmZvICAgICAgICA9IHdpbmRvdy5pbmZvICAgICAgICA9IG5ldyBJbmZvIGVkaXRvclxuICAgICAgICBmcHMgICAgICAgICA9IHdpbmRvdy5mcHMgICAgICAgICA9IG5ldyBGUFMoKVxuICAgICAgICBjd2QgICAgICAgICA9IHdpbmRvdy5jd2QgICAgICAgICA9IG5ldyBDV0QoKVxuICAgIFxuICAgICAgICB3aW5kb3cudGV4dEVkaXRvciA9IHdpbmRvdy5mb2N1c0VkaXRvciA9IGVkaXRvclxuICAgICAgICB3aW5kb3cubGFzdEZvY3VzID0gZWRpdG9yLm5hbWVcbiAgICBcbiAgICAgICAgcmVzdG9yZVdpbigpXG4gICAgICAgIHNjaGVtZS5zZXQgcHJlZnMuZ2V0ICdzY2hlbWUnICdkYXJrJ1xuICAgIFxuICAgICAgICB0ZXJtaW5hbC5vbiAnZmlsZVNlYXJjaFJlc3VsdENoYW5nZScgKGZpbGUsIGxpbmVDaGFuZ2UpIC0+ICMgc2VuZHMgY2hhbmdlcyB0byBhbGwgd2luZG93c1xuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycgZmlsZSwgW2xpbmVDaGFuZ2VdXG4gICAgXG4gICAgICAgIGVkaXRvci5vbiAnY2hhbmdlZCcgKGNoYW5nZUluZm8pIC0+XG4gICAgICAgICAgICByZXR1cm4gaWYgY2hhbmdlSW5mby5mb3JlaWduXG4gICAgICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcG9zdC50b090aGVyV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBlZGl0b3IuY3VycmVudEZpbGUsIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgICAgIG5hdmlnYXRlLmFkZEZpbGVQb3MgZmlsZTogZWRpdG9yLmN1cnJlbnRGaWxlLCBwb3M6IGVkaXRvci5jdXJzb3JQb3MoKVxuICAgIFxuICAgICAgICBzID0gd2luZG93LnN0YXNoLmdldCAnZm9udFNpemUnIHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgICAgIGVkaXRvci5zZXRGb250U2l6ZSBzIGlmIHNcbiAgICBcbiAgICAgICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCdcbiAgICAgICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUgMFxuICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ3Jlc3RvcmUnXG4gICAgICAgIGVkaXRvci5mb2N1cygpXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChuYW1lLCBhcmdzKSA9PlxuICAgIFxuICAgICAgICBrbG9nICdrby53aW5kb3cub25NZW51QWN0aW9uJyBuYW1lLCBhcmdzXG4gICAgICAgIFxuICAgICAgICBpZiBhY3Rpb24gPSBFZGl0b3IuYWN0aW9uV2l0aE5hbWUgbmFtZVxuICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV0gYXJncy5hY3RhcmdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmhhbmRsZU1lbnVBY3Rpb24gbmFtZSwgYXJnc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIHN3aXRjaCBuYW1lXG4gICAgXG4gICAgICAgICAgICB3aGVuICdkb01hY3JvJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5tYWNyby5leGVjdXRlIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICB3aGVuICdVbmRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby51bmRvKClcbiAgICAgICAgICAgIHdoZW4gJ1JlZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnJlZG8oKVxuICAgICAgICAgICAgd2hlbiAnQ3V0JyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY3V0KClcbiAgICAgICAgICAgIHdoZW4gJ0NvcHknICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmNvcHkoKVxuICAgICAgICAgICAgd2hlbiAnUGFzdGUnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IucGFzdGUoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFRhYicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ25ld0VtcHR5VGFiJ1xuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBDZW50ZXIgVGV4dCcgICAgdGhlbiByZXR1cm4gdG9nZ2xlQ2VudGVyVGV4dCgpXG4gICAgICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplICsxXG4gICAgICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgICAgICB3aGVuICdSZXNldCcgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBXaW5kb3cgTGlzdCcgICAgICB0aGVuIHJldHVybiB0aXRsZWJhci5zaG93TGlzdCgpXG4gICAgICAgICAgICB3aGVuICdOYXZpZ2F0ZSBCYWNrd2FyZCcgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmJhY2t3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEZvcndhcmQnICAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuZm9yd2FyZCgpXG4gICAgICAgICAgICB3aGVuICdNYXhpbWl6ZSBFZGl0b3InICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgSGlzdG9yeScgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5maWxlYnJvd3Nlci5zaGVsZi50b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgIHdoZW4gJ0FjdGl2YXRlIE5leHQgVGFiJyAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgUHJldmlvdXMgVGFiJyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIExlZnQnICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIFJpZ2h0JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdPcGVuLi4uJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBUYWIuLi4nICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1RhYjogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgV2luZG93Li4uJyB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJyBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUgQWxsJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlQWxsJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBcyAuLi4nICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlQXMnXG4gICAgICAgICAgICB3aGVuICdSZXZlcnQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAncmVsb2FkRmlsZSdcbiAgICAgICAgICAgICMgd2hlbiAnUmVsb2FkJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgVGFiIG9yIFdpbmRvdycgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlVGFiT3JXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBUYWJzJyAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VPdGhlclRhYnMnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnQ2xlYXIgTGlzdCcgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aW5kb3cuc3RhdGUuc2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICAgICAgICAgICAgICB3aW5kb3cudGl0bGViYXIucmVmcmVzaE1lbnUoKVxuICAgICAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgIHdoZW4gJ1ByZWZlcmVuY2VzJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZXMnIFtwcmVmcy5zdG9yZS5maWxlXSwgbmV3VGFiOnRydWVcbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgICAgICAgdGhlbiBhcmdzID0gQGlkXG4gICAgXG4gICAgICAgICMgbG9nIFwidW5oYW5kbGVkIG1lbnUgYWN0aW9uISBwb3N0aW5nIHRvIG1haW4gJyN7bmFtZX0nIGFyZ3M6XCIsIGFyZ3NcbiAgICBcbiAgICAgICAgc3VwZXIgbmFtZSwgYXJnc1xuICAgICAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOid8J1xud2luZG93LnByZWZzID0gcHJlZnNcblxucG9zdC5zZXRNYXhMaXN0ZW5lcnMgMjBcblxuc2F2ZVN0YXNoID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc3Rhc2gnXG4gICAgZWRpdG9yLnNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9ucygpXG4gICAgd2luZG93LnN0YXNoLnNhdmUoKVxuICAgIHBvc3QudG9NYWluICdzdGFzaFNhdmVkJ1xuXG5yZXN0b3JlV2luID0gLT5cblxuICAgIGtsb2cgJ2tvLndpbmRvdy5yZXN0b3JlV2luJ1xuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luZG93Lndpbi5zZXRCb3VuZHMgYm91bmRzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdkZXZUb29scydcbiAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnZGV2dG9vbHMnXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbiAnc2luZ2xlQ3Vyc29yQXRQb3MnIChwb3MsIG9wdCkgLT4gIyBicm93c2VyIGRvdWJsZSBjbGljayBhbmQgbmV3VGFiV2l0aEZpbGUgOmw6Y1xuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdCBcbiAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbnBvc3Qub24gJ2ZvY3VzRWRpdG9yJyAgLT4gc3BsaXQuZm9jdXMgJ2VkaXRvcidcbnBvc3Qub24gJ2Nsb25lRmlsZScgICAgLT4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnQ2xvc2UnXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxucG9zdC5vbiAnZGV2VG9vbHMnIChvcGVuKSAtPiBcbiAgICBrbG9nIFwia28ud2luZG93LnBvc3Qub24gZGV2VG9vbHMgI3tvcGVufVwiXG5cbnBvc3Qub24gJ21haW5sb2cnIC0+IGtsb2cuYXBwbHkga2xvZywgYXJndW1lbnRzXG5cbnBvc3Qub24gJ3BpbmcnICh3SUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd0lELCAncG9uZycgd2luZG93LndpbklELCBhcmdBLCBhcmdCXG5wb3N0Lm9uICdwb3N0RWRpdG9yU3RhdGUnIC0+XG4gICAgcG9zdC50b0FsbCAnZWRpdG9yU3RhdGUnIHdpbmRvdy53aW5JRCxcbiAgICAgICAgbGluZXM6ICAgICAgZWRpdG9yLmxpbmVzKClcbiAgICAgICAgY3Vyc29yczogICAgZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICBtYWluOiAgICAgICBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHNlbGVjdGlvbnM6IGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgaGlnaGxpZ2h0czogZWRpdG9yLmhpZ2hsaWdodHMoKVxuXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxud2luZG93LmVkaXRvcldpdGhOYW1lID0gKG4pIC0+XG5cbiAgICBzd2l0Y2ggblxuICAgICAgICB3aGVuICdlZGl0b3InICAgdGhlbiBlZGl0b3JcbiAgICAgICAgd2hlbiAnY29tbWFuZCcgJ2NvbW1hbmRsaW5lJyB0aGVuIGNvbW1hbmRsaW5lXG4gICAgICAgIHdoZW4gJ3Rlcm1pbmFsJyB0aGVuIHRlcm1pbmFsXG4gICAgICAgIGVsc2UgZWRpdG9yXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbk1vdmUgPSAtPiBcblxuICAgIGtsb2cgJ2tvLndpbmRvdy5vbk1vdmUnXG4gICAgd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW5kb3cud2luLmdldEJvdW5kcygpXG5cbmNsZWFyTGlzdGVuZXJzID0gLT5cblxuICAgICN3aW4ucmVtb3ZlTGlzdGVuZXIgJ2Nsb3NlJyBvbkNsb3NlXG4gICAgI3dpbi5yZW1vdmVMaXN0ZW5lciAnbW92ZScgIG9uTW92ZVxuICAgICN3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1vcGVuZWQnXG4gICAgI3dpbi53ZWJDb250ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMgJ2RldnRvb2xzLWNsb3NlZCdcblxub25DbG9zZSA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3NhdmVDaGFuZ2VzJ1xuICAgIGVkaXRvci5zZXRUZXh0ICcnXG4gICAgIyBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuXG4gICAgaWYgQnJvd3Nlci5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID4gMVxuICAgICAgICB3aW5kb3cuc3Rhc2guY2xlYXIoKVxuXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICBpbmZvLnJlbG9hZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxucmVsb2FkV2luID0gLT5cblxuICAgIHNhdmVTdGFzaCgpXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuICAgIHBvc3QudG9NYWluICdyZWxvYWRXaW4nIHdpbklEOndpbmRvdy53aW5JRCwgZmlsZTplZGl0b3IuY3VycmVudEZpbGVcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxud2luZG93Lm9ucmVzaXplID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycgd2luZG93Lndpbi5nZXRCb3VuZHMoKVxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUsIDIwMFxuXG5wb3N0Lm9uICdzcGxpdCcgKHMpIC0+XG5cbiAgICBmaWxlYnJvd3Nlci5yZXNpemVkKClcbiAgICB0ZXJtaW5hbC5yZXNpemVkKClcbiAgICBjb21tYW5kbGluZS5yZXNpemVkKClcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG50b2dnbGVDZW50ZXJUZXh0ID0gLT5cblxuICAgIGlmIHdpbmRvdy5zdGF0ZS5nZXQgXCJpbnZpc2libGVzfCN7ZWRpdG9yLmN1cnJlbnRGaWxlfVwiIGZhbHNlXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcbiAgICAgICAgcmVzdG9yZUludmlzaWJsZXMgPSB0cnVlXG5cbiAgICBpZiBub3Qgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgdHJ1ZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlXG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCBmYWxzZVxuXG4gICAgaWYgcmVzdG9yZUludmlzaWJsZXNcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbnNldEZvbnRTaXplID0gKHMpIC0+XG5cbiAgICBzID0gcHJlZnMuZ2V0KCdlZGl0b3JGb250U2l6ZScgMTkpIGlmIG5vdCBfLmlzRmluaXRlIHNcbiAgICBzID0gY2xhbXAgOCAxMDAgc1xuXG4gICAgd2luZG93LnN0YXNoLnNldCBcImZvbnRTaXplXCIgc1xuICAgIGVkaXRvci5zZXRGb250U2l6ZSBzXG4gICAgaWYgZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBlZGl0b3IuY3VycmVudEZpbGUsIHJlbG9hZDp0cnVlXG5cbmNoYW5nZUZvbnRTaXplID0gKGQpIC0+XG5cbiAgICBpZiAgICAgIGVkaXRvci5zaXplLmZvbnRTaXplID49IDMwXG4gICAgICAgIGYgPSA0XG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSA1MFxuICAgICAgICBmID0gMTBcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDIwXG4gICAgICAgIGYgPSAyXG4gICAgZWxzZVxuICAgICAgICBmID0gMVxuICAgIHNldEZvbnRTaXplIGVkaXRvci5zaXplLmZvbnRTaXplICsgZipkXG5cbnJlc2V0Rm9udFNpemUgPSAtPlxuXG4gICAgZGVmYXVsdEZvbnRTaXplID0gcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICB3aW5kb3cuc3Rhc2guc2V0ICdmb250U2l6ZScgZGVmYXVsdEZvbnRTaXplXG4gICAgc2V0Rm9udFNpemUgZGVmYXVsdEZvbnRTaXplXG5cbmFkZFRvU2hlbGYgPSAtPlxuXG4gICAgZmlsZUJyb3dzZXIgPSB3aW5kb3cuZmlsZWJyb3dzZXJcbiAgICByZXR1cm4gaWYgd2luZG93Lmxhc3RGb2N1cyA9PSAnc2hlbGYnXG4gICAgaWYgd2luZG93Lmxhc3RGb2N1cy5zdGFydHNXaXRoIGZpbGVCcm93c2VyLm5hbWVcbiAgICAgICAgcGF0aCA9IGZpbGVCcm93c2VyLmNvbHVtbldpdGhOYW1lKHdpbmRvdy5sYXN0Rm9jdXMpLmFjdGl2ZVBhdGgoKVxuICAgIGVsc2VcbiAgICAgICAgcGF0aCA9IGVkaXRvci5jdXJyZW50RmlsZVxuICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFxuXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMgICAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgIDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5yZXNldFpvb206IC0+XG5cbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIDFcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbmNoYW5nZVpvb206IChkKSAtPlxuICAgIFxuICAgIHogPSB3ZWJmcmFtZS5nZXRab29tRmFjdG9yKClcbiAgICB6ICo9IDErZC8yMFxuICAgIHogPSBjbGFtcCAwLjM2IDUuMjMgelxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgelxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbndpbmRvdy5vbmJsdXIgID0gKGV2ZW50KSAtPiBwb3N0LmVtaXQgJ3dpbkZvY3VzJyBmYWxzZVxud2luZG93Lm9uZm9jdXMgPSAoZXZlbnQpIC0+XG4gICAgcG9zdC5lbWl0ICd3aW5Gb2N1cycgdHJ1ZVxuICAgIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xhc3NOYW1lID09ICdib2R5J1xuICAgICAgICBpZiBzcGxpdC5lZGl0b3JWaXNpYmxlKClcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdlZGl0b3InXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG5cbndpbmRvdy5zZXRMYXN0Rm9jdXMgPSAobmFtZSkgLT4gd2luZG93Lmxhc3RGb2N1cyA9IG5hbWVcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbm9uQ29tYm8gPSAoY29tYm8sIGluZm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IGNvbWJvXG5cbiAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgfSA9IGluZm9cblxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB0aXRsZWJhci5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgIGZvciBpIGluIFsxLi45XVxuICAgICAgICBpZiBjb21ibyBpcyBcImFsdCsje2l9XCJcbiAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHBvc3QudG9NYWluICdhY3RpdmF0ZVdpbmRvdycgaVxuXG4gICAgc3dpdGNoIGNvbWJvXG4gICAgICAgIHdoZW4gJ2YzJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzY3JlZW5TaG90KClcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCs9JyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tICsxXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrLScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSAtMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0KzAnICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHJlc2V0Wm9vbSgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3knICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzcGxpdC5kbyAnbWluaW1pemUgZWRpdG9yJ1xuXG5wb3N0Lm9uICdjb21ibycgb25Db21ib1xuXG5uZXcgV2luZG93XG4iXX0=
//# sourceURL=../../coffee/win/window.coffee
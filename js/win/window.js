// koffee 1.14.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var CWD, Commandline, Editor, FPS, FileEditor, FileHandler, FileWatcher, Info, Navigate, Split, Tabs, Terminal, Titlebar, Window, _, addToShelf, args, changeFontSize, clamp, commandline, editor, electron, filehandler, filewatcher, klog, mainmenu, onClose, onCombo, pkg, post, prefs, projects, ref, reloadWin, resetFontSize, restoreWin, saveStash, scheme, setFontSize, stash, stopEvent, store, tabs, terminal, titlebar, toggleCenterText, win,
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
        this.onMoved = bind(this.onMoved, this);
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
        window.setLastFocus(editor.name);
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

    Window.prototype.onMoved = function(bounds) {
        return window.stash.set('bounds', bounds);
    };

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
    klog('window.saveStash');
    post.emit('stash');
    editor.saveScrollCursorsAndSelections();
    return window.stash.save();
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

onClose = function() {
    post.emit('saveChanges');
    editor.setText('');
    if (Browser.getAllWindows().length > 1) {
        return window.stash.clear();
    }
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
    window.win.onMoved(window.win.getBounds());
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
    var fb, path;
    if (window.lastFocus === 'shelf') {
        return;
    }
    fb = window.filebrowser;
    if (window.lastFocus.startsWith(fb.name)) {
        path = fb.columnWithName(window.lastFocus).activePath();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb2JBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2Qs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LENBQUEsQ0FBakI7QUFEMUMsYUFFUyxpQkFGVDtBQUVtQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsQ0FBYixDQUFqQjtBQUYxQyxhQUdTLGlCQUhUO0FBR21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBSDFDLGFBSVMsaUJBSlQ7QUFJbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFqQjtBQUoxQyxhQUtTLGVBTFQ7QUFLbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsS0FBSyxFQUFDLEVBQUQsRUFBTCxDQUFTLGlCQUFULENBQWpCO0FBTDFDO0FBYk07O0FBb0JWLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFnQixPQUFoQjs7QUFFQSxJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBfLCBhcmdzLCBjbGFtcCwga2xvZywgcG9zdCwgcHJlZnMsIHNjaGVtZSwgc3Rhc2gsIHN0b3BFdmVudCwgc3RvcmUsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TcGxpdCAgICAgICA9IHJlcXVpcmUgJy4vc3BsaXQnXG5UZXJtaW5hbCAgICA9IHJlcXVpcmUgJy4vdGVybWluYWwnXG5UYWJzICAgICAgICA9IHJlcXVpcmUgJy4vdGFicydcblRpdGxlYmFyICAgID0gcmVxdWlyZSAnLi90aXRsZWJhcidcbkluZm8gICAgICAgID0gcmVxdWlyZSAnLi9pbmZvJ1xuRmlsZUhhbmRsZXIgPSByZXF1aXJlICcuL2ZpbGVoYW5kbGVyJ1xuRmlsZVdhdGNoZXIgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuRWRpdG9yICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvZWRpdG9yJ1xuQ29tbWFuZGxpbmUgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kbGluZSdcbkZpbGVFZGl0b3IgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2ZpbGVlZGl0b3InXG5OYXZpZ2F0ZSAgICA9IHJlcXVpcmUgJy4uL21haW4vbmF2aWdhdGUnXG5GUFMgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZwcydcbkNXRCAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvY3dkJ1xuc2NoZW1lICAgICAgPSByZXF1aXJlICcuLi90b29scy9zY2hlbWUnXG5wcm9qZWN0cyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuZWxlY3Ryb24gICAgPSByZXF1aXJlICdlbGVjdHJvbidcbnBrZyAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuXG5lZGl0b3IgICAgICA9IG51bGxcbm1haW5tZW51ICAgID0gbnVsbFxudGVybWluYWwgICAgPSBudWxsXG5jb21tYW5kbGluZSA9IG51bGxcbnRpdGxlYmFyICAgID0gbnVsbFxudGFicyAgICAgICAgPSBudWxsXG5maWxlaGFuZGxlciA9IG51bGxcbmZpbGV3YXRjaGVyID0gbnVsbFxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuY2xhc3MgV2luZG93IGV4dGVuZHMgd2luXG4gICAgXG4gICAgQDogLT5cblxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgbWVudVRlbXBsYXRlOiAgIHJlcXVpcmUgJy4vbWVudSdcbiAgICAgICAgICAgIHBrZzogICAgICAgICAgICByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBtZW51OiAgICAgICAgICAgJy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgICAgICAgICBpY29uOiAgICAgICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIHNjaGVtZTogICAgICAgICBmYWxzZVxuICAgIFxuICAgICAgICB3aW5kb3cuc3Rhc2ggPSBuZXcgc3Rhc2ggXCJ3aW4vI3tAaWR9XCIgc2VwYXJhdG9yOid8J1xuICAgICAgICAgICAgXG4gICAgICAgIGZpbGVoYW5kbGVyID0gd2luZG93LmZpbGVoYW5kbGVyID0gbmV3IEZpbGVIYW5kbGVyXG4gICAgICAgIGZpbGV3YXRjaGVyID0gd2luZG93LmZpbGV3YXRjaGVyID0gbmV3IEZpbGVXYXRjaGVyXG4gICAgICAgIHRhYnMgICAgICAgID0gd2luZG93LnRhYnMgICAgICAgID0gbmV3IFRhYnMgd2luZG93LnRpdGxlYmFyLmVsZW1cbiAgICAgICAgdGl0bGViYXIgICAgPSAgICAgICAgICAgICAgICAgICAgICBuZXcgVGl0bGViYXJcbiAgICAgICAgbmF2aWdhdGUgICAgPSB3aW5kb3cubmF2aWdhdGUgICAgPSBuZXcgTmF2aWdhdGUoKVxuICAgICAgICBzcGxpdCAgICAgICA9IHdpbmRvdy5zcGxpdCAgICAgICA9IG5ldyBTcGxpdCgpXG4gICAgICAgIHRlcm1pbmFsICAgID0gd2luZG93LnRlcm1pbmFsICAgID0gbmV3IFRlcm1pbmFsICd0ZXJtaW5hbCdcbiAgICAgICAgZWRpdG9yICAgICAgPSB3aW5kb3cuZWRpdG9yICAgICAgPSBuZXcgRmlsZUVkaXRvciAnZWRpdG9yJ1xuICAgICAgICBjb21tYW5kbGluZSA9IHdpbmRvdy5jb21tYW5kbGluZSA9IG5ldyBDb21tYW5kbGluZSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICBpbmZvICAgICAgICA9IHdpbmRvdy5pbmZvICAgICAgICA9IG5ldyBJbmZvIGVkaXRvclxuICAgICAgICBmcHMgICAgICAgICA9IHdpbmRvdy5mcHMgICAgICAgICA9IG5ldyBGUFMoKVxuICAgICAgICBjd2QgICAgICAgICA9IHdpbmRvdy5jd2QgICAgICAgICA9IG5ldyBDV0QoKVxuICAgIFxuICAgICAgICB3aW5kb3cudGV4dEVkaXRvciA9IHdpbmRvdy5mb2N1c0VkaXRvciA9IGVkaXRvclxuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgXG4gICAgICAgIHJlc3RvcmVXaW4oKVxuICAgICAgICBzY2hlbWUuc2V0IHByZWZzLmdldCAnc2NoZW1lJyAnZGFyaydcbiAgICBcbiAgICAgICAgdGVybWluYWwub24gJ2ZpbGVTZWFyY2hSZXN1bHRDaGFuZ2UnIChmaWxlLCBsaW5lQ2hhbmdlKSAtPiAjIHNlbmRzIGNoYW5nZXMgdG8gYWxsIHdpbmRvd3NcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdmaWxlTGluZUNoYW5nZXMnIGZpbGUsIFtsaW5lQ2hhbmdlXVxuICAgIFxuICAgICAgICBlZGl0b3Iub24gJ2NoYW5nZWQnIChjaGFuZ2VJbmZvKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZUluZm8uZm9yZWlnblxuICAgICAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHBvc3QudG9PdGhlcldpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycgZWRpdG9yLmN1cnJlbnRGaWxlLCBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgICAgICBuYXZpZ2F0ZS5hZGRGaWxlUG9zIGZpbGU6IGVkaXRvci5jdXJyZW50RmlsZSwgcG9zOiBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICBcbiAgICAgICAgcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZvbnRTaXplJyBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgICAgICBlZGl0b3Iuc2V0Rm9udFNpemUgcyBpZiBzXG4gICAgXG4gICAgICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnXG4gICAgICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlIDBcbiAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdyZXN0b3JlJ1xuICAgICAgICBlZGl0b3IuZm9jdXMoKVxuXG4gICAgb25Nb3ZlZDogKGJvdW5kcykgPT4gd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyBib3VuZHNcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgXG4gICAgb25NZW51QWN0aW9uOiAobmFtZSwgYXJncykgPT5cbiAgICBcbiAgICAgICAgIyBrbG9nICdrby53aW5kb3cub25NZW51QWN0aW9uJyBuYW1lLCBhcmdzXG4gICAgICAgIFxuICAgICAgICBpZiBhY3Rpb24gPSBFZGl0b3IuYWN0aW9uV2l0aE5hbWUgbmFtZVxuICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV0gYXJncy5hY3RhcmdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmhhbmRsZU1lbnVBY3Rpb24gbmFtZSwgYXJnc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIHN3aXRjaCBuYW1lXG4gICAgXG4gICAgICAgICAgICB3aGVuICdkb01hY3JvJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5tYWNyby5leGVjdXRlIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICB3aGVuICdVbmRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby51bmRvKClcbiAgICAgICAgICAgIHdoZW4gJ1JlZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnJlZG8oKVxuICAgICAgICAgICAgd2hlbiAnQ3V0JyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY3V0KClcbiAgICAgICAgICAgIHdoZW4gJ0NvcHknICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmNvcHkoKVxuICAgICAgICAgICAgd2hlbiAnUGFzdGUnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IucGFzdGUoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFRhYicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ25ld0VtcHR5VGFiJ1xuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBDZW50ZXIgVGV4dCcgICAgdGhlbiByZXR1cm4gdG9nZ2xlQ2VudGVyVGV4dCgpXG4gICAgICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplICsxXG4gICAgICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgICAgICB3aGVuICdSZXNldCcgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBXaW5kb3cgTGlzdCcgICAgICB0aGVuIHJldHVybiB0aXRsZWJhci5zaG93TGlzdCgpXG4gICAgICAgICAgICB3aGVuICdOYXZpZ2F0ZSBCYWNrd2FyZCcgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmJhY2t3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEZvcndhcmQnICAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuZm9yd2FyZCgpXG4gICAgICAgICAgICB3aGVuICdNYXhpbWl6ZSBFZGl0b3InICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgSGlzdG9yeScgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5maWxlYnJvd3Nlci5zaGVsZi50b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgIHdoZW4gJ0FjdGl2YXRlIE5leHQgVGFiJyAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgUHJldmlvdXMgVGFiJyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIExlZnQnICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIFJpZ2h0JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdPcGVuLi4uJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBUYWIuLi4nICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1RhYjogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgV2luZG93Li4uJyB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJyBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUgQWxsJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlQWxsJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBcyAuLi4nICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlQXMnXG4gICAgICAgICAgICB3aGVuICdSZXZlcnQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAncmVsb2FkRmlsZSdcbiAgICAgICAgICAgICMgd2hlbiAnUmVsb2FkJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgVGFiIG9yIFdpbmRvdycgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlVGFiT3JXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBUYWJzJyAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VPdGhlclRhYnMnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnQ2xlYXIgTGlzdCcgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aW5kb3cuc3RhdGUuc2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICAgICAgICAgICAgICB3aW5kb3cudGl0bGViYXIucmVmcmVzaE1lbnUoKVxuICAgICAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgIHdoZW4gJ1ByZWZlcmVuY2VzJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZXMnIFtwcmVmcy5zdG9yZS5maWxlXSwgbmV3VGFiOnRydWVcbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgICAgICAgdGhlbiBhcmdzID0gQGlkXG4gICAgXG4gICAgICAgICMgbG9nIFwidW5oYW5kbGVkIG1lbnUgYWN0aW9uISBwb3N0aW5nIHRvIG1haW4gJyN7bmFtZX0nIGFyZ3M6XCIsIGFyZ3NcbiAgICBcbiAgICAgICAgc3VwZXIgbmFtZSwgYXJnc1xuICAgICAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOid8J1xud2luZG93LnByZWZzID0gcHJlZnNcblxucG9zdC5zZXRNYXhMaXN0ZW5lcnMgMjBcblxuc2F2ZVN0YXNoID0gLT5cblxuICAgIGtsb2cgJ3dpbmRvdy5zYXZlU3Rhc2gnXG4gICAgcG9zdC5lbWl0ICdzdGFzaCdcbiAgICBlZGl0b3Iuc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zKClcbiAgICB3aW5kb3cuc3Rhc2guc2F2ZSgpICBcblxucmVzdG9yZVdpbiA9IC0+XG5cbiAgICBrbG9nICdrby53aW5kb3cucmVzdG9yZVdpbidcbiAgICBpZiBib3VuZHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdib3VuZHMnXG4gICAgICAgIHdpbmRvdy53aW4uc2V0Qm91bmRzIGJvdW5kc1xuXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnZGV2VG9vbHMnXG4gICAgICAgIHBvc3QuZW1pdCAnbWVudUFjdGlvbicgJ2RldnRvb2xzJ1xuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub24gJ3NpbmdsZUN1cnNvckF0UG9zJyAocG9zLCBvcHQpIC0+ICMgYnJvd3NlciBkb3VibGUgY2xpY2sgYW5kIG5ld1RhYldpdGhGaWxlIDpsOmNcbiAgICBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgcG9zLCBvcHQgXG4gICAgZWRpdG9yLnNjcm9sbC5jdXJzb3JUb1RvcCgpXG5wb3N0Lm9uICdmb2N1c0VkaXRvcicgIC0+IHNwbGl0LmZvY3VzICdlZGl0b3InXG5wb3N0Lm9uICdjbG9uZUZpbGUnICAgIC0+IHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG5wb3N0Lm9uICdjbG9zZVdpbmRvdycgIC0+IHBvc3QuZW1pdCAnbWVudUFjdGlvbicgJ0Nsb3NlJ1xucG9zdC5vbiAnc2F2ZVN0YXNoJyAgICAtPiBzYXZlU3Rhc2goKVxucG9zdC5vbiAnZWRpdG9yRm9jdXMnIChlZGl0b3IpIC0+XG4gICAgd2luZG93LnNldExhc3RGb2N1cyBlZGl0b3IubmFtZVxuICAgIHdpbmRvdy5mb2N1c0VkaXRvciA9IGVkaXRvclxuICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gZWRpdG9yIGlmIGVkaXRvci5uYW1lICE9ICdjb21tYW5kbGluZS1lZGl0b3InXG5cbnBvc3Qub24gJ2RldlRvb2xzJyAob3BlbikgLT4gXG4gICAga2xvZyBcImtvLndpbmRvdy5wb3N0Lm9uIGRldlRvb2xzICN7b3Blbn1cIlxuXG5wb3N0Lm9uICdtYWlubG9nJyAtPiBrbG9nLmFwcGx5IGtsb2csIGFyZ3VtZW50c1xuXG5wb3N0Lm9uICdwaW5nJyAod0lELCBhcmdBLCBhcmdCKSAtPiBwb3N0LnRvV2luIHdJRCwgJ3BvbmcnIHdpbmRvdy53aW5JRCwgYXJnQSwgYXJnQlxucG9zdC5vbiAncG9zdEVkaXRvclN0YXRlJyAtPlxuICAgIHBvc3QudG9BbGwgJ2VkaXRvclN0YXRlJyB3aW5kb3cud2luSUQsXG4gICAgICAgIGxpbmVzOiAgICAgIGVkaXRvci5saW5lcygpXG4gICAgICAgIGN1cnNvcnM6ICAgIGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgbWFpbjogICAgICAgZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBzZWxlY3Rpb25zOiBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgIGhpZ2hsaWdodHM6IGVkaXRvci5oaWdobGlnaHRzKClcblxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbndpbmRvdy5lZGl0b3JXaXRoTmFtZSA9IChuKSAtPlxuXG4gICAgc3dpdGNoIG5cbiAgICAgICAgd2hlbiAnZWRpdG9yJyAgIHRoZW4gZWRpdG9yXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQnICdjb21tYW5kbGluZScgdGhlbiBjb21tYW5kbGluZVxuICAgICAgICB3aGVuICd0ZXJtaW5hbCcgdGhlbiB0ZXJtaW5hbFxuICAgICAgICBlbHNlIGVkaXRvclxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxub25DbG9zZSA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3NhdmVDaGFuZ2VzJ1xuICAgIGVkaXRvci5zZXRUZXh0ICcnXG4gICAgIyBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuXG4gICAgaWYgQnJvd3Nlci5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID4gMVxuICAgICAgICB3aW5kb3cuc3Rhc2guY2xlYXIoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICBpbmZvLnJlbG9hZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxucmVsb2FkV2luID0gLT5cblxuICAgIHNhdmVTdGFzaCgpXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuICAgIHBvc3QudG9NYWluICdyZWxvYWRXaW4nIHdpbklEOndpbmRvdy53aW5JRCwgZmlsZTplZGl0b3IuY3VycmVudEZpbGVcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxud2luZG93Lm9ucmVzaXplID0gLT5cblxuICAgICMga2xvZyAna28ud2luZG93Lm9ucmVzaXplJ1xuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIHdpbmRvdy53aW4ub25Nb3ZlZCB3aW5kb3cud2luLmdldEJvdW5kcygpXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSwgMjAwXG5cbnBvc3Qub24gJ3NwbGl0JyAocykgLT5cblxuICAgIGZpbGVicm93c2VyLnJlc2l6ZWQoKVxuICAgIHRlcm1pbmFsLnJlc2l6ZWQoKVxuICAgIGNvbW1hbmRsaW5lLnJlc2l6ZWQoKVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbnRvZ2dsZUNlbnRlclRleHQgPSAtPlxuXG4gICAgaWYgd2luZG93LnN0YXRlLmdldCBcImludmlzaWJsZXN8I3tlZGl0b3IuY3VycmVudEZpbGV9XCIgZmFsc2VcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICByZXN0b3JlSW52aXNpYmxlcyA9IHRydWVcblxuICAgIGlmIG5vdCB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyB0cnVlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWVcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IGZhbHNlXG5cbiAgICBpZiByZXN0b3JlSW52aXNpYmxlc1xuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuc2V0Rm9udFNpemUgPSAocykgLT5cblxuICAgIHMgPSBwcmVmcy5nZXQoJ2VkaXRvckZvbnRTaXplJyAxOSkgaWYgbm90IF8uaXNGaW5pdGUgc1xuICAgIHMgPSBjbGFtcCA4IDEwMCBzXG5cbiAgICB3aW5kb3cuc3Rhc2guc2V0IFwiZm9udFNpemVcIiBzXG4gICAgZWRpdG9yLnNldEZvbnRTaXplIHNcbiAgICBpZiBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZSwgcmVsb2FkOnRydWVcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cblxuICAgIGlmICAgICAgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMzBcbiAgICAgICAgZiA9IDRcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDUwXG4gICAgICAgIGYgPSAxMFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMjBcbiAgICAgICAgZiA9IDJcbiAgICBlbHNlXG4gICAgICAgIGYgPSAxXG4gICAgc2V0Rm9udFNpemUgZWRpdG9yLnNpemUuZm9udFNpemUgKyBmKmRcblxucmVzZXRGb250U2l6ZSA9IC0+XG5cbiAgICBkZWZhdWx0Rm9udFNpemUgPSBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcbiAgICBzZXRGb250U2l6ZSBkZWZhdWx0Rm9udFNpemVcblxuYWRkVG9TaGVsZiA9IC0+XG5cbiAgICByZXR1cm4gaWYgd2luZG93Lmxhc3RGb2N1cyA9PSAnc2hlbGYnXG4gICAgZmIgPSB3aW5kb3cuZmlsZWJyb3dzZXJcbiAgICBpZiB3aW5kb3cubGFzdEZvY3VzLnN0YXJ0c1dpdGggZmIubmFtZVxuICAgICAgICBwYXRoID0gZmIuY29sdW1uV2l0aE5hbWUod2luZG93Lmxhc3RGb2N1cykuYWN0aXZlUGF0aCgpXG4gICAgZWxzZVxuICAgICAgICBwYXRoID0gZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoXG5cbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyAgICAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAgMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbnJlc2V0Wm9vbTogLT5cblxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgMVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuY2hhbmdlWm9vbTogKGQpIC0+XG4gICAgXG4gICAgeiA9IHdlYmZyYW1lLmdldFpvb21GYWN0b3IoKVxuICAgIHogKj0gMStkLzIwXG4gICAgeiA9IGNsYW1wIDAuMzYgNS4yMyB6XG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciB6XG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxud2luZG93Lm9uYmx1ciAgPSAoZXZlbnQpIC0+IHBvc3QuZW1pdCAnd2luRm9jdXMnIGZhbHNlXG53aW5kb3cub25mb2N1cyA9IChldmVudCkgLT5cbiAgICBwb3N0LmVtaXQgJ3dpbkZvY3VzJyB0cnVlXG4gICAgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbGFzc05hbWUgPT0gJ2JvZHknXG4gICAgICAgIGlmIHNwbGl0LmVkaXRvclZpc2libGUoKVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2VkaXRvcidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxud2luZG93LnNldExhc3RGb2N1cyA9IChuYW1lKSAtPiBcbiAgICAjIGtsb2cgJ3NldExhc3RGb2N1cycgbmFtZVxuICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBuYW1lXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG5vbkNvbWJvID0gKGNvbWJvLCBpbmZvKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuXG4gICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IH0gPSBpbmZvXG5cbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gdGl0bGViYXIuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICBmb3IgaSBpbiBbMS4uOV1cbiAgICAgICAgaWYgY29tYm8gaXMgXCJhbHQrI3tpfVwiXG4gICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBwb3N0LnRvTWFpbiAnYWN0aXZhdGVXaW5kb3cnIGlcblxuICAgIHN3aXRjaCBjb21ib1xuICAgICAgICB3aGVuICdmMycgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc2NyZWVuU2hvdCgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrPScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSArMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCswJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEByZXNldFpvb20oKVxuICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt5JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcblxucG9zdC5vbiAnY29tYm8nIG9uQ29tYm9cblxubmV3IFdpbmRvd1xuIl19
//# sourceURL=../../coffee/win/window.coffee
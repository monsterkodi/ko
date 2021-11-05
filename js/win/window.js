// koffee 1.16.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var CWD, Commandline, Editor, FPS, FileEditor, FileHandler, FileWatcher, Info, Navigate, Split, Tabs, Terminal, Titlebar, Window, _, addToShelf, changeFontSize, clamp, commandline, editor, electron, filehandler, filewatcher, klog, mainmenu, onClose, onCombo, pkg, post, prefs, projects, ref, reloadWin, resetFontSize, restoreWin, saveStash, scheme, setFontSize, stash, stopEvent, store, tabs, terminal, titlebar, toggleCenterText, toggleTabPinned, win,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = Object.hasOwn;

ref = require('kxk'), _ = ref._, clamp = ref.clamp, klog = ref.klog, post = ref.post, prefs = ref.prefs, scheme = ref.scheme, stash = ref.stash, stopEvent = ref.stopEvent, store = ref.store, win = ref.win;

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
                if (changeInfo.deletes === 1) {
                    return navigate.delFilePos({
                        file: editor.currentFile,
                        pos: [0, changeInfo.changes[0].oldIndex]
                    });
                } else {
                    return navigate.addFilePos({
                        file: editor.currentFile,
                        pos: editor.cursorPos()
                    });
                }
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

    Window.prototype.onMenuAction = function(name, opts) {
        var action;
        if (action = Editor.actionWithName(name)) {
            if ((action.key != null) && _.isFunction(window.focusEditor[action.key])) {
                window.focusEditor[action.key](opts.actarg);
                return;
            }
        }
        if ('unhandled' !== window.commandline.handleMenuAction(name, opts)) {
            return;
        }
        switch (name) {
            case 'doMacro':
                return window.commandline.commands.macro.execute(opts.actarg);
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
            case 'Toggle Tab Pinned':
                return toggleTabPinned();
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
                opts = this.id;
        }
        return Window.__super__.onMenuAction.call(this, name, opts);
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

toggleTabPinned = function() {
    var t;
    if (t = window.tabs.activeTab()) {
        return t.togglePinned();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK2JBQUE7SUFBQTs7OztBQVFBLE1BQXdFLE9BQUEsQ0FBUSxLQUFSLENBQXhFLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksZUFBWixFQUFrQixlQUFsQixFQUF3QixpQkFBeEIsRUFBK0IsbUJBQS9CLEVBQXVDLGlCQUF2QyxFQUE4Qyx5QkFBOUMsRUFBeUQsaUJBQXpELEVBQWdFOztBQUVoRSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2QsV0FBQSxHQUFjOztB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OztJQUNBLElBQTJCLFdBQUEsS0FBZSxRQUFRLENBQUMsc0JBQVQsQ0FBZ0MsR0FBaEMsRUFBcUMsR0FBckMsRUFBMEMsS0FBMUMsRUFBaUQsS0FBakQsQ0FBMUM7QUFBQSxlQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQVA7O0FBRUEsU0FBUywwQkFBVDtRQUNJLElBQUcsS0FBQSxLQUFTLENBQUEsTUFBQSxHQUFPLENBQVAsQ0FBWjtBQUNJLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUksQ0FBQyxNQUFMLENBQVksZ0JBQVosRUFBNkIsQ0FBN0IsQ0FBakIsRUFEWDs7QUFESjtBQUlBLFlBQU8sS0FBUDtBQUFBLGFBQ1MsSUFEVDtBQUNtQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixVQUFBLENBQUEsQ0FBakI7QUFEMUMsYUFFUyxpQkFGVDtBQUVtQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsQ0FBYixDQUFqQjtBQUYxQyxhQUdTLGlCQUhUO0FBR21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBSDFDLGFBSVMsaUJBSlQ7QUFJbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFqQjtBQUoxQyxhQUtTLGVBTFQ7QUFLbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsS0FBSyxFQUFDLEVBQUQsRUFBTCxDQUFTLGlCQUFULENBQWpCO0FBTDFDO0FBYk07O0FBb0JWLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFnQixPQUFoQjs7QUFFQSxJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBfLCBjbGFtcCwga2xvZywgcG9zdCwgcHJlZnMsIHNjaGVtZSwgc3Rhc2gsIHN0b3BFdmVudCwgc3RvcmUsIHdpbiB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TcGxpdCAgICAgICA9IHJlcXVpcmUgJy4vc3BsaXQnXG5UZXJtaW5hbCAgICA9IHJlcXVpcmUgJy4vdGVybWluYWwnXG5UYWJzICAgICAgICA9IHJlcXVpcmUgJy4vdGFicydcblRpdGxlYmFyICAgID0gcmVxdWlyZSAnLi90aXRsZWJhcidcbkluZm8gICAgICAgID0gcmVxdWlyZSAnLi9pbmZvJ1xuRmlsZUhhbmRsZXIgPSByZXF1aXJlICcuL2ZpbGVoYW5kbGVyJ1xuRmlsZVdhdGNoZXIgPSByZXF1aXJlICcuLi90b29scy93YXRjaGVyJ1xuRWRpdG9yICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvZWRpdG9yJ1xuQ29tbWFuZGxpbmUgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kbGluZSdcbkZpbGVFZGl0b3IgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2ZpbGVlZGl0b3InXG5OYXZpZ2F0ZSAgICA9IHJlcXVpcmUgJy4uL21haW4vbmF2aWdhdGUnXG5GUFMgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZwcydcbkNXRCAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvY3dkJ1xuc2NoZW1lICAgICAgPSByZXF1aXJlICcuLi90b29scy9zY2hlbWUnXG5wcm9qZWN0cyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuZWxlY3Ryb24gICAgPSByZXF1aXJlICdlbGVjdHJvbidcbnBrZyAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuXG5lZGl0b3IgICAgICA9IG51bGxcbm1haW5tZW51ICAgID0gbnVsbFxudGVybWluYWwgICAgPSBudWxsXG5jb21tYW5kbGluZSA9IG51bGxcbnRpdGxlYmFyICAgID0gbnVsbFxudGFicyAgICAgICAgPSBudWxsXG5maWxlaGFuZGxlciA9IG51bGxcbmZpbGV3YXRjaGVyID0gbnVsbFxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcblxuY2xhc3MgV2luZG93IGV4dGVuZHMgd2luXG4gICAgXG4gICAgQDogLT5cblxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgbWVudVRlbXBsYXRlOiAgIHJlcXVpcmUgJy4vbWVudSdcbiAgICAgICAgICAgIHBrZzogICAgICAgICAgICByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBtZW51OiAgICAgICAgICAgJy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgICAgICAgICBpY29uOiAgICAgICAgICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICAgICAgICAgIHNjaGVtZTogICAgICAgICBmYWxzZVxuICAgIFxuICAgICAgICB3aW5kb3cuc3Rhc2ggPSBuZXcgc3Rhc2ggXCJ3aW4vI3tAaWR9XCIgc2VwYXJhdG9yOid8J1xuICAgICAgICAgICAgXG4gICAgICAgIGZpbGVoYW5kbGVyID0gd2luZG93LmZpbGVoYW5kbGVyID0gbmV3IEZpbGVIYW5kbGVyXG4gICAgICAgIGZpbGV3YXRjaGVyID0gd2luZG93LmZpbGV3YXRjaGVyID0gbmV3IEZpbGVXYXRjaGVyXG4gICAgICAgIHRhYnMgICAgICAgID0gd2luZG93LnRhYnMgICAgICAgID0gbmV3IFRhYnMgd2luZG93LnRpdGxlYmFyLmVsZW1cbiAgICAgICAgdGl0bGViYXIgICAgPSAgICAgICAgICAgICAgICAgICAgICBuZXcgVGl0bGViYXJcbiAgICAgICAgbmF2aWdhdGUgICAgPSB3aW5kb3cubmF2aWdhdGUgICAgPSBuZXcgTmF2aWdhdGUoKVxuICAgICAgICBzcGxpdCAgICAgICA9IHdpbmRvdy5zcGxpdCAgICAgICA9IG5ldyBTcGxpdCgpXG4gICAgICAgIHRlcm1pbmFsICAgID0gd2luZG93LnRlcm1pbmFsICAgID0gbmV3IFRlcm1pbmFsICd0ZXJtaW5hbCdcbiAgICAgICAgZWRpdG9yICAgICAgPSB3aW5kb3cuZWRpdG9yICAgICAgPSBuZXcgRmlsZUVkaXRvciAnZWRpdG9yJ1xuICAgICAgICBjb21tYW5kbGluZSA9IHdpbmRvdy5jb21tYW5kbGluZSA9IG5ldyBDb21tYW5kbGluZSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgICAgICBpbmZvICAgICAgICA9IHdpbmRvdy5pbmZvICAgICAgICA9IG5ldyBJbmZvIGVkaXRvclxuICAgICAgICBmcHMgICAgICAgICA9IHdpbmRvdy5mcHMgICAgICAgICA9IG5ldyBGUFMoKVxuICAgICAgICBjd2QgICAgICAgICA9IHdpbmRvdy5jd2QgICAgICAgICA9IG5ldyBDV0QoKVxuICAgIFxuICAgICAgICB3aW5kb3cudGV4dEVkaXRvciA9IHdpbmRvdy5mb2N1c0VkaXRvciA9IGVkaXRvclxuICAgICAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG5cbiAgICAgICAgcmVzdG9yZVdpbigpXG4gICAgICAgIHNjaGVtZS5zZXQgcHJlZnMuZ2V0ICdzY2hlbWUnICdkYXJrJ1xuXG4gICAgICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJyAoZmlsZSwgbGluZUNoYW5nZSkgLT4gIyBzZW5kcyBjaGFuZ2VzIHRvIGFsbCB3aW5kb3dzXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBmaWxlLCBbbGluZUNoYW5nZV1cbiAgICBcbiAgICAgICAgZWRpdG9yLm9uICdjaGFuZ2VkJyAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2VJbmZvLmZvcmVpZ25cbiAgICAgICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnIGVkaXRvci5jdXJyZW50RmlsZSwgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICAgICAgIyBrbG9nICd3aW5kb3cuZWRpdG9yLm9uLmNoYW5nZWQnIGNoYW5nZUluZm9cbiAgICAgICAgICAgICAgICBpZiBjaGFuZ2VJbmZvLmRlbGV0ZXMgPT0gMVxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0ZS5kZWxGaWxlUG9zIGZpbGU6IGVkaXRvci5jdXJyZW50RmlsZSwgcG9zOiBbMCBjaGFuZ2VJbmZvLmNoYW5nZXNbMF0ub2xkSW5kZXhdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0ZS5hZGRGaWxlUG9zIGZpbGU6IGVkaXRvci5jdXJyZW50RmlsZSwgcG9zOiBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICBcbiAgICAgICAgcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZvbnRTaXplJyBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgICAgICBlZGl0b3Iuc2V0Rm9udFNpemUgcyBpZiBzXG4gICAgXG4gICAgICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnXG4gICAgICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlIDBcbiAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdyZXN0b3JlJ1xuICAgICAgICBlZGl0b3IuZm9jdXMoKVxuXG4gICAgb25Nb3ZlZDogKGJvdW5kcykgPT4gd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyBib3VuZHNcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgXG4gICAgb25NZW51QWN0aW9uOiAobmFtZSwgb3B0cykgPT5cbiAgICBcbiAgICAgICAgIyBrbG9nICdrby53aW5kb3cub25NZW51QWN0aW9uJyBuYW1lLCBvcHRzXG4gICAgICAgIFxuICAgICAgICBpZiBhY3Rpb24gPSBFZGl0b3IuYWN0aW9uV2l0aE5hbWUgbmFtZVxuICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV0gb3B0cy5hY3RhcmdcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmhhbmRsZU1lbnVBY3Rpb24gbmFtZSwgb3B0c1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIHN3aXRjaCBuYW1lXG4gICAgXG4gICAgICAgICAgICB3aGVuICdkb01hY3JvJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5tYWNyby5leGVjdXRlIG9wdHMuYWN0YXJnXG4gICAgICAgICAgICB3aGVuICdVbmRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby51bmRvKClcbiAgICAgICAgICAgIHdoZW4gJ1JlZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnJlZG8oKVxuICAgICAgICAgICAgd2hlbiAnQ3V0JyAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY3V0KClcbiAgICAgICAgICAgIHdoZW4gJ0NvcHknICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmNvcHkoKVxuICAgICAgICAgICAgd2hlbiAnUGFzdGUnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IucGFzdGUoKVxuICAgICAgICAgICAgd2hlbiAnTmV3IFRhYicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ25ld0VtcHR5VGFiJ1xuICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBDZW50ZXIgVGV4dCcgICAgdGhlbiByZXR1cm4gdG9nZ2xlQ2VudGVyVGV4dCgpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgVGFiIFBpbm5lZCcgICAgIHRoZW4gcmV0dXJuIHRvZ2dsZVRhYlBpbm5lZCgpXG4gICAgICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplICsxXG4gICAgICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgICAgICB3aGVuICdSZXNldCcgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBXaW5kb3cgTGlzdCcgICAgICB0aGVuIHJldHVybiB0aXRsZWJhci5zaG93TGlzdCgpXG4gICAgICAgICAgICB3aGVuICdOYXZpZ2F0ZSBCYWNrd2FyZCcgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmJhY2t3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEZvcndhcmQnICAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuZm9yd2FyZCgpXG4gICAgICAgICAgICB3aGVuICdNYXhpbWl6ZSBFZGl0b3InICAgICAgIHRoZW4gcmV0dXJuIHNwbGl0Lm1heGltaXplRWRpdG9yKClcbiAgICAgICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgSGlzdG9yeScgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5maWxlYnJvd3Nlci5zaGVsZi50b2dnbGVIaXN0b3J5KClcbiAgICAgICAgICAgIHdoZW4gJ0FjdGl2YXRlIE5leHQgVGFiJyAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgUHJldmlvdXMgVGFiJyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIExlZnQnICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAnbGVmdCdcbiAgICAgICAgICAgIHdoZW4gJ01vdmUgVGFiIFJpZ2h0JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdPcGVuLi4uJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBUYWIuLi4nICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1RhYjogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgV2luZG93Li4uJyB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJyBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUgQWxsJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlQWxsJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBcyAuLi4nICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlQXMnXG4gICAgICAgICAgICB3aGVuICdSZXZlcnQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAncmVsb2FkRmlsZSdcbiAgICAgICAgICAgICMgd2hlbiAnUmVsb2FkJyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgVGFiIG9yIFdpbmRvdycgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlVGFiT3JXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBUYWJzJyAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VPdGhlclRhYnMnXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnQ2xlYXIgTGlzdCcgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aW5kb3cuc3RhdGUuc2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICAgICAgICAgICAgICB3aW5kb3cudGl0bGViYXIucmVmcmVzaE1lbnUoKVxuICAgICAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgIHdoZW4gJ1ByZWZlcmVuY2VzJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZXMnIFtwcmVmcy5zdG9yZS5maWxlXSwgbmV3VGFiOnRydWVcbiAgICAgICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnICAgICAgICAgdGhlbiBvcHRzID0gQGlkXG4gICAgXG4gICAgICAgICMgbG9nIFwidW5oYW5kbGVkIG1lbnUgYWN0aW9uISBwb3N0aW5nIHRvIG1haW4gJyN7bmFtZX0nIG9wdHM6XCIsIG9wdHNcbiAgICBcbiAgICAgICAgc3VwZXIgbmFtZSwgb3B0c1xuICAgICAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOid8J1xud2luZG93LnByZWZzID0gcHJlZnNcblxucG9zdC5zZXRNYXhMaXN0ZW5lcnMgMjBcblxuc2F2ZVN0YXNoID0gLT5cblxuICAgIGtsb2cgJ3dpbmRvdy5zYXZlU3Rhc2gnXG4gICAgcG9zdC5lbWl0ICdzdGFzaCdcbiAgICBlZGl0b3Iuc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zKClcbiAgICB3aW5kb3cuc3Rhc2guc2F2ZSgpICBcblxucmVzdG9yZVdpbiA9IC0+XG5cbiAgICAjIGtsb2cgJ2tvLndpbmRvdy5yZXN0b3JlV2luJ1xuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luZG93Lndpbi5zZXRCb3VuZHMgYm91bmRzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdkZXZUb29scydcbiAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnZGV2dG9vbHMnXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbiAnc2luZ2xlQ3Vyc29yQXRQb3MnIChwb3MsIG9wdCkgLT4gIyBicm93c2VyIGRvdWJsZSBjbGljayBhbmQgbmV3VGFiV2l0aEZpbGUgOmw6Y1xuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdCBcbiAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbnBvc3Qub24gJ2ZvY3VzRWRpdG9yJyAgLT4gc3BsaXQuZm9jdXMgJ2VkaXRvcidcbnBvc3Qub24gJ2Nsb25lRmlsZScgICAgLT4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnQ2xvc2UnXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxucG9zdC5vbiAnZGV2VG9vbHMnIChvcGVuKSAtPlxuICAgIGtsb2cgXCJrby53aW5kb3cucG9zdC5vbiBkZXZUb29scyAje29wZW59XCJcblxucG9zdC5vbiAnbWFpbmxvZycgLT4ga2xvZy5hcHBseSBrbG9nLCBhcmd1bWVudHNcblxucG9zdC5vbiAncGluZycgKHdJRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3SUQsICdwb25nJyB3aW5kb3cud2luSUQsIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3Bvc3RFZGl0b3JTdGF0ZScgLT5cbiAgICBwb3N0LnRvQWxsICdlZGl0b3JTdGF0ZScgd2luZG93LndpbklELFxuICAgICAgICBsaW5lczogICAgICBlZGl0b3IubGluZXMoKVxuICAgICAgICBjdXJzb3JzOiAgICBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgIG1haW46ICAgICAgIGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgc2VsZWN0aW9uczogZWRpdG9yLnNlbGVjdGlvbnMoKVxuICAgICAgICBoaWdobGlnaHRzOiBlZGl0b3IuaGlnaGxpZ2h0cygpXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG53aW5kb3cuZWRpdG9yV2l0aE5hbWUgPSAobikgLT5cblxuICAgIHN3aXRjaCBuXG4gICAgICAgIHdoZW4gJ2VkaXRvcicgICB0aGVuIGVkaXRvclxuICAgICAgICB3aGVuICdjb21tYW5kJyAnY29tbWFuZGxpbmUnIHRoZW4gY29tbWFuZGxpbmVcbiAgICAgICAgd2hlbiAndGVybWluYWwnIHRoZW4gdGVybWluYWxcbiAgICAgICAgZWxzZSBlZGl0b3JcblxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbm9uQ2xvc2UgPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzYXZlQ2hhbmdlcydcbiAgICBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgICMgZWRpdG9yLnN0b3BXYXRjaGVyKClcblxuICAgIGlmIEJyb3dzZXIuZ2V0QWxsV2luZG93cygpLmxlbmd0aCA+IDFcbiAgICAgICAgd2luZG93LnN0YXNoLmNsZWFyKClcblxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbmRvdy5vbmxvYWQgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgaW5mby5yZWxvYWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbnJlbG9hZFdpbiA9IC0+XG5cbiAgICBzYXZlU3Rhc2goKVxuICAgIGNsZWFyTGlzdGVuZXJzKClcbiAgICBwb3N0LnRvTWFpbiAncmVsb2FkV2luJyB3aW5JRDp3aW5kb3cud2luSUQsIGZpbGU6ZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbndpbmRvdy5vbnJlc2l6ZSA9IC0+XG5cbiAgICAjIGtsb2cgJ2tvLndpbmRvdy5vbnJlc2l6ZSdcbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICB3aW5kb3cud2luLm9uTW92ZWQgd2luZG93Lndpbi5nZXRCb3VuZHMoKVxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUsIDIwMFxuXG5wb3N0Lm9uICdzcGxpdCcgKHMpIC0+XG5cbiAgICBmaWxlYnJvd3Nlci5yZXNpemVkKClcbiAgICB0ZXJtaW5hbC5yZXNpemVkKClcbiAgICBjb21tYW5kbGluZS5yZXNpemVkKClcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG50b2dnbGVDZW50ZXJUZXh0ID0gLT5cblxuICAgIGlmIHdpbmRvdy5zdGF0ZS5nZXQgXCJpbnZpc2libGVzfCN7ZWRpdG9yLmN1cnJlbnRGaWxlfVwiIGZhbHNlXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcbiAgICAgICAgcmVzdG9yZUludmlzaWJsZXMgPSB0cnVlXG5cbiAgICBpZiBub3Qgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgdHJ1ZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlXG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCBmYWxzZVxuXG4gICAgaWYgcmVzdG9yZUludmlzaWJsZXNcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICBcbnRvZ2dsZVRhYlBpbm5lZCA9IC0+XG4gICAgXG4gICAgaWYgdCA9IHdpbmRvdy50YWJzLmFjdGl2ZVRhYigpXG4gICAgICAgIHQudG9nZ2xlUGlubmVkKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG5zZXRGb250U2l6ZSA9IChzKSAtPlxuXG4gICAgcyA9IHByZWZzLmdldCgnZWRpdG9yRm9udFNpemUnIDE5KSBpZiBub3QgXy5pc0Zpbml0ZSBzXG4gICAgcyA9IGNsYW1wIDggMTAwIHNcblxuICAgIHdpbmRvdy5zdGFzaC5zZXQgXCJmb250U2l6ZVwiIHNcbiAgICBlZGl0b3Iuc2V0Rm9udFNpemUgc1xuICAgIGlmIGVkaXRvci5jdXJyZW50RmlsZT9cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuXG5jaGFuZ2VGb250U2l6ZSA9IChkKSAtPlxuXG4gICAgaWYgICAgICBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAzMFxuICAgICAgICBmID0gNFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gNTBcbiAgICAgICAgZiA9IDEwXG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAyMFxuICAgICAgICBmID0gMlxuICAgIGVsc2VcbiAgICAgICAgZiA9IDFcbiAgICBzZXRGb250U2l6ZSBlZGl0b3Iuc2l6ZS5mb250U2l6ZSArIGYqZFxuXG5yZXNldEZvbnRTaXplID0gLT5cblxuICAgIGRlZmF1bHRGb250U2l6ZSA9IHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgd2luZG93LnN0YXNoLnNldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuICAgIHNldEZvbnRTaXplIGRlZmF1bHRGb250U2l6ZVxuXG5hZGRUb1NoZWxmID0gLT5cblxuICAgIHJldHVybiBpZiB3aW5kb3cubGFzdEZvY3VzID09ICdzaGVsZidcbiAgICBmYiA9IHdpbmRvdy5maWxlYnJvd3NlclxuICAgIGlmIHdpbmRvdy5sYXN0Rm9jdXMuc3RhcnRzV2l0aCBmYi5uYW1lXG4gICAgICAgIHBhdGggPSBmYi5jb2x1bW5XaXRoTmFtZSh3aW5kb3cubGFzdEZvY3VzKS5hY3RpdmVQYXRoKClcbiAgICBlbHNlXG4gICAgICAgIHBhdGggPSBlZGl0b3IuY3VycmVudEZpbGVcbiAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhcblxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jICAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgICAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxucmVzZXRab29tOiAtPlxuXG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciAxXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG5jaGFuZ2Vab29tOiAoZCkgLT5cbiAgICBcbiAgICB6ID0gd2ViZnJhbWUuZ2V0Wm9vbUZhY3RvcigpXG4gICAgeiAqPSAxK2QvMjBcbiAgICB6ID0gY2xhbXAgMC4zNiA1LjIzIHpcbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIHpcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG53aW5kb3cub25ibHVyICA9IChldmVudCkgLT4gcG9zdC5lbWl0ICd3aW5Gb2N1cycgZmFsc2VcbndpbmRvdy5vbmZvY3VzID0gKGV2ZW50KSAtPlxuICAgIHBvc3QuZW1pdCAnd2luRm9jdXMnIHRydWVcbiAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSA9PSAnYm9keSdcbiAgICAgICAgaWYgc3BsaXQuZWRpdG9yVmlzaWJsZSgpXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG53aW5kb3cuc2V0TGFzdEZvY3VzID0gKG5hbWUpIC0+IFxuICAgICMga2xvZyAnc2V0TGFzdEZvY3VzJyBuYW1lXG4gICAgd2luZG93Lmxhc3RGb2N1cyA9IG5hbWVcblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbm9uQ29tYm8gPSAoY29tYm8sIGluZm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IGNvbWJvXG5cbiAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgfSA9IGluZm9cblxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB0aXRsZWJhci5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgIGZvciBpIGluIFsxLi45XVxuICAgICAgICBpZiBjb21ibyBpcyBcImFsdCsje2l9XCJcbiAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHBvc3QudG9NYWluICdhY3RpdmF0ZVdpbmRvdycgaVxuXG4gICAgc3dpdGNoIGNvbWJvXG4gICAgICAgIHdoZW4gJ2YzJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzY3JlZW5TaG90KClcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCs9JyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tICsxXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrLScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSAtMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0KzAnICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHJlc2V0Wm9vbSgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3knICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzcGxpdC5kbyAnbWluaW1pemUgZWRpdG9yJ1xuXG5wb3N0Lm9uICdjb21ibycgb25Db21ib1xuXG5uZXcgV2luZG93XG4iXX0=
//# sourceURL=../../coffee/win/window.coffee
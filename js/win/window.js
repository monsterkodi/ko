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
    klog('setLastFocus', name);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb2JBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2QsV0FBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxJQUFBLEdBQWM7O0FBQ2QsV0FBQSxHQUFjOztBQUNkLFdBQUEsR0FBYzs7QUFRUjs7O0lBRUMsZ0JBQUE7OztBQUVDLFlBQUE7UUFBQSx3Q0FDSTtZQUFBLEdBQUEsRUFBZ0IsU0FBaEI7WUFDQSxZQUFBLEVBQWdCLE9BQUEsQ0FBUSxRQUFSLENBRGhCO1lBRUEsR0FBQSxFQUFnQixPQUFBLENBQVEsb0JBQVIsQ0FGaEI7WUFHQSxJQUFBLEVBQWdCLHdCQUhoQjtZQUlBLElBQUEsRUFBZ0IsdUJBSmhCO1lBS0EsTUFBQSxFQUFnQixLQUxoQjtTQURKO1FBUUEsTUFBTSxDQUFDLEtBQVAsR0FBZSxJQUFJLEtBQUosQ0FBVSxNQUFBLEdBQU8sSUFBQyxDQUFBLEVBQWxCLEVBQXVCO1lBQUEsU0FBQSxFQUFVLEdBQVY7U0FBdkI7UUFFZixXQUFBLEdBQWMsTUFBTSxDQUFDLFdBQVAsR0FBcUIsSUFBSTtRQUN2QyxXQUFBLEdBQWMsTUFBTSxDQUFDLFdBQVAsR0FBcUIsSUFBSTtRQUN2QyxJQUFBLEdBQWMsTUFBTSxDQUFDLElBQVAsR0FBcUIsSUFBSSxJQUFKLENBQVMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUF6QjtRQUNuQyxRQUFBLEdBQW1DLElBQUk7UUFDdkMsUUFBQSxHQUFjLE1BQU0sQ0FBQyxRQUFQLEdBQXFCLElBQUksUUFBSixDQUFBO1FBQ25DLEtBQUEsR0FBYyxNQUFNLENBQUMsS0FBUCxHQUFxQixJQUFJLEtBQUosQ0FBQTtRQUNuQyxRQUFBLEdBQWMsTUFBTSxDQUFDLFFBQVAsR0FBcUIsSUFBSSxRQUFKLENBQWEsVUFBYjtRQUNuQyxNQUFBLEdBQWMsTUFBTSxDQUFDLE1BQVAsR0FBcUIsSUFBSSxVQUFKLENBQWUsUUFBZjtRQUNuQyxXQUFBLEdBQWMsTUFBTSxDQUFDLFdBQVAsR0FBcUIsSUFBSSxXQUFKLENBQWdCLG9CQUFoQjtRQUNuQyxJQUFBLEdBQWMsTUFBTSxDQUFDLElBQVAsR0FBcUIsSUFBSSxJQUFKLENBQVMsTUFBVDtRQUNuQyxHQUFBLEdBQWMsTUFBTSxDQUFDLEdBQVAsR0FBcUIsSUFBSSxHQUFKLENBQUE7UUFDbkMsR0FBQSxHQUFjLE1BQU0sQ0FBQyxHQUFQLEdBQXFCLElBQUksR0FBSixDQUFBO1FBRW5DLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO1FBQ3pDLE1BQU0sQ0FBQyxZQUFQLENBQW9CLE1BQU0sQ0FBQyxJQUEzQjtRQUVBLFVBQUEsQ0FBQTtRQUNBLE1BQU0sQ0FBQyxHQUFQLENBQVcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxRQUFWLEVBQW1CLE1BQW5CLENBQVg7UUFFQSxRQUFRLENBQUMsRUFBVCxDQUFZLHdCQUFaLEVBQXFDLFNBQUMsSUFBRCxFQUFPLFVBQVA7bUJBQ2pDLElBQUksQ0FBQyxNQUFMLENBQVksaUJBQVosRUFBOEIsSUFBOUIsRUFBb0MsQ0FBQyxVQUFELENBQXBDO1FBRGlDLENBQXJDO1FBR0EsTUFBTSxDQUFDLEVBQVAsQ0FBVSxTQUFWLEVBQW9CLFNBQUMsVUFBRDtZQUNoQixJQUFVLFVBQVUsQ0FBQyxPQUFyQjtBQUFBLHVCQUFBOztZQUNBLElBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUF0QjtnQkFDSSxJQUFJLENBQUMsV0FBTCxDQUFpQixpQkFBakIsRUFBbUMsTUFBTSxDQUFDLFdBQTFDLEVBQXVELFVBQVUsQ0FBQyxPQUFsRTt1QkFDQSxRQUFRLENBQUMsVUFBVCxDQUFvQjtvQkFBQSxJQUFBLEVBQU0sTUFBTSxDQUFDLFdBQWI7b0JBQTBCLEdBQUEsRUFBSyxNQUFNLENBQUMsU0FBUCxDQUFBLENBQS9CO2lCQUFwQixFQUZKOztRQUZnQixDQUFwQjtRQU1BLENBQUEsR0FBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsVUFBakIsRUFBNEIsS0FBSyxDQUFDLEdBQU4sQ0FBVSxnQkFBVixFQUEyQixFQUEzQixDQUE1QjtRQUNKLElBQXdCLENBQXhCO1lBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsQ0FBbkIsRUFBQTs7UUFFQSxJQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixZQUFqQixDQUFIO1lBQ0ksTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEIsRUFBdUIsQ0FBdkIsRUFESjs7UUFHQSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVY7UUFDQSxNQUFNLENBQUMsS0FBUCxDQUFBO0lBL0NEOztxQkFpREgsT0FBQSxHQUFTLFNBQUMsTUFBRDtlQUFZLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixRQUFqQixFQUEwQixNQUExQjtJQUFaOztxQkFRVCxZQUFBLEdBQWMsU0FBQyxJQUFELEVBQU8sSUFBUDtBQUlWLFlBQUE7UUFBQSxJQUFHLE1BQUEsR0FBUyxNQUFNLENBQUMsY0FBUCxDQUFzQixJQUF0QixDQUFaO1lBQ0ksSUFBRyxvQkFBQSxJQUFnQixDQUFDLENBQUMsVUFBRixDQUFhLE1BQU0sQ0FBQyxXQUFZLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBaEMsQ0FBbkI7Z0JBQ0ksTUFBTSxDQUFDLFdBQVksQ0FBQSxNQUFNLENBQUMsR0FBUCxDQUFuQixDQUErQixJQUFJLENBQUMsTUFBcEM7QUFDQSx1QkFGSjthQURKOztRQUtBLElBQUcsV0FBQSxLQUFlLE1BQU0sQ0FBQyxXQUFXLENBQUMsZ0JBQW5CLENBQW9DLElBQXBDLEVBQTBDLElBQTFDLENBQWxCO0FBQ0ksbUJBREo7O0FBR0EsZ0JBQU8sSUFBUDtBQUFBLGlCQUVTLFNBRlQ7QUFFc0MsdUJBQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQWxDLENBQTBDLElBQUksQ0FBQyxNQUEvQztBQUY3QyxpQkFHUyxNQUhUO0FBR3NDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUMsRUFBRCxFQUFHLENBQUMsSUFBdEIsQ0FBQTtBQUg3QyxpQkFJUyxNQUpUO0FBSXNDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUMsRUFBRCxFQUFHLENBQUMsSUFBdEIsQ0FBQTtBQUo3QyxpQkFLUyxLQUxUO0FBS3NDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBbkIsQ0FBQTtBQUw3QyxpQkFNUyxNQU5UO0FBTXNDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBbkIsQ0FBQTtBQU43QyxpQkFPUyxPQVBUO0FBT3NDLHVCQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBbkIsQ0FBQTtBQVA3QyxpQkFRUyxTQVJUO0FBUXNDLHVCQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVjtBQVI3QyxpQkFTUyxZQVRUO0FBU3NDLHVCQUFPLElBQUksQ0FBQyxNQUFMLENBQVksbUJBQVosRUFBZ0MsTUFBTSxDQUFDLFdBQXZDO0FBVDdDLGlCQVVTLGVBVlQ7QUFVc0MsdUJBQU8sTUFBTSxDQUFDLE1BQVAsQ0FBQTtBQVY3QyxpQkFXUyxvQkFYVDtBQVdzQyx1QkFBTyxnQkFBQSxDQUFBO0FBWDdDLGlCQVlTLFVBWlQ7QUFZc0MsdUJBQU8sY0FBQSxDQUFlLENBQUMsQ0FBaEI7QUFaN0MsaUJBYVMsVUFiVDtBQWFzQyx1QkFBTyxjQUFBLENBQWUsQ0FBQyxDQUFoQjtBQWI3QyxpQkFjUyxPQWRUO0FBY3NDLHVCQUFPLGFBQUEsQ0FBQTtBQWQ3QyxpQkFlUyxrQkFmVDtBQWVzQyx1QkFBTyxRQUFRLENBQUMsUUFBVCxDQUFBO0FBZjdDLGlCQWdCUyxtQkFoQlQ7QUFnQnNDLHVCQUFPLFFBQVEsQ0FBQyxRQUFULENBQUE7QUFoQjdDLGlCQWlCUyxrQkFqQlQ7QUFpQnNDLHVCQUFPLFFBQVEsQ0FBQyxPQUFULENBQUE7QUFqQjdDLGlCQWtCUyxpQkFsQlQ7QUFrQnNDLHVCQUFPLEtBQUssQ0FBQyxjQUFOLENBQUE7QUFsQjdDLGlCQW1CUyxjQW5CVDtBQW1Cc0MsdUJBQU8sVUFBQSxDQUFBO0FBbkI3QyxpQkFvQlMsZ0JBcEJUO0FBb0JzQyx1QkFBTyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUF6QixDQUFBO0FBcEI3QyxpQkFxQlMsbUJBckJUO0FBcUJzQyx1QkFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVosQ0FBcUIsT0FBckI7QUFyQjdDLGlCQXNCUyx1QkF0QlQ7QUFzQnNDLHVCQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBWixDQUFxQixNQUFyQjtBQXRCN0MsaUJBdUJTLGVBdkJUO0FBdUJzQyx1QkFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQVosQ0FBaUIsTUFBakI7QUF2QjdDLGlCQXdCUyxnQkF4QlQ7QUF3QnNDLHVCQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBWixDQUFpQixPQUFqQjtBQXhCN0MsaUJBeUJTLFNBekJUO0FBeUJzQyx1QkFBTyxJQUFJLENBQUMsSUFBTCxDQUFVLFVBQVY7QUF6QjdDLGlCQTBCUyxvQkExQlQ7QUEwQnNDLHVCQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQjtvQkFBQSxNQUFBLEVBQVEsSUFBUjtpQkFBckI7QUExQjdDLGlCQTJCUyx1QkEzQlQ7QUEyQnNDLHVCQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQjtvQkFBQSxTQUFBLEVBQVcsSUFBWDtpQkFBckI7QUEzQjdDLGlCQTRCUyxNQTVCVDtBQTRCc0MsdUJBQU8sSUFBSSxDQUFDLElBQUwsQ0FBVSxVQUFWO0FBNUI3QyxpQkE2QlMsVUE3QlQ7QUE2QnNDLHVCQUFPLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVjtBQTdCN0MsaUJBOEJTLGFBOUJUO0FBOEJzQyx1QkFBTyxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVY7QUE5QjdDLGlCQStCUyxRQS9CVDtBQStCc0MsdUJBQU8sSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWO0FBL0I3QyxpQkFpQ1MscUJBakNUO0FBaUNzQyx1QkFBTyxJQUFJLENBQUMsSUFBTCxDQUFVLGtCQUFWO0FBakM3QyxpQkFrQ1Msa0JBbENUO0FBa0NzQyx1QkFBTyxJQUFJLENBQUMsSUFBTCxDQUFVLGdCQUFWO0FBbEM3QyxpQkFtQ1MscUJBbkNUO0FBbUNzQyx1QkFBTyxJQUFJLENBQUMsV0FBTCxDQUFpQixhQUFqQjtBQW5DN0MsaUJBb0NTLFlBcENUO2dCQXFDUSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsYUFBakIsRUFBK0IsRUFBL0I7Z0JBQ0EsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFoQixDQUFBO0FBQ0E7QUF2Q1IsaUJBd0NTLGFBeENUO0FBd0NzQyx1QkFBTyxJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBc0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQWIsQ0FBdEIsRUFBMEM7b0JBQUEsTUFBQSxFQUFPLElBQVA7aUJBQTFDO0FBeEM3QyxpQkF5Q1MsZUF6Q1Q7Z0JBeUNzQyxJQUFBLEdBQU8sSUFBQyxDQUFBO0FBekM5QztlQTZDQSx5Q0FBTSxJQUFOLEVBQVksSUFBWjtJQXpEVTs7OztHQTNERzs7QUE0SHJCLE1BQU0sQ0FBQyxLQUFQLEdBQWUsSUFBSSxLQUFKLENBQVUsT0FBVixFQUFrQjtJQUFBLFNBQUEsRUFBVSxHQUFWO0NBQWxCOztBQUNmLE1BQU0sQ0FBQyxLQUFQLEdBQWU7O0FBRWYsSUFBSSxDQUFDLGVBQUwsQ0FBcUIsRUFBckI7O0FBRUEsU0FBQSxHQUFZLFNBQUE7SUFFUixJQUFBLENBQUssa0JBQUw7SUFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLE9BQVY7SUFDQSxNQUFNLENBQUMsOEJBQVAsQ0FBQTtXQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBYixDQUFBO0FBTFE7O0FBT1osVUFBQSxHQUFhLFNBQUE7QUFFVCxRQUFBO0lBQUEsSUFBQSxDQUFLLHNCQUFMO0lBQ0EsSUFBRyxNQUFBLEdBQVMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLFFBQWpCLENBQVo7UUFDSSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVgsQ0FBcUIsTUFBckIsRUFESjs7SUFHQSxJQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixVQUFqQixDQUFIO2VBQ0ksSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLFVBQXZCLEVBREo7O0FBTlM7O0FBZWIsSUFBSSxDQUFDLEVBQUwsQ0FBUSxtQkFBUixFQUE0QixTQUFDLEdBQUQsRUFBTSxHQUFOO0lBQ3hCLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixHQUF6QixFQUE4QixHQUE5QjtXQUNBLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBZCxDQUFBO0FBRndCLENBQTVCOztBQUdBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUF1QixTQUFBO1dBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxRQUFaO0FBQUgsQ0FBdkI7O0FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQXVCLFNBQUE7V0FBRyxJQUFJLENBQUMsTUFBTCxDQUFZLG1CQUFaLEVBQWdDLE1BQU0sQ0FBQyxXQUF2QztBQUFILENBQXZCOztBQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUF1QixTQUFBO1dBQUcsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLE9BQXZCO0FBQUgsQ0FBdkI7O0FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxXQUFSLEVBQXVCLFNBQUE7V0FBRyxTQUFBLENBQUE7QUFBSCxDQUF2Qjs7QUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGFBQVIsRUFBc0IsU0FBQyxNQUFEO0lBQ2xCLE1BQU0sQ0FBQyxZQUFQLENBQW9CLE1BQU0sQ0FBQyxJQUEzQjtJQUNBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO0lBQ3JCLElBQThCLE1BQU0sQ0FBQyxJQUFQLEtBQWUsb0JBQTdDO2VBQUEsTUFBTSxDQUFDLFVBQVAsR0FBb0IsT0FBcEI7O0FBSGtCLENBQXRCOztBQUtBLElBQUksQ0FBQyxFQUFMLENBQVEsVUFBUixFQUFtQixTQUFDLElBQUQ7V0FDZixJQUFBLENBQUssNkJBQUEsR0FBOEIsSUFBbkM7QUFEZSxDQUFuQjs7QUFHQSxJQUFJLENBQUMsRUFBTCxDQUFRLFNBQVIsRUFBa0IsU0FBQTtXQUFHLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixTQUFqQjtBQUFILENBQWxCOztBQUVBLElBQUksQ0FBQyxFQUFMLENBQVEsTUFBUixFQUFlLFNBQUMsR0FBRCxFQUFNLElBQU4sRUFBWSxJQUFaO1dBQXFCLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBWCxFQUFnQixNQUFoQixFQUF1QixNQUFNLENBQUMsS0FBOUIsRUFBcUMsSUFBckMsRUFBMkMsSUFBM0M7QUFBckIsQ0FBZjs7QUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLGlCQUFSLEVBQTBCLFNBQUE7V0FDdEIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxhQUFYLEVBQXlCLE1BQU0sQ0FBQyxLQUFoQyxFQUNJO1FBQUEsS0FBQSxFQUFZLE1BQU0sQ0FBQyxLQUFQLENBQUEsQ0FBWjtRQUNBLE9BQUEsRUFBWSxNQUFNLENBQUMsT0FBUCxDQUFBLENBRFo7UUFFQSxJQUFBLEVBQVksTUFBTSxDQUFDLFVBQVAsQ0FBQSxDQUZaO1FBR0EsVUFBQSxFQUFZLE1BQU0sQ0FBQyxVQUFQLENBQUEsQ0FIWjtRQUlBLFVBQUEsRUFBWSxNQUFNLENBQUMsVUFBUCxDQUFBLENBSlo7S0FESjtBQURzQixDQUExQjs7QUFjQSxNQUFNLENBQUMsY0FBUCxHQUF3QixTQUFDLENBQUQ7QUFFcEIsWUFBTyxDQUFQO0FBQUEsYUFDUyxRQURUO21CQUN5QjtBQUR6QixhQUVTLFNBRlQ7QUFBQSxhQUVtQixhQUZuQjttQkFFc0M7QUFGdEMsYUFHUyxVQUhUO21CQUd5QjtBQUh6QjttQkFJUztBQUpUO0FBRm9COztBQWN4QixPQUFBLEdBQVUsU0FBQTtJQUVOLElBQUksQ0FBQyxJQUFMLENBQVUsYUFBVjtJQUNBLE1BQU0sQ0FBQyxPQUFQLENBQWUsRUFBZjtJQUdBLElBQUcsT0FBTyxDQUFDLGFBQVIsQ0FBQSxDQUF1QixDQUFDLE1BQXhCLEdBQWlDLENBQXBDO2VBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFiLENBQUEsRUFESjs7QUFOTTs7QUFlVixNQUFNLENBQUMsTUFBUCxHQUFnQixTQUFBO0lBRVosS0FBSyxDQUFDLE9BQU4sQ0FBQTtXQUNBLElBQUksQ0FBQyxNQUFMLENBQUE7QUFIWTs7QUFXaEIsU0FBQSxHQUFZLFNBQUE7SUFFUixTQUFBLENBQUE7SUFDQSxjQUFBLENBQUE7V0FDQSxJQUFJLENBQUMsTUFBTCxDQUFZLFdBQVosRUFBd0I7UUFBQSxLQUFBLEVBQU0sTUFBTSxDQUFDLEtBQWI7UUFBb0IsSUFBQSxFQUFLLE1BQU0sQ0FBQyxXQUFoQztLQUF4QjtBQUpROztBQVlaLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLFNBQUE7SUFHZCxLQUFLLENBQUMsT0FBTixDQUFBO0lBQ0EsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFYLENBQW1CLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBWCxDQUFBLENBQW5CO0lBQ0EsSUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsWUFBakIsRUFBOEIsS0FBOUIsQ0FBSDtlQUNJLE1BQU0sQ0FBQyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLEdBQXhCLEVBREo7O0FBTGM7O0FBUWxCLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFnQixTQUFDLENBQUQ7SUFFWixXQUFXLENBQUMsT0FBWixDQUFBO0lBQ0EsUUFBUSxDQUFDLE9BQVQsQ0FBQTtJQUNBLFdBQVcsQ0FBQyxPQUFaLENBQUE7V0FDQSxNQUFNLENBQUMsT0FBUCxDQUFBO0FBTFksQ0FBaEI7O0FBYUEsZ0JBQUEsR0FBbUIsU0FBQTtBQUVmLFFBQUE7SUFBQSxJQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixhQUFBLEdBQWMsTUFBTSxDQUFDLFdBQXRDLEVBQW9ELEtBQXBELENBQUg7UUFDSSxNQUFNLENBQUMsZ0JBQVAsQ0FBQTtRQUNBLGlCQUFBLEdBQW9CLEtBRnhCOztJQUlBLElBQUcsQ0FBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsWUFBakIsRUFBOEIsS0FBOUIsQ0FBUDtRQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixZQUFqQixFQUE4QixJQUE5QjtRQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLElBQWxCLEVBRko7S0FBQSxNQUFBO1FBSUksTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLFlBQWpCLEVBQThCLEtBQTlCO1FBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsS0FBbEIsRUFMSjs7SUFPQSxJQUFHLGlCQUFIO2VBQ0ksTUFBTSxDQUFDLGdCQUFQLENBQUEsRUFESjs7QUFiZTs7QUFzQm5CLFdBQUEsR0FBYyxTQUFDLENBQUQ7SUFFVixJQUFzQyxDQUFJLENBQUMsQ0FBQyxRQUFGLENBQVcsQ0FBWCxDQUExQztRQUFBLENBQUEsR0FBSSxLQUFLLENBQUMsR0FBTixDQUFVLGdCQUFWLEVBQTJCLEVBQTNCLEVBQUo7O0lBQ0EsQ0FBQSxHQUFJLEtBQUEsQ0FBTSxDQUFOLEVBQVEsR0FBUixFQUFZLENBQVo7SUFFSixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsVUFBakIsRUFBNEIsQ0FBNUI7SUFDQSxNQUFNLENBQUMsV0FBUCxDQUFtQixDQUFuQjtJQUNBLElBQUcsMEJBQUg7ZUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLFVBQVYsRUFBcUIsTUFBTSxDQUFDLFdBQTVCLEVBQXlDO1lBQUEsTUFBQSxFQUFPLElBQVA7U0FBekMsRUFESjs7QUFQVTs7QUFVZCxjQUFBLEdBQWlCLFNBQUMsQ0FBRDtBQUViLFFBQUE7SUFBQSxJQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBWixJQUF3QixFQUFoQztRQUNJLENBQUEsR0FBSSxFQURSO0tBQUEsTUFFSyxJQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBWixJQUF3QixFQUEzQjtRQUNELENBQUEsR0FBSSxHQURIO0tBQUEsTUFFQSxJQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBWixJQUF3QixFQUEzQjtRQUNELENBQUEsR0FBSSxFQURIO0tBQUEsTUFBQTtRQUdELENBQUEsR0FBSSxFQUhIOztXQUlMLFdBQUEsQ0FBWSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVosR0FBdUIsQ0FBQSxHQUFFLENBQXJDO0FBVmE7O0FBWWpCLGFBQUEsR0FBZ0IsU0FBQTtBQUVaLFFBQUE7SUFBQSxlQUFBLEdBQWtCLEtBQUssQ0FBQyxHQUFOLENBQVUsZ0JBQVYsRUFBMkIsRUFBM0I7SUFDbEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLFVBQWpCLEVBQTRCLGVBQTVCO1dBQ0EsV0FBQSxDQUFZLGVBQVo7QUFKWTs7QUFNaEIsVUFBQSxHQUFhLFNBQUE7QUFFVCxRQUFBO0lBQUEsSUFBVSxNQUFNLENBQUMsU0FBUCxLQUFvQixPQUE5QjtBQUFBLGVBQUE7O0lBQ0EsRUFBQSxHQUFLLE1BQU0sQ0FBQztJQUNaLElBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFqQixDQUE0QixFQUFFLENBQUMsSUFBL0IsQ0FBSDtRQUNJLElBQUEsR0FBTyxFQUFFLENBQUMsY0FBSCxDQUFrQixNQUFNLENBQUMsU0FBekIsQ0FBbUMsQ0FBQyxVQUFwQyxDQUFBLEVBRFg7S0FBQSxNQUFBO1FBR0ksSUFBQSxHQUFPLE1BQU0sQ0FBQyxZQUhsQjs7V0FJQSxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsSUFBdkI7QUFSUzs7QUFnQmIsQ0FBQTtJQUFBLFNBQUEsRUFBVyxTQUFBO1FBRVAsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsQ0FBdkI7ZUFDQSxNQUFNLENBQUMsT0FBUCxDQUFBO0lBSE8sQ0FBWDtJQUtBLFVBQUEsRUFBWSxTQUFDLENBQUQ7QUFFUixZQUFBO1FBQUEsQ0FBQSxHQUFJLFFBQVEsQ0FBQyxhQUFULENBQUE7UUFDSixDQUFBLElBQUssQ0FBQSxHQUFFLENBQUEsR0FBRTtRQUNULENBQUEsR0FBSSxLQUFBLENBQU0sSUFBTixFQUFXLElBQVgsRUFBZ0IsQ0FBaEI7UUFDSixRQUFRLENBQUMsYUFBVCxDQUF1QixDQUF2QjtlQUNBLE1BQU0sQ0FBQyxPQUFQLENBQUE7SUFOUSxDQUxaO0NBQUE7O0FBbUJBLE1BQU0sQ0FBQyxNQUFQLEdBQWlCLFNBQUMsS0FBRDtXQUFXLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixLQUFyQjtBQUFYOztBQUNqQixNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLEtBQUQ7SUFDYixJQUFJLENBQUMsSUFBTCxDQUFVLFVBQVYsRUFBcUIsSUFBckI7SUFDQSxJQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsU0FBdkIsS0FBb0MsTUFBdkM7UUFDSSxJQUFHLEtBQUssQ0FBQyxhQUFOLENBQUEsQ0FBSDttQkFDSSxLQUFLLENBQUMsS0FBTixDQUFZLFFBQVosRUFESjtTQUFBLE1BQUE7bUJBR0ksS0FBSyxDQUFDLEtBQU4sQ0FBWSxvQkFBWixFQUhKO1NBREo7O0FBRmE7O0FBUWpCLE1BQU0sQ0FBQyxZQUFQLEdBQXNCLFNBQUMsSUFBRDtJQUNsQixJQUFBLENBQUssY0FBTCxFQUFvQixJQUFwQjtXQUNBLE1BQU0sQ0FBQyxTQUFQLEdBQW1CO0FBRkQ7O0FBVXRCLE9BQUEsR0FBVSxTQUFDLEtBQUQsRUFBUSxJQUFSO0FBRU4sUUFBQTtJQUFBLElBQVUsQ0FBSSxLQUFkO0FBQUEsZUFBQTs7SUFFRSxjQUFGLEVBQU8sY0FBUCxFQUFZLGtCQUFaLEVBQW1CLGdCQUFuQixFQUF5QjtJQUV6QixJQUEyQixXQUFBLEtBQWUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxzQkFBbkIsQ0FBMEMsR0FBMUMsRUFBK0MsR0FBL0MsRUFBb0QsS0FBcEQsRUFBMkQsS0FBM0QsQ0FBMUM7QUFBQSxlQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQVA7O0lBQ0EsSUFBMkIsV0FBQSxLQUFlLFFBQVEsQ0FBQyxzQkFBVCxDQUFnQyxHQUFoQyxFQUFxQyxHQUFyQyxFQUEwQyxLQUExQyxFQUFpRCxLQUFqRCxDQUExQztBQUFBLGVBQU8sU0FBQSxDQUFVLEtBQVYsRUFBUDs7QUFFQSxTQUFTLDBCQUFUO1FBQ0ksSUFBRyxLQUFBLEtBQVMsQ0FBQSxNQUFBLEdBQU8sQ0FBUCxDQUFaO0FBQ0ksbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBSSxDQUFDLE1BQUwsQ0FBWSxnQkFBWixFQUE2QixDQUE3QixDQUFqQixFQURYOztBQURKO0FBSUEsWUFBTyxLQUFQO0FBQUEsYUFDUyxJQURUO0FBQ21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLFVBQUEsQ0FBQSxDQUFqQjtBQUQxQyxhQUVTLGlCQUZUO0FBRW1DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBRjFDLGFBR1MsaUJBSFQ7QUFHbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFDLENBQWIsQ0FBakI7QUFIMUMsYUFJUyxpQkFKVDtBQUltQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQWpCO0FBSjFDLGFBS1MsZUFMVDtBQUttQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQsQ0FBakI7QUFMMUM7QUFiTTs7QUFvQlYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWdCLE9BQWhCOztBQUVBLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMjI1xuXG57IF8sIGFyZ3MsIGNsYW1wLCBrbG9nLCBwb3N0LCBwcmVmcywgc2NoZW1lLCBzdGFzaCwgc3RvcEV2ZW50LCBzdG9yZSwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cblNwbGl0ICAgICAgID0gcmVxdWlyZSAnLi9zcGxpdCdcblRlcm1pbmFsICAgID0gcmVxdWlyZSAnLi90ZXJtaW5hbCdcblRhYnMgICAgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuVGl0bGViYXIgICAgPSByZXF1aXJlICcuL3RpdGxlYmFyJ1xuSW5mbyAgICAgICAgPSByZXF1aXJlICcuL2luZm8nXG5GaWxlSGFuZGxlciA9IHJlcXVpcmUgJy4vZmlsZWhhbmRsZXInXG5GaWxlV2F0Y2hlciA9IHJlcXVpcmUgJy4uL3Rvb2xzL3dhdGNoZXInXG5FZGl0b3IgICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9lZGl0b3InXG5Db21tYW5kbGluZSA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmRsaW5lJ1xuRmlsZUVkaXRvciAgPSByZXF1aXJlICcuLi9lZGl0b3IvZmlsZWVkaXRvcidcbk5hdmlnYXRlICAgID0gcmVxdWlyZSAnLi4vbWFpbi9uYXZpZ2F0ZSdcbkZQUyAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZnBzJ1xuQ1dEICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9jd2QnXG5zY2hlbWUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcbnByb2plY3RzICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcHJvamVjdHMnXG5lbGVjdHJvbiAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5cbmVkaXRvciAgICAgID0gbnVsbFxubWFpbm1lbnUgICAgPSBudWxsXG50ZXJtaW5hbCAgICA9IG51bGxcbmNvbW1hbmRsaW5lID0gbnVsbFxudGl0bGViYXIgICAgPSBudWxsXG50YWJzICAgICAgICA9IG51bGxcbmZpbGVoYW5kbGVyID0gbnVsbFxuZmlsZXdhdGNoZXIgPSBudWxsXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyB3aW5cbiAgICBcbiAgICBAOiAtPlxuXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBtZW51VGVtcGxhdGU6ICAgcmVxdWlyZSAnLi9tZW51J1xuICAgICAgICAgICAgcGtnOiAgICAgICAgICAgIHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIG1lbnU6ICAgICAgICAgICAnLi4vLi4vY29mZmVlL21lbnUubm9vbidcbiAgICAgICAgICAgIGljb246ICAgICAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgc2NoZW1lOiAgICAgICAgIGZhbHNlXG4gICAgXG4gICAgICAgIHdpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je0BpZH1cIiBzZXBhcmF0b3I6J3wnXG4gICAgICAgICAgICBcbiAgICAgICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICAgICAgZmlsZXdhdGNoZXIgPSB3aW5kb3cuZmlsZXdhdGNoZXIgPSBuZXcgRmlsZVdhdGNoZXJcbiAgICAgICAgdGFicyAgICAgICAgPSB3aW5kb3cudGFicyAgICAgICAgPSBuZXcgVGFicyB3aW5kb3cudGl0bGViYXIuZWxlbVxuICAgICAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgICAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgICAgIHNwbGl0ICAgICAgID0gd2luZG93LnNwbGl0ICAgICAgID0gbmV3IFNwbGl0KClcbiAgICAgICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgICAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgICAgIGNvbW1hbmRsaW5lID0gd2luZG93LmNvbW1hbmRsaW5lID0gbmV3IENvbW1hbmRsaW5lICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgICAgIGN3ZCAgICAgICAgID0gd2luZG93LmN3ZCAgICAgICAgID0gbmV3IENXRCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgZWRpdG9yLm5hbWVcbiAgICBcbiAgICAgICAgcmVzdG9yZVdpbigpXG4gICAgICAgIHNjaGVtZS5zZXQgcHJlZnMuZ2V0ICdzY2hlbWUnICdkYXJrJ1xuICAgIFxuICAgICAgICB0ZXJtaW5hbC5vbiAnZmlsZVNlYXJjaFJlc3VsdENoYW5nZScgKGZpbGUsIGxpbmVDaGFuZ2UpIC0+ICMgc2VuZHMgY2hhbmdlcyB0byBhbGwgd2luZG93c1xuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycgZmlsZSwgW2xpbmVDaGFuZ2VdXG4gICAgXG4gICAgICAgIGVkaXRvci5vbiAnY2hhbmdlZCcgKGNoYW5nZUluZm8pIC0+XG4gICAgICAgICAgICByZXR1cm4gaWYgY2hhbmdlSW5mby5mb3JlaWduXG4gICAgICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcG9zdC50b090aGVyV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBlZGl0b3IuY3VycmVudEZpbGUsIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgICAgIG5hdmlnYXRlLmFkZEZpbGVQb3MgZmlsZTogZWRpdG9yLmN1cnJlbnRGaWxlLCBwb3M6IGVkaXRvci5jdXJzb3JQb3MoKVxuICAgIFxuICAgICAgICBzID0gd2luZG93LnN0YXNoLmdldCAnZm9udFNpemUnIHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgICAgIGVkaXRvci5zZXRGb250U2l6ZSBzIGlmIHNcbiAgICBcbiAgICAgICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCdcbiAgICAgICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUgMFxuICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ3Jlc3RvcmUnXG4gICAgICAgIGVkaXRvci5mb2N1cygpXG5cbiAgICBvbk1vdmVkOiAoYm91bmRzKSA9PiB3aW5kb3cuc3Rhc2guc2V0ICdib3VuZHMnIGJvdW5kc1xuICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChuYW1lLCBhcmdzKSA9PlxuICAgIFxuICAgICAgICAjIGtsb2cgJ2tvLndpbmRvdy5vbk1lbnVBY3Rpb24nIG5hbWUsIGFyZ3NcbiAgICAgICAgXG4gICAgICAgIGlmIGFjdGlvbiA9IEVkaXRvci5hY3Rpb25XaXRoTmFtZSBuYW1lXG4gICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XSBhcmdzLmFjdGFyZ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuaGFuZGxlTWVudUFjdGlvbiBuYW1lLCBhcmdzXG4gICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgc3dpdGNoIG5hbWVcbiAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgYXJncy5hY3RhcmdcbiAgICAgICAgICAgIHdoZW4gJ1VuZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICAgICAgd2hlbiAnQ29weScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY29weSgpXG4gICAgICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgU2NoZW1lJyAgICAgICAgIHRoZW4gcmV0dXJuIHNjaGVtZS50b2dnbGUoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgICAgIHdoZW4gJ0luY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgLTFcbiAgICAgICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgICAgICB3aGVuICdPcGVuIFdpbmRvdyBMaXN0JyAgICAgIHRoZW4gcmV0dXJuIHRpdGxlYmFyLnNob3dMaXN0KClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEJhY2t3YXJkJyAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuYmFja3dhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ01heGltaXplIEVkaXRvcicgICAgICAgdGhlbiByZXR1cm4gc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgICAgICB0aGVuIHJldHVybiBhZGRUb1NoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgTmV4dCBUYWInICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBQcmV2aW91cyBUYWInIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgUmlnaHQnICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4uLi4nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3VGFiOiB0cnVlXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBXaW5kb3cuLi4nIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnU2F2ZScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFzIC4uLicgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGVBcydcbiAgICAgICAgICAgIHdoZW4gJ1JldmVydCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdyZWxvYWRGaWxlJ1xuICAgICAgICAgICAgIyB3aGVuICdSZWxvYWQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBUYWIgb3IgV2luZG93JyAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VUYWJPcldpbmRvdydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFRhYnMnICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZU90aGVyVGFicydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFdpbmRvd3MnICAgdGhlbiByZXR1cm4gcG9zdC50b090aGVyV2lucyAnY2xvc2VXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbGVhciBMaXN0JyAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICAgICAgICAgIHdpbmRvdy50aXRsZWJhci5yZWZyZXNoTWVudSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycgW3ByZWZzLnN0b3JlLmZpbGVdLCBuZXdUYWI6dHJ1ZVxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgICAgICB0aGVuIGFyZ3MgPSBAaWRcbiAgICBcbiAgICAgICAgIyBsb2cgXCJ1bmhhbmRsZWQgbWVudSBhY3Rpb24hIHBvc3RpbmcgdG8gbWFpbiAnI3tuYW1lfScgYXJnczpcIiwgYXJnc1xuICAgIFxuICAgICAgICBzdXBlciBuYW1lLCBhcmdzXG4gICAgICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuXG53aW5kb3cuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJyBzZXBhcmF0b3I6J3wnXG53aW5kb3cucHJlZnMgPSBwcmVmc1xuXG5wb3N0LnNldE1heExpc3RlbmVycyAyMFxuXG5zYXZlU3Rhc2ggPSAtPlxuXG4gICAga2xvZyAnd2luZG93LnNhdmVTdGFzaCdcbiAgICBwb3N0LmVtaXQgJ3N0YXNoJ1xuICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgIHdpbmRvdy5zdGFzaC5zYXZlKCkgIFxuXG5yZXN0b3JlV2luID0gLT5cblxuICAgIGtsb2cgJ2tvLndpbmRvdy5yZXN0b3JlV2luJ1xuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luZG93Lndpbi5zZXRCb3VuZHMgYm91bmRzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdkZXZUb29scydcbiAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnZGV2dG9vbHMnXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbiAnc2luZ2xlQ3Vyc29yQXRQb3MnIChwb3MsIG9wdCkgLT4gIyBicm93c2VyIGRvdWJsZSBjbGljayBhbmQgbmV3VGFiV2l0aEZpbGUgOmw6Y1xuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdCBcbiAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbnBvc3Qub24gJ2ZvY3VzRWRpdG9yJyAgLT4gc3BsaXQuZm9jdXMgJ2VkaXRvcidcbnBvc3Qub24gJ2Nsb25lRmlsZScgICAgLT4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnQ2xvc2UnXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxucG9zdC5vbiAnZGV2VG9vbHMnIChvcGVuKSAtPiBcbiAgICBrbG9nIFwia28ud2luZG93LnBvc3Qub24gZGV2VG9vbHMgI3tvcGVufVwiXG5cbnBvc3Qub24gJ21haW5sb2cnIC0+IGtsb2cuYXBwbHkga2xvZywgYXJndW1lbnRzXG5cbnBvc3Qub24gJ3BpbmcnICh3SUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd0lELCAncG9uZycgd2luZG93LndpbklELCBhcmdBLCBhcmdCXG5wb3N0Lm9uICdwb3N0RWRpdG9yU3RhdGUnIC0+XG4gICAgcG9zdC50b0FsbCAnZWRpdG9yU3RhdGUnIHdpbmRvdy53aW5JRCxcbiAgICAgICAgbGluZXM6ICAgICAgZWRpdG9yLmxpbmVzKClcbiAgICAgICAgY3Vyc29yczogICAgZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICBtYWluOiAgICAgICBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHNlbGVjdGlvbnM6IGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgaGlnaGxpZ2h0czogZWRpdG9yLmhpZ2hsaWdodHMoKVxuXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxud2luZG93LmVkaXRvcldpdGhOYW1lID0gKG4pIC0+XG5cbiAgICBzd2l0Y2ggblxuICAgICAgICB3aGVuICdlZGl0b3InICAgdGhlbiBlZGl0b3JcbiAgICAgICAgd2hlbiAnY29tbWFuZCcgJ2NvbW1hbmRsaW5lJyB0aGVuIGNvbW1hbmRsaW5lXG4gICAgICAgIHdoZW4gJ3Rlcm1pbmFsJyB0aGVuIHRlcm1pbmFsXG4gICAgICAgIGVsc2UgZWRpdG9yXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbkNsb3NlID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc2F2ZUNoYW5nZXMnXG4gICAgZWRpdG9yLnNldFRleHQgJydcbiAgICAjIGVkaXRvci5zdG9wV2F0Y2hlcigpXG5cbiAgICBpZiBCcm93c2VyLmdldEFsbFdpbmRvd3MoKS5sZW5ndGggPiAxXG4gICAgICAgIHdpbmRvdy5zdGFzaC5jbGVhcigpXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5kb3cub25sb2FkID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIGluZm8ucmVsb2FkKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG5yZWxvYWRXaW4gPSAtPlxuXG4gICAgc2F2ZVN0YXNoKClcbiAgICBjbGVhckxpc3RlbmVycygpXG4gICAgcG9zdC50b01haW4gJ3JlbG9hZFdpbicgd2luSUQ6d2luZG93LndpbklELCBmaWxlOmVkaXRvci5jdXJyZW50RmlsZVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG53aW5kb3cub25yZXNpemUgPSAtPlxuXG4gICAgIyBrbG9nICdrby53aW5kb3cub25yZXNpemUnXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgd2luZG93Lndpbi5vbk1vdmVkIHdpbmRvdy53aW4uZ2V0Qm91bmRzKClcbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAyMDBcblxucG9zdC5vbiAnc3BsaXQnIChzKSAtPlxuXG4gICAgZmlsZWJyb3dzZXIucmVzaXplZCgpXG4gICAgdGVybWluYWwucmVzaXplZCgpXG4gICAgY29tbWFuZGxpbmUucmVzaXplZCgpXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxudG9nZ2xlQ2VudGVyVGV4dCA9IC0+XG5cbiAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwiaW52aXNpYmxlc3wje2VkaXRvci5jdXJyZW50RmlsZX1cIiBmYWxzZVxuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG4gICAgICAgIHJlc3RvcmVJbnZpc2libGVzID0gdHJ1ZVxuXG4gICAgaWYgbm90IHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIHRydWVcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZVxuICAgIGVsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgZmFsc2VcblxuICAgIGlmIHJlc3RvcmVJbnZpc2libGVzXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG5zZXRGb250U2l6ZSA9IChzKSAtPlxuXG4gICAgcyA9IHByZWZzLmdldCgnZWRpdG9yRm9udFNpemUnIDE5KSBpZiBub3QgXy5pc0Zpbml0ZSBzXG4gICAgcyA9IGNsYW1wIDggMTAwIHNcblxuICAgIHdpbmRvdy5zdGFzaC5zZXQgXCJmb250U2l6ZVwiIHNcbiAgICBlZGl0b3Iuc2V0Rm9udFNpemUgc1xuICAgIGlmIGVkaXRvci5jdXJyZW50RmlsZT9cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuXG5jaGFuZ2VGb250U2l6ZSA9IChkKSAtPlxuXG4gICAgaWYgICAgICBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAzMFxuICAgICAgICBmID0gNFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gNTBcbiAgICAgICAgZiA9IDEwXG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAyMFxuICAgICAgICBmID0gMlxuICAgIGVsc2VcbiAgICAgICAgZiA9IDFcbiAgICBzZXRGb250U2l6ZSBlZGl0b3Iuc2l6ZS5mb250U2l6ZSArIGYqZFxuXG5yZXNldEZvbnRTaXplID0gLT5cblxuICAgIGRlZmF1bHRGb250U2l6ZSA9IHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgd2luZG93LnN0YXNoLnNldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuICAgIHNldEZvbnRTaXplIGRlZmF1bHRGb250U2l6ZVxuXG5hZGRUb1NoZWxmID0gLT5cblxuICAgIHJldHVybiBpZiB3aW5kb3cubGFzdEZvY3VzID09ICdzaGVsZidcbiAgICBmYiA9IHdpbmRvdy5maWxlYnJvd3NlclxuICAgIGlmIHdpbmRvdy5sYXN0Rm9jdXMuc3RhcnRzV2l0aCBmYi5uYW1lXG4gICAgICAgIHBhdGggPSBmYi5jb2x1bW5XaXRoTmFtZSh3aW5kb3cubGFzdEZvY3VzKS5hY3RpdmVQYXRoKClcbiAgICBlbHNlXG4gICAgICAgIHBhdGggPSBlZGl0b3IuY3VycmVudEZpbGVcbiAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhcblxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jICAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgICAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxucmVzZXRab29tOiAtPlxuXG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciAxXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG5jaGFuZ2Vab29tOiAoZCkgLT5cbiAgICBcbiAgICB6ID0gd2ViZnJhbWUuZ2V0Wm9vbUZhY3RvcigpXG4gICAgeiAqPSAxK2QvMjBcbiAgICB6ID0gY2xhbXAgMC4zNiA1LjIzIHpcbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIHpcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG53aW5kb3cub25ibHVyICA9IChldmVudCkgLT4gcG9zdC5lbWl0ICd3aW5Gb2N1cycgZmFsc2VcbndpbmRvdy5vbmZvY3VzID0gKGV2ZW50KSAtPlxuICAgIHBvc3QuZW1pdCAnd2luRm9jdXMnIHRydWVcbiAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSA9PSAnYm9keSdcbiAgICAgICAgaWYgc3BsaXQuZWRpdG9yVmlzaWJsZSgpXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG53aW5kb3cuc2V0TGFzdEZvY3VzID0gKG5hbWUpIC0+IFxuICAgIGtsb2cgJ3NldExhc3RGb2N1cycgbmFtZVxuICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBuYW1lXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG5vbkNvbWJvID0gKGNvbWJvLCBpbmZvKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuXG4gICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IH0gPSBpbmZvXG5cbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gdGl0bGViYXIuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICBmb3IgaSBpbiBbMS4uOV1cbiAgICAgICAgaWYgY29tYm8gaXMgXCJhbHQrI3tpfVwiXG4gICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBwb3N0LnRvTWFpbiAnYWN0aXZhdGVXaW5kb3cnIGlcblxuICAgIHN3aXRjaCBjb21ib1xuICAgICAgICB3aGVuICdmMycgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc2NyZWVuU2hvdCgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrPScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSArMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCswJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEByZXNldFpvb20oKVxuICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt5JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcblxucG9zdC5vbiAnY29tYm8nIG9uQ29tYm9cblxubmV3IFdpbmRvd1xuIl19
//# sourceURL=../../coffee/win/window.coffee
// koffee 1.19.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK2JBQUE7SUFBQTs7OztBQVFBLE1BQXdFLE9BQUEsQ0FBUSxLQUFSLENBQXhFLEVBQUUsU0FBRixFQUFLLGlCQUFMLEVBQVksZUFBWixFQUFrQixlQUFsQixFQUF3QixpQkFBeEIsRUFBK0IsbUJBQS9CLEVBQXVDLGlCQUF2QyxFQUE4Qyx5QkFBOUMsRUFBeUQsaUJBQXpELEVBQWdFOztBQUVoRSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2QsV0FBQSxHQUFjOztB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QztBQUFBLGVBQU8sU0FBQSxDQUFVLEtBQVYsRUFBUDs7QUFFQSxTQUFTLDBCQUFUO1FBQ0ksSUFBRyxLQUFBLEtBQVMsQ0FBQSxNQUFBLEdBQU8sQ0FBUCxDQUFaO0FBQ0ksbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBSSxDQUFDLE1BQUwsQ0FBWSxnQkFBWixFQUE2QixDQUE3QixDQUFqQixFQURYOztBQURKO0FBSUEsWUFBTyxLQUFQO0FBQUEsYUFDUyxJQURUO0FBQ21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLFVBQUEsQ0FBQSxDQUFqQjtBQUQxQyxhQUVTLGlCQUZUO0FBRW1DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBRjFDLGFBR1MsaUJBSFQ7QUFHbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFDLENBQWIsQ0FBakI7QUFIMUMsYUFJUyxpQkFKVDtBQUltQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQWpCO0FBSjFDLGFBS1MsZUFMVDtBQUttQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQsQ0FBakI7QUFMMUM7QUFiTTs7QUFvQlYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWdCLE9BQWhCOztBQUVBLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMjI1xuXG57IF8sIGNsYW1wLCBrbG9nLCBwb3N0LCBwcmVmcywgc2NoZW1lLCBzdGFzaCwgc3RvcEV2ZW50LCBzdG9yZSwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cblNwbGl0ICAgICAgID0gcmVxdWlyZSAnLi9zcGxpdCdcblRlcm1pbmFsICAgID0gcmVxdWlyZSAnLi90ZXJtaW5hbCdcblRhYnMgICAgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuVGl0bGViYXIgICAgPSByZXF1aXJlICcuL3RpdGxlYmFyJ1xuSW5mbyAgICAgICAgPSByZXF1aXJlICcuL2luZm8nXG5GaWxlSGFuZGxlciA9IHJlcXVpcmUgJy4vZmlsZWhhbmRsZXInXG5GaWxlV2F0Y2hlciA9IHJlcXVpcmUgJy4uL3Rvb2xzL3dhdGNoZXInXG5FZGl0b3IgICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9lZGl0b3InXG5Db21tYW5kbGluZSA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmRsaW5lJ1xuRmlsZUVkaXRvciAgPSByZXF1aXJlICcuLi9lZGl0b3IvZmlsZWVkaXRvcidcbk5hdmlnYXRlICAgID0gcmVxdWlyZSAnLi4vbWFpbi9uYXZpZ2F0ZSdcbkZQUyAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZnBzJ1xuQ1dEICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9jd2QnXG5zY2hlbWUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcbnByb2plY3RzICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcHJvamVjdHMnXG5lbGVjdHJvbiAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5cbmVkaXRvciAgICAgID0gbnVsbFxubWFpbm1lbnUgICAgPSBudWxsXG50ZXJtaW5hbCAgICA9IG51bGxcbmNvbW1hbmRsaW5lID0gbnVsbFxudGl0bGViYXIgICAgPSBudWxsXG50YWJzICAgICAgICA9IG51bGxcbmZpbGVoYW5kbGVyID0gbnVsbFxuZmlsZXdhdGNoZXIgPSBudWxsXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyB3aW5cbiAgICBcbiAgICBAOiAtPlxuXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBtZW51VGVtcGxhdGU6ICAgcmVxdWlyZSAnLi9tZW51J1xuICAgICAgICAgICAgcGtnOiAgICAgICAgICAgIHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIG1lbnU6ICAgICAgICAgICAnLi4vLi4vY29mZmVlL21lbnUubm9vbidcbiAgICAgICAgICAgIGljb246ICAgICAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgc2NoZW1lOiAgICAgICAgIGZhbHNlXG4gICAgXG4gICAgICAgIHdpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je0BpZH1cIiBzZXBhcmF0b3I6J3wnXG4gICAgICAgICAgICBcbiAgICAgICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICAgICAgZmlsZXdhdGNoZXIgPSB3aW5kb3cuZmlsZXdhdGNoZXIgPSBuZXcgRmlsZVdhdGNoZXJcbiAgICAgICAgdGFicyAgICAgICAgPSB3aW5kb3cudGFicyAgICAgICAgPSBuZXcgVGFicyB3aW5kb3cudGl0bGViYXIuZWxlbVxuICAgICAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgICAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgICAgIHNwbGl0ICAgICAgID0gd2luZG93LnNwbGl0ICAgICAgID0gbmV3IFNwbGl0KClcbiAgICAgICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgICAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgICAgIGNvbW1hbmRsaW5lID0gd2luZG93LmNvbW1hbmRsaW5lID0gbmV3IENvbW1hbmRsaW5lICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgICAgIGN3ZCAgICAgICAgID0gd2luZG93LmN3ZCAgICAgICAgID0gbmV3IENXRCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgZWRpdG9yLm5hbWVcblxuICAgICAgICByZXN0b3JlV2luKClcbiAgICAgICAgc2NoZW1lLnNldCBwcmVmcy5nZXQgJ3NjaGVtZScgJ2RhcmsnXG5cbiAgICAgICAgdGVybWluYWwub24gJ2ZpbGVTZWFyY2hSZXN1bHRDaGFuZ2UnIChmaWxlLCBsaW5lQ2hhbmdlKSAtPiAjIHNlbmRzIGNoYW5nZXMgdG8gYWxsIHdpbmRvd3NcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdmaWxlTGluZUNoYW5nZXMnIGZpbGUsIFtsaW5lQ2hhbmdlXVxuICAgIFxuICAgICAgICBlZGl0b3Iub24gJ2NoYW5nZWQnIChjaGFuZ2VJbmZvKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGlmIGNoYW5nZUluZm8uZm9yZWlnblxuICAgICAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHBvc3QudG9PdGhlcldpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycgZWRpdG9yLmN1cnJlbnRGaWxlLCBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ3dpbmRvdy5lZGl0b3Iub24uY2hhbmdlZCcgY2hhbmdlSW5mb1xuICAgICAgICAgICAgICAgIGlmIGNoYW5nZUluZm8uZGVsZXRlcyA9PSAxXG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRlLmRlbEZpbGVQb3MgZmlsZTogZWRpdG9yLmN1cnJlbnRGaWxlLCBwb3M6IFswIGNoYW5nZUluZm8uY2hhbmdlc1swXS5vbGRJbmRleF1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRlLmFkZEZpbGVQb3MgZmlsZTogZWRpdG9yLmN1cnJlbnRGaWxlLCBwb3M6IGVkaXRvci5jdXJzb3JQb3MoKVxuICAgIFxuICAgICAgICBzID0gd2luZG93LnN0YXNoLmdldCAnZm9udFNpemUnIHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgICAgIGVkaXRvci5zZXRGb250U2l6ZSBzIGlmIHNcbiAgICBcbiAgICAgICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCdcbiAgICAgICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUgMFxuICAgIFxuICAgICAgICBwb3N0LmVtaXQgJ3Jlc3RvcmUnXG4gICAgICAgIGVkaXRvci5mb2N1cygpXG5cbiAgICBvbk1vdmVkOiAoYm91bmRzKSA9PiB3aW5kb3cuc3Rhc2guc2V0ICdib3VuZHMnIGJvdW5kc1xuICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICBcbiAgICBvbk1lbnVBY3Rpb246IChuYW1lLCBvcHRzKSA9PlxuICAgIFxuICAgICAgICAjIGtsb2cgJ2tvLndpbmRvdy5vbk1lbnVBY3Rpb24nIG5hbWUsIG9wdHNcbiAgICAgICAgXG4gICAgICAgIGlmIGFjdGlvbiA9IEVkaXRvci5hY3Rpb25XaXRoTmFtZSBuYW1lXG4gICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XSBvcHRzLmFjdGFyZ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuaGFuZGxlTWVudUFjdGlvbiBuYW1lLCBvcHRzXG4gICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgc3dpdGNoIG5hbWVcbiAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgb3B0cy5hY3RhcmdcbiAgICAgICAgICAgIHdoZW4gJ1VuZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICAgICAgd2hlbiAnQ29weScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY29weSgpXG4gICAgICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgU2NoZW1lJyAgICAgICAgIHRoZW4gcmV0dXJuIHNjaGVtZS50b2dnbGUoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBUYWIgUGlubmVkJyAgICAgdGhlbiByZXR1cm4gdG9nZ2xlVGFiUGlubmVkKClcbiAgICAgICAgICAgIHdoZW4gJ0luY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgLTFcbiAgICAgICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgICAgICB3aGVuICdPcGVuIFdpbmRvdyBMaXN0JyAgICAgIHRoZW4gcmV0dXJuIHRpdGxlYmFyLnNob3dMaXN0KClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEJhY2t3YXJkJyAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuYmFja3dhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ01heGltaXplIEVkaXRvcicgICAgICAgdGhlbiByZXR1cm4gc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgICAgICB0aGVuIHJldHVybiBhZGRUb1NoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgTmV4dCBUYWInICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBQcmV2aW91cyBUYWInIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgUmlnaHQnICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4uLi4nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3VGFiOiB0cnVlXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBXaW5kb3cuLi4nIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnU2F2ZScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFzIC4uLicgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGVBcydcbiAgICAgICAgICAgIHdoZW4gJ1JldmVydCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdyZWxvYWRGaWxlJ1xuICAgICAgICAgICAgIyB3aGVuICdSZWxvYWQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBUYWIgb3IgV2luZG93JyAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VUYWJPcldpbmRvdydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFRhYnMnICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZU90aGVyVGFicydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFdpbmRvd3MnICAgdGhlbiByZXR1cm4gcG9zdC50b090aGVyV2lucyAnY2xvc2VXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbGVhciBMaXN0JyAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICAgICAgICAgIHdpbmRvdy50aXRsZWJhci5yZWZyZXNoTWVudSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycgW3ByZWZzLnN0b3JlLmZpbGVdLCBuZXdUYWI6dHJ1ZVxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgICAgICB0aGVuIG9wdHMgPSBAaWRcbiAgICBcbiAgICAgICAgIyBsb2cgXCJ1bmhhbmRsZWQgbWVudSBhY3Rpb24hIHBvc3RpbmcgdG8gbWFpbiAnI3tuYW1lfScgb3B0czpcIiwgb3B0c1xuICAgIFxuICAgICAgICBzdXBlciBuYW1lLCBvcHRzXG4gICAgICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuXG53aW5kb3cuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJyBzZXBhcmF0b3I6J3wnXG53aW5kb3cucHJlZnMgPSBwcmVmc1xuXG5wb3N0LnNldE1heExpc3RlbmVycyAyMFxuXG5zYXZlU3Rhc2ggPSAtPlxuXG4gICAga2xvZyAnd2luZG93LnNhdmVTdGFzaCdcbiAgICBwb3N0LmVtaXQgJ3N0YXNoJ1xuICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgIHdpbmRvdy5zdGFzaC5zYXZlKCkgIFxuXG5yZXN0b3JlV2luID0gLT5cblxuICAgICMga2xvZyAna28ud2luZG93LnJlc3RvcmVXaW4nXG4gICAgaWYgYm91bmRzID0gd2luZG93LnN0YXNoLmdldCAnYm91bmRzJ1xuICAgICAgICB3aW5kb3cud2luLnNldEJvdW5kcyBib3VuZHNcblxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2RldlRvb2xzJ1xuICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdkZXZ0b29scydcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uICdzaW5nbGVDdXJzb3JBdFBvcycgKHBvcywgb3B0KSAtPiAjIGJyb3dzZXIgZG91YmxlIGNsaWNrIGFuZCBuZXdUYWJXaXRoRmlsZSA6bDpjXG4gICAgZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIHBvcywgb3B0IFxuICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxucG9zdC5vbiAnZm9jdXNFZGl0b3InICAtPiBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xucG9zdC5vbiAnY2xvbmVGaWxlJyAgICAtPiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxucG9zdC5vbiAnY2xvc2VXaW5kb3cnICAtPiBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdDbG9zZSdcbnBvc3Qub24gJ3NhdmVTdGFzaCcgICAgLT4gc2F2ZVN0YXNoKClcbnBvc3Qub24gJ2VkaXRvckZvY3VzJyAoZWRpdG9yKSAtPlxuICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgZWRpdG9yLm5hbWVcbiAgICB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICB3aW5kb3cudGV4dEVkaXRvciA9IGVkaXRvciBpZiBlZGl0b3IubmFtZSAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG4jIHBvc3Qub24gJ2RldlRvb2xzJyAob3BlbikgLT4ga2xvZyBcImtvLndpbmRvdy5wb3N0Lm9uIGRldlRvb2xzICN7b3Blbn1cIlxuXG5wb3N0Lm9uICdtYWlubG9nJyAtPiBrbG9nLmFwcGx5IGtsb2csIGFyZ3VtZW50c1xuXG5wb3N0Lm9uICdwaW5nJyAod0lELCBhcmdBLCBhcmdCKSAtPiBwb3N0LnRvV2luIHdJRCwgJ3BvbmcnIHdpbmRvdy53aW5JRCwgYXJnQSwgYXJnQlxucG9zdC5vbiAncG9zdEVkaXRvclN0YXRlJyAtPlxuICAgIHBvc3QudG9BbGwgJ2VkaXRvclN0YXRlJyB3aW5kb3cud2luSUQsXG4gICAgICAgIGxpbmVzOiAgICAgIGVkaXRvci5saW5lcygpXG4gICAgICAgIGN1cnNvcnM6ICAgIGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgbWFpbjogICAgICAgZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBzZWxlY3Rpb25zOiBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgIGhpZ2hsaWdodHM6IGVkaXRvci5oaWdobGlnaHRzKClcblxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbndpbmRvdy5lZGl0b3JXaXRoTmFtZSA9IChuKSAtPlxuXG4gICAgc3dpdGNoIG5cbiAgICAgICAgd2hlbiAnZWRpdG9yJyAgIHRoZW4gZWRpdG9yXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQnICdjb21tYW5kbGluZScgdGhlbiBjb21tYW5kbGluZVxuICAgICAgICB3aGVuICd0ZXJtaW5hbCcgdGhlbiB0ZXJtaW5hbFxuICAgICAgICBlbHNlIGVkaXRvclxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxub25DbG9zZSA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3NhdmVDaGFuZ2VzJ1xuICAgIGVkaXRvci5zZXRUZXh0ICcnXG4gICAgIyBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuXG4gICAgaWYgQnJvd3Nlci5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID4gMVxuICAgICAgICB3aW5kb3cuc3Rhc2guY2xlYXIoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICBpbmZvLnJlbG9hZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxucmVsb2FkV2luID0gLT5cblxuICAgIHNhdmVTdGFzaCgpXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuICAgIHBvc3QudG9NYWluICdyZWxvYWRXaW4nIHdpbklEOndpbmRvdy53aW5JRCwgZmlsZTplZGl0b3IuY3VycmVudEZpbGVcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxud2luZG93Lm9ucmVzaXplID0gLT5cblxuICAgICMga2xvZyAna28ud2luZG93Lm9ucmVzaXplJ1xuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIHdpbmRvdy53aW4ub25Nb3ZlZCB3aW5kb3cud2luLmdldEJvdW5kcygpXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSwgMjAwXG5cbnBvc3Qub24gJ3NwbGl0JyAocykgLT5cblxuICAgIGZpbGVicm93c2VyLnJlc2l6ZWQoKVxuICAgIHRlcm1pbmFsLnJlc2l6ZWQoKVxuICAgIGNvbW1hbmRsaW5lLnJlc2l6ZWQoKVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbnRvZ2dsZUNlbnRlclRleHQgPSAtPlxuXG4gICAgaWYgd2luZG93LnN0YXRlLmdldCBcImludmlzaWJsZXN8I3tlZGl0b3IuY3VycmVudEZpbGV9XCIgZmFsc2VcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICByZXN0b3JlSW52aXNpYmxlcyA9IHRydWVcblxuICAgIGlmIG5vdCB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyB0cnVlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWVcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IGZhbHNlXG5cbiAgICBpZiByZXN0b3JlSW52aXNpYmxlc1xuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG4gICAgICAgIFxudG9nZ2xlVGFiUGlubmVkID0gLT5cbiAgICBcbiAgICBpZiB0ID0gd2luZG93LnRhYnMuYWN0aXZlVGFiKClcbiAgICAgICAgdC50b2dnbGVQaW5uZWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbnNldEZvbnRTaXplID0gKHMpIC0+XG5cbiAgICBzID0gcHJlZnMuZ2V0KCdlZGl0b3JGb250U2l6ZScgMTkpIGlmIG5vdCBfLmlzRmluaXRlIHNcbiAgICBzID0gY2xhbXAgOCAxMDAgc1xuXG4gICAgd2luZG93LnN0YXNoLnNldCBcImZvbnRTaXplXCIgc1xuICAgIGVkaXRvci5zZXRGb250U2l6ZSBzXG4gICAgaWYgZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBlZGl0b3IuY3VycmVudEZpbGUsIHJlbG9hZDp0cnVlXG5cbmNoYW5nZUZvbnRTaXplID0gKGQpIC0+XG5cbiAgICBpZiAgICAgIGVkaXRvci5zaXplLmZvbnRTaXplID49IDMwXG4gICAgICAgIGYgPSA0XG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSA1MFxuICAgICAgICBmID0gMTBcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDIwXG4gICAgICAgIGYgPSAyXG4gICAgZWxzZVxuICAgICAgICBmID0gMVxuICAgIHNldEZvbnRTaXplIGVkaXRvci5zaXplLmZvbnRTaXplICsgZipkXG5cbnJlc2V0Rm9udFNpemUgPSAtPlxuXG4gICAgZGVmYXVsdEZvbnRTaXplID0gcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICB3aW5kb3cuc3Rhc2guc2V0ICdmb250U2l6ZScgZGVmYXVsdEZvbnRTaXplXG4gICAgc2V0Rm9udFNpemUgZGVmYXVsdEZvbnRTaXplXG5cbmFkZFRvU2hlbGYgPSAtPlxuXG4gICAgcmV0dXJuIGlmIHdpbmRvdy5sYXN0Rm9jdXMgPT0gJ3NoZWxmJ1xuICAgIGZiID0gd2luZG93LmZpbGVicm93c2VyXG4gICAgaWYgd2luZG93Lmxhc3RGb2N1cy5zdGFydHNXaXRoIGZiLm5hbWVcbiAgICAgICAgcGF0aCA9IGZiLmNvbHVtbldpdGhOYW1lKHdpbmRvdy5sYXN0Rm9jdXMpLmFjdGl2ZVBhdGgoKVxuICAgIGVsc2VcbiAgICAgICAgcGF0aCA9IGVkaXRvci5jdXJyZW50RmlsZVxuICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFxuXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMgICAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgIDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5yZXNldFpvb206IC0+XG5cbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIDFcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbmNoYW5nZVpvb206IChkKSAtPlxuICAgIFxuICAgIHogPSB3ZWJmcmFtZS5nZXRab29tRmFjdG9yKClcbiAgICB6ICo9IDErZC8yMFxuICAgIHogPSBjbGFtcCAwLjM2IDUuMjMgelxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgelxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbndpbmRvdy5vbmJsdXIgID0gKGV2ZW50KSAtPiBwb3N0LmVtaXQgJ3dpbkZvY3VzJyBmYWxzZVxud2luZG93Lm9uZm9jdXMgPSAoZXZlbnQpIC0+XG4gICAgcG9zdC5lbWl0ICd3aW5Gb2N1cycgdHJ1ZVxuICAgIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xhc3NOYW1lID09ICdib2R5J1xuICAgICAgICBpZiBzcGxpdC5lZGl0b3JWaXNpYmxlKClcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdlZGl0b3InXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG5cbndpbmRvdy5zZXRMYXN0Rm9jdXMgPSAobmFtZSkgLT4gXG4gICAgIyBrbG9nICdzZXRMYXN0Rm9jdXMnIG5hbWVcbiAgICB3aW5kb3cubGFzdEZvY3VzID0gbmFtZVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxub25Db21ibyA9IChjb21ibywgaW5mbykgLT5cblxuICAgIHJldHVybiBpZiBub3QgY29tYm9cblxuICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCB9ID0gaW5mb1xuXG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHRpdGxlYmFyLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgZm9yIGkgaW4gWzEuLjldXG4gICAgICAgIGlmIGNvbWJvIGlzIFwiYWx0KyN7aX1cIlxuICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgcG9zdC50b01haW4gJ2FjdGl2YXRlV2luZG93JyBpXG5cbiAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgd2hlbiAnZjMnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNjcmVlblNob3QoKVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Kz0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gKzFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCstJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tIC0xXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrMCcgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAcmVzZXRab29tKClcbiAgICAgICAgd2hlbiAnY29tbWFuZCthbHQreScgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNwbGl0LmRvICdtaW5pbWl6ZSBlZGl0b3InXG5cbnBvc3Qub24gJ2NvbWJvJyBvbkNvbWJvXG5cbm5ldyBXaW5kb3dcbiJdfQ==
//# sourceURL=../../coffee/win/window.coffee
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

    Window.prototype.onMoved = function(bounds) {
        return window.stash.set('bounds', bounds);
    };

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
    klog('ko.window.onresize');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb2JBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2Qs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WUFBTyxLQUFQO0FBQUEsYUFDUyxJQURUO0FBQ21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLFVBQUEsQ0FBQSxDQUFqQjtBQUQxQyxhQUVTLGlCQUZUO0FBRW1DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBRjFDLGFBR1MsaUJBSFQ7QUFHbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFDLENBQWIsQ0FBakI7QUFIMUMsYUFJUyxpQkFKVDtBQUltQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQWpCO0FBSjFDLGFBS1MsZUFMVDtBQUttQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQsQ0FBakI7QUFMMUM7QUFiTTs7QUFvQlYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWdCLE9BQWhCOztBQUVBLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMjI1xuXG57IF8sIGFyZ3MsIGNsYW1wLCBrbG9nLCBwb3N0LCBwcmVmcywgc2NoZW1lLCBzdGFzaCwgc3RvcEV2ZW50LCBzdG9yZSwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cblNwbGl0ICAgICAgID0gcmVxdWlyZSAnLi9zcGxpdCdcblRlcm1pbmFsICAgID0gcmVxdWlyZSAnLi90ZXJtaW5hbCdcblRhYnMgICAgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuVGl0bGViYXIgICAgPSByZXF1aXJlICcuL3RpdGxlYmFyJ1xuSW5mbyAgICAgICAgPSByZXF1aXJlICcuL2luZm8nXG5GaWxlSGFuZGxlciA9IHJlcXVpcmUgJy4vZmlsZWhhbmRsZXInXG5GaWxlV2F0Y2hlciA9IHJlcXVpcmUgJy4uL3Rvb2xzL3dhdGNoZXInXG5FZGl0b3IgICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9lZGl0b3InXG5Db21tYW5kbGluZSA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmRsaW5lJ1xuRmlsZUVkaXRvciAgPSByZXF1aXJlICcuLi9lZGl0b3IvZmlsZWVkaXRvcidcbk5hdmlnYXRlICAgID0gcmVxdWlyZSAnLi4vbWFpbi9uYXZpZ2F0ZSdcbkZQUyAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZnBzJ1xuQ1dEICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9jd2QnXG5zY2hlbWUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcbnByb2plY3RzICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcHJvamVjdHMnXG5lbGVjdHJvbiAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5cbmVkaXRvciAgICAgID0gbnVsbFxubWFpbm1lbnUgICAgPSBudWxsXG50ZXJtaW5hbCAgICA9IG51bGxcbmNvbW1hbmRsaW5lID0gbnVsbFxudGl0bGViYXIgICAgPSBudWxsXG50YWJzICAgICAgICA9IG51bGxcbmZpbGVoYW5kbGVyID0gbnVsbFxuZmlsZXdhdGNoZXIgPSBudWxsXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyB3aW5cbiAgICBcbiAgICBAOiAtPlxuXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBtZW51VGVtcGxhdGU6ICAgcmVxdWlyZSAnLi9tZW51J1xuICAgICAgICAgICAgcGtnOiAgICAgICAgICAgIHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIG1lbnU6ICAgICAgICAgICAnLi4vLi4vY29mZmVlL21lbnUubm9vbidcbiAgICAgICAgICAgIGljb246ICAgICAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgc2NoZW1lOiAgICAgICAgIGZhbHNlXG4gICAgXG4gICAgICAgIHdpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je0BpZH1cIiBzZXBhcmF0b3I6J3wnXG4gICAgICAgICAgICBcbiAgICAgICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICAgICAgZmlsZXdhdGNoZXIgPSB3aW5kb3cuZmlsZXdhdGNoZXIgPSBuZXcgRmlsZVdhdGNoZXJcbiAgICAgICAgdGFicyAgICAgICAgPSB3aW5kb3cudGFicyAgICAgICAgPSBuZXcgVGFicyB3aW5kb3cudGl0bGViYXIuZWxlbVxuICAgICAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgICAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgICAgIHNwbGl0ICAgICAgID0gd2luZG93LnNwbGl0ICAgICAgID0gbmV3IFNwbGl0KClcbiAgICAgICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgICAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgICAgIGNvbW1hbmRsaW5lID0gd2luZG93LmNvbW1hbmRsaW5lID0gbmV3IENvbW1hbmRsaW5lICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgICAgIGN3ZCAgICAgICAgID0gd2luZG93LmN3ZCAgICAgICAgID0gbmV3IENXRCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBlZGl0b3IubmFtZVxuICAgIFxuICAgICAgICByZXN0b3JlV2luKClcbiAgICAgICAgc2NoZW1lLnNldCBwcmVmcy5nZXQgJ3NjaGVtZScgJ2RhcmsnXG4gICAgXG4gICAgICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJyAoZmlsZSwgbGluZUNoYW5nZSkgLT4gIyBzZW5kcyBjaGFuZ2VzIHRvIGFsbCB3aW5kb3dzXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBmaWxlLCBbbGluZUNoYW5nZV1cbiAgICBcbiAgICAgICAgZWRpdG9yLm9uICdjaGFuZ2VkJyAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2VJbmZvLmZvcmVpZ25cbiAgICAgICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnIGVkaXRvci5jdXJyZW50RmlsZSwgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICAgICAgbmF2aWdhdGUuYWRkRmlsZVBvcyBmaWxlOiBlZGl0b3IuY3VycmVudEZpbGUsIHBvczogZWRpdG9yLmN1cnNvclBvcygpXG4gICAgXG4gICAgICAgIHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmb250U2l6ZScgcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICAgICAgZWRpdG9yLnNldEZvbnRTaXplIHMgaWYgc1xuICAgIFxuICAgICAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0J1xuICAgICAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSAwXG4gICAgXG4gICAgICAgIHBvc3QuZW1pdCAncmVzdG9yZSdcbiAgICAgICAgZWRpdG9yLmZvY3VzKClcblxuICAgIG9uTW92ZWQ6IChib3VuZHMpID0+IHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycgYm91bmRzXG4gICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9uTWVudUFjdGlvbjogKG5hbWUsIGFyZ3MpID0+XG4gICAgXG4gICAgICAgIGtsb2cgJ2tvLndpbmRvdy5vbk1lbnVBY3Rpb24nIG5hbWUsIGFyZ3NcbiAgICAgICAgXG4gICAgICAgIGlmIGFjdGlvbiA9IEVkaXRvci5hY3Rpb25XaXRoTmFtZSBuYW1lXG4gICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XSBhcmdzLmFjdGFyZ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuaGFuZGxlTWVudUFjdGlvbiBuYW1lLCBhcmdzXG4gICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgc3dpdGNoIG5hbWVcbiAgICBcbiAgICAgICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgYXJncy5hY3RhcmdcbiAgICAgICAgICAgIHdoZW4gJ1VuZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICAgICAgd2hlbiAnQ29weScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuY29weSgpXG4gICAgICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QudG9NYWluICduZXdXaW5kb3dXaXRoRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgU2NoZW1lJyAgICAgICAgIHRoZW4gcmV0dXJuIHNjaGVtZS50b2dnbGUoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgICAgIHdoZW4gJ0luY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgICAgIHdoZW4gJ0RlY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgLTFcbiAgICAgICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgICAgICB3aGVuICdPcGVuIFdpbmRvdyBMaXN0JyAgICAgIHRoZW4gcmV0dXJuIHRpdGxlYmFyLnNob3dMaXN0KClcbiAgICAgICAgICAgIHdoZW4gJ05hdmlnYXRlIEJhY2t3YXJkJyAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuYmFja3dhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgICAgIHdoZW4gJ01heGltaXplIEVkaXRvcicgICAgICAgdGhlbiByZXR1cm4gc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICAgICAgd2hlbiAnQWRkIHRvIFNoZWxmJyAgICAgICAgICB0aGVuIHJldHVybiBhZGRUb1NoZWxmKClcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICAgICAgd2hlbiAnQWN0aXZhdGUgTmV4dCBUYWInICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBQcmV2aW91cyBUYWInIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICAgICAgd2hlbiAnTW92ZSBUYWIgUmlnaHQnICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4uLi4nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZSdcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3VGFiOiB0cnVlXG4gICAgICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBXaW5kb3cuLi4nIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnIG5ld1dpbmRvdzogdHJ1ZVxuICAgICAgICAgICAgd2hlbiAnU2F2ZScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlJ1xuICAgICAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFzIC4uLicgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGVBcydcbiAgICAgICAgICAgIHdoZW4gJ1JldmVydCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdyZWxvYWRGaWxlJ1xuICAgICAgICAgICAgIyB3aGVuICdSZWxvYWQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgICAgICB3aGVuICdDbG9zZSBUYWIgb3IgV2luZG93JyAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VUYWJPcldpbmRvdydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFRhYnMnICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZU90aGVyVGFicydcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFdpbmRvd3MnICAgdGhlbiByZXR1cm4gcG9zdC50b090aGVyV2lucyAnY2xvc2VXaW5kb3cnXG4gICAgICAgICAgICB3aGVuICdDbGVhciBMaXN0JyAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICAgICAgICAgIHdpbmRvdy50aXRsZWJhci5yZWZyZXNoTWVudSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycgW3ByZWZzLnN0b3JlLmZpbGVdLCBuZXdUYWI6dHJ1ZVxuICAgICAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgICAgICAgICB0aGVuIGFyZ3MgPSBAaWRcbiAgICBcbiAgICAgICAgIyBsb2cgXCJ1bmhhbmRsZWQgbWVudSBhY3Rpb24hIHBvc3RpbmcgdG8gbWFpbiAnI3tuYW1lfScgYXJnczpcIiwgYXJnc1xuICAgIFxuICAgICAgICBzdXBlciBuYW1lLCBhcmdzXG4gICAgICAgICAgICBcbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuXG53aW5kb3cuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJyBzZXBhcmF0b3I6J3wnXG53aW5kb3cucHJlZnMgPSBwcmVmc1xuXG5wb3N0LnNldE1heExpc3RlbmVycyAyMFxuXG5zYXZlU3Rhc2ggPSAtPlxuXG4gICAga2xvZyAnd2luZG93LnNhdmVTdGFzaCdcbiAgICBwb3N0LmVtaXQgJ3N0YXNoJ1xuICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgIHdpbmRvdy5zdGFzaC5zYXZlKCkgIFxuXG5yZXN0b3JlV2luID0gLT5cblxuICAgIGtsb2cgJ2tvLndpbmRvdy5yZXN0b3JlV2luJ1xuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luZG93Lndpbi5zZXRCb3VuZHMgYm91bmRzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdkZXZUb29scydcbiAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnZGV2dG9vbHMnXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbiAnc2luZ2xlQ3Vyc29yQXRQb3MnIChwb3MsIG9wdCkgLT4gIyBicm93c2VyIGRvdWJsZSBjbGljayBhbmQgbmV3VGFiV2l0aEZpbGUgOmw6Y1xuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdCBcbiAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbnBvc3Qub24gJ2ZvY3VzRWRpdG9yJyAgLT4gc3BsaXQuZm9jdXMgJ2VkaXRvcidcbnBvc3Qub24gJ2Nsb25lRmlsZScgICAgLT4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnQ2xvc2UnXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxucG9zdC5vbiAnZGV2VG9vbHMnIChvcGVuKSAtPiBcbiAgICBrbG9nIFwia28ud2luZG93LnBvc3Qub24gZGV2VG9vbHMgI3tvcGVufVwiXG5cbnBvc3Qub24gJ21haW5sb2cnIC0+IGtsb2cuYXBwbHkga2xvZywgYXJndW1lbnRzXG5cbnBvc3Qub24gJ3BpbmcnICh3SUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd0lELCAncG9uZycgd2luZG93LndpbklELCBhcmdBLCBhcmdCXG5wb3N0Lm9uICdwb3N0RWRpdG9yU3RhdGUnIC0+XG4gICAgcG9zdC50b0FsbCAnZWRpdG9yU3RhdGUnIHdpbmRvdy53aW5JRCxcbiAgICAgICAgbGluZXM6ICAgICAgZWRpdG9yLmxpbmVzKClcbiAgICAgICAgY3Vyc29yczogICAgZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICBtYWluOiAgICAgICBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHNlbGVjdGlvbnM6IGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgaGlnaGxpZ2h0czogZWRpdG9yLmhpZ2hsaWdodHMoKVxuXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxud2luZG93LmVkaXRvcldpdGhOYW1lID0gKG4pIC0+XG5cbiAgICBzd2l0Y2ggblxuICAgICAgICB3aGVuICdlZGl0b3InICAgdGhlbiBlZGl0b3JcbiAgICAgICAgd2hlbiAnY29tbWFuZCcgJ2NvbW1hbmRsaW5lJyB0aGVuIGNvbW1hbmRsaW5lXG4gICAgICAgIHdoZW4gJ3Rlcm1pbmFsJyB0aGVuIHRlcm1pbmFsXG4gICAgICAgIGVsc2UgZWRpdG9yXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbkNsb3NlID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc2F2ZUNoYW5nZXMnXG4gICAgZWRpdG9yLnNldFRleHQgJydcbiAgICAjIGVkaXRvci5zdG9wV2F0Y2hlcigpXG5cbiAgICBpZiBCcm93c2VyLmdldEFsbFdpbmRvd3MoKS5sZW5ndGggPiAxXG4gICAgICAgIHdpbmRvdy5zdGFzaC5jbGVhcigpXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5kb3cub25sb2FkID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIGluZm8ucmVsb2FkKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG5yZWxvYWRXaW4gPSAtPlxuXG4gICAgc2F2ZVN0YXNoKClcbiAgICBjbGVhckxpc3RlbmVycygpXG4gICAgcG9zdC50b01haW4gJ3JlbG9hZFdpbicgd2luSUQ6d2luZG93LndpbklELCBmaWxlOmVkaXRvci5jdXJyZW50RmlsZVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG53aW5kb3cub25yZXNpemUgPSAtPlxuXG4gICAga2xvZyAna28ud2luZG93Lm9ucmVzaXplJ1xuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIHdpbmRvdy53aW4ub25Nb3ZlZCB3aW5kb3cud2luLmdldEJvdW5kcygpXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSwgMjAwXG5cbnBvc3Qub24gJ3NwbGl0JyAocykgLT5cblxuICAgIGZpbGVicm93c2VyLnJlc2l6ZWQoKVxuICAgIHRlcm1pbmFsLnJlc2l6ZWQoKVxuICAgIGNvbW1hbmRsaW5lLnJlc2l6ZWQoKVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbnRvZ2dsZUNlbnRlclRleHQgPSAtPlxuXG4gICAgaWYgd2luZG93LnN0YXRlLmdldCBcImludmlzaWJsZXN8I3tlZGl0b3IuY3VycmVudEZpbGV9XCIgZmFsc2VcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICByZXN0b3JlSW52aXNpYmxlcyA9IHRydWVcblxuICAgIGlmIG5vdCB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyB0cnVlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWVcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IGZhbHNlXG5cbiAgICBpZiByZXN0b3JlSW52aXNpYmxlc1xuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuc2V0Rm9udFNpemUgPSAocykgLT5cblxuICAgIHMgPSBwcmVmcy5nZXQoJ2VkaXRvckZvbnRTaXplJyAxOSkgaWYgbm90IF8uaXNGaW5pdGUgc1xuICAgIHMgPSBjbGFtcCA4IDEwMCBzXG5cbiAgICB3aW5kb3cuc3Rhc2guc2V0IFwiZm9udFNpemVcIiBzXG4gICAgZWRpdG9yLnNldEZvbnRTaXplIHNcbiAgICBpZiBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZSwgcmVsb2FkOnRydWVcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cblxuICAgIGlmICAgICAgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMzBcbiAgICAgICAgZiA9IDRcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDUwXG4gICAgICAgIGYgPSAxMFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMjBcbiAgICAgICAgZiA9IDJcbiAgICBlbHNlXG4gICAgICAgIGYgPSAxXG4gICAgc2V0Rm9udFNpemUgZWRpdG9yLnNpemUuZm9udFNpemUgKyBmKmRcblxucmVzZXRGb250U2l6ZSA9IC0+XG5cbiAgICBkZWZhdWx0Rm9udFNpemUgPSBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcbiAgICBzZXRGb250U2l6ZSBkZWZhdWx0Rm9udFNpemVcblxuYWRkVG9TaGVsZiA9IC0+XG5cbiAgICBmaWxlQnJvd3NlciA9IHdpbmRvdy5maWxlYnJvd3NlclxuICAgIHJldHVybiBpZiB3aW5kb3cubGFzdEZvY3VzID09ICdzaGVsZidcbiAgICBpZiB3aW5kb3cubGFzdEZvY3VzLnN0YXJ0c1dpdGggZmlsZUJyb3dzZXIubmFtZVxuICAgICAgICBwYXRoID0gZmlsZUJyb3dzZXIuY29sdW1uV2l0aE5hbWUod2luZG93Lmxhc3RGb2N1cykuYWN0aXZlUGF0aCgpXG4gICAgZWxzZVxuICAgICAgICBwYXRoID0gZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJyBwYXRoXG5cbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyAgICAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAgMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbnJlc2V0Wm9vbTogLT5cblxuICAgIHdlYmZyYW1lLnNldFpvb21GYWN0b3IgMVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuY2hhbmdlWm9vbTogKGQpIC0+XG4gICAgXG4gICAgeiA9IHdlYmZyYW1lLmdldFpvb21GYWN0b3IoKVxuICAgIHogKj0gMStkLzIwXG4gICAgeiA9IGNsYW1wIDAuMzYgNS4yMyB6XG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciB6XG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxud2luZG93Lm9uYmx1ciAgPSAoZXZlbnQpIC0+IHBvc3QuZW1pdCAnd2luRm9jdXMnIGZhbHNlXG53aW5kb3cub25mb2N1cyA9IChldmVudCkgLT5cbiAgICBwb3N0LmVtaXQgJ3dpbkZvY3VzJyB0cnVlXG4gICAgaWYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbGFzc05hbWUgPT0gJ2JvZHknXG4gICAgICAgIGlmIHNwbGl0LmVkaXRvclZpc2libGUoKVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2VkaXRvcidcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BsaXQuZm9jdXMgJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxud2luZG93LnNldExhc3RGb2N1cyA9IChuYW1lKSAtPiB3aW5kb3cubGFzdEZvY3VzID0gbmFtZVxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxub25Db21ibyA9IChjb21ibywgaW5mbykgLT5cblxuICAgIHJldHVybiBpZiBub3QgY29tYm9cblxuICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCB9ID0gaW5mb1xuXG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHRpdGxlYmFyLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgZm9yIGkgaW4gWzEuLjldXG4gICAgICAgIGlmIGNvbWJvIGlzIFwiYWx0KyN7aX1cIlxuICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgcG9zdC50b01haW4gJ2FjdGl2YXRlV2luZG93JyBpXG5cbiAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgd2hlbiAnZjMnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNjcmVlblNob3QoKVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Kz0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gKzFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCstJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tIC0xXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrMCcgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAcmVzZXRab29tKClcbiAgICAgICAgd2hlbiAnY29tbWFuZCthbHQreScgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNwbGl0LmRvICdtaW5pbWl6ZSBlZGl0b3InXG5cbnBvc3Qub24gJ2NvbWJvJyBvbkNvbWJvXG5cbm5ldyBXaW5kb3dcbiJdfQ==
//# sourceURL=../../coffee/win/window.coffee
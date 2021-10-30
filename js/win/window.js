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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS93aW4iLCJzb3VyY2VzIjpbIndpbmRvdy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb2JBQUE7SUFBQTs7OztBQVFBLE1BQThFLE9BQUEsQ0FBUSxLQUFSLENBQTlFLEVBQUUsU0FBRixFQUFLLGVBQUwsRUFBVyxpQkFBWCxFQUFrQixlQUFsQixFQUF3QixlQUF4QixFQUE4QixpQkFBOUIsRUFBcUMsbUJBQXJDLEVBQTZDLGlCQUE3QyxFQUFvRCx5QkFBcEQsRUFBK0QsaUJBQS9ELEVBQXNFOztBQUV0RSxLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLE1BQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSw0QkFBUjs7QUFDZCxVQUFBLEdBQWMsT0FBQSxDQUFRLHNCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsa0JBQVI7O0FBQ2QsR0FBQSxHQUFjLE9BQUEsQ0FBUSxjQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGlCQUFSOztBQUNkLFFBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxVQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsb0JBQVI7O0FBRWQsTUFBQSxHQUFjOztBQUNkLFFBQUEsR0FBYzs7QUFDZCxRQUFBLEdBQWM7O0FBQ2Qs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VSxLQUFWLEVBQWlCLFVBQUEsQ0FBQSxDQUFqQjtBQUQxQyxhQUVTLGlCQUZUO0FBRW1DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQyxDQUFiLENBQWpCO0FBRjFDLGFBR1MsaUJBSFQ7QUFHbUMsbUJBQU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFDLENBQWIsQ0FBakI7QUFIMUMsYUFJUyxpQkFKVDtBQUltQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQWpCO0FBSjFDLGFBS1MsZUFMVDtBQUttQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQsQ0FBakI7QUFMMUM7QUFiTTs7QUFvQlYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWdCLE9BQWhCOztBQUVBLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMjI1xuXG57IF8sIGFyZ3MsIGNsYW1wLCBrbG9nLCBwb3N0LCBwcmVmcywgc2NoZW1lLCBzdGFzaCwgc3RvcEV2ZW50LCBzdG9yZSwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cblNwbGl0ICAgICAgID0gcmVxdWlyZSAnLi9zcGxpdCdcblRlcm1pbmFsICAgID0gcmVxdWlyZSAnLi90ZXJtaW5hbCdcblRhYnMgICAgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuVGl0bGViYXIgICAgPSByZXF1aXJlICcuL3RpdGxlYmFyJ1xuSW5mbyAgICAgICAgPSByZXF1aXJlICcuL2luZm8nXG5GaWxlSGFuZGxlciA9IHJlcXVpcmUgJy4vZmlsZWhhbmRsZXInXG5GaWxlV2F0Y2hlciA9IHJlcXVpcmUgJy4uL3Rvb2xzL3dhdGNoZXInXG5FZGl0b3IgICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9lZGl0b3InXG5Db21tYW5kbGluZSA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmRsaW5lJ1xuRmlsZUVkaXRvciAgPSByZXF1aXJlICcuLi9lZGl0b3IvZmlsZWVkaXRvcidcbk5hdmlnYXRlICAgID0gcmVxdWlyZSAnLi4vbWFpbi9uYXZpZ2F0ZSdcbkZQUyAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZnBzJ1xuQ1dEICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9jd2QnXG5zY2hlbWUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcbnByb2plY3RzICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcHJvamVjdHMnXG5lbGVjdHJvbiAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5cbmVkaXRvciAgICAgID0gbnVsbFxubWFpbm1lbnUgICAgPSBudWxsXG50ZXJtaW5hbCAgICA9IG51bGxcbmNvbW1hbmRsaW5lID0gbnVsbFxudGl0bGViYXIgICAgPSBudWxsXG50YWJzICAgICAgICA9IG51bGxcbmZpbGVoYW5kbGVyID0gbnVsbFxuZmlsZXdhdGNoZXIgPSBudWxsXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyB3aW5cbiAgICBcbiAgICBAOiAtPlxuXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBtZW51VGVtcGxhdGU6ICAgcmVxdWlyZSAnLi9tZW51J1xuICAgICAgICAgICAgcGtnOiAgICAgICAgICAgIHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIG1lbnU6ICAgICAgICAgICAnLi4vLi4vY29mZmVlL21lbnUubm9vbidcbiAgICAgICAgICAgIGljb246ICAgICAgICAgICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgICAgICAgICAgc2NoZW1lOiAgICAgICAgIGZhbHNlXG4gICAgXG4gICAgICAgIHdpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je0BpZH1cIiBzZXBhcmF0b3I6J3wnXG4gICAgICAgICAgICBcbiAgICAgICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICAgICAgZmlsZXdhdGNoZXIgPSB3aW5kb3cuZmlsZXdhdGNoZXIgPSBuZXcgRmlsZVdhdGNoZXJcbiAgICAgICAgdGFicyAgICAgICAgPSB3aW5kb3cudGFicyAgICAgICAgPSBuZXcgVGFicyB3aW5kb3cudGl0bGViYXIuZWxlbVxuICAgICAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgICAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgICAgIHNwbGl0ICAgICAgID0gd2luZG93LnNwbGl0ICAgICAgID0gbmV3IFNwbGl0KClcbiAgICAgICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgICAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgICAgIGNvbW1hbmRsaW5lID0gd2luZG93LmNvbW1hbmRsaW5lID0gbmV3IENvbW1hbmRsaW5lICdjb21tYW5kbGluZS1lZGl0b3InXG4gICAgICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgICAgIGN3ZCAgICAgICAgID0gd2luZG93LmN3ZCAgICAgICAgID0gbmV3IENXRCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgICAgIHdpbmRvdy5sYXN0Rm9jdXMgPSBlZGl0b3IubmFtZVxuICAgIFxuICAgICAgICByZXN0b3JlV2luKClcbiAgICAgICAgc2NoZW1lLnNldCBwcmVmcy5nZXQgJ3NjaGVtZScgJ2RhcmsnXG4gICAgXG4gICAgICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJyAoZmlsZSwgbGluZUNoYW5nZSkgLT4gIyBzZW5kcyBjaGFuZ2VzIHRvIGFsbCB3aW5kb3dzXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUxpbmVDaGFuZ2VzJyBmaWxlLCBbbGluZUNoYW5nZV1cbiAgICBcbiAgICAgICAgZWRpdG9yLm9uICdjaGFuZ2VkJyAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgICAgIHJldHVybiBpZiBjaGFuZ2VJbmZvLmZvcmVpZ25cbiAgICAgICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnIGVkaXRvci5jdXJyZW50RmlsZSwgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICAgICAgbmF2aWdhdGUuYWRkRmlsZVBvcyBmaWxlOiBlZGl0b3IuY3VycmVudEZpbGUsIHBvczogZWRpdG9yLmN1cnNvclBvcygpXG4gICAgXG4gICAgICAgIHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmb250U2l6ZScgcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICAgICAgZWRpdG9yLnNldEZvbnRTaXplIHMgaWYgc1xuICAgIFxuICAgICAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0J1xuICAgICAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSAwXG4gICAgXG4gICAgICAgIHBvc3QuZW1pdCAncmVzdG9yZSdcbiAgICAgICAgZWRpdG9yLmZvY3VzKClcblxuICAgIG9uTW92ZWQ6IChib3VuZHMpID0+IHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycgYm91bmRzXG4gICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9uTWVudUFjdGlvbjogKG5hbWUsIGFyZ3MpID0+XG4gICAgXG4gICAgICAgICMga2xvZyAna28ud2luZG93Lm9uTWVudUFjdGlvbicgbmFtZSwgYXJnc1xuICAgICAgICBcbiAgICAgICAgaWYgYWN0aW9uID0gRWRpdG9yLmFjdGlvbldpdGhOYW1lIG5hbWVcbiAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5oYW5kbGVNZW51QWN0aW9uIG5hbWUsIGFyZ3NcbiAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICBzd2l0Y2ggbmFtZVxuICAgIFxuICAgICAgICAgICAgd2hlbiAnZG9NYWNybycgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMubWFjcm8uZXhlY3V0ZSBhcmdzLmFjdGFyZ1xuICAgICAgICAgICAgd2hlbiAnVW5kbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8udW5kbygpXG4gICAgICAgICAgICB3aGVuICdSZWRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby5yZWRvKClcbiAgICAgICAgICAgIHdoZW4gJ0N1dCcgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmN1dCgpXG4gICAgICAgICAgICB3aGVuICdDb3B5JyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jb3B5KClcbiAgICAgICAgICAgIHdoZW4gJ1Bhc3RlJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLnBhc3RlKClcbiAgICAgICAgICAgIHdoZW4gJ05ldyBUYWInICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICduZXdFbXB0eVRhYidcbiAgICAgICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgICAgIHdoZW4gJ1RvZ2dsZSBTY2hlbWUnICAgICAgICAgdGhlbiByZXR1cm4gc2NoZW1lLnRvZ2dsZSgpXG4gICAgICAgICAgICB3aGVuICdUb2dnbGUgQ2VudGVyIFRleHQnICAgIHRoZW4gcmV0dXJuIHRvZ2dsZUNlbnRlclRleHQoKVxuICAgICAgICAgICAgd2hlbiAnSW5jcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSArMVxuICAgICAgICAgICAgd2hlbiAnRGVjcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSAtMVxuICAgICAgICAgICAgd2hlbiAnUmVzZXQnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiByZXNldEZvbnRTaXplKClcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gV2luZG93IExpc3QnICAgICAgdGhlbiByZXR1cm4gdGl0bGViYXIuc2hvd0xpc3QoKVxuICAgICAgICAgICAgd2hlbiAnTmF2aWdhdGUgQmFja3dhcmQnICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5iYWNrd2FyZCgpXG4gICAgICAgICAgICB3aGVuICdOYXZpZ2F0ZSBGb3J3YXJkJyAgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmZvcndhcmQoKVxuICAgICAgICAgICAgd2hlbiAnTWF4aW1pemUgRWRpdG9yJyAgICAgICB0aGVuIHJldHVybiBzcGxpdC5tYXhpbWl6ZUVkaXRvcigpXG4gICAgICAgICAgICB3aGVuICdBZGQgdG8gU2hlbGYnICAgICAgICAgIHRoZW4gcmV0dXJuIGFkZFRvU2hlbGYoKVxuICAgICAgICAgICAgd2hlbiAnVG9nZ2xlIEhpc3RvcnknICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZmlsZWJyb3dzZXIuc2hlbGYudG9nZ2xlSGlzdG9yeSgpXG4gICAgICAgICAgICB3aGVuICdBY3RpdmF0ZSBOZXh0IFRhYicgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgICAgIHdoZW4gJ0FjdGl2YXRlIFByZXZpb3VzIFRhYicgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdNb3ZlIFRhYiBMZWZ0JyAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUgJ2xlZnQnXG4gICAgICAgICAgICB3aGVuICdNb3ZlIFRhYiBSaWdodCcgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUgJ3JpZ2h0J1xuICAgICAgICAgICAgd2hlbiAnT3Blbi4uLicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJ1xuICAgICAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgVGFiLi4uJyAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJyBuZXdUYWI6IHRydWVcbiAgICAgICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFdpbmRvdy4uLicgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3V2luZG93OiB0cnVlXG4gICAgICAgICAgICB3aGVuICdTYXZlJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUZpbGUnXG4gICAgICAgICAgICB3aGVuICdTYXZlIEFsbCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUFsbCdcbiAgICAgICAgICAgIHdoZW4gJ1NhdmUgQXMgLi4uJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZUFzJ1xuICAgICAgICAgICAgd2hlbiAnUmV2ZXJ0JyAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3JlbG9hZEZpbGUnXG4gICAgICAgICAgICAjIHdoZW4gJ1JlbG9hZCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVsb2FkV2luKClcbiAgICAgICAgICAgIHdoZW4gJ0Nsb3NlIFRhYiBvciBXaW5kb3cnICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZVRhYk9yV2luZG93J1xuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgVGFicycgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlT3RoZXJUYWJzJ1xuICAgICAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgV2luZG93cycgICB0aGVuIHJldHVybiBwb3N0LnRvT3RoZXJXaW5zICdjbG9zZVdpbmRvdydcbiAgICAgICAgICAgIHdoZW4gJ0NsZWFyIExpc3QnICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2luZG93LnN0YXRlLnNldCAncmVjZW50RmlsZXMnIFtdXG4gICAgICAgICAgICAgICAgd2luZG93LnRpdGxlYmFyLnJlZnJlc2hNZW51KClcbiAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICB3aGVuICdQcmVmZXJlbmNlcycgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGVzJyBbcHJlZnMuc3RvcmUuZmlsZV0sIG5ld1RhYjp0cnVlXG4gICAgICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyAgICAgICAgIHRoZW4gYXJncyA9IEBpZFxuICAgIFxuICAgICAgICAjIGxvZyBcInVuaGFuZGxlZCBtZW51IGFjdGlvbiEgcG9zdGluZyB0byBtYWluICcje25hbWV9JyBhcmdzOlwiLCBhcmdzXG4gICAgXG4gICAgICAgIHN1cGVyIG5hbWUsIGFyZ3NcbiAgICAgICAgICAgIFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG5cbndpbmRvdy5zdGF0ZSA9IG5ldyBzdG9yZSAnc3RhdGUnIHNlcGFyYXRvcjonfCdcbndpbmRvdy5wcmVmcyA9IHByZWZzXG5cbnBvc3Quc2V0TWF4TGlzdGVuZXJzIDIwXG5cbnNhdmVTdGFzaCA9IC0+XG5cbiAgICBrbG9nICd3aW5kb3cuc2F2ZVN0YXNoJ1xuICAgIHBvc3QuZW1pdCAnc3Rhc2gnXG4gICAgZWRpdG9yLnNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9ucygpXG4gICAgd2luZG93LnN0YXNoLnNhdmUoKSAgXG5cbnJlc3RvcmVXaW4gPSAtPlxuXG4gICAga2xvZyAna28ud2luZG93LnJlc3RvcmVXaW4nXG4gICAgaWYgYm91bmRzID0gd2luZG93LnN0YXNoLmdldCAnYm91bmRzJ1xuICAgICAgICB3aW5kb3cud2luLnNldEJvdW5kcyBib3VuZHNcblxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2RldlRvb2xzJ1xuICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdkZXZ0b29scydcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uICdzaW5nbGVDdXJzb3JBdFBvcycgKHBvcywgb3B0KSAtPiAjIGJyb3dzZXIgZG91YmxlIGNsaWNrIGFuZCBuZXdUYWJXaXRoRmlsZSA6bDpjXG4gICAgZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIHBvcywgb3B0IFxuICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxucG9zdC5vbiAnZm9jdXNFZGl0b3InICAtPiBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xucG9zdC5vbiAnY2xvbmVGaWxlJyAgICAtPiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZVxucG9zdC5vbiAnY2xvc2VXaW5kb3cnICAtPiBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdDbG9zZSdcbnBvc3Qub24gJ3NhdmVTdGFzaCcgICAgLT4gc2F2ZVN0YXNoKClcbnBvc3Qub24gJ2VkaXRvckZvY3VzJyAoZWRpdG9yKSAtPlxuICAgIHdpbmRvdy5zZXRMYXN0Rm9jdXMgZWRpdG9yLm5hbWVcbiAgICB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICB3aW5kb3cudGV4dEVkaXRvciA9IGVkaXRvciBpZiBlZGl0b3IubmFtZSAhPSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG5wb3N0Lm9uICdkZXZUb29scycgKG9wZW4pIC0+IFxuICAgIGtsb2cgXCJrby53aW5kb3cucG9zdC5vbiBkZXZUb29scyAje29wZW59XCJcblxucG9zdC5vbiAnbWFpbmxvZycgLT4ga2xvZy5hcHBseSBrbG9nLCBhcmd1bWVudHNcblxucG9zdC5vbiAncGluZycgKHdJRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3SUQsICdwb25nJyB3aW5kb3cud2luSUQsIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3Bvc3RFZGl0b3JTdGF0ZScgLT5cbiAgICBwb3N0LnRvQWxsICdlZGl0b3JTdGF0ZScgd2luZG93LndpbklELFxuICAgICAgICBsaW5lczogICAgICBlZGl0b3IubGluZXMoKVxuICAgICAgICBjdXJzb3JzOiAgICBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgIG1haW46ICAgICAgIGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgc2VsZWN0aW9uczogZWRpdG9yLnNlbGVjdGlvbnMoKVxuICAgICAgICBoaWdobGlnaHRzOiBlZGl0b3IuaGlnaGxpZ2h0cygpXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG53aW5kb3cuZWRpdG9yV2l0aE5hbWUgPSAobikgLT5cblxuICAgIHN3aXRjaCBuXG4gICAgICAgIHdoZW4gJ2VkaXRvcicgICB0aGVuIGVkaXRvclxuICAgICAgICB3aGVuICdjb21tYW5kJyAnY29tbWFuZGxpbmUnIHRoZW4gY29tbWFuZGxpbmVcbiAgICAgICAgd2hlbiAndGVybWluYWwnIHRoZW4gdGVybWluYWxcbiAgICAgICAgZWxzZSBlZGl0b3JcblxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbm9uQ2xvc2UgPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzYXZlQ2hhbmdlcydcbiAgICBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgICMgZWRpdG9yLnN0b3BXYXRjaGVyKClcblxuICAgIGlmIEJyb3dzZXIuZ2V0QWxsV2luZG93cygpLmxlbmd0aCA+IDFcbiAgICAgICAgd2luZG93LnN0YXNoLmNsZWFyKClcblxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbmRvdy5vbmxvYWQgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgaW5mby5yZWxvYWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbnJlbG9hZFdpbiA9IC0+XG5cbiAgICBzYXZlU3Rhc2goKVxuICAgIGNsZWFyTGlzdGVuZXJzKClcbiAgICBwb3N0LnRvTWFpbiAncmVsb2FkV2luJyB3aW5JRDp3aW5kb3cud2luSUQsIGZpbGU6ZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbndpbmRvdy5vbnJlc2l6ZSA9IC0+XG5cbiAgICBrbG9nICdrby53aW5kb3cub25yZXNpemUnXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgd2luZG93Lndpbi5vbk1vdmVkIHdpbmRvdy53aW4uZ2V0Qm91bmRzKClcbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAyMDBcblxucG9zdC5vbiAnc3BsaXQnIChzKSAtPlxuXG4gICAgZmlsZWJyb3dzZXIucmVzaXplZCgpXG4gICAgdGVybWluYWwucmVzaXplZCgpXG4gICAgY29tbWFuZGxpbmUucmVzaXplZCgpXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxudG9nZ2xlQ2VudGVyVGV4dCA9IC0+XG5cbiAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwiaW52aXNpYmxlc3wje2VkaXRvci5jdXJyZW50RmlsZX1cIiBmYWxzZVxuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG4gICAgICAgIHJlc3RvcmVJbnZpc2libGVzID0gdHJ1ZVxuXG4gICAgaWYgbm90IHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIHRydWVcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZVxuICAgIGVsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgZmFsc2VcblxuICAgIGlmIHJlc3RvcmVJbnZpc2libGVzXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG5zZXRGb250U2l6ZSA9IChzKSAtPlxuXG4gICAgcyA9IHByZWZzLmdldCgnZWRpdG9yRm9udFNpemUnIDE5KSBpZiBub3QgXy5pc0Zpbml0ZSBzXG4gICAgcyA9IGNsYW1wIDggMTAwIHNcblxuICAgIHdpbmRvdy5zdGFzaC5zZXQgXCJmb250U2l6ZVwiIHNcbiAgICBlZGl0b3Iuc2V0Rm9udFNpemUgc1xuICAgIGlmIGVkaXRvci5jdXJyZW50RmlsZT9cbiAgICAgICAgcG9zdC5lbWl0ICdsb2FkRmlsZScgZWRpdG9yLmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuXG5jaGFuZ2VGb250U2l6ZSA9IChkKSAtPlxuXG4gICAgaWYgICAgICBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAzMFxuICAgICAgICBmID0gNFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gNTBcbiAgICAgICAgZiA9IDEwXG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAyMFxuICAgICAgICBmID0gMlxuICAgIGVsc2VcbiAgICAgICAgZiA9IDFcbiAgICBzZXRGb250U2l6ZSBlZGl0b3Iuc2l6ZS5mb250U2l6ZSArIGYqZFxuXG5yZXNldEZvbnRTaXplID0gLT5cblxuICAgIGRlZmF1bHRGb250U2l6ZSA9IHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnIDE5XG4gICAgd2luZG93LnN0YXNoLnNldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuICAgIHNldEZvbnRTaXplIGRlZmF1bHRGb250U2l6ZVxuXG5hZGRUb1NoZWxmID0gLT5cblxuICAgIGZpbGVCcm93c2VyID0gd2luZG93LmZpbGVicm93c2VyXG4gICAgcmV0dXJuIGlmIHdpbmRvdy5sYXN0Rm9jdXMgPT0gJ3NoZWxmJ1xuICAgIGlmIHdpbmRvdy5sYXN0Rm9jdXMuc3RhcnRzV2l0aCBmaWxlQnJvd3Nlci5uYW1lXG4gICAgICAgIHBhdGggPSBmaWxlQnJvd3Nlci5jb2x1bW5XaXRoTmFtZSh3aW5kb3cubGFzdEZvY3VzKS5hY3RpdmVQYXRoKClcbiAgICBlbHNlXG4gICAgICAgIHBhdGggPSBlZGl0b3IuY3VycmVudEZpbGVcbiAgICBwb3N0LmVtaXQgJ2FkZFRvU2hlbGYnIHBhdGhcblxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jICAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgICAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxucmVzZXRab29tOiAtPlxuXG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciAxXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG5jaGFuZ2Vab29tOiAoZCkgLT5cbiAgICBcbiAgICB6ID0gd2ViZnJhbWUuZ2V0Wm9vbUZhY3RvcigpXG4gICAgeiAqPSAxK2QvMjBcbiAgICB6ID0gY2xhbXAgMC4zNiA1LjIzIHpcbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIHpcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG53aW5kb3cub25ibHVyICA9IChldmVudCkgLT4gcG9zdC5lbWl0ICd3aW5Gb2N1cycgZmFsc2VcbndpbmRvdy5vbmZvY3VzID0gKGV2ZW50KSAtPlxuICAgIHBvc3QuZW1pdCAnd2luRm9jdXMnIHRydWVcbiAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSA9PSAnYm9keSdcbiAgICAgICAgaWYgc3BsaXQuZWRpdG9yVmlzaWJsZSgpXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG53aW5kb3cuc2V0TGFzdEZvY3VzID0gKG5hbWUpIC0+IHdpbmRvdy5sYXN0Rm9jdXMgPSBuYW1lXG5cbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG5vbkNvbWJvID0gKGNvbWJvLCBpbmZvKSAtPlxuXG4gICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuXG4gICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IH0gPSBpbmZvXG5cbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB3aW5kb3cuY29tbWFuZGxpbmUuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gdGl0bGViYXIuZ2xvYmFsTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG5cbiAgICBmb3IgaSBpbiBbMS4uOV1cbiAgICAgICAgaWYgY29tYm8gaXMgXCJhbHQrI3tpfVwiXG4gICAgICAgICAgICByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBwb3N0LnRvTWFpbiAnYWN0aXZhdGVXaW5kb3cnIGlcblxuICAgIHN3aXRjaCBjb21ib1xuICAgICAgICB3aGVuICdmMycgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc2NyZWVuU2hvdCgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrPScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSArMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCswJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEByZXNldFpvb20oKVxuICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt5JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcblxucG9zdC5vbiAnY29tYm8nIG9uQ29tYm9cblxubmV3IFdpbmRvd1xuIl19
//# sourceURL=../../coffee/win/window.coffee
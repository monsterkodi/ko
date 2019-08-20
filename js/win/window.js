// koffee 1.4.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var Browser, CWD, Commandline, Editor, FPS, FileEditor, FileHandler, Info, Navigate, Split, Tabs, Terminal, Titlebar, _, addToShelf, changeFontSize, childp, clamp, clearListeners, commandline, dialog, drag, editor, electron, empty, filehandler, fs, keyinfo, klog, mainmenu, menu, noon, onClose, onCombo, onMenuAction, onMove, os, pkg, post, prefs, projects, ref, reloadWin, remote, resetFontSize, restoreWin, saveStash, scheme, setFontSize, sh, slash, stash, stopEvent, store, sw, tabs, terminal, titlebar, toggleCenterText, valid, w, win, winID, winMain;

ref = require('kxk'), post = ref.post, win = ref.win, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, prefs = ref.prefs, stash = ref.stash, childp = ref.childp, store = ref.store, drag = ref.drag, noon = ref.noon, slash = ref.slash, clamp = ref.clamp, sw = ref.sw, sh = ref.sh, os = ref.os, fs = ref.fs, valid = ref.valid, empty = ref.empty, klog = ref.klog, _ = ref._;

menu = require('./menu');

w = new win({
    dir: __dirname,
    pkg: require('../../package.json'),
    menu: '../../coffee/menu.noon',
    icon: '../../img/menu@2x.png',
    scheme: false,
    menuTemplate: menu
});

Split = require('./split');

Terminal = require('./terminal');

Tabs = require('./tabs');

Titlebar = require('./titlebar');

Info = require('./info');

FileHandler = require('./filehandler');

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

win = window.win = remote.getCurrentWindow();

winID = window.winID = win.id;

editor = null;

mainmenu = null;

terminal = null;

commandline = null;

titlebar = null;

tabs = null;

filehandler = null;

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

post.on('reloadWin', function() {
    return reloadWin();
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

winMain = function() {
    var cwd, fps, info, navigate, s, split;
    filehandler = window.filehandler = new FileHandler;
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
    return editor.focus();
};

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
    editor.stopWatcher();
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
    editor.stopWatcher();
    return win.webContents.reloadIgnoringCache();
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

onMenuAction = function(name, args) {
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
        case 'Reload Window':
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
    }
    switch (name) {
        case 'Cycle Windows':
            args = winID;
    }
    return post.toMain('menuAction', name, args);
};

post.on('menuAction', onMenuAction);

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

winMain();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUNzRSxPQUFBLENBQVEsS0FBUixDQUR0RSxFQUFFLGVBQUYsRUFBUSxhQUFSLEVBQWEseUJBQWIsRUFBd0IscUJBQXhCLEVBQWlDLGlCQUFqQyxFQUF3QyxpQkFBeEMsRUFBK0MsbUJBQS9DLEVBQXVELGlCQUF2RCxFQUNFLGVBREYsRUFDUSxlQURSLEVBQ2MsaUJBRGQsRUFDcUIsaUJBRHJCLEVBQzRCLFdBRDVCLEVBQ2dDLFdBRGhDLEVBQ29DLFdBRHBDLEVBQ3dDLFdBRHhDLEVBQzRDLGlCQUQ1QyxFQUNtRCxpQkFEbkQsRUFDMEQsZUFEMUQsRUFDZ0U7O0FBRWhFLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7QUFFUCxDQUFBLEdBQUksSUFBSSxHQUFKLENBQ0E7SUFBQSxHQUFBLEVBQVEsU0FBUjtJQUNBLEdBQUEsRUFBUSxPQUFBLENBQVEsb0JBQVIsQ0FEUjtJQUVBLElBQUEsRUFBUSx3QkFGUjtJQUdBLElBQUEsRUFBUSx1QkFIUjtJQUlBLE1BQUEsRUFBUSxLQUpSO0lBS0EsWUFBQSxFQUFjLElBTGQ7Q0FEQTs7QUFRSixLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsNEJBQVI7O0FBQ2QsVUFBQSxHQUFjLE9BQUEsQ0FBUSxzQkFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNk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WSxDQUFDLENBQWIsQ0FBakI7QUFIMUMsYUFJUyxpQkFKVDtBQUltQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQWpCO0FBSjFDLGFBS1MsZUFMVDtBQUttQyxtQkFBTyxTQUFBLENBQVUsS0FBVixFQUFpQixLQUFLLEVBQUMsRUFBRCxFQUFMLENBQVMsaUJBQVQsQ0FBakI7QUFMMUM7QUFiTTs7QUFvQlYsSUFBSSxDQUFDLEVBQUwsQ0FBUSxPQUFSLEVBQWlCLE9BQWpCOztBQUVBLE9BQUEsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwICAgICAwMFxuIyMjXG5cbnsgcG9zdCwgd2luLCBzdG9wRXZlbnQsIGtleWluZm8sIHByZWZzLCBzdGFzaCwgY2hpbGRwLCBzdG9yZSxcbiAgZHJhZywgbm9vbiwgc2xhc2gsIGNsYW1wLCBzdywgc2gsIG9zLCBmcywgdmFsaWQsIGVtcHR5LCBrbG9nLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbm1lbnUgPSByZXF1aXJlICcuL21lbnUnXG5cbncgPSBuZXcgd2luXG4gICAgZGlyOiAgICBfX2Rpcm5hbWVcbiAgICBwa2c6ICAgIHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcbiAgICBtZW51OiAgICcuLi8uLi9jb2ZmZWUvbWVudS5ub29uJ1xuICAgIGljb246ICAgJy4uLy4uL2ltZy9tZW51QDJ4LnBuZydcbiAgICBzY2hlbWU6IGZhbHNlXG4gICAgbWVudVRlbXBsYXRlOiBtZW51XG5cblNwbGl0ICAgICAgID0gcmVxdWlyZSAnLi9zcGxpdCdcblRlcm1pbmFsICAgID0gcmVxdWlyZSAnLi90ZXJtaW5hbCdcblRhYnMgICAgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuVGl0bGViYXIgICAgPSByZXF1aXJlICcuL3RpdGxlYmFyJ1xuSW5mbyAgICAgICAgPSByZXF1aXJlICcuL2luZm8nXG5GaWxlSGFuZGxlciA9IHJlcXVpcmUgJy4vZmlsZWhhbmRsZXInXG5FZGl0b3IgICAgICA9IHJlcXVpcmUgJy4uL2VkaXRvci9lZGl0b3InXG5Db21tYW5kbGluZSA9IHJlcXVpcmUgJy4uL2NvbW1hbmRsaW5lL2NvbW1hbmRsaW5lJ1xuRmlsZUVkaXRvciAgPSByZXF1aXJlICcuLi9lZGl0b3IvZmlsZWVkaXRvcidcbk5hdmlnYXRlICAgID0gcmVxdWlyZSAnLi4vbWFpbi9uYXZpZ2F0ZSdcbkZQUyAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZnBzJ1xuQ1dEICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9jd2QnXG5zY2hlbWUgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3NjaGVtZSdcbnByb2plY3RzICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvcHJvamVjdHMnXG5lbGVjdHJvbiAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xucGtnICAgICAgICAgPSByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG5cbnJlbW90ZSAgICAgID0gZWxlY3Ryb24ucmVtb3RlXG5kaWFsb2cgICAgICA9IHJlbW90ZS5kaWFsb2dcbkJyb3dzZXIgICAgID0gcmVtb3RlLkJyb3dzZXJXaW5kb3dcbndpbiAgICAgICAgID0gd2luZG93LndpbiAgID0gcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKVxud2luSUQgICAgICAgPSB3aW5kb3cud2luSUQgPSB3aW4uaWRcbmVkaXRvciAgICAgID0gbnVsbFxubWFpbm1lbnUgICAgPSBudWxsXG50ZXJtaW5hbCAgICA9IG51bGxcbmNvbW1hbmRsaW5lID0gbnVsbFxudGl0bGViYXIgICAgPSBudWxsXG50YWJzICAgICAgICA9IG51bGxcbmZpbGVoYW5kbGVyID0gbnVsbFxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXRlID0gbmV3IHN0b3JlICdzdGF0ZScgc2VwYXJhdG9yOid8J1xud2luZG93LnByZWZzID0gcHJlZnNcbndpbmRvdy5zdGFzaCA9IG5ldyBzdGFzaCBcIndpbi8je3dpbklEfVwiIHNlcGFyYXRvcjonfCdcblxucG9zdC5zZXRNYXhMaXN0ZW5lcnMgMjBcblxuc2F2ZVN0YXNoID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc3Rhc2gnXG4gICAgZWRpdG9yLnNhdmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9ucygpXG4gICAgd2luZG93LnN0YXNoLnNhdmUoKVxuICAgIHBvc3QudG9NYWluICdzdGFzaFNhdmVkJ1xuXG5yZXN0b3JlV2luID0gLT5cblxuICAgIGlmIGJvdW5kcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2JvdW5kcydcbiAgICAgICAgd2luLnNldEJvdW5kcyBib3VuZHNcblxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2RldlRvb2xzJ1xuICAgICAgICB3aW4ud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMFxuXG5wb3N0Lm9uICdzaW5nbGVDdXJzb3JBdFBvcycgKHBvcywgb3B0KSAtPlxuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdFxuICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxucG9zdC5vbiAnZm9jdXNFZGl0b3InICAtPiBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xucG9zdC5vbiAnY2xvbmVGaWxlJyAgICAtPiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnLCBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ3JlbG9hZFdpbicgICAgLT4gcmVsb2FkV2luKClcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gd2luZG93Lndpbi5jbG9zZSgpXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxuIyB0ZXN0aW5nIHJlbGF0ZWQgLi4uXG5cbnBvc3Qub24gJ21haW5sb2cnLCAtPiBrbG9nLmFwcGx5IGtsb2csIGFyZ3VtZW50c1xuXG5wb3N0Lm9uICdwaW5nJywgKHdJRCwgYXJnQSwgYXJnQikgLT4gcG9zdC50b1dpbiB3SUQsICdwb25nJywgd2luSUQsIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3Bvc3RFZGl0b3JTdGF0ZScsIC0+XG4gICAgcG9zdC50b0FsbCAnZWRpdG9yU3RhdGUnLCB3aW5JRCxcbiAgICAgICAgbGluZXM6ICAgICAgZWRpdG9yLmxpbmVzKClcbiAgICAgICAgY3Vyc29yczogICAgZWRpdG9yLmN1cnNvcnMoKVxuICAgICAgICBtYWluOiAgICAgICBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHNlbGVjdGlvbnM6IGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgaGlnaGxpZ2h0czogZWRpdG9yLmhpZ2hsaWdodHMoKVxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxud2luTWFpbiA9IC0+XG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG5cbiAgICBmaWxlaGFuZGxlciA9IHdpbmRvdy5maWxlaGFuZGxlciA9IG5ldyBGaWxlSGFuZGxlclxuICAgIHRhYnMgICAgICAgID0gd2luZG93LnRhYnMgICAgICAgID0gbmV3IFRhYnMgd2luZG93LnRpdGxlYmFyLmVsZW1cbiAgICB0aXRsZWJhciAgICA9ICAgICAgICAgICAgICAgICAgICAgIG5ldyBUaXRsZWJhclxuICAgIG5hdmlnYXRlICAgID0gd2luZG93Lm5hdmlnYXRlICAgID0gbmV3IE5hdmlnYXRlKClcbiAgICBzcGxpdCAgICAgICA9IHdpbmRvdy5zcGxpdCAgICAgICA9IG5ldyBTcGxpdCgpXG4gICAgdGVybWluYWwgICAgPSB3aW5kb3cudGVybWluYWwgICAgPSBuZXcgVGVybWluYWwgJ3Rlcm1pbmFsJ1xuICAgIGVkaXRvciAgICAgID0gd2luZG93LmVkaXRvciAgICAgID0gbmV3IEZpbGVFZGl0b3IgJ2VkaXRvcidcbiAgICBjb21tYW5kbGluZSA9IHdpbmRvdy5jb21tYW5kbGluZSA9IG5ldyBDb21tYW5kbGluZSAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuICAgIGluZm8gICAgICAgID0gd2luZG93LmluZm8gICAgICAgID0gbmV3IEluZm8gZWRpdG9yXG4gICAgZnBzICAgICAgICAgPSB3aW5kb3cuZnBzICAgICAgICAgPSBuZXcgRlBTKClcbiAgICBjd2QgICAgICAgICA9IHdpbmRvdy5jd2QgICAgICAgICA9IG5ldyBDV0QoKVxuXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSB3aW5kb3cuZm9jdXNFZGl0b3IgPSBlZGl0b3JcbiAgICB3aW5kb3cubGFzdEZvY3VzID0gZWRpdG9yLm5hbWVcblxuICAgIHJlc3RvcmVXaW4oKVxuICAgIHNjaGVtZS5zZXQgcHJlZnMuZ2V0ICdzY2hlbWUnLCAnZGFyaydcblxuICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJywgKGZpbGUsIGxpbmVDaGFuZ2UpIC0+ICMgc2VuZHMgY2hhbmdlcyB0byBhbGwgd2luZG93c1xuICAgICAgICBwb3N0LnRvV2lucyAnZmlsZUxpbmVDaGFuZ2VzJywgZmlsZSwgW2xpbmVDaGFuZ2VdXG5cbiAgICBlZGl0b3Iub24gJ2NoYW5nZWQnLCAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgcmV0dXJuIGlmIGNoYW5nZUluZm8uZm9yZWlnblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnLCBlZGl0b3IuY3VycmVudEZpbGUsIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgbmF2aWdhdGUuYWRkRmlsZVBvcyBmaWxlOiBlZGl0b3IuY3VycmVudEZpbGUsIHBvczogZWRpdG9yLmN1cnNvclBvcygpXG5cbiAgICBzID0gd2luZG93LnN0YXNoLmdldCAnZm9udFNpemUnIHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnLCAxOVxuICAgIGVkaXRvci5zZXRGb250U2l6ZSBzIGlmIHNcblxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUsIDBcblxuICAgIHBvc3QuZW1pdCAncmVzdG9yZSdcbiAgICBlZGl0b3IuZm9jdXMoKVxuXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxud2luZG93LmVkaXRvcldpdGhOYW1lID0gKG4pIC0+XG5cbiAgICBzd2l0Y2ggblxuICAgICAgICB3aGVuICdlZGl0b3InICAgdGhlbiBlZGl0b3JcbiAgICAgICAgd2hlbiAnY29tbWFuZCcsICdjb21tYW5kbGluZScgdGhlbiBjb21tYW5kbGluZVxuICAgICAgICB3aGVuICd0ZXJtaW5hbCcgdGhlbiB0ZXJtaW5hbFxuICAgICAgICBlbHNlIGVkaXRvclxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxub25Nb3ZlICA9IC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycsIHdpbi5nZXRCb3VuZHMoKVxuXG5jbGVhckxpc3RlbmVycyA9IC0+XG5cbiAgICB3aW4ucmVtb3ZlTGlzdGVuZXIgJ2Nsb3NlJywgb25DbG9zZVxuICAgIHdpbi5yZW1vdmVMaXN0ZW5lciAnbW92ZScsICBvbk1vdmVcbiAgICB3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1vcGVuZWQnXG4gICAgd2luLndlYkNvbnRlbnRzLnJlbW92ZUFsbExpc3RlbmVycyAnZGV2dG9vbHMtY2xvc2VkJ1xuXG5vbkNsb3NlID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc2F2ZUNoYW5nZXMnXG4gICAgZWRpdG9yLnNldFRleHQgJydcbiAgICBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuXG4gICAgaWYgQnJvd3Nlci5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID4gMVxuICAgICAgICB3aW5kb3cuc3Rhc2guY2xlYXIoKVxuXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICBpbmZvLnJlbG9hZCgpXG4gICAgd2luLm9uICdjbG9zZScgb25DbG9zZVxuICAgIHdpbi5vbiAnbW92ZScgIG9uTW92ZVxuICAgIHdpbi53ZWJDb250ZW50cy5vbiAnZGV2dG9vbHMtb3BlbmVkJyAtPiB3aW5kb3cuc3Rhc2guc2V0ICdkZXZUb29scycsIHRydWVcbiAgICB3aW4ud2ViQ29udGVudHMub24gJ2RldnRvb2xzLWNsb3NlZCcgLT4gd2luZG93LnN0YXNoLnNldCAnZGV2VG9vbHMnXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxucmVsb2FkV2luID0gLT5cblxuICAgIHNhdmVTdGFzaCgpXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuICAgIGVkaXRvci5zdG9wV2F0Y2hlcigpXG4gICAgd2luLndlYkNvbnRlbnRzLnJlbG9hZElnbm9yaW5nQ2FjaGUoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG53aW5kb3cub25yZXNpemUgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW4uZ2V0Qm91bmRzKClcbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAyMDBcblxucG9zdC5vbiAnc3BsaXQnLCAocykgLT5cblxuICAgIGZpbGVicm93c2VyLnJlc2l6ZWQoKVxuICAgIHRlcm1pbmFsLnJlc2l6ZWQoKVxuICAgIGNvbW1hbmRsaW5lLnJlc2l6ZWQoKVxuICAgIGVkaXRvci5yZXNpemVkKClcblxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbnRvZ2dsZUNlbnRlclRleHQgPSAtPlxuXG4gICAgaWYgd2luZG93LnN0YXRlLmdldCBcImludmlzaWJsZXN8I3tlZGl0b3IuY3VycmVudEZpbGV9XCIsIGZhbHNlXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcbiAgICAgICAgcmVzdG9yZUludmlzaWJsZXMgPSB0cnVlXG5cbiAgICBpZiBub3Qgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgdHJ1ZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlXG4gICAgZWxzZVxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdjZW50ZXJUZXh0JyBmYWxzZVxuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCBmYWxzZVxuXG4gICAgaWYgcmVzdG9yZUludmlzaWJsZXNcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbnNldEZvbnRTaXplID0gKHMpIC0+XG5cbiAgICBzID0gcHJlZnMuZ2V0KCdlZGl0b3JGb250U2l6ZScgMTkpIGlmIG5vdCBfLmlzRmluaXRlIHNcbiAgICBzID0gY2xhbXAgOCwgMTAwLCBzXG5cbiAgICB3aW5kb3cuc3Rhc2guc2V0IFwiZm9udFNpemVcIiBzXG4gICAgZWRpdG9yLnNldEZvbnRTaXplIHNcbiAgICBpZiBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgIHBvc3QuZW1pdCAnbG9hZEZpbGUnIGVkaXRvci5jdXJyZW50RmlsZSwgcmVsb2FkOnRydWVcblxuY2hhbmdlRm9udFNpemUgPSAoZCkgLT5cblxuICAgIGlmICAgICAgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMzBcbiAgICAgICAgZiA9IDRcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDUwXG4gICAgICAgIGYgPSAxMFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gMjBcbiAgICAgICAgZiA9IDJcbiAgICBlbHNlXG4gICAgICAgIGYgPSAxXG4gICAgc2V0Rm9udFNpemUgZWRpdG9yLnNpemUuZm9udFNpemUgKyBmKmRcblxucmVzZXRGb250U2l6ZSA9IC0+XG5cbiAgICBkZWZhdWx0Rm9udFNpemUgPSBwcmVmcy5nZXQgJ2VkaXRvckZvbnRTaXplJyAxOVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZvbnRTaXplJyBkZWZhdWx0Rm9udFNpemVcbiAgICBzZXRGb250U2l6ZSBkZWZhdWx0Rm9udFNpemVcblxuYWRkVG9TaGVsZiA9IC0+XG5cbiAgICBmaWxlQnJvd3NlciA9IHdpbmRvdy5maWxlYnJvd3NlclxuICAgIHJldHVybiBpZiB3aW5kb3cubGFzdEZvY3VzID09ICdzaGVsZidcbiAgICBpZiB3aW5kb3cubGFzdEZvY3VzLnN0YXJ0c1dpdGggZmlsZUJyb3dzZXIubmFtZVxuICAgICAgICBwYXRoID0gZmlsZUJyb3dzZXIuY29sdW1uV2l0aE5hbWUod2luZG93Lmxhc3RGb2N1cykuYWN0aXZlUGF0aCgpXG4gICAgZWxzZVxuICAgICAgICBwYXRoID0gZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgcG9zdC5lbWl0ICdhZGRUb1NoZWxmJywgcGF0aFxuXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMgICAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgIDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5yZXNldFpvb206IC0+XG5cbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIDFcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbmNoYW5nZVpvb206IChkKSAtPlxuXG4gICAgeiA9IHdlYmZyYW1lLmdldFpvb21GYWN0b3IoKVxuICAgIHogKj0gMStkLzIwXG4gICAgeiA9IGNsYW1wIDAuMzYsIDUuMjMsIHpcbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIHpcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG53aW5kb3cub25ibHVyICA9IChldmVudCkgLT4gcG9zdC5lbWl0ICd3aW5Gb2N1cycsIGZhbHNlXG53aW5kb3cub25mb2N1cyA9IChldmVudCkgLT5cbiAgICBwb3N0LmVtaXQgJ3dpbkZvY3VzJywgdHJ1ZVxuICAgIGlmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xhc3NOYW1lID09ICdib2R5J1xuICAgICAgICBpZiBzcGxpdC5lZGl0b3JWaXNpYmxlKClcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdlZGl0b3InXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNwbGl0LmZvY3VzICdjb21tYW5kbGluZS1lZGl0b3InXG5cbndpbmRvdy5zZXRMYXN0Rm9jdXMgPSAobmFtZSkgLT5cbiAgICB3aW5kb3cubGFzdEZvY3VzID0gbmFtZVxuXG4jIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5vbk1lbnVBY3Rpb24gPSAobmFtZSwgYXJncykgLT5cblxuICAgIGlmIGFjdGlvbiA9IEVkaXRvci5hY3Rpb25XaXRoTmFtZSBuYW1lXG4gICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldXG4gICAgICAgICAgICB3aW5kb3cuZm9jdXNFZGl0b3JbYWN0aW9uLmtleV0gYXJncy5hY3RhcmdcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmhhbmRsZU1lbnVBY3Rpb24gbmFtZSwgYXJnc1xuICAgICAgICByZXR1cm5cblxuICAgIHN3aXRjaCBuYW1lXG5cbiAgICAgICAgd2hlbiAnZG9NYWNybycgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuY29tbWFuZGxpbmUuY29tbWFuZHMubWFjcm8uZXhlY3V0ZSBhcmdzLmFjdGFyZ1xuICAgICAgICB3aGVuICdVbmRvJyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5kby51bmRvKClcbiAgICAgICAgd2hlbiAnUmVkbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8ucmVkbygpXG4gICAgICAgIHdoZW4gJ0N1dCcgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmN1dCgpXG4gICAgICAgIHdoZW4gJ0NvcHknICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmNvcHkoKVxuICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5wYXN0ZSgpXG4gICAgICAgIHdoZW4gJ05ldyBUYWInICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICduZXdFbXB0eVRhYidcbiAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnLCBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgd2hlbiAnSW5jcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSArMVxuICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgIHdoZW4gJ09wZW4gV2luZG93IExpc3QnICAgICAgdGhlbiByZXR1cm4gdGl0bGViYXIuc2hvd0xpc3QoKVxuICAgICAgICB3aGVuICdOYXZpZ2F0ZSBCYWNrd2FyZCcgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmJhY2t3YXJkKClcbiAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgd2hlbiAnTWF4aW1pemUgRWRpdG9yJyAgICAgICB0aGVuIHJldHVybiBzcGxpdC5tYXhpbWl6ZUVkaXRvcigpXG4gICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICB3aGVuICdBY3RpdmF0ZSBOZXh0IFRhYicgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgd2hlbiAnQWN0aXZhdGUgUHJldmlvdXMgVGFiJyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICB3aGVuICdNb3ZlIFRhYiBSaWdodCcgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUgJ3JpZ2h0J1xuICAgICAgICB3aGVuICdPcGVuLi4uJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnXG4gICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScsIG5ld1RhYjogdHJ1ZVxuICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBXaW5kb3cuLi4nIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnLCBuZXdXaW5kb3c6IHRydWVcbiAgICAgICAgd2hlbiAnU2F2ZScgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlJ1xuICAgICAgICB3aGVuICdTYXZlIEFsbCcgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnc2F2ZUFsbCdcbiAgICAgICAgd2hlbiAnU2F2ZSBBcyAuLi4nICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVGaWxlQXMnXG4gICAgICAgIHdoZW4gJ1JldmVydCcgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdyZWxvYWRGaWxlJ1xuICAgICAgICB3aGVuICdSZWxvYWQgV2luZG93JyAgICAgICAgIHRoZW4gcmV0dXJuIHJlbG9hZFdpbigpXG4gICAgICAgIHdoZW4gJ0Nsb3NlIFRhYiBvciBXaW5kb3cnICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdjbG9zZVRhYk9yV2luZG93J1xuICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBUYWJzJyAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VPdGhlclRhYnMnXG4gICAgICAgIHdoZW4gJ0Nsb3NlIE90aGVyIFdpbmRvd3MnICAgdGhlbiByZXR1cm4gcG9zdC50b090aGVyV2lucyAnY2xvc2VXaW5kb3cnXG4gICAgICAgIHdoZW4gJ0Z1bGxzY3JlZW4nICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luLnNldEZ1bGxTY3JlZW4gIXdpbi5pc0Z1bGxTY3JlZW4oKVxuICAgICAgICB3aGVuICdDbGVhciBMaXN0JyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJywgW11cbiAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycsIFtwcmVmcy5zdG9yZS5maWxlXSwgbmV3VGFiOnRydWVcblxuICAgIHN3aXRjaCBuYW1lXG4gICAgICAgIHdoZW4gJ0N5Y2xlIFdpbmRvd3MnIHRoZW4gYXJncyA9IHdpbklEXG5cbiAgICAjIGxvZyBcInVuaGFuZGxlZCBtZW51IGFjdGlvbiEgcG9zdGluZyB0byBtYWluICcje25hbWV9JyBhcmdzOlwiLCBhcmdzXG5cbiAgICBwb3N0LnRvTWFpbiAnbWVudUFjdGlvbicsIG5hbWUsIGFyZ3NcblxucG9zdC5vbiAnbWVudUFjdGlvbicsIG9uTWVudUFjdGlvblxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxub25Db21ibyA9IChjb21ibywgaW5mbykgLT5cblxuICAgIHJldHVybiBpZiBub3QgY29tYm9cblxuICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCB9ID0gaW5mb1xuXG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHRpdGxlYmFyLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgZm9yIGkgaW4gWzEuLjldXG4gICAgICAgIGlmIGNvbWJvIGlzIFwiYWx0KyN7aX1cIlxuICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgcG9zdC50b01haW4gJ2FjdGl2YXRlV2luZG93JywgaVxuXG4gICAgc3dpdGNoIGNvbWJvXG4gICAgICAgIHdoZW4gJ2YzJyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzY3JlZW5TaG90KClcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCs9JyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tICsxXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrLScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSAtMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0KzAnICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQHJlc2V0Wm9vbSgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrYWx0K3knICAgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBzcGxpdC5kbyAnbWluaW1pemUgZWRpdG9yJ1xuXG5wb3N0Lm9uICdjb21ibycsIG9uQ29tYm9cblxud2luTWFpbigpXG4iXX0=
//# sourceURL=../../coffee/win/window.coffee
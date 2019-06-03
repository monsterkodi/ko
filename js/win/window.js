// koffee 0.56.0

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

window.stash = new stash("win/" + winID);

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUNzRSxPQUFBLENBQVEsS0FBUixDQUR0RSxFQUFFLGVBQUYsRUFBUSxhQUFSLEVBQWEseUJBQWIsRUFBd0IscUJBQXhCLEVBQWlDLGlCQUFqQyxFQUF3QyxpQkFBeEMsRUFBK0MsbUJBQS9DLEVBQXVELGlCQUF2RCxFQUNFLGVBREYsRUFDUSxlQURSLEVBQ2MsaUJBRGQsRUFDcUIsaUJBRHJCLEVBQzRCLFdBRDVCLEVBQ2dDLFdBRGhDLEVBQ29DLFdBRHBDLEVBQ3dDLFdBRHhDLEVBQzRDLGlCQUQ1QyxFQUNtRCxpQkFEbkQsRUFDMEQsZUFEMUQsRUFDZ0U7O0FBRWhFLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7QUFFUCxDQUFBLEdBQUksSUFBSSxHQUFKLENBQ0E7SUFBQSxHQUFBLEVBQVEsU0FBUjtJQUNBLEdBQUEsRUFBUSxPQUFBLENBQVEsb0JBQVIsQ0FEUjtJQUVBLElBQUEsRUFBUSx3QkFGUjtJQUdBLElBQUEsRUFBUSx1QkFIUjtJQUlBLE1BQUEsRUFBUSxLQUpSO0lBS0EsWUFBQSxFQUFjLElBTGQ7Q0FEQTs7QUFRSixLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsNEJBQVI7O0FBQ2QsVUFBQSxHQUFjLE9BQUEsQ0FBUSxzQkFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNk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LGlCQUpUO0FBSW1DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBakI7QUFKMUMsYUFLUyxlQUxUO0FBS21DLG1CQUFPLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLEtBQUssRUFBQyxFQUFELEVBQUwsQ0FBUyxpQkFBVCxDQUFqQjtBQUwxQztBQWJNOztBQW9CVixJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBaUIsT0FBakI7O0FBRUEsT0FBQSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyBwb3N0LCB3aW4sIHN0b3BFdmVudCwga2V5aW5mbywgcHJlZnMsIHN0YXNoLCBjaGlsZHAsIHN0b3JlLFxuICBkcmFnLCBub29uLCBzbGFzaCwgY2xhbXAsIHN3LCBzaCwgb3MsIGZzLCB2YWxpZCwgZW1wdHksIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubWVudSA9IHJlcXVpcmUgJy4vbWVudSdcblxudyA9IG5ldyB3aW5cbiAgICBkaXI6ICAgIF9fZGlybmFtZVxuICAgIHBrZzogICAgcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuICAgIG1lbnU6ICAgJy4uLy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgaWNvbjogICAnLi4vLi4vaW1nL21lbnVAMngucG5nJ1xuICAgIHNjaGVtZTogZmFsc2VcbiAgICBtZW51VGVtcGxhdGU6IG1lbnVcblxuU3BsaXQgICAgICAgPSByZXF1aXJlICcuL3NwbGl0J1xuVGVybWluYWwgICAgPSByZXF1aXJlICcuL3Rlcm1pbmFsJ1xuVGFicyAgICAgICAgPSByZXF1aXJlICcuL3RhYnMnXG5UaXRsZWJhciAgICA9IHJlcXVpcmUgJy4vdGl0bGViYXInXG5JbmZvICAgICAgICA9IHJlcXVpcmUgJy4vaW5mbydcbkZpbGVIYW5kbGVyID0gcmVxdWlyZSAnLi9maWxlaGFuZGxlcidcbkVkaXRvciAgICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2VkaXRvcidcbkNvbW1hbmRsaW5lID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZGxpbmUnXG5GaWxlRWRpdG9yICA9IHJlcXVpcmUgJy4uL2VkaXRvci9maWxlZWRpdG9yJ1xuTmF2aWdhdGUgICAgPSByZXF1aXJlICcuLi9tYWluL25hdmlnYXRlJ1xuRlBTICAgICAgICAgPSByZXF1aXJlICcuLi90b29scy9mcHMnXG5DV0QgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2N3ZCdcbnNjaGVtZSAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvc2NoZW1lJ1xucHJvamVjdHMgICAgPSByZXF1aXJlICcuLi90b29scy9wcm9qZWN0cydcbmVsZWN0cm9uICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5wa2cgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL3BhY2thZ2UuanNvbidcblxucmVtb3RlICAgICAgPSBlbGVjdHJvbi5yZW1vdGVcbmRpYWxvZyAgICAgID0gcmVtb3RlLmRpYWxvZ1xuQnJvd3NlciAgICAgPSByZW1vdGUuQnJvd3NlcldpbmRvd1xud2luICAgICAgICAgPSB3aW5kb3cud2luICAgPSByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpXG53aW5JRCAgICAgICA9IHdpbmRvdy53aW5JRCA9IHdpbi5pZFxuZWRpdG9yICAgICAgPSBudWxsXG5tYWlubWVudSAgICA9IG51bGxcbnRlcm1pbmFsICAgID0gbnVsbFxuY29tbWFuZGxpbmUgPSBudWxsXG50aXRsZWJhciAgICA9IG51bGxcbnRhYnMgICAgICAgID0gbnVsbFxuZmlsZWhhbmRsZXIgPSBudWxsXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMFxuXG53aW5kb3cuc3RhdGUgPSBuZXcgc3RvcmUgJ3N0YXRlJywgc2VwYXJhdG9yOiAnfCdcbndpbmRvdy5wcmVmcyA9IHByZWZzXG53aW5kb3cuc3Rhc2ggPSBuZXcgc3Rhc2ggXCJ3aW4vI3t3aW5JRH1cIlxuXG5wb3N0LnNldE1heExpc3RlbmVycyAyMFxuXG5zYXZlU3Rhc2ggPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzdGFzaCdcbiAgICBlZGl0b3Iuc2F2ZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zKClcbiAgICB3aW5kb3cuc3Rhc2guc2F2ZSgpXG4gICAgcG9zdC50b01haW4gJ3N0YXNoU2F2ZWQnXG5cbnJlc3RvcmVXaW4gPSAtPlxuXG4gICAgaWYgYm91bmRzID0gd2luZG93LnN0YXNoLmdldCAnYm91bmRzJ1xuICAgICAgICB3aW4uc2V0Qm91bmRzIGJvdW5kc1xuXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnZGV2VG9vbHMnXG4gICAgICAgIHdpbi53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKVxuXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwXG4jIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG5cbnBvc3Qub24gJ3NpbmdsZUN1cnNvckF0UG9zJywgKHBvcywgb3B0KSAtPlxuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdFxuICAgIGVkaXRvci5zY3JvbGwuY3Vyc29yVG9Ub3AoKVxucG9zdC5vbiAnZm9jdXNFZGl0b3InLCAgICAgICAtPiBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xucG9zdC5vbiAnY2xvbmVGaWxlJywgICAgICAgICAtPiBwb3N0LnRvTWFpbiAnbmV3V2luZG93V2l0aEZpbGUnLCBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ3JlbG9hZFdpbicsICAgICAgICAgLT4gcmVsb2FkV2luKClcbnBvc3Qub24gJ2Nsb3NlV2luZG93JywgICAgICAgLT4gd2luZG93Lndpbi5jbG9zZSgpXG5wb3N0Lm9uICdzYXZlU3Rhc2gnLCAgICAgICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycsIChlZGl0b3IpIC0+XG4gICAgd2luZG93LnNldExhc3RGb2N1cyBlZGl0b3IubmFtZVxuICAgIHdpbmRvdy5mb2N1c0VkaXRvciA9IGVkaXRvclxuICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gZWRpdG9yIGlmIGVkaXRvci5uYW1lICE9ICdjb21tYW5kbGluZS1lZGl0b3InXG5cbiMgdGVzdGluZyByZWxhdGVkIC4uLlxuXG5wb3N0Lm9uICdtYWlubG9nJywgLT4ga2xvZy5hcHBseSBrbG9nLCBhcmd1bWVudHNcblxucG9zdC5vbiAncGluZycsICh3SUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd0lELCAncG9uZycsIHdpbklELCBhcmdBLCBhcmdCXG5wb3N0Lm9uICdwb3N0RWRpdG9yU3RhdGUnLCAtPlxuICAgIHBvc3QudG9BbGwgJ2VkaXRvclN0YXRlJywgd2luSUQsXG4gICAgICAgIGxpbmVzOiAgICAgIGVkaXRvci5saW5lcygpXG4gICAgICAgIGN1cnNvcnM6ICAgIGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgbWFpbjogICAgICAgZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBzZWxlY3Rpb25zOiBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgIGhpZ2hsaWdodHM6IGVkaXRvci5oaWdobGlnaHRzKClcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbndpbk1haW4gPSAtPlxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuXG4gICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICB0YWJzICAgICAgICA9IHdpbmRvdy50YWJzICAgICAgICA9IG5ldyBUYWJzIHdpbmRvdy50aXRsZWJhci5lbGVtXG4gICAgdGl0bGViYXIgICAgPSAgICAgICAgICAgICAgICAgICAgICBuZXcgVGl0bGViYXJcbiAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgc3BsaXQgICAgICAgPSB3aW5kb3cuc3BsaXQgICAgICAgPSBuZXcgU3BsaXQoKVxuICAgIHRlcm1pbmFsICAgID0gd2luZG93LnRlcm1pbmFsICAgID0gbmV3IFRlcm1pbmFsICd0ZXJtaW5hbCdcbiAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgY29tbWFuZGxpbmUgPSB3aW5kb3cuY29tbWFuZGxpbmUgPSBuZXcgQ29tbWFuZGxpbmUgJ2NvbW1hbmRsaW5lLWVkaXRvcidcbiAgICBpbmZvICAgICAgICA9IHdpbmRvdy5pbmZvICAgICAgICA9IG5ldyBJbmZvIGVkaXRvclxuICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgY3dkICAgICAgICAgPSB3aW5kb3cuY3dkICAgICAgICAgPSBuZXcgQ1dEKClcblxuICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93Lmxhc3RGb2N1cyA9IGVkaXRvci5uYW1lXG5cbiAgICByZXN0b3JlV2luKClcbiAgICBzY2hlbWUuc2V0IHByZWZzLmdldCAnc2NoZW1lJywgJ2RhcmsnXG5cbiAgICB0ZXJtaW5hbC5vbiAnZmlsZVNlYXJjaFJlc3VsdENoYW5nZScsIChmaWxlLCBsaW5lQ2hhbmdlKSAtPiAjIHNlbmRzIGNoYW5nZXMgdG8gYWxsIHdpbmRvd3NcbiAgICAgICAgcG9zdC50b1dpbnMgJ2ZpbGVMaW5lQ2hhbmdlcycsIGZpbGUsIFtsaW5lQ2hhbmdlXVxuXG4gICAgZWRpdG9yLm9uICdjaGFuZ2VkJywgKGNoYW5nZUluZm8pIC0+XG4gICAgICAgIHJldHVybiBpZiBjaGFuZ2VJbmZvLmZvcmVpZ25cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgcG9zdC50b090aGVyV2lucyAnZmlsZUxpbmVDaGFuZ2VzJywgZWRpdG9yLmN1cnJlbnRGaWxlLCBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIG5hdmlnYXRlLmFkZEZpbGVQb3MgZmlsZTogZWRpdG9yLmN1cnJlbnRGaWxlLCBwb3M6IGVkaXRvci5jdXJzb3JQb3MoKVxuXG4gICAgcyA9IHdpbmRvdy5zdGFzaC5nZXQgJ2ZvbnRTaXplJywgcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScsIDE5XG4gICAgZWRpdG9yLnNldEZvbnRTaXplIHMgaWYgc1xuXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCdcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZSwgMFxuXG4gICAgcG9zdC5lbWl0ICdyZXN0b3JlJ1xuICAgIGVkaXRvci5mb2N1cygpXG5cbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG53aW5kb3cuZWRpdG9yV2l0aE5hbWUgPSAobikgLT5cblxuICAgIHN3aXRjaCBuXG4gICAgICAgIHdoZW4gJ2VkaXRvcicgICB0aGVuIGVkaXRvclxuICAgICAgICB3aGVuICdjb21tYW5kJywgJ2NvbW1hbmRsaW5lJyB0aGVuIGNvbW1hbmRsaW5lXG4gICAgICAgIHdoZW4gJ3Rlcm1pbmFsJyB0aGVuIHRlcm1pbmFsXG4gICAgICAgIGVsc2UgZWRpdG9yXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbk1vdmUgID0gLT4gd2luZG93LnN0YXNoLnNldCAnYm91bmRzJywgd2luLmdldEJvdW5kcygpXG5cbmNsZWFyTGlzdGVuZXJzID0gLT5cblxuICAgIHdpbi5yZW1vdmVMaXN0ZW5lciAnY2xvc2UnLCBvbkNsb3NlXG4gICAgd2luLnJlbW92ZUxpc3RlbmVyICdtb3ZlJywgIG9uTW92ZVxuICAgIHdpbi53ZWJDb250ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMgJ2RldnRvb2xzLW9wZW5lZCdcbiAgICB3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1jbG9zZWQnXG5cbm9uQ2xvc2UgPSAtPlxuXG4gICAgcG9zdC5lbWl0ICdzYXZlQ2hhbmdlcydcbiAgICBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgIGVkaXRvci5zdG9wV2F0Y2hlcigpXG5cbiAgICBpZiBCcm93c2VyLmdldEFsbFdpbmRvd3MoKS5sZW5ndGggPiAxXG4gICAgICAgIHdpbmRvdy5zdGFzaC5jbGVhcigpXG5cbiAgICBjbGVhckxpc3RlbmVycygpXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5kb3cub25sb2FkID0gLT5cblxuICAgIHNwbGl0LnJlc2l6ZWQoKVxuICAgIGluZm8ucmVsb2FkKClcbiAgICB3aW4ub24gJ2Nsb3NlJywgb25DbG9zZVxuICAgIHdpbi5vbiAnbW92ZScsICBvbk1vdmVcbiAgICB3aW4ud2ViQ29udGVudHMub24gJ2RldnRvb2xzLW9wZW5lZCcsIC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2RldlRvb2xzJywgdHJ1ZVxuICAgIHdpbi53ZWJDb250ZW50cy5vbiAnZGV2dG9vbHMtY2xvc2VkJywgLT4gd2luZG93LnN0YXNoLnNldCAnZGV2VG9vbHMnXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxucmVsb2FkV2luID0gLT5cblxuICAgIHNhdmVTdGFzaCgpXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuICAgIGVkaXRvci5zdG9wV2F0Y2hlcigpXG4gICAgd2luLndlYkNvbnRlbnRzLnJlbG9hZElnbm9yaW5nQ2FjaGUoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG53aW5kb3cub25yZXNpemUgPSAtPlxuXG4gICAgc3BsaXQucmVzaXplZCgpXG4gICAgd2luZG93LnN0YXNoLnNldCAnYm91bmRzJywgd2luLmdldEJvdW5kcygpXG4gICAgaWYgd2luZG93LnN0YXNoLmdldCAnY2VudGVyVGV4dCcsIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUsIDIwMFxuXG5wb3N0Lm9uICdzcGxpdCcsIChzKSAtPlxuXG4gICAgZmlsZWJyb3dzZXIucmVzaXplZCgpXG4gICAgdGVybWluYWwucmVzaXplZCgpXG4gICAgY29tbWFuZGxpbmUucmVzaXplZCgpXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxudG9nZ2xlQ2VudGVyVGV4dCA9IC0+XG5cbiAgICBpZiB3aW5kb3cuc3RhdGUuZ2V0IFwiaW52aXNpYmxlc3wje2VkaXRvci5jdXJyZW50RmlsZX1cIiwgZmFsc2VcbiAgICAgICAgZWRpdG9yLnRvZ2dsZUludmlzaWJsZXMoKVxuICAgICAgICByZXN0b3JlSW52aXNpYmxlcyA9IHRydWVcblxuICAgIGlmIG5vdCB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0JywgZmFsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcsIHRydWVcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZVxuICAgIGVsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcsIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IGZhbHNlXG5cbiAgICBpZiByZXN0b3JlSW52aXNpYmxlc1xuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuc2V0Rm9udFNpemUgPSAocykgLT5cblxuICAgIHMgPSBwcmVmcy5nZXQoJ2VkaXRvckZvbnRTaXplJywgMTkpIGlmIG5vdCBfLmlzRmluaXRlIHNcbiAgICBzID0gY2xhbXAgOCwgMTAwLCBzXG5cbiAgICB3aW5kb3cuc3Rhc2guc2V0IFwiZm9udFNpemVcIiwgc1xuICAgIGVkaXRvci5zZXRGb250U2l6ZSBzXG4gICAgaWYgZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJywgZWRpdG9yLmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuXG5jaGFuZ2VGb250U2l6ZSA9IChkKSAtPlxuXG4gICAgaWYgICAgICBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAzMFxuICAgICAgICBmID0gNFxuICAgIGVsc2UgaWYgZWRpdG9yLnNpemUuZm9udFNpemUgPj0gNTBcbiAgICAgICAgZiA9IDEwXG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSAyMFxuICAgICAgICBmID0gMlxuICAgIGVsc2VcbiAgICAgICAgZiA9IDFcbiAgICBzZXRGb250U2l6ZSBlZGl0b3Iuc2l6ZS5mb250U2l6ZSArIGYqZFxuXG5yZXNldEZvbnRTaXplID0gLT5cblxuICAgIGRlZmF1bHRGb250U2l6ZSA9IHByZWZzLmdldCAnZWRpdG9yRm9udFNpemUnLCAxOVxuICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2ZvbnRTaXplJywgZGVmYXVsdEZvbnRTaXplXG4gICAgc2V0Rm9udFNpemUgZGVmYXVsdEZvbnRTaXplXG5cbmFkZFRvU2hlbGYgPSAtPlxuXG4gICAgZmlsZUJyb3dzZXIgPSB3aW5kb3cuZmlsZWJyb3dzZXJcbiAgICByZXR1cm4gaWYgd2luZG93Lmxhc3RGb2N1cyA9PSAnc2hlbGYnXG4gICAgaWYgd2luZG93Lmxhc3RGb2N1cy5zdGFydHNXaXRoIGZpbGVCcm93c2VyLm5hbWVcbiAgICAgICAgcGF0aCA9IGZpbGVCcm93c2VyLmNvbHVtbldpdGhOYW1lKHdpbmRvdy5sYXN0Rm9jdXMpLmFjdGl2ZVBhdGgoKVxuICAgIGVsc2VcbiAgICAgICAgcGF0aCA9IGVkaXRvci5jdXJyZW50RmlsZVxuICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicsIHBhdGhcblxuIyAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jICAgIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgICAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxucmVzZXRab29tOiAtPlxuXG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciAxXG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG5jaGFuZ2Vab29tOiAoZCkgLT5cblxuICAgIHogPSB3ZWJmcmFtZS5nZXRab29tRmFjdG9yKClcbiAgICB6ICo9IDErZC8yMFxuICAgIHogPSBjbGFtcCAwLjM2LCA1LjIzLCB6XG4gICAgd2ViZnJhbWUuc2V0Wm9vbUZhY3RvciB6XG4gICAgZWRpdG9yLnJlc2l6ZWQoKVxuXG4jIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxud2luZG93Lm9uYmx1ciAgPSAoZXZlbnQpIC0+IHBvc3QuZW1pdCAnd2luRm9jdXMnLCBmYWxzZVxud2luZG93Lm9uZm9jdXMgPSAoZXZlbnQpIC0+XG4gICAgcG9zdC5lbWl0ICd3aW5Gb2N1cycsIHRydWVcbiAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSA9PSAnYm9keSdcbiAgICAgICAgaWYgc3BsaXQuZWRpdG9yVmlzaWJsZSgpXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG53aW5kb3cuc2V0TGFzdEZvY3VzID0gKG5hbWUpIC0+XG4gICAgd2luZG93Lmxhc3RGb2N1cyA9IG5hbWVcblxuIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxub25NZW51QWN0aW9uID0gKG5hbWUsIGFyZ3MpIC0+XG5cbiAgICBpZiBhY3Rpb24gPSBFZGl0b3IuYWN0aW9uV2l0aE5hbWUgbmFtZVxuICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICByZXR1cm5cblxuICAgIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5oYW5kbGVNZW51QWN0aW9uIG5hbWUsIGFyZ3NcbiAgICAgICAgcmV0dXJuXG5cbiAgICBzd2l0Y2ggbmFtZVxuXG4gICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgYXJncy5hY3RhcmdcbiAgICAgICAgd2hlbiAnVW5kbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8udW5kbygpXG4gICAgICAgIHdoZW4gJ1JlZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnJlZG8oKVxuICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICB3aGVuICdDb3B5JyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jb3B5KClcbiAgICAgICAgd2hlbiAnUGFzdGUnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IucGFzdGUoKVxuICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJywgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgIHdoZW4gJ1RvZ2dsZSBTY2hlbWUnICAgICAgICAgdGhlbiByZXR1cm4gc2NoZW1lLnRvZ2dsZSgpXG4gICAgICAgIHdoZW4gJ1RvZ2dsZSBDZW50ZXIgVGV4dCcgICAgdGhlbiByZXR1cm4gdG9nZ2xlQ2VudGVyVGV4dCgpXG4gICAgICAgIHdoZW4gJ0luY3JlYXNlJyAgICAgICAgICAgICAgdGhlbiByZXR1cm4gY2hhbmdlRm9udFNpemUgKzFcbiAgICAgICAgd2hlbiAnRGVjcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSAtMVxuICAgICAgICB3aGVuICdSZXNldCcgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICB3aGVuICdPcGVuIFdpbmRvdyBMaXN0JyAgICAgIHRoZW4gcmV0dXJuIHRpdGxlYmFyLnNob3dMaXN0KClcbiAgICAgICAgd2hlbiAnTmF2aWdhdGUgQmFja3dhcmQnICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5iYWNrd2FyZCgpXG4gICAgICAgIHdoZW4gJ05hdmlnYXRlIEZvcndhcmQnICAgICAgdGhlbiByZXR1cm4gbmF2aWdhdGUuZm9yd2FyZCgpXG4gICAgICAgIHdoZW4gJ01heGltaXplIEVkaXRvcicgICAgICAgdGhlbiByZXR1cm4gc3BsaXQubWF4aW1pemVFZGl0b3IoKVxuICAgICAgICB3aGVuICdBZGQgdG8gU2hlbGYnICAgICAgICAgIHRoZW4gcmV0dXJuIGFkZFRvU2hlbGYoKVxuICAgICAgICB3aGVuICdUb2dnbGUgSGlzdG9yeScgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5maWxlYnJvd3Nlci5zaGVsZi50b2dnbGVIaXN0b3J5KClcbiAgICAgICAgd2hlbiAnQWN0aXZhdGUgTmV4dCBUYWInICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAncmlnaHQnXG4gICAgICAgIHdoZW4gJ0FjdGl2YXRlIFByZXZpb3VzIFRhYicgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubmF2aWdhdGUgJ2xlZnQnXG4gICAgICAgIHdoZW4gJ01vdmUgVGFiIExlZnQnICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LnRhYnMubW92ZSAnbGVmdCdcbiAgICAgICAgd2hlbiAnTW92ZSBUYWIgUmlnaHQnICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdyaWdodCdcbiAgICAgICAgd2hlbiAnT3Blbi4uLicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJ1xuICAgICAgICB3aGVuICdPcGVuIEluIE5ldyBUYWIuLi4nICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnLCBuZXdUYWI6IHRydWVcbiAgICAgICAgd2hlbiAnT3BlbiBJbiBOZXcgV2luZG93Li4uJyB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlJywgbmV3V2luZG93OiB0cnVlXG4gICAgICAgIHdoZW4gJ1NhdmUnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZSdcbiAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgIHdoZW4gJ1NhdmUgQXMgLi4uJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZUFzJ1xuICAgICAgICB3aGVuICdSZXZlcnQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAncmVsb2FkRmlsZSdcbiAgICAgICAgd2hlbiAnUmVsb2FkIFdpbmRvdycgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICB3aGVuICdDbG9zZSBUYWIgb3IgV2luZG93JyAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VUYWJPcldpbmRvdydcbiAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgVGFicycgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlT3RoZXJUYWJzJ1xuICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICB3aGVuICdGdWxsc2NyZWVuJyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbi5zZXRGdWxsU2NyZWVuICF3aW4uaXNGdWxsU2NyZWVuKClcbiAgICAgICAgd2hlbiAnQ2xlYXIgTGlzdCcgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuc3RhdGUuc2V0ICdyZWNlbnRGaWxlcycsIFtdXG4gICAgICAgIHdoZW4gJ1ByZWZlcmVuY2VzJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZXMnLCBbcHJlZnMuc3RvcmUuZmlsZV0sIG5ld1RhYjp0cnVlXG5cbiAgICBzd2l0Y2ggbmFtZVxuICAgICAgICB3aGVuICdDeWNsZSBXaW5kb3dzJyB0aGVuIGFyZ3MgPSB3aW5JRFxuXG4gICAgIyBsb2cgXCJ1bmhhbmRsZWQgbWVudSBhY3Rpb24hIHBvc3RpbmcgdG8gbWFpbiAnI3tuYW1lfScgYXJnczpcIiwgYXJnc1xuXG4gICAgcG9zdC50b01haW4gJ21lbnVBY3Rpb24nLCBuYW1lLCBhcmdzXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nLCBvbk1lbnVBY3Rpb25cblxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbm9uQ29tYm8gPSAoY29tYm8sIGluZm8pIC0+XG5cbiAgICByZXR1cm4gaWYgbm90IGNvbWJvXG5cbiAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgfSA9IGluZm9cblxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcbiAgICByZXR1cm4gc3RvcEV2ZW50KGV2ZW50KSBpZiAndW5oYW5kbGVkJyAhPSB0aXRsZWJhci5nbG9iYWxNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcblxuICAgIGZvciBpIGluIFsxLi45XVxuICAgICAgICBpZiBjb21ibyBpcyBcImFsdCsje2l9XCJcbiAgICAgICAgICAgIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHBvc3QudG9NYWluICdhY3RpdmF0ZVdpbmRvdycsIGlcblxuICAgIHN3aXRjaCBjb21ib1xuICAgICAgICB3aGVuICdmMycgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc2NyZWVuU2hvdCgpXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrPScgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAY2hhbmdlWm9vbSArMVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Ky0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gLTFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCswJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEByZXNldFpvb20oKVxuICAgICAgICB3aGVuICdjb21tYW5kK2FsdCt5JyAgICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgc3BsaXQuZG8gJ21pbmltaXplIGVkaXRvcidcblxucG9zdC5vbiAnY29tYm8nLCBvbkNvbWJvXG5cbndpbk1haW4oKVxuIl19
//# sourceURL=../../coffee/win/window.coffee
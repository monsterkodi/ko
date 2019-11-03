// koffee 1.4.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var Browser, CWD, Commandline, Editor, FPS, FileEditor, FileHandler, Info, Navigate, Split, Tabs, Terminal, Titlebar, _, addToShelf, args, changeFontSize, clamp, clearListeners, commandline, dialog, editor, electron, filehandler, klog, mainmenu, menu, onClose, onCombo, onMenuAction, onMove, pkg, post, prefs, projects, ref, reloadWin, remote, resetFontSize, restoreWin, saveStash, scheme, setFontSize, stash, stopEvent, store, tabs, terminal, titlebar, toggleCenterText, w, win, winID, winMain;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, store = ref.store, prefs = ref.prefs, stash = ref.stash, clamp = ref.clamp, klog = ref.klog, args = ref.args, win = ref.win, _ = ref._;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFzRSxPQUFBLENBQVEsS0FBUixDQUF0RSxFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixpQkFBbkIsRUFBMEIsaUJBQTFCLEVBQWlDLGlCQUFqQyxFQUF3QyxpQkFBeEMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsYUFBM0QsRUFBZ0U7O0FBRWhFLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7QUFFUCxDQUFBLEdBQUksSUFBSSxHQUFKLENBQ0E7SUFBQSxHQUFBLEVBQVEsU0FBUjtJQUNBLEdBQUEsRUFBUSxPQUFBLENBQVEsb0JBQVIsQ0FEUjtJQUVBLElBQUEsRUFBUSx3QkFGUjtJQUdBLElBQUEsRUFBUSx1QkFIUjtJQUlBLE1BQUEsRUFBUSxLQUpSO0lBS0EsWUFBQSxFQUFjLElBTGQ7Q0FEQTs7QUFRSixLQUFBLEdBQWMsT0FBQSxDQUFRLFNBQVI7O0FBQ2QsUUFBQSxHQUFjLE9BQUEsQ0FBUSxZQUFSOztBQUNkLElBQUEsR0FBYyxPQUFBLENBQVEsUUFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLFlBQVI7O0FBQ2QsSUFBQSxHQUFjLE9BQUEsQ0FBUSxRQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZUFBUjs7QUFDZCxNQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsNEJBQVI7O0FBQ2QsVUFBQSxHQUFjLE9BQUEsQ0FBUSxzQkFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLGtCQUFSOztBQUNkLEdBQUEsR0FBYyxPQUFBLENBQVEsY0FBUjs7QUFDZCxHQUFBLEdBQWMsT0FBQSxDQUFRLGNBQVI7O0FBQ2QsTUFBQSxHQUFjLE9BQUEsQ0FBUSxpQkFBUjs7QUFDZCxRQUFBLEdBQWMsT0FBQSxDQUFRLG1C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QU8sU0FBQSxDQUFVLEtBQVYsRUFBaUIsS0FBSyxFQUFDLEVBQUQsRUFBTCxDQUFTLGlCQUFULENBQWpCO0FBTDFDO0FBYk07O0FBb0JWLElBQUksQ0FBQyxFQUFMLENBQVEsT0FBUixFQUFnQixPQUFoQjs7QUFFQSxPQUFBLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwgc3RvcmUsIHByZWZzLCBzdGFzaCwgY2xhbXAsIGtsb2csIGFyZ3MsIHdpbiwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tZW51ID0gcmVxdWlyZSAnLi9tZW51J1xuXG53ID0gbmV3IHdpblxuICAgIGRpcjogICAgX19kaXJuYW1lXG4gICAgcGtnOiAgICByZXF1aXJlICcuLi8uLi9wYWNrYWdlLmpzb24nXG4gICAgbWVudTogICAnLi4vLi4vY29mZmVlL21lbnUubm9vbidcbiAgICBpY29uOiAgICcuLi8uLi9pbWcvbWVudUAyeC5wbmcnXG4gICAgc2NoZW1lOiBmYWxzZVxuICAgIG1lbnVUZW1wbGF0ZTogbWVudVxuXG5TcGxpdCAgICAgICA9IHJlcXVpcmUgJy4vc3BsaXQnXG5UZXJtaW5hbCAgICA9IHJlcXVpcmUgJy4vdGVybWluYWwnXG5UYWJzICAgICAgICA9IHJlcXVpcmUgJy4vdGFicydcblRpdGxlYmFyICAgID0gcmVxdWlyZSAnLi90aXRsZWJhcidcbkluZm8gICAgICAgID0gcmVxdWlyZSAnLi9pbmZvJ1xuRmlsZUhhbmRsZXIgPSByZXF1aXJlICcuL2ZpbGVoYW5kbGVyJ1xuRWRpdG9yICAgICAgPSByZXF1aXJlICcuLi9lZGl0b3IvZWRpdG9yJ1xuQ29tbWFuZGxpbmUgPSByZXF1aXJlICcuLi9jb21tYW5kbGluZS9jb21tYW5kbGluZSdcbkZpbGVFZGl0b3IgID0gcmVxdWlyZSAnLi4vZWRpdG9yL2ZpbGVlZGl0b3InXG5OYXZpZ2F0ZSAgICA9IHJlcXVpcmUgJy4uL21haW4vbmF2aWdhdGUnXG5GUFMgICAgICAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZwcydcbkNXRCAgICAgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvY3dkJ1xuc2NoZW1lICAgICAgPSByZXF1aXJlICcuLi90b29scy9zY2hlbWUnXG5wcm9qZWN0cyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Byb2plY3RzJ1xuZWxlY3Ryb24gICAgPSByZXF1aXJlICdlbGVjdHJvbidcbnBrZyAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vcGFja2FnZS5qc29uJ1xuXG5yZW1vdGUgICAgICA9IGVsZWN0cm9uLnJlbW90ZVxuZGlhbG9nICAgICAgPSByZW1vdGUuZGlhbG9nXG5Ccm93c2VyICAgICA9IHJlbW90ZS5Ccm93c2VyV2luZG93XG53aW4gICAgICAgICA9IHdpbmRvdy53aW4gICA9IHJlbW90ZS5nZXRDdXJyZW50V2luZG93KClcbndpbklEICAgICAgID0gd2luZG93LndpbklEID0gd2luLmlkXG5lZGl0b3IgICAgICA9IG51bGxcbm1haW5tZW51ICAgID0gbnVsbFxudGVybWluYWwgICAgPSBudWxsXG5jb21tYW5kbGluZSA9IG51bGxcbnRpdGxlYmFyICAgID0gbnVsbFxudGFicyAgICAgICAgPSBudWxsXG5maWxlaGFuZGxlciA9IG51bGxcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgIDAwMFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG5cbndpbmRvdy5zdGF0ZSA9IG5ldyBzdG9yZSAnc3RhdGUnIHNlcGFyYXRvcjonfCdcbndpbmRvdy5wcmVmcyA9IHByZWZzXG53aW5kb3cuc3Rhc2ggPSBuZXcgc3Rhc2ggXCJ3aW4vI3t3aW5JRH1cIiBzZXBhcmF0b3I6J3wnXG5cbnBvc3Quc2V0TWF4TGlzdGVuZXJzIDIwXG5cbnNhdmVTdGFzaCA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3N0YXNoJ1xuICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgIHdpbmRvdy5zdGFzaC5zYXZlKClcbiAgICBwb3N0LnRvTWFpbiAnc3Rhc2hTYXZlZCdcblxucmVzdG9yZVdpbiA9IC0+XG5cbiAgICBpZiBib3VuZHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdib3VuZHMnXG4gICAgICAgIHdpbi5zZXRCb3VuZHMgYm91bmRzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdkZXZUb29scydcbiAgICAgICAgd2luLndlYkNvbnRlbnRzLm9wZW5EZXZUb29scygpXG5cbiMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDBcbiMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAwMDBcbiMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDBcblxucG9zdC5vbiAnc2luZ2xlQ3Vyc29yQXRQb3MnIChwb3MsIG9wdCkgLT4gIyBicm93c2VyIGRvdWJsZSBjbGljayBhbmQgbmV3VGFiV2l0aEZpbGUgOmw6Y1xuICAgIGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBwb3MsIG9wdCBcbiAgICBlZGl0b3Iuc2Nyb2xsLmN1cnNvclRvVG9wKClcbnBvc3Qub24gJ2ZvY3VzRWRpdG9yJyAgLT4gc3BsaXQuZm9jdXMgJ2VkaXRvcidcbnBvc3Qub24gJ2Nsb25lRmlsZScgICAgLT4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbnBvc3Qub24gJ3JlbG9hZFdpbicgICAgLT4gcmVsb2FkV2luKClcbnBvc3Qub24gJ2Nsb3NlV2luZG93JyAgLT4gd2luZG93Lndpbi5jbG9zZSgpXG5wb3N0Lm9uICdzYXZlU3Rhc2gnICAgIC0+IHNhdmVTdGFzaCgpXG5wb3N0Lm9uICdlZGl0b3JGb2N1cycgKGVkaXRvcikgLT5cbiAgICB3aW5kb3cuc2V0TGFzdEZvY3VzIGVkaXRvci5uYW1lXG4gICAgd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93LnRleHRFZGl0b3IgPSBlZGl0b3IgaWYgZWRpdG9yLm5hbWUgIT0gJ2NvbW1hbmRsaW5lLWVkaXRvcidcblxuIyB0ZXN0aW5nIHJlbGF0ZWQgLi4uXG5cbnBvc3Qub24gJ21haW5sb2cnIC0+IGtsb2cuYXBwbHkga2xvZywgYXJndW1lbnRzXG5cbnBvc3Qub24gJ3BpbmcnICh3SUQsIGFyZ0EsIGFyZ0IpIC0+IHBvc3QudG9XaW4gd0lELCAncG9uZycgd2luSUQsIGFyZ0EsIGFyZ0JcbnBvc3Qub24gJ3Bvc3RFZGl0b3JTdGF0ZScgLT5cbiAgICBwb3N0LnRvQWxsICdlZGl0b3JTdGF0ZScgd2luSUQsXG4gICAgICAgIGxpbmVzOiAgICAgIGVkaXRvci5saW5lcygpXG4gICAgICAgIGN1cnNvcnM6ICAgIGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgbWFpbjogICAgICAgZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBzZWxlY3Rpb25zOiBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgIGhpZ2hsaWdodHM6IGVkaXRvci5oaWdobGlnaHRzKClcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbndpbk1haW4gPSAtPlxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuXG4gICAgZmlsZWhhbmRsZXIgPSB3aW5kb3cuZmlsZWhhbmRsZXIgPSBuZXcgRmlsZUhhbmRsZXJcbiAgICB0YWJzICAgICAgICA9IHdpbmRvdy50YWJzICAgICAgICA9IG5ldyBUYWJzIHdpbmRvdy50aXRsZWJhci5lbGVtXG4gICAgdGl0bGViYXIgICAgPSAgICAgICAgICAgICAgICAgICAgICBuZXcgVGl0bGViYXJcbiAgICBuYXZpZ2F0ZSAgICA9IHdpbmRvdy5uYXZpZ2F0ZSAgICA9IG5ldyBOYXZpZ2F0ZSgpXG4gICAgc3BsaXQgICAgICAgPSB3aW5kb3cuc3BsaXQgICAgICAgPSBuZXcgU3BsaXQoKVxuICAgIHRlcm1pbmFsICAgID0gd2luZG93LnRlcm1pbmFsICAgID0gbmV3IFRlcm1pbmFsICd0ZXJtaW5hbCdcbiAgICBlZGl0b3IgICAgICA9IHdpbmRvdy5lZGl0b3IgICAgICA9IG5ldyBGaWxlRWRpdG9yICdlZGl0b3InXG4gICAgY29tbWFuZGxpbmUgPSB3aW5kb3cuY29tbWFuZGxpbmUgPSBuZXcgQ29tbWFuZGxpbmUgJ2NvbW1hbmRsaW5lLWVkaXRvcidcbiAgICBpbmZvICAgICAgICA9IHdpbmRvdy5pbmZvICAgICAgICA9IG5ldyBJbmZvIGVkaXRvclxuICAgIGZwcyAgICAgICAgID0gd2luZG93LmZwcyAgICAgICAgID0gbmV3IEZQUygpXG4gICAgY3dkICAgICAgICAgPSB3aW5kb3cuY3dkICAgICAgICAgPSBuZXcgQ1dEKClcblxuICAgIHdpbmRvdy50ZXh0RWRpdG9yID0gd2luZG93LmZvY3VzRWRpdG9yID0gZWRpdG9yXG4gICAgd2luZG93Lmxhc3RGb2N1cyA9IGVkaXRvci5uYW1lXG5cbiAgICByZXN0b3JlV2luKClcbiAgICBzY2hlbWUuc2V0IHByZWZzLmdldCAnc2NoZW1lJyAnZGFyaydcblxuICAgIHRlcm1pbmFsLm9uICdmaWxlU2VhcmNoUmVzdWx0Q2hhbmdlJyAoZmlsZSwgbGluZUNoYW5nZSkgLT4gIyBzZW5kcyBjaGFuZ2VzIHRvIGFsbCB3aW5kb3dzXG4gICAgICAgIHBvc3QudG9XaW5zICdmaWxlTGluZUNoYW5nZXMnIGZpbGUsIFtsaW5lQ2hhbmdlXVxuXG4gICAgZWRpdG9yLm9uICdjaGFuZ2VkJyAoY2hhbmdlSW5mbykgLT5cbiAgICAgICAgcmV0dXJuIGlmIGNoYW5nZUluZm8uZm9yZWlnblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdmaWxlTGluZUNoYW5nZXMnIGVkaXRvci5jdXJyZW50RmlsZSwgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBuYXZpZ2F0ZS5hZGRGaWxlUG9zIGZpbGU6IGVkaXRvci5jdXJyZW50RmlsZSwgcG9zOiBlZGl0b3IuY3Vyc29yUG9zKClcblxuICAgIHMgPSB3aW5kb3cuc3Rhc2guZ2V0ICdmb250U2l6ZScgcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICBlZGl0b3Iuc2V0Rm9udFNpemUgcyBpZiBzXG5cbiAgICBpZiB3aW5kb3cuc3Rhc2guZ2V0ICdjZW50ZXJUZXh0J1xuICAgICAgICBlZGl0b3IuY2VudGVyVGV4dCB0cnVlLCAwXG5cbiAgICBwb3N0LmVtaXQgJ3Jlc3RvcmUnXG4gICAgZWRpdG9yLmZvY3VzKClcblxuIyAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbndpbmRvdy5lZGl0b3JXaXRoTmFtZSA9IChuKSAtPlxuXG4gICAgc3dpdGNoIG5cbiAgICAgICAgd2hlbiAnZWRpdG9yJyAgIHRoZW4gZWRpdG9yXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQnICdjb21tYW5kbGluZScgdGhlbiBjb21tYW5kbGluZVxuICAgICAgICB3aGVuICd0ZXJtaW5hbCcgdGhlbiB0ZXJtaW5hbFxuICAgICAgICBlbHNlIGVkaXRvclxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxub25Nb3ZlICA9IC0+IHdpbmRvdy5zdGFzaC5zZXQgJ2JvdW5kcycgd2luLmdldEJvdW5kcygpXG5cbmNsZWFyTGlzdGVuZXJzID0gLT5cblxuICAgIHdpbi5yZW1vdmVMaXN0ZW5lciAnY2xvc2UnIG9uQ2xvc2VcbiAgICB3aW4ucmVtb3ZlTGlzdGVuZXIgJ21vdmUnICBvbk1vdmVcbiAgICB3aW4ud2ViQ29udGVudHMucmVtb3ZlQWxsTGlzdGVuZXJzICdkZXZ0b29scy1vcGVuZWQnXG4gICAgd2luLndlYkNvbnRlbnRzLnJlbW92ZUFsbExpc3RlbmVycyAnZGV2dG9vbHMtY2xvc2VkJ1xuXG5vbkNsb3NlID0gLT5cblxuICAgIHBvc3QuZW1pdCAnc2F2ZUNoYW5nZXMnXG4gICAgZWRpdG9yLnNldFRleHQgJydcbiAgICBlZGl0b3Iuc3RvcFdhdGNoZXIoKVxuXG4gICAgaWYgQnJvd3Nlci5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID4gMVxuICAgICAgICB3aW5kb3cuc3Rhc2guY2xlYXIoKVxuXG4gICAgY2xlYXJMaXN0ZW5lcnMoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICBpbmZvLnJlbG9hZCgpXG4gICAgd2luLm9uICdjbG9zZScgb25DbG9zZVxuICAgIHdpbi5vbiAnbW92ZScgIG9uTW92ZVxuICAgIHdpbi53ZWJDb250ZW50cy5vbiAnZGV2dG9vbHMtb3BlbmVkJyAtPiB3aW5kb3cuc3Rhc2guc2V0ICdkZXZUb29scycgdHJ1ZVxuICAgIHdpbi53ZWJDb250ZW50cy5vbiAnZGV2dG9vbHMtY2xvc2VkJyAtPiB3aW5kb3cuc3Rhc2guc2V0ICdkZXZUb29scydcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG5yZWxvYWRXaW4gPSAtPlxuXG4gICAgc2F2ZVN0YXNoKClcbiAgICBjbGVhckxpc3RlbmVycygpXG4gICAgZWRpdG9yLnN0b3BXYXRjaGVyKClcbiAgICB3aW4ud2ViQ29udGVudHMucmVsb2FkSWdub3JpbmdDYWNoZSgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbndpbmRvdy5vbnJlc2l6ZSA9IC0+XG5cbiAgICBzcGxpdC5yZXNpemVkKClcbiAgICB3aW5kb3cuc3Rhc2guc2V0ICdib3VuZHMnIHdpbi5nZXRCb3VuZHMoKVxuICAgIGlmIHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIGVkaXRvci5jZW50ZXJUZXh0IHRydWUsIDIwMFxuXG5wb3N0Lm9uICdzcGxpdCcgKHMpIC0+XG5cbiAgICBmaWxlYnJvd3Nlci5yZXNpemVkKClcbiAgICB0ZXJtaW5hbC5yZXNpemVkKClcbiAgICBjb21tYW5kbGluZS5yZXNpemVkKClcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG50b2dnbGVDZW50ZXJUZXh0ID0gLT5cblxuICAgIGlmIHdpbmRvdy5zdGF0ZS5nZXQgXCJpbnZpc2libGVzfCN7ZWRpdG9yLmN1cnJlbnRGaWxlfVwiLCBmYWxzZVxuICAgICAgICBlZGl0b3IudG9nZ2xlSW52aXNpYmxlcygpXG4gICAgICAgIHJlc3RvcmVJbnZpc2libGVzID0gdHJ1ZVxuXG4gICAgaWYgbm90IHdpbmRvdy5zdGFzaC5nZXQgJ2NlbnRlclRleHQnIGZhbHNlXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ2NlbnRlclRleHQnIHRydWVcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgdHJ1ZVxuICAgIGVsc2VcbiAgICAgICAgd2luZG93LnN0YXNoLnNldCAnY2VudGVyVGV4dCcgZmFsc2VcbiAgICAgICAgZWRpdG9yLmNlbnRlclRleHQgZmFsc2VcblxuICAgIGlmIHJlc3RvcmVJbnZpc2libGVzXG4gICAgICAgIGVkaXRvci50b2dnbGVJbnZpc2libGVzKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG5zZXRGb250U2l6ZSA9IChzKSAtPlxuXG4gICAgcyA9IHByZWZzLmdldCgnZWRpdG9yRm9udFNpemUnIDE5KSBpZiBub3QgXy5pc0Zpbml0ZSBzXG4gICAgcyA9IGNsYW1wIDgsIDEwMCwgc1xuXG4gICAgd2luZG93LnN0YXNoLnNldCBcImZvbnRTaXplXCIgc1xuICAgIGVkaXRvci5zZXRGb250U2l6ZSBzXG4gICAgaWYgZWRpdG9yLmN1cnJlbnRGaWxlP1xuICAgICAgICBwb3N0LmVtaXQgJ2xvYWRGaWxlJyBlZGl0b3IuY3VycmVudEZpbGUsIHJlbG9hZDp0cnVlXG5cbmNoYW5nZUZvbnRTaXplID0gKGQpIC0+XG5cbiAgICBpZiAgICAgIGVkaXRvci5zaXplLmZvbnRTaXplID49IDMwXG4gICAgICAgIGYgPSA0XG4gICAgZWxzZSBpZiBlZGl0b3Iuc2l6ZS5mb250U2l6ZSA+PSA1MFxuICAgICAgICBmID0gMTBcbiAgICBlbHNlIGlmIGVkaXRvci5zaXplLmZvbnRTaXplID49IDIwXG4gICAgICAgIGYgPSAyXG4gICAgZWxzZVxuICAgICAgICBmID0gMVxuICAgIHNldEZvbnRTaXplIGVkaXRvci5zaXplLmZvbnRTaXplICsgZipkXG5cbnJlc2V0Rm9udFNpemUgPSAtPlxuXG4gICAgZGVmYXVsdEZvbnRTaXplID0gcHJlZnMuZ2V0ICdlZGl0b3JGb250U2l6ZScgMTlcbiAgICB3aW5kb3cuc3Rhc2guc2V0ICdmb250U2l6ZScgZGVmYXVsdEZvbnRTaXplXG4gICAgc2V0Rm9udFNpemUgZGVmYXVsdEZvbnRTaXplXG5cbmFkZFRvU2hlbGYgPSAtPlxuXG4gICAgZmlsZUJyb3dzZXIgPSB3aW5kb3cuZmlsZWJyb3dzZXJcbiAgICByZXR1cm4gaWYgd2luZG93Lmxhc3RGb2N1cyA9PSAnc2hlbGYnXG4gICAgaWYgd2luZG93Lmxhc3RGb2N1cy5zdGFydHNXaXRoIGZpbGVCcm93c2VyLm5hbWVcbiAgICAgICAgcGF0aCA9IGZpbGVCcm93c2VyLmNvbHVtbldpdGhOYW1lKHdpbmRvdy5sYXN0Rm9jdXMpLmFjdGl2ZVBhdGgoKVxuICAgIGVsc2VcbiAgICAgICAgcGF0aCA9IGVkaXRvci5jdXJyZW50RmlsZVxuICAgIHBvc3QuZW1pdCAnYWRkVG9TaGVsZicgcGF0aFxuXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMCAgICAgMDBcbiMgICAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgIDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG5yZXNldFpvb206IC0+XG5cbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIDFcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbmNoYW5nZVpvb206IChkKSAtPlxuXG4gICAgeiA9IHdlYmZyYW1lLmdldFpvb21GYWN0b3IoKVxuICAgIHogKj0gMStkLzIwXG4gICAgeiA9IGNsYW1wIDAuMzYsIDUuMjMsIHpcbiAgICB3ZWJmcmFtZS5zZXRab29tRmFjdG9yIHpcbiAgICBlZGl0b3IucmVzaXplZCgpXG5cbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4jIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG53aW5kb3cub25ibHVyICA9IChldmVudCkgLT4gcG9zdC5lbWl0ICd3aW5Gb2N1cycgZmFsc2VcbndpbmRvdy5vbmZvY3VzID0gKGV2ZW50KSAtPlxuICAgIHBvc3QuZW1pdCAnd2luRm9jdXMnIHRydWVcbiAgICBpZiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsYXNzTmFtZSA9PSAnYm9keSdcbiAgICAgICAgaWYgc3BsaXQuZWRpdG9yVmlzaWJsZSgpXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnZWRpdG9yJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGxpdC5mb2N1cyAnY29tbWFuZGxpbmUtZWRpdG9yJ1xuXG53aW5kb3cuc2V0TGFzdEZvY3VzID0gKG5hbWUpIC0+XG4gICAgd2luZG93Lmxhc3RGb2N1cyA9IG5hbWVcblxuIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxub25NZW51QWN0aW9uID0gKG5hbWUsIGFyZ3MpIC0+XG5cbiAgICBpZiBhY3Rpb24gPSBFZGl0b3IuYWN0aW9uV2l0aE5hbWUgbmFtZVxuICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIHdpbmRvdy5mb2N1c0VkaXRvclthY3Rpb24ua2V5XVxuICAgICAgICAgICAgd2luZG93LmZvY3VzRWRpdG9yW2FjdGlvbi5rZXldIGFyZ3MuYWN0YXJnXG4gICAgICAgICAgICByZXR1cm5cblxuICAgIGlmICd1bmhhbmRsZWQnICE9IHdpbmRvdy5jb21tYW5kbGluZS5oYW5kbGVNZW51QWN0aW9uIG5hbWUsIGFyZ3NcbiAgICAgICAgcmV0dXJuXG5cbiAgICBzd2l0Y2ggbmFtZVxuXG4gICAgICAgIHdoZW4gJ2RvTWFjcm8nICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzLm1hY3JvLmV4ZWN1dGUgYXJncy5hY3RhcmdcbiAgICAgICAgd2hlbiAnVW5kbycgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IuZG8udW5kbygpXG4gICAgICAgIHdoZW4gJ1JlZG8nICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZvY3VzRWRpdG9yLmRvLnJlZG8oKVxuICAgICAgICB3aGVuICdDdXQnICAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jdXQoKVxuICAgICAgICB3aGVuICdDb3B5JyAgICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy5mb2N1c0VkaXRvci5jb3B5KClcbiAgICAgICAgd2hlbiAnUGFzdGUnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuZm9jdXNFZGl0b3IucGFzdGUoKVxuICAgICAgICB3aGVuICdOZXcgVGFiJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnbmV3RW1wdHlUYWInXG4gICAgICAgIHdoZW4gJ05ldyBXaW5kb3cnICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBlZGl0b3IuY3VycmVudEZpbGVcbiAgICAgICAgd2hlbiAnVG9nZ2xlIFNjaGVtZScgICAgICAgICB0aGVuIHJldHVybiBzY2hlbWUudG9nZ2xlKClcbiAgICAgICAgd2hlbiAnVG9nZ2xlIENlbnRlciBUZXh0JyAgICB0aGVuIHJldHVybiB0b2dnbGVDZW50ZXJUZXh0KClcbiAgICAgICAgd2hlbiAnSW5jcmVhc2UnICAgICAgICAgICAgICB0aGVuIHJldHVybiBjaGFuZ2VGb250U2l6ZSArMVxuICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIGNoYW5nZUZvbnRTaXplIC0xXG4gICAgICAgIHdoZW4gJ1Jlc2V0JyAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcmVzZXRGb250U2l6ZSgpXG4gICAgICAgIHdoZW4gJ09wZW4gV2luZG93IExpc3QnICAgICAgdGhlbiByZXR1cm4gdGl0bGViYXIuc2hvd0xpc3QoKVxuICAgICAgICB3aGVuICdOYXZpZ2F0ZSBCYWNrd2FyZCcgICAgIHRoZW4gcmV0dXJuIG5hdmlnYXRlLmJhY2t3YXJkKClcbiAgICAgICAgd2hlbiAnTmF2aWdhdGUgRm9yd2FyZCcgICAgICB0aGVuIHJldHVybiBuYXZpZ2F0ZS5mb3J3YXJkKClcbiAgICAgICAgd2hlbiAnTWF4aW1pemUgRWRpdG9yJyAgICAgICB0aGVuIHJldHVybiBzcGxpdC5tYXhpbWl6ZUVkaXRvcigpXG4gICAgICAgIHdoZW4gJ0FkZCB0byBTaGVsZicgICAgICAgICAgdGhlbiByZXR1cm4gYWRkVG9TaGVsZigpXG4gICAgICAgIHdoZW4gJ1RvZ2dsZSBIaXN0b3J5JyAgICAgICAgdGhlbiByZXR1cm4gd2luZG93LmZpbGVicm93c2VyLnNoZWxmLnRvZ2dsZUhpc3RvcnkoKVxuICAgICAgICB3aGVuICdBY3RpdmF0ZSBOZXh0IFRhYicgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm5hdmlnYXRlICdyaWdodCdcbiAgICAgICAgd2hlbiAnQWN0aXZhdGUgUHJldmlvdXMgVGFiJyB0aGVuIHJldHVybiB3aW5kb3cudGFicy5uYXZpZ2F0ZSAnbGVmdCdcbiAgICAgICAgd2hlbiAnTW92ZSBUYWIgTGVmdCcgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cudGFicy5tb3ZlICdsZWZ0J1xuICAgICAgICB3aGVuICdNb3ZlIFRhYiBSaWdodCcgICAgICAgIHRoZW4gcmV0dXJuIHdpbmRvdy50YWJzLm1vdmUgJ3JpZ2h0J1xuICAgICAgICB3aGVuICdPcGVuLi4uJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnb3BlbkZpbGUnXG4gICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFRhYi4uLicgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3VGFiOiB0cnVlXG4gICAgICAgIHdoZW4gJ09wZW4gSW4gTmV3IFdpbmRvdy4uLicgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdvcGVuRmlsZScgbmV3V2luZG93OiB0cnVlXG4gICAgICAgIHdoZW4gJ1NhdmUnICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZSdcbiAgICAgICAgd2hlbiAnU2F2ZSBBbGwnICAgICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ3NhdmVBbGwnXG4gICAgICAgIHdoZW4gJ1NhdmUgQXMgLi4uJyAgICAgICAgICAgdGhlbiByZXR1cm4gcG9zdC5lbWl0ICdzYXZlRmlsZUFzJ1xuICAgICAgICB3aGVuICdSZXZlcnQnICAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAncmVsb2FkRmlsZSdcbiAgICAgICAgd2hlbiAnUmVsb2FkIFdpbmRvdycgICAgICAgICB0aGVuIHJldHVybiByZWxvYWRXaW4oKVxuICAgICAgICB3aGVuICdDbG9zZSBUYWIgb3IgV2luZG93JyAgIHRoZW4gcmV0dXJuIHBvc3QuZW1pdCAnY2xvc2VUYWJPcldpbmRvdydcbiAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgVGFicycgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ2Nsb3NlT3RoZXJUYWJzJ1xuICAgICAgICB3aGVuICdDbG9zZSBPdGhlciBXaW5kb3dzJyAgIHRoZW4gcmV0dXJuIHBvc3QudG9PdGhlcldpbnMgJ2Nsb3NlV2luZG93J1xuICAgICAgICB3aGVuICdGdWxsc2NyZWVuJyAgICAgICAgICAgIHRoZW4gcmV0dXJuIHdpbi5zZXRGdWxsU2NyZWVuICF3aW4uaXNGdWxsU2NyZWVuKClcbiAgICAgICAgd2hlbiAnQ2xlYXIgTGlzdCcgICAgICAgICAgICB0aGVuIHJldHVybiB3aW5kb3cuc3RhdGUuc2V0ICdyZWNlbnRGaWxlcycgW11cbiAgICAgICAgd2hlbiAnUHJlZmVyZW5jZXMnICAgICAgICAgICB0aGVuIHJldHVybiBwb3N0LmVtaXQgJ29wZW5GaWxlcycgW3ByZWZzLnN0b3JlLmZpbGVdLCBuZXdUYWI6dHJ1ZVxuXG4gICAgc3dpdGNoIG5hbWVcbiAgICAgICAgd2hlbiAnQ3ljbGUgV2luZG93cycgdGhlbiBhcmdzID0gd2luSURcblxuICAgICMgbG9nIFwidW5oYW5kbGVkIG1lbnUgYWN0aW9uISBwb3N0aW5nIHRvIG1haW4gJyN7bmFtZX0nIGFyZ3M6XCIsIGFyZ3NcblxuICAgIHBvc3QudG9NYWluICdtZW51QWN0aW9uJyBuYW1lLCBhcmdzXG5cbnBvc3Qub24gJ21lbnVBY3Rpb24nIG9uTWVudUFjdGlvblxuXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4jIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxub25Db21ibyA9IChjb21ibywgaW5mbykgLT5cblxuICAgIHJldHVybiBpZiBub3QgY29tYm9cblxuICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCB9ID0gaW5mb1xuXG4gICAgcmV0dXJuIHN0b3BFdmVudChldmVudCkgaWYgJ3VuaGFuZGxlZCcgIT0gd2luZG93LmNvbW1hbmRsaW5lLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuICAgIHJldHVybiBzdG9wRXZlbnQoZXZlbnQpIGlmICd1bmhhbmRsZWQnICE9IHRpdGxlYmFyLmdsb2JhbE1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuXG4gICAgZm9yIGkgaW4gWzEuLjldXG4gICAgICAgIGlmIGNvbWJvIGlzIFwiYWx0KyN7aX1cIlxuICAgICAgICAgICAgcmV0dXJuIHN0b3BFdmVudCBldmVudCwgcG9zdC50b01haW4gJ2FjdGl2YXRlV2luZG93JyBpXG5cbiAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgd2hlbiAnZjMnICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNjcmVlblNob3QoKVxuICAgICAgICB3aGVuICdjb21tYW5kK3NoaWZ0Kz0nICAgIHRoZW4gcmV0dXJuIHN0b3BFdmVudCBldmVudCwgQGNoYW5nZVpvb20gKzFcbiAgICAgICAgd2hlbiAnY29tbWFuZCtzaGlmdCstJyAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIEBjaGFuZ2Vab29tIC0xXG4gICAgICAgIHdoZW4gJ2NvbW1hbmQrc2hpZnQrMCcgICAgdGhlbiByZXR1cm4gc3RvcEV2ZW50IGV2ZW50LCBAcmVzZXRab29tKClcbiAgICAgICAgd2hlbiAnY29tbWFuZCthbHQreScgICAgICB0aGVuIHJldHVybiBzdG9wRXZlbnQgZXZlbnQsIHNwbGl0LmRvICdtaW5pbWl6ZSBlZGl0b3InXG5cbnBvc3Qub24gJ2NvbWJvJyBvbkNvbWJvXG5cbndpbk1haW4oKVxuIl19
//# sourceURL=../../coffee/win/window.coffee
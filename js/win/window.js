// monsterkodi/kode 0.270.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, isFunc: function (o) {return typeof o === 'function'}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }}

var addToShelf, changeFontSize, changeZoom, clearStash, commandline, Commandline, CWD, editor, Editor, electron, FileEditor, filehandler, FileHandler, filewatcher, FileWatcher, FPS, info, Info, klog, mainmenu, Navigate, onCombo, pkg, post, prefs, projects, reloadWin, resetFontSize, resetZoom, restoreWin, saveStash, scheme, setFontSize, split, Split, stash, stopEvent, store, tabs, Tabs, terminal, Terminal, titlebar, Titlebar, toggleCenterText, toggleTabPinned, win, Window

klog = require('kxk').klog
post = require('kxk').post
prefs = require('kxk').prefs
scheme = require('kxk').scheme
stash = require('kxk').stash
stopEvent = require('kxk').stopEvent
store = require('kxk').store
win = require('kxk').win

Split = require('./split')
Terminal = require('./terminal')
Tabs = require('./tabs')
Titlebar = require('./titlebar')
Info = require('./info')
FileHandler = require('./filehandler')
FileWatcher = require('../tools/watcher')
Editor = require('../editor/editor')
Commandline = require('../commandline/commandline')
FileEditor = require('../editor/fileeditor')
Navigate = require('../main/navigate')
FPS = require('../tools/fps')
CWD = require('../tools/cwd')
scheme = require('../tools/scheme')
projects = require('../tools/projects')
electron = require('electron')
pkg = require('../../package.json')
split = null
info = null
editor = null
mainmenu = null
terminal = null
commandline = null
titlebar = null
tabs = null
filehandler = null
filewatcher = null

Window = (function ()
{
    _k_.extend(Window, win)
    function Window ()
    {
        var cwd, fps, navigate, s

        this["onMenuAction"] = this["onMenuAction"].bind(this)
        this["onMoved"] = this["onMoved"].bind(this)
        Window.__super__.constructor.call(this,{dir:__dirname,menuTemplate:require('./menu'),pkg:require('../../package.json'),menu:'../../kode/menu.noon',icon:'../../img/menu@2x.png',scheme:false})
        window.stash = new stash(`win/${this.id}`,{separator:'|'})
        filehandler = window.filehandler = new FileHandler
        filewatcher = window.filewatcher = new FileWatcher
        tabs = window.tabs = new Tabs(window.titlebar.elem)
        titlebar = new Titlebar
        navigate = window.navigate = new Navigate()
        split = window.split = new Split()
        terminal = window.terminal = new Terminal('terminal')
        editor = window.editor = new FileEditor('editor')
        commandline = window.commandline = new Commandline('commandline-editor')
        info = window.info = new Info(editor)
        fps = window.fps = new FPS()
        cwd = window.cwd = new CWD()
        window.textEditor = window.focusEditor = editor
        window.setLastFocus(editor.name)
        restoreWin()
        scheme.set(prefs.get('scheme','dark'))
        terminal.on('fileSearchResultChange',function (file, lineChange)
        {
            return post.toWins('fileLineChanges',file,[lineChange])
        })
        editor.on('changed',function (changeInfo)
        {
            if (changeInfo.foreign)
            {
                return
            }
            if (changeInfo.changes.length)
            {
                post.toOtherWins('fileLineChanges',editor.currentFile,changeInfo.changes)
                if (changeInfo.deletes === 1)
                {
                    return navigate.delFilePos({file:editor.currentFile,pos:[0,changeInfo.changes[0].oldIndex]})
                }
                else
                {
                    return navigate.addFilePos({file:editor.currentFile,pos:editor.cursorPos()})
                }
            }
        })
        s = window.stash.get('fontSize',prefs.get('editorFontSize',19))
        if (s)
        {
            editor.setFontSize(s)
        }
        if (window.stash.get('centerText'))
        {
            editor.centerText(true,0)
        }
        post.emit('restore')
        editor.focus()
    }

    Window.prototype["onMoved"] = function (bounds)
    {
        return window.stash.set('bounds',bounds)
    }

    Window.prototype["onMenuAction"] = function (name, opts)
    {
        var action, _111_25_

        if (action = Editor.actionWithName(name))
        {
            if ((action.key != null) && _k_.isFunc(window.focusEditor[action.key]))
            {
                window.focusEditor[action.key](opts.actarg)
                return
            }
        }
        if ('unhandled' !== window.commandline.handleMenuAction(name,opts))
        {
            return
        }
        switch (name)
        {
            case 'doMacro':
                return window.commandline.commands.macro.execute(opts.actarg)

            case 'Undo':
                return window.focusEditor.do.undo()

            case 'Redo':
                return window.focusEditor.do.redo()

            case 'Cut':
                return window.focusEditor.cut()

            case 'Copy':
                return window.focusEditor.copy()

            case 'Paste':
                return window.focusEditor.paste()

            case 'New Tab':
                return post.emit('newEmptyTab')

            case 'New Window':
                return post.toMain('newWindowWithFile',editor.currentFile)

            case 'Cycle Windows':
                return post.toMain('activateNextWindow',window.winID)

            case 'Arrange Windows':
                return post.toMain('arrangeWindows')

            case 'Toggle Scheme':
                return scheme.toggle()

            case 'Toggle Center Text':
                return toggleCenterText()

            case 'Toggle Tab Pinned':
                return toggleTabPinned()

            case 'Increase':
                return changeFontSize(1)

            case 'Decrease':
                return changeFontSize(-1)

            case 'Reset':
                return resetFontSize()

            case 'Open Window List':
                return titlebar.showList()

            case 'Navigate Backward':
                return navigate.backward()

            case 'Navigate Forward':
                return navigate.forward()

            case 'Maximize Editor':
                return split.maximizeEditor()

            case 'Add to Shelf':
                return addToShelf()

            case 'Toggle History':
                return window.filebrowser.shelf.toggleHistory()

            case 'Activate Next Tab':
                return window.tabs.navigate('right')

            case 'Activate Previous Tab':
                return window.tabs.navigate('left')

            case 'Move Tab Left':
                return window.tabs.move('left')

            case 'Move Tab Right':
                return window.tabs.move('right')

            case 'Open...':
                return post.emit('openFile')

            case 'Open In New Tab...':
                return post.emit('openFile',{newTab:true})

            case 'Open In New Window...':
                return post.emit('openFile',{newWindow:true})

            case 'Save':
                return post.emit('saveFile')

            case 'Save All':
                return post.emit('saveAll')

            case 'Save As ...':
                return post.emit('saveFileAs')

            case 'Revert':
                return post.emit('reloadFile')

            case 'Close Tab or Window':
                return post.emit('closeTabOrWindow')

            case 'Close Other Tabs':
                return post.emit('closeOtherTabs')

            case 'Close Other Windows':
                return post.toOtherWins('closeWindow')

            case 'Clear List':
                window.state.set('recentFiles',[])
                window.titlebar.refreshMenu()
                return

            case 'Preferences':
                return post.emit('openFiles',[prefs.store.file],{newTab:true})

            case 'Cycle Windows':
                opts = this.id
                break
        }

        return Window.__super__.onMenuAction.call(this,name,opts)
    }

    return Window
})()

window.state = new store('state',{separator:'|'})
window.prefs = prefs
post.setMaxListeners(20)

saveStash = function ()
{
    post.emit('saveChanges')
    post.emit('stash')
    editor.saveScrollCursorsAndSelections()
    return window.stash.save()
}

clearStash = function ()
{
    post.emit('saveChanges')
    return window.stash.clear()
}

restoreWin = function ()
{
    var bounds

    if (bounds = window.stash.get('bounds'))
    {
        window.win.setBounds(bounds)
    }
    if (window.stash.get('devTools'))
    {
        return post.emit('menuAction','devtools')
    }
}
post.on('singleCursorAtPos',function (pos, opt)
{
    editor.singleCursorAtPos(pos,opt)
    return editor.scroll.cursorToTop()
})
post.on('focusEditor',function ()
{
    return split.focus('editor')
})
post.on('cloneFile',function ()
{
    return post.toMain('newWindowWithFile',editor.currentFile)
})
post.on('closeWindow',function ()
{
    return post.emit('menuAction','Close')
})
post.on('saveStash',function ()
{
    return saveStash()
})
post.on('clearStash',function ()
{
    return clearStash()
})
post.on('editorFocus',function (editor)
{
    window.setLastFocus(editor.name)
    window.focusEditor = editor
    if (editor.name !== 'commandline-editor')
    {
        return window.textEditor = editor
    }
})
post.on('mainlog',function ()
{
    return klog.apply(klog,arguments)
})
post.on('ping',function (wID, argA, argB)
{
    return post.toWin(wID,'pong',window.winID,argA,argB)
})
post.on('postEditorState',function ()
{
    return post.toAll('editorState',window.winID,{lines:editor.lines(),cursors:editor.cursors(),main:editor.mainCursor(),selections:editor.selections(),highlights:editor.highlights()})
})

window.editorWithName = function (n)
{
    switch (n)
    {
        case 'command':
        case 'commandline':
            return commandline

        case 'terminal':
            return terminal

        case 'editor':
            return editor

        default:
            return editor
    }

}

window.onload = function ()
{
    ;(split != null ? split.resized() : undefined)
    return (info != null ? info.reload() : undefined)
}

reloadWin = function ()
{
    saveStash()
    clearListeners()
    return post.toMain('reloadWin',{winID:window.winID,file:editor.currentFile})
}

window.onresize = function ()
{
    var _272_14_

    split.resized()
    ;(window.win != null ? window.win.onMoved(window.win.getBounds()) : undefined)
    if (window.stash.get('centerText',false))
    {
        return editor.centerText(true,200)
    }
}
post.on('split',function (s)
{
    var _278_22_

    ;(window.filebrowser != null ? window.filebrowser.resized() : undefined)
    terminal.resized()
    commandline.resized()
    return editor.resized()
})

toggleCenterText = function ()
{
    var restoreInvisibles

    if (window.state.get(`invisibles|${editor.currentFile}`,false))
    {
        editor.toggleInvisibles()
        restoreInvisibles = true
    }
    if (!window.stash.get('centerText',false))
    {
        window.stash.set('centerText',true)
        editor.centerText(true)
    }
    else
    {
        window.stash.set('centerText',false)
        editor.centerText(false)
    }
    if (restoreInvisibles)
    {
        return editor.toggleInvisibles()
    }
}

toggleTabPinned = function ()
{
    var t

    if (t = window.tabs.activeTab())
    {
        return t.togglePinned()
    }
}

setFontSize = function (s)
{
    var _323_25_

    if (!(_k_.isNum(s)))
    {
        s = prefs.get('editorFontSize',19)
    }
    s = _k_.clamp(8,100,s)
    window.stash.set("fontSize",s)
    editor.setFontSize(s)
    if ((editor.currentFile != null))
    {
        return post.emit('loadFile',editor.currentFile,{reload:true})
    }
}

changeFontSize = function (d)
{
    var f

    if (editor.size.fontSize >= 20)
    {
        f = 2
    }
    else if (editor.size.fontSize >= 30)
    {
        f = 4
    }
    else if (editor.size.fontSize >= 50)
    {
        f = 10
    }
    else
    {
        f = 1
    }
    return setFontSize(editor.size.fontSize + f * d)
}

resetFontSize = function ()
{
    var defaultFontSize

    defaultFontSize = prefs.get('editorFontSize',19)
    window.stash.set('fontSize',defaultFontSize)
    return setFontSize(defaultFontSize)
}

addToShelf = function ()
{
    var fb, path

    if (window.lastFocus === 'shelf')
    {
        return
    }
    fb = window.filebrowser
    if (window.lastFocus.startsWith(fb.name))
    {
        path = fb.columnWithName(window.lastFocus).activePath()
    }
    else
    {
        path = editor.currentFile
    }
    return post.emit('addToShelf',path)
}

resetZoom = function ()
{
    webframe.setZoomFactor(1)
    return editor.resized()
}

changeZoom = function (d)
{
    var z

    z = webframe.getZoomFactor()
    z *= 1 + d / 20
    z = _k_.clamp(0.36,5.23,z)
    webframe.setZoomFactor(z)
    return editor.resized()
}

window.onblur = function (event)
{
    return post.emit('winFocus',false)
}

window.onfocus = function (event)
{
    post.emit('winFocus',true)
    if (document.activeElement.className === 'body')
    {
        if (split.editorVisible())
        {
            return split.focus('editor')
        }
        else
        {
            return split.focus('commandline-editor')
        }
    }
}

window.setLastFocus = function (name)
{
    return window.lastFocus = name
}

onCombo = function (combo, info)
{
    var char, event, i, key, mod

    if (!combo)
    {
        return
    }
    mod = info.mod
    key = info.key
    combo = info.combo
    char = info.char
    event = info.event

    if ('unhandled' !== window.commandline.globalModKeyComboEvent(mod,key,combo,event))
    {
        return stopEvent(event)
    }
    if ('unhandled' !== titlebar.globalModKeyComboEvent(mod,key,combo,event))
    {
        return stopEvent(event)
    }
    for (i = 1; i <= 9; i++)
    {
        if (combo === `alt+${i}`)
        {
            return stopEvent(event,post.toMain('activateWindow',i))
        }
    }
    switch (combo)
    {
        case 'f3':
            return stopEvent(event,screenShot())

        case 'command+shift+=':
            return stopEvent(event,changeZoom(1))

        case 'command+shift+-':
            return stopEvent(event,changeZoom(-1))

        case 'command+shift+0':
            return stopEvent(event,resetZoom())

        case 'command+alt+y':
            return stopEvent(event,split.do('minimize editor'))

    }

}
post.on('combo',onCombo)
new Window
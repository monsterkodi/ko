var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, isStr: function (o) {return typeof o === 'string' || o instanceof String}}

var Terminal

import kxk from "../../kxk.js"
let post = kxk.post
let kpos = kxk.kpos
let popup = kxk.popup
let stopEvent = kxk.stopEvent

import salt from "../tools/salt.js"

import Syntax from "../editor/Syntax.js"
import TextEditor from "../editor/TextEditor.js"


Terminal = (function ()
{
    _k_.extend(Terminal, TextEditor)
    function Terminal (viewElem)
    {
        this["showContextMenu"] = this["showContextMenu"].bind(this)
        this["onContextMenu"] = this["onContextMenu"].bind(this)
        this["dequeueMeta"] = this["dequeueMeta"].bind(this)
        this["onDoChanges"] = this["onDoChanges"].bind(this)
        Terminal.__super__.constructor.call(this,viewElem,{features:['Scrollbar','Numbers','Minimap','Meta','FileList'],fontSize:16,lineHeight:1.3})
        this.view.addEventListener("contextmenu",this.onContextMenu)
        this.metaQueue = []
        this.setLines([''])
        this.initInvisibles()
    }

    Terminal.prototype["onDoChanges"] = function (changes)
    {
        if (this.metaQueue.length)
        {
            return
        }
        return Terminal.__super__.onDoChanges.call(this,changes)
    }

    Terminal.prototype["appendLineDiss"] = function (text, diss = [])
    {
        if ((diss != null ? diss.length : undefined))
        {
            this.syntax.setDiss(this.numLines(),diss)
        }
        return this.appendText(text)
    }

    Terminal.prototype["appendDiss"] = function (diss)
    {
        return this.appendLineDiss(Syntax.lineForDiss(diss),diss)
    }

    Terminal.prototype["appendMeta"] = function (meta)
    {
        var diss, l, mm, text, _60_21_, _62_33_, _77_21_

        if (!(meta != null))
        {
            return console.error('Terminal.appendMeta -- no meta?')
        }
        this.meta.append(meta)
        if ((meta.diss != null))
        {
            text = ((_62_33_=meta.text) != null ? _62_33_ : Syntax.lineForDiss(meta.diss))
            this.appendLineDiss(text,meta.diss)
        }
        else if (meta.clss === 'salt')
        {
            this.appendMeta({clss:'spacer'})
            var list = _k_.list(salt(meta.text).split('\n'))
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                l = list[_a_]
                this.appendMeta({clss:'spacer',text:'# ' + l})
            }
            this.appendMeta({clss:'spacer'})
        }
        else if (meta.clss === 'termCommand')
        {
            this.appendLineDiss(meta.command,Syntax.dissForTextAndSyntax(meta.command,'term'))
        }
        else if ((meta.text != null))
        {
            diss = Syntax.dissForTextAndSyntax(meta.text,'txt')
            if (meta.font)
            {
                diss.font = meta.font
            }
            this.appendLineDiss(meta.text,diss)
        }
        else
        {
            this.appendLineDiss('')
        }
        if (meta.list)
        {
            if (_k_.isStr(meta.list))
            {
                post.emit('filelist.add',meta.list,this.numLines())
            }
            else
            {
                post.emit('filelist.add',meta.text,this.numLines())
            }
        }
        var list1 = _k_.list(meta.metas)
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            mm = list1[_b_]
            this.meta.appendLineMeta(mm)
        }
        return meta
    }

    Terminal.prototype["clearQueue"] = function ()
    {
        clearTimeout(this.metaTimer)
        this.metaTimer = null
        return this.metaQueue = []
    }

    Terminal.prototype["queueMeta"] = function (meta)
    {
        this.metaQueue.push(meta)
        clearTimeout(this.metaTimer)
        return this.metaTimer = setTimeout(this.dequeueMeta,0)
    }

    Terminal.prototype["dequeueMeta"] = function ()
    {
        var count, meta

        count = 0
        while (meta = this.metaQueue.shift())
        {
            this.appendMeta(meta)
            count += 1
            if (count > 20)
            {
                break
            }
        }
        clearTimeout(this.metaTimer)
        if (this.metaQueue.length)
        {
            return this.metaTimer = setTimeout(this.dequeueMeta,0)
        }
        else
        {
            return this.do.resetHistory()
        }
    }

    Terminal.prototype["isCursorAtEnd"] = function ()
    {
        return this.cursorPos()[1] === this.numLines() - 1 && this.numCursors() === 1
    }

    Terminal.prototype["singleCursorInLastLineAndScrollToBottom"] = function ()
    {
        this.singleCursorAtPos([0,this.numLines() - 1])
        return this.scroll.to(this.scroll.fullHeight)
    }

    Terminal.prototype["clear"] = function ()
    {
        post.emit('filelist.clear')
        this.clearQueue()
        this.meta.clear()
        this.singleCursorAtPos([0,0])
        return Terminal.__super__.clear.call(this)
    }

    Terminal.prototype["onContextMenu"] = function (event)
    {
        return stopEvent(event,this.showContextMenu(kpos(event)))
    }

    Terminal.prototype["showContextMenu"] = function (absPos)
    {
        var opt

        if (!(absPos != null))
        {
            absPos = kpos(this.view.getBoundingClientRect().left,this.view.getBoundingClientRect().top)
        }
        opt = {items:[{text:'Browse',combo:'command+.',cb:function ()
        {
            return window.commandline.startCommand('browse')
        }},{text:'Clear',combo:'alt+k',cb:this.clear},{text:'Close',combo:'alt+ctrl+k',cb:window.split.hideTerminal},{text:''},{text:'DevTools',combo:'alt+cmdctrl+i'}]}
        opt.x = absPos.x
        opt.y = absPos.y
        return popup.menu(opt)
    }

    Terminal.prototype["handleModKeyComboCharEvent"] = function (mod, key, combo, char, event)
    {
        var href, split

        if ('unhandled' !== Terminal.__super__.handleModKeyComboCharEvent.call(this,mod,key,combo,char,event))
        {
            return
        }
        switch (combo)
        {
            case 'enter':
                if (href = this.meta.hrefAtLineIndex(this.cursorPos()[1]))
                {
                    post.emit('loadFile',`${href}`)
                }
                return

            case 'ctrl+enter':
            case 'command+enter':
                if (href = this.meta.hrefAtLineIndex(this.cursorPos()[1]))
                {
                    post.emit('loadFile',`${href}`)
                    window.editor.focus()
                }
                return

            case 'ctrl+s':
            case 'command+s':
                if (this.meta.saveChanges())
                {
                    return
                }
                break
            case 'esc':
                split = window.split
                split.focus('commandline-editor')
                split.do('enlarge editor')
                return

        }

        return 'unhandled'
    }

    return Terminal
})()

export default Terminal;
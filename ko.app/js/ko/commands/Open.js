var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, isStr: function (o) {return typeof o === 'string' || o instanceof String}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var Open, relative

import kxk from "../../kxk.js"
let krzl = kxk.krzl
let post = kxk.post
let slash = kxk.slash
let uniqBy = kxk.uniqBy
let reversed = kxk.reversed

import File from "../tools/File.js"

import Projects from "../tools/Projects.js"

import Command from "../commandline/Command.js"


relative = function (rel, to)
{
    var r, tilde

    r = slash.relative(rel,to)
    if (r.startsWith('../../'))
    {
        tilde = slash.tilde(rel)
        if (tilde.length < r.length)
        {
            r = tilde
        }
    }
    if (rel.length < r.length)
    {
        r = rel
    }
    return r
}

Open = (function ()
{
    _k_.extend(Open, Command)
    function Open (commandline)
    {
        this["weight"] = this["weight"].bind(this)
        this["onFile"] = this["onFile"].bind(this)
        Open.__super__.constructor.call(this,commandline)
        post.on('file',this.onFile)
        this.names = ['open']
        this.files = []
        this.file = null
        this.dir = null
        this.pkg = null
        this.selected = 0
    }

    Open.prototype["onFile"] = function (file)
    {
        if (this.isActive())
        {
            if (_k_.empty(file))
            {
                return this.setText('')
            }
            else if (this.getText() !== slash.file(file))
            {
                return this.setText(slash.tilde(file))
            }
        }
    }

    Open.prototype["changed"] = function (cmmd)
    {
        var file, items, pos

        cmmd = cmmd.trim()
        var _60_20_ = slash.splitFilePos((cmmd != null ? cmmd : this.getText().trim())); file = _60_20_[0]; pos = _60_20_[1]

        items = this.listItems({currentText:cmmd,maxItems:10000})
        if (!_k_.empty(cmmd) && !_k_.empty(items))
        {
            this.krzl.values = items
            this.krzl.extract = function (o)
            {
                return o.text
            }
            items = this.krzl.filter(slash.file(file))
            items.sort(function (a, b)
            {
                return b.weight - a.weight
            })
        }
        if (items.length)
        {
            this.showItems(items.slice(0,300))
            this.select(0)
            return this.positionList()
        }
        else
        {
            return this.hideList()
        }
    }

    Open.prototype["complete"] = function ()
    {
        var p, pdir, projects, _90_23_

        console.log('complete not implemented!')
        if ((this.commandList != null) && this.commandList.line(this.selected).startsWith(slash.file(this.getText())) && !this.getText().trim().endsWith('/'))
        {
            this.setText(slash.path(slash.dir(this.getText()),this.commandList.line(this.selected)))
            if (slash.dirExists(this.getText()))
            {
                this.setText(this.getText() + '/')
                this.changed(this.getText())
            }
            return true
        }
        else if (!this.getText().trim().endsWith('/') && slash.dirExists(this.getText()))
        {
            this.setText(this.getText() + '/')
            this.changed(this.getText())
            return true
        }
        else
        {
            projects = post.get('indexer','projects')
            var list = _k_.list(Object.keys(projects).sort())
            for (var _102_18_ = 0; _102_18_ < list.length; _102_18_++)
            {
                p = list[_102_18_]
                if (p.startsWith(this.getText()))
                {
                    pdir = Projects.projects[p].dir
                    this.setText(pdir + '/')
                    this.changed(this.getText())
                    return true
                }
            }
            return Open.__super__.complete.call(this)
        }
    }

    Open.prototype["weight"] = function (item, opt)
    {
        var b, contBonus, extensionBonus, f, lengthPenalty, lf, localBonus, n, nameBonus, r, updirPenalty

        f = item.file
        r = item.text
        b = slash.file(f)
        n = slash.name(f).toLowerCase()
        contBonus = 0
        nameBonus = 0
        if (_k_.isStr(opt.currentText))
        {
            lf = 1 + opt.currentText.length / n.length
            contBonus = n.indexOf(opt.currentText.toLowerCase()) >= 0 && 10000 * lf || 0
            nameBonus = n.startsWith(opt.currentText.toLowerCase()) && 10000 * lf || 0
        }
        extensionBonus = ((function ()
        {
            switch (slash.ext(b))
            {
                case 'kode':
                    return 100

                case 'coffee':
                    return 95

                case 'cpp':
                case 'hpp':
                case 'mm':
                case 'h':
                    return 60

                case 'md':
                case 'styl':
                case 'pug':
                    return 50

                case 'noon':
                    return 25

                case 'js':
                case 'mjs':
                    return -5

                case 'json':
                case 'html':
                    return -10

                default:
                    return 0
            }

        }).bind(this))()
        if (this.file && slash.ext(this.file) === slash.ext(b))
        {
            extensionBonus += 100
        }
        extensionBonus *= 10 + 10 * contBonus + 10 * nameBonus
        lengthPenalty = slash.dir(f).length
        updirPenalty = r.split('../').length * 819
        if (f.startsWith(this.dir))
        {
            localBonus = Math.max(0,(5 - r.split('/').length) * 4095)
        }
        else
        {
            localBonus = Math.max(0,(5 - r.split('../').length) * 819)
        }
        return item.weight = localBonus + contBonus + nameBonus + extensionBonus - lengthPenalty - updirPenalty
    }

    Open.prototype["weightedItems"] = function (items, opt)
    {
        items.sort((function (a, b)
        {
            return b.weight - a.weight
        }).bind(this))
        return items
    }

    Open.prototype["listItems"] = function (opt)
    {
        var f, file, iconSpan, item, items, rel, _177_21_, _178_17_, _195_41_, _197_19_

        opt = (opt != null ? opt : {})
        opt.maxItems = ((_177_21_=opt.maxItems) != null ? _177_21_ : 200)
        opt.flat = ((_178_17_=opt.flat) != null ? _178_17_ : true)
        iconSpan = function (file)
        {
            if (slash.ext(file) === 'kode')
            {
                return `<span class='kodeIcon openFileIcon'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M5.75 7.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm5.25.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z"></path><path fill-rule="evenodd" d="M6.25 0a.75.75 0 000 1.5H7.5v2H3.75A2.25 2.25 0 001.5 5.75V8H.75a.75.75 0 000 1.5h.75v2.75a2.25 2.25 0 002.25 2.25h8.5a2.25 2.25 0 002.25-2.25V9.5h.75a.75.75 0 000-1.5h-.75V5.75a2.25 2.25 0 00-2.25-2.25H9V.75A.75.75 0 008.25 0h-2zM3 5.75A.75.75 0 013.75 5h8.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-8.5a.75.75 0 01-.75-.75v-6.5z"></path></svg>
                </span>`
            }
            else
            {
                return `<span class='${File.iconClassName(file)} openFileIcon'/>`
            }
        }
        items = []
        this.lastFileIndex = 0
        if (!(this.dir != null))
        {
            this.dir = slash.path('~')
        }
        if ((this.history != null) && !opt.currentText && this.history.length > 1)
        {
            f = this.history[this.history.length - 2]
            item = {}
            item.text = relative(f,this.dir)
            item.line = iconSpan(f)
            item.file = f
            item.weight = this.weight(item,opt)
            items.push(item)
            this.lastFileIndex = 0
        }
        if (!_k_.empty(this.files))
        {
            var list = _k_.list(this.files)
            for (var _211_21_ = 0; _211_21_ < list.length; _211_21_++)
            {
                file = list[_211_21_]
                rel = relative(file,this.dir)
                if (rel.length)
                {
                    item = {}
                    item.line = iconSpan(file)
                    item.text = rel
                    item.file = file
                    item.weight = this.weight(item,opt)
                    items.push(item)
                }
            }
        }
        items = this.weightedItems(items,opt)
        items = uniqBy(items,'text')
        items.slice(0,opt.maxItems)
        return items
    }

    Open.prototype["showHistory"] = function ()
    {
        var f, item, items

        if (this.history.length > 1 && this.selected <= 0)
        {
            items = []
            var list = _k_.list(this.history)
            for (var _242_18_ = 0; _242_18_ < list.length; _242_18_++)
            {
                f = list[_242_18_]
                item = {}
                item.text = relative(f,this.dir)
                item.file = f
                items.push(item)
            }
            items.pop()
            this.showItems(items)
            this.select(items.length - 1)
            return this.setAndSelectText(items[this.selected].text)
        }
        else
        {
            return 'unhandled'
        }
    }

    Open.prototype["showFirst"] = function ()
    {
        var _258_58_, _258_65_

        if (this.commandList && this.selected === ((_258_58_=this.commandList.meta) != null ? (_258_65_=_258_58_.metas) != null ? _258_65_.length : undefined : undefined) - 1)
        {
            this.showItems(this.listItems())
            return this.select(0)
        }
        else
        {
            return 'unhandled'
        }
    }

    Open.prototype["cancel"] = function (name)
    {
        var _273_27_

        if (name === this.names[0])
        {
            if ((this.commandList != null) && this.lastFileIndex === this.selected)
            {
                return this.execute()
            }
        }
        return Open.__super__.cancel.call(this,name)
    }

    Open.prototype["start"] = function (name)
    {
        var dir, item, text, _294_40_, _308_41_

        this.setName(name)
        if ((this.commandline.lastFocus === 'commandline-editor' && 'commandline-editor' === window.lastFocus))
        {
            this.file = window.editor.currentFile
            if (dir = slash.path(this.commandline.text()))
            {
                this.dir = dir
            }
            else
            {
                this.dir = ((_294_40_=slash.dir(this.file)) != null ? _294_40_ : kakao.bundle.app('kode'))
            }
        }
        else if (this.commandline.lastFocus === 'shelf' || this.commandline.lastFocus.startsWith('FileBrowser'))
        {
            item = window.filebrowser.lastUsedColumn().parent
            switch (item.type)
            {
                case 'dir':
                    this.file = window.editor.currentFile
                    this.dir = item.file
                    break
                case 'file':
                    this.file = item.file
                    this.dir = slash.dir(this.file)
                    break
            }

        }
        else if ((window.editor.currentFile != null))
        {
            this.file = window.editor.currentFile
            this.dir = slash.dir(this.file)
        }
        else
        {
            this.file = null
            this.dir = kakao.bundle.app('kode')
        }
        this.files = Projects.files(this.dir)
        this.loadState()
        this.initAndShowList()
        if (this.commandList)
        {
            text = this.commandList.line(this.selected)
        }
        text = (text != null ? text : '')
        return {text:text,select:true}
    }

    Open.prototype["execute"] = function (command)
    {
        var file, path, pos, _340_27_

        if (this.selected < 0)
        {
            return {status:'failed'}
        }
        path = (this.commandList != null ? this.commandList.line(this.selected) : undefined)
        this.hideList()
        if (!_k_.empty(path))
        {
            var _346_24_ = slash.splitFilePos(command); file = _346_24_[0]; pos = _346_24_[1]

            file = this.resolvedPath(path)
            file = slash.joinFilePos(file,pos)
            post.emit('jumpToFile',{type:'file',path:file})
            Open.__super__.execute.call(this,file)
            return {text:file,focus:'editor',show:'editor',status:'ok'}
        }
        else
        {
            return {status:'failed'}
        }
    }

    Open.prototype["resolvedPath"] = function (p, parent = this.dir)
    {
        if (!(p != null))
        {
            return ((parent != null ? parent : slash.path('~')))
        }
        if (_k_.in(p[0],['~','/']) || p[1] === ':')
        {
            return slash.path(p)
        }
        else
        {
            return slash.path(parent,p)
        }
    }

    Open.prototype["handleModKeyComboEvent"] = function (mod, key, combo, event)
    {
        switch (combo)
        {
            case 'up':
                return this.showHistory()

            case 'down':
                return this.showFirst()

        }

        return Open.__super__.handleModKeyComboEvent.call(this,mod,key,combo,event)
    }

    return Open
})()

export default Open;
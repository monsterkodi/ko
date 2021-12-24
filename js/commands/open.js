// monsterkodi/kode 0.212.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}, valid: undefined, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var Command, File, fuzzy, Open, post, Projects, relative, render, slash, syntax, _

_ = require('kxk')._
empty = require('kxk').empty
post = require('kxk').post
slash = require('kxk').slash
valid = require('kxk').valid

Projects = require('../tools/projects')
File = require('../tools/file')
Command = require('../commandline/command')
render = require('../editor/render')
syntax = require('../editor/syntax')
fuzzy = require('fuzzy')

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
        this.names = ["open","new window"]
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

    Open.prototype["changed"] = function (command)
    {
        var f, file, fuzzied, items, pos

        command = command.trim()
        var _63_20_ = slash.splitFilePos((command != null ? command : this.getText().trim())) ; file = _63_20_[0]        ; pos = _63_20_[1]

        items = this.listItems({currentText:command,maxItems:10000})
        if (command.length)
        {
            fuzzied = fuzzy.filter(slash.basename(file),items,{extract:function (o)
            {
                return o.text
            }})
            items = (function () { var _70__38_ = []; var list = _k_.list(fuzzied); for (var _70_38_ = 0; _70_38_ < list.length; _70_38_++)  { f = list[_70_38_];_70__38_.push(f.original)  } return _70__38_ }).bind(this)()
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
        var p, pdir, projects, _88_23_

        if ((this.commandList != null) && this.commandList.line(this.selected).startsWith(slash.basename(this.getText())) && !this.getText().trim().endsWith('/'))
        {
            this.setText(slash.join(slash.dir(this.getText()),this.commandList.line(this.selected)))
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
            for (var _100_18_ = 0; _100_18_ < list.length; _100_18_++)
            {
                p = list[_100_18_]
                if (p.startsWith(this.getText()))
                {
                    pdir = projects[p].dir
                    if (slash.dirExists(slash.join(pdir,'coffee')))
                    {
                        pdir = slash.join(pdir,'coffee')
                    }
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
        var b, extensionBonus, f, lengthPenalty, localBonus, n, nameBonus, r, relBonus, updirPenalty, _117_39_, _126_26_

        if ((item.bonus != null))
        {
            return item.bonus
        }
        f = item.file
        r = item.text
        b = slash.file(f)
        n = slash.base(f)
        relBonus = 0
        nameBonus = 0
        if ((opt.currentText != null ? opt.currentText.length : undefined))
        {
            relBonus = r.startsWith(opt.currentText) && 65535 * (opt.currentText.length / r.length) || 0
            nameBonus = n.startsWith(opt.currentText) && 2184 * (opt.currentText.length / n.length) || 0
        }
        extensionBonus = ((function ()
        {
            switch (slash.ext(b))
            {
                case 'coffee':
                case 'kode':
                    return 1000

                case 'cpp':
                case 'hpp':
                case 'h':
                    return 90

                case 'md':
                case 'styl':
                case 'pug':
                    return 50

                case 'noon':
                    return 25

                case 'js':
                case 'json':
                case 'html':
                    return -10

                default:
                    return 0
            }

        }).bind(this))()
        if (this.file && slash.ext(this.file) === slash.ext(b))
        {
            extensionBonus += 1000
        }
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
        return item.weight = localBonus + relBonus + nameBonus + extensionBonus - lengthPenalty - updirPenalty
    }

    Open.prototype["weightedItems"] = function (items, opt)
    {
        items.sort((function (a, b)
        {
            return this.weight(b,opt) - this.weight(a,opt)
        }).bind(this))
        return items
    }

    Open.prototype["listItems"] = function (opt)
    {
        var f, file, iconSpan, item, items, rel, _166_21_, _167_17_, _178_44_, _180_19_

        opt = (opt != null ? opt : {})
        opt.maxItems = ((_166_21_=opt.maxItems) != null ? _166_21_ : 200)
        opt.flat = ((_167_17_=opt.flat) != null ? _167_17_ : true)
        iconSpan = function (file)
        {
            var className

            className = File.iconClassName(file)
            return `<span class='${className} openFileIcon'/>`
        }
        items = []
        this.lastFileIndex = 0
        if (!(this.dir != null))
        {
            this.dir = slash.resolve('~')
        }
        if ((this.history != null) && !opt.currentText && this.history.length > 1)
        {
            f = this.history[this.history.length - 2]
            item = Object.create(null)
            item.text = relative(f,this.dir)
            item.line = iconSpan(f)
            item.file = f
            item.bonus = 1048575
            items.push(item)
            this.lastFileIndex = 0
        }
        if (!_k_.empty(this.files))
        {
            var list = _k_.list(this.files)
            for (var _192_21_ = 0; _192_21_ < list.length; _192_21_++)
            {
                file = list[_192_21_]
                rel = relative(file,this.dir)
                if (rel.length)
                {
                    item = Object.create(null)
                    item.line = iconSpan(file)
                    item.text = rel
                    item.file = file
                    items.push(item)
                }
            }
        }
        items = this.weightedItems(items,opt)
        items = _.uniqBy(items,function (o)
        {
            return o.text
        })
        return items.slice(0,opt.maxItems)
    }

    Open.prototype["showHistory"] = function ()
    {
        var bonus, f, item, items

        if (this.history.length > 1 && this.selected <= 0)
        {
            items = []
            bonus = 1048575
            var list = _k_.list(this.history)
            for (var _219_18_ = 0; _219_18_ < list.length; _219_18_++)
            {
                f = list[_219_18_]
                item = Object.create(null)
                item.text = relative(f,this.dir)
                item.file = f
                item.bonus = bonus
                items.push(item)
                bonus -= 1
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
        var _235_58_, _235_65_

        if (this.commandList && this.selected === ((_235_58_=this.commandList.meta) != null ? (_235_65_=_235_58_.metas) != null ? _235_65_.length : undefined : undefined) - 1)
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
        var _250_27_

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
        var dir, item, _275_40_, _289_41_

        this.setName(name)
        if ((this.commandline.lastFocus === 'commandline-editor' && 'commandline-editor' === window.lastFocus))
        {
            this.file = window.editor.currentFile
            if (dir = slash.resolve(this.commandline.text()))
            {
                this.dir = dir
            }
            else
            {
                this.dir = ((_275_40_=slash.dir(this.file)) != null ? _275_40_ : process.cwd())
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
            this.dir = process.cwd()
        }
        this.files = Projects.files(this.dir)
        this.loadState()
        this.showList()
        this.showItems(this.listItems())
        this.grabFocus()
        this.select(0)
        return {text:this.commandList.line(this.selected),select:true}
    }

    Open.prototype["execute"] = function (command)
    {
        var file, path, pos, _320_27_

        if (this.selected < 0)
        {
            return {status:'failed'}
        }
        path = (this.commandList != null ? this.commandList.line(this.selected) : undefined)
        this.hideList()
        if (!_k_.empty(path))
        {
            var _328_24_ = slash.splitFilePos(command) ; file = _328_24_[0]            ; pos = _328_24_[1]

            file = this.resolvedPath(path)
            file = slash.joinFilePos(file,pos)
            if (this.name === 'new window')
            {
                post.toMain('newWindowWithFile',file)
            }
            else
            {
                post.emit('jumpToFile',{type:'file',file:file})
            }
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
            return ((parent != null ? parent : slash.resolve('~')))
        }
        if (_k_.in(p[0],['~','/']) || p[1] === ':')
        {
            return slash.resolve(p)
        }
        else
        {
            return slash.resolve(slash.join(parent,p))
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

module.exports = Open
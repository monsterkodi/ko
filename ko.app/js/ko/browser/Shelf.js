var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, isArr: function (o) {return Array.isArray(o)}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var Shelf

import kxk from "../../kxk.js"
let pullAll = kxk.pullAll
let ffs = kxk.ffs
let elem = kxk.elem
let post = kxk.post
let slash = kxk.slash
let keyinfo = kxk.keyinfo
let popup = kxk.popup
let stopEvent = kxk.stopEvent
let $ = kxk.$

import File from "../tools/File.js"
import Git from "../tools/Git.js"

import Row from "./Row.js"
import Column from "./Column.js"


Shelf = (function ()
{
    _k_.extend(Shelf, Column)
    function Shelf (browser)
    {
        this["onKeyUp"] = this["onKeyUp"].bind(this)
        this["onKey"] = this["onKey"].bind(this)
        this["showContextMenu"] = this["showContextMenu"].bind(this)
        this["removeObject"] = this["removeObject"].bind(this)
        this["onDblClick"] = this["onDblClick"].bind(this)
        this["onMouseOut"] = this["onMouseOut"].bind(this)
        this["onMouseOver"] = this["onMouseOver"].bind(this)
        this["onFocus"] = this["onFocus"].bind(this)
        this["loadGitStatus"] = this["loadGitStatus"].bind(this)
        this["onGitStatus"] = this["onGitStatus"].bind(this)
        this["onDrop"] = this["onDrop"].bind(this)
        this["addPath"] = this["addPath"].bind(this)
        this["onStashLoaded"] = this["onStashLoaded"].bind(this)
        this["onFile"] = this["onFile"].bind(this)
        Shelf.__super__.constructor.call(this,browser)
        this.items = []
        this.index = -1
        this.div.id = 'shelf'
        post.on('gitStatus',this.onGitStatus)
        post.on('addToShelf',this.addPath)
        post.on('stashLoaded',this.onStashLoaded)
        post.on('file',this.onFile)
    }

    Shelf.prototype["activateRow"] = function (row)
    {
        var item, _36_19_

        ;($('.hover') != null ? $('.hover').classList.remove('hover') : undefined)
        item = row.item
        row.setActive({emit:true})
        if (item.type === 'file')
        {
            return post.emit('jumpToFile',item)
        }
        else
        {
            return post.emit('filebrowser','loadItem',item)
        }
    }

    Shelf.prototype["onFile"] = function (file)
    {
        var index, item, matches

        if (_k_.empty(file))
        {
            return
        }
        if (this.navigatingRows)
        {
            delete this.navigatingRows
            return
        }
        for (var _a_ = index = 0, _b_ = this.items.length; (_a_ <= _b_ ? index < this.items.length : index > this.items.length); (_a_ <= _b_ ? ++index : --index))
        {
            if (this.items[index].path === file)
            {
                this.rows[index].setActive()
                return
            }
        }
        matches = []
        for (index in this.items)
        {
            item = this.items[index]
            if ((file != null ? file.startsWith(item.path) : undefined))
            {
                matches.push([index,item])
            }
        }
        if (!_k_.empty(matches))
        {
            matches.sort(function (a, b)
            {
                return b[1].path.length - a[1].path.length
            })
            var _c_ = _k_.first(matches); index = _c_[0]; item = _c_[1]

            return this.rows[index].setActive()
        }
    }

    Shelf.prototype["onStashLoaded"] = function ()
    {
        this.loadShelfItems()
        return setTimeout(this.loadGitStatus,100)
    }

    Shelf.prototype["loadShelfItems"] = function ()
    {
        var items

        items = window.prefs.get("shelf|items")
        if (!(_k_.isArr(items)))
        {
            items = []
        }
        return this.setItems(items,{save:false})
    }

    Shelf.prototype["addPath"] = function (path, opt)
    {
        if (ffs.isDir(path).then((function (isDir)
            {
                if (isDir)
                {
                    return this.addDir(path,opt)
                }
                else
                {
                    return this.addFile(path,opt)
                }
            }).bind(this)))
        {
        }
    }

    Shelf.prototype["itemPaths"] = function ()
    {
        return this.rows.map(function (r)
        {
            return r.path()
        })
    }

    Shelf.prototype["savePrefs"] = function ()
    {
        console.log('Shelf.savePrefs',this.items)
        return prefs.set("shelf|items",this.items)
    }

    Shelf.prototype["setItems"] = function (items, opt)
    {
        var _117_15_

        this.items = items
    
        this.clear()
        this.items = ((_117_15_=this.items) != null ? _117_15_ : [])
        this.addItems(this.items,opt)
        return this
    }

    Shelf.prototype["addItems"] = function (items, opt)
    {
        var item

        if (_k_.empty(items))
        {
            return
        }
        var list = _k_.list(items)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            item = list[_a_]
            this.rows.push(new Row(this,item))
        }
        this.scroll.update()
        if ((opt != null ? opt.save : undefined) !== false)
        {
            this.savePrefs()
        }
        return this
    }

    Shelf.prototype["addDir"] = function (dir, opt)
    {
        var item

        item = {name:slash.file(slash.tilde(dir)),type:'dir',path:slash.path(dir)}
        return this.addItem(item,opt)
    }

    Shelf.prototype["addFile"] = function (file, opt)
    {
        var item

        item = {name:slash.file(file),path:slash.path(file),type:'file'}
        if (File.isText(file))
        {
            item.textFile = true
        }
        return this.addItem(item,opt)
    }

    Shelf.prototype["addFiles"] = async function (files, opt)
    {
        var file

        var list = _k_.list(files)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            file = list[_a_]
            if (await ffs.isDir(file))
            {
                this.addDir(file,opt)
            }
            else
            {
                this.addFile(file,opt)
            }
        }
    }

    Shelf.prototype["addItem"] = function (item, opt)
    {
        var index

        pullAll(this.items,[item])
        if ((opt != null ? opt.pos : undefined))
        {
            index = this.rowIndexAtPos(opt.pos)
            this.items.splice(Math.min(index,this.items.length),0,item)
        }
        else
        {
            this.items.push(item)
        }
        return this.setItems(this.items)
    }

    Shelf.prototype["onDrop"] = function (event)
    {
        var action, item, source

        action = event.getModifierState('Shift') && 'copy' || 'move'
        source = event.dataTransfer.getData('text/plain')
        item = this.browser.pathItem(source)
        return this.addItem(item,{pos:kpos(event)})
    }

    Shelf.prototype["isEmpty"] = function ()
    {
        return _k_.empty(this.rows)
    }

    Shelf.prototype["clear"] = function ()
    {
        this.clearSearch()
        this.div.scrollTop = 0
        this.table.innerHTML = ''
        this.rows = []
        return this.scroll.update()
    }

    Shelf.prototype["name"] = function ()
    {
        return 'shelf'
    }

    Shelf.prototype["onGitStatus"] = function (status)
    {
        var row, _202_48_

        var list = _k_.list(this.rows)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            row = list[_a_]
            if (row.path().startsWith(status.gitDir))
            {
                ;($('.browserStatusIcon',row.div) != null ? $('.browserStatusIcon',row.div).remove() : undefined)
                if (_k_.in(row.path(),status.dirs))
                {
                    row.div.appendChild(elem('span',{class:"git-dirs-icon browserStatusIcon"}))
                }
                else if (status.files[row.path()])
                {
                    row.div.appendChild(elem('span',{class:`git-${status.files[row.path()]}-icon browserStatusIcon`}))
                }
            }
        }
        return this
    }

    Shelf.prototype["loadGitStatus"] = function ()
    {
        var row

        var list = _k_.list(this.rows)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            row = list[_a_]
            Git.status(row.path())
        }
        return this
    }

    Shelf.prototype["onFocus"] = function ()
    {
        this.div.classList.add('focus')
        if (this.browser.shelfSize < 200)
        {
            return this.browser.setShelfSize(200)
        }
    }

    Shelf.prototype["onMouseOver"] = function (event)
    {
        var _233_44_, _233_57_

        return ((_233_44_=this.row(event.target)) != null ? typeof (_233_57_=_233_44_.onMouseOver) === "function" ? _233_57_() : undefined : undefined)
    }

    Shelf.prototype["onMouseOut"] = function (event)
    {
        var _234_44_, _234_56_

        return ((_234_44_=this.row(event.target)) != null ? typeof (_234_56_=_234_44_.onMouseOut) === "function" ? _234_56_() : undefined : undefined)
    }

    Shelf.prototype["onDblClick"] = function (event)
    {
        return this.navigateCols('enter')
    }

    Shelf.prototype["navigateRows"] = function (key)
    {
        var index, navigate, row, _247_28_, _247_38_, _262_99_

        if (!this.numRows())
        {
            return console.error(`no rows in column ${this.index}?`)
        }
        index = ((_247_38_=(this.activeRow() != null ? this.activeRow().index() : undefined)) != null ? _247_38_ : -1)
        if (!(index != null) || Number.isNaN(index))
        {
            console.error(`no index from activeRow? ${index}?`,this.activeRow())
        }
        index = ((function ()
        {
            switch (key)
            {
                case 'up':
                    return index - 1

                case 'down':
                    return index + 1

                case 'home':
                    return 0

                case 'end':
                    return this.items.length

                case 'page up':
                    return index - this.numVisible()

                case 'page down':
                    return _k_.clamp(0,this.items.length,index + this.numVisible())

                default:
                    return index
            }

        }).bind(this))()
        if (!(index != null) || Number.isNaN(index))
        {
            console.error(`no index ${index}? ${this.numVisible()}`)
        }
        index = _k_.clamp(0,this.numRows() - 1,index)
        if (!((this.rows[index] != null ? this.rows[index].activate : undefined) != null))
        {
            console.error(`no row at index ${index}/${this.numRows() - 1}?`,this.numRows())
        }
        navigate = (function (action)
        {
            this.navigatingRows = true
            return post.emit('menuAction',action)
        }).bind(this)
        if (key === 'up' && index > this.items.length)
        {
            return navigate('Navigate Forward')
        }
        else if (key === 'down' && index > this.items.length + 1)
        {
            return navigate('Navigate Backward')
        }
        else
        {
            row = this.rows[index]
            row.setActive({emit:false})
            if (row.item.type === 'file')
            {
                return post.emit('jumpToFile',row.path)
            }
            else
            {
                return post.emit('filebrowser','loadItem',row.path,{focus:false})
            }
        }
    }

    Shelf.prototype["openFileInNewWindow"] = function ()
    {
        var item, _280_30_

        if (item = (this.activeRow() != null ? this.activeRow().item : undefined))
        {
            if (item.type === 'file' && item.textFile)
            {
                window.openFiles([item.path],{newWindow:true})
            }
        }
        return this
    }

    Shelf.prototype["removeObject"] = function ()
    {
        var nextOrPrev, row, _287_27_, _290_36_

        row = ((_287_27_=this.activeRow()) != null ? _287_27_ : this.selectedRow())
        if (row)
        {
            nextOrPrev = ((_290_36_=row.next()) != null ? _290_36_ : row.prev())
            row.div.remove()
            this.items.splice(row.index(),1)
            this.rows.splice(row.index(),1)
            ;(nextOrPrev != null ? nextOrPrev.activate() : undefined)
            this.savePrefs()
        }
        return this
    }

    Shelf.prototype["showContextMenu"] = function (absPos)
    {
        var opt

        if (!(absPos != null))
        {
            absPos = pos(this.view.getBoundingClientRect().left,this.view.getBoundingClientRect().top)
        }
        opt = {items:[{text:'Toggle Extensions',combo:'ctrl+e',cb:this.toggleExtensions},{text:'Remove',combo:'backspace',cb:this.removeObject}]}
        opt.x = absPos.x
        opt.y = absPos.y
        return popup.menu(opt)
    }

    Shelf.prototype["onKey"] = function (event)
    {
        var char, combo, key, mod

        mod = keyinfo.forEvent(event).mod
        key = keyinfo.forEvent(event).key
        combo = keyinfo.forEvent(event).combo
        char = keyinfo.forEvent(event).char

        switch (combo)
        {
            case 'command+enter':
            case 'ctrl+enter':
                return this.openFileInNewWindow()

            case 'enter':
                return stopEvent(event,this.navigateCols(key))

            case 'backspace':
            case 'delete':
                return stopEvent(event,this.clearSearch().removeObject())

            case 'command+k':
            case 'ctrl+k':
                if (this.browser.cleanUp())
                {
                    return stopEvent(event)
                }
                break
            case 'ctrl+e':
                this.toggleExtensions()
                break
            case 'up':
            case 'down':
            case 'page up':
            case 'page down':
            case 'home':
            case 'end':
                return stopEvent(event,this.navigateRows(key))

            case 'right':
            case 'alt+right':
            case 'enter':
                return stopEvent(event,this.focusBrowser())

            case 'tab':
                if (this.search.length)
                {
                    this.doSearch('')
                    return stopEvent(event)
                }
                break
            case 'esc':
                if (this.dragDiv)
                {
                    this.dragDiv.drag.dragStop()
                    this.dragDiv.remove()
                    delete this.dragDiv
                }
                if (this.search.length)
                {
                    this.clearSearch()
                }
                return stopEvent(event)

        }

        if (_k_.in(mod,['shift','']) && char)
        {
            this.doSearch(char)
        }
        if (this.dragDiv)
        {
            return this.updateDragIndicator(event)
        }
    }

    Shelf.prototype["onKeyUp"] = function (event)
    {
        if (this.dragDiv)
        {
            return this.updateDragIndicator(event)
        }
    }

    return Shelf
})()

export default Shelf;
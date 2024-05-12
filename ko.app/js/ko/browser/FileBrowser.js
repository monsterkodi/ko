var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var FileBrowser

import kxk from "../../kxk.js"
let slash = kxk.slash
let elem = kxk.elem
let drag = kxk.drag
let post = kxk.post
let util = kxk.util
let ffs = kxk.ffs
let $ = kxk.$

import File from "../tools/File.js"
import Git from "../tools/Git.js"
import FuncItems from "../tools/FuncItems.js"

import Select from "./Select.js"
import Info from "./Info.js"
import Browser from "./Browser.js"
import Shelf from "./Shelf.js"


FileBrowser = (function ()
{
    _k_.extend(FileBrowser, Browser)
    function FileBrowser (view)
    {
        this["onShelfDrag"] = this["onShelfDrag"].bind(this)
        this["onGitStatus"] = this["onGitStatus"].bind(this)
        this["applyGitStatusFiles"] = this["applyGitStatusFiles"].bind(this)
        this["getGitStatus"] = this["getGitStatus"].bind(this)
        this["updateColumnScrolls"] = this["updateColumnScrolls"].bind(this)
        this["loadDirItems"] = this["loadDirItems"].bind(this)
        this["onDirChanged"] = this["onDirChanged"].bind(this)
        this["onFileIndexed"] = this["onFileIndexed"].bind(this)
        this["onFileBrowser"] = this["onFileBrowser"].bind(this)
        this["refresh"] = this["refresh"].bind(this)
        this["navigateToFile"] = this["navigateToFile"].bind(this)
        this["onFile"] = this["onFile"].bind(this)
        this["browse"] = this["browse"].bind(this)
        FileBrowser.__super__.constructor.call(this,view)
        window.filebrowser = this
        this.loadID = 0
        this.shelf = new Shelf(this)
        this.select = new Select(this)
        this.name = 'FileBrowser'
        this.srcCache = {}
        post.on('file',this.onFile)
        post.on('browse',this.browse)
        post.on('filebrowser',this.onFileBrowser)
        post.on('gitStatus',this.onGitStatus)
        post.on('fileIndexed',this.onFileIndexed)
        post.on('dirChanged',this.onDirChanged)
        this.shelfResize = elem('div',{class:'shelfResize'})
        this.shelfResize.style.position = 'absolute'
        this.shelfResize.style.top = '0px'
        this.shelfResize.style.bottom = '0px'
        this.shelfResize.style.left = '194px'
        this.shelfResize.style.width = '6px'
        this.shelfResize.style.cursor = 'ew-resize'
        this.drag = new drag({target:this.shelfResize,onMove:this.onShelfDrag})
        this.shelfSize = window.stash.get('shelf|size',200)
        this.initColumns()
    }

    FileBrowser.prototype["dropAction"] = function (action, sources, target)
    {
        var source

        var list = _k_.list(sources)
        for (var _63_19_ = 0; _63_19_ < list.length; _63_19_++)
        {
            source = list[_63_19_]
            if (action === 'move')
            {
                if (source === target || slash.dir(source) === target)
                {
                    console.log('noop',source,target)
                    return
                }
            }
        }
        var list1 = _k_.list(sources)
        for (var _70_19_ = 0; _70_19_ < list1.length; _70_19_++)
        {
            source = list1[_70_19_]
            switch (action)
            {
                case 'move':
                    File.rename(source,target)
                    break
                case 'copy':
                    File.copy(source,target)
                    break
            }

        }
    }

    FileBrowser.prototype["columnForFile"] = function (file)
    {
        var column, _79_42_

        var list = _k_.list(this.columns)
        for (var _78_19_ = 0; _78_19_ < list.length; _78_19_++)
        {
            column = list[_78_19_]
            if ((column.parent != null ? column.parent.path : undefined) === slash.dir(file))
            {
                return column
            }
        }
    }

    FileBrowser.prototype["sharedColumnIndex"] = function (file)
    {
        var col, column

        col = 0
        var list = _k_.list(this.columns)
        for (var _91_19_ = 0; _91_19_ < list.length; _91_19_++)
        {
            column = list[_91_19_]
            if (column.isDir() && file.startsWith(column.path()))
            {
                col += 1
            }
            else
            {
                break
            }
        }
        if (col === 1 && slash.dir(file) !== (this.columns[0] != null ? this.columns[0].path() : undefined))
        {
            return 0
        }
        return Math.max(-1,col - 2)
    }

    FileBrowser.prototype["browse"] = function (file, opt)
    {
        console.log('FileBrowser.browse',file,opt)
        if (file)
        {
            return this.loadItem(this.pathItem(file),opt)
        }
    }

    FileBrowser.prototype["onFile"] = function (file)
    {
        if (file && this.flex)
        {
            return this.navigateToFile(file)
        }
    }

    FileBrowser.prototype["navigateToFile"] = function (file)
    {
        var col, filelist, index, item, lastPath, opt, paths, row, _120_35_

        lastPath = (this.lastDirColumn() != null ? this.lastDirColumn().path() : undefined)
        file = slash.path(file)
        if (file === lastPath || file === this.lastColumnPath() || slash.isRelative(file))
        {
            return
        }
        col = this.sharedColumnIndex(file)
        filelist = slash.pathlist(file)
        if (col >= 0)
        {
            paths = filelist.slice(filelist.indexOf(this.columns[col].path()) + 1)
        }
        else
        {
            paths = filelist.slice(filelist.length - 2)
        }
        this.clearColumnsFrom(col + 1,{pop:true,clear:col + paths.length})
        while (this.numCols() < paths.length)
        {
            this.addColumn()
        }
        for (var _143_21_ = index = 0, _143_25_ = paths.length; (_143_21_ <= _143_25_ ? index < paths.length : index > paths.length); (_143_21_ <= _143_25_ ? ++index : --index))
        {
            if (index < paths.length - 1)
            {
                item = this.dirItem(paths[index])
            }
            else
            {
                item = this.fileItem(paths[index])
            }
            switch (item.type)
            {
                case 'file':
                    this.loadFileItem(item,col + 1 + index)
                    break
                case 'dir':
                    opt = {}
                    if (index < paths.length - 1)
                    {
                        opt.active = paths[index + 1]
                    }
                    this.loadDirItem(item,col + 1 + index,opt)
                    break
            }

        }
        if (col = this.lastDirColumn())
        {
            if (row = col.row(slash.file(file)))
            {
                return row.setActive()
            }
        }
    }

    FileBrowser.prototype["refresh"] = function ()
    {
        this.srcCache = {}
        if (this.lastUsedColumn())
        {
            return this.navigateToFile(this.lastUsedColumn().path())
        }
    }

    FileBrowser.prototype["pathItem"] = function (path)
    {
        var item, p

        p = slash.path(path)
        item = slash.parse(p)
        item.type = undefined
        ffs.type(p).then((function (i)
        {
            return function (t)
            {
                return i.type = t
            }
        })(item))
        return item
    }

    FileBrowser.prototype["fileItem"] = function (path)
    {
        var item, p

        p = slash.path(path)
        item = slash.parse(p)
        item.type = 'file'
        return item
    }

    FileBrowser.prototype["dirItem"] = function (path)
    {
        var item

        item = slash.parse(path)
        item.type = 'dir'
        return item
    }

    FileBrowser.prototype["onFileBrowser"] = function (action, item, arg)
    {
        switch (action)
        {
            case 'loadItem':
                return this.loadItem(item,arg)

            case 'activateItem':
                return this.activateItem(item,arg)

        }

    }

    FileBrowser.prototype["loadDir"] = function (path)
    {
        return this.loadItem({type:'dir',path:path})
    }

    FileBrowser.prototype["loadItem"] = function (item, opt)
    {
        var _225_55_

        opt = (opt != null ? opt : {active:'..',focus:true})
        this.clearColumnsFrom(1,{pop:true,clear:((_225_55_=opt.clear) != null ? _225_55_ : 1)})
        switch (item.type)
        {
            case 'dir':
                this.loadDirItem(item,0,opt)
                break
            case 'file':
                opt.activate = item.path
                while (this.numCols() < 2)
                {
                    this.addColumn()
                }
                this.loadDirItem(this.fileItem(slash.dir(item.path)),0,opt)
                break
            default:
                ffs.isDir(item.path).then((function (stat)
            {
                if (stat)
                {
                    return this.loadDirItem(item,0,opt)
                }
            }).bind(this))
                return
        }

        if (opt.focus)
        {
            return (this.columns[0] != null ? this.columns[0].focus() : undefined)
        }
    }

    FileBrowser.prototype["activateItem"] = function (item, col)
    {
        this.clearColumnsFrom(col + 2,{pop:true})
        switch (item.type)
        {
            case 'dir':
                return this.loadDirItem(item,col + 1,{focus:false})

            case 'file':
                this.loadFileItem(item,col + 1)
                if (item.textFile || File.isText(item.path))
                {
                    return post.emit('jumpToFile',item)
                }
                break
        }

    }

    FileBrowser.prototype["loadFileItem"] = function (item, col = 0)
    {
        var file

        this.clearColumnsFrom(col,{pop:true})
        while (col >= this.numCols())
        {
            this.addColumn()
        }
        file = item.path
        this.columns[col].parent = item
        if (File.isImage(file))
        {
            this.imageInfoColumn(col,file)
        }
        else
        {
            if (File.isText(item.path))
            {
                this.loadSourceItem(item,col)
            }
            if (!File.isCode(item.path))
            {
                this.fileInfoColumn(col,file)
            }
        }
        post.emit('load',{col:col,item:item})
        return this.updateColumnScrolls()
    }

    FileBrowser.prototype["imageInfoColumn"] = function (col, file)
    {
        this.columns[col].crumb.hide()
        return this.columns[col].table.appendChild(Info.image(file))
    }

    FileBrowser.prototype["fileInfoColumn"] = function (col, file)
    {
        this.columns[col].crumb.hide()
        return this.columns[col].table.appendChild(Info.file(file))
    }

    FileBrowser.prototype["onFileIndexed"] = function (file, info)
    {
        var _311_36_, _311_44_, _312_73_

        this.srcCache[file] = info
        if (file === ((_311_36_=this.lastUsedColumn()) != null ? (_311_44_=_311_36_.parent) != null ? _311_44_.file : undefined : undefined))
        {
            return this.loadSourceItem({file:file,type:'file'},(this.lastUsedColumn() != null ? this.lastUsedColumn().index : undefined))
        }
    }

    FileBrowser.prototype["loadSourceItem"] = function (item, col)
    {
        var info, items

        info = this.srcCache[item.path]
        if (_k_.empty(info))
        {
            return
        }
        items = FuncItems.forIndexerInfo(item.path,info)
        if (!_k_.empty(items))
        {
            return this.columns[col].loadItems(items,item)
        }
    }

    FileBrowser.prototype["onDirChanged"] = function (info)
    {
        var column

        var list = _k_.list(this.columns)
        for (var _333_19_ = 0; _333_19_ < list.length; _333_19_++)
        {
            column = list[_333_19_]
            if (column.path() === info.dir)
            {
                this.loadDirItem({path:info.dir,type:'dir'},column.index,{active:column.activePath(),focus:false})
            }
            if (column.path() === info.path && info.change === 'remove')
            {
                column.clear()
            }
        }
    }

    FileBrowser.prototype["loadDirItem"] = async function (item, col = 0, opt = {})
    {
        var dir, items

        if (col > 0 && item.name === '/')
        {
            return
        }
        dir = item.path
        items = await ffs.list(dir)
        if (!prefs.get(`browser|showHidden|${dir}`))
        {
            items = items.filter(function (i)
            {
                return i.file[0] !== '.'
            })
        }
        items = util.sortBy(items,function (i)
        {
            return i.type + (((i.file[0].toUpperCase() === i.file[0]) ? '-' : '+')) + i.file
        })
        this.loadDirItems(item,items,col,opt)
        return true
    }

    FileBrowser.prototype["loadDirItems"] = function (item, items, col, opt)
    {
        var cols, lastColumn, row, _378_52_, _382_85_, _386_14_

        this.updateColumnScrolls()
        if (this.skipOnDblClick && col > 0)
        {
            delete this.skipOnDblClick
            return
        }
        while (col >= this.numCols())
        {
            this.addColumn()
        }
        this.columns[col].loadItems(items,item)
        post.emit('load',{col:col,item:item})
        if (opt.activate)
        {
            if (row = this.columns[col].row(slash.file(opt.activate)))
            {
                row.activate()
                post.emit('load',{col:col + 1,item:row.item})
            }
        }
        else if (opt.active)
        {
            ;(this.columns[col].row(slash.file(opt.active)) != null ? this.columns[col].row(slash.file(opt.active)).setActive() : undefined)
        }
        this.getGitStatus(item,col)
        if (opt.focus !== false && _k_.empty((document.activeElement)) && _k_.empty((($('.popup') != null ? $('.popup').outerHTML : undefined))))
        {
            if (lastColumn = this.lastDirColumn())
            {
                lastColumn.focus()
            }
        }
        ;(typeof opt.cb === "function" ? opt.cb({col:col,item:item}) : undefined)
        if (col >= 2 && this.columns[0].width() < 250)
        {
            this.columns[1].makeRoot()
        }
        cols = this.columns.filter(function (c)
        {
            return c.parent
        })
        cols = cols.map(function (c)
        {
            return {path:c.parent.path,type:c.parent.type}
        })
        return kore.set('browser|columns',cols)
    }

    FileBrowser.prototype["initColumns"] = function ()
    {
        FileBrowser.__super__.initColumns.call(this)
    
        this.view.insertBefore(this.shelf.div,this.view.firstChild)
        this.view.insertBefore(this.shelfResize,null)
        return this.setShelfSize(this.shelfSize)
    }

    FileBrowser.prototype["columnAtPos"] = function (pos)
    {
        var column

        if (column = FileBrowser.__super__.columnAtPos.call(this,pos))
        {
            return column
        }
        if (elem.containsPos(this.shelf.div,pos))
        {
            return this.shelf
        }
    }

    FileBrowser.prototype["lastColumnPath"] = function ()
    {
        var lastColumn

        if (lastColumn = this.lastUsedColumn())
        {
            return lastColumn.path()
        }
    }

    FileBrowser.prototype["lastDirColumn"] = function ()
    {
        var lastColumn

        if (lastColumn = this.lastUsedColumn())
        {
            if (lastColumn.isDir())
            {
                return lastColumn
            }
            else
            {
                return lastColumn.prevColumn()
            }
        }
    }

    FileBrowser.prototype["lastDirOrSrcColumn"] = function ()
    {
        var lastColumn

        if (lastColumn = this.lastUsedColumn())
        {
            if (lastColumn.isDir() || lastColumn.isSrc())
            {
                return lastColumn
            }
            else
            {
                return lastColumn.prevColumn()
            }
        }
    }

    FileBrowser.prototype["onBackspaceInColumn"] = function (column)
    {
        return column.backspaceSearch()
    }

    FileBrowser.prototype["onDeleteInColumn"] = function (column)
    {
        if (column.searchDiv)
        {
            return column.clearSearch()
        }
        else
        {
            return column.moveToTrash()
        }
    }

    FileBrowser.prototype["updateColumnScrolls"] = function ()
    {
        FileBrowser.__super__.updateColumnScrolls.call(this)
    
        var _453_14_

        return (this.shelf != null ? this.shelf.scroll.update() : undefined)
    }

    FileBrowser.prototype["getGitStatus"] = function (item, col)
    {
        var file, _463_25_, _463_38_

        file = ((_463_25_=item.path) != null ? _463_25_ : (item.parent != null ? item.parent.path : undefined))
        if (!_k_.empty(file))
        {
            Git.status(file).then((function (status)
            {
                return this.applyGitStatusFiles(col,status.files)
            }).bind(this))
        }
        return this
    }

    FileBrowser.prototype["applyGitStatusFiles"] = function (col, files)
    {
        return (this.columns[col] != null ? this.columns[col].updateGitFiles(files) : undefined)
    }

    FileBrowser.prototype["onGitStatus"] = function (status)
    {
        var col

        for (var _474_19_ = col = 0, _474_23_ = this.columns.length; (_474_19_ <= _474_23_ ? col < this.columns.length : col > this.columns.length); (_474_19_ <= _474_23_ ? ++col : --col))
        {
            this.applyGitStatusFiles(col,status.files)
        }
        return this
    }

    FileBrowser.prototype["onShelfDrag"] = function (drag, event)
    {
        var shelfSize

        shelfSize = _k_.clamp(0,400,drag.pos.x)
        return this.setShelfSize(shelfSize)
    }

    FileBrowser.prototype["setShelfSize"] = function (shelfSize)
    {
        this.shelfSize = shelfSize
    
        window.stash.set('shelf|size',this.shelfSize)
        this.shelfResize.style.left = `${this.shelfSize}px`
        this.shelf.div.style.width = `${this.shelfSize}px`
        this.cols.style.left = `${this.shelfSize}px`
        return this.updateColumnScrolls()
    }

    FileBrowser.prototype["toggleShelf"] = function ()
    {
        var _503_29_

        if (this.shelfSize < 1)
        {
            this.setShelfSize(200)
        }
        else
        {
            ;(this.lastUsedColumn() != null ? this.lastUsedColumn().focus() : undefined)
            this.setShelfSize(0)
        }
        return this.updateColumnScrolls()
    }

    return FileBrowser
})()

export default FileBrowser;
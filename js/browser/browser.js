// monsterkodi/kode 0.223.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}}

var Browser, childp, clamp, Column, elem, event, flex, fs, kerror, kpos, os, setStyle, slash

childp = require('kxk').childp
clamp = require('kxk').clamp
elem = require('kxk').elem
fs = require('kxk').fs
kerror = require('kxk').kerror
kpos = require('kxk').kpos
os = require('kxk').os
setStyle = require('kxk').setStyle
slash = require('kxk').slash

Column = require('./column')
flex = require('../win/flex/flex')
event = require('events')

Browser = (function ()
{
    _k_.extend(Browser, event)
    function Browser (view)
    {
        this.view = view
    
        this["refresh"] = this["refresh"].bind(this)
        this["updateColumnScrolls"] = this["updateColumnScrolls"].bind(this)
        this["focus"] = this["focus"].bind(this)
        this.columns = []
        setStyle('.browserRow .ext','display',window.state.get('browser|hideExtensions') && 'none' || 'initial')
        return Browser.__super__.constructor.apply(this, arguments)
    }

    Browser.prototype["initColumns"] = function ()
    {
        var _31_23_, _35_16_

        if ((this.cols != null) && this.cols.parentNode === this.view)
        {
            return
        }
        this.view.innerHTML = ''
        if ((this.cols != null))
        {
            this.view.appendChild(this.cols)
            return
        }
        this.cols = elem({class:'browser',id:'columns'})
        this.view.appendChild(this.cols)
        this.columns = []
        return this.flex = new flex({view:this.cols,onPaneSize:this.updateColumnScrolls})
    }

    Browser.prototype["columnAtPos"] = function (pos)
    {
        var column

        var list = _k_.list(this.columns)
        for (var _50_19_ = 0; _50_19_ < list.length; _50_19_++)
        {
            column = list[_50_19_]
            if (elem.containsPos(column.div,pos))
            {
                return column
            }
        }
        return null
    }

    Browser.prototype["columnAtX"] = function (x)
    {
        var column, cpos, pos

        var list = _k_.list(this.columns)
        for (var _57_19_ = 0; _57_19_ < list.length; _57_19_++)
        {
            column = list[_57_19_]
            cpos = kpos(column.div.getBoundingClientRect().left,column.div.getBoundingClientRect().top)
            pos = kpos(x,cpos.y)
            if (elem.containsPos(column.div,pos))
            {
                return column
            }
        }
        return null
    }

    Browser.prototype["rowAtPos"] = function (pos)
    {
        var column

        if (column = this.columnAtPos(pos))
        {
            return column.rowAtPos(pos)
        }
        return null
    }

    Browser.prototype["navigate"] = function (key)
    {
        var col, index, nuidx, row, _100_39_, _100_52_, _91_34_, _91_42_

        this.select.clear()
        if (key === 'up')
        {
            if (this.activeColumnIndex() > 0)
            {
                if (col = this.activeColumn())
                {
                    if (row = col.activeRow())
                    {
                        this.loadItem(this.fileItem(row.item.file))
                    }
                    else
                    {
                        this.loadItem(this.fileItem(col.path()))
                    }
                }
            }
            else
            {
                if (!slash.isRoot(this.columns[0].path()))
                {
                    this.loadItem(this.fileItem(slash.dir(this.columns[0].path())))
                }
            }
        }
        else
        {
            index = ((_91_42_=(this.focusColumn() != null ? this.focusColumn().index : undefined)) != null ? _91_42_ : 0)
            nuidx = index + ((function ()
            {
                switch (key)
                {
                    case 'left':
                    case 'up':
                        return -1

                    case 'right':
                        return 1

                }

            }).bind(this))()
            nuidx = clamp(0,this.numCols() - 1,nuidx)
            if (nuidx === index)
            {
                return
            }
            if (this.columns[nuidx].numRows())
            {
                ;((_100_39_=this.columns[nuidx].focus()) != null ? (_100_52_=_100_39_.activeRow()) != null ? _100_52_.activate() : undefined : undefined)
            }
        }
        this.updateColumnScrolls()
        return this
    }

    Browser.prototype["focus"] = function (opt)
    {
        var _112_29_

        ;(this.lastDirOrSrcColumn() != null ? this.lastDirOrSrcColumn().focus(opt) : undefined)
        return this
    }

    Browser.prototype["focusColumn"] = function ()
    {
        var c

        var list = _k_.list(this.columns)
        for (var _116_14_ = 0; _116_14_ < list.length; _116_14_++)
        {
            c = list[_116_14_]
            if (c.hasFocus())
            {
                return c
            }
        }
    }

    Browser.prototype["emptyColumn"] = function (colIndex)
    {
        var c, col

        if ((colIndex != null))
        {
            for (var _128_22_ = c = colIndex, _128_33_ = this.numCols(); (_128_22_ <= _128_33_ ? c < this.numCols() : c > this.numCols()); (_128_22_ <= _128_33_ ? ++c : --c))
            {
                this.clearColumn(c)
            }
        }
        var list = _k_.list(this.columns)
        for (var _131_16_ = 0; _131_16_ < list.length; _131_16_++)
        {
            col = list[_131_16_]
            if (col.isEmpty())
            {
                return col
            }
        }
        return this.addColumn()
    }

    Browser.prototype["activeColumn"] = function ()
    {
        return this.column(this.activeColumnIndex())
    }

    Browser.prototype["activeColumnIndex"] = function ()
    {
        var col

        var list = _k_.list(this.columns)
        for (var _145_16_ = 0; _145_16_ < list.length; _145_16_++)
        {
            col = list[_145_16_]
            if (col.hasFocus())
            {
                return col.index
            }
        }
        return 0
    }

    Browser.prototype["lastUsedColumn"] = function ()
    {
        var col, used

        used = null
        var list = _k_.list(this.columns)
        for (var _152_16_ = 0; _152_16_ < list.length; _152_16_++)
        {
            col = list[_152_16_]
            if (!col.isEmpty())
            {
                used = col
            }
            else
            {
                break
            }
        }
        return used
    }

    Browser.prototype["hasEmptyColumns"] = function ()
    {
        return this.columns.slice(-1)[0].isEmpty()
    }

    Browser.prototype["height"] = function ()
    {
        var _160_20_

        return (this.flex != null ? this.flex.height() : undefined)
    }

    Browser.prototype["numCols"] = function ()
    {
        return this.columns.length
    }

    Browser.prototype["column"] = function (i)
    {
        if ((0 <= i && i < this.numCols()))
        {
            return this.columns[i]
        }
    }

    Browser.prototype["addColumn"] = function ()
    {
        var col

        if (!this.flex)
        {
            return
        }
        col = new Column(this)
        this.columns.push(col)
        this.flex.addPane({div:col.div,size:50})
        return col
    }

    Browser.prototype["clearColumn"] = function (index)
    {
        if (index < this.columns.length)
        {
            return this.columns[index].clear()
        }
    }

    Browser.prototype["shiftColumn"] = function ()
    {
        var i

        if (!this.flex)
        {
            return
        }
        if (!this.columns.length)
        {
            return
        }
        this.clearColumn(0)
        this.flex.shiftPane()
        this.columns.shift()
        for (var _195_18_ = i = 0, _195_22_ = this.columns.length; (_195_18_ <= _195_22_ ? i < this.columns.length : i > this.columns.length); (_195_18_ <= _195_22_ ? ++i : --i))
        {
            this.columns[i].setIndex(i)
        }
    }

    Browser.prototype["popColumn"] = function (opt)
    {
        if (!this.flex)
        {
            return
        }
        this.clearColumn(this.columns.length - 1)
        this.flex.popPane(opt)
        return this.columns.pop()
    }

    Browser.prototype["popEmptyColumns"] = function (opt)
    {
        var _207_42_, _207_50_

        return this.clearColumnsFrom(((_207_50_=(this.lastDirColumn() != null ? this.lastDirColumn().index : undefined)) != null ? _207_50_ : 0),{pop:true})
    }

    Browser.prototype["shiftColumnsTo"] = function (col)
    {
        var i

        for (var _211_18_ = i = 0, _211_22_ = col; (_211_18_ <= _211_22_ ? i < col : i > col); (_211_18_ <= _211_22_ ? ++i : --i))
        {
            this.shiftColumn()
        }
        return this.updateColumnScrolls()
    }

    Browser.prototype["clear"] = function ()
    {
        return this.clearColumnsFrom(0,{pop:true})
    }

    Browser.prototype["clearColumnsFrom"] = function (c = 0, opt = {pop:false})
    {
        var num, _230_24_

        if (!(c != null) || c < 0)
        {
            return kerror(`clearColumnsFrom ${c}?`)
        }
        num = this.numCols()
        if (opt.pop)
        {
            if ((opt.clear != null))
            {
                while (c <= opt.clear)
                {
                    this.clearColumn(c)
                    c++
                }
            }
            while (c < num)
            {
                this.popColumn()
                c++
            }
        }
        else
        {
            while (c < num)
            {
                this.clearColumn(c)
                c++
            }
        }
    }

    Browser.prototype["isMessy"] = function ()
    {
        return !this.flex.relaxed || this.hasEmptyColumns()
    }

    Browser.prototype["cleanUp"] = function ()
    {
        var _251_33_

        if (!(this.flex != null))
        {
            return false
        }
        if (!this.isMessy())
        {
            return false
        }
        this.popEmptyColumns()
        this.flex.relax()
        return true
    }

    Browser.prototype["resized"] = function ()
    {
        return this.updateColumnScrolls()
    }

    Browser.prototype["updateColumnScrolls"] = function ()
    {
        var c

        var list = _k_.list(this.columns)
        for (var _263_14_ = 0; _263_14_ < list.length; _263_14_++)
        {
            c = list[_263_14_]
            c.scroll.update()
        }
    }

    Browser.prototype["reset"] = function ()
    {
        delete this.cols
        return this.initColumns()
    }

    Browser.prototype["stop"] = function ()
    {
        this.cols.remove()
        return this.cols = null
    }

    Browser.prototype["start"] = function ()
    {
        return this.initColumns()
    }

    Browser.prototype["refresh"] = function ()
    {
        return reset()
    }

    Browser.prototype["convertPXM"] = function (row)
    {
        var file, item, tmpPNG, tmpPXM

        item = row.item
        file = item.file
        tmpPXM = slash.join(os.tmpdir(),`ko-${slash.base(file)}.pxm`)
        tmpPNG = slash.swapExt(tmpPXM,'.png')
        return fs.copy(file,tmpPXM,(function (err)
        {
            if ((err != null))
            {
                return kerror(`can't copy pxm image ${file} to ${tmpPXM}: ${err}`)
            }
            return childp.exec(`open ${__dirname}/../../bin/pxm2png.app --args ${tmpPXM}`,(function (err)
            {
                var loadDelayed

                if ((err != null))
                {
                    return kerror(`can't convert pxm image ${tmpPXM} to ${tmpPNG}: ${err}`)
                }
                loadDelayed = (function ()
                {
                    return this.loadImage(row,tmpPNG)
                }).bind(this)
                return setTimeout(loadDelayed,300)
            }).bind(this))
        }).bind(this))
    }

    Browser.prototype["convertImage"] = function (row)
    {
        var file, item, tmpImg

        item = row.item
        file = item.file
        tmpImg = slash.join(os.tmpdir(),`ko-${slash.basename(file)}.png`)
        return childp.exec(`/usr/bin/sips -s format png \"${file}\" --out \"${tmpImg}\"`,(function (err)
        {
            if ((err != null))
            {
                return kerror(`can't convert image ${file}: ${err}`)
            }
            return this.loadImage(row,tmpImg)
        }).bind(this))
    }

    Browser.prototype["loadImage"] = function (row, file)
    {
        var cnt, col

        if (!row.isActive())
        {
            return
        }
        col = this.emptyColumn((opt != null ? opt.column : undefined))
        this.clearColumnsFrom(col.index)
        cnt = elem({class:'browserImageContainer',child:elem('img',{class:'browserImage',src:slash.fileUrl(file)})})
        return col.table.appendChild(cnt)
    }

    return Browser
})()

module.exports = Browser
// monsterkodi/kode 0.229.0

var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.hasOwn(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var Browser, childp, Column, elem, event, flex, fs, kerror, kpos, kxk, os, setStyle, slash

kxk = require('kxk')
childp = kxk.childp
elem = kxk.elem
fs = kxk.fs
kerror = kxk.kerror
kpos = kxk.kpos
os = kxk.os
setStyle = kxk.setStyle
slash = kxk.slash

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
        var _32_23_, _36_16_

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
        for (var _51_19_ = 0; _51_19_ < list.length; _51_19_++)
        {
            column = list[_51_19_]
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
        for (var _58_19_ = 0; _58_19_ < list.length; _58_19_++)
        {
            column = list[_58_19_]
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
        var col, index, nuidx, row, _101_39_, _101_52_, _92_34_, _92_42_

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
            index = ((_92_42_=(this.focusColumn() != null ? this.focusColumn().index : undefined)) != null ? _92_42_ : 0)
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
            nuidx = _k_.clamp(0,this.numCols() - 1,nuidx)
            if (nuidx === index)
            {
                return
            }
            if (this.columns[nuidx].numRows())
            {
                ;((_101_39_=this.columns[nuidx].focus()) != null ? (_101_52_=_101_39_.activeRow()) != null ? _101_52_.activate() : undefined : undefined)
            }
        }
        this.updateColumnScrolls()
        return this
    }

    Browser.prototype["focus"] = function (opt)
    {
        var _113_29_

        ;(this.lastDirOrSrcColumn() != null ? this.lastDirOrSrcColumn().focus(opt) : undefined)
        return this
    }

    Browser.prototype["focusColumn"] = function ()
    {
        var c

        var list = _k_.list(this.columns)
        for (var _117_14_ = 0; _117_14_ < list.length; _117_14_++)
        {
            c = list[_117_14_]
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
            for (var _129_22_ = c = colIndex, _129_33_ = this.numCols(); (_129_22_ <= _129_33_ ? c < this.numCols() : c > this.numCols()); (_129_22_ <= _129_33_ ? ++c : --c))
            {
                this.clearColumn(c)
            }
        }
        var list = _k_.list(this.columns)
        for (var _132_16_ = 0; _132_16_ < list.length; _132_16_++)
        {
            col = list[_132_16_]
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
        for (var _146_16_ = 0; _146_16_ < list.length; _146_16_++)
        {
            col = list[_146_16_]
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
        for (var _153_16_ = 0; _153_16_ < list.length; _153_16_++)
        {
            col = list[_153_16_]
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
        var _161_20_

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
        for (var _196_18_ = i = 0, _196_22_ = this.columns.length; (_196_18_ <= _196_22_ ? i < this.columns.length : i > this.columns.length); (_196_18_ <= _196_22_ ? ++i : --i))
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
        var _208_42_, _208_50_

        return this.clearColumnsFrom(((_208_50_=(this.lastDirColumn() != null ? this.lastDirColumn().index : undefined)) != null ? _208_50_ : 0),{pop:true})
    }

    Browser.prototype["shiftColumnsTo"] = function (col)
    {
        var i

        for (var _212_18_ = i = 0, _212_22_ = col; (_212_18_ <= _212_22_ ? i < col : i > col); (_212_18_ <= _212_22_ ? ++i : --i))
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
        var num, _231_24_

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
        var _252_33_

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
        for (var _264_14_ = 0; _264_14_ < list.length; _264_14_++)
        {
            c = list[_264_14_]
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
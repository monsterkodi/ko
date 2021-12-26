// monsterkodi/kode 0.234.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clone: function (o,v) { v ??= new Map(); if (o instanceof Array) { if (!v.has(o)) {var r = []; v.set(o,r); for (var i=0; i < o.length; i++) {if (!v.has(o[i])) { v.set(o[i],_k_.clone(o[i],v)) }; r.push(v.get(o[i]))}}; return v.get(o) } else if (typeof o == 'string') { if (!v.has(o)) {v.set(o,''+o)}; return v.get(o) } else if (o != null && typeof o == 'object' && o.constructor.name == 'Object') { if (!v.has(o)) { var k, r = {}; v.set(o,r); for (k in o) { if (!v.has(o[k])) { v.set(o[k],_k_.clone(o[k],v)) }; r[k] = v.get(o[k]) }; }; return v.get(o) } else {return o} }, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var $, elem, File, fs, kerror, kxk, post, ranges, slash, stopEvent, sw, _

kxk = require('kxk')
post = kxk.post
stopEvent = kxk.stopEvent
slash = kxk.slash
elem = kxk.elem
fs = kxk.fs
sw = kxk.sw
kerror = kxk.kerror
$ = kxk.$
_ = kxk._

ranges = require('../tools/ranges')
File = require('../tools/file')
class Meta
{
    constructor (editor)
    {
        var _33_26_

        this.editor = editor
    
        this.clear = this.clear.bind(this)
        this.onClearLines = this.onClearLines.bind(this)
        this.onLineDeleted = this.onLineDeleted.bind(this)
        this.onLineInserted = this.onLineInserted.bind(this)
        this.onLinesShifted = this.onLinesShifted.bind(this)
        this.onLinesShown = this.onLinesShown.bind(this)
        this.onLineAppended = this.onLineAppended.bind(this)
        this.onNumber = this.onNumber.bind(this)
        this.onChanged = this.onChanged.bind(this)
        this.metas = []
        this.lineMetas = {}
        this.elem = $(".meta",this.editor.view)
        this.editor.on('changed',this.onChanged)
        this.editor.on('lineAppended',this.onLineAppended)
        this.editor.on('clearLines',this.onClearLines)
        this.editor.on('lineInserted',this.onLineInserted)
        this.editor.on('lineDeleted',this.onLineDeleted)
        this.editor.on('linesShown',this.onLinesShown)
        this.editor.on('linesShifted',this.onLinesShifted)
        if ((this.editor.numbers != null))
        {
            this.editor.numbers.on('numberAdded',this.onNumber)
            this.editor.numbers.on('numberChanged',this.onNumber)
        }
        this.elem.addEventListener('mousedown',this.onMouseDown)
    }

    onChanged (changeInfo)
    {
        var button, change, file, li, line, localChange, meta, _51_66_, _61_35_

        var list = _k_.list(changeInfo.changes)
        for (var _47_19_ = 0; _47_19_ < list.length; _47_19_++)
        {
            change = list[_47_19_]
            li = change.oldIndex
            if (change.change === 'deleted')
            {
                continue
            }
            var list1 = _k_.list(this.metasAtLineIndex(li))
            for (var _50_21_ = 0; _50_21_ < list1.length; _50_21_++)
            {
                meta = list1[_50_21_]
                if (meta[2].clss === "searchResult" && (meta[2].href != null))
                {
                    var _52_33_ = slash.splitFileLine(meta[2].href); file = _52_33_[0]; line = _52_33_[1]

                    line -= 1
                    localChange = _k_.clone(change)
                    localChange.oldIndex = line
                    localChange.newIndex = line
                    localChange.doIndex = line
                    localChange.after = this.editor.line(meta[0])
                    this.editor.emit('fileSearchResultChange',file,localChange)
                    meta[2].state = 'unsaved'
                    if ((meta[2].span != null))
                    {
                        button = this.saveButton(li)
                        if (!meta[2].span.innerHTML.startsWith("<span"))
                        {
                            meta[2].span.innerHTML = button
                        }
                    }
                }
            }
        }
    }

    saveFileLineMetas (file, lineMetas)
    {
        return fs.readFile(file,{encoding:'utf8'},function (err, data)
        {
            var lineMeta, lines

            if ((err != null))
            {
                return kerror(`Meta.saveFileLineMetas -- readFile err:${err}`)
            }
            lines = data.split(/\r?\n/)
            var list = _k_.list(lineMetas)
            for (var _77_25_ = 0; _77_25_ < list.length; _77_25_++)
            {
                lineMeta = list[_77_25_]
                lines[lineMeta[0]] = lineMeta[1]
            }
            data = lines.join('\n')
            return File.save(file,data,function (err, file)
            {
                var meta

                if ((err != null))
                {
                    return kerror(`Meta.saveFileLineMetas -- writeFile err:${err}`)
                }
                var list1 = _k_.list(lineMetas)
                for (var _83_29_ = 0; _83_29_ < list1.length; _83_29_++)
                {
                    lineMeta = list1[_83_29_]
                    if (meta = lineMeta[2])
                    {
                        if (meta[2])
                        {
                            delete meta[2].state
                        }
                        if ((meta[2] != null ? meta[2].span : undefined))
                        {
                            meta[2].span.innerHTML = lineMeta[0] + 1
                        }
                    }
                }
                return post.emit('search-saved',file)
            })
        })
    }

    saveLine (li)
    {
        var file, fileLineMetas, line, lineMetas, meta, mfile, _102_45_

        var list = _k_.list(this.metasAtLineIndex(li))
        for (var _91_17_ = 0; _91_17_ < list.length; _91_17_++)
        {
            meta = list[_91_17_]
            if (meta[2].state === 'unsaved')
            {
                var _93_29_ = slash.splitFileLine(meta[2].href); file = _93_29_[0]; line = _93_29_[1]

                break
            }
        }
        if (file)
        {
            fileLineMetas = {}
            var list1 = _k_.list(this.metas)
            for (var _98_21_ = 0; _98_21_ < list1.length; _98_21_++)
            {
                meta = list1[_98_21_]
                if (meta[2].state === 'unsaved')
                {
                    var _100_34_ = slash.splitFileLine(meta[2].href); mfile = _100_34_[0]; line = _100_34_[1]

                    if (mfile === file)
                    {
                        fileLineMetas[mfile] = ((_102_45_=fileLineMetas[mfile]) != null ? _102_45_ : [])
                        fileLineMetas[mfile].push([line - 1,this.editor.line(meta[0]),meta])
                    }
                }
            }
            for (file in fileLineMetas)
            {
                lineMetas = fileLineMetas[file]
                this.saveFileLineMetas(file,lineMetas)
            }
        }
    }

    saveChanges ()
    {
        var file, fileLineMetas, line, lineMetas, meta, _114_36_

        fileLineMetas = {}
        var list = _k_.list(this.metas)
        for (var _111_17_ = 0; _111_17_ < list.length; _111_17_++)
        {
            meta = list[_111_17_]
            if (meta[2].state === 'unsaved')
            {
                var _113_29_ = slash.splitFileLine(meta[2].href); file = _113_29_[0]; line = _113_29_[1]

                fileLineMetas[file] = ((_114_36_=fileLineMetas[file]) != null ? _114_36_ : [])
                fileLineMetas[file].push([line - 1,this.editor.line(meta[0]),meta])
            }
        }
        for (file in fileLineMetas)
        {
            lineMetas = fileLineMetas[file]
            this.saveFileLineMetas(file,lineMetas)
        }
        return fileLineMetas.length
    }

    saveButton (li)
    {
        return `<span class=\"saveButton\" onclick=\"window.terminal.meta.saveLine(${li});\">&#128190;</span>`
    }

    onNumber (e)
    {
        var meta, metas, num, _141_38_, _144_108_, _145_81_

        metas = this.metasAtLineIndex(e.lineIndex)
        var list = _k_.list(metas)
        for (var _134_17_ = 0; _134_17_ < list.length; _134_17_++)
        {
            meta = list[_134_17_]
            meta[2].span = e.numberSpan
            e.numberSpan.className = ''
            e.numberSpan.parentNode.className = 'linenumber'
            switch (meta[2].clss)
            {
                case 'searchResult':
                case 'termCommand':
                case 'termResult':
                case 'coffeeCommand':
                case 'coffeeResult':
                case 'commandlistItem':
                case 'gitInfoFile':
                    num = meta[2].state === 'unsaved' && this.saveButton(meta[0])
                    if (!num)
                    {
                        num = (meta[2].line != null) && meta[2].line
                    }
                    if (!num)
                    {
                        num = slash.splitFileLine(meta[2].href)[1]
                    }
                    if (!num)
                    {
                        num = '?'
                    }
                    if ((meta[2].lineClss != null))
                    {
                        e.numberSpan.parentNode.className = 'linenumber ' + meta[2].lineClss
                    }
                    if ((meta[2].lineClss != null))
                    {
                        e.numberSpan.className = meta[2].lineClss
                    }
                    e.numberSpan.innerHTML = num
                    break
                case 'spacer':
                    e.numberSpan.innerHTML = '&nbsp;'
                    break
            }

        }
    }

    setMetaPos (meta, tx, ty)
    {
        if (meta[2].div)
        {
            if (meta[2].no_x)
            {
                return meta[2].div.style.transform = `translateY(${ty}px)`
            }
            else
            {
                return meta[2].div.style.transform = `translate(${tx}px,${ty}px)`
            }
        }
    }

    updatePos (meta)
    {
        var size, tx, ty, _167_76_, _168_81_

        size = this.editor.size
        tx = size.charWidth * meta[1][0] + size.offsetX + (((_167_76_=meta[2].xOffset) != null ? _167_76_ : 0))
        ty = size.lineHeight * (meta[0] - this.editor.scroll.top) + (((_168_81_=meta[2].yOffset) != null ? _168_81_ : 0))
        return this.setMetaPos(meta,tx,ty)
    }

    addDiv (meta)
    {
        var div, k, lh, size, v, _1_13_, _184_52_, _194_24_

        size = this.editor.size
        sw = size.charWidth * (meta[1][1] - meta[1][0])
        lh = size.lineHeight
        div = elem({class:`meta ${((_1_13_=meta[2].clss) != null ? _1_13_ : '')}`})
        if ((meta[2].html != null))
        {
            div.innerHTML = meta[2].html
        }
        meta[2].div = div
        div.meta = meta
        if (meta[2].toggled)
        {
            div.classList.add('toggled')
        }
        if (!meta[2].no_h)
        {
            div.style.height = `${lh}px`
        }
        if ((meta[2].style != null))
        {
            for (k in meta[2].style)
            {
                v = meta[2].style[k]
                div.style[k] = v
            }
        }
        if (!meta[2].no_x)
        {
            div.style.width = `${sw}px`
        }
        this.elem.appendChild(div)
        return this.updatePos(meta)
    }

    delDiv (meta)
    {
        var _214_19_

        if (!((meta != null ? meta[2] : undefined) != null))
        {
            return kerror('no line meta?',meta)
        }
        ;(meta[2].div != null ? meta[2].div.remove() : undefined)
        return meta[2].div = null
    }

    add (meta)
    {
        var lineMeta

        lineMeta = this.addLineMeta([meta.line,[meta.start,meta.end],meta])
        if ((this.editor.scroll.top <= meta.line && meta.line <= this.editor.scroll.bot))
        {
            return this.addDiv(lineMeta)
        }
    }

    addDiffMeta (meta)
    {
        meta.diff = true
        return this.addNumberMeta(meta)
    }

    addNumberMeta (meta)
    {
        var lineMeta

        meta.no_x = true
        lineMeta = this.addLineMeta([meta.line,[0,0],meta])
        if ((this.editor.scroll.top <= meta.line && meta.line <= this.editor.scroll.bot))
        {
            return this.addDiv(lineMeta)
        }
    }

    onMouseDown (event)
    {
        var result, _257_28_, _257_38_, _258_38_

        if (((event.target.meta != null ? event.target.meta[2].click : undefined) != null))
        {
            result = (event.target.meta != null ? event.target.meta[2].click(event.target.meta,event) : undefined)
            if (result !== 'unhandled')
            {
                return stopEvent(event)
            }
        }
    }

    append (meta)
    {
        var lineMeta

        lineMeta = this.addLineMeta([this.editor.numLines(),[0,0],meta])
        return lineMeta
    }

    addLineMeta (lineMeta)
    {
        var _276_32_

        if (!((lineMeta != null ? lineMeta[2] : undefined) != null))
        {
            return kerror('invalid line meta?',lineMeta)
        }
        this.lineMetas[lineMeta[0]] = ((_276_32_=this.lineMetas[lineMeta[0]]) != null ? _276_32_ : [])
        this.lineMetas[lineMeta[0]].push(lineMeta)
        this.metas.push(lineMeta)
        return lineMeta
    }

    moveLineMeta (lineMeta, d)
    {
        var _288_32_

        if (!(lineMeta != null) || d === 0)
        {
            return kerror('invalid move?',lineMeta,d)
        }
        _.pull(this.lineMetas[lineMeta[0]],lineMeta)
        if (_k_.empty(this.lineMetas[lineMeta[0]]))
        {
            delete this.lineMetas[lineMeta[0]]
        }
        lineMeta[0] += d
        this.lineMetas[lineMeta[0]] = ((_288_32_=this.lineMetas[lineMeta[0]]) != null ? _288_32_ : [])
        this.lineMetas[lineMeta[0]].push(lineMeta)
        return this.updatePos(lineMeta)
    }

    onLineAppended (e)
    {
        var meta

        var list = _k_.list(this.metasAtLineIndex(e.lineIndex))
        for (var _294_17_ = 0; _294_17_ < list.length; _294_17_++)
        {
            meta = list[_294_17_]
            if (meta[1][1] === 0)
            {
                meta[1][1] = e.text.length
            }
        }
    }

    metasAtLineIndex (li)
    {
        var _297_45_

        return ((_297_45_=this.lineMetas[li]) != null ? _297_45_ : [])
    }

    hrefAtLineIndex (li)
    {
        var meta, _302_47_

        var list = _k_.list(this.metasAtLineIndex(li))
        for (var _301_17_ = 0; _301_17_ < list.length; _301_17_++)
        {
            meta = list[_301_17_]
            if ((meta[2].href != null))
            {
                return meta[2].href
            }
        }
    }

    onLinesShown (top, bot, num)
    {
        var meta

        var list = _k_.list(this.metas)
        for (var _312_17_ = 0; _312_17_ < list.length; _312_17_++)
        {
            meta = list[_312_17_]
            this.delDiv(meta)
            if ((top <= meta[0] && meta[0] <= bot))
            {
                this.addDiv(meta)
            }
        }
    }

    onLinesShifted (top, bot, num)
    {
        var meta

        if (num > 0)
        {
            var list = _k_.list(rangesFromTopToBotInRanges(top - num,top - 1,this.metas))
            for (var _326_21_ = 0; _326_21_ < list.length; _326_21_++)
            {
                meta = list[_326_21_]
                this.delDiv(meta)
            }
            var list1 = _k_.list(rangesFromTopToBotInRanges(bot - num + 1,bot,this.metas))
            for (var _329_21_ = 0; _329_21_ < list1.length; _329_21_++)
            {
                meta = list1[_329_21_]
                this.addDiv(meta)
            }
        }
        else
        {
            var list2 = _k_.list(rangesFromTopToBotInRanges(bot + 1,bot - num,this.metas))
            for (var _333_21_ = 0; _333_21_ < list2.length; _333_21_++)
            {
                meta = list2[_333_21_]
                this.delDiv(meta)
            }
            var list3 = _k_.list(rangesFromTopToBotInRanges(top,top - num - 1,this.metas))
            for (var _336_21_ = 0; _336_21_ < list3.length; _336_21_++)
            {
                meta = list3[_336_21_]
                this.addDiv(meta)
            }
        }
        return this.updatePositionsBelowLineIndex(top)
    }

    updatePositionsBelowLineIndex (li)
    {
        var meta, size

        size = this.editor.size
        var list = _k_.list(rangesFromTopToBotInRanges(li,this.editor.scroll.bot,this.metas))
        for (var _344_17_ = 0; _344_17_ < list.length; _344_17_++)
        {
            meta = list[_344_17_]
            this.updatePos(meta)
        }
    }

    onLineInserted (li)
    {
        var meta

        var list = _k_.list(rangesFromTopToBotInRanges(li,this.editor.numLines(),this.metas))
        for (var _349_17_ = 0; _349_17_ < list.length; _349_17_++)
        {
            meta = list[_349_17_]
            this.moveLineMeta(meta,1)
        }
        return this.updatePositionsBelowLineIndex(li)
    }

    onLineDeleted (li)
    {
        var meta

        while (meta = _.last(this.metasAtLineIndex(li)))
        {
            this.delMeta(meta)
        }
        var list = _k_.list(rangesFromTopToBotInRanges(li,this.editor.numLines(),this.metas))
        for (var _365_17_ = 0; _365_17_ < list.length; _365_17_++)
        {
            meta = list[_365_17_]
            this.moveLineMeta(meta,-1)
        }
        return this.updatePositionsBelowLineIndex(li)
    }

    onClearLines ()
    {
        var meta

        var list = _k_.list(this.metas)
        for (var _378_17_ = 0; _378_17_ < list.length; _378_17_++)
        {
            meta = list[_378_17_]
            this.delDiv(meta)
        }
        this.metas = []
        this.lineMetas = {}
        return this.elem.innerHTML = ""
    }

    clear ()
    {
        this.elem.innerHTML = ""
        this.metas = []
        return this.lineMetas = {}
    }

    delMeta (meta)
    {
        if (!(meta != null))
        {
            return kerror('del no meta?')
        }
        _.pull(this.lineMetas[meta[0]],meta)
        _.pull(this.metas,meta)
        return this.delDiv(meta)
    }

    delClass (clss)
    {
        var clsss, meta, _400_34_

        var list = _k_.list(_k_.clone(this.metas))
        for (var _399_17_ = 0; _399_17_ < list.length; _399_17_++)
        {
            meta = list[_399_17_]
            clsss = (meta != null ? meta[2] != null ? (_400_34_=meta[2].clss) != null ? _400_34_.split(' ') : undefined : undefined : undefined)
            if (!_k_.empty((clsss)) && _k_.in(clss,clsss))
            {
                this.delMeta(meta)
            }
        }
    }
}

module.exports = Meta
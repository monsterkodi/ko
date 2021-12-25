// monsterkodi/kode 0.228.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var clipboard, electron, kxk, os, _

kxk = require('kxk')
os = kxk.os
_ = kxk._

electron = require('electron')
clipboard = electron.clipboard
module.exports = {actions:{cutCopyPaste:{combos:['command+x','ctrl+x','command+c','ctrl+c','command+v','ctrl+v']}},cutCopyPaste:function (key, info)
{
    switch (key)
    {
        case 'x':
            return this.cut()

        case 'c':
            return this.copy()

        case 'v':
            return this.paste()

    }

},cut:function ()
{
    this.do.start()
    this.copy()
    this.deleteSelectionOrCursorLines()
    return this.do.end()
},copy:function ()
{
    return (clipboard != null ? clipboard.writeText(this.textOfSelectionForClipboard()) : undefined)
},paste:function ()
{
    return this.pasteText((clipboard != null ? clipboard.readText() : undefined))
},replaceSelectedText:function (lines)
{
    var insert, ldiff, newSelections, ns, oldLength

    this.do.start()
    newSelections = this.do.selections()
    var list = _k_.list(newSelections)
    for (var _48_15_ = 0; _48_15_ < list.length; _48_15_++)
    {
        ns = list[_48_15_]
        insert = lines.shift()
        oldLength = ns[1][1] - ns[1][0]
        this.do.change(ns[0],this.do.line(ns[0]).splice(ns[1][0],oldLength,insert))
        ldiff = insert.length - oldLength
        var list1 = _k_.list(rangesAfterLineColInRanges(ns[0],ns[1][1],newSelections))
        for (var _53_19_ = 0; _53_19_ < list1.length; _53_19_++)
        {
            os = list1[_53_19_]
            os[1][0] += ldiff
            os[1][1] += ldiff
        }
        ns[1][1] += ldiff
    }
    this.do.select(newSelections)
    this.do.setCursors(endPositionsFromRanges(newSelections))
    return this.do.end()
},pasteText:function (text)
{
    var after, before, c, ci, cp, indt, insert, li, line, lines, newCursors, removeLastLine

    lines = text.split('\n')
    if (lines.length === this.numSelections())
    {
        this.replaceSelectedText(lines)
        this.select([])
        return
    }
    if ((this.numLines() === 1 && this.text() === '' && lines.length > 1) || areSameRanges(this.rangesForAllLines(),this.selections()))
    {
        removeLastLine = true
    }
    this.deleteSelection()
    this.do.start()
    this.clampCursorOrFillVirtualSpaces()
    newCursors = this.do.cursors()
    if (newCursors.length > 1 && lines.length === 1)
    {
        lines = (function () { var _89__36_ = []; var list = _k_.list(newCursors); for (var _89_36_ = 0; _89_36_ < list.length; _89_36_++)  { c = list[_89_36_];_89__36_.push(lines[0])  } return _89__36_ }).bind(this)()
    }
    if (newCursors.length > 1 || (lines.length === 1))
    {
        for (var _93_23_ = ci = newCursors.length - 1, _93_44_ = 0; (_93_23_ <= _93_44_ ? ci <= 0 : ci >= 0); (_93_23_ <= _93_44_ ? ++ci : --ci))
        {
            c = newCursors[ci]
            insert = lines[ci % lines.length]
            this.do.change(c[1],this.do.line(c[1]).splice(c[0],0,insert))
            var list1 = _k_.list(positionsAfterLineColInPositions(c[1],c[0] - 1,newCursors))
            for (var _97_22_ = 0; _97_22_ < list1.length; _97_22_++)
            {
                c = list1[_97_22_]
                cursorDelta(c,insert.length)
            }
        }
    }
    else
    {
        cp = newCursors[0]
        li = cp[1]
        newCursors = null
        if (cp[0] > 0)
        {
            var _107_32_ = this.splitStateLineAtPos(this.do,cp); before = _107_32_[0]; after = _107_32_[1]

            after = after.trimLeft()
            indt = _.padStart("",indentationInLine(this.do.line(cp[1])))
            if (before.trim().length)
            {
                this.do.change(li,before)
                li += 1
                if ((indt + after).trim().length)
                {
                    lines.push(indt + after)
                    newCursors = [[0,li + lines.length - 1]]
                }
            }
        }
        else
        {
            if (this.do.line(li).length === 0 && !removeLastLine)
            {
                li += 1
            }
        }
        var list2 = _k_.list(lines)
        for (var _121_21_ = 0; _121_21_ < list2.length; _121_21_++)
        {
            line = list2[_121_21_]
            this.do.insert(li,line)
            li += 1
        }
        if (_k_.empty(newCursors))
        {
            newCursors = [[0,li]]
        }
    }
    if (removeLastLine)
    {
        this.do.delete(this.do.numLines() - 1)
    }
    this.do.setCursors(newCursors)
    return this.do.end()
}}
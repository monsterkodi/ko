var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, lpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s=c+s} return s}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr

export default {actions:{cutCopyPaste:{combos:['command+x','ctrl+x','command+c','ctrl+c','command+v','ctrl+v']}},cutCopyPaste:function (key, info)
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
},copy:async function ()
{
    var copied, text

    text = this.textOfSelectionForClipboard()
    return copied = await kakao('clipboard.set',text)
},paste:async function ()
{
    return this.pasteText(await kakao('clipboard.get'))
},replaceSelectedText:function (lines)
{
    var insert, ldiff, newSelections, ns, oldLength, os

    this.do.start()
    newSelections = this.do.selections()
    var list = _k_.list(newSelections)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        ns = list[_a_]
        insert = lines.shift()
        oldLength = ns[1][1] - ns[1][0]
        this.do.change(ns[0],kstr.splice(this.do.line(ns[0]),ns[1][0],oldLength,insert))
        ldiff = insert.length - oldLength
        var list1 = _k_.list(rangesAfterLineColInRanges(ns[0],ns[1][1],newSelections))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            os = list1[_b_]
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
        lines = (function () { var r_c_ = []; var list = _k_.list(newCursors); for (var _d_ = 0; _d_ < list.length; _d_++)  { c = list[_d_];r_c_.push(lines[0])  } return r_c_ }).bind(this)()
    }
    if (newCursors.length > 1 || (lines.length === 1))
    {
        for (var _e_ = ci = newCursors.length - 1, _f_ = 0; (_e_ <= _f_ ? ci <= 0 : ci >= 0); (_e_ <= _f_ ? ++ci : --ci))
        {
            c = newCursors[ci]
            insert = lines[ci % lines.length]
            this.do.change(c[1],kstr.splice(this.do.line(c[1]),c[0],0,insert))
            var list1 = _k_.list(positionsAfterLineColInPositions(c[1],c[0] - 1,newCursors))
            for (var _10_ = 0; _10_ < list1.length; _10_++)
            {
                c = list1[_10_]
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
            var _11_ = this.splitStateLineAtPos(this.do,cp); before = _11_[0]; after = _11_[1]

            after = after.trimLeft()
            indt = _k_.lpad(indentationInLine(this.do.line(cp[1])))
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
        for (var _12_ = 0; _12_ < list2.length; _12_++)
        {
            line = list2[_12_]
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
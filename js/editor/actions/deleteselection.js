// monsterkodi/kode 0.227.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var _

_ = require('kxk')._

module.exports = {deleteSelectionOrCursorLines:function ()
{
    this.do.start()
    if (!this.do.numSelections())
    {
        this.selectMoreLines()
    }
    this.deleteSelection()
    return this.do.end()
},deleteSelection:function (opt = {deleteLines:true})
{
    var c, csel, ep, joinLines, lineSelected, nc, newCursors, oldSelections, rg, s, sp

    this.do.start()
    if (this.do.numSelections())
    {
        newCursors = this.do.cursors()
        oldSelections = this.do.selections()
        joinLines = []
        var list = _k_.list(this.do.cursors().reverse())
        for (var _29_18_ = 0; _29_18_ < list.length; _29_18_++)
        {
            c = list[_29_18_]
            if (opt.deleteLines)
            {
                csel = this.continuousSelectionAtPosInRanges(c,oldSelections)
            }
            else
            {
                rg = rangeAtPosInRanges(c,oldSelections)
                if ((rg != null))
                {
                    csel = [rangeStartPos(rg),rangeEndPos(rg)]
                }
            }
            if ((csel != null))
            {
                var _37_29_ = csel; sp = _37_29_[0]; ep = _37_29_[1]

                var list1 = _k_.list(positionsBetweenPosAndPosInPositions(sp,ep,newCursors))
                for (var _38_27_ = 0; _38_27_ < list1.length; _38_27_++)
                {
                    nc = list1[_38_27_]
                    cursorSet(nc,sp)
                }
                if (sp[1] < ep[1] && sp[0] > 0 && ep[0] < this.do.line(ep[1]).length)
                {
                    joinLines.push(sp[1])
                    var list2 = _k_.list(positionsAfterLineColInPositions(ep[1],ep[0],newCursors))
                    for (var _43_31_ = 0; _43_31_ < list2.length; _43_31_++)
                    {
                        nc = list2[_43_31_]
                        cursorSet(nc,sp[0] + nc[0] - ep[0],sp[1])
                    }
                }
            }
        }
        var list3 = _k_.list(this.do.selections().reverse())
        for (var _47_18_ = 0; _47_18_ < list3.length; _47_18_++)
        {
            s = list3[_47_18_]
            if (s[0] >= this.do.numLines())
            {
                continue
            }
            lineSelected = s[1][0] === 0 && s[1][1] === this.do.line(s[0]).length
            if (lineSelected && opt.deleteLines && this.do.numLines() > 1)
            {
                this.do.delete(s[0])
                var list4 = _k_.list(positionsBelowLineIndexInPositions(s[0],newCursors))
                for (var _52_27_ = 0; _52_27_ < list4.length; _52_27_++)
                {
                    nc = list4[_52_27_]
                    cursorDelta(nc,0,-1)
                }
            }
            else
            {
                if (s[0] >= this.do.numLines())
                {
                    continue
                }
                this.do.change(s[0],this.do.line(s[0]).splice(s[1][0],s[1][1] - s[1][0]))
                var list5 = _k_.list(positionsAfterLineColInPositions(s[0],s[1][1],newCursors))
                for (var _57_27_ = 0; _57_27_ < list5.length; _57_27_++)
                {
                    nc = list5[_57_27_]
                    cursorDelta(nc,-(s[1][1] - s[1][0]))
                }
            }
            if (_k_.in(s[0],joinLines))
            {
                this.do.change(s[0],this.do.line(s[0]) + this.do.line(s[0] + 1))
                this.do.delete(s[0] + 1)
                var list6 = _k_.list(positionsBelowLineIndexInPositions(s[0],newCursors))
                for (var _63_27_ = 0; _63_27_ < list6.length; _63_27_++)
                {
                    nc = list6[_63_27_]
                    cursorDelta(nc,0,-1)
                }
                _.pull(joinLines,s[0])
            }
        }
        this.do.select([])
        this.do.setCursors(newCursors)
        this.endSelection()
    }
    return this.do.end()
},continuousSelectionAtPosInRanges:function (p, sel)
{
    var ep, nlr, plr, r, sil, sp

    r = rangeAtPosInRanges(p,sel)
    if (r && lengthOfRange(r))
    {
        sp = rangeStartPos(r)
        while ((sp[0] === 0) && (sp[1] > 0))
        {
            plr = this.rangeForLineAtIndex(sp[1] - 1)
            sil = rangesAtLineIndexInRanges(sp[1] - 1,sel)
            if (sil.length === 1 && isSameRange(sil[0],plr))
            {
                sp = rangeStartPos(plr)
            }
            else if (sil.length && _.last(sil)[1][1] === plr[1][1])
            {
                sp = rangeStartPos(_.last(sil))
            }
            else
            {
                break
            }
        }
        ep = rangeEndPos(r)
        while ((ep[0] === this.line(ep[1]).length) && (ep[1] < this.numLines() - 1))
        {
            nlr = this.rangeForLineAtIndex(ep[1] + 1)
            sil = rangesAtLineIndexInRanges(ep[1] + 1,sel)
            if (sil.length === 1 && isSameRange(sil[0],nlr))
            {
                ep = rangeEndPos(nlr)
            }
            else if (sil.length && _.first(sil)[1][0] === 0)
            {
                ep = rangeEndPos(_.first(sil))
            }
            else
            {
                break
            }
        }
        return [sp,ep]
    }
}}
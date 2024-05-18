var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, first: function (o) {return o != null ? o.length ? o[0] : undefined : o}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let pull = kxk.pull

export default {deleteSelectionOrCursorLines:function ()
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
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            c = list[_a_]
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
                var _b_ = csel; sp = _b_[0]; ep = _b_[1]

                var list1 = _k_.list(positionsBetweenPosAndPosInPositions(sp,ep,newCursors))
                for (var _c_ = 0; _c_ < list1.length; _c_++)
                {
                    nc = list1[_c_]
                    cursorSet(nc,sp)
                }
                if (sp[1] < ep[1] && sp[0] > 0 && ep[0] < this.do.line(ep[1]).length)
                {
                    joinLines.push(sp[1])
                    var list2 = _k_.list(positionsAfterLineColInPositions(ep[1],ep[0],newCursors))
                    for (var _d_ = 0; _d_ < list2.length; _d_++)
                    {
                        nc = list2[_d_]
                        cursorSet(nc,sp[0] + nc[0] - ep[0],sp[1])
                    }
                }
            }
        }
        var list3 = _k_.list(this.do.selections().reverse())
        for (var _e_ = 0; _e_ < list3.length; _e_++)
        {
            s = list3[_e_]
            if (s[0] >= this.do.numLines())
            {
                continue
            }
            lineSelected = s[1][0] === 0 && s[1][1] === this.do.line(s[0]).length
            if (lineSelected && opt.deleteLines && this.do.numLines() > 1)
            {
                this.do.delete(s[0])
                var list4 = _k_.list(positionsBelowLineIndexInPositions(s[0],newCursors))
                for (var _f_ = 0; _f_ < list4.length; _f_++)
                {
                    nc = list4[_f_]
                    cursorDelta(nc,0,-1)
                }
            }
            else
            {
                if (s[0] >= this.do.numLines())
                {
                    continue
                }
                this.do.change(s[0],kstr.splice(this.do.line(s[0]),s[1][0],s[1][1] - s[1][0]))
                var list5 = _k_.list(positionsAfterLineColInPositions(s[0],s[1][1],newCursors))
                for (var _10_ = 0; _10_ < list5.length; _10_++)
                {
                    nc = list5[_10_]
                    cursorDelta(nc,-(s[1][1] - s[1][0]))
                }
            }
            if (_k_.in(s[0],joinLines))
            {
                this.do.change(s[0],this.do.line(s[0]) + this.do.line(s[0] + 1))
                this.do.delete(s[0] + 1)
                var list6 = _k_.list(positionsBelowLineIndexInPositions(s[0],newCursors))
                for (var _11_ = 0; _11_ < list6.length; _11_++)
                {
                    nc = list6[_11_]
                    cursorDelta(nc,0,-1)
                }
                pull(joinLines,s[0])
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
            else if (sil.length && _k_.last(sil)[1][1] === plr[1][1])
            {
                sp = rangeStartPos(_k_.last(sil))
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
            else if (sil.length && _k_.first(sil)[1][0] === 0)
            {
                ep = rangeEndPos(_k_.first(sil))
            }
            else
            {
                break
            }
        }
        return [sp,ep]
    }
}}
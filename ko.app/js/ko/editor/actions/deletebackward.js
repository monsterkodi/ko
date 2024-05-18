var _k_ = {min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let reversed = kxk.reversed

export default {actions:{menu:'Delete',deleteBackward:{name:'Delete Backward',combo:'backspace'},deleteBackwardWord:{name:'Delete Backward Word',combo:'command+backspace'},deleteBackwardSwallowWhitespace:{name:'Delete Backward Over Whitespace',combo:'alt+backspace'},deleteBackwardIgnoreLineBoundary:{name:'Delete Backward Over Line Boundaries',combo:'command+alt+backspace'}},deleteBackwardIgnoreLineBoundary:function ()
{
    return this.deleteBackward({ignoreLineBoundary:true})
},deleteBackwardSwallowWhitespace:function ()
{
    return this.deleteBackward({ignoreTabBoundary:true})
},deleteBackwardWord:function ()
{
    return this.deleteBackward({swallowWord:true})
},deleteBackward:function (opt)
{
    this.do.start()
    if (this.do.numSelections())
    {
        this.deleteSelection()
    }
    else if (this.salterMode)
    {
        this.deleteSalterCharacter()
    }
    else if (!this.deleteEmptySurrounds())
    {
        this.deleteCharacterBackward(opt)
    }
    return this.do.end()
},deleteCharacterBackward:function (opt)
{
    var c, ll, n, nc, newCursors, removeNum, t

    newCursors = this.do.cursors()
    if ((opt != null ? opt.singleCharacter : undefined))
    {
        removeNum = 1
    }
    else if ((opt != null ? opt.ignoreLineBoundary : undefined))
    {
        removeNum = -1
    }
    else if ((opt != null ? opt.ignoreTabBoundary : undefined))
    {
        removeNum = Math.max(1,_k_.min(newCursors.map((function (c)
        {
            var n, t

            t = this.do.textInRange([c[1],[0,c[0]]])
            n = t.length - t.trimRight().length
            if (this.isCursorVirtual(c))
            {
                n += c[0] - this.do.line(c[1]).length
            }
            return Math.max(1,n)
        }).bind(this))))
    }
    else if ((opt != null ? opt.swallowWord : undefined))
    {
        removeNum = Math.max(1,_k_.min(newCursors.map((function (c)
        {
            var n, t

            t = this.do.textInRange([c[1],[0,c[0]]])
            if (t.endsWith(' '))
            {
                n = t.length - t.trimRight().length
            }
            else
            {
                n = 1
                if (!(_k_.in(t.slice(-1)[0],'.,:;|/+\'"[]{}()')))
                {
                    while (n < t.length && !(_k_.in(t[t.length - n - 1],' .,:;|/+\'"[]{}()')))
                    {
                        n++
                    }
                }
            }
            if (this.isCursorVirtual(c))
            {
                n += c[0] - this.do.line(c[1]).length
            }
            return Math.max(1,n)
        }).bind(this))))
    }
    else
    {
        removeNum = Math.max(1,_k_.min(newCursors.map((function (c)
        {
            var n, t

            n = (c[0] % this.indentString.length) || this.indentString.length
            t = this.do.textInRange([c[1],[Math.max(0,c[0] - n),c[0]]])
            n -= t.trimRight().length
            return Math.max(1,n)
        }).bind(this))))
    }
    var list = _k_.list(reversed(newCursors))
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        c = list[_a_]
        if (c[0] === 0)
        {
            if ((opt != null ? opt.ignoreLineBoundary : undefined) || this.do.numCursors() === 1)
            {
                if (c[1] > 0)
                {
                    ll = this.do.line(c[1] - 1).length
                    this.do.change(c[1] - 1,this.do.line(c[1] - 1) + this.do.line(c[1]))
                    this.do.delete(c[1])
                    var list1 = _k_.list(positionsAtLineIndexInPositions(c[1],newCursors))
                    for (var _b_ = 0; _b_ < list1.length; _b_++)
                    {
                        nc = list1[_b_]
                        cursorDelta(nc,ll,-1)
                    }
                    var list2 = _k_.list(positionsBelowLineIndexInPositions(c[1],newCursors))
                    for (var _c_ = 0; _c_ < list2.length; _c_++)
                    {
                        nc = list2[_c_]
                        cursorDelta(nc,0,-1)
                    }
                }
            }
        }
        else
        {
            if (removeNum < 1)
            {
                t = this.do.textInRange([c[1],[0,c[0]]])
                n = t.length - t.trimRight().length
                if (this.isCursorVirtual(c))
                {
                    n += c[0] - this.do.line(c[1]).length
                }
                n = Math.max(1,n)
            }
            else
            {
                n = removeNum
            }
            this.do.change(c[1],kstr.splice(this.do.line(c[1]),c[0] - n,n))
            var list3 = _k_.list(positionsAtLineIndexInPositions(c[1],newCursors))
            for (var _d_ = 0; _d_ < list3.length; _d_++)
            {
                nc = list3[_d_]
                if (nc[0] >= c[0])
                {
                    cursorDelta(nc,-n)
                }
            }
        }
    }
    return this.do.setCursors(newCursors)
}}
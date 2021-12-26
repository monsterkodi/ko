// monsterkodi/kode 0.230.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var reversed, _

_ = require('kxk')._
reversed = require('kxk').reversed

module.exports = {actions:{menu:'Delete',deleteBackward:{name:'Delete Backward',text:'delete character to the left',combo:'backspace'},deleteBackwardIgnoreLineBoundary:{name:'Delete Backward Over Line Boundaries',combo:'command+backspace',accel:'ctrl+backspace'},deleteBackwardSwallowWhitespace:{name:'Delete Backward Over Whitespace',combo:'alt+backspace'}},deleteBackwardIgnoreLineBoundary:function ()
{
    return this.deleteBackward({ignoreLineBoundary:true})
},deleteBackwardSwallowWhitespace:function ()
{
    return this.deleteBackward({ignoreTabBoundary:true})
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
        removeNum = Math.max(1,_.min(newCursors.map((function (c)
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
    else
    {
        removeNum = Math.max(1,_.min(newCursors.map((function (c)
        {
            var n, t

            n = (c[0] % this.indentString.length) || this.indentString.length
            t = this.do.textInRange([c[1],[Math.max(0,c[0] - n),c[0]]])
            n -= t.trimRight().length
            return Math.max(1,n)
        }).bind(this))))
    }
    var list = _k_.list(reversed(newCursors))
    for (var _63_14_ = 0; _63_14_ < list.length; _63_14_++)
    {
        c = list[_63_14_]
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
                    for (var _71_31_ = 0; _71_31_ < list1.length; _71_31_++)
                    {
                        nc = list1[_71_31_]
                        cursorDelta(nc,ll,-1)
                    }
                    var list2 = _k_.list(positionsBelowLineIndexInPositions(c[1],newCursors))
                    for (var _74_31_ = 0; _74_31_ < list2.length; _74_31_++)
                    {
                        nc = list2[_74_31_]
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
            this.do.change(c[1],this.do.line(c[1]).splice(c[0] - n,n))
            var list3 = _k_.list(positionsAtLineIndexInPositions(c[1],newCursors))
            for (var _85_23_ = 0; _85_23_ < list3.length; _85_23_++)
            {
                nc = list3[_85_23_]
                if (nc[0] >= c[0])
                {
                    cursorDelta(nc,-n)
                }
            }
        }
    }
    return this.do.setCursors(newCursors)
}}
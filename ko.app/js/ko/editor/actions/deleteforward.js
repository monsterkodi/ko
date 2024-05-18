var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

import kxk from "../../../kxk.js"
let kstr = kxk.kstr
let reversed = kxk.reversed

export default {actions:{menu:'Delete',deleteForward:{name:'Delete Forward',combo:'delete',text:'delete character to the right'},deleteToEndOfLine:{name:'Delete to End of Line',combo:'ctrl+shift+k',text:'delete characters to the end of line'},deleteToEndOfLineOrWholeLine:{name:'Delete to End of Line or Delete Whole Line',combo:'ctrl+k',text:`delete characters to the end of line, if cursor is not at end of line.
                delete whole line otherwise.`}},deleteToEndOfLine:function ()
{
    this.do.start()
    this.moveCursorsToLineBoundary('right',{extend:true})
    this.deleteSelection({deleteLines:false})
    return this.do.end()
},deleteToEndOfLineOrWholeLine:function ()
{
    var c, cursors

    cursors = this.do.isDoing() && this.do.cursors() || this.cursors()
    var list = _k_.list(cursors)
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        c = list[_a_]
        if (c[0] !== 0 && !this.isCursorAtEndOfLine(c))
        {
            return this.deleteToEndOfLine()
        }
    }
    this.do.start()
    this.selectMoreLines()
    this.deleteSelection({deleteLines:true})
    return this.do.end()
},deleteForward:function ()
{
    var c, ll, nc, newCursors

    if (this.numSelections())
    {
        return this.deleteSelection()
    }
    else
    {
        this.do.start()
        newCursors = this.do.cursors()
        var list = _k_.list(reversed(newCursors))
        for (var _b_ = 0; _b_ < list.length; _b_++)
        {
            c = list[_b_]
            if (this.isCursorAtEndOfLine(c))
            {
                if (!this.isCursorInLastLine(c))
                {
                    ll = this.line(c[1]).length
                    this.do.change(c[1],this.do.line(c[1]) + this.do.line(c[1] + 1))
                    this.do.delete(c[1] + 1)
                    var list1 = _k_.list(positionsAtLineIndexInPositions(c[1] + 1,newCursors))
                    for (var _c_ = 0; _c_ < list1.length; _c_++)
                    {
                        nc = list1[_c_]
                        cursorDelta(nc,ll,-1)
                    }
                    var list2 = _k_.list(positionsBelowLineIndexInPositions(c[1] + 1,newCursors))
                    for (var _d_ = 0; _d_ < list2.length; _d_++)
                    {
                        nc = list2[_d_]
                        cursorDelta(nc,0,-1)
                    }
                }
            }
            else
            {
                this.do.change(c[1],kstr.splice(this.do.line(c[1]),c[0],1))
                var list3 = _k_.list(positionsAtLineIndexInPositions(c[1],newCursors))
                for (var _e_ = 0; _e_ < list3.length; _e_++)
                {
                    nc = list3[_e_]
                    if (nc[0] > c[0])
                    {
                        cursorDelta(nc,-1)
                    }
                }
            }
        }
        this.do.setCursors(newCursors)
        return this.do.end()
    }
}}
// monsterkodi/kode 0.223.0

var _k_ = {list: function (l) {return (l != null ? typeof l.length === 'number' ? l : [] : [])}}

var reversed

reversed = require('kxk').reversed

module.exports = {actions:{menu:'Delete',deleteForward:{name:'Delete Forward',combo:'delete',text:'delete character to the right'},deleteToEndOfLine:{name:'Delete to End of Line',combo:'ctrl+shift+k',text:'delete characters to the end of line'},deleteToEndOfLineOrWholeLine:{name:'Delete to End of Line or Delete Whole Line',combo:'ctrl+k',text:`delete characters to the end of line, if cursor is not at end of line.
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
    for (var _42_14_ = 0; _42_14_ < list.length; _42_14_++)
    {
        c = list[_42_14_]
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
        for (var _58_18_ = 0; _58_18_ < list.length; _58_18_++)
        {
            c = list[_58_18_]
            if (this.isCursorAtEndOfLine(c))
            {
                if (!this.isCursorInLastLine(c))
                {
                    ll = this.line(c[1]).length
                    this.do.change(c[1],this.do.line(c[1]) + this.do.line(c[1] + 1))
                    this.do.delete(c[1] + 1)
                    var list1 = _k_.list(positionsAtLineIndexInPositions(c[1] + 1,newCursors))
                    for (var _69_31_ = 0; _69_31_ < list1.length; _69_31_++)
                    {
                        nc = list1[_69_31_]
                        cursorDelta(nc,ll,-1)
                    }
                    var list2 = _k_.list(positionsBelowLineIndexInPositions(c[1] + 1,newCursors))
                    for (var _72_31_ = 0; _72_31_ < list2.length; _72_31_++)
                    {
                        nc = list2[_72_31_]
                        cursorDelta(nc,0,-1)
                    }
                }
            }
            else
            {
                this.do.change(c[1],this.do.line(c[1]).splice(c[0],1))
                var list3 = _k_.list(positionsAtLineIndexInPositions(c[1],newCursors))
                for (var _76_27_ = 0; _76_27_ < list3.length; _76_27_++)
                {
                    nc = list3[_76_27_]
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
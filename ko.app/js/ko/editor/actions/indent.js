var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

export default {actions:{menu:'Line',indent:{name:'Indent',combo:'alt+cmdctrl+shift+right'},deIndent:{name:'Outdent',combo:'alt+cmdctrl+shift+left'}},indent:function ()
{
    var i, nc, newCursors, newSelections, ns

    this.do.start()
    newSelections = this.do.selections()
    newCursors = this.do.cursors()
    var list = _k_.list(this.selectedAndCursorLineIndices())
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        i = list[_a_]
        this.do.change(i,this.indentString + this.do.line(i))
        var list1 = _k_.list(positionsAtLineIndexInPositions(i,newCursors))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            nc = list1[_b_]
            cursorDelta(nc,this.indentString.length)
        }
        var list2 = _k_.list(rangesAtLineIndexInRanges(i,newSelections))
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            ns = list2[_c_]
            ns[1][0] += this.indentString.length
            ns[1][1] += this.indentString.length
        }
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
},deIndent:function ()
{
    var i, lineCursors, nc, newCursors, newSelections, ns

    this.do.start()
    newSelections = this.do.selections()
    newCursors = this.do.cursors()
    var list = _k_.list(this.selectedAndCursorLineIndices())
    for (var _d_ = 0; _d_ < list.length; _d_++)
    {
        i = list[_d_]
        if (this.do.line(i).startsWith(this.indentString))
        {
            this.do.change(i,this.do.line(i).substr(this.indentString.length))
            lineCursors = positionsAtLineIndexInPositions(i,newCursors)
            var list1 = _k_.list(lineCursors)
            for (var _e_ = 0; _e_ < list1.length; _e_++)
            {
                nc = list1[_e_]
                cursorDelta(nc,-this.indentString.length)
            }
            var list2 = _k_.list(rangesAtLineIndexInRanges(i,newSelections))
            for (var _f_ = 0; _f_ < list2.length; _f_++)
            {
                ns = list2[_f_]
                ns[1][0] -= this.indentString.length
                ns[1][1] -= this.indentString.length
            }
        }
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
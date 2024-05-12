var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

export default {actions:{menu:'Line',indent:{name:'Indent',combo:'alt+cmdctrl+shift+right'},deIndent:{name:'Outdent',combo:'alt+cmdctrl+shift+left'}},indent:function ()
{
    var i, nc, newCursors, newSelections, ns

    this.do.start()
    newSelections = this.do.selections()
    newCursors = this.do.cursors()
    var list = _k_.list(this.selectedAndCursorLineIndices())
    for (var _25_14_ = 0; _25_14_ < list.length; _25_14_++)
    {
        i = list[_25_14_]
        this.do.change(i,this.indentString + this.do.line(i))
        var list1 = _k_.list(positionsAtLineIndexInPositions(i,newCursors))
        for (var _27_19_ = 0; _27_19_ < list1.length; _27_19_++)
        {
            nc = list1[_27_19_]
            cursorDelta(nc,this.indentString.length)
        }
        var list2 = _k_.list(rangesAtLineIndexInRanges(i,newSelections))
        for (var _29_19_ = 0; _29_19_ < list2.length; _29_19_++)
        {
            ns = list2[_29_19_]
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
    for (var _40_14_ = 0; _40_14_ < list.length; _40_14_++)
    {
        i = list[_40_14_]
        if (this.do.line(i).startsWith(this.indentString))
        {
            this.do.change(i,this.do.line(i).substr(this.indentString.length))
            lineCursors = positionsAtLineIndexInPositions(i,newCursors)
            var list1 = _k_.list(lineCursors)
            for (var _44_23_ = 0; _44_23_ < list1.length; _44_23_++)
            {
                nc = list1[_44_23_]
                cursorDelta(nc,-this.indentString.length)
            }
            var list2 = _k_.list(rangesAtLineIndexInRanges(i,newSelections))
            for (var _46_23_ = 0; _46_23_ < list2.length; _46_23_++)
            {
                ns = list2[_46_23_]
                ns[1][0] -= this.indentString.length
                ns[1][1] -= this.indentString.length
            }
        }
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
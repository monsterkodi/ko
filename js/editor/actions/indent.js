// monsterkodi/kode 0.230.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

module.exports = {actions:{menu:'Line',indent:{name:'Indent',combo:'command+]',accel:'ctrl+]'},deIndent:{name:'Outdent',combo:'command+[',accel:'ctrl+['}},indent:function ()
{
    var i, nc, newCursors, newSelections, ns

    this.do.start()
    newSelections = this.do.selections()
    newCursors = this.do.cursors()
    var list = _k_.list(this.selectedAndCursorLineIndices())
    for (var _27_14_ = 0; _27_14_ < list.length; _27_14_++)
    {
        i = list[_27_14_]
        this.do.change(i,this.indentString + this.do.line(i))
        var list1 = _k_.list(positionsAtLineIndexInPositions(i,newCursors))
        for (var _29_19_ = 0; _29_19_ < list1.length; _29_19_++)
        {
            nc = list1[_29_19_]
            cursorDelta(nc,this.indentString.length)
        }
        var list2 = _k_.list(rangesAtLineIndexInRanges(i,newSelections))
        for (var _31_19_ = 0; _31_19_ < list2.length; _31_19_++)
        {
            ns = list2[_31_19_]
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
    for (var _42_14_ = 0; _42_14_ < list.length; _42_14_++)
    {
        i = list[_42_14_]
        if (this.do.line(i).startsWith(this.indentString))
        {
            this.do.change(i,this.do.line(i).substr(this.indentString.length))
            lineCursors = positionsAtLineIndexInPositions(i,newCursors)
            var list1 = _k_.list(lineCursors)
            for (var _46_23_ = 0; _46_23_ < list1.length; _46_23_++)
            {
                nc = list1[_46_23_]
                cursorDelta(nc,-this.indentString.length)
            }
            var list2 = _k_.list(rangesAtLineIndexInRanges(i,newSelections))
            for (var _48_23_ = 0; _48_23_ < list2.length; _48_23_++)
            {
                ns = list2[_48_23_]
                ns[1][0] -= this.indentString.length
                ns[1][1] -= this.indentString.length
            }
        }
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
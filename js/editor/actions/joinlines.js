// monsterkodi/kode 0.229.0

var _k_ = {in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

module.exports = {actions:{menu:'Line',joinLines:{name:'Join Lines',combo:'command+j',accel:'ctrl+j'}},insertThen:function (before, after)
{
    var bw

    if (/(when|if)/.test(before))
    {
        bw = lastWordInLine(before)
        if (!(_k_.in(bw,['and','or'])) && (!after.trim().startsWith('then')) && !/then/.test(before))
        {
            after = 'then ' + after
        }
    }
    return after
},joinLines:function ()
{
    var after, before, c, nc, newCursors

    this.do.start()
    newCursors = []
    var list = _k_.list(this.do.cursors().reverse())
    for (var _30_14_ = 0; _30_14_ < list.length; _30_14_++)
    {
        c = list[_30_14_]
        if (!this.isCursorInLastLine(c))
        {
            before = this.do.line(c[1]).trimRight() + " "
            after = this.do.line(c[1] + 1).trimLeft()
            if (_k_.in(this.fileType,['coffee','kode']))
            {
                after = this.insertThen(before,after)
            }
            this.do.change(c[1],before + after)
            this.do.delete(c[1] + 1)
            newCursors.push([before.length,c[1]])
            var list1 = _k_.list(positionsAtLineIndexInPositions(c[1] + 1,newCursors))
            for (var _44_23_ = 0; _44_23_ < list1.length; _44_23_++)
            {
                nc = list1[_44_23_]
                cursorDelta(nc,before.length,-1)
            }
            var list2 = _k_.list(positionsBelowLineIndexInPositions(c[1],newCursors))
            for (var _46_23_ = 0; _46_23_ < list2.length; _46_23_++)
            {
                nc = list2[_46_23_]
                cursorDelta(nc,0,-1)
            }
        }
    }
    this.do.setCursors(newCursors,{main:0})
    return this.do.end()
}}
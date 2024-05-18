var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

export default {actions:{menu:'Line',duplicateLinesUp:{name:'Duplicate Lines Up',combo:'alt+shift+up'},duplicateLinesDown:{name:'Duplicate Lines Down',combo:'alt+shift+down'}},duplicateLinesUp:function ()
{
    return this.duplicateLines('up')
},duplicateLinesDown:function ()
{
    return this.duplicateLines('down')
},duplicateLines:function (dir)
{
    var csr, i, li, ls, nc, newCursors, r

    csr = this.continuousCursorAndSelectedLineIndexRanges()
    if (!csr.length)
    {
        return
    }
    this.do.start()
    if (this.numSelections())
    {
        this.setCursorsAtSelectionBoundary('left')
    }
    newCursors = this.do.cursors()
    var list = _k_.list(csr.reverse())
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        r = list[_a_]
        ls = []
        for (var _b_ = li = r[0], _c_ = r[1]; (_b_ <= _c_ ? li <= r[1] : li >= r[1]); (_b_ <= _c_ ? ++li : --li))
        {
            ls.push(this.do.line(li))
        }
        for (var _d_ = i = 0, _e_ = ls.length; (_d_ <= _e_ ? i < ls.length : i > ls.length); (_d_ <= _e_ ? ++i : --i))
        {
            this.do.insert(r[1] + 1 + i,ls[i])
        }
        var list1 = _k_.list(positionsBelowLineIndexInPositions(r[1] + 1,newCursors))
        for (var _f_ = 0; _f_ < list1.length; _f_++)
        {
            nc = list1[_f_]
            cursorDelta(nc,0,ls.length)
        }
        if (dir === 'down')
        {
            for (var _10_ = i = 0, _11_ = ls.length; (_10_ <= _11_ ? i < ls.length : i > ls.length); (_10_ <= _11_ ? ++i : --i))
            {
                var list2 = _k_.list(positionsAtLineIndexInPositions(r[0] + i,newCursors))
                for (var _12_ = 0; _12_ < list2.length; _12_++)
                {
                    nc = list2[_12_]
                    cursorDelta(nc,0,ls.length)
                }
            }
        }
    }
    this.do.select([])
    this.do.setCursors(newCursors)
    return this.do.end()
}}
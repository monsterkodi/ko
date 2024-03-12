// monsterkodi/kode 0.270.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

module.exports = {actions:{menu:'Line',duplicateLinesUp:{name:'Duplicate Lines Up',combo:'alt+shift+up'},duplicateLinesDown:{name:'Duplicate Lines Down',combo:'alt+shift+down'}},duplicateLinesUp:function ()
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
    for (var _37_14_ = 0; _37_14_ < list.length; _37_14_++)
    {
        r = list[_37_14_]
        ls = []
        for (var _39_23_ = li = r[0], _39_29_ = r[1]; (_39_23_ <= _39_29_ ? li <= r[1] : li >= r[1]); (_39_23_ <= _39_29_ ? ++li : --li))
        {
            ls.push(this.do.line(li))
        }
        for (var _42_22_ = i = 0, _42_26_ = ls.length; (_42_22_ <= _42_26_ ? i < ls.length : i > ls.length); (_42_22_ <= _42_26_ ? ++i : --i))
        {
            this.do.insert(r[1] + 1 + i,ls[i])
        }
        var list1 = _k_.list(positionsBelowLineIndexInPositions(r[1] + 1,newCursors))
        for (var _45_19_ = 0; _45_19_ < list1.length; _45_19_++)
        {
            nc = list1[_45_19_]
            cursorDelta(nc,0,ls.length)
        }
        if (dir === 'down')
        {
            for (var _49_26_ = i = 0, _49_30_ = ls.length; (_49_26_ <= _49_30_ ? i < ls.length : i > ls.length); (_49_26_ <= _49_30_ ? ++i : --i))
            {
                var list2 = _k_.list(positionsAtLineIndexInPositions(r[0] + i,newCursors))
                for (var _50_27_ = 0; _50_27_ < list2.length; _50_27_++)
                {
                    nc = list2[_50_27_]
                    cursorDelta(nc,0,ls.length)
                }
            }
        }
    }
    this.do.select([])
    this.do.setCursors(newCursors)
    return this.do.end()
}}
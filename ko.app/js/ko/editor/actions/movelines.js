var _k_ = {first: function (o) {return o != null ? o.length ? o[0] : undefined : o}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

export default {actions:{menu:'Line',moveLinesUp:{name:'Move Lines Up',combo:'alt+up'},moveLinesDown:{name:'Move Lines Down',combo:'alt+down'}},moveLinesUp:function ()
{
    return this.moveLines('up')
},moveLinesDown:function ()
{
    return this.moveLines('down')
},moveLines:function (dir)
{
    var csr, d, i, li, ls, nc, newCursors, newSelections, ns, r, si

    csr = this.continuousCursorAndSelectedLineIndexRanges()
    if (!csr.length)
    {
        return
    }
    if (dir === 'up' && _k_.first(csr)[0] === 0)
    {
        return
    }
    if (dir === 'down' && _k_.last(csr)[1] === this.numLines() - 1)
    {
        return
    }
    d = dir === 'up' && -1 || 1
    this.do.start()
    newCursors = this.do.cursors()
    newSelections = this.do.selections()
    var list = _k_.list(csr.reverse())
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        r = list[_a_]
        ls = []
        for (var _b_ = li = r[0], _c_ = r[1]; (_b_ <= _c_ ? li <= r[1] : li >= r[1]); (_b_ <= _c_ ? ++li : --li))
        {
            ls.push(this.do.line(li))
        }
        switch (dir)
        {
            case 'up':
                si = r[0] - 1
                ls.push(this.do.line(si))
                break
            case 'down':
                si = r[0]
                ls.unshift(this.do.line(r[1] + 1))
                break
        }

        for (var _d_ = i = 0, _e_ = ls.length; (_d_ <= _e_ ? i < ls.length : i > ls.length); (_d_ <= _e_ ? ++i : --i))
        {
            this.do.change(si + i,ls[i])
        }
    }
    var list1 = _k_.list(newSelections)
    for (var _f_ = 0; _f_ < list1.length; _f_++)
    {
        ns = list1[_f_]
        ns[0] += d
    }
    var list2 = _k_.list(newCursors)
    for (var _10_ = 0; _10_ < list2.length; _10_++)
    {
        nc = list2[_10_]
        cursorDelta(nc,0,d)
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
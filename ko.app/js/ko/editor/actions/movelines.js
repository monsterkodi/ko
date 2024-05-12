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
    for (var _38_14_ = 0; _38_14_ < list.length; _38_14_++)
    {
        r = list[_38_14_]
        ls = []
        for (var _40_23_ = li = r[0], _40_29_ = r[1]; (_40_23_ <= _40_29_ ? li <= r[1] : li >= r[1]); (_40_23_ <= _40_29_ ? ++li : --li))
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

        for (var _47_22_ = i = 0, _47_26_ = ls.length; (_47_22_ <= _47_26_ ? i < ls.length : i > ls.length); (_47_22_ <= _47_26_ ? ++i : --i))
        {
            this.do.change(si + i,ls[i])
        }
    }
    var list1 = _k_.list(newSelections)
    for (var _50_15_ = 0; _50_15_ < list1.length; _50_15_++)
    {
        ns = list1[_50_15_]
        ns[0] += d
    }
    var list2 = _k_.list(newCursors)
    for (var _53_15_ = 0; _53_15_ < list2.length; _53_15_++)
    {
        nc = list2[_53_15_]
        cursorDelta(nc,0,d)
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
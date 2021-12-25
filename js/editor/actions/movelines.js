// monsterkodi/kode 0.227.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var _

_ = require('kxk')._

module.exports = {actions:{menu:'Line',moveLinesUp:{name:'Move Lines Up',combo:'alt+up'},moveLinesDown:{name:'Move Lines Down',combo:'alt+down'}},moveLinesUp:function ()
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
    if (dir === 'up' && _.first(csr)[0] === 0)
    {
        return
    }
    if (dir === 'down' && _.last(csr)[1] === this.numLines() - 1)
    {
        return
    }
    d = dir === 'up' && -1 || 1
    this.do.start()
    newCursors = this.do.cursors()
    newSelections = this.do.selections()
    var list = _k_.list(csr.reverse())
    for (var _40_14_ = 0; _40_14_ < list.length; _40_14_++)
    {
        r = list[_40_14_]
        ls = []
        for (var _42_23_ = li = r[0], _42_29_ = r[1]; (_42_23_ <= _42_29_ ? li <= r[1] : li >= r[1]); (_42_23_ <= _42_29_ ? ++li : --li))
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

        for (var _49_22_ = i = 0, _49_26_ = ls.length; (_49_22_ <= _49_26_ ? i < ls.length : i > ls.length); (_49_22_ <= _49_26_ ? ++i : --i))
        {
            this.do.change(si + i,ls[i])
        }
    }
    var list1 = _k_.list(newSelections)
    for (var _52_15_ = 0; _52_15_ < list1.length; _52_15_++)
    {
        ns = list1[_52_15_]
        ns[0] += d
    }
    var list2 = _k_.list(newCursors)
    for (var _55_15_ = 0; _55_15_ < list2.length; _55_15_++)
    {
        nc = list2[_55_15_]
        cursorDelta(nc,0,d)
    }
    this.do.select(newSelections)
    this.do.setCursors(newCursors)
    return this.do.end()
}}
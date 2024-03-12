// monsterkodi/kode 0.270.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var stopEvent, _

_ = require('kxk')._
stopEvent = require('kxk').stopEvent

module.exports = {actions:{insertOrDeleteTab:{combos:['tab','shift+tab']}},insertOrDeleteTab:function (key, info)
{
    stopEvent((info != null ? info.event : undefined))
    switch (info.combo)
    {
        case 'tab':
            return this.insertTab()

        case 'shift+tab':
            return this.deleteTab()

    }

},insertTab:function ()
{
    var c, il, n, newCursors

    if (this.numSelections())
    {
        return this.indent()
    }
    else
    {
        this.do.start()
        newCursors = this.do.cursors()
        il = this.indentString.length
        var list = _k_.list(newCursors)
        for (var _32_18_ = 0; _32_18_ < list.length; _32_18_++)
        {
            c = list[_32_18_]
            n = 4 - (c[0] % il)
            this.do.change(c[1],this.do.line(c[1]).splice(c[0],0,_.padStart("",n)))
            cursorDelta(c,n)
        }
        this.do.setCursors(newCursors)
        return this.do.end()
    }
},deleteTab:function ()
{
    var c, n, newCursors, t

    if (this.numSelections())
    {
        return this.deIndent()
    }
    else
    {
        this.do.start()
        newCursors = this.do.cursors()
        var list = _k_.list(newCursors)
        for (var _46_18_ = 0; _46_18_ < list.length; _46_18_++)
        {
            c = list[_46_18_]
            if (c[0])
            {
                n = (c[0] % this.indentString.length) || this.indentString.length
                t = this.do.textInRange([c[1],[c[0] - n,c[0]]])
                if (t.trim().length === 0)
                {
                    this.do.change(c[1],this.do.line(c[1]).splice(c[0] - n,n))
                    cursorDelta(c,-n)
                }
            }
        }
        this.do.setCursors(newCursors)
        return this.do.end()
    }
}}
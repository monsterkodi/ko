var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

export default {actions:{menu:'Quotes',singleQuotes:{name:'Single',combo:"alt+command+'"},doubleQuotes:{name:'Double',combo:"alt+command+shift+'"}},singleQuotes:function ()
{
    return this.swapQuotes("'")
},doubleQuotes:function ()
{
    return this.swapQuotes('"')
},swapQuotes:function (quote)
{
    var cc, cline, cursors, nc, tmpCursors

    this.do.start()
    cursors = this.do.cursors()
    this.selectSurround()
    this.deleteSelection()
    tmpCursors = this.do.cursors()
    var list = _k_.list(tmpCursors)
    for (var _34_15_ = 0; _34_15_ < list.length; _34_15_++)
    {
        cc = list[_34_15_]
        cline = this.do.line(cc[1])
        this.do.change(cc[1],cline.splice(cc[0],0,quote))
        var list1 = _k_.list(positionsAtLineIndexInPositions(cc[1],tmpCursors))
        for (var _37_19_ = 0; _37_19_ < list1.length; _37_19_++)
        {
            nc = list1[_37_19_]
            if (nc[0] >= cc[0])
            {
                nc[0] += 1
            }
        }
    }
    this.do.setCursors(cursors)
    return this.do.end()
}}
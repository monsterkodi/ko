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
    for (var _a_ = 0; _a_ < list.length; _a_++)
    {
        cc = list[_a_]
        cline = this.do.line(cc[1])
        this.do.change(cc[1],cline.splice(cc[0],0,quote))
        var list1 = _k_.list(positionsAtLineIndexInPositions(cc[1],tmpCursors))
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            nc = list1[_b_]
            if (nc[0] >= cc[0])
            {
                nc[0] += 1
            }
        }
    }
    this.do.setCursors(cursors)
    return this.do.end()
}}
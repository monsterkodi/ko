var _k_ = {lpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s=c+s} return s}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var gutter

import color from "./color.js"


gutter = (function ()
{
    function gutter (cells, state)
    {
        this.cells = cells
        this.state = state
    
        this.draw()
    }

    gutter.prototype["draw"] = function ()
    {
        var c, clr, i, lineno, row, y

        this.cells.bg_rect(0,0,this.state.s.gutter - 1,-1,color.gutter)
        this.cells.bg_rect(this.state.s.gutter,0,-1,-1,'080808')
        for (var _a_ = row = 0, _b_ = this.cells.t.rows(); (_a_ <= _b_ ? row < this.cells.t.rows() : row > this.cells.t.rows()); (_a_ <= _b_ ? ++row : --row))
        {
            y = this.state.s.view[1] + row
            lineno = _k_.lpad(this.state.s.gutter - 2,y + 1)
            var list = _k_.list(lineno)
            for (i = 0; i < list.length; i++)
            {
                c = list[i]
                if (i + 1 < this.cells.t.cols())
                {
                    clr = y === this.state.s.cursor[1] ? color.cursor : this.state.isSelectedLine(y) ? color.selection : color.linenr
                    this.cells.c[row][i + 1].fg = clr
                    this.cells.c[row][i + 1].char = c
                }
            }
        }
    }

    return gutter
})()

export default gutter;
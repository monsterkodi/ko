var cells, makeCells

import color from "./color.js"


makeCells = function (rows, cols)
{
    var c, cells, l, lines

    lines = []
    for (var _a_ = l = 0, _b_ = rows; (_a_ <= _b_ ? l < rows : l > rows); (_a_ <= _b_ ? ++l : --l))
    {
        cells = []
        for (var _c_ = c = 0, _d_ = cols; (_c_ <= _d_ ? c < cols : c > cols); (_c_ <= _d_ ? ++c : --c))
        {
            cells.push({bg:0,fg:0,char:' '})
        }
        lines.push(cells)
    }
    return lines
}

cells = (function ()
{
    function cells (t)
    {
        this.t = t
    
        this["render"] = this["render"].bind(this)
        this["bg_rect"] = this["bg_rect"].bind(this)
        this["init"] = this["init"].bind(this)
        this.init()
    }

    cells.prototype["init"] = function ()
    {
        return this.c = makeCells(this.t.rows(),this.t.cols())
    }

    cells.prototype["bg_rect"] = function (x1, y1, x2, y2, c)
    {
        var col, row

        if (x1 < 0)
        {
            x1 = this.t.cols() + x1
        }
        if (x2 < 0)
        {
            x2 = this.t.cols() + x2
        }
        if (y1 < 0)
        {
            y1 = this.t.rows() + y1
        }
        if (y2 < 0)
        {
            y2 = this.t.rows() + y2
        }
        for (var _a_ = row = y1, _b_ = y2; (_a_ <= _b_ ? row <= y2 : row >= y2); (_a_ <= _b_ ? ++row : --row))
        {
            if (row < this.t.rows())
            {
                for (var _c_ = col = x1, _d_ = x2; (_c_ <= _d_ ? col <= x2 : col >= x2); (_c_ <= _d_ ? ++col : --col))
                {
                    if (col < this.t.cols())
                    {
                        this.c[row][col].bg = c
                    }
                }
            }
        }
    }

    cells.prototype["render"] = function ()
    {
        var x, y

        this.t.store()
        for (var _a_ = y = 0, _b_ = this.t.rows(); (_a_ <= _b_ ? y < this.t.rows() : y > this.t.rows()); (_a_ <= _b_ ? ++y : --y))
        {
            for (var _c_ = x = 0, _d_ = this.t.cols(); (_c_ <= _d_ ? x < this.t.cols() : x > this.t.cols()); (_c_ <= _d_ ? ++x : --x))
            {
                this.t.setCursor(x,y)
                this.t.write(color.bg_rgb(this.c[y][x].bg))
                this.t.write(color.fg_rgb(this.c[y][x].fg))
                this.t.write(this.c[y][x].char)
            }
        }
        return this.t.restore()
    }

    return cells
})()

export default cells;
var _k_ = {rpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s+=c} return s}}

class draw
{
    static bg_rect (t, x1, y1, x2, y2, c)
    {
        var y

        if (x1 < 0)
        {
            x1 = t.cols() + x1 + 1
        }
        if (x2 < 0)
        {
            x2 = t.cols() + x2 + 1
        }
        if (y1 < 0)
        {
            y1 = t.rows() + y1 + 1
        }
        if (y2 < 0)
        {
            y2 = t.rows() + y2 + 1
        }
        t.store()
        for (var _a_ = y = y1, _b_ = y2; (_a_ <= _b_ ? y <= y2 : y >= y2); (_a_ <= _b_ ? ++y : --y))
        {
            t.setCursor(x1,y)
            t.write(color.bg_rgb(c))
            t.write(_k_.rpad(x2 - x1 + 1,' '))
        }
        return t.restore()
    }
}

export default draw;
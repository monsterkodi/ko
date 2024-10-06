var _k_ = {min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }}

var tube, TUBE_BL, TUBE_BR, TUBE_H, TUBE_TL, TUBE_TR, TUBE_V

TUBE_H = 0
TUBE_TR = 1
TUBE_V = 2
TUBE_BR = 3
TUBE_BL = 4
TUBE_TL = 5

tube = (function ()
{
    function tube ()
    {}

    tube["path"] = function (path, func)
    {
        var e, l, n, p, pi, s, t, x, y

        func(path[0][0],path[0][1],(path[0][0] === path[1][0] ? TUBE_V : TUBE_H))
        for (var _a_ = pi = 1, _b_ = path.length; (_a_ <= _b_ ? pi < path.length : pi > path.length); (_a_ <= _b_ ? ++pi : --pi))
        {
            p = path[pi - 1]
            l = path[pi]
            if (p[0] === l[0])
            {
                var _c_ = [_k_.min(p[1],l[1]),_k_.max(p[1],l[1])]; s = _c_[0]; e = _c_[1]

                if (s < e)
                {
                    t = TUBE_V
                    if (pi < path.length - 1)
                    {
                        n = path[pi + 1]
                        if (p[1] < l[1])
                        {
                            t = (n[0] > l[0] ? TUBE_TL : TUBE_TR)
                        }
                        else
                        {
                            t = (n[0] > l[0] ? TUBE_BL : TUBE_BR)
                        }
                    }
                    func(l[0],l[1],t)
                    for (var _d_ = y = s + 1, _e_ = e; (_d_ <= _e_ ? y < e : y > e); (_d_ <= _e_ ? ++y : --y))
                    {
                        func(p[0],y,TUBE_V)
                    }
                }
            }
            else
            {
                var _f_ = [_k_.min(p[0],l[0]),_k_.max(p[0],l[0])]; s = _f_[0]; e = _f_[1]

                if (s < e)
                {
                    t = TUBE_H
                    if (pi < path.length - 1)
                    {
                        n = path[pi + 1]
                        if (p[0] < l[0])
                        {
                            t = (n[1] > l[1] ? TUBE_BR : TUBE_TR)
                        }
                        else
                        {
                            t = (n[1] > l[1] ? TUBE_BL : TUBE_TL)
                        }
                    }
                    func(l[0],l[1],t)
                    for (var _10_ = x = s + 1, _11_ = e; (_10_ <= _11_ ? x < e : x > e); (_10_ <= _11_ ? ++x : --x))
                    {
                        func(x,p[1],TUBE_H)
                    }
                }
            }
        }
    }

    return tube
})()

export default tube;
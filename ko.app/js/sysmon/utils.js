var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var Utils

import kxk from "../kxk.js"
let deg2rad = kxk.deg2rad


Utils = (function ()
{
    function Utils ()
    {}

    Utils["opt"] = function (e, o)
    {
        var k

        if ((o != null))
        {
            var list = _k_.list(Object.keys(o))
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                k = list[_a_]
                e.setAttribute(k,o[k])
            }
        }
        return e
    }

    Utils["append"] = function (p, t, o)
    {
        var e

        e = document.createElementNS('http://www.w3.org/2000/svg',t)
        p.appendChild(this.opt(e,o))
        return e
    }

    Utils["svg"] = function (width, height, clss)
    {
        var svg

        svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
        svg.setAttribute('viewBox',`-${width / 2} -${width / 2} ${width} ${height}`)
        if (clss)
        {
            svg.setAttribute('class',clss)
        }
        return svg
    }

    Utils["rect"] = function (x, y, w, h, r, clss, svg)
    {
        var g

        svg = (svg != null ? svg : this.svg(w,h))
        g = this.append(svg,'g')
        r = this.append(g,'rect',{x:x,y:y,width:w,height:h,rx:r,class:clss})
        return r
    }

    Utils["circle"] = function (radius, clss, svg)
    {
        var c, g

        g = this.append(svg,'g')
        c = this.append(g,'circle',{cx:0,cy:0,r:radius,class:clss})
        return c
    }

    Utils["pie"] = function (clss, svg)
    {
        var g, pie

        g = this.append(svg,'g')
        return pie = this.append(g,'path',{class:clss})
    }

    return Utils
})()

class digger
{
    static ints (str, ...ints)
    {
        var idx, int, r, val

        r = {}
        var list = _k_.list(ints)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            int = list[_a_]
            idx = str.search(/\d+/)
            str = str.slice(idx)
            val = parseInt(str)
            r[int] = val
            idx = str.search(/[^\d]/)
            str = str.slice(idx)
        }
        return r
    }

    static floats (str, ...floats)
    {
        var float, idx, r, val

        r = {}
        var list = _k_.list(floats)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            float = list[_a_]
            idx = str.search(/\d+\.\d+/)
            str = str.slice(idx)
            val = parseFloat(str)
            r[float] = val
            idx = str.search(/[^\d\.]/)
            str = str.slice(idx)
        }
        return r
    }
}

Utils.digger = digger
export default Utils;
var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var valgrid

import kxk from "../kxk.js"
let elem = kxk.elem


valgrid = (function ()
{
    function valgrid (parent)
    {
        this.div = elem({class:'valgrid'})
        parent.appendChild(this.div)
    }

    valgrid.prototype["init"] = function (array, opt = {min:-1,max:1})
    {
        var b, g, i, r, row, rowDiv, rval, val

        this.div.innerHTML = ''
        if (opt.colors)
        {
            rowDiv = elem({class:'valgrid-row'})
            this.div.appendChild(rowDiv)
            for (var _a_ = i = 0, _b_ = array[0].length; (_a_ <= _b_ ? i < array[0].length : i > array[0].length); (_a_ <= _b_ ? ++i : --i))
            {
                rowDiv.appendChild(elem({class:'valgrid-header',style:`background:${opt.colors[i]};`}))
            }
        }
        var list = _k_.list(array)
        for (var _c_ = 0; _c_ < list.length; _c_++)
        {
            row = list[_c_]
            rowDiv = elem({class:'valgrid-row'})
            this.div.appendChild(rowDiv)
            var list1 = _k_.list(row)
            for (var _d_ = 0; _d_ < list1.length; _d_++)
            {
                val = list1[_d_]
                r = g = b = 0
                rval = (val - opt.min) / (opt.max - opt.min)
                if (rval > 0.5)
                {
                    r = 255 * (rval - 0.5) * 2
                }
                else
                {
                    b = 255 * rval * 2
                }
                rowDiv.appendChild(elem({class:'valgrid-cell',style:`background:rgb(${r},${g},${b});`}))
            }
        }
    }

    return valgrid
})()

export default valgrid;
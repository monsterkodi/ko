var _k_ = {empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var tweaky

import kxk from "../kxk.js"
let elem = kxk.elem


tweaky = (function ()
{
    function tweaky (parent)
    {
        this.div = elem({class:'tweaky'})
        parent.appendChild(this.div)
    }

    tweaky.prototype["init"] = function (obj)
    {
        var k, v

        for (k in obj)
        {
            v = obj[k]
            if (!_k_.empty(v.info))
            {
                this.info(k,v)
            }
            else if (v.max)
            {
                this.slider(k,v)
            }
            else
            {
                this.checkbox(k,v)
            }
        }
    }

    tweaky.prototype["checkbox"] = function (name, opt)
    {
        var input, row

        input = elem('input',{class:'tweaky-checkbox',type:'checkbox',name:name,id:name})
        input.checked = opt.value
        input.addEventListener('input',function (event)
        {
            return opt.cb(event.target.checked)
        })
        row = elem('form',{class:'tweaky-row',children:[elem({class:'tweaky-name',text:name}),input]})
        return this.div.appendChild(row)
    }

    tweaky.prototype["slider"] = function (name, opt)
    {
        var input, onChange, range, row, slider, step

        range = opt.max - opt.min
        step = opt.step
        if (!step && opt.steps)
        {
            step = range / opt.steps
        }
        step = (step != null ? step : 1)
        input = elem('input',{class:'tweaky-value',value:opt.value,type:'number',min:opt.min,max:opt.max,step:step})
        slider = elem('input',{class:'tweaky-slider',value:opt.value,type:'range',min:opt.min,max:opt.max,step:step})
        onChange = function (event)
        {
            var v

            v = parseFloat(event.target.value)
            input.value = v
            slider.value = v
            return opt.cb(v)
        }
        input.addEventListener('input',onChange)
        slider.addEventListener('input',onChange)
        row = elem({class:'tweaky-row',children:[elem({class:'tweaky-name',text:name}),input,slider]})
        return this.div.appendChild(row)
    }

    tweaky.prototype["info"] = function (name, opt)
    {
        var info, row, _72_15_

        info = elem({class:'tweaky-info',text:opt.info()})
        row = elem({class:'tweaky-row',children:[elem({class:'tweaky-name',text:name}),info]})
        this.infos = ((_72_15_=this.infos) != null ? _72_15_ : [])
        this.infos.push({elem:info,info:opt.info})
        return this.div.appendChild(row)
    }

    tweaky.prototype["update"] = function ()
    {
        var ie

        var list = _k_.list(this.infos)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            ie = list[_a_]
            ie.elem.innerHTML = ie.info()
        }
    }

    return tweaky
})()

export default tweaky;
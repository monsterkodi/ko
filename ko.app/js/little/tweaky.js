var _k_ = {noon: function (obj) { var pad = function (s, l) { while (s.length < l) { s += ' ' }; return s }; var esc = function (k, arry) { var es, sp; if (0 <= k.indexOf('\n')) { sp = k.split('\n'); es = sp.map(function (s) { return esc(s,arry) }); es.unshift('...'); es.push('...'); return es.join('\n') } if (k === '' || k === '...' || _k_.in(k[0],[' ','#','|']) || _k_.in(k[k.length - 1],[' ','#','|'])) { k = '|' + k + '|' } else if (arry && /  /.test(k)) { k = '|' + k + '|' }; return k }; var pretty = function (o, ind, seen) { var k, kl, l, v, mk = 4; if (Object.keys(o).length > 1) { for (k in o) { if (Object.prototype.hasOwnProperty(o,k)) { kl = parseInt(Math.ceil((k.length + 2) / 4) * 4); mk = Math.max(mk,kl); if (mk > 32) { mk = 32; break } } } }; l = []; var keyValue = function (k, v) { var i, ks, s, vs; s = ind; k = esc(k,true); if (k.indexOf('  ') > 0 && k[0] !== '|') { k = `|${k}|` } else if (k[0] !== '|' && k[k.length - 1] === '|') { k = '|' + k } else if (k[0] === '|' && k[k.length - 1] !== '|') { k += '|' }; ks = pad(k,Math.max(mk,k.length + 2)); i = pad(ind + '    ',mk); s += ks; vs = toStr(v,i,false,seen); if (vs[0] === '\n') { while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) } }; s += vs; while (s[s.length - 1] === ' ') { s = s.substr(0,s.length - 1) }; return s }; for (k in o) { if (Object.hasOwn(o,k)) { l.push(keyValue(k,o[k])) } }; return l.join('\n') }; var toStr = function (o, ind = '', arry = false, seen = []) { var s, t, v; if (!(o != null)) { if (o === null) { return 'null' }; if (o === undefined) { return 'undefined' }; return '<?>' }; switch (t = typeof(o)) { case 'string': {return esc(o,arry)}; case 'object': { if (_k_.in(o,seen)) { return '<v>' }; seen.push(o); if ((o.constructor != null ? o.constructor.name : undefined) === 'Array') { s = ind !== '' && arry && '.' || ''; if (o.length && ind !== '') { s += '\n' }; s += (function () { var result = []; var list = _k_.list(o); for (var li = 0; li < list.length; li++)  { v = list[li];result.push(ind + toStr(v,ind + '    ',true,seen))  } return result }).bind(this)().join('\n') } else if ((o.constructor != null ? o.constructor.name : undefined) === 'RegExp') { return o.source } else { s = (arry && '.\n') || ((ind !== '') && '\n' || ''); s += pretty(o,ind,seen) }; return s } default: return String(o) }; return '<???>' }; return toStr(obj) }, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

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

        console.log(_k_.noon(obj))
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
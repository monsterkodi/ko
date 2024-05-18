var _k_ = {isFunc: function (o) {return typeof o === 'function'}, isObj: function (o) {return !(o == null || typeof o != 'object' || o.constructor.name !== 'Object')}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}}

var mathRegExp, moduleKeys, req, requireRegExp

import kxk from "../../kxk.js"
let uniq = kxk.uniq
let slash = kxk.slash
let kstr = kxk.kstr

requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/
mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/

moduleKeys = async function (moduleName, file)
{
    var index, keys, kw, required

    console.log('moduleKeys',moduleName,file)
    required = await import(file)
    required = required.default
    keys = []
    if (required)
    {
        if (required.prototype)
        {
            keys = Object.keys(required.prototype)
        }
        else if (_k_.isFunc(required.getOwnPropertyNames))
        {
            keys = required.getOwnPropertyNames()
        }
        else if (_k_.isObj(required))
        {
            keys = Object.keys(required)
        }
    }
    if (moduleName.endsWith('kxk'))
    {
        keys.push('app')
        if (slash.ext(file) === 'kode')
        {
            var list = ['valid','empty','clamp']
            for (var _a_ = 0; _a_ < list.length; _a_++)
            {
                kw = list[_a_]
                index = keys.indexOf(kw)
                if (index >= 0)
                {
                    keys.splice(index,1)
                }
            }
        }
    }
    console.log('moduleKeys',keys)
    return keys
}

req = async function (file, lines, editor)
{
    var ci, diss, exports, firstIndex, indent, k, keys, li, m, mod, moduleName, name, newKeys, operations, regexes, requires, reqValues, text, values, _103_27_, _81_43_, _98_31_

    requires = {}
    exports = {}
    reqValues = {}
    regexes = {'$':/\$[\s\(]/}
    firstIndex = null
    keys = {Math:['E','LN2','LN10','LOG2E','LOG10E','PI','SQRT1_2','SQRT2','abs','acos','acosh','asin','asinh','atan','atanh','atan2','cbrt','ceil','clz32','cos','cosh','exp','expm1','floor','fround','hypot','imul','log1p','log10','log2','max','min','pow','random','round','sign','sin','sinh','sqrt','tan','tanh','trunc']}
    for (var _b_ = li = 0, _c_ = lines.length; (_b_ <= _c_ ? li < lines.length : li > lines.length); (_b_ <= _c_ ? ++li : --li))
    {
        m = lines[li].match(requireRegExp)
        if (!((m != null ? m[1] : undefined) != null))
        {
            m = lines[li].match(mathRegExp)
        }
        if (((m != null ? m[1] : undefined) != null) && ((m != null ? m[2] : undefined) != null))
        {
            if (!requires[m[2]])
            {
                indent = ''
                ci = 0
                while (m[1][ci] === ' ')
                {
                    indent += ' '
                    ci += 1
                }
                requires[m[2]] = {index:li,value:m[1].trim(),module:m[2],indent:indent}
                if (requires[m[2]].value.startsWith('{'))
                {
                    if (!keys[m[2]])
                    {
                        try
                        {
                            moduleName = kstr.strip(m[2],'"\'')
                            newKeys = await moduleKeys(moduleName,file)
                            keys[m[2]] = newKeys
                            var list = _k_.list(newKeys)
                            for (var _d_ = 0; _d_ < list.length; _d_++)
                            {
                                k = list[_d_]
                                regexes[k] = ((_81_43_=regexes[k]) != null ? _81_43_ : new RegExp(`(^|[\\:\\(\\{]|\\s+)${k}(\\s+[^:]|\\s*$|[\\.\\,\\(])`))
                            }
                        }
                        catch (err)
                        {
                            console.error(`ko can't require ${m[2]} for ${file}: ${err} \nmodule.paths:`,module.paths)
                        }
                    }
                }
                firstIndex = (firstIndex != null ? firstIndex : li)
            }
            continue
        }
        if (lines[li].trim().startsWith('module.exports'))
        {
            name = (lines[li].trim().split('=')[1] != null ? lines[li].trim().split('=')[1].trim() : undefined)
            if (name && /\w+/.test(name))
            {
                exports[name.toLowerCase()] = true
            }
        }
        for (mod in keys)
        {
            values = keys[mod]
            var list1 = _k_.list(values)
            for (var _e_ = 0; _e_ < list1.length; _e_++)
            {
                k = list1[_e_]
                reqValues[mod] = ((_98_31_=reqValues[mod]) != null ? _98_31_ : [])
                if (_k_.in(k,reqValues[mod]))
                {
                    continue
                }
                regexes[k] = ((_103_27_=regexes[k]) != null ? _103_27_ : new RegExp(`(^|[\\,\\:\\(\\[\\{]|\\s+)${k}(\\s+[^:]|\\s*$|[\\.\\,\\(])`))
                if (regexes[k].test(lines[li]))
                {
                    diss = editor.syntax.getDiss(li)
                    diss = diss.filter(function (d)
                    {
                        return (d != null ? d.clss : undefined) && !d.clss.startsWith('comment') && !d.clss.startsWith('string')
                    })
                    text = diss.map(function (s)
                    {
                        return s.match
                    }).join(' ')
                    if (regexes[k].test(text))
                    {
                        reqValues[mod].push(k)
                    }
                }
            }
        }
    }
    operations = []
    for (mod in reqValues)
    {
        values = reqValues[mod]
        firstIndex = (firstIndex != null ? firstIndex : 0)
        if (requires[mod])
        {
            firstIndex = requires[mod].index + 1
        }
        else
        {
            continue
        }
        values = uniq(values)
        values = values.filter(function (v)
        {
            return !(_k_.in(v,Object.keys(exports).concat(['state'])))
        })
        if (!_k_.empty(values))
        {
            values.sort()
            if (mod === 'Math')
            {
                text = `${requires[mod].indent}{ ${values.join(', ')} } = ${mod}`
            }
            else
            {
                text = `${requires[mod].indent}{ ${values.join(', ')} } = require ${mod}`
            }
            if (requires[mod])
            {
                operations.push({op:'change',index:requires[mod].index,text:text})
            }
            else
            {
                operations.push({op:'insert',index:firstIndex,text:text})
            }
        }
    }
    return operations
}
req.moduleKeys = moduleKeys
export default req;
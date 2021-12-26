// monsterkodi/kode 0.234.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, valid: undefined}

var kerror, klog, kstr, kxk, mathRegExp, moduleKeys, req, requireLike, requireRegExp, slash, _

kxk = require('kxk')
_ = kxk._
kerror = kxk.kerror
klog = kxk.klog
kstr = kxk.kstr
slash = kxk.slash

requireLike = require('require-like')
requireRegExp = /^(\s*\{.+\})\s*=\s*require\s+([\'\"][\.\/\w]+[\'\"])/
mathRegExp = /^(\s*\{.+\})\s*=\s*(Math)\s*$/

moduleKeys = function (moduleName, file)
{
    var keys, required

    try
    {
        if (moduleName.endsWith('kxk'))
        {
            required = kxk
        }
        else if (moduleName === 'electron')
        {
            required = require('electron')
        }
        else
        {
            console.log('require',moduleName)
            required = require(moduleName)
        }
    }
    catch (err)
    {
        console.error(`can't require ${moduleName}`,err)
        return []
    }
    keys = []
    if (required)
    {
        if (required.prototype)
        {
            keys = Object.keys(required.prototype)
        }
        else if (_.isFunction(required.getOwnPropertyNames))
        {
            keys = required.getOwnPropertyNames()
        }
        else if (_.isObject(required))
        {
            keys = Object.keys(required)
        }
    }
    if (moduleName.endsWith('kxk'))
    {
        keys.push('app')
    }
    return keys
}

req = function (file, lines, editor)
{
    var ci, diss, exports, firstIndex, indent, k, keys, li, m, mod, moduleName, name, newKeys, operations, regexes, requires, reqValues, text, values, _107_31_, _112_27_, _90_43_

    requires = {}
    exports = {}
    reqValues = {}
    regexes = {'$':new RegExp(`/[^*\\)\\'\\"\\\\]?\\$[\\s\\(]/`)}
    firstIndex = null
    keys = {Math:['E','LN2','LN10','LOG2E','LOG10E','PI','SQRT1_2','SQRT2','abs','acos','acosh','asin','asinh','atan','atanh','atan2','cbrt','ceil','clz32','cos','cosh','exp','expm1','floor','fround','hypot','imul','log1p','log10','log2','max','min','pow','random','round','sign','sin','sinh','sqrt','tan','tanh','trunc']}
    for (var _66_15_ = li = 0, _66_19_ = lines.length; (_66_15_ <= _66_19_ ? li < lines.length : li > lines.length); (_66_15_ <= _66_19_ ? ++li : --li))
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
                            newKeys = moduleKeys(moduleName,file)
                            keys[m[2]] = newKeys
                            var list = _k_.list(newKeys)
                            for (var _89_34_ = 0; _89_34_ < list.length; _89_34_++)
                            {
                                k = list[_89_34_]
                                regexes[k] = ((_90_43_=regexes[k]) != null ? _90_43_ : new RegExp(`(^|[\\:\\(\\{]|\\s+)${k}(\\s+[^:]|\\s*$|[\\.\\,\\(])`))
                            }
                        }
                        catch (err)
                        {
                            kerror(`ko can't require ${m[2]} for ${file}: ${err} \nmodule.paths:`,module.paths)
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
            for (var _105_18_ = 0; _105_18_ < list1.length; _105_18_++)
            {
                k = list1[_105_18_]
                reqValues[mod] = ((_107_31_=reqValues[mod]) != null ? _107_31_ : [])
                if (_k_.in(k,reqValues[mod]))
                {
                    continue
                }
                regexes[k] = ((_112_27_=regexes[k]) != null ? _112_27_ : new RegExp(`(^|[\\,\\:\\(\\[\\{]|\\s+)${k}(\\s+[^:]|\\s*$|[\\.\\,\\(])`))
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
        values = _.uniq(values)
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
module.exports = req
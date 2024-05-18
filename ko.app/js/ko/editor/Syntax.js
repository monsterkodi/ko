var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}, rpad: function (l,s='',c=' ') {s=String(s); while(s.length<l){s+=c} return s}, last: function (o) {return o != null ? o.length ? o[o.length-1] : undefined : o}, dir: function () { let url = import.meta.url.substring(7); let si = url.lastIndexOf('/'); return url.substring(0, si); }}

import kolor from "../../kolor/kolor.js"

import kxk from "../../kxk.js"
let slash = kxk.slash
let matchr = kxk.matchr
let elem = kxk.elem
let kstr = kxk.kstr
let ffs = kxk.ffs

class Syntax
{
    constructor (name, getLine)
    {
        this.name = name
        this.getLine = getLine
    
        this.diss = []
        this.colors = {}
    }

    newDiss (li)
    {
        return kolor.dissect([this.getLine(li)],this.name)[0]
    }

    getDiss (li)
    {
        var _31_18_

        return this.diss[li] = ((_31_18_=this.diss[li]) != null ? _31_18_ : this.newDiss(li))
    }

    setDiss (li, dss)
    {
        return this.diss[li] = dss
    }

    setLines (lines)
    {
        return this.diss = kolor.dissect(lines,this.name)
    }

    changed (changeInfo)
    {
        var ch, change, di, li

        var list = _k_.list(changeInfo.changes)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            change = list[_a_]
            var _b_ = [change.doIndex,change.newIndex,change.change]; di = _b_[0]; li = _b_[1]; ch = _b_[2]

            switch (ch)
            {
                case 'changed':
                    this.diss[di] = this.newDiss(di)
                    break
                case 'deleted':
                    this.diss.splice(di,1)
                    break
                case 'inserted':
                    this.diss.splice(di,0,this.newDiss(di))
                    break
            }

        }
    }

    colorForClassnames (clss)
    {
        var color, computedStyle, div, opacity

        if (!(this.colors[clss] != null))
        {
            div = elem({class:clss})
            document.body.appendChild(div)
            computedStyle = window.getComputedStyle(div)
            color = computedStyle.color
            opacity = computedStyle.opacity
            if (opacity !== '1')
            {
                color = 'rgba(' + color.slice(4,color.length - 2) + ', ' + opacity + ')'
            }
            this.colors[clss] = color
            div.remove()
        }
        return this.colors[clss]
    }

    colorForStyle (styl)
    {
        var div

        if (!(this.colors[styl] != null))
        {
            div = elem('div')
            div.style = styl
            document.body.appendChild(div)
            this.colors[styl] = window.getComputedStyle(div).color
            div.remove()
        }
        return this.colors[styl]
    }

    schemeChanged ()
    {
        return this.colors = {}
    }

    static matchrConfigs = {}

    static syntaxNames = []

    static spanForText (text)
    {
        return this.spanForTextAndSyntax(text,'ko')
    }

    static spanForTextAndSyntax (text, n)
    {
        var clrzd, clss, d, di, diss, l, last, sp, spc, style, _119_30_, _124_30_

        l = ""
        diss = this.dissForTextAndSyntax(text,n)
        if ((diss != null ? diss.length : undefined))
        {
            last = 0
            for (var _a_ = di = 0, _b_ = diss.length; (_a_ <= _b_ ? di < diss.length : di > diss.length); (_a_ <= _b_ ? ++di : --di))
            {
                d = diss[di]
                style = (d.styl != null) && d.styl.length && ` style=\"${d.styl}\"` || ''
                spc = ''
                for (var _c_ = sp = last, _d_ = d.start; (_c_ <= _d_ ? sp < d.start : sp > d.start); (_c_ <= _d_ ? ++sp : --sp))
                {
                    spc += '&nbsp;'
                }
                last = d.start + d.match.length
                clss = (d.clss != null) && d.clss.length && ` class=\"${d.clss}\"` || ''
                clrzd = `<span${style}${clss}>${spc}${d.match}</span>`
                l += clrzd
            }
        }
        return l
    }

    static rangesForTextAndSyntax (line, n)
    {
        return matchr.ranges(Syntax.matchrConfigs[n],line)
    }

    static dissForTextAndSyntax (text, n)
    {
        var result

        if (!(_k_.in(n,['browser','ko','commandline','macro','term','git'])))
        {
            result = kolor.ranges(text,n)
        }
        else
        {
            if (!(n != null) || !(Syntax.matchrConfigs[n] != null))
            {
                return console.error(`no syntax? ${n}`)
            }
            result = matchr.dissect(matchr.ranges(Syntax.matchrConfigs[n],text))
        }
        return result
    }

    static lineForDiss (dss)
    {
        var d, l

        l = ""
        var list = _k_.list(dss)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            d = list[_a_]
            l = _k_.rpad(d.start,l)
            l += d.match
        }
        return l
    }

    static shebang (line)
    {
        var lastWord

        if (line.startsWith("#!"))
        {
            lastWord = _k_.last(line.split(/[\s\/]/))
            switch (lastWord)
            {
                case 'python':
                    return 'py'

                case 'node':
                    return 'js'

                case 'bash':
                    return 'sh'

                default:
                    if (_k_.in(lastWord,this.syntaxNames))
                {
                    return lastWord
                }
            }

        }
        return 'txt'
    }

    static async init ()
    {
        var config, extnames, patterns, syntaxDir, syntaxFile, syntaxFiles, syntaxName, _189_26_, _189_36_

        syntaxDir = slash.path(_k_.dir(),'../syntax/')
        syntaxFiles = await ffs.list(syntaxDir)
        var list = _k_.list(syntaxFiles)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            syntaxFile = list[_a_]
            syntaxName = slash.name(syntaxFile.path)
            patterns = JSON.parse(await ffs.read(syntaxFile.path))
            patterns['\\w+'] = 'text'
            patterns['[^\\w\\s]+'] = 'syntax'
            if (((patterns.ko != null ? patterns.ko.extnames : undefined) != null))
            {
                extnames = patterns.ko.extnames
                delete patterns.ko
                config = matchr.config(patterns)
                var list1 = _k_.list(extnames)
                for (var _b_ = 0; _b_ < list1.length; _b_++)
                {
                    syntaxName = list1[_b_]
                    this.syntaxNames.push(syntaxName)
                    this.matchrConfigs[syntaxName] = config
                }
            }
            else
            {
                this.syntaxNames.push(syntaxName)
                this.matchrConfigs[syntaxName] = matchr.config(patterns)
            }
        }
        this.syntaxNames = this.syntaxNames.concat(kolor.exts)
        return this.syntaxNames
    }
}

export default Syntax;
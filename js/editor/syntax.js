// monsterkodi/kode 0.229.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, in: function (a,l) {return (typeof l === 'string' && typeof a === 'string' && a.length ? '' : []).indexOf.call(l,a) >= 0}}

var elem, fs, kerror, klor, kstr, kxk, matchr, slash, _

kxk = require('kxk')
_ = kxk._
elem = kxk.elem
fs = kxk.fs
kerror = kxk.kerror
kstr = kxk.kstr
last = kxk.last
matchr = kxk.matchr
noon = kxk.noon
slash = kxk.slash

klor = require('klor')
class Syntax
{
    constructor (name, getLine, getLines)
    {
        this.name = name
        this.getLine = getLine
        this.getLines = getLines
    
        this.diss = []
        this.colors = {}
    }

    newDiss (li)
    {
        return klor.dissect([this.getLine(li)],this.name)[0]
    }

    getDiss (li)
    {
        var _33_18_

        return this.diss[li] = ((_33_18_=this.diss[li]) != null ? _33_18_ : this.newDiss(li))
    }

    setDiss (li, dss)
    {
        return this.diss[li] = dss
    }

    setLines (lines)
    {
        return this.diss = klor.dissect(lines,this.name)
    }

    changed (changeInfo)
    {
        var ch, change, di, li

        var list = _k_.list(changeInfo.changes)
        for (var _57_19_ = 0; _57_19_ < list.length; _57_19_++)
        {
            change = list[_57_19_]
            var _59_23_ = [change.doIndex,change.newIndex,change.change]; di = _59_23_[0]; li = _59_23_[1]; ch = _59_23_[2]

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
        var clrzd, clss, d, di, diss, l, last, sp, spc, style, _121_30_, _126_30_

        l = ""
        diss = this.dissForTextAndSyntax(text,n)
        if ((diss != null ? diss.length : undefined))
        {
            last = 0
            for (var _119_23_ = di = 0, _119_27_ = diss.length; (_119_23_ <= _119_27_ ? di < diss.length : di > diss.length); (_119_23_ <= _119_27_ ? ++di : --di))
            {
                d = diss[di]
                style = (d.styl != null) && d.styl.length && ` style=\"${d.styl}\"` || ''
                spc = ''
                for (var _123_27_ = sp = last, _123_34_ = d.start; (_123_27_ <= _123_34_ ? sp < d.start : sp > d.start); (_123_27_ <= _123_34_ ? ++sp : --sp))
                {
                    spc += '&nbsp;'
                }
                last = d.start + d.match.length
                clss = (d.clss != null) && d.clss.length && ` class=\"${d.clss}\"` || ''
                clrzd = `<span${style}${clss}>${spc}${kstr.encode(d.match)}</span>`
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

        if (!(_k_.in(n,['browser','ko','commandline','macro','term','test'])))
        {
            result = klor.ranges(text,n)
        }
        else
        {
            if (!(n != null) || !(Syntax.matchrConfigs[n] != null))
            {
                return kerror(`no syntax? ${n}`)
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
        for (var _148_14_ = 0; _148_14_ < list.length; _148_14_++)
        {
            d = list[_148_14_]
            l = _.padEnd(l,d.start)
            l += d.match
        }
        return l
    }

    static shebang (line)
    {
        var lastWord

        if (line.startsWith("#!"))
        {
            lastWord = _.last(line.split(/[\s\/]/))
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

    static init ()
    {
        var config, extnames, patterns, syntaxDir, syntaxFile, syntaxName, _188_26_, _188_36_

        syntaxDir = `${__dirname}/../../syntax/`
        var list = _k_.list(fs.readdirSync(syntaxDir))
        for (var _180_23_ = 0; _180_23_ < list.length; _180_23_++)
        {
            syntaxFile = list[_180_23_]
            syntaxName = slash.basename(syntaxFile,'.noon')
            patterns = noon.load(slash.join(syntaxDir,syntaxFile))
            patterns['\\w+'] = 'text'
            patterns['[^\\w\\s]+'] = 'syntax'
            if (((patterns.ko != null ? patterns.ko.extnames : undefined) != null))
            {
                extnames = patterns.ko.extnames
                delete patterns.ko
                config = matchr.config(patterns)
                var list1 = _k_.list(extnames)
                for (var _193_31_ = 0; _193_31_ < list1.length; _193_31_++)
                {
                    syntaxName = list1[_193_31_]
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
        return this.syntaxNames = this.syntaxNames.concat(klor.exts)
    }
}

Syntax.init()
module.exports = Syntax
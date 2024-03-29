// monsterkodi/kode 0.270.0

var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

var elem, kstr, sw

kstr = require('kxk').kstr
elem = require('kxk').elem
sw = require('kxk').sw

class Render
{
    static line (diss, size = {charWidth:0})
    {
        var clrzd, clss, d, di, l, tx, _1_7_, _25_29_

        l = ""
        if ((diss != null ? diss.length : undefined))
        {
            for (var _22_23_ = di = diss.length - 1, _22_38_ = 0; (_22_23_ <= _22_38_ ? di <= 0 : di >= 0); (_22_23_ <= _22_38_ ? ++di : --di))
            {
                d = diss[di]
                tx = d.start * size.charWidth
                clss = (d.clss != null) && ` class=\"${d.clss}\"` || ''
                clrzd = `<span style=\"transform:translatex(${tx}px);${((_1_7_=d.styl) != null ? _1_7_ : '')}\"${clss}>${kstr.encode(d.match)}</span>`
                l = clrzd + l
            }
        }
        return l
    }

    static lineSpan (diss, size)
    {
        var d, div, span, ss, st, _36_45_, _38_21_

        div = elem({class:'linespans'})
        var list = (diss != null ? diss : [])
        for (var _33_14_ = 0; _33_14_ < list.length; _33_14_++)
        {
            d = list[_33_14_]
            span = elem('span')
            span.style.transform = `translatex(${d.start * size.charWidth}px)`
            if ((d.clss != null))
            {
                span.className = d.clss
            }
            span.textContent = d.match.replace(/\x1b/g,'▪')
            if ((d.styl != null))
            {
                var list1 = _k_.list(d.styl.split(';'))
                for (var _39_23_ = 0; _39_23_ < list1.length; _39_23_++)
                {
                    st = list1[_39_23_]
                    ss = st.split(':')
                    span.style[ss[0]] = ss[1]
                }
            }
            div.appendChild(span)
        }
        return div
    }

    static cursors (cs, size)
    {
        var c, cls, cw, h, i, lh, tx, ty, zi

        i = 0
        h = ""
        cw = size.charWidth
        lh = size.lineHeight
        var list = _k_.list(cs)
        for (var _57_14_ = 0; _57_14_ < list.length; _57_14_++)
        {
            c = list[_57_14_]
            tx = c[0] * cw + size.offsetX
            ty = c[1] * lh
            cls = ""
            if (c.length > 2)
            {
                cls = c[2]
            }
            zi = cls !== 'virtual' && c[1] + 1000 || 0
            h += `<span class=\"cursor ${cls}\" style=\"z-index:${zi};transform:translate3d(${tx}px,${ty}px,0); height:${lh}px\"></span>`
            i += 1
        }
        return h
    }

    static selection (ss, size, clss = 'selection')
    {
        var b, h, n, p, s, si, _82_58_, _82_65_

        h = ""
        p = null
        n = null
        for (var _78_19_ = si = 0, _78_23_ = ss.length; (_78_19_ <= _78_23_ ? si < ss.length : si > ss.length); (_78_19_ <= _78_23_ ? ++si : --si))
        {
            s = ss[si]
            n = (si < ss.length - 1) && (ss[si + 1][0] === s[0] + 1) && ss[si + 1] || null
            b = (p != null ? p[0] : undefined) === s[0] - 1 && p || null
            h += this.selectionSpan(b,s,n,size,((_82_58_=(s[2] != null ? s[2].clss : undefined)) != null ? _82_58_ : ((_82_65_=s[2]) != null ? _82_65_ : clss)))
            p = s
        }
        return h
    }

    static selectionSpan (prev, sel, next, size, clss)
    {
        var border, empty, lh, tx, ty

        border = ""
        if (!prev)
        {
            border += " tl tr"
        }
        else
        {
            if ((sel[1][0] < prev[1][0]) || (sel[1][0] > prev[1][1]))
            {
                border += " tl"
            }
            if ((sel[1][1] > prev[1][1]) || (sel[1][1] < prev[1][0]))
            {
                border += " tr"
            }
        }
        if (!next)
        {
            border += " bl br"
        }
        else
        {
            if (sel[1][1] > next[1][1] || (sel[1][1] < next[1][0]))
            {
                border += " br"
            }
            if ((sel[1][0] < next[1][0]) || (sel[1][0] > next[1][1]))
            {
                border += " bl"
            }
        }
        if (sel[1][0] === 0 && !size.centerText)
        {
            border += " start"
        }
        sw = size.charWidth * (sel[1][1] - sel[1][0])
        tx = size.charWidth * sel[1][0] + size.offsetX
        ty = size.lineHeight * sel[0]
        lh = size.lineHeight
        if (clss.startsWith('stringmatch'))
        {
            if (clss.endsWith('single'))
            {
                lh /= 2
            }
            if (clss.endsWith('double'))
            {
                lh /= 2
            }
            if (clss.endsWith('bold'))
            {
                ty += lh / 4
                lh /= 2
            }
        }
        empty = sel[1][0] === sel[1][1] && "empty" || ""
        return `<span class=\"${clss}${border} ${empty}\" style=\"transform: translate(${tx}px,${ty}px); width: ${sw}px; height: ${lh}px\"></span>`
    }
}

module.exports = Render
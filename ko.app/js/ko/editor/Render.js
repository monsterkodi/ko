var _k_ = {list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}}

import kxk from "../../kxk.js"
let elem = kxk.elem
let kstr = kxk.kstr

class Render
{
    static line (diss, opt = {charWidth:0,wrapSpan:false,spanClass:null})
    {
        var clrzd, clss, d, di, l, spanClass, transform, tx, _1_7_, _25_45_, _27_35_

        l = ""
        if ((diss != null ? diss.length : undefined))
        {
            for (var _23_22_ = di = diss.length - 1, _23_37_ = 0; (_23_22_ <= _23_37_ ? di <= 0 : di >= 0); (_23_22_ <= _23_37_ ? ++di : --di))
            {
                d = diss[di]
                tx = d.start * ((_25_45_=opt.charWidth) != null ? _25_45_ : 0)
                transform = (tx ? `transform:translatex(${tx}px);` : '')
                spanClass = ((_27_35_=d.clss) != null ? _27_35_ : opt.spanClass)
                clss = spanClass && ` class=\"${spanClass}\"` || ''
                clrzd = `<span style=\"${transform}${((_1_7_=d.styl) != null ? _1_7_ : '')}\"${clss}>${d.match}</span>`
                l = clrzd + l
            }
        }
        if (opt.wrapSpan)
        {
            l = `<span class='${opt.wrapSpan}'>${l}</span>`
        }
        return l
    }

    static lineSpan (diss, size)
    {
        var cf, cx, d, div, ds, span, ss, st, _58_45_, _65_21_

        div = elem({class:'linespans'})
        if (diss.font)
        {
            div.style['font-family'] = diss.font
        }
        if (diss.length > 4000)
        {
            console.log('line too long!')
            span = elem('span')
            span.className = 'line_to_long'
            span.textContent = '*** line too long! ***'
            div.appendChild(span)
            return div
        }
        cx = 0
        ds = 0
        var list = (diss != null ? diss : [])
        for (var _51_14_ = 0; _51_14_ < list.length; _51_14_++)
        {
            d = list[_51_14_]
            cx += (d.start - ds) * size.charWidth
            cf = cx.toFixed(1)
            span = elem('span')
            span.style.transform = `translatex(${cf}px)`
            if ((d.clss != null))
            {
                span.className = d.clss
            }
            span.textContent = d.match.replace(/\x1b/g,'▪')
            ds = d.start + span.textContent.length
            cx += size.widthOfText(span.textContent)
            if ((d.styl != null))
            {
                var list1 = _k_.list(d.styl.split(';'))
                for (var _66_23_ = 0; _66_23_ < list1.length; _66_23_++)
                {
                    st = list1[_66_23_]
                    ss = st.split(':')
                    span.style[ss[0]] = ss[1]
                }
            }
            div.appendChild(span)
        }
        return div
    }

    static cursors (cs, size, top)
    {
        var c, cls, h, i, lh, tx, ty, zi

        i = 0
        h = ""
        lh = size.lineHeight
        var list = _k_.list(cs)
        for (var _84_14_ = 0; _84_14_ < list.length; _84_14_++)
        {
            c = list[_84_14_]
            tx = size.xOffsetAtCharacterInLine(c[0],c[1] + top)
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

    static selection (ss, size, top, clss = 'selection')
    {
        var b, h, n, p, s, si, _109_63_, _109_70_

        h = ""
        p = null
        n = null
        for (var _105_18_ = si = 0, _105_22_ = ss.length; (_105_18_ <= _105_22_ ? si < ss.length : si > ss.length); (_105_18_ <= _105_22_ ? ++si : --si))
        {
            s = ss[si]
            n = (si < ss.length - 1) && (ss[si + 1][0] === s[0] + 1) && ss[si + 1] || null
            b = (p != null ? p[0] : undefined) === s[0] - 1 && p || null
            h += this.selectionSpan(b,s,n,size,top,((_109_63_=(s[2] != null ? s[2].clss : undefined)) != null ? _109_63_ : ((_109_70_=s[2]) != null ? _109_70_ : clss)))
            p = s
        }
        return h
    }

    static selectionSpan (prev, sel, next, size, top, clss)
    {
        var border, empty, lh, sw, tx, ty

        border = ""
        if (!prev)
        {
            border += " tl tr"
        }
        else
        {
            if (sel[1][0] < prev[1][0] || sel[1][0] > prev[1][1])
            {
                border += " tl"
            }
            if (sel[1][1] > prev[1][1] || sel[1][1] < prev[1][0])
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
            if (sel[1][1] > next[1][1] || sel[1][1] < next[1][0])
            {
                border += " br"
            }
            if (sel[1][0] < next[1][0] || sel[1][0] > next[1][1])
            {
                border += " bl"
            }
        }
        if (sel[1][0] === 0 && !size.centerText)
        {
            border += " start"
        }
        sw = size.widthOfRangeInLine(sel[1][0],sel[1][1],sel[0] + top)
        tx = size.xOffsetAtCharacterInLine(sel[1][0],sel[0] + top)
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

export default Render;
// monsterkodi/kode 0.270.0

var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var events

events = require('events')
class MapScroll extends events
{
    constructor (cfg)
    {
        super()
    
        var _16_37_, _17_37_, _18_36_, _19_33_

        this.setLineHeight = this.setLineHeight.bind(this)
        this.setNumLines = this.setNumLines.bind(this)
        this.setViewHeight = this.setViewHeight.bind(this)
        this.deleteLine = this.deleteLine.bind(this)
        this.insertLine = this.insertLine.bind(this)
        this.setTop = this.setTop.bind(this)
        this.by = this.by.bind(this)
        this.to = this.to.bind(this)
        this.reset = this.reset.bind(this)
        this.lineHeight = ((_16_37_=cfg.lineHeight) != null ? _16_37_ : 0)
        this.viewHeight = ((_17_37_=cfg.viewHeight) != null ? _17_37_ : 0)
        this.exposeMax = ((_18_36_=cfg.exposeMax) != null ? _18_36_ : -4)
        this.smooth = ((_19_33_=cfg.smooth) != null ? _19_33_ : true)
        this.init()
    }

    init ()
    {
        this.scroll = 0
        this.offsetTop = 0
        this.offsetSmooth = 0
        this.fullHeight = 0
        this.numLines = 0
        this.top = 0
        this.bot = 0
        this.exposed = 0
        this.exposeTop = 0
        this.exposeBot = -1
        this.calc()
        return this.offsetTop = -1
    }

    calc ()
    {
        this.scrollMax = Math.max(0,this.fullHeight - this.viewHeight)
        this.fullLines = Math.floor(this.viewHeight / this.lineHeight)
        this.viewLines = Math.ceil(this.viewHeight / this.lineHeight)
        this.linesHeight = this.viewLines * this.lineHeight
        if (this.exposeMax < 0)
        {
            this.exposeNum = -this.exposeMax * this.viewLines
        }
        else
        {
            this.exposeNum = this.exposeMax
        }
        return this.exposeHeight = this.exposeNum * this.lineHeight
    }

    info ()
    {
        return {topbot:`${this.top} .. ${this.bot} = ${this.bot - this.top} / ${this.numLines} lines`,expose:`${this.exposeTop} .. ${this.exposeBot} = ${this.exposeBot - this.exposeTop} / ${this.exposeNum} px ${this.exposeHeight}`,scroll:`${this.scroll} offsetTop ${this.offsetTop} scrollMax ${this.scrollMax} fullLines ${this.fullLines} viewLines ${this.viewLines} viewHeight ${this.viewHeight}`}
    }

    reset ()
    {
        this.emit('clearLines')
        return this.init()
    }

    to (p)
    {
        return this.by(p - this.scroll)
    }

    by (delta)
    {
        var offset, scroll, top

        scroll = this.scroll
        if (Number.isNaN(delta))
        {
            delta = 0
        }
        this.scroll = parseInt(_k_.clamp(0,this.scrollMax,this.scroll + delta))
        top = parseInt(this.scroll / this.lineHeight)
        this.offsetSmooth = this.scroll - top * this.lineHeight
        this.setTop(top)
        offset = 0
        if (this.smooth)
        {
            offset += this.offsetSmooth
        }
        offset += (top - this.exposeTop) * this.lineHeight
        if (offset !== this.offsetTop || scroll !== this.scroll)
        {
            this.offsetTop = parseInt(offset)
            return this.emit('scroll',this.scroll,this.offsetTop)
        }
    }

    setTop (top)
    {
        var n, num, oldBot, oldTop

        if (this.exposeBot < 0 && this.numLines < 1)
        {
            return
        }
        oldTop = this.top
        oldBot = this.bot
        this.top = top
        this.bot = Math.min(this.top + this.viewLines,this.numLines - 1)
        if (oldTop === this.top && oldBot === this.bot && this.exposeBot >= this.bot)
        {
            return
        }
        if ((this.top >= this.exposeBot) || (this.bot <= this.exposeTop))
        {
            this.emit('clearLines')
            this.exposeTop = this.top
            this.exposeBot = this.bot
            num = this.bot - this.top + 1
            if (num > 0)
            {
                this.emit('exposeLines',{top:this.top,bot:this.bot,num:num})
                this.emit('scroll',this.scroll,this.offsetTop)
            }
            return
        }
        if (this.top < this.exposeTop)
        {
            oldTop = this.exposeTop
            this.exposeTop = Math.max(0,this.top - (Math.min(this.viewLines,this.exposeNum - this.viewLines)))
            num = oldTop - this.exposeTop
            if (num > 0)
            {
                this.emit('exposeLines',{top:this.exposeTop,bot:oldTop - 1,num:num})
            }
        }
        while (this.bot > this.exposeBot)
        {
            this.exposeBot += 1
            this.emit('exposeLine',this.exposeBot)
        }
        if (this.exposeBot - this.exposeTop + 1 > this.exposeNum)
        {
            num = this.exposeBot - this.exposeTop + 1 - this.exposeNum
            if (this.top > oldTop)
            {
                n = _k_.clamp(0,this.top - this.exposeTop,num)
                this.exposeTop += n
                return this.emit('vanishLines',{top:n})
            }
            else
            {
                n = _k_.clamp(0,this.exposeBot - this.bot,num)
                this.exposeBot -= n
                return this.emit('vanishLines',{bot:n})
            }
        }
    }

    insertLine (li, oi)
    {
        if (this.lineIndexIsInExpose(oi))
        {
            this.exposeBot += 1
        }
        if (this.lineIndexIsInView(oi))
        {
            this.bot += 1
        }
        if (oi < this.top)
        {
            this.top += 1
        }
        this.numLines += 1
        this.fullHeight = this.numLines * this.lineHeight
        return this.calc()
    }

    deleteLine (li, oi)
    {
        if (this.lineIndexIsInExpose(oi) || this.numLines < this.exposeNum)
        {
            this.exposeBot -= 1
        }
        if (this.lineIndexIsInView(oi))
        {
            return this.bot -= 1
        }
    }

    lineIndexIsInView (li)
    {
        if ((this.top <= li && li <= this.bot))
        {
            return true
        }
        return this.bot - this.top + 1 < this.fullLines
    }

    lineIndexIsInExpose (li)
    {
        if ((this.exposeTop <= li && li <= this.exposeBot))
        {
            return true
        }
        return this.exposeBot - this.exposeTop + 1 < this.exposeNum
    }

    setViewHeight (h)
    {
        if (this.viewHeight !== h)
        {
            this.viewHeight = h
            this.calc()
            return this.by(0)
        }
    }

    setNumLines (n)
    {
        if (this.numLines !== n)
        {
            this.numLines = n
            this.fullHeight = this.numLines * this.lineHeight
            if (this.numLines)
            {
                this.calc()
                return this.by(0)
            }
            else
            {
                this.init()
                return this.emit('clearLines')
            }
        }
    }

    setLineHeight (h)
    {
        if (this.lineHeight !== h)
        {
            this.lineHeight = h
            this.fullHeight = this.numLines * this.lineHeight
            this.calc()
            return this.by(0)
        }
    }
}

module.exports = MapScroll
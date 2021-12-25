// monsterkodi/kode 0.229.0

var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var drag, elem, kxk, scheme

kxk = require('kxk')
drag = kxk.drag
elem = kxk.elem
scheme = kxk.scheme

scheme = require('../tools/scheme')
class Scrollbar
{
    constructor (editor)
    {
        this.editor = editor
    
        this.update = this.update.bind(this)
        this.wheelScroll = this.wheelScroll.bind(this)
        this.onWheel = this.onWheel.bind(this)
        this.onDrag = this.onDrag.bind(this)
        this.onStart = this.onStart.bind(this)
        this.editor.scroll.on('scroll',this.update)
        this.editor.on('linesShown',this.update)
        this.editor.on('viewHeight',this.update)
        this.elem = elem({class:'scrollbar left'})
        this.editor.view.appendChild(this.elem)
        this.handle = elem({class:'scrollhandle left'})
        this.elem.appendChild(this.handle)
        this.scrollX = 0
        this.scrollY = 0
        this.scrollDelta = 0
        this.drag = new drag({target:this.elem,onStart:this.onStart,onMove:this.onDrag,cursor:'ns-resize'})
        this.elem.addEventListener('wheel',this.onWheel,{passive:true})
        this.editor.view.addEventListener('wheel',this.onWheel,{passive:true})
    }

    del ()
    {
        this.elem.removeEventListener('wheel',this.onWheel)
        return this.editor.view.removeEventListener('wheel',this.onWheel)
    }

    onStart (drag, event)
    {
        var br, ln, ly, sy

        br = this.elem.getBoundingClientRect()
        sy = _k_.clamp(0,this.editor.scroll.viewHeight,event.clientY - br.top)
        ln = parseInt(this.editor.scroll.numLines * sy / this.editor.scroll.viewHeight)
        ly = (ln - this.editor.scroll.viewLines / 2) * this.editor.scroll.lineHeight
        return this.editor.scroll.to(ly)
    }

    onDrag (drag)
    {
        var scroll

        this.scrollDelta += (drag.delta.y / (this.editor.scroll.viewLines * this.editor.scroll.lineHeight)) * this.editor.scroll.fullHeight
        scroll = (function ()
        {
            this.editor.scroll.by(this.scrollDelta)
            return this.scrollDelta = 0
        }).bind(this)
        clearImmediate(this.scrollTimer)
        return this.scrollTimer = setImmediate(scroll)
    }

    onWheel (event)
    {
        var scrollFactor

        scrollFactor = function ()
        {
            var f

            f = 1
            f *= 1 + 1 * event.shiftKey
            f *= 1 + 3 * event.metaKey
            return f *= 1 + 7 * event.altKey
        }
        if (Math.abs(event.deltaX) >= 2 * Math.abs(event.deltaY) || Math.abs(event.deltaY) === 0)
        {
            this.scrollX += event.deltaX
        }
        else
        {
            this.scrollY += event.deltaY * scrollFactor()
        }
        if (this.scrollX || this.scrollY)
        {
            return window.requestAnimationFrame(this.wheelScroll)
        }
    }

    wheelScroll ()
    {
        this.editor.scroll.by(this.scrollY,this.scrollX)
        return this.scrollX = this.scrollY = 0
    }

    update ()
    {
        var bh, cf, cs, longColor, scrollHeight, scrollTop, shortColor, vh

        if (this.editor.numLines() * this.editor.size.lineHeight < this.editor.viewHeight())
        {
            this.handle.style.top = "0"
            this.handle.style.height = "0"
            return this.handle.style.width = "0"
        }
        else
        {
            bh = this.editor.numLines() * this.editor.size.lineHeight
            vh = Math.min((this.editor.scroll.viewLines * this.editor.scroll.lineHeight),this.editor.viewHeight())
            scrollTop = parseInt((this.editor.scroll.scroll / bh) * vh)
            scrollHeight = parseInt(((this.editor.scroll.viewLines * this.editor.scroll.lineHeight) / bh) * vh)
            scrollHeight = Math.max(scrollHeight,parseInt(this.editor.size.lineHeight / 4))
            scrollTop = Math.min(scrollTop,this.editor.viewHeight() - scrollHeight)
            scrollTop = Math.max(0,scrollTop)
            this.handle.style.top = `${scrollTop}px`
            this.handle.style.height = `${scrollHeight}px`
            this.handle.style.width = "2px"
            cf = 1 - _k_.clamp(0,1,(scrollHeight - 10) / 200)
            longColor = scheme.colorForClass('scrollbar long')
            shortColor = scheme.colorForClass('scrollbar short')
            cs = scheme.fadeColor(longColor,shortColor,cf)
            return this.handle.style.backgroundColor = cs
        }
    }
}

module.exports = Scrollbar
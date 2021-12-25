// monsterkodi/kode 0.228.0

var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var $, elem, kxk, now, post

kxk = require('kxk')
$ = kxk.$
elem = kxk.elem
post = kxk.post

now = require('perf_hooks').performance.now
class FPS
{
    constructor ()
    {
        var x, y

        this.stash = this.stash.bind(this)
        this.restore = this.restore.bind(this)
        this.draw = this.draw.bind(this)
        this.elem = elem({class:'fps'})
        this.elem.style.display = 'none'
        this.canvas = elem('canvas',{class:"fpsCanvas",width:130 * 2,height:30 * 2})
        this.elem.appendChild(this.canvas)
        y = parseInt(-30 / 2)
        x = parseInt(-130 / 2)
        this.canvas.style.transform = `translate3d(${x}px, ${y}px, 0px) scale3d(0.5, 0.5, 1)`
        this.history = []
        this.last = now()
        $('commandline-span').appendChild(this.elem)
        post.on('stash',this.stash)
        post.on('restore',this.restore)
    }

    draw ()
    {
        var ctx, green, h, i, ms, red, time

        time = now()
        this.history.push(time - this.last)
        while (this.history.length > 260)
        {
            this.history.shift()
        }
        this.canvas.height = this.canvas.height
        ctx = this.canvas.getContext('2d')
        for (var _49_18_ = i = 0, _49_22_ = this.history.length; (_49_18_ <= _49_22_ ? i < this.history.length : i > this.history.length); (_49_18_ <= _49_22_ ? ++i : --i))
        {
            ms = Math.max(0,this.history[i] - 17)
            red = parseInt(32 + 223 * _k_.clamp(0,1,(ms - 16) / 16))
            green = parseInt(32 + 223 * _k_.clamp(0,1,(ms - 32) / 32))
            ctx.fillStyle = `rgb(${red}, ${green}, 32)`
            h = Math.min(ms,60)
            ctx.fillRect(260 - this.history.length + i,60 - h,2,h)
        }
        this.last = time
        if (this.elem.style.display !== 'none')
        {
            return window.requestAnimationFrame(this.draw)
        }
    }

    visible ()
    {
        return this.elem.style.display !== 'none'
    }

    restore ()
    {
        if (window.stash.get('fps'))
        {
            return this.toggle()
        }
    }

    stash ()
    {
        if (this.visible())
        {
            return window.stash.set('fps',true)
        }
        else
        {
            return window.stash.set('fps')
        }
    }

    toggle ()
    {
        this.elem.style.display = this.visible() && 'none' || 'unset'
        this.history.push(49)
        if (this.visible())
        {
            window.requestAnimationFrame(this.draw)
        }
        return this.stash()
    }
}

module.exports = FPS
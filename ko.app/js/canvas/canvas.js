var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}}

var Delegate

import kakao from "../kakao.js"

import kxk from "../kxk.js"
let $ = kxk.$
let win = kxk.win
let fps = kxk.fps
let post = kxk.post
let elem = kxk.elem
let stopEvent = kxk.stopEvent

import world from "./world.js"

window.WIN_MIN_WIDTH = 400
window.WIN_MIN_HEIGHT = 400

Delegate = (function ()
{
    _k_.extend(Delegate, win.Delegate)
    function Delegate ()
    {
        this["onWindowFocus"] = this["onWindowFocus"].bind(this)
        this["onWindowBlur"] = this["onWindowBlur"].bind(this)
        this["onMenuAction"] = this["onMenuAction"].bind(this)
        this["onWindowResize"] = this["onWindowResize"].bind(this)
        this["onWindowCreated"] = this["onWindowCreated"].bind(this)
        this["onPause"] = this["onPause"].bind(this)
        this["onWindowAnimationTick"] = this["onWindowAnimationTick"].bind(this)
        this.menuNoon = kakao.bundle.res('menu_canvas.noon')
        post.on('menuAction',this.onMenuAction)
        return Delegate.__super__.constructor.apply(this, arguments)
    }

    Delegate.prototype["onWindowAnimationTick"] = function (win, tickInfo)
    {
        var k, s, title, v

        if (!this.world)
        {
            return
        }
        this.world.tick(tickInfo)
        s = ''
        for (k in this.world.count)
        {
            v = this.world.count[k]
            s += '&nbsp;' + k + '&nbsp;' + v + '&nbsp;'
        }
        title = $('title')
        return title.innerHTML = s
    }

    Delegate.prototype["onWindowWillShow"] = function ()
    {
        var main, title

        window.world = this.world = new world
        main = $('main')
        this.fps = new fps(main,{topDown:true})
        this.quiq = elem({class:'quiq',children:[elem({text:'V',class:'quiq-item quiq-values',click:this.world.toggleValues,dblclick:function (e)
        {
            return stopEvent(e)
        }}),elem({text:' ',class:'quiq-item quiq-resart',click:this.world.start,dblclick:function (e)
        {
            return stopEvent(e)
        }}),elem({text:'⏸',class:'quiq-item quiq-pause',click:this.world.togglePause,dblclick:function (e)
        {
            return stopEvent(e)
        }}),elem({text:'⏯',class:'quiq-item quiq-step',click:this.world.singleStep,dblclick:function (e)
        {
            return stopEvent(e)
        }})]})
        title = $('title')
        title.parentElement.insertBefore(this.quiq,title)
        post.on('pause',this.onPause)
        return document.body.style.display = 'inherit'
    }

    Delegate.prototype["onPause"] = function ()
    {
        var pause

        pause = $('.quiq-pause')
        return pause.innerHTML = (this.world.pause ? '⏵' : '⏸')
    }

    Delegate.prototype["onWindowWithoutStash"] = function ()
    {
        kakao('window.setSize',window.WIN_MIN_WIDTH,window.WIN_MIN_HEIGHT)
        return kakao('window.center')
    }

    Delegate.prototype["onWindowCreated"] = function ()
    {
        return kakao('window.setMinSize',window.WIN_MIN_WIDTH,window.WIN_MIN_HEIGHT)
    }

    Delegate.prototype["onWindowResize"] = function ()
    {
        return post.emit('resize')
    }

    Delegate.prototype["onMenuAction"] = function (action, args)
    {
        switch (action)
        {
            case 'Zoom In':
                return this.world.zoom(1)

            case 'Zoom Out':
                return this.world.zoom(-1)

            case 'Pause':
                return this.world.togglePause()

        }

        return 'unhandled'
    }

    Delegate.prototype["onWindowBlur"] = function (win)
    {}

    Delegate.prototype["onWindowFocus"] = function (win)
    {}

    return Delegate
})()

kakao.init(function ()
{
    new win(new Delegate)
    return this
})
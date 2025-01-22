var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}}

var Delegate

import * as three from 'three'
import kakao from "../kakao.js"

import kxk from "../kxk.js"
let $ = kxk.$
let win = kxk.win
let fps = kxk.fps
let drag = kxk.drag
let post = kxk.post
let elem = kxk.elem
let stopEvent = kxk.stopEvent

import world from "./world.js"
import scene from "./scene.js"
import input from "./input.js"
import player from "./player.js"
import camera from "./camera.js"


Delegate = (function ()
{
    _k_.extend(Delegate, win.Delegate)
    function Delegate ()
    {
        this["onMenuAction"] = this["onMenuAction"].bind(this)
        this["onWindowKeyUp"] = this["onWindowKeyUp"].bind(this)
        this["onWindowKeyDown"] = this["onWindowKeyDown"].bind(this)
        this["onWindowResize"] = this["onWindowResize"].bind(this)
        this["onWindowCreated"] = this["onWindowCreated"].bind(this)
        this["onWindowWithoutStash"] = this["onWindowWithoutStash"].bind(this)
        this["onDragStop"] = this["onDragStop"].bind(this)
        this["onDragMove"] = this["onDragMove"].bind(this)
        this["onWheel"] = this["onWheel"].bind(this)
        this["onWindowWillShow"] = this["onWindowWillShow"].bind(this)
        this["onWindowAnimationTick"] = this["onWindowAnimationTick"].bind(this)
        this.noAnimation = true
        this.menuNoon = kakao.bundle.res('menu_digger.noon')
        post.on('menuAction',this.onMenuAction)
        return Delegate.__super__.constructor.apply(this, arguments)
    }

    Delegate.prototype["onWindowAnimationTick"] = function (win, tickInfo)
    {
        console.log('tickInfo',tickInfo)
        if (!this.world)
        {
            return
        }
        return this.world.tick(tickInfo)
    }

    Delegate.prototype["onWindowWillShow"] = function ()
    {
        if (this.world)
        {
            return
        }
        this.main = $('main')
        this.main.focus()
        window.titlebar.hideMenu()
        this.scene = new scene(this.main)
        this.player = new player(this.scene)
        this.camera = new camera(this.scene,this.player)
        this.world = new world(this.scene,this.player,this.camera)
        this.player.input.init({moveLeft:['a','left'],moveRight:['d','right'],moveUp:['w','up'],moveDown:['s','down']})
        if (0)
        {
            this.fps = new fps(this.main,{topDown:true})
        }
        this.drag = new drag({target:this.main,stopEvent:false,onStart:this.onDragMove,onMove:this.onDragMove,onStop:this.onDragStop})
        main.addEventListener('wheel',this.onWheel)
        return this.world.start()
    }

    Delegate.prototype["onWheel"] = function (event)
    {
        return this.camera.zoom(-event.deltaY / 100)
    }

    Delegate.prototype["onDragMove"] = function (drag, event)
    {
        var ch, wh, _74_27_

        wh = main.clientWidth / 2
        ch = main.clientHeight / 2
        this.player.dragScreen = ((_74_27_=this.player.dragScreen) != null ? _74_27_ : new three.Vector2)
        return this.player.dragScreen.set((drag.pos.x - wh) / wh,(drag.pos.y - 30 - ch) / ch)
    }

    Delegate.prototype["onDragStop"] = function (drag, event)
    {
        return delete this.player.dragScreen
    }

    Delegate.prototype["onWindowWithoutStash"] = function ()
    {
        kakao('window.setSize',1920,1080)
        return kakao('window.center')
    }

    Delegate.prototype["onWindowCreated"] = function ()
    {
        return kakao('window.setMinSize',400,400)
    }

    Delegate.prototype["onWindowResize"] = function ()
    {
        return post.emit('resize')
    }

    Delegate.prototype["onWindowKeyDown"] = function (keyInfo)
    {
        this.player.input.onKeyDown(keyInfo)
        stopEvent(keyInfo.event)
        return 'unhandled'
    }

    Delegate.prototype["onWindowKeyUp"] = function (keyInfo)
    {
        this.player.input.onKeyUp(keyInfo)
        stopEvent(keyInfo.event)
        return 'unhandled'
    }

    Delegate.prototype["onMenuAction"] = function (action, args)
    {
        switch (action)
        {
            case 'Zoom In':
                return this.camera.zoom(1)

            case 'Zoom Out':
                return this.camera.zoom(-1)

            case 'Pause':
                return this.world.togglePause()

            case 'Step':
                return this.world.singleStep()

            case 'Restart':
                return this.world.start()

            case 'Tweaky':
                return post.emit('tweaky.toggle')

            case 'FPS':
                return post.emit('fps.toggle')

        }

        return 'unhandled'
    }

    return Delegate
})()

kakao.init(function ()
{
    return new win(new Delegate)
})
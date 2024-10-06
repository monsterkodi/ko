var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}}

var SysWin

import kakao from "../kakao.js"

import kxk from "../kxk.js"
let absMax = kxk.absMax
let win = kxk.win
let post = kxk.post

import sysdish from "./sysdish.js"


SysWin = (function ()
{
    _k_.extend(SysWin, sysdish)
    function SysWin ()
    {
        this["onDishData"] = this["onDishData"].bind(this)
        return SysWin.__super__.constructor.apply(this, arguments)
    }

    SysWin.prototype["onWindowWillShow"] = function ()
    {
        kakao('window.setAspectRatio',1,1)
        post.on('window.frame',this.onWindowFrame)
        post.on('dishData',this.onDishData)
        return post.on('status.down',function ()
        {
            return kakao('window.raise')
        })
    }

    SysWin.prototype["onDishData"] = function (data)
    {
        this.data = data
    
        return this.updateDish()
    }

    SysWin.prototype["onWindowKeyDown"] = function (info)
    {
        switch (info.combo)
        {
            case 'command+q':
                return kakao('app.quit')

            case 'w':
            case 'command+w':
                return kakao('window.close')

            case 'command+alt+i':
                return kakao('window.toggleInspector')

        }

    }

    return SysWin
})()

kakao.init(function ()
{
    return new win(new SysWin)
})
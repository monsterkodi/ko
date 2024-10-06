var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var digger, R_DISK, R_LOAD, R_MEM, R_NET, SysDish

import kakao from "../kakao.js"

import kxk from "../kxk.js"
let kermit = kxk.kermit
let sleep = kxk.sleep
let win = kxk.win
let deg2rad = kxk.deg2rad
let prefs = kxk.prefs
let elem = kxk.elem
let post = kxk.post
let $ = kxk.$

import utils from "./utils.js"

digger = utils.digger
R_DISK = 50
R_NET = 46
R_LOAD = 42
R_MEM = 20

SysDish = (function ()
{
    function SysDish ()
    {
        this["animDish"] = this["animDish"].bind(this)
        this["onWindowAnimationTick"] = this["onWindowAnimationTick"].bind(this)
        this["onWindowClose"] = this["onWindowClose"].bind(this)
        this.dataDelay = 500
        this.animFrames = 30
        this.div = elem({class:"sysmon",parent:document.body})
        this.dskrOld = this.dskrNow = this.dskrNew = 0
        this.dskwOld = this.dskwNow = this.dskwNew = 0
        this.netrOld = this.netrNow = this.netrNew = 0
        this.nettOld = this.nettNow = this.nettNew = 0
        this.sysOld = this.sysNow = this.sysNew = 0
        this.usrOld = this.usrNow = this.usrNew = 0
        this.memuOld = this.memuNow = this.memuNew = 0
        this.memaOld = this.memaNow = this.memaNew = 0
        this.netIn = this.netOut = 0
        this.dskIn = this.dskOut = 0
        this.maxNetIn = prefs.get('dish|maxNetIn',0)
        this.maxNetOut = prefs.get('dish|maxNetOut',0)
        this.maxDskIn = prefs.get('dish|maxDskIn',0)
        this.maxDskOut = prefs.get('dish|maxDskOut',0)
        this.data = {cpu:{sys:0,usr:0},mem:{used:0,active:0},dsk:{in:0,out:0},net:{in:0,out:0}}
        post.on('window.close',this.onWindowClose)
        this.initDish()
    }

    SysDish.prototype["initDish"] = function ()
    {
        var svg

        this.div.innerHTML = ''
        svg = utils.svg(100,100,'dish')
        this.div.appendChild(svg)
        utils.circle(R_DISK,'sysdish_disk_bgr bgr',svg)
        this.dskrPie = utils.pie('sysdish_disk_read',svg)
        this.dskwPie = utils.pie('sysdish_disk_write',svg)
        utils.circle(R_NET,'sysdish_net_bgr bgr',svg)
        this.netrPie = utils.pie('sysdish_net_recv',svg)
        this.nettPie = utils.pie('sysdish_net_send',svg)
        utils.circle(R_LOAD,'sysdish_load_bgr bgr',svg)
        this.usrPie = utils.pie('sysdish_load_usr',svg)
        this.sysPie = utils.pie('sysdish_load_sys',svg)
        utils.circle(R_MEM,'sysdish_mem_bgr bgr',svg)
        this.memuPie = utils.pie('sysdish_mem_used',svg)
        return this.memaPie = utils.pie('sysdish_mem_active',svg)
    }

    SysDish.prototype["onWindowClose"] = function (save)
    {
        return this.stop = true
    }

    SysDish.prototype["onWindowAnimationTick"] = function ()
    {
        if (this.stop)
        {
            return 'stop'
        }
        return this.animDish()
    }

    SysDish.prototype["pie180"] = function (pie, radius, angle, start = 0)
    {
        var ex, ey, sx, sy

        angle = _k_.clamp(0,180,angle)
        sx = radius * Math.sin(deg2rad(start + angle))
        sy = -radius * Math.cos(deg2rad(start + angle))
        ex = radius * Math.sin(deg2rad(start))
        ey = -radius * Math.cos(deg2rad(start))
        sx = sx.toFixed(2)
        return pie.setAttribute('d',`M 0 0 L ${sx} ${sy} A ${radius} ${radius} ${start} 0 0 ${ex} ${ey} z`)
    }

    SysDish.prototype["pie360"] = function (pie, radius, angle)
    {
        var ex, ey, f, sx, sy

        angle = _k_.clamp(0,359,angle)
        sx = radius * Math.sin(deg2rad(angle))
        sy = -radius * Math.cos(deg2rad(angle))
        ex = 0
        ey = -radius
        f = angle <= 180 && '0 0' || '1 0'
        return pie.setAttribute('d',`M 0 0 L ${sx} ${sy} A ${radius} ${radius} 0 ${f} ${ex} ${ey} z`)
    }

    SysDish.prototype["updateDish"] = function ()
    {
        this.animCount = 0
        this.dskrOld = this.dskrNow
        this.dskwOld = this.dskwNow
        this.dskrNew = 180 * this.data.dsk.in
        this.dskwNew = 180 * this.data.dsk.out
        this.netrOld = this.netrNow
        this.nettOld = this.nettNow
        this.netrNew = 180 * this.data.net.in
        this.nettNew = 180 * this.data.net.out
        this.sysOld = this.sysNow
        this.usrOld = this.usrNow
        this.sysNew = 360 * this.data.cpu.sys
        this.usrNew = 360 * (this.data.cpu.sys + this.data.cpu.usr)
        this.memuOld = this.memuNow
        this.memaOld = this.memaNow
        this.memuNew = 360 * this.data.mem.used
        return this.memaNew = 360 * this.data.mem.active
    }

    SysDish.prototype["animDish"] = function ()
    {
        var steps

        steps = this.animFrames
        this.animCount += 1
        if (this.animCount <= steps)
        {
            this.dskrNow += (this.dskrNew - this.dskrOld) / steps
            this.dskwNow += (this.dskwNew - this.dskwOld) / steps
            this.pie180(this.dskrPie,R_DISK,this.dskrNow)
            this.pie180(this.dskwPie,R_DISK,this.dskwNow,180)
            this.netrNow += (this.netrNew - this.netrOld) / steps
            this.nettNow += (this.nettNew - this.nettOld) / steps
            this.pie180(this.netrPie,R_NET,this.netrNow)
            this.pie180(this.nettPie,R_NET,this.nettNow,180)
            this.sysNow += (this.sysNew - this.sysOld) / steps
            this.usrNow += (this.usrNew - this.usrOld) / steps
            this.pie360(this.usrPie,R_LOAD,this.usrNow)
            this.pie360(this.sysPie,R_LOAD,this.sysNow)
            this.memuNow += (this.memuNew - this.memuOld) / steps
            this.memaNow += (this.memaNew - this.memaOld) / steps
            this.pie360(this.memuPie,R_MEM,this.memuNow)
            this.pie360(this.memaPie,R_MEM,this.memaNow)
        }
        return this
    }

    return SysDish
})()

export default SysDish;
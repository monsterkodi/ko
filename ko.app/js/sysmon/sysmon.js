var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }}

var digger, SysMon

import kakao from "../kakao.js"

import kxk from "../kxk.js"
let sleep = kxk.sleep
let win = kxk.win
let post = kxk.post
let prefs = kxk.prefs

import sysdish from "./sysdish.js"
import utils from "./utils.js"

digger = utils.digger

SysMon = (function ()
{
    _k_.extend(SysMon, sysdish)
    function SysMon ()
    {
        this["requestData"] = this["requestData"].bind(this)
        this["onWindowWillShow"] = this["onWindowWillShow"].bind(this)
        this["animDish"] = this["animDish"].bind(this)
        return SysMon.__super__.constructor.apply(this, arguments)
    }

    SysMon.prototype["animDish"] = function ()
    {
        SysMon.__super__.animDish.call(this)
    
        return kakao('status.icon',{x:0,y:0,w:22,h:38})
    }

    SysMon.prototype["onWindowWillShow"] = function ()
    {
        var frame

        frame = {x:-99,y:0,w:100,h:40}
        kakao('window.setFrame',frame,true)
        post.on('status.right_click',function ()
        {
            return kakao('window.new','syswin')
        })
        return this.requestData()
    }

    SysMon.prototype["requestData"] = async function ()
    {
        var active, cpu, dskstr, gb, ibytes, idiff, idx, linesplit, netlines, netstr, obytes, odiff, pages, pgb, top, toplines, total, used, vmstat

        vmstat = await kakao('app.sh','/usr/bin/vm_stat',{arg:'',cwd:kakao.bundle.path})
        pages = digger.ints(vmstat,'pagesize','free','active','inactive','speculative','throttled','wired','purgeable','faults','copy','zero','reactivated','purged','filebacked','anonymous','compressed','occupied')
        pages.app = pages.anonymous - pages.purgeable
        active = pages.app + pages.wired + pages.occupied
        used = active + pages.filebacked + pages.purgeable
        total = pages.free + pages.active + pages.inactive + pages.wired + pages.occupied + pages.throttled + pages.speculative
        gb = 1 / (1024 * 1024 * 1024)
        pgb = pages.pagesize * gb
        this.data.mem.active = active / total
        this.data.mem.used = used / total
        top = await kakao('app.sh','/usr/bin/top',{arg:"-l 1 -s 0 -n 0"})
        toplines = top.split('\n')
        cpu = digger.floats(toplines[3],'user','sys','idle')
        this.data.cpu.usr = cpu.user / 100
        this.data.cpu.sys = cpu.sys / 100
        netstr = await kakao('app.sh','/usr/sbin/netstat',{arg:'-bdI en0'})
        netlines = netstr.split('\n')
        linesplit = netlines[3].split(/\s+/g)
        ibytes = parseInt(linesplit[6])
        obytes = parseInt(linesplit[9])
        if (this.netIn > 0)
        {
            idiff = ibytes - this.netIn
            this.maxNetIn = _k_.max(this.maxNetIn,idiff)
            if (this.maxNetIn > 0)
            {
                this.data.net.in = idiff / this.maxNetIn
            }
        }
        if (this.netOut > 0)
        {
            odiff = obytes - this.netOut
            this.maxNetOut = _k_.max(this.maxNetOut,odiff)
            if (this.maxNetOut > 0)
            {
                this.data.net.out = odiff / this.maxNetOut
            }
        }
        this.netIn = ibytes
        this.netOut = obytes
        dskstr = await kakao('app.sh','/usr/sbin/ioreg',{arg:'-c IOBlockStorageDriver -k Statistics -r -w0'})
        if (0 < (idx = dskstr.indexOf('"Bytes (Read)"=')))
        {
            dskstr = dskstr.slice(idx + 15)
            idx = dskstr.indexOf('\n')
            dskstr = dskstr.slice(0, typeof idx === 'number' ? idx+1 : Infinity)
            ibytes = parseInt(dskstr)
            idx = dskstr.indexOf('"Bytes (Write)"=')
            dskstr = dskstr.slice(idx + 16)
            obytes = parseInt(dskstr)
            if (this.dskIn > 0)
            {
                idiff = ibytes - this.dskIn
                this.maxDskIn = _k_.max(this.maxDskIn,idiff)
                if (this.maxDskIn > 0)
                {
                    this.data.dsk.in = idiff / this.maxDskIn
                }
            }
            if (this.dskOut > 0)
            {
                odiff = obytes - this.dskOut
                this.maxDskOut = _k_.max(this.maxDskOut,odiff)
                if (this.maxDskOut > 0)
                {
                    this.data.dsk.out = odiff / this.maxDskOut
                }
            }
            this.dskIn = ibytes
            this.dskOut = obytes
        }
        this.updateDish()
        post.toWins('dishData',this.data)
        prefs.set('dish',{maxDskIn:this.maxDskIn,maxDskOut:this.maxDskOut,maxNetIn:this.maxNetIn,maxNetOut:this.maxNetOut})
        await sleep(this.dataDelay)
        return this.requestData()
    }

    return SysMon
})()

kakao.init(function ()
{
    return new win(new SysMon)
})
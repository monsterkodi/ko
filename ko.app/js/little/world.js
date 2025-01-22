var _k_ = {min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }, extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, list: function (l) {return l != null ? typeof l.length === 'number' ? l : [] : []}, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, empty: function (l) {return l==='' || l===null || l===undefined || l!==l || typeof(l) === 'object' && Object.keys(l).length === 0}, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var clr, COL_BG, COL_CRITTER, COL_DEAD, COL_EGG, COL_EGG_DOT, COL_GRID, COL_GRINDER, COL_HOOVER, COL_LEAF, COL_PLANT, COL_SHADOW, COL_STARVE, COL_TUBE, cos, gry, PHI, PI, posInCircle, posInCRect, posInPipeH, posInRect, sin, sort, TAU, threshMold, valuePipeH, world

import kxk from "../kxk.js"
let $ = kxk.$
let drag = kxk.drag
let stopEvent = kxk.stopEvent
let prefs = kxk.prefs
let post = kxk.post
let kpos = kxk.kpos
let fade = kxk.fade
let randRange = kxk.randRange
let randInt = kxk.randInt
let randIntRange = kxk.randIntRange

import gee from "./gee.js"
import tweaky from "./tweaky.js"
import tube from "./tube.js"
import matrix from "./matrix.js"

cos = Math.cos
sin = Math.sin
PI = Math.PI

TAU = 2 * PI
PHI = 1.618

clr = function (r, g, b, a = 10)
{
    return [r / 10,g / 10,b / 10,a / 10]
}

gry = function (g, a = 10)
{
    return [g / 10,g / 10,g / 10,a / 10]
}
COL_SHADOW = gry(0,1)
COL_BG = gry(1.5)
COL_GRID = gry(0,5)
COL_TUBE = gry(5)
COL_PLANT = clr(0,5,0)
COL_LEAF = clr(0,5,0)
COL_EGG = gry(10)
COL_CRITTER = clr(4,4,10)
COL_STARVE = gry(2.5)
COL_DEAD = gry(1)
COL_EGG_DOT = gry(0,5)
COL_GRINDER = clr(10,0,0)
COL_HOOVER = clr(10,6,0)

threshMold = function (p, n, m)
{
    return parseInt(p / m) !== parseInt(n / m)
}

sort = (function (a, b)
{
    return [_k_.min(a,b),_k_.max(a,b)]
}).bind(this)

posInCircle = (function (p, cx, cy, cr)
{
    return (p[0] - cx) * (p[0] - cx) + (p[1] - cy) * (p[1] - cy) < cr * cr
}).bind(this)

posInRect = (function (p, x1, y1, x2, y2)
{
    var _a_ = sort(x1,x2); x1 = _a_[0]; x2 = _a_[1]

    var _b_ = sort(y1,y2); y1 = _b_[0]; y2 = _b_[1]

    return (x1 <= p[0] && p[0] <= x2) && (y1 <= p[1] && p[1] <= y2)
}).bind(this)

posInCRect = (function (p, cx, cy, w, h)
{
    return ((cx - w / 2) <= p[0] && p[0] <= (cx + w / 2)) && ((cy - h / 2) <= p[1] && p[1] <= (cy + h / 2))
}).bind(this)

posInPipeH = (function (p, x, y, w, r)
{
    return posInCircle(p,x,y,r) || posInCircle(p,x + w,y,r) || posInRect(p,x,y - r,x + w,y + r)
}).bind(this)

valuePipeH = (function (p, x, y, w, r)
{
    if (posInPipeH(p,x,y,w,r))
    {
        return (p[0] - x) / w
    }
}).bind(this)

world = (function ()
{
    _k_.extend(world, matrix)
    function world ()
    {
        var ri, s, si, slot, ti, uv

        this["singleStep"] = this["singleStep"].bind(this)
        this["drawInventory"] = this["drawInventory"].bind(this)
        this["drawSpeedGauge"] = this["drawSpeedGauge"].bind(this)
        this["gridQuadRect"] = this["gridQuadRect"].bind(this)
        this["roundedQuadRect"] = this["roundedQuadRect"].bind(this)
        this["critterWombPos"] = this["critterWombPos"].bind(this)
        this["drawCritter"] = this["drawCritter"].bind(this)
        this["drawHoover"] = this["drawHoover"].bind(this)
        this["drawGrinder"] = this["drawGrinder"].bind(this)
        this["drawEgg"] = this["drawEgg"].bind(this)
        this["drawTube"] = this["drawTube"].bind(this)
        this["drawPlant"] = this["drawPlant"].bind(this)
        this["toggleValues"] = this["toggleValues"].bind(this)
        this["togglePause"] = this["togglePause"].bind(this)
        this["onContextMenu"] = this["onContextMenu"].bind(this)
        this["onDragStop"] = this["onDragStop"].bind(this)
        this["onDragMove"] = this["onDragMove"].bind(this)
        this["placeActiveSlotObject"] = this["placeActiveSlotObject"].bind(this)
        this["onDragStart"] = this["onDragStart"].bind(this)
        this["mouseInWorld"] = this["mouseInWorld"].bind(this)
        this["eventPos"] = this["eventPos"].bind(this)
        this["win2Grid"] = this["win2Grid"].bind(this)
        this["win2Pos"] = this["win2Pos"].bind(this)
        this["onMouseMove"] = this["onMouseMove"].bind(this)
        this["onWheel"] = this["onWheel"].bind(this)
        this.main = $('main')
        this.pause = false
        this.speed = 10
        this.tweaky = new tweaky(this.main)
        this.g = new gee(this.main)
        this.h = new gee(this.main)
        this.g.useFBO = true
        world.__super__.constructor.call(this)
        this.inventory = {x:0,y:-1,s:0.5,slots:[{type:this.CORPSE,num:0},{type:this.EGG,num:1},{type:this.PLANT,num:1},{type:this.HOOVER,tool:true}]}
        this.speedGauge = {x:0,y:0,s:0.5,sx:0.3125,sw:1,sh:0.125,sb:0.25}
        this.slots = {}
        var list = _k_.list(this.inventory.slots)
        for (si = 0; si < list.length; si++)
        {
            slot = list[si]
            this.slots[slot.type] = slot
            slot.x = this.inventory.x + this.inventory.s * si
            slot.y = this.inventory.y
            slot.w = this.inventory.s
            slot.h = this.inventory.s
        }
        this.activeSlot = this.slots[this.PLANT]
        this.main.focus()
        this.g.camScale = 0.08
        this.g.camPosX = 1 / this.g.camScale
        this.g.camPosY = 1 / this.g.camScale
        this.g.updateCamera()
        this.h.camCenter = 'topleft'
        this.h.clearColor = [0,0,0,0]
        this.hudGridY = 10
        this.h.camScale = 2 / this.hudGridY
        this.h.camPosX = -0.5
        this.h.camPosY = 0.5
        this.h.updateCamera()
        window.addEventListener('wheel',this.onWheel)
        this.main.addEventListener('mousemove',this.onMouseMove)
        this.main.addEventListener('contextmenu',this.onContextMenu)
        s = 40.96 / 2048
        uv = function (u, uu, v, vv)
        {
            return [s * u,s * v,s * uu,s * vv]
        }
        this.tubeUV = []
        for (ti = 0; ti <= 8; ti++)
        {
            this.tubeUV.push([uv(ti * 4 + 2,ti * 4 + 2,8,10),uv(ti * 4 + 2,ti * 4 + 4,8,10),uv(ti * 4 + 2,ti * 4 + 4,10,10),uv(ti * 4 + 2,ti * 4 + 4,10,12),uv(ti * 4,ti * 4 + 2,10,12),uv(ti * 4,ti * 4 + 2,8,10)])
        }
        this.ringUV = []
        for (ri = 0; ri <= 8; ri++)
        {
            this.ringUV.push(uv(ri * 4,(ri + 1) * 4,8,12))
        }
        this.quadUV = uv(37,39,9,11)
        this.circleUV = uv(36,40,8,12)
        this.circleTopUV = uv(36,40,8,10)
        this.pieUV = [uv(36,38,8,10),uv(38,40,8,10),uv(38,40,10,12),uv(36,38,10,12)]
        this.eggUV = this.circleUV
        this.mouse = {pos:[0,0]}
        this.drag = new drag({target:this.main,onStart:this.onDragStart,onMove:this.onDragMove,onStop:this.onDragStop,cursor:'pointer',stopEvent:false})
        this.start()
    }

    world.prototype["onWheel"] = function (event)
    {
        if (event.ctrlKey || event.metaKey)
        {
            this.g.camScale -= event.deltaY / ((event.metaKey ? 20000 : 4000))
            this.g.camScale = _k_.clamp(0.01,0.2,this.g.camScale)
        }
        else
        {
            this.g.camPosX += event.deltaX / (4000 * this.g.camScale)
            this.g.camPosY -= event.deltaY / (4000 * this.g.camScale)
        }
        this.g.camPosX = _k_.clamp(0,this.ws,this.g.camPosX)
        this.g.camPosY = _k_.clamp(0,this.ws,this.g.camPosY)
        return this.g.updateCamera()
    }

    world.prototype["onMouseMove"] = function (event)
    {
        var hp, slot, winPos

        winPos = this.eventPos(event)
        this.mouse = {grid:this.win2Grid(winPos),pos:this.win2Pos(winPos),win:winPos}
        hp = this.h.win2Pos(winPos)
        this.hoverSlot = null
        var list = _k_.list(this.inventory.slots)
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            slot = list[_a_]
            if (posInCRect(hp,slot.x,slot.y,slot.w,slot.h))
            {
                this.hoverSlot = slot
                return
            }
        }
        if (posInCircle(hp,this.speedGauge.x,this.speedGauge.y,this.speedGauge.s / 2))
        {
            return this.speedGauge.hover = 'gauge'
        }
        else if (posInPipeH(hp,this.speedGauge.sx,this.speedGauge.y,this.speedGauge.sw,this.speedGauge.sb / 2))
        {
            return this.speedGauge.hover = 'slider'
        }
        else
        {
            return delete this.speedGauge.hover
        }
    }

    world.prototype["win2Pos"] = function (winPos)
    {
        return this.g.win2Pos(winPos)
    }

    world.prototype["win2Grid"] = function (winPos)
    {
        var x, y

        var _a_ = this.win2Pos(winPos); x = _a_[0]; y = _a_[1]

        x = _k_.clamp(0,this.ws - 1,Math.round(x))
        y = _k_.clamp(0,this.ws - 1,Math.round(y))
        return [x,y]
    }

    world.prototype["eventPos"] = function (event)
    {
        return kpos(event)
    }

    world.prototype["mouseInWorld"] = function ()
    {
        return this.isInWorld(this.mouse.pos)
    }

    world.prototype["onDragStart"] = function (drag, event)
    {
        var hp, p, v

        hp = this.h.win2Pos(drag.pos)
        if (this.hoverSlot)
        {
            this.activeSlot = this.hoverSlot
            return
        }
        if (posInCircle(hp,this.speedGauge.x,this.speedGauge.y,this.speedGauge.s / 2))
        {
            this.togglePause()
            return
        }
        if (v = valuePipeH(hp,this.speedGauge.sx,this.speedGauge.y,this.speedGauge.sw,this.speedGauge.sb / 2))
        {
            this.speed = fade(1,100,v)
            return
        }
        if (!this.mouseInWorld())
        {
            return
        }
        p = this.win2Grid(drag.pos)
        if (event.button === 2)
        {
            this.takeAt(p)
            return
        }
        if (event.metaKey)
        {
            return this.dragPath = [this.win2Grid(drag.pos),this.win2Grid(drag.pos)]
        }
        else if (event.shiftKey)
        {
            return this.addGrinder(p[0],p[1])
        }
        else
        {
            return this.placeActiveSlotObject(p)
        }
    }

    world.prototype["placeActiveSlotObject"] = function (p)
    {
        if (!this.activeSlot)
        {
            return
        }
        if (this.activeSlot.tool)
        {
            switch (this.activeSlot.type)
            {
                case this.HOOVER:
                    this.takeAt(p)
                    break
            }

            return
        }
        if (this.slots[this.activeSlot.type].num <= 0)
        {
            return
        }
        if (this.buildingAt(p))
        {
            return
        }
        this.slots[this.activeSlot.type].num--
        this.placeObjectOfType(p,this.activeSlot.type)
        if (this.activeSlot.type === this.PLANT && this.slots[this.activeSlot.type].num === 0)
        {
            if (this.slots[this.EGG].num)
            {
                this.activeSlot = this.slots[this.EGG]
            }
        }
        if (this.activeSlot.type === this.EGG && this.slots[this.activeSlot.type].num === 0)
        {
            return this.activeSlot = this.slots[this.HOOVER]
        }
    }

    world.prototype["onDragMove"] = function (drag, event)
    {
        var hp, k, l, p, v

        hp = this.h.win2Pos(drag.pos)
        if (v = valuePipeH(hp,this.speedGauge.sx,this.speedGauge.y,this.speedGauge.sw,this.speedGauge.sb / 2))
        {
            this.speed = fade(1,100,v)
            return
        }
        p = this.win2Grid(drag.pos)
        if (!this.mouseInWorld())
        {
            return
        }
        if (event.button === 2)
        {
            this.takeAt(p)
            return
        }
        if (event.shiftKey)
        {
            return
        }
        if (!event.metaKey)
        {
            this.placeActiveSlotObject(p)
        }
        if (!this.dragPath)
        {
            return
        }
        l = this.dragPath.slice(-1)[0]
        k = this.dragPath.slice(-2,-1)[0]
        if ((k[0] === l[0] && l[0] === p[0]) && (k[1] === l[1] && l[1] === p[1]) && this.dragPath.length > 2)
        {
            return this.dragPath.pop()
        }
        else if ((k[0] === l[0] && l[0] === p[0]))
        {
            return l[1] = p[1]
        }
        else if ((k[1] === l[1] && l[1] === p[1]))
        {
            return l[0] = p[0]
        }
        else
        {
            this.dragPath.push(p)
            if (l[0] !== k[0] && l[1] !== k[1])
            {
                if (l[0] === k[0])
                {
                    return l[1] = p[1]
                }
                else
                {
                    return l[0] = p[0]
                }
            }
        }
    }

    world.prototype["onDragStop"] = function (drag, event)
    {
        if (this.dragPath)
        {
            tube.path(this.dragPath,this.addTube)
            return delete this.dragPath
        }
    }

    world.prototype["onContextMenu"] = function (event)
    {
        return stopEvent(event)
    }

    world.prototype["togglePause"] = function ()
    {
        this.pause = !this.pause
        return post.emit('pause')
    }

    world.prototype["toggleValues"] = function ()
    {}

    world.prototype["drawPlant"] = function (p, g = this.g, scale = 1)
    {
        var af, col, l, li, ls, lx, ly, r, s

        s = scale * 0.25
        g.addQuad(p.x,p.y,s,s,COL_PLANT,this.circleUV,0,0)
        s = scale * 0.15
        r = scale * 0.2
        for (var _a_ = li = 0, _b_ = p.leaves.length; (_a_ <= _b_ ? li < p.leaves.length : li > p.leaves.length); (_a_ <= _b_ ? ++li : --li))
        {
            l = p.leaves[li]
            af = l.age / this.leafMaxAge
            ls = s * _k_.clamp(0,1,af)
            col = [(((af > 1) ? 1 : 0)),(((af > 1) ? 1 : COL_LEAF[1])),COL_LEAF[2],COL_LEAF[3]]
            lx = p.x + cos(-li * TAU / this.numLeaves + PI) * r
            ly = p.y + sin(-li * TAU / this.numLeaves + PI) * r
            if (l.ef)
            {
                lx = fade(l.c.x + l.c.ox - 0.25,lx,l.ef)
                ly = fade(l.c.y + l.c.oy,ly,l.ef)
                ls = s
                col = [1,1,0,1]
            }
            g.addQuad(lx,ly,ls,ls,col,this.circleUV,0,1)
        }
    }

    world.prototype["drawTube"] = function (x, y, idx)
    {
        var t

        if (_k_.empty(y))
        {
            t = x
            x = t.x
            y = t.y
            idx = t.idx
        }
        return this.g.addQuad(x,y,1,1,COL_TUBE,this.tubeUV[2][idx],0,1)
    }

    world.prototype["drawEgg"] = function (e, g = this.g, scale = 1)
    {
        var a, ageFac, ox, oy, s, _363_18_, _364_18_

        ageFac = e.age / this.eggMaxAge
        s = scale * fade(0.1,0.3,ageFac)
        a = 1
        if (e.age > this.eggMaxAge)
        {
            a = fade(1.0,0.0,(e.age - this.eggMaxAge) / this.eggFadeTime)
        }
        ox = ((_363_18_=e.ox) != null ? _363_18_ : 0)
        oy = ((_364_18_=e.oy) != null ? _364_18_ : 0)
        return g.addQuad(e.x + ox,e.y + oy,s,s,[COL_EGG[0],COL_EGG[1],COL_EGG[2],a],this.eggUV,0,1)
    }

    world.prototype["drawGrinder"] = function (gr)
    {
        var bot, gs

        gs = 1.25
        this.g.addTubeRect(gr.x - gs,gr.y - gs,gr.x + gs,gr.y + gs,2,COL_GRINDER,1)
        bot = gr.bot
        if (bot.mf)
        {
            bot.x = fade(bot.c.x,gr.x,bot.mf)
            bot.y = fade(bot.c.y,gr.y,bot.mf)
        }
        else if (bot.rf)
        {
            bot.x = fade(gr.x,bot.s.x,bot.rf)
            bot.y = fade(gr.y,bot.s.y,bot.rf)
        }
        return this.g.addQuad(bot.x,bot.y,1,1,COL_GRINDER,this.circleTopUV,0,1)
    }

    world.prototype["drawHoover"] = function (hv, g = this.g, scale = 1)
    {
        var s

        s = scale * 0.7
        g.quad(hv.x - s * 0.2,hv.y + s * 0.1,this.circleTopUV,{color:COL_HOOVER,scale:s,sy:0.5,rot:PI * 0.3})
        return g.quad(hv.x + s * 0.2,hv.y + s * 0.1,this.circleTopUV,{color:COL_HOOVER,scale:s,sy:0.5,rot:-PI * 0.3})
    }

    world.prototype["drawCritter"] = function (c, g = this.g, scale = 1, ccl = null)
    {
        var col, cx, cy, e, f, h, ox, oy, rcos, rot, rsin, rxo, ryo, se, sx, sy, thrd, wp, xo, yo, _420_18_, _421_18_

        sx = sy = scale * fade(0.2,1,c.age / this.critterAdultAge)
        rot = 0
        rcos = 1
        rsin = 0
        col = COL_CRITTER
        if (c.eat < 0)
        {
            h = _k_.clamp(0,1,-c.eat / this.critterStarveTime)
            col = [fade(col[0],COL_STARVE[0],h),fade(col[1],COL_STARVE[1],h),fade(col[2],COL_STARVE[2],h),1]
        }
        if (c.df)
        {
            rot = _k_.min(PI,c.df * PI)
            rcos = cos(rot)
            rsin = sin(rot)
            h = _k_.clamp(0,1,c.df)
            col = [fade(col[0],COL_DEAD[0],h),fade(col[1],COL_DEAD[1],h),fade(col[2],COL_DEAD[2],h),1]
        }
        if (ccl)
        {
            col = ccl
        }
        ox = ((_420_18_=c.ox) != null ? _420_18_ : 0)
        oy = ((_421_18_=c.oy) != null ? _421_18_ : 0)
        cx = c.x + ox
        cy = c.y + oy
        g.addQuad(cx - rsin * 0.25 * sx,cy + rcos * 0.25 * sy,sx,sy * 0.5,col,this.circleTopUV,rot,1)
        g.addQuad(cx - rcos * (1 / 4) * sx,cy - rsin * (1 / 4) * sy,0.5 * sx,0.5 * sy,col,this.circleUV,0,1)
        g.addQuad(cx + rcos * (1 / 12) * sx,cy + rsin * (1 / 12) * sy,(1 / 6) * sx,(1 / 6) * sy,col,this.circleUV,0,1)
        g.addQuad(cx + rcos * (3 / 12) * sx,cy + rsin * (3 / 12) * sy,(1 / 6) * sx,(1 / 6) * sy,col,this.circleUV,0,1)
        g.addQuad(cx + rcos * (5 / 12) * sx,cy + rsin * (5 / 12) * sy,(1 / 6) * sx,(1 / 6) * sy,col,this.circleUV,0,1)
        thrd = 1 / 3
        se = 0.6
        for (var _a_ = e = 0, _b_ = c.eggs; (_a_ <= _b_ ? e < c.eggs : e > c.eggs); (_a_ <= _b_ ? ++e : --e))
        {
            xo = [-thrd,0,thrd][e] * se * sx
            yo = [0.15,0.25,0.15][e] * sy
            rxo = rcos * xo - rsin * yo
            ryo = rsin * xo + rcos * yo
            g.addQuad(cx + rxo,cy + ryo,[1,1.25,1][e] * thrd * sx * se,[1,1.25,1][e] * thrd * se * sy,COL_EGG_DOT,this.circleUV,0,1)
        }
        if (c.age > this.critterAdultAge && !c.df)
        {
            f = _k_.min(1,this.critterEggFactor(c))
            wp = this.critterWombPos(c)
            return g.addQuad(wp.x,wp.y,[1,1.25,1][e] * thrd * sx * se * f,[1,1.25,1][e] * thrd * se * sy * f,COL_EGG,this.circleUV,0,1)
        }
    }

    world.prototype["critterWombPos"] = function (c, e = c.eggs)
    {
        var cx, cy, xo, yo, _451_25_, _452_25_

        cx = c.x + (((_451_25_=c.ox) != null ? _451_25_ : 0))
        cy = c.y + (((_452_25_=c.oy) != null ? _452_25_ : 0))
        xo = [-0.2,0,0.2][e]
        yo = [0.15,0.25,0.15][e]
        return {x:cx + xo,y:cy + yo}
    }

    world.prototype["roundedQuadRect"] = function (x0, y0, x1, y1, color, layer = 0)
    {
        var _a_ = [_k_.min(x0,x1),_k_.max(x0,x1)]; x0 = _a_[0]; x1 = _a_[1]

        var _b_ = [_k_.min(y0,y1),_k_.max(y0,y1)]; y0 = _b_[0]; y1 = _b_[1]

        this.g.addQuad(x0,y0,1,1,color,this.pieUV[3],0,layer)
        this.g.addQuad(x1,y0,1,1,color,this.pieUV[2],0,layer)
        this.g.addQuad(x1,y1,1,1,color,this.pieUV[1],0,layer)
        this.g.addQuad(x0,y1,1,1,color,this.pieUV[0],0,layer)
        this.g.addQuad((x0 + x1) / 2,(y0 + y1) / 2,(x1 - x0) - 1,(y1 - y0) + 1,color,this.quadUV,0,layer)
        this.g.addQuad(x0,(y0 + y1) / 2,1,(y1 - y0) - 1,color,this.quadUV,0,layer)
        return this.g.addQuad(x1,(y0 + y1) / 2,1,(y1 - y0) - 1,color,this.quadUV,0,layer)
    }

    world.prototype["gridQuadRect"] = function (x0, y0, x1, y1, color, layer = 0, w = 0.02)
    {
        var sx, sy, x, y

        var _a_ = [_k_.min(x0,x1),_k_.max(x0,x1)]; x0 = _a_[0]; x1 = _a_[1]

        var _b_ = [_k_.min(y0,y1),_k_.max(y0,y1)]; y0 = _b_[0]; y1 = _b_[1]

        sx = x1 - x0
        sy = y1 - y0
        for (var _c_ = x = 0, _d_ = sx; (_c_ <= _d_ ? x <= sx : x >= sx); (_c_ <= _d_ ? ++x : --x))
        {
            this.g.addQuad(x,sx / 2,w,sx,[0,0,0,0.15],this.quadUV,0,layer)
        }
        for (var _e_ = y = 0, _f_ = sy; (_e_ <= _f_ ? y <= sy : y >= sy); (_e_ <= _f_ ? ++y : --y))
        {
            this.g.addQuad(sy / 2,y,sy,w,[0,0,0,0.15],this.quadUV,0,layer)
        }
    }

    world.prototype["tick"] = function (tickInfo)
    {
        var c, e, g, p, t, _495_15_

        this.tickInfo = tickInfo
    
        this.simulate(this.tickInfo)
        ;(this.tweaky != null ? this.tweaky.update() : undefined)
        this.roundedQuadRect(0,-0.5,this.ws - 0.5,this.ws - 1,COL_SHADOW)
        this.roundedQuadRect(-0.25,-0.25,this.ws - 0.75,this.ws - 0.75,COL_BG)
        this.gridQuadRect(0,0,this.ws - 1,this.ws - 1,COL_GRID)
        if (this.dragPath)
        {
            tube.path(this.dragPath,this.drawTube)
        }
        var list = _k_.list(this.types[this.TUBE])
        for (var _a_ = 0; _a_ < list.length; _a_++)
        {
            t = list[_a_]
            this.drawTube(t)
        }
        var list1 = _k_.list(this.types[this.PLANT])
        for (var _b_ = 0; _b_ < list1.length; _b_++)
        {
            p = list1[_b_]
            this.drawPlant(p)
        }
        var list2 = _k_.list(this.types[this.CRITTER])
        for (var _c_ = 0; _c_ < list2.length; _c_++)
        {
            c = list2[_c_]
            this.drawCritter(c)
        }
        var list3 = _k_.list(this.types[this.EGG])
        for (var _d_ = 0; _d_ < list3.length; _d_++)
        {
            e = list3[_d_]
            this.drawEgg(e)
        }
        var list4 = _k_.list(this.types[this.GRINDER])
        for (var _e_ = 0; _e_ < list4.length; _e_++)
        {
            g = list4[_e_]
            this.drawGrinder(g)
        }
        this.g.draw(this.tickInfo.time)
        this.drawSpeedGauge()
        this.drawInventory()
        this.h.draw(this.tickInfo.time)
        return delete this.oneStep
    }

    world.prototype["drawSpeedGauge"] = function ()
    {
        var bc, gc, gv, knobX, pc, phs, ri, s, sb, sh, sw, sx, sz, wave, x, y

        x = this.speedGauge.x
        y = this.speedGauge.y
        s = this.speedGauge.s
        sx = this.speedGauge.sx
        sb = this.speedGauge.sb
        sh = this.speedGauge.sh
        sw = this.speedGauge.sw
        bc = [0.2,0.2,0.2,1]
        knobX = x + fade(sx,sx + sw,(this.speed - 1) / 99)
        this.h.addPipe(x,y,sx + sw,y,sb,bc)
        this.h.addPipe(sx,y,sx + sw,y,sh,[0.1,0.1,0.1,1])
        this.h.addCircle(knobX,y,sh,[0.5,0.5,0.5,1])
        this.h.addCircle(x,y,s,bc)
        gc = (this.speedGauge.hover === 'gauge' ? clr(1,1,1) : clr(0,0,0))
        this.h.addQuad(x,y,s,s,gc,this.ringUV[4],0,1)
        pc = (this.pause ? [1,0,0,1] : [0,0,0,0])
        this.h.addCircle(x,y,s / 4,pc,1)
        if (!this.pause)
        {
            wave = (function (hz, ph = 0)
            {
                return sin(hz * ph * TAU + hz * TAU * this.cycles)
            }).bind(this)
            sz = s * fade(0.125,0.28,this.speed / 100)
            for (ri = 0; ri <= 8; ri++)
            {
                phs = (this.speed / 60) * (ri / 16)
                gv = ri / 32
                this.h.addQuad(x + wave(1,phs) * s / 4,y - wave(1,phs - 0.25) * s / 4,sz,sz,[gv,gv,gv,1],this.circleUV,0,1)
            }
        }
        if (this.speedGauge.hover === 'slider')
        {
            return this.h.number(knobX,y + sb * 0.85,this.speed,{scale:s / 3.5,layer:1,color:clr(5,5,5)})
        }
    }

    world.prototype["drawInventory"] = function ()
    {
        var bgcol, fr, frcol, s, sh, si, slot, sx, x, y

        x = this.inventory.x
        y = this.inventory.y
        s = this.inventory.s
        sh = s / 2
        fr = s / 4
        frcol = clr(2,2,2)
        this.h.addRoundedFrame(x - sh,y - PHI * sh,x + s * this.inventory.slots.length - sh,y + sh,frcol,1,fr,4)
        var list = _k_.list(this.inventory.slots)
        for (si = 0; si < list.length; si++)
        {
            slot = list[si]
            sx = x + s * si
            bgcol = ((slot === this.activeSlot) ? gry(0) : ((slot === this.hoverSlot) ? gry(1) : gry(1.6)))
            this.h.crect(slot.x,slot.y,{sx:s,sy:s,layer:0,color:bgcol})
            this.h.crect(slot.x,slot.y - s * 0.6,{sx:s,sy:s * 0.3,layer:0,color:bgcol})
            if (!slot.tool)
            {
                this.h.number(slot.x,slot.y - s * 0.57,slot.num,{scale:s / 4,layer:1,color:(slot.num === 0 ? gry(3) : gry(10))})
            }
            switch (slot.type)
            {
                case this.CORPSE:
                    this.drawCritter({x:sx,y:y + s / 12,age:this.critterAdultAge / 2,df:1},this.h,s,gry(5))
                    break
                case this.EGG:
                    this.drawEgg({x:sx,y:y,age:this.eggMaxAge},this.h,s * 1.5)
                    break
                case this.PLANT:
                    this.drawPlant(this.makePlant(sx,y,8,this.leafMaxAge + 1),this.h,s)
                    break
                case this.HOOVER:
                    this.drawHoover({x:sx,y:y},this.h,s)
                    break
            }

        }
    }

    world.prototype["simulate"] = function (tickInfo)
    {
        var sec

        if (this.pause && !this.oneStep)
        {
            return
        }
        if (isNaN(tickInfo.delta))
        {
            return
        }
        sec = this.speed * tickInfo.delta / 1000
        return this.advance(sec)
    }

    world.prototype["singleStep"] = function ()
    {
        this.oneStep = true
        this.pause = true
        return post.emit('pause')
    }

    return world
})()

export default world;
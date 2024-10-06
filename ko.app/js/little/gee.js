var _k_ = {extend: function (c,p) {for (var k in p) { if (Object.prototype.hasOwnProperty(p, k)) c[k] = p[k] } function ctor() { this.constructor = c; } ctor.prototype = p.prototype; c.prototype = new ctor(); c.__super__ = p.prototype; return c;}, min: function () { var m = Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.min.apply(_k_.min,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n < m ? n : m}}}; return m }, max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }}

var gee

import kxk from "../kxk.js"
let randInt = kxk.randInt
let randRange = kxk.randRange
let elem = kxk.elem
let post = kxk.post

import geell from "./geell.js"


gee = (function ()
{
    _k_.extend(gee, geell)
    function gee ()
    {
        this["addQuad"] = this["addQuad"].bind(this)
        this["addCircle"] = this["addCircle"].bind(this)
        this["addRect"] = this["addRect"].bind(this)
        this["addRoundedFrame"] = this["addRoundedFrame"].bind(this)
        this["addTubeRect"] = this["addTubeRect"].bind(this)
        this["addTube"] = this["addTube"].bind(this)
        this["addPipe"] = this["addPipe"].bind(this)
        this["addNumber"] = this["addNumber"].bind(this)
        this["quad"] = this["quad"].bind(this)
        this["circle"] = this["circle"].bind(this)
        this["rect"] = this["rect"].bind(this)
        this["crect"] = this["crect"].bind(this)
        this["int"] = this["int"].bind(this)
        this["number"] = this["number"].bind(this)
        return gee.__super__.constructor.apply(this, arguments)
    }

    gee.prototype["number"] = function (px, py, number, prop = {})
    {
        if (Number.isInteger(number))
        {
            return this.int(px,py,number,prop)
        }
        else
        {
            return this.int(px,py,parseInt(number),prop)
        }
    }

    gee.prototype["int"] = function (px, py, number, prop = {})
    {
        var n, ni, ns, xoff, xs, _25_16_, _27_25_

        ns = `${number}`
        n = ns.length - 1
        prop.sx = ((_25_16_=prop.sx) != null ? _25_16_ : 1)
        prop.sx *= 3 / 4
        xs = (((_27_25_=prop.scale) != null ? _27_25_ : 1)) * prop.sx * 0.8
        xoff = ((function ()
        {
            switch (prop.align)
            {
                case 'left':
                    return 0

                case 'right':
                    return -n * xs

                default:
                    return -n * xs / 2
            }

        }).bind(this))()
        for (var _a_ = ni = 0, _b_ = n; (_a_ <= _b_ ? ni <= n : ni >= n); (_a_ <= _b_ ? ++ni : --ni))
        {
            this.quad(xoff + px + ni * xs,py,this.numberUV[ns[ni]],prop)
        }
    }

    gee.prototype["crect"] = function (px, py, prop = {})
    {
        return this.quad(px,py,this.quadUV,prop)
    }

    gee.prototype["rect"] = function (x1, y1, x2, y2, prop = {})
    {
        return this.quad((x1 + x2) / 2,(y1 + y2) / 2,this.quadUV,prop)
    }

    gee.prototype["circle"] = function (px, py, prop)
    {
        return this.quad(px,py,this.circleUV,prop)
    }

    gee.prototype["quad"] = function (px, py, uv, prop = {})
    {
        var color, layer, rot, scale, sx, sy, _50_24_, _51_24_, _52_27_, _53_27_, _54_27_, _55_25_

        sx = ((_50_24_=prop.sx) != null ? _50_24_ : 1)
        sy = ((_51_24_=prop.sy) != null ? _51_24_ : 1)
        color = ((_52_27_=prop.color) != null ? _52_27_ : [1,1,1,1])
        scale = ((_53_27_=prop.scale) != null ? _53_27_ : 1)
        layer = ((_54_27_=prop.layer) != null ? _54_27_ : 0)
        rot = ((_55_25_=prop.rot) != null ? _55_25_ : 0)
        return this.addQuad(px,py,sx,sy,color,uv,rot,layer,scale)
    }

    gee.prototype["addNumber"] = function (px, py, sz, number, color = [1,1,1,1], layer = 0)
    {
        var n, ni

        n = Math.ceil(Math.log10(number))
        for (var _a_ = ni = 0, _b_ = n; (_a_ <= _b_ ? ni <= n : ni >= n); (_a_ <= _b_ ? ++ni : --ni))
        {
            this.addQuad(px + ni * sz,py,1,1,color,this.numberUV[1],0,layer,sz)
        }
    }

    gee.prototype["addPipe"] = function (x1, y1, x2, y2, sz, color, layer = 0)
    {
        this.addCircle(x1,y1,sz,color,layer)
        this.addCircle(x2,y2,sz,color,layer)
        if (y1 === y2)
        {
            return this.addRect(x1,y1 - sz / 2,x2,y2 + sz / 2,color,layer)
        }
    }

    gee.prototype["addTube"] = function (px, py, ti, tt, color, layer = 0, scale = 1)
    {
        return this.addQuad(px,py,1,1,color,this.tubeUV[ti][tt],0,layer,scale)
    }

    gee.prototype["addTubeRect"] = function (x1, y1, x2, y2, ti, color, layer = 0)
    {
        var _a_ = [_k_.min(x1,x2),_k_.max(x1,x2)]; x1 = _a_[0]; x2 = _a_[1]

        var _b_ = [_k_.min(y1,y2),_k_.max(y1,y2)]; y1 = _b_[0]; y2 = _b_[1]

        this.addTube(x2,y2,ti,1,color,layer)
        this.addTube(x2,y1,ti,3,color,layer)
        this.addTube(x1,y1,ti,4,color,layer)
        this.addTube(x1,y2,ti,5,color,layer)
        this.addQuad((x1 + x2) / 2,y1,x2 - x1 - 1,1,color,this.tubeUV[ti][0],0,layer)
        this.addQuad((x1 + x2) / 2,y2,x2 - x1 - 1,1,color,this.tubeUV[ti][0],0,layer)
        this.addQuad(x1,(y1 + y2) / 2,1,y2 - y1 - 1,color,this.tubeUV[ti][2],0,layer)
        return this.addQuad(x2,(y1 + y2) / 2,1,y2 - y1 - 1,color,this.tubeUV[ti][2],0,layer)
    }

    gee.prototype["addRoundedFrame"] = function (x1, y1, x2, y2, color, layer = 0, radius = 1, ti = 4)
    {
        var scale

        scale = 1 / radius
        var _a_ = [_k_.min(x1,x2),_k_.max(x1,x2)]; x1 = _a_[0]; x2 = _a_[1]

        var _b_ = [_k_.min(y1,y2),_k_.max(y1,y2)]; y1 = _b_[0]; y2 = _b_[1]

        this.addTube(x2,y2,ti,1,color,layer,radius)
        this.addTube(x2,y1,ti,3,color,layer,radius)
        this.addTube(x1,y1,ti,4,color,layer,radius)
        this.addTube(x1,y2,ti,5,color,layer,radius)
        this.addQuad((x1 + x2) / 2,y1,scale * (x2 - x1 - radius),1,color,this.tubeUV[ti][0],0,layer,radius)
        this.addQuad((x1 + x2) / 2,y2,scale * (x2 - x1 - radius),1,color,this.tubeUV[ti][0],0,layer,radius)
        this.addQuad(x1,(y1 + y2) / 2,1,scale * (y2 - y1 - radius),color,this.tubeUV[ti][2],0,layer,radius)
        return this.addQuad(x2,(y1 + y2) / 2,1,scale * (y2 - y1 - radius),color,this.tubeUV[ti][2],0,layer,radius)
    }

    gee.prototype["addRect"] = function (x1, y1, x2, y2, color, layer = 0)
    {
        var cx, cy, sx, sy

        var _a_ = [_k_.min(x1,x2),_k_.max(x1,x2)]; x1 = _a_[0]; x2 = _a_[1]

        var _b_ = [_k_.min(y1,y2),_k_.max(y1,y2)]; y1 = _b_[0]; y2 = _b_[1]

        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        sx = x2 - x1
        sy = y2 - y1
        return this.addQuad(cx,cy,sx,sy,color,this.quadUV,0,layer)
    }

    gee.prototype["addCircle"] = function (px, py, sz, color, layer = 0)
    {
        return this.addQuad(px,py,sz,sz,color,this.circleUV,0,layer)
    }

    gee.prototype["addQuad"] = function (px, py, sx, sy, color, uv, rot = 0, layer = 0, scale = 1)
    {
        var p

        if (this.numQuads[layer] >= this.quadsPerLayer)
        {
            return
        }
        p = (this.layerStart[layer] + this.numQuads[layer]) * this.quadDataLength
        this.data[p++] = px
        this.data[p++] = py
        this.data[p++] = scale * sx
        this.data[p++] = scale * sy
        this.data[p++] = color[0]
        this.data[p++] = color[1]
        this.data[p++] = color[2]
        this.data[p++] = color[3]
        this.data[p++] = uv[0]
        this.data[p++] = uv[1]
        this.data[p++] = uv[2]
        this.data[p++] = uv[3]
        this.data[p++] = rot
        return this.numQuads[layer]++
    }

    return gee
})()

export default gee;
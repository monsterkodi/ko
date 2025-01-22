var _k_ = {max: function () { var m = -Infinity; for (var a of arguments) { if (Array.isArray(a)) {m = _k_.max.apply(_k_.max,[m].concat(a))} else {var n = parseFloat(a); if(!isNaN(n)){m = n > m ? n : m}}}; return m }, clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var Gyroid

import kxk from "../kxk.js"
let fade = kxk.fade

import material from "./lib/material.js"

import noise from "./lib/noise.js"
let simplex3 = noise.simplex3

import * as three from 'three'
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'

Gyroid = (function ()
{
    function Gyroid (scene)
    {
        this.scene = scene
    
        this["initGyroidSphere"] = this["initGyroidSphere"].bind(this)
        this["initMarchingCubes"] = this["initMarchingCubes"].bind(this)
        this["start"] = this["start"].bind(this)
        this.num = 11
        this.skin = 0.7
        this.resolution = 80
        this.initMarchingCubes()
    }

    Gyroid.prototype["start"] = function ()
    {
        return this.initMarchingCubes()
    }

    Gyroid.prototype["initMarchingCubes"] = function ()
    {
        var enableColors, enableUvs, mat, maxPolyCount

        if (this.mc)
        {
            this.mc.removeFromParent()
        }
        mat = material.vertex
        enableUvs = false
        enableColors = true
        maxPolyCount = 500000
        this.mc = new MarchingCubes(this.resolution,mat,enableUvs,enableColors,maxPolyCount)
        this.mc.isolation = 1
        this.mc.scale.set(50,50,50)
        this.mc.receiveShadow = true
        this.mc.castShadow = true
        this.scene.scene.add(this.mc)
        this.sampler = new MeshSurfaceSampler(this.mc)
        return this.initGyroidSphere()
    }

    Gyroid.prototype["initGyroidSphere"] = function ()
    {
        var b, beta, cx, cy, cz, ff, fo, fv, g, gyroid, nx, ny, nz, r, rf, rx, ry, rz, ss, x, y, yn, z

        gyroid = function (x, y, z)
        {
            return Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x)
        }
        this.mc.reset()
        for (var _a_ = x = 0, _b_ = this.resolution; (_a_ <= _b_ ? x < this.resolution : x > this.resolution); (_a_ <= _b_ ? ++x : --x))
        {
            for (var _c_ = y = 0, _d_ = this.resolution; (_c_ <= _d_ ? y < this.resolution : y > this.resolution); (_c_ <= _d_ ? ++y : --y))
            {
                for (var _e_ = z = 0, _f_ = this.resolution; (_e_ <= _f_ ? z < this.resolution : z > this.resolution); (_e_ <= _f_ ? ++z : --z))
                {
                    rf = Math.sqrt((x / this.resolution - 0.5) * (x / this.resolution - 0.5) + (y / this.resolution - 0.5) * (y / this.resolution - 0.5) + (z / this.resolution - 0.5) * (z / this.resolution - 0.5))
                    ff = 1 - 1.41 * rf
                    ss = this.resolution / (Math.PI * this.num)
                    nx = x / ss
                    ny = y / ss
                    nz = z / ss
                    cx = nx - 0.5
                    cy = ny - 0.5
                    cz = nz - 0.5
                    fo = Math.sqrt(cx * cx + cz * cz)
                    beta = fo * 0.01
                    rx = cx * Math.cos(beta) - cz * Math.sin(beta)
                    ry = cy
                    rz = cx * Math.sin(beta) + cz * Math.cos(beta)
                    nx = rx + 0.5
                    ny = ry + 0.5
                    nz = rz + 0.5
                    if (rf < 0.5)
                    {
                        fo = 0.08
                        fv = fade(1,0,_k_.max(0,rf - (0.5 - fo)) / fo)
                        this.mc.setCell(x,y,z,Math.max(0,fv * this.skin * (gyroid(nx,ny,nz) + 1)))
                    }
                    else
                    {
                        this.mc.setCell(x,y,z,0)
                    }
                    yn = y / this.resolution
                    b = ff * ff
                    b = b * b * b
                    b = _k_.clamp(0,1,b)
                    ss = 0.8 * this.resolution
                    r = 4 * Math.max(0,simplex3(x / ss,y / ss,z / ss) + 0.05)
                    r = r * r * b
                    g = r / 2
                    this.mc.setColor(x,y,z,r,g,Math.max(0,b - r))
                }
            }
        }
        this.mc.update()
        return this.sampler.build()
    }

    Gyroid.prototype["color"] = function (pos, color)
    {
        var c

        c = this.getColor(pos)
        color.set(c[0],c[1],c[2])
        return color
    }

    Gyroid.prototype["getColor"] = function (pos)
    {
        var b, c1, c2, cx, cy, cz, g, lerp, r, x, y, z

        cx = pos.x + this.resolution / 2
        cy = pos.y + this.resolution / 2
        cz = pos.z + this.resolution / 2
        x = _k_.clamp(0,this.resolution - 1,Math.floor(cx))
        y = _k_.clamp(0,this.resolution - 1,Math.floor(cy))
        z = _k_.clamp(0,this.resolution - 1,Math.floor(cz))
        c1 = this.mc.getColor(x,y,z)
        x = _k_.clamp(0,this.resolution - 1,Math.ceil(cx))
        y = _k_.clamp(0,this.resolution - 1,Math.ceil(cy))
        z = _k_.clamp(0,this.resolution - 1,Math.ceil(cz))
        c2 = this.mc.getColor(x,y,z)
        lerp = function (a, b, t)
        {
            return a + (b - a) * t
        }
        r = lerp(c1[0],c2[0],cx - Math.floor(cx))
        g = lerp(c1[1],c2[1],cy - Math.floor(cy))
        b = lerp(c1[2],c2[2],cz - Math.floor(cz))
        return [r,g,b]
    }

    return Gyroid
})()

export default Gyroid;
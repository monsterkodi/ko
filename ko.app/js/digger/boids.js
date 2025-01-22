var Boids

import * as three from 'three'
import kxk from "../kxk.js"
let rad2deg = kxk.rad2deg
let deg2rad = kxk.deg2rad

import geom from "./lib/geom.js"


Boids = (function ()
{
    function Boids (scene, player, gyroid)
    {
        var sphere

        this.scene = scene
        this.player = player
        this.gyroid = gyroid
    
        sphere = geom.sphere({radius:0.2,sgmt:6,material:'flatwhite'})
        this.m4 = new three.Matrix4
        this.pos = new three.Vector3
        this.rot = new three.Quaternion
        this.scl = new three.Vector3
        this.count = 10000
        this.statiks = {}
        this.init('unitScale',three.Vector3,function (v)
        {
            return v.set(1,1,1)
        })
        this.init('unitX',three.Vector3,function (v)
        {
            return v.set(1,0,0)
        })
        this.mesh = new three.InstancedMesh(sphere.geometry,sphere.material,this.count)
        this.mesh.instanceMatrix.setUsage(three.DynamicDrawUsage)
        this.scene.scene.add(this.mesh)
    }

    Boids.prototype["init"] = function (name, clss, cb)
    {
        this.statik(name,clss)
        return cb(this.statiks[name])
    }

    Boids.prototype["statik"] = function (name, clss)
    {
        var _39_23_

        this.statiks[name] = ((_39_23_=this.statiks[name]) != null ? _39_23_ : new clss)
        return this.statiks[name]
    }

    Boids.prototype["posAt"] = function (i, p)
    {
        var boid

        if (boid = this.boids[i])
        {
            p.copy(boid.n)
            p.multiplyScalar(boid.d)
        }
        return p
    }

    Boids.prototype["matrixAt"] = function (i, m)
    {
        var p

        p = this.statik('matrixAt.pos',three.Vector3)
        m.compose(this.posAt(i,p),this.boids[i].q,this.statiks.unitScale)
        return m
    }

    Boids.prototype["spawn"] = function ()
    {
        var c, d, f, i, n, p, q, t

        this.boids = []
        p = this.statik('spawn.pos',three.Vector3)
        t = this.statik('spawn.norm',three.Vector3)
        f = this.statik('spawn.color',three.Color)
        i = 0
        while (i < this.count)
        {
            this.gyroid.sampler.sample(p,t)
            p.multiplyScalar(50)
            d = p.length()
            if (d < 20)
            {
                continue
            }
            this.gyroid.color(p,f)
            if (Math.random() < f.b * 50)
            {
                continue
            }
            if (f.r > 0.0)
            {
                continue
            }
            p.normalize()
            if (Math.random() > t.dot(p))
            {
                continue
            }
            if (t.dot(p) < 0.5)
            {
                continue
            }
            q = new three.Quaternion
            c = new three.Color
            n = new three.Vector3
            n.copy(p)
            c.copy(f)
            c.multiplyScalar(200)
            q.setFromUnitVectors(this.statiks.unitX,n)
            this.boids.push({q:q,n:n,d:d,r:0,c:c})
            this.mesh.setColorAt(i,c)
            this.mesh.setMatrixAt(i,this.matrixAt(i,this.m4))
            i++
        }
        this.mesh.instanceMatrix.needsUpdate = true
        return this.mesh.instanceColor.needsUpdate = true
    }

    Boids.prototype["rotToAt"] = function (i, tgt, angle, offset)
    {
        var axis, boid, rot

        if (boid = this.boids[i])
        {
            rot = this.statik('rotToAt.rot',three.Quaternion)
            axis = this.statik('rotToAt.axis',three.Vector3)
            axis.crossVectors(boid.n,tgt)
            rot.setFromAxisAngle(axis,angle)
            this.posAt(i,offset)
            offset.applyQuaternion(rot)
        }
        return this
    }

    Boids.prototype["update"] = function (deltaSec, timeMs)
    {
        var ang, color, cs, dot, i, playerNorm, playerOffset, scale

        color = this.statik('update.color',three.Color)
        scale = this.statik('update.scale',three.Vector3)
        playerOffset = this.statik('update.playerOffset',three.Vector3)
        playerNorm = this.statik('update.playerNorm',three.Vector3)
        playerNorm.copy(this.player.mesh.position)
        playerNorm.normalize()
        for (var _a_ = i = 0, _b_ = this.count; (_a_ <= _b_ ? i < this.count : i > this.count); (_a_ <= _b_ ? ++i : --i))
        {
            dot = playerNorm.dot(this.boids[i].n)
            ang = rad2deg(Math.acos(dot))
            color.copy(this.boids[i].c)
            cs = ang < 10 ? (2 - ang / 10) : ang < 20 ? (1 - ang / 20) + 0.02 : 0.02 * (1 - (ang - 20) / 70)
            color.multiplyScalar(cs)
            this.mesh.setColorAt(i,color)
            if (ang < 10)
            {
                this.rotToAt(i,playerNorm,-deg2rad((1 - ang / 10) * 20),playerOffset)
                this.m4.compose(playerOffset,this.boids[i].q,this.statiks.unitScale)
                this.mesh.setMatrixAt(i,this.m4)
            }
            else
            {
                this.mesh.setMatrixAt(i,this.matrixAt(i,this.m4))
            }
        }
        this.mesh.instanceMatrix.needsUpdate = true
        return this.mesh.instanceColor.needsUpdate = true
    }

    return Boids
})()

export default Boids;
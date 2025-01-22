var Polar, tqt, unitX, unitY, unitZ, v0, v1, v2, v3, v4, v5, v6, vec

import * as three from 'three'
import kxk from "../../kxk.js"
let deg2rad = kxk.deg2rad
let rad2deg = kxk.rad2deg

import quat from "./quat.js"

vec = new three.Vector3
v0 = new three.Vector3
v1 = new three.Vector3
v2 = new three.Vector3
v3 = new three.Vector3
v4 = new three.Vector3
v5 = new three.Vector3
v6 = new three.Vector3
tqt = new three.Quaternion
unitX = new three.Vector3(1,0,0)
unitY = new three.Vector3(0,1,0)
unitZ = new three.Vector3(0,0,1)

Polar = (function ()
{
    Polar["zero"] = new Polar()
    Polar["pole"] = unitX
    function Polar (cfg = {})
    {
        var _42_25_

        this.quat = ((function ()
        {
            switch (cfg.dir)
            {
                case '-x':
                    return new quat(new three.Vector3(-1,0,0))

                case '-y':
                    return new quat(new three.Vector3(0,-1,0))

                case '-z':
                    return new quat(new three.Vector3(0,0,-1))

                case 'x':
                    return new quat(new three.Vector3(1,0,0))

                case 'y':
                    return new quat(new three.Vector3(0,1,0))

                default:
                    return new quat(new three.Vector3(0,0,1))
            }

        }).bind(this))()
        this.dist = ((_42_25_=cfg.dist) != null ? _42_25_ : 1)
        this.tgt = new three.Vector3
    }

    Polar.prototype["rotAxis"] = function (deg, axis)
    {
        tqt.setFromAxisAngle(axis,deg2rad(deg))
        this.quat.multiply(tqt)
        return this.quat.normalize()
    }

    Polar.prototype["rotU"] = function (deg)
    {
        return this.rotAxis(deg,unitY)
    }

    Polar.prototype["rotV"] = function (deg)
    {
        return this.rotAxis(deg,unitZ)
    }

    Polar.prototype["slerp"] = function (o, t)
    {
        return this.quat.slerp(o.quat,t)
    }

    Polar.prototype["target"] = function (p, deltaSec)
    {
        this.tgt.copy(p)
        v4.copy(p).normalize()
        v5.copy(this.pos()).normalize()
        v6.crossVectors(v5,v4)
        if (v6.length() < 0.00001)
        {
            return
        }
        v6.normalize()
        tqt.setFromAxisAngle(v6,deltaSec * 0.4)
        this.quat.premultiply(tqt)
        return this.quat.normalize()
    }

    Polar.prototype["orient"] = function (q)
    {
        var p

        p = this.pos()
        v1.subVectors(this.tgt,p).normalize()
        p.normalize()
        v0.crossVectors(p,v1)
        v0.normalize()
        v1.crossVectors(v0,p)
        q.setFromUnitVectors(unitY,v1)
        return q.normalize()
    }

    Polar.prototype["up"] = function ()
    {
        v2.copy(unitY).applyQuaternion(this.quat)
        return v2
    }

    Polar.prototype["pos"] = function ()
    {
        v3.copy(Polar.pole)
        v3.applyQuaternion(this.quat)
        v3.multiplyScalar(this.dist)
        return v3
    }

    return Polar
})()

export default Polar;
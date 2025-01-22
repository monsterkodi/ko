var _k_ = {clamp: function (l,h,v) { var ll = Math.min(l,h), hh = Math.max(l,h); if (!_k_.isNum(v)) { v = ll }; if (v < ll) { v = ll }; if (v > hh) { v = hh }; if (!_k_.isNum(v)) { v = ll }; return v }, isNum: function (o) {return !isNaN(o) && !isNaN(parseFloat(o)) && (isFinite(o) || o === Infinity || o === -Infinity)}}

var Camera, np, rv

import * as three from 'three'
import kxk from "../kxk.js"
let deg2rad = kxk.deg2rad

import polar from "./lib/polar.js"

np = new three.Vector3()
rv = new three.Vector3()

Camera = (function ()
{
    function Camera (scene, player)
    {
        this.scene = scene
        this.player = player
    
        this.start()
    }

    Camera.prototype["start"] = function ()
    {
        this.polar = new polar({dist:150})
        return this.scene.camera.up.set(0,1,0)
    }

    Camera.prototype["update"] = function (deltaSec)
    {
        this.polar.slerp(this.player.polar,this.player.speed * deltaSec)
        this.scene.camera.position.copy(this.polar.pos())
        np.copy(this.scene.camera.position).normalize()
        rv.crossVectors(this.scene.camera.up,np)
        rv.normalize()
        this.scene.camera.up.crossVectors(np,rv)
        rv.set(0,1,0).applyMatrix4(this.scene.camera.matrixWorld)
        rv.normalize()
        this.scene.camera.up.lerp(rv,this.player.speed * deltaSec)
        this.scene.camera.up.normalize()
        return this.scene.camera.lookAt(0,0,0)
    }

    Camera.prototype["zoom"] = function (delta)
    {
        return this.polar.dist = _k_.clamp(80,160,this.polar.dist * (1.0 - delta / 100))
    }

    return Camera
})()

export default Camera;
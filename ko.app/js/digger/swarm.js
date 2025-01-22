var Swarm

import * as three from 'three'
import hash from "./hash.js"

import geom from "./lib/geom.js"


Swarm = (function ()
{
    function Swarm (scene, player)
    {
        var i, ra, sphere

        this.scene = scene
        this.player = player
    
        this.count = 500
        sphere = geom.sphere({radius:0.5,sgmt:6,material:'flatwhite'})
        this.dummy = new three.Object3D()
        this.color = new three.Color()
        this.playerPos = new three.Vector3()
        this.pos = new three.Vector3()
        this.norm = new three.Vector3()
        this.orig = new three.Vector3()
        this.rot = new three.Quaternion()
        this.rotd = new three.Quaternion()
        this.scale = new three.Vector3()
        this.mesh = new three.InstancedMesh(sphere.geometry,sphere.material,this.count)
        this.mesh.instanceMatrix.setUsage(three.DynamicDrawUsage)
        this.mesh.castShadow = true
        this.scene.scene.add(this.mesh)
        this.hash = new hash(this.scene)
        this.rotAxis = []
        this.rotAngle = []
        for (var _a_ = i = 0, _b_ = this.count; (_a_ <= _b_ ? i < this.count : i > this.count); (_a_ <= _b_ ? ++i : --i))
        {
            ra = new three.Vector3
            ra.randomDirection()
            this.rotAxis.push(ra)
            this.rotAngle.push(0.01 + Math.random() * 0.05)
        }
    }

    Swarm.prototype["spawn"] = function ()
    {
        var i

        this.scale.set(1,1,1)
        this.orig.set(0,0,0)
        i = 0
        while (i < this.count)
        {
            this.pos.randomDirection()
            this.pos.projectOnPlane(this.rotAxis[i])
            this.pos.normalize()
            this.rot.setFromAxisAngle(this.pos,0)
            this.pos.multiplyScalar(50)
            this.dummy.matrix.compose(this.pos,this.rot,this.scale)
            this.mesh.setMatrixAt(i,this.dummy.matrix)
            this.color.set(0,0,1)
            this.mesh.setColorAt(i,this.color)
            i++
        }
        this.mesh.instanceMatrix.needsUpdate = true
        return this.mesh.instanceColor.needsUpdate = true
    }

    Swarm.prototype["update"] = function (deltaSec)
    {
        var dot, dtn, i

        this.playerPos.copy(this.player.mesh.position)
        this.playerPos.normalize()
        for (var _a_ = i = 0, _b_ = this.count; (_a_ <= _b_ ? i < this.count : i > this.count); (_a_ <= _b_ ? ++i : --i))
        {
            this.mesh.getMatrixAt(i,this.dummy.matrix)
            this.dummy.matrix.decompose(this.pos,this.rot,this.scale)
            if (1)
            {
                this.rotd.setFromAxisAngle(this.rotAxis[i],this.rotAngle[i] * deltaSec)
                this.pos.applyQuaternion(this.rotd)
                this.rot.multiply(this.rotd)
                this.rot.normalize()
            }
            this.norm.copy(this.pos)
            this.norm.normalize()
            dtn = this.playerPos.dot(this.norm)
            if (dtn > 0.98)
            {
                this.rotAxis[i].lerp(this.norm.cross(this.playerPos),dtn * dtn * dtn)
                this.rotAxis[i].normalize()
                this.rotd.setFromAxisAngle(this.rotAxis[i],deltaSec * 0.5)
                this.pos.applyQuaternion(this.rotd)
                this.rot.multiply(this.rotd)
                this.rot.normalize()
            }
            dot = Math.max(0,dtn - 0.7)
            dot = dot * dot
            if (dot > 0.0897)
            {
                this.player.eat++
                this.pos.multiplyScalar(-1)
                this.scale.set(0,0,0)
            }
            if (dtn > 0.98)
            {
                this.color.set(0.36,0.36,0)
            }
            else
            {
                this.color.set(dot,dot,0)
            }
            this.mesh.setColorAt(i,this.color)
            this.dummy.matrix.compose(this.pos,this.rot,this.scale)
            this.mesh.setMatrixAt(i,this.dummy.matrix)
        }
        this.mesh.instanceMatrix.needsUpdate = true
        return this.mesh.instanceColor.needsUpdate = true
    }

    return Swarm
})()

export default Swarm;
var Weed

import * as three from 'three'
import geom from "./lib/geom.js"


Weed = (function ()
{
    function Weed (scene, gyroid)
    {
        var cylinder

        this.scene = scene
        this.gyroid = gyroid
    
        this.count = 1000
        cylinder = geom.cylinder({length:4,radius:0.5,sgmt:6,material:'white'})
        this.dummy = new three.Object3D()
        this.color = new three.Color()
        this.pos = new three.Vector3()
        this.norm = new three.Vector3()
        this.rot = new three.Quaternion()
        this.scale = new three.Vector3()
        this.mesh = new three.InstancedMesh(cylinder.geometry,cylinder.material,this.count)
        this.mesh.instanceMatrix.setUsage(three.StaticDrawUsage)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.scene.scene.add(this.mesh)
    }

    Weed.prototype["spawn"] = function ()
    {
        var color, i

        i = 0
        while (i < this.count)
        {
            this.gyroid.sampler.sample(this.pos,this.norm)
            this.pos.multiplyScalar(50)
            if (this.pos.length() < 40)
            {
                continue
            }
            this.dummy.position.copy(this.pos)
            this.pos.normalize()
            if (this.norm.dot(this.pos) < 0.7)
            {
                continue
            }
            this.norm.multiplyScalar(-1)
            this.norm.add(this.dummy.position)
            color = this.gyroid.getColor(this.dummy.position)
            if (Math.random() < color[0] * 50 + color[2] * 50)
            {
                this.dummy.lookAt(this.norm)
                this.dummy.updateMatrix()
                this.mesh.setMatrixAt(i,this.dummy.matrix)
                this.color.set(color[0],color[1],color[2])
                this.mesh.setColorAt(i,this.color)
                i++
            }
        }
        this.mesh.instanceMatrix.needsUpdate = true
        return this.mesh.instanceColor.needsUpdate = true
    }

    Weed.prototype["update"] = function (deltaSec, timeMs)
    {
        var color, f, i

        for (var _a_ = i = 0, _b_ = this.count; (_a_ <= _b_ ? i < this.count : i > this.count); (_a_ <= _b_ ? ++i : --i))
        {
            this.mesh.getMatrixAt(i,this.dummy.matrix)
            this.dummy.matrix.decompose(this.pos,this.rot,this.scale)
            color = this.gyroid.getColor(this.pos)
            this.color.set(color[0],color[1],color[2])
            f = (Math.sin(timeMs * 1000 / (2000 - (color[0] + color[2]) * 900)) + 1.2) * 2
            this.color.multiplyScalar(6 * f)
            this.mesh.setColorAt(i,this.color)
            this.scale.set(1,1,0.1 + color[0] * 90 * f)
            this.dummy.matrix.compose(this.pos,this.rot,this.scale)
            this.mesh.setMatrixAt(i,this.dummy.matrix)
        }
        this.mesh.instanceMatrix.needsUpdate = true
        return this.mesh.instanceColor.needsUpdate = true
    }

    return Weed
})()

export default Weed;
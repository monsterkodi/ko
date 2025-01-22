var COS45, Hash

import * as three from 'three'
import geom from "./lib/geom.js"

import material from "./lib/material.js"

COS45 = 0.7071067811865476

Hash = (function ()
{
    function Hash (scene)
    {
        var ctr, eul, euler, eulers, geo, i, icosa, lines, mat, pc, points, posattr, quat, tri, u, v

        this.scene = scene
    
        icosa = geom.icosa({radius:50,material:'debugblue',detail:0})
        icosa.renderOrder = 100
        posattr = icosa.geometry.getAttribute('position')
        ctr = new three.Vector3
        tri = new three.Triangle
        points = []
        eulers = []
        quat = new three.Quaternion
        for (var _a_ = i = 0, _b_ = posattr.count / 3; (_a_ <= _b_ ? i < posattr.count / 3 : i > posattr.count / 3); (_a_ <= _b_ ? ++i : --i))
        {
            tri.a.set(posattr.getX(i * 3),posattr.getY(i * 3),posattr.getZ(i * 3,i))
            tri.b.set(posattr.getX(i * 3 + 1),posattr.getY(i * 3 + 1),posattr.getZ(i * 3 + 1))
            tri.c.set(posattr.getX(i * 3 + 2),posattr.getY(i * 3 + 2),posattr.getZ(i * 3 + 2))
            pc = new three.Vector3
            tri.getMidpoint(pc)
            points.push(ctr)
            points.push(pc)
            quat.set(pc.x,pc.y,pc.z,0)
            quat.normalize()
            eul = new three.Euler
            eul.setFromQuaternion(quat)
            eulers.push(eul)
        }
        points = []
        euler = new three.Euler
        for (u = 0; u < 8; u++)
        {
            for (v = 0; v <= 2; v++)
            {
                euler.set(0,(u / 8) * Math.PI * 2,((v - 1) / 4) * Math.PI,'XYZ')
                pc = new three.Vector3(50,0,0)
                pc.applyEuler(euler)
                points.push(ctr)
                points.push(pc)
            }
        }
        mat = material['linered']
        geo = new three.BufferGeometry
        geo.setFromPoints(points)
        lines = new three.LineSegments(geo,mat)
        lines.renderOrder = 1000
    }

    Hash["normal"] = function (n)
    {
        if (n.x > COS45)
        {
            return 'e'
        }
        else if (n.x < -COS45)
        {
            return 'w'
        }
        else if (n.y > COS45)
        {
            return 'n'
        }
        else if (n.y < -COS45)
        {
            return 's'
        }
        else if (n.z > COS45)
        {
            return 'f'
        }
        else if (n.z < -COS45)
        {
            return 'b'
        }
        else if (n.x > Math.max(n.y,n.z))
        {
            return 'e'
        }
        else if (n.y > Math.max(n.x,n.y))
        {
            return 'n'
        }
        else if (n.z > Math.max(n.x,n.y))
        {
            return 'f'
        }
        else if (n.x < Math.min(n.y,n.z))
        {
            return 'w'
        }
        else if (n.y < Math.min(n.x,n.y))
        {
            return 's'
        }
        else if (n.z < Math.min(n.x,n.y))
        {
            return 'b'
        }
        else
        {
            return '?'
        }
    }

    return Hash
})()

export default Hash;
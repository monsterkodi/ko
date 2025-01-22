var _k_ = {isStr: function (o) {return typeof o === 'string' || o instanceof String}}

var Geom

import * as three from 'three'
import material from "./material.js"


Geom = (function ()
{
    function Geom ()
    {}

    Geom["pill"] = function (cfg = {})
    {
        var bot, group, l, mat, mid, r, s, top, _17_23_, _18_23_, _19_21_, _27_27_

        l = ((_17_23_=cfg.length) != null ? _17_23_ : 1)
        r = ((_18_23_=cfg.radius) != null ? _18_23_ : 0.5)
        s = ((_19_21_=cfg.sgmt) != null ? _19_21_ : 8)
        top = new three.SphereGeometry(r,s,s / 2,0,2 * Math.PI,0,Math.PI / 2)
        top.translate(0,l / 2,0)
        mid = new three.CylinderGeometry(r,r,l,s,1,true)
        bot = new three.SphereGeometry(r,s,s / 2,0,2 * Math.PI,Math.PI / 2,Math.PI / 2)
        bot.translate(0,-l / 2,0)
        mat = ((_27_27_=cfg.material) != null ? _27_27_ : new three.MeshStandardMaterial)
        if (_k_.isStr(mat))
        {
            mat = material[mat]
        }
        group = new three.Group
        group.add(new three.Mesh(top,mat))
        group.add(new three.Mesh(mid,mat))
        group.add(new three.Mesh(bot,mat))
        if (cfg.pos)
        {
            group.translateX(cfg.pos.x)
            group.translateY(cfg.pos.y)
            group.translateZ(cfg.pos.z)
        }
        return group
    }

    Geom["cylinder"] = function (cfg = {})
    {
        var geom, height, radius, sgmt, _50_28_, _50_41_, _51_28_, _52_26_

        height = ((_50_28_=cfg.height) != null ? _50_28_ : ((_50_41_=cfg.length) != null ? _50_41_ : 1))
        radius = ((_51_28_=cfg.radius) != null ? _51_28_ : 0.5)
        sgmt = ((_52_26_=cfg.sgmt) != null ? _52_26_ : 24)
        geom = new three.CylinderGeometry(radius,radius,height,sgmt)
        if (cfg.length)
        {
            geom.translate(0,-cfg.length / 2,0)
            geom.rotateX(Math.PI / 2)
        }
        return Geom.mesh(cfg,geom)
    }

    Geom["sphere"] = function (cfg = {})
    {
        var geom, radius, sgmt, _70_28_, _71_26_

        radius = ((_70_28_=cfg.radius) != null ? _70_28_ : 1)
        sgmt = ((_71_26_=cfg.sgmt) != null ? _71_26_ : 16)
        geom = new three.SphereGeometry(radius,sgmt,sgmt)
        geom.rotateX(Math.PI / 2)
        return Geom.mesh(cfg,geom)
    }

    Geom["icosa"] = function (cfg = {})
    {
        var detail, geom, radius, _87_28_, _88_28_

        radius = ((_87_28_=cfg.radius) != null ? _87_28_ : 1)
        detail = ((_88_28_=cfg.detail) != null ? _88_28_ : 1)
        geom = new three.IcosahedronGeometry(radius,detail)
        return Geom.mesh(cfg,geom)
    }

    Geom["mesh"] = function (cfg, geom)
    {
        var mat, mesh, _104_27_

        mat = ((_104_27_=cfg.material) != null ? _104_27_ : new three.MeshStandardMaterial)
        if (_k_.isStr(mat))
        {
            mat = material[mat]
        }
        mesh = new three.Mesh(geom,mat)
        if (cfg.pos)
        {
            mesh.translateX(cfg.pos.x)
            mesh.translateY(cfg.pos.y)
            mesh.translateZ(cfg.pos.z)
        }
        return mesh
    }

    return Geom
})()

export default Geom;
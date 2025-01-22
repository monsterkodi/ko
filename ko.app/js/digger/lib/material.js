var mat, Material

import * as three from 'three'

mat = function (cfg)
{
    var clss

    clss = ((function ()
    {
        switch (cfg.typ)
        {
            case 'lambert':
                return three.MeshLambertMaterial

            case 'line':
                return three.LineBasicMaterial

            case 'basic':
                return three.MeshBasicMaterial

            case 'shadow':
                return three.ShadowMaterial

            case 'toon':
                return three.MeshToonMaterial

            default:
                return three.MeshStandardMaterial
        }

    }).bind(this))()
    delete cfg.typ
    return new clss(cfg)
}

Material = (function ()
{
    function Material ()
    {}

    Material["transparent"] = mat({color:0x888888,typ:'lambert',depthWrite:false,transparent:true,opacity:0.1})
    Material["flat"] = mat({color:0xffffff,metalness:0.5,roughness:0.7,flatShading:true,dithering:true})
    Material["toon"] = mat({color:0x110000,typ:'toon',dithering:true})
    Material["white"] = mat({color:0xffffff,typ:'lambert',dithering:true})
    Material["player"] = mat({color:0x666666,typ:'lambert',dithering:true})
    Material["vertex"] = mat({color:0xffffff,typ:'lambert',dithering:true,vertexColors:true})
    Material["flatwhite"] = mat({color:0xffffff,typ:'lambert',flatShading:true,dithering:true})
    Material["shinyblack"] = mat({color:0x000000,metalness:0.6,roughness:0.1,flatShading:true})
    Material["shinyblue"] = mat({color:0x000088,metalness:0.6,roughness:0.5,flatShading:true,emissive:0x4444ff})
    Material["shinyred"] = mat({color:0x330000,metalness:0.6,roughness:0.5,flatShading:true})
    Material["shinywhite"] = mat({color:0xffffff,metalness:0.6,roughness:0.5,flatShading:true})
    Material["wireframe"] = mat({color:0xffffff,typ:'basic',wireframe:true})
    Material["debugred"] = mat({color:0xff0000,typ:'basic',wireframe:true,depthTest:false})
    Material["debugblue"] = mat({color:0x0000ff,typ:'basic',wireframe:true,depthTest:false})
    Material["linered"] = mat({color:0xff0000,typ:'line',depthTest:false})
    Material["setWire"] = function (wire)
    {
        var k, m

        for (k in Material)
        {
            m = Material[k]
            if (m instanceof three.Material)
            {
                m.wireframe = wire
            }
        }
    }

    Material["toggleWire"] = function ()
    {
        return Material.setWire(!Material.getWire())
    }

    Material["setFlat"] = function (flat)
    {
        var k, m

        for (k in Material)
        {
            m = Material[k]
            if (m instanceof three.Material)
            {
                m.flatShading = flat
                m.needsUpdate = true
            }
        }
    }

    Material["toggleFlat"] = function ()
    {
        return Material.setFlat(!Material.getFlat())
    }

    return Material
})()

export default Material;
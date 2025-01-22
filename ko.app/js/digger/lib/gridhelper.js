import * as three from 'three'
class GridHelper extends three.LineSegments
{
    constructor (size = 600)
    {
        var c, c1, c2, c3, c4, color, colors, geom, halfSize, i, j, material, vertices

        c1 = new three.Color(0x000000)
        c2 = new three.Color(0x303030)
        c3 = new three.Color(0x383838)
        c4 = new three.Color(0x404040)
        halfSize = size / 2
        vertices = []
        colors = []
        j = 0
        for (var _a_ = i = -halfSize, _b_ = halfSize; (_a_ <= _b_ ? i < halfSize : i > halfSize); (_a_ <= _b_ ? ++i : --i))
        {
            vertices.push(-halfSize,0,i,halfSize,0,i)
            vertices.push(i,0,-halfSize,i,0,halfSize)
            color = (i === 0 ? c1 : ((i % 12 === 0) ? c2 : ((i % 6 === 0) ? c3 : c4)))
            for (c = 0; c < 4; c++)
            {
                color.toArray(colors,j)
                j += 3
            }
        }
        geom = new three.BufferGeometry()
        geom.setAttribute('position',new three.Float32BufferAttribute(vertices,3))
        geom.setAttribute('color',new three.Float32BufferAttribute(colors,3))
        material = new three.LineBasicMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-1.0})
        super(geom,material)
    }

    dispose ()
    {
        this.geometry.dispose()
        return this.material.dispose()
    }
}

export default GridHelper;
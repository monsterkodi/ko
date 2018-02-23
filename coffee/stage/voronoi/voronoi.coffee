
# 000   000   0000000   00000000    0000000   000   000   0000000   000
# 000   000  000   000  000   000  000   000  0000  000  000   000  000
#  000 000   000   000  0000000    000   000  000 0 000  000   000  000
#    000     000   000  000   000  000   000  000  0000  000   000  000
#     0       0000000   000   000   0000000   000   000   0000000   000

{ rad2deg, log } = require 'kxk'

Stage  = require '../stage'
snap   = require './snap.svg'
vorono = require './voronoinet'

class Voronoi extends Stage
    
    constructor: (view) ->
        super view
        
        @s = new snap()
        @view.appendChild @s.node
        @s.attr
            id:       'net'
            overflow: 'visible'
            viewBox:  '-100 -100 200 200'
        
        @stepID = 0
                            
        @bgCircle = @s.circle()
        @bgCircle.attr 
            id:          'bg'
            overflow:    'visible'
            transform:   'translate(-100, -100)'
            r:           65
            cx:          100
            cy:          100
            
        @poly = @s.group()            
        @dots = @s.group()
        
        @voronoi = new vorono()
        @resized @view.clientWidth, @view.clientHeight
                
        @net = []
        for i in [0...100]

            r = Math.random()*255
            n = 
                x: Math.random() * 200 - 100
                y: Math.random() * 200 - 100
                c: "#333"# Snap.rgb(r, 0, 255-r)
                r: 2 #+ Math.random() * 2
            @net.push n
            
            dot = @s.circle()
            dot.drag @onDrag, @onDragStart, @onDragEnd
            dot.attr
                fill: n.c
                r:    n.r
                cx:   n.x
                cy:   n.y
                id:   i
                opacity: 0
            @dots.add dot

        @lins = @s.group()
        for i in [0...@net.length*6]
            lin = @s.line()
            lin.attr
                stroke:      '#000'
                strokeWidth: 0.4
            @lins.add lin

        for i in [0...@net.length]
            pol = @s.polygon()
            pol.attr
                id: i
                fill:    '#500'
                opacity: 0.8
            pol.drag @onDrag, @onDragStart, @onDragEnd
            @poly.add pol
            
        @animate()
        
    #   00000000    0000000   000      000   000   0000000    0000000   000   000
    #   000   000  000   000  000       000 000   000        000   000  0000  000
    #   00000000   000   000  000        00000    000  0000  000   000  000 0 000
    #   000        000   000  000         000     000   000  000   000  000  0000
    #   000         0000000   0000000     000      0000000    0000000   000   000
    
    polygonCoordinatesForCell: (c) ->
        el = []
        for e in c.halfedges
            el.push [[e.edge.va.x, e.edge.va.y], [e.edge.vb.x, e.edge.vb.y]]
        if el.length <= 0
            return []
        cl = []
        wc = 0
        cw = el.length*el.length
        eps = 0.00001
        [cv, ov] = el.shift()
        cl.push cv[0], cv[1]
        while el.length
            for e in el
                if (Math.abs(e[0][0] - cv[0]) < eps) and (Math.abs(e[0][1] - cv[1]) < eps)
                    [ov, cv] = el.splice(el.indexOf(e), 1)[0]
                    cl.push cv[0], cv[1]
                    break
                else if (Math.abs(e[1][0] - cv[0]) < eps) and (Math.abs(e[1][1] - cv[1]) < eps)
                    [cv, ov] = el.splice(el.indexOf(e), 1)[0]
                    cl.push cv[0], cv[1]
                    break
                else 
                    wc += 1
                    if wc > cw
                        log 'wtf'
                        return []
        cl
            
    #0000000    00000000    0000000    0000000 
    #000   000  000   000  000   000  000      
    #000   000  0000000    000000000  000  0000
    #000   000  000   000  000   000  000   000
    #0000000    000   000  000   000   0000000 
        
    onDrag:  (dx, dy, x, y, event) => 
        if @dragDot?            
            m = @bgCircle.transform().diffMatrix.invert()
            i = parseInt @dragDot.attr('id')
            @setPos i, m.x(x,y), m.y(x,y)
        
    setPos: (i, x, y) =>
        @needsRedraw = true
        @net[i].x = x
        @net[i].y = y
        @dots[i].attr
            cx: x
            cy: y
        
    onDragStart: (x, y, event) => @dragDot = Snap(event.target)
    onDragEnd:   (x, y, event) => @dragDot = null

    # 0000000   0000000   000       0000000
    #000       000   000  000      000     
    #000       000000000  000      000     
    #000       000   000  000      000     
    # 0000000  000   000  0000000   0000000

    calc: () =>
        
        for n in @net
            continue if @dragDot? and @net.indexOf(n) == parseInt @dragDot.attr 'id'
            r = n.x*n.x+n.y*n.y
            if r > @bgCircle.attr('r') * @bgCircle.attr('r')
                @setPos @net.indexOf(n), n.x * 0.95, n.y * 0.95
    
        return if not @needsRedraw
        @needsRedraw = false
        
        diagram = @voronoi.compute @net, @bbox

        for i in [0...diagram.edges.length]
            e = diagram.edges[i]
            @lins[i].attr
                x1: e.va.x
                y1: e.va.y
                x2: e.vb.x
                y2: e.vb.y
                opacity: 0
            
        for i in [0...diagram.cells.length]
            c = diagram.cells[i]
            cl = @polygonCoordinatesForCell c
            p = @poly[i]
            p.attr 
                points: cl
                fill: Snap.rgb 255-255*i/diagram.cells.length, 0, 0
                                                    
    #000       0000000   000   000   0000000   000   000  000000000
    #000      000   000   000 000   000   000  000   000     000   
    #000      000000000    00000    000   000  000   000     000   
    #000      000   000     000     000   000  000   000     000   
    #0000000  000   000     000      0000000    0000000      000   

    resized: (w, h) =>
        @needsRedraw = true
        @bbox = 
            xl: -100 * w / h
            xr:  100 * w / h
            yt: -100
            yb:  100
                
    # 0000000  000000000  00000000  00000000 
    #000          000     000       000   000
    #0000000      000     0000000   00000000 
    #     000     000     000       000      
    #0000000      000     00000000  000      
    
    animationStep: (step) -> 
        @stepID += 1
        if (@stepID % 4) == 0
            @calc()
    
    reset: ->
        @s.node.style.display = 'initial'
        @resume()
        
    stop: ->
        @s.node.style.display = 'none'
        @pause()
        
module.exports = Voronoi
    

#   00000000  00000000    0000000
#   000       000   000  000     
#   000000    00000000   0000000 
#   000       000             000
#   000       000        0000000 
{
clamp,
log,
$}  = require 'kxk'
now = require 'performance-now'

class FPS

    constructor: () ->
                    
        @elem = document.createElement 'div'
        @elem.className = 'fps'
        @elem.style.display = 'none'

        @canvas = document.createElement 'canvas'
        @canvas.className = "fpsCanvas"
        @canvas.height = 30*2
        @canvas.width = 130*2
        @elem.appendChild @canvas

        y = parseInt  -30/2
        x = parseInt -130/2
        t = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        @canvas.style.transform = t
        
        @history = []
        @last = now()
            
        $('commandline-span').appendChild @elem
        window.requestAnimationFrame @draw
            
    # 0000000    00000000    0000000   000   000
    # 000   000  000   000  000   000  000 0 000
    # 000   000  0000000    000000000  000000000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000  00     00
                
    draw: =>
        time = now()
        @history.push time-@last
        @history.shift() while @history.length > 260
        @canvas.height = @canvas.height
        ctx = @canvas.getContext '2d'        
        for i in [0...@history.length]  
            ms = Math.max 0, @history[i]-17
            red = parseInt 32 + (255-32)*clamp 0,1, (ms-16)/16
            green = parseInt 32 + (255-32)*clamp 0,1, (ms-32)/32
            ctx.fillStyle = "rgb(#{red}, #{green}, 32)"
            h = Math.min ms, 60
            ctx.fillRect 260-@history.length+i, 60-h, 2, h
        @last = time
        window.requestAnimationFrame @draw

    toggle: -> 
        @elem.style.display = @elem.style.display == 'none' and 'unset' or 'none'       
        @history.push 49
        window.setState 'fps', @elem.style.display != 'none' 

module.exports = FPS


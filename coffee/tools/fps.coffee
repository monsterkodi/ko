###
00000000  00000000    0000000
000       000   000  000     
000000    00000000   0000000 
000       000             000
000       000        0000000 
###

{ clamp, post, elem, $ } = require 'kxk'

now = require('perf_hooks').performance.now

class FPS

    constructor: () ->
                    
        @elem = elem class: 'fps'
        @elem.style.display = 'none'

        @canvas = elem 'canvas', class: "fpsCanvas", width: 130*2, height: 30*2
        @elem.appendChild @canvas

        y = parseInt  -30/2
        x = parseInt -130/2
        @canvas.style.transform = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        
        @history = []
        @last = now()
        
        $('commandline-span').appendChild @elem
        
        post.on 'stash',   @stash
        post.on 'restore', @restore
            
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
            ms    = Math.max 0, @history[i]-17
            red   = parseInt 32 + 223 * clamp 0,1, (ms-16)/16
            green = parseInt 32 + 223 * clamp 0,1, (ms-32)/32
            ctx.fillStyle = "rgb(#{red}, #{green}, 32)"
            h = Math.min ms, 60
            ctx.fillRect 260-@history.length+i, 60-h, 2, h
        @last = time
        if @elem.style.display != 'none'
            window.requestAnimationFrame @draw

    visible: -> @elem.style.display != 'none'

    restore: => @toggle() if window.stash.get 'fps'
    stash:   => if @visible() then window.stash.set('fps', true) else window.stash.set 'fps'

    toggle: -> 
        
        @elem.style.display = @visible() and 'none' or 'unset'       
        @history.push 49
        if @visible()
            window.requestAnimationFrame @draw
        @stash()

module.exports = FPS


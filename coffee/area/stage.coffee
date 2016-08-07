#  0000000  000000000   0000000    0000000   00000000
# 000          000     000   000  000        000     
# 0000000      000     000000000  000  0000  0000000 
#      000     000     000   000  000   000  000     
# 0000000      000     000   000   0000000   00000000

class Stage
    
    constructor: (@view) -> 
        @paused = false
    
    start: => @animate()
    
    pause: =>
        @paused = true
        
    resume: =>
        @paused = false
    
    animate: =>
        requestAnimationFrame @animate
        secs  = 1.0/60.0
        if not @paused
            step = 
                delta: secs*1000
                dsecs: secs
            @animationStep step
        
module.exports = Stage

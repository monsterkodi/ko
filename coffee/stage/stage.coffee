###
 0000000  000000000   0000000    0000000   00000000
000          000     000   000  000        000     
0000000      000     000000000  000  0000  0000000 
     000     000     000   000  000   000  000     
0000000      000     000   000   0000000   00000000
###

{ keyinfo } = require 'kxk' 

event = require 'events'

class Stage extends event
    
    constructor: (view) -> 
        
        super()
        
        @view = view
        @paused = false
        @view.onkeydown = @onKeyDown
        @view.onkeyup   = @onKeyUp
    
    start: => @animate()
    pause: => @paused = true
    resume: => @paused = false
    
    animate: =>
        
        requestAnimationFrame @animate
        secs  = 1.0/60.0
        if not @paused
            step = 
                delta: secs*1000
                dsecs: secs
            @animationStep step

    onKeyDown: (event) =>
        
        {mod, key, combo} = keyinfo.forEvent event
        return if not combo
        return if key == 'right click' # weird right command key
        @modKeyComboEventDown? mod, key, combo, event
   
    onKeyUp: (event) =>
        
        {mod, key, combo} = keyinfo.forEvent event        
        return if not combo
        return if key == 'right click' # weird right command key
        @modKeyComboEventUp? mod, key, combo, event
        
module.exports = Stage

# 000   000   0000000   000   000  0000000    000      00000000
# 000   000  000   000  0000  000  000   000  000      000     
# 000000000  000000000  000 0 000  000   000  000      0000000 
# 000   000  000   000  000  0000  000   000  000      000     
# 000   000  000   000  000   000  0000000    0000000  00000000

{ elem, drag 
} = require 'kxk'

class Handle
    
    constructor: (opt) ->
        
        @[k] = v for k,v of opt
        
        @div = elem class: @flex.handleClass
        @div.style.cursor = @flex.cursor
        @div.style.display = 'block'
        @flex.view.insertBefore @div, @paneb.div
        @update()
        
        @drag = new drag
            target:  @div
            onStart: @onStart
            onMove:  @onDrag
            onStop:  @onStop
            cursor:  @flex.cursor
            
    del:       -> @div?.remove(); delete @div
    size:      -> @isVisible() and @flex.handleSize or 0
    pos:       -> parseInt @flex.posOfPane(@index+1) - @flex.handleSize
    actualPos: -> @flex.pane(@index+1).actualPos() - @flex.handleSize
    update:    -> @div.style.flex = "0 0 #{@size()}px"
    isVisible: -> not (@panea.collapsed and @paneb.collapsed)

    onStart:    => @flex.handleStart @
    onDrag: (d) => @flex.handleDrag @, d
    onStop:     => @flex.handleEnd @

module.exports = Handle

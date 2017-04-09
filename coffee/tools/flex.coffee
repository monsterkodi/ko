# 00000000  000      00000000  000   000    
# 000       000      000        000 000     
# 000000    000      0000000     00000      
# 000       000      000        000 000     
# 000       0000000  00000000  000   000    
{
drag,
log,
$} = require 'kxk'
_  = require 'lodash'

# 000   000   0000000   000   000  0000000    000      00000000  
# 000   000  000   000  0000  000  000   000  000      000       
# 000000000  000000000  000 0 000  000   000  000      0000000   
# 000   000  000   000  000  0000  000   000  000      000       
# 000   000  000   000  000   000  0000000    0000000  00000000  

class Handle
    
    constructor: (opt) ->
        
        for k,v of opt
            @[k] = v
        
        @div = document.createElement 'div' 
        @div.className = @flex.handleClass
        @div.style.cursor = @flex.cursor
        @div.style.flexBasis = "#{@flex.handleSize}px"
        @flex.parent.insertBefore @div, @b
        
        @drag = new drag
            target:  @div
            onStart: @onStart
            onMove:  @onDrag
            onEnd:   @onEnd
            cursor:  @flex.cursor

    onStart: =>
        
        @flex.calculateSizes @
        @flex.onDragStart?()
        
    onDrag: (d, e) =>
        
        offset = e[@flex.clientAxis] - @start
        snapOffset = @flex.snapOffset
        
        if offset <= @aMin + snapOffset + @ahandleSize
            offset = @aMin + @ahandleSize
        else if offset >= @size - (@bMin +  snapOffset + @bhandleSize)
            offset = @size - (@bMin + @bhandleSize)
             
        offset = offset - 0.5

        log "drag offset: #{offset}"
         
        @flex.adjust @, offset
        @flex.onDrag?()
        
    onEnd: => @flex.onDragEnd?()

# 00000000  000      00000000  000   000  
# 000       000      000        000 000   
# 000000    000      0000000     00000    
# 000       000      000        000 000   
# 000       0000000  00000000  000   000  

class Flex 
    
    constructor: (ids, opt) ->
        
        @panes   = ids.map (i) -> $ i
        @handles = []
        
        @parent  = @panes[0].parentNode
        @parent.style.display = 'flex'

        @handleSize  = opt.handleSize ? 6
        @snapOffset  = opt.snapOffset ? 30
        @direction   = opt.direction ? 'horizontal'
        @onDragStart = opt.onDragStart
        @onDragEnd   = opt.onDragEnd
        @onDrag      = opt.onDrag
    
        if @direction == 'horizontal'
            @dimension        = 'width'
            @clientDimension  = 'clientWidth'
            @clientAxis       = 'clientX'
            @position         = 'left'
            @handleClass      = 'split-handle split-handle-horizontal'
            @paddingA         = 'paddingLeft'
            @paddingB         = 'paddingRight'
            @cursor  = opt.cursor ? 'ew-resize'
            @parent.style.flexDirection = 'row'
            
        if @direction == 'vertical'
            @dimension        = 'height'
            @clientDimension  = 'clientHeight'
            @clientAxis       = 'clientY'
            @position         = 'top'
            @handleClass      = 'split-handle split-handle-vertical'
            @paddingA         = 'paddingTop'
            @paddingB         = 'paddingBottom'
            @cursor  = opt.cursor ? 'ns-resize'
            @parent.style.flexDirection = 'column'
    
        if not _.isArray @sizes = opt.sizes
            percent = 100 / @panes.length
            @sizes = []
            for i in [0...@panes.length]
                @sizes.push percent
    
        if not _.isArray @minSize = opt.minSize
            @minSize  = []
            for i in [0...@panes.length]
                @minSize.push 0
            
        for i in [0...@panes.length]

            isFirst    = i == 1
            isLast     = i == @panes.length - 1
            
            size       = @sizes[i]
            handleSize = @handleSize
            
            @panes[i].style.display = 'flex'
            @panes[i].style.flex    = "1 1 auto"
            # flex                0 0 commandlineHeight

            if i > 0
                handle = new Handle
                    flex:        @
                    a:           @panes[i - 1] 
                    b:           @panes[i]
                    aMin:        @minSize[i - 1]
                    bMin:        @minSize[i]
                    isFirst:     isFirst
                    isLast:      isLast
                    ahandleSize: isFirst and handleSize / 2 or handleSize
                    bhandleSize: isLast  and handleSize / 2 or handleSize
    
                @handles.push handle
    
            @setElementSize @panes[i], size, (i == 0 or i == @panes.length - 1) and handleSize / 2 or handleSize
                
    adjust: (handle, offset) ->
        @setElementSize handle.a, offset / handle.size * handle.percentage, handle.ahandleSize
        @setElementSize handle.b, handle.percentage - (offset / handle.size * handle.percentage), handle.bhandleSize

    setElementSize: (el, size, handleSize) -> el.style.flexBasis = "calc(#{size}% - #{handleSize}px)"
        
    calculateSizes: (handle) ->

        parentStyle = window.getComputedStyle @parent 
        parentSize  = @parent[@clientDimension] - parseFloat(parentStyle[@paddingA]) - parseFloat(parentStyle[@paddingB])
        
        handle.size       = handle.a.getBoundingClientRect()[@dimension] + handle.b.getBoundingClientRect()[@dimension] + handle.ahandleSize + handle.bhandleSize
        handle.percentage = Math.min(handle.size / parentSize * 100, 100)
        handle.start      = handle.a.getBoundingClientRect()[@position]
        log 'calculateSizes', handle
        
    setSizes: (sizes) ->
        for i in [1...sizes.length]
            handle = @handles[i - 1]
            @setElementSize handle.a, sizes[i - 1], handle.ahandleSize
            @setElementSize handle.b, sizes[i],     handle.bhandleSize
                
    getSizes: ->
        sizes = []
        for i in [0...@handles.length]
            handle = @handles[i]
            parentStyle = window.getComputedStyle @parent 
            parentSize = @parent[@clientDimension] - parseFloat(parentStyle[@paddingA]) - parseFloat(parentStyle[@paddingB])
            sizes.push (handle.a.getBoundingClientRect()[@dimension] + handle.ahandleSize) / parentSize * 100
            if i == @handles.length - 1
                sizes.push (handle.b.getBoundingClientRect()[@dimension] + handle.bhandleSize) / parentSize * 100
        # log 'getSizes', sizes
        sizes
        
    collapse: (i) ->
        if i == @handles.length
            handle = @handles[i - 1]
            @calculateSizes handle
            @adjust handle, handle.size - handle.bhandleSize
        else
            handle = @handles[i]
            @calculateSizes handle
            @adjust handle, handle.ahandleSize

module.exports = Flex

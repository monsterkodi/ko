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
        @flex.parent.insertBefore @div, @paneb.div
        
        @drag = new drag
            target:  @div
            onStart: @onStart
            onMove:  @onDrag
            onEnd:   @onEnd
            cursor:  @flex.cursor

    onStart: =>
        @start = @panea.div.getBoundingClientRect()[@flex.position]
        @flex.onDragStart?()
        
    onDrag: (d, e) =>
        log 'onDrag', d.delta
        @flex.moveHandle @, d.delta[@flex.axis]
        @flex.onDrag?()
        
    onEnd: => @flex.onDragEnd?()

# 00000000  000      00000000  000   000  
# 000       000      000        000 000   
# 000000    000      0000000     00000    
# 000       000      000        000 000   
# 000       0000000  00000000  000   000  

class Flex 
    
    constructor: (opt) ->
        
        @panes   = opt.panes
        @handles = []

        numPanes = @panes.length
        
        for p in @panes
            p.minSize ?= p.fixed ? 0
            p.size    ?= p.fixed 
            p.id      ?= p.div.id ? "pane#{@panes.indexOf p}"
            
        log "Flex.constructor numPanes:#{numPanes} panes:", @panes
        
        @parent  = @panes[0].div.parentNode
        @parent.style.display = 'flex'

        @handleSize  = opt.handleSize ? 6
        @snapOffset  = opt.snapOffset ? 30
        @direction   = opt.direction ? 'horizontal'
        @onDragStart = opt.onDragStart
        @onDragEnd   = opt.onDragEnd
        @onDrag      = opt.onDrag
    
        horz = @direction == 'horizontal'

        @dimension   = horz and 'width' or 'height'
        @clientDim   = horz and 'clientWidth' or 'clientHeight'
        @clientAxis  = horz and 'clientX' or 'clientY'
        @axis        = horz and 'x' or 'y'
        @position    = horz and 'left' or 'top'
        @handleClass = horz and 'split-handle split-handle-horizontal' or 'split-handle split-handle-vertical'
        @paddingA    = horz and 'paddingLeft' or 'paddingTop'
        @paddingB    = horz and 'paddingRight' or 'paddingBottom'
        @cursor = opt.cursor ? horz and 'ew-resize' or 'ns-resize'
        @parent.style.flexDirection = horz and 'row' or 'column'
            
        for i in [0...numPanes]

            @panes[i].div.style.display = 'flex'
            @panes[i].div.style.flex = @panes[i].fixed? and "0 0 #{@panes[i].fixed}px" or "1 1 auto"

            if i > 0
                handle = new Handle
                    flex:  @
                    index: i-1
                    panea: @panes[i-1]
                    paneb: @panes[i]
    
                @handles.push handle
            
            @setPaneSize @panes[i], @panes[i].size ? 0
          
        @calculateSizes()

    resized: -> @calculateSizes()
    calculateSizes: ->
        visPanes  = @panes.filter (p) -> not p.collapsed
        flexPanes = visPanes.filter (p) -> not p.fixed
        
        log "calculateSizes vis: #{visPanes.length} flex: #{flexPanes.length}"
        
        avail = @parentSize() - (visPanes.length-1) * @handleSize
        
        for p in @panes
            avail -= p.size
            
        diff = avail / flexPanes.length
        log "calculateSizes avail:#{@parentSize()} left: #{avail} diff: #{diff}"
        
        for p in flexPanes
            p.size += diff
            
        for p in @panes            
            @setPaneSize p, p.size

    parentSize: ->
        cs = window.getComputedStyle @parent 
        @parent[@clientDim] - parseFloat(cs[@paddingA]) - parseFloat(cs[@paddingB])

    prevVisFlex: (handle) -> not handle.panea.collapsed and not handle.panea.fixed and handle.panea or handle.index > 0 and @prevVisFlex(@handles[handle.index-1]) or null
    nextVisFlex: (handle) -> not handle.paneb.collapsed and not handle.paneb.fixed and handle.paneb or handle.index < @handles.length-1 and @nextVisFlex(@handles[handle.index+1]) or null
    prevFlex:    (handle) -> not handle.panea.fixed and handle.panea or handle.index > 0 and @prevFlex(@handles[handle.index-1]) or null
    nextFlex:    (handle) -> not handle.paneb.fixed and handle.paneb or handle.index < @handles.length-1 and @nextFlex(@handles[handle.index+1]) or null
    
    moveHandle: (handle, offset=0) ->
        prev  = @prevVisFlex handle
        prev ?= @prevFlex handle
        next  = @nextVisFlex handle  
        next ?= @nextFlex handle
        prev.collapsed = false
        next.collapsed = false
        prevSize = prev.size + offset
        nextSize = next.size - offset
        if prevSize < @snapOffset
            if prevSize < 0 or offset < 0
                prevSize = 0
                nextSize = next.size + prev.size
                prev.collapsed = true
        else if nextSize < @snapOffset
            if nextSize < 0 or offset > 0
                prevSize = prev.size + next.size
                nextSize = 0
                next.collapsed = true
        @setPaneSize prev, prevSize
        @setPaneSize next, nextSize

    setPaneSize: (pane, size) -> 
        pane.size = size
        pane.div.style.flexBasis = "#{size}px"
        log "Flex.setPaneSize pane:", pane
    
    posAtIndex: (i) -> @panes[i+1].div.getBoundingClientRect()[@position]
    getSizes: -> ( p.div.getBoundingClientRect()[@dimension] for p in @panes )
        
    collapse: (i) -> 
        @panes[i].collapsed = true
        @calculateSizes()

module.exports = Flex

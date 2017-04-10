# 00000000  000      00000000  000   000    
# 000       000      000        000 000     
# 000000    000      0000000     00000      
# 000       000      000        000 000     
# 000       0000000  00000000  000   000    
{
clamp,
drag,
error,
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
        
        @[k] = v for k,v of opt
        
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
        
    onDrag: (d, e) => @flex.moveHandle @, d.delta[@flex.axis]
        
    onEnd: => @flex.handleEnd @

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
        @onPaneSize  = opt.onPaneSize
    
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
        avail     = @parentSize() - (visPanes.length-1) * @handleSize
        
        for p in @panes
            avail -= p.size
            
        diff = avail / flexPanes.length
        
        for p in flexPanes
            p.size += diff
            
        for p in @panes            
            @setPaneSize p, p.size

    parentSize: ->
        cs = window.getComputedStyle @parent 
        @parent[@clientDim] - parseFloat(cs[@paddingA]) - parseFloat(cs[@paddingB])

    prevVisFlex: (h) -> not h.panea.collapsed and not h.panea.fixed and h.panea or h.index > 0 and @prevVisFlex(@handles[h.index-1]) or null
    nextVisFlex: (h) -> not h.paneb.collapsed and not h.paneb.fixed and h.paneb or h.index < @handles.length-1 and @nextVisFlex(@handles[h.index+1]) or null
    prevFlex:    (h) -> not h.panea.fixed and h.panea or h.index > 0 and @prevFlex(@handles[h.index-1]) or null
    nextFlex:    (h) -> not h.paneb.fixed and h.paneb or h.index < @handles.length-1 and @nextFlex(@handles[h.index+1]) or null
    
    moveHandle: (handle, offset=0) ->
        prev  = @prevVisFlex(handle) ? @prevFlex handle
        next  = @nextVisFlex(handle) ? @nextFlex handle
        delete prev.collapsed
        delete next.collapsed
        prevSize = prev.size + offset
        nextSize = next.size - offset
        if prevSize < @snapOffset
            if prevSize < 0 or offset < 0
                prevSize = 0
                nextSize = next.size + prev.size
        else if nextSize < @snapOffset
            if nextSize < 0 or offset > 0
                prevSize = prev.size + next.size
                nextSize = 0
        @setPaneSize prev, prevSize
        @setPaneSize next, nextSize
        @onDrag?()

    handleEnd: (handle) ->
        for p in @panes
            if p.size <= 0
                p.collapsed = true
            else
                delete p.collapsed
        @onDragEnd?()

    setPaneSize: (pane, size) -> 
        pane.size = Math.max 0, size
        pane.div.style.flexBasis = "#{size}px"
        @onPaneSize? pane.id
    
    handlePositions: -> ( @positionOfHandleAtIndex(i) for i in [0...@handles.length] )
    positionOfHandleAtIndex: (i) -> 
        p = @parent.getBoundingClientRect()[@position]
        r = @panes[i+1].div.getBoundingClientRect()[@position]
        r - p - @handleSize
        
    getSizes: -> ( p.div.getBoundingClientRect()[@dimension] for p in @panes )
        
    paneIndex: (i) -> 
        if _.isNumber i
            clamp 0, @panes.length-1, i
        else
            @panes.indexOf _.find @panes, (p) -> p.id == i
                           
    #  0000000   0000000   000      000       0000000   00000000    0000000  00000000  
    # 000       000   000  000      000      000   000  000   000  000       000       
    # 000       000   000  000      000      000000000  00000000   0000000   0000000   
    # 000       000   000  000      000      000   000  000             000  000       
    #  0000000   0000000   0000000  0000000  000   000  000        0000000   00000000  
    
    isCollapsed: (i) -> @panes[@paneIndex i].collapsed
    collapse: (i) -> 
        pane = @panes[@paneIndex i]
        if not pane.collapsed
            pane.collapsed = true
            pane.size = 0
            @calculateSizes()
        
    expand: (i) ->
        i = @paneIndex i
        pane = @panes[i]
        if pane.collapsed
            delete pane.collapsed
            flex = @closestVisFlex pane
            if flex
                use = pane.fixed ? flex.size / 2
                flex.size -= use
                pane.size = use
                @calculateSizes()
            else
                error 'NO EXPAND PANE?'

    closestVisFlex: (p) ->
        d = 1
        pi = @panes.indexOf p
        
        isVisFlexPane = (i) =>
            if i >= 0 and i < @panes.length
                if not @panes[i].collapsed and not @panes[i].fixed
                    return true 
            
        while d < @panes.length-1
            if isVisFlexPane pi + d
                return @panes[pi + d]
            else if isVisFlexPane pi - d
                return @panes[pi - d]
            d++
        
module.exports = Flex

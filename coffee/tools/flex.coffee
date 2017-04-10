# 00000000  000      00000000  000   000
# 000       000      000        000 000 
# 000000    000      0000000     00000  
# 000       000      000        000 000 
# 000       0000000  00000000  000   000
{
clamp, drag, def,
error, log,
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
        @div.style.display = 'flex'
        @flex.parent.insertBefore @div, @paneb.div
        @update()
        
        @drag = new drag
            target:  @div
            onStart: @onStart
            onMove:  @onDrag
            onStop:  @onStop
            cursor:  @flex.cursor

    size: -> @isVisible() and @flex.handleSize or 0
    update: -> @div.style.flexBasis = "#{@size()}px"
    isVisible: -> not (@panea.collapsed and @paneb.collapsed)

    onStart: =>
        @start = @panea.div.getBoundingClientRect()[@flex.position]
        @flex.onDragStart?()
        
    onDrag: (d, e) => @flex.handleDrag @, d
        
    onStop: => @flex.handleEnd @

# 00000000    0000000   000   000  00000000
# 000   000  000   000  0000  000  000     
# 00000000   000000000  000 0 000  0000000 
# 000        000   000  000  0000  000     
# 000        000   000  000   000  00000000

class Pane
    
    constructor: (opt) ->
        @[k] = v for k,v of opt
            
        @size    ?= @fixed 
        @id      ?= @div.id ? "pane"
    
    update: -> 
        @size = Math.max 0, @size
        if @size == 0
            @collapsed = true
        else
            delete @collapsed
        @div.style.display = @isVisible() and 'flex' or 'none'
        @div.style.flex = @fixed and "0 0 #{@fixed}px" or @size and "1 1 #{@size}px" or "1 1 auto"

    setSize: (size) ->
        @size = Math.max 0, size
        @update()
    
    collapse:  -> @size = 0; @update()
    expand:    -> @size = @fixed ? 1; @update()
    isVisible: -> not @collapsed
    pos: -> 
        p = @div.parentNode.getBoundingClientRect()[@flex.position]
        r = @div.getBoundingClientRect()[@flex.position]
        r - p

# 00000000  000      00000000  000   000  
# 000       000      000        000 000   
# 000000    000      0000000     00000    
# 000       000      000        000 000   
# 000       0000000  00000000  000   000  

class Flex 
    
    constructor: (opt) ->
        
        @panes   = ( new Pane def p, flex:@ for p in opt.panes )
        @handles = []
        
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
            
        for p in @panes
            p.index = @panes.indexOf p
            if p.index < @panes.length-1
                @handles.push new Handle
                    flex:  @
                    index: p.index
                    panea: p
                    paneb: @panes[p.index+1]
            @setPaneSize p, p.fixed ? p.size ? 0
          
        @calculate()
        @updatePanes()

    #  0000000   0000000   000       0000000  
    # 000       000   000  000      000       
    # 000       000000000  000      000       
    # 000       000   000  000      000       
    #  0000000  000   000  0000000   0000000  
    
    resized: -> 
        @update()
        @calculate()
        
    calculate: ->
        visPanes  = @panes.filter (p) -> not p.collapsed
        flexPanes = visPanes.filter (p) -> not p.fixed
        avail     = @parentSize()
        
        for h in @handles
            h.update() 
            avail -= h.size()
            
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
    
    moveHandle: (opt) ->
        

    handleDrag: (handle, drag) ->
        offset = drag.delta[@axis]
        
        prev  = @prevAllInv(handle) ? @prevVisFlex(handle) ? @prevFlex handle
        next  = @nextAllInv(handle) ? @nextVisFlex(handle) ? @nextFlex handle
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
        @update()
        @onDrag?()

    handleEnd: () ->
        @update()
        @onDragEnd?()

    update: () -> 
        @updatePanes()
        @updateHandles()
        
    updatePanes:   -> p.update() for p in @panes
    updateHandles: -> h.update() for h in @handles

    setPaneSize: (pane, size) -> 
        pane.setSize size
        @onPaneSize? pane.id
    
    positionOfHandleAtIndex: (i) -> 
        p = @parent.getBoundingClientRect()[@position]
        r = @panes[i+1].div.getBoundingClientRect()[@position]
        r - p - @handleSize
        
    #  0000000   00000000  000000000  
    # 000        000          000     
    # 000  0000  0000000      000     
    # 000   000  000          000     
    #  0000000   00000000     000     
    
    panePositions: -> ( p.pos() for p in @panes )
    paneSizes:     -> ( p.size for p in @panes )
    sizeOfPane:  (i) -> @panes[@paneIndex i].size
    posOfPane:   (i) -> @panes[@paneIndex i].pos()
    posOfHandle: (i) -> @panes[i+1].pos() - @flex.handleSize
        
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
            pane.collapse()
            @calculate()
        
    expand: (i) ->
        i = @paneIndex i
        pane = @panes[i]
        if pane.collapsed
            pane.expand()
            if flex = @closestVisFlex pane
                use = pane.fixed ? flex.size / 2
                flex.size -= use
                pane.size = use
            @calculate()

    # 000   000  000   0000000  00000000  000      00000000  000   000  
    # 000   000  000  000       000       000      000        000 000   
    #  000 000   000  0000000   000000    000      0000000     00000    
    #    000     000       000  000       000      000        000 000   
    #     0      000  0000000   000       0000000  00000000  000   000  
    
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

    travPrev: (h, f) -> f(h) and h.panea or h.index > 0 and @travPrev(@handles[h.index-1], f) or null    
    travNext: (h, f) -> f(h) and h.paneb or h.index < @handles.length-1 and @travNext(@handles[h.index+1], f) or null
    prevVisFlex: (h) -> @travPrev h, (v) -> not v.panea.collapsed and not v.panea.fixed
    nextVisFlex: (h) -> @travNext h, (v) -> not v.paneb.collapsed and not v.paneb.fixed 
    prevFlex:    (h) -> @travPrev h, (v) -> not v.panea.fixed
    nextFlex:    (h) -> @travNext h, (v) -> not v.paneb.fixed 
    prevVis:     (h) -> @travPrev h, (v) -> not v.panea.collapsed 
    nextVis:     (h) -> @travNext h, (v) -> not v.paneb.collapsed 
    prevAllInv:  (h) -> p = not @prevVis(h) and h.panea or null; p?.expand(); p
    nextAllInv:  (h) -> p = not @nextVis(h) and h.paneb or null; p?.expand(); p
        
module.exports = Flex

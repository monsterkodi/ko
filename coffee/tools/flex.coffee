# 000   000   0000000   000   000  0000000    000      00000000
# 000   000  000   000  0000  000  000   000  000      000     
# 000000000  000000000  000 0 000  000   000  000      0000000 
# 000   000  000   000  000  0000  000   000  000      000     
# 000   000  000   000  000   000  0000000    0000000  00000000

{ clamp, elem, drag, def, error, log, $, _} = require 'kxk'

class Handle
    
    constructor: (opt) ->
        
        @[k] = v for k,v of opt
        
        @div = elem class: @flex.handleClass
        @div.style.cursor = @flex.cursor
        @div.style.display = 'flex'
        log "Handle #{@flex.view?} #{@paneb.div?}"
        @flex.view.insertBefore @div, @paneb.div
        @update()
        
        @drag = new drag
            target:  @div
            onStart: @onStart
            onMove:  @onDrag
            onStop:  @onStop
            cursor:  @flex.cursor

    size:      -> @isVisible() and @flex.handleSize or 0
    pos:       -> @flex.posOfPane(@index+1) - @flex.handleSize
    update:    -> @div.style.flex = "0 0 #{@size()}px"
    isVisible: -> not (@panea.collapsed and @paneb.collapsed)

    onStart:    => @flex.handleStart @
    onDrag: (d) => @flex.handleDrag @, d
    onStop:     => @flex.handleEnd @

# 00000000    0000000   000   000  00000000
# 000   000  000   000  0000  000  000     
# 00000000   000000000  000 0 000  0000000 
# 000        000   000  000  0000  000     
# 000        000   000  000   000  00000000

class Pane
    
    constructor: (opt) ->
        @[k] = v for k,v of opt
        @size ?= @fixed ? @min
        @id   ?= @div.id ? "pane"
    
    update: -> 
        @size = Math.max 0, @size
        if @size == 0
            @collapsed = true
        else
            delete @collapsed
        @div.style.display = @isVisible() and 'flex' or 'none'
        @div.style.flex = @fixed and "0 0 #{@fixed}px" or @size? and "1 1 #{@size}px" or "1 1 auto"

    setSize: (@size) -> @update()
    collapse:  -> @size = 0; @update()
    expand:    -> @size = @fixed ? 1; @update()
    isVisible: -> not @collapsed
    pos: -> 
        @div.style.display = 'flex'
        r = @div.getBoundingClientRect()[@flex.position]
        @div.style.display = @isVisible() and 'flex' or 'none'
        r - @flex.pos()

# 00000000  000      00000000  000   000  
# 000       000      000        000 000   
# 000000    000      0000000     00000    
# 000       000      000        000 000   
# 000       0000000  00000000  000   000  

class Flex 
    
    constructor: (opt) ->
        
        @handleSize  = opt.handleSize ? 6
        @snapOffset  = opt.snapOffset ? 20
        @direction   = opt.direction ? 'horizontal'
        @onPaneSize  = opt.onPaneSize
        @onDragStart = opt.onDragStart
        @onDrag      = opt.onDrag
        @onDragEnd   = opt.onDragEnd
    
        horz         = @direction == 'horizontal'
        @dimension   = horz and 'width' or 'height'
        @clientDim   = horz and 'clientWidth' or 'clientHeight'
        @axis        = horz and 'x' or 'y'
        @position    = horz and 'left' or 'top'
        @handleClass = horz and 'split-handle split-handle-horizontal' or 'split-handle split-handle-vertical'
        @paddingA    = horz and 'paddingLeft' or 'paddingTop'
        @paddingB    = horz and 'paddingRight' or 'paddingBottom'
        @cursor = opt.cursor ? horz and 'ew-resize' or 'ns-resize'
        
        @panes   = []
        @handles = []

        @view = opt.panes[0].div.parentNode
        @view.style.display = 'flex'
        @view.style.flexDirection = horz and 'row' or 'column'
        
        @addPane p for p in opt.panes
                    
        for p in @panes
            @setPaneSize p, p.fixed ? p.size ? 0
          
        @calculate()
        @updatePanes()

    #  0000000   0000000    0000000    
    # 000   000  000   000  000   000  
    # 000000000  000   000  000   000  
    # 000   000  000   000  000   000  
    # 000   000  0000000    0000000    
    
    addPane: (p) ->
        log 'flex.addPane', p
        newPane = new Pane _.defaults p, 
            flex:   @ 
            index:  @panes.length
            
        if lastPane = _.last @panes
            @handles.push new Handle
                flex:  @
                index: lastPane.index
                panea: lastPane
                paneb: newPane
            
        @panes.push newPane

    #  0000000   0000000   000       0000000  
    # 000       000   000  000      000       
    # 000       000000000  000      000       
    # 000       000   000  000      000       
    #  0000000  000   000  0000000   0000000  
    
    calculate: ->
        visPanes  = @panes.filter (p) -> not p.collapsed
        flexPanes = visPanes.filter (p) -> not p.fixed
        avail     = @size()
        
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
    
    # 00     00   0000000   000   000  00000000  
    # 000   000  000   000  000   000  000       
    # 000000000  000   000   000 000   0000000   
    # 000 0 000  000   000     000     000       
    # 000   000   0000000       0      00000000  

    moveHandle: (opt) -> 
        handle = @handles[opt.index]
        @moveHandleToPos handle, opt.pos        
    
    moveHandleToPos: (handle, pos) ->
        offset = pos - handle.pos()
        prev  = @prevAllInv(handle) ? @prevVisFlex(handle) ? @prevFlex handle
        next  = @nextAllInv(handle) ? @nextVisFlex(handle) ? @nextFlex handle
        delete prev.collapsed
        delete next.collapsed
        prevSize = prev.size + offset
        nextSize = next.size - offset
        if prevSize < @snapOffset
            if prevSize < 0 or offset < @snapOffset
                prevSize = 0
                nextSize = next.size + prev.size
        else if nextSize < @snapOffset
            if nextSize <= 0 or -offset < @snapOffset
                nextSize = 0
                prevSize = prev.size + next.size
        @setPaneSize prev, prevSize
        @setPaneSize next, nextSize
        @update()

    setPaneSize: (pane, size) -> 
        pane.setSize size
        @onPaneSize? pane.id
    
    resized: -> @update(); @calculate()

    update:        -> @updatePanes(); @updateHandles()
    updatePanes:   -> p.update() for p in @panes
    updateHandles: -> h.update() for h in @handles

    # handle drag callbacks
    
    handleStart: (handle) -> @onDragStart?()
    handleDrag:  (handle, drag) ->
        @moveHandleToPos handle, drag.pos[@axis] - @pos() - 4
        @onDrag?()
    handleEnd: () ->
        @update()
        @onDragEnd?()

    #  0000000   00000000  000000000  
    # 000        000          000     
    # 000  0000  0000000      000     
    # 000   000  000          000     
    #  0000000   00000000     000     
    
    panePositions: -> ( p.pos() for p in @panes )
    paneSizes:     -> ( p.size for p in @panes )
    sizeOfPane:  (i) -> @panes[@paneIndex i].size
    posOfPane:   (i) -> @panes[@paneIndex i].pos()
    posOfHandle: (i) -> @handles[i].pos()
        
    paneIndex: (i) -> 
        if _.isNumber i
            clamp 0, @panes.length-1, i
        else
            @panes.indexOf _.find @panes, (p) -> p.id == i

    size: ->
        cs = window.getComputedStyle @view 
        @view[@clientDim] - parseFloat(cs[@paddingA]) - parseFloat(cs[@paddingB])

    pos: -> @view.getBoundingClientRect()[@position]
                           
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
        
    expand: (i, factor=0.5) ->
        i = @paneIndex i
        pane = @panes[i]
        if pane.collapsed
            pane.expand()
            if flex = @closestVisFlex pane
                use = pane.fixed ? flex.size * factor
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

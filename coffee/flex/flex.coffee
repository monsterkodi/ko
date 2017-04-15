# 00000000  000      00000000  000   000  
# 000       000      000        000 000   
# 000000    000      0000000     00000    
# 000       000      000        000 000   
# 000       0000000  00000000  000   000  

Pane   = require './pane'
Handle = require './handle'

{ getStyle, clamp, elem, drag, def, error, log, $, _} = require 'kxk'

class Flex 
    
    constructor: (opt) ->
        
        @handleSize    = opt.handleSize ? 6
        @direction     = opt.direction ? 'horizontal'
        @snapFirst     = opt.snapFirst
        @snapLast      = opt.snapLast
        @onPaneSize    = opt.onPaneSize
        @onDragStart   = opt.onDragStart
        @onDrag        = opt.onDrag
        @onDragEnd     = opt.onDragEnd
    
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
                    
        @updatePanes()
        @calculate()

    #  0000000   0000000    0000000    
    # 000   000  000   000  000   000  
    # 000000000  000   000  000   000  
    # 000   000  000   000  000   000  
    # 000   000  0000000    0000000    
    
    addPane: (p) ->

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
        @relax()

    # 00000000    0000000   00000000   
    # 000   000  000   000  000   000  
    # 00000000   000   000  00000000   
    # 000        000   000  000        
    # 000         0000000   000        
    
    popPane: ->
        if @panes.length > 1
            @panes.pop().del()
            @handles.pop().del()
        @relax()    

    # 00000000   00000000  000       0000000   000   000  
    # 000   000  000       000      000   000   000 000   
    # 0000000    0000000   000      000000000    00000    
    # 000   000  000       000      000   000   000 000   
    # 000   000  00000000  0000000  000   000  000   000  
    
    relax: ->
        @relaxed = true
        for p in @visiblePanes()
            p.div.style.flex = "1 1 0"
            p.size = 0

    unrelax: ->
        @relaxed = false
        for p in @visiblePanes()
            p.size = p.actualSize()

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
            p.setSize p.size
        @onPaneSize?()
    
    # 00     00   0000000   000   000  00000000  
    # 000   000  000   000  000   000  000       
    # 000000000  000   000   000 000   0000000   
    # 000 0 000  000   000     000     000       
    # 000   000   0000000       0      00000000  

    moveHandle: (opt) -> 
        handle = @handles[opt.index]
        @moveHandleToPos handle, opt.pos        
    
    moveHandleToPos: (handle, pos) ->
    
        if @relaxed then @unrelax()
        offset = pos - handle.pos()
        prev  = @prevAllInv(handle) ? @prevVisFlex(handle) ? @prevFlex handle
        next  = @nextAllInv(handle) ? @nextVisFlex(handle) ? @nextFlex handle
        delete prev.collapsed
        delete next.collapsed
        prevSize = prev.size + offset
        nextSize = next.size - offset
        if @snapFirst? and prevSize < @snapFirst
            if not @prevVisPane prev
                if prevSize <= 0 or offset < @snapFirst # collapse panea
                    prevSize = -1
                    nextSize = next.size + prev.size
            else
                if prevSize < 0
                    prevSize = 0
                    nextSize = next.size + prev.size
        else if @snapLast? and nextSize < @snapLast
            if not @nextVisPane next
                if nextSize <= 0 or -offset < @snapLast # collapse paneb
                    nextSize = -1
                    prevSize = prev.size + next.size
            else
                if nextSize < 0
                    nextSize = 0
                    prevSize = prev.size + next.size
                    
        prev.setSize prevSize
        next.setSize nextSize
        @update()
        @onPaneSize?()

    #  0000000  000  0000000  00000000  
    # 000       000     000   000       
    # 0000000   000    000    0000000   
    #      000  000   000     000       
    # 0000000   000  0000000  00000000  
        
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
    
    numPanes:      -> @panes.length
    visiblePanes:  -> @panes.filter (p) -> p.isVisible()
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
        pane = @panes[@paneIndex i]
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
    
    nextVisPane: (p) ->
        pi = @panes.indexOf p
        return null if pi >= @panes.length-1
        next = @panes[pi+1]
        return next if next.isVisible()
        @nextVisPane next
        
    prevVisPane: (p) ->
        pi = @panes.indexOf p
        return null if pi <= 0
        prev = @panes[pi-1]
        return prev if prev.isVisible()
        @prevVisPane prev

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

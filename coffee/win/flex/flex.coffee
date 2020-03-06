###
00000000  000      00000000  000   000  
000       000      000        000 000   
000000    000      0000000     00000    
000       000      000        000 000   
000       0000000  00000000  000   000  
###

{ _, drag, last, valid } = require 'kxk'

Pane   = require './pane'
Handle = require './handle'

class Flex 
    
    @: (opt) ->
        
        @handleSize  = opt.handleSize ? 6
        @direction   = opt.direction ? 'horizontal'
        @snapFirst   = opt.snapFirst
        @snapLast    = opt.snapLast
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
        @cursor      = opt.cursor ? horz and 'ew-resize' or 'ns-resize'
        
        @panes   = []
        @handles = []

        @view = opt.view ? opt.panes[0].div.parentNode
        @view.style.display = 'flex'
        @view.style.flexDirection = horz and 'row' or 'column'
        
        if valid opt.panes
            @addPane p for p in opt.panes
                    
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
    
    popPane: (opt={}) ->
        
        if opt?.relax == false
            @unrelax()  
        
        if @panes.length > 1
            @panes.pop().del()
            @handles.pop().del()
            
        if opt?.relax != false
            @relax()    
        else
            last(@panes).setSize last(@panes).actualSize()

    shiftPane: ->
        
        if @panes.length > 1
            @panes.shift().del()
            @handles.shift().del()
            
        for i in [0...@panes.length]
            @panes[i].index = i

        for i in [0...@handles.length]
            @handles[i].index = i
            
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
            avail -= h.size() if h.isVisible()
            
        for p in visPanes
            avail -= p.size
            
        diff = avail / flexPanes.length
        
        for p in flexPanes
            p.size += diff
            
        for p in visPanes
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
        
        pos = parseInt pos
        if @relaxed then @unrelax()
        
        offset = pos - handle.actualPos()
        
        return if Math.abs(offset) < 1
        
        prev  = @prevAllInv(handle) ? @prevVisFlex(handle) ? @prevFlex handle
        next  = @nextAllInv(handle) ? @nextVisFlex(handle) ? @nextFlex handle
        
        delete prev.collapsed
        delete next.collapsed
        
        prevSize = prev.size + offset
        nextSize = next.size - offset
        
        if @snapFirst? and prevSize < @snapFirst and not @prevVisPane prev
            
            if prevSize <= 0 or offset < @snapFirst # collapse panea
                prevSize = -1
                nextSize = next.size + prev.size + @handleSize
                
        else if prevSize < 0
                
            leftOver = -prevSize
            prevHandle = handle.prev()
            while leftOver > 0 and prevHandle and prevVisFlex = @prevVisFlex prevHandle
                deduct = Math.min leftOver, prevVisFlex.size
                leftOver -= deduct
                prevVisFlex.setSize prevVisFlex.size - deduct
                prevHandle = prevHandle.prev()
                
            prevSize = 0
            nextSize -= leftOver
                    
        if @snapLast? and nextSize < @snapLast and not @nextVisPane next
            
            if nextSize <= 0 or -offset < @snapLast # collapse paneb
                nextSize = -1
                prevSize = prev.size + next.size + @handleSize
                
        else if nextSize < 0
                
            leftOver = -nextSize
            nextHandle = handle.next()
            while leftOver > 0 and nextHandle and nextVisFlex = @nextVisFlex nextHandle
                deduct = Math.min leftOver, nextVisFlex.size
                leftOver -= deduct
                nextVisFlex.setSize nextVisFlex.size - deduct
                nextHandle = nextHandle.next()
                
            nextSize = 0
            prevSize -= leftOver
        
        prev.setSize prevSize
        next.setSize nextSize
        @update()
        @onPaneSize?()

    #  0000000  000000000   0000000   000000000  00000000  
    # 000          000     000   000     000     000       
    # 0000000      000     000000000     000     0000000   
    #      000     000     000   000     000     000       
    # 0000000      000     000   000     000     00000000  
    
    restoreState: (state) ->
        return if not state?.length
        for si in [0...state.length]
            s = state[si]
            pane = @pane si
            delete pane.collapsed
            pane.collapse()      if s.size < 0
            pane.setSize(s.size) if s.size >= 0

        @updateHandles()
        @onPaneSize?()
        
    getState: () ->
        state = []
        for p in @panes
            state.push
                id:   p.id
                size: p.size
                pos:  p.pos()
        state

    #  0000000  000  0000000  00000000  
    # 000       000     000   000       
    # 0000000   000    000    0000000   
    #      000  000   000     000       
    # 0000000   000  0000000  00000000  
        
    resized:       -> @update().calculate()

    update:        -> @updatePanes().updateHandles()
    updatePanes:   -> p.update() for p in @panes   ; @
    updateHandles: -> h.update() for h in @handles ; @

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
    
    numPanes:        -> @panes.length
    visiblePanes:    -> @panes.filter (p) -> p.isVisible()
    panePositions:   -> ( p.pos() for p in @panes )
    paneSizes:       -> ( p.size for p in @panes )
    sizeOfPane:  (i) -> @pane(i).size
    posOfPane:   (i) -> @pane(i).pos()
    posOfHandle: (i) -> @handle(i).pos()
    pane:        (i) -> _.isNumber(i) and @panes[i]   or _.isString(i) and _.find(@panes, (p) -> p.id == i) or i
    handle:      (i) -> _.isNumber(i) and @handles[i] or i

    height: -> @view.getBoundingClientRect().height
    size:   -> @view.getBoundingClientRect()[@dimension]
    pos:    -> @view.getBoundingClientRect()[@position]
                           
    #  0000000   0000000   000      000       0000000   00000000    0000000  00000000  
    # 000       000   000  000      000      000   000  000   000  000       000       
    # 000       000   000  000      000      000000000  00000000   0000000   0000000   
    # 000       000   000  000      000      000   000  000             000  000       
    #  0000000   0000000   0000000  0000000  000   000  000        0000000   00000000  
    
    isCollapsed: (i) -> @pane(i).collapsed
    
    collapse: (i) -> 
        
        if pane = @pane i
            if not pane.collapsed
                pane.collapse()
                @calculate()
        
    expand: (i, factor=0.5) ->
        
        if pane = @pane i
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

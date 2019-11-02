###
00000000  0000000    000  000000000   0000000   00000000          0000000   0000000  00000000    0000000   000      000      
000       000   000  000     000     000   000  000   000        000       000       000   000  000   000  000      000      
0000000   000   000  000     000     000   000  0000000          0000000   000       0000000    000   000  000      000      
000       000   000  000     000     000   000  000   000             000  000       000   000  000   000  000      000      
00000000  0000000    000     000      0000000   000   000        0000000    0000000  000   000   0000000   0000000  0000000  
###

{ clamp, klog } = require 'kxk'

events = require 'events'
kxk    = require 'kxk'

class EditorScroll extends events

    @: (@editor) ->

        super()
        @lineHeight = @editor.size.lineHeight ? 0
        @viewHeight = -1
        @init()
        
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    init: ->
        
        @scroll       =  0 # current scroll value from document start (pixels)
        @offsetTop    =  0 # height of view above first visible line (pixels)
        @offsetSmooth =  0 # smooth scrolling offset / part of top line that is hidden (pixels)
        
        @viewHeight   = -1
        @fullHeight   = -1 # total height of buffer (pixels)
        @fullLines    = -1 # number of full lines fitting in view (excluding partials)
        @viewLines    = -1 # number of lines fitting in view (including partials)
        @scrollMax    = -1 # maximum scroll offset (pixels)
        @numLines     = -1 # total number of lines in buffer
        @top          = -1 # index of first visible line in view
        @bot          = -1 # index of last  visible line in view

    start: (@viewHeight, @numLines) =>
        
        @fullHeight = @numLines * @lineHeight
        @top = 0
        @bot = @top-1
        @calc()
        @by 0

    #  0000000   0000000   000       0000000  
    # 000       000   000  000      000       
    # 000       000000000  000      000       
    # 000       000   000  000      000       
    #  0000000  000   000  0000000   0000000  
    
    calc: ->
        
        if @viewHeight <= 0
            return
            
        @scrollMax   = Math.max(0,@fullHeight - @viewHeight)   # maximum scroll offset (pixels)
        @fullLines   = Math.floor(@viewHeight / @lineHeight)   # number of lines in view (excluding partials)
        @viewLines   = Math.ceil(@viewHeight / @lineHeight)+1  # number of lines in view (including partials)
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    to: (p) => @by p-@scroll
    
    by: (delta, x) =>
        
        return if @viewLines < 0
        
        @editor.layerScroll.scrollLeft += x if x
        
        return if not delta and @top < @bot
        
        scroll = @scroll
        delta = 0 if Number.isNaN delta
        @scroll = parseInt clamp 0, @scrollMax, @scroll+delta
        top = parseInt @scroll / @lineHeight
        @offsetSmooth = @scroll - top * @lineHeight 
        
        @setTop top

        offset = 0
        offset += @offsetSmooth
        offset += (top - @top) * @lineHeight
        
        if offset != @offsetTop or scroll != @scroll
                        
            @offsetTop = parseInt offset
            @updateOffset()
            @emit 'scroll' @scroll, @offsetTop
            
    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) =>
        
        oldTop = @top
        oldBot = @bot
        
        @bot = Math.min top+@viewLines, @numLines-1
        @top = Math.max 0, @bot - @viewLines

        return if oldTop == @top and oldBot == @bot
            
        if (@top > oldBot) or (@bot < oldTop) or (oldBot < oldTop) 
            # new range outside, start from scratch
            num = @bot - @top + 1
            
            if num > 0
                @emit 'showLines' @top, @bot, num

        else   
            
            num = @top - oldTop
            
            if 0 < Math.abs num
                @emit 'shiftLines' @top, @bot, num
                
    lineIndexIsInView: (li) -> @top <= li <= @bot
    
    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
    
    reset: =>
        
        @emit 'clearLines'
        @init()
        @updateOffset()
        
    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) =>
        
        if @viewHeight != h
            @bot = @top-1 # always emit showLines if height changes
            @viewHeight = h
            @calc()
            @by 0
            
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n, opt) =>
        
        if @numLines != n
            @fullHeight = n * @lineHeight
            if n
                if opt?.showLines != false
                    @bot = @top-1 # always emit showLines if line number changes
                @numLines = n
                @calc()
                @by 0
            else
                @init()
                @emit 'clearLines'             

    # 000      000  000   000  00000000  000   000  00000000  000   0000000   000   000  000000000
    # 000      000  0000  000  000       000   000  000       000  000        000   000     000   
    # 000      000  000 0 000  0000000   000000000  0000000   000  000  0000  000000000     000   
    # 000      000  000  0000  000       000   000  000       000  000   000  000   000     000   
    # 0000000  000  000   000  00000000  000   000  00000000  000   0000000   000   000     000   

    setLineHeight: (h) =>
            
        if @lineHeight != h
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @calc()
            @by 0

    #  0000000   00000000  00000000   0000000  00000000  000000000  
    # 000   000  000       000       000       000          000     
    # 000   000  000000    000000    0000000   0000000      000     
    # 000   000  000       000            000  000          000     
    #  0000000   000       000       0000000   00000000     000     
    
    updateOffset: -> 
                
        @editor.layers.style.transform = "translate3d(0,-#{@offsetTop}px, 0)"
            
    #  0000000  000   000  00000000    0000000   0000000   00000000   
    # 000       000   000  000   000  000       000   000  000   000  
    # 000       000   000  0000000    0000000   000   000  0000000    
    # 000       000   000  000   000       000  000   000  000   000  
    #  0000000   0000000   000   000  0000000    0000000   000   000  
            
    cursorToTop: (topDist=7) ->
                
        cp = @editor.cursorPos()
        
        if cp[1] - @top > topDist
            
            rg = [@top, Math.max 0, cp[1]-1]
            
            sl = @editor.selectionsInLineIndexRange rg
            hl = @editor.highlightsInLineIndexRange rg
            
            if sl.length == 0 == hl.length
                # klog 'cursorToTop' (cp[1] - @top - topDist)
                @by @lineHeight * (cp[1] - @top - topDist)

    cursorIntoView: ->

        if delta = @deltaToEnsureMainCursorIsVisible()
            @by delta * @lineHeight - @offsetSmooth
            
        @updateCursorOffset()

    deltaToEnsureMainCursorIsVisible: ->
        
        maindelta = 0
        cl = @editor.mainCursor()[1]
        
        offset = @editor.config?.scrollOffset ? 2
        
        if cl < @top + offset + @offsetTop / @lineHeight
            maindelta = cl - (@top + offset + @offsetTop / @lineHeight)
        else if cl > @top + @fullLines - offset - 1
            maindelta = cl - (@top + @fullLines - offset - 1)

        maindelta
            
    updateCursorOffset: ->
        
        offsetX     = @editor.size.offsetX
        charWidth   = @editor.size.charWidth
        layersWidth = @editor.layersWidth
        scrollLeft  = @editor.layerScroll.scrollLeft

        cx = @editor.mainCursor()[0]*charWidth+offsetX
        
        if cx-scrollLeft > layersWidth
            
            @editor.layerScroll.scrollLeft = Math.max 0, cx - layersWidth + charWidth
            
        else if cx-offsetX-scrollLeft < 0
            
            @editor.layerScroll.scrollLeft = Math.max 0, cx - offsetX
            
    # 000  000   000  00000000   0000000 
    # 000  0000  000  000       000   000
    # 000  000 0 000  000000    000   000
    # 000  000  0000  000       000   000
    # 000  000   000  000        0000000 
    
    info: ->
        
        topbot: "#{@top} .. #{@bot} = #{@bot-@top} / #{@numLines} lines"
        scroll: "#{@scroll} offsetTop #{@offsetTop} viewHeight #{@viewHeight} scrollMax #{@scrollMax} fullLines #{@fullLines} viewLines #{@viewLines}"
        
module.exports = EditorScroll

# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      
{
getStyle,
clamp,
first,
last}   = require '../tools/tools'
tlog    = require '../tools/log'
str     = require '../tools/str'
drag    = require '../tools/drag'
profile = require '../tools/profile'
scroll  = require './scroll'

class Minimap

    constructor: (@editor) ->
        
        @width = 2*parseInt getStyle '.minimap', 'width'
        @height = 8192
        @offsetLeft = 6
            
        @elem = document.createElement 'div'
        @elem.className = 'minimap'

        @canvas = document.createElement 'canvas'
        @canvas.className = "minimapCanvas"
        @canvas.height = @height
        @canvas.width  = @width
            
        @elem.addEventListener 'wheel', @editor.scrollbar?.onWheel
        @elem.appendChild @canvas

        @canvasTop = document.createElement 'canvas'
        @canvasTop.className = "minimapCanvasTop"
        @canvasTop.height = @height
        @canvasTop.width  = @width
        @elem.appendChild @canvasTop
        
        @editor.view.style.right = "#{@width/2}px"
        @editor.view.parentElement.appendChild @elem
        @editor.on 'viewHeight',    @onEditorViewHeight
        @editor.on 'numLines',      @onEditorNumLines
        @editor.scroll.on 'scroll', @onEditorScroll

        @scroll = new scroll 
            exposeMax:  @height/4
            lineHeight: 4
            viewHeight: 2*@editor.viewHeight()
            
        # @scroll.dbg = true if @editor.name == 'editor'
                    
        @drag = new drag 
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag 
            cursor: 'pointer'
            
        @scroll.on 'clearLines', @clearAll
        @scroll.on 'scroll',     @onScroll
        @scroll.on 'exposeTop',  @exposeTop
        @scroll.on 'exposeLine', @exposeLine

        @onScroll()  
        @drawLines()
        @drawTopBot()
            
    # 0000000    00000000    0000000   000   000
    # 000   000  000   000  000   000  000 0 000
    # 000   000  0000000    000000000  000000000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000  00     00

    drawLines: (top=@scroll.exposeTop, bot=@scroll.exposeBot) =>
        ctx = @canvas.getContext '2d'
        # @log "minimap.drawLines #{top}..#{bot} #{@scroll.exposeTop}..#{@scroll.exposeBot}"
        for li in [top..bot]
            diss = @editor.syntax.getDiss li
            # @log "diss.length #{diss?.length}"
            if diss?.length
                for r in diss
                    break if 2*r.start >= @width
                    ctx.fillStyle = @editor.syntax.colorForClassnames r.clss + " minimap"
                    y = parseInt((li-@scroll.exposeTop)*@scroll.lineHeight)
                    # @log "minimap.drawLines y:#{y}"
                    ctx.fillRect @offsetLeft+2*r.start, y, 2*r.match.length, @scroll.lineHeight
                
    drawTopBot: =>
        @canvasTop.height = @height
        @canvasTop.width = @width
        ctx = @canvasTop.getContext '2d'
        lh = @scroll.lineHeight/2
        tb = (@editor.scroll.bot-@editor.scroll.top+1)*lh
        ctx.fillStyle = "rgba(255,255,255,0.15)"
        y = parseInt @scroll.lineHeight * (@editor.scroll.top-@scroll.exposeTop*@scroll.lineHeight)
        ctx.fillRect 0, y, @width, 2*Math.max 0, tb
        # b = parseInt @scroll.lineHeight * (@scroll.numLines-@scroll.exposeTop*@scroll.lineHeight)
        b = parseInt @scroll.lineHeight * (@editor.lines.length-0.5-@scroll.exposeTop*@scroll.lineHeight)
        ctx.fillRect 0, b, @width, @scroll.lineHeight/2
       
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
    
    exposeTop:   (e) => @drawLines()
    exposeLine: (li) => @drawLines li, li
        
    #  0000000  000   000   0000000   000   000   0000000   00000000
    # 000       000   000  000   000  0000  000  000        000     
    # 000       000000000  000000000  000 0 000  000  0000  0000000 
    # 000       000   000  000   000  000  0000  000   000  000     
    #  0000000  000   000  000   000  000   000   0000000   00000000
    
    changed: (changeInfo) ->
        ci = changeInfo
        return if not ci.sorted.length
        
        firstInserted = first(ci.inserted) ? @scroll.exposeBot+1
        firstDeleted  = first(ci.deleted)  ? @scroll.exposeBot+1
        redraw = Math.min firstInserted, firstDeleted
            
        # @log "minimap.changed redraw",  redraw
        
        for c in ci.changed
            break if c >= redraw
            @drawLines c, c
        
        if redraw <= @scroll.exposeBot            
            @clearRange redraw, @scroll.exposeBot
            @scroll.setNumLines @editor.lines.length
            @drawLines redraw, @scroll.exposeBot
            @drawTopBot()
        
    # 00     00   0000000   000   000   0000000  00000000
    # 000   000  000   000  000   000  000       000     
    # 000000000  000   000  000   000  0000000   0000000 
    # 000 0 000  000   000  000   000       000  000     
    # 000   000   0000000    0000000   0000000   00000000

    onDrag: (drag, event) =>   
        if @scroll.fullHeight > @scroll.viewHeight
            br = @elem.getBoundingClientRect()
            ry = event.clientY - br.top
            pc = 2*ry / @scroll.viewHeight
            li = parseInt pc * @editor.scroll.numLines
            @jumpToLine li
        else
            @jumpToLine @lineIndexForEvent event

    onStart: (drag,event) => @jumpToLine @lineIndexForEvent event
    jumpToLine: (li) ->        
        @editor.scrollTo (li-5) * @editor.scroll.lineHeight
        @editor.singleCursorAtPos [0, li+5]
        @editor.focus()
        @onEditorScroll()

    lineIndexForEvent: (event) ->
        st = @elem.scrollTop
        br = @elem.getBoundingClientRect()
        ly = clamp 0, @elem.offsetHeight, event.clientY - br.top
        py = parseInt(Math.floor(2*ly/@scroll.lineHeight)) + @scroll.top
        li = parseInt Math.min(@scroll.numLines-1, py)
        li

    #  0000000   000   000        00000000  0000000    000  000000000   0000000   00000000 
    # 000   000  0000  000        000       000   000  000     000     000   000  000   000
    # 000   000  000 0 000        0000000   000   000  000     000     000   000  0000000  
    # 000   000  000  0000        000       000   000  000     000     000   000  000   000
    #  0000000   000   000        00000000  0000000    000     000      0000000   000   000
    
    onEditorScroll: =>
        if @scroll.fullHeight > @scroll.viewHeight
            pc = @editor.scroll.scroll / @editor.scroll.scrollMax
            tp = parseInt pc * @scroll.scrollMax
            # @log "minimap.onEditorScroll pc: #{pc} tp: #{tp} sm: #{@scroll.scrollMax}" #" fh: #{@scroll.fullHeight} vh: #{@scroll.viewHeight}"
            @scroll.to tp
        @drawTopBot()
    
    onEditorNumLines: (n) => 
        # @log "minimap.onEditorNumLines #{n}" if @editor.name != 'logview'
        @onEditorViewHeight @editor.viewHeight() if n and @canvas.height <= @scroll.lineHeight
        @scroll.setNumLines n
            
    onEditorViewHeight: (h) => 
        @scroll.setViewHeight 2*@editor.viewHeight()
        # @log "minimap.onEditorViewHeight h #{h} @height #{@height}", @scroll.info()
        @onScroll()
        @onEditorScroll()
            
    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
            
    onScroll: =>
        y  = parseInt -@height/4-@scroll.offsetTop/2
        x  = parseInt @width/4
        # @log "minimap.updateTransform y: #{y} vh: #{@scroll.viewHeight} sm: #{@scroll.scrollMax} eh: #{2*@editor.viewHeight()} fh: #{@height}"
        @canvasTop.style.transform = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        @canvas.style.transform    = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clearRange: (top, bot) -> 
        @log "minimap.clearRange #{top} #{bot}"
        ctx = @canvas.getContext '2d'
        ctx.clearRect 0, (top-@scroll.exposeTop)*@scroll.lineHeight, 2*@width, (bot-top)*@scroll.lineHeight
        
    clearAll: =>
        # @log "minimap.clear"
        @canvasTop.width = @canvasTop.width
        @canvas.width    = @canvas.width
        
    log: -> 
        if @editor.name == 'logview'
            console.log (str(s) for s in [].slice.call arguments, 0).join " "
        else
            tlog (str(s) for s in [].slice.call arguments, 0).join " "
        
module.exports = Minimap

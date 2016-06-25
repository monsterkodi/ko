# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      
{
getStyle,
clamp,
last}   = require '../tools/tools'
log     = require '../tools/log'
drag    = require '../tools/drag'
profile = require '../tools/profile'
scroll  = require './scroll'

class Minimap

    constructor: (@editor) ->
        
        @width = 240
        @height = 8192
            
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
            
        @scroll.on 'clearLines', @clearLines
        @scroll.on 'scroll',     @onScroll
        @scroll.on 'exposeTop',  @exposeTop
        @scroll.on 'exposeLine', @exposeLine

        @updateTransform()  
        @drawLines()
        @drawTopBot()
            
    # 0000000    00000000    0000000   000   000
    # 000   000  000   000  000   000  000 0 000
    # 000   000  0000000    000000000  000000000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000  00     00

    drawLines: (top=@scroll.exposeTop, bot=@scroll.exposeBot) =>
        ctx = @canvas.getContext '2d'
        # log "minimap.drawLines #{top}..#{bot} #{@scroll.exposeTop}..#{@scroll.exposeBot}" if @editor.name != 'logview'
        for li in [top..bot]
            diss = @editor.syntax.getDiss li
            # log "diss.length #{diss?.length}" if @editor.name == 'terminal'
            if diss?.length
                for r in diss
                    break if 2*r.start >= @width
                    ctx.fillStyle = @editor.syntax.colorForClassnames r.clss + " minimap"
                    y = parseInt((li-@scroll.exposeTop)*@scroll.lineHeight)
                    # y = parseInt @scroll.lineHeight * (@editor.scroll.top-@scroll.exposeTop*@scroll.lineHeight)
                    # log "minimap.drawLines y:#{y}" if @editor.name != 'logview'
                    ctx.fillRect 2*r.start, y, 2*r.match.length, @scroll.lineHeight
                
    drawTopBot: =>
        @canvasTop.height = @height
        @canvasTop.width = @width
        ctx = @canvasTop.getContext '2d'
        lh = @scroll.lineHeight/2
        tb = (@editor.scroll.bot-@editor.scroll.top+1)*lh
        ctx.fillStyle = "rgba(255,255,255,0.15)"
        y = parseInt @scroll.lineHeight * (@editor.scroll.top-@scroll.exposeTop*@scroll.lineHeight)
        ctx.fillRect 0, y, @width, 2*Math.max 0, tb
        b = parseInt @scroll.lineHeight * (@scroll.numLines-@scroll.exposeTop*@scroll.lineHeight)
        ctx.fillRect 0, b, @width, @scroll.lineHeight/2
       
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
    
    exposeTop: (e) => 
        log "minimap.exposeTop", e if @editor.name != 'logview'
        @drawLines()
        
    exposeLine: (li) => 
        # log "minimap.exposeLine", li if @editor.name != 'logview'
        @drawLines li, li
        
    changed: (changeInfo) -> 
        log "minimap.changed" if changeInfo.sorted.length and @editor.name != 'logview'
        # @draw() if changeInfo.sorted.length
    
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
            # log "minimap.onEditorScroll pc: #{pc} tp: #{tp} sm: #{@scroll.scrollMax}" #" fh: #{@scroll.fullHeight} vh: #{@scroll.viewHeight}"
            @scroll.to tp
        @drawTopBot()
    
    onEditorNumLines: (n) => 
        # log "minimap.onEditorNumLines #{n}" if @editor.name != 'logview'
        @onEditorViewHeight @editor.viewHeight() if n and @canvas.height <= @scroll.lineHeight
        @scroll.setNumLines n
            
    onEditorViewHeight: (h) => 
        @scroll.setViewHeight 2*@editor.viewHeight()
        # log "minimap.onEditorViewHeight h #{h} @height #{@height}", @scroll.info() if @editor.name != 'logview'
        @updateTransform()
        @onEditorScroll()
            
    updateTransform: =>
    
        y  = parseInt -@height/4-@scroll.offsetTop/2
        x  = parseInt @width/4
        
        # log "minimap.updateTransform y: #{y} vh: #{@scroll.viewHeight} sm: #{@scroll.scrollMax} eh: #{2*@editor.viewHeight()} fh: #{@height}" if @editor.name != 'logview'
        
        @canvasTop.style.transform = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        @canvas.style.transform    = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        
    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
            
    onScroll: (scroll, offsetTop) => 
        # log "minimap.onScroll #{scroll} #{offsetTop}" if @editor.name != 'logview'
        @updateTransform()
            
    width:  -> parseInt getStyle '.minimap', 'width'
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clearLines: => @clear()
    clear: =>
        # log "minimap.clear" if @editor.name != 'logview'
        @canvasTop.width = @canvasTop.width
        @canvas.width    = @canvas.width
        
module.exports = Minimap

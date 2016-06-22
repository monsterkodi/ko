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
        
        @elem = document.createElement 'div'
        @elem.className = 'minimap'

        @canvas = document.createElement 'canvas'
        @canvas.className = "minimapCanvas"
            
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
            exposeMax:  0
            lineHeight: 4
            viewHeight: 2*@editor.viewHeight()
            
        @drag = new drag 
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag 
            cursor: 'pointer'
            
        @scroll.on 'clearLines', @clearLines
        @scroll.on 'scroll',     @onScroll

        @updateTransform()  
        @draw()
            
    # 0000000    00000000    0000000   000   000
    # 000   000  000   000  000   000  000 0 000
    # 000   000  0000000    000000000  000000000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000  00     00

    draw: => 
        @drawLines()
        @drawTopBot()

    drawLines: =>
        # log "minimap.drawLines #{@scroll.top}..#{@scroll.bot}" if @editor.name == 'terminal'
        @canvas.height = @height
        @canvas.width = @width
        ctx = @canvas.getContext '2d'
        for li in [@scroll.top..@scroll.bot]
            diss = @editor.syntax.getDiss li
            # log "diss.length #{diss?.length}" if @editor.name == 'terminal'
            if diss?.length
                for r in diss
                    break if 2*r.start >= @width
                    ctx.fillStyle = @editor.syntax.colorForClassnames r.clss + " minimap"
                    y = parseInt((li-@scroll.top)*@scroll.lineHeight)
                    # log "y:#{y}" if @editor.name == 'terminal'
                    ctx.fillRect 2*r.start, y, 2*r.match.length, @scroll.lineHeight
                    
    drawTopBot: =>
        @canvasTop.height = @height
        @canvasTop.width = @width
        ctx = @canvasTop.getContext '2d'
        lh = @scroll.lineHeight/2
        tb = (@editor.scroll.bot-@editor.scroll.top+1)*lh
        ctx.fillStyle = "rgba(255,255,255,0.15)"
        y = parseInt @scroll.lineHeight * (@editor.scroll.top-@scroll.top)
        ctx.fillRect 0, y, @width, 2*Math.max 0, tb
        
    changed: (changeInfo) -> @draw() if changeInfo.sorted.length
    
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
    
    onEditorScroll: (scroll, topOffset) =>
        if @scroll.fullHeight > @scroll.viewHeight
            pc = @editor.scroll.scroll / @editor.scroll.scrollMax
            tp = parseInt pc * @scroll.scrollMax
            @scroll.to tp
        else
            @drawTopBot()
    
    onEditorViewHeight: (h) => 
        @updateTransform()        
        @draw()
        
    onEditorNumLines: (n) => 
        @scroll.setNumLines n
        @updateTransform()        
        @draw()
            
    updateTransform: =>
        numLines = @editor.lines?.length ? 1
        @height = Math.min @scroll.lineHeight*numLines, 2*@editor.viewHeight()
        @scroll.setViewHeight @height
        @canvasTop.style.transform = "translate3d(#{parseInt @width/4}px, #{parseInt -@height/4}px, 0px) scale3d(0.5, 0.5, 1)"
        @canvas.style.transform    = "translate3d(#{parseInt @width/4}px, #{parseInt -@height/4}px, 0px) scale3d(0.5, 0.5, 1)"
        
    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
            
    onScroll: (scroll, topOffset) => @draw()
            
    width:  -> parseInt getStyle '.minimap', 'width'
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clearLines: => @clear()
    clear: =>
        @canvasTop.width = @canvasTop.width
        @canvas.width = @canvas.width
        
module.exports = Minimap

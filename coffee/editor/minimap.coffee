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
        
        @elem = document.createElement 'div'
        @elem.className = 'minimap'

        @canvas = document.createElement 'canvas'
        @canvas.width = @width()
        @canvas.className = "minimapCanvas"
            
        @elem.addEventListener 'wheel', @editor.scrollbar?.onWheel
        @elem.appendChild @canvas

        @canvasTop = document.createElement 'canvas'
        @canvasTop.width = @width()
        @canvasTop.className = "minimapCanvasTop"
        @elem.appendChild @canvasTop
        
        @editor.view.style.right = "#{@width()}px"
        @editor.view.parentElement.appendChild @elem
        @editor.on 'viewHeight',    @onEditorViewHeight
        @editor.on 'numLines',      @onEditorNumLines
        @editor.scroll.on 'scroll', @onEditorScroll

        @scroll = new scroll 
            exposeMax:  0
            lineHeight: 2
            viewHeight: @editor.viewHeight()
            
        @drag = new drag 
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag 
            cursor: 'pointer'
            
        @scroll.on 'clearLines', @clearLines
        @scroll.on 'scroll',     @onScroll

        @context = @canvas.getContext '2d'
        @context.imageSmoothingEnabled = false
            
    # 0000000    00000000    0000000   000   000
    # 000   000  000   000  000   000  000 0 000
    # 000   000  0000000    000000000  000000000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000  00     00

    draw: => 
        @drawLines()
        @drawTopBot()

    drawLines: =>
        @canvas.height = @height()
        @context = @canvas.getContext '2d'

        for li in [@scroll.top..@scroll.bot]
            diss = @editor.syntax.getDiss li
            if diss?.length
                for r in diss
                    @context.fillStyle = @editor.syntax.colorForClassnames r.clss + " minimap"
                    y = parseInt((li-@scroll.top)*@scroll.lineHeight)
                    @context.fillRect r.start, y, r.match.length, @scroll.lineHeight
                    
    drawTopBot: =>
        tb = (@editor.scroll.bot-@editor.scroll.top+1)*@scroll.lineHeight
        @canvasTop.height = @height()
        ctx = @canvasTop.getContext '2d'
        ctx.fillStyle = "rgba(255,255,255,0.15)"
        y = parseInt (@editor.scroll.top*@scroll.lineHeight)-(@scroll.lineHeight*@scroll.top)
        ctx.fillRect 0, y, 120, Math.max 0, tb
        
    changed: (changeInfo) -> @draw()
    
    # 00     00   0000000   000   000   0000000  00000000
    # 000   000  000   000  000   000  000       000     
    # 000000000  000   000  000   000  0000000   0000000 
    # 000 0 000  000   000  000   000       000  000     
    # 000   000   0000000    0000000   0000000   00000000

    onDrag: (drag, event) =>   
        if @scroll.fullHeight > @scroll.viewHeight
            br = @elem.getBoundingClientRect()
            ry = event.clientY - br.top            
            pc = ry / @scroll.viewHeight
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
        py = parseInt(Math.floor(ly/@scroll.lineHeight)) + @scroll.top
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
        @scroll.setViewHeight h
        @draw()
        
    onEditorNumLines: (n) => 
        @scroll.setNumLines n
        @draw()
            
    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
            
    onScroll: (scroll, topOffset) =>
        @elem.scrollTop = parseInt scroll
        @draw()
            
    width:  -> parseInt getStyle '.minimap', 'width'
    height: -> parseInt Math.min @editor.lines.length*@scroll.lineHeight, @editor.scroll.viewHeight
    
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

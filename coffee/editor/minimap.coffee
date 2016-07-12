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
log     = require '../tools/log'
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

        @selections = document.createElement 'canvas'
        @selections.className = "minimapSelections"
        @selections.height = @height
        @selections.width  = @width
        @elem.appendChild @selections

        @lines = document.createElement 'canvas'
        @lines.className = "minimapLines"
        @lines.height = @height
        @lines.width  = @width
            
        @elem.addEventListener 'wheel', @editor.scrollbar?.onWheel
        @elem.appendChild @lines

        @highlights = document.createElement 'canvas'
        @highlights.className = "minimapHighlights"
        @highlights.height = @height
        @highlights.width  = @width
        @elem.appendChild @highlights

        @cursors = document.createElement 'canvas'
        @cursors.className = "minimapCursors"
        @cursors.height = @height
        @cursors.width  = @width
        @elem.appendChild @cursors

        @topbot = document.createElement 'canvas'
        @topbot.className = "minimapTopBot"
        @topbot.height = @height
        @topbot.width  = @width
        @elem.appendChild @topbot
        
        @editor.view.appendChild @elem
        @editor.on 'viewHeight',    @onEditorViewHeight
        @editor.on 'numLines',      @onEditorNumLines
        @editor.on 'changed',       @onChanged
        @editor.on 'highlight',     @drawHighlights
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

    drawSelections: =>
        @selections.height = @height
        @selections.width = @width
        ctx = @selections.getContext '2d'

        ctx.fillStyle = '#444' 
        for r in @editor.rangesFromTopToBotInRanges @scroll.exposeTop, @scroll.exposeBot, @editor.selections
            y = (r[0]-@scroll.exposeTop)*@scroll.lineHeight
            if 2*r[1][0] < @width
                offset = r[1][0] and @offsetLeft or 0
                ctx.fillRect offset+2*r[1][0], y, 2*(r[1][1]-r[1][0]), @scroll.lineHeight
                
    drawLines: (top=@scroll.exposeTop, bot=@scroll.exposeBot) =>
        ctx = @lines.getContext '2d'
        # @log "minimap.drawLines #{top}..#{bot} #{@scroll.exposeTop}..#{@scroll.exposeBot}"
        for li in [top..bot]
            diss = @editor.syntax.getDiss li
            y = parseInt((li-@scroll.exposeTop)*@scroll.lineHeight)
            ctx.clearRect 0, y, @width, @scroll.lineHeight
            if diss?.length
                for r in diss
                    break if 2*r.start >= @width
                    if r.clss?
                        ctx.fillStyle = @editor.syntax.colorForClassnames r.clss + " minimap"                    
                    else
                        ctx.fillStyle = @editor.syntax.colorForStyle r.styl
                    ctx.fillRect @offsetLeft+2*r.start, y, 2*r.match.length, @scroll.lineHeight

    drawHighlights: =>
        @highlights.height = @height
        @highlights.width = @width
        ctx = @highlights.getContext '2d'

        ctx.fillStyle = 'rgba(255,0,255,0.5)'
        for r in @editor.rangesFromTopToBotInRanges @scroll.exposeTop, @scroll.exposeBot, @editor.highlights
            y = (r[0]-@scroll.exposeTop)*@scroll.lineHeight
            if 2*r[1][0] < @width                
                ctx.fillRect @offsetLeft+2*r[1][0], y, 2*(r[1][1]-r[1][0]), @scroll.lineHeight
            ctx.fillRect 0, y, @offsetLeft, @scroll.lineHeight

    drawCursors: =>
        @cursors.height = @height
        @cursors.width = @width
        ctx = @cursors.getContext '2d'
        
        for r in @editor.rangesFromTopToBotInRanges @scroll.exposeTop, @scroll.exposeBot, @editor.rangesForCursors()
            y = (r[0]-@scroll.exposeTop)*@scroll.lineHeight
            if 2*r[1][0] < @width
                ctx.fillStyle = '#f80'
                ctx.fillRect @offsetLeft+2*r[1][0], y, 2, @scroll.lineHeight
            ctx.fillStyle = 'rgba(255,128,0,0.5)'
            ctx.fillRect @offsetLeft-4, y, @offsetLeft-2, @scroll.lineHeight
                
        ctx.fillStyle = '#ff0'
        mc = @editor.mainCursor
        y = (mc[1]-@scroll.exposeTop)*@scroll.lineHeight
        if 2*mc[0] < @width
            ctx.fillRect @offsetLeft+2*mc[0], y, 2, @scroll.lineHeight
        ctx.fillRect @offsetLeft-4, y, @offsetLeft-2, @scroll.lineHeight

    drawTopBot: =>
        @topbot.height = @height
        @topbot.width = @width
        ctx = @topbot.getContext '2d'
        lh = @scroll.lineHeight/2
        tb = (@editor.scroll.bot-@editor.scroll.top+1)*lh
        ctx.fillStyle = "rgba(255,255,255,0.15)"
        y = parseInt @scroll.lineHeight * @editor.scroll.top - @scroll.exposeTop*@scroll.lineHeight
        ctx.fillRect 0, y, @width, 2*Math.max 4, tb
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
    
    onChanged: (changeInfo) =>
        # @log "minimap.onChanged", changeInfo
        @drawSelections() if changeInfo.selection.length
        @drawCursors()    if changeInfo.cursors.length
        
        return if not changeInfo.sorted.length
        
        @scroll.setNumLines @editor.lines.length
        
        firstInserted = first(changeInfo.inserted) ? @scroll.exposeBot+1
        firstDeleted  = first(changeInfo.deleted)  ? @scroll.exposeBot+1
        redraw = Math.min firstInserted, firstDeleted
            
        for c in changeInfo.changed
            break if c >= redraw
            @drawLines c, c
            
        @clearRange redraw, @scroll.exposeTop + @height / @scroll.lineHeight
        
        if redraw <= @scroll.exposeBot            
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
            @jumpToLine li, event
        else
            @jumpToLine @lineIndexForEvent(event), event

    onStart: (drag,event) => @jumpToLine @lineIndexForEvent(event), event
    
    jumpToLine: (li, event) ->        
        @editor.scrollTo (li-5) * @editor.scroll.lineHeight
        if not event.metaKey
            @editor.singleCursorAtPos [0, li+5], event.shiftKey
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
            @scroll.to tp
        @drawTopBot()
    
    onEditorNumLines: (n) => 
        @onEditorViewHeight @editor.viewHeight() if n and @lines.height <= @scroll.lineHeight
        @scroll.setNumLines n
            
    onEditorViewHeight: (h) => 
        @scroll.setViewHeight 2*@editor.viewHeight()
        @onScroll()
        @onEditorScroll()

    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
            
    onScroll: =>
        y = parseInt -@height/4-@scroll.offsetTop/2
        x = parseInt @width/4
        t = "translate3d(#{x}px, #{y}px, 0px) scale3d(0.5, 0.5, 1)"
        @selections.style.transform = t
        @highlights.style.transform = t
        @cursors.style.transform    = t
        @topbot.style.transform     = t
        @lines.style.transform      = t
        
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clearRange: (top, bot) -> 
        # @log "minimap.clearRange #{top} #{bot}"
        ctx = @lines.getContext '2d'
        ctx.clearRect 0, (top-@scroll.exposeTop)*@scroll.lineHeight, 2*@width, (bot-top)*@scroll.lineHeight
        
    clearAll: =>
        @selections.width = @selections.width
        @highlights.width = @highlights.width
        @cursors.width    = @cursors.width
        @topbot.width     = @topbot.width
        @lines.width      = @lines.width
        
    log: -> 
        if @editor.name == 'logview'
            console.log (str(s) for s in [].slice.call arguments, 0).join " "
        else
            log (str(s) for s in [].slice.call arguments, 0).join " "
        
module.exports = Minimap

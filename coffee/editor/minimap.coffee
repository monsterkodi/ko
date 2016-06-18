# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      
{
getStyle,
clamp,
last,
$}      = require '../tools/tools'
log     = require '../tools/log'
drag    = require '../tools/drag'
profile = require '../tools/profile'
scroll  = require './scroll'
Snap    = require 'snapsvg'

class Minimap

    constructor: (@editor) ->
        
        @elem = $(".minimap", @editor.view.parentElement)
        @elem.onmousedown = @onClick
        
        @editor.view.style.right = "#{@width()}px"
        @elem.addEventListener 'wheel', @editor.scrollbar?.onWheel
        
        @s = Snap @elem # ".minimap"
        @s.attr
            overflow: 'hidden'
            viewBox:  '0 0 120 0'

        @lines = []
        
        @scroll = new scroll 
            # dbg:        true
            exposeMax: -2
            lineHeight: 2
            viewHeight: @editor.viewHeight()
            
        @drag = new drag 
            target: @elem
            onMove: @onDrag 
            cursor: 'pointer'
            
        # log 'minimap.scroll', @scroll.info()
        
        @scroll.on 'clearLines', @clearLines
        @scroll.on 'exposeTop',  @exposeTop
        @scroll.on 'exposeLine', @exposeLine
        @scroll.on 'vanishLine', @vanishLine
        @scroll.on 'scroll',     @onScroll

        @editor.on 'viewHeight',    @onEditorViewHeight
        @editor.on 'numLines',      @onEditorLineNum
        @editor.scroll.on 'scroll', @onEditorScroll

        @buffer = @s.rect()
        @buffer.addClass 'buffer'
        @buffer.attr
            x:         0
            y:         0
            width:    '100%'
        
        @topBot = @s.rect()
        @topBot.addClass 'topBot'
        @topBot.attr
            x:         0
            y:         0
            width:    '100%'
                
    # 000      000  000   000  00000000
    # 000      000  0000  000  000     
    # 000      000  000 0 000  0000000 
    # 000      000  000  0000  000     
    # 0000000  000  000   000  00000000
    
    lineForIndex: (li) ->
        t = @editor.lines[li]
        line = @s.group()       
        line.attr
            transform: "translate(0 #{li*2})"
         
        # if showSpaces?
        #     l = @s.rect()
        #     l.attr
        #         height: 2
        #         x:      0
        #         width:  t.length
        #     l.addClass 'space'
        #     line.add l
        
        diss = @editor.syntax.getDiss li
        if diss.length
            for r in diss
                if r.match?
                    continue if r.match.trim().length == 0 # ignore spaces
                else
                    log 'warning! minimap.lineForIndex no match?', li, r
                    continue
                c = @s.rect()
                c.attr
                    height: 2
                    x:      r.start
                    width:  r.match.length
                                        
                if r.stack?.length
                    if last(r.stack)?.split?
                        for cls in last(r.stack).split '.'
                            c.addClass cls
                    else
                        log 'warning! minimap.lineForIndex no last(r.stack)?.split? line:', li, 'stack:', r.stack
                else
                    log 'warning! minimap.lineForIndex no stack?', li, r
                    c.addClass 'text'
                line.add c 
        # else
        #     log 'warning! minimap.lineForIndex no diss?', li, diss
        line
                
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo) ->
        return if not changeInfo.sorted.length
        # log 'minimap.changed', changeInfo.sorted
        invalidated = @lines.length
        for [li, change] in changeInfo.sorted
            switch change
                when 'changed'  
                    @lines.splice(li, 1, @lineForIndex li)[0]?.remove()
                when 'deleted' 
                    @lines.splice(li, 1)[0].remove()
                    invalidated = Math.min invalidated, li
                when 'inserted' 
                    @lines.splice li, 0, @lineForIndex li
                    invalidated = Math.min invalidated, li
        
        @updateLinePositions invalidated
    
    # 000000000   0000000   00000000    0000000  000   000   0000000   000   000   0000000   00000000
    #    000     000   000  000   000  000       000   000  000   000  0000  000  000        000     
    #    000     000   000  00000000   000       000000000  000000000  000 0 000  000  0000  0000000 
    #    000     000   000  000        000       000   000  000   000  000  0000  000   000  000     
    #    000      0000000   000         0000000  000   000  000   000  000   000   0000000   00000000
    
    exposeTop: (e) =>
        num = Math.abs e.num
        for n in [0...num]
            if e.num < 0
                lines.shift()?.remove()
            else
                lines.unshift @lineForIndex li
        @updateLinePositions 0  
                                
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    exposeLine: (li) =>
        # log 'minimap.exposeLine', li
        @lines.push @lineForIndex li                            
        
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    vanishLine: (li) =>
        # log 'minimap.vanishLine', li
        if li == @lines.length-1
            @lines.pop().remove()
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clearLines: =>
        for l in @lines
            l.remove()
        @lines = []
    
    # 000      000  000   000  00000000        00000000    0000000    0000000
    # 000      000  0000  000  000             000   000  000   000  000     
    # 000      000  000 0 000  0000000         00000000   000   000  0000000 
    # 000      000  000  0000  000             000        000   000       000
    # 0000000  000  000   000  00000000        000         0000000   0000000 
    
    updateLinePositions: (start=0) ->
        # log 'minimap.updateLinePositions', start
        for li in [start...@lines.length]
            @lines[li].attr
                transform: "translate(0 #{li*2})"    

    lineForEvent: (event) ->
        st = @elem.scrollTop
        br = @elem.getBoundingClientRect()
        ly = clamp 0, @elem.offsetHeight, event.clientY - br.top
        py = parseInt(Math.floor(ly/@scroll.lineHeight)) + @scroll.top
        li = Math.min(@scroll.numLines-1, py)
        # log "minimap.lineForEvent #{li}"
        li
        
    # 00     00   0000000   000   000   0000000  00000000
    # 000   000  000   000  000   000  000       000     
    # 000000000  000   000  000   000  0000000   0000000 
    # 000 0 000  000   000  000   000       000  000     
    # 000   000   0000000    0000000   0000000   00000000
    
    onDrag: (drag, event) => 
        li = @lineForEvent event
        @jumpToLine li    
        if event.clientY % 2 and li > 0
            @editor.scrollBy @editor.scroll.lineHeight/2
    onClick: (event) => @jumpToLine @lineForEvent event    
    jumpToLine: (li) ->        
        @editor.scrollTo (li-5) * @editor.scroll.lineHeight
        @editor.singleCursorAtPos [0, li+5]
        @editor.focus()
                
    #  0000000   000   000  00000000  0000000    000  000000000   0000000   00000000 
    # 000   000  0000  000  000       000   000  000     000     000   000  000   000
    # 000   000  000 0 000  0000000   000   000  000     000     000   000  0000000  
    # 000   000  000  0000  000       000   000  000     000     000   000  000   000
    #  0000000   000   000  00000000  0000000    000     000      0000000   000   000
    
    onEditorScroll: (scroll, topOffset) =>
        # log 'minimap.onEditorScroll', scroll, topOffset
        topBotHeight = (@editor.scroll.bot-@editor.scroll.top+1)*2
            
        st = @editor.scroll.top*2
        # fh = @scroll.fullHeight - @scroll.viewHeight
        fh = @scroll.scrollMax
            
        if @scroll.fullHeight > @scroll.viewHeight
            tf = (@scroll.viewHeight - topBotHeight)/2
            tp = clamp 0, fh, st - tf
            # log "onEditorScroll #{tp} #{tp} #{@scroll.scrollMax}"
            @scroll.to clamp 0, @scroll.scrollMax, tp

        @topBot.attr 
            y:        st
            height:   Math.max 0, topBotHeight
    
    onEditorViewHeight: (h) => @scroll.setViewHeight h
    
    onEditorLineNum: (n) => 
        @scroll.setNumLines n        
        @buffer.attr
            height:  n*@scroll.lineHeight
            
    #  0000000   000   000   0000000   0000000  00000000    0000000   000      000    
    # 000   000  0000  000  000       000       000   000  000   000  000      000    
    # 000   000  000 0 000  0000000   000       0000000    000   000  000      000    
    # 000   000  000  0000       000  000       000   000  000   000  000      000    
    #  0000000   000   000  0000000    0000000  000   000   0000000   0000000  0000000
            
    onScroll: (scroll, topOffset) =>
        t = @scroll.top * 2
        h = @scroll.viewHeight
        # log "minimap.onScroll t #{t} h #{h}"
        @s.attr
             viewBox: "0 #{t} 120 #{h}"   
    
    width: -> parseInt getStyle '.minimap', 'width'
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: =>
        log 'minimap.clear'
        for l in @lines
            l.remove()
        @lines = []        
        
module.exports = Minimap
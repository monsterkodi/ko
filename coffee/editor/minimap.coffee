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
Snap    = require 'snapsvg'

class Minimap

    constructor: (@editor) ->
                
        @s = Snap()
        @s.attr
            class:    'minimap'
            overflow: 'hidden'
            viewBox:  '0 0 120 0'
            
        @elem = @s.node        
        @elem.className = 'minimap'
        @elem.onmousedown = @onClick
        @elem.addEventListener 'wheel', @editor.scrollbar?.onWheel

        @editor.view.style.right = "#{@width()}px"
        @editor.view.parentElement.appendChild @elem
        @editor.on 'viewHeight',    @onEditorViewHeight
        @editor.on 'numLines',      @onEditorLineNum
        @editor.scroll.on 'scroll', @onEditorScroll

        @lines = []
        
        @scroll = new scroll 
            # dbg:        @editor.name == 'terminal'
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
        # console.log "minimap.lineForIndex #{li}" if @editor.name == 'terminal'
        line = @s.group()  
        line.transform "translate(0 #{li*2})"     
         
        diss = @editor.syntax.getDiss li
        # console.log "#{@editor.name}.minimap.lineForIndex #{li} diss #{JSON.stringify diss}" if @editor.name != 'logview'
        # console.log "#{@editor.name}.minimap.lineForIndex #{li} diss.length #{diss.length}" if @editor.name != 'logview'
        if diss.length
            for r in diss
                if r.match?
                    continue if r.match.trim().length == 0 # ignore spaces
                else
                    console.log 'warning! minimap.lineForIndex no match?', li, r
                    continue
                c = @s.rect r.start, 0, r.match.length, 2

                for cls in r.cls ? ['text']
                    c.addClass cls
                                        
                line.add c 
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
        
        if invalidated < @lines.length
            for li in [invalidated...@lines.length] 
                @lines[li].transform "translate(0 #{(@scroll.exposeTop+li)*2})"
    
    # 00000000  000   000  00000000    0000000    0000000  00000000  000000000   0000000   00000000 
    # 000        000 000   000   000  000   000  000       000          000     000   000  000   000
    # 0000000     00000    00000000   000   000  0000000   0000000      000     000   000  00000000 
    # 000        000 000   000        000   000       000  000          000     000   000  000      
    # 00000000  000   000  000         0000000   0000000   00000000     000      0000000   000      
    
    exposeTop: (e) =>
        # log "minimap.exposeTop", e, @scroll.info() if @editor.name == 'editor'
        # log "minimap.exposeTop", @lines.length if @editor.name == 'editor'
        num = Math.abs e.num
        for n in [0...num]
            if e.num < 0
                li = e.new - (num - n)
                # log "minimap.exposeTop #{li}"
                @lines.shift()?.remove()
            else
                li = e.new + num - n - 1
                @lines.unshift @lineForIndex li
        # log "minimap.exposeTop", @lines.length if @editor.name == 'editor'
                                
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    exposeLine: (li) =>
        # log 'minimap.exposeLine', li if @editor.name == 'editor'
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
        # log "minimap.onEditorScroll scroll #{scroll} topOffset #{topOffset}" if @editor.name == 'editor'
        topBotHeight = (@editor.scroll.bot-@editor.scroll.top+1)*2
        # log "minimap.onEditorScroll topBotHeight #{topBotHeight}" if @editor.name == 'editor'
        st = @editor.scroll.top*2
        fh = @scroll.scrollMax
            
        # log "minimap.onEditorScroll st #{st} fh #{fh}" if @editor.name == 'editor'
            
        if @scroll.fullHeight > @scroll.viewHeight
            tf = parseInt (@scroll.viewHeight - topBotHeight)/2
            tp = clamp 0, Math.min(fh, @scroll.scrollMax), st - tf
            # log "minimap.onEditorScroll tf #{tf} tp #{tp}" if @editor.name == 'editor'
            @scroll.to tp

        @topBot.attr 
            y:        st
            height:   Math.max 0, topBotHeight
    
    onEditorViewHeight: (h) => 
        # log "minimap.onEditorViewHeight #{h} #{@editor.name}"
        @scroll.setViewHeight h
    
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
        # log "minimap.onScroll scroll #{scroll} topOffset #{topOffset} viewHeight #{@scroll.viewHeight}" if @editor.name == 'editor'
        @s.attr
             viewBox: "0 #{scroll} 120 #{@scroll.viewHeight}"   
    
    width: -> parseInt getStyle '.minimap', 'width'
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: =>
        for l in @lines
            l.remove()
        @lines = []        
        
module.exports = Minimap

# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      
{
getStyle,
clamp,
last,
$
}       = require '../tools/tools'
log     = require '../tools/log'
profile = require '../tools/profile'
scroll  = require './scroll'
Snap    = require 'snapsvg'

class Minimap

    constructor: (@editor) ->
        
        @elem = $(".minimap")
        
        @s = Snap ".minimap"
        @s.attr
            overflow: 'hidden'
            viewBox:  '0 0 120 0'

        @lines = []
        
        @scroll = new scroll 
            dbg:        true
            lineHeight: 2
            viewHeight: @editor.viewHeight()
            
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
        y = (li-@scroll.exposeTop)*2
        line.attr
            transform: "translate(0 #{y})"
         
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
                lines.shift().remove()
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
        log 'minimap.updateLinePositions', start
        for li in [start...@lines.length]
            @lines[li].attr
                transform: "translate(0 #{li*2})"    

    #  0000000   000   000  00000000  0000000    000  000000000   0000000   00000000 
    # 000   000  0000  000  000       000   000  000     000     000   000  000   000
    # 000   000  000 0 000  0000000   000   000  000     000     000   000  0000000  
    # 000   000  000  0000  000       000   000  000     000     000   000  000   000
    #  0000000   000   000  00000000  0000000    000     000      0000000   000   000
    
    onEditorScroll: (scroll, topOffset) =>
        # log 'minimap.onEditorScroll', scroll, topOffset
        topBotHeight = (@editor.scroll.bot-@editor.scroll.top)*2
        # log "minimap.onEditorScroll topBotHeight #{topBotHeight}"
        @topBot.attr 
            y:        @editor.scroll.top*2
            height:   Math.max 0, topBotHeight
            
        if @scroll.fullHeight > @scroll.viewHeight
            fh = @scroll.fullHeight - @scroll.viewHeight
            rf = @editor.scroll.top*2 / @scroll.viewHeight
            # log "minimap.onEditorScroll fh #{fh} rf #{rf}"
            sc = parseInt fh * rf
            # log "minimap.onEditorScroll sc #{sc} max #{@scroll.scrollMax}"
            @scroll.to clamp 0, @scroll.scrollMax, sc
    
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
        log "minimap.onScroll t #{t} h #{h}"
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
# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      

{
getStyle,
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
            dbg:        false
            lineHeight: 2
            viewHeight: @editor.viewHeight()
            
        log 'minimap.scroll', @scroll.info()
        
        @scroll.on 'clearLines', @clearLines
        @scroll.on 'exposeTop',  @exposeTop
        @scroll.on 'exposeLine', @exposeLine
        @scroll.on 'vanishLine', @vanishLine
        @scroll.on 'scroll',     @updateView

        @editor.on 'viewHeight',    @scroll.setViewHeight
        @editor.on 'numLines',      @scroll.setNumLines
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
                    @lines.splice(li, 1, @lineForIndex li)[0].remove()
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
        @updateView()  
                                
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    exposeLine: (li) =>
        # log 'minimap.exposeLine', li
        @lines.push @lineForIndex li                            
        @updateView()
        
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    vanishLine: (li) =>
        # log 'minimap.vanishLine', li
        if li == @lines.length-1
            @lines.pop().remove()
        # @updateView()
    
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
        for li in [start...@lines.length]
            @lines[li].attr
                transform: "translate(0 #{li*2})"    

    # 000   000  00000000   0000000     0000000   000000000  00000000  000   000  000  00000000  000   000
    # 000   000  000   000  000   000  000   000     000     000       000   000  000  000       000 0 000
    # 000   000  00000000   000   000  000000000     000     0000000    000 000   000  0000000   000000000
    # 000   000  000        000   000  000   000     000     000          000     000  000       000   000
    #  0000000   000        0000000    000   000     000     00000000      0      000  00000000  00     00
    
    updateView: =>
        @s.attr
             viewBox: "0 0 120 #{@scroll.viewHeight}"   
                
        return if @scroll.viewHeight == 0
        # log "minimap.updateView @scroll.viewHeight", @scroll.viewHeight, @scroll.info()     
                  
        @buffer.attr
            height:   @scroll.numLines*2
        
        @topBot.attr 
            y:        @scroll.top*2
            height:   Math.max 0, (@scroll.exposeBot-@scroll.exposeTop)*2
    
    onEditorScroll: (scroll, topOffset) =>
        # log 'minimap.onEditorScroll', scroll, topOffset
    
    width: -> parseInt getStyle '.minimap', 'width'
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
    
    clear: ->
        for l in @lines
            l.remove()
        @lines = []        
        
module.exports = Minimap
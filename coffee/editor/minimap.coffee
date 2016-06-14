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
Snap    = require 'snapsvg'

class Minimap

    constructor: (@editor) ->
        
        @elem = $(".minimap")
        
        @s = Snap ".minimap"
        @s.attr
            overflow: 'hidden'
            viewBox:  '0 0 120 0'

        @lines = []
        @top = 0

        @buffer = @s.rect()
        @buffer.attr
            x:         0
            y:         0
            width:    '100%'
        @buffer.addClass 'buffer'

        @topBot = @s.rect()
        @topBot.attr
            x:         0
            y:         0
            width:    '100%'
        @topBot.addClass 'topBot'
                
    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
            
    scroll: ->
        # log "minimap.scroll"
        scroll = @editor.scroll
        return if scroll.viewHeight <= 0
        
        if scroll.numLines > scroll.viewHeight/2 
            top = Math.max 0, scroll.bot*2 - scroll.viewHeight
            if top != @top
                @renderLines top
                # log 'minimap.scroll.top', @top # check for overlaps?
        
        @s.attr
            viewBox:  "0 0 120 #{scroll.viewHeight}"
            
        @buffer.attr
            height:   scroll.numLines*2
        
        @topBot.attr 
            y:        scroll.top*2
            height:   (scroll.bot-scroll.top)*2

    # 000      000  000   000  00000000
    # 000      000  0000  000  000     
    # 000      000  000 0 000  0000000 
    # 000      000  000  0000  000     
    # 0000000  000  000   000  00000000
    
    lineForIndex: (li) ->
        t = @editor.lines[li]
        line = @s.group()       
        line.attr
            transform: "translate(0 #{(li-@top)*2})"
         
        if showSpaces?
            l = @s.rect()
            l.attr
                height: 2
                x:      0
                width:  t.length
            l.addClass 'space'
            line.add l
        
        diss = @editor.syntax.getDiss li
        if diss.length
            for r in diss
                # log 'li', li, r
                if r.match?
                    continue if r.match.trim().length == 0 # ignore spaces
                else
                    log 'warning! no match?', li, r
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
                        log 'warning! no last(r.stack)?.split?', li, r.stack
                else
                    log 'warning! no stack?', li, r
                    c.addClass 'text'
                line.add c            
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
                
        for li in [invalidated...@lines.length]
            @lines[li].attr
                transform: "translate(0 #{li*2})"
                
    # 00000000   00000000  000   000  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  0000000   0000000  
    # 000   000  000       000  0000  000   000  000       000   000
    # 000   000  00000000  000   000  0000000    00000000  000   000
    
    renderLines: (@top=0) ->
        scroll = @editor.scroll
        return if scroll.viewHeight <= 0
        # profile 'minimap.renderLines'
        @clear()
        @bot = Math.min scroll.numLines, @top+scroll.viewHeight/2
        for li in [@top...@bot]           
            @lines.push @lineForIndex li
                            
        @scroll()
        # profile 'minimap.done'
    
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
#  0000000   0000000  00000000    0000000   000      000    
# 000       000       000   000  000   000  000      000    
# 0000000   000       0000000    000   000  000      000    
#      000  000       000   000  000   000  000      000    
# 0000000    0000000  000   000   0000000   0000000  0000000
{
clamp
}      = require '../tools/tools'
log    = require '../tools/log'
events = require 'events'

class Scroll extends events

    constructor: (cfg) ->

        @lineHeight = cfg.lineHeight ? 0
        @viewHeight = cfg.viewHeight ? 0
        @exposeMax  = cfg.exposeMax ? -2 # <0: -v * viewLines | 0: unlimited | >0: v * 1
        @smooth     = cfg.smooth ? true
        @dbg        = cfg.dbg
        @init()
        
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    init: ->
        @scroll       = 0 # current scroll value from document start (pixels)
        @offsetTop    = 0 # height of view above first visible line (pixels)
        @offsetSmooth = 0 # smooth scrolling offset / part of top line that is hidden (pixels)
        @fullHeight   = 0 # total height of buffer (pixels)
        @numLines     = 0 # total number of lines in buffer
        @top          = 0 # index of first visible line in view
        @bot          = 0 # index of last  visible line in view
        @exposed      = 0 # number of currently exposed lines
        @exposeTop    = 0 # index of topmost line in view (always <= @top)
        @exposeBot    = -1 # index of bottom line in view (always >= @bot)
        @calc()

    calc: ->
        @scrollMax   = Math.max(0,@fullHeight - @viewHeight)  # maximum scroll offset (pixels)
        @fullLines   = Math.floor(@viewHeight / @lineHeight)  # number of lines in view (excluding partials)
        @viewLines   = Math.ceil(@viewHeight / @lineHeight)   # number of lines in view (including partials)
        @linesHeight = @viewLines * @lineHeight               # height of visible lines (pixels)

        if @exposeMax < 0
            @exposeNum = -@exposeMax * @viewLines # maximum size of expose range is viewHeight dependent
        else
            @exposeNum = @exposeMax
        
        @offsetTop    = -1 # little hack to emit initial scroll

    # 000  000   000  00000000   0000000 
    # 000  0000  000  000       000   000
    # 000  000 0 000  000000    000   000
    # 000  000  0000  000       000   000
    # 000  000   000  000        0000000 
    
    info: ->
        topbot: "#{@top} .. #{@bot} = #{@bot-@top} / #{@numLines}"
        expose: "#{@exposeTop} .. #{@exposeBot} = #{@exposed} / #{@exposeNum}"
        scroll: "#{@scroll} offsetTop #{@offsetTop} scrollMax #{@scrollMax} fullLines #{@fullLines} viewLines #{@viewLines} viewHeight #{@viewHeight}"
        
    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
    
    reset: =>
        @emit 'clearLines'
        @init()

    # 000000000   0000000 
    #    000     000   000
    #    000     000   000
    #    000     000   000
    #    000      0000000 
    
    to: (p) => @by p-@scroll
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    by: (delta) => 
        
        scroll = @scroll
        delta = 0 if Number.isNaN delta
        @scroll = parseInt clamp 0, @scrollMax, @scroll+delta
        top = parseInt @scroll / @lineHeight
        @offsetSmooth = @scroll - top * @lineHeight 
        
        @setTop top

        offset = 0
        offset += @offsetSmooth if @smooth
        offset += (top - @exposeTop) * @lineHeight
        
        if offset != @offsetTop or scroll != @scroll
            @offsetTop = parseInt offset            
            @emit 'scroll', @scroll, @offsetTop

    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) =>

        if top != @top
            @top = top
            @emit 'top', @top
            
        newBot = Math.min @top+@viewLines, @numLines-1
        if @bot != newBot
            @bot = newBot
            @emit 'bot', @bot
            
        @expose()

    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
    
    expose: =>
        console.log "scroll.expose start", @info() if @dbg
        
        if @exposeNum == 0 # only exposing if expose range is unlimited
            while @bot > @exposeBot
                @exposeBot += 1
                @exposed = @exposeBot - @exposeTop
                @emit 'exposeLine', @exposeBot
            return
        
        topDiff = @exposeTop - @top
        botDiff = @exposeBot - @bot
        
        return if (@exposed <= @exposedNum) and (topDiff <= 0) and (botDiff >= 0)
        
        if (@top >= @exposeBot) or (@bot <= @exposeTop) # new range outside, start from scratch
            @emit 'clearLines'
            @exposeTop = @top
            @exposeBot = @top-1
            while @bot > @exposeBot
                @exposeBot += 1
                @exposed = @exposeBot - @exposeTop
                @emit 'exposeLine', @exposeBot
            return
        
        if (@top < @exposeTop) # move exposeTop
            old = @exposeTop
            @exposeTop = @top
            @exposed = @exposeBot - @exposeTop
            @emit 'exposeTop',
                old: old
                new: @exposeTop
                num: -(@top-old)
                
        while (@bot > @exposeBot)
            @exposeBot += 1
            @exposed = @exposeBot - @exposeTop
            @emit 'exposeLine', @exposeBot
                            
        # 000   000   0000000   000   000  000   0000000  000   000
        # 000   000  000   000  0000  000  000  000       000   000
        #  000 000   000000000  000 0 000  000  0000000   000000000
        #    000     000   000  000  0000  000       000  000   000
        #     0      000   000  000   000  000  0000000   000   000

        while (@bot < @exposeBot) and (@exposed > @exposeNum) or (@exposeBot > @numLines-1)
            @emit 'vanishLine', @exposeBot
            @exposeBot -= 1
            @exposed = @exposeBot - @exposeTop
            
        if (@top > @exposeTop) and (@exposed > @exposeNum)
            old = @exposeTop
            @exposeTop = @top
            @exposed = @exposeBot - @exposeTop
            @emit 'exposeTop',
                old: old
                new: @exposeTop
                num: -(@top-old)            

    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertLine: (li,oi) =>
        @numLines += 1
        @fullHeight = @numLines * @lineHeight
        @exposeTop += 1 if oi < @exposeTop
        @exposeBot += 1 if oi <= @exposeBot or oi == @numLines-1
        @top += 1 if oi < @top
        @bot += 1 if oi <= @bot
        @exposed = @exposeBot - @exposeTop
        @calc()
        
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000

    deleteLine: (li,oi) =>
        @numLines -= 1
        @fullHeight = @numLines * @lineHeight
        @exposeTop -= 1 if oi < @exposeTop
        @exposeBot -= 1 if oi <= @exposeBot
        @top -= 1 if oi < @top
        @bot -= 1 if oi <= @bot
        @exposed = @exposeBot - @exposeTop
        @calc()
    
    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) =>
                    
        if @viewHeight != h
            @viewHeight = h
            @calc()
            @by 0     
            
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n) =>
        
        if @numLines != n
            @numLines = n
            @fullHeight = @numLines * @lineHeight
            @calc()
            @by 0

    # 000      000  000   000  00000000  000   000  00000000  000   0000000   000   000  000000000
    # 000      000  0000  000  000       000   000  000       000  000        000   000     000   
    # 000      000  000 0 000  0000000   000000000  0000000   000  000  0000  000000000     000   
    # 000      000  000  0000  000       000   000  000       000  000   000  000   000     000   
    # 0000000  000  000   000  00000000  000   000  00000000  000   0000000   000   000     000   

    setLineHeight: (h) =>
            
        if @lineHeight != h
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @calc()
            @by 0

module.exports = Scroll

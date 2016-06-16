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

class scroll extends events

    constructor: (cfg) ->

        @lineHeight = cfg.lineHeight ? 0
        @viewHeight = cfg.viewHeight ? 0
        @exposeMax  = cfg.exposeMax ? -2 # <0: -v * viewLines | 0: unlimited | >0: v * line
        @smooth     = cfg.smooth ? true
        @dbg        = cfg.dbg
        @init()
        
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    init: ->
        # log "scroll.init"
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

        @scrollMax  = Math.max(0,@fullHeight - @viewHeight + @lineHeight)  # maximum scroll offset (pixels)
        @fullLines  = Math.floor(@viewHeight / @lineHeight)  # number of lines in view (excluding partials)
        @viewLines  = Math.ceil(@viewHeight / @lineHeight)   # number of lines in view (including partials)
        if @exposeMax < 0
            @exposeNum = -@exposeMax * @viewLines # maximum size of expose range is viewHeight dependent
        else
            @exposeNum = @exposeMax
        
        # log "scroll.calc", @ if @dbg

    # 000  000   000  00000000   0000000 
    # 000  0000  000  000       000   000
    # 000  000 0 000  000000    000   000
    # 000  000  0000  000       000   000
    # 000  000   000  000        0000000 
    
    info: ->
        topbot: "#{@top} .. #{@bot} = #{@bot-@top} / #{@numLines}"
        expose: "#{@exposeTop} .. #{@exposeBot} = #{@exposed} / #{@exposeNum}"
        scroll: "#{@scroll} offsetTop #{@offsetTop} max #{@scrollMax} full #{@fullLines} view #{@viewLines}"
        
    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
    
    reset: =>
        log "scroll.reset emit clearLines" if @dbg
        @emit 'clearLines'
        @init()

    # 000000000   0000000 
    #    000     000   000
    #    000     000   000
    #    000     000   000
    #    000      0000000 
    
    to: (p) => @by -@scroll
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    by: (delta) => 
        # log "scroll.by delta #{delta}", @ if @dbg                
        @scroll = clamp 0, @scrollMax, @scroll+delta
        # log "scroll.by delta #{delta} scroll #{@scroll} scrollMax #{@scrollMax}" if @dbg
        top = parseInt @scroll / @lineHeight
        # log "scroll.by delta #{delta} scroll #{@scroll} lineHeight #{@lineHeight}" if @dbg
        @offsetSmooth = @scroll - top * @lineHeight 

        @setTop top

        offset = 0
        offset += @offsetSmooth if @smooth
        offset += (@top - @exposeTop) * @lineHeight
        # log "scroll.by delta #{delta} offset #{offset}"
        if offset != @topOffset
            @offsetTop = offset
            @emit 'scroll', @scroll, @offsetTop

    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) =>

        if top != @top
            # log "scroll.setTop #{@top} -> #{top}"
            @top = top
            @emit 'top', @top
            
        newBot = Math.min @top+@viewLines, @numLines-1
        # log "scroll.setTop @top #{@top} @bot #{@bot} newBot #{newBot} viewLines #{@viewLines} numLines #{@numLines}"
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
        # log "scroll.expose start", @info() if @dbg
        
        if @exposeNum == 0 # only exposing if expose range is unlimited
            while @bot > @exposeBot
                @exposeBot += 1
                @exposed = @exposeBot - @exposeTop
                log "scroll.expose emit exposeLine #{@exposeBot}" if @dbg
                @emit 'exposeLine', @exposeBot
            return
        
        topDiff = @exposeTop - @top
        botDiff = @exposeBot - @bot
        
        return if (@exposed <= @exposedNum) and (topDiff <= 0) and (botDiff >= 0)
        
        if (@top >= @exposeBot) or (@bot <= @exposeTop) # new range outside, start from scratch
            log "scroll.expose emit clearLines" if @dbg
            @emit 'clearLines'
            @exposeTop = @top
            @exposeBot = @top-1
            while @bot > @exposeBot
                @exposeBot += 1
                @exposed = @exposeBot - @exposeTop
                log "scroll.expose emit exposeLine #{@exposeBot}" if @dbg
                @emit 'exposeLine', @exposeBot
            return
        
        if (@top < @exposeTop) # move exposeTop
            old = @exposeTop
            @exposeTop = @top
            @exposed = @exposeBot - @exposeTop
            log "scroll.expose emit exposeTop #{old} -> #{@exposeTop} (num #{-(@top-old)})" if @dbg
            @emit 'exposeTop',
                old: old
                new: @exposeTop
                num: -(@top-old)
                
        while @bot > @exposeBot
            @exposeBot += 1
            @exposed = @exposeBot - @exposeTop
            log "scroll.expose emit exposeLine #{@exposeBot}" if @dbg
            @emit 'exposeLine', @exposeBot
                        
        # log "scroll.expose end", @info() if @dbg
    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
        
    vanish: =>
        while @bot < @exposeBot and @exposed > @exposeNum
            log "scroll.vanish emit vanishLine #{@exposeBot}" if @dbg
            @emit 'vanishLine', @exposeBot
            @exposeBot -= 1
            @exposed = @exposeBot - @exposeTop

    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) =>
                    
        if @viewHeight != h
            log "scroll.setViewHeight #{@viewHeight} -> #{h}" if @dbg
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
            log "scroll.setNumLines #{@numLines} -> #{n}" if @dbg
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
            log "scroll.setLineHeight #{@lineHeight} -> #{h}" if @dbg
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @calc()
            @by 0

module.exports = scroll
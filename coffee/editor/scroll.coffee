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
        @exposeMax  = cfg.exposeMax ? -1 # <0: -v * viewLines | 0: unlimited | >0: v * line
        @smooth     = cfg.smooth ? true
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
        @exposeTop    = 0 # index of topmost line in view (always <= @top)
        @exposeBot    = -1 # index of bottom line in view (always >= @bot)
        @calc()

    calc: ->

        @scrollMax  = Math.max(0,@fullHeight - @viewHeight + @lineHeight)  # maximum scroll offset (pixels)
        @fullLines  = Math.floor(@viewHeight / @lineHeight)  # number of lines in view (excluding partials)
        @viewLines  = Math.ceil(@viewHeight / @lineHeight)   # number of lines in view (including partials)

    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
    
    reset: ->
        # log "scroll.reset"
        while @exposeBot >= 0  
            # log "scroll.reset vanish #{@exposeBot}"
            @emit 'vanishLine', @exposeBot
            @exposeBot -= 1
        
        @init()
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    by: (delta) -> 
                        
        @scroll = clamp 0, @scrollMax, @scroll+delta
        
        top = parseInt @scroll / @lineHeight
        
        @offsetSmooth = @scroll - top * @lineHeight 

        @setTop top

        offset = 0
        offset += @offsetSmooth if @smooth
        offset += (@top - @exposeTop) * @lineHeight
        # log "scroll.by delta #{delta} offset #{offset}"
        if offset != @topOffset
            @offsetTop = offset
            @emit 'scroll', @topOffset

    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) ->

        if top != @top
            # log "scroll.setTop #{@top} -> #{top}"
            @top = top
            @emit 'top', @top
            
        newBot = Math.min @top+@viewLines, @numLines-1
        log "scroll.setTop @top #{@top} @bot #{@bot} newBot #{newBot} viewLines #{@viewLines} numLines #{@numLines}"
        if @bot != newBot
            @bot = newBot
            @emit 'bot', @bot
            @expose()
        if @exposeBot < 0
            @expose()

    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
    
    expose: ->
        # log "scroll.expose bot #{@bot} exposeBot #{@exposeBot}"
        while @bot > @exposeBot
            # log "scroll.expose below #{@bot} < #{@exposeBot}"
            @exposeBot += 1
            @emit 'exposeLine', @exposeBot
            
        @checkExpose()
        
    #  0000000  000   000  00000000   0000000  000   000
    # 000       000   000  000       000       000  000 
    # 000       000000000  0000000   000       0000000  
    # 000       000   000  000       000       000  000 
    #  0000000  000   000  00000000   0000000  000   000
        
    checkExpose: ->
        # log "scroll.checkExpose @exposeMax #{@exposeMax}"
        return if @exposeMax == 0
        expMax = @exposeMax
        if expMax < 0
            expMax = -expMax * @viewLines
        exposed = @exposeBot - @exposeTop
        # log "scroll.checkExpose exposeTop #{@exposeTop} exposeBot #{@exposeBot}?"
        # log "scroll.checkExpose exposed #{exposed} > expMax #{expMax}?"
        if exposed > expMax
            old = @exposeTop
            @exposeTop = @exposeBot - expMax
            log "scroll.checkExpose emit exposeTop #{old} -> #{@exposeTop}"
            @emit 'exposeTop',
                old: old
                new: @exposeTop
                num: old-@exposeTop
    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
        
    vanish: ->
        while @bot < @exposeBot    
            # log "scroll.vanish bot #{@bot} < #{@exposeBot}"
            @emit 'vanishLine', @exposeBot
            @exposeBot -= 1
                    

    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) ->
                    
        if @viewHeight != h
            log "scroll.setViewHeight #{@viewHeight} -> #{h}"
            @viewHeight = h        
            @calc()
            @by 0     
            
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n) ->
        
        if @numLines != n
            log "scroll.setNumLines #{@numLines} -> #{n}"
            @numLines = n
            @fullHeight = @numLines * @lineHeight
            @calc()
            @by 0

    # 000      000  000   000  00000000  000   000  00000000  000   0000000   000   000  000000000
    # 000      000  0000  000  000       000   000  000       000  000        000   000     000   
    # 000      000  000 0 000  0000000   000000000  0000000   000  000  0000  000000000     000   
    # 000      000  000  0000  000       000   000  000       000  000   000  000   000     000   
    # 0000000  000  000   000  00000000  000   000  00000000  000   0000000   000   000     000   

    setLineHeight: (h) ->
            
        if @lineHeight != h
            # log "scroll.setLineHeight #{@lineHeight} -> #{h}"
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @calc()
            @by 0

module.exports = scroll
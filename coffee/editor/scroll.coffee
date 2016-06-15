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

        @lineHeight = cfg.lineHeight
        @viewHeight = cfg.viewHeight
        @smooth     = cfg.smooth ? true
        @init()
        # log 'scroll', @
        
    reset: ->
        log "scroll.reset"
        while @exposeBot >= 0  
            # log "scroll.reset vanish #{@exposeBot}"
            @emit 'vanishLine', @exposeBot
            @exposeBot -= 1
        
        @init()
        
    init: ->
        log "scroll.init"
        @scroll     = 0
        @offsetTop  = 0
        @numLines   = 0
        @fullHeight = 0
        @top        = 0
        @bot        = 0
        @exposeTop  = 0
        @exposeBot  = -1

        @fullLines  = Math.floor(@viewHeight / @lineHeight)  # num lines in view (excluding partials)
        @viewLines  = Math.ceil(@viewHeight / @lineHeight)   # num lines in view (including partial)
        @scrollMax  = Math.max(0,@fullHeight - @viewHeight)  # maximum scroll offset (pixels)
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    by: (delta) -> 
                        
        @scroll = clamp 0, @scrollMax, @scroll+delta
        
        top = parseInt @scroll / @lineHeight
        
        scrollDiff = @scroll - top * @lineHeight 

        @setTop top

        offset = 0
        offset += scrollDiff if @smooth
        offset += (@top - @exposeTop) * @lineHeight
        # log "scroll.by delta #{delta} offset #{offset}"
        @offsetTop = offset

    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) ->
        emitScroll = false
        if top != @top
            # log "scroll.setTop #{@top} -> #{top}"
            @top = top
            @emit 'top', @top
            emitScroll = true
        newBot = Math.min @top+@viewLines, @numLines-1
        if @bot != newBot
            # log "scroll.setTop @top #{@top} @bot #{@bot} newBot #{newBot} viewLines #{@viewLines} numLines #{@numLines}"
            @bot = newBot
            @emit 'bot', @bot
            @expose()
            emitScroll = true
        if emitScroll
            @emit 'scroll'

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
            # o = @viewHeight
            # log "scroll.setViewHeight #{@viewHeight} -> #{h}"
            @viewHeight = h        
            @fullLines  = Math.ceil(@viewHeight / @lineHeight)
            @viewLines  = Math.ceil(@viewHeight / @lineHeight)
            @scrollMax  = Math.max(0,@fullHeight - @viewHeight)
            # log "scroll.setViewHeight", @
            @by 0     
            
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n) ->
        
        if @numLines != n
            # o = @numLines
            # log "scroll.setNumLines #{@numLines} -> #{n}"
            @numLines = n
            @fullHeight = @numLines * @lineHeight
            @scrollMax  = @fullHeight - @viewHeight
            @by 0

    # 000      000  000   000  00000000  000   000  00000000  000   0000000   000   000  000000000
    # 000      000  0000  000  000       000   000  000       000  000        000   000     000   
    # 000      000  000 0 000  0000000   000000000  0000000   000  000  0000  000000000     000   
    # 000      000  000  0000  000       000   000  000       000  000   000  000   000     000   
    # 0000000  000  000   000  00000000  000   000  00000000  000   0000000   000   000     000   

    setLineHeight: (h) ->
            
        if @lineHeight != h
            # log "scroll.setLineHeight #{@lineHeight} -> #{h}"
            # o = @lineHeight
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @fullLines  = Math.ceil(@viewHeight / @lineHeight)
            @viewLines  = Math.ceil(@viewHeight / @lineHeight)
            @scrollMax  = Math.max(0,@fullHeight - @viewHeight)
            @by 0

module.exports = scroll
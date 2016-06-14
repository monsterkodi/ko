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
        
        @scroll     = 0
        @offsetTop  = 0 
        @lineHeight = cfg.lineHeight
        @viewHeight = cfg.viewHeight
        @numLines   = cfg.numLines ? 1
        @smooth     = cfg.smooth ? true
        @fullHeight = @numLines * @lineHeight
        @fullLines  = Math.ceil(@viewHeight / @lineHeight)
        @viewLines  = Math.ceil(@viewHeight / @lineHeight)
        @scrollMax  = @fullHeight - @viewHeight
        @top        = 0
        @bot        = @top+@fullLines
        @exposeTop  = 0
        @exposeBot  = 0
        
        log 'scroll', @
        
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
            log "scroll.setTop #{@top} -> #{top}"
            @top = top
            @emit 'top', @top
            emitScroll = true
        if @bot != @top+@viewLines
            @bot = @top+@viewLines
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
        # while @top < @exposeTop
        #     log "scroll.expose above #{@top} < #{@exposeTop}"
        #     @exposeTop -= 1
        #     emit 'exposeLine', @exposeTop
        # log "scroll.expose bot #{@bot} exposeBot #{@exposeBot}"
        while @bot > @exposeBot
            log "scroll.expose below #{@bot} < #{@exposeBot}"
            @exposeBot += 1
            @emit 'exposeLine', @exposeBot
    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
        
    vanish: ->
        # while @top > @exposeTop
        #     log "scroll.vanish top #{@top} > #{@exposeTop}"
        #     emit 'vanishLine', @exposeTop
        #     @exposeTop += 1
        while @bot < @exposeBot    
            log "scroll.vanish bot #{@bot} < #{@exposeBot}"
            @emit 'vanishLine', @exposeBot
            @exposeBot -= 1
                    

    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) ->
                    
        if @viewHeight != h
            o = @viewHeight
            log "scroll.setViewHeight #{@viewHeight} -> #{h}"
            @viewHeight = h        
            @fullLines  = Math.ceil(@viewHeight / @lineHeight)
            @viewLines  = Math.ceil(@viewHeight / @lineHeight)
            @scrollMax  = @fullHeight - @viewHeight   
            
            if h > o # new lines exposed
                @expose()
            else if h < o # some lines hidden
                @vanish()
            
            @by 0     
    
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n) ->
        
        if @numLines != n
            o = @numLines
            log "scroll.setNumLines #{@numLines} -> #{n}"
            @numLines = n
            @fullHeight = @numLines * @lineHeight
            @scrollMax  = @fullHeight - @viewHeight
            
            if n > o # new lines exposed?
                @expose()                
            else if o > n # some lines hidden?
                @vanish()
            
            @by 0

    # 000      000  000   000  00000000  000   000  00000000  000   0000000   000   000  000000000
    # 000      000  0000  000  000       000   000  000       000  000        000   000     000   
    # 000      000  000 0 000  0000000   000000000  0000000   000  000  0000  000000000     000   
    # 000      000  000  0000  000       000   000  000       000  000   000  000   000     000   
    # 0000000  000  000   000  00000000  000   000  00000000  000   0000000   000   000     000   

    setLineHeight: (h) ->
            
        if @lineHeight != h
            log "scroll.setLineHeight #{@lineHeight} -> #{h}"
            o = @lineHeight
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @fullLines  = Math.ceil(@viewHeight / @lineHeight)
            @viewLines  = Math.ceil(@viewHeight / @lineHeight)
            @scrollMax  = @fullHeight - @viewHeight

            if h < o # new lines exposed?
                @expose()                
            else if h > o # some lines hidden?
                @vanish()

            @by 0

module.exports = scroll
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
        
        log 'scroll', @
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    by: (delta) -> 
                        
        @scroll = clamp 0, @scrollMax, @scroll+delta
        
        top = parseInt @scroll / @lineHeight
        dff = @scroll - top * @lineHeight 

        @setTop top

        if @smooth
            @offsetTop = dff

    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) ->
        if top != @top
            log "setTop #{@top} -> #{top}"
            @top = top
            @bot = @top+@viewLines
            @emit 'top', @top
            @emit 'scroll'

    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) ->
        if h > @viewHeight
            # new lines exposed
            exposed = []
            log "scroll.setViewHeight exposed #{exposed}"
        else if h < @viewHeight
            # some lines hidden
            hidden = []
            log "scroll.setViewHeight hidden #{hidden}"
                    
        if @viewHeight != h
            log "scroll.setViewHeight #{@viewHeight} -> #{h}"
            @viewHeight = h        
            @fullLines  = Math.ceil(@viewHeight / @lineHeight)
            @viewLines  = Math.ceil(@viewHeight / @lineHeight)
            @scrollMax  = @fullHeight - @viewHeight   
            @by 0     
    
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n) ->
        if n > @numLines
            # new lines exposed?
            exposed = []
            log "scroll.setNumLines exposed #{exposed}"            
        else if n < @numLines
            # some lines removed
            hidden = []
            log "scroll.setViewHeight hidden #{hidden}"
        
        if @numLines != n
            log "scroll.setNumLines #{@numLines} -> #{n}"
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
        if h > @lineHeight
            # some lines hidden?
            hidden = []
            log "scroll.setLineHeight hidden #{hidden}"
        else if h < @lineHeight
            # new lines exposed?
            exposed = []
            log "scroll.setLineHeight exposed #{exposed}"
            
        if @lineHeight != h
            log "scroll.setLineHeight #{@lineHeight} -> #{h}"
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight
            @fullLines  = Math.ceil(@viewHeight / @lineHeight)
            @viewLines  = Math.ceil(@viewHeight / @lineHeight)
            @scrollMax  = @fullHeight - @viewHeight
            @by 0

module.exports = scroll

#  0000000   0000000  00000000    0000000   000      000          00000   
# 000       000       000   000  000   000  000      000             000  
# 0000000   000       0000000    000   000  000      000            000   
#      000  000       000   000  000   000  000      000           000    
# 0000000    0000000  000   000   0000000   0000000  0000000      000000  

{ clamp, log
}      = require 'kxk'
events = require 'events'
kxk    = require 'kxk'

class Scroll extends events

    constructor: (@editor) ->

        @lineHeight = @editor.size.lineHeight ? 0
        @viewHeight = -1
        @init()

    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    init: ->
        @log 'init ---------------------'        
        @scroll       =  0 # current scroll value from document start (pixels)
        @offsetTop    =  0 # height of view above first visible line (pixels)
        @offsetSmooth =  0 # smooth scrolling offset / part of top line that is hidden (pixels)
        
        @fullHeight   = -1 # total height of buffer (pixels)
        @fullLines    = -1 # number of lines in view (excluding partials)
        @viewLines    = -1 # number of lines in view (including partials)
        @scrollMax    = -1 # maximum scroll offset (pixels)
        @numLines     = -1 # total number of lines in buffer
        @linesHeight  = -1 # height of visible lines (pixels)
        @top          = -1 # index of first visible line in view
        @bot          = -1 # index of last  visible line in view

    #  0000000   0000000   000       0000000  
    # 000       000   000  000      000       
    # 000       000000000  000      000       
    # 000       000   000  000      000       
    #  0000000  000   000  0000000   0000000  
    
    calc: ->
        if @viewHeight < 0
            return
        @scrollMax   = Math.max(0,@fullHeight - @viewHeight)  # maximum scroll offset (pixels)
        @fullLines   = Math.floor(@viewHeight / @lineHeight)  # number of lines in view (excluding partials)
        @viewLines   = Math.ceil(@viewHeight / @lineHeight)   # number of lines in view (including partials)
        @linesHeight = @viewLines * @lineHeight               # height of visible lines (pixels)
        # @log @info()
        
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    to: (p) => @by p-@scroll
    by: (delta) =>
        
        return if @viewLines < 0
        
        scroll = @scroll
        delta = 0 if Number.isNaN delta
        @scroll = parseInt clamp 0, @scrollMax, @scroll+delta
        top = parseInt @scroll / @lineHeight
        @offsetSmooth = @scroll - top * @lineHeight 
        
        @setTop top

        offset = 0
        offset += @offsetSmooth
        offset += (top - @top) * @lineHeight
        
        if offset != @offsetTop or scroll != @scroll
            @offsetTop = parseInt offset
            @emit 'scroll', @scroll, @offsetTop

    #  0000000  00000000  000000000  000000000   0000000   00000000 
    # 000       000          000        000     000   000  000   000
    # 0000000   0000000      000        000     000   000  00000000 
    #      000  000          000        000     000   000  000      
    # 0000000   00000000     000        000      0000000   000      
            
    setTop: (top) =>
        
        oldTop = @top
        oldBot = @bot
        
        @top = top
        @bot = Math.min @top+@viewLines, @numLines-1
        # @log 'top', oldTop, @top, 'bot', oldBot, @bot
        return if oldTop == @top and oldBot == @bot
            
        if (@top > oldBot) or (@bot < oldTop) # new range outside, start from scratch
            
            num = @bot - @top + 1
            
            if num > 0
                # @log "-showLines #{@top+1} #{@bot+1} num: #{num}"
                @emit 'showLines', @top, @bot, num

        else   
            
            num = @top - oldTop
            
            if 0 < Math.abs num
                # @log "shiftLines #{@top+1} #{@bot+1} num:#{num}"
                @emit 'shiftLines', @top, @bot, num
                
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertLine: (li,oi) =>
        
        @bot       += 1 if @lineIndexIsInView oi
        @top       += 1 if oi < @top
        @numLines  += 1
        @fullHeight = @numLines * @lineHeight
        @calc()
        
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000

    deleteLine: (li,oi) =>
        
        @bot       -= 1 if @lineIndexIsInView oi
    
    lineIndexIsInView: (li) -> 
        
        return true if @top <= li <= @bot
        return @bot-@top+1 < @fullLines

    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
    
    reset: =>
        
        @emit 'clearLines'
        @init()
        
    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) =>
        
        if @viewHeight != h
            # @log 'setViewHeight', @viewHeight, h
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
            # @log 'setNumLines', @numLines, n
            @numLines = n
            @fullHeight = @numLines * @lineHeight            
            if @numLines
                @calc()
                @by 0
            else
                @init()
                @log 'clearLines'
                @emit 'clearLines'             

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

    # 000  000   000  00000000   0000000 
    # 000  0000  000  000       000   000
    # 000  000 0 000  000000    000   000
    # 000  000  0000  000       000   000
    # 000  000   000  000        0000000 
    
    info: ->
        
        topbot: "#{@top} .. #{@bot} = #{@bot-@top} / #{@numLines} lines"
        scroll: "#{@scroll} offsetTop #{@offsetTop} viewHeight #{@viewHeight} scrollMax #{@scrollMax} fullLines #{@fullLines} viewLines #{@viewLines}"
        
    log: ->
        return if @editor.name != 'editor'
        log.slog.depth = 3
        log.apply log, [].splice.call arguments, 0
        log.slog.depth = 2
            
module.exports = Scroll

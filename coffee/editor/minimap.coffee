# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      

log  = require '../tools/log'
Snap = require 'snapsvg'

class Minimap

    constructor: (@editor) ->
        
        log 'minimap'
        @s = Snap ".minimap"
        @s.attr
            overflow: 'hidden'

        @lines = []

        @buffer = @s.rect()
        @buffer.attr
            fill:     'rgba(100,100,100,0.1)'
            x:         0
            y:         0
            width:    '100%'

        @topBot = @s.rect()
        @topBot.attr
            fill:     'rgba(100,100,100,0.3)'
            x:         0
            y:         0
            width:    '100%'
            
    resized: ->
        log 'resized'
        @s.attr
            viewBox:  "0 0 100 #{@editor.viewHeight()}"
            
    updateScroll: ->
        
        @buffer.attr
            height:   @editor.lines.length*2
        
        @topBot.attr 
            y:        @editor.topIndex*2
            height:   (@editor.botIndex-@editor.topIndex)*2

    renderLines: () ->
        # log 'minimap.renderLines'
        @clear()
        for li in [0...@editor.lines.length]
            t = @editor.lines[li]
            line = @s.group()
            @lines.push line            
            
            l = @s.rect()
            l.attr
                height: 2
                y:      li*2
                width:  t.length
                fill:   'rgba(255,255,255,0.1)'
            line.add l
            
            rgs = @editor.nonSpaceRangesInLineAtIndex li
            log 'rgs', rgs
            for r in @editor.nonSpaceRangesInLineAtIndex li
                log 'r', li, r
                c = @s.rect()
                c.attr
                    height: 2
                    y:      li*2
                    x:      r[1][0]
                    width:  r[1][1]-r[1][0]
                    fill:   'white'
                line.add c
            
    changed: (changeInfo) ->
        log 'minimap.changed', changeInfo        
        
    clear: ->
        for l in @lines
            l.remove()
        @lines = []        
        
module.exports = Minimap
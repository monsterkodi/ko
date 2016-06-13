# 00     00  000  000   000  000  00     00   0000000   00000000 
# 000   000  000  0000  000  000  000   000  000   000  000   000
# 000000000  000  000 0 000  000  000000000  000000000  00000000 
# 000 0 000  000  000  0000  000  000 0 000  000   000  000      
# 000   000  000  000   000  000  000   000  000   000  000      

{
getStyle,
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
        return if @editor.viewHeight() <= 0
        # log 'scroll vh', @editor.viewHeight(), 'll', @editor.lines.length, 'tb', @editor.botIndex-@editor.topIndex
        
        if @editor.lines.length > @editor.viewHeight()/2 
            top = Math.max 0, @editor.botIndex*2 - @editor.viewHeight()
        else
            top = 0
        
        @s.attr
            viewBox:  "0 #{top} 120 #{@editor.viewHeight()}"
            
        @buffer.attr
            height:   @editor.lines.length*2
        
        @topBot.attr 
            y:        @editor.topIndex*2
            height:   (@editor.botIndex-@editor.topIndex)*2

    # 00000000   00000000  000   000  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  0000000   0000000  
    # 000   000  000       000  0000  000   000  000       000   000
    # 000   000  00000000  000   000  0000000    00000000  000   000
    
    renderLines: () ->
        return if @editor.viewHeight() <= 0
        profile 'minimap.renderLines'
        @clear()
        for li in [0...@editor.lines.length]
            t = @editor.lines[li]
            line = @s.group()
            @lines.push line            
            
            if showSpaces?
                l = @s.rect()
                l.attr
                    height: 2
                    y:     li*2
                    x:     0
                    width:     t.length
                l.addClass 'space'
                line.add l
                
            rgs = @editor.nonSpaceRangesInLineAtIndex li
            for r in @editor.nonSpaceRangesInLineAtIndex li
                c = @s.rect()
                c.attr
                    height: 2
                    y:      li*2
                    x:      r[1][0]
                    width:  r[1][1]-r[1][0]
                if t.trimLeft()[0] == '#'
                    c.addClass 'comment' 
                line.add c
                
        @scroll()
        profile 'minimap.done'

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo) ->
        # log 'minimap.changed', changeInfo        
    
    width: -> parseInt getStyle '.minimap', 'width'
    
    clear: ->
        for l in @lines
            l.remove()
        @lines = []        
        
module.exports = Minimap
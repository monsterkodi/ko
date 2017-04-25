
# 00000000    0000000   000   000  00000000
# 000   000  000   000  0000  000  000     
# 00000000   000000000  000 0 000  0000000 
# 000        000   000  000  0000  000     
# 000        000   000  000   000  00000000

{ getStyle, log 
} = require 'kxk'

class Pane
    
    constructor: (opt) ->
        @[k] = v for k,v of opt
        @pos      = 0
        @size    ?= @fixed ? @min ? 0
        @size     = -1 if @collapsed
        @id      ?= @div.id ? "pane"
        @display ?= @div.style.display if @div.style.display.length
        @display ?= getStyle "##{@div.id}", 'display' if @div.id?
        @display ?= getStyle ' .'+@div.className.split(' ').join ' .' if @div.className.length
        @display ?= 'initial'
    
    update: ->
        @size = parseInt @collapsed and -1 or Math.max @size, 0
        @pos  = @flex.pane(@index-1).pos + Math.max(0, @flex.pane(@index-1).size) + @flex.handleSize if @index
        @div.style.display = @collapsed and 'none' or @display
        @div.style.flex = @fixed and "0 0 #{@fixed}px" or @size and "1 1 #{@size}px" or "1 1 0"
        @div.style[@flex.dimension] = "#{@fixed}px" if @fixed

    setSize: (@size) -> @update()
    setPos:  (@pos)  -> 
    
    del:       -> @div?.remove() ; delete @div
    collapse:  -> @collapsed = true; @setSize -1
    expand:    -> delete @collapsed; @setSize @fixed ? 0
    isVisible: -> not @collapsed
    
    actualPos: -> 
        @div.style.display = @display
        r = @div.getBoundingClientRect()[@flex.position]
        @div.style.display = @isVisible() and @display or 'none'
        parseInt r - @flex.pos()

    actualSize: ->
        if @collapsed then return -1
        parseInt @div.getBoundingClientRect()[@flex.dimension]
        
module.exports = Pane

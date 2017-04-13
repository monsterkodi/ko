# 00000000    0000000   000   000  00000000
# 000   000  000   000  0000  000  000     
# 00000000   000000000  000 0 000  0000000 
# 000        000   000  000  0000  000     
# 000        000   000  000   000  00000000

{ getStyle, log } = require 'kxk'

class Pane
    
    constructor: (opt) ->
        @[k] = v for k,v of opt
        @size    ?= @fixed ? @min ? 0
        @size     = -1 if @collapsed
        @id      ?= @div.id ? "pane"
        @display ?= @div.style.display if @div.style.display.length
        @display ?= getStyle "##{@div.id}", 'display' if @div.id?
        @display ?= getStyle ' .'+@div.className.split(' ').join ' .' if @div.className.length
        @display ?= 'initial'
    
    update: -> 
        @size = Math.max @size, @collapsed and -1 or 0
        @div.style.display = @collapsed and 'none' or @display
        @div.style.flex = @fixed and "0 0 #{@fixed}px" or @size and "1 1 #{@size}px" or "1 1 0"

    setSize: (@size) -> @update()
    
    del:       -> @div?.remove() ; delete @div
    collapse:  -> @collapsed = true; @setSize -1
    expand:    -> delete @collapsed; @setSize @fixed ? 0
    isVisible: -> not @collapsed
    
    pos: -> 
        @div.style.display = @display
        r = @div.getBoundingClientRect()[@flex.position]
        @div.style.display = @isVisible() and @display or 'none'
        r - @flex.pos()

    actualSize: ->
        if @collapsed then return -1
        @div.getBoundingClientRect()[@flex.dimension]
        
module.exports = Pane

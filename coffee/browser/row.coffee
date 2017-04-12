# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, post, error, log, $, _ 
} = require 'kxk'

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->
        @div = elem class: 'browserRow', html: syntax.spanForText @item.name
        @div.classList.add @item.type
        @div.addEventListener 'click', @onClick
        @column.div.appendChild @div
   
    index: -> @column.rows.indexOf @
    
    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: => @setActive()
    
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  

    isActive: ->
        @div.classList.contains 'active'
    
    setActive: ->
        
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        
        switch @item.type
            when 'dir'  then @column.browser.loadDir     @item.abs, column: @column.index+1, parent: @item
            when 'file' then @column.browser.loadContent @item.abs, column: @column.index+1, parent: @item
        
    clearActive: ->
        @div.classList.remove 'active'

module.exports = Row

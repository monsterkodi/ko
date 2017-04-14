# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, post, error, log, $, _ } = require 'kxk'

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->

        @div = elem class: 'browserRow', html: syntax.spanForText @item.text ? @item.name
        @div.classList.add @item.type
        @div.addEventListener 'click', @activate
        @div.addEventListener 'dblclick', => @column.navigateCols 'enter'
        @column.div.appendChild @div
   
    index: -> @column.rows.indexOf @
    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: =>
        @setActive emit:true
        switch @item.type
            when 'dir'  then @column.browser.loadDir     @item.abs, column: @column.index+1, parent: @item
            when 'file' then @column.browser.loadContent @item,     column: @column.index+1
            else post.emit 'jumpTo', file: @item.file, line: @item.line
        @
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: (opt = emit:false) ->
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        post.emit 'browser-item-activated', @item if opt?.emit
        @
                
    clearActive: ->
        @div.classList.remove 'active'
        @

module.exports = Row

# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{elem, post, error, log, $, _ 
} = require 'kxk'

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->
        text = @item.text ? @item.rel
        @div = elem class: 'browserRow', html: syntax.spanForText text
        @div.classList.add @item.type
        @div.addEventListener 'click', @onClick
        @column.div.appendChild @div
    
    onClick: =>
        switch @item.type
            when 'dir'  then @column.browser.loadDir @item.abs, column: @column.index+1
            when 'file' then post.emit 'jumpTo', file:@item.abs
        

module.exports = Row

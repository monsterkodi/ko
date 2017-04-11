# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, log, $, _ } = require 'kxk'

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->
        text = @item.text ? @item.rel
        @div = elem class: 'browserRow', html: syntax.spanForText text
        @div.classList.add @item.type
        @column.div.appendChild @div
        
module.exports = Row

# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, log, $, _ } = require 'kxk'

class Row
    
    constructor: (@column) ->
        
        @div = elem class: 'browserRow'
        @div.style.border = '1px sold white'
        @column.div.appendChild @div
        
        
module.exports = Row

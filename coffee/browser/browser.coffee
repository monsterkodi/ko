
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{elem, log} = require 'kxk'
flex   = require '../tools/flex'
Stage  = require '../area/stage'
Column = require './column'

class Browser extends Stage
    
    constructor: (@view) -> super @view
        
    reset: -> @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()
    
    initColumns: ->
        @cols?.remove()
        @cols = elem class: 'browser', id: 'columns'
        @view.appendChild @cols
        
        @columns = []
        for i in [0...3]
            col = new Column @
            col.index = i
            col.div.id = "column#{i}"
            @columns.push col
            
        panes = @columns.map (c) -> div: c.div, column: c, min: 20
        @flex = new flex panes: panes

module.exports = Browser

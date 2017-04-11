
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
  
    loadItems: (items, opt) ->
        col = @emptyColumn opt?.column
        col.setItems items
    
    emptyColumn: (colIndex) ->
        
        if colIndex?
            for coi in [colIndex...@columns.length]
                @columns[coi].clear()
                
        for col in @columns
            return col if col.isEmpty()
            
        col = @addColumn()
        @flex.addPane div:col.div, min:20, column:col
        col

    addColumn: ->
        col = new Column @
        col.index = @columns.length
        col.div.id = "column#{col.index}"
        @columns.push col
        col
  
    reset: -> @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()
    
    initColumns: ->
        @cols?.remove()
        @cols = elem class: 'browser', id: 'columns'
        @view.appendChild @cols
        
        @columns = []
        for i in [0...4]
            @addColumn()
            
        panes = @columns.map (c) -> div:c.div, column:c, min:20
        @flex = new flex panes: panes

module.exports = Browser

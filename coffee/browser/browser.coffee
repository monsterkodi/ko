
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ elem, error, log, _
}       = require 'kxk'
flex    = require '../tools/flex'
dirlist = require '../tools/dirlist'
Stage   = require '../area/stage'
Column  = require './column'
process = require 'process'

class Browser extends Stage
    
    constructor: (@view) -> 
        super @view
  
    # 000       0000000    0000000   0000000    
    # 000      000   000  000   000  000   000  
    # 000      000   000  000000000  000   000  
    # 000      000   000  000   000  000   000  
    # 0000000   0000000   000   000  0000000    
    
    loadDir: (dir, opt) -> 
        dirlist dir, opt, (err, items) => 
            if err? then return error "can't load dir #{dir}: #{err}"
            @loadItems items, opt

    loadItems: (items, opt) ->
        col = @emptyColumn opt?.column
        col.setItems items
    
    # 00000000  00     00  00000000   000000000  000   000  
    # 000       000   000  000   000     000      000 000   
    # 0000000   000000000  00000000      000       00000    
    # 000       000 0 000  000           000        000     
    # 00000000  000   000  000           000        000     
    
    emptyColumn: (colIndex) ->
        
        if colIndex?
            for coi in [colIndex...@columns.length]
                @columns[coi].clear()
                
        for col in @columns
            return col if col.isEmpty()
            
        col = @addColumn()
        @flex.addPane div:col.div, min:20, column:col
        col

    #  0000000   0000000    0000000     0000000   0000000   000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000000000  000   000  000   000  000       000   000  000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000   000  0000000    0000000     0000000   0000000   0000000  
    
    addColumn: ->
        col = new Column @
        col.index = @columns.length
        col.div.id = "column#{col.index}"
        @columns.push col
        col
      
    # 000  000   000  000  000000000   0000000   0000000   000       0000000  
    # 000  0000  000  000     000     000       000   000  000      000       
    # 000  000 0 000  000     000     000       000   000  000      0000000   
    # 000  000  0000  000     000     000       000   000  000           000  
    # 000  000   000  000     000      0000000   0000000   0000000  0000000   
    
    initColumns: ->
        @cols?.remove()
        @cols = elem class: 'browser', id: 'columns'
        @view.appendChild @cols
        
        @columns = []
        for i in [0...3]
            @addColumn()
            
        panes = @columns.map (c) -> div:c.div, column:c, min:20
        @flex = new flex panes: panes
        @loadDir process.cwd()

    reset: -> @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()

module.exports = Browser

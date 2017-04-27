
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ elem, post, clamp, error, log,  _
}      = require 'kxk'
Column = require './column'
Stage  = require '../area/stage'
flex   = require '../win/flex/flex'

class Browser extends Stage
    
    constructor: (@view) -> 
                
        @columns = []
        super @view

    # 000       0000000    0000000   0000000         000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000       000     000     000       000   000  000       
    # 000      000   000  000000000  000   000       000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000       000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000         000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) ->

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        col.setItems items, opt

        if opt.activate?
            col.rows[opt.activate]?.activate()
                
        if opt.row?
            col.focus()
            
        if opt.focus
            @focus()
            @lastUsedColumn()?.activeRow()?.setActive()            
        @

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    navigate: (key) ->
        
        index = @focusColumn()?.index ? 0
        index += switch key
            when 'left'  then -1
            when 'right' then +1
        index = clamp 0, @numCols()-1, index
        if @columns[index].numRows()
            @columns[index].focus().activeRow().activate()
        @

    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    focus: -> 
        @lastUsedColumn()?.focus()
        @
    
    focusColumn: -> 
        for c in @columns
            return c if c.hasFocus()
      
    # 00000000  00     00  00000000   000000000  000   000  
    # 000       000   000  000   000     000      000 000   
    # 0000000   000000000  00000000      000       00000    
    # 000       000 0 000  000           000        000     
    # 00000000  000   000  000           000        000     
    
    emptyColumn: (colIndex) ->
        
        if colIndex?
            for coi in [colIndex...@numCols()]
                @columns[coi].clear()
                
        for col in @columns
            return col if col.isEmpty()
            
        @addColumn()

    #  0000000   00000000  000000000    
    # 000        000          000       
    # 000  0000  0000000      000       
    # 000   000  000          000       
    #  0000000   00000000     000       
    
    activeColumnID: ->
        
        for col in @columns
            if col.hasFocus() then return col.div.id
        'column0'

    lastUsedColumn: ->
        
        used = null
        for col in @columns
            if not col.isEmpty()
                used = col 
            else break
        used

    hasEmptyColumns: -> _.last(@columns).isEmpty()

    height: -> @flex.height()
    numCols: -> @columns.length 
    column: (i) -> @columns[i] if 0 <= i < @numCols()

    #  0000000   0000000    0000000     0000000   0000000   000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000000000  000   000  000   000  000       000   000  000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000   000  0000000    0000000     0000000   0000000   0000000  
    
    newColumn: ->
        col = new Column @
        @columns.push col
        col
      
    addColumn: ->
        col = @newColumn()
        @flex.addPane div:col.div, size:50
        col
    
    # 0000000    00000000  000        
    # 000   000  000       000        
    # 000   000  0000000   000        
    # 000   000  000       000        
    # 0000000    00000000  0000000    
    
    popColumn: ->
        @flex.popPane()
        @columns.pop()
        
    popEmptyColumns: -> @popColumn() while @hasEmptyColumns()
    
    clear: -> @clearColumnsFrom 0, pop:true 
    clearColumnsFrom: (c, opt=pop:false) ->
        
        return error "clearColumnsFrom #{c}?" if not c? or c < 0
        
        if c < @numCols()
            @columns[c].clear()
            c++
            
        if opt.pop
            while c < @numCols()
                @popColumn()
        else
            while c < @numCols()
                @columns[c++].clear()

    isMessy: -> not @flex.relaxed or @hasEmptyColumns()
    cleanUp: -> 
        
        return false if not @isMessy()
        @popEmptyColumns()
        @flex.relax()
        true

    # 000  000   000  000  000000000       0000000   0000000   000       0000000  
    # 000  0000  000  000     000         000       000   000  000      000       
    # 000  000 0 000  000     000         000       000   000  000      0000000   
    # 000  000  0000  000     000         000       000   000  000           000  
    # 000  000   000  000     000          0000000   0000000   0000000  0000000   
    
    initColumns: ->
        
        return if @cols? and @cols.parentNode == @view
        
        @view.innerHTML = ''
        
        if @cols?
            @view.appendChild @cols
            return
            
        @cols = elem class: 'browser', id: 'columns'
        @view.appendChild @cols
        
        @columns = []
        for i in [0...2]
            @newColumn()
            
        panes = @columns.map (c) -> div:c.div, min:20
        @flex = new flex 
            panes: panes
            onPaneSize: @updateColumnScrolls

    resized: (w,h) -> @updateColumnScrolls()
    
    updateColumnScrolls: =>
        
        for c in @columns
            c.scroll.update()

    reset: -> delete @cols; @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()

module.exports = Browser

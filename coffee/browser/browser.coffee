###
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000  
###

{ post, elem, clamp, setStyle, childp, slash, fs, os, kerror, _ } = require 'kxk'

Column = require './column'
flex   = require '../win/flex/flex'
event  = require 'events'

class Browser extends event
    
    @: (@view) ->
        
        @columns = []
        
        setStyle '.browserRow .ext' 'display' window.state.get('browser|hideExtensions') and 'none' or 'initial'

    # 000  000   000  000  000000000       0000000   0000000   000      000   000  00     00  000   000   0000000  
    # 000  0000  000  000     000         000       000   000  000      000   000  000   000  0000  000  000       
    # 000  000 0 000  000     000         000       000   000  000      000   000  000000000  000 0 000  0000000   
    # 000  000  0000  000     000         000       000   000  000      000   000  000 0 000  000  0000       000  
    # 000  000   000  000     000          0000000   0000000   0000000   0000000   000   000  000   000  0000000   
    
    initColumns: ->
        
        return if @cols? and @cols.parentNode == @view
        
        @view.innerHTML = ''
        
        if @cols?
            @view.appendChild @cols
            return
            
        @cols = elem class:'browser' id:'columns'
        @view.appendChild @cols
        
        @columns = []

        @flex = new flex 
            view:       @cols
            onPaneSize: @updateColumnScrolls
        
    columnAtPos: (pos) ->
        
        for column in @columns
            if elem.containsPos column.div, pos
                return column
        null
                            
    # 000       0000000    0000000   0000000         000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000       000     000     000       000   000  000       
    # 000      000   000  000000000  000   000       000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000       000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000         000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) ->

        return if not @flex
        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        col.setItems items, opt

        if opt.activate?
            col.row(opt.activate)?.activate()
                
        if opt.row?
            col.focus()
            
        if opt.focus
            @focus()
            @lastUsedColumn()?.activeRow()?.setActive()            
            
        @popEmptyColumns relax:false
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
    
    focus: (opt) => 
        @lastUsedColumn()?.focus opt
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
            for c in [colIndex...@numCols()]
                @clearColumn c
                
        for col in @columns
            return col if col.isEmpty()
            
        @addColumn()

    #  0000000   00000000  000000000    
    # 000        000          000       
    # 000  0000  0000000      000       
    # 000   000  000          000       
    #  0000000   00000000     000       
    
    activeColumn: -> @column @activeColumnIndex()
    activeColumnIndex: -> 
        
        for col in @columns
            if col.hasFocus() then return col.index
        0
        
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

    height: -> @flex?.height()
    numCols: -> @columns.length 
    column: (i) -> @columns[i] if 0 <= i < @numCols()

    columnWithName: (name) -> @columns.find (c) -> c.name() == name

    onBackspaceInColumn: (column) -> column.clearSearch().removeObject()    
    
    #  0000000   0000000    0000000     0000000   0000000   000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000000000  000   000  000   000  000       000   000  000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000   000  0000000    0000000     0000000   0000000   0000000  
          
    addColumn: ->
        
        return if not @flex

        col = new Column @
        @columns.push col
        @flex.addPane div:col.div, size:50
        col
    
    # 00000000    0000000   00000000   
    # 000   000  000   000  000   000  
    # 00000000   000   000  00000000   
    # 000        000   000  000        
    # 000         0000000   000        
    
    clearColumn: (index) -> @columns[index].clear()
    
    popColumn: (opt) ->
        
        return if not @flex
        @clearColumn @columns.length-1
        @flex.popPane opt
        @columns.pop()
        
    popEmptyColumns: (opt) -> @popColumn(opt) while @hasEmptyColumns()
        
    popColumnsFrom: (col) -> 
        
        while @numCols() > col 
            @popColumn()
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> @clearColumnsFrom 0, pop:true 
    
    clearColumnsFrom: (c=0, opt=pop:false) ->
        
        return kerror "clearColumnsFrom #{c}?" if not c? or c < 0
        
        if opt.pop
            if c < @numCols()
                @clearColumn c
                c++
            while c < @numCols()
                @popColumn()
                c++
        else
            while c < @numCols()
                @clearColumn c
                c++

    #  0000000  000      00000000   0000000   000   000  
    # 000       000      000       000   000  0000  000  
    # 000       000      0000000   000000000  000 0 000  
    # 000       000      000       000   000  000  0000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    isMessy: -> not @flex.relaxed or @hasEmptyColumns()
    
    cleanUp: -> 
        return false if not @flex?
        return false if not @isMessy()
        @popEmptyColumns()
        @flex.relax()
        true

    resized: -> @updateColumnScrolls()
    
    updateColumnScrolls: =>
        
        for c in @columns
            c.scroll.update()

    reset: -> delete @cols; @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()

    refresh: => reset()
        
    # 000  00     00   0000000    0000000   00000000  
    # 000  000   000  000   000  000        000       
    # 000  000000000  000000000  000  0000  0000000   
    # 000  000 0 000  000   000  000   000  000       
    # 000  000   000  000   000   0000000   00000000  
    
    convertPXM: (row) ->
        
        item = row.item
        file = item.file
        tmpPXM = slash.join os.tmpdir(), "ko-#{slash.base file}.pxm"
        tmpPNG = slash.swapExt tmpPXM, '.png'

        fs.copy file, tmpPXM, (err) =>
            return kerror "can't copy pxm image #{file} to #{tmpPXM}: #{err}" if err?
            childp.exec "open #{__dirname}/../../bin/pxm2png.app --args #{tmpPXM}", (err) =>
                return kerror "can't convert pxm image #{tmpPXM} to #{tmpPNG}: #{err}" if err?
                loadDelayed = => @loadImage tmpPNG
                setTimeout loadDelayed, 300

    convertImage: (file) ->
        klog 'convertImage' file
        tmpImage = slash.join os.tmpdir(), "ko-#{slash.basename file}.png"
        childp.exec "/usr/bin/sips -s format png \"#{file}\" --out \"#{tmpImage}\"", (err) =>
            return kerror "can't convert image #{file}: #{err}" if err?
            @loadImage tmpImage

    loadImage: (file) ->
        
        row = @row file
        return if not row?.isActive()

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class: 'browserImageContainer', child: 
            elem 'img', class: 'browserImage', src: slash.fileUrl file
        col.table.appendChild cnt
        
module.exports = Browser

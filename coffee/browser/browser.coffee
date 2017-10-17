
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ fileName, encodePath, swapExt, elem, post, clamp, childp, path, fs, os, error, log,  _ } = require 'kxk'

Column = require './column'
Stage  = require '../stage/stage'
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
            col.row(opt.activate)?.activate()
                
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

    navigatePath: (pth) ->
        
        if _.isString pth
            pth = pth.split ':'
        
        colIndex = 0
        while (p = pth.shift())?
            row = @columns[colIndex].row p
            break if not row?
            row.activate()
            colIndex++
        
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
        return false if not @flex?
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

    #  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
    # 000       000   000  0000  000     000     000       0000  000     000     
    # 000       000   000  000 0 000     000     0000000   000 0 000     000     
    # 000       000   000  000  0000     000     000       000  0000     000     
    #  0000000   0000000   000   000     000     00000000  000   000     000     
    
    loadContent: (row, opt) ->
        
        item  = row.item

        items = []
        file  = item.file
        name  = fileName file
        
        files = post.get 'indexer', 'files', file

        clsss = files[file]?.classes ? []
        for clss in clsss
            text = '● '+clss.name
            items.push name: clss.name, text:text, type:'class', file: file, line: clss.line
        
        funcs = files[file]?.funcs ? []
        for func in funcs
            if func.test == 'describe'
                text = '● '+func.name
            else if func.static
                text = '  ◆ '+func.name
            else
                text = '  ▸ '+func.name
            items.push name: func.name, text:text, type:'func', file: file, line: func.line

        if items.length
            items.sort (a,b) -> a.line - b.line
            opt.parent ?= item
            @clearColumnsFrom opt.column #, pop:true
            @loadItems items, opt
        else
            ext = path.extname file  
            if ext in ['.gif', '.png', '.jpg']
                @clearColumnsFrom opt.column, pop:true
                @loadImage row, file
            else if ext in ['.icns', '.tiff', '.tif']
                @clearColumnsFrom opt.column, pop:true
                @convertImage row
            else if ext in ['.pxm']
                @clearColumnsFrom opt.column, pop:true
                @convertPXM row
            else
                @clearColumnsFrom opt.column
            @endNavigateToTarget?()
            
        if item.textFile and not @skipJump
            post.emit 'jumpTo', file:file
            
        delete @skipJump

    # 000  00     00   0000000    0000000   00000000  
    # 000  000   000  000   000  000        000       
    # 000  000000000  000000000  000  0000  0000000   
    # 000  000 0 000  000   000  000   000  000       
    # 000  000   000  000   000   0000000   00000000  
    
    convertPXM: (row) ->
        
        item = row.item
        file = item.file
        tmpPXM = path.join os.tmpdir(), "ko-#{fileName file}.pxm"
        tmpPNG = swapExt tmpPXM, '.png'

        fs.copy file, tmpPXM, (err) =>
            return error "can't copy pxm image #{file} to #{tmpPXM}: #{err}" if err?
            childp.exec "open #{__dirname}/../../bin/pxm2png.app --args #{tmpPXM}", (err) =>
                return error "can't convert pxm image #{tmpPXM} to #{tmpPNG}: #{err}" if err?
                loadDelayed = => @loadImage row, tmpPNG
                setTimeout loadDelayed, 300

    convertImage: (row) ->
        
        item = row.item
        file = item.file
        tmpImage = path.join os.tmpdir(), "ko-#{path.basename file}.png"
        
        childp.exec "/usr/bin/sips -s format png \"#{file}\" --out \"#{tmpImage}\"", (err) =>
            return error "can't convert image #{file}: #{err}" if err?
            @loadImage row, tmpImage

    loadImage: (row, file) ->
        
        return if not row.isActive()
        item = row.item

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class: 'browserImageContainer', child: 
            elem 'img', class: 'browserImage', src: "file://#{encodePath file}"
        col.table.appendChild cnt

module.exports = Browser

###
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000  
###

{ elem, post, clamp, setStyle, childp, slash, state, fs, os, error, log,  _ } = require 'kxk'

Column = require './column'
Stage  = require '../stage/stage'
flex   = require '../win/flex/flex'

class Browser extends Stage
    
    constructor: (view) ->
        
        super view
        
        @columns = []
        
        setStyle '.browserRow .extname', 'display', state.get('browser|hideExtensions') and 'none' or 'initial'

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
            
        @cols = elem class: 'browser', id: 'columns'
        @view.appendChild @cols
        
        @columns = []
        for i in [0...2]
            @newColumn()
            
        panes = @columns.map (c) -> div:c.div, min:20
        @flex = new flex 
            panes: panes
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
            
        # log 'popEmptyColumns'
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

    navigatePath: (pth) -> # unused?
        
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
    
    popColumn: (opt) ->
        
        @flex.popPane opt
        @columns.pop()
        
    popEmptyColumns: (opt) -> @popColumn(opt) while @hasEmptyColumns()
    
    clear: -> @clearColumnsFrom 0, pop:true 
    clearColumnsFrom: (c=0, opt=pop:false) ->
        
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
    
    loadSourceInfo: (info, opt) =>
        
        file = opt.item.file
        if file != @activeColumn()?.activePath()
            return

        items = []
        clsss = info?.classes ? []
        for clss in clsss
            text = '● '+clss.name
            items.push name: clss.name, text:text, type:'class', file: file, line: clss.line
        
        funcs = info?.funcs ? []
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
            opt.parent ?= opt.item
            @clearColumnsFrom opt.column
            @loadItems items, opt
            true
        else
            false
    
    loadSourceItem: (item, opt={}) ->
        
        file = item.file
        opt.item = item
        
        if opt.async
            if not @indexedFiles?[file]
                opt.winID = window.winID
                post.toMain 'sourceInfoForFile', opt
            else
                clearTimeout @loadSourceInfoTimer
                delayedLoadSourceInfo = =>
                    @loadSourceInfo @indexedFiles[file], opt
                @loadSourceInfoTimer = setTimeout delayedLoadSourceInfo, 100
            return false
        
        items = []
        
        @indexedFiles ?= post.get 'indexer', 'files' #, file

        if @indexedFiles[file]?
            return @loadSourceInfo @indexedFiles[file], opt
        false
            
    loadContent: (row, opt) ->
        
        item  = row.item
        file  = item.file

        if not @loadSourceItem item, opt
            ext = slash.ext file  
            if ext in ['gif', 'png', 'jpg', 'jpeg', 'svg']
                @clearColumnsFrom opt.column, pop:true
                @loadImage row, file
            else if ext in ['icns', 'tiff', 'tif'] and not slash.win()
                @clearColumnsFrom opt.column, pop:true
                @convertImage row
            else if ext in ['pxm']
                @clearColumnsFrom opt.column, pop:true
                @convertPXM row
            else if not opt.async
                @clearColumnsFrom opt.column
            @endNavigateToTarget?()
            
        if item.textFile and not @skipJump
            post.emit 'jumpTo', file:file, newTab:opt.newTab
            
        delete @skipJump

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
            return error "can't copy pxm image #{file} to #{tmpPXM}: #{err}" if err?
            childp.exec "open #{__dirname}/../../bin/pxm2png.app --args #{tmpPXM}", (err) =>
                return error "can't convert pxm image #{tmpPXM} to #{tmpPNG}: #{err}" if err?
                loadDelayed = => @loadImage row, tmpPNG
                setTimeout loadDelayed, 300

    convertImage: (row) ->
        
        item = row.item
        file = item.file
        tmpImage = slash.join os.tmpdir(), "ko-#{slash.basename file}.png"
        
        childp.exec "/usr/bin/sips -s format png \"#{file}\" --out \"#{tmpImage}\"", (err) =>
            return error "can't convert image #{file}: #{err}" if err?
            @loadImage row, tmpImage

    loadImage: (row, file) ->
        
        return if not row.isActive()

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class: 'browserImageContainer', child: 
            elem 'img', class: 'browserImage', src: slash.fileUrl file
        col.table.appendChild cnt
        
module.exports = Browser

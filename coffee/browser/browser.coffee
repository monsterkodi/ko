###
0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000   000  000   000  000   000  000 0 000  000       000       000   000  
0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000   000  000   000  000   000  000   000       000  000       000   000  
0000000    000   000   0000000   00     00  0000000   00000000  000   000  
###

{ childp, clamp, elem, fs, kerror, klog, kpos, os, setStyle, slash } = require 'kxk'

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
        
    columnAtX: (x) ->
        
        for column in @columns
            cpos = kpos column.div.getBoundingClientRect().left, column.div.getBoundingClientRect().top
            pos = kpos x, cpos.y
            if elem.containsPos column.div, pos
                return column
        null
        
    rowAtPos: (pos) ->
        
        if column = @columnAtPos pos
            return column.rowAtPos pos
        null
                            
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    navigate: (key) ->
  
        @select.clear()
        
        if key == 'up'
            if @activeColumnIndex() > 0
                if col = @activeColumn()
                    if row = col.activeRow()
                        @loadItem @fileItem row.item.file
                    else
                        @loadItem @fileItem col.path()
            else
                if not slash.isRoot @columns[0].path()
                    @loadItem @fileItem slash.dir @columns[0].path()
        else        
            index = @focusColumn()?.index ? 0
            nuidx = index + switch key
                when 'left''up' then -1
                when 'right'    then +1
                                
            nuidx = clamp 0, @numCols()-1, nuidx
            return if nuidx == index
            if @columns[nuidx].numRows()
                klog 'browser.navigate focus' @columns[nuidx].name() 
                @columns[nuidx].focus()?.activeRow()?.activate()
            
        @updateColumnScrolls()
        @
        
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    focus: (opt) => 
        @lastDirOrSrcColumn()?.focus opt
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
                
    lastUsedColumn: ->
        
        used = null
        for col in @columns
            if not col.isEmpty()
                used = col 
            else break
        used

    hasEmptyColumns: -> @columns[-1].isEmpty()

    height: -> @flex?.height()
    numCols: -> @columns.length 
    column: (i) -> @columns[i] if 0 <= i < @numCols()
    
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
    
    clearColumn: (index) -> if index < @columns.length then @columns[index].clear()
    
    shiftColumn: ->
        
        return if not @flex
        return if not @columns.length
        @clearColumn 0
        @flex.shiftPane()
        @columns.shift()
        
        for i in [0...@columns.length]
            @columns[i].setIndex i
    
    popColumn: (opt) ->
        
        return if not @flex
        @clearColumn @columns.length-1
        @flex.popPane opt
        @columns.pop()
        
    popEmptyColumns: (opt) ->
        
        @clearColumnsFrom @lastDirColumn()?.index ? 0, pop:true
        
    shiftColumnsTo: (col) ->
        
        for i in [0...col]
            @shiftColumn()
            
        @updateColumnScrolls()
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> @clearColumnsFrom 0, pop:true 
    
    clearColumnsFrom: (c=0, opt=pop:false) ->
        
        return kerror "clearColumnsFrom #{c}?" if not c? or c < 0
        
        num = @numCols()
        if opt.pop
            if opt.clear?
                while c <= opt.clear
                    @clearColumn c
                    c++
            while c < num
                @popColumn()
                c++
        else
            while c < num
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

    resized: -> 

        @updateColumnScrolls()
    
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
        
        item   = row.item
        file   = item.file
        tmpPXM = slash.join os.tmpdir(), "ko-#{slash.base file}.pxm"
        tmpPNG = slash.swapExt tmpPXM, '.png'

        fs.copy file, tmpPXM, (err) =>
            return kerror "can't copy pxm image #{file} to #{tmpPXM}: #{err}" if err?
            childp.exec "open #{__dirname}/../../bin/pxm2png.app --args #{tmpPXM}", (err) =>
                return kerror "can't convert pxm image #{tmpPXM} to #{tmpPNG}: #{err}" if err?
                loadDelayed = => @loadImage row, tmpPNG
                setTimeout loadDelayed, 300

    convertImage: (row) ->
        
        item   = row.item
        file   = item.file
        tmpImg = slash.join os.tmpdir(), "ko-#{slash.basename file}.png"
        
        childp.exec "/usr/bin/sips -s format png \"#{file}\" --out \"#{tmpImg}\"", (err) =>
            return kerror "can't convert image #{file}: #{err}" if err?
            @loadImage row, tmpImg

    loadImage: (row, file) ->
        
        return if not row.isActive()

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class:'browserImageContainer' child: 
            elem 'img' class:'browserImage' src:slash.fileUrl file
        col.table.appendChild cnt
        
module.exports = Browser

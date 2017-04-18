# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ packagePath, encodePath, fileName, swapExt, resolve, elem, post, clamp, 
  error, log, process, path, fs, os, _
}        = require 'kxk'
childp   = require 'child_process'
Column   = require './column'
Stage    = require '../area/stage'
dirlist  = require '../tools/dirlist'
flex     = require '../flex/flex'

class Browser extends Stage
    
    constructor: (@view) -> super @view
  
    # 000       0000000    0000000   0000000    00000000  000  000      00000000  
    # 000      000   000  000   000  000   000  000       000  000      000       
    # 000      000   000  000000000  000   000  000000    000  000      0000000   
    # 000      000   000  000   000  000   000  000       000  000      000       
    # 0000000   0000000   000   000  0000000    000       000  0000000  00000000  
    
    loadFile: (file, opt = focus:true, column:0) ->
        # log 'loadFile', file, opt
        dir = packagePath file
        if dir?
            opt.file = file
            @skipJump = opt.dontJump
            @loadDir dir, opt
        else
            error 'no packagePath?', dir, file

    # 0000000    00000000    0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000 0 000  000       000       
    # 0000000    0000000    000   000  000000000  0000000   0000000   
    # 000   000  000   000  000   000  000   000       000  000       
    # 0000000    000   000   0000000   00     00  0000000   00000000  
    
    browse: (dir) -> 
        return error "no dir?" if not dir?
        @loadDir dir, column:0, row: 0, focus:true

    # 000       0000000    0000000   0000000    0000000    000  00000000   
    # 000      000   000  000   000  000   000  000   000  000  000   000  
    # 000      000   000  000000000  000   000  000   000  000  0000000    
    # 000      000   000  000   000  000   000  000   000  000  000   000  
    # 0000000   0000000   000   000  0000000    0000000    000  000   000  
    
    loadDir: (dir, opt) -> 
        # log "loadDir #{dir}", opt
        dirlist dir, opt, (err, items) => 
            if err? then return error "can't load dir #{dir}: #{err}"
            opt ?= {}
            opt.parent ?=
                type: 'dir'
                abs: dir
                name: path.basename dir
            if not opt?.column or @columns[0]?.activeRow()?.item.name == '..'
                updir = resolve path.join dir, '..'
                # log 'updir', updir, dir, @columns[0].parent?.abs
                if not (updir == dir == '/') and (not @columns[0].parent? or @columns[0].parent.abs.startsWith dir) 
                    items.unshift 
                        name: '..'
                        type: 'dir'
                        abs:  updir
            @loadItems items, opt

    # 000       0000000    0000000   0000000     0000000   0000000   000   000  000000000  00000000  000   000  000000000  
    # 000      000   000  000   000  000   000  000       000   000  0000  000     000     000       0000  000     000     
    # 000      000   000  000000000  000   000  000       000   000  000 0 000     000     0000000   000 0 000     000     
    # 000      000   000  000   000  000   000  000       000   000  000  0000     000     000       000  0000     000     
    # 0000000   0000000   000   000  0000000     0000000   0000000   000   000     000     00000000  000   000     000     
    
    loadContent: (row, opt) ->
        item  = row.item
        items = []
        file  = item.abs
        name  = fileName file
        
        clsss = post.get 'indexer', 'classes'
        clsss = _.pickBy clsss, (obj, key) -> obj.file == file
        for clss,clsso of clsss
            items.push name: clss, text: '● '+clss, type:'class', file: file, line: clsso.line
            for mthd,mthdo of clsso.methods
                items.push name: mthd, text: '  ▸ '+mthd, type:'method', file: file, line: mthdo.line

        files = post.get 'indexer', 'files'
        funcs = files[file]?.funcs ? []
        for f in funcs
            if f[3] == name
                items.push name: f[2], text:'  ▸ '+f[2], type: 'func', file: file, line: f[0]

        @clearColumnsFrom opt.column

        if items.length
            opt.parent ?= item
            @loadItems items, opt
        else
            ext = path.extname file  
            if ext in ['.gif', '.png', '.jpg']
                @loadImage row, file
            else if ext in ['.icns', '.tiff', '.tif']
                @convertImage row
            else if ext in ['.pxm']
                @convertPXM row
            
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
        file = item.abs
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
        file = item.abs
        tmpImage = path.join os.tmpdir(), "ko-#{path.basename file}.png"
        
        childp.exec "/usr/bin/sips -s format png \"#{file}\" --out \"#{tmpImage}\"", (err) =>
            return error "can't convert image #{file}: #{err}" if err?
            @loadImage row, tmpImage

    loadImage: (row, file) ->
        return if not row.isActive()
        item = row.item
        # log "loadImage #{file}"        

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class: 'browserImageContainer', child: 
            elem 'img', class: 'browserImage', src: "file://#{encodePath file}"
        col.table.appendChild cnt

    # 000       0000000    0000000   0000000    000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000  000     000     000       000   000  000       
    # 000      000   000  000000000  000   000  000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000  000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000    000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) ->
        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index

        if opt?.file
            @navigateTargetFile = opt.file
        
        col.setItems items, opt
                
        if opt.row? then col.focus()
        if opt.focus? 
            @focus()
            @lastUsedColumn().activeRow().setActive()
            @lastUsedColumn().onScroll()

    endNavigateToTarget: ->
        delete @navigateTargetFile
        @focus()
      
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    navigateTarget: -> @navigateTargetFile
    
    navigateTo: (opt) -> @columns[0].navigateTo opt

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
    
    lastUsedColumn: ->
        used = null
        for col in @columns
            if not col.isEmpty()
                used = col 
            else break
        used

    numCols: -> @columns.length 
    column: (i) -> @columns[i] if i >= 0 and i < @numCols()

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
     
    clearColumnsFrom: (c) ->
        if c < @numCols()
            @columns[c].clear()
        while c+1 < @numCols()
            @popColumn()
       
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
            @newColumn()
            
        panes = @columns.map (c) -> div:c.div, min:20
        @flex = new flex panes: panes
    
    reset: -> @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()

module.exports = Browser

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
    
    constructor: (@view) -> 
        @columns = []
        super @view

    # 000       0000000    0000000   0000000     0000000   0000000          000  
    # 000      000   000  000   000  000   000  000   000  000   000        000  
    # 000      000   000  000000000  000   000  000   000  0000000          000  
    # 000      000   000  000   000  000   000  000   000  000   000  000   000  
    # 0000000   0000000   000   000  0000000     0000000   0000000     0000000   
    
    loadObject: (obj, opt = focus:true, column:0) =>
        
        @initColumns() if _.isEmpty @columns
        
        if @columns[0].parent?.type != 'obj'
            @clearColumnsFrom 1
            rootObj = {}
            @columns[0].setItems [], parent: type: 'obj', obj:rootObj, name: 'root'
        else 
            rootObj = @columns[0].parent.obj
    
        objName = opt.name ? obj.constructor?.name
        objText = opt.text ? objName
        
        log 'objName', objName
        log 'objText', objText

        itemForKeyValue = (key, value) ->
            item =             
                if _.isArray value
                    type: 'array'
                    obj:  value
                else if _.isRegExp value
                    type: 'regexp'
                    obj: value.source
                else if _.isFunction value
                    type: 'func'
                    obj:  value.toString().split '\n'
                else if _.isString value 
                    type: 'string'
                    obj: value
                else if _.isNumber value 
                    type: 'number'
                    obj: str value
                else if _.isPlainObject value
                    type: 'obj'
                    obj:  value
                else
                    type: 'value'
                    obj:  str value
            item.name = key
            item

        if opt.column == 0
            newItem = 
                type: 'obj'
                name: objName
                text: objText
                obj:  obj
            if row = @columns[0].rowWithName objName
                @columns[0].items[row.index()] = newItem
            else
                @columns[0].items.push newItem
            items = @columns[0].items
            opt.parent = @columns[0].parent
        else
            items = []
            if _.isPlainObject obj
                for key,value of obj
                    items.push itemForKeyValue key, value
            else
                for own index,value of obj
                    if _.isObject value
                        key = index
                    else
                        key = value
                    items.push itemForKeyValue index, value
                    
        @loadItems items, opt
  
    loadObjectItem: (item, opt) ->
        opt.parent = item
        switch item.type
            when 'obj', 'array' 
                @loadObject item.obj, opt
            else
                item = 
                    type: item.type
                    name: str item.obj
                @loadItems [item], opt
        
    
    # 000       0000000    0000000   0000000    00000000  000  000      00000000  
    # 000      000   000  000   000  000   000  000       000  000      000       
    # 000      000   000  000000000  000   000  000000    000  000      0000000   
    # 000      000   000  000   000  000   000  000       000  000      000       
    # 0000000   0000000   000   000  0000000    000       000  0000000  00000000  
    
    loadFile: (file, opt = focus:true, column:0) ->
        dir  = packagePath file
        dir ?= path.dirname file
        opt.file = file
        @skipJump = opt.dontJump
        @loadDir dir, opt

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

    height: -> @flex.height()
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

    reset: -> @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()

module.exports = Browser

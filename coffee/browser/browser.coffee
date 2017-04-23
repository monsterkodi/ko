# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ packagePath, encodePath, fileName, swapExt, resolve, elem, post, clamp, 
  error, log, process, path, fs, os, _
}        = require 'kxk'
childp   = require 'child_process'
jsbeauty = require 'js-beautify'
Column   = require './column'
Stage    = require '../area/stage'
dirlist  = require '../tools/dirlist'
flex     = require '../win/flex/flex'

class Browser extends Stage
    
    constructor: (@view) -> 
        @columns = []
        super @view

    valueType: (value) ->
        if _.isNil      value then return 'nil'
        if _.isBoolean  value then return 'bool'
        if _.isInteger  value then return 'int'
        if _.isNumber   value then return 'float'
        if _.isString   value then return 'string'
        if _.isRegExp   value then return 'regexp'
        if _.isArray    value then return 'array'
        if _.isElement  value then return 'elem'
        if _.isFunction value then return 'func'
        if _.isObject   value then return 'obj'
        error "unknown value type: #{value}"
        'value'

    htmlLines: (e) -> 
        s = jsbeauty.html_beautify e.outerHTML, indent_size:2 , preserve_newlines:false, wrap_line_length:1024*1024, unformatted: []
        s.split('\n')
    
    sortByType: (items) ->
        type = (i) -> {obj:'a', array:'b', elem:'c', regexp:'d', string:'e', int:'f', float:'g', bool:'h', nil:'i', func:'z'}[i.type]
        items.sort (a,b) -> (type(a) + a.name).localeCompare type(b) + b.name      

    #  0000000   0000000          000  00000000   0000000  000000000  
    # 000   000  000   000        000  000       000          000     
    # 000   000  0000000          000  0000000   000          000     
    # 000   000  000   000  000   000  000       000          000     
    #  0000000   0000000     0000000   00000000   0000000     000     
    
    loadObject: (obj, opt) =>
        
        opt ?= {}
        opt.column ?= 0
        opt.focus  ?= opt.column == 0

        @initColumns() if _.isEmpty @columns
        
        if @columns[0].parent?.type != 'obj'
            @clearColumnsFrom 2
            rootObj = {}
            @columns[0].setItems [], parent: type: 'obj', obj:rootObj, name: 'root'
        else 
            rootObj = @columns[0].parent.obj
    
        objName = opt.name ? obj.constructor?.name
        
        itemForKeyValue = (key, value) =>
            type: @valueType value 
            obj:  value
            name: key

        if opt.column == 0
            newItem = itemForKeyValue objName, obj
            if row = @columns[0].rowWithName objName
                @columns[0].items[row.index()] = newItem
                opt.activate = row.index()
            else
                @columns[0].items.push newItem
                opt.activate = @columns[0].items.length-1
            items = @columns[0].items
            opt.parent = @columns[0].parent
        else
            items = []
            for key,value of obj # own?
                items.push itemForKeyValue key, value

        @sortByType(items) if @valueType(obj) not in ['func', 'array']
        @loadItems items, opt
        true
  
    #  0000000   00000000   00000000    0000000   000   000  
    # 000   000  000   000  000   000  000   000   000 000   
    # 000000000  0000000    0000000    000000000    00000    
    # 000   000  000   000  000   000  000   000     000     
    # 000   000  000   000  000   000  000   000     000     
    
    loadArray: (arry, opt) ->
        items   = []
        padSize = 1+Math.floor Math.log10 arry.length
        for own index,value of arry
            item = 
                type: @valueType value
                obj:  value
            index = "#{_.padEnd str(index), padSize} ▫ "
            switch item.type
                when 'regexp' then item.name = index+value.source
                when 'string' then item.name = index+value
                when 'number', 'float', 'value', 'bool', 'nil' then item.name = index+str value
                else  item.name = index+'▶'
            items.push item
                    
        @loadItems items, opt
        
    # 000  000000000  00000000  00     00  
    # 000     000     000       000   000  
    # 000     000     0000000   000000000  
    # 000     000     000       000 0 000  
    # 000     000     00000000  000   000  
    
    loadObjectItem: (item, opt) ->
        opt.parent = item
        switch item.type
            when 'obj'   then @loadObject item.obj, opt
            when 'func'  then @loadArray  item.obj.toString().split('\n'), opt
            when 'elem'  then @loadArray  @htmlLines(item.obj), opt
            when 'array' then @loadArray  item.obj, opt
            else
                oi = 
                    type: item.type
                    name: str item.obj
                @loadItems [oi], opt
    
    # 00000000  000  000      00000000  
    # 000       000  000      000       
    # 000000    000  000      0000000   
    # 000       000  000      000       
    # 000       000  0000000  00000000  
    
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

    # 0000000    000  00000000   
    # 000   000  000  000   000  
    # 000   000  000  0000000    
    # 000   000  000  000   000  
    # 0000000    000  000   000  
    
    loadDir: (dir, opt) -> 
        dirlist dir, opt, (err, items) => 
            if err? then return error "can't load dir #{dir}: #{err}"
            opt ?= {}
            opt.parent ?=
                type: 'dir'
                abs: dir
                name: path.basename dir
            if not opt?.column or @columns[0]?.activeRow()?.item.name == '..'
                updir = resolve path.join dir, '..'
                if not (updir == dir == '/') and (not @columns[0].parent? or @columns[0].parent.abs.startsWith dir) 
                    items.unshift 
                        name: '..'
                        type: 'dir'
                        abs:  updir
            @loadItems items, opt

    # 000       0000000    0000000   0000000         000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000       000     000     000       000   000  000       
    # 000      000   000  000000000  000   000       000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000       000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000         000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) ->
        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index

        if opt?.file
            @navigateTargetFile = opt.file
        
        col.setItems items, opt

        if opt.activate?
            col.rows[opt.activate]?.activate()
                
        if opt.row?
            col.focus()
            
        if opt.focus
            @focus()
            @lastUsedColumn().activeRow().setActive()            
        @

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

    #  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
    # 000       000   000  0000  000     000     000       0000  000     000     
    # 000       000   000  000 0 000     000     0000000   000 0 000     000     
    # 000       000   000  000  0000     000     000       000  0000     000     
    #  0000000   0000000   000   000     000     00000000  000   000     000     
    
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
                items.push name: f[2], text:'  ▸ '+f[2], type:'func', file: file, line: f[0]

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
            post.emit 'jumpTo', file:file, sameWindow:true
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

        col = @emptyColumn opt?.column
        @clearColumnsFrom col.index
        cnt = elem class: 'browserImageContainer', child: 
            elem 'img', class: 'browserImage', src: "file://#{encodePath file}"
        col.table.appendChild cnt
          
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
        return error "clearColumnsFrom #{c}?" if not c? or c < 0
        if c < @numCols()
            @columns[c].clear()
        while c+1 < @numCols()
            @popColumn()
       
    # 000  000   000  000  000000000       0000000   0000000   000       0000000  
    # 000  0000  000  000     000         000       000   000  000      000       
    # 000  000 0 000  000     000         000       000   000  000      0000000   
    # 000  000  0000  000     000         000       000   000  000           000  
    # 000  000   000  000     000          0000000   0000000   0000000  0000000   
    
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

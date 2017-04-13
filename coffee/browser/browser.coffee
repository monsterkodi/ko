
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ packagePath, fileName, resolve, elem, post, clamp, error, log, process, path, _
}        = require 'kxk'
flex     = require '../tools/flex'
dirlist  = require '../tools/dirlist'
Stage    = require '../area/stage'
Column   = require './column'
electron = require 'electron'
ipc = electron.ipcRenderer

class Browser extends Stage
    
    constructor: (@view) -> super @view
  
    # 000       0000000    0000000   0000000    
    # 000      000   000  000   000  000   000  
    # 000      000   000  000000000  000   000  
    # 000      000   000  000   000  000   000  
    # 0000000   0000000   000   000  0000000    
    
    loadFile: (file, opt) ->
        dir = packagePath file
        @loadDir dir, file: file, column:0

    browse: (dir) -> @loadDir dir, column:0, row: 0

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
                if not (updir == dir == '/')
                    items.unshift 
                        name: '..'
                        type: 'dir'
                        abs:  updir
            @loadItems items, opt

    loadContent: (item, opt) ->
        
        items = []
        file = item.abs
        name = fileName file
        
        clsss = ipc.sendSync 'indexer', 'classes'
        clsss = _.pickBy clsss, (obj, key) -> obj.file == file
        for clss,clsso of clsss
            items.push name: clss, text: '●'+clss, type:'class', file: file, line: clsso.line
            for mthd,mthdo of clsso.methods
                items.push name: mthd, text: '▸'+mthd, type:'method', file: file, line: mthdo.line

        files = ipc.sendSync 'indexer', 'files'
        funcs = files[file]?.funcs ? []
        for f in funcs
            if f[3] == name
                items.push name: f[2], text:'▸'+f[2], type: 'func', file: file, line: f[0]

        @clearColumnsFrom opt.column

        if items.length
            opt.parent ?= item
            @loadItems items, opt
        else
            if path.extname(file) in ['.gif', '.png', '.jpg']
                error 'load image?', file
            else
                log 'load finder icon?', file
            
        if item.textFile
            # log 'jump to text file', item
            post.emit 'jumpTo', file:file


    loadItems: (items, opt) ->
        
        col = @emptyColumn opt?.column

        if opt?.file
            @navigateTargetFile = opt.file
        
        col.setItems items, opt
        
        if opt.row? then col.focus()
      
    navigateTarget: -> @navigateTargetFile
      
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    navigateTo: (opt) -> @columns[0].navigateTo opt

    navigate: (key) ->
        index = @focusColumn()?.index ? 0
        index += switch key
            when 'left'  then -1
            when 'right' then +1
        index = clamp 0, @numCols()-1, index
        @columns[index].focus().activeRow().activate()
          
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
        @flex.relax()
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

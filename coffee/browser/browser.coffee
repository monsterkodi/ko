
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
        @loadDir dir, file: file

    browse: (dir) -> @loadDir dir, column:0, row: 0

    loadDir: (dir, opt) -> 
        dirlist dir, opt, (err, items) => 
            if err? then return error "can't load dir #{dir}: #{err}"
            opt ?= {}
            opt.parent ?=
                type: 'dir'
                abs: dir
                name: path.basename dir
            if not opt?.column or @columns[0].activeRow().item.name == '..'
                items.unshift 
                    name: '..'
                    type: 'dir'
                    abs:  resolve path.join dir, '..'
            @loadItems items, opt

    loadContent: (item, opt) ->
        
        items = []
        file = item.abs
        name = fileName file
        
        clsss = ipc.sendSync 'indexer', 'classes'
        clsss = _.pickBy clsss, (obj, key) -> obj.file == file
        for clss,clsso of clsss
            items.push name: '●'+clss, type:'class'
            for mthd,mthdo of clsso.methods
                items.push name: '▸'+mthd, type:'method'

        files = ipc.sendSync 'indexer', 'files'
        funcs = files[file].funcs        
        for f in funcs
            if f[3] == name
                items.push name: '▸'+f[2], type: 'func'

        if items.length
            opt.parent ?= item
            @loadItems items, opt
        else
            log 'load image', file
            
        if item.textFile
            post.emit 'jumpTo', file:file

    loadItems: (items, opt) ->
        col = @emptyColumn opt?.column
        prt = opt?.parent
        error "no parent? opt:", opt if not prt?
        col.setItems items, prt
        if opt.row? then col.activateRow opt.row
        @navigateTo(opt) if opt?.file

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
        clamp 0, @columns.length-1, index
        col = @columns[index].focus()
          
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    focus: -> @lastUsedColumn()?.focus()
    
    focusColumn: -> 
        for c in @columns
            return c if c.hasFocus()
      
    # 00000000  00     00  00000000   000000000  000   000  
    # 000       000   000  000   000     000      000 000   
    # 0000000   000000000  00000000      000       00000    
    # 000       000 0 000  000           000        000     
    # 00000000  000   000  000           000        000     
    
    emptyColumn: (colIndex) ->
        # log colIndex
        if colIndex?
            for coi in [colIndex...@columns.length]
                @columns[coi].clear()
                
        for col in @columns
            return col if col.isEmpty()
            
        @addColumn()

    lastUsedColumn: ->
        used = null
        for col in @columns
            if not col.isEmpty()
                used = col 
            else break
        used

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

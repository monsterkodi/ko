
# 0000000    00000000    0000000   000   000   0000000  00000000  00000000   
# 000   000  000   000  000   000  000 0 000  000       000       000   000  
# 0000000    0000000    000   000  000000000  0000000   0000000   0000000    
# 000   000  000   000  000   000  000   000       000  000       000   000  
# 0000000    000   000   0000000   00     00  0000000   00000000  000   000  

{ packagePath, elem, post, clamp, error, log, process, path, _
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
        # log 'dir:', dir
        @loadDir dir, file: file

    loadDir: (dir, opt) -> 
        dirlist dir, opt, (err, items) => 
            if err? then return error "can't load dir #{dir}: #{err}"
            opt.parent ?=
                type: 'dir'
                abs: dir
                name: path.basename dir
            @loadItems items, opt

    loadContent: (file, opt) ->
        
        files = ipc.sendSync 'indexer', 'files'
        # log files
        # funcs = files[file].funcs        
        # funcNames = ({name: '▸  '+info[2], type:'method'} for info in funcs)
        # log funcNames
        clsss = ipc.sendSync 'indexer', 'classes'
        # log clsss
        log file
        clsss = _.pickBy clsss, (obj, key) -> obj.file == file
        log clsss
        items = []
        for clss,clsso of clsss
            items.push name: '●'+clss, type:'class'
            for mthd,mthdo of clsso.methods
                items.push name: '▸'+mthd, type:'method'

        if items.length
            opt.parent ?=
                type: 'file'
                abs: file
                name: path.basename file
            @loadItems items, opt
            post.emit 'jumpTo', file:file
        else
            log 'load image', file

    loadItems: (items, opt) ->
        col = @emptyColumn opt?.column
        prt = opt?.parent
        error "no parent? opt:", opt if not prt?
        col.setItems items, prt
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
            for coi in [colIndex...@columns.length]
                @columns[coi].clear()
                
        for col in @columns
            return col if col.isEmpty()
            
        col = @addColumn()
        @flex.addPane div:col.div, min:0
        @flex.relax()
        col

    #  0000000   0000000    0000000     0000000   0000000   000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000000000  000   000  000   000  000       000   000  000      
    # 000   000  000   000  000   000  000       000   000  000      
    # 000   000  0000000    0000000     0000000   0000000   0000000  
    
    addColumn: ->
        col = new Column @
        @columns.push col
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
            @addColumn()
            
        panes = @columns.map (c) -> div:c.div, min:20
        @flex = new flex panes: panes

    reset: -> @initColumns()
    stop:  -> @cols.remove(); @cols = null
    start: -> @initColumns()

module.exports = Browser

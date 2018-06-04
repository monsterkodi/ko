###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000  
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000  
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000  
###

{ empty, elem, clamp, drag, post, clamp, state, slash, fs, os, error, log, $ } = require 'kxk'
  
Browser  = require './browser'
Shelf    = require './shelf'
dirlist  = require '../tools/dirlist'
forkfunc = require '../tools/forkfunc'

class FileBrowser extends Browser
    
    constructor: (view) ->
                
        super view
        @loadID = 0
        @shelf = new Shelf @
        @name = 'FileBrowser'
        
        post.on 'browserColumnItemsSet', @onColumnItemsSet
        post.on 'saved',                 @updateGitStatus
        post.on 'gitRefChanged',         @updateGitStatus
        post.on 'fileIndexed',           @onFileIndexed
        post.on 'sourceInfoForFile',     @loadSourceInfo
    
        @shelfResize = elem 'div', class: 'shelfResize'
        @shelfResize.style.position = 'absolute'
        @shelfResize.style.top      = '0px'
        @shelfResize.style.bottom   = '0px'
        @shelfResize.style.left     = '194px'
        @shelfResize.style.width    = '6px'
        @shelfResize.style.cursor   = 'ew-resize'
        
        @drag = new drag
            target:  @shelfResize
            onMove:  @onShelfDrag
            
        @shelfSize = state.get 'shelf:size', 200
        
    #  0000000   0000000   000      000   000  00     00  000   000   0000000  
    # 000       000   000  000      000   000  000   000  0000  000  000       
    # 000       000   000  000      000   000  000000000  000 0 000  0000000   
    # 000       000   000  000      000   000  000 0 000  000  0000       000  
    #  0000000   0000000   0000000   0000000   000   000  000   000  0000000   
    
    initColumns: ->
        
        super()
                
        @view.insertBefore @shelf.div, @view.firstChild
        @view.insertBefore @shelfResize, null
        
        @shelf.browserDidInitColumns()        
        
        @setShelfSize @shelfSize

    columnAtPos: (pos) ->
        
        if column = super pos
            return column
                
        if elem.containsPos @shelf.div, pos
            return @shelf
            
    lastColumnPath: ->
        
        if lastColumn = @lastUsedColumn()
            return lastColumn.parent.file

    onBackspaceInColumn: (column) -> 
    
        column.clearSearch()
        @navigate 'left'

    updateColumnScrolls: =>
        
        super()
        @shelf.scroll.update()
        
    #  0000000  000   000  00000000  000      00000000  
    # 000       000   000  000       000      000       
    # 0000000   000000000  0000000   000      000000    
    #      000  000   000  000       000      000       
    # 0000000   000   000  00000000  0000000  000       
    
    onShelfDrag: (drag, event) => 
        
        shelfSize = clamp 0, 400, drag.pos.x
        @setShelfSize shelfSize
        
    setShelfSize: (@shelfSize) ->
        
        state.set 'shelf|size', @shelfSize
        @shelfResize.style.left = "#{@shelfSize}px"
        @shelf.div.style.width = "#{@shelfSize}px"
        @cols.style.left = "#{@shelfSize}px"
        
    # 00000000  000  000      00000000  
    # 000       000  000      000       
    # 000000    000  000      0000000   
    # 000       000  000      000       
    # 000       000  0000000  00000000  
    
    loadFile: (file, opt={}) ->
        
        if @lastColumnPath() == file
            item  = @lastUsedColumn().activeRow()?.item
            if item
                @lastUsedColumn().focus()
            else
                item = @lastUsedColumn().prevColumn()?.activeRow()?.item
                if item
                    @lastUsedColumn().prevColumn().focus()
                
            if item then @emit 'itemActivated', item
            return
        
        opt.focus ?= true
        opt.column ?= 0
        dir  = opt.dir 
        dir ?= slash.pkg file
        dir ?= slash.dir file
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
        
        @clearColumnsFrom 1, pop:true
        @loadDir dir, column:0, row: 0, focus:true

    # 000       0000000    0000000   0000000          0000000    000  00000000   
    # 000      000   000  000   000  000   000        000   000  000  000   000  
    # 000      000   000  000000000  000   000        000   000  000  0000000    
    # 000      000   000  000   000  000   000        000   000  000  000   000  
    # 0000000   0000000   000   000  0000000          0000000    000  000   000  
    
    loadDir: (dir, opt={}) -> 
        
        if opt.column > 0 and slash.isRoot(dir) and @columns[opt.column-1].activeRow()?.item.name == '/'
            @clearColumnsFrom opt.column, pop:true
            return 
        
        opt.ignoreHidden ?= state.get "browser|ignoreHidden|#{dir}", true
        
        @loadID++
        opt.loadID = @loadID
        
        dirlist dir, opt, (err, items) => 
            
            return if opt.loadID != @loadID
            if err? then return error "can't load dir #{dir}: #{err}"
            
            opt.parent ?=
                type: 'dir'
                file: slash.path dir
                name: slash.basename dir

            column = opt.column ? 0

            if column == 0 or @columns[column-1].activeRow()?.item.name == '..'
                
                updir = slash.resolve slash.join dir, '..'

                if not (updir == dir == slash.resolve '/')
                    items.unshift 
                        name: '..'
                        type: 'dir'
                        file:  updir
                else
                    items.unshift 
                        name: '/'
                        type: 'dir'
                        file: dir
                    
            @loadItems items, opt

    # 000       0000000    0000000   0000000         000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000       000     000     000       000   000  000       
    # 000      000   000  000000000  000   000       000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000       000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000         000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) ->

        if opt?.file
            @navigateTargetFile = opt.file
            @navigateTargetOpt  = opt

        @getGitStatus opt
            
        super items, opt

    #  0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000  
    # 000        000     000     000          000     000   000     000     000   000  000       
    # 000  0000  000     000     0000000      000     000000000     000     000   000  0000000   
    # 000   000  000     000          000     000     000   000     000     000   000       000  
    #  0000000   000     000     0000000      000     000   000     000      0000000   0000000   
    
    getGitStatus: (opt) ->
          
        file = opt.file ? opt.parent?.file
        return if not file?
        
        forkfunc '../tools/gitstatus', file, (err, info) =>
            
            if not empty err
                log "gitstatus failed for #{file}", err
                return
                
            
            return if empty info
                
            files = {}
            for key in ['changed', 'added', 'dirs']
                for file in info[key]
                    files[file] = key

            @shelf.updateGitFiles files
            
            for c in [0..@lastUsedColumn().index]
                if column = @columns[c]
                    column.updateGitFiles files
            
    updateGitStatus: (file) =>
        # log 'updateGitStatus', file, @lastUsedColumn().index
        return if not @lastUsedColumn()
        for c in [0..@lastUsedColumn().index]
            @getGitStatus column:c, file:file

    # 000  000   000  0000000    00000000  000   000  00000000  0000000    
    # 000  0000  000  000   000  000        000 000   000       000   000  
    # 000  000 0 000  000   000  0000000     00000    0000000   000   000  
    # 000  000  0000  000   000  000        000 000   000       000   000  
    # 000  000   000  0000000    00000000  000   000  00000000  0000000    
    
    onFileIndexed: (file, info) =>
        
        @indexedFiles ?= {}
        @indexedFiles[file] = info
        if file == @activeColumn()?.activeRow()?.item.file
            @loadContent @activeColumn().activeRow(), column: @activeColumn().index+1
                
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    onColumnItemsSet: (column) => 
        
        if @navigateTargetFile
            column.navigateTo @navigateTargetFile
    
    navigateTo: (opt) -> @columns[0].navigateTo opt
    
    endNavigateToTarget: ->
        
        if @navigateTargetFile
            
            delete @navigateTargetFile
            
            col = @lastUsedColumn()
            
            if @navigateTargetOpt.focus != false
                if col.parent.type == 'file'
                    @column(col.index-1)?.focus()
                else
                    col.focus()
                    
            delete @navigateTargetOpt
            
            @popEmptyColumns()
    
module.exports = FileBrowser

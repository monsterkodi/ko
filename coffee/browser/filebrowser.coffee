###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000  
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000  
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000  
###

{ empty, elem, clamp, drag, post, clamp, childp, prefs, slash, fs, os, error, log, $ } = require 'kxk'
  
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
            
        @shelfSize = prefs.get 'shelf:size', 200
        
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
        
    onShelfDrag: (drag, event) => 
        
        shelfSize = clamp 0, 400, drag.pos.x
        @setShelfSize shelfSize
        
    setShelfSize: (@shelfSize) ->
        
        prefs.set 'shelf:size', @shelfSize
        @shelfResize.style.left = "#{@shelfSize}px"
        @shelf.div.style.width = "#{@shelfSize}px"
        @cols.style.left = "#{@shelfSize}px"
        
    # 00000000  000  000      00000000  
    # 000       000  000      000       
    # 000000    000  000      0000000   
    # 000       000  000      000       
    # 000       000  0000000  00000000  
    
    loadFile: (file, opt = focus:true, column:0) ->
        
        dir  = opt.dir 
        dir ?= slash.pkg file
        dir ?= slash.dirname file
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

    # 0000000    000  00000000   
    # 000   000  000  000   000  
    # 000   000  000  0000000    
    # 000   000  000  000   000  
    # 0000000    000  000   000  
    
    loadDir: (dir, opt) -> 
        
        opt ?= {}
        
        if opt.column > 0 and slash.isRoot(dir) and @columns[opt.column-1].activeRow()?.item.name == '/'
            @clearColumnsFrom opt.column, pop:true
            return 
        
        opt.ignoreHidden ?= prefs.get "browser:ignoreHidden:#{dir}", true
        
        @loadID++
        opt.loadID = @loadID
        
        # log 'filebrowser.loadDir', dir, opt
        
        dirlist dir, opt, (err, items) => 
            
            return if opt.loadID != @loadID
            if err? then return error "can't load dir #{dir}: #{err}"
            
            opt.parent ?=
                type: 'dir'
                file: slash.path dir
                name: slash.basename dir

            column = opt.column ? 0

            # log 'filebrowser.loadDir', column, @columns.length
            
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
                
            # log "getGitStatus #{file}", info
            
            return if empty info
                
            files = {}
            for key in ['changed', 'added', 'dirs']
                for file in info[key]
                    files[file] = key

            column = @columns[opt.column]
            return if not column?
            
            rows = column.rows
            return if empty rows
            
            while statusDiv = $('.git', column.div)
                statusDiv.remove()
                
            # log 'files:', files
            for row in rows
                return if row.item.type not in ['dir', 'file']
                # log "row.item.file #{row.item.file}"
                status = files[row.item.file]
                if status?
                    icon = {added:'plus', changed:'pencil', 'dirs':'pencil-square-o'}[status]
                    row.div.appendChild elem 'span', 
                        class:"git #{status} fa fa-#{icon} extname #{slash.ext(row.item.file)}"

    updateGitStatus: (file) =>
        
        if lastUsed = @lastUsedColumn()
            for c in [0..lastUsed.index]
                @getGitStatus column:c, file:file


    # 000  000   000  0000000    00000000  000   000  00000000  0000000    
    # 000  0000  000  000   000  000        000 000   000       000   000  
    # 000  000 0 000  000   000  0000000     00000    0000000   000   000  
    # 000  000  0000  000   000  000        000 000   000       000   000  
    # 000  000   000  0000000    00000000  000   000  00000000  0000000    
    
    onFileIndexed: (file) =>
        if file == @activeColumn()?.activeRow()?.item.file
            log "FileBrowser.onFileIndexed", file, @activeColumn().index+1
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
    
module.exports = FileBrowser

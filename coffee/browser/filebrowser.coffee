###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000   
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000  
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000    
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000  
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000  
###

{ post, valid, empty, elem, clamp, drag, clamp, state, slash, fs, os, error, log, $ } = require 'kxk'
  
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
        
        post.on 'saved',                 @updateGitStatus
        post.on 'gitRefChanged',         @updateGitStatus
        post.on 'fileIndexed',           @onFileIndexed
        post.on 'file',                  @onFile
        post.on 'filebrowser',           @onFileBrowser
    
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
        
    onFileBrowser: (action, item, col) =>
        
        switch action
            when 'loadItem'     then @loadItem     item
            when 'activateItem' then @activateItem item, col

    loadItem: (item) ->
        
        item.name ?= slash.file item.file
        
        switch item.type
            when 'file' then @loadFileItem item
            when 'dir'  then @loadDirItem  item

    activateItem: (item, col) ->
        
        switch item.type
            when 'file' then @loadFileItem item, col+1
            when 'dir'  then @loadDirItem  item, col+1
            
    loadFileItem: (item, col=0) ->
        
        log 'loadFileItem', col, item

        @clearColumnsFrom col, pop:true
        
        if col >= @numCols()
            log 'addColumn'
            @addColumn()
        
        file = item.file

        switch slash.ext file  
            when 'gif', 'png', 'jpg', 'jpeg', 'svg', 'bmp', 'ico'
                cnt = elem class: 'browserImageContainer', child: 
                    elem 'img', class: 'browserImage', src: slash.fileUrl file
                @columns[col].table.appendChild cnt
            when 'tiff', 'tif'
                if not slash.win()
                    @convertImage row
            when 'pxm'
                if not slash.win()
                    @convertPXM row
            else
                @loadSourceItem item, col
            
    loadSourceItem: (item, col) ->
        
        info = post.get 'indexer', 'file', item.file
            
        return if empty info
        
        items = []
        clsss = info.classes ? []
        for clss in clsss
            text = '● '+clss.name
            items.push name: clss.name, text:text, type:'class', file: item.file, line: clss.line
        
        funcs = info.funcs ? []
        for func in funcs
            if func.test == 'describe'
                text = '● '+func.name
            else if func.static
                text = '  ◆ '+func.name
            else if func.post
                text = '  ⬢ '+func.name
            else
                text = '  ▸ '+func.name
            items.push name: func.name, text:text, type:'func', file: item.file, line: func.line

        if valid items
            items.sort (a,b) -> a.line - b.line
            @columns[col].loadItems items, item
        else
            log 'not valid'
            
    loadDirItem: (item, col=0) ->
        
        log 'loadDirItem', col, item
        
        return if col>0 and item.name == '/'
        
        dir = item.file
        
        dirlist dir, (err, items) => 
            
            if err? then return error "can't load dir #{dir}: #{err}"
            
            updir = slash.resolve slash.join dir, '..'

            if col == 0 or @columns[col-1].activeRow().item.name == '..'
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
             
            if col >= @numCols()
                log 'addColumn'
                @addColumn()
            else
                @clearColumnsFrom col+1, pop:true
            @columns[col].loadItems items, item
            @getGitStatus item

    onFile: (file) =>
        
        return if not file
        return if not @flex
        
        @navigateToFile file
        
    navigateToFile: (file) ->
        
        lastPath = @lastUsedColumn()?.parent.file
        return if file == lastPath
        # window.lastFocus 
        log 'navigateToFile', file, lastPath
        baseDir = @columns[0].path()
        # log 'baseDir', baseDir
        pkgDir = slash.pkg file
        # log 'pkgDir', pkgDir
        # if slash.samePath baseDir, pkgDir
            # log 'same base/pkg!'
        # else
            # log 'load path from', pkgDir
        
        lastlist = slash.pathlist lastPath
        pkglist  = slash.pathlist pkgDir
        filelist = slash.pathlist file
            
        listindex = pkglist.length - 1 
        col0index = listindex
        col = 0
        while col0index < lastlist.length and col0index < filelist.length and lastlist[col0index] == filelist[col0index]
            col0index += 1
            col += 1
            
        log "col #{col} col0index #{col0index}", filelist.slice col0index
            
        # @loadFile file, dontJump:true, focus:window.lastFocus
            
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
            return lastColumn.path()

    lastDirColumn: ->
        
        if lastColumn = @lastUsedColumn()
            if lastColumn.isDir()
                return lastColumn
            else
                return lastColumn.prevColumn()
                
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
    
    # loadFile: (file, opt={}) -> # unused ???
#         
        # if empty file
            # return error 'FileBrowser.loadFile -- no file?'
#         
        # log 'loadFile', @lastColumnPath(), file
#             
        # if @lastColumnPath() == file
            # item  = @lastUsedColumn().activeRow()?.item
            # if item
                # @lastUsedColumn().focus()
            # else
                # item = @lastUsedColumn().prevColumn()?.activeRow()?.item
                # if item
                    # @lastUsedColumn().prevColumn().focus()
#                 
            # if item then @emit 'itemActivated', item
            # return
#             
        # if lastDir = @lastDirColumn()
            # if slash.samePath lastDir.path(), slash.dir(file) 
                # lastDir.row(slash.file file)?.activate()
                # @loadContent lastDir.row(slash.file file), column:lastDir.index+1
                # return
#         
        # opt.focus ?= true
        # opt.column ?= 0
        # dir  = opt.dir 
        # dir ?= slash.pkg file
        # dir ?= slash.dir file
        # opt.file = file
        # @skipJump = opt.dontJump
        # @loadDir dir, opt
        
    # 0000000    00000000    0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000 0 000  000       000       
    # 0000000    0000000    000   000  000000000  0000000   0000000   
    # 000   000  000   000  000   000  000   000       000  000       
    # 0000000    000   000   0000000   00     00  0000000   00000000  
    
    browse: (dir) -> 

        return error "no dir?" if not dir?

        log 'browse', dir
        
        @clearColumnsFrom 1, pop:true
        @loadDir dir, column:0, row: 0, focus:true

    # 000       0000000    0000000   0000000          0000000    000  00000000   
    # 000      000   000  000   000  000   000        000   000  000  000   000  
    # 000      000   000  000000000  000   000        000   000  000  0000000    
    # 000      000   000  000   000  000   000        000   000  000  000   000  
    # 0000000   0000000   000   000  0000000          0000000    000  000   000  
    
    loadDir: (dir, opt={}) -> 
        
        log 'loadDir', dir, opt
        
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
             
            # log 'loadItems', items.length, opt
            @loadItems items, opt

    # 000       0000000    0000000   0000000         000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000       000     000     000       000   000  000       
    # 000      000   000  000000000  000   000       000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000       000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000         000     000     00000000  000   000  0000000   
    
    loadItems: (items, opt) -> # unused???

        # if opt?.file
            # @navigateTargetFile = opt.file
            # @navigateTargetOpt  = opt

        @getGitStatus opt
            
        super items, opt

    #  0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000  
    # 000        000     000     000          000     000   000     000     000   000  000       
    # 000  0000  000     000     0000000      000     000000000     000     000   000  0000000   
    # 000   000  000     000          000     000     000   000     000     000   000       000  
    #  0000000   000     000     0000000      000     000   000     000      0000000   0000000   
    
    getGitStatus: (opt) ->
          
        file = opt.file ? opt.parent?.file
        return if empty file
        
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
            
            if @lastUsedColumn()
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
            log 'loadContent?', file
            # @loadContent @activeColumn().activeRow(), column: @activeColumn().index+1
            
module.exports = FileBrowser

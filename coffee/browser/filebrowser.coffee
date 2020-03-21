###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
###

{ $, clamp, drag, elem, empty, filelist, klog, post, prefs, slash, valid } = require 'kxk'

Browser  = require './browser'
Shelf    = require './shelf'
Select   = require './select'
File     = require '../tools/file'
Info     = require './info'
hub      = require '../git/hub'

class FileBrowser extends Browser

    @: (view) ->

        super view

        window.filebrowser = @

        @loadID = 0
        @shelf  = new Shelf @
        @select = new Select @
        @name   = 'FileBrowser'
        @srcCache = {}
        
        post.on 'file'           @onFile
        post.on 'browse'         @browse
        post.on 'filebrowser'    @onFileBrowser
        post.on 'navigateToFile' @navigateToFile

        post.on 'gitStatus'      @onGitStatus
        post.on 'fileIndexed'    @onFileIndexed
        post.on 'dirChanged'     @onDirChanged
        
        @shelfResize = elem 'div' class: 'shelfResize'
        @shelfResize.style.position = 'absolute'
        @shelfResize.style.top      = '0px'
        @shelfResize.style.bottom   = '0px'
        @shelfResize.style.left     = '194px'
        @shelfResize.style.width    = '6px'
        @shelfResize.style.cursor   = 'ew-resize'

        @drag = new drag
            target:  @shelfResize
            onMove:  @onShelfDrag

        @shelfSize = window.state.get 'shelf|size' 200

        @initColumns()
        
    # 0000000    00000000    0000000   00000000    0000000    0000000  000000000  000   0000000   000   000  
    # 000   000  000   000  000   000  000   000  000   000  000          000     000  000   000  0000  000  
    # 000   000  0000000    000   000  00000000   000000000  000          000     000  000   000  000 0 000  
    # 000   000  000   000  000   000  000        000   000  000          000     000  000   000  000  0000  
    # 0000000    000   000   0000000   000        000   000   0000000     000     000   0000000   000   000  
    
    dropAction: (action, sources, target) ->
        
        if slash.isFile target
            
            target = slash.dir target
        
        for source in sources
        
            if action == 'move' 
                if source == target or slash.dir(source) == target
                    klog 'noop' source, target
                    return
                        
        for source in sources
            
            switch action
                when 'move' then File.rename source, target, (source, target) => # klog 'file moved' source, target
                when 'copy' then File.copy source, target, (source, target) => # klog 'file copied' source, target
                    
    columnForFile: (file) ->
        
        for column in @columns
            if column.parent?.file == slash.dir file
                return column
        
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
    # 000  0000  000   000     000     000  000   000  000   000     000     000
    # 000   000  000   000      0      000   0000000   000   000     000     00000000

    sharedColumnIndex: (file) -> 
        
        col = 0
        
        for column in @columns
            if column.isDir() and file.startsWith column.path()
                col += 1
            else
                break
                
        if col == 1 and slash.dir(file) != @columns[0]?.path()
            return 0
        Math.max -1, col-2

    browse: (file, opt) => 
            
        if file then @loadItem @fileItem(file), opt
        
    onFile: (file) => if file and @flex then @navigateToFile file
    
    navigateToFile: (file) =>

        lastPath = @lastDirColumn()?.path()
        
        file = slash.path file

        if file == lastPath or file == @lastColumnPath() or slash.isRelative file
            return

        col = @sharedColumnIndex file
        
        filelist = slash.pathlist file
        
        if col >= 0
            paths = filelist.slice filelist.indexOf(@columns[col].path())+1
        else
            paths = filelist.slice filelist.length-2
            
        @clearColumnsFrom col+1, pop:true clear:col+paths.length
        
        while @numCols() < paths.length
            @addColumn()
                        
        for index in [0...paths.length]
            
            item = @fileItem paths[index]
            
            switch item.type
                when 'file' 
                    @loadFileItem item, col+1+index
                when 'dir'
                    opt = {}
                    if index < paths.length-1
                        opt.active = paths[index+1]
                    # klog 'navigateToFile'
                    @loadDirItem item, col+1+index, opt
                    
        if col = @lastDirColumn()
            
            if row = col.row(slash.file file)
                row.setActive()

    refresh: =>

        hub.refresh()
        @srcCache = {}

        if @lastUsedColumn()
            @navigateToFile @lastUsedColumn()?.path()
                
    # 000  000000000  00000000  00     00  
    # 000     000     000       000   000  
    # 000     000     0000000   000000000  
    # 000     000     000       000 0 000  
    # 000     000     00000000  000   000  
    
    fileItem: (path) ->
        
        p = slash.resolve path
                
        file:p
        type:slash.isFile(p) and 'file' or 'dir'
        name:slash.file p
        
    onFileBrowser: (action, item, arg) =>

        switch action
            when 'loadItem'     then @loadItem     item, arg
            when 'activateItem' then @activateItem item, arg
    
    loadDir: (path) -> @loadItem type:'dir' file:path
    
    loadItem: (item, opt) ->

        opt ?= active:'..' focus:true
        item.name ?= slash.file item.file

        # klog 'loadItem'
        @clearColumnsFrom 1, pop:true, clear:opt.clear ? 1

        switch item.type
            when 'dir'  then @loadDirItem item, 0, opt
            when 'file' 
                opt.activate = item.file
                while @numCols() < 2 then @addColumn()
                @loadDirItem @fileItem(slash.dir(item.file)), 0, opt

        if opt.focus
            @columns[0]?.focus()
            
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000
    # 000   000  000          000     000  000   000  000   000     000     000
    # 000000000  000          000     000   000 000   000000000     000     0000000
    # 000   000  000          000     000     000     000   000     000     000
    # 000   000   0000000     000     000      0      000   000     000     00000000

    activateItem: (item, col) ->

        @clearColumnsFrom col+2 pop:true

        switch item.type
            when 'dir'
                # klog 'activateItem'
                @loadDirItem  item, col+1, focus:false
            when 'file'
                @loadFileItem item, col+1
                if item.textFile or File.isText item.file
                    post.emit 'jumpToFile' item

    # 00000000  000  000      00000000  000  000000000  00000000  00     00
    # 000       000  000      000       000     000     000       000   000
    # 000000    000  000      0000000   000     000     0000000   000000000
    # 000       000  000      000       000     000     000       000 0 000
    # 000       000  0000000  00000000  000     000     00000000  000   000

    loadFileItem: (item, col=0) ->

        @clearColumnsFrom col, pop:true

        while col >= @numCols()
            @addColumn()

        file = item.file

        @columns[col].parent = item
        
        if File.isImage file
            @imageInfoColumn col, file
        else
            switch slash.ext file
                when 'tiff' 'tif'
                    if not slash.win()
                        @convertImage row
                    else
                        @fileInfoColumn col, file
                when 'pxm'
                    if not slash.win()
                        @convertPXM row
                    else
                        @fileInfoColumn col, file
                else
                    if File.isText item.file
                        @loadSourceItem item, col
                    if not File.isCode item.file
                        @fileInfoColumn col, file

        post.emit 'load' column:col, item:item
                
        @updateColumnScrolls()

    imageInfoColumn: (col, file) ->
        
        @columns[col].crumb.hide()
        @columns[col].table.appendChild Info.image file
        
    fileInfoColumn: (col, file) ->
        
        @columns[col].crumb.hide()
        @columns[col].table.appendChild Info.file file
                 
             
    #  0000000   0000000   000   000  00000000    0000000  00000000  000  000000000  00000000  00     00
    # 000       000   000  000   000  000   000  000       000       000     000     000       000   000
    # 0000000   000   000  000   000  0000000    000       0000000   000     000     0000000   000000000
    #      000  000   000  000   000  000   000  000       000       000     000     000       000 0 000
    # 0000000    0000000    0000000   000   000   0000000  00000000  000     000     00000000  000   000

    onFileIndexed: (file, info) =>
 
        @srcCache[file] = info
 
        if file == @lastUsedColumn()?.parent?.file
            @loadSourceItem { file:file, type:'file' }, @lastUsedColumn()?.index
             
    loadSourceItem: (item, col) ->

        if not @srcCache[item.file]?

            @srcCache[item.file] = post.get 'indexer' 'file' item.file

        info = @srcCache[item.file]

        if empty info
            @columns[col].loadItems [], item
            return

        items = []
        clsss = info.classes ? []
        for clss in clsss
            text = '● '+clss.name
            items.push name:clss.name, text:text, type:'class', file:item.file, line:clss.line

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
            items.push name:func.name, text:text, type:'func', file:item.file, line:func.line

        if valid items
            items.sort (a,b) -> a.line - b.line
            @columns[col].loadItems items, item
             
    # 0000000    000  00000000   000  000000000  00000000  00     00
    # 000   000  000  000   000  000     000     000       000   000
    # 000   000  000  0000000    000     000     0000000   000000000
    # 000   000  000  000   000  000     000     000       000 0 000
    # 0000000    000  000   000  000     000     00000000  000   000

    onDirChanged: (info) =>
 
        # klog 'onDirChanged' info.change, info.dir, info.path
        for column in @columns
            if column.path() == info.dir
                @loadDirItem {file:info.dir, type:'dir'}, column.index, active:column.activePath(), focus:false
            if column.path() == info.path and info.change == 'remove'
                column.clear()
    
    loadDirItem: (item, col=0, opt={}) ->

        return if col > 0 and item.name == '/'

        dir = item.file

        # if @skipOnDblClick
            # klog 'loadDirItem skip' col, dir
            # delete @skipOnDblClick
            # return 
        
        # opt.ignoreHidden = not window.state.get "browser|showHidden|#{dir}"
        opt.ignoreHidden = not prefs.get "browser▸showHidden▸#{dir}"
        slash.list dir, opt, (items) =>
            post.toMain 'dirLoaded' dir
            @loadDirItems dir, item, items, col, opt
            post.emit 'dir' dir
                
    loadDirItems: (dir, item, items, col, opt) =>
        
        @updateColumnScrolls()
                            
        # klog 'loadDirItems' col, dir
        if @skipOnDblClick and col > 0
            delete @skipOnDblClick
            return
        
        while col >= @numCols()
            @addColumn()
        
        @columns[col].loadItems items, item

        post.emit 'load' column:col, item:item
                            
        if opt.activate
            if row = @columns[col].row slash.file opt.activate
                row.activate()
                post.emit 'load' column:col+1 item:row.item
        else if opt.active
            @columns[col].row(slash.file opt.active)?.setActive()
        
        @getGitStatus item, col
        
        if opt.focus != false and empty(document.activeElement) and empty($('.popup')?.outerHTML)
            if lastColumn = @lastDirColumn()
                lastColumn.focus()
                
        opt.cb? column:col, item:item

        if col >= 2 and @columns[0].width() < 250
            @columns[1].makeRoot()
        
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

        column.backspaceSearch()
        
    onDeleteInColumn: (column) -> 
    
        if column.searchDiv
            column.clearSearch()
        else
            column.moveToTrash()
        
    updateColumnScrolls: =>

        super()
        @shelf?.scroll.update()

    #  0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000
    # 000        000     000     000          000     000   000     000     000   000  000
    # 000  0000  000     000     0000000      000     000000000     000     000   000  0000000
    # 000   000  000     000          000     000     000   000     000     000   000       000
    #  0000000   000     000     0000000      000     000   000     000      0000000   0000000

    getGitStatus: (item, col) =>

        file = item.file ? item.parent?.file
        return if empty file

        hub.status file, (status) => @applyGitStatusFiles col, hub.statusFiles status

    applyGitStatusFiles: (col, files) =>

        @columns[col]?.updateGitFiles files

    onGitStatus: (gitDir, status) =>

        files = hub.statusFiles status
        for col in [0..@columns.length]
            @applyGitStatusFiles col, files

        @shelf?.updateGitFiles files

    #  0000000  000   000  00000000  000      00000000  
    # 000       000   000  000       000      000       
    # 0000000   000000000  0000000   000      000000    
    #      000  000   000  000       000      000       
    # 0000000   000   000  00000000  0000000  000       

    onShelfDrag: (drag, event) =>

        shelfSize = clamp 0, 400, drag.pos.x
        @setShelfSize shelfSize

    setShelfSize: (@shelfSize) ->

        window.state.set 'shelf|size' @shelfSize
        @shelfResize.style.left = "#{@shelfSize}px"
        @shelf.div.style.width = "#{@shelfSize}px"
        @cols.style.left = "#{@shelfSize}px"
        @updateColumnScrolls()
    
    toggleShelf: ->
        
        if @shelfSize < 1
            @setShelfSize 200
        else
            @lastUsedColumn()?.focus()
            @setShelfSize 0
            
        @updateColumnScrolls()
        
module.exports = FileBrowser

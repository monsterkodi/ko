###
00000000  000  000      00000000        0000000    00000000    0000000   000   000   0000000  00000000  00000000
000       000  000      000             000   000  000   000  000   000  000 0 000  000       000       000   000
000000    000  000      0000000         0000000    0000000    000   000  000000000  0000000   0000000   0000000
000       000  000      000             000   000  000   000  000   000  000   000       000  000       000   000
000       000  0000000  00000000        0000000    000   000   0000000   00     00  0000000   00000000  000   000
###

{ post, filelist, slash, empty, valid, clamp, elem, drag, last } = require 'kxk'

Browser  = require './browser'
Shelf    = require './shelf'
dirCache = require '../tools/dircache'
hub      = require '../git/hub'

class FileBrowser extends Browser

    @: (view) ->

        super view

        window.filebrowser = @

        @loadID = 0
        @shelf  = new Shelf @
        @name   = 'FileBrowser'

        @srcCache = {}

        post.on 'gitStatus'   @onGitStatus
        post.on 'fileIndexed' @onFileIndexed
        post.on 'file'        @onFile
        post.on 'filebrowser' @onFileBrowser
        post.on 'dircache'    @onDirCache

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

        @shelfSize = window.state.get 'shelf|size', 200

        @initColumns()

    onFileBrowser: (action, item, arg) =>

        switch action
            when 'loadItem'     then @loadItem     item, arg
            when 'activateItem' then @activateItem item, arg

    # 000       0000000    0000000   0000000    000  000000000  00000000  00     00
    # 000      000   000  000   000  000   000  000     000     000       000   000
    # 000      000   000  000000000  000   000  000     000     0000000   000000000
    # 000      000   000  000   000  000   000  000     000     000       000 0 000
    # 0000000   0000000   000   000  0000000    000     000     00000000  000   000

    loadItem: (item, opt) ->

        opt ?= {}
        item.name ?= slash.file item.file

        @popColumnsFrom 1

        switch item.type
            when 'file' then @loadFileItem item
            when 'dir'  then @loadDirItem  item, 0, opt #, active:'..'

        if opt.focus
            @columns[0].focus()

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000
    # 000   000  000          000     000  000   000  000   000     000     000
    # 000000000  000          000     000   000 000   000000000     000     0000000
    # 000   000  000          000     000     000     000   000     000     000
    # 000   000   0000000     000     000      0      000   000     000     00000000

    activateItem: (item, col) ->

        @clearColumnsFrom col+2 pop:true

        switch item.type
            when 'dir'
                @loadDirItem  item, col+1
            when 'file'
                @loadFileItem item, col+1
                # klog 'activateItem' item.textFile, item.file
                if item.textFile
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

        switch slash.ext file
            when 'gif' 'png' 'jpg' 'jpeg' 'svg' 'bmp' 'ico'
                cnt = elem class: 'browserImageContainer' child:
                    elem 'img' class: 'browserImage' src: slash.fileUrl file
                @columns[col].table.appendChild cnt
            when 'tiff' 'tif'
                if not slash.win()
                    @convertImage row
            when 'pxm'
                if not slash.win()
                    @convertPXM row
            else
                @loadSourceItem item, col

    #  0000000   0000000   000   000  00000000    0000000  00000000  000  000000000  00000000  00     00
    # 000       000   000  000   000  000   000  000       000       000     000     000       000   000
    # 0000000   000   000  000   000  0000000    000       0000000   000     000     0000000   000000000
    #      000  000   000  000   000  000   000  000       000       000     000     000       000 0 000
    # 0000000    0000000    0000000   000   000   0000000  00000000  000     000     00000000  000   000

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

    onDirCache: (dir) =>

        for column in @columns
            if column.path() == dir
                @loadDirItem {file:dir, type:'dir'}, column.index, active:column.activePath()
                return

    loadDirItem: (item, col=0, opt={}) ->

        return if col > 0 and item.name == '/'

        dir = item.file

        if dirCache.has(dir) and not opt.ignoreCache
            @loadDirItems dir, item, dirCache.get(dir), col, opt
            post.emit 'dir' dir
        else
            opt.ignoreHidden = not window.state.get "browser|showHidden|#{dir}"
            opt.textTest = true
            
            slash.list dir, opt, (items) =>

                post.toMain 'dirLoaded' dir

                dirCache.set dir, items
                @loadDirItems dir, item, items, col, opt
                post.emit 'dir' dir

    loadDirItems: (dir, item, items, col, opt) =>

        updir = slash.resolve slash.join dir, '..'

        if col == 0 or col-1 < @numCols() and @columns[col-1].activeRow()?.item.name == '..'
            if items[0].name not in ['..' '/']
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

        while col >= @numCols()
            @addColumn()

        @columns[col].loadItems items, item

        if opt.active
            @columns[col].row(slash.file opt.active)?.setActive()

        @getGitStatus item, col

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000
    # 000  0000  000   000     000     000  000   000  000   000     000     000
    # 000   000  000   000      0      000   0000000   000   000     000     00000000

    navigateToFile: (file) ->
                
        # klog 'filebrowser.navigateToFile' file
                
        lastPath = @lastUsedColumn()?.path()
        if file == lastPath
            return

        if slash.isRelative file
            return

        filelist = slash.pathlist file
        lastlist = slash.pathlist lastPath

        if valid lastlist

            lastdir = last lastlist
            if @lastUsedColumn()?.isFile()
                lastdir = slash.dir lastdir
            relative = slash.relative file, lastdir

            if slash.isRelative relative
                upCount = 0
                while relative.startsWith '../'
                    upCount += 1
                    relative = relative.substr 3

                if upCount < @numCols()-1
                    col   = @numCols() - 1 - upCount
                    relst = slash.pathlist relative
                    paths = filelist.slice filelist.length - relst.length

        if empty paths

            pkgDir   = slash.pkg file
            pkglist  = slash.pathlist pkgDir

            listindex = pkglist.length - 1
            col0index = listindex
            col = 0

            if filelist[col0index] == @columns[0]?.path()
                while col0index < lastlist.length and col0index < filelist.length and lastlist[col0index] == filelist[col0index]
                    col0index += 1
                    col += 1

            paths = filelist.slice col0index
            
        if slash.isFile last paths
            lastType = 'file'
        else
            lastType = 'dir'

        @popColumnsFrom   col+paths.length
        @clearColumnsFrom col
        
        while @numCols() < paths.length
            @addColumn()
        
        if col > 0
            @columns[col-1].row(slash.file paths[0])?.setActive()

        for index in [0...paths.length]
            type = if index == paths.length-1 then lastType else 'dir'
            file = paths[index]
                      
            if col == 0 == index and type == 'file'
                type = 'dir'
                file = slash.dir file
                
            item = file:file, type:type
            
            switch type
                when 'file' then @loadFileItem item, col+index
                when 'dir'
                    opt = {}
                    if index < paths.length-1
                        opt.active = paths[index+1]
                    else if col == 0 == index and paths.length == 1
                        opt.active = paths[0]
                    @loadDirItem item, col+index, opt
                    
            # if col == 0 == index and paths.length == 1
                # @columns[col].row(slash.file paths[0])?.setActive()

        lastItem = file:last(paths), type:lastType
        
        @emit 'itemActivated' lastItem

    #  0000000   000   000  00000000  000  000      00000000
    # 000   000  0000  000  000       000  000      000
    # 000   000  000 0 000  000000    000  000      0000000
    # 000   000  000  0000  000       000  000      000
    #  0000000   000   000  000       000  0000000  00000000

    onFile: (file) =>

        return if not file
        return if not @flex

        @navigateToFile file

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

        window.state.set 'shelf|size' @shelfSize
        @shelfResize.style.left = "#{@shelfSize}px"
        @shelf.div.style.width = "#{@shelfSize}px"
        @cols.style.left = "#{@shelfSize}px"

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

        @shelf.updateGitFiles files

    refresh: =>

        hub.refresh()

        dirCache.reset()
        @srcCache = {}

        if @lastUsedColumn()
            @navigateToFile @lastUsedColumn()?.path()

    # 000  000   000  0000000    00000000  000   000  00000000  0000000
    # 000  0000  000  000   000  000        000 000   000       000   000
    # 000  000 0 000  000   000  0000000     00000    0000000   000   000
    # 000  000  0000  000   000  000        000 000   000       000   000
    # 000  000   000  0000000    00000000  000   000  00000000  0000000

    onFileIndexed: (file, info) =>

        @srcCache[file] = info

        if file == @lastUsedColumn()?.parent?.file
            @loadSourceItem { file:file, type:'file' }, @lastUsedColumn()?.index

module.exports = FileBrowser

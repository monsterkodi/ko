###
 0000000   0000000   000      000   000  00     00  000   000
000       000   000  000      000   000  000   000  0000  000
000       000   000  000      000   000  000000000  000 0 000
000       000   000  000      000   000  000 0 000  000  0000
 0000000   0000000   0000000   0000000   000   000  000   000
###

{ $, _, clamp, drag, elem, empty, fs, kerror, keyinfo, klog, kpos, open, popup, post, prefs, setStyle, slash, stopEvent, valid } = require 'kxk'

Row      = require './row'
Crumb    = require './crumb'
Scroller = require './scroller'
DirWatch = require '../tools/dirwatch'
File     = require '../tools/file'
fuzzy    = require 'fuzzy'
wxw      = require 'wxw'
electron = require 'electron'

class Column
    
    @: (@browser) ->
        
        @searchTimer = null
        @search = ''
        @items  = []
        @rows   = []
        
        @div     = elem class: 'browserColumn'        tabIndex:6 id: @name()
        @content = elem class: 'browserColumnContent' parent: @div
        @table   = elem class: 'browserColumnTable'   parent: @content
        
        @browser.cols?.appendChild @div
        
        @div.addEventListener 'focus'     @onFocus
        @div.addEventListener 'blur'      @onBlur
        @div.addEventListener 'keydown'   @onKey
        @div.addEventListener 'keyup'     @onKeyUp
        
        @div.addEventListener 'mouseover' @onMouseOver
        @div.addEventListener 'mouseout'  @onMouseOut

        @div.addEventListener 'dblclick'  @onDblClick
        
        @div.addEventListener 'contextmenu' @onContextMenu
  
        @drag = new drag
            target:  @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop
        
        @crumb  = new Crumb @
        @scroll = new Scroller @, @content
        
        @setIndex @browser.columns?.length
      
    # 000       0000000    0000000   0000000    000  000000000  00000000  00     00   0000000  
    # 000      000   000  000   000  000   000  000     000     000       000   000  000       
    # 000      000   000  000000000  000   000  000     000     0000000   000000000  0000000   
    # 000      000   000  000   000  000   000  000     000     000       000 0 000       000  
    # 0000000   0000000   000   000  0000000    000     000     00000000  000   000  0000000   
    
    loadItems: (items, parent) ->
        
        # klog @parent?.file, parent.file, items.length
        @clear()

        @parent = parent
        
        if @index == 0 or @index-1 < @browser.numCols() and @browser.columns[@index-1].activeRow()?.item.name == '..' and not slash.isRoot @parent.file
            if items[0]?.name not in ['..' '/']
                dir = @parent.file
                updir = slash.dir dir
                if updir != dir
                    items.unshift
                        name: '..'
                        type: 'dir'
                        file:  updir
        
        @items = items
  
        @div.classList.remove 'browserColumnCode'
        
        @crumb.show()
        
        if @parent.type == 'dir'
            # klog 'loadItems' @parent.file
            DirWatch.watch @parent.file
            @crumb.setFile @parent.file
        else
            if File.isCode @parent.file
                @crumb.setFile @parent.file
                @div.classList.add 'browserColumnCode'
                
        if @parent.type == undefined
            klog 'undefined parent type?'
            @parent.type = slash.isDir(@parent.file) and 'dir' or 'file'
        
        kerror "no parent item?" if not @parent?
        kerror "loadItems -- no parent type?", @parent if not @parent.type?
        
        if valid @items
            for item in @items
                @rows.push new Row @, item
        
            @scroll.update()
            
        if @parent.type == 'dir' and slash.samePath '~/Downloads' @parent.file
            @sortByDateAdded()
        @
                
    # 0000000    00000000    0000000    0000000   
    # 000   000  000   000  000   000  000        
    # 000   000  0000000    000000000  000  0000  
    # 000   000  000   000  000   000  000   000  
    # 0000000    000   000  000   000   0000000   
    
    updateDragIndicator: (event) ->
        
        @dragInd?.classList.toggle 'copy' event.shiftKey
        @dragInd?.classList.toggle 'move' event.ctrlKey or event.metaKey or event.altKey
    
    onDragStart: (d, e) => 
    
        @dragStartRow = @row e.target
        
        # @browser.skipOnDblClick = false
        
        delete @toggle
        
        if @dragStartRow
            
            if e.shiftKey
                @browser.select.to @dragStartRow
            else if e.metaKey or e.altKey or e.ctrlKey
                if not @dragStartRow.isSelected()
                    @browser.select.toggle @dragStartRow
                else
                    @toggle = true
            else
                if @dragStartRow.isSelected()
                    @deselect = true
                else
                    @activeRow()?.clearActive()
                    @browser.select.row @dragStartRow, false
        else
            if @hasFocus() and @activeRow()
                @browser.select.row @activeRow()

    # 00     00   0000000   000   000  00000000  
    # 000   000  000   000  000   000  000       
    # 000000000  000   000   000 000   0000000   
    # 000 0 000  000   000     000     000       
    # 000   000   0000000       0      00000000  
    
    onDragMove: (d,e) =>
        
        if @dragStartRow and not @dragDiv and valid @browser.select.files()
            
            return if Math.abs(d.deltaSum.x) < 20 and Math.abs(d.deltaSum.y) < 10

            delete @toggle 
            delete @deselect
            
            @dragDiv = elem 'div'
            @dragDiv.drag = d
            @dragDiv.files = @browser.select.files()
            pos = kpos e.pageX, e.pageY
            row = @browser.select.rows[0]

            @dragDiv.style.position      = 'absolute'
            @dragDiv.style.opacity       = "0.7"
            @dragDiv.style.top           = "#{pos.y-d.deltaSum.y}px"
            @dragDiv.style.left          = "#{pos.x-d.deltaSum.x}px"
            @dragDiv.style.width         = "#{@width()-12}px"
            @dragDiv.style.pointerEvents = 'none'
            
            @dragInd = elem class:'dragIndicator'
            @dragDiv.appendChild @dragInd
            
            for row in @browser.select.rows
                rowClone = row.div.cloneNode true
                rowClone.style.flex          = 'unset'
                rowClone.style.pointerEvents = 'none'
                rowClone.style.border        = 'none'
                rowClone.style.marginBottom  = '-1px'
                @dragDiv.appendChild rowClone
                            
            document.body.appendChild @dragDiv
            @focus activate:false
            
        if @dragDiv
            
            onSpringLoadTimeout = =>
                if column = @browser.columnForFile @browser.springLoadTarget
                    if row = column.row @browser.springLoadTarget
                        row.activate()
                
            clearTimeout @browser.springLoadTimer
            delete @browser.springLoadTarget
            if row = @browser.rowAtPos d.pos
                if row.item?.type == 'dir'
                    @browser.springLoadTimer = setTimeout onSpringLoadTimeout, 1000
                    @browser.springLoadTarget = row.item.file
            
            @updateDragIndicator e 
            @dragDiv.style.transform = "translateX(#{d.deltaSum.x}px) translateY(#{d.deltaSum.y}px)"
            
    #  0000000  000000000   0000000   00000000   
    # 000          000     000   000  000   000  
    # 0000000      000     000   000  00000000   
    #      000     000     000   000  000        
    # 0000000      000      0000000   000        
    
    onDragStop: (d,e) =>
        
        clearTimeout @browser.springLoadTimer
        delete @browser.springLoadTarget
        
        if @dragDiv?
            
            @dragDiv.remove()
            files = @dragDiv.files
            delete @dragDiv
            delete @dragStartRow
            
            if row = @browser.rowAtPos d.pos
                klog 'got row' row
                column = row.column
                target = row.item?.file
            else if column = @browser.columnAtPos d.pos
                klog 'got column' column
                target = column.parent?.file
            else
                klog 'no drop target'
                return
                                
            action = e.shiftKey and 'copy' or 'move'
                
            if column == @browser.shelf 
                if target and (e.ctrlKey or e.shiftKey or e.metaKey or e.altKey)
                    klog 'drop into shelf item'
                    @browser.dropAction action, files, target
                else
                    klog 'add to shelf'
                    @browser.shelf.addFiles files, pos:d.pos
            else
                klog 'drop into folder column' target
                @browser.dropAction action, files, target
        else
            if e.button == 0
                @focus activate:false
            
            if row = @row e.target
                if row.isSelected()
                    if e.metaKey or e.altKey or e.ctrlKey or e.shiftKey
                        if @toggle
                            delete @toggle
                            @browser.select.toggle row
                    else
                        if @deselect
                            delete @deselect
                            @browser.select.row row
                        else
                            row.activate()
            else
                @activeRow()?.clearActive()
        
    # 00000000   00000000  00     00   0000000   000   000  00000000  
    # 000   000  000       000   000  000   000  000   000  000       
    # 0000000    0000000   000000000  000   000   000 000   0000000   
    # 000   000  000       000 0 000  000   000     000     000       
    # 000   000  00000000  000   000   0000000       0      00000000  
    
    removeFile: (file) => 
        
        if row = @row slash.file file
            @removeRow row
            @scroll.update()
            
    # 000  000   000   0000000  00000000  00000000   000000000  
    # 000  0000  000  000       000       000   000     000     
    # 000  000 0 000  0000000   0000000   0000000       000     
    # 000  000  0000       000  000       000   000     000     
    # 000  000   000  0000000   00000000  000   000     000     
    
    insertFile: (file) => 

        item = @browser.fileItem file
        row = new Row @, item
        @rows.push row
        row
            
    # 000  000000000  00000000  00     00  
    # 000     000     000       000   000  
    # 000     000     0000000   000000000  
    # 000     000     000       000 0 000  
    # 000     000     00000000  000   000  
    
    unshiftItem: (item) ->
        
        @items.unshift item
        @rows.unshift new Row @, item
        @table.insertBefore @table.lastChild, @table.firstChild
        @scroll.update()
        @rows[0]
        
    pushItem: (item) ->
        
        @items.push item
        @rows.push new Row @, item
        @scroll.update()
        @rows[-1]
        
    addItem: (item) ->
        
        row = @pushItem item
        @sortByName()
        row

    setItems: (@items, opt) ->
        
        @browser.clearColumn @index
        
        @parent = opt.parent
        kerror "no parent item?" if not @parent?
        kerror "setItems -- no parent type?", @parent if not @parent.type?
        
        for item in @items
            @rows.push new Row @, item
        
        @scroll.update()
        @

    # 00     00  000   0000000   0000000    
    # 000   000  000  000       000         
    # 000000000  000  0000000   000         
    # 000 0 000  000       000  000         
    # 000   000  000  0000000    0000000    
        
    isDir:  -> @parent?.type == 'dir' 
    isFile: -> @parent?.type == 'file' 
        
    isEmpty: -> empty @parent
    clear:   ->
        if @parent?.file and @parent?.type == 'dir'
            # klog 'column.clear unwatch?' @parent.file
            DirWatch.unwatch @parent.file
        delete @parent
        @clearSearch()
        @div.scrollTop = 0
        @table.innerHTML = ''
        @crumb.clear()
        @rows = []
        @scroll.update()
           
    setIndex: (@index) ->
        
        @crumb?.elem.columnIndex = @index
        
    width: -> @div.getBoundingClientRect().width
        
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
   
    activateRow: (row) -> @row(row)?.activate()
       
    activeRow: -> _.find @rows, (r) -> r.isActive()
    activePath: -> @activeRow()?.path() ? @parent.file
    selectedRow: -> _.find @rows, (r) -> r.isSelected()
    
    row: (row) -> # accepts element, index, string or row
        if      Number.isInteger(row) then return 0 <= row < @numRows() and @rows[row] or null
        else if typeof(row) == 'string' then return _.find @rows, (r) -> r.item.name == row or r.item.file == row
        else if row instanceof HTMLElement then return _.find @rows, (r) -> r.div.contains row
        else return row
            
    nextColumn: -> @browser.column @index+1
    prevColumn: -> @browser.column @index-1
        
    name: -> "#{@browser.name}:#{@index}"
    path: -> @parent?.file ? ''
        
    numRows:    -> @rows.length ? 0   
    rowHeight:  -> @rows[0]?.div.clientHeight ? 0
    numVisible: -> @rowHeight() and parseInt(@browser.height() / @rowHeight()) or 0
    
    rowAtPos: (pos) -> @row @rowIndexAtPos pos
    
    rowIndexAtPos: (pos) ->
        dy = pos.y - @content.getBoundingClientRect().top
        rh = @rowHeight()
        if dy >= 0 and rh > 0
            Math.floor dy/rh
        else
            -1            
    
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    hasFocus: -> @div.classList.contains 'focus'

    focus: (opt={}) ->
                
        if not @activeRow() and @numRows() and opt?.activate != false
            @rows[0].setActive()
          
        @div.focus()
        @div.classList.add 'focus'
        window.setLastFocus @name()
        @
        
    onFocus: => @div.classList.add 'focus'
    onBlur:  => @div.classList.remove 'focus'

    focusBrowser: -> @browser.focus()
    
    # 00     00   0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 000000000  000   000  000   000  0000000   0000000   
    # 000 0 000  000   000  000   000       000  000       
    # 000   000   0000000    0000000   0000000   00000000  
    
    onMouseOver: (event) => @row(event.target)?.onMouseOver?()
    onMouseOut:  (event) => @row(event.target)?.onMouseOut?()
    
    onDblClick:  (event) => 
        
        @browser.skipOnDblClick = true
        item = @activeRow()?.item
        if item.type == 'dir'
            @browser.clearColumnsFrom 1 pop:true 
            @browser.loadDirItem item, 0 activate:false
        else
            editor.focus() # test if editor.currentFile == item.file ?
    
    extendSelection: (key) ->
        
        return error "no rows in column #{@index}?" if not @numRows()        
        index = @activeRow()?.index() ? -1
        error "no index from activeRow? #{index}?", @activeRow() if not index? or Number.isNaN index
            
        toIndex = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then Math.max 0, index-@numVisible()
            when 'page down' then Math.min @numRows()-1, index+@numVisible()
            else index
    
        @browser.select.to @row(toIndex), true
    
    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  

    navigateRows: (key) ->

        return error "no rows in column #{@index}?" if not @numRows()
        index = @activeRow()?.index() ? -1
        error "no index from activeRow? #{index}?" @activeRow() if not index? or Number.isNaN index
        
        newIndex = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then index-@numVisible()
            when 'page down' then index+@numVisible()
            else index
            
        if not newIndex? or Number.isNaN newIndex        
            error "no index #{newIndex}? #{@numVisible()}"
            
        newIndex = clamp 0 @numRows()-1 newIndex
        
        if newIndex != index
            @rows[newIndex].activate null @parent.type=='file'
    
    navigateCols: (key) -> # move to file browser?
        
        switch key
            when 'up'    then @browser.navigate 'up'
            when 'left'  then @browser.navigate 'left'
            when 'right' then @browser.navigate 'right'
            when 'enter'
                if item = @activeRow()?.item
                    type = item.type
                    if type == 'dir'
                        @browser.loadItem item
                    else if item.file
                        post.emit 'jumpTo' item
                        post.emit 'focus' 'editor'
        @

    navigateRoot: (key) -> 
        
        @browser.browse switch key
            when 'left'  then slash.dir @parent.file
            when 'right' then @activeRow().item.file
        @
            
    #  0000000  00000000   0000000   00000000    0000000  000   000    
    # 000       000       000   000  000   000  000       000   000    
    # 0000000   0000000   000000000  0000000    000       000000000    
    #      000  000       000   000  000   000  000       000   000    
    # 0000000   00000000  000   000  000   000   0000000  000   000    
    
    doSearch: (char) ->
        
        return if not @numRows()
        
        if not @searchDiv
            @searchDiv = elem class: 'browserSearch'
            
        @setSearch @search + char
        
    backspaceSearch: ->
        
        if @searchDiv and @search.length
            @setSearch @search[0...@search.length-1]
            
    setSearch: (@search) ->
            
        clearTimeout @searchTimer
        @searchTimer = setTimeout @clearSearch, 2000
        
        @searchDiv.textContent = @search

        activeIndex  = @activeRow()?.index() ? 0
        activeIndex += 1 if (@search.length == 1) #or (char == '')
        activeIndex  = 0 if activeIndex >= @numRows()
        
        for rows in [@rows.slice(activeIndex), @rows.slice(0,activeIndex+1)]
            fuzzied = fuzzy.filter @search, rows, extract: (r) -> r.item.name
            
            if fuzzied.length
                row = fuzzied[0].original
                row.div.appendChild @searchDiv
                row.activate()
                break
        @
    
    clearSearch: =>
        
        @search = ''
        @searchDiv?.remove()
        delete @searchDiv
        @
    
    removeObject: =>
        
        if row = @activeRow()
            nextOrPrev = row.next() ? row.prev()
            @removeRow row
            nextOrPrev?.activate()
        @

    removeRow: (row) ->
        
        if row == @activeRow()
            if @nextColumn()?.parent?.file == row.item?.file
                @browser.clearColumnsFrom @index + 1
            
        row.div.remove()
        @items.splice row.index(), 1
        @rows.splice row.index(), 1
        
    #  0000000   0000000   00000000   000000000  
    # 000       000   000  000   000     000     
    # 0000000   000   000  0000000       000     
    #      000  000   000  000   000     000     
    # 0000000    0000000   000   000     000     
    
    sortByName: =>
         
        @rows.sort (a,b) -> 
            (a.item.type + a.item.name).localeCompare(b.item.type + b.item.name)
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @
        
    sortByType: =>
        
        @rows.sort (a,b) -> 
            atype = a.item.type == 'file' and slash.ext(a.item.name) or '___' #a.item.type
            btype = b.item.type == 'file' and slash.ext(b.item.name) or '___' #b.item.type
            (a.item.type + atype + a.item.name).localeCompare(b.item.type + btype + b.item.name, undefined, numeric:true)
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @

    sortByDateAdded: =>
        
        @rows.sort (a,b) -> b.item.stat?.atimeMs - a.item.stat?.atimeMs
            
        @table.innerHTML = ''
        for row in @rows
            @table.appendChild row.div
        @
        
    # 000000000   0000000    0000000    0000000   000      00000000  
    #    000     000   000  000        000        000      000       
    #    000     000   000  000  0000  000  0000  000      0000000   
    #    000     000   000  000   000  000   000  000      000       
    #    000      0000000    0000000    0000000   0000000  00000000  
    
    toggleDotFiles: =>

        # klog 'toggleDotFiles'
        if @parent.type == undefined
            @parent.type = slash.isDir(@parent.file) and 'dir' or 'file'
            
        if @parent.type == 'dir'            
            stateKey = "browser▸showHidden▸#{@parent.file}"
            klog 'toggleDotFiles' stateKey
            if prefs.get stateKey
                prefs.del stateKey
            else
                prefs.set stateKey, true
            @browser.loadDirItem @parent, @index, ignoreCache:true
        @
         
    toggleExtensions: =>

        stateKey = "browser|hideExtensions"
        window.state.set stateKey, not window.state.get stateKey, false
        setStyle '.browserRow .ext' 'display' window.state.get(stateKey) and 'none' or 'initial'
        @
        
    # 000000000  00000000    0000000    0000000  000   000  
    #    000     000   000  000   000  000       000   000  
    #    000     0000000    000000000  0000000   000000000  
    #    000     000   000  000   000       000  000   000  
    #    000     000   000  000   000  0000000   000   000  
    
    moveToTrash: =>
        
        index = @browser.select.freeIndex()
        if index >= 0
            selectRow = @row index
        
        for row in @browser.select.rows
            if slash.win()
                wxw 'trash' row.path()
            else
                trashPath = slash.resolve '~/.Trash/' + slash.base row.path()
                fs.rename row.path(), trashPath, -> 
            @removeRow row
           
        if selectRow
            @browser.select.row selectRow
        else
            @navigateCols 'left'

    addToShelf: =>
        
        if pathToShelf = @activePath()
            post.emit 'addToShelf' pathToShelf
        
    newFolder: =>
        
        slash.unused slash.join(@path(), 'New folder'), (newDir) =>
            fs.mkdir newDir, (err) =>
                if empty err
                    row = @insertFile newDir
                    @browser.select.row row
                    row.editName()
            
    # 0000000    000   000  00000000   000      000   0000000   0000000   000000000  00000000  
    # 000   000  000   000  000   000  000      000  000       000   000     000     000       
    # 000   000  000   000  00000000   000      000  000       000000000     000     0000000   
    # 000   000  000   000  000        000      000  000       000   000     000     000       
    # 0000000     0000000   000        0000000  000   0000000  000   000     000     00000000  
    
    duplicateFile: =>
                
        for file in @browser.select.files()
            File.duplicate file, (source, target) =>
                if @parent.type == 'file'
                    col = @prevColumn()
                    col.focus()
                else col = @
                row = col.insertFile target
                @browser.select.row row
                    
    # 00000000  000   000  00000000   000       0000000   00000000   00000000  00000000   
    # 000        000 000   000   000  000      000   000  000   000  000       000   000  
    # 0000000     00000    00000000   000      000   000  0000000    0000000   0000000    
    # 000        000 000   000        000      000   000  000   000  000       000   000  
    # 00000000  000   000  000        0000000   0000000   000   000  00000000  000   000  
    
    explorer: =>
        
        open slash.dir @activePath()
        
    open: =>

        open @activePath()
                            
    #  0000000   000  000000000  
    # 000        000     000     
    # 000  0000  000     000     
    # 000   000  000     000     
    #  0000000   000     000     
    
    updateGitFiles: (files) ->
        
        for row in @rows
            return if row.item.type not in ['dir' 'file']
            status = files[row.item.file]
            
            $('.browserStatusIcon' row.div)?.remove()
            
            if status?
                row.div.appendChild elem 'span' class:"git-#{status}-icon browserStatusIcon"
            else if row.item.type == 'dir'
                for file, status of files
                    if row.item.name != '..' and file.startsWith row.item.file
                        row.div.appendChild elem 'span' class:"git-dirs-icon browserStatusIcon"
                        break
        
    # 00000000    0000000   00000000   000   000  00000000     
    # 000   000  000   000  000   000  000   000  000   000    
    # 00000000   000   000  00000000   000   000  00000000     
    # 000        000   000  000        000   000  000          
    # 000         0000000   000         0000000   000          
        
    makeRoot: => 
        
        @browser.shiftColumnsTo @index
        
        if @browser.columns[0].items[0].name != '..'

            @unshiftItem 
                name: '..'
                type: 'dir'
                file: slash.dir @parent.file
                
        @crumb.setFile @parent.file
    
    onContextMenu: (event, column) => 
        
        stopEvent event
        
        absPos = kpos event
        
        if not column
            @showContextMenu absPos
        else
            
            opt = items: [ 
                text:   'Root'
                cb:     @makeRoot
            ,
                text:   'Add to Shelf'
                combo:  'alt+shift+.'
                cb:     => post.emit 'addToShelf' @parent.file
            ,
                text:   'Explorer'
                combo:  'alt+e' 
                cb:     => open @parent.file
            ]
            
            opt.x = absPos.x
            opt.y = absPos.y
            popup.menu opt    
              
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = kpos @div.getBoundingClientRect().left, @div.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Toggle Invisible'
            combo:  'ctrl+i' 
            cb:     @toggleDotFiles
        ,
            text:   'Toggle Extensions'
            combo:  'ctrl+e' 
            cb:     @toggleExtensions
        ,            
            text:   ''
        ,
            text:   'Explorer'
            combo:  'alt+e' 
            cb:     @explorer
        ,
            text:   ''
        ,
            text:   'Add to Shelf'
            combo:  'alt+shift+.'
            cb:     @addToShelf
        ,
            text:   ''
        ,
            text:   'Delete'
            combo:  'ctrl+backspace' 
            cb:     @moveToTrash
        ,   
            text:   ''
            hide:   @parent.type == 'file'
        ,
            text:   'Duplicate'
            combo:  'ctrl+d' 
            cb:     @duplicateFile
            hide:   @parent.type == 'file'
        ,   
            text:   'New Folder'
            combo:  'alt+n' 
            cb:     @newFolder
            hide:   @parent.type == 'file'
        ]
        
        if @parent.type != 'file'
            opt.items = opt.items.concat [
                text:   ''
            ,   
                text:   'Sort'
                menu: [
                    text: 'By Name' combo:'ctrl+n', cb:@sortByName
                ,
                    text: 'By Type' combo:'ctrl+t', cb:@sortByType
                ,
                    text: 'By Date' combo:'ctrl+a', cb:@sortByDateAdded
                ]
            ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt        
        
    #  0000000   0000000   00000000   000   000  
    # 000       000   000  000   000   000 000   
    # 000       000   000  00000000     00000    
    # 000       000   000  000           000     
    #  0000000   0000000   000           000     
    
    copyPaths: ->
        paths = @browser.select.files().join '\n'
        electron.clipboard.writeText paths
        paths
        
    cutPaths: ->
        
        @browser.cutPaths = @copyPaths()
        
    pastePaths: ->
        
        text = electron.clipboard.readText()
        paths = text.split '\n'
        
        if text == @browser.cutPaths
            action = 'move'
        else
            action = 'copy'
        target = @parent.file
        if @activeRow()?.item.type == 'dir'
            target = @activeRow().item.file
        @browser.dropAction action, paths, target
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        { mod, key, combo, char } = keyinfo.forEvent event

        switch combo
            when 'shift+`' '~'                      then return stopEvent event, @browser.browse '~'
            when '/'                                then return stopEvent event, @browser.browse '/'
            when 'backspace'                        then return stopEvent event, @browser.onBackspaceInColumn @
            when 'delete'                           then return stopEvent event, @browser.onDeleteInColumn @
            when 'alt+left'                         then return stopEvent event, window.split.focus 'shelf'
            when 'alt+shift+.'                      then return stopEvent event, @addToShelf()
            when 'alt+e'                            then return stopEvent event, @explorer()
            when 'alt+n'                            then return stopEvent event, @newFolder()
            when 'ctrl+x' 'command+x'               then return stopEvent event, @cutPaths()
            when 'ctrl+c' 'command+c'               then return stopEvent event, @copyPaths()
            when 'ctrl+v' 'command+v'               then return stopEvent event, @pastePaths()
            when 'page up' 'page down' 'home' 'end' then return stopEvent event, @navigateRows key
            when 'enter''alt+up'                    then return stopEvent event, @navigateCols key
            when 'command+up' 'ctrl+up'             then return stopEvent event, @navigateRows 'home'
            when 'command+down' 'ctrl+down'         then return stopEvent event, @navigateRows 'end'
            when 'ctrl+t'                           then return stopEvent event, @sortByType()
            when 'ctrl+n'                           then return stopEvent event, @sortByName()
            when 'ctrl+a'                           then return stopEvent event, @sortByDateAdded()
            when 'ctrl+e'                           then return stopEvent event, @toggleExtensions()
            when 'command+i' 'ctrl+i'               then return stopEvent event, @toggleDotFiles()
            when 'command+d' 'ctrl+d'               then return stopEvent event, @duplicateFile()
            when 'command+k' 'ctrl+k'               then return stopEvent event if @browser.cleanUp() # needed?
            when 'f2'                               then return stopEvent event, @activeRow()?.editName()
            when 'shift+up' 'shift+down' 'shift+home' 'shift+end' 'shift+page up' 'shift+page down' 
                return stopEvent event, @extendSelection key
            when 'command+left' 'command+right' 'ctrl+left' 'ctrl+right'
                return stopEvent event, @navigateRoot key
            when 'command+backspace' 'ctrl+backspace' 'command+delete' 'ctrl+delete' 
                return stopEvent event, @moveToTrash()
            when 'tab'    
                if @search.length then @doSearch ''
                return stopEvent event
            when 'esc'
                if @dragDiv
                    @dragDiv.drag.dragStop()
                    @dragDiv.remove()
                    delete @dragDiv
                else if @browser.select.files().length > 1
                    @browser.select.row @activeRow()
                else if @search.length then @clearSearch()
                return stopEvent event

        if combo in ['up'   'down']  then return stopEvent event, @navigateRows key              
        if combo in ['left' 'right'] then return stopEvent event, @navigateCols key
            
        if mod in ['shift' ''] and char then @doSearch char
        
        if @dragDiv
            @updateDragIndicator event
            
    onKeyUp: (event) =>
        
        if @dragDiv
            @updateDragIndicator event
                        
module.exports = Column



###
 0000000  000   000  00000000  000      00000000
000       000   000  000       000      000     
0000000   000000000  0000000   000      000000  
     000  000   000  000       000      000     
0000000   000   000  00000000  0000000  000     
###

{ stopEvent, keyinfo, slash, state, post, popup, elem, clamp, empty, first, last, error, log, $, _ } = require 'kxk'

Row        = require './row'
Scroller   = require './scroller'
Column     = require './column'
fuzzaldrin = require 'fuzzaldrin'
fuzzy      = require 'fuzzy'
isTextFile = require '../tools/istextfile'
hub        = require '../git/hub'

indexAndItemInItemsWithFunc = (item, items, withFunc) ->
    
    for index in [0...items.length]
        if withFunc items[index], item
            return [index, items[index]]
    return [-1,null]
    
class Shelf extends Column

    constructor: (browser) ->

        super browser
        
        @items  = []
        @index  = -1
        @div.id = 'shelf'
        
        @showHistory = window.stash.get 'shelf:history', false

        post.on 'gitStatus',              @loadGitStatus
        post.on 'addToShelf',             @addPath
        post.on 'navigateHistoryChanged', @onNavigateHistoryChanged
        post.on 'navigateIndexChanged',   @onNavigateIndexChanged
        
        @browser.on 'itemActivated', @onBrowserItemActivated
        
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  0000000     00000000    0000000   000   000  
    # 000   000  000          000     000  000   000  000   000     000     000         000   000  000   000  000 0 000  
    # 000000000  000          000     000   000 000   000000000     000     0000000     0000000    000   000  000000000  
    # 000   000  000          000     000     000     000   000     000     000         000   000  000   000  000   000  
    # 000   000   0000000     000     000      0      000   000     000     0000000     000   000   0000000   00     00  
   
    activateRow: (row) -> 
        
        item = row.item
        
        if item.type == 'historySeparator'
            row.setActive emit:false
            return
        
        $('.hover')?.classList.remove 'hover'
        row.setActive emit:true
        
        if item.type == 'file'
            post.emit 'loadFile', item.file
        else
            post.emit 'filebrowser', 'loadItem', item
                
    onBrowserItemActivated: (browserItem) =>
        
        [index, item] = indexAndItemInItemsWithFunc browserItem, @items, _.isEqual
        if item
            @rows[index].setActive()
            return

        matches = []
        for index,item of @items
            if browserItem.file?.startsWith item.file
                matches.push [index, item]

        if not empty matches
            matches.sort (a,b) -> b[1].file.length - a[1].file.length
            [index, item] = first matches
            @rows[index].setActive()
            return
                
    # 000  000   000  000  000000000  
    # 000  0000  000  000     000     
    # 000  000 0 000  000     000     
    # 000  000  0000  000     000     
    # 000  000   000  000     000     
    
    browserDidInitColumns: ->
        
        return if @didInit
        
        @didInit = true
        
        @loadShelfItems()
        
        @loadHistory() if @showHistory
        
        @loadGitStatus()
                
    loadShelfItems: ->
        
        items = state.get "shelf|items"
        @setItems items, save:false
                
    addPath: (path, opt) =>
        
        if slash.isDir path
            @addDir path, opt
        else
            @addFile path, opt
        
    # 000  000000000  00000000  00     00   0000000  
    # 000     000     000       000   000  000       
    # 000     000     0000000   000000000  0000000   
    # 000     000     000       000 0 000       000  
    # 000     000     00000000  000   000  0000000   

    itemPaths: -> @rows.map (r) -> r.path()
    
    savePrefs: -> 
        state.set "shelf|items", @items
    
    setItems: (@items, opt) ->
        
        @clear()
        
        @items ?= []
        @addItems @items
        
        if opt?.save != false
            @savePrefs()            
        @
        
    addItems: (items, opt) ->
        
        return if empty items
        
        for item in items
            @rows.push new Row @, item
            
        @scroll.update()
        @
        
    addDir: (dir, opt) ->
        
        item = 
            name: slash.file slash.tilde dir
            type: 'dir'
            file: slash.path dir
        
        @addItem item, opt

    addFile: (file, opt) ->
        
        item = 
            name: slash.file file
            type: 'file'
            file: slash.path file
        item.textFile = true if isTextFile file
        @addItem item, opt
        
    addItem:  (item, opt) ->
        
        _.pullAllWith @items, [item], _.isEqual # remove item if on shelf already
        
        if opt?.pos
            index = @rowIndexAtPos opt.pos
            @items.splice Math.min(index, @items.length), 0, item
        else
            @items.push item
            
        @setItems @items
        @loadHistory() if @showHistory
        @loadGitStatus()
                        
    dropRow: (row, pos) -> @addItem row.item, pos:pos
            
    isEmpty: -> empty @rows
    
    clear: ->
        
        @clearSearch()
        @div.scrollTop = 0
        @table.innerHTML = ''
        @rows = []
        @scroll.update()
                                   
    name: -> 'shelf'

    #  0000000   000  000000000  
    # 000        000     000     
    # 000  0000  000     000     
    # 000   000  000     000     
    #  0000000   000     000     
    
    loadGitStatus: =>
        
        for row in @rows
            
            $('.browserStatusIcon', row.div)?.remove()
            
            fileStatus = (row) -> (status) =>
                for file, status of hub.statusFiles status
                    if file.startsWith row.path()
                        if row.item.type == 'dir'
                            status = 'dirs'
                        row.div.appendChild elem 'span', class:"git-#{status}-icon browserStatusIcon"
                        break
            
            hub.status row.path(), fileStatus row

    updateGitFiles: -> @loadGitStatus()
    
    # 000   000  000   0000000  000000000   0000000   00000000   000   000  
    # 000   000  000  000          000     000   000  000   000   000 000   
    # 000000000  000  0000000      000     000   000  0000000      00000    
    # 000   000  000       000     000     000   000  000   000     000     
    # 000   000  000  0000000      000      0000000   000   000     000     
    
    toggleHistory: =>
        
        @showHistory = not @showHistory
        if @showHistory
            @loadHistory()
        else
            @removeHistory()
        window.stash.set 'shelf:history', @showHistory
    
    clearHistory: =>
        
        window.navigate.clear()
        if @showHistory then @setHistoryItems [
            file:   window.editor.currentFile
            pos:    window.editor.mainCursor()
            text:   slash.file window.editor.currentFile
        ]
        
    historySeparatorIndex: ->
        
        for i in [0...@numRows()]
            if @row(i).item.type == 'historySeparator'
                return i
        return @numRows()
        
    removeHistory: ->
        
        separatorIndex = @historySeparatorIndex()
        # log 'separatorIndex', separatorIndex, @numRows()
        while @numRows() and @numRows() > separatorIndex
            @removeRow @row(@numRows()-1)

    onNavigateHistoryChanged: (filePositions, currentIndex) =>
        
        if @showHistory
            @setHistoryItems filePositions
            @onNavigateIndexChanged currentIndex, filePositions[currentIndex]

    onNavigateIndexChanged: (currentIndex, currentItem) =>
        
        if @showHistory
            reverseIndex = @numRows() - currentIndex - 1
            if not @hasFocus()
                @row(reverseIndex)?.setActive()
            
    loadHistory: ->
        
        @setHistoryItems post.get 'navigate', 'filePositions'

    setHistoryItems: (items) ->
    
        @removeHistory()
        
        items.map (h) -> 
            h.type = 'file'
            h.text = slash.removeColumn h.text
        items.reverse()
        
        items.unshift
            type: 'historySeparator'
            icon: 'history-icon'
        
        @addItems items
            
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    onFocus: => 
        window.setLastFocus 'shelf'
        @div.classList.add 'focus'
        if @browser.shelfSize < 200
            @browser.setShelfSize 200
        
    # 00     00   0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 000000000  000   000  000   000  0000000   0000000   
    # 000 0 000  000   000  000   000       000  000       
    # 000   000   0000000    0000000   0000000   00000000  
    
    onMouseOver: (event) => @row(event.target)?.onMouseOver()
    onMouseOut:  (event) => @row(event.target)?.onMouseOut()
    onClick:     (event) => @row(event.target)?.activate event
    onDblClick:  (event) => @navigateCols 'enter'

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  

    navigateRows: (key) ->

        return error "no rows in column #{@index}?" if not @numRows()
        index = @activeRow()?.index() ? -1
        error "no index from activeRow? #{index}?", @activeRow() if not index? or Number.isNaN index
        
        index = switch key
            when 'up'        then index-1
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then index-@numVisible()
            when 'page down' then index+@numVisible()
            else index
            
        error "no index #{index}? #{@numVisible()}" if not index? or Number.isNaN index        
        index = clamp 0, @numRows()-1, index
        
        error "no row at index #{index}/#{@numRows()-1}?", @numRows() if not @rows[index]?.activate?
        @rows[index].activate()
    
    openFileInNewWindow: ->  
        
        if item = @activeRow()?.item
            if item.type == 'file' and item.textFile
                window.openFiles [item.file], newWindow: true
        @
    
    removeObject: =>
                
        if row = @activeRow()
            if @showHistory
                if row.item.type == 'historySeparator'
                    @toggleHistory()
                    return
                if row.index() > @historySeparatorIndex()
                    window.navigate.delFilePos row.item
                
            nextOrPrev = row.next() ? row.prev()
            row.div.remove()
            @items.splice row.index(), 1
            @rows.splice row.index(), 1
            nextOrPrev?.activate()
            @savePrefs()
        @

    # 00000000    0000000   00000000   000   000  00000000   
    # 000   000  000   000  000   000  000   000  000   000  
    # 00000000   000   000  00000000   000   000  00000000   
    # 000        000   000  000        000   000  000        
    # 000         0000000   000         0000000   000        
    
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = pos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Toggle History'
            combo:  'alt+h' 
            cb:     @toggleHistory
        ,
            text:   'Toggle Extensions'
            combo:  'ctrl+e' 
            cb:     @toggleExtensions
        ,
            text:   'Remove'
            combo:  'backspace' 
            cb:     @removeObject
        ,
            text:   'Clear History'
            cb:     @clearHistory
        ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        { mod, key, combo, char } = keyinfo.forEvent event
        
        switch combo
            when 'command+enter', 'ctrl+enter' then return @openFileInNewWindow()
            when 'backspace', 'delete' then return stopEvent event, @clearSearch().removeObject()
            when 'command+k', 'ctrl+k' then return stopEvent event if @browser.cleanUp()
            when 'tab'    
                if @search.length then @doSearch ''
                return stopEvent event
            when 'esc'
                if @search.length then @clearSearch()
                else window.split.focus 'commandline-editor'
                return stopEvent event

        switch key
            when 'up', 'down', 'page up', 'page down', 'home', 'end' 
                return stopEvent event, @navigateRows key
            when 'right', 'enter'
                return stopEvent event, @focusBrowser()
                
        switch char
            when '~', '/' then return stopEvent event, @navigateRoot char
            
        if mod in ['shift', ''] and char then @doSearch char
        
        if key in ['left'] then return stopEvent event
        
module.exports = Shelf

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

indexAndItemInItemsWithFunc = (item, items, withFunc) ->
    
    for index in [0...items.length]
        if withFunc items[index], item
            return [index, items[index]]
    return [-1,null]
    
class Shelf extends Column

    constructor: (browser) ->

        super browser
        
        @index  = -1
        @div.id = 'shelf'
        
        @isHistory = window.stash.get 'shelf:history', true

        post.on 'addToShelf', @addPath
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
        
        if item.type == 'historySeperator'
            # if row == @activeRow()
                # @toggleHistory()
            # else
            row.setActive emit:false
            return
        
        $('.hover')?.classList.remove 'hover'
        row.setActive emit:true
        
        switch item.type
            when 'dir'   then @browser.loadDir item.file, column: 0, parent: item
            when 'file'  
                if not @browser.loadSourceItem item, column: 0
                    @browser.loadFile item.file, focus:false, column:0, dir:slash.dir item.file
                else
                    post.emit 'jumpToFile', file:item.file
            else
                @browser.loadSourceItem item, column: 0
                if item.file
                    post.emit 'jumpToFile', file:item.file, line:item.line, col:item.column
        
    onBrowserItemActivated: (browserItem) =>

        return if @isHistory
        
        [index, item] = indexAndItemInItemsWithFunc browserItem, @items, _.isEqual
        if item
            # log "Shelf.onBrowserItemActivated1", index, item.file
            @rows[index].setActive()
            return

        matches = []
        for index,item of @items
            if browserItem.file.startsWith item.file
                matches.push [index, item]

        if not empty matches
            # log "matches: #{matches.length}"
            matches.sort (a,b) -> b[1].file.length - a[1].file.length
            [index, item] = first matches
            # log "Shelf.onBrowserItemActivated2", index, item.file
            @rows[index].setActive()
            return
                
    browserDidInitColumns: ->
        
        return if @didInit
        @didInit = true
        
        @loadShelfItems()
        @loadHistory() if @isHistory
        
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
        if not @isHistory 
            log 'save shelf items'
            state.set "shelf|items", @items
    
    setItems: (@items, opt) ->
        
        @clear()
        
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

    dropRow: (row, pos) -> @addItem row.item, pos:pos
            
    isEmpty: -> empty @rows
    
    clear: ->
        
        @clearSearch()
        @div.scrollTop = 0
        @table.innerHTML = ''
        @rows = []
        @scroll.update()
                                   
    name: -> 'shelf'
        
    # 000   000  000   0000000  000000000   0000000   00000000   000   000  
    # 000   000  000  000          000     000   000  000   000   000 000   
    # 000000000  000  0000000      000     000   000  0000000      00000    
    # 000   000  000       000     000     000   000  000   000     000     
    # 000   000  000  0000000      000      0000000   000   000     000     
    
    toggleHistory: =>
        
        @isHistory = not @isHistory
        if @isHistory
            @loadHistory()
        else
            @removeHistory()
    
    clearHistory: =>
        
        window.navigate.clear()
        if @isHistory then @setHistoryItems [
            file:   window.editor.currentFile
            pos:    window.editor.mainCursor()
            text:   slash.file window.editor.currentFile
        ]
        
    historySeparatorIndex: ->
        
        for i in [0...@numRows()]
            if @row(i).item.type == 'historySeperator'
                return i
        return @numRows()
        
    removeHistory: ->
        
        separatorIndex = @historySeparatorIndex()
        while @numRows() > separatorIndex
            @removeRow @row(@numRows()-1)

    onNavigateHistoryChanged: (filePositions, currentIndex) =>
        
        if @isHistory # and not @hasFocus()
            @setHistoryItems filePositions
            @onNavigateIndexChanged currentIndex, filePositions[currentIndex]

    onNavigateIndexChanged: (currentIndex, currentItem) =>
        
        if @isHistory
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
            type: 'historySeperator'
            icon: 'noon-icon'
        
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
            
            if @isHistory
                if row.item.type == 'historySeperator'
                    @toggleHistory()
                    return
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

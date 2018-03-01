
#  0000000  000   000  00000000  000      00000000
# 000       000   000  000       000      000     
# 0000000   000000000  0000000   000      000000  
#      000  000   000  000       000      000     
# 0000000   000   000  00000000  0000000  000     

{ stopEvent, keyinfo, slash, prefs, post, elem, clamp, empty, last, error, log, $, _ } = require 'kxk'

Row        = require './row'
Scroller   = require './scroller'
Column     = require './column'
fuzzaldrin = require 'fuzzaldrin'
fuzzy      = require 'fuzzy'
isTextFile = require '../tools/istextfile'

class Shelf extends Column

    constructor: (browser) ->

        super browser
        
        @index  = -1
        @div.id = 'shelf'

        post.on 'addToShelf', @addPath

    browserDidInitColumns: ->
        
        return if @didInit
        @didInit = true
        
        items = prefs.get "shelf:items"
        if not empty items
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

    savePrefs: -> prefs.set "shelf:items", @items
    itemPaths: -> @rows.map (r) -> r.path()
    
    setItems: (@items, opt) ->
        
        @clear()
        
        for item in @items
            @rows.push new Row @, item
        
        @scroll.update()
        
        if opt?.save != false
            @savePrefs()            
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
            @items.splice index, 0, item
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
        @savePrefs()
                            
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
   
    activateRow: (row) -> 
        
        item = row.item
        
        $('.hover')?.classList.remove 'hover'
        row.setActive emit:false
        
        switch item.type
            when 'dir'   then @browser.loadDir     item.file, column: 0, parent: item
            when 'file'  
                @browser.loadFile item.file, focus:false, column:0, dir:slash.dir item.file
            else
                if item.file
                    post.emit 'jumpToFile', file:item.file, line:item.line, col:item.column
       
    name: -> 'shelf'
        
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
    
    removeObject: ->
        
        if row = @activeRow()
            nextOrPrev = row.next() ? row.prev()
            row.div.remove()
            @items.splice row.index(), 1
            @rows.splice row.index(), 1
            nextOrPrev?.activate()
            @savePrefs()
        @
  
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        { mod, key, combo, char } = keyinfo.forEvent event

        # log 'shelf.onKey', mod, key, combo, char

        switch combo
            when 'up', 'down', 'page up', 'page down', 'home', 'end' 
                return stopEvent event, @navigateRows key
            when 'right', 'enter'                            
                return stopEvent event, @focusBrowser()
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

        switch char
            when '~', '/' then return stopEvent event, @navigateRoot char
            
        if mod in ['shift', ''] and char then @doSearch char
        
module.exports = Shelf

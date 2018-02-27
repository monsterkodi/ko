
#  0000000  000   000  00000000  000      00000000
# 000       000   000  000       000      000     
# 0000000   000000000  0000000   000      000000  
#      000  000   000  000       000      000     
# 0000000   000   000  00000000  0000000  000     

{ stopEvent, keyinfo, slash, post, elem, clamp, empty, error, log, $, _ } = require 'kxk'

Row        = require './row'
Scroller   = require './scroller'
fuzzaldrin = require 'fuzzaldrin'
fuzzy      = require 'fuzzy'

class Shelf

    constructor: (@browser) ->

        @index = -1
        @items = []
        @rows = []
        @div = elem id: 'shelf', tabIndex: 7
        @table = elem class: 'browserColumnTable'
        @div.appendChild @table
        
        @div.addEventListener 'focus',     @onFocus
        @div.addEventListener 'blur',      @onBlur
        @div.addEventListener 'keydown',   @onKey
        
        @div.addEventListener 'mouseover', @onMouseOver
        @div.addEventListener 'mouseout',  @onMouseOut

        @div.addEventListener 'click',     @onClick
        @div.addEventListener 'dblclick',  @onDblClick
        
        @scroll = new Scroller @

    browserDidInitColumns: ->
        
        return if @didInit
        @didInit = true
        
        @addDir slash.resolve '~'
        @addDir '~/s'
        @addDir '~/s/kxk'
        @addDir '~/s/konrad'
        @addDir '~/s/ko'
        @addFile '~/s/ko/package.noon'
        
    #  0000000  00000000  000000000  000  000000000  00000000  00     00   0000000  
    # 000       000          000     000     000     000       000   000  000       
    # 0000000   0000000      000     000     000     0000000   000000000  0000000   
    #      000  000          000     000     000     000       000 0 000       000  
    # 0000000   00000000     000     000     000     00000000  000   000  0000000   
    
    setItems: (@items, opt) ->
        
        @clear()
        
        for item in @items
            @rows.push new Row @, item
        
        @scroll.update()
        @
        
    addDir: (dir) ->
        
        @items.push 
            name: slash.file dir
            type: 'dir'
            file: dir
        
        @setItems @items

    addFile: (file) ->
        
        @items.push 
            name: slash.file file
            type: 'file'
            file: file
        
        @setItems @items
        
    isEmpty: -> empty @rows
    clear:   ->
        @clearSearch()
        @div.scrollTop = 0
        @table.innerHTML = ''
        @rows = []
        @scroll.update()
                    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
   
    activateRow: (row) -> 
        
        item = row.item
        log "Shelf.activateRow row:", item
        
        $('.hover')?.classList.remove 'hover'
        row.setActive emit:false
        
        switch item.type
            when 'dir'   then @browser.loadDir     item.file, column: 0, parent: item
            when 'file'  then post.emit 'jumpToFile', file:item.file
       
    activeRow: -> _.find @rows, (r) -> r.isActive()
    
    row: (row) -> # accepts element, index, string or row
        if      _.isNumber  row then return 0 <= row < @numRows() and @rows[row] or null
        else if _.isElement row then return _.find @rows, (r) -> r.div.contains row
        else if _.isString  row then return _.find @rows, (r) -> r.item.name == row
        else return row
            
    numRows:    -> @rows.length ? 0   
    rowHeight:  -> @rows[0]?.div.clientHeight ? 0
    numVisible: -> @rowHeight() and parseInt(@browser?.height() / @rowHeight()) or 0
    
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    hasFocus: -> @div.classList.contains 'focus'

    focus: ->
        log 'shelf.focus'
        if not @activeRow() and @numRows()
            @rows[0].setActive emit:true
        @div.focus()
        @
        
    onFocus: => 
        log 'shelf.onFocus'
        @div.classList.add 'focus'
        
    onBlur:  => 
        log 'shelf.onBlur'
        @div.classList.remove 'focus'
    
    focusBrowser: ->
        log 'shelf.focusBrowser'
        @browser.focus()
        
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

    #  0000000  00000000   0000000   00000000    0000000  000   000    
    # 000       000       000   000  000   000  000       000   000    
    # 0000000   0000000   000000000  0000000    000       000000000    
    #      000  000       000   000  000   000  000       000   000    
    # 0000000   00000000  000   000  000   000   0000000  000   000    
    
    doSearch: (char) ->
        
        return if not @numRows()
        
        clearTimeout @searchTimer
        @searchTimer = setTimeout @clearSearch, 2000
        @search += char
        
        if not @searchDiv
            @searchDiv = elem class: 'browserSearch'
            
        @searchDiv.textContent = @search

        activeIndex  = @activeRow()?.index() ? 0
        activeIndex += 1 if (@search.length == 1) or (char == '')
        activeIndex  = 0 if activeIndex >= @numRows()
        
        for rows in [@rows.slice(activeIndex), @rows.slice(0,activeIndex+1)]
            fuzzied = fuzzy.filter @search, rows, extract: (r) -> r.item.name
            
            if fuzzied.length
                row = fuzzied[0].original
                autoNavi = row.item.name == @search and @browser.endNavigateToTarget? and row.item.type in ['file', 'dir'] # smelly
                if autoNavi
                    @browser.navigateTargetFile = row.item.file
                    @clearSearch()    
                else
                    row.div.appendChild @searchDiv
    
                row.activate()
                break
        @
    
    clearSearch: =>
        
        @search = ''
        @searchDiv?.remove()
        delete @searchDiv
        @
    
    removeObject: ->
        
        if row = @activeRow()
            nextOrPrev = row.next() ? row.prev()
            row.div.remove()
            @items.splice row.index(), 1
            @rows.splice row.index(), 1
            nextOrPrev?.activate()
        @
  
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        { mod, key, combo, char } = keyinfo.forEvent event

        log 'shelf.onKey', mod, key, combo, char

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

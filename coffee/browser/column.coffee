
#  0000000   0000000   000      000   000  00     00  000   000
# 000       000   000  000      000   000  000   000  0000  000
# 000       000   000  000      000   000  000000000  000 0 000
# 000       000   000  000      000   000  000 0 000  000  0000
#  0000000   0000000   0000000   0000000   000   000  000   000

{ packagePath, stopEvent, relative, resolve, keyinfo, 
  path, post, elem, clamp, error, log, $, _ 
}   = require 'kxk'
Row = require './row'
Scroller   = require './scroller'
fuzzaldrin = require 'fuzzaldrin'
fuzzy      = require 'fuzzy'

class Column
    
    constructor: (@browser) ->
        
        @index = @browser.columns.length
        @search = ''
        @searchTimer = null
        @rows = []
        @div = elem class: 'browserColumn', tabIndex: @index, id: "column#{@index}"
        @table = elem class: 'browserColumnTable'
        @div.appendChild @table
        @browser.cols.appendChild @div
        
        @div.addEventListener 'focus',   @onFocus
        @div.addEventListener 'blur',    @onBlur
        @div.addEventListener 'keydown', @onKey
        
        @div.addEventListener 'mouseover', @onMouseOver
        @div.addEventListener 'mouseout',  @onMouseOut

        @div.addEventListener 'click',    @onClick
        @div.addEventListener 'dblclick', @onDblClick
        
        @scroll = new Scroller @
        
    #  0000000  00000000  000000000  000  000000000  00000000  00     00   0000000  
    # 000       000          000     000     000     000       000   000  000       
    # 0000000   0000000      000     000     000     0000000   000000000  0000000   
    #      000  000          000     000     000     000       000 0 000       000  
    # 0000000   00000000     000     000     000     00000000  000   000  0000000   
    
    setItems: (@items, opt) ->
        
        @parent = opt.parent
        error "no parent item?" if not @parent?
        @clear()
        
        for item in @items
            @rows.push new Row @, item
        
        @scroll.update()
        
        post.emit 'browserColumnItemsSet', @ # for filebrowser target navigation
        @
        
    isEmpty: -> _.isEmpty @rows
    clear:   -> 
        @div.scrollTop = 0
        @table.innerHTML = ''
        @rows = []
        @scroll.update()
                    
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
   
    activateRow:  (row) -> @row(row)?.activate()
       
    activeRow: -> _.find @rows, (r) -> r.isActive()
    
    row: (row) -> # accepts element, index, string or row
        if      _.isNumber  row then return 0 <= row < @numRows() and @rows[row] or null
        else if _.isElement row then return _.find @rows, (r) -> r.div.contains row
        else if _.isString  row then return _.find @rows, (r) -> r.item.name == row
        else return row
            
    nextColumn: -> @browser.column(@index+1)
        
    numRows:    -> @rows.length ? 0   
    rowHeight:  -> @rows[0]?.div.clientHeight ? 0
    numVisible: -> @rowHeight() and parseInt(@browser.height() / @rowHeight()) or 0
    
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    hasFocus: -> @div.classList.contains 'focus'

    focus: ->
        if not @activeRow() and @numRows()
            @rows[0].setActive emit:true
        @div.focus()
        @
        
    onFocus: => @div.classList.add 'focus'
    onBlur:  => @div.classList.remove 'focus'
    
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

    navigateTo: (target) ->
        
        target = _.isString(target) and target or target?.file
        if not @parent then return error 'no parent?'
        relpath = relative target, @parent.abs
        relitem = _.first relpath.split path.sep
        row = @row relitem
        if row
            @activateRow row
        else            
            @browser.endNavigateToTarget()

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
    
    navigateCols: (key) -> # move to file browser?
        
        switch key
            when 'left'  then @browser.navigate 'left'
            when 'right' then @browser.navigate 'right'
            when 'enter'
                if item = @activeRow()?.item
                    type = item.type
                    if type == 'dir'
                        @browser.browse? item.abs
                    else if type == 'file' and item.textFile
                        post.emit 'focus', 'editor'
                    else if item.file
                        post.emit 'focus', 'editor'

    navigateRoot: (key) -> # move to file browser?
        
        return if not @browser.browse?
        @browser.browse switch key
            when 'left'  then path.dirname @parent.abs
            when 'up'    then @parent.abs
            when 'right' then @activeRow().item.abs
            when 'down'  then packagePath @parent.abs
            when '~'     then '~'
            when '/'     then '/'
            
    openFileInNewWindow: ->        
        if item = @activeRow()?.item
            if item.type == 'file' and item.textFile
                window.openFiles [item.abs], newWindow: true

    #  0000000  00000000   0000000   00000000    0000000  000   000    
    # 000       000       000   000  000   000  000       000   000    
    # 0000000   0000000   000000000  0000000    000       000000000    
    #      000  000       000   000  000   000  000       000   000    
    # 0000000   00000000  000   000  000   000   0000000  000   000    
    
    doSearch: (char) ->

        clearTimeout @searchTimer
        @searchTimer = setTimeout @clearSearch, 2000
        @search += char
        
        if not @searchDiv
            @searchDiv = elem class: 'browserSearch'
        @searchDiv.textContent = @search

        fuzzied = fuzzy.filter @search, @rows, extract: (r) -> r.item.name
        if fuzzied.length
            fuzzied = _.sortBy fuzzied, (o) -> 2 - fuzzaldrin.score o.string, @search
            item = fuzzied[0].original
            item.activate()
            item.div.appendChild @searchDiv
    
    clearSearch: =>
        @search = ''
        @searchDiv?.remove()
        delete @searchDiv
        @
    
    removeObject: ->
        if @index == 0 and row = @activeRow()
            delete @parent.obj[row.item.name]
            nextOrPrev = row.next() ? row.prev()
            row.div.remove()
            @rows.splice row.index(), 1
            nextOrPrev?.activate()
  
    sortByName: -> 
        @rows.sort (a,b) -> a.item.name.localeCompare b.item.name
        for row in @rows
            @table.appendChild row.div
        
    sortByType: ->
        @rows.sort (a,b) -> (a.item.type + a.item.name).localeCompare b.item.type + b.item.name
        for row in @rows
            @table.appendChild row.div
  
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        {mod, key, combo, char} = keyinfo.forEvent event

        # log mod, key, combo, char

        switch combo
            when 'up', 'down', 'page up', 'page down', 'home', 'end' 
                stopEvent event, @navigateRows key
            when 'right', 'left', 'enter'                            
                stopEvent event, @navigateCols key
            when 'command+enter' then @openFileInNewWindow()
            when 'command+left', 'command+up','command+right', 'command+down'
                stopEvent event, @navigateRoot key
            when 'backspace' then stopEvent event, @clearSearch().removeObject()
            when 'ctrl+t' then stopEvent event, @sortByType()
            when 'ctrl+n' then stopEvent event, @sortByName()
            when 'esc'
                if @search.length then @clearSearch()
                else window.split.focus 'commandline-editor'
                stopEvent event

        switch char
            when '~', '/' then stopEvent event, @navigateRoot char
            
        if mod in ['shift', ''] and char then @doSearch char
        
module.exports = Column

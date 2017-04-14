#  0000000   0000000   000      000   000  00     00  000   000
# 000       000   000  000      000   000  000   000  0000  000
# 000       000   000  000      000   000  000000000  000 0 000
# 000       000   000  000      000   000  000 0 000  000  0000
#  0000000   0000000   0000000   0000000   000   000  000   000

{ packagePath, stopEvent, relative, resolve, keyinfo, 
  path, post, elem, clamp, error, log, $, _ 
}   = require 'kxk'
Row = require './row'
fuzzaldrin = require 'fuzzaldrin'
fuzzy      = require 'fuzzy'

class Column
    
    constructor: (@browser) ->
        
        @index = @browser.columns.length
        @search = ''
        @searchTimer = null
        @rows = []
        @div = elem class: 'browserColumn', tabIndex: @index, id: "column#{@index}"
        @browser.cols.appendChild @div
        
        @div.addEventListener 'focus',   @onFocus
        @div.addEventListener 'blur',    @onBlur
        @div.addEventListener 'keydown', @onKey
        
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
        if @browser.navigateTarget()
            @navigateTo @browser.navigateTarget()
        @
        
    isEmpty: -> _.isEmpty @rows
    clear:   -> 
        @div.innerHTML = ''
        @rows = []
        
    #  0000000    0000000  000000000  000  000   000  00000000  
    # 000   000  000          000     000  000   000  000       
    # 000000000  000          000     000   000 000   0000000   
    # 000   000  000          000     000     000     000       
    # 000   000   0000000     000     000      0      00000000  
   
    navigateTo: (target) ->
        target = _.isString(target) and target or target?.file
        if not @parent then return error 'no parent?'
        relpath = relative target, @parent.abs
        relitem = _.first relpath.split path.sep
        row = @rowWithName relitem
        if row
            @activateRow row
        else            
            @browser.endNavigateToTarget()
            
    activateRow:  (row) -> @row(row)?.activate()
       
    activeRow: -> 
        for r in @rows
            return r if r.isActive()
        null
    
    rowWithName: (name) ->
        for r in @rows
            return r if r.item.name == name
        null

    row: (row) -> # accepts row or index
        if _.isNumber(row) and row >= 0 and row < @numRows() 
            @rows[row] 
        else
            row
            
    nextColumn: -> @browser.column(@index+1)
        
    numRows: -> @rows.length ? 0         
    numVisible: -> 20 # TODO
    
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
    
    navigateCols: (key) ->
        switch key
            when 'left'  then @browser.navigate 'left'
            when 'right' then @browser.navigate 'right'
            when 'enter'
                if item = @activeRow()?.item
                    type = item.type
                    if type == 'dir'
                        @browser.browse item.abs
                    else if type == 'file' and item.textFile
                        post.emit 'focus', 'editor'
                    else if item.file
                        post.emit 'focus', 'editor'

    navigateRoot: (key) ->
        @browser.browse switch key
            when 'left'  then path.dirname @parent.abs
            when 'up'    then @parent.abs
            when 'right' then @activeRow().item.abs
            when 'down'  then packagePath @parent.abs
            when ','     then '~'
            when '/'     then '/'
            
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
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        
        {mod, key, combo, char} = keyinfo.forEvent event

        switch combo
            when 'up', 'down', 'page up', 'page down', 'home', 'end'          then @navigateRows key
            when 'right', 'left', 'enter'                                     then @navigateCols key
            when 'command+left', 'command+up','command+right', 'command+down', 'command+,', 'command+/' then @navigateRoot key
            when 'backspace' then @clearSearch()
            when 'esc'
                if @search.length then @clearSearch()
                else window.split.focus 'commandline-editor'
                stopEvent event

        if char then @doSearch char
        
module.exports = Column

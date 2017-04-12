#  0000000   0000000   000      000   000  00     00  000   000
# 000       000   000  000      000   000  000   000  0000  000
# 000       000   000  000      000   000  000000000  000 0 000
# 000       000   000  000      000   000  000 0 000  000  0000
#  0000000   0000000   0000000   0000000   000   000  000   000

{ relative, keyinfo, path, post, elem, clamp, log, $, _ 
}   = require 'kxk'
Row = require './row'

class Column
    
    constructor: (@browser) ->
        
        @index = @browser.columns.length
        # log "Column #{@index}"

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
    
    setItems: (@items, @parent) ->
        # log @items, @parent
        @clear()
        for item in @items
            @rows.push new Row @, item
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
   
    navigateTo: (opt) ->
        target = _.isString(opt) and opt or opt?.file
        log 'navigateTo target:', target, 'parent:', @parent.abs
        log 'relative', relpath = relative target, @parent.abs
        log 'first', relitem = _.first relpath.split path.sep
       
    activeRow: -> 
        for r in @rows
            return r if r.isActive()
        
    activate: (key) ->
        index = @activeRow()?.index() ? -1
        index = switch key
            when 'up'        then (@numRows() + index-1) % @numRows() 
            when 'down'      then index+1
            when 'home'      then 0
            when 'end'       then @numRows()-1
            when 'page up'   then index-@numVisible()
            when 'page down' then index+@numVisible()
        index = clamp 0, @numRows()-1, index
        @rows[index].setActive()

    navigate: (key) ->
        switch key
            when 'left' then @browser.navigate 'left'
            when 'right' 
                if @activeRow()?.item.type == 'dir'
                    @browser.navigate 'right'
                else
                    post.emit 'focus', 'editor'

    numRows: -> @rows.length            
    numVisible: -> 10 # TODO
    
    # 00000000   0000000    0000000  000   000   0000000  
    # 000       000   000  000       000   000  000       
    # 000000    000   000  000       000   000  0000000   
    # 000       000   000  000       000   000       000  
    # 000        0000000    0000000   0000000   0000000   
    
    hasFocus: -> @div.classList.contains 'focus'

    focus: ->
        log "focus #{@index}"
        if not @activeRow() and @rows.length
            @rows[0].setActive()
        @div.focus()
        
    onFocus: =>
        @div.classList.add 'focus'
        # log "#{@index}"
        
    onBlur: =>
        @div.classList.remove 'focus'
        # log "#{@index}"
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKey: (event) =>
        {mod,key,combo} = keyinfo.forEvent event
        # log "#{@index} #{combo}"
        switch combo
            when 'up', 'down', 'page up', 'page down', 'home', 'end' then @activate key
            when 'right', 'left' then @navigate key
        
module.exports = Column

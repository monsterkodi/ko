# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, clamp, post, error, log, $, _ 
} = require 'kxk'

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->

        @div = elem class: 'browserRow', html: syntax.spanForText @item.text ? @item.name
        @div.classList.add @item.type
        @div.addEventListener 'click', @activate
        @div.addEventListener 'dblclick', => @column.navigateCols 'enter'
        @column.table.appendChild @div
   
    index: -> @column.rows.indexOf @
    
    onMouseOut: -> @div.classList.remove 'hover'
    onMouseOver: -> @div.classList.add 'hover'

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: =>
        $('.hover')?.classList.remove 'hover'
        @setActive emit:true
        switch @item.type
            when 'dir'  then @column.browser.loadDir     @item.abs, column: @column.index+1, parent: @item
            when 'file' then @column.browser.loadContent @,         column: @column.index+1
            else post.toWin 'jumpTo', file: @item.file, line: @item.line
        @
    
    isActive: -> @div.classList.contains 'active'
    
    fixScroll: ->
        colHeight = @column.div.offsetHeight
        activeTop = @div.offsetTop
        rowHeight = @div.clientHeight
        scrollTop = @column.div.scrollTop
        if activeTop + rowHeight <= colHeight # no need to scroll
            return 0
        return clamp activeTop, activeTop - colHeight + rowHeight, scrollTop
        
    clearFixScroll: => delete @column.fixScroll
        
    setActive: (opt = emit:false) ->
        @column.fixScroll = @fixScroll()
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        post.toWin 'browser-item-activated', @item if opt?.emit
        setTimeout @clearFixScroll, 100
        @
                
    clearActive: ->
        @div.classList.remove 'active'
        @

module.exports = Row

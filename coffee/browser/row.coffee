# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, keyinfo, clamp, post, error, log, $, _ 
} = require 'kxk'

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->

        @div = elem class: 'browserRow', html: syntax.spanForTextAndSyntax @item.text ? @item.name, 'browser'
        @div.classList.add @item.type
        @div.addEventListener 'click', @activate
        @div.addEventListener 'dblclick', => @column.navigateCols 'enter'
        @column.table.appendChild @div
   
    next:        -> @index() < @column.numRows()-1 and @column.rows[@index()+1] or null
    prev:        -> @index() > 0 and @column.rows[@index()-1] or null
    index:       -> @column.rows.indexOf @    
    onMouseOut:  -> @div.classList.remove 'hover'
    onMouseOver: -> @div.classList.add 'hover'

    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: (event) =>
        if event?
            {mod} = keyinfo.forEvent event
            log mod
            switch mod
                when 'alt', 'command+alt'
                    if @item.type == 'file' and @item.textFile
                        post.emit 'jumpTo', file:@item.abs, newWindow:mod!='alt', sameWindow:mod=='alt'
                    else
                        post.emit 'jumpTo', word:@item.name
                    return
            
        $('.hover')?.classList.remove 'hover'
        @setActive emit:true
        switch @item.type
            when 'dir'   then @column.browser.loadDir     @item.abs, column: @column.index+1, parent: @item
            when 'file'  then @column.browser.loadContent @,         column: @column.index+1
            else
                if @item.file?
                    post.emit 'jumpTo', file:@item.file, line:@item.line, sameWindow:true
                else if @column.parent.obj?
                    @column.browser.loadObjectItem  @item, column: @column.index+1
                else
                    @column.browser.clearColumnsFrom @column.index+1
        @
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: (opt = emit:false) ->
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        @column.scroll.toIndex @index()  
        post.emit 'browser-item-activated', @item if opt?.emit # sets commandline text
        @
                
    clearActive: ->
        @div.classList.remove 'active'
        @

module.exports = Row

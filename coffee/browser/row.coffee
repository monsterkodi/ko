
# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, keyinfo, clamp, empty, post, error, log, $, _ } = require 'kxk' 

syntax = require '../editor/syntax'

class Row
    
    constructor: (@column, @item) ->

        @browser = @column.browser
        text = @item.text ? @item.name
        if empty text.trim()
            html = '&nbsp;'
        else
            html = syntax.spanForTextAndSyntax text, 'browser'
        @div = elem class: 'browserRow', html: html
        @div.classList.add @item.type
        @column.table.appendChild @div
   
    next:        -> @index() < @column.numRows()-1 and @column.rows[@index()+1] or null
    prev:        -> @index() > 0 and @column.rows[@index()-1] or null
    index:       -> @column.rows.indexOf @    
    onMouseOut:  -> @div.classList.remove 'hover'
    onMouseOver: -> @div.classList.add 'hover'

    path: -> 
        if @item.file? and _.isString @item.file
            return @item.file
        if @item.obj?.file? and _.isString @item.obj.file
            return @item.obj.file
    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: (event) =>

        if @column.index < 0 # shelf handles row activation
            @column.activateRow @
            return
        
        if event?
            {mod} = keyinfo.forEvent event
            switch mod
                when 'alt', 'command', 'command+alt'
                    if @item.type == 'file' and @item.textFile
                        opt = file:@item.file
                        if mod == 'command+alt'
                            opt.newWindow = true
                        else
                            opt.newTab = true 
                        post.emit 'jumpTo', opt
                    else
                        post.emit 'jumpTo', word:@item.name
                    return
            
        $('.hover')?.classList.remove 'hover'
        
        @setActive emit:true
        
        switch @item.type
            when 'dir'   then @browser.loadDir     @item.file, column: @column.index+1, parent: @item
            when 'file'  then @browser.loadContent @,          column: @column.index+1
            else
                if @item.file? and _.isString @item.file
                    post.emit 'jumpToFile', file:@item.file, line:@item.line, col:@item.column
                else if @column.parent.obj? and @column.parent.type == 'obj'
                    @browser.loadObjectItem  @item, column:@column.index+1
                    if @item.type == 'obj'
                        @browser.previewObjectItem  @item, column:@column.index+2
                        if @item.obj?.file? and _.isString @item.obj.file
                            post.emit 'jumpToFile', file:@item.obj.file, line:@item.obj.line, col:@item.obj.column
                else if @item.obj?.file? and _.isString @item.obj.file
                    post.emit 'jumpToFile', file:@item.obj.file, line:@item.obj.line, col:@item.obj.column
                else
                    @browser.clearColumnsFrom @column.index+1
        @
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: (opt = emit:false) ->
        
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        @column.scroll.toIndex @index() 
        window.setLastFocus @column.name()
        if opt?.emit then @browser.emit 'itemActivated', @item
        @
                
    clearActive: ->
        @div.classList.remove 'active'
        @

module.exports = Row

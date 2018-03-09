
# 00000000    0000000   000   000
# 000   000  000   000  000 0 000
# 0000000    000   000  000000000
# 000   000  000   000  000   000
# 000   000   0000000   00     00

{ elem, keyinfo, drag, clamp, empty, post, slash, error, log, fs, $, _ } = require 'kxk' 

syntax      = require '../editor/syntax'
fileIcons   = require 'file-icons-js'
electron    = require 'electron'

app = electron.remote.app

class Row
    
    constructor: (@column, @item) ->

        @browser = @column.browser
        text = @item.text ? @item.name
        if empty(text) or empty text.trim()
            html = '&nbsp;'
        else
            html = syntax.spanForTextAndSyntax text, 'browser'
        @div = elem class: 'browserRow', html: html
        @div.classList.add @item.type
        @column.table.appendChild @div

        if @item.type in ['file', 'dir']
            @setIcon()
        
        @drag = new drag
            target: @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop
   
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

    setIcon: ->

        className = fileIcons.getClass @item.file
        if empty className
            if @item.type == 'dir'
                className = 'folder-icon'
            else
                className = 'file-icon'
            
        icon = elem('span', class:className + ' browserFileIcon')
            
        @div.firstChild.insertBefore icon, @div.firstChild.firstChild
                    
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
                when 'alt', 'command', 'command+alt', 'ctrl', 'ctrl+alt'
                    if @item.type == 'file' and @item.textFile
                        opt = file:@item.file
                        if mod in ['command+alt', 'ctrl+alt']
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
    
    setActive: (opt = {}) ->
        
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        if opt?.scroll != false
            @column.scroll.toIndex @index()
        window.setLastFocus @column.name()
        if opt?.emit then @browser.emit 'itemActivated', @item
        @
                
    clearActive: ->
        @div.classList.remove 'active'
        @

    # 0000000    00000000    0000000    0000000   
    # 000   000  000   000  000   000  000        
    # 000   000  0000000    000000000  000  0000  
    # 000   000  000   000  000   000  000   000  
    # 0000000    000   000  000   000   0000000   
    
    onDragStart: (d, e) =>
        
        @column.focus activate:false
        @setActive scroll:false

    onDragMove: (d,e) =>
        
        if not @column.dragDiv
            
            return if Math.abs(d.deltaSum.x) < 20 and Math.abs(d.deltaSum.y) < 10
            
            @column.dragDiv = @div.cloneNode true
            br = @div.getBoundingClientRect()
            @column.dragDiv.style.position = 'absolute'
            @column.dragDiv.style.top  = "#{br.top}px"
            @column.dragDiv.style.left = "#{br.left}px"
            @column.dragDiv.style.width = "#{br.width-12}px"
            @column.dragDiv.style.height = "#{br.height-3}px"
            @column.dragDiv.style.flex = 'unset'
            @column.dragDiv.style.pointerEvents = 'none'
            document.body.appendChild @column.dragDiv
        
        @column.dragDiv.style.transform = "translateX(#{d.deltaSum.x}px) translateY(#{d.deltaSum.y}px)"

    onDragStop: (d,e) =>
        
        if @column.dragDiv?
            
            @column.dragDiv.remove()
            delete @column.dragDiv
            
            if column = @browser.columnAtPos d.pos
                column.dropRow? @, d.pos
        
module.exports = Row

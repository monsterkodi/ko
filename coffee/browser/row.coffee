###
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
###

{ $, _, elem, empty, keyinfo, post, slash, stopEvent } = require 'kxk'

Syntax    = require '../editor/syntax'
electron  = require 'electron'
File      = require '../tools/file'

class Row
    
    @: (@column, @item) ->

        @browser = @column.browser
        text = @item.text ? @item.name
        if empty(text) or empty text.trim()
            html = '<span> </span>'
        else
            html = Syntax.spanForTextAndSyntax text, 'browser'
        @div = elem class:'browserRow' html: html
        @div.classList.add @item.type
        @column.table.appendChild @div

        if @item.type in ['file' 'dir'] or @item.icon
            @setIcon()
        
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

        if @item.icon
            className = @item.icon
        else
            if @item.type == 'dir'
                className = 'folder-icon'
            else
                className = File.iconClassName @item.file
                
        if slash.base(@item.file).startsWith('.')
            className += ' dotfile'
            
        icon = elem('span' class:className + ' browserFileIcon')
            
        @div.firstChild?.insertBefore icon, @div.firstChild.firstChild
                    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: (event, emit=true) =>

        if @column.index < 0 # shelf handles row activation
            @column.activateRow @
            return
                    
        $('.hover')?.classList.remove 'hover'
        
        @setActive emit:emit
        
        opt = file:@item.file

        switch @item.type
            
            when 'dir' 'file'
                
                post.emit 'filebrowser' 'activateItem' @item, @column.index
                
                col = @column.index
        
                @browser.select.row @, false
                
            else    
                opt.line = @item.line
                opt.col  = @item.column
                    
                @browser.clearColumnsFrom @column.index+1, pop:true
                
                if emit then post.emit 'jumpToFile' opt
        @
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: (opt={}) ->
        
        if @column.activeRow() != @
            @column.activeRow()?.clearActive()
            
        @div.classList.add 'active'
        
        # klog 'setActive setLastFocus? ' @browser.name, window.lastFocus 
        # if window.lastFocus.startsWith @browser.name
            # klog 'setActive setLastFocus! ' @column.name()
            # window.setLastFocus @column.name()
        
        if opt?.scroll != false
            @column.scroll.toIndex @index()            
            
        if opt?.emit
            @browser.emit 'itemActivated' @item
            if @item.type == 'dir'
                post.emit 'setCWD' @item.file
            else if @item.type == 'file'
                post.emit 'setCWD' slash.dir @item.file
        @
                 
    clearActive: ->
        @div.classList.remove 'active'
        @
        
    #  0000000  00000000  000      00000000   0000000  000000000  00000000  0000000    
    # 000       000       000      000       000          000     000       000   000  
    # 0000000   0000000   000      0000000   000          000     0000000   000   000  
    #      000  000       000      000       000          000     000       000   000  
    # 0000000   00000000  0000000  00000000   0000000     000     00000000  0000000    
    
    isSelected: -> @div.classList.contains 'selected'
    
    setSelected: ->
        @div.classList.add 'selected'
        @
        
    clearSelected: ->
        @div.classList.remove 'selected'
        @

    # 000   000   0000000   00     00  00000000  
    # 0000  000  000   000  000   000  000       
    # 000 0 000  000000000  000000000  0000000   
    # 000  0000  000   000  000 0 000  000       
    # 000   000  000   000  000   000  00000000  
            
    editName: =>
        
        return if @input? 
        @input = elem 'input' class:'rowNameInput'
        @input.value = slash.file @item.file
        
        @div.appendChild @input
        @input.addEventListener 'change'   @onNameChange
        @input.addEventListener 'keydown'  @onNameKeyDown
        @input.addEventListener 'focusout' @onNameFocusOut
        @input.focus()
        
        @input.setSelectionRange 0, slash.base(@item.file).length

    onNameKeyDown: (event) =>
        
        {mod, key, combo} = keyinfo.forEvent event

        switch combo
            when 'esc'
                if @input.value != slash.file @item.file
                    @input.value = slash.file @item.file
                    event.preventDefault()
                    event.stopImmediatePropagation()
                @onNameFocusOut()
            when 'enter'
                if @input.value != slash.file @item.file
                    @onNameChange()
                else
                    @removeInput()
                stopEvent event
        event.stopPropagation()
        
    removeInput: ->

        return if not @input?
        @input.removeEventListener 'focusout' @onNameFocusOut
        @input.removeEventListener 'change'   @onNameChange
        @input.removeEventListener 'keydown'  @onNameKeyDown
        @input.remove()
        delete @input
        @input = null
        if not document.activeElement? or document.activeElement == document.body
            @column.focus activate:false
    
    onNameFocusOut: (event) => @removeInput()
    
    #  0000000  000   000   0000000   000   000   0000000   00000000  
    # 000       000   000  000   000  0000  000  000        000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   
    # 000       000   000  000   000  000  0000  000   000  000       
    #  0000000  000   000  000   000  000   000   0000000   00000000  
    
    onNameChange: (event) =>
        
        targetFile = slash.join slash.dir(@item.file), @input.value.trim()
        
        @removeInput()
        
        @rename targetFile
        
    # 00000000   00000000  000   000   0000000   00     00  00000000  
    # 000   000  000       0000  000  000   000  000   000  000       
    # 0000000    0000000   000 0 000  000000000  000000000  0000000   
    # 000   000  000       000  0000  000   000  000 0 000  000       
    # 000   000  00000000  000   000  000   000  000   000  00000000  
    
    rename: (targetFile) =>
        
        return if slash.samePath @item.file, targetFile
                
        File.rename @item.file, targetFile, (source, target) =>
            # klog 'row.rename' source, target
    
module.exports = Row

###
 0000000  00000000   000   000  00     00  0000000  
000       000   000  000   000  000   000  000   000
000       0000000    000   000  000000000  0000000  
000       000   000  000   000  000 0 000  000   000
 0000000  000   000   0000000   000   000  0000000  
###

{ elem, kpos, slash } = require 'kxk'

File = require '../tools/file'

class Crumb

    @: (@column) ->
        
        @elem = elem class:'crumb'
        @elem.columnIndex = @column.index
        @elem.addEventListener 'mousedown' @onMouseDown
        @elem.addEventListener 'mouseup'   @onMouseUp
        @column.div.insertBefore @elem, @column.div.firstChild

    show: -> @elem.style.display = 'block'
    hide: -> @elem.style.display = 'none'
        
    onMouseDown: (event) =>
        
        @downPos = kpos window.win.getBounds()
            
    onMouseUp: (event) =>
        
        return if not @downPos
        
        upPos = kpos window.win.getBounds()
        
        if upPos.to(@downPos).length() > 0
            delete @downPos
            @column.focus()
            return
        
        if @column.index == 0
            if event.target.id
                @column.browser.browse event.target.id
            else
                root = @elem.firstChild
                br = root.getBoundingClientRect()
                if kpos(event).x < br.left
                    @column.browser.browse root.id
                else
                    @column.browser.browse @column.parent.file
        else
            @column.makeRoot()
            
        delete @downPos
        
    setFile: (file) ->
        
        # klog 'setFile' file
        if @column.index == 0
            @elem.innerHTML = File.crumbSpan slash.tilde file
        else
            @elem.innerHTML = slash.file file
        
    clear: -> @elem.innerHTML = ''
    
module.exports = Crumb

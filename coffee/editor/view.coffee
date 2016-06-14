# 000   000  000  00000000  000   000
# 000   000  000  000       000 0 000
#  000 000   000  0000000   000000000
#    000     000  000       000   000
#     0      000  00000000  00     00

{
clamp,$,
unresolve,
getStyle,
}         = require '../tools/tools'
log       = require '../tools/log'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
ViewBase  = require './viewbase'
Minimap   = require './minimap'
syntax    = require './syntax'
watcher   = require './watcher'
path      = require 'path'
electron  = require 'electron'
webframe  = electron.webFrame

class View extends ViewBase

    constructor: (viewElem) -> 

        @fontSizeDefault = 15
        @fontSizeKey     = 'editorFontSize'

        @minimap = new Minimap @
        
        super viewElem
            
        @scroll.on 'scroll', @updateScrollbar    
        
        @view.style.right = "#{@minimap.width()}px"                
                
        @smoothScrolling   = true
        @scrollhandleRight = $('.scrollhandle.right', @view.parentElement)
        
        @scrollbarDrag = new drag 
            target: $('.scrollbar.right', @view.parentElement)
            onMove: @onScrollDrag 
            cursor: 'ns-resize'

        @view.addEventListener 'wheel', @onWheel
        
    done: =>
        # @updateTitlebar()
        super # @changed @do.changeInfo

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo) ->        
        
        if changeInfo.changed.length or changeInfo.deleted.length or changeInfo.inserted.length
            @updateTitlebar() # sets dirty flag
        
        delta = @deltaToEnsureCursorsAreVisible()

        if delta and changeInfo.cursor.length
            @scrollBy delta * @size.lineHeight #todo: slow down when using mouse
            @scrollCursor()
            @minimap.changed changeInfo
            return
        
        super changeInfo
        
        @minimap.changed changeInfo
        
        if changeInfo.deleted.length or changeInfo.inserted.length
            @scroll.setNumLines @lines.length
        if changeInfo.cursor.length
            @scrollCursor()        

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    setCurrentFile: (file) ->
        
        @syntax.name = 'txt'
        if file?
            name = path.extname(file).substr(1)
            if name in syntax.syntaxNames
                @syntax.name = name
        log 'view.setCurrentFile', file, @syntax.name
        super file # -> setText -> setLines
        
        # @scrollBy 0

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    setLines: (lines) ->
        super lines
        @minimap.renderLines()
    
    # 0000000   0000000    0000000   00     00
    #    000   000   000  000   000  000   000
    #   000    000   000  000   000  000000000
    #  000     000   000  000   000  000 0 000
    # 0000000   0000000    0000000   000   000
        
    resetZoom: -> 
        webframe.setZoomFactor 1
        @scroll.setViewHeight @viewHeight()
        
    changeZoom: (d) -> 
        z = webframe.getZoomFactor() 
        z *= 1+d/20
        z = clamp 0.36, 5.23, z
        webframe.setZoomFactor z
        @scroll.setViewHeight @viewHeight()

    # 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
    #    000     000     000     000      000       000   000  000   000  000   000
    #    000     000     000     000      0000000   0000000    000000000  0000000  
    #    000     000     000     000      000       000   000  000   000  000   000
    #    000     000     000     0000000  00000000  0000000    000   000  000   000
        
    updateTitlebar: ->
        title = ""
        if @currentFile?
            title = path.basename @currentFile
            dirty = @do.hasLineChanges()
            ds = dirty and "●" or ""
            dc = dirty and " dirty" or ""
            title = "<span class=\"title#{dc}\" data-tip=\"#{unresolve @currentFile}\">#{ds} #{title} #{ds}</span>"
        $('.titlebar').innerHTML = title 
            
    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
        
    updateScrollbar: =>
        # log "view.updateScrollbar #{@minimap?}"
        @minimap?.scroll()
        return if not @scrollhandleRight?
        sbw = parseInt getStyle '.scrollhandle', 'width'
        if @lines.length * @size.lineHeight < @viewHeight()
            @scrollhandleRight.style.top    = "0"
            @scrollhandleRight.style.height = "0"
            @scrollhandleRight.style.width  = "0"
        else
            bh           = @lines.length * @size.lineHeight
            vh           = Math.min @editorHeight, @viewHeight()
            scrollTop    = parseInt (@scroll.scroll / bh) * vh
            scrollHeight = parseInt (@editorHeight / bh) * vh
            scrollHeight = Math.max scrollHeight, parseInt @size.lineHeight/4
            scrollTop    = Math.min scrollTop, @viewHeight()-scrollHeight
            scrollTop    = Math.max 0, scrollTop
                    
            @scrollhandleRight.style.top    = "#{scrollTop}px"
            @scrollhandleRight.style.height = "#{scrollHeight}px"
            # @scrollhandleRight.style.width  = "#{sbw}px"
                
    scrollLines: (delta) -> @scrollBy delta * @size.lineHeight

    scrollFactor: (event) ->
        f  = 1 
        f *= 1 + 1 * event.shiftKey
        f *= 1 + 3 * event.metaKey        
        f *= 1 + 7 * event.altKey

    scrollBy: (delta) -> 
            
        @scroll.by delta
        # log "view.scrollBy @scroll.offsetTop #{@scroll.offsetTop}"
        @view.scrollTop = @scroll.offsetTop

    scrollCursor: -> $('.cursor', @view)?.scrollIntoViewIfNeeded()
            
    onWheel: (event) => 
        @scrollBy event.deltaY * @scrollFactor event
        
    onScrollDrag: (drag) =>
        delta = (drag.delta.y / @editorHeight) * @lines.length * @size.lineHeight
        @scrollBy delta
                        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) =>
        # log "view key:", key, "mod:", mod, "combo:", combo
        
        switch combo
            when 'tab'              then return @insertTab() + event.preventDefault() 
            when 'shift+tab'        then return @deleteTab() + event.preventDefault()
            when 'enter'            then return @insertNewline indent:true
            when 'command+]'        then return @indent()
            when 'command+['        then return @deIndent()
            when 'command+shift+='  then return @changeZoom +1
            when 'command+shift+-'  then return @changeZoom -1
            when 'command+shift+0'  then return @resetZoom()
            when 'command+j'        then return @joinLine()
            when 'command+/'        then return @toggleLineComment()
            when 'command+l'        then return @selectMoreLines()
            when 'command+shift+l'  then return @selectLessLines()
            when 'ctrl+up', 'ctrl+down', 'ctrl+left', 'ctrl+right' then return @alignCursors key
            when 'command+up',       'command+down'       then return @addCursors key
            when 'command+shift+up', 'command+shift+down' then return @delCursors key
                                    
        switch key
            
            when 'esc'     then return @cancelCursorsAndHighlights()
            when 'home'    then return @moveCursorToLineIndex 0, event.shiftKey
            when 'end'     then return @moveCursorToLineIndex @lines.length-1, event.shiftKey
            when 'page up'      
                @moveCursorsUp event.shiftKey, @numFullLines()-3
                event.preventDefault() # prevent view from scrolling
                return
            when 'page down'    
                @moveCursorsDown event.shiftKey, @numFullLines()-3
                event.preventDefault() # prevent view from scrolling
                return
                                
        return 'unhandled'                
        
module.exports = View
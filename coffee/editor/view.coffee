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
split     = require '../split'
ViewBase  = require './viewbase'
render    = require './render'
watcher   = require './watcher'
path      = require 'path'
electron  = require 'electron'
webframe  = electron.webFrame

class View extends ViewBase

    constructor: (viewElem) -> 

        @fontSizeDefault = 15
        @fontSizeKey     = 'editorFontSize'

        super viewElem
        
        @smoothScrolling   = true
        @scroll            = 0
        @scrollhandleRight = $('.scrollhandle.right', @view.parentElement)
        
        @scrollbarDrag = new drag 
            target: $('.scrollbar.right', @view.parentElement)
            onMove: @onScrollDrag 
            cursor: 'ns-resize'

        @view.addEventListener 'wheel', @onWheel

    done: =>
        @updateTitlebar()
        super

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    setCurrentFile: (file) ->
        @syntaxName = 'txt'
        if file?
            name = path.extname(file).substr(1)
            if name in render.syntaxNames
                @syntaxName = name
        super file
        @scrollBy 0

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    linesChanged: (lineIndices) ->
        @updateTitlebar()
        
        if delta = @deltaToEnsureCursorIsVisible() 
            # log "delta", delta, delta * @lineHeight
            @scrollBy delta * @size.lineHeight #todo: slow down when using mouse
            @scrollCursor()
            return
        
        super lineIndices
        
        @updateScrollbar()
        @scrollCursor()        
    
    setLines: (lines) ->
        super lines
        @scrollBy 0
    
    # 0000000   0000000    0000000   00     00
    #    000   000   000  000   000  000   000
    #   000    000   000  000   000  000000000
    #  000     000   000  000   000  000 0 000
    # 0000000   0000000    0000000   000   000
        
    resetZoom: -> 
        webframe.setZoomFactor 1
        @updateNumLines()
        
    changeZoom: (d) -> 
        z = webframe.getZoomFactor() 
        z *= 1+d/20
        z = clamp 0.36, 5.23, z
        webframe.setZoomFactor z
        @updateNumLines()

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

    # 00000000  000  000   000  0000000  
    # 000       000  0000  000  000   000
    # 000000    000  000 0 000  000   000
    # 000       000  000  0000  000   000
    # 000       000  000   000  0000000  
    
    openFind: ->
        split.showCommandline()
        $('.commandline-editor').focus()
        
    openQuick: -> @openFind()

    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  

    resized: -> 
        oldHeight = @editorHeight
        super
        if @editorHeight <= oldHeight
            @updateScrollbar()

    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
        
    updateScrollbar: ->
        return if not @scrollhandleRight?
        sbw = getStyle '.scrollhandle', 'width'
        if @bufferHeight < @viewHeight()
            @scrollhandleRight.style.top    = "0"
            @scrollhandleRight.style.height = "0"
            @scrollhandleRight.style.width  = "0"
            @view.style.right = "0"
        else
            vh           = Math.min @editorHeight, @viewHeight()
            scrollTop    = parseInt (@scroll / @bufferHeight) * vh
            scrollHeight = parseInt (@editorHeight / @bufferHeight) * vh
            scrollHeight = Math.max scrollHeight, parseInt @size.lineHeight/4
            scrollTop    = Math.min scrollTop, @viewHeight()-scrollHeight
            scrollTop    = Math.max 0, scrollTop
                    
            @scrollhandleRight.style.top    = "#{scrollTop}.px"
            @scrollhandleRight.style.height = "#{scrollHeight}.px"
            @scrollhandleRight.style.width  = sbw
            @view.style.right = sbw            
                
    scrollLines: (lineDelta) -> @scrollBy lineDelta * @size.lineHeight

    scrollFactor: (event) ->
        f  = 1 
        f *= 1 + 1 * event.shiftKey
        f *= 1 + 3 * event.metaKey        
        f *= 1 + 7 * event.altKey

    scrollBy: (delta) -> 
                
        @updateSizeValues()
        
        @scroll += delta
        @scroll = Math.min @scroll, @scrollMax
        @scroll = Math.max @scroll, 0
        @size.offsetTop = @scroll
        
        top = parseInt @scroll / @size.lineHeight
        dff = @scroll - top * @size.lineHeight 

        if @topIndex != top
            @displayLines top
        else
            @updateScrollbar()

        if @smoothScrolling            
            @view.scrollTop = dff

    scrollCursor: -> $('.cursor', @view)?.scrollIntoViewIfNeeded()
            
    onWheel: (event) => 
        @scrollBy event.deltaY * @scrollFactor event
        
    onScrollDrag: (drag) =>
        delta = (drag.delta.y / @editorHeight) * @bufferHeight
        @scrollBy delta
                        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) =>
        # log "view key:", key, "mod:", mod, "combo:", combo
        
        switch combo
            when 'esc'              then return split.focusOnEditor()
            when 'command+f'        then return @openFind()  
            when 'command+p'        then return @openQuick()     
            when 'tab'              then return @insertTab() + event.preventDefault() 
            when 'shift+tab'        then return @deleteTab() + event.preventDefault()
            when 'command+]'        then return @indent()
            when 'command+['        then return @deIndent()
            when 'command+shift+='  then return @changeZoom +1
            when 'command+shift+-'  then return @changeZoom -1
            when 'command+shift+0'  then return @resetZoom()
            when 'enter'            then return @insertNewline()
            when 'command+j'        then return @joinLine()
            when 'command+/'        then return @toggleLineComment()
                
        # commands that might change the selection ...
        
        switch key
            when 'home', 'end', 'page up', 'page down'
                @startSelection event.shiftKey # ... starts or extend selection if shift is pressed
        
        switch key
            
            when 'home'    then @moveCursorToLineIndex 0
            when 'end'     then @moveCursorToLineIndex @lines.length-1
            when 'page up'      
                @moveCursorByLines -(@numFullLines()-3)
                event.preventDefault() # prevent view from scrolling
            when 'page down'    
                @moveCursorByLines   @numFullLines()-3
                event.preventDefault() # prevent view from scrolling
                
        switch key # ... reset selection 
            when 'home', 'end', 'page up', 'page down'
                @endSelection event.shiftKey 
                return
                
        return 'unhandled'                
        
module.exports = View
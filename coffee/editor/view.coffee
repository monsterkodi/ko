# 000   000  000  00000000  000   000
# 000   000  000  000       000 0 000
#  000 000   000  0000000   000000000
#    000     000  000       000   000
#     0      000  00000000  00     00
{
unresolve,
getStyle,
clamp,
$}        = require '../tools/tools'
log       = require '../tools/log'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
ViewBase  = require './viewbase'
Minimap   = require './minimap'
Scrollbar = require './scrollbar'
Numbers   = require './numbers'
syntax    = require './syntax'
watcher   = require './watcher'
path      = require 'path'
electron  = require 'electron'
webframe  = electron.webFrame

class View extends ViewBase

    constructor: (viewElem) -> 

        @fontSizeDefault = 15

        super viewElem
        
        # @do.dbg    = true
        @scrollbar = new Scrollbar @
        @minimap   = new Minimap @
        @numbers   = new Numbers @
                    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo) ->        
        
        if changeInfo.changed.length or changeInfo.deleted.length or changeInfo.inserted.length
            @updateTitlebar() # sets dirty flag
                
        super changeInfo
        
        @minimap?.changed changeInfo
        
        if changeInfo.deleted.length or changeInfo.inserted.length
            @scroll.setNumLines @lines.length
            
        if changeInfo.cursor.length
            @renderCursors()

            if delta = @deltaToEnsureCursorsAreVisible()
                # log "view.changed cursor delta #{delta}"
                @scrollBy delta * @size.lineHeight - @scroll.offsetSmooth 

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    setCurrentFile: (file) ->
        
        @saveScrollCursorsAndSelections() if not file
        
        @syntax.name = 'txt'
        if file?
            name = path.extname(file).substr(1)
            if name in syntax.syntaxNames
                @syntax.name = name
        # log 'view.setCurrentFile', file, @syntax.name
        super file # -> setText -> setLines

        @restoreScrollCursorsAndSelections() if file
                    
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
            
    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000
        
    saveScrollCursorsAndSelections: ->
        @savedState = 
            file:       @currentFile
            scroll:     @scroll.scroll
            cursors:    _.cloneDeep @cursors
            selections: _.cloneDeep @selections
            highlights: _.cloneDeep @highlights
    
    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000     
    # 0000000    0000000   0000000      000     000   000  0000000    0000000 
    # 000   000  000            000     000     000   000  000   000  000     
    # 000   000  00000000  0000000      000      0000000   000   000  00000000
    
    restoreScrollCursorsAndSelections: ->
        if @savedState.file == @currentFile
            # log "view.restoreScrollCursorsAndSelections restore:", @savedState
            @cursors    = @savedState.cursors
            @selections = @savedState.selections
            @highlights = @savedState.highlights
            delta = @savedState.scroll - @scroll.scroll
            # log "view.restoreScrollCursorsAndSelections delta:", delta
            if delta
                @scrollBy delta
            else
                @updateLayers()
            @savedState = null
                        
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
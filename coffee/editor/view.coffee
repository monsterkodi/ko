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
        @numbers.updateColors()
                    
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
        return if not @currentFile
        s = {}
        s.scroll     = @scroll.scroll if @scroll.scroll
        s.cursors    = _.cloneDeep @cursors if @cursors.length > 1 or @cursors[0][0] or @cursors[0][1]
        s.selections = _.cloneDeep @selections if @selections.length
        s.highlights = _.cloneDeep @highlights if @highlights.length
            
        filePositions = window.getState 'filePositions', {}
        filePositions[@currentFile] = s
        # log "#{@currentFile} saveState", filePositions
        window.setState 'filePositions', filePositions       
    
    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000     
    # 0000000    0000000   0000000      000     000   000  0000000    0000000 
    # 000   000  000            000     000     000   000  000   000  000     
    # 000   000  00000000  0000000      000      0000000   000   000  00000000
    
    restoreScrollCursorsAndSelections: ->
        return if not @currentFile
        filePositions = window.getState 'filePositions', {}
        # log "#{@currentFile} restoreState", filePositions
        if filePositions[@currentFile]? 
            s = filePositions[@currentFile]
            # log "#{@currentFile} restoreState", s
            @cursors    = s.cursors    ? [[0,0]]
            @selections = s.selections ? []
            @highlights = s.highlights ? []
            delta = (s.scroll ? @scroll.scroll) - @scroll.scroll
            if delta
                @scrollBy delta
            else
                @updateLayers()
        
module.exports = View
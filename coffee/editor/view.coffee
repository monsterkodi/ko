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
split     = require '../split'
ViewBase  = require './viewbase'
syntax    = require './syntax'
watcher   = require './watcher'
path      = require 'path'
electron  = require 'electron'
webframe  = electron.webFrame

class View extends ViewBase

    constructor: (viewElem) -> 
        
        window.split.on 'commandline', @onCommandline
        @fontSizeDefault = 14
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap', 'Autocomplete']        
                    
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

    setCurrentFile: (file, opt) ->
        
        @saveScrollCursorsAndSelections() if not file and not opt?.noSaveScroll
        
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
            ic = document.hasFocus() and " focus" or ""
            id = "<span class=\"winid #{ic}\">#{window.winID}</span>"
            sep = "<span class=\"separator\"></span>"
            dc = dirty and " dirty" or "clean"
            db = "<span class=\"dot #{dc}\">●</span>"
            da = dirty and "●" or ""
            title = id + db + "<span class=\"title #{dc}\" data-tip=\"#{unresolve @currentFile}\">#{title} #{da}</span>"
        $('.titlebar').innerHTML = title
        
    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000     
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000 
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000     
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000
    
    onCommandline: (e) =>
        switch e
            when 'hidden', 'shown'
                d = window.split.commandlineHeight + window.split.handleHeight
                d = Math.min d, @scroll.scrollMax - @scroll.scroll
                d *= -1 if e == 'hidden'
                @scrollBy d
            
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

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        switch combo
            when 'esc'
                if @cursors.length > 1 or @highlights.length
                    @cancelCursorsAndHighlights()
                if @selections.length
                    @selectNone()
                else 
                    split = window.split
                    if split.terminalVisible()
                        split.hideTerminal()
                    else if split.commandlineVisible()
                        split.hideCommandline()
                return
        return 'unhandled'
        
module.exports = View
# 000   000  000  00000000  000   000
# 000   000  000  000       000 0 000
#  000 000   000  0000000   000000000
#    000     000  000       000   000
#     0      000  00000000  00     00
{
unresolve,
clamp,
$}        = require '../tools/tools'
log       = require '../tools/log'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
split     = require '../split'
ViewBase  = require './viewbase'
syntax    = require './syntax'
_         = require 'lodash'
path      = require 'path'
electron  = require 'electron'
ipc       = electron.ipcRenderer
webframe  = electron.webFrame

class View extends ViewBase

    constructor: (viewElem) -> 
        
        window.split.on 'commandline', @onCommandline
        @fontSizeDefault = 16
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap', 'Autocomplete', 'Brackets', 'Strings']        
        # @scroll.dbg = true
        # @do.dbg = true
        @setText ''
                    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo, action) ->        
        super changeInfo, action
        if changeInfo.lines
            @dirty = true # set dirty flag
            @updateTitlebar() 

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    setCurrentFile: (file, opt) ->
        log "setCurrentFile #{file}", opt
        @saveScrollCursorsAndSelections(opt) if not file and not opt?.noSaveScroll
        @dirty = false
        @syntax.name = 'txt'
        if file?
            name = path.extname(file).substr(1)
            if name in syntax.syntaxNames
                @syntax.name = name            
        super file, opt # -> setText -> setLines

        @restoreScrollCursorsAndSelections() if file
                    
    # 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
    #    000     000     000     000      000       000   000  000   000  000   000
    #    000     000     000     000      0000000   0000000    000000000  0000000  
    #    000     000     000     000      000       000   000  000   000  000   000
    #    000     000     000     0000000  00000000  0000000    000   000  000   000
        
    updateTitlebar: ->
        window.titlebar.update
            winID:  window.winID
            focus:  document.hasFocus()
            dirty:  @dirty ? false
            file:   @currentFile
            sticky: @stickySelection            
        
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
        
    saveScrollCursorsAndSelections: (opt) ->
        return if not @currentFile
        s = {}
        
        if opt?.dontSaveCursors
            s.main       = 0
            s.cursors    = [@mainCursor] 
        else        
            s.main       = @indexOfCursor(@mainCursor) if @indexOfCursor(@mainCursor) > 0
            s.cursors    = _.cloneDeep @cursors if @cursors.length > 1 or @cursors[0][0] or @cursors[0][1]
            s.selections = _.cloneDeep @selections if @selections.length
            s.highlights = _.cloneDeep @highlights if @highlights.length
            
        s.scroll     = @scroll.scroll if @scroll.scroll
                
        filePositions = window.getState 'filePositions', Object.create null
        if not _.isPlainObject filePositions
            filePositions = Object.create null
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
        if filePositions[@currentFile]? 
            s = filePositions[@currentFile]            
            @cursors    = s.cursors    ? [[0,0]]
            @selections = s.selections ? []
            @highlights = s.highlights ? []
            @mainCursor = @cursors[Math.min @cursors.length-1, s.main ? 0]            
            delta = (s.scroll ? @scroll.scroll) - @scroll.scroll
            @scrollBy delta if delta
            @updateLayers()
            @numbers.updateColors()                
            @emit 'cursor'
            @emit 'selection'

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        return if 'unhandled' != super mod, key, combo, event
        switch combo
            when 'ctrl+enter' then window.commandline.commands.coffee.executeText @text()              
            when 'esc'
                split = window.split
                if split.terminalVisible()
                    split.hideTerminal()
                else if split.commandlineVisible()
                    split.hideCommandline()
                return
        'unhandled'
        
module.exports = View

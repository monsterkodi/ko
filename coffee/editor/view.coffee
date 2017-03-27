# 000   000  000  00000000  000   000
# 000   000  000  000       000 0 000
#  000 000   000  0000000   000000000
#    000     000  000       000   000
#     0      000  00000000  00     00
{
fileName,
unresolve,
fileExists,
setStyle,
swapExt,
keyinfo,
clamp,
drag,
post,
log,
$}        = require 'kxk'
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
        post.on 'jumpTo', @jumpTo
        @fontSizeDefault = 16
        super viewElem, features: ['Scrollbar', 'Numbers', 'Minimap', 'Autocomplete', 'Brackets', 'Strings']        
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
        # log "View.setCurrentFile setCurrentFile #{file} opt:", opt
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
            
        s.scroll = @scroll.scroll if @scroll.scroll
                
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
        else
            editor.singleCursorAtPos [0,0]

    #       000  000   000  00     00  00000000 
    #       000  000   000  000   000  000   000
    #       000  000   000  000000000  00000000 
    # 000   000  000   000  000 0 000  000      
    #  0000000    0000000   000   000  000      
    
    jumpTo: (word, opt) =>
        
        find = word.toLowerCase()
        find = find.slice 1 if find[0] == '@'
        jumpToFileLine = (file, line) =>
            window.navigate.addFilePos
                file: @currentFile
                pos:  @cursorPos()
            window.navigate.gotoFilePos
                file: file
                pos:  [0, line]
                winID: window.winID
                select: opt?.select
        
        classes = ipc.sendSync 'indexer', 'classes'
        for clss, info of classes
            if clss.toLowerCase() == find
                jumpToFileLine info.file, info.line
                return true
                
        funcs = ipc.sendSync 'indexer', 'funcs'
        for func, infos of funcs
            if func.toLowerCase() == find
                info = infos[0]
                for i in infos
                    if i.file == @currentFile
                        info = i
                if infos.length > 1 and not opt?.dontList
                    window.commandline.commands.term.execute "funcs ^#{word}$"
                jumpToFileLine info.file, info.line
                return true

        files = ipc.sendSync 'indexer', 'files'
        for file, info of files
            if fileName(file).toLowerCase() == find and file != @currentFile
                jumpToFileLine file, 6
                return true
        false
    
    jumpToCounterpart: () ->
        
        counterparts = 
            '.cpp':     ['.hpp', '.h']
            '.cc':      ['.hpp', '.h']
            '.h':       ['.cpp', '.c']
            '.hpp':     ['.cpp', '.c']
            '.coffee':  ['.js']
            '.js':      ['.coffee']
            '.pug':     ['.html']
            '.html':    ['.pug']
            '.css':     ['.styl']
            '.styl':    ['.css']
            
        for ext in (counterparts[path.extname @currentFile] ? [])
            if fileExists swapExt @currentFile, ext
                window.loadFile swapExt @currentFile, ext
                return

        for ext in (counterparts[path.extname @currentFile] ? [])
            counter = swapExt @currentFile, ext
            counter = counter.replace "/#{path.extname(@currentFile).slice 1}/", "/#{ext.slice 1}/"
            if fileExists counter
                window.loadFile counter
                return true
            
        false

    #  0000000  00000000  000   000  000000000  00000000  00000000 
    # 000       000       0000  000     000     000       000   000
    # 000       0000000   000 0 000     000     0000000   0000000  
    # 000       000       000  0000     000     000       000   000
    #  0000000  00000000  000   000     000     00000000  000   000
    
    centerText: (center, animate=300) ->

        @size.centerText = center
        @updateLayers()
        
        if center
            @size.offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
            @size.offsetX = Math.max @size.offsetX, (@screenSize().width - @screenSize().height) / 2 
            @size.centerText = true
        else
            @size.offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
            @size.centerText = false
            
        @updateLinePositions animate

        if animate
            layers = ['.selections', '.highlights', '.cursors']
            transi = ['.selection',  '.highlight',  '.cursor' ].concat layers
            resetTrans = =>
                setStyle '.editor .layers '+l, 'transform', "translateX(0)" for l in layers
                setStyle '.editor .layers '+t, 'transition', "initial" for t in transi
                @updateLayers()
            
            if center
                offsetX = @size.offsetX - @size.numbersWidth - @size.charWidth/2
            else
                offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
                offsetX = Math.max offsetX, (@screenSize().width - @screenSize().height) / 2 
                offsetX -= @size.numbersWidth + @size.charWidth/2
                offsetX *= -1
                
            setStyle '.editor .layers '+l, 'transform', "translateX(#{offsetX}px)" for l in layers
            setStyle '.editor .layers '+t, 'transition', "all #{animate/1000}s" for t in transi
            setTimeout resetTrans, animate
        else
            @updateLayers()

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        return if 'unhandled' != super mod, key, combo, event
        switch combo
            when 'ctrl+enter'       then return window.commandline.commands.coffee.executeText @text() # return here?
            when 'command+alt+up'   then return @jumpToCounterpart()
            when 'esc'
                split = window.split
                if split.terminalVisible()
                    split.hideTerminal()
                else if split.commandlineVisible()
                    split.hideCommandline()
                return
        'unhandled'
        
module.exports = View

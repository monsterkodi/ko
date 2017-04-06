# 00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000   
# 000       000  000      000             000       000   000  000     000     000   000  000   000  
# 000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000    
# 000       000  000      000             000       000   000  000     000     000   000  000   000  
# 000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000  
{
fileName,
unresolve,
fileExists,
setStyle,
swapExt,
keyinfo,
first,
clamp,
drag,
post,
log,
$}         = require 'kxk'
split      = require '../split'
watcher    = require './watcher'
TextEditor = require './texteditor'
syntax     = require './syntax'
_          = require 'lodash'
fs         = require 'fs'
path       = require 'path'
electron   = require 'electron'
ipc        = electron.ipcRenderer
webframe   = electron.webFrame

class FileEditor extends TextEditor

    constructor: (viewElem) -> 
        
        @currentFile = null
        @watch       = null
        
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
    
    changed: (changeInfo) ->        
        super changeInfo
        dirty = @do.hasLineChanges()
        if @dirty != dirty
            @dirty = dirty
            @updateTitlebar()

    # 00000000   0000000   00000000   00000000  000   0000000   000   000  
    # 000       000   000  000   000  000       000  000        0000  000  
    # 000000    000   000  0000000    0000000   000  000  0000  000 0 000  
    # 000       000   000  000   000  000       000  000   000  000  0000  
    # 000        0000000   000   000  00000000  000   0000000   000   000  
    
    applyForeignLineChanges: (lineChanges) =>
        log 'applyForeignLineChanges', lineChanges
        @do.start()
        for change in lineChanges
            switch change.change
                when 'changed'  then @do.change change.doIndex, change.after
                when 'inserted' then @do.insert change.doIndex, change.after
                when 'deleted'  then @do.delete change.doIndex
                else
                    log "[WARNING] editor.applyForeignLineChanges wtf?"
        @do.end foreign: true

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    stopWatcher: ->
        if @watch?
            @watch?.stop()
            @watch = null

    setCurrentFile: (file, opt) -> 
                
        @dirty = false
        @syntax.name = 'txt'
        if file?
            name = path.extname(file).substr(1)
            if name in syntax.syntaxNames
                @syntax.name = name            
                
        @setSalterMode false
        @stopWatcher()
        @currentFile = file
        @do.reset()
        @updateTitlebar()
        if file?
            @watch = new watcher @
            @setText fs.readFileSync file, encoding: 'utf8'
        else
            @watch = null
            @setLines []
        @setupFileType()

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
            s.cursors    = [@cursorPos()] 
        else        
            s.main       = @state.get 'main'
            s.cursors    = @state.cursors()    if @numCursors() > 1 or @cursorPos()[0] or @cursorPos()[1]
            s.selections = @state.selections() if @numSelections()
            s.highlights = @state.highlights() if @numHighlights()
            
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
            @setCursors    s.cursors ? [[0,0]]
            @setSelections s.selections ? []
            @setHighlights s.highlights ? []
            @setMain       s.main ? 0
            @setState @state
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
                extend: opt?.extend
        
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

        log "search for #{word}", window.commandline.commands.search?
        
        window.commandline.commands.search.start "command+shift+f"    
        window.commandline.commands.search.execute word
        window.split.do 'reveal terminal'
        true
    
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
        
module.exports = FileEditor

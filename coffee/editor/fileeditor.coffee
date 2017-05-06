
# 00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000   
# 000       000  000      000             000       000   000  000     000     000   000  000   000  
# 000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000    
# 000       000  000      000             000       000   000  000     000     000   000  000   000  
# 000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000  

{ fileName, unresolve, samePath, joinFileLine, splitFilePos, fileExists, swapExt, path, empty, fs,
  setStyle, keyinfo, clamp, drag, post, error, log, str, _
}          = require 'kxk'
srcmap     = require '../tools/srcmap'
watcher    = require './watcher'
TextEditor = require './texteditor'
syntax     = require './syntax'

class FileEditor extends TextEditor

    constructor: (viewElem) -> 
        
        @currentFile = null
        @watch       = null
        
        window.split.on 'commandline', @onCommandline
        
        post.on 'jumpTo',        @jumpTo
        post.on 'jumpToFile',    @jumpToFile
        post.on 'setBreakpoint', @onSetBreakpoint
        
        @fontSizeDefault = 16
        
        super viewElem, features: ['Diffbar', 'Scrollbar', 'Numbers', 'Minimap', 'Meta', 'Autocomplete', 'Brackets', 'Strings']
        
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
            post.emit 'dirty', @dirty

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    clear: (opt = skip:false) -> @setCurrentFile null, opt 
    
    setCurrentFile: (file, opt) -> 
        
        @dirty = false
        if not opt?.skip
            post.emit 'dirty', false
        
        @syntax.name = 'txt'
        if file?
            name = path.extname(file).substr(1)
            if name in syntax.syntaxNames
                @syntax.name = name            
                
        @setSalterMode false
        @stopWatcher()
        
        @diffbar.clear()
        @meta.clear()
        @do.reset()

        @currentFile = file
        
        @setupFileType()
        
        if @currentFile?
            @watch = new watcher @
            if opt?.restoreState
                @setText opt.restoreState.text()
                @state = opt.restoreState
            else
                @setText fs.readFileSync @currentFile, encoding: 'utf8'
            @restoreScrollCursorsAndSelections()
            post.emit 'file', @currentFile # titlebar -> tabs -> tab
            post.toMain 'getBreakpoints', window.winID, @currentFile, window.winID
        else
            if not opt?.skip
                @setLines ['']
            
        if not opt?.skip
            if not @currentFile?
                post.emit 'file', @currentFile # titlebar -> tabs -> tab
            @emit 'file', @currentFile # diffbar, pigments, ...

    restoreFromTabState: (tabsState) ->
        
        log 'restoreFromTabState', tabsState
        return error "no tabsState.file?" if not tabsState.file?
        @clear skip:true
        @setCurrentFile tabsState.file, restoreState:tabsState.state
            
    stopWatcher: ->
        if @watch?
            @watch?.stop()
            @watch = null
                            
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
            s.main       = @state.main()
            s.cursors    = @state.cursors()    if @numCursors() > 1 or @cursorPos()[0] or @cursorPos()[1]
            s.selections = @state.selections() if @numSelections()
            s.highlights = @state.highlights() if @numHighlights()
            
        s.scroll = @scroll.scroll if @scroll.scroll
                
        filePositions = window.stash.get 'filePositions', Object.create null
        if not _.isPlainObject filePositions
            filePositions = Object.create null
        filePositions[@currentFile] = s
        window.stash.set 'filePositions', filePositions       
        
    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000     
    # 0000000    0000000   0000000      000     000   000  0000000    0000000 
    # 000   000  000            000     000     000   000  000   000  000     
    # 000   000  00000000  0000000      000      0000000   000   000  00000000
    
    restoreScrollCursorsAndSelections: ->
        
        return if not @currentFile
        
        filePositions = window.stash.get 'filePositions', {}
        if filePositions[@currentFile]? 
            s = filePositions[@currentFile] 
            @setCursors    s.cursors ? [[0,0]]
            @setSelections s.selections ? []
            @setHighlights s.highlights ? []
            @setMain       s.main ? 0
            @setState @state
            delta = (s.scroll ? @scroll.scroll) - @scroll.scroll
            delta = @size.lineHeight * parseInt(delta / @size.lineHeight) # no idea why this is necessary
            @scrollBy delta 
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

    jumpToFile: (opt) =>
        
        window.navigate.addFilePos
            file: @currentFile
            pos:  @cursorPos()
            
        [file, pos] = splitFilePos opt.file
        opt.pos = pos
        opt.pos[0] = opt.col if opt.col
        opt.pos[1] = opt.line-1 if opt.line
        
        opt.winID = window.winID
        if opt.newTab
            post.emit 'newTabWithFile', opt.file
        else
            window.navigate.gotoFilePos opt

    jumpTo: (word, opt) =>

        if _.isObject(word) and not opt?
            opt  = word
            word = opt.word

        opt ?= {}
        
        if opt.file?
            @jumpToFile opt
            return true

        return error 'nothing to jump to?' if empty word

        find = word.toLowerCase().trim()
        find = find.slice 1 if find[0] == '@'

        return error 'FileEditor.jumpTo -- nothing to find?' if empty find
        
        type = opt?.type

        if not type or type == 'class'
            classes = post.get 'indexer', 'classes'
            for clss, info of classes
                if clss.toLowerCase() == find
                    @jumpToFile info
                    return true

        if not type or type == 'func'                
            funcs = post.get 'indexer', 'funcs'
            for func, infos of funcs
                if func.toLowerCase() == find
                    info = infos[0]
                    for i in infos
                        if i.file == @currentFile
                            info = i
                    if infos.length > 1 and not opt?.dontList
                        window.commandline.commands.term.execute "func ^#{word}$"
                    @jumpToFile info
                    return true
    
        if not type or type == 'file'
            files = post.get 'indexer', 'files'
            for file, info of files
                if fileName(file).toLowerCase() == find and file != @currentFile
                    @jumpToFile file:file, line:6
                    return true

        window.commandline.commands.search.start "command+shift+f"    
        window.commandline.commands.search.execute word
            
        window.split.do 'show terminal'
        
        true
    
    #  0000000   0000000   000   000  000   000  000000000  00000000  00000000   00000000    0000000   00000000   000000000  
    # 000       000   000  000   000  0000  000     000     000       000   000  000   000  000   000  000   000     000     
    # 000       000   000  000   000  000 0 000     000     0000000   0000000    00000000   000000000  0000000       000     
    # 000       000   000  000   000  000  0000     000     000       000   000  000        000   000  000   000     000     
    #  0000000   0000000    0000000   000   000     000     00000000  000   000  000        000   000  000   000     000     
    
    jumpToCounterpart: () ->
        
        cp = @cursorPos()
        currext = path.extname @currentFile
        
        switch currext 
            when '.coffee'
                [file,line,col] = srcmap.toJs @currentFile, cp[1]+1, cp[0]
                if file? 
                    window.loadFile joinFileLine file,line,col
                    return true
            when '.js'
                [file,line,col] = srcmap.toCoffee @currentFile, cp[1]+1, cp[0]
                if file? 
                    window.loadFile joinFileLine file,line,col
                    return true

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
            
        for ext in (counterparts[currext] ? [])
            if fileExists swapExt @currentFile, ext
                window.loadFile swapExt @currentFile, ext
                return true

        for ext in (counterparts[currext] ? [])
            counter = swapExt @currentFile, ext
            counter = counter.replace "/#{currext.slice 1}/", "/#{ext.slice 1}/"
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

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    clickAtPos: (p, event) ->
        
        if event.metaKey
            if pos(event).x <= @size.numbersWidth
                @singleCursorAtPos p
                @toggleBreakpoint()
                return
                
        super p, event
            
    # 0000000    00000000   00000000   0000000   000   000  00000000    0000000   000  000   000  000000000  
    # 000   000  000   000  000       000   000  000  000   000   000  000   000  000  0000  000     000     
    # 0000000    0000000    0000000   000000000  0000000    00000000   000   000  000  000 0 000     000     
    # 000   000  000   000  000       000   000  000  000   000        000   000  000  000  0000     000     
    # 0000000    000   000  00000000  000   000  000   000  000         0000000   000  000   000     000     
            
    toggleBreakpoint: ->
        
        return if path.extname(@currentFile) not in ['.js', '.coffee']
        for cp in @cursors()
            continue if not @line(cp[1]).trim().length
            wid = window.commandline.commands.debug.activeWid()
            post.toMain 'setBreakpoint', wid, @currentFile, cp[1]+1
        
    onSetBreakpoint: (breakpoint) =>
        
        # log 'onSetBreakpoint', breakpoint, @currentFile
        return if not samePath breakpoint.file, @currentFile
        line = breakpoint.line
        switch breakpoint.status
            when 'active'   then @meta.addDbgMeta line:line-1, clss:'dbg breakpoint'
            when 'inactive' then @meta.addDbgMeta line:line-1, clss:'dbg breakpoint inactive'
            when 'remove'   then @meta.delDbgMeta line-1

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        
        return if 'unhandled' != super mod, key, combo, event
        switch combo
            when 'ctrl+enter'       then return window.commandline.commands.coffee.executeText @text()
            when 'ctrl+shift+enter' then return window.commandline.commands.coffee.executeTextInMain @text()
            when 'command+alt+up'   then return @jumpToCounterpart()
            when 'f7'               then return @toggleBreakpoint()
            when 'esc'
                split = window.split
                if split.terminalVisible()
                    split.hideTerminal()
                else if split.commandlineVisible()
                    split.hideCommandline()
                return
        'unhandled'
        
module.exports = FileEditor

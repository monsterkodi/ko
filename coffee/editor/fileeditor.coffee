###
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
###

{ popup, slash, empty, fs, setStyle, post, pos, error, log, str, _ } = require 'kxk'
  
srcmap     = require '../tools/srcmap'
watcher    = require './watcher'
TextEditor = require './texteditor'
Menu       = require '../win/menu'
syntax     = require './syntax'
electron   = require 'electron'

class FileEditor extends TextEditor

    constructor: (viewElem) ->

        super viewElem, 
            features: [
                'Diffbar'
                'Scrollbar'
                'Numbers'
                'Minimap'
                'Meta'
                'Autocomplete'
                'Brackets'
                'Strings'
            ],
            fontSize: 19

        @currentFile = null
        @watch       = null

        @view.addEventListener "contextmenu", @onContextMenu
        
        window.split.on 'commandline', @onCommandline

        post.on 'jumpTo',        @jumpTo
        post.on 'jumpToFile',    @jumpToFile

        @initPigments()
        @initInvisibles()

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

        @setSalterMode false
        @stopWatcher()

        @diffbar?.clear()
        @meta?.clear()
        @do.reset()

        @currentFile = file

        @setupFileType()

        if @currentFile?

            @watch = new watcher @

            if opt?.restoreState

                @setText opt.restoreState.text()
                @state = opt.restoreState
                @dirty = true
                post.emit 'dirty', true

            else
                @setText fs.readFileSync @currentFile, encoding: 'utf8'

            @restoreScrollCursorsAndSelections()
            post.emit 'file', @currentFile # titlebar -> tabs -> tab
        else
            if not opt?.skip
                @setLines ['']

        if not opt?.skip
            if not @currentFile?
                post.emit 'file', @currentFile # titlebar -> tabs -> tab
            # log 'emit file', @currentFile
            @emit 'file', @currentFile # diffbar, pigments, ...

    restoreFromTabState: (tabsState) ->

        # log 'restoreFromTabState', tabsState
        return error "no tabsState.file?" if not tabsState.file?
        @clear skip:true
        @setCurrentFile tabsState.file, restoreState:tabsState.state

    stopWatcher: ->
        # log 'stopWatcher', @currentFile
        @watch?.stop()
        @watch = null

    # 000000000  000   000  00000000   00000000  
    #    000      000 000   000   000  000       
    #    000       00000    00000000   0000000   
    #    000        000     000        000       
    #    000        000     000        00000000  
    
    shebangFileType: ->
        
        fileType = syntax.shebang @line(0) if @numLines()
        if fileType == 'txt' 
            if @currentFile?
                ext = slash.ext @currentFile
                if ext in syntax.syntaxNames
                    return ext
        else
            return fileType
            
        super()
        
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
                @scroll.by d

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

            @syntax.fillDiss @mainCursor()[1]
            
            @scroll.to s.scroll if s.scroll
            @scroll.cursorIntoView()

        else

            @singleCursorAtPos [0,0]
            @scroll.top = 0 if @mainCursor()[1] == 0
            @scroll.bot = @scroll.top-1
            @scroll.to 0
            @scroll.cursorIntoView()

        @updateLayers()
        @numbers?.updateColors()
        @minimap.onEditorScroll()
        @emit 'cursor'
        @emit 'selection'

    #       000  000   000  00     00  00000000
    #       000  000   000  000   000  000   000
    #       000  000   000  000000000  00000000
    # 000   000  000   000  000 0 000  000
    #  0000000    0000000   000   000  000

    jumpToFile: (opt) =>
        
        if opt.newTab
            
            file = opt.file
            file += ':' + opt.line if opt.line
            file += ':' + opt.col if opt.col
            post.emit 'newTabWithFile', file
            
        else
            
            [file, fpos] = slash.splitFilePos opt.file
            opt.pos = fpos
            opt.pos[0] = opt.col if opt.col
            opt.pos[1] = opt.line-1 if opt.line
            opt.winID  = window.winID

            opt.oldPos = @cursorPos()
            opt.oldFile = @currentFile
            
            # log 'opt:', opt
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
                if slash.base(file).toLowerCase() == find and file != @currentFile
                    @jumpToFile file:file, line:6

        window.commandline.commands.search.start 'search'
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
        currext = slash.ext @currentFile

        log 'jumpToCounterpart', cp, currext, @currentFile
        
        switch currext
            when 'coffee'
                [file,line,col] = srcmap.toJs @currentFile, cp[1]+1, cp[0]
                if file?
                    window.loadFile slash.joinFileLine file,line,col
                    return true
            when 'js'
                [file,line,col] = srcmap.toCoffee @currentFile, cp[1]+1, cp[0]
                if file?
                    window.loadFile slash.joinFileLine file,line,col
                    return true

        counterparts =
            'cpp':     ['hpp', 'h']
            'cc':      ['hpp', 'h']
            'h':       ['cpp', 'c']
            'hpp':     ['cpp', 'c']
            'coffee':  ['js']
            'js':      ['coffee']
            'pug':     ['html']
            'html':    ['pug']
            'css':     ['styl']
            'styl':    ['css']

        for ext in (counterparts[currext] ? [])
            if slash.fileExists slash.swapExt @currentFile, ext
                window.loadFile slash.swapExt @currentFile, ext
                return true

        for ext in (counterparts[currext] ? [])
            counter = swapExt @currentFile, ext
            counter = counter.replace "/#{currext}/", "/#{ext}/"
            if slash.fileExists counter
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

        @size.offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
        if center
            br        = @view.getBoundingClientRect()
            visCols   = parseInt br.width / @size.charWidth
            newOffset = parseInt @size.charWidth * (visCols - 100) / 2
            @size.offsetX = Math.max @size.offsetX, newOffset
            @size.centerText = true
        else
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

    # 00000000    0000000   00000000   000   000  00000000     
    # 000   000  000   000  000   000  000   000  000   000    
    # 00000000   000   000  00000000   000   000  00000000     
    # 000        000   000  000        000   000  000          
    # 000         0000000   000         0000000   000          

    onContextMenu: (event) => @showContextMenu pos event
              
    showContextMenu: (absPos) =>
        
        if not absPos?
            absPos = pos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [
            text:   'Back'
            combo:  'ctrl+1'
            cb:     -> post.emit 'menuAction', 'Navigate Backward'
        ,
            text:   'Forward'
            combo:  'ctrl+2'
            cb:     -> post.emit 'menuAction', 'Navigate Forward'
        ,
            text:   ''
        ,
            text:   'Browse'
            combo:  'ctrl+.' 
            cb:     -> window.commandline.startCommand 'browse'
        ,
            text:   'Git'
            combo:  'alt+g'
            cb:     -> post.emit 'menuAction', 'doMacro', 'git'
        ,
            text:   ''
        ,
            text:   'Maximize'
            combo:  'ctrl+shift+y' 
            cb:     -> window.split.maximizeEditor()
        ,
            text:   'Log View'
            combo:  'alt+ctrl+k'
            cb:     window.split.toggleLog
        , 
            text:   ''        
        ]
        
        mainMenu = Menu.template()
        opt.items = opt.items.concat mainMenu
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt
            
    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    clickAtPos: (p, event) ->

        if event.metaKey
            if pos(event).x <= @size.numbersWidth
                @singleCursorAtPos p
                return

        super p, event

    # 000   000  00000000  000   000
    # 000  000   000        000 000
    # 0000000    0000000     00000
    # 000  000   000          000
    # 000   000  00000000     000

    handleModKeyComboCharEvent: (mod, key, combo, char, event) ->
        
        return if 'unhandled' != super mod, key, combo, char, event
        # log 'unhandled', combo
        switch combo
            when 'alt+ctrl+enter'       then return window.commandline.commands.coffee.executeText @textOfSelectionForClipboard()
            when 'alt+ctrl+shift+enter' then return window.commandline.commands.coffee.executeTextInMain @textOfSelectionForClipboardt()
            when 'command+alt+up', 'alt+o' then return @jumpToCounterpart()
            when 'esc'
                split = window.split
                if split.terminalVisible()
                    split.hideTerminal()
                else if split.commandlineVisible()
                    split.hideCommandline()
                return
        'unhandled'

module.exports = FileEditor

###
00000000  000  000      00000000        00000000  0000000    000  000000000   0000000   00000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000000    000  000      0000000         0000000   000   000  000     000     000   000  0000000
000       000  000      000             000       000   000  000     000     000   000  000   000
000       000  0000000  00000000        00000000  0000000    000     000      0000000   000   000
###
{ slash, empty, fs, setStyle, post, pos, error, log, str, _ } = require 'kxk'
  
srcmap     = require '../tools/srcmap'
watcher    = require './watcher'
TextEditor = require './texteditor'
syntax     = require './syntax'

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
            fontSize: 18

        @currentFile = null
        @watch       = null

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

        window.navigate.addFilePos
            file: @currentFile
            pos:  @cursorPos()

        [file, fpos] = slash.splitFilePos opt.file
        opt.pos = fpos
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
                if slash.base(file).toLowerCase() == find and file != @currentFile
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
        currext = slash.ext @currentFile

        # log 'jumpToCounterpart', cp, currext, @currentFile
        
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
            when 'ctrl+enter'       then return window.commandline.commands.coffee.executeText @text()
            when 'ctrl+shift+enter' then return window.commandline.commands.coffee.executeTextInMain @text()
            when 'command+alt+up', 'alt+ctrl+up' then return @jumpToCounterpart()
            when 'esc'
                split = window.split
                if split.terminalVisible()
                    split.hideTerminal()
                else if split.commandlineVisible()
                    split.hideCommandline()
                return
        'unhandled'

module.exports = FileEditor

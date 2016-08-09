# 000   000  000  00000000  000   000  0000000     0000000    0000000  00000000
# 000   000  000  000       000 0 000  000   000  000   000  000       000     
#  000 000   000  0000000   000000000  0000000    000000000  0000000   0000000 
#    000     000  000       000   000  000   000  000   000       000  000     
#     0      000  00000000  00     00  0000000    000   000  0000000   00000000
{
title
fileExists,
fileName,
setStyle,
swapExt,
clamp,
last,
sw,
$}        = require '../tools/tools'
prefs     = require '../tools/prefs'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
log       = require '../tools/log'
str       = require '../tools/str'
render    = require './render'
syntax    = require './syntax'
scroll    = require './scroll'
Editor    = require './editor'
_         = require 'lodash'
path      = require 'path'
electron  = require 'electron'
clipboard = electron.clipboard
ipc       = electron.ipcRenderer

class ViewBase extends Editor

    constructor: (viewElem, @config) ->
        
        @clickCount = 0
        
        @name = viewElem
        @name = @name.slice 1 if @name[0] == '.'
        @view = $(viewElem)  
        
        @layers = document.createElement 'div'
        @layers.className = "layers"
        @view.appendChild @layers
        
        @view.onpaste = (event) => log "view on paste #{@name}", event
        @view.onblur  = (event) => @emit 'blur', @
        @view.onfocus = (event) => @emit 'focus', @
        
        layer = []
        layer.push 'selections'
        layer.push 'highlights'
        layer.push 'meta'    if 'Meta'    in @config.features
        layer.push 'lines' 
        layer.push 'cursors'
        layer.push 'numbers' if 'Numbers' in @config.features
        @initLayers layer
        
        @elem = @layerDict.lines
        @diss = []
        @size = {}
        @syntax = new syntax @
        
        @config.lineHeight ?= 1.2
        
        @setFontSize prefs.get "#{@name}FontSize", @fontSizeDefault

        @scroll = new scroll 
            lineHeight: @size.lineHeight
            viewHeight: @viewHeight()
            exposeMax: -5
            
        @scroll.on 'clearLines',  @clearLines
        @scroll.on 'exposeLines', @exposeLines
        @scroll.on 'vanishLines', @vanishLines
        @scroll.on 'exposeLine',  @exposeLine

        @view.onkeydown = @onKeyDown
        @initDrag()    
        
        super
        
        for feature in @config.features
            featureName = feature.toLowerCase()
            featureClss = require "./#{featureName}"
            @[featureName] = new featureClss @                
            
    # 000       0000000   000   000  00000000  00000000    0000000
    # 000      000   000   000 000   000       000   000  000     
    # 000      000000000    00000    0000000   0000000    0000000 
    # 000      000   000     000     000       000   000       000
    # 0000000  000   000     000     00000000  000   000  0000000 
    
    initLayers: (layerClasses) ->
        @layerDict = {}
        for cls in layerClasses
            @layerDict[cls] = @addLayer cls
        
    addLayer: (cls) ->
        div = document.createElement 'div'
        div.className = cls
        @layers.appendChild div
        div
        
    updateLayers: () ->
        @renderHighlights()
        @renderSelection()
        @renderCursors()

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   
    
    setText: (text) ->
        if @syntax.name == 'txt'
            @syntax.name = syntax.shebang text.slice 0, text.search /\r?\n/
        super text
                
    setLines: (lines) ->
        if lines.length == 0
            @scroll.reset() 
        
        lines ?= []
        super lines
        @syntax.clear()      
        if @scroll.viewHeight != @viewHeight()
            @scroll.setViewHeight @viewHeight()
            @emit 'viewHeight', @viewHeight()
        # log "viewbase.setLines #{@lines.length}" if @name == 'editor'
        @scroll.setNumLines @lines.length
        # log "viewbase.setLines #{@lines.length} #{@scroll.exposeTop} #{@scroll.exposeBot}" if @name == 'editor'
        @layers.scrollLeft = 0
        @layersWidth  = @layers.offsetWidth
        @layersHeight = @layers.offsetHeight
        @updateScrollOffset()
        @updateLayers()

    appendText: (text) ->
        
        ts = text?.split /\n/
        for t in ts
            @lines.push t
            @emit 'lineAppended', 
                lineIndex: @lines.length-1
                text: t
        if @scroll.viewHeight != @viewHeight()
            @scroll.setViewHeight @viewHeight()        
        @scroll.setNumLines @lines.length
        @emit  'linesAppended', ts
        @emit 'numLines', @lines.length

    # 00000000   0000000   000   000  000000000
    # 000       000   000  0000  000     000   
    # 000000    000   000  000 0 000     000   
    # 000       000   000  000  0000     000   
    # 000        0000000   000   000     000   

    setFontSize: (fontSize) =>
        @view.style.fontSize = "#{fontSize}px"
        @size.numbersWidth = 'Numbers' in @config.features and 50 or 0
        @size.fontSize     = fontSize
        @size.lineHeight   = Math.floor fontSize * @config.lineHeight
        @size.charWidth    = fontSize * 0.6 
        @size.offsetX      = Math.floor @size.charWidth/2 + @size.numbersWidth
        @size.offsetX      = Math.max @size.offsetX, (@screenSize().width - @screenSize().height) / 2 if @size.centerText

        @scroll?.setLineHeight @size.lineHeight
        
        setStyle '.comment.header', 'border-radius', "#{parseInt fontSize/3}px", 1
        
        @emit 'fontSizeChanged'

    #  0000000  00000000  000   000  000000000  00000000  00000000 
    # 000       000       0000  000     000     000       000   000
    # 000       0000000   000 0 000     000     0000000   0000000  
    # 000       000       000  0000     000     000       000   000
    #  0000000  00000000  000   000     000     00000000  000   000
    
    centerText: (center) ->
        if center
            @size.offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
            @size.offsetX = Math.max @size.offsetX, (@screenSize().width - @screenSize().height) / 2 
            @size.centerText = true
        else
            @size.offsetX = Math.floor @size.charWidth/2 + @size.numbersWidth
            @size.centerText = false
        @updateLinePositions()
        @updateLayers()
    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
  
    changed: (changeInfo, action) ->
        @syntax.changed changeInfo
    
        numChanges = 0   
        changes = _.cloneDeep changeInfo.sorted
        
        oldScrollLines = @scroll.numLines
        
        log "ViewBase.changed changes", changes if @name == 'editor'
        
        changes.sort (a,b) ->
            [na,oa] = [a[0],a[2]]
            [nb,ob] = [b[0],b[2]]
            if a[1] in ['deleted', 'changed'] and b[1] in ['deleted', 'changed']
                if na == nb
                    return ob-oa # delete later lines first
                else
                    return nb-na # delete later lines first
            if oa == ob
                if na==nb
                    order = ['inserted', 'deleted', 'changed']
                    return order.indexOf(a[1]) - order.indexOf(b[1])
                return nb-na # insert later lines first
            else
                return ob-oa
        
        log "ViewBase.changed changes", changes if @name == 'editor'
        
        while (change = changes.shift())
            [li,ch,oi] = change
            switch ch
                when 'changed' 
                    @updateLine li, oi
                    @emit 'lineChanged', li
                when 'deleted'  
                    numChanges -= 1 
                    @deleteLine li, oi
                when 'inserted' 
                    numChanges += 1
                    @insertLine li, oi                    
        
        if changeInfo.inserted.length or changeInfo.deleted.length            
            @scroll.setNumLines @lines.length
            @updateScrollOffset()
            @updateLinePositions()
            @layersWidth = @layers.offsetWidth

        if changeInfo.sorted.length
            @clearHighlights()
        
        if changeInfo.cursors.length
            @renderCursors()
            @scrollCursorIntoView()
            @updateScrollOffset()
            @updateCursorOffset()
            @emit 'cursor'
            
        if changeInfo.selection.length
            @renderSelection()   
            @emit 'selection'
        @emit 'changed', changeInfo, action

    # 00000000  0000000    000  000000000
    # 000       000   000  000     000   
    # 0000000   000   000  000     000   
    # 000       000   000  000     000   
    # 00000000  0000000    000     000   
    
    deleteLine: (li, oi) ->
        return if oi > @scroll.exposeBot
        return if oi < @scroll.exposeTop
        @elem.children[oi - @scroll.exposeTop]?.remove()
        @scroll.deleteLine li, oi
        @emit 'lineDeleted', oi
        
    insertLine: (li, oi) -> 
        return if not @scroll.lineIndexIsInExpose oi
        # log "ViewBase.insertLine li:#{li} oi:#{oi}" if @name == 'editor'
        div = @divForLineAtIndex li
        @elem.insertBefore div, @elem.children[oi - @scroll.exposeTop]
        @scroll.insertLine li, oi
        @emit 'lineInserted', li, oi
        
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000

    exposeLine: (li) =>
        div = @divForLineAtIndex li
        @elem.appendChild div
        
        @emit 'lineExposed',
            lineIndex: li
            lineDiv: div
            
        @renderCursors() if @cursorsInLineAtIndex(li).length
        @renderSelection() if @rangesForLineIndexInRanges(li, @selections).length
        @renderHighlights() if @rangesForLineIndexInRanges(li, @highlights).length
        
    exposeLines: (e) =>
        before = @elem.firstChild
        for li in [e.top..e.bot]
            div = @divForLineAtIndex li
            @elem.insertBefore div, before

        for li in (before? and [e.bot..e.top] or [e.top..e.bot])
            @emit 'lineExposed',
                lineIndex: li
                lineDiv: @elem.children[li-e.top]

        @updateLinePositions()
        @updateLayers()
        @emit 'linesExposed', e

    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    vanishLines: (e) =>
        top = e.top ? 0
        while top
            li = @elem.firstChild.lineIndex
            @elem.firstChild.remove()
            @emit 'lineVanished', lineIndex: li
            top -= 1
        bot = e.bot ? 0
        while bot
            li = @elem.lastChild.lineIndex
            @elem.lastChild.remove()
            @emit 'lineVanished', lineIndex: li
            bot -= 1
        @updateLinePositions()
        @updateLayers()
    
    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    updateLinePositions: () ->
        y = 0
        for c in @elem.children
            c.style.transform = "translate(#{@size.offsetX}px,#{y}px)"
            y += @size.lineHeight
                
    updateLine: (li, oi) ->
        if @scroll.exposeTop <= li < @lines.length
            if (oi - @scroll.exposeTop) < @elem.children.length
                div = @divForLineAtIndex li
                @elem.replaceChild div, @elem.children[oi - @scroll.exposeTop]

    updateLines: () ->
        for li in [@scroll.exposeTop..@scroll.exposeBot]
            @updateLine li, li

    clearHighlights: () ->
        if @highlights.length
            $('.highlights', @layers).innerHTML = ''
            super
   
    hasWordHighlights: () -> @highlights.find (h) -> not h[2]?
    
    # 00000000   00000000  000   000  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  0000000   0000000  
    # 000   000  000       000  0000  000   000  000       000   000
    # 000   000  00000000  000   000  0000000    00000000  000   000

    divForLineAtIndex: (li) ->
        div = render.lineDiv (li-@scroll.exposeTop) * @size.lineHeight, @syntax.getDiss(li), @size
        div.lineIndex = li
        if @showInvisibles
            tx = @lines[li].length * @size.charWidth + 1
            span = document.createElement 'span'
            span.className = "invisible newline"
            span.style.transform = "translate(#{tx}px, -1.5px)"
            span.innerHTML = '&#9687;'
            div.appendChild span
        div
    
    findDivForLineAtIndex: (li) ->
        for i in [@elem.lines.length-1..0]
            return @elem.children[i] if @elem.children[i].lineIndex == li
    
    renderCursors: ->
        cs = []
        for c in @cursors
            if c[1] >= @scroll.exposeTop and c[1] <= @scroll.exposeBot
                cs.push [c[0], c[1] - @scroll.exposeTop]
        
        if @cursors.length == 1
            if cs.length == 1
                ri = @mainCursor[1]-@scroll.exposeTop
                if @mainCursor[0] > @lines[@mainCursor[1]].length
                    cs[0][2] = 'virtual'
                    cs.push [@lines[@mainCursor[1]].length, ri, 'main off']
                else
                    cs[0][2] = 'main off'
        else if @cursors.length > 1
            vc = [] # virtual cursors
            for c in cs
                if @isMainCursor [c[0], c[1] + @scroll.exposeTop]
                    c[2] = 'main'
                if c[0] > @lines[@scroll.exposeTop+c[1]].length
                    vc.push [@lines[@scroll.exposeTop+c[1]].length, c[1], 'virtual']
            cs = cs.concat vc
        html = render.cursors cs, @size
        @layerDict.cursors.innerHTML = html
            
    renderSelection: ->
        h = ""
        s = @selectionsInLineIndexRangeRelativeToLineIndex [@scroll.exposeTop, @scroll.exposeBot], @scroll.exposeTop
        if s
            h += render.selection s, @size
        @layerDict.selections.innerHTML = h

    renderHighlights: ->        
        h = ""
        s = @highlightsInLineIndexRangeRelativeToLineIndex [@scroll.exposeTop, @scroll.exposeBot], @scroll.exposeTop
        if s
            h += render.selection s, @size, "highlight"
        @layerDict.highlights.innerHTML = h

    # 00000000   00000000   0000000  000  0000000  00000000
    # 000   000  000       000       000     000   000     
    # 0000000    0000000   0000000   000    000    0000000 
    # 000   000  000            000  000   000     000     
    # 000   000  00000000  0000000   000  0000000  00000000

    resized: -> 
        vh = @view.clientHeight
        @scroll.setViewHeight vh
        @numbers?.elem.style.height = "#{@scroll.exposeNum * @scroll.lineHeight}px"
        @layers.style.width = "#{sw()-@view.getBoundingClientRect().left-130-6}px"
        @layers.style.height = "#{vh}px"
        @updateScrollOffset()
        @emit 'viewHeight', vh

    screenSize: -> electron.screen.getPrimaryDisplay().workAreaSize
    
    deltaToEnsureCursorsAreVisible: ->
        topdelta = 0
        cl = @cursors[0][1]
        if cl < @scroll.top + 2
            topdelta = Math.max(0, cl - 2) - @scroll.top
        else if cl > @scroll.bot - 4
            topdelta = Math.min(@lines.length+1, cl + 4) - @scroll.bot
        
        botdelta = 0
        cl = last(@cursors)[1]
        if cl < @scroll.top + 2
            botdelta = Math.max(0, cl - 2) - @scroll.top
        else if cl > @scroll.bot - 4
            botdelta = Math.min(@lines.length+1, cl + 4) - @scroll.bot
            
        maindelta = 0
        cl = @mainCursor[1]
        if cl < @scroll.top + 2
            maindelta = Math.max(0, cl - 2) - @scroll.top
        else if cl > @scroll.bot - 4
            maindelta = Math.min(@lines.length+1, cl + 4) - @scroll.bot
            
        maindelta

    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000

    scrollLines: (delta) -> @scrollBy delta * @size.lineHeight

    scrollBy: (delta, x=0) ->        
        # log "scrollBy #{delta}" if @name == 'editor'
        @scroll.by delta if delta
        @layers.scrollLeft += x/2 if x
        @updateScrollOffset()
        
    scrollTo: (p) ->
        # log "scrollTo #{p}" if @name == 'editor'
        @scroll.to p
        @updateScrollOffset()

    scrollCursorToTop: (topDist=7) ->
        cp = @cursorPos()
        if cp[1] - @scroll.top > topDist
            rg = [@scroll.top, Math.max 0, cp[1]-1]
            sl = @selectionsInLineIndexRange rg
            hl = @highlightsInLineIndexRange rg
            if sl.length == 0 == hl.length
                delta = @scroll.lineHeight * (cp[1] - @scroll.top - topDist)
                @scrollBy delta

    scrollCursorIntoView: (topDist=7) ->
        if delta = @deltaToEnsureCursorsAreVisible()
            @scrollBy delta * @size.lineHeight - @scroll.offsetSmooth 
    
    updateScrollOffset: ->        
        if @scroll.offsetTop != @scrollOffsetTop
            @layers.scrollTop = @scroll.offsetTop 
            @scrollOffsetTop = @scroll.offsetTop

    updateCursorOffset: ->
        cx = @mainCursor[0]*@size.charWidth+@size.offsetX
        if cx-@layers.scrollLeft > @layersWidth
            @scroll.offsetLeft = Math.max 0, cx - @layersWidth + @size.charWidth
            @layers.scrollLeft = @scroll.offsetLeft
        else if cx-@size.offsetX-@layers.scrollLeft < 0
            @scroll.offsetLeft = Math.max 0, cx - @size.offsetX
            @layers.scrollLeft = @scroll.offsetLeft
    
    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 

    posAtXY:(x,y) ->

        sl = @layers.scrollLeft
        st = @scroll.offsetTop
        br = @view.getBoundingClientRect()
        lx = clamp 0, @layers.offsetWidth,  x - br.left - @size.offsetX + @size.charWidth/3
        ly = clamp 0, @layers.offsetHeight, y - br.top
        px = parseInt(Math.floor((Math.max(0, sl + lx))/@size.charWidth))
        py = parseInt(Math.floor((Math.max(0, st + ly))/@size.lineHeight)) + @scroll.exposeTop
        p = [px, Math.min(@lines.length-1, py)]
        p
        
    posForEvent: (event) -> @posAtXY event.clientX, event.clientY

    lineElemAtXY:(x,y) -> 
        p = @posAtXY x,y
        ci = p[1]-@scroll.exposeTop
        @layerDict['lines'].children[ci]
        
    lineSpanAtXY:(x,y) ->
        lineElem = @lineElemAtXY x,y        
        if lineElem?
            lr = lineElem.getBoundingClientRect()
            for e in lineElem.children
                br = e.getBoundingClientRect()
                if br.left <= x and br.left+br.width >= x
                    offset = x-br.left
                    info =  
                        span:       e
                        offsetLeft: offset
                        offsetChar: parseInt offset/@size.charWidth
                    return info
        log "not found! #{x} #{y} line #{lineElem?}"
        null

    viewHeight:   -> @scroll?.viewHeight ? @view?.clientHeight 
    numFullLines: -> Math.floor(@viewHeight() / @size.lineHeight)
    
    clearLines: =>
        while lastChild = @elem.lastChild 
            @elem.removeChild lastChild
        @emit 'clearLines'

    clear: => @setLines []
        
    focus: -> @view.focus()

    #   0000000    00000000    0000000    0000000 
    #   000   000  000   000  000   000  000      
    #   000   000  0000000    000000000  000  0000
    #   000   000  000   000  000   000  000   000
    #   0000000    000   000  000   000   0000000 
    
    initDrag: ->
        @drag = new drag
            target:  @layers
            cursor:  'default'
            onStart: (drag, event) =>

                @view.focus()  
                
                eventPos = @posForEvent event
                
                if @clickCount
                    if @isSamePos eventPos, @clickPos
                        @startClickTimer()
                        @clickCount += 1
                        if @clickCount == 2
                            range = @rangeForWordAtPos eventPos
                            if event.metaKey
                                @addRangeToSelection range
                            else
                                @selectSingleRange range
                        if @clickCount == 3
                            r = @rangeForLineAtIndex @clickPos[1]
                            if event.metaKey
                                @addRangeToSelection r
                            else
                                @selectSingleRange r
                        return
                    else
                        @onClickTimeout()
                        
                @clickCount = 1
                @clickPos = eventPos
                @startClickTimer()
                
                p = @posForEvent event
                if event.altKey
                    @jumpTo @wordAtCursor p
                else if event.metaKey
                    @toggleCursorAtPos p
                else
                    @singleCursorAtPos p, event.shiftKey
            
            onMove: (drag, event) => 
                p = @posForEvent event
                if event.metaKey
                    @addCursorAtPos [@mainCursor[0], p[1]]
                else
                    @singleCursorAtPos p, true
                
    startClickTimer: =>
        clearTimeout @clickTimer
        @clickTimer = setTimeout @onClickTimeout, @stickySelection and 300 or 1000
    
    onClickTimeout: => 
        clearTimeout @clickTimer
        @clickCount  = 0
        @clickTimer  = null
        @clickPos    = null
       
    #       000  000   000  00     00  00000000 
    #       000  000   000  000   000  000   000
    #       000  000   000  000000000  00000000 
    # 000   000  000   000  000 0 000  000      
    #  0000000    0000000   000   000  000      
    
    jumpTo: (word, opt) ->
        
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
        
        classes = ipc.sendSync 'indexer', 'classes'
        for clss, info of classes
            if clss.toLowerCase() == find
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
    
    funcInfoAtLineIndex: (li) ->
        files = ipc.sendSync 'indexer', 'files'
        fileInfo = files[@currentFile]
        for func in fileInfo.funcs
            if func[0] <= li <= func[1]
                return func[3] + '.' + func[2] + ' '
        ''
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        
        switch combo
            when 'esc'
                if @salterMode
                    return @setSalterMode false
                if @hasWordHighlights()
                    return @clearHighlights()
                if @cursors.length > 1
                    return @clearCursors()
                if @stickySelection
                    return @endStickySelection()
                if @selections.length
                    return @selectNone()
        'unhandled'

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event
        return if not combo
        return if key == 'right click' # weird right command key

        stop = (event) ->
            event.preventDefault()
            event.stopPropagation()

        if @autocomplete?
            return stop event if 'unhandled' != @autocomplete.handleModKeyComboEvent mod, key, combo, event
        
        if @handleModKeyComboEvent?
            return stop event if 'unhandled' != @handleModKeyComboEvent mod, key, combo, event
            
        switch combo
            when 'command+3'                then return @startSalter()
            when 'command+esc'              then return @startStickySelection()
            when 'tab'                      then return stop event, @insertTab()
            when 'shift+tab'                then return stop event, @deleteTab()
            when 'enter'                    then return @insertNewline indent: true
            when 'command+enter'            then return @moveCursorsToLineBoundary('right') and @insertNewline indent: true
            when 'alt+enter'                then return @jumpTo @wordAtCursor()
            when 'command+]'                then return @indent()
            when 'command+['                then return @deIndent()
            when 'command+j'                then return @joinLines()
            when 'command+/'                then return @toggleComment()
            when 'command+a'                then return @selectAll()
            when 'command+i'                then return @selectInverted()
            when 'command+shift+a'          then return @selectNone()
            when 'command+e'                then return @highlightTextOfSelectionOrWordAtCursor()
            when 'command+d'                then return @highlightWordAndAddToSelection()
            when 'command+shift+d'          then return @removeSelectedHighlight()
            when 'command+alt+d'            then return @selectAllHighlights()
            when 'command+g'                then return @selectNextHighlight()
            when 'command+shift+g'          then return @selectPrevHighlight()
            when 'command+l'                then return @selectMoreLines()
            when 'command+shift+l'          then return @selectLessLines()
            when 'command+c'                then return clipboard.writeText @textOfSelectionForClipboard()
            when 'command+z'                then return @do.undo()
            when 'command+shift+z'          then return @do.redo()
            when 'delete', 'ctrl+backspace' then return @deleteForward()
            when 'backspace', 'command+backspace' then return @deleteBackward ignoreLineBoundary: combo == 'command+backspace'
            when 'command+v'                then return @paste clipboard.readText()
            when 'command+x'   
                @do.start()
                clipboard.writeText @textOfSelectionForClipboard()
                @deleteSelection()
                @do.end()
                return
                
            when 'alt+up',     'alt+down'     then return @moveLines  key
            when 'command+up', 'command+down' then return @addCursors key
            when 'command+alt+up'             then return @jumpToCounterpart()
            when 'ctrl+a',     'ctrl+shift+a' then return @moveCursorsToLineBoundary 'left',  event.shiftKey
            when 'ctrl+e',     'ctrl+shift+e' then return @moveCursorsToLineBoundary 'right', event.shiftKey
            when 'ctrl+shift+right'           then return @alignCursorsAndText()
                
            when 'command+left', 'command+right'   
                if @selections.length > 1 and @cursors.length == 1
                    return @setCursorsAtSelectionBoundary key
                else
                    return @moveCursorsToLineBoundary key
                        
            when 'command+shift+left', 'command+shift+right' then return @moveCursorsToLineBoundary key, true
            when 'command+shift+up',   'command+shift+down'  then return @delCursors    key
            when 'ctrl+shift+up',      'ctrl+shift+down'     then return @addMainCursor key
            when 'alt+ctrl+up', 'alt+ctrl+down', 'alt+ctrl+left', 'alt+ctrl+right'   then return @alignCursors  key
            when 'ctrl+up',     'ctrl+down',     'ctrl+left',      'ctrl+right'      then return @moveMainCursor key
            when 'alt+left',    'alt+right',     'alt+shift+left', 'alt+shift+right' then return @moveCursorsToWordBoundary key, event.shiftKey
            when 'down', 'right', 'up', 'left', 'shift+down', 'shift+right', 'shift+up', 'shift+left' 
                @moveCursors key, event.shiftKey
                stop event
                
        return if mod and not key?.length
        
        switch key
            
            when 'home'      then return @singleCursorAtPos [0, 0],              event.shiftKey
            when 'end'       then return @singleCursorAtPos [0,@lines.length-1], event.shiftKey
            when 'backspace' then return
            when 'page up'
                @moveCursorsUp event.shiftKey, @numFullLines()-3
                return stop event
            when 'page down'
                @moveCursorsDown event.shiftKey, @numFullLines()-3
                return stop event
            
        ansiKeycode = require 'ansi-keycode'
        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
            @insertUserCharacter ansiKeycode event

module.exports = ViewBase

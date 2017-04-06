# 000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000   
#    000     000        000 000      000           000       000   000  000     000     000   000  000   000  
#    000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000    
#    000     000        000 000      000           000       000   000  000     000     000   000  000   000  
#    000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000  
{
title
setStyle,
keyinfo,
prefs,
clamp,
drag,
post,
last,
str,
log,
sw,
$}        = require 'kxk'
render    = require './render'
syntax    = require './syntax'
scroll    = require './scroll'
Editor    = require './editor'
_         = require 'lodash'
path      = require 'path'
electron  = require 'electron'
ipc       = electron.ipcRenderer

class TextEditor extends Editor

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
        @scroll.setNumLines @numLines()
        @layers.scrollLeft = 0
        @layersWidth  = @layers.offsetWidth
        @layersHeight = @layers.offsetHeight
        @updateScrollOffset()
        @updateLayers()

    appendText: (text) ->
        # console.log "appendText #{text} lines:", str @state.lines()
        ls = text?.split /\n/
        for l in ls
            @state = @state.appendLine l
            # console.log 'appendText lines:', str @state.get('lines').toJS()
            @emit 'lineAppended', 
                lineIndex: @numLines()-1
                text:      l
        if @scroll.viewHeight != @viewHeight()
            @scroll.setViewHeight @viewHeight()        
        @scroll.setNumLines @numLines()
        @emit 'linesAppended', ls
        @emit 'numLines', @numLines()

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
    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
  
    changed: (changeInfo) ->
                
        for change in changeInfo.changes
            [di,li,ch] = [change.doIndex, change.newIndex, change.change]
            switch ch
                when 'changed'  then @syntax.diss[di] = @syntax.dissForLineIndex li
                when 'deleted'  then @syntax.diss.splice di, 1
                when 'inserted' then @syntax.diss.splice di, 0, @syntax.dissForLineIndex li

        for change in changeInfo.changes
            [di,li,ch] = [change.doIndex, change.newIndex, change.change]
            switch ch
                when 'changed'
                    @updateLine li, di
                    @emit 'lineChanged', li
                when 'deleted'  
                    @deleteLine li, di
                when 'inserted'
                    @insertLine li, di                    
        
        if changeInfo.inserts or changeInfo.deletes           
            @scroll.setNumLines @numLines()
            @updateScrollOffset()
            @updateLinePositions()
            @layersWidth = @layers.offsetWidth

        if changeInfo.changes.length
            @clearHighlights()
        
        if changeInfo.cursors
            @renderCursors()
            @scrollCursorIntoView()
            @updateScrollOffset()
            @updateCursorOffset()
            @emit 'cursor'
            
        if changeInfo.selects
            @renderSelection()   
            @emit 'selection'
            
        @emit 'changed', changeInfo

    # 00000000  0000000    000  000000000
    # 000       000   000  000     000   
    # 0000000   000   000  000     000   
    # 000       000   000  000     000   
    # 00000000  0000000    000     000   

    updateLine: (li, oi) ->
        oi = li if not oi?
        return if oi > @scroll.exposeBot
        return if oi < @scroll.exposeTop
        if (oi-@scroll.exposeTop) < @elem.children.length
            div = @divForLineAtIndex li
            @elem.replaceChild div, @elem.children[oi - @scroll.exposeTop]
    
    deleteLine: (li, oi) ->
        return if oi > @scroll.exposeBot
        return if oi < @scroll.exposeTop
        @elem.children[oi - @scroll.exposeTop]?.remove()
        @scroll.deleteLine li, oi
        @emit 'lineDeleted', oi
        
    insertLine: (li, oi) -> 
        return if not @scroll.lineIndexIsInExpose oi
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
          
        # this is crap! render only cursors at line! don't get native arrays!  
        @renderCursors() if @positionsForLineIndexInPositions(li, @cursors()).length
        @renderSelection() if @rangesForLineIndexInRanges(li, @selections()).length
        @renderHighlights() if @rangesForLineIndexInRanges(li, @highlights()).length
        
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

    updateLinePositions: (animate=0) ->
        y = 0
        for c in @elem.children
            c.style.transform = "translate(#{@size.offsetX}px,#{y}px)"
            c.style.transition = "all #{animate/1000}s" if animate
            y += @size.lineHeight
            
        if animate
            resetTrans = =>
                for c in @elem.children
                    c.style.transition = 'initial'                            
            setTimeout resetTrans, animate
                
    updateLines: () ->
        for li in [@scroll.exposeTop..@scroll.exposeBot]
            @updateLine li

    clearHighlights: () ->
        if @numHighlights()
            $('.highlights', @layers).innerHTML = ''
            super
       
    # 00000000   00000000  000   000  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  0000000   0000000  
    # 000   000  000       000  0000  000   000  000       000   000
    # 000   000  00000000  000   000  0000000    00000000  000   000

    divForLineAtIndex: (li) ->
        div = render.lineDiv (li-@scroll.exposeTop) * @size.lineHeight, @syntax.getDiss(li), @size
        div.lineIndex = li
        if @showInvisibles
            tx = @line(li).length * @size.charWidth + 1
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
        for c in @cursors()
            if c[1] >= @scroll.exposeTop and c[1] <= @scroll.exposeBot
                cs.push [c[0], c[1] - @scroll.exposeTop]

        if @numCursors() == 1
            if cs.length == 1
                
                if @mainCursor()[1] > @numLines()-1
                    if @name == 'editor'
                        console.log "#{@name}.renderCursors mainCursor DAFUK?", @numLines(), str @mainCursor()
                    return
                    
                ri = @mainCursor()[1]-@scroll.exposeTop
                cursorLine = @state.line(@mainCursor()[1])
                if @mainCursor()[0] > cursorLine.length
                    cs[0][2] = 'virtual'
                    cs.push [cursorLine.length, ri, 'main off']
                else
                    cs[0][2] = 'main off'
        else if @numCursors() > 1
            vc = [] # virtual cursors
            for c in cs
                if @isSamePos @mainCursor(), [c[0], c[1] + @scroll.exposeTop]
                    c[2] = 'main'
                line = @line(@scroll.exposeTop+c[1])
                if c[0] > line.length
                    vc.push [line.length, c[1], 'virtual']
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
        cs = @cursors()
        cl = cs[0][1]
        if cl < @scroll.top + 2
            topdelta = Math.max(0, cl - 2) - @scroll.top
        else if cl > @scroll.bot - 4
            topdelta = Math.min(@numLines()+1, cl + 4) - @scroll.bot
        
        botdelta = 0
        cl = last(cs)[1]
        if cl < @scroll.top + 2
            botdelta = Math.max(0, cl - 2) - @scroll.top
        else if cl > @scroll.bot - 4
            botdelta = Math.min(@numLines()+1, cl + 4) - @scroll.bot
            
        maindelta = 0
        cl = @mainCursor()[1]
        if cl < @scroll.top + 2
            maindelta = Math.max(0, cl - 2) - @scroll.top
        else if cl > @scroll.bot - 4
            maindelta = Math.min(@numLines()+1, cl + 4) - @scroll.bot
            
        maindelta

    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000

    scrollLines: (delta) -> @scrollBy delta * @size.lineHeight

    scrollBy: (delta, x=0) ->        
        @scroll.by delta if delta
        @layers.scrollLeft += x/2 if x
        @updateScrollOffset()
        
    scrollTo: (p) ->
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
        cx = @mainCursor()[0]*@size.charWidth+@size.offsetX
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
        p = [px, Math.min(@numLines()-1, py)]
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
                    post.emit 'jumpTo', @wordAtCursor p
                else if event.metaKey
                    @toggleCursorAtPos p
                else
                    @singleCursorAtPos p, extend:event.shiftKey
            
            onMove: (drag, event) => 
                p = @posForEvent event
                if event.metaKey
                    @addCursorAtPos [@mainCursor()[0], p[1]]
                else
                    @singleCursorAtPos p, extend:true
                
    startClickTimer: =>
        clearTimeout @clickTimer
        @clickTimer = setTimeout @onClickTimeout, @stickySelection and 300 or 1000
    
    onClickTimeout: => 
        clearTimeout @clickTimer
        @clickCount  = 0
        @clickTimer  = null
        @clickPos    = null
           
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
                if @numHighlights()
                    return @clearHighlights()
                if @numCursors() > 1
                    return @clearCursors()
                if @stickySelection
                    return @endStickySelection()
                if @numSelections()
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
            when 'enter'                    then return @insertCharacter '\n'
            when 'command+enter'            then return @moveCursorsToLineBoundary('right') and @insertNewline indent: true
            when 'alt+enter'                then return post.emit 'jumpTo', @wordAtCursor()
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
            when 'command+alt+b'            then return @selectSurround()
            when 'command+alt+ctrl+b'       then return @selectBetweenSurround()
            when 'command+g'                then return @selectNextHighlight()
            when 'command+shift+g'          then return @selectPrevHighlight()
            when 'command+l'                then return @selectMoreLines()
            when 'command+shift+l'          then return @selectLessLines()
            when 'command+z'                then return @do.undo()
            when 'command+shift+z'          then return @do.redo()
            when 'delete', 'ctrl+backspace' then return @deleteForward()
            when 'backspace'                then return @deleteBackward()
            when 'command+backspace'        then return @deleteBackward ignoreLineBoundary: true
            when 'alt+backspace'            then return @deleteBackward ignoreTabBoundary:  true
            when 'shift+backspace'          then return @deleteBackward singleCharacter:    true
            when 'command+x'                then return @cut()
            when 'command+c'                then return @copy()
            when 'command+v'                then return @paste()
                
            when 'alt+shift+up', 'alt+shift+down' then return @duplicateLines  key
            when 'alt+up',       'alt+down'       then return @moveLines  key
            when 'command+up',   'command+down'   then return @addCursors key
            when 'ctrl+a',       'ctrl+shift+a'   then return @moveCursorsToLineBoundary 'left',  event.shiftKey
            when 'ctrl+e',       'ctrl+shift+e'   then return @moveCursorsToLineBoundary 'right', event.shiftKey
            when 'ctrl+k'                         then return @deleteToEndOfLine()                
            when 'command+left', 'command+right'  then return @setOrMoveCursorsAtBoundary key
                        
            when 'command+shift+left', 'command+shift+right' then return @moveCursorsToLineBoundary key, true
            when 'command+shift+up',   'command+shift+down'  then return @delCursors    key
            when 'alt+ctrl+shift+right'                      then return @alignCursorsAndText()
            when 'alt+ctrl+up',   'alt+ctrl+down',   'alt+ctrl+left',   'alt+ctrl+right'   then return @alignCursors  key
            when 'ctrl+up',       'ctrl+down',       'ctrl+left',       'ctrl+right'       then return @moveMainCursor key
            when 'ctrl+shift+up', 'ctrl+shift+down', 'ctrl+shift+left', 'ctrl+shift+right' then return @moveMainCursor key, erase: true
            when 'alt+left',       'alt+right',      'alt+shift+left',  'alt+shift+right'  then return @moveCursorsToWordBoundary key, event.shiftKey
            when 'down', 'right', 'up', 'left', 'shift+down', 'shift+right', 'shift+up', 'shift+left' 
                @moveCursors key, event.shiftKey
                stop event
        
        # log 'combo', combo
        
        return if mod and not key?.length
        
        switch key
            
            when 'home'      then return @singleCursorAtPos [0, 0],            event.shiftKey
            when 'end'       then return @singleCursorAtPos [0,@numLines()-1], event.shiftKey
            when 'backspace' then return
            when 'page up'
                @moveCursorsUp event.shiftKey, @numFullLines()-3
                return stop event
            when 'page down'
                @moveCursorsDown event.shiftKey, @numFullLines()-3
                return stop event
            
        ansiKeycode = require 'ansi-keycode'
        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
            @insertCharacter ansiKeycode event

module.exports = TextEditor


# 000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
#    000     000        000 000      000           000       000   000  000     000     000   000  000   000
#    000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
#    000     000        000 000      000           000       000   000  000     000     000   000  000   000
#    000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000

{ fileExists, keyinfo, stopEvent, setStyle,
  prefs, drag, elem, path, post, clamp, pos, str, error, log, sw, $, _
}            = require 'kxk'
render       = require './render'
syntax       = require './syntax'
EditorScroll = require './editorscroll'
Editor       = require './editor'
electron     = require 'electron'

class TextEditor extends Editor

    constructor: (viewElem, @config) ->

        @clickCount = 0

        @name = viewElem
        @name = @name.slice 1 if @name[0] == '.'
        @view =$ viewElem

        @layers      = elem class: "layers"
        @layerScroll = elem class: "layerScroll", child: @layers
        @view.appendChild @layerScroll

        layer = []
        layer.push 'selections'
        layer.push 'highlights'
        layer.push 'meta'    if 'Meta' in @config.features
        layer.push 'lines'
        layer.push 'cursors'
        layer.push 'numbers' if 'Numbers' in @config.features
        @initLayers layer

        @size   = {}
        @elem   = @layerDict.lines
        @syntax = new syntax @

        @spanCache = [] # cache for rendered line spans
        @lineDivs  = {} # maps line numbers to displayed divs

        @config.lineHeight ?= 1.2

        @setFontSize prefs.get "#{@name}FontSize", @fontSizeDefault

        @scroll = new EditorScroll @
        @scroll.on 'shiftLines', @shiftLines
        @scroll.on 'showLines',  @showLines

        @view.addEventListener 'blur',     @onBlur
        @view.addEventListener 'focus',    @onFocus
        @view.addEventListener 'keydown',  @onKeyDown

        @initDrag()

        super

        for feature in @config.features
            featureName = feature.toLowerCase()
            featureClss = require "./#{featureName}"
            @[featureName] = new featureClss @

        if @minimap? then post.on 'schemeChanged', @onSchemeChanged

    # 0000000    00000000  000
    # 000   000  000       000
    # 000   000  0000000   000
    # 000   000  000       000
    # 0000000    00000000  0000000

    del: ->

        if @minimap? then post.removeListener 'schemeChanged', @onSchemeChanged

        @syntax.del()
        @scrollbar?.del()

        @view.removeEventListener 'keydown', @onKeyDown
        @view.removeEventListener 'blur',    @onBlur
        @view.removeEventListener 'focus',   @onFocus
        @view.innerHTML = ''

        super

    # 00000000   0000000    0000000  000   000   0000000
    # 000       000   000  000       000   000  000
    # 000000    000   000  000       000   000  0000000
    # 000       000   000  000       000   000       000
    # 000        0000000    0000000   0000000   0000000

    onFocus: =>

        @startBlink()
        @emit 'focus', @
        post.emit 'editorFocus', @

    onBlur: =>

        @stopBlink()
        @emit 'blur', @

    onSchemeChanged: =>

        updateMinimap = => @minimap?.drawLines()
        setTimeout updateMinimap, 10

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

        div = elem class: cls
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

    # 000      000  000   000  00000000   0000000  
    # 000      000  0000  000  000       000       
    # 000      000  000 0 000  0000000   0000000   
    # 000      000  000  0000  000            000  
    # 0000000  000  000   000  00000000  0000000   
    
    setLines: (lines) ->

        @clearLines()

        lines ?= []

        @spanCache = []
        @lineDivs  = {}
        @syntax.clear()

        super lines

        @scroll.reset()

        viewHeight = @viewHeight()
        if @scroll.viewHeight != viewHeight
            @scroll.setViewHeight viewHeight
            @emit 'viewHeight', viewHeight

        @scroll.setNumLines @numLines()

        @layerScroll.scrollLeft = 0
        @layersWidth  = @layerScroll.offsetWidth
        @layersHeight = @layerScroll.offsetHeight

        @updateLayers()

    #  0000000   00000000   00000000   00000000  000   000  0000000    
    # 000   000  000   000  000   000  000       0000  000  000   000  
    # 000000000  00000000   00000000   0000000   000 0 000  000   000  
    # 000   000  000        000        000       000  0000  000   000  
    # 000   000  000        000        00000000  000   000  0000000    
    
    appendText: (text) ->

        if not text?
            console.log "#{@name}.appendText - no text?"
            return

        appended = []
        ls = text?.split /\n/

        for l in ls
            @state = @state.appendLine l
            appended.push @numLines()-1

        if @scroll.viewHeight != @viewHeight()
            @scroll.setViewHeight @viewHeight()

        showLines = (@scroll.bot < @scroll.top) or (@scroll.bot < @scroll.viewLines)

        @scroll.setNumLines @numLines(), showLines:showLines

        for li in appended
            @emit 'lineAppended',
                lineIndex: li
                text: @line li

        @emit 'linesAppended', ls
        @emit 'numLines', @numLines()

    # 00000000   0000000   000   000  000000000
    # 000       000   000  0000  000     000
    # 000000    000   000  000 0 000     000
    # 000       000   000  000  0000     000
    # 000        0000000   000   000     000

    setFontSize: (fontSize) =>

        @layers.style.fontSize = "#{fontSize}px"
        @size.numbersWidth = 'Numbers' in @config.features and 50 or 0
        @size.fontSize     = fontSize
        @size.lineHeight   = Math.floor fontSize * @config.lineHeight
        @size.charWidth    = fontSize * 0.6
        @size.offsetX      = Math.floor @size.charWidth/2 + @size.numbersWidth
        @size.offsetX      = Math.max @size.offsetX, (@screenSize().width - @screenSize().height) / 2 if @size.centerText

        @scroll?.setLineHeight @size.lineHeight

        setStyle '.comment.header', 'border-radius', "#{parseInt fontSize/3}px", 2

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
                    @spanCache = @spanCache.slice 0, di
                    @emit 'lineDeleted', di
                    
                when 'inserted'
                    @spanCache = @spanCache.slice 0, di
                    @emit 'lineInserted', li, di

        if changeInfo.inserts or changeInfo.deletes
            @layersWidth = @layerScroll.offsetWidth
            @scroll.setNumLines @numLines()
            @updateLinePositions()

        if changeInfo.changes.length
            @clearHighlights()

        if changeInfo.cursors
            @renderCursors()
            @scroll.cursorIntoView()
            @emit 'cursor'
            @suspendBlink()

        if changeInfo.selects
            @renderSelection()
            @emit 'selection'

        @emit 'changed', changeInfo

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    updateLine: (li, oi) ->

        oi = li if not oi?

        if li < @scroll.top or li > @scroll.bot
            error "dangling line div? #{li}", @lineDivs[li] if @lineDivs[li]?
            delete @spanCache[li]
            return
            
        return error "updateLine - out of bounds? li #{li} oi #{oi}" if not @lineDivs[oi]

        @spanCache[li] = render.lineSpan @syntax.getDiss(li), @size

        div = @lineDivs[oi]
        div.replaceChild @spanCache[li], div.firstChild
        
    #  0000000  000   000   0000000   000   000     000      000  000   000  00000000   0000000
    # 000       000   000  000   000  000 0 000     000      000  0000  000  000       000
    # 0000000   000000000  000   000  000000000     000      000  000 0 000  0000000   0000000
    #      000  000   000  000   000  000   000     000      000  000  0000  000            000
    # 0000000   000   000   0000000   00     00     0000000  000  000   000  00000000  0000000

    showLines: (top, bot, num) =>
        
        @lineDivs = {}
        @elem.innerHTML = ''

        for li in [top..bot]
            @appendLine li

        @updateLinePositions()
        @updateLayers()
        @emit 'linesExposed', top:top, bot:bot, num:num
        @emit 'linesShown', top, bot, num

    appendLine: (li) ->

        @lineDivs[li] = elem class: 'line'
        @lineDivs[li].appendChild @cachedSpan li
        @elem.appendChild @lineDivs[li]

    #  0000000  000   000  000  00000000  000000000     000      000  000   000  00000000   0000000
    # 000       000   000  000  000          000        000      000  0000  000  000       000
    # 0000000   000000000  000  000000       000        000      000  000 0 000  0000000   0000000
    #      000  000   000  000  000          000        000      000  000  0000  000            000
    # 0000000   000   000  000  000          000        0000000  000  000   000  00000000  0000000

    shiftLines: (top, bot, num) =>
        
        oldTop = top - num
        oldBot = bot - num

        divInto = (li,lo) =>

            if not @lineDivs[lo]
                console.log "#{@name}.shiftLines.divInto - no div? #{top} #{bot} #{num} old #{oldTop} #{oldBot} lo #{lo} li #{li}"
                return

            @lineDivs[li] = @lineDivs[lo]
            delete @lineDivs[lo]
            @lineDivs[li].replaceChild @cachedSpan(li), @lineDivs[li].firstChild

            if @showInvisibles
                tx = @line(li).length * @size.charWidth + 1
                span = elem 'span', class: "invisible newline", html: '&#9687'
                span.style.transform = "translate(#{tx}px, -1.5px)"
                @lineDivs[li].appendChild span

        if num > 0
            while oldBot < bot
                oldBot += 1
                divInto oldBot, oldTop
                oldTop += 1
        else
            while oldTop > top
                oldTop -= 1
                divInto oldTop, oldBot
                oldBot -= 1

        @emit 'linesShifted', top, bot, num

        @updateLinePositions()
        @updateLayers()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    updateLinePositions: (animate=0) ->
        
        for li, div of @lineDivs
            return error 'no div?' if not div?
            y = @size.lineHeight * (li - @scroll.top)
            div.style.transform = "translate3d(#{@size.offsetX}px,#{y}px, 0)"
            div.style.transition = "all #{animate/1000}s" if animate
            div.style.zIndex = li

        if animate
            resetTrans = =>
                for c in @elem.children
                    c.style.transition = 'initial'
            setTimeout resetTrans, animate

    updateLines: () ->

        for li in [@scroll.top..@scroll.bot]
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

    cachedSpan: (li) ->

        if not @spanCache[li]

            @spanCache[li] = render.lineSpan @syntax.getDiss(li), @size

        @spanCache[li]

    renderCursors: ->

        cs = []
        for c in @cursors()
            if c[1] >= @scroll.top and c[1] <= @scroll.bot
                cs.push [c[0], c[1] - @scroll.top]

        if @numCursors() == 1

            if cs.length == 1

                mc = @mainCursor()

                return if mc[1] < 0

                if mc[1] > @numLines()-1
                    return error "#{@name}.renderCursors mainCursor DAFUK?", @numLines(), str @mainCursor()

                ri = mc[1]-@scroll.top
                cursorLine = @state.line(mc[1])
                return error 'no main cursor line?' if not cursorLine?
                if mc[0] > cursorLine.length
                    cs[0][2] = 'virtual'
                    cs.push [cursorLine.length, ri, 'main off']
                else
                    cs[0][2] = 'main off'

        else if @numCursors() > 1

            vc = [] # virtual cursors
            for c in cs
                if isSamePos @mainCursor(), [c[0], c[1] + @scroll.top]
                    c[2] = 'main'
                line = @line(@scroll.top+c[1])
                if c[0] > line.length
                    vc.push [line.length, c[1], 'virtual']
            cs = cs.concat vc

        html = render.cursors cs, @size
        @layerDict.cursors.innerHTML = html

    renderSelection: ->

        h = ""
        s = @selectionsInLineIndexRangeRelativeToLineIndex [@scroll.top, @scroll.bot], @scroll.top
        if s
            h += render.selection s, @size
        @layerDict.selections.innerHTML = h

    renderHighlights: ->

        h = ""
        s = @highlightsInLineIndexRangeRelativeToLineIndex [@scroll.top, @scroll.bot], @scroll.top
        if s
            h += render.selection s, @size, "highlight"
        @layerDict.highlights.innerHTML = h

    # 0000000    000      000  000   000  000   000
    # 000   000  000      000  0000  000  000  000
    # 0000000    000      000  000 0 000  0000000
    # 000   000  000      000  000  0000  000  000
    # 0000000    0000000  000  000   000  000   000

    cursorDiv: -> $ '.cursor.main', @layerDict['cursors']

    suspendBlink: ->

        @cursorDiv()?.classList.toggle 'blink', false
        clearTimeout @suspendTimer
        @suspendTimer = setTimeout @releaseBlink, 600

    releaseBlink: =>

        clearTimeout @suspendTimer
        delete @suspendTimer

    toggleBlink: ->

        @stopBlink()
        prefs.set 'blink', not prefs.get 'blink', true
        @startBlink()

    doBlink: =>

        return if @suspendTimer? or not prefs.get 'blink'
        @blink = not @blink
        @cursorDiv()?.classList.toggle 'blink', @blink
        @minimap?.drawMainCursor @blink

    startBlink: ->

        return if not prefs.get 'blink'
        clearInterval @blinkTimer
        @blinkTimer = setInterval @doBlink, 400

    stopBlink: ->

        @cursorDiv()?.classList.toggle 'blink', false
        clearInterval @blinkTimer
        delete @blinkTimer

    # 00000000   00000000   0000000  000  0000000  00000000
    # 000   000  000       000       000     000   000
    # 0000000    0000000   0000000   000    000    0000000
    # 000   000  000            000  000   000     000
    # 000   000  00000000  0000000   000  0000000  00000000

    resized: ->

        vh = @view.clientHeight

        return if vh == @scroll.viewHeight

        @numbers?.elem.style.height = "#{@scroll.exposeNum * @scroll.lineHeight}px"
        @layersWidth = @layerScroll.offsetWidth

        @scroll.setViewHeight vh

        @emit 'viewHeight', vh

    screenSize: -> electron.screen.getPrimaryDisplay().workAreaSize

    # 00000000    0000000    0000000
    # 000   000  000   000  000
    # 00000000   000   000  0000000
    # 000        000   000       000
    # 000         0000000   0000000

    posAtXY:(x,y) ->

        sl = @layerScroll.scrollLeft
        st = @scroll.offsetTop
        br = @view.getBoundingClientRect()
        lx = clamp 0, @layers.offsetWidth,  x - br.left - @size.offsetX + @size.charWidth/3
        ly = clamp 0, @layers.offsetHeight, y - br.top
        px = parseInt(Math.floor((Math.max(0, sl + lx))/@size.charWidth))
        py = parseInt(Math.floor((Math.max(0, st + ly))/@size.lineHeight)) + @scroll.top
        p = [px, Math.min(@numLines()-1, py)]
        p

    posForEvent: (event) -> @posAtXY event.clientX, event.clientY

    lineElemAtXY:(x,y) ->

        p = @posAtXY x,y
        ci = p[1]-@scroll.top
        @layerDict['lines'].children[ci]

    lineSpanAtXY:(x,y) ->

        if lineElem = @lineElemAtXY x,y
            lr = lineElem.getBoundingClientRect()
            for e in lineElem.firstChild.children
                br = e.getBoundingClientRect()
                if br.left <= x <= br.left+br.width
                    offset = x-br.left
                    return span: e, offsetLeft: offset, offsetChar: parseInt offset/@size.charWidth
        null

    numFullLines: -> Math.floor(@viewHeight() / @size.lineHeight)
    
    viewHeight: -> 
        
        if @scroll?.viewHeight >= 0 then return @scroll.viewHeight
        @view?.clientHeight

    clearLines: =>

        @elem.innerHTML = ''
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
            target:  @layerScroll
            cursor:  'default'
            onStart: (drag, event) =>

                @view.focus()

                eventPos = @posForEvent event

                if @clickCount
                    if isSamePos eventPos, @clickPos
                        @startClickTimer()
                        @clickCount += 1
                        if @clickCount == 2
                            range = @rangeForWordAtPos eventPos
                            if event.metaKey or @stickySelection
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
                @clickAtPos p, event

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

        files = post.get 'indexer', 'files', @currentFile
        fileInfo = files[@currentFile]
        for func in fileInfo.funcs
            if func.line <= li <= func.last
                return func.class + '.' + func.name + ' '
        ''

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    clickAtPos: (p, event) ->

        if event.altKey
            @jumpToWordAtPos p
        else if event.metaKey
            @toggleCursorAtPos p
        else
            @singleCursorAtPos p, extend:event.shiftKey

    # 000   000  00000000  000   000
    # 000  000   000        000 000
    # 0000000    0000000     00000
    # 000  000   000          000
    # 000   000  00000000     000

    handleModKeyComboCharEvent: (mod, key, combo, char, event) ->

        if @autocomplete?
            return if 'unhandled' != @autocomplete.handleModKeyComboEvent mod, key, combo, event

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

        for action in Editor.actions
            if action.combos?
                combos = action.combos
            else combos = [action.combo]
            for actionCombo in combos
                if combo == actionCombo
                    if action.key? and _.isFunction @[action.key]
                        @[action.key] key, combo: combo, mod: mod, event: event
                        return

        switch combo
            when 'command+z'       then return @do.undo()
            when 'command+shift+z' then return @do.redo()
            when 'command+t'       then return post.emit 'newTabWithFile'

        if char and mod in ["shift", ""]
            return @insertCharacter char

        'unhandled'

    onKeyDown: (event) =>

        {mod, key, combo, char} = keyinfo.forEvent event

        # log mod, key, combo, char

        return if not combo
        return if key == 'right click' # weird right command key

        result = @handleModKeyComboCharEvent mod, key, combo, char, event

        if 'unhandled' != result
            stopEvent event

    log: ->
        # return if @name != 'objecteditor'
        return if @name != 'editor'
        log.slog.depth = 3
        log.apply log, [].splice.call arguments, 0
        log.slog.depth = 2
        # console.log.apply console, [].splice.call arguments, 0

module.exports = TextEditor

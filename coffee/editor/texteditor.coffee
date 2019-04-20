###
000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000
###

{ keyinfo, stopEvent, setStyle, slash, prefs, drag, empty, elem, post, clamp, pos, str, sw, os, error, log, $, _ } = require 'kxk' 
  
render       = require './render'
EditorScroll = require './editorscroll'
Editor       = require './editor'
jsbeauty     = require 'js-beautify'
electron     = require 'electron'

class TextEditor extends Editor

    constructor: (viewElem, config) ->

        name = viewElem
        name = name.slice 1 if name[0] == '.'

        super name, config

        @clickCount = 0

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

        @size = {}
        @elem = @layerDict.lines

        @spanCache = [] # cache for rendered line spans
        @lineDivs  = {} # maps line numbers to displayed divs

        @config.lineHeight ?= 1.2

        @setFontSize prefs.get "#{@name}FontSize", @config.fontSize ? 19
        @scroll = new EditorScroll @
        @scroll.on 'shiftLines', @shiftLines
        @scroll.on 'showLines',  @showLines

        @view.addEventListener 'blur',     @onBlur
        @view.addEventListener 'focus',    @onFocus
        @view.addEventListener 'keydown',  @onKeyDown

        @initDrag()        

        for feature in @config.features
            if feature == 'CursorLine'
                @cursorLine = elem 'div', class:'cursor-line'
            else
                featureName = feature.toLowerCase()
                featureClss = require "./#{featureName}"
                @[featureName] = new featureClss @

        post.on 'schemeChanged', @onSchemeChanged

    # 0000000    00000000  000
    # 000   000  000       000
    # 000   000  0000000   000
    # 000   000  000       000
    # 0000000    00000000  0000000

    del: ->

        post.removeListener 'schemeChanged', @onSchemeChanged
        
        @scrollbar?.del()

        @view.removeEventListener 'keydown', @onKeyDown
        @view.removeEventListener 'blur',    @onBlur
        @view.removeEventListener 'focus',   @onFocus
        @view.innerHTML = ''

        super()

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

        @syntax?.schemeChanged()
        if @minimap
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

        super lines

        @scroll.reset()

        viewHeight = @viewHeight()
        
        @scroll.start viewHeight, @numLines()

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

        @emit 'fontSizeChanged'

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) ->

        @syntax.changed changeInfo

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
        
    refreshLines: (top, bot) ->
        for li in [top..bot]
            @syntax.getDiss li, true
            @updateLine li
        
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
            if not div? or not div.style?
                return error 'no div?', div?
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
            super()

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
                
        mc = @mainCursor()

        if @numCursors() == 1

            if cs.length == 1

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
        
        ty = (mc[1] - @scroll.top) * @size.lineHeight
        
        if @cursorLine
            @cursorLine.style = "z-index:0;transform:translate3d(0,#{ty}px,0); height:#{@size.lineHeight}px;width:100%;"
            @layers.insertBefore @cursorLine, @layers.firstChild

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

        return if not @blinkTimer
        @stopBlink()
        @cursorDiv()?.classList.toggle 'blink', false
        clearTimeout @suspendTimer
        blinkDelay = prefs.get 'cursorBlinkDelay', [800,200]
        @suspendTimer = setTimeout @releaseBlink, blinkDelay[0]

    releaseBlink: =>

        clearTimeout @suspendTimer
        delete @suspendTimer
        @startBlink()

    toggleBlink: ->

        blink = not prefs.get 'blink', false
        prefs.set 'blink', blink
        if blink
            @startBlink()
        else
            @stopBlink()

    doBlink: =>

        @blink = not @blink
        
        @cursorDiv()?.classList.toggle 'blink', @blink
        @minimap?.drawMainCursor @blink
        
        clearTimeout @blinkTimer
        blinkDelay = prefs.get 'cursorBlinkDelay', [800,200]
        @blinkTimer = setTimeout @doBlink, @blink and blinkDelay[1] or blinkDelay[0]

    startBlink: -> 
    
        if not @blinkTimer and prefs.get 'blink'
            @doBlink() 

    stopBlink: ->

        @cursorDiv()?.classList.toggle 'blink', false
        
        clearTimeout @blinkTimer
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
        p  = [px, Math.min(@numLines()-1, py)]
        p

    posForEvent: (event) -> @posAtXY event.clientX, event.clientY

    lineElemAtXY:(x,y) ->

        p = @posAtXY x,y
        @lineDivs[p[1]]

    lineSpanAtXY:(x,y) ->
        
        if lineElem = @lineElemAtXY x,y
            lr = lineElem.getBoundingClientRect()
            for e in lineElem.firstChild.children
                br = e.getBoundingClientRect()
                if br.left <= x <= br.left+br.width
                    offset = x-br.left
                    return span: e, offsetLeft: offset, offsetChar: parseInt offset/@size.charWidth
        null

    # numFullLines: -> Math.floor(@viewHeight() / @size.lineHeight)
    numFullLines: -> @scroll.fullLines
    
    viewHeight: -> 
        
        if @scroll?.viewHeight >= 0 then return @scroll.viewHeight
        @view?.clientHeight

    clearLines: =>

        @elem.innerHTML = ''
        @emit 'clearLines'

    clear: => 
        # log 'TextEditor.clear', @name
        @setLines []

    focus: -> @view.focus()

    #   0000000    00000000    0000000    0000000
    #   000   000  000   000  000   000  000
    #   000   000  0000000    000000000  000  0000
    #   000   000  000   000  000   000  000   000
    #   0000000    000   000  000   000   0000000

    initDrag: ->

        @drag = new drag
            target:  @layerScroll

            onStart: (drag, event) =>
                
                @view.focus()
                    
                eventPos = @posForEvent event

                if event.button == 2
                    return 'skip'
                else if event.button == 1
                    if not @jumpToFileAtPos eventPos
                        @jumpToWordAtPos eventPos
                    stopEvent event
                    return 'skip'
                
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

            onStop: =>
                @selectNone() if @numSelections() and empty @textOfSelection()
                    
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
            @toggleCursorAtPos p
        else if event.metaKey or event.ctrlKey
            @jumpToWordAtPos p
        else
            # if event.ctrlKey
                # @log jsbeauty.html_beautify @lineDivs[p[1]].firstChild.innerHTML, indent_size:2 , preserve_newlines:false, wrap_line_length:200, unformatted: []
                # @log @line p[1]
                # @syntax.newDiss p[1]
            @singleCursorAtPos p, extend:event.shiftKey

    # 000   000  00000000  000   000
    # 000  000   000        000 000
    # 0000000    0000000     00000
    # 000  000   000          000
    # 000   000  00000000     000

    handleModKeyComboCharEvent: (mod, key, combo, char, event) ->
        
        # log "TextEditor.handleModKeyComboCharEvent mod:#{mod} key:#{key} combo:#{combo} char:#{char} event:#{event}"

        if @autocomplete?
            return if 'unhandled' != @autocomplete.handleModKeyComboEvent mod, key, combo, event

        switch combo
            
            when 'backspace' then return 'unhandled' # has char set on windows?
            
            when 'esc'
                if @salterMode          then return @setSalterMode false
                if @numHighlights()     then return @clearHighlights()
                if @numCursors() > 1    then return @clearCursors()
                if @stickySelection     then return @endStickySelection()
                if @numSelections()     then return @selectNone()
            
            when 'command+enter', 'ctrl+enter','f12' then @jumpToWord()

        for action in Editor.actions
            
            if action.combo == combo or action.accel == combo
                switch combo
                    when 'ctrl+a', 'command+a' then return @selectAll()
                # log "unhandled on combo? #{combo}"
                return 'unhandled'
                
            if action.accels? and os.platform() != 'darwin'
                for actionCombo in action.accels
                    if combo == actionCombo
                        if action.key? and _.isFunction @[action.key]
                            @[action.key] key, combo: combo, mod: mod, event: event
                            return
                
            continue if not action.combos?
            
            for actionCombo in action.combos
                if combo == actionCombo
                    if action.key? and _.isFunction @[action.key]
                        @[action.key] key, combo: combo, mod: mod, event: event
                        return

        if char and mod in ["shift", ""]
            
            return @insertCharacter char

        # log "TextEditor.handleModKeyComboCharEvent unhandled combo:#{combo}"

        'unhandled'

    onKeyDown: (event) =>

        { mod, key, combo, char } = keyinfo.forEvent event

        return if not combo
        return if key == 'right click' # weird right command key

        result = @handleModKeyComboCharEvent mod, key, combo, char, event

        # log 'textEditor.onKeyDown', key, combo, 'unhandled' != result
        
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

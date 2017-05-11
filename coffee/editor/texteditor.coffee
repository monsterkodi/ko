
# 000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000   
#    000     000        000 000      000           000       000   000  000     000     000   000  000   000  
#    000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000    
#    000     000        000 000      000           000       000   000  000     000     000   000  000   000  
#    000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000  

{ fileExists, resolve, keyinfo, stopEvent, setStyle, 
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
        @lineDivs  = {} #  maps line numbers to displayed divs
        
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
            
    del: ->
        
        if @minimap? then post.removeListener 'schemeChanged', @onSchemeChanged

        @syntax.del()
        @scrollbar?.del()    
        
        @view.removeEventListener 'keydown', @onKeyDown
        @view.removeEventListener 'blur',    @onBlur
        @view.removeEventListener 'focus',   @onFocus
        @view.innerHTML = ''
    
    onBlur: => 
        
        @stopBlink()
        @emit 'blur', @    
    
    onFocus: => 
        
        @startBlink()
        @emit 'focus', @
        post.emit 'editorFocus', @
        
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
                
    setLines: (lines) ->
                
        lines ?= []
        
        @spanCache = []
        @lineDivs = {}
        
        @syntax.clear() 
        @scroll.reset()
        
        super lines        
        
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

        return error 'no text?' if not text?

        appended = []
        ls = text?.split /\n/
        
        for l in ls
            @state = @state.appendLine l
            appended.push @numLines()-1
                
        if @scroll.viewHeight != @viewHeight()
            @scroll.setViewHeight @viewHeight()
            
        @scroll.setNumLines @numLines()

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
                    @deleteLine di
                when 'inserted'
                    @insertLine li, di                    
        
        if changeInfo.inserts or changeInfo.deletes           
            @scroll.setNumLines @numLines()
            @layersWidth = @layers.offsetWidth
            @updateScrollOffset()
            @updateLinePositions()

        if changeInfo.changes.length
            @clearHighlights()
        
        if changeInfo.cursors
            @renderCursors()
            @scrollCursorIntoView()
            @updateScrollOffset()
            @updateCursorOffset()
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
        return if li < @scroll.top
        return if li > @scroll.bot
        return error "updateLine - out of bounds? li #{li} oi #{oi}" if not @lineDivs[oi]
        div = @lineDivs[oi]
        @spanCache[li] = render.lineSpan @syntax.getDiss(li), @size
        div.replaceChild @spanCache[li], div.firstChild
    
    # 0000000    00000000  000      00000000  000000000  00000000  
    # 000   000  000       000      000          000     000       
    # 000   000  0000000   000      0000000      000     0000000   
    # 000   000  000       000      000          000     000       
    # 0000000    00000000  0000000  00000000     000     00000000  
    
    deleteLine: (li) ->
        
        @log '---------- deleteLine', li
        return if li < @scroll.top
        return if li > @scroll.bot
        return error "deleteLine - out of bounds? li #{li}" if not @lineDivs[li]
        
        @lineDivs[li].remove()
        
        for i in [li...@numLines()]
            
            if @spanCache[i+1]
                console.log 'move cache', i
                @spanCache[i] = @spanCache[i+1]
            else
                delete @spanCache[i]
                
            if @scroll.top <= i < @scroll.bot
                @lineDivs[i] = @lineDivs[i+1]
        
        if @scroll.bot+1 < @numLines()
            @lineDivs[@scroll.bot].replaceChild @cachedSpan(@scroll.bot+1), @lineDivs[@scroll.bot].firstChild
        
        @emit 'lineDeleted', li
        
    # 000  000   000   0000000  00000000  00000000   000000000  
    # 000  0000  000  000       000       000   000     000     
    # 000  000 0 000  0000000   0000000   0000000       000     
    # 000  000  0000       000  000       000   000     000     
    # 000  000   000  0000000   00000000  000   000     000     
    
    insertLine: (li, oi) ->
        @log 'insertLine', li, oi
                
        for i in [@numLines()-1...oi]
            
            if @spanCache[i-1]
                console.log 'move cache', i
                @spanCache[i] = @spanCache[i-1]
            else
                delete @spanCache[i]
                
            if @scroll.top <= i <= @scroll.bot
                console.log 'move div', i
                @lineDivs[i] = @lineDivs[i-1]

        @spanCache[li] = render.lineSpan @syntax.getDiss(li), @size
        if @scroll.lineIndexIsInView li
            @appendLine li
                
        @emit 'lineInserted', li, oi

    #  0000000  000   000   0000000   000   000  000      000  000   000  00000000   0000000  
    # 000       000   000  000   000  000 0 000  000      000  0000  000  000       000       
    # 0000000   000000000  000   000  000000000  000      000  000 0 000  0000000   0000000   
    #      000  000   000  000   000  000   000  000      000  000  0000  000            000  
    # 0000000   000   000   0000000   00     00  0000000  000  000   000  00000000  0000000   
    
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
        
    #  0000000  000   000  000  00000000  000000000  000      000  000   000  00000000   0000000  
    # 000       000   000  000  000          000     000      000  0000  000  000       000       
    # 0000000   000000000  000  000000       000     000      000  000 0 000  0000000   0000000   
    #      000  000   000  000  000          000     000      000  000  0000  000            000  
    # 0000000   000   000  000  000          000     0000000  000  000   000  00000000  0000000   
    
    shiftLines: (top, bot, num) =>
        
        oldTop = top - num
        oldBot = bot - num

        divInto = (li,lo) =>
            return error "divInto - no div? #{top} #{bot} #{num} old #{oldTop} #{oldBot} lo #{lo} li #{li}" if not @lineDivs[lo]
            @lineDivs[li] = @lineDivs[lo]
            delete @lineDivs[lo]
            @lineDivs[li].replaceChild @cachedSpan(li), @lineDivs[li].firstChild
            
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
                        
            # if @showInvisibles
                # tx = @line(li).length * @size.charWidth + 1
                # span = elem 'span', class: "invisible newline", html: '&#9687'
                # span.style.transform = "translate(#{tx}px, -1.5px)"
                # div.appendChild span
            
            @spanCache[li] = render.lineSpan @syntax.getDiss(li), @size
                
        @spanCache[li]    
                    
    renderCursors: ->
        
        cs = []
        for c in @cursors()
            if c[1] >= @scroll.top and c[1] <= @scroll.bot
                cs.push [c[0], c[1] - @scroll.top]

        if @numCursors() == 1
            if cs.length == 1
                
                if @mainCursor()[1] > @numLines()-1
                    if @name == 'editor'
                        console.log "#{@name}.renderCursors mainCursor DAFUK?", @numLines(), str @mainCursor()
                    return
                    
                ri = @mainCursor()[1]-@scroll.top
                cursorLine = @state.line(@mainCursor()[1])
                if @mainCursor()[0] > cursorLine.length
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
        
        @layers.style.width = "#{sw()-@view.getBoundingClientRect().left-130-6}px"
        
        vh = @view.clientHeight
        
        return if vh == @scroll.viewHeight
        
        @scroll.setViewHeight vh
        
        @numbers?.elem.style.height = "#{@scroll.exposeNum * @scroll.lineHeight}px"
        @layers.style.height = "#{vh}px"
        @layersWidth = @layers.offsetWidth
        
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
        cl = _.last(cs)[1]
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
        @layers.scrollLeft += x if x
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
            @setScrollOffset()

    setScrollOffset: ->
        
        @scrollOffsetTop = @scroll.offsetTop
        @layerScroll.style.transform = "translate3d(0,-#{@scrollOffsetTop}px, 0)"
            
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
        py = parseInt(Math.floor((Math.max(0, st + ly))/@size.lineHeight)) + @scroll.top
        p = [px, Math.min(@numLines()-1, py)]
        p
        
    posForEvent: (event) -> @posAtXY event.clientX, event.clientY

    lineElemAtXY:(x,y) ->
        
        p = @posAtXY x,y
        ci = p[1]-@scroll.top
        @layerDict['lines'].children[ci]
        
    lineSpanAtXY:(x,y) ->
        
        lineElem = @lineElemAtXY x,y        
        if lineElem?
            lr = lineElem.getBoundingClientRect()
            for e in lineElem.children
                br = e.getBoundingClientRect()
                if br.left <= x <= br.left+br.width
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
            if func.start <= li <= func.end
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
                
        # return if mod and not key?.length
        
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
        return if @name != 'editor'
        log.slog.depth = 3
        log.apply log, [].splice.call arguments, 0
        log.slog.depth = 2
            
module.exports = TextEditor

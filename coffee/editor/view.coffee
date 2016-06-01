# 00000000  0000000    000  000000000   0000000   00000000   000   000  000  00000000  000   000
# 000       000   000  000     000     000   000  000   000  000   000  000  000       000 0 000
# 0000000   000   000  000     000     000   000  0000000     000 000   000  0000000   000000000
# 000       000   000  000     000     000   000  000   000     000     000  000       000   000
# 00000000  0000000    000     000      0000000   000   000      0      000  00000000  00     00

Editor    = require './editor'
html      = require './html'
log       = require '../tools/log'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
{clamp,$,
 getStyle, setStyle,
 characterWidth} = require '../tools/tools'
electron  = require('electron')
clipboard = electron.clipboard
webframe  = electron.webFrame

class EditorView extends Editor

    constructor: (view) ->
        super

        @view = view
        @elem = $('.lines', @view)
        @divs = []
        
        @size = {}
        @setFontSize 24
                
        @currentFile = undefined
        @smoothScrolling = true
        @topIndex = 0
        @botIndex = 0
        @scroll   = 0
        @scrollhandleRight = $('.scrollhandle.right', @view.parentElement)
        @scrollbarDrag = new drag 
            target: $('.scrollbar.right', @view.parentElement)
            onMove: @onScrollDrag 
            cursor: 'ns-resize'
    
        @view.onkeydown = @onKeyDown
        @view.addEventListener 'wheel', @onWheel

        @scrollBy 0

        # 00     00   0000000   000   000   0000000  00000000
        # 000   000  000   000  000   000  000       000     
        # 000000000  000   000  000   000  0000000   0000000 
        # 000 0 000  000   000  000   000       000  000     
        # 000   000   0000000    0000000   0000000   00000000
             
        @drag = new drag
            target:  @view
            cursor:  'default'
            onStart: (drag, event) =>
                
                if @doubleClicked
                    clearTimeout @tripleClickTimer
                    if @posForEvent(event)[1] == @tripleClickLineIndex
                        return if @tripleClicked
                        @doubleClicked = true
                        @tripleClicked = true
                        @tripleClickTimer = setTimeout @onTripleClickDelay, 1500
                        @startSelection event.shiftKey
                        @selectRanges @rangesForCursorLine()
                        @endSelection true
                        return
                    else
                        @doubleClicked = false
                        @tripleClicked = false
                        @tripleClickTimer = null
                        
                @startSelection event.shiftKey
                @view.focus()
                @moveCursorToPos @posForEvent event
                @endSelection event.shiftKey
            
            onMove: (drag, event) => 
                @startSelection true
                @moveCursorToPos @posForEvent event
                @endSelection true
                
        @view.ondblclick = (event) =>
            @startSelection event.shiftKey
            ranges = @rangesForWordAtPos @posForEvent event
            @selectRanges ranges
            @doubleClicked = true
            @tripleClickTimer = setTimeout @onTripleClickDelay, 1500
            @tripleClickLineIndex = ranges[0][1]
            @endSelection true
            
    onTripleClickDelay: => @doubleClicked = @tripleClicked = false

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    setText: (text) -> @setLines text.split /\n/
        
    setLines: (lines) ->
        @lines = lines
        @updateSizeValues()
        @displayLines 0

    setFontSize: (fontSize) ->
        setStyle '.lines', 'font-size', "#{fontSize}px"
        @size.lineHeight = fontSize
        @size.charWidth  = characterWidth @elem, 'line'
        log 'setFontSize', fontSize, @size

    # 0000000    000   0000000  00000000   000       0000000   000   000
    # 000   000  000  000       000   000  000      000   000   000 000 
    # 000   000  000  0000000   00000000   000      000000000    00000  
    # 000   000  000       000  000        000      000   000     000   
    # 0000000    000  0000000   000        0000000  000   000     000   

    displayLines: (top) ->
        @topIndex = top
        @botIndex = top+@numViewLines()
        @updateScrollbar()
        @updateNumLines()
                
        @divs = []
        for c in [0...@elem.children.length]
            i = c + @topIndex
            @elem.children[c].id = "line-#{i}"
            if i < @lines.length
                span = html.renderLine @lines[i]
                @divs.push span
                @elem.children[c].innerHTML = span
            else
                @divs.push ""
                @elem.children[c].innerHTML = ""
                
        @renderCursors()
        @renderSelection()

    addLine: ->
        div = document.createElement 'div'
        div.className = 'line'
        div.style.height = "#{@size.lineHeight}px"
        y = @elem.children.length * @size.lineHeight
        div.style.transform = "translate(0,#{y}px)"
        @elem.appendChild div

    renderCursors: ->
        $('.cursors', @view).innerHTML = html.renderCursors [@cursor], @size
        
    renderSelection: ->
        s = @selectionsRelativeToLineIndexRange([@topIndex, @botIndex])
        log 'renderSelection', s
        h = html.renderSelection s, @size
        $('.selections', @view).innerHTML = h

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    done: => @linesChanged @do.changedLineIndices

    updateSizeValues: ->
        @bufferHeight = @numVisibleLines() * @size.lineHeight
        @editorHeight = @numViewLines() * @size.lineHeight
        @scrollMax    = @bufferHeight - @editorHeight + @size.lineHeight
        # log "updateSizeValues", @viewHeight(), @editorHeight
    
    updateNumLines: ->
        viewLines = @numViewLines()
        while @elem.children.length > viewLines
            @elem.children[@elem.children.length-1].remove()
            
        while @elem.children.length < viewLines
            @addLine()
            @updateLine @topIndex + @elem.children.length - 1
    
    resized: -> 
        oldHeight = @editorHeight
        @updateSizeValues()
        if @editorHeight > oldHeight
            @displayLines @topIndex
        else
            @updateScrollbar()
    
    deltaToEnsureCursorIsVisible: ->
        delta = 0
        cl = @cursor[1]
        if cl < @topIndex + 2
            newTop = Math.max 0, cl - 2
            delta = newTop - @topIndex
        else if cl > @botIndex - 4
            newBot = Math.min @lines.length+1, cl + 4
            delta = newBot - @botIndex
        return delta
    
    linesChanged: (lineIndices) ->
        # log 'linesChanged', lineIndices
        
        if delta = @deltaToEnsureCursorIsVisible() 
            # log "delta", delta, delta * @lineHeight
            @scrollBy delta * @size.lineHeight #todo: slow down when using mouse
            @scrollCursor()
            return
        
        indices = []
        for change in lineIndices
            continue if change[0] > @botIndex
            top = Math.max @topIndex, change[0]
            if change[1] < 0
                bot = 1+Math.min @botIndex, @lines.length-1
            else
                bot = 1+Math.min @botIndex, change[1]
            for i in [top...bot]
                indices.push i
                    
        indices.sort (a,b) -> a - b
        indices = _.sortedUniq indices

        for i in indices
            @updateLine i
            
        @renderCursors()
        @renderSelection()
            
        @updateSizeValues()
        @updateScrollbar()
        @scrollCursor()

    updateLine: (lineIndex) ->
        if @topIndex <= lineIndex < @lines.length
            relIndex = lineIndex - @topIndex
            span = html.renderLine @lines[lineIndex]
            @divs[relIndex] = span
            @elem.children[relIndex]?.innerHTML = span

    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    posForEvent: (event) ->
        
        sl = @view.scrollLeft
        st = @view.scrollTop
        br = @view.getBoundingClientRect()
        # log 'posForEvent', sl, st, br
        lx = clamp 0, @view.offsetWidth,  event.clientX - br.left
        ly = clamp 0, @view.offsetHeight, event.clientY - br.top
        # log 'posForEvent', lx, ly
        p = [parseInt(Math.floor((Math.max(0, sl + lx))/@size.charWidth)),
             parseInt(Math.floor((Math.max(0, st + ly))/@size.lineHeight)) + @topIndex]
        log 'posForEvent cx', event.clientX, 'p0', p[0]
        p

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    viewHeight:      -> @view.getBoundingClientRect().height 
    numViewLines:    -> Math.ceil(@viewHeight() / @size.lineHeight)
    numFullLines:    -> Math.floor(@viewHeight() / @size.lineHeight)
    numVisibleLines: -> @lines.length

    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
        
    updateScrollbar: ->
        sbw = getStyle '.scrollhandle', 'width'
        log 'sbw', sbw
        if @bufferHeight < @viewHeight()
            @scrollhandleRight.style.top    = "0"
            @scrollhandleRight.style.height = "0"
            @scrollhandleRight.style.width  = "0"
            @view.style.right = "0"
        else
            vh           = Math.min @editorHeight, @viewHeight()
            scrollTop    = parseInt (@scroll / @bufferHeight) * vh
            scrollHeight = parseInt (@editorHeight / @bufferHeight) * vh
            scrollHeight = Math.max scrollHeight, parseInt @size.lineHeight/4
            scrollTop    = Math.min scrollTop, @viewHeight()-scrollHeight
            scrollTop    = Math.max 0, scrollTop
                    
            @scrollhandleRight.style.top    = "#{scrollTop}.px"
            @scrollhandleRight.style.height = "#{scrollHeight}.px"
            @scrollhandleRight.style.width  = sbw
            @view.style.right = sbw            
            
                
    scrollLines: (lineDelta) -> @scrollBy lineDelta * @size.lineHeight

    scrollFactor: (event) ->
        f  = 1 
        f *= 1 + 1 * event.shiftKey
        f *= 1 + 3 * event.metaKey        
        f *= 1 + 7 * event.altKey

    scrollBy: (delta) -> 
                
        @updateSizeValues()
        
        @scroll += delta
        @scroll = Math.min @scroll, @scrollMax
        @scroll = Math.max @scroll, 0
        @size.offsetTop = @scroll
        
        top = parseInt @scroll / @size.lineHeight
        dff = @scroll - top * @size.lineHeight 

        if @topIndex != top
            @displayLines top
        else
            @updateScrollbar()

        if @smoothScrolling            
            @view.scrollTop = dff

    scrollCursor: -> $('.cursor', @view)?.scrollIntoViewIfNeeded()
            
    onWheel: (event) => 
        @scrollBy event.deltaY * @scrollFactor event
        
    onScrollDrag: (drag) =>
        delta = (drag.delta.y / @editorHeight) * @bufferHeight
        @scrollBy delta
    
    # 0000000   0000000    0000000   00     00
    #    000   000   000  000   000  000   000
    #   000    000   000  000   000  000000000
    #  000     000   000  000   000  000 0 000
    # 0000000   0000000    0000000   000   000
        
    resetZoom: -> 
        webframe.setZoomFactor 1
        @updateNumLines()
        
    changeZoom: (d) -> 
        z = webframe.getZoomFactor() 
        z *= 1+d/20
        z = clamp 0.36, 5.23, z
        webframe.setZoomFactor z
        @updateNumLines()
                    
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event
        # log "editor key:", key, "mod:", mod, "combo:", combo
        return if not combo
        return if key == 'right click' # weird right command key
        
        switch combo
            when 'command+k'              then return @selectAll() + @deleteSelection()
            when 'command+d'              then return @selectNone()
            when 'command+a'              then return @selectAll()
            when 'command+e'              then return @markSelectionForSearch()
            when 'command+g'              then return @jumpToNextSearchResult()
            when 'command+shift+g'        then return @jumpToPrevSearchResult()
            when 'command+c'              then return clipboard.writeText @selectedText()
            when 'tab', 'command+]'       then return @insertTab() + event.preventDefault() 
            when 'shift+tab', 'command+[' then return @deIndent()  + event.preventDefault()
            when 'command+z'              then return @do.undo @
            when 'command+shift+z'        then return @do.redo @
            when 'command+='              then return @changeZoom +1
            when 'command+-'              then return @changeZoom -1
            when 'command+0'              then return @resetZoom()
        
        # commands that might change the selection ...
        
        @startSelection event.shiftKey # ... starts or extend selection if shift is pressed
        
        switch key
            
            when 'down', 'right', 'up', 'left' 
                
                if event.metaKey
                    if key == 'left'
                        @moveCursorToStartOfLine()
                    else if key == 'right'
                        @moveCursorToEndOfLine()
                else if event.altKey
                    if key == 'left'
                        @moveCursorToStartOfWord()
                    else if key == 'right'
                        @moveCursorToEndOfWord()
                else
                    @moveCursor key
                    
                event.preventDefault() # prevent view from scrolling
                
            when 'home'         then @moveCursorToLineIndex 0
            when 'end'          then @moveCursorToLineIndex @lines.length-1
            when 'page up'      
                @moveCursorByLines -(@numFullLines()-3)
                event.preventDefault() # prevent view from scrolling
            when 'page down'    
                @moveCursorByLines   @numFullLines()-3
                event.preventDefault() # prevent view from scrolling
                
            else
                switch combo
                    when 'enter'                     then @insertNewline()
                    when 'delete', 'ctrl+backspace'  then @deleteForward()     
                    when 'backspace'                 then @deleteBackward()     
                    when 'command+j'                 then @joinLine()
                    when 'ctrl+a', 'ctrl+shift+a'    then @moveCursorToStartOfLine()
                    when 'ctrl+e', 'ctrl+shift+e'    then @moveCursorToEndOfLine()
                    when 'command+v'                 then @insertText clipboard.readText()
                    when 'command+x'                 
                        clipboard.writeText @selectedText()
                        @deleteSelection()
                    else
                        ansiKeycode = require 'ansi-keycode'
                        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
                            @insertCharacter ansiKeycode event
                        else
                            log "ignoring", combo
                            
        @endSelection event.shiftKey # ... reset selection 
        
module.exports = EditorView
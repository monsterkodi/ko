
# 000   000  000  00000000  000   000  0000000     0000000    0000000  00000000
# 000   000  000  000       000 0 000  000   000  000   000  000       000     
#  000 000   000  0000000   000000000  0000000    000000000  0000000   0000000 
#    000     000  000       000   000  000   000  000   000       000  000     
#     0      000  00000000  00     00  0000000    000   000  0000000   00000000
{
clamp,$,
characterWidth,
setStyle
}         = require '../tools/tools'
prefs     = require '../tools/prefs'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
log       = require '../tools/log'
render    = require './render'
Editor    = require './editor'
_         = require 'lodash'
electron  = require 'electron'
clipboard = electron.clipboard

class ViewBase extends Editor

    constructor: (viewElem) ->
    
        @syntaxName = 'txt'    
        @view = viewElem
        @elem = $('.lines', @view)
        @divs = []        
        @topIndex = 0
        @botIndex = 0
        @size = {}
    
        @setFontSize prefs.get @fontSizeKey, @fontSizeDefault

        @view.onkeydown = @onKeyDown
    
        super

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
                        @selectRange @rangeForLineAtIndex @cursors[0][1]
                        @endSelection true
                        return
                    else
                        @doubleClicked = false
                        @tripleClicked = false
                        @tripleClickTimer = null
                        
                @startSelection event.shiftKey
                @view.focus()
                @moveCursorToPos @cursors[0], @posForEvent event
                @endSelection event.shiftKey
            
            onMove: (drag, event) => 
                @startSelection true
                @moveCursorToPos @cursors[0], @posForEvent event
                @endSelection true
                
        @view.ondblclick = (event) =>
            @startSelection event.shiftKey
            range = @rangeForWordAtPos @posForEvent event
            @selectRange range
            @doubleClicked = true
            @tripleClickTimer = setTimeout @onTripleClickDelay, 1500
            @tripleClickLineIndex = range[0]
            @endSelection true
                        
    onTripleClickDelay: => @doubleClicked = @tripleClicked = false

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    setText: (text) -> @setLines text?.split /\n/
        
    setLines: (lines) ->
        lines ?= ['']
        super lines
        @updateSizeValues()
        @displayLines 0

    # 00000000   0000000   000   000  000000000   0000000  000  0000000  00000000
    # 000       000   000  0000  000     000     000       000     000   000     
    # 000000    000   000  000 0 000     000     0000000   000    000    0000000 
    # 000       000   000  000  0000     000          000  000   000     000     
    # 000        0000000   000   000     000     0000000   000  0000000  00000000

    setFontSize: (fontSize) ->
        setStyle '.'+@view.className, 'font-size', "#{fontSize}px"
        @size.fontSize   = fontSize
        @size.lineHeight = fontSize + Math.floor(fontSize/6)
        @size.charWidth  = characterWidth @elem, 'line'
        @size.offsetX    = Math.floor @size.charWidth/2

    # 0000000    000   0000000  00000000   000       0000000   000   000
    # 000   000  000  000       000   000  000      000   000   000 000 
    # 000   000  000  0000000   00000000   000      000000000    00000  
    # 000   000  000       000  000        000      000   000     000   
    # 0000000    000  0000000   000        0000000  000   000     000   

    refreshLines: ->
        @elem.innerHTML = ""
        @updateNumLines()
        @displayLines @topIndex

    renderLine: (line) ->
        render.line line, @syntaxName

    displayLines: (top) ->
        @topIndex = top
        @botIndex = top+@numViewLines()
        @updateScrollbar?()
        @updateNumLines()
                
        @divs = []
        for c in [0...@elem.children.length]
            i = c + @topIndex
            @elem.children[c].id = "line-#{i}"
            if i < @lines.length
                span = @renderLine @lines[i]
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
        div.style.transform = "translate(#{@size.offsetX}px,#{y}px)"
        @elem.appendChild div

    renderCursors: ->
        h = render.cursors @cursorsRelativeToLineIndexRange([@topIndex, @botIndex]), @size
        $('.cursors', @view).innerHTML = h
        
    renderSelection: ->
        h = ""
        s = @selectionsRelativeToLineIndexRange([@topIndex, @botIndex])
        if s
            # log 'renderSelection', s
            h += render.selection s, @size
        $('.selections', @view).innerHTML = h
        
    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    done: => 
        super
        @changed @do.changeInfo

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
    
    deltaToEnsureCursorIsVisible: ->
        delta = 0
        cl = @cursors[0][1]
        if cl < @topIndex + 2
            newTop = Math.max 0, cl - 2
            delta = newTop - @topIndex
        else if cl > @botIndex - 4
            newBot = Math.min @lines.length+1, cl + 4
            delta = newBot - @botIndex
        return delta
    
    changed: (changeInfo) ->
        log 'viewbase.changed', @topIndex, @botIndex
        log 'viewbase.changed', changeInfo
        indices = []
        info = _.cloneDeep changeInfo
        for i in info.changed
            continue if i < @topIndex
            break if i > @botIndex
            indices.push i
            
        if info.inserted.length
            if info.inserted[0] < @botIndex
                for i in [Math.max(@topIndex, info.inserted[0])..@botIndex]
                    indices.push i

        if info.deleted.length
            if info.deleted[0] < @botIndex
                for i in [Math.max(@topIndex, info.deleted[0])..@botIndex]
                    indices.push i
                                                            
        indices.sort (a,b) -> a - b
        indices = _.sortedUniq indices
        
        log 'indices', indices    
        for i in indices
            @updateLine i
        if changeInfo.cursor.length
            @renderCursors()
        if changeInfo.selection.length
            @renderSelection()            
        @updateSizeValues()        
    
    updateLine: (lineIndex) ->
        if @topIndex <= lineIndex < @lines.length
            relIndex = lineIndex - @topIndex
            span = @renderLine @lines[lineIndex]
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
        lx = clamp 0, @view.offsetWidth,  event.clientX - br.left - @size.offsetX
        ly = clamp 0, @view.offsetHeight, event.clientY - br.top
        p = [parseInt(Math.floor((Math.max(0, sl + lx))/@size.charWidth)),
             parseInt(Math.floor((Math.max(0, st + ly))/@size.lineHeight)) + @topIndex]
        # log 'posForEvent', p
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
    
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event

        return if not combo
        return if key == 'right click' # weird right command key

        # log "viewbase key:", key, "mod:", mod, "combo:", combo
        
        if 'unhandled' != @handleModKeyComboEvent mod, key, combo, event
            return

        switch combo
            when 'command+k'                then return @selectAll() + @deleteSelection()
            when 'command+d'                then return @selectNone()
            when 'command+a'                then return @selectAll()
            when 'command+e'                then return @markSelectionForSearch()
            when 'command+g'                then return @jumpToNextSearchResult()
            when 'command+shift+g'          then return @jumpToPrevSearchResult()
            when 'command+c'                then return clipboard.writeText @textOfSelectionForClipboard()
            when 'command+z'                then return @do.undo @
            when 'command+shift+z'          then return @do.redo @
            when 'delete', 'ctrl+backspace' then return @deleteForward()     
            when 'backspace'                then return @deleteBackward()     
            when 'command+v'                then return @insertText clipboard.readText()
            when 'command+x'                 
                clipboard.writeText @textOfSelectionForClipboard()
                @deleteSelection()
                return

        return if mod and not key?.length
        
        # commands that might change the selection ...
        
        if key in ['down', 'right', 'up', 'left'] or combo in ['ctrl+a', 'ctrl+e', 'ctrl+shift+a', 'ctrl+shift+e']
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
                    @moveCursors key
                                        
                event.preventDefault() # prevent view from scrolling
            else
                switch combo
                    when 'ctrl+a', 'ctrl+shift+a'    then @moveCursorToStartOfLine()
                    when 'ctrl+e', 'ctrl+shift+e'    then @moveCursorToEndOfLine()
                                                            
        if key in ['down', 'right', 'up', 'left'] or combo in ['ctrl+a', 'ctrl+e', 'ctrl+shift+a', 'ctrl+shift+e'] # ... reset selection 
            @endSelection event.shiftKey 
            return
                        
        ansiKeycode = require 'ansi-keycode'
        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
            @insertCharacter ansiKeycode event

module.exports = ViewBase            
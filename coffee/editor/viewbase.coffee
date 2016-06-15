
# 000   000  000  00000000  000   000  0000000     0000000    0000000  00000000
# 000   000  000  000       000 0 000  000   000  000   000  000       000     
#  000 000   000  0000000   000000000  0000000    000000000  0000000   0000000 
#    000     000  000       000   000  000   000  000   000       000  000     
#     0      000  00000000  00     00  0000000    000   000  0000000   00000000
{
characterWidth,
setStyle,
clamp,
last,
$
}         = require '../tools/tools'
prefs     = require '../tools/prefs'
drag      = require '../tools/drag'
keyinfo   = require '../tools/keyinfo'
log       = require '../tools/log'
render    = require './render'
syntax    = require './syntax'
scroll    = require './scroll'
Editor    = require './editor'
_         = require 'lodash'
electron  = require 'electron'
clipboard = electron.clipboard

class ViewBase extends Editor

    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    constructor: (viewElem) ->
        @name = viewElem
        @name = @name.slice 1 if @name[0] == '.'
        @view = $(viewElem)
        @initLayers ["selections", "highlights", "lines", "cursors"]
        @elem = $('.lines', @view)
        @diss = []
        @size = {}
        @syntax = new syntax @
    
        @setFontSize prefs.get @fontSizeKey, @fontSizeDefault

        @scroll = new scroll 
            lineHeight: @size.lineHeight
            viewHeight: @viewHeight()
            
        @scroll.on 'top',        @topChange
        @scroll.on 'exposeLine', @exposeLineAtIndex     
        @scroll.on 'vanishLine', @vanishLineAtIndex     

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
                        r = @rangeForLineAtIndex @cursors[0][1]
                        if event.shiftKey
                            @addRangeToSelection r
                        else
                            @selectSingleRange r
                        return
                    else
                        @doubleClicked = false
                        @tripleClicked = false
                        @tripleClickTimer = null
                        
                @view.focus()
                p = @posForEvent event
                if event.metaKey
                    @toggleCursorAtPos p
                else
                    @singleCursorAtPos p, event.shiftKey
            
            onMove: (drag, event) => 
                p = @posForEvent event
                if event.metaKey
                    @addCursorAtPos [last(@cursors)[0], p[1]]  # todo: nearest cursor instead of last
                else
                    @singleCursorAtPos p, true
                
        @view.ondblclick = (event) =>
            range = @rangeForWordAtPos @posForEvent event
            if event.shiftKey
                @addRangeToSelection range
            else
                @selectSingleRange range
            @doubleClicked = true
            @tripleClickTimer = setTimeout @onTripleClickDelay, 1500
            @tripleClickLineIndex = range[0]
                        
    onTripleClickDelay: => @doubleClicked = @tripleClicked = false

    # 000       0000000   000   000  00000000  00000000    0000000
    # 000      000   000   000 000   000       000   000  000     
    # 000      000000000    00000    0000000   0000000    0000000 
    # 000      000   000     000     000       000   000       000
    # 0000000  000   000     000     00000000  000   000  0000000 
    
    initLayers: (layerClasses) ->
        for cls in layerClasses
            div = document.createElement 'div'
            div.className = cls
            @view.appendChild div

    #  0000000  00000000  000000000  000000000  00000000  000   000  000000000
    # 000       000          000        000     000        000 000      000   
    # 0000000   0000000      000        000     0000000     00000       000   
    #      000  000          000        000     000        000 000      000   
    # 0000000   00000000     000        000     00000000  000   000     000   

    setText: (text) -> @setLines text?.split /\n/
        
    #  0000000  00000000  000000000  000      000  000   000  00000000   0000000
    # 000       000          000     000      000  0000  000  000       000     
    # 0000000   0000000      000     000      000  000 0 000  0000000   0000000 
    #      000  000          000     000      000  000  0000  000            000
    # 0000000   00000000     000     0000000  000  000   000  00000000  0000000 
        
    setLines: (lines) ->
        # log "viewbase.setLines lines", lines if @name == 'editor'        
        @scroll.reset() if lines.length == 0
        lines ?= ['']
        super lines
        @syntax.parse()        
        # log "viewbase.setLines viewHeight #{@viewHeight()}" if @name == 'editor'
        @scroll.setViewHeight @viewHeight()
        # log "viewbase.setLines numLines #{lines.length}" if @name == 'editor'
        @scroll.setNumLines @lines.length        

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
        
        @scroll?.setLineHeight @size.lineHeight

    # 0000000    000   0000000  00000000   000       0000000   000   000
    # 000   000  000  000       000   000  000      000   000   000 000 
    # 000   000  000  0000000   00000000   000      000000000    00000  
    # 000   000  000       000  000        000      000   000     000   
    # 0000000    000  0000000   000        0000000  000   000     000   

    renderLineAtIndex: (li) -> render.line @lines[li], @syntax.getDiss li

    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000

    exposeLineAtIndex: (li) =>
        # log "viewbase.exposeLineAtIndex #{li}"
        # log "viewbase.exposeLineAtIndex children #{@elem.children.length}"
        html = @renderLineAtIndex li
        # log "viewbase.exposeLineAtIndex #{li} #{html}"
        # log "viewbase.exposeLineAtIndex #{@lines[li]} #{@lines.length}"
        @addLine().innerHTML = html
    
    addLine: ->
        div = document.createElement 'div'
        div.className = 'line'
        div.style.height = "#{@size.lineHeight}px"
        y = @elem.children.length * @size.lineHeight
        div.style.transform = "translate(#{@size.offsetX}px,#{y}px)"
        @elem.appendChild div
        div    
    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    vanishLineAtIndex: (li) =>
        # log "viewbase.exposeLineAtIndex #{li}"
        while @elem.children.length > li
            # log "viewbase.vanishLineAtIndex remove line #{li} #{@elem.children.length}"
            @elem.children[@elem.children.length-1].remove()

    # 000000000   0000000   00000000    0000000  000   000   0000000   000   000   0000000   00000000
    #    000     000   000  000   000  000       000   000  000   000  0000  000  000        000     
    #    000     000   000  00000000   000       000000000  000000000  000 0 000  000  0000  0000000 
    #    000     000   000  000        000       000   000  000   000  000  0000  000   000  000     
    #    000      0000000   000         0000000  000   000  000   000  000   000   0000000   00000000
    
    topChange: () =>
                                        
        # @renderCursors()
        # @renderSelection()
        # @renderHighlights()

    renderCursors: ->
        log "viewbase.renderCursors", @scroll.exposeTop, @scroll.exposeBot
        cs = @cursorsRelativeToLineIndexRange [@scroll.exposeTop, @scroll.exposeBot]
        log "viewbase.renderCursors", cs
        vc = []
        for c in cs
            if c[0] > @lines[@scroll.top+c[1]].length
                vc.push [@lines[@scroll.top+c[1]].length, c[1], 'virtual']
        cs = cs.concat vc
        # log "viewbase.renderCursors", cs 
        html = render.cursors cs, @size
        # log "viewbase.renderCursors", html 
        $('.cursors', @view).innerHTML = html
        
    renderSelection: ->
        h = ""
        s = @selectionsRelativeToLineIndexRange [@scroll.top, @scroll.bot]
        if s
            h += render.selection s, @size
        $('.selections', @view).innerHTML = h

    renderHighlights: ->
        h = ""
        s = @highlightsRelativeToLineIndexRange [@scroll.top, @scroll.bot]
        if s
            h += render.selection s, @size, "highlight"
        $('.highlights', @view).innerHTML = h
        
    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    done: => @changed @do.changeInfo
        
    # 00000000   00000000   0000000  000  0000000  00000000  0000000  
    # 000   000  000       000       000     000   000       000   000
    # 0000000    0000000   0000000   000    000    0000000   000   000
    # 000   000  000            000  000   000     000       000   000
    # 000   000  00000000  0000000   000  0000000  00000000  0000000  
    
    resized: -> @scroll.setViewHeight @viewHeight()
    
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
            
        if botdelta > 0
            Math.max botdelta, topdelta
        else if topdelta < 0
            Math.min botdelta, topdelta
        else
            botdelta
            
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo) ->

        @syntax.changed changeInfo
        indices = []
        info = _.cloneDeep changeInfo
        for i in info.changed
            continue if i < @scroll.top
            break if i > @scroll.bot
            indices.push i
            
        if info.inserted.length
            if info.inserted[0] < @scroll.bot
                for i in [Math.max(@scroll.top, info.inserted[0])..@scroll.bot]
                    indices.push i

        if info.deleted.length
            if info.deleted[0] < @scroll.bot
                for i in [Math.max(@scroll.top, info.deleted[0])..@scroll.bot]
                    indices.push i
                                                                                
        indices.sort (a,b) -> a - b
        indices = _.sortedUniq indices
                
        for i in indices
            @updateLine i
        if changeInfo.cursor.length
            @renderCursors()
        if changeInfo.selection.length
            @renderSelection()   
                     
        @renderHighlights()
    
    updateLine: (lineIndex) ->
        if @scroll.top <= lineIndex < @lines.length
            relIndex = lineIndex - @scroll.top
            span = @renderLineAtIndex lineIndex
            @elem.children[relIndex]?.innerHTML = span
        else if lineIndex >= @lines.length and lineIndex < @scroll.bot
            @elem.children[lineIndex-@scroll.top].innerHTML = ""

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
        px = parseInt(Math.floor((Math.max(0, sl + lx))/@size.charWidth))
        py = parseInt(Math.floor((Math.max(0, st + ly))/@size.lineHeight)) + @scroll.top
        p = [px, Math.min(@lines.length-1, py)]
        log "viewbase.posForEvent x:#{event.clientX} y:#{event.clientY} line:#{p[1]} col:#{p[0]}"
        p

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    viewHeight:      -> @view.getBoundingClientRect().height 
    numViewLines:    -> Math.ceil(@viewHeight() / @size.lineHeight)
    numFullLines:    -> Math.floor(@viewHeight() / @size.lineHeight)
    
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event

        # log "viewbase key:", key, "mod:", mod, "combo:", combo

        return if not combo
        return if key == 'right click' # weird right command key
        
        if 'unhandled' != @handleModKeyComboEvent mod, key, combo, event
            return

        switch combo
            when 'command+k'                then return @selectAll() + @deleteSelection()
            when 'command+a'                then return @selectAll()
            when 'command+shift+a'          then return @selectNone()
            when 'command+e'                then return @highlightTextOfSelectionOrWordAtCursor()
            when 'command+d'                then return @highlightWordAndAddToSelection()
            when 'command+shift+d'          then return @removeSelectedHighlight()
            when 'command+alt+d'            then return @selectAllHighlights()
            when 'command+g'                then return @selectNextHighlight()
            when 'command+shift+g'          then return @selectPrevHighlight()
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
        
        switch key
            
            when 'down', 'right', 'up', 'left' 
                                
                if event.metaKey
                    switch key 
                        when 'left'  then @moveCursorsToStartOfLine event.shiftKey
                        when 'right' then @moveCursorsToEndOfLine   event.shiftKey
                else if event.altKey
                    if key == 'left'
                        @moveCursorsToStartOfWord event.shiftKey
                    else if key == 'right'
                        @moveCursorsToEndOfWord   event.shiftKey
                else
                    @moveCursors key, event.shiftKey
                                        
                event.preventDefault() # prevent view from scrolling
            else
                switch combo
                    when 'ctrl+a', 'ctrl+shift+a'    then @moveCursorsToStartOfLine event.shiftKey
                    when 'ctrl+e', 'ctrl+shift+e'    then @moveCursorsToEndOfLine   event.shiftKey
                                                                                    
        ansiKeycode = require 'ansi-keycode'
        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
            @insertUserCharacter ansiKeycode event

module.exports = ViewBase            
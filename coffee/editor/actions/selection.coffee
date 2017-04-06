#  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
# 000       000       000      000       000          000     000  000   000  0000  000
# 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
#      000  000       000      000       000          000     000  000   000  000  0000
# 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
{
first,
last,
log
} = require 'kxk'

module.exports =
    
    selectSingleRange: (r, opt) ->
        if not r?
            log "[WARNING] editor.#{name}.selectSingleRange -- undefined range!"
            return
        @do.start()
        @do.cursor [[opt?.before and r[1][0] or r[1][1], r[0]]]
        @do.select [r]
        @do.end()

    startStickySelection: () -> 
        @stickySelection = true
        @updateTitlebar?()
        @emit 'selection'

    endStickySelection: () ->
        @stickySelection = false
        @updateTitlebar?()
        @emit 'selection'

    startSelection: (opt = extend:false) ->
        if opt?.extend 
            if not @startSelectionCursors
                @startSelectionCursors = @do.cursors()
                if not @stickySelection
                    @do.select @rangesFromPositions @startSelectionCursors
        else
            @startSelectionCursors = null
            if not @stickySelection
                @do.select []
                    
    endSelection: (opt = extend:false) ->
        if not opt?.extend
            if @do.numSelections() and not @stickySelection
                @selectNone()
            @startSelectionCursors = null
        else
            oldCursors = @startSelectionCursors ? @state.cursors()
            newSelection = @stickySelection and @do.selections() or []            
            newCursors = @do.cursors()
            
            if oldCursors.length != newCursors.length
                log "[WARNING] editor.#{@name}.endSelection -- oldCursors.size != newCursors.size", oldCursors.length, newCursors.length
            
            for ci in [0...@do.numCursors()]
                oc = oldCursors[ci]
                nc = newCursors[ci]
                ranges = @rangesBetweenPositions oc, nc, true #< extend to full lines if cursor at start of line                
                newSelection = newSelection.concat ranges

            @do.select newSelection
            
        @checkSalterMode()      

    addRangeToSelection: (range) ->
        @do.start()
        newSelections = @do.selections()
        newSelections.push range
        newCursors = (@rangeEndPos(r) for r in newSelections)
        @do.cursor newCursors, main:'last'
        @do.select newSelections
        @do.end()

    removeFromSelection: (sel) ->
        @do.start()
        si = @selections.indexOf sel
        newSelections = @do.selections()
        newSelections.splice si, 1
        if newSelections.length
            newCursors = (@rangeEndPos(r) for r in newSelections)
            @do.cursor newCursors, main:(newCursors.length+si-1) % newCursors.length
        @do.select newSelections
        @do.end()        

    selectNone: -> 
        @do.start()
        @do.select []
        @do.end()
        
    selectAll: -> 
        @do.start()
        @do.select @rangesForAllLines()
        @do.end()
        
    selectInverted: -> 
        invertedRanges = []        
        sc = @selectedAndCursorLineIndices()
        for li in [0...@numLines()]
            if li not in sc
                invertedRanges.push @rangeForLineAtIndex li
        if invertedRanges.length
            @do.start()
            @do.cursor [@rangeStartPos first invertedRanges]
            @do.select invertedRanges
            @do.end()     

    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000   0000000  
    # 000   000  000  000        000   000  000      000  000        000   000     000     000       
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     0000000   
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000          000  
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     0000000   
    
    selectAllHighlights: ->
        @do.start()
        if not @numHighlights()
            @highlightTextOfSelectionOrWordAtCursor()
        @do.select @do.highlights()
        if @do.numSelections()
            @do.cursor (@rangeEndPos(r) for r in @do.selections()), main: 'closest'
        @do.end()
    
    selectNextHighlight: -> # command+g
        if not @numHighlights()
            searchText = window.commandline.commands.find?.currentText
            @highlightText searchText if searchText?.length
        return if not @numHighlights()
        r = @rangeAfterPosInRanges @cursorPos(), @highlights
        r ?= first @highlights
        if r?
            @selectSingleRange r, before: r[2]?.value == 'close'
            @scrollCursorIntoView()

    selectPrevHighlight: -> # command+shift+g
        if not @numHighlights()
            searchText = window.commandline.commands.find?.currentText
            @highlightText searchText if searchText?.length
        return if not @numHighlights()
        r = @rangeBeforePosInRanges @cursorPos(), @highlights
        r ?= last @highlights
        @selectSingleRange r if r?


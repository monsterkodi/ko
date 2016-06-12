#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

{
clamp,
first,
last,
$
}       = require '../tools/tools'
log     = require '../tools/log'
watcher = require './watcher'
Buffer  = require './buffer'
undo    = require './undo'
path    = require 'path'
assert  = require 'assert'
_       = require 'lodash'

class Editor extends Buffer
    
    constructor: () ->
        @surroundCharacters = "{}[]()'\"".split ''
        @currentFile = null
        @indentString = _.padStart "", 4
        @watch = null
        @do = new undo @done
        super

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    setCurrentFile: (file) ->
        @watch?.stop()
        @currentFile = file
        @do.reset()
        @updateTitlebar()
        if file?
            @watch = new watcher @
        else
            @watch = null

    setLines: (lines) ->
        super lines
        @do.reset()
            
    done: => 
        
    #  0000000  000  000   000   0000000   000      00000000
    # 000       000  0000  000  000        000      000     
    # 0000000   000  000 0 000  000  0000  000      0000000 
    #      000  000  000  0000  000   000  000      000     
    # 0000000   000  000   000   0000000   0000000  00000000
    
    singleCursorAtPos: (p, e) ->
        if e and @initialCursors?.length > 1
            @initialCursors = _.cloneDeep [@initialCursors[0]]
        else if not e
            @initialCursors = _.cloneDeep [p]
        @startSelection e
        @do.cursor @, [p]
        @endSelection e
        
    selectSingleRange: (r) ->
        @initialCursors = _.cloneDeep [[r[1][0], r[0]]]
        @startSelection true
        @do.cursor @, [[r[1][1], r[0]]]
        @endSelection true
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    startSelection: (e) ->
        if e and not @initialCursors
            @initialCursors = _.cloneDeep @cursors
            @do.selection @, @rangesForCursors @initialCursors
        if not e
            @do.selection @, []
            
    endSelection: (e) ->
        
        if not e
            if @selections.length
                @selectNone()
            @initialCursors = _.cloneDeep @cursors
            
        if e and @initialCursors
            newSelection = []
            if @initialCursors.length != @cursors.length
                log 'warn! @initialCursors.length != @cursors.length', @initialCursors.length, @cursors.length
            
            for ci in [0...@initialCursors.length]
                ic = @initialCursors[ci]
                cc = @cursors[ci]
                ranges = @rangesBetweenPositions ic, cc
                newSelection = newSelection.concat ranges
                    
            # newSelection = @cleanRanges newSelection
            @do.selection @, newSelection

    #  0000000   0000000    0000000    00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000  000   000  000   000  0000  000  000        000     
    # 000000000  000   000  000   000  0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000  000   000  000   000  000  0000  000   000  000     
    # 000   000  0000000    0000000    000   000  000   000  000   000   0000000   00000000
    
    addRangeToSelection: (range) ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newSelections.push range
        @do.selection @, newSelections
        @do.cursor @, [@rangeEndPos range]
        @do.end()

    selectNone: -> @do.selection @, []

    selectMoreLines: ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors
        
        selectCursorLineAtIndex = (c,i) =>
            range = @rangeForLineAtIndex i
            newSelections.push range
            newCursors[@indexOfCursor(c)] = [range[1][1], range[0]]
            
        start = false
        for c in @cursors
            if not @isSelectedLineAtIndex c[1]
                selectCursorLineAtIndex c, c[1]
                start = true
        if not start
            for c in @cursors
                selectCursorLineAtIndex c, c[1]+1
        @do.selection @, newSelections
        @do.cursor @, newCursors
        @do.end()       

    selectLessLines: -> 
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors
        
        for c in @reversedCursors()
            thisSel = @selectionsAtLineIndex(c[1])
            if thisSel.length
                if @isSelectedLineAtIndex c[1]-1
                    s = @selectionsAtLineIndex(c[1]-1)[0]
                    newCursors[@indexOfCursor(c)] = [s[1][1], s[0]]
                newSelections.splice @indexOfSelection(thisSel[0]), 1

        @do.selection @, newSelections
        @do.cursor @, newCursors
        @do.end()       

    selectAll: => @do.selection @, @rangesForAllLines()
            
    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000
    # 000   000  000  000        000   000  000      000  000        000   000     000   
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000   
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000   
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000   

    highlightText: (text) -> # called from find command
        @searchText = text
        @highlights = @rangesForText @searchText
        if @highlights.length
            r = @rangeAfterPosInRanges @cursorPos(), @highlights
            r ?= first @highlights
            @selectSingleRange r
        @renderHighlights()

    highlightTextOfSelectionOrWordAtCursor: -> # called from keyboard shortcuts
        if @selections.length == 0 # or @selections.length > 1 ?
            @selectSingleRange @rangeForWordAtPos @cursorPos()
        @searchText = @textInRange @selections[0]
        @highlights = @rangesForText @searchText
        @renderHighlights()

    clearHighlights: ->
        @highlights = []
        @renderHighlights()

    selectAllHighlights: ->
        if @highlights.length == 0
            @highlightTextOfSelectionOrWordAtCursor()
        @do.selection @, _.cloneDeep @highlights
    
    selectNextHighlight: ->
        r = @rangeAfterPosInRanges @cursorPos(), @highlights
        r ?= first @highlights
        @selectSingleRange r

    selectPrevHighlight: ->
        r = @rangeBeforePosInRanges @cursorPos(), @highlights
        r ?= last @highlights
        @selectSingleRange r

    highlightWordAndAddToSelection: ->
        if @highlights.length == 0
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            cp = @cursorPos()
            sr = @rangeAtPosInRanges cp, @selections
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @highlights
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @highlights
            r ?= first @highlights
            @addRangeToSelection r        
            
    removeSelectedHighlight: ->
        cp = @cursorPos()
        sr = @rangeAtPosInRanges cp, @selections
        hr = @rangeAtPosInRanges cp, @highlights
        if sr and hr
            newSelections = _.cloneDeep @selections
            newSelections.splice @indexOfSelection(sr), 1
            @do.selection @, newSelections
        pr = @rangeBeforePosInRanges cp, @highlights
        pr ?= last @highlights
        if pr 
            @do.cursor @, [@rangeEndPos pr]
                    
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000
    
    setCursor: (c,l) -> 
        l = clamp 0, @lines.length-1, l
        c = clamp 0, @lines[l].length, c
        @do.cursor @, [[c,l]]
        
    toggleCursorAtPos: (p) ->
        if @cursorAtPos p
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        newCursors = _.cloneDeep @cursors
        newCursors.push p
        @do.cursor @, newCursors        
        
    delCursorAtPos: (p) ->
        c = @cursorAtPos p
        if c and @cursors.length > 1
            newCursors = _.cloneDeep @cursors
            newCursors.splice @indexOfCursor(c), 1
            @do.cursor @, newCursors        
                    
    addCursors: (dir='down') ->
        d = switch dir
            when 'up' then -1
            when 'down' then +1
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            newCursors.push [c[0], c[1]+d]
        @do.cursor @, newCursors 

    addCursorsForSelections: (i) ->
        @do.start()
        @do.cursor @, (@rangeIndexPos(s,i) for s in @selections) 
        @do.selection @, []
        @do.end()
    
    cursorsAtStartOfSelections: -> @addCursorsForSelections 0
    cursorsAtEndOfSelections: -> @addCursorsForSelections 1

    delCursors: (dir='up') ->
        newCursors = _.cloneDeep @cursors
        d = switch dir
            when 'up' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]-1]) and not @cursorAtPos [c[0], c[1]+1]
                        newCursors.splice @indexOfCursor(c), 1
            when 'down' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]+1]) and not @cursorAtPos [c[0], c[1]-1]
                        newCursors.splice @indexOfCursor(c), 1    
        @do.cursor @, newCursors 
        
    cancelCursors: () ->
        @do.cursor @, [@cursors[0]]

    cancelCursorsAndHighlights: () ->
        @cancelCursors()
        @highlights = []
        @renderHighlights()            

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    setCursorPos: (c, p) ->
        newCursors = _.cloneDeep @cursors
        newCursors[@indexOfCursor(c)] = p
        @do.cursor @, newCursors
        
    moveCursorToPos: (c, p) -> 
        @closingInserted = null
        @setCursorPos c, p
                        
    moveAllCursors: (e, f) ->
        @startSelection e
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors
            newCursors[@indexOfCursor(c)] = f(c)
        @do.cursor @, newCursors
        @endSelection e
        
    moveCursorsToEndOfLine:   (e) -> @moveAllCursors e, (c) => [@lines[c[1]].length, c[1]]
    moveCursorsToStartOfLine: (e) -> @moveAllCursors e, (c) -> [0, c[1]]
    moveCursorsToEndOfWord:   (e) -> @moveAllCursors e, @endOfWordAtCursor
    moveCursorsToStartOfWord: (e) -> @moveAllCursors e, @startOfWordAtCursor
    moveCursorsUp:            (e) -> @moveAllCursors e, (c) -> [c[0], c[1]-1]
    moveCursorsDown:          (e) -> @moveAllCursors e, (c) -> [c[0], c[1]+1]
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors e, moveRight(n)
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [c[0]-n, c[1]]
        @moveAllCursors e, moveLeft(n)
        
    moveCursors: (direction, e) ->
        
        if @selections.length > 1 and @cursors.length == 1
            switch direction
                when 'left'  then return @cursorsAtStartOfSelections()
                when 'right' then return @cursorsAtEndOfSelections()
        
        switch direction
            when 'left'  then @moveCursorsLeft e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp e
            when 'down'  then @moveCursorsDown e

    moveCursorToLineIndex: (i, e) -> # todo handle e
        @moveCursorToPos @cursors[0], [@cursors[0][0], i]
        
    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   
    
    indentLineAtIndex: (i) ->
        @do.start()
        @do.change @lines, i, @indentString + @lines[i]
        if (@cursors[0][1] == i) and @cursors[0][0] > 0
            @moveCursorToPos @cursors[0], [@cursors[0][0] + @indentString.length, @cursors[0][1]]
        if (@selection?[1] == i) and @selection[0] > 0
            @setSelection @selection[0] + @indentString.length, @selection[1]
        @do.end()
    
    deIndentLineAtIndex: (i) ->
        @do.start()
        if @lines[i].startsWith @indentString
            @do.change @lines, i, @lines[i].substr @indentString.length
            if (@cursors[0][1] == i) and (@cursors[0][0] > 0)
                @moveCursorToPos @cursors[0], [Math.max(0, @cursors[0][0] - @indentString.length), @cursors[0][1]]
            if (@selection?[1] == i) and (@selection[0] > 0)
                @setSelection Math.max(0, @selection[0] - @indentString.length), @selection[1]
        @do.end()
    
    deIndent: -> 
        @do.start()
        for i in @cursorOrSelectedLineIndices()
            @deIndentLineAtIndex i
        @do.end()
        
    indent: ->
        @indentLineAtIndex @cursors[0][1]
           
    #  0000000   0000000   00     00  00     00  00000000  000   000  000000000
    # 000       000   000  000   000  000   000  000       0000  000     000   
    # 000       000   000  000000000  000000000  0000000   000 0 000     000   
    # 000       000   000  000 0 000  000 0 000  000       000  0000     000   
    #  0000000   0000000   000   000  000   000  00000000  000   000     000   

    toggleLineComment: ->
        lineComment = "#" # todo: make this file type dependent
        @do.start()
        for i in @cursorOrSelectedLineIndices()
            cs = @lines[i].indexOf lineComment
            if cs >= 0 and @lines[i].substr(0,cs).trim().length == 0
                @do.change @lines, i, @lines[i].splice cs, 1
                si = @indentationAtLineIndex i
                if si % @indentString.length == 1
                    @do.change @lines, i, @lines[i].splice si-1, 1
            else
                si = @indentationAtLineIndex i
                if @lines[i].length > si
                    @do.change @lines, i, @lines[i].splice si, 0, lineComment + " "
        @do.end()
 
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertCharacter: (ch) ->
        @clearHighlights()
        if ch in @surroundCharacters #and (@cursor[0] == 0 or @lines[@cursor[1]][@cursor[0]-1] != '\\' )
            @insertSurroundCharacter ch
            return

        if ch == '\n'
            @insertNewline()
            return

        @do.start()
        @deleteSelection()
        # log 'insertCharacter', @cursors
        for c in @cursors
            throw new Error if c.length < 2
            throw new Error if c[1] >= @lines.length
            @do.change @lines, c[1], @lines[c[1]].splice c[0], 0, ch
            @setCursorPos c, [c[0]+1, c[1]]
        @do.end()
        
    insertSurroundCharacter: (ch) ->
        @do.start()
        
        if @selection?
            # log 'surround selection', ch, @selection
            for r in @selectionsInLineIndexRange [0,@lines.length-1]
                [cl,cr] = switch ch
                    when "[", "]" then ["[", "]"]
                    when "{", "}" then ["{", "}"]
                    when "(", ")" then ["(", ")"]
                    when "'"      then ["'", "'"]
                    when '"'      then ['"', '"']
                @do.change @lines, r[0], @lines[r[0]].splice r[1][1], 0, cr
                @do.change @lines, r[0], @lines[r[0]].splice r[1][0], 0, cl                
            @setCursorPos @cursors[0], [@cursors[0][0]+2, @cursors[0][1]]
        else
            if @closingInserted == ch
                @closingInserted = null
                @moveCursorRight()
            else
                for c in @cursors
                    @do.change @lines, c[1], @lines[c[1]].splice c[0], 0, ch
                    c2 = switch c
                        when '"' then '"'
                        when "'" then "'"
                        when "[" then "]"
                        when '{' then '}'
                        when '(' then ')'

                    if c2? 
                        @do.change @lines, c[1], @lines[c[1]].splice c[0]+1, 0, c2 
                        @closingInserted = c2
                    
                    @setCursorPos c, [c[0]+1, c[1]]
        @do.end()

    insertTab: ->
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @indentLineAtIndex i
        else
            il = @indentString.length
            for c in @cursors
                for i in [0...(4-(c[0]%il))]
                    @do.change @lines, c[1], @lines[c[1]].splice c[0], 0, ' '
                    @setCursorPos c, [c[0]+1, c[1]]
        @do.end()
        
    insertNewline: ->
        @closingInserted = null
        @do.start()
        @deleteSelection()
        
        newCursors = _.cloneDeep @cursors

        for c in @cursors
            indent = _.padStart "", @indentationAtLineIndex c[1]
            if @cursorAtEndOfLine c
                @do.insert @lines, c[1]+1, indent
            else
                @do.insert @lines, c[1]+1, indent + @lines[c[1]].substr c[0]
                @do.change @lines, c[1],   @lines[c[1]].substr 0, c[0]
                
            newCursors[@indexOfCursor(c)] = [indent.length, c[1]+1]
        
        @do.cursor @, newCursors    
        @do.end()
        
    insertText: (text) ->
        @do.start()
        for ch in text
            @insertCharacter ch
        @do.end()
    
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLineOfCursor: (c) ->
        if not @cursorInLastLine c
            @do.start()
            @do.change @lines, c[1], @lines[c[1]] + @lines[c[1]+1]
            @do.delete @lines, c[1]+1
            @do.end()
            
    joinLine: ->
        @do.start()
        for c in @cursors
            @joinLineOfCursor c
        @do.end()
            
    deleteLineAtIndex: (i) ->
        @do.delete @lines, i
                    
    deleteSelection: ->
        @do.start()
        newCursors = _.cloneDeep @cursors
        for s in @reversedSelections()
            
            # @startOfContinuousSelection
            for c in @cursorsInRange s
                newCursors[@indexOfCursor(c)][0] = s[1][0]

            if @isSelectedLineAtIndex s[0]
                if @lines.length > 1
                    @do.delete @lines, s[0]
                else
                    @do.change @lines, s[0], @lines[s[0]].splice s[1][0], s[1][1]-s[1][0]
            else
                @do.change @lines, s[0], @lines[s[0]].splice s[1][0], s[1][1]-s[1][0]
                
        @do.selection @, []
        @do.cursor @, newCursors
        @do.end()
        @clearHighlights()

    deleteForward: ->
        if @selection?
            @deleteSelection()
        else
            for c in @cursors
                if @cursorAtEndOfLine c
                    @joinLineOfCursor c
                else
                    @do.change @lines, c[1], @lines[c[1]].splice c[0], 1
            @clearHighlights()
        
    deleteTab: ->
        @do.start()
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            n = (c[0] % @indentString.length) or @indentString.length
            t = @textInRange [c[1], [c[0]-n, c[0]]]
            if t.trim().length == 0
                @do.change @lines, c[1], @lines[c[1]].splice c[0]-n, n
                newCursors[@indexOfCursor(c)] = [c[0]-n, c[1]]
        @do.cursor @, newCursors
        @do.end()
        @clearHighlights()
    
    deleteBackward: ->
        if @selections.length
            @deleteSelection()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @cursors
                n = (c[0] % @indentString.length) or @indentString.length
                t = @textInRange [c[1], [c[0]-n, c[0]]]
                if t.trim().length != 0
                    n = 1
                @do.change @lines, c[1], @lines[c[1]].splice c[0]-n, n
                newCursors[@indexOfCursor(c)] = [c[0]-n, c[1]]

            @do.cursor @, newCursors
            @do.end()
            @clearHighlights()
            
module.exports = Editor
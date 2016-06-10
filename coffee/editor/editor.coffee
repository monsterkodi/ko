#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

path    = require 'path'
assert  = require 'assert'
_       = require 'lodash'
undo    = require './undo'
Buffer  = require './buffer'
watcher = require './watcher'
log     = require '../tools/log'
{clamp,
 last,$} = require '../tools/tools'

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
        # log 'setLines', lines.length
        super lines
        @do.reset()
            
    done: => 
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    selectRange: (range) ->
        log 'selectRange range', range
        @do.start()
        @do.selection @, [range]
        log 'selectRange selections', @selections
        @setCursor range[1][1], range[0]
        @do.end()

    selectAdditionalRange: (range) ->
        log 'selectAdditionalRange range', range
        @do.start()
        s = _.cloneDeep @selections
        s.push range
        @do.selection @, s
        @setCursor range[1][1], range[0]
        @do.end()        

    selectNone: -> @do.selection @, []

    selectLineAtIndex: (i) -> @selectAdditionalRange @rangeForLineAtIndex i

    selectMoreLines: -> 
        start = false
        for c in @cursors
            if not @isSelectedLineAtIndex c[1]
                @selectLineAtIndex c[1]
                start = true
        return if start
        for c in @cursors
            @selectLineAtIndex c[1]+1

    selectLessLines: -> 
        for c in @cursors
            @deselectLineAtIndex c[1]

    selectAll: => @do.selection @, @rangesForAllLines()
            
    #  0000000  00000000   0000000   00000000    0000000  000   000
    # 000       000       000   000  000   000  000       000   000
    # 0000000   0000000   000000000  0000000    000       000000000
    #      000  000       000   000  000   000  000       000   000
    # 0000000   00000000  000   000  000   000   0000000  000   000

    markTextForSearch: (text) ->
        @searchText = text
        @searchRanges = @rangesForText @searchText
        if @searchRanges.length
            @selectRange @searchRanges[0]

    markSelectionForSearch: ->
        if selections.length == 0 
            @selectRange @rangeForWordAtPos @cursorPos()
        @searchText = @textInRange @selections[0]
        @searchRanges = @rangesForText @searchText
        
    jumpToNextSearchResult: ->
        r = @rangeAfterPosInRanges @cursorPos(), @searchRanges
        if not r
            @jumpToFirstSearchResult()
        else
            @selectRange r

    jumpToPrevSearchResult: ->
        r = @rangeBeforePosInRanges @cursorPos(), @searchRanges
        if not r
            @jumpToLastSearchResult()
        else
            @selectRange r
            
    jumpToLastSearchResult: -> @selectRange last @searchRanges
    jumpToFirstSearchResult: -> @selectRange @searchRanges[0]
        
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000
    
    setCursor: (c,l) -> 
        l = clamp 0, @lines.length-1, l
        c = clamp 0, @lines[l].length, c
        @do.cursor @, [[c,l]]
        
    addCursorAtPos: (p) ->
        if @cursorAtPos p
            log 'has c', p
        else
            newCursors = _.cloneDeep @cursors
            newCursors.push p
            @do.cursor @, newCursors        
            log 'num cursors', @cursors.length

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    setCursorPos: (c, p) ->
        newCursors = _.cloneDeep @cursors
        i = @cursors.indexOf c
        newCursors[i] = p
        @do.cursor @, newCursors
        
        # if not e
        #     if @selections.length
        #         @do.selection @, []
        # else # adjust selection
        #     if @selections.length == 0
        #         @do.selection @, oldCursorRanges
        #     
        #     newSelection = _.cloneDeep @selections
        #     for ci in [0...oldCursors.length]
        #         oc = oldCursors[ci]
        #         nc = newCursors[ci]
        #         s = @rangeStartingOrEndingAtPos newSelection, oc
        #         if s
        #             if nc[1] != oc[1]
        #                 # log 'cursor moved to new line!', oc[1], nc[1]
        #                 # log 'last line was', s[0]
        #                 if nc[1] > s[0]
        #                     # log 'selecting down from ', s[0], 'to', nc[1]
        #                     s[1][1] = @lines[s[0]].length
        #                     for li in [s[0]+1...nc[1]]
        #                         newSelection.push @rangeForLineAtIndex li
        #                     newSelection.push [nc[1], [0, nc[0]]]
        #                     # log "newSelection", newSelection
        #                 else
        #                     # log 'selecting up from ', nc[1], 'to', s[0]
        #                     s[1][0] = 0
        #                     for li in [s[0]-1...nc[1]]
        #                         newSelection.push @rangeForLineAtIndex li
        #                     newSelection.push [nc[1], [nc[0], @lines[nc[1]].length]]
        #                     # log "newSelection", newSelection
        #             else
        #                 if s[1][1]==s[1][0]
        #                     s[1][0] = Math.min(s[1][1], nc[0])
        #                     s[1][1] = Math.max(s[1][1], nc[0])
        #                 else if oc[0] == s[1][0]
        #                     s[1][0] = nc[0]
        #                 else if oc[0] == s[1][1]
        #                     s[1][1] = nc[0]
        #         else
        #             log 'no range for oldCursor pos', oc
        #             
        #     # log "setCursorPos", newSelection.length
        #     @do.selection @, @cleanRanges newSelection
            
        # @do.end()

    moveCursorToPos: (c, p) -> 
        @closingInserted = null
        @setCursorPos c, p
        
    setCursorToPos: (p, e) ->
        @startSelection e
        @do.cursor @, [p]
        @endSelection e
        
    startSelection: (e) ->
        if e and @selections.length == 0
            @initialCursors = _.cloneDeep @cursors
            @do.selection @, @rangesForCursors()
            
    endSelection: (e) ->
        if not e and @selections.length
            @do.selection @, []
        
    moveAllCursors: (e, f) ->
        @startSelection e
        
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors
            i = @cursors.indexOf c
            log 'i', i, c
            newCursors[i] = f(c)
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

        if ch in @surroundCharacters #and (@cursor[0] == 0 or @lines[@cursor[1]][@cursor[0]-1] != '\\' )
            @insertSurroundCharacter ch
            return

        if ch == '\n'
            @insertNewline()
            return

        @do.start()
        @deleteSelection()
        log 'insertCharacter', @cursors
        for c in @cursors
            throw new Error if c.length < 2
            throw new Error if c[1] >= @lines.length
            @do.change @lines, c[1], @lines[c[1]].splice c[0], 0, ch
            @setCursorPos c, [c[0]+1, c[1]]
        @do.end()
        
    insertSurroundCharacter: (ch) ->
        @do.start()
        
        if @selection?
            log 'surround selection', ch, @selection
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
                    @setCursor c, c[0]+1, c[1]
        @do.end()
        
    insertNewline: ->
        @closingInserted = null
        @do.start()
        @deleteSelection()
        for c in @cursors
            indent = _.padStart "", @indentationAtLineIndex c[1]
            if @cursorAtEndOfLine c
                @do.insert @lines, c[1]+1, indent
            else
                @do.insert @lines, c[1]+1, indent + @lines[c[1]].substr c[0]
                @do.change @lines, c[1],   @lines[c[1]].substr 0, c[0]
            @moveCursorRight indent.length+1
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
        
    deleteSelectionRange: (s) ->
        @do.start()
        @do.change @lines, s[0], @lines[s[0]].splice s[1][0], s[1][1]-s[1][0]
        i = 
        @do.end()
            
    deleteSelection: ->
        @do.start()
        for s in @reversedSelections()
            @deleteSelectionRange s
        @do.end()

    deleteForward: ->
        if @selection?
            @deleteSelection()
            return
        for c in @cursors
            if @cursorAtEndOfLine c
                @joinLineOfCursor c
            else
                @do.change @lines, c[1], @lines[c[1]].splice c[0], 1
    
    deleteTabForCursor: (c) ->
        n = (c[0] % @indentString.length) or @indentString.length
        t = @textInRange [c[1], [c[0]-n, c[0]]]
        if t.trim().length == 0
            @do.start()
            for i in [0...n]
                @moveCursorLeft()
                @deleteForward()
            @do.end()
    
    deleteTab: ->
        @do.start()
        for c in @cursors
            @deleteTabForCursor c
        @do.end()
    
    deleteBackward: ->
        if @selection?
            @deleteSelection()
        else
            @do.start()
            for c in @cursors
                @deleteBackwardAtCursor c
            @do.end()

    deleteForwardAtCursor: (c) ->
        if @cursorAtEndOfLine c
            @joinLineOfCursor c
        else
            @do.change @lines, c[1], @lines[c[1]].splice c[0], 1
            
    deleteBackwardAtCursor: (c) ->
        return if @cursorInFirstLine(c) and @cursorAtStartOfLine(c)
        cursorIndex = Math.min @lines[c[1]].length-1, c[0]
        strToCursor = @lines[c[1]].substr 0, cursorIndex
        @do.start()
        if strToCursor.length and strToCursor.trim() == '' # only spaces between line start and cursor
            il = @indentString.length
            rc = (cursorIndex%il) or il
            log 'deleteBackward rc',rc, 'cursorIndex', cursorIndex 
            for i in [0...rc]
                @moveCursorLeft c
                @deleteForwardAtCursor c
        else
            @moveCursorLeft c
            @deleteForwardAtCursor c
        @do.end()

module.exports = Editor
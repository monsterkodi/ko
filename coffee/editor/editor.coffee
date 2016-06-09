#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

path    = require 'path'
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

    selectNone:         -> @do.selection @, null
    setSelection: (c,l) -> @do.selection @, [c,l]

    selectRanges: (ranges) ->
        @do.start()
        @setSelection ranges[0][0], ranges[0][1]
        @setCursor    ranges[1][0], ranges[1][1]
        @do.end()

    selectAll: => @selectRanges [[0,0], @lastPos()]
    
    startSelection: (active) ->
        @do.start()
        if active and not @selection?
            @selectRanges [[Math.min(@cursor[0], @lines[@cursor[1]].length),@cursor[1]], @cursor]

    endSelection: (active) ->
        if @selection? and not active
            @selectNone()
        @do.end()
        
    #  0000000  00000000   0000000   00000000    0000000  000   000
    # 000       000       000   000  000   000  000       000   000
    # 0000000   0000000   000000000  0000000    000       000000000
    #      000  000       000   000  000   000  000       000   000
    # 0000000   00000000  000   000  000   000   0000000  000   000

    markTextForSearch: (text) ->
        # @selectRanges @rangesForText text
        @searchText = text
        @searchRanges = @rangesForText @searchText
        if @searchRanges.length
            @selectRanges @searchRanges[0]
        # log 'markTextForSearch searchRanges', @searchRanges

    markSelectionForSearch: ->
        if not @selection? 
            @selectRanges @rangesForWordAtPos @cursorPos()
        @searchText = @selectedText()
        @searchRanges = @rangesForText @searchText
        # log 'markSelectionForSearch searchRanges', @searchRanges
        
    jumpToNextSearchResult: ->
        r = @rangeAfterPosInRanges @cursorPos(), @searchRanges
        if not r
            @jumpToFirstSearchResult()
        else
            @selectRanges r

    jumpToPrevSearchResult: ->
        r = @rangeBeforePosInRanges @cursorPos(), @searchRanges
        if not r
            @jumpToLastSearchResult()
        else
            @selectRanges r
            
    jumpToLastSearchResult: -> @selectRanges last @searchRanges
    jumpToFirstSearchResult: -> @selectRanges @searchRanges[0]
        
    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000
    
    setCursorPos: (p) -> @setCursor p[0], p[1]
    setCursor: (c,l) -> 
        l = clamp 0, @lines.length-1, l
        c = clamp 0, @lines[l].length, c
        @do.cursor @, [c,l]

    moveCursorToPos:     (pos) -> 
        @closingInserted = null
        @setCursor pos[0], pos[1]
        
    moveCursorToEndOfLine:     -> @moveCursorToPos [@lines[@cursor[1]].length, @cursor[1]]
    moveCursorToStartOfLine:   -> @moveCursorToPos [0, @cursor[1]]
    moveCursorByLines:     (d) -> @moveCursorToPos [@cursor[0], @cursor[1]+d]
    moveCursorToLineIndex: (i) -> @moveCursorToPos [@cursor[0], i]

    moveCursorToEndOfWord:   -> 
        r = @rangesForWordAtPos(@cursor)[1]
        if @cursorAtEndOfLine()
            return if @cursorInLastLine()
            r = @rangesForWordAtPos([0, @cursor[1]+1])[1]
        @moveCursorToPos r
        
    moveCursorToStartOfWord: -> 
        r = @rangesForWordAtPos(@cursor)[0]
        if @cursorAtStartOfLine()
            return if @cursorInFirstLine()
            r = @rangesForWordAtPos([@lines[@cursor[1]-1].length, @cursor[1]-1])[0]
        else if r[0] == @cursor[0]
            r = @rangesForWordAtPos([@cursor[0]-1, @cursor[1]])[0]
        @moveCursorToPos r
        
    moveCursorUp: ->
        if @cursorInFirstLine()
            @moveCursorToStartOfLine()
        else
            @closingInserted = null        
            @do.cursor @, [@cursor[0], @cursor[1] - 1] # don't adjust x

    moveCursorDown: ->
        if @cursorInLastLine()
            @moveCursorToEndOfLine()
        else
            @closingInserted = null        
            @do.cursor @, [@cursor[0], @cursor[1] + 1] # don't adjust x

    moveCursorRight: (n=1) ->
        if @cursorAtEndOfLine() 
            if not @cursorInLastLine()
                @moveCursorDown()
                @moveCursorToStartOfLine()
                @moveCursorToPos [@cursor[0] + n - 1, @cursor[1]]
        else
            @moveCursorToPos [@cursor[0] + n, @cursor[1]]
    
    moveCursorLeft: (n=1) ->
        @setCursor @cursor[0], @cursor[1]
        if @cursorAtStartOfLine()
            if not @cursorInFirstLine()
                @moveCursorUp()
                @moveCursorToEndOfLine()
                @moveCursorToPos [@cursor[0] - n + 1, @cursor[1]]
        else
            @moveCursorToPos [@cursor[0] - n, @cursor[1]]
    
    moveCursor: (direction) ->
        switch direction
            when 'left'  then @moveCursorLeft()
            when 'right' then @moveCursorRight()
            when 'up'    then @moveCursorUp()
            when 'down'  then @moveCursorDown()
        
    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   
    
    indentLineAtIndex: (i) ->
        @do.start()
        @do.change @lines, i, @indentString + @lines[i]
        if (@cursor[1] == i) and @cursor[0] > 0
            @moveCursorToPos [@cursor[0] + @indentString.length, @cursor[1]]
        if (@selection?[1] == i) and @selection[0] > 0
            @setSelection @selection[0] + @indentString.length, @selection[1]
        @do.end()
    
    deIndentLineAtIndex: (i) ->
        @do.start()
        if @lines[i].startsWith @indentString
            @do.change @lines, i, @lines[i].substr @indentString.length
            if (@cursor[1] == i) and (@cursor[0] > 0)
                @moveCursorToPos [Math.max(0, @cursor[0] - @indentString.length), @cursor[1]]
            if (@selection?[1] == i) and (@selection[0] > 0)
                @setSelection Math.max(0, @selection[0] - @indentString.length), @selection[1]
        @do.end()
    
    deIndent: -> 
        @do.start()
        for i in @cursorOrSelectedLineIndices()
            @deIndentLineAtIndex i
        @do.end()
        
    indent: ->
        @indentLineAtIndex @cursor[1]
           
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
    
    insertCharacter: (c) ->

        if c in @surroundCharacters and (@cursor[0] == 0 or @lines[@cursor[1]][@cursor[0]-1] != '\\' )
            @insertSurroundCharacter c
            return

        if c == '\n'
            @insertNewline()
            return

        @do.start()
        @deleteSelection()
        @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 0, c
        @setCursor @cursor[0] + 1, @cursor[1]
        @do.end()
        
    insertSurroundCharacter: (c) ->
        @do.start()
        
        if @selection?
            log 'surround selection', c, @selection
            for r in @selectionsInLineIndexRange [0,@lines.length-1]
                [cl,cr] = switch c
                    when "[", "]" then ["[", "]"]
                    when "{", "}" then ["{", "}"]
                    when "(", ")" then ["(", ")"]
                    when "'"      then ["'", "'"]
                    when '"'      then ['"', '"']
                @do.change @lines, r[0], @lines[r[0]].splice r[1][1], 0, cr
                @do.change @lines, r[0], @lines[r[0]].splice r[1][0], 0, cl                
            @setCursor @cursor[0] + 2, @cursor[1]
        else
            if @closingInserted == c
                @closingInserted = null
                @setCursor @cursor[0] + 1, @cursor[1]
            else

                @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 0, c
    
                c2 = switch c
                    when '"' then '"'
                    when "'" then "'"
                    when "[" then "]"
                    when '{' then '}'
                    when '(' then ')'

                if c2? 
                    @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0]+1, 0, c2 
                    @closingInserted = c2
                
                @setCursor @cursor[0] + 1, @cursor[1]
        @do.end()

    insertTab: ->
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @indentLineAtIndex i
        else
            il = @indentString.length
            for i in [0...(4-(@cursor[0]%il))]
                @insertCharacter ' '
        @do.end()
        
    insertNewline: ->
        @closingInserted = null
        @do.start()
        @deleteSelection()
        indent = _.padStart "", @indentationAtLineIndex @cursor[1]
        log ">#{indent}<", @indentationAtLineIndex @cursor[1]
        if @cursorAtEndOfLine()
            @do.insert @lines, @cursor[1]+1, indent
        else
            @do.insert @lines, @cursor[1]+1, indent + @lines[@cursor[1]].substr @cursor[0]
            @do.change @lines, @cursor[1],   @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight indent.length+1
        @do.end()
        
    insertText: (text) ->
        @do.start()
        @deleteSelection()
        for c in text
            if c == '\n'
                if @cursorAtEndOfLine()
                    @do.insert @lines, @cursor[1]+1, ""
                else
                    @do.insert @lines, @cursor[1]+1, @lines[@cursor[1]].substr @cursor[0]
                    @do.change @lines, @cursor[1],   @lines[@cursor[1]].substr 0, @cursor[0]
            else
                @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 0, c
            @moveCursorRight()
        @do.end()
    
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLine: ->
        if not @cursorInLastLine()
            @do.start()
            @do.change @lines, @cursor[1], @lines[@cursor[1]] + @lines[@cursor[1]+1]
            @do.delete @lines, @cursor[1]+1
            @do.end()
            
    deleteLineAtIndex: (i) ->
        @do.delete @lines, i
        
    deleteCharacterRangeInLineAtIndex: (r, i) ->
        @do.change @lines, i, @lines[i].splice r[0], r[1]-r[0]
            
    deleteSelection: ->
        return if not @selection?
        lineRange = @selectedLineIndicesRange()
        return if not lineRange?
        @do.start()
        @deleteCharacterRangeInLineAtIndex @selectedCharacterRangeForLineAtIndex(lineRange[1]), lineRange[1]
        if lineRange[1] > lineRange[0]
            for i in [(lineRange[1]-1)...lineRange[0]]
                @deleteLineAtIndex i
            @deleteCharacterRangeInLineAtIndex @selectedCharacterRangeForLineAtIndex(lineRange[0]), lineRange[0]
        selStart = @selectionStart()
        @setCursor selStart[0], selStart[1]
        if lineRange[1] > lineRange[0]
            @joinLine()
        @selectNone()
        @do.end()

    deleteForward: ->
        if @selection?
            @deleteSelection()
            return
        if @cursorAtEndOfLine()
            @joinLine()
        else
            @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 1
    
    deleteTab: ->
        n = (@cursor[0] % @indentString.length) or @indentString.length
        t = @textInRange [@cursor[1], [@cursor[0]-n, @cursor[0]]]
        if t.trim().length == 0
            @do.start()
            for i in [0...n]
                @moveCursorLeft()
                @deleteForward()
            @do.end()
    
    deleteBackward: ->
        if @selection?
            @deleteSelection()
        else
            return if @cursorInFirstLine() and @cursorAtStartOfLine()
            cursorIndex = Math.min @lines[@cursor[1]].length-1, @cursor[0]
            strToCursor = @lines[@cursor[1]].substr 0, cursorIndex
            @do.start()
            if strToCursor.length and strToCursor.trim() == '' # only spaces between line start and cursor
                il = @indentString.length
                rc = (cursorIndex%il) or il
                for i in [0...rc]
                    @moveCursorLeft()
                    @deleteForward()
            else
                @moveCursorLeft()
                @deleteForward()
            @do.end()

module.exports = Editor
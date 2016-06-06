#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

path    = require 'path'
undo    = require './undo'
Buffer  = require './buffer'
watcher = require './watcher'
log     = require '../tools/log'
{clamp,
 last,$} = require '../tools/tools'

class Editor extends Buffer
    
    constructor: () ->
        @currentFile = null
        @watch = null
        @do = new undo @done
        super

    setCurrentFile: (file) ->
        @watch?.stop()
        @currentFile = file
        @setDirty false
        if file?
            @watch = new watcher @
        else
            @watch = null

    setLines: (lines) ->
        # log 'setLines', lines.length
        super lines
        @do.reset()
    
    setDirty: (dirty) ->
        @dirty = dirty
        @updateTitlebar()
        
    done: ->
        @setDirty true
        
    # 000000000  000  000000000  000      00000000  0000000     0000000   00000000 
    #    000     000     000     000      000       000   000  000   000  000   000
    #    000     000     000     000      0000000   0000000    000000000  0000000  
    #    000     000     000     000      000       000   000  000   000  000   000
    #    000     000     000     0000000  00000000  0000000    000   000  000   000
    
    updateTitlebar: ->
        filename = path.basename @currentFile if @currentFile
        ds = @dirty and "●" or ""
        dc = @dirty and " dirty" or ""
        filename = "<span class=\"title#{dc}\">#{ds} #{filename} #{ds}</span>"
        $('.titlebar').innerHTML = filename 


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

    markSelectionForSearch: ->
        if not @selection? 
            @selectRanges @rangesForWordAtPos @cursorPos()
        @searchText = @selectedText()
        @searchRanges = @rangesForText @searchText
        log 'searchRanges', @searchRanges
        
    jumpToNextSearchResult: ->
        r = @rangeAfterPosInRanges @cursorPos(), @searchRanges
        if not r
            @jumpToFirstSearchResult()
        else
            @selectRanges r

    jumpToPrevSearchResult: ->
        log 'prev'
        r = @rangeBeforePosInRanges @cursorPos(), @searchRanges
        log 'r', r
        if not r
            log 'last'
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

    moveCursorToPos:     (pos) -> @setCursor pos[0], pos[1]
    moveCursorToEndOfLine:     -> @setCursor @lines[@cursor[1]].length, @cursor[1]
    moveCursorToStartOfLine:   -> @setCursor 0, @cursor[1]
    moveCursorByLines:     (d) -> @setCursor @cursor[0], @cursor[1]+d
    moveCursorToLineIndex: (i) -> @setCursor @cursor[0], i

    moveCursorToEndOfWord:   -> 
        r = @rangesForWordAtPos(@cursor)[1]
        if @cursorAtEndOfLine()
            return if @cursorInLastLine()
            r = @rangesForWordAtPos([0, @cursor[1]+1])[1]
        @setCursorPos r
        
    moveCursorToStartOfWord: -> 
        r = @rangesForWordAtPos(@cursor)[0]
        if @cursorAtStartOfLine()
            return if @cursorInFirstLine()
            r = @rangesForWordAtPos([@lines[@cursor[1]-1].length, @cursor[1]-1])[0]
        else if r[0] == @cursor[0]
            r = @rangesForWordAtPos([@cursor[0]-1, @cursor[1]])[0]
        @setCursorPos r
        
    moveCursorUp: ->
        if @cursorInFirstLine()
            @moveCursorToStartOfLine()
        else
            @do.cursor @, [@cursor[0], @cursor[1] - 1] # don't adjust x

    moveCursorDown: ->
        if @cursorInLastLine()
            @moveCursorToEndOfLine()
        else
            @do.cursor @, [@cursor[0], @cursor[1] + 1] # don't adjust x

    moveCursorRight: ->
        if @cursorAtEndOfLine() 
            if not @cursorInLastLine()
                @moveCursorDown()
                @moveCursorToStartOfLine()
        else
            @setCursor @cursor[0] + 1, @cursor[1]
    
    moveCursorLeft: ->
        @setCursor @cursor[0], @cursor[1]
        if @cursorAtStartOfLine()
            if not @cursorInFirstLine()
                @moveCursorUp()
                @moveCursorToEndOfLine()
        else
            @setCursor @cursor[0] - 1, @cursor[1]
    
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

    indentString: -> '    '
    
    indentLineAtIndex: (i) ->
        @do.start()
        indent = @indentString()
        @do.change @lines, i, indent + @lines[i]
        if (@cursor[1] == i) and @cursor[0] > 0
            @setCursor @cursor[0] + indent.length, @cursor[1]
        if (@selection?[1] == i) and @selection[0] > 0
            @setSelection @selection[0] + indent.length, @selection[1]
        @do.end()
    
    deIndentLineAtIndex: (i) ->
        @do.start()
        indent = @indentString()        
        if @lines[i].startsWith indent
            @do.change @lines, i, @lines[i].substr indent.length
            if (@cursor[1] == i) and @cursor[0] > 0
                @setCursor Math.max 0, @cursor[0] - indent.length, @cursor[1]
            if (@selection?[1] == i) and @selection[0] > 0
                @setSelection Math.max 0, @selection[0] - indent.length, @selection[1]
        @do.end()
    
    deIndent: -> 
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @deIndentLineAtIndex i
        else
            @deIndentLineAtIndex @cursor[1]    
        @do.end()
            
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertCharacter: (c) ->
        @do.start()
        @deleteSelection()
        @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 0, c
        @setCursor @cursor[0] + 1, @cursor[1]
        @do.end()
        
    insertTab: ->
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @indentLineAtIndex i
        else
            il = @indentString().length
            for i in [0...(4-(@cursor[0]%il))]
                @insertCharacter ' '
        @do.end()
        
    insertNewline: ->
        @do.start()
        @deleteSelection()
        if @cursorAtEndOfLine()
            @do.insert @lines, @cursor[1]+1, ""
        else
            @do.insert @lines, @cursor[1]+1, @lines[@cursor[1]].substr @cursor[0]
            @do.change @lines, @cursor[1],   @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight()
        @do.end()
        
    insertText: (text) ->
        @do.start()
        @deleteSelection()
        for c in text
            if c == '\n'
                @insertNewline()
            else
                @insertCharacter c
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
    
    deleteBackward: ->
        if @selection?
            @deleteSelection()
        else
            return if @cursorInFirstLine() and @cursorAtStartOfLine()
            cursorIndex = Math.min @lines[@cursor[1]].length-1, @cursor[0]
            strToCursor = @lines[@cursor[1]].substr 0, cursorIndex
            @do.start()
            if strToCursor.length and strToCursor.trim() == '' # only spaces between line start and cursor
                il = @indentString().length
                rc = cursorIndex%il or il
                for i in [0...rc]
                    @moveCursorLeft()
                    @deleteForward()
            else
                @moveCursorLeft()
                @deleteForward()
            @do.end()

module.exports = Editor
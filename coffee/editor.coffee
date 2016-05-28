#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

undo    = require './undo'
Buffer  = require './buffer'
log     = require './tools/log'
{clamp} = require './tools/tools'

class Editor extends Buffer
    
    constructor: (elem, className) ->
        super
        
        @do        = new undo @done
        @cursor    = [0,0]
        @selection = null
        @lines     = [""]

    done: () => setTimeout @update, 0 if @update?

    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    selectNone:         => @selection = @do.selection @selection, null
    setSelection: (c,l) => @selection = @do.selection @selection, [c,l]

    selectRange: (range) =>
        @setSelection range[0][0], range[0][1]
        @setCursor    range[1][0], range[1][1]

    selectAll: => @selectRange [[0,0], @lastPos()]
    
    startSelection: (active) =>
        if active and not @selection?
            @selectRange [[Math.min(@cursor[0], @lines[@cursor[1]].length),@cursor[1]], @cursor]

    endSelection: (active) =>
        if @selection? and not active
            @selectNone()
        else
            @update()
        
    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000
    
    setCursorPos: (p) => @setCursor p[0], p[1]
    setCursor: (c,l) => 
        l = Math.min l, @lines.length-1
        c = Math.min c, @lines[l].length        
        @do.cursor @cursor, [c,l]

    moveCursorToPos: (pos)   => @setCursor pos[0], pos[1]
    moveCursorToEndOfLine:   => @setCursor @lines[@cursor[1]].length, @cursor[1]
    moveCursorToStartOfLine: => @setCursor 0, @cursor[1]

    moveCursorToEndOfWord:   => 
        r = @rangeForWordAtPos(@cursor)[1]
        if @cursorAtEndOfLine()
            return if @cursorInLastLine()
            r = rangeForWordAtPos([0, @cursor[1]+1])[1]
        @setCursorPos r
        
    moveCursorToStartOfWord: => 
        r = @rangeForWordAtPos(@cursor)[0]
        if @cursorAtStartOfLine()
            return if @cursorInFirstLine()
            r = @rangeForWordAtPos([@lines[@cursor[1]-1].length, @cursor[1]-1])[0]
        else if r[0] == @cursor[0]
            r = @rangeForWordAtPos([@cursor[0]-1, @cursor[1]])[0]
        @setCursorPos r
        
    moveCursorUp: =>
        if @cursorInFirstLine()
            @moveCursorToStartOfLine()
        else
            @do.cursor @cursor, [@cursor[0], @cursor[1] - 1] # don't adjust x

    moveCursorDown: =>
        if @cursorInLastLine()
            @moveCursorToEndOfLine()
        else
            @do.cursor @cursor, [@cursor[0], @cursor[1] + 1] # don't adjust x

    moveCursorRight: =>
        if @cursorAtEndOfLine() 
            if not @cursorInLastLine()
                @moveCursorDown()
                @moveCursorToStartOfLine()
        else
            @setCursor @cursor[0] + 1, @cursor[1]
    
    moveCursorLeft: =>
        @setCursor @cursor[0], @cursor[1]
        if @cursorAtStartOfLine()
            if not @cursorInFirstLine()
                @moveCursorUp()
                @moveCursorToEndOfLine()
        else
            @setCursor @cursor[0] - 1, @cursor[1]
    
    moveCursor: (direction) =>
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

    indentString: => '    '
    
    indentLineAtIndex: (i) =>
        @do.start()
        indent = @indentString()
        @do.change @lines, i, indent + @lines[i]
        if (@cursor[1] == i) and @cursor[0] > 0
            @setCursor @cursor[0] + indent.length, @cursor[1]
        if (@selection?[1] == i) and @selection[0] > 0
            @setSelection @selection[0] + indent.length, @selection[1]
        @do.end()
    
    deIndentLineAtIndex: (i) =>
        @do.start()
        indent = @indentString()        
        if @lines[i].startsWith indent
            @do.change @lines, i, @lines[i].substr indent.length
            if (@cursor[1] == i) and @cursor[0] > 0
                @setCursor Math.max 0, @cursor[0] - indent.length, @cursor[1]
            if (@selection?[1] == i) and @selection[0] > 0
                @setSelection Math.max 0, @selection[0] - indent.length, @selection[1]
        @do.end()
    
    deIndent: => 
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
    
    insertCharacter: (c) =>
        @do.start()
        @deleteSelection()
        @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 0, c
        @setCursor @cursor[0] + 1, @cursor[1]
        @do.end()
        
    insertTab: =>
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @indentLineAtIndex i
        else
            il = @indentString().length
            for i in [0...(4-(@cursor[0]%il))]
                @insertCharacter ' '
        @do.end()
        
    insertNewline: =>
        @do.start()
        @deleteSelection()
        if @cursorAtEndOfLine()
            @do.change @lines.splice @cursor[1]+1, 0, ""
        else
            @do.insert @lines, @cursor[1]+1, @lines[@cursor[1]].substr @cursor[0]
            @do.change @lines, @cursor[1],   @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight()
        @do.end()
        
    insertText: (text) =>
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
    
    joinLine: =>
        if not @cursorInLastLine()
            @do.start()
            @do.change @lines, @cursor[1], @lines[@cursor[1]] + @lines[@cursor[1]+1]
            @do.delete @lines, @cursor[1]+1
            @do.end()
            
    deleteLineAtIndex: (i) =>
        @do.delete @lines, i
        
    deleteCharacterRangeInLineAtIndex: (r, i) =>
        @do.change @lines, i, @lines[i].splice r[0], r[1]-r[0]
            
    deleteSelection: =>
        return if not @selection?
        lineRange = @selectedLineRange()
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

    deleteForward: =>
        if @selection?
            @deleteSelection()
            return
        if @cursorAtEndOfLine()
            @joinLine()
        else
            @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 1
    
    deleteBackward: =>
        if @selection?
            @deleteSelection()
        else
            if @cursorInFirstLine() and @cursorAtStartOfLine()
                return
            cursorIndex = Math.min @lines[@cursor[1]].length-1, @cursor[0]
            strToCursor = @lines[@cursor[1]].substr 0, cursorIndex
            if strToCursor.trim() == '' # only spaces between line start and cursor
                il = @indentString().length
                rc = cursorIndex%il or il
                for i in [0...rc]
                    @moveCursorLeft()
                    @deleteForward()
            else
                @moveCursorLeft()
                @deleteForward()

module.exports = Editor
# 000  000   000   0000000  00000000  00000000   000000000
# 000  0000  000  000       000       000   000     000   
# 000  000 0 000  0000000   0000000   0000000       000   
# 000  000  0000       000  000       000   000     000   
# 000  000   000  0000000   00000000  000   000     000   
{
clamp
} = require 'kxk'
_ = require 'lodash'

module.exports =
    
    insertCharacter: (ch) ->
        return if @salterMode and @insertSalterCharacter ch
        
        @do.start()
        @clampCursorOrFillVirtualSpaces()
        
        if ch in @surroundCharacters
            if @insertSurroundCharacter ch
                @do.end()
                return

        if ch == '\n'
            doIndent = not @isCursorInIndent()
            @insertNewline indent:doIndent
            @do.end()
            return
    
        if ch == '>' and @numCursors() == 1 and @lineComment?
            cp = @cursorPos()
            cl = @lineComment.length
            if cp[0] >= cl and @do.line(cp[1]).slice(cp[0]-cl, cp[0]) == @lineComment
                ws = @wordStartPosAfterPos()
                if ws?
                    @do.delete cp[1]
                    @do.end()
                    @startSalter ws
                    return
        
        @deleteSelection()

        newCursors = @do.cursors()
        for cc in newCursors
            @do.change cc[1], @do.line(cc[1]).splice cc[0], 0, ch
            for nc in @positionsForLineIndexInPositions cc[1], newCursors
                if nc[0] >= cc[0]
                    nc[0] += 1
        
        @do.cursor newCursors
        @do.end()
        @emitEdit 'insert'

    clampCursorOrFillVirtualSpaces: ->
        @do.start()
        if @do.numCursors() == 1
            cursor = @do.state.cursors()[0]
            y = clamp 0, @do.numLines()-1, cursor[1]
            lineLength = @do.numLines() and @do.line(cursor[1]).length or 0
            x = clamp 0, lineLength, cursor[0]
            @do.cursor [[x,y]]
        else # fill spaces between line ends and cursors
            for c in @cursors 
                if c[0] > @do.line(c[1]).length
                    @do.change c[1], @do.line(c[1]).splice c[0], 0, _.padStart '', c[0]-@do.line(c[1]).length
        @do.end()

    insertTab: ->
        if @numSelections()
            @indent()
        else
            @do.start()
            newCursors = @do.cursors()
            il = @indentString.length
            for c in newCursors
                n = 4-(c[0]%il)
                @do.change c[1], @do.line(c[1]).splice c[0], 0, _.padStart "", n
                @cursorDelta c, n
            @do.cursor newCursors
            @do.end()   

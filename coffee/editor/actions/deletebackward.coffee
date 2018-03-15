
# 0000000     0000000    0000000  000   000  000   000   0000000   00000000   0000000
# 000   000  000   000  000       000  000   000 0 000  000   000  000   000  000   000
# 0000000    000000000  000       0000000    000000000  000000000  0000000    000   000
# 000   000  000   000  000       000  000   000   000  000   000  000   000  000   000
# 0000000    000   000   0000000  000   000  00     00  000   000  000   000  0000000

{ reversed, log, _ } = require 'kxk'

module.exports =

    actions:
        menu: 'Delete'

        deleteBackward:
            name:  'Delete Backward'
            text:  'delete character to the left'
            combo: 'backspace'

        deleteBackwardIgnoreLineBoundary:
            name:   'Delete Backward Over Line Boundaries'
            combo:  'command+backspace'
            accel:  'ctrl+backspace'

        deleteBackwardSwallowWhitespace:
            name:   'Delete Backward Over Whitespace'
            combo:  'alt+backspace'

    deleteBackwardIgnoreLineBoundary: -> @deleteBackward ignoreLineBoundary:true 
    deleteBackwardSwallowWhitespace:  -> @deleteBackward ignoreTabBoundary:true 
            
    deleteBackward: (opt) ->

        @do.start()
        if @do.numSelections()
            @deleteSelection()
        else if @salterMode
            @deleteSalterCharacter()
        else if not @deleteEmptySurrounds()
            @deleteCharacterBackward opt
        @do.end()

    deleteCharacterBackward: (opt) ->

        newCursors = @do.cursors()

        removeNum = switch
            when opt?.singleCharacter    then 1
            when opt?.ignoreLineBoundary then -1 # delete spaces to line start or line end
            when opt?.ignoreTabBoundary # delete space columns
                Math.max 1, _.min newCursors.map (c) =>
                    t = @do.textInRange [c[1], [0, c[0]]]
                    n = t.length - t.trimRight().length
                    n += c[0] - @do.line(c[1]).length if @isCursorVirtual c
                    Math.max 1, n
            else # delete spaces to previous tab column
                Math.max 1, _.min newCursors.map (c) =>
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @do.textInRange [c[1], [Math.max(0, c[0]-n), c[0]]]
                    n -= t.trimRight().length
                    Math.max 1, n

        for c in reversed newCursors
            if c[0] == 0 # cursor at start of line
                if opt?.ignoreLineBoundary or @do.numCursors() == 1
                    if c[1] > 0 # cursor not in first line
                        ll = @do.line(c[1]-1).length
                        @do.change c[1]-1, @do.line(c[1]-1) + @do.line(c[1])
                        @do.delete c[1]
                        # move cursors in joined line
                        for nc in positionsAtLineIndexInPositions c[1], newCursors
                            cursorDelta nc, ll, -1
                        # move cursors below deleted line up
                        for nc in positionsBelowLineIndexInPositions c[1], newCursors
                            cursorDelta nc, 0, -1
            else
                if removeNum < 1 # delete spaces to line start or line end
                    t = @do.textInRange [c[1], [0, c[0]]]
                    n = t.length - t.trimRight().length
                    n += c[0] - @do.line(c[1]).length if @isCursorVirtual c
                    n = Math.max 1, n
                else
                    n = removeNum
                @do.change c[1], @do.line(c[1]).splice c[0]-n, n
                for nc in positionsAtLineIndexInPositions c[1], newCursors
                    if nc[0] >= c[0]
                        cursorDelta nc, -n
                        
        @do.setCursors newCursors

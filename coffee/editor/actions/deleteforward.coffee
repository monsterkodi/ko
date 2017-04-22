# 00000000   0000000   00000000   000   000   0000000   00000000   0000000  
# 000       000   000  000   000  000 0 000  000   000  000   000  000   000
# 000000    000   000  0000000    000000000  000000000  0000000    000   000
# 000       000   000  000   000  000   000  000   000  000   000  000   000
# 000        0000000   000   000  00     00  000   000  000   000  0000000  

{ reversed, log 
} = require 'kxk' 

module.exports = 
    
    actions:
        
        deleteForward:
            name:   'delte forward'
            combos: ['delete', 'ctrl+backspace']
            text:   'delete character to the right'

        deleteToEndOfLine:
            name:   'delte to end of line'
            combo:  'ctrl+shift+k'
            text:   'delete characters to the end of line'
            
        deleteToEndOfLineOrWholeLine:
            name:   'delte to end of line or delete whole line'
            combo:  'ctrl+k'
            text:   """delete characters to the end of line, if cursor is not at end of line.
                delete whole line otherwise.
                """
        test:
            a: 'he'
            b: 'world'
            c: 'wordHighlights'

    deleteToEndOfLine: ->
        @do.start()
        @moveCursorsToLineBoundary 'right', extend:true
        @deleteSelection deleteLines:false
        @do.end()
        
    deleteToEndOfLineOrWholeLine: ->
        @do.start()
        @moveCursorsToLineBoundary 'right', extend:true
        
        for s in @do.selections()
            if lengthOfRange s
                @deleteToEndOfLine()
                return @do.end()
        @selectMoreLines()
        @deleteSelection deleteLines:true      
        @do.end()

    deleteForward: ->
        if @numSelections()
            @deleteSelection()
        else
            @do.start()
            newCursors = @do.cursors()
            for c in reversed newCursors
            
                if @isCursorAtEndOfLine c # cursor at end of line
                    if not @isCursorInLastLine c # cursor not in first line
                    
                        ll = @line(c[1]).length
                    
                        @do.change c[1], @do.line(c[1]) + @do.line(c[1]+1)
                        @do.delete c[1]+1
                                    
                        # move cursors in joined line
                        for nc in positionsForLineIndexInPositions c[1]+1, newCursors
                            cursorDelta nc, ll, -1
                        # move cursors below deleted line up
                        for nc in positionsBelowLineIndexInPositions c[1]+1, newCursors
                            cursorDelta nc, 0, -1
                else
                    @do.change c[1], @do.line(c[1]).splice c[0], 1
                    for nc in positionsForLineIndexInPositions c[1], newCursors
                        if nc[0] > c[0]
                            cursorDelta nc, -1

            @do.setCursors newCursors
            @do.end()

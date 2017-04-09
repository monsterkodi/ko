# 000  000   000  0000000    00000000  000   000  000000000
# 000  0000  000  000   000  000       0000  000     000   
# 000  000 0 000  000   000  0000000   000 0 000     000   
# 000  000  0000  000   000  000       000  0000     000   
# 000  000   000  0000000    00000000  000   000     000   

module.exports =
      
    actions: 
        indent:
            name:  'indent'
            combo: 'command+]'
        deIndent:
            name:  'de-indent'
            combo: 'command+['
            
    indent: ->
        @do.start()
        newSelections = @do.selections()
        newCursors    = @do.cursors()
        for i in @selectedAndCursorLineIndices()
            @do.change i, @indentString + @do.line(i)
            for nc in positionsForLineIndexInPositions i, newCursors
                @cursorDelta nc, @indentString.length
            for ns in @rangesForLineIndexInRanges i, newSelections
                ns[1][0] += @indentString.length
                ns[1][1] += @indentString.length
        @do.select newSelections
        @do.setCursors newCursors
        @do.end()

    deIndent: -> 
        @do.start()
        newSelections = @do.selections()
        newCursors    = @do.cursors()
        for i in @selectedAndCursorLineIndices()
            if @do.line(i).startsWith @indentString
                @do.change i, @do.line(i).substr @indentString.length
                lineCursors = positionsForLineIndexInPositions i, newCursors
                for nc in lineCursors
                    @cursorDelta nc, -@indentString.length
                for ns in @rangesForLineIndexInRanges i, newSelections
                    ns[1][0] -= @indentString.length
                    ns[1][1] -= @indentString.length
        @do.select newSelections
        @do.setCursors newCursors
        @do.end()

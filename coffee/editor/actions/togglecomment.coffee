#  0000000   0000000   00     00  00     00  00000000  000   000  000000000
# 000       000   000  000   000  000   000  000       0000  000     000   
# 000       000   000  000000000  000000000  0000000   000 0 000     000   
# 000       000   000  000 0 000  000 0 000  000       000  0000     000   
#  0000000   0000000   000   000  000   000  00000000  000   000     000   

module.exports =
    
    actions:
        toggleComment:
            name: 'toggle comment'
            combo: 'command+/'

    toggleComment: ->
        
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        moveInLine = (i, d) => 
            for s in @rangesForLineIndexInRanges i, newSelections
                s[1][0] += d
                s[1][1] += d
            for c in positionsForLineIndexInPositions i, newCursors
                cursorDelta c, d
                
        mainCursorLine = @do.line @mainCursor()[1]
        cs = mainCursorLine.indexOf @lineComment
        uncomment = cs >= 0 and mainCursorLine.substr(0,cs).trim().length == 0
        
        for i in @selectedAndCursorLineIndices()
            cs = @do.line(i).indexOf @lineComment
            if uncomment 
                if cs >= 0 and @do.line(i).substr(0,cs).trim().length == 0
                    # remove comment
                    @do.change i, @do.line(i).splice cs, @lineComment.length
                    moveInLine i, -@lineComment.length
                    si = indentationInLine @do.line(i)
                    if si % @indentString.length == 1 # remove space after indent
                        @do.change i, @do.line(i).splice si-1, 1
                        moveInLine i, -1
            else # insert comment
                si = indentationInLine @do.line(i)
                if @do.line(i).length > si
                    l = (@lineComment + " ").length
                    @do.change i, @do.line(i).splice si, 0, @lineComment + " "
                    moveInLine i, l
        @do.select newSelections
        @do.setCursors newCursors
        @do.end()

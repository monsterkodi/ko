# 00000000    0000000    0000000  000000000  00000000
# 000   000  000   000  000          000     000     
# 00000000   000000000  0000000      000     0000000 
# 000        000   000       000     000     000     
# 000        000   000  0000000      000     00000000
        
module.exports = 
    
    paste: (text) ->
        
        @deleteSelection()
        @do.start()        
        @clampCursorOrFillVirtualSpaces()
        
        newCursors = @do.cursors()

        l = text.split '\n'
        if newCursors.length > 1 and l.length == 1
            l = (l[0] for c in newCursors)
                    
        if newCursors.length > 1 or l.length == 1 and (newCursors[0] > 0 or not text.endsWith '\n')
            for ci in [newCursors.length-1..0]
                c = newCursors[ci]
                insert = l[ci % l.length]
                @do.change c[1], @lines[c[1]].splice c[0], 0, insert
                for c in @positionsAfterLineColInPositions c[1], c[0], newCursors
                    @cursorDelta c, insert.length
        else
            cp = newCursors[0]
            li = cp[1]
            newSelections = []
            newCursors = []
            if cp[0] > 0
                rest   = @do.line(li).substr(cp[0]).trimLeft()
                indt   = _.padStart "", @indentationInLine @do.line cp[1] 
                before = @do.line(cp[1]).substr 0, cp[0]
                if before.trim().length
                    @do.change li, before
                    li += 1
                    if (indt + rest).trim().length
                        l.push indt + rest
                        newCursors = [[0,li+l.length-1]]
                    else
                        newCursors = null
            else 
                newCursors = null
            for line in l
                @do.insert li, line
                newSelections.push [li, [0,line.length]]
                li += 1
            newCursors = [[0, li]] if not newCursors?
            @do.select newSelections if newSelections.length > 1
                
        @do.cursor newCursors
        @do.end()

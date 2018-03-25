
# 0000000    000   000  00000000   000      000   0000000   0000000   000000000  00000000  
# 000   000  000   000  000   000  000      000  000       000   000     000     000       
# 000   000  000   000  00000000   000      000  000       000000000     000     0000000   
# 000   000  000   000  000        000      000  000       000   000     000     000       
# 0000000     0000000   000        0000000  000   0000000  000   000     000     00000000  

module.exports = 
    
    actions:
        menu: 'Line'
        
        duplicateLinesUp:
            name: 'Duplicate Lines Up'
            combo: 'alt+shift+up'
            
        duplicateLinesDown:
            name: 'Duplicate Lines Down'
            combo: 'alt+shift+down'

    duplicateLinesUp:   -> @duplicateLines 'up'
    duplicateLinesDown: -> @duplicateLines 'down'
            
    duplicateLines: (dir) ->
        
        csr = @continuousCursorAndSelectedLineIndexRanges()
        
        return if not csr.length
        
        @do.start()
        
        if @numSelections()
            @setCursorsAtSelectionBoundary 'left'
            
        newCursors = @do.cursors()

        for r in csr.reverse()
            ls = []
            for li in [r[0]..r[1]]
                ls.push @do.line(li)
            
            for i in [0...ls.length]
                @do.insert r[1]+1+i, ls[i]
                
            for nc in positionsBelowLineIndexInPositions r[1]+1, newCursors
                cursorDelta nc, 0, ls.length # move cursors below inserted lines down
                
            if dir == 'down'
                for i in [0...ls.length]
                    for nc in positionsAtLineIndexInPositions r[0]+i, newCursors
                        cursorDelta nc, 0, ls.length # move cursors in inserted lines down

        @do.select []
        @do.setCursors newCursors
        @do.end()       

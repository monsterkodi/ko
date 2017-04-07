#       000   0000000   000  000   000  000      000  000   000  00000000   0000000  
#       000  000   000  000  0000  000  000      000  0000  000  000       000       
#       000  000   000  000  000 0 000  000      000  000 0 000  0000000   0000000   
# 000   000  000   000  000  000  0000  000      000  000  0000  000            000  
#  0000000    0000000   000  000   000  0000000  000  000   000  00000000  0000000   

module.exports = 
    
    actions:
        joinLines:
            name: 'join lines'
            combo: 'command+j'
            
    joinLines: ->
        @do.start()
        newCursors = []
        for c in @do.cursors().reversed()
            if not @isCursorInLastLine c
                before = @do.line(c[1]).trimRight() + " "
                after  = @do.line(c[1]+1).trimLeft()
                
                if @fileType == 'coffee' 
                    if /(when|if)/.test before 
                        bt = before.trim()
                        if not bt.endsWith 'then' and
                            not bt.endsWith 'and' and not bt.endsWith 'or' and
                                not after.trim().startsWith 'then'
                                    after = 'then ' + after
                            
                @do.change c[1], before + after
                @do.delete c[1]+1
                newCursors.push [before.length, c[1]]
                for nc in @positionsForLineIndexInPositions c[1]+1, newCursors 
                    @cursorDelta nc, before.length, -1
                for nc in @positionsBelowLineIndexInPositions c[1], newCursors 
                    @cursorDelta nc, 0, -1
        @do.setCursors newCursors, main: 0
        @do.end()


#       000   0000000   000  000   000  000      000  000   000  00000000   0000000  
#       000  000   000  000  0000  000  000      000  0000  000  000       000       
#       000  000   000  000  000 0 000  000      000  000 0 000  0000000   0000000   
# 000   000  000   000  000  000  0000  000      000  000  0000  000            000  
#  0000000    0000000   000  000   000  0000000  000  000   000  00000000  0000000   

{ log } = require 'kxk'

module.exports = 
    
    actions:
        menu: 'Line'
        
        joinLines:
            name: 'Join Lines'
            combo: 'command+j'
            accel: 'ctrl+j'

    insertThen: (before, after) ->
        if /(when|if)/.test before 
            bw = lastWordInLine before
            if bw not in ['and', 'or'] and (not after.trim().startsWith 'then') and not /then/.test before
                after = 'then ' + after
        after

    joinLines: ->
        
        @do.start()
        
        newCursors = []
        for c in @do.cursors().reverse()
            
            if not @isCursorInLastLine c
                before = @do.line(c[1]).trimRight() + " "
                after  = @do.line(c[1]+1).trimLeft()
                
                if @fileType in ['coffee', 'koffee']
                    after = @insertThen before, after
                            
                @do.change c[1], before + after
                @do.delete c[1]+1
                
                newCursors.push [before.length, c[1]]
                
                for nc in positionsAtLineIndexInPositions c[1]+1, newCursors
                    cursorDelta nc, before.length, -1
                for nc in positionsBelowLineIndexInPositions c[1], newCursors
                    cursorDelta nc, 0, -1
                    
        @do.setCursors newCursors, main: 0
        @do.end()

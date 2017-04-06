# 0000000     0000000    0000000  000   000  000   000   0000000   00000000   0000000  
# 000   000  000   000  000       000  000   000 0 000  000   000  000   000  000   000
# 0000000    000000000  000       0000000    000000000  000000000  0000000    000   000
# 000   000  000   000  000       000  000   000   000  000   000  000   000  000   000
# 0000000    000   000   0000000  000   000  00     00  000   000  000   000  0000000  
{
last
} = require 'kxk' 
_ = require 'lodash'

module.exports =
    
    info:
        name:  'delete backward'
        combo: 'backspace'
        text:  'delete character to the left'

    deleteBackward: (opt) ->
        
        @do.start()
        if @do.numSelections()
            @deleteSelection()
        else if @salterMode
            @deleteSalterCharacter()
        else            
            if @surroundStack.length
                so = last(@surroundStack)[0]
                sc = last(@surroundStack)[1]
                for c in @do.cursors()
                    prv = ''
                    prv = @do.line(c[1]).slice c[0]-so.length, c[0] if c[0] >= so.length
                    nxt = @do.line(c[1]).slice c[0], c[0]+sc.length
                    if prv != so or nxt != sc
                        @surroundStack = []
                        break
                if @surroundStack.length                
                    for i in [0...so.length]            
                        @deleteCharacterBackward opt    
                    for i in [0...sc.length]            
                        @deleteForward()                
                    @surroundStack.pop()                
                    @do.end()
                    return
            
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
            
        for c in newCursors.reversed()
            if c[0] == 0 # cursor at start of line
                if opt?.ignoreLineBoundary or @do.numCursors() == 1
                    if c[1] > 0 # cursor not in first line
                        ll = @do.line(c[1]-1).length
                        @do.change c[1]-1, @do.line(c[1]-1) + @do.line(c[1])
                        @do.delete c[1]
                        # move cursors in joined line
                        for nc in @positionsForLineIndexInPositions c[1], newCursors
                            @cursorDelta nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1], newCursors
                            @cursorDelta nc, 0, -1
            else
                if removeNum < 1 # delete spaces to line start or line end
                    t = @do.textInRange [c[1], [0, c[0]]]
                    n = t.length - t.trimRight().length
                    n += c[0] - @do.line(c[1]).length if @isCursorVirtual c
                    n = Math.max 1, n
                else
                    n = removeNum
                @do.change c[1], @do.line(c[1]).splice c[0]-n, n
                for nc in @positionsForLineIndexInPositions c[1], newCursors
                    if nc[0] >= c[0]
                        @cursorDelta nc, -n
        @do.setCursors newCursors

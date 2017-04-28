
# 00     00   0000000   000   000  00000000  000      000  000   000  00000000   0000000  
# 000   000  000   000  000   000  000       000      000  0000  000  000       000       
# 000000000  000   000   000 000   0000000   000      000  000 0 000  0000000   0000000   
# 000 0 000  000   000     000     000       000      000  000  0000  000            000  
# 000   000   0000000       0      00000000  0000000  000  000   000  00000000  0000000   

_ = require 'lodash'

module.exports =
    
    actions:
        moveLines:
            name: 'move lines'
            combos: ['alt+up', 'alt+down']
    
    moveLines: (key, info) ->
        dir = key
        csr = @continuousCursorAndSelectedLineIndexRanges()
        
        return if not csr.length
        return if dir == 'up' and _.first(csr)[0] == 0
        return if dir == 'down' and _.last(csr)[1] == @numLines()-1
        
        d = dir == 'up' and -1 or 1
        
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()

        for r in csr.reverse()
            ls = []
            for li in [r[0]..r[1]]
                ls.push @do.line(li)
            
            switch dir 
                when 'up'   then (si = r[0]-1) ; ls.push @do.line(si)
                when 'down' then (si = r[0])   ; ls.unshift @do.line(r[1]+1)

            for i in [0...ls.length]
                @do.change si+i, ls[i]

        for ns in newSelections
            ns[0] += d
            
        for nc in newCursors
            cursorDelta nc, 0, d
                
        @do.select newSelections
        @do.setCursors newCursors
        @do.end()       

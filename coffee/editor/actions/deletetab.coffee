
# 0000000    00000000  000      00000000  000000000  00000000        000000000   0000000   0000000    
# 000   000  000       000      000          000     000                000     000   000  000   000  
# 000   000  0000000   000      0000000      000     0000000            000     000000000  0000000    
# 000   000  000       000      000          000     000                000     000   000  000   000  
# 0000000    00000000  0000000  00000000     000     00000000           000     000   000  0000000    

module.exports = 
    
    info:
        name:  'delete tab'
        combo: 'shift+tab'
        text:  'delete tab-width spaces before cursors'

    deleteTab: ->
        if @numSelections()
            @deIndent()
        else
            @do.start()
            newCursors = @do.cursors()
            for c in newCursors
                if c[0]
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @do.textInRange [c[1], [c[0]-n, c[0]]]
                    if t.trim().length == 0
                        @do.change c[1], @do.line(c[1]).splice c[0]-n, n
                        @cursorDelta c, -n
            @do.setCursors newCursors
            @do.end()

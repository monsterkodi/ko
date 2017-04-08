
# 000000000   0000000   0000000    
#    000     000   000  000   000  
#    000     000000000  0000000    
#    000     000   000  000   000  
#    000     000   000  0000000    

_ = require 'lodash'

module.exports = 
    
    actions:
        insertTab:
            name:  'insert tab'
            combo: 'tab'
        deleteTab:
            name:  'delete tab'
            combo: 'shift+tab'

    insertTab: (key, info) ->
        @stop info.event
        if @numSelections()
            @indent()
        else
            @do.start()
            newCursors = @do.cursors()
            il = @indentString.length
            for c in newCursors
                n = 4-(c[0]%il)
                @do.change c[1], @do.line(c[1]).splice c[0], 0, _.padStart "", n
                @cursorDelta c, n
            @do.setCursors newCursors
            @do.end()   

    deleteTab: (key, info) ->
        @stop info.event
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

    stop: (event) ->
        event.preventDefault()
        event.stopPropagation()

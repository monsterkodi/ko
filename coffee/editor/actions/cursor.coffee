#  0000000  000   000  00000000    0000000   0000000   00000000 
# 000       000   000  000   000  000       000   000  000   000
# 000       000   000  0000000    0000000   000   000  0000000  
# 000       000   000  000   000       000  000   000  000   000
#  0000000   0000000   000   000  0000000    0000000   000   000

_ = require 'lodash'

module.exports =

    singleCursorAtPos: (p, opt = extend:false) ->
        if @numLines() == 0
            @do.start()
            @do.insert 0, ''
            @do.end()
        p = @clampPos p
        @do.start()
        @startSelection opt
        @do.cursor [[p[0], p[1]]]
        @endSelection opt
        @do.end()
    
    setCursor: (c,l) ->
        @do.start()
        @do.cursor [c,l]
        @do.end()
        
    toggleCursorAtPos: (p) ->
        if @isPosInPositions p, @state.cursors()
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        @do.start()
        newCursors = @do.cursors()
        newCursors.push p
        @do.cursor newCursors, main:'last'
        @do.end()
        
    delCursorAtPos: (p) ->
        oldCursors = @state.cursors()
        c = @posInPositions p, oldCursors
        if c and @numCursors() > 1
            @do.start()
            newCursors = @do.cursors()
            newCursors.splice oldCursors.indexOf(c), 1
            @do.cursor newCursors, main:'closest'
            @do.end()
           
    addCursors: (dir='down') ->
        return if @numCursors() >= 999
        @do.start()
        d = switch dir
            when 'up'    then -1
            when 'down'  then +1
        oldCursors = @state.cursors()
        newCursors = @do.cursors()
        for c in oldCursors
            if not @isPosInPositions [c[0], c[1]+d], oldCursors               
                newCursors.push [c[0], c[1]+d]
                break if newCursors.length >= 999
        @sortPositions newCursors
        main = switch dir
            when 'up'    then 'first'
            when 'down'  then 'last'
        @do.cursor newCursors, main:main
        @do.end()

    alignCursorsAndText: ->
        @do.start()
        newCursors = @do.cursors()
        newX = _.max (c[0] for c in newCursors)
        lines = {}
        for nc in newCursors
            lines[nc[1]] = nc[0]
            @cursorSet nc, newX, c[1]
        for li, cx of lines
            @do.change li, @lines[li].slice(0, cx) + _.padStart('', newX-cx) + @lines[li].slice(cx)
        @do.cursor newCursors
        @do.end()

    alignCursors: (dir='down') ->
        @do.start()
        newCursors = @do.cursors()
        charPos = switch dir
            when 'up'    then first(newCursors)[0]
            when 'down'  then last(newCursors)[0]
            when 'left'  then _.min (c[0] for c in newCursors)
            when 'right' then _.max (c[0] for c in newCursors)
        for c in newCursors
            @cursorSet c, charPos, c[1]
        main = switch dir
            when 'up'    then 'first'
            when 'down'  then 'last'
        @do.cursor newCursors, main:main
        @do.end()
        
    setCursorsAtSelectionBoundary: (leftOrRight='right') ->
        @do.start()
        i = leftOrRight == 'right' and 1 or 0
        newCursors = []
        main = 'last'
        for s in @selections
            p = @rangeIndexPos s,i
            newCursors.push p
            if @isCursorInRange s
                main = newCursors.indexOf p
        @do.cursor newCursors, main:main
        @do.end()       

    delCursors: (dir='up') ->
        @do.start()
        oldCursors = @state.cursors()
        newCursors = @do.cursors()
        main = null
        d = switch dir
            when 'up' 
                for c in oldCursors.reversed()
                    if @isPosInPositions([c[0], c[1]-1], oldCursors) and not @isPosInPositions [c[0], c[1]+1], oldCursors
                        ci = oldCursors.indexOf c
                        if @isSamePos @do.mainCursor(), newCursors[ci]
                            main = @posInPositions [c[0], c[1]-1], newCursors  
                        newCursors.splice ci, 1
            when 'down' 
                for c in oldCursors.reversed()
                    if @isPosInPositions([c[0], c[1]+1], oldCursors) and not @isPosInPositions [c[0], c[1]-1], oldCursors
                        ci = oldCursors.indexOf c
                        if @isSamePos @do.mainCursor(), newCursors[ci]
                            main = @posInPositions [c[0], c[1]+1], newCursors  
                        newCursors.splice ci, 1
        @do.cursor newCursors, main:main
        @do.end()
        
    clearCursors: () -> 
        @do.start()
        @do.cursor [@mainCursor()]
        @do.end()

    clearCursorsAndHighlights: () ->
        @clearCursors()
        @clearHighlights()
        

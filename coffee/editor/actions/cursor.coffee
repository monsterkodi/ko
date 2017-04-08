#  0000000  000   000  00000000    0000000   0000000   00000000 
# 000       000   000  000   000  000       000   000  000   000
# 000       000   000  0000000    0000000   000   000  0000000  
# 000       000   000  000   000       000  000   000  000   000
#  0000000   0000000   000   000  0000000    0000000   000   000
{
stopEvent
} = require 'kxk'
_ = require 'lodash'

module.exports =

    actions:
        alignCursors:
            name: 'align cursors'
            text: 'align cursors vertically with (top|bottom|left|right)-most cursor'
            combos: ['alt+ctrl+up', 'alt+ctrl+down', 'alt+ctrl+left', 'alt+ctrl+right']
            
        alignCursorsAndText:
            name: 'align cursors and text'
            text: 'align text to the right of cursors by inserting spaces'
            combo: 'alt+ctrl+shift+right'

        setCursorsAtSelectionBoundariesOrSelectSurround:
            name: 'set cursors at selection boundaries or select brackets|quotes'
            text: """
                set cursors at selection boundaries, if a selection exists.
                select brackets or quotes otherwise.
                """
            combo: 'command+alt+b'
            
        addCursors: 
            name: 'add cursors up|down'
            combos: ['command+up', 'command+down']
        
        delCursors:
            name: 'remove cursors up|down'
            combos: ['command+shift+up', 'command+shift+down']
            
        cursorHome:
            combo: 'home'
            
        cursorEnd:
            combo: 'end'
            
        cursorPageUp:
            combo: 'page up'

        cursorPageDown:
            combo: 'page down'
        
    #  0000000  00000000  000000000  
    # 000       000          000     
    # 0000000   0000000      000     
    #      000  000          000     
    # 0000000   00000000     000     
    
    singleCursorAtPos: (p, opt = extend:false) ->
        if @numLines() == 0
            @do.start()
            @do.insert 0, ''
            @do.end()
        p = @clampPos p
        @do.start()
        @startSelection opt
        @do.setCursors [[p[0], p[1]]]
        @endSelection opt
        @do.end()
    
    setCursor: (c,l) ->
        @do.start()
        @do.setCursors [[c,l]]
        @do.end()

    cursorHome: (key, info) ->
        extend = info?.extend ? 0 <= info?.mod.indexOf 'shift'
        @singleCursorAtPos [0, 0], extend: extend
            
    cursorEnd: (key, info) ->
        extend = info?.extend ? 0 <= info?.mod.indexOf 'shift'
        @singleCursorAtPos [0,@numLines()-1], extend: extend

    cursorPageUp: (key, info) ->
        stopEvent info?.event
        extend = info.extend ? 0 <= info.mod.indexOf 'shift'
        @moveCursorsUp extend, @numFullLines()-3
                
    cursorPageDown: (key, info) ->
        stopEvent info?.event
        extend = info.extend ? 0 <= info.mod.indexOf 'shift'
        @moveCursorsDown extend, @numFullLines()-3

    setCursorsAtSelectionBoundariesOrSelectSurround: ->
        if @numSelections()
            @do.start()
            newCursors = []
            for s in @do.selections()
                newCursors.push @rangeStartPos s
                newCursors.push @rangeEndPos s
            @do.select []
            @do.setCursors newCursors
            @do.end()
        else
            @selectSurround()
        
    #  0000000   0000000    0000000    
    # 000   000  000   000  000   000  
    # 000000000  000   000  000   000  
    # 000   000  000   000  000   000  
    # 000   000  0000000    0000000    
    
    toggleCursorAtPos: (p) ->
        if @isPosInPositions p, @state.cursors()
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        @do.start()
        newCursors = @do.cursors()
        newCursors.push p
        @do.setCursors newCursors, main:'last'
        @do.end()
                   
    addCursors: (key) ->
        dir = key
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
        @do.setCursors newCursors, main:main
        @do.end()

    #  0000000   000      000   0000000   000   000  
    # 000   000  000      000  000        0000  000  
    # 000000000  000      000  000  0000  000 0 000  
    # 000   000  000      000  000   000  000  0000  
    # 000   000  0000000  000   0000000   000   000  
    
    alignCursorsAndText: ->
        @do.start()
        newCursors = @do.cursors()
        newX = _.max (c[0] for c in newCursors)
        lines = {}
        for nc in newCursors
            lines[nc[1]] = nc[0]
            @cursorSet nc, newX, c[1]
        for li, cx of lines
            @do.change li, @do.line(li).slice(0, cx) + _.padStart('', newX-cx) + @do.line(li).slice(cx)
        @do.setCursors newCursors
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
        @do.setCursors newCursors, main:main
        @do.end()
        
    # 0000000    00000000  000      
    # 000   000  000       000      
    # 000   000  0000000   000      
    # 000   000  000       000      
    # 0000000    00000000  0000000  

    delCursorAtPos: (p) ->
        oldCursors = @state.cursors()
        c = @posInPositions p, oldCursors
        if c and @numCursors() > 1
            @do.start()
            newCursors = @do.cursors()
            newCursors.splice oldCursors.indexOf(c), 1
            @do.setCursors newCursors, main:'closest'
            @do.end()

    delCursors: (key, info) ->
        dir = key
        @do.start()
        newCursors = @do.cursors()
        d = switch dir
            when 'up' 
                for c in @do.cursors()
                    if @isPosInPositions([c[0], c[1]-1], newCursors) and not @isPosInPositions [c[0], c[1]+1], newCursors
                        ci = newCursors.indexOf c
                        newCursors.splice ci, 1
            when 'down' 
                for c in newCursors.reversed()
                    if @isPosInPositions([c[0], c[1]+1], newCursors) and not @isPosInPositions [c[0], c[1]-1], newCursors
                        ci = newCursors.indexOf c
                        newCursors.splice ci, 1
        @do.setCursors newCursors, main:'closest'
        @do.end()
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clearCursors: () -> 
        @do.start()
        @do.setCursors [@mainCursor()]
        @do.end()

    clearCursorsAndHighlights: () ->
        @clearCursors()
        @clearHighlights()
        

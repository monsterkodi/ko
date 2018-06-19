###
 0000000  000   000  00000000    0000000   0000000   00000000
000       000   000  000   000  000       000   000  000   000
000       000   000  0000000    0000000   000   000  0000000  
000       000   000  000   000       000  000   000  000   000
 0000000   0000000   000   000  0000000    0000000   000   000
###

{ reversed, stopEvent, first, last, log, _ } = require 'kxk'

module.exports =

    actions:
        menu: 'Cursors'

        cursorInAllLines:
            name:  'Cursor in All Lines'
            combo: 'alt+a'

        alignCursorsUp:
            separator: true
            name: 'Align Cursors with Top-most Cursor'
            combo: 'alt+ctrl+shift+up'

        alignCursorsDown:
            name: 'Align Cursors with Bottom-most Cursor'
            combo: 'alt+ctrl+shift+down'

        alignCursorsLeft:
            name: 'Align Cursors with Left-most Cursor'
            # combo: 'alt+ctrl+shift+left'

        alignCursorsRight:
            name: 'Align Cursors with Right-most Cursor'
            # combo: 'alt+ctrl+shift+right'

        alignCursorsAndText:
            name: 'Align Cursors and Text'
            text: 'align text to the right of cursors by inserting spaces'
            combo: 'alt+shift+a'

        setCursorsAtSelectionBoundariesOrSelectSurround:
            separator: true
            name: 'Cursors at Selection Boundaries or Select Brackets/Quotes'
            text: """
                set cursors at selection boundaries, if a selection exists.
                select brackets or quotes otherwise.
                """
            combo: 'command+alt+b'
            accel: 'alt+ctrl+b'

        addCursorsUp:
            separator: true
            name: 'Add Cursors Up'
            combo: 'command+up'
            accel: 'ctrl+up'

        addCursorsDown:
            name: 'Add Cursors Down'
            combo: 'command+down'
            accel: 'ctrl+down'

        delCursorsUp:
            separator: true
            name: 'Remove Cursors Up'
            combo: 'command+shift+up'
            accel: 'ctrl+shift+up'

        delCursorsDown:
            name: 'Remove Cursors Down'
            combo: 'command+shift+down'
            accel: 'ctrl+shift+down'

        cursorMoves:
            name:  'Move Cursors To Start'
            combos: ['ctrl+home', 'ctrl+end', 'page up', 'page down', 'ctrl+shift+home', 'ctrl+shift+end', 'shift+page up', 'shift+page down']


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

    cursorMoves: (key, info) ->
        extend = info?.extend ? 0 <= info?.mod.indexOf 'shift'
        # log 'cursorMoves', key, info, extend
        
        switch key
            when 'home'      then @singleCursorAtPos [0, 0], extend: extend
            when 'end'       then @singleCursorAtPos [0,@numLines()-1], extend: extend
            when 'page up'   
                log 'moveCursorsUp', @numFullLines()
                @moveCursorsUp   extend, @numFullLines()-3
            when 'page down' then @moveCursorsDown extend, @numFullLines()-3
        
    setCursorsAtSelectionBoundariesOrSelectSurround: ->

        if @numSelections()
            @do.start()
            newCursors = []
            for s in @do.selections()
                newCursors.push rangeStartPos s
                newCursors.push rangeEndPos s
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

        if isPosInPositions p, @state.cursors()
            @delCursorAtPos p
        else
            @addCursorAtPos p

    addCursorAtPos: (p) ->

        @do.start()
        newCursors = @do.cursors()
        newCursors.push p
        @do.setCursors newCursors, main:'last'
        @do.end()

    addCursorsUp:   -> @addCursors 'up'
    addCursorsDown: -> @addCursors 'down'
        
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
            if not isPosInPositions [c[0], c[1]+d], oldCursors
                newCursors.push [c[0], c[1]+d]
                break if newCursors.length >= 999
        sortPositions newCursors
        main = switch dir
            when 'up'    then 'first'
            when 'down'  then 'last'
        @do.setCursors newCursors, main:main
        @do.end()

    cursorInAllLines: ->       

        @do.start()
        @do.setCursors ([0,i] for i in [0...@numLines()]), main:'closest'
        @do.end()

    cursorColumns: (num, step=1) ->
        log num, step
        cp = @cursorPos()
        @do.start()
        @do.setCursors ([cp[0]+i*step,cp[1]] for i in [0...num]), main:'closest'
        @do.end()

    cursorLines: (num, step=1) ->
        log num, step
        cp = @cursorPos()
        @do.start()
        @do.setCursors ([cp[0],cp[1]+i*step] for i in [0...num]), main:'closest'
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
            cursorSet nc, newX, c[1]
        for li, cx of lines
            @do.change li, @do.line(li).slice(0, cx) + _.padStart('', newX-cx) + @do.line(li).slice(cx)
        @do.setCursors newCursors
        @do.end()

    alignCursorsUp:    -> @alignCursors 'up'   
    alignCursorsLeft:  -> @alignCursors 'left'   
    alignCursorsRight: -> @alignCursors 'right'   
    alignCursorsDown:  -> @alignCursors 'down'   
        
    alignCursors: (dir='down') ->

        @do.start()
        newCursors = @do.cursors()
        charPos = switch dir
            when 'up'    then first(newCursors)[0]
            when 'down'  then last(newCursors)[0]
            when 'left'  then _.min (c[0] for c in newCursors)
            when 'right' then _.max (c[0] for c in newCursors)
        for c in newCursors
            cursorSet c, charPos, c[1]
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
        c = posInPositions p, oldCursors
        if c and @numCursors() > 1
            @do.start()
            newCursors = @do.cursors()
            newCursors.splice oldCursors.indexOf(c), 1
            @do.setCursors newCursors, main:'closest'
            @do.end()

    delCursorsUp:   -> @delCursors 'up'
    delCursorsDown: -> @delCursors 'down'
            
    delCursors: (key, info) ->
        dir = key
        @do.start()
        newCursors = @do.cursors()
        d = switch dir
            when 'up'
                for c in @do.cursors()
                    if isPosInPositions([c[0], c[1]-1], newCursors) and not isPosInPositions [c[0], c[1]+1], newCursors
                        ci = newCursors.indexOf c
                        newCursors.splice ci, 1
            when 'down'
                for c in reversed newCursors
                    if isPosInPositions([c[0], c[1]+1], newCursors) and not isPosInPositions [c[0], c[1]-1], newCursors
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


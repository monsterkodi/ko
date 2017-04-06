# 00     00   0000000   000   000  00000000
# 000   000  000   000  000   000  000     
# 000000000  000   000   000 000   0000000 
# 000 0 000  000   000     000     000     
# 000   000   0000000       0      00000000
{
first,
last
} = require 'kxk'
_ = require 'lodash'

module.exports = 

    infos:
        setOrMoveCursorsAtBoundary:
            name:   'set cursors at selections or move to line boundaries'
            text:   """sets cursors at selection boundaries, if multiple selections exist but only one cursor.
                otherwise moves cursors to line boundaries."""
            combos: ['command+left', 'command+right']

        moveMainCursor:
            name:   'move main cursor'
            text:   """move main cursor independently of other cursors.
                erases other cursors if shift is pressed. 
                sets new cursors otherwise."""
            combos: ['ctrl+up', 'ctrl+down', 'ctrl+left', 'ctrl+right', 
                'ctrl+shift+up', 'ctrl+shift+down', 'ctrl+shift+left', 'ctrl+shift+right']
    
        moveCursorsToWordBoundary:
            name:   'move cursors to word boundaries'
            text:   'moves cursors to word boundaries. extends selections, if shift is pressed.'            
            combos: ['alt+left',       'alt+right',      'alt+shift+left',  'alt+shift+right']

        moveCursorsToLineBoundary:
            name:   'move cursors to line boundaries'
            text:   'moves cursors to line boundaries. extends selections, if shift is pressed.'
            combos: ['command+shift+left', 'command+shift+right', 'ctrl+e', 'ctrl+shift+e', 'ctrl+a', 'ctrl+shift+a']

        moveCursors:
            name:  'move cursors'
            text:   'move all cursors simultaneously'
            combos: ['left', 'right', 'up', 'down']

    setOrMoveCursorsAtBoundary: (key) ->
        if @numSelections() > 1 and @numCursors() == 1
            @setCursorsAtSelectionBoundary key
        else
            @moveCursorsToLineBoundary key

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
    
    moveAllCursors: (func, opt = extend:false, keepLine:true) ->        
        @do.start()
        @startSelection opt
        newCursors = @do.cursors()
        oldMain = @mainCursor()
        mainLine = oldMain[1]
        if newCursors.length > 1
            for c in newCursors
                newPos = func c 
                if newPos[1] == c[1] or not opt.keepLine
                    mainLine = newPos[1] if @isSamePos oldMain, c
                    @cursorSet c, newPos
        else
            @cursorSet newCursors[0], func newCursors[0] 
            mainLine = newCursors[0][1]
        main = switch opt.main
            when 'top'   then 'first'
            when 'bot'   then 'last'
            when 'left'  then newCursors.indexOf first @positionsForLineIndexInPositions mainLine, newCursors
            when 'right' then newCursors.indexOf last  @positionsForLineIndexInPositions mainLine, newCursors
            
        @do.cursor newCursors, main:main
        @endSelection opt
        @do.end()
        true

    moveMainCursor: (dir='down', opt = erase:false) ->
        @do.start()
        [dx, dy] = switch dir
            when 'up'    then [0,-1]
            when 'down'  then [0,+1]
            when 'left'  then [-1,0]
            when 'right' then [+1,0]
        newCursors = @do.cursors()
        oldMain = @mainCursor()
        newMain = [oldMain[0]+dx, oldMain[1]+dy]
        _.remove newCursors, (c) => 
            if opt?.erase
                @isSamePos(c, oldMain) or @isSamePos(c, newMain) 
            else
                @isSamePos(c, newMain) 
        newCursors.push newMain
        @do.cursor newCursors, main:newMain
        @do.end()
        
    moveCursorsToLineBoundary: (leftOrRight, e) ->
        f = switch leftOrRight
            when 'right' then (c) => [@lines[c[1]].length, c[1]]
            when 'left'  then (c) => 
                if @lines[c[1]].slice(0,c[0]).trim().length == 0
                    [0, c[1]]
                else
                    d = @lines[c[1]].length - @lines[c[1]].trimLeft().length
                    [d, c[1]]
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsToWordBoundary: (leftOrRight, e) ->
        f = switch leftOrRight
            when 'right' then @endOfWordAtCursor
            when 'left'  then @startOfWordAtCursor
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsUp: (e, n=1) ->                 
        @moveAllCursors ((n)->(c)->[c[0],c[1]-n])(n), extend:e, main: 'top'
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors moveRight(n), extend:e, keepLine:true, main: 'right'
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [Math.max(0,c[0]-n), c[1]]
        @moveAllCursors moveLeft(n), extend:e, keepLine:true, main: 'left'
        
    moveCursorsDown: (e, n=1) ->
        if e and @numSelections() == 0 # selecting lines down
            if 0 == _.max (c[0] for c in @cursors) # all cursors in first column
                @do.start()
                @do.select @rangesForCursorLines() # select lines without moving cursors
                @do.end()
                return
        else if e and @stickySelection and @numCursors() == 1
            if @mainCursor()[0] == 0 and not @isSelectedLineAtIndex @mainCursor()[1]
                @do.start()
                newSelections = @do.selections()
                newSelections.push @rangeForLineAtIndex @mainCursor()[1]
                @do.select newSelections
                @do.end()
                return
            
        @moveAllCursors ((n)->(c)->[c[0],c[1]+n])(n), extend:e, main: 'bot'
        
    moveCursors: (direction, e) ->
        switch direction
            when 'left'  then @moveCursorsLeft  e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp    e
            when 'down'  then @moveCursorsDown  e

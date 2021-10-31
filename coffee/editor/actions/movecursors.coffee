
# 00     00   0000000   000   000  00000000       0000000  000   000  00000000    0000000   0000000   00000000    0000000  
# 000   000  000   000  000   000  000           000       000   000  000   000  000       000   000  000   000  000       
# 000000000  000   000   000 000   0000000       000       000   000  0000000    0000000   000   000  0000000    0000000   
# 000 0 000  000   000     000     000           000       000   000  000   000       000  000   000  000   000       000  
# 000   000   0000000       0      00000000       0000000   0000000   000   000  0000000    0000000   000   000  0000000   

{ _, klog } = require 'kxk'

module.exports = 

    actions:
        menu: 'Cursors'
        
        moveCursorsAtBoundaryLeft: 
            name: 'Move Cursors to Indent or Start of Line'
            combo: 'command+left'
            accel: 'ctrl+left'

        moveCursorsAtBoundaryRight: 
            name: 'Move Cursors to End of Line'
            combo: 'command+right'
            accel: 'ctrl+right'
                
        moveCursorsToWordBoundary:
            name:   'move cursors to word boundaries'
            text:   'moves cursors to word boundaries. extends selections, if shift is pressed.'            
            combos: ['alt+shift+left' 'alt+shift+right']
        
        moveCursorsToWordBoundaryLeft:
            separator: true
            name:   'Move Cursors to Start of Word'
            combo:  'alt+left'

        moveCursorsToWordBoundaryRight:
            name:   'Move Cursors to End of Word'
            combo:  'alt+right'
            
        moveCursorsToLineBoundary:
            name:   'move cursors to line boundaries'
            text:   'moves cursors to line boundaries. extends selections, if shift is pressed.'
            combos: ['home' 'end' 'command+shift+left' 'command+shift+right']
            accels: ['home' 'end' 'shift+home' 'shift+end' 'ctrl+shift+left' 'ctrl+shift+right']

        moveMainCursor:
            name:   'move main cursor'
            text:   """move main cursor independently of other cursors.
                keeps current main cursor position in cursors if shift is pressed."""
            combos: [ 'ctrl+shift+up' 'ctrl+shift+down' 'ctrl+shift+left' 'ctrl+shift+right' 'ctrl+up' 'ctrl+down' 'ctrl+left' 'ctrl+right']
            
        moveCursors:
            name:  'move cursors'
            combos: ['left' 'right' 'up' 'down' 'shift+down' 'shift+right' 'shift+up' 'shift+left' 'ctrl+left' 'ctrl+right']

    moveCursorsAtBoundaryLeft:  -> @setOrMoveCursorsAtBoundary 'left'
    moveCursorsAtBoundaryRight: -> @setOrMoveCursorsAtBoundary 'right'
        
    setOrMoveCursorsAtBoundary: (key) ->
        
        if @numSelections() > 1 and @numCursors() == 1
            @setCursorsAtSelectionBoundary key
        else
            @moveCursorsToLineBoundary key

    # 00     00   0000000   000  000   000  
    # 000   000  000   000  000  0000  000  
    # 000000000  000000000  000  000 0 000  
    # 000 0 000  000   000  000  000  0000  
    # 000   000  000   000  000  000   000  
    
    moveMainCursor: (key, info) ->
        
        dir = key 
        opt = _.clone info
        opt.erase ?= info.mod?.indexOf('shift') < 0
        @do.start()
        [dx, dy] = switch dir
            when 'up'    then [0,-1]
            when 'down'  then [0,+1]
            when 'left'  then [-1,0]
            when 'right' then [+1,0]
        newCursors = @do.cursors()
        oldMain = @mainCursor()
        newMain = [oldMain[0]+dx, oldMain[1]+dy]
        _.remove newCursors, (c) -> 
            if opt?.erase
                isSamePos(c, oldMain) or isSamePos(c, newMain)
            else
                isSamePos(c, newMain)
        newCursors.push newMain
        @do.setCursors newCursors, main:newMain
        @do.end()        

    # 000   000   0000000   00000000   0000000    
    # 000 0 000  000   000  000   000  000   000  
    # 000000000  000   000  0000000    000   000  
    # 000   000  000   000  000   000  000   000  
    # 00     00   0000000   000   000  0000000    
    
    
    moveCursorsToWordBoundaryLeft:  -> @moveCursorsToWordBoundary 'left'
    moveCursorsToWordBoundaryRight: -> @moveCursorsToWordBoundary 'right'
    
    moveCursorsToWordBoundary: (leftOrRight, info = extend:false) ->
        extend = info.extend ? 0 <= info.mod.indexOf 'shift'
        f = switch leftOrRight
            when 'right' then @endOfWordAtPos
            when 'left'  then @startOfWordAtPos
        @moveAllCursors f, extend:extend, keepLine:true
        true

    # 000      000  000   000  00000000  
    # 000      000  0000  000  000       
    # 000      000  000 0 000  0000000   
    # 000      000  000  0000  000       
    # 0000000  000  000   000  00000000  
    
    moveCursorsToLineBoundary: (key, info = extend:false) ->
        
        @do.start()
        extend = info.extend ? 0 <= info.mod.indexOf 'shift'
        func = switch key
            when 'right' 'e' 'end' then (c) => [@do.line(c[1]).length, c[1]]
            when 'left' 'a' 'home' then (c) => 
                if @do.line(c[1]).slice(0,c[0]).trim().length == 0
                    [0, c[1]]
                else
                    d = @do.line(c[1]).length - @do.line(c[1]).trimLeft().length
                    [d, c[1]]
        @moveAllCursors func, extend:extend, keepLine:true
        @do.end()

    moveCursors: (key, info = extend:false) ->
 
        if @stickySelection and info.mod == 'ctrl'
            klog 'substract from sticky?' key
        
        extend = info.extend ? 'shift' == info.mod
        switch key
            when 'left'  then @moveCursorsLeft  extend
            when 'right' then @moveCursorsRight extend
            when 'up'    then @moveCursorsUp    extend
            when 'down'  then @moveCursorsDown  extend
        
    setCursorsAtSelectionBoundary: (leftOrRight='right') ->
        
        @do.start()
        i = leftOrRight == 'right' and 1 or 0
        newCursors = []
        main = 'last'
        for s in @do.selections()
            p = rangeIndexPos s,i
            newCursors.push p
            if @isCursorInRange s
                main = newCursors.indexOf p
        @do.setCursors newCursors, main:main
        @do.end()       
    
    #  0000000   000      000      
    # 000   000  000      000      
    # 000000000  000      000      
    # 000   000  000      000      
    # 000   000  0000000  0000000  
    
    moveAllCursors: (func, opt = extend:false, keepLine:true) -> 
        
        @do.start()
                    
        @startSelection opt
        newCursors = @do.cursors()
        oldMain = @do.mainCursor()
        mainLine = oldMain[1]
        
        if newCursors.length > 1
            for c in newCursors
                newPos = func c 
                if newPos[1] == c[1] or not opt.keepLine
                    mainLine = newPos[1] if isSamePos oldMain, c
                    cursorSet c, newPos
        else
            cursorSet newCursors[0], func newCursors[0]
            mainLine = newCursors[0][1]
            
        main = switch opt.main
            when 'top'   then 'first'
            when 'bot'   then 'last'
            when 'left'  then 'closest'
            when 'right' then 'closest'
            
        @do.setCursors newCursors, main:main
        @endSelection opt
        @do.end()
        
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
            if 0 == _.max (c[0] for c in @cursors()) # all cursors in first column
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
        

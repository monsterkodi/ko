# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000
{
clamp,
first,
last,
$}      = require '../tools/tools'
log     = require '../tools/log'
watcher = require './watcher'
Buffer  = require './buffer'
undo    = require './undo'
path    = require 'path'
fs      = require 'fs'
assert  = require 'assert'
_       = require 'lodash'

class Editor extends Buffer
    
    constructor: () ->
        @surroundCharacters = "{}[]()#'\"".split ''
        @currentFile = null
        @indentString = _.padStart "", 4
        @stickySelection = false
        @mainCursorMove = 0
        @watch = null
        @do = new undo @
        @dbg = false
        super

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000 
    # 000000000  00000000   00000000   000        00000  
    # 000   000  000        000        000         000   
    # 000   000  000        000        0000000     000   
    
    applyForeignLineChanges: (lineChanges) =>
        @do.start()
        for change in lineChanges
            if change.before? and change.after?
                @do.change change.index, change.after
            else if change.before?
                @do.delete change.index
            else if change.after?
                @do.insert change.index, change.after
            else
                log "editor.applyForeignLineChanges wtf?"
        @do.end foreign: true

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    setCurrentFile: (file) ->
        @watch?.stop()
        @currentFile = file
        @do.reset()
        @updateTitlebar()
        if file?
            @watch = new watcher @
            @setText fs.readFileSync file, encoding: 'UTF8'
        else
            @watch = null
            @setLines []
        # log 'editor.setCurrentFile', file    

    #  0000000  00000000  000000000         000      000  000   000  00000000   0000000
    # 000       000          000            000      000  0000  000  000       000     
    # 0000000   0000000      000            000      000  000 0 000  0000000   0000000 
    #      000  000          000            000      000  000  0000  000            000
    # 0000000   00000000     000            0000000  000  000   000  00000000  0000000 

    setText: (text="") -> 
        rgx = new RegExp '\t', 'g'
        indent = @indentString
        @setLines text.split(/\n/).map (l) -> l.replace rgx, indent

    setLines: (lines) ->
        super lines
        @do.reset()
        @emit 'linesSet', @lines
                            
    #  0000000  000  000   000   0000000   000      00000000
    # 000       000  0000  000  000        000      000     
    # 0000000   000  000 0 000  000  0000  000      0000000 
    #      000  000  000  0000  000   000  000      000     
    # 0000000   000  000   000   0000000   0000000  00000000
    
    singleCursorAtPos: (p, e) ->
        p = @clampPos p
        if e and @initialCursors?.length > 1
            @initialCursors = _.cloneDeep [@initialCursors[0]]
        else if not e
            @initialCursors = _.cloneDeep [p]
        @startSelection e
        @mainCursor = [p[0], p[1]]
        @do.cursors [@mainCursor], keepInitial: true
        @endSelection e
        
    selectSingleRange: (r) ->
        if not r?
            log "editor.#{name}.selectSingleRange warning! undefined range #{r}"
            return
        @cursors = [[r[1][0], r[0]]]
        @initialCursors = null
        @startSelection true
        @mainCursor = [r[1][1], r[0]]
        @do.cursors [@mainCursor], keepInitial: true     
        @endSelection true
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    startStickySelection: () -> 
        @stickySelection = true
        @updateTitlebar?()
        @emit 'selection'

    endStickySelection: () ->
        @stickySelection = false
        @updateTitlebar?()
        @emit 'selection'
        
    startSelection: (e) ->
        if e and not @initialCursors
            @initialCursors = _.cloneDeep @cursors
            if not @stickySelection
                @do.selections @rangesForCursors @initialCursors
        if not e and @do.actions.length
            if not @stickySelection
                @do.selections []
            
    endSelection: (e) ->
        
        if not e
            if @selections.length and not @stickySelection
                @selectNone()
            @initialCursors = _.cloneDeep @cursors
            
        if e and @initialCursors
            newSelection = @stickySelection and _.cloneDeep(@selections) or []
            if @initialCursors.length != @cursors.length
                log 'editor.endSelection warning! @initialCursors.length != @cursors.length', @initialCursors.length, @cursors.length
            
            for ci in [0...@initialCursors.length]
                ic = @initialCursors[ci]
                cc = @cursors[ci]
                ranges = @rangesBetweenPositions ic, cc, true #< extend to full lines if cursor at start of line                
                newSelection = newSelection.concat ranges
                    
            @do.selections newSelection

    textOfSelectionForClipboard: -> 
        @selectMoreLines() if @selections.length == 0
        t = []
        for s in @selections
            t.push @textInRange s
        t.join '\n'

    #  0000000   0000000    0000000         00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000       000   000  000   000  0000  000  000        000     
    # 000000000  000   000  000   000       0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000       000   000  000   000  000  0000  000   000  000     
    # 000   000  0000000    0000000         000   000  000   000  000   000   0000000   00000000
    
    addRangeToSelection: (range) ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newSelections.push range
        newCursors = (@rangeEndPos(r) for r in newSelections)
        @mainCursor = last newCursors
        @do.cursors newCursors
        @do.selections newSelections
        @do.end()

    removeFromSelection: (sel) ->
        @do.start()
        si = @selections.indexOf sel
        newSelections = _.cloneDeep @selections
        newSelections.splice si, 1
        if newSelections.length
            newCursors = (@rangeEndPos(r) for r in newSelections)
            @mainCursor = newCursors[(newCursors.length+si-1) % newCursors.length]
            @do.cursors newCursors
        @do.selections newSelections
        @do.end()        

    selectNone: => @do.selections []
    selectAll: => @do.selections @rangesForAllLines()

    # 00000000  000   000  000      000            000      000  000   000  00000000   0000000
    # 000       000   000  000      000            000      000  0000  000  000       000     
    # 000000    000   000  000      000            000      000  000 0 000  0000000   0000000 
    # 000       000   000  000      000            000      000  000  0000  000            000
    # 000        0000000   0000000  0000000        0000000  000  000   000  00000000  0000000 

    selectMoreLines: ->
        @do.start()
        newCursors = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        selectCursorLineAtIndex = (c,i) =>
            range = @rangeForLineAtIndex i
            newSelections.push range
            @oldCursorSet newCursors, c, range[1][1], range[0]
            
        start = false
        for c in @cursors
            if not @isSelectedLineAtIndex c[1]
                selectCursorLineAtIndex c, c[1]
                start = true
                
        if not start
            for c in @cursors
                selectCursorLineAtIndex c, c[1]+1 if c[1] < @lines.length-1
                
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       

    selectLessLines: -> 
        @do.start()
        newCursors = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        for c in @reversedCursors()
            thisSel = @selectionsInLineAtIndex(c[1])
            if thisSel.length
                if @isSelectedLineAtIndex c[1]-1
                    s = @selectionsInLineAtIndex(c[1]-1)[0]
                    @oldCursorSet newCursors, c, s[1][1], s[0]
                newSelections.splice @indexOfSelection(thisSel[0]), 1

        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       

    moveLines: (dir='down') ->
        
        csr = @continuousCursorAndSelectedLineIndexRanges()
        
        return if not csr.length
        return if dir == 'up' and first(csr)[0] == 0
        return if dir == 'down' and last(csr)[1] == @lines.length-1
        
        d = dir == 'up' and -1 or 1
        
        @do.start()
        newCursors    = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections

        for r in csr.reversed()
            ls = []
            for li in [r[0]..r[1]]
                ls.push _.cloneDeep @lines[li]
            
            switch dir 
                when 'up'   then (si = r[0]-1) ; ls.push @lines[si]
                when 'down' then (si = r[0])   ; ls.unshift @lines[r[1]+1]

            for i in [0...ls.length]    
                @do.change si+i, ls[i]

        for s in @selections
            newSelections[@indexOfSelection s][0] += d
            
        for c in @cursors
            @oldCursorDelta newCursors, c, 0, d
                
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       
            
    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000
    # 000   000  000  000        000   000  000      000  000        000   000     000   
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000   
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000   
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000   

    highlightText: (text, opt) -> # called from find command
        @highlights = @rangesForText text, opt
        if @highlights.length
            switch opt?.select
                when 'after' then @selectSingleRange @rangeAfterPosInRanges(@cursorPos(), @highlights) ? first @highlights
                when 'first' then @selectSingleRange first @highlights            
            @scrollCursorToTop() if not opt?.noScroll            
        @renderHighlights()
        @emit 'highlight'

    highlightTextOfSelectionOrWordAtCursor: -> # command+e       
            
        if @selections.length == 0 
            srange = @rangeForWordAtPos @cursorPos()
            @selectSingleRange srange
            
        text = @textInRange @selections[0]
        if text.length
            @highlights = @rangesForText text, max:9999
            @renderHighlights()
            @emit 'highlight'
            window.commandline.commands.find?.setCurrentText text
            window.commandline.commands.search?.setCurrentText text

    clearHighlights: ->
        @highlights = []
        @renderHighlights()
        @emit 'highlight'

    selectAllHighlights: ->
        @do.start()
        if not @posInHighlights @cursorPos()
            @highlightTextOfSelectionOrWordAtCursor()
        @do.selections _.cloneDeep @highlights
        if @selections.length
            @do.cursors (@rangeEndPos(r) for r in @selections), closestMain: true
        @do.end()
    
    selectNextHighlight: -> # command+g
        # log "selectNextHighlight #{@highlights.length}"
        if not @highlights.length
            searchText = window.commandline.commands.find?.current()
            log "editor.selectNextHighlight use find command text #{searchText}"
            @highlightText searchText if searchText?
        r = @rangeAfterPosInRanges @cursorPos(), @highlights
        r ?= first @highlights
        @selectSingleRange r
        @scrollCursorToTop()

    selectPrevHighlight: -> # command+shift+g
        if not @highlights.length
            @highlightText window.commandline.commands.find?.current()
        r = @rangeBeforePosInRanges @cursorPos(), @highlights
        r ?= last @highlights
        @selectSingleRange r

    highlightWordAndAddToSelection: -> # command+d
        cp = @cursorPos()
        if not @posInHighlights cp
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            @do.start()
            sr = @rangeAtPosInRanges cp, @selections
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @highlights
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @highlights
            r ?= first @highlights
            @addRangeToSelection r
            @scrollCursorToTop()
            @do.end()
            
    removeSelectedHighlight: -> # command+shift+d
        cp = @cursorPos()
        sr = @rangeAtPosInRanges cp, @selections
        hr = @rangeAtPosInRanges cp, @highlights        
        @removeFromSelection sr if sr and hr

    # 00000000  00     00  000  000000000       00000000  0000000    000  000000000
    # 000       000   000  000     000          000       000   000  000     000   
    # 0000000   000000000  000     000          0000000   000   000  000     000   
    # 000       000 0 000  000     000          000       000   000  000     000   
    # 00000000  000   000  000     000          00000000  0000000    000     000   

    emitEdit: (action) ->
        @emit 'edit',
            action:    action
            line:      @lines[@mainCursor[1]]
            before:    @lines[@mainCursor[1]].slice 0, @mainCursor[0]
            after:     @lines[@mainCursor[1]].slice @mainCursor[0]
            cursor:    @mainCursor
                    
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000
    
    setCursor: (c,l) ->
        @mainCursorMove = 0
        l = clamp 0, @lines.length-1, l
        c = clamp 0, @lines[l].length, c
        @do.cursors [[c,l]]
        
    toggleCursorAtPos: (p) ->
        if @cursorAtPos p
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        @mainCursorMove = 0
        newCursors = _.cloneDeep @cursors
        newCursors.push p
        @mainCursor = p
        @do.cursors newCursors        
        
    delCursorAtPos: (p) ->
        @mainCursorMove = 0
        c = @cursorAtPos p
        if c and @cursors.length > 1
            newCursors = _.cloneDeep @cursors
            newCursors.splice @indexOfCursor(c), 1
            @do.cursors newCursors, closestMain: true        
           
    addMainCursor: (dir='down') ->
        @mainCursorMove = 0
        d = switch dir
            when 'up' then -1
            when 'down' then +1
        newCursors = _.cloneDeep @cursors
        if not @cursorAtPos [@mainCursor[0], @mainCursor[1]+d]
            newCursors.push [@mainCursor[0], @mainCursor[1]+d]
            @mainCursor = last newCursors
        else
            @mainCursor = @cursorAtPos [@mainCursor[0], @mainCursor[1]+d]
        @do.cursors newCursors
                    
    addCursors: (dir='down') ->
        @mainCursorMove = 0
        return if @cursors.length >= 999
        d = switch dir
            when 'up' then -1
            when 'down' then +1
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            if not @cursorAtPos [c[0], c[1]+d]                
                newCursors.push [c[0], c[1]+d]
                break if newCursors.length >= 999
        @sortPositions newCursors
        switch dir
            when 'up'   then @mainCursor = first newCursors
            when 'down' then @mainCursor = last  newCursors
        @do.cursors newCursors

    alignCursorsAndText: ->
        @mainCursorMove = 0
        @clearHighlights()
        newCursors = _.cloneDeep @cursors
        newX = _.max (c[0] for c in @cursors)
        lines = {}
        for c in @cursors
            lines[c[1]] = c[0]
            @oldCursorSet newCursors, c, newX, c[1]
        for li, cx of lines
            @do.change li, @lines[li].slice(0, cx) + _.padStart('', newX-cx) + @lines[li].slice(cx)
        @do.cursors newCursors

    alignCursors: (dir='down') ->
        @mainCursorMove = 0
        charPos = switch dir
            when 'up'    then first(@cursors)[0]
            when 'down'  then last( @cursors)[0]
            when 'left'  then _.min (c[0] for c in @cursors)
            when 'right' then _.max (c[0] for c in @cursors)
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            @oldCursorSet newCursors, c, charPos, c[1]
        switch dir
            when 'up'   then @mainCursor = first newCursors
            when 'down' then @mainCursor = last  newCursors
        @do.cursors newCursors
        
    clampCursors: ->
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            @oldCursorSet newCursors, c, @clampPos c
        @do.cursors newCursors
    
    setCursorsAtSelectionBoundary: (leftOrRight='right') ->
        @mainCursorMove = 0
        i = leftOrRight == 'right' and 1 or 0
        @do.start()
        newCursors = []
        main = false
        for s in @selections
            p = @rangeIndexPos s,i
            if @isCursorInRange s
                @mainCursor = p
                main = true
            newCursors.push p
        @mainCursor = last newCursors if not main
        @do.cursors newCursors
        @do.end()       

    delCursors: (dir='up') ->
        @mainCursorMove = 0
        newCursors = _.cloneDeep @cursors
        @mainCursor = newCursors[@indexOfCursor @mainCursor]
        d = switch dir
            when 'up' 
                for c in @reversedCursors()                    
                    if @cursorAtPos([c[0], c[1]-1]) and not @cursorAtPos [c[0], c[1]+1]
                        ci = @indexOfCursor c
                        @mainCursor = @cursorAtPos([c[0], c[1]-1], newCursors) if newCursors[ci] == @mainCursor
                        newCursors.splice ci, 1
            when 'down' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]+1]) and not @cursorAtPos [c[0], c[1]-1]
                        ci = @indexOfCursor c
                        @mainCursor = @cursorAtPos([c[0], c[1]+1], newCursors) if newCursors[ci] == @mainCursor
                        newCursors.splice ci, 1
        @do.cursors newCursors 
        
    clearCursors: () -> 
        @mainCursorMove = 0
        @do.cursors [@mainCursor] 

    clearCursorsAndHighlights: () ->
        @clearCursors()
        @highlights = []
        @renderHighlights()
        @emit 'highlight'

    # 000   000  00000000  000   000          0000000  000   000  00000000    0000000   0000000   00000000 
    # 0000  000  000       000 0 000         000       000   000  000   000  000       000   000  000   000
    # 000 0 000  0000000   000000000         000       000   000  0000000    0000000   000   000  0000000  
    # 000  0000  000       000   000         000       000   000  000   000       000  000   000  000   000
    # 000   000  00000000  00     00          0000000   0000000   000   000  0000000    0000000   000   000
    
    oldCursorDelta: (newCursors, oc, dx, dy=0) ->
        nc = newCursors[@indexOfCursor oc]
        @mainCursor = nc if oc == @mainCursor
        @newCursorDelta newCursors, nc, dx, dy

    oldCursorSet: (newCursors, oc, x, y) ->
        nc = newCursors[@indexOfCursor oc]
        @mainCursor = nc if oc == @mainCursor
        @newCursorSet newCursors, nc, x, y
        
    newCursorDelta: (newCursors, nc, dx, dy=0) ->
        nc[0] += dx
        nc[1] += dy
        
    newCursorSet: (newCursors, nc, x, y) ->    
        [x,y] = x if not y? and x.length >=2
        nc[0] = x
        nc[1] = y

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    moveAllCursors: (f, opt={}) ->
        @mainCursorMove = 0
        @startSelection opt.extend
        newCursors = _.cloneDeep @cursors        
        if @cursors.length > 1
            for c in @cursors
                newPos = f(c)
                if newPos[1] == c[1] or not opt.keepLine
                    @oldCursorSet newCursors, c, newPos
        else
            @oldCursorSet newCursors, @cursors[0], f(@cursors[0])
        @mainCursor = first newCursors if opt.main == 'first'        
        @mainCursor = last  newCursors if opt.main == 'last'        
        @do.cursors newCursors, keepInitial: opt.extend
        @endSelection opt.extend
        true

    moveMainCursor: (dir='down') ->
        @mainCursorMove += 1
        [dx, dy] = switch dir
            when 'up'    then [0,-1]
            when 'down'  then [0,+1]
            when 'left'  then [-1,0]
            when 'right' then [+1,0]
        newCursors = _.cloneDeep @cursors
        if @mainCursorMove > 1
            _.remove newCursors, (c) => @isSamePos c, @mainCursor
        if not @cursorAtPos [@mainCursor[0]+dx, @mainCursor[1]+dy]
            newCursors.push [@mainCursor[0]+dx, @mainCursor[1]+dy]
            @mainCursor = last newCursors
        else
            @mainCursor = @cursorAtPos [@mainCursor[0]+dx, @mainCursor[1]+dy], newCursors
        @do.cursors newCursors
        
    moveCursorsToLineBoundary: (leftOrRight, e) ->
        @mainCursorMove = 0
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
        @mainCursorMove = 0
        f = switch leftOrRight
            when 'right' then @endOfWordAtCursor
            when 'left'  then @startOfWordAtCursor
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsUp:   (e, n=1) ->                 
        @moveAllCursors ((n)->(c)->[c[0],c[1]-n])(n), extend:e, main: 'first'
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors moveRight(n), extend:e, keepLine:true
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [Math.max(0,c[0]-n), c[1]]
        @moveAllCursors moveLeft(n), extend:e, keepLine:true
        
    moveCursorsDown: (e, n=1) ->
        if e and @selections.length == 0 # selecting lines down
            if 0 == _.max (c[0] for c in @cursors) # all cursors in first column
                @do.selections @rangesForCursorLines() # select lines without moving cursors
                return
        else if e and @stickySelection and @cursors.length == 1
            if @mainCursor[0] == 0 and not @isSelectedLineAtIndex @mainCursor[1]
                @do.start()
                newSelections = _.cloneDeep @selections
                newSelections.push @rangeForLineAtIndex @mainCursor[1]
                @do.selections newSelections
                @do.end()
                return
            
        @moveAllCursors ((n)->(c)->[c[0],c[1]+n])(n), extend:e, main: 'last'
        
    moveCursors: (direction, e) ->
        switch direction
            when 'left'  then @moveCursorsLeft  e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp    e
            when 'down'  then @moveCursorsDown  e

    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   

    deIndent: -> 
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors    = _.cloneDeep @cursors
        for i in @cursorAndSelectedLineIndices()
            if @lines[i].startsWith @indentString
                @do.change i, @lines[i].substr @indentString.length
                for c in @cursorsInLineAtIndex i
                    @oldCursorDelta newCursors, c, -@indentString.length
                for s in @selectionsInLineAtIndex i
                    ns = newSelections[@indexOfSelection s]
                    ns[1][0] -= @indentString.length
                    ns[1][1] -= @indentString.length
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        @clearHighlights()
        
    indent: ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors    = _.cloneDeep @cursors
        for i in @cursorAndSelectedLineIndices()
            @do.change i, @indentString + @lines[i]
            for c in @cursorsInLineAtIndex i
                @oldCursorDelta newCursors, c, @indentString.length
            for s in @selectionsInLineAtIndex i
                ns = newSelections[@indexOfSelection s]
                ns[1][0] += @indentString.length
                ns[1][1] += @indentString.length
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        @clearHighlights()
           
    #  0000000   0000000   00     00  00     00  00000000  000   000  000000000
    # 000       000   000  000   000  000   000  000       0000  000     000   
    # 000       000   000  000000000  000000000  0000000   000 0 000     000   
    # 000       000   000  000 0 000  000 0 000  000       000  0000     000   
    #  0000000   0000000   000   000  000   000  00000000  000   000     000   

    toggleComment: ->
        lineComment = "#" # todo: make this file type dependent
        @do.start()
        newCursors    = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        moveInLine = (i, d) => 
            for s in @selectionsInLineAtIndex i
                newSelections[@selections.indexOf s][1][0] += d
                newSelections[@selections.indexOf s][1][1] += d
            for c in @cursorsInLineAtIndex i
                @oldCursorDelta newCursors, c, d
                
        for i in @cursorAndSelectedLineIndices()
            cs = @lines[i].indexOf lineComment
            if cs >= 0 and @lines[i].substr(0,cs).trim().length == 0
                @do.change i, @lines[i].splice cs, 1
                moveInLine i, -1
                si = @indentationAtLineIndex i
                if si % @indentString.length == 1
                    @do.change i, @lines[i].splice si-1, 1
                    moveInLine i, -1
            else
                si = @indentationAtLineIndex i
                if @lines[i].length > si
                    l = (lineComment + " ").length
                    @do.change i, @lines[i].splice si, 0, lineComment + " "
                    moveInLine i, l
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
 
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertUserCharacter: (ch) ->
        @do.start()
        @clearHighlights()
        if @cursors.length == 1
            @clampCursors()
        else
            @fillVirtualSpaces()
                
        if ch in @surroundCharacters
            if @insertSurroundCharacter ch
                @do.end()
                return

        if ch == '\n'
            @insertNewline indent:true
            @do.end()
            return

        @deleteSelection()
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors # this looks weird
            oc = newCursors[@indexOfCursor c]
            alert 'wtf?' if oc.length < 2 or oc[1] >= @lines.length
            @do.change oc[1], @lines[oc[1]].splice oc[0], 0, ch
            for nc in @positionsInLineAtIndexInPositions oc[1], newCursors
                if nc[0] >= oc[0]
                    nc[0] += 1
                    if @isMainCursor nc
                        nc[0] += 1

        @do.cursors newCursors
            
        @do.end()
        @emitEdit 'insert'
    
    fillVirtualSpaces: () -> # fill spaces between line ends and cursors
        for c in @cursors 
            if c[0] > @lines[c[1]].length
                @do.change c[1], @lines[c[1]].splice c[0], 0, _.padStart '', c[0]-@lines[c[1]].length
    
    insertTab: ->
        if @selections.length
            @indent()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            il = @indentString.length
            for c in @cursors
                n = 4-(c[0]%il)
                @do.change c[1], @lines[c[1]].splice c[0], 0, _.padStart "", n
                @oldCursorDelta newCursors, c, n
            @do.cursors newCursors
            @do.end()   
        
    # 000   000  00000000  000   000  000      000  000   000  00000000
    # 0000  000  000       000 0 000  000      000  0000  000  000     
    # 000 0 000  0000000   000000000  000      000  000 0 000  0000000 
    # 000  0000  000       000   000  000      000  000  0000  000     
    # 000   000  00000000  00     00  0000000  000  000   000  00000000
        
    insertNewline: (opt) ->
        @closingInserted = null
        @do.start()
        @deleteSelection()
        
        newCursors = _.cloneDeep @cursors

        for c in @cursors.reversed()
        
            after  = @lines[c[1]].substr(c[0])
            after  = after.trimLeft() if opt?.indent
            before = @lines[c[1]].substr 0, c[0]
        
            if opt?.indent
                line = before.trimRight()
                il = 0
                for e in ['->', '=>', ':', ',', '=']
                    if line.endsWith e
                        il = @indentString.length
                if il == 0
                    if /(^|\s)(else\s*$|switch\s|for\s|while\s|class\s)/.test before
                        il = @indentString.length
                    else if /^(\s+when|\s*if)(?!.*\sthen\s)/.test line
                        il = @indentString.length 
                if /(when|if)/.test before
                    if after.startsWith 'then '
                        after = after.slice(4).trimLeft()
                    else if before.trim().endsWith 'then'
                        before = before.trimRight()
                        before = before.slice 0, before.length-4
                else if before.trim().startsWith 'return'
                    il = -@indentString.length 
                    
                il += @indentationAtLineIndex c[1]
                indent = _.padStart "", il
            else
                indent = ''

            bl = c[0]
            
            if @isCursorAtEndOfLine c
                @do.insert c[1]+1, indent
            else
                @do.insert c[1]+1, indent + after
                @do.change c[1],   before

            # move cursors in and below deleted line down
            for nc in @positionsFromPosInPositions c, newCursors
                @newCursorDelta newCursors, nc, nc[1] == c[1] and indent.length - bl or 0, 1
        
        @do.cursors newCursors    
        @do.end()
        
    # 00000000    0000000    0000000  000000000  00000000
    # 000   000  000   000  000          000     000     
    # 00000000   000000000  0000000      000     0000000 
    # 000        000   000       000     000     000     
    # 000        000   000  0000000      000     00000000
        
    paste: (text) -> 
        
        @do.start()        
        @deleteSelection()   
        @fillVirtualSpaces()
        
        l = text.split '\n'
        if @cursors.length > 1 and l.length == 1
            l = (l[0] for c in @cursors)
        
        if @cursors.length > 1 or l.length == 1 and not @isCursorAtStartOfLine()
            newCursors = _.cloneDeep @cursors
            # log "insert.paste: paste #{l.length} lines into #{@cursors.length} cursors"
            for ci in [@cursors.length-1..0]
                c = @cursors[ci]
                insert = l[ci % l.length]
                @do.change c[1], @lines[c[1]].splice c[0], 0, insert
                for c in @positionsAfterLineColInPositions c[1], c[0], @cursors
                    @oldCursorDelta newCursors, c, insert.length
        else
            # log "insert.paste: paste #{l.length} lines into single cursor"
            cp = @cursorPos()
            li = cp[1]
            if not @isCursorAtStartOfLine()
                rest   = @lines[li].substr(@cursorPos()[0]).trimLeft()
                indt   = _.padStart "", @indentationAtLineIndex cp[1] 
                before = @lines[cp[1]].substr 0, cp[0]
                if before.trim().length
                    @do.change li, before
                    li += 1
                    if (indt + rest).trim().length
                        l.push indt + rest
                        @mainCursor = [0,li+l.length-1]
                    else
                        @mainCursor = null
            else 
                @mainCursor = null
            for line in l
                @do.insert li, line
                li += 1
            @mainCursor = [0, li] if not @mainCursor?           
            newCursors = [@mainCursor]
                
        @do.cursors newCursors
        @do.end()
    
    #  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000  
    # 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000
    # 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000
    #      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000
    # 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000  
        
    insertSurroundCharacter: (ch) ->
        
        if @closingSurround?
            if @closingSurround == ch
                for c in @cursors
                    if @lines[c[1]][c[0]] != ch
                        @closingSurround = null
                        break
                if @closingSurround == ch
                    @do.start()
                    @selectNone()
                    @deleteForward()
                    @do.end()
                    @closingSurround = null
                    return false
        @closingSurround = null
        
        if ch == '#' # check if any cursor or selection is inside a string
            found = false
            for s in @selections
                if @isRangeInString s
                    found = true
                    break
                    
            if not found
                for c in @cursors
                    if @isRangeInString @rangeForPos c
                        found = true
                        break
            return false if not found
        
        @do.start()
        if @selections.length == 0
            @do.selections @rangesForCursors()
            
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors

        [cl,cr] = switch ch
            when '[', ']' then ['[', ']']
            when '{', '}' then ['{', '}']
            when '(', ')' then ['(', ')']
            when "'"      then ["'", "'"]
            when '"'      then ['"', '"']
            when '*'      then ['*', '*']                    
            when '#'      then ['#{', '}']
            
        @closingSurround = cr

        for s in @selections
            ns = newSelections[@indexOfSelection s]
            leftdelta = cl.length
            if cl == '#{'
                # convert single string to double string
                if sr = @rangeOfStringSurroundingRange s
                    if @lines[sr[0]][sr[1][0]] == "'"
                        @do.change s[0], @lines[s[0]].splice sr[1][0], 1, '"'
                    if @lines[sr[0]][sr[1][1]-1] == "'"
                        @do.change s[0], @lines[s[0]].splice sr[1][1]-1, 1, '"'
            else if cl == '('
                # remove space after callee
                before = @lines[s[0]].slice 0, s[1][0]
                trimmed = before.trimRight()
                if /\w$/.test(trimmed) and not /(if|when|in|and|or|is|not|else)$/.test trimmed
                    spaces = before.length-trimmed.length
                    @do.change s[0], @lines[s[0]].splice trimmed.length, spaces
                    ns[1][0] -= spaces
                    ns[1][1] -= spaces
                    leftdelta -= spaces

            @do.change s[0], @lines[s[0]].splice ns[1][1], 0, cr
            @do.change s[0], @lines[s[0]].splice ns[1][0], 0, cl
                            
            ns[1][0] += cl.length
            ns[1][1] += cl.length
            
            for c in @cursorsInRange s
                @oldCursorDelta newCursors, c, leftdelta
                
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        return true

    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLines: ->
        @do.start()
        newCursors = []
        for c in @cursors.reversed()
            if not @isCursorInLastLine c
                before = @lines[c[1]].trimRight() + " "
                after  = @lines[c[1]+1].trimLeft()
                @do.change c[1], before + after
                @do.delete c[1]+1
                newCursors.push [before.length, c[1]]
                for nc in @positionsInLineAtIndexInPositions c[1]+1, newCursors 
                    @newCursorDelta newCursors, nc, before.length, -1 
                for nc in @positionsBelowLineIndexInPositions c[1], newCursors 
                    @newCursorDelta newCursors, nc, 0, -1
        @do.cursors newCursors
        @mainCursor = first @cursors
        @do.end()
            
    deleteLineAtIndex: (i) ->
        @do.delete i
                    
    deleteSelection: ->
        @do.start()
        newCursors = _.cloneDeep @cursors
        for s in @reversedSelections()
            
            for c in @cursorsInRange s
                sp = @startPosOfContinuousSelectionAtPos c
                @oldCursorSet newCursors, c, sp[0], sp[1]

            lineSelected = s[1][0] == 0 and s[1][1] == @lines[s[0]].length
            if lineSelected and @lines.length > 1
                @do.delete s[0]
                # move cursors below deleted line up
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    @newCursorSet newCursors, nc, 0, -1
            else
                @do.change s[0], @lines[s[0]].splice s[1][0], s[1][1]-s[1][0]
                
        @do.selections []
        @do.cursors newCursors
        @do.end()
        @emitEdit 'delete'
        @clearHighlights()        
        
    deleteTab: ->
        if @selections.length
            @deIndent()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @cursors
                if c[0]
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @textInRange [c[1], [c[0]-n, c[0]]]
                    if t.trim().length == 0
                        @do.change c[1], @lines[c[1]].splice c[0]-n, n
                        @oldCursorDelta newCursors, c, -n
            @do.cursors newCursors
            @do.end()
            @clearHighlights()
            
    deleteForward: ->
        if @selections.length
            @deleteSelection()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @reversedCursors()
            
                if @isCursorAtEndOfLine c # cursor at end of line
                    if not @isCursorInLastLine c # cursor not in first line
                    
                        ll = @lines[c[1]].length
                    
                        @do.change c[1], @lines[c[1]] + @lines[c[1]+1]
                        @do.delete c[1]+1
                                    
                        # move cursors in joined line
                        for nc in @positionsInLineAtIndexInPositions c[1]+1, newCursors
                            @newCursorDelta newCursors, nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1]+1, newCursors
                            @newCursorDelta newCursors, nc, 0, -1
                else
                    @do.change c[1], @lines[c[1]].splice c[0], 1
                    for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                        if nc[0] > c[0]
                            @newCursorDelta newCursors, nc, -1

            @do.cursors newCursors
            @do.end()
            @emitEdit 'delete'
            @clearHighlights()
            
    deleteBackward: ->
        if @selections.length
            @deleteSelection()
        else if @cursors.length == 1 and not @isSamePos @mainCursor, @cursorPos()
            @mainCursor = @cursorPos()
            @do.cursors [@mainCursor]
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @reversedCursors()
            
                if c[0] == 0 # cursor at start of line
                    if c[1] > 0 # cursor not in first line
                        ll = @lines[c[1]-1].length
                        @do.change c[1]-1, @lines[c[1]-1] + @lines[c[1]]
                        @do.delete c[1]
                        # move cursors in joined line
                        for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                            @newCursorDelta newCursors, nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1], newCursors
                            @newCursorDelta newCursors, nc, 0, -1
                else
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @textInRange [c[1], [c[0]-n, c[0]]]
                    if t.trim().length != 0
                        n = 1
                    @do.change c[1], @lines[c[1]].splice c[0]-n, n
                    for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                        if nc[0] >= c[0]
                            @newCursorDelta newCursors, nc, -n

            @do.cursors newCursors
            @do.end()
            @emitEdit 'delete'                
            @clearHighlights()
            
module.exports = Editor

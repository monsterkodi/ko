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
        @watch = null
        @do = new undo @, @done
        @dbg = false
        super

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

    #  0000000  00000000  000000000  000      000  000   000  00000000   0000000
    # 000       000          000     000      000  0000  000  000       000     
    # 0000000   0000000      000     000      000  000 0 000  0000000   0000000 
    #      000  000          000     000      000  000  0000  000            000
    # 0000000   00000000     000     0000000  000  000   000  00000000  0000000 

    setText: (text="") -> 
        rgx = new RegExp '\t', 'g'
        indent = @indentString
        @setLines text.split(/\n/).map (l) -> l.replace rgx, indent

    setLines: (lines) ->
        super lines
        @do.reset()
                            
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
        @do.cursors [[p[0], p[1]]], true
        @endSelection e
        
    selectSingleRange: (r) ->
        if not r?
            log "editor.#{name}.selectSingleRange warning! undefined range #{r}"
            return
        @cursors = [[r[1][0], r[0]]]
        @initialCursors = null
        @startSelection true
        @do.cursors [[r[1][1], r[0]]], true     
        @endSelection true
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    startSelection: (e) ->
        if e and not @initialCursors
            @initialCursors = _.cloneDeep @cursors
            @do.selections @rangesForCursors @initialCursors
        if not e and @do.actions.length
            @do.selections []
            
    endSelection: (e) ->
        
        if not e
            if @selections.length
                @selectNone()
            @initialCursors = _.cloneDeep @cursors
            
        if e and @initialCursors
            newSelection = []
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

    #  0000000   0000000    0000000    00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000  000   000  000   000  0000  000  000        000     
    # 000000000  000   000  000   000  0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000  000   000  000   000  000  0000  000   000  000     
    # 000   000  0000000    0000000    000   000  000   000  000   000   0000000   00000000
    
    addRangeToSelection: (range) ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newSelections.push range
        @do.selections newSelections
        @do.cursors [@rangeEndPos range]
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
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors
        
        selectCursorLineAtIndex = (c,i) =>
            range = @rangeForLineAtIndex i
            newSelections.push range
            @newCursorSet newCursors, c, range[1][1], range[0]
            
        start = false
        for c in @cursors
            if not @isSelectedLineAtIndex c[1]
                selectCursorLineAtIndex c, c[1]
                start = true
        if not start
            for c in @cursors
                selectCursorLineAtIndex c, c[1]+1
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       

    selectLessLines: -> 
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors
        
        for c in @reversedCursors()
            thisSel = @selectionsInLineAtIndex(c[1])
            if thisSel.length
                if @isSelectedLineAtIndex c[1]-1
                    s = @selectionsInLineAtIndex(c[1]-1)[0]
                    @newCursorSet newCursors, c, s[1][1], s[0]
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
                @do.change @lines, si+i, ls[i]

        for s in @selections
            newSelections[@indexOfSelection s][0] += d
            
        for c in @cursors
            @newCursorDelta newCursors, c, 0, d
                
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
            r = @rangeAfterPosInRanges @cursorPos(), @highlights
            r ?= first @highlights
            @selectSingleRange r
            @scrollCursorToTop()
            @renderHighlights()
            @emit 'highlight', @highlights

    highlightTextOfSelectionOrWordAtCursor: -> # called from keyboard shortcuts        
        
        if @selections.length == 0 
            srange = @rangeForWordAtPos @cursorPos()
            @selectSingleRange srange
            
        text = @textInRange @selections[0]
        if text.length
            @highlights = @rangesForText text
            @renderHighlights()
            @emit 'highlight', @highlights

    clearHighlights: ->
        @highlights = []
        @renderHighlights()
        @emit 'highlight', @highlights

    selectAllHighlights: ->
        if not @posInHighlights @cursorPos()
            @highlightTextOfSelectionOrWordAtCursor()
        @do.selections _.cloneDeep @highlights
    
    selectNextHighlight: ->
        r = @rangeAfterPosInRanges @cursorPos(), @highlights
        r ?= first @highlights
        @selectSingleRange r
        @scrollCursorToTop()

    selectPrevHighlight: ->
        r = @rangeBeforePosInRanges @cursorPos(), @highlights
        r ?= last @highlights
        @selectSingleRange r

    highlightWordAndAddToSelection: ->
        cp = @cursorPos()
        if not @posInHighlights cp
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            sr = @rangeAtPosInRanges cp, @selections
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @highlights
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @highlights
            r ?= first @highlights
            @addRangeToSelection r
            @scrollCursorToTop()
            
    removeSelectedHighlight: ->
        cp = @cursorPos()
        sr = @rangeAtPosInRanges cp, @selections
        hr = @rangeAtPosInRanges cp, @highlights
        if sr and hr
            newSelections = _.cloneDeep @selections
            newSelections.splice @indexOfSelection(sr), 1
            @do.selections newSelections
        pr = @rangeBeforePosInRanges cp, @highlights
        pr ?= last @highlights
        if pr 
            @do.cursors [@rangeEndPos pr]
                    
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000
    
    setCursor: (c,l) -> 
        l = clamp 0, @lines.length-1, l
        c = clamp 0, @lines[l].length, c
        @do.cursors [[c,l]]
        
    toggleCursorAtPos: (p) ->
        if @cursorAtPos p
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        newCursors = _.cloneDeep @cursors
        newCursors.push p
        @mainCursor = p
        @do.cursors newCursors        
        
    delCursorAtPos: (p) ->
        c = @cursorAtPos p
        if c and @cursors.length > 1
            newCursors = _.cloneDeep @cursors
            newCursors.splice @indexOfCursor(c), 1
            @mainCursor = null if @isMainCursor c
            @do.cursors newCursors        
                    
    addCursors: (dir='down') ->
        d = switch dir
            when 'up' then -1
            when 'down' then +1
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            if not @cursorAtPos [c[0], c[1]+d]
                newCursors.push [c[0], c[1]+d]
        @mainCursor=null
        @do.cursors newCursors 

    alignCursors: (dir='down') ->
        charPos = switch dir
            when 'up'    then first(@cursors)[0]
            when 'down'  then last( @cursors)[0]
            when 'left'  then _.min (c[0] for c in @cursors)
            when 'right' then _.max (c[0] for c in @cursors)
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            @newCursorSet newCursors, c, charPos, c[1]
        switch dir
            when 'up'   then @mainCursor = first newCursors
            when 'down' then @mainCursor = last  newCursors
        @do.cursors newCursors
        
    clampCursors: ->
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            @newCursorSet newCursors, c, @clampPos c
        @do.cursors newCursors
    
    setCursorsAtSelectionBoundary: (leftOrRight='right') -> 
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
        # @do.cursors (@rangeIndexPos(s,i) for s in @selections) # todo mainCursor
        @mainCursor = null if not main
        @do.cursors newCursors
        # @do.selections []
        @do.end()       

    delCursors: (dir='up') ->
        newCursors = _.cloneDeep @cursors
        d = switch dir
            when 'up' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]-1]) and not @cursorAtPos [c[0], c[1]+1]
                        newCursors.splice @indexOfCursor(c), 1
                        if @isMainCursor c
                            @mainCursor = [c[0], c[1]-1]
            when 'down' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]+1]) and not @cursorAtPos [c[0], c[1]-1]
                        newCursors.splice @indexOfCursor(c), 1
                        if @isMainCursor c
                            @mainCursor = [c[0], c[1]+1]
        @do.cursors newCursors 
        
    cancelCursors: () -> @do.cursors [@mainCursor] 

    cancelCursorsAndHighlights: () ->
        @cancelCursors()
        @highlights = []
        @renderHighlights()
        @emit 'highlight', @highlights

    # 000   000  00000000  000   000   0000000  000   000  00000000    0000000   0000000   00000000 
    # 0000  000  000       000 0 000  000       000   000  000   000  000       000   000  000   000
    # 000 0 000  0000000   000000000  000       000   000  0000000    0000000   000   000  0000000  
    # 000  0000  000       000   000  000       000   000  000   000       000  000   000  000   000
    # 000   000  00000000  00     00   0000000   0000000   000   000  0000000    0000000   000   000
    
    newCursorDelta: (newCursors, oc, dx, dy=0) ->
        nc = newCursors[@indexOfCursor oc]
        nc[0] += dx
        nc[1] += dy
        if @isMainCursor oc
            @mainCursor[0] += dx
            @mainCursor[1] += dy

    newCursorSet: (newCursors, oc, x, y) ->
        nc = newCursors[@indexOfCursor oc]
        [x,y] = x if not y? and x.length >=2
        nc[0] = x
        nc[1] = y
        if @isMainCursor oc
            @mainCursor[0] = x
            @mainCursor[1] = y

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    moveAllCursors: (f, opt={}) ->
        @startSelection opt.extend
        newCursors = _.cloneDeep @cursors        
        if @cursors.length > 1
            for c in @cursors
                newPos = f(c)
                if newPos[1] == c[1] or not opt.keepLine
                    @newCursorSet newCursors, c, newPos
        else
            @newCursorSet newCursors, @cursors[0], f(@cursors[0])
        @mainCursor = first newCursors if opt.main == 'first'        
        @mainCursor = last  newCursors if opt.main == 'last'        
        @do.cursors newCursors, opt.extend
        @endSelection opt.extend
        
    moveCursorsToLineBoundary: (leftOrRight, e) ->
        f = switch leftOrRight
            when 'right' then (c) => [@lines[c[1]].length, c[1]]
            when 'left' then (c) -> [0, c[1]]
        @moveAllCursors f, extend:e, keepLine:true
    
    moveCursorsToWordBoundary: (leftOrRight, e) -> 
        f = switch leftOrRight
            when 'right' then @endOfWordAtCursor
            when 'left' then @startOfWordAtCursor
        @moveAllCursors f, extend:e, keepLine:true
    
    moveCursorsDown: (e, n=1) -> 
        @moveAllCursors ((n)->(c)->[c[0],c[1]+n])(n), extend:e, main: 'last'
        
    moveCursorsUp:   (e, n=1) -> 
        @moveAllCursors ((n)->(c)->[c[0],c[1]-n])(n), extend:e, main: 'first'
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors moveRight(n), extend:e, keepLine:true
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [Math.max(0,c[0]-n), c[1]]
        @moveAllCursors moveLeft(n), extend:e, keepLine:true
        
    moveCursors: (direction, e) ->
        switch direction
            when 'left'  then @moveCursorsLeft e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp e
            when 'down'  then @moveCursorsDown e

    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   

    deIndent: -> 
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors
        for i in @cursorAndSelectedLineIndices()
            if @lines[i].startsWith @indentString
                @do.change @lines, i, @lines[i].substr @indentString.length
                for c in @cursorsInLineAtIndex i
                    @newCursorDelta newCursors, c, -@indentString.length
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
        newCursors = _.cloneDeep @cursors
        for i in @cursorAndSelectedLineIndices()
            @do.change @lines, i, @indentString + @lines[i]
            for c in @cursorsInLineAtIndex i
                @newCursorDelta newCursors, c, @indentString.length
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
        newCursors = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        moveInLine = (i, d) => 
            for s in @selectionsInLineAtIndex i
                newSelections[@selections.indexOf s][1][0] += d
                newSelections[@selections.indexOf s][1][1] += d
            for c in @cursorsInLineAtIndex i
                @newCursorDelta newCursors, c, d
                
        for i in @cursorAndSelectedLineIndices()
            cs = @lines[i].indexOf lineComment
            if cs >= 0 and @lines[i].substr(0,cs).trim().length == 0
                @do.change @lines, i, @lines[i].splice cs, 1
                moveInLine i, -1
                si = @indentationAtLineIndex i
                if si % @indentString.length == 1
                    @do.change @lines, i, @lines[i].splice si-1, 1
                    moveInLine i, -1
            else
                si = @indentationAtLineIndex i
                if @lines[i].length > si
                    l = (lineComment + " ").length
                    @do.change @lines, i, @lines[i].splice si, 0, lineComment + " "
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
        @clearHighlights()
        @clampCursors() # todo: insert spaces instead in multi cursor mode
        if ch in @surroundCharacters
            return if @insertSurroundCharacter ch

        if ch == '\n'
            @insertNewline indent:true
            return
            
        @insertCharacter ch
    
    insertCharacter: (ch) ->

        if ch == '\n'
            @insertNewline indent:false
            return

        @do.start()
        @deleteSelection()
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors # this looks weird
            oc = newCursors[@indexOfCursor c]
            alert 'wtf?' if oc.length < 2 or oc[1] >= @lines.length
            @do.change @lines, oc[1], @lines[oc[1]].splice oc[0], 0, ch
            for nc in @positionsInLineAtIndexInPositions oc[1], newCursors
                if nc[0] >= oc[0]
                    nc[0] += 1
                    if @isMainCursor nc
                        nc[0] += 1

        @do.cursors newCursors
        @do.end()
        
    insertTab: ->
        if @selections.length
            @indent()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            il = @indentString.length
            for c in @cursors
                n = 4-(c[0]%il)
                @do.change @lines, c[1], @lines[c[1]].splice c[0], 0, _.padStart "", n
                newCursors[@indexOfCursor c] = [c[0]+n, c[1]]
                if @isMainCursor c
                    @mainCursor = [c[0]+n, c[1]]
            @do.cursors newCursors
            @do.end()   
        
    insertNewline: (opt) ->
        @closingInserted = null
        @do.start()
        @deleteSelection()
        
        newCursors = _.cloneDeep @cursors

        for c in @cursors
            oc = _.cloneDeep newCursors[@indexOfCursor c]                
            if opt?.indent
                indent = _.padStart "", @indentationAtLineIndex oc[1]            
            else
                indent = ''

            ll = oc[0]
                
            if @isCursorAtEndOfLine oc
                @do.insert @lines, oc[1]+1, indent
            else
                @do.insert @lines, oc[1]+1, indent + @lines[oc[1]].substr(oc[0]).trimLeft()
                @do.change @lines, oc[1],   @lines[oc[1]].substr 0, oc[0]

            # move cursors in and below deleted line down
            for nc in @positionsFromPosInPositions oc, newCursors
                if nc[1] == oc[1]
                    nc[0] += indent.length - ll                    
                nc[1] += 1     
        
        @do.cursors newCursors    
        @do.end()
        
    insertTextFromClipboard: (text) -> #todo: insert multiple lines into multiple selections
        @do.start()
        l = text.split '\n'
        if @cursorPos()[0] == 0 and @cursorPos()[1] > 0
            @moveCursorsUp()
            @moveCursorsToLineBoundary 'right'
            @insertNewline()
        for ch in text
            @insertCharacter ch
        @do.end()
    
    #  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000  
    # 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000
    # 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000
    #      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000
    # 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000  
        
    insertSurroundCharacter: (ch) ->
        
        if @closingSurround?
            if @closingSurround == ch
                @selectNone()
                @deleteForward()
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
                
            if cl == '#{'
                # convert single string to double string
                if sr = @rangeOfStringSurroundingRange s
                    if @lines[sr[0]][sr[1][0]] == "'"
                        @do.change @lines, s[0], @lines[s[0]].splice sr[1][0], 1, '"'
                    if @lines[sr[0]][sr[1][1]-1] == "'"
                        @do.change @lines, s[0], @lines[s[0]].splice sr[1][1]-1, 1, '"'

            @do.change @lines, s[0], @lines[s[0]].splice s[1][1], 0, cr
            @do.change @lines, s[0], @lines[s[0]].splice s[1][0], 0, cl
                            
            newSelections[@indexOfSelection s][1][0] += cl.length
            newSelections[@indexOfSelection s][1][1] += cl.length
            for c in @cursorsInRange s
                @newCursorDelta newCursors, c, cl.length
                
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        return true

    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLineOfCursor: (c) -> # todo: multicursor
        if not @isCursorInLastLine c
            @do.start()
            @do.change @lines, c[1], @lines[c[1]] + @lines[c[1]+1]
            @do.delete @lines, c[1]+1
            @do.end()
            
    joinLine: ->
        @do.start()
        for c in @cursors
            @joinLineOfCursor c
        @do.end()
            
    deleteLineAtIndex: (i) ->
        @do.delete @lines, i
                    
    deleteSelection: ->
        @do.start()
        newCursors = _.cloneDeep @cursors
        for s in @reversedSelections()
            
            for c in @cursorsInRange s
                nc = newCursors[@indexOfCursor(c)]
                sp = @startPosOfContinuousSelectionAtPos c
                nc[0] = sp[0]
                nc[1] = sp[1]

            if @isSelectedLineAtIndex(s[0]) and @lines.length > 1
                @do.delete @lines, s[0]
                # move cursors below deleted line up
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    nc[1] -= 1
            else
                @do.change @lines, s[0], @lines[s[0]].splice s[1][0], s[1][1]-s[1][0]
                
        @do.selections []
        @do.cursors newCursors
        @do.end()
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
                        @do.change @lines, c[1], @lines[c[1]].splice c[0]-n, n
                        newCursors[@indexOfCursor(c)] = [c[0]-n, c[1]]
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
                    
                        @do.change @lines, c[1], @lines[c[1]] + @lines[c[1]+1]
                        @do.delete @lines, c[1]+1
                                    
                        # move cursors in joined line
                        for nc in @positionsInLineAtIndexInPositions c[1]+1, newCursors
                            nc[1] -= 1
                            nc[0] += ll
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1]+1, newCursors
                            nc[1] -= 1
                else
                    @do.change @lines, c[1], @lines[c[1]].splice c[0], 1
                    for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                        if nc[0] > c[0]
                            nc[0] -= 1

            @do.cursors newCursors
            @do.end()
            @clearHighlights()
            
    deleteBackward: ->
        if @selections.length
            @deleteSelection()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @reversedCursors()
            
                if c[0] == 0 # cursor at start of line
                    if c[1] > 0 # cursor not in first line
                        ll = @lines[c[1]-1].length
                        @do.change @lines, c[1]-1, @lines[c[1]-1] + @lines[c[1]]
                        @do.delete @lines, c[1]
                        # move cursors in joined line
                        for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                            nc[1] -= 1
                            nc[0] += ll
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1], newCursors
                            nc[1] -= 1
                else
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @textInRange [c[1], [c[0]-n, c[0]]]
                    if t.trim().length != 0
                        n = 1
                    @do.change @lines, c[1], @lines[c[1]].splice c[0]-n, n
                    for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                        if nc[0] >= c[0]
                            nc[0] -= n

            @do.cursors newCursors
            @do.end()
            @clearHighlights()
            
module.exports = Editor
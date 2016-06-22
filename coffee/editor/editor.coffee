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
        @surroundCharacters = "#*{}[]()'\"".split ''
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
        @do.cursors [p]
        @endSelection e
        
    selectSingleRange: (r) ->
        if not r?
            log "editor.#{name}.selectSingleRange warning! undefined range #{r}"
            return
        @cursors = [[r[1][0], r[0]]]
        @initialCursors = null
        @startSelection true
        @do.cursors [[r[1][1], r[0]]]      
        @endSelection true
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    startSelection: (e) ->
        if e and not @initialCursors
            @initialCursors = _.cloneDeep @cursors
            # log "startSelection #{@initialCursors}", @initialCursors
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
                log 'editor.ednSelection warning! @initialCursors.length != @cursors.length', @initialCursors.length, @cursors.length
            
            for ci in [0...@initialCursors.length]
                ic = @initialCursors[ci]
                cc = @cursors[ci]
                ranges = @rangesBetweenPositions ic, cc
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

    selectNone: -> @do.selections []

    selectMoreLines: ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors = _.cloneDeep @cursors
        
        selectCursorLineAtIndex = (c,i) =>
            range = @rangeForLineAtIndex i
            newSelections.push range
            newCursors[@indexOfCursor(c)] = [range[1][1], range[0]]
            
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
                    newCursors[@indexOfCursor(c)] = [s[1][1], s[0]]
                newSelections.splice @indexOfSelection(thisSel[0]), 1

        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       

    selectAll: => @do.selections @rangesForAllLines()
            
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
        @do.cursors newCursors        
        
    delCursorAtPos: (p) ->
        c = @cursorAtPos p
        if c and @cursors.length > 1
            newCursors = _.cloneDeep @cursors
            newCursors.splice @indexOfCursor(c), 1
            @do.cursors newCursors        
                    
    addCursors: (dir='down') ->
        d = switch dir
            when 'up' then -1
            when 'down' then +1
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            newCursors.push [c[0], c[1]+d]
        @do.cursors newCursors 

    addCursorsForSelections: (i) ->
        @do.start()
        @do.cursors (@rangeIndexPos(s,i) for s in @selections) 
        @do.selections []
        @do.end()
    
    alignCursors: (dir='down') ->
        charPos = switch dir
            when 'up'    then last(@cursors)[0]
            when 'down'  then first(@cursors)[0]
            when 'left'  then _.min (c[0] for c in @cursors)
            when 'right' then _.max (c[0] for c in @cursors)
        newCursors = []
        for c in @cursors
            newCursors.push [charPos, c[1]]
        @do.cursors newCursors
        
    clampCursors: ->
        newCursors = []
        for c in @cursors
            newCursors.push @clampPos c
        @do.cursors newCursors
    
    cursorsAtStartOfSelections: -> @addCursorsForSelections 0
    cursorsAtEndOfSelections: -> @addCursorsForSelections 1

    delCursors: (dir='up') ->
        newCursors = _.cloneDeep @cursors
        d = switch dir
            when 'up' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]-1]) and not @cursorAtPos [c[0], c[1]+1]
                        newCursors.splice @indexOfCursor(c), 1
            when 'down' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]+1]) and not @cursorAtPos [c[0], c[1]-1]
                        newCursors.splice @indexOfCursor(c), 1    
        @do.cursors newCursors 
        
    cancelCursors: () ->
        @do.cursors [@cursors[0]]

    cancelCursorsAndHighlights: () ->
        @cancelCursors()
        @highlights = []
        @renderHighlights()
        @emit 'highlights', @highlights

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    setCursorPos: (c, p) ->
        newCursors = _.cloneDeep @cursors
        newCursors[@indexOfCursor(c)] = p
        @do.cursors newCursors
        
    moveCursorToPos: (c, p) -> 
        @closingInserted = null
        @setCursorPos c, p
                        
    moveAllCursors: (e, f, keepLine=false) ->
        @startSelection e
        newCursors = _.cloneDeep @cursors        
        if @cursors.length > 1
            for c in @cursors
                newPos = f(c)
                if newPos[1] == c[1] or not keepLine
                    newCursors[@indexOfCursor(c)] = newPos
        else
            newCursors[0] = f(@cursors[0])
        @do.cursors newCursors
        @endSelection e
        
    moveCursorsToEndOfLine:   (e) -> @moveAllCursors e, (c) => [@lines[c[1]].length, c[1]]
    moveCursorsToStartOfLine: (e) -> @moveAllCursors e, (c) -> [0, c[1]]
    moveCursorsToEndOfWord:   (e) -> @moveAllCursors e, @endOfWordAtCursor, true
    moveCursorsToStartOfWord: (e) -> @moveAllCursors e, @startOfWordAtCursor, true
    
    moveCursorsUp:   (e, n=1) -> @moveAllCursors e, ((n)->(c)->[c[0],c[1]-n])(n)
    moveCursorsDown: (e, n=1) -> @moveAllCursors e, ((n)->(c)->[c[0],c[1]+n])(n)
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors e, moveRight(n), true
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [c[0]-n, c[1]]
        @moveAllCursors e, moveLeft(n), true
        
    moveCursors: (direction, e) ->
                
        switch direction
            when 'left'  then @moveCursorsLeft e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp e
            when 'down'  then @moveCursorsDown e

    moveCursorToLineIndex: (i, e) -> # todo handle e
        @moveCursorToPos @cursors[0], [@cursors[0][0], i]
        
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
                    newCursors[@indexOfCursor c][0] -= @indentString.length
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
                newCursors[@indexOfCursor c][0] += @indentString.length
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
        for i in @cursorAndSelectedLineIndices()
            cs = @lines[i].indexOf lineComment
            if cs >= 0 and @lines[i].substr(0,cs).trim().length == 0
                @do.change @lines, i, @lines[i].splice cs, 1
                for s in @selectionsInLineAtIndex i
                    newSelections[@selections.indexOf s][1][0] += -1
                    newSelections[@selections.indexOf s][1][1] += -1
                for c in @cursorsInLineAtIndex i
                    newCursors[@cursors.indexOf c][0] += -1
                si = @indentationAtLineIndex i
                if si % @indentString.length == 1
                    @do.change @lines, i, @lines[i].splice si-1, 1
                    for s in @selectionsInLineAtIndex i
                        newSelections[@selections.indexOf s][1][0] += -1
                        newSelections[@selections.indexOf s][1][1] += -1
                    for c in @cursorsInLineAtIndex i
                        newCursors[@cursors.indexOf c][0] += -1
            else
                si = @indentationAtLineIndex i
                if @lines[i].length > si
                    l = (lineComment + " ").length
                    @do.change @lines, i, @lines[i].splice si, 0, lineComment + " "
                    for s in @selectionsInLineAtIndex i
                        newSelections[@selections.indexOf s][1][0] += l
                        newSelections[@selections.indexOf s][1][1] += l
                    for c in @cursorsInLineAtIndex i
                        newCursors[@cursors.indexOf c][0] += l
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
        
        for c in @cursors
            oc = newCursors[@indexOfCursor c]
            alert 'wtf?' if oc.length < 2 or oc[1] >= @lines.length
            @do.change @lines, oc[1], @lines[oc[1]].splice oc[0], 0, ch
            for nc in @positionsInLineAtIndexInPositions oc[1], newCursors
                if nc[0] >= oc[0]
                    nc[0] += 1

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
                newCursors[@indexOfCursor c][0] += cl.length
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        return true

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
            @do.cursors newCursors
            @do.end()   
        
    insertNewline: (opt) ->
        @closingInserted = null
        @do.start()
        @deleteSelection()
        
        newCursors = _.cloneDeep @cursors

        for c in @cursors
            oc = _.cloneDeep newCursors[@indexOfCursor c]                
            if opt.indent
                indent = _.padStart "", @indentationAtLineIndex oc[1]            
            else
                indent = ''

            ll = oc[0]
                
            if @cursorAtEndOfLine oc
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
        
    insertTextFromClipboard: (text) -> #todo insert multiple lines into multiple selections
        @do.start()        
        for ch in text
            @insertCharacter ch
        @do.end()
    
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLineOfCursor: (c) ->
        if not @cursorInLastLine c
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
            
                if @cursorAtEndOfLine c # cursor at end of line
                    if not @cursorInLastLine c # cursor not in first line
                    
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
#  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000  
# 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000
# 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000
#      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000
# 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000  

{log} = require 'kxk'
_ = require 'lodash'

module.exports =
                
    isUnbalancedSurroundCharacter: (ch) ->
        return false if ch in ["#"]
        [cl,cr] = @surroundPairs[ch]
        return false if cl.length > 1
        for cursor in @cursors()
            count = 0
            for c in @line(cursor[1])
                if c == cl
                    count += 1
                else if c == cr
                    count -= 1
            if ((cl == cr) and (count % 2)) or ((cl != cr) and count)
                return true
        return false
    
    selectionContainsOnlyQuotes: ->
        for c in @textOfSelection()
            continue if c == '\n'
            if c not in ['"', "'"]
                return false
        true
        
    # 000  000   000   0000000  00000000  00000000   000000000  
    # 000  0000  000  000       000       000   000     000     
    # 000  000 0 000  0000000   0000000   0000000       000     
    # 000  000  0000       000  000       000   000     000     
    # 000  000   000  0000000   00000000  000   000     000     
    
    insertSurroundCharacter: (ch) ->

        if @isUnbalancedSurroundCharacter ch
            return false 
        
        if @numSelections() and ch in ['"', "'"] and @selectionContainsOnlyQuotes()
            return false
        
        newCursors = @do.cursors()
        
        if @surroundStack.length
            if _.last(@surroundStack)[1] == ch
                for c in newCursors
                    if @do.line(c[1])[c[0]] != ch
                        @surroundStack = []
                        break
                if @surroundStack.length and _.last(@surroundStack)[1] == ch
                    @do.start()
                    @selectNone()
                    @deleteForward()
                    @do.end()
                    @surroundStack.pop()
                    return false 
        
        if ch == '#' and @fileType == 'coffee' # check if any cursor or selection is inside a string
            found = false
            for s in @do.selections()
                if @isRangeInString s
                    found = true
                    break
                    
            if not found
                for c in newCursors
                    if @isRangeInString rangeForPos c
                        found = true
                        break
            return false if not found
            
        if ch == "'" and not @numSelections() # check if any alpabetical character is before any cursor
            for c in newCursors
                if c[0] > 0 and /[A-Za-z]/.test @do.line(c[1])[c[0]-1] 
                    return false
        
        @do.start()
        if @do.numSelections() == 0
            newSelections = @rangesFromPositions newCursors
        else
            newSelections = @do.selections()
            
        [cl,cr] = @surroundPairs[ch]
            
        @surroundStack.push [cl,cr]

        for ns in newSelections.reversed()
                                    
            if cl == '#{' # convert single string to double string
                if sr = @rangeOfStringSurroundingRange ns
                    if @do.line(sr[0])[sr[1][0]] == "'"
                        @do.change ns[0], @do.line(ns[0]).splice sr[1][0], 1, '"'
                    if @do.line(sr[0])[sr[1][1]-1] == "'"
                        @do.change ns[0], @do.line(ns[0]).splice sr[1][1]-1, 1, '"'
                        
            else if @fileType == 'coffee' and cl == '(' and @lengthOfRange(ns) > 0 # remove space after callee
                before = @do.line(ns[0]).slice 0, ns[1][0]
                after  = @do.line(ns[0]).slice ns[1][0]
                trimmed = before.trimRight()
                beforeGood = /\w$/.test(trimmed) and not /(if|when|in|and|or|is|not|else|return)$/.test trimmed
                afterGood = after.trim().length and not after.startsWith ' '
                if beforeGood and afterGood
                    spaces = before.length-trimmed.length
                    @do.change ns[0], @do.line(ns[0]).splice trimmed.length, spaces
                    ns[1][0] -= spaces
                    ns[1][1] -= spaces
                    
            @do.change ns[0], @do.line(ns[0]).splice ns[1][1], 0, cr
            @do.change ns[0], @do.line(ns[0]).splice ns[1][0], 0, cl
            
            for c in positionsInLineAfterColInPositions ns[0], ns[1][0]-1, newCursors
                cursorDelta c, cl.length
                
            
            for os in @rangesAfterLineColInRanges ns[0], ns[1][1], newSelections
                os[1][0] += cr.length
                os[1][1] += cr.length
                
            for os in @rangesAfterLineColInRanges ns[0], ns[1][0], newSelections
                os[1][0] += cl.length
                os[1][1] += cl.length
            
            for c in positionsInLineAfterColInPositions ns[0], ns[1][1], newCursors
                cursorDelta c, cr.length
                
        @do.select @rangesNotEmptyInRanges newSelections
        @do.setCursors newCursors
        @do.end()
        return true
            
    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000   0000000  
    # 000   000  000  000        000   000  000      000  000        000   000     000     000       
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     0000000   
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000          000  
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     0000000   
    
    highlightsSurroundingCursor: ->
        if @numHighlights() % 2 == 0
            hs = @highlights()
            # sortRanges hs # necessary?
            if @numHighlights() == 2
                return hs
            else if @numHighlights() == 4
                if areSameRanges [hs[1], hs[2]], @selections()
                    return [hs[0], hs[3]]
                else
                    return [hs[1], hs[2]]


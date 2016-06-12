# 0000000    000   000  00000000  00000000  00000000  00000000 
# 000   000  000   000  000       000       000       000   000
# 0000000    000   000  000000    000000    0000000   0000000  
# 000   000  000   000  000       000       000       000   000
# 0000000     0000000   000       000       00000000  000   000

{
clamp,
startOf,
endOf,
first,
last
}      = require '../tools/tools'
log    = require '../tools/log'
assert = require 'assert'

class Buffer
    
    constructor: () -> @setLines [""]

    setLines: (lines) ->
        @lines      = lines
        @cursors    = [[0,0]]
        @selections = []
        @highlights = []
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000   0000000
    # 000       000       000      000       000          000     000  000   000  0000  000  000     
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000  0000000 
    #      000  000       000      000       000          000     000  000   000  000  0000       000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000  0000000 

    selectionsRelativeToLineIndexRange: (lineIndexRange) ->
        sl = @selectionsInLineIndexRange lineIndexRange
        if sl
            ([s[0]-lineIndexRange[0], [s[1][0], s[1][1]]] for s in sl)
    
    selectionsInLineIndexRange: (lineIndexRange) ->
        sl = []
        for s in @selections
            if s[0] >= lineIndexRange[0] and s[0] <= lineIndexRange[1]
                sl.push _.clone s
        sl
        
    reversedSelections: ->
        r = _.clone @selections
        r.reverse()
        r

    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000   0000000
    # 000   000  000  000        000   000  000      000  000        000   000     000     000     
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     0000000 
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000          000
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     0000000 

    highlightsRelativeToLineIndexRange: (lineIndexRange) ->
        hl = @highlightsInLineIndexRange lineIndexRange
        if hl
            ([s[0]-lineIndexRange[0], [s[1][0], s[1][1]]] for s in hl)
    
    highlightsInLineIndexRange: (lineIndexRange) ->
        hl = []
        for s in @highlights
            if s[0] >= lineIndexRange[0] and s[0] <= lineIndexRange[1]
                hl.push _.clone s
        hl
        
    reversedHighlights: ->
        r = _.clone @highlights
        r.reverse()
        r
        
    posInHighlights: (p) -> @highlights.length and @rangeAtPosInRanges p, @highlights
                    
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
    
    cursorsRelativeToLineIndexRange: (lineIndexRange) ->
        cl = []
        for c in @cursors
            if c[1] >= lineIndexRange[0] and c[1] <= lineIndexRange[1]
                cl.push [c[0], c[1] - lineIndexRange[0]]
        cl
        
    cursorAtPos: (p) ->
        for c in @cursors
            if c[0] == p[0] and c[1] == p[1]
                return c
                
    cursorsInRange: (r) ->
        cs = []
        for c in @cursors
            if @isPosInRange c, r
                cs.push c
        cs
                
    indexOfCursor: (c) -> @cursors.indexOf c

    reversedCursors: ->
        cs = _.clone @cursors
        cs.reverse()
        cs
    
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
            
    selectedLineIndices: -> (s[0] for s in @selections)

    cursorOrSelectedLineIndices: ->
        l = @selectedLineIndices()
        if l.length == 0
            l = [@cursors[0][1]] 
        l
                
    selectedLineIndicesRange: ->
        # log 'selectedLineIndicesRange', @selections
        if @selections.length
            [first(@selections)[0], last(@selections)[0]]
        else
            []
            
    isSelectedLineAtIndex: (li) ->
        il = @selectedLineIndices()
        if li in il
            s = @selections[il.indexOf li]
            if s[1][0] == 0 and s[1][1] == @lines[li].length
                return true
        false
        
    selectionsAtLineIndex: (li) ->
        sl = []
        for s in @selections
            if s[0] == li
                sl.push s
        sl
        
    indexOfSelection: (s) -> @selections.indexOf s

    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000

    cursorAtEndOfLine:   (c=@cursors[0]) -> c[0] >= @lines[c[1]].length
    cursorAtStartOfLine: (c=@cursors[0]) -> c[0] == 0
    cursorInLastLine:    (c=@cursors[0]) -> c[1] == @lines.length-1
    cursorInFirstLine:   (c=@cursors[0]) -> c[1] == 0

    endOfWordAtCursor: (c=@cursors[0]) =>
        r = @rangeForWordAtPos c
        if @cursorAtEndOfLine c
            return c if @cursorInLastLine c
            r = @rangeForWordAtPos [0, c[1]+1]
        [r[1][1], r[0]]

    startOfWordAtCursor: (c=@cursors[0]) =>
        r = @rangeForWordAtPos c
        if @cursorAtStartOfLine c
            return c if @cursorInFirstLine c
            r = @rangeForWordAtPos [@lines[c[1]-1].length, c[1]-1]
        else if r[0] == c[0]
            r = @rangeForWordAtPos [c[0]-1, c[1]]
        [r[1][0], r[0]]


    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    text:            -> @lines.join '\n'
    textInRange: (r) -> @lines[r[0]].slice r[1][0], r[1][1]
    textOfSelectionForClipboard: -> 
        t = []
        for s in @selections
            t.push @textInRange s
        t.join '\n'
        
    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   
        
    indentationAtLineIndex: (i) ->
        s = 0
        while @lines[i][s] == ' '
            s += 1
        s
            
    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    lastPos: () -> 
        lli = @lines.length-1
        [@lines[lli].length, lli]

    cursorPos: ->
        l = clamp 0, @lines.length-1, @cursors[0][1]
        c = clamp 0, @lines[l].length, @cursors[0][0]
        [ c, l ]
        
    clampPos: (p) ->
        l = clamp 0, @lines.length-1, p[1]
        c = clamp 0, @lines[l].length-1, p[0]
        [ c, l ]
        
    isPosInRange: (p, r) ->
        return (p[1] == r[0]) and (r[1][0] <= p[0] <= r[1][1])

    rangeEndPos:   (r)   -> [r[1][1], r[0]]
    rangeStartPos: (r)   -> [r[1][0], r[0]]
    rangeIndexPos: (r,i) -> [r[1][i], r[0]]

    # 00000000    0000000   000   000   0000000   00000000   0000000
    # 000   000  000   000  0000  000  000        000       000     
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000   000  000   000  000  0000  000   000  000            000
    # 000   000  000   000  000   000   0000000   00000000  0000000 
    
    rangesBetweenPositions: (a, b) ->
        r = []
        [a,b] = @sortPositions [a,b]
        if a[1] == b[1]
            r.push [a[1], [a[0], b[0]]]
        else
            r.push [a[1], [a[0], @lines[a[1]].length]]
            r.push [b[1], [0, b[0]]]
        if b[1] - a[1] > 1
            for i in [a[1]+1...b[1]]
                r.push [i, [0,@lines[i].length]]
        r
    
    rangesForCursors: (cs=@cursors) -> ([c[1], [c[0], c[0]]] for c in cs)
    
    rangeAtPosInRanges: (pos, ranges) ->
        for r in ranges
            if (r[0] == pos[1]) and (r[1][0] <= pos[0] <= r[1][1])
                return r
            
    rangeBeforePosInRanges: (pos, ranges) ->
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if (r[0] < pos[1]) or ((r[0] == pos[1]) and (r[1][1] < pos[0]))
                return r 
    
    rangeAfterPosInRanges: (pos, ranges) ->
        for r in ranges
            if (r[0] > pos[1]) or ((r[0] == pos[1]) and (r[1][0] > pos[0]))
                return r
    
    rangeStartingOrEndingAtPosInRanges: (p, ranges) ->
        for r in ranges
            if r[0] == p[1]
                if r[1][0] == p[0] or r[1][1] == p[0]
                    return r
        
    rangeForLineAtIndex: (i) -> 
        throw new Error() if i >= @lines.length
        [i, [0, @lines[i].length]] 
        
    rangesForAllLines: -> @rangesForLinesFromTopToBot 0, @lines.length-1
    rangesForLinesFromTopToBot: (top,bot) -> 
        r = []
        ir = [top,bot]
        for li in [startOf(ir)...endOf(ir)]
            r.push @rangeForLineAtIndex li
        r
    
    rangesForTextInLineAtIndex: (t, i) ->
        re = new RegExp t, 'g'
        r = []
        while (mtch = re.exec(@lines[i])) != null
            r.push [i, [mtch.index, re.lastIndex]]
        r
                    
    rangesForText: (t) ->
        t = t.split('\n')[0]
        r = []
        for li in [0...@lines.length]
            r = r.concat @rangesForTextInLineAtIndex t, li
        log 'rangesForText', t, r
        r
                
    rangeForWordAtPos: (pos) ->
        p = @clampPos pos
        l = @lines[p[1]]
        
        return [p[1], [0,0]] if l.length == 0
        
        r = [p[0], p[0]]
        c = l[r[0]]

        wordReg = /(\@|\w)/
        w = c.match wordReg

        while r[0] > 0
            n = l[r[0]-1]
            m = n.match wordReg
            if w? != m?
                break
            r[0] -= 1
        while r[1] < l.length-1
            n = l[r[1]+1]
            m = n.match wordReg
            if w? != m?
                break
            r[1] += 1
        range = [p[1], [r[0], r[1]+1]]
        range
        
    # 000   000  000   000  000   000   0000000  00000000  0000000    00000 
    # 000   000  0000  000  000   000  000       000       000   000     000
    # 000   000  000 0 000  000   000  0000000   0000000   000   000   000  
    # 000   000  000  0000  000   000       000  000       000   000        
    #  0000000   000   000   0000000   0000000   00000000  0000000     000  
    
    rangeIntersection: (a,b) ->
        s = Math.max(a[0], b[0])
        e = Math.min(a[1], b[1])
        [s, e] if s<=e
        
    #  0000000   0000000   00000000   000000000
    # 000       000   000  000   000     000   
    # 0000000   000   000  0000000       000   
    #      000  000   000  000   000     000   
    # 0000000    0000000   000   000     000   
                
    sortRanges: (ranges) ->
        ranges.sort (a,b) -> 
            if a[0]!=b[0]
                a[0]-b[0]
            else
                if a[1][0]!=b[1][0]
                    a[1][0]-b[1][0]
                else
                    a[1][1]-b[1][1]
                    
    sortPositions: (positions) ->
        positions.sort (a,b) ->
            if a[1]!=b[1]
                a[1]-b[1]
            else
                a[0]-b[0]
                
    #  0000000  000       0000000   00     00  00000000 
    # 000       000      000   000  000   000  000   000
    # 000       000      000000000  000000000  00000000 
    # 000       000      000   000  000 0 000  000      
    #  0000000  0000000  000   000  000   000  000      
                
    clampPositions: (positions) ->
        for p in positions
            p[0] = Math.max p[0], 0
            p[1] = clamp 0, @lines.length-1, p[1]
           
    #  0000000  000      00000000   0000000   000   000
    # 000       000      000       000   000  0000  000
    # 000       000      0000000   000000000  000 0 000
    # 000       000      000       000   000  000  0000
    #  0000000  0000000  00000000  000   000  000   000
              
    cleanCursors: (cs) ->
        @clampPositions cs
        @sortPositions cs
        if cs.length > 1
            for ci in [cs.length-1...0]
                c = cs[ci]
                p = cs[ci-1]
                if c[1] == p[1] and c[0] == p[0] 
                    cs.splice ci, 1
        cs
                    
    cleanRanges: (ranges) ->
        @sortRanges ranges 
        if ranges.length > 1
            for ri in [ranges.length-1...0]
                r = ranges[ri]
                p = ranges[ri-1]
                if r[0] == p[0] # on same line
                    if r[1][0] <= p[1][1] # starts before previous ends
                        p[1][1] = Math.max(p[1][1], r[1][1])
                        ranges.splice ri, 1
        log ranges
        ranges
    
module.exports = Buffer
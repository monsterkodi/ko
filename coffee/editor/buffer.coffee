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
        for s in @selection
            t.push textInRange s
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
        # log 'rangesBetweenPositions a:', a, 'b:', b, '->', r
        r
    
    rangesForCursors: (cs=@cursors) -> ([c[1], [c[0], c[0]]] for c in cs)
            
    rangeAfterPosInRanges: (pos, ranges) ->
        for r in ranges
            if r[0][1] > pos[1] or r[0][1] == pos[1] and r[0][0] > pos[0]
                return r 

    rangeBeforePosInRanges: (pos, ranges) ->
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if r[0][1] < pos[1] or r[0][1] == pos[1] and r[1][0] < pos[0]
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
        ci = @lines[i].search(t)
        if ci > -1 
            [[[ci,i], [ci+t.length,i]]]
        
    rangesForText: (t) ->
        s = t.split('\n')
        r = []
        for i in [0...@lines.length]
            lr = @rangesForTextInLineAtIndex t, i
            [].push.apply(r, lr)
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
        [p[1], [r[0], r[1]+1]]
        
    # 000   000  000   000  000   000   0000000  00000000  0000000    00000 
    # 000   000  0000  000  000   000  000       000       000   000     000
    # 000   000  000 0 000  000   000  0000000   0000000   000   000   000  
    # 000   000  000  0000  000   000       000  000       000   000        
    #  0000000   000   000   0000000   0000000   00000000  0000000     000  
    
    rangeIntersection: (a,b) ->
        s = Math.max(a[0], b[0])
        e = Math.min(a[1], b[1])
        [s, e] if s<=e
        
    # 000000000   0000000    0000000   000       0000000
    #    000     000   000  000   000  000      000     
    #    000     000   000  000   000  000      0000000 
    #    000     000   000  000   000  000           000
    #    000      0000000    0000000   0000000  0000000 
        
    rangeStartingOrEndingAtPos: (ranges, p) ->
        for r in ranges
            if r[0] == p[1]
                if r[1][0] == p[0] or r[1][1] == p[0]
                    return r
                
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
            
    cleanCursors: (cs) ->
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
        ranges
    
module.exports = Buffer
# 0000000    000   000  00000000  00000000  00000000  00000000 
# 000   000  000   000  000       000       000       000   000
# 0000000    000   000  000000    000000    0000000   0000000  
# 000   000  000   000  000       000       000       000   000
# 0000000     0000000   000       000       00000000  000   000

{clamp,
 startOf,
 first,
 last,
 endOf}   = require '../tools/tools'
log       = require '../tools/log'

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
        log 'selectedLineIndicesRange', @selections
        if @selections.length
            log 'selectedLineIndicesRange', @selections, first(@selections), last(@selections)
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
    
    rangeIntersection: (a,b) ->
        s = Math.max(a[0], b[0])
        e = Math.min(a[1], b[1])
        [s, e] if s<=e
            
    rangeAfterPosInRanges: (pos, ranges) ->
        for r in ranges
            if r[0][1] > pos[1] or r[0][1] == pos[1] and r[0][0] > pos[0]
                return r 

    rangeBeforePosInRanges: (pos, ranges) ->
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if r[0][1] < pos[1] or r[0][1] == pos[1] and r[1][0] < pos[0]
                return r 
    
    rangeForLineAtIndex: (i)  -> [i, [0, @lines[i].length]] 
    rangesForLinesFromTopToBot: (top,bot) ->
    rangesForAllLines: -> return @rangesForLinesFromTopToBot @topIndex, @botIndex
    
    rangesForCursors: -> ([c[1], [c[0], c[0]]] for c in @cursors)
    
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
    
module.exports = Buffer
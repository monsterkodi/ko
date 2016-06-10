# 0000000    000   000  00000000  00000000  00000000  00000000 
# 000   000  000   000  000       000       000       000   000
# 0000000    000   000  000000    000000    0000000   0000000  
# 000   000  000   000  000       000       000       000   000
# 0000000     0000000   000       000       00000000  000   000

{clamp,
 startOf,
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
            
    selectedLineIndices: ->
        range = @selectedLineIndicesRange()
        if range
            (i for i in [range[0]..range[1]])
        else 
            []

    cursorOrSelectedLineIndices: ->
        l = @selectedLineIndices()
        if l.length == 0
            l = [@cursors[0][1]] 
        l
                
    selectedLineIndicesRange: ->
        if @selection
            [Math.min(@cursors[0][1], @selection[1]), Math.max(@cursors[0][1], @selection[1])]

    # selectedLines: ->
    #     s = []
    #     for i in @selectedLineIndices()
    #         s.push @selectedTextForLineAtIndex i
    #         i += 1
    #     s
    
    # selectedTextForLineAtIndex: (i) ->
    #     r = @selectedCharacterRangeForLineAtIndex i
    #     if r?
    #         return @lines[i].substr r[0], r[1]-r[0]
    #     return ''
                
    # selectedCharacterRangeForLineAtIndex: (i) ->
            
        # return if not @selection
        # lines = @selectedLineIndicesRange()
        # return if i < lines[0] or i > lines[1]                      # outside selection
        # return [0, @lines[i].length] if lines[0] < i < lines[1]     # inside selection
        # curPos = @cursorPos()
        # if lines[0] == lines[1]                                     # only one line in selection
        #     return [Math.min(curPos[0], @selection[0]), 
        #             Math.max(curPos[0], @selection[0])]
        # if i == @cursors[0][1]                                      # on cursor line
        #     if @selection[1] > i                                        # at start of selection
        #         return [curPos[0], @lines[i].length]
        #     else                                                        # at end of selection
        #         return [0, Math.min(@lines[i].length, curPos[0])]
        # else                                                        # on selection line
        #     if curPos[1] > i                                            # at start of selection
        #         return [@selection[0], @lines[i].length]
        #     else                                                        # at end of selection
        #         return [0, Math.min(@lines[i].length, @selection[0])]

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
    # selectedText:    -> @selectedLines().join '\n'
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
    
    rangeForLineAtIndex: (i)  -> [0, @lines[i].length] 
    rangesForLineAtIndex: (i) -> [[0, i], [@lines[i].length, i]]
    rangesForCursorLine:      -> [[0, @cursors[0][1]], [@lines[@cursors[0][1]].length, @cursors[0][1]]]
    
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
    
    # rangesForWordAtPos: (pos) ->
    #     p = @clampPos pos
    #     l = @lines[p[1]]
    #     
    #     return [[0,p[1]], [0,p[1]]] if l.length == 0
    #     
    #     r = [p[0], p[0]]
    #     c = l[r[0]]
    # 
    #     wordReg = /(\@|\w)/
    #     w = c.match wordReg
    # 
    #     while r[0] > 0
    #         n = l[r[0]-1]
    #         m = n.match wordReg
    #         if w? != m?
    #             break
    #         r[0] -= 1
    #     while r[1] < l.length-1
    #         n = l[r[1]+1]
    #         m = n.match wordReg
    #         if w? != m?
    #             break
    #         r[1] += 1
    #     [[r[0], p[1]], [r[1]+1, p[1]]]

module.exports = Buffer
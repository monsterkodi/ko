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
}      = require "../tools/tools"
log    = require '../tools/log'
fuzzy  = require 'fuzzy'
event  = require 'events'
_      = require 'lodash'

class Buffer extends event
    
    constructor: () -> 
        @wordRegExp = new RegExp "(\\s+|\\w+|[^\\s])", 'g'
        @setLines ['']

    setLines: (@lines) ->
        @cursors    = [[0,0]]
        @mainCursor = [0,0]
        @selections = []
        @highlights = []
        @emit 'numLines', @lines.length

    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
            
    cursorAtPos: (p,cl=@cursors) ->
        for c in cl
            if c[0] == p[0] and c[1] == p[1]
                return c
                
    cursorsInRange: (r) ->
        cs = []
        for c in @cursors
            if @isPosInRange c, r
                cs.push c
        cs
                
    indexOfCursor: (c) -> @cursors.indexOf c
    isMainCursor: (c) -> @isSamePos c, @mainCursor

    reversedCursors: ->
        cs = _.clone @cursors
        cs.reverse()
        cs

    cursorsInLineAtIndex: (li) ->
        cs = []
        for c in @cursors
            if c[1] == li
                cs.push c
        cs
    
    isCursorVirtual:       (c=@mainCursor) -> c[0] > @lines[c[1]].length
    isCursorAtEndOfLine:   (c=@mainCursor) -> c[0] >= @lines[c[1]].length
    isCursorAtStartOfLine: (c=@mainCursor) -> c[0] == 0
    isCursorInIndent:      (c=@mainCursor) -> @lines[c[1]].slice(0, c[0]).trim().length == 0
    isCursorInLastLine:    (c=@mainCursor) -> c[1] == @lines.length-1
    isCursorInFirstLine:   (c=@mainCursor) -> c[1] == 0
    isCursorInRange:     (r,c=@mainCursor) -> @isPosInRange c, r

    # 000   000   0000000   00000000   0000000  
    # 000 0 000  000   000  000   000  000   000
    # 000000000  000   000  0000000    000   000
    # 000   000  000   000  000   000  000   000
    # 00     00   0000000   000   000  0000000  

    wordAtCursor: (c=@mainCursor) -> @textInRange @rangeForWordAtPos c
    wordsAtCursors: (cs=@cursors) -> (@textInRange @rangeForWordAtPos c for c in cs)
    rangeForWordAtPos: (pos) ->
        p = @clampPos pos
        wr = @wordRangesInLineAtIndex p[1]
        r = @rangeAtPosInRanges p, wr
        r

    endOfWordAtCursor: (c=@mainCursor) =>
        r = @rangeForWordAtPos c
        if @isCursorAtEndOfLine c
            return c if @isCursorInLastLine c
            r = @rangeForWordAtPos [0, c[1]+1]
        [r[1][1], r[0]]

    startOfWordAtCursor: (c=@mainCursor) =>
        if @isCursorAtStartOfLine c
            return c if @isCursorInFirstLine c
            r = @rangeForWordAtPos [@lines[c[1]-1].length, c[1]-1]
        else 
            r = @rangeForWordAtPos c
            if r[1][0] == c[0]
                r = @rangeForWordAtPos [c[0]-1, c[1]]
        [r[1][0], r[0]]
        
    wordRangesInLineAtIndex: (li, rgx=@wordRegExp) -> 
        r = @rangesWithLineIndexInTextForRegExp li, @lines[li], rgx
        r.length and r or [[li, [0,0]]]
               
    rangesWithLineIndexInTextForRegExp: (li, text, rgx) ->
        r = []
        while (mtch = rgx.exec(text)) != null
            r.push [li, [mtch.index, rgx.lastIndex]]
        r

    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000   0000000
    # 000       000       000      000       000          000     000  000   000  0000  000  000     
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000  0000000 
    #      000  000       000      000       000          000     000  000   000  000  0000       000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000  0000000 

    selectionsInLineIndexRangeRelativeToLineIndex: (lineIndexRange, relIndex) ->
        sl = @selectionsInLineIndexRange lineIndexRange
        if sl
            ([s[0]-relIndex, [s[1][0], s[1][1]]] for s in sl)
    
    selectionsInLineIndexRange: (lineIndexRange) ->
        sl = []
        for s in @selections
            if s[0] >= lineIndexRange[0] and s[0] <= lineIndexRange[1]
                sl.push _.clone s
        sl
        
    reversedSelections: ->
        sl = _.clone @selections
        sl.reverse()
        sl

    selectedLineIndices: -> _.uniq (s[0] for s in @selections)
    cursorLineIndices:   -> _.uniq (c[1] for c in @cursors)

    selectedAndCursorLineIndices: ->
        _.uniq @selectedLineIndices().concat @cursorLineIndices()
                
    continuousCursorAndSelectedLineIndexRanges: ->
        il = @selectedAndCursorLineIndices()
        csr = []
        if il.length
            for li in il
                if csr.length and last(csr)[1] == li-1
                    last(csr)[1] = li
                else
                    csr.push [li,li]
        csr
            
    selectedLineIndexRange: ->
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
        
    selectionsInLineAtIndex: (li) ->
        sl = []
        for s in @selections
            if s[0] == li
                sl.push s
        sl
        
    indexOfSelection: (s) -> @selections.indexOf s
    
    startPosOfContinuousSelectionAtPos: (p) -> # used by deleteSelection to calculate cursor positions
        r = @rangeAtPosInRanges p, @selections
        if r
            sp = @rangeStartPos r
            while (sp[0] == 0) and (sp[1] > 0)
                plr = @rangeForLineAtIndex sp[1]-1
                r = @rangeAtPosInRanges @rangeEndPos(plr), @selections
                if r
                    sp = @rangeStartPos plr
                else
                    break
        sp
        
    onlyFullLinesSelected: -> 
        return false if not @selections.length
        for s in @selections
            return false if not @isSameRange s, @rangeForLineAtIndex s[0]
        true

    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000   0000000
    # 000   000  000  000        000   000  000      000  000        000   000     000     000     
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     0000000 
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000          000
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     0000000 

    highlightsInLineIndexRangeRelativeToLineIndex: (lineIndexRange, relIndex) ->
        hl = @highlightsInLineIndexRange lineIndexRange
        if hl
            ([s[0]-relIndex, [s[1][0], s[1][1]]] for s in hl)
    
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
                    
    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    text:            -> @lines.join '\n'
    textInRange: (r) -> @lines[r[0]].slice r[1][0], r[1][1]
    textsInRanges: (rgs) -> (@textInRange(r) for r in rgs)
        
    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   
        
    indentationAtLineIndex: (li) ->
        s = 0
        while @lines[li][s] == ' '
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
        if not @mainCursor?
            alert 'no main cursor!'
            throw new Error
        l = clamp 0, @lines.length-1, @mainCursor[1]
        c = clamp 0, @lines[l].length, @mainCursor[0]
        [ c, l ]
        
    clampPos: (p) ->        
        if not @lines.length
            alert "no line?"
            throw new Error
        l = clamp 0, @lines.length-1, p[1]
        c = clamp 0, @lines[l].length, p[0]
        [ c, l ]
        
    isSamePos: (a,b) -> a[1]==b[1] and a[0]==b[0]
    isPosInRange: (p, r) -> (p[1] == r[0]) and (r[1][0] <= p[0] <= r[1][1])
    isPosInRanges: (p, rgs) -> @rangeAtPosInRanges(p, rgs)?
        
    positionsFromPosInPositions: (p, pl) -> 
        (r for r in pl when ((r[1] > p[1]) or ((r[1] == p[1]) and (r[0] >= p[0]))))
    positionsInLineAtIndexInPositions: (li,pl) -> (p for p in pl when p[1] == li)
    positionsBelowLineIndexInPositions: (li,pl) -> (p for p in pl when p[1] > li)
    positionsAfterLineColInPositions: (li,col,pl) -> (p for p in pl when p[1] == li and p[0]>=col)
    positionsNotInRanges: (pss, rgs) -> _.filter pss, (p) => not @isPosInRanges p, rgs
    manhattanDistance: (a,b) -> Math.abs(a[1]-b[1])+Math.abs(a[0]-b[0])
        
    posClosestToPosInPositions: (p,pl) -> 
        minDist = 999999        
        for ps in pl
            mDist = @manhattanDistance ps, p
            if mDist < minDist
                minDist = mDist
                minPos = ps
        minPos ? last pl

    # 00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  0000  000  000        000     
    # 0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000  0000  000   000  000     
    # 000   000  000   000  000   000   0000000   00000000

    rangeEndPos:   (r)   -> [r[1][1], r[0]]
    rangeStartPos: (r)   -> [r[1][0], r[0]]
    rangeIndexPos: (r,i) -> [r[1][i], r[0]]
    rangeForPos: (p) -> [p[1], [p[0], p[0]]]
    rangeForLineAtIndex: (i) -> 
        throw new Error() if i >= @lines.length
        [i, [0, @lines[i].length]] 

    isSameRange: (a,b) -> a[0]==b[0] and a[1][0]==b[1][0] and a[1][1]==b[1][1]
    isRangeInString: (r) -> @rangeOfStringSurroundingRange(r)?
   
    rangeOfInnerStringSurroundingRange: (r) ->
        rgs = @rangesOfStringsInLineAtIndex r[0]
        rgs = @rangesShrunkenBy rgs, 1
        @rangeContainingRangeInRanges r, rgs
        
    rangeOfStringSurroundingRange: (r) ->
        if ir = @rangeOfInnerStringSurroundingRange r
            @rangeGrownBy ir, 1
            
    rangeGrownBy: (r,delta) -> [r[0], [r[1][0]-delta, r[1][1]+delta]]

    # 00000000    0000000   000   000   0000000   00000000   0000000
    # 000   000  000   000  0000  000  000        000       000     
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000   000  000   000  000  0000  000   000  000            000
    # 000   000  000   000  000   000   0000000   00000000  0000000 
    
    rangesBetweenPositions: (a, b, extend=false) ->
        r = []
        [a,b] = @sortPositions [a,b]
        if a[1] == b[1]
            r.push [a[1], [a[0], b[0]]]
        else
            r.push [a[1], [a[0], @lines[a[1]].length]]
            if b[1] - a[1] > 1
                for i in [a[1]+1...b[1]]
                    r.push [i, [0,@lines[i].length]]
            r.push [b[1], [0, extend and b[0] == 0 and @lines[b[1]].length or b[0]]]
        r
    
    rangesForCursors: (cs=@cursors) -> ([c[1], [c[0], c[0]]] for c in cs)
    rangesForCursorLines: (cs=@cursors) -> (@rangeForLineAtIndex c[1] for c in cs)  
    rangesForAllLines: -> @rangesForLinesFromTopToBot 0, @lines.length
    
    rangesForLinesFromTopToBot: (top,bot) -> 
        r = []
        ir = [top,bot]
        for li in [startOf(ir)...endOf(ir)]
            r.push @rangeForLineAtIndex li
        r
    
    rangesForText: (t, opt) ->
        t = t.split('\n')[0]
        r = []
        for li in [0...@lines.length]
            r = r.concat @rangesForTextInLineAtIndex t, li, opt
            break if r.length >= (opt?.max ? 999)
        r        
      
    rangesForTextInLineAtIndex: (t, i, opt) ->
        r = []
        type = opt?.type ? 'str'
        switch type
            when 'fuzzy'
                re = new RegExp "\\w+", 'g'            
                while (mtch = re.exec(@lines[i])) != null
                    r.push [i, [mtch.index, re.lastIndex]] if fuzzy.test t, @lines[i].slice mtch.index, re.lastIndex
            else
                t = _.escapeRegExp t if type in ['str', 'Str', 'glob']
                switch type
                    when 'str', 'reg' then s = 'gi'
                    when 'Str', 'Reg' then s = 'g'
                if type is 'glob'
                    t = t.replace new RegExp("\\\*", 'g'), "\w*"
                    log "glob regexp #{t}"
                re = new RegExp t, s            
                while (mtch = re.exec(@lines[i])) != null
                    r.push [i, [mtch.index, re.lastIndex]]
        r
                    
    rangesOfStringsInLineAtIndex: (li) -> # todo: handle #{}
        t = @lines[li]
        r = []
        ss = -1
        cc = null
        for i in [0...t.length]
            c = t[i]
            if not cc and c in "'\""
                cc = c
                ss = i
            else if c == cc
                if (t[i-1] != '\\') or (i>2 and t[i-2] == '\\')
                    r.push [li, [ss, i+1]]
                    cc = null
                    ss = -1
        r
      
    # 000  000   000        00000000    0000000   000   000   0000000   00000000   0000000
    # 000  0000  000        000   000  000   000  0000  000  000        000       000     
    # 000  000 0 000        0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000  000  0000        000   000  000   000  000  0000  000   000  000            000
    # 000  000   000        000   000  000   000  000   000   0000000   00000000  0000000 
      
    rangesForLineIndexInRanges: (li, ranges) -> (r for r in ranges when r[0]==li)
    
    rangeAtPosInRanges: (pos, ranges) ->
        return if ranges.length == 0
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if (r[0] == pos[1]) and (r[1][0] <= pos[0] <= r[1][1])
                return r

    rangesBeforePosInRanges: (pos, ranges) ->
        return [] if ranges.length == 0
        rs = []
        for r in ranges
            if (r[0] > pos[1]) or ((r[0] == pos[1]) and (r[1][0] > pos[0]))
                return rs 
            rs.push r
        rs

    rangesAfterPosInRanges: (pos, ranges) ->
        return [] if ranges.length == 0
        rs = []
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if (r[0] < pos[1]) or ((r[0] == pos[1]) and (r[1][1] < pos[0]))
                return rs 
            rs.unshift r
        rs
        
    rangesSplitAtPosInRanges: (pos, ranges) ->
        return [[],null,[]] if ranges.length == 0
        [bef,at,aft] = [[],null,[]]
        for ri in [0...ranges.length]
            r = ranges[ri]
            if (r[0] == pos[1]) and (r[1][0] <= pos[0] <= r[1][1])
                at = r
                aft = ranges.slice ri+1
                break
            bef.push r
        [bef,at,aft]
            
    rangeBeforePosInRanges: (pos, ranges) ->
        return if ranges.length == 0
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if (r[0] < pos[1]) or ((r[0] == pos[1]) and (r[1][1] < pos[0]))
                return r 
    
    rangeAfterPosInRanges: (pos, ranges) ->
        for r in ranges
            if (r[0] > pos[1]) or ((r[0] == pos[1]) and (r[1][0] > pos[0]))
                return r
    
    rangeStartingOrEndingAtPosInRanges: (p, ranges) ->
        return if ranges.length == 0
        for ri in [ranges.length-1..0]
            r = ranges[ri]
            if r[0] == p[1]
                if r[1][0] == p[0] or r[1][1] == p[0]
                    return r
    
    rangesFromTopToBotInRanges: (top, bot, ranges) ->
        (r for r in ranges when top <= r[0] <= bot)
        
    rangeContainingRangeInRanges: (r, ranges) ->
        if cr = @rangeAtPosInRanges @rangeStartPos(r), ranges
            return cr if cr[1][1] >= r[1][1]
        
    sortedLineIndicesInRanges: (ranges) -> _.uniq(s[0] for s in ranges).sort (a,b)->(a-b)
    
    rangesShrunkenBy: (ranges, delta) ->
        ([r[0], [r[1][0]+delta, r[1][1]-delta]] for r in ranges when (r[1][1]-r[1][0])>=2*delta)
                             
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
           
              
    cleanCursors: (cs=@cursors) ->
        @clampPositions cs
        @sortPositions cs
        if cs.length > 1
            for ci in [cs.length-1..1]
                c = cs[ci]
                p = cs[ci-1]
                if c[1] == p[1] and c[0] == p[0]
                    @mainCursor = p if @mainCursor == c
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

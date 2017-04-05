# 00000000    0000000   000   000   0000000   00000000   0000000
# 000   000  000   000  0000  000  000        000       000     
# 0000000    000000000  000 0 000  000  0000  0000000   0000000 
# 000   000  000   000  000  0000  000   000  000            000
# 000   000  000   000  000   000   0000000   00000000  0000000 

_ = require 'lodash'

module.exports = class Ranges

    cursorDelta: (c, dx, dy=0) ->
        c[0] += dx
        c[1] += dy
        
    cursorSet: (c, x, y) ->    
        [x,y] = x if not y? and x.length >=2
        c[0] = x
        c[1] = y

    indentationInLine: (l) ->
        s = 0
        if l? and l.length > 0
            l = l.trimRight()
            s += 1 while l[s] == ' '
        s
    
    rangeForPos:   (p)   -> [p[1], [p[0], p[0]]]
    rangeBetween: (a,b) -> 
        if @isPos(a) and @isPos(b) 
            [Math.min(a[1], b[1]), [Math.min(a[0], b[0]), Math.max(a[0], b[0])]]
        else if @isRange(a) and @isRange(b)
            r = [a,b]
            @sortRanges r
            @rangeBetween @rangeEndPos(r[0]), @rangeStartPos(r[1])
            
    isPos:         (p)       -> p?.length == 2 and _.isNumber(p[0]) and _.isNumber(p[1])
    isRange:       (r)       -> r?.length >= 2 and _.isNumber(r[0]) and r[1]?.length >= 2 and _.isNumber(r[1][0]) and _.isNumber(r[1][1])
    isSameRange:   (a,b)     -> a[0]==b[0] and a[1][0]==b[1][0] and a[1][1]==b[1][1]
    isSamePos:     (a,b)     -> a[1]==b[1] and a[0]==b[0]
    isPosInRange:  (p, r)    -> (p[1] == r[0]) and (r[1][0] <= p[0] <= r[1][1])
    isPosInRanges: (p, rgs)  -> @rangeAtPosInRanges(p, rgs)?
    isPosInPositions: (p,ps) -> @posInPositions(p,ps)?

    rangeEndPos:   (r)       -> [r[1][1], r[0]]
    rangeStartPos: (r)       -> [r[1][0], r[0]]
    lengthOfRange: (r)       -> r[1][1] - r[1][0]
    rangeIndexPos: (r,i)     -> [r[1][i], r[0]]
    rangeGrownBy:  (r,d)     -> [r[0], [r[1][0]-d, r[1][1]+d]]

    # 00000000    0000000    0000000  000  000000000  000   0000000   000   000   0000000  
    # 000   000  000   000  000       000     000     000  000   000  0000  000  000       
    # 00000000   000   000  0000000   000     000     000  000   000  000 0 000  0000000   
    # 000        000   000       000  000     000     000  000   000  000  0000       000  
    # 000         0000000   0000000   000     000     000   0000000   000   000  0000000   

    positionsFromPosInPositions: (p, pl) -> (r for r in pl when ((r[1] > p[1]) or ((r[1] == p[1]) and (r[0] >= p[0]))))
    positionsForLineIndexInPositions: (li,pl) -> (p for p in pl when p[1] == li)
    positionsBelowLineIndexInPositions: (li,pl) -> (p for p in pl when p[1] > li)
    positionsAfterLineColInPositions: (li,col,pl) -> (p for p in pl when p[1] == li and p[0]>=col)
    positionsNotInRanges: (pss, rgs) -> _.filter pss, (p) => not @isPosInRanges p, rgs
    positionsBetweenPosAndPosInPositions: (p1,p2,pl) -> 
        [a,b] = @sortPositions [p1, p2]
        (r for r in pl when ( (r[1] > a[1] or (r[1] == a[1]) and (r[0] >= a[0])) and (r[1] < b[1] or (r[1] == b[1]) and (r[0] <= b[0])))) 
            
    manhattanDistance: (a,b) -> Math.abs(a[1]-b[1])+Math.abs(a[0]-b[0])
        
    posInPositions: (p,pl) ->
        for c in pl
            return c if @isSamePos p, c

    posClosestToPosInPositions: (p,pl) -> 
        minDist = 999999        
        for ps in pl
            mDist = @manhattanDistance ps, p
            if mDist < minDist
                minDist = mDist
                minPos = ps
        minPos ? last pl
    
    # 00000000    0000000   000   000   0000000   00000000   0000000  
    # 000   000  000   000  0000  000  000        000       000       
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000   
    # 000   000  000   000  000  0000  000   000  000            000  
    # 000   000  000   000  000   000   0000000   00000000  0000000   
    
    rangesFromPositions: (pl) -> ([p[1], [p[0], p[0]]] for p in pl)  
    rangesForLineIndexInRanges: (li, ranges) -> (r for r in ranges when r[0]==li)
    rangesAfterLineColInRanges: (li,col,ranges) -> (r for r in ranges when r[0]==li and r[1][0] >= col)
    
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
        
    rangesShrunkenBy: (ranges, delta) ->
        ([r[0], [r[1][0]+delta, r[1][1]-delta]] for r in ranges when (r[1][1]-r[1][0])>=2*delta)
            
    rangesNotEmptyInRanges: (ranges) -> _.filter ranges, (r) -> r[1][1]-r[1][0]

    areSameRanges: (ra, rb) -> 
        if ra.length == rb.length
            for i in [0...ra.length]
                return false if not @isSameRange ra[i], rb[i]
            return true
        false

    #  0000000  000      00000000   0000000   000   000  
    # 000       000      000       000   000  0000  000  
    # 000       000      0000000   000000000  000 0 000  
    # 000       000      000       000   000  000  0000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    cleanRanges: (ranges) ->
        @sortRanges ranges 
        if ranges.length > 1
            for ri in [ranges.length-1...0]
                r = ranges[ri]
                p = ranges[ri-1]
                if r[0] == p[0] # on same line
                    if r[1][0] <= p[1][1] # starts before previous ends
                        p[1][1] = Math.max p[1][1], r[1][1] 
                        ranges.splice ri, 1
        ranges
    
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
    
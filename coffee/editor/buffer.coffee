# 0000000    000   000  00000000  00000000  00000000  00000000 
# 000   000  000   000  000       000       000       000   000
# 0000000    000   000  000000    000000    0000000   0000000  
# 000   000  000   000  000       000       000       000   000
# 0000000     0000000   000       000       00000000  000   000
{
clamp,
first,
last,
log
}       = require "kxk"
ranges  = require '../tools/ranges'
fuzzy   = require 'fuzzy'
event   = require 'events'
{multi} = require 'heterarchy'
_       = require 'lodash'

startOf = (r) -> r[0]
endOf   = (r) -> r[0] + Math.max 1, r[1]-r[0]

class Buffer extends multi event, ranges
    
    constructor: () -> 
        @wordRegExp = new RegExp "(\\s+|\\w+|[^\\s])", 'g'
        @lines      = []
        @selections = []
        @highlights = []
        @mainCursor = [0,-1]
        @cursors    = [@mainCursor]

    setLines: (@lines) ->
        @mainCursor = [0,@lines.length-1]
        @cursors    = [@mainCursor]
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
    
    isCursorVirtual:       (c=@mainCursor) -> @lines.length and c[1] < @lines.length and c[0] > @lines[c[1]].length
    isCursorAtEndOfLine:   (c=@mainCursor) -> @lines.length and c[1] < @lines.length and c[0] >= @lines[c[1]].length
    isCursorAtStartOfLine: (c=@mainCursor) -> c[0] == 0
    isCursorInIndent:      (c=@mainCursor) -> @lines.length and @lines[c[1]].slice(0, c[0]).trim().length == 0
    isCursorInLastLine:    (c=@mainCursor) -> c[1] == @lines.length-1
    isCursorInFirstLine:   (c=@mainCursor) -> c[1] == 0
    isCursorInRange:     (r,c=@mainCursor) -> @isPosInRange c, r

    # 000   000   0000000   00000000   0000000  
    # 000 0 000  000   000  000   000  000   000
    # 000000000  000   000  0000000    000   000
    # 000   000  000   000  000   000  000   000
    # 00     00   0000000   000   000  0000000  

    wordAtCursor: (c=@mainCursor, opt) -> @textInRange @rangeForWordAtPos c, opt
    wordsAtCursors: (cs=@cursors, opt) -> (@textInRange @rangeForWordAtPos(c, opt) for c in cs)

    selectionTextOrWordAtCursor: () ->
        if @selections.length == 1 
            @textInRange @selections[0]
        else
            @wordAtCursor()
    
    rangeForWordAtPos: (pos, opt) ->
        p = @clampPos pos
        wr = @wordRangesInLineAtIndex p[1], opt
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
        
    wordRangesInLineAtIndex: (li, opt={regExp:@wordRegExp}) ->
        opt.regExp = new RegExp "(\\s+|[\\w#{opt.include}]+|[^\\s])", 'g' if opt?.include?.length
        r = []
        while (mtch = opt.regExp.exec(@lines[li])) != null
            r.push [li, [mtch.index, opt.regExp.lastIndex]]
        r.length and r or [[li, [0,0]]]

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
    
    continuousSelectionAtPos: (p) -> # used by deleteSelection to calculate cursor positions
        r = @rangeAtPosInRanges p, @selections
        if r
            sp = @rangeStartPos r
            while (sp[0] == 0) and (sp[1] > 0)
                plr = @rangeForLineAtIndex sp[1]-1
                sil = @selectionsInLineAtIndex sp[1]-1
                if sil.length == 1 and @isSameRange sil[0], plr
                    sp = @rangeStartPos plr
                else if sil.length and last(sil)[1][1] == plr[1][1]
                    sp = @rangeStartPos last sil
                else
                    break
            ep = @rangeEndPos r
            while (ep[0] == @lines[ep[1]].length) and (ep[1] < @lines.length-1)
                nlr = @rangeForLineAtIndex ep[1]+1
                sil = @selectionsInLineAtIndex ep[1]+1
                if sil.length == 1 and @isSameRange sil[0], nlr
                    ep = @rangeEndPos nlr
                else if sil.length and first(sil)[1][0] == 0
                    ep = @rangeEndPos first sil
                else
                    break                    
            [sp, ep]
        
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
            ([s[0]-relIndex, [s[1][0], s[1][1]], s[2]] for s in hl)
    
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
        return s if li >= @lines.length
        l = @lines[li].trimRight()
        while l[s] == ' '
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
        return [0,-1] if not @lines.length
        if not @mainCursor?
            alert 'no main cursor!'
            throw new Error
        else 
            @clampPos @mainCursor 
        
    clampPos: (p) ->        
        if not p? or not p[0]? or not p[1]?
            alert "clampPos :: broken pos? #{p}"
            throw new Error
            return
        if not @lines.length
            return [0,-1]
        l = clamp 0, @lines.length-1,  p[1]
        c = clamp 0, @lines[l].length, p[0]
        [ c, l ]
        
    wordStartPosAfterPos: (p=@cursorPos()) ->
        return p if p[0] < @lines[p[1]].length and @lines[p[1]][p[0]] != ' '
        while p[0] < @lines[p[1]].length-1
            return [p[0]+1, p[1]] if @lines[p[1]][p[0]+1] != ' '
            p[0] += 1
        if p[1] < @lines.length-1
            @wordStartPosAfterPos [0, p[1]+1]
        else
            null
          
    # 00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  0000  000  000        000     
    # 0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000  0000  000   000  000     
    # 000   000  000   000  000   000   0000000   00000000

    rangeForLineAtIndex: (i) -> 
        throw new Error() if i >= @lines.length
        [i, [0, @lines[i].length]] 
        
    isRangeInString: (r) -> @rangeOfStringSurroundingRange(r)?
   
    rangeOfInnerStringSurroundingRange: (r) ->
        rgs = @rangesOfStringsInLineAtIndex r[0]
        rgs = @rangesShrunkenBy rgs, 1
        @rangeContainingRangeInRanges r, rgs
        
    rangeOfStringSurroundingRange: (r) ->
        if ir = @rangeOfInnerStringSurroundingRange r
            @rangeGrownBy ir, 1
            
    # 00000000    0000000   000   000   0000000   00000000   0000000
    # 000   000  000   000  0000  000  000        000       000     
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000   000  000   000  000  0000  000   000  000            000
    # 000   000  000   000  000   000   0000000   00000000  0000000 
        
    rangesForCursors: (cs=@cursors) -> ([c[1], [c[0], c[0]]] for c in cs)
    rangesForCursorLines: (cs=@cursors) -> (@rangeForLineAtIndex c[1] for c in cs)  
    rangesForAllLines: -> @rangesForLinesFromTopToBot 0, @lines.length

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
                    when 'str', 'reg', 'glob' then s = 'gi'
                    when 'Str', 'Reg'         then s = 'g'
                if type is 'glob'
                    t = t.replace new RegExp("\\*", 'g'), "\w*"
                    return r if not t.length
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
                        
module.exports = Buffer

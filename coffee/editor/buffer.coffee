# 0000000    000   000  00000000  00000000  00000000  00000000 
# 000   000  000   000  000       000       000       000   000
# 0000000    000   000  000000    000000    0000000   0000000  
# 000   000  000   000  000       000       000       000   000
# 0000000     0000000   000       000       00000000  000   000
{
clamp,
error,
log,
str
}       = require "kxk"
State   = require './state' 
ranges  = require '../tools/ranges'
fuzzy   = require 'fuzzy'
event   = require 'events'
{multi} = require 'heterarchy'
_       = require 'lodash'

startOf = (r) -> r[0]
endOf   = (r) -> r[0] + Math.max 1, r[1]-r[0]

# class Buffer extends multi event, ranges
class Buffer extends event
    
    constructor: () -> 
        @wordRegExp = new RegExp "(\\s+|\\w+|[^\\s])", 'g'
        @setState     new State()

    setLines: (lines) ->
        @setState new State lines:lines
        @emit 'numLines', @numLines()

    setState: (state) -> @state = state
    
    mainCursor:    -> @state.mainCursor()
    line:      (i) -> @state.line i
    cursor:    (i) -> @state.cursor i
    highlight: (i) -> @state.highlight i
    selection: (i) -> @state.selection i
    
    lines:         -> @state.lines()
    cursors:       -> @state.cursors()
    highlights:    -> @state.highlights()
    selections:    -> @state.selections()
    
    numLines:      -> @state.numLines()
    numCursors:    -> @state.numCursors()
    numSelections: -> @state.numSelections()
    numHighlights: -> @state.numHighlights()

    # these are used from tests and restore
    setCursors:    (c) -> @state = @state.setCursors(c); @startSelectionCursors = null
    setSelections: (s) -> @state = @state.setSelections(s); @startSelectionCursors = null  
    setHighlights: (h) -> @state = @state.setHighlights h  
    setMain:       (m) -> @state = @state.setMain m     
    addHighlight:  (h) -> @state = @state.addHighlight h
    
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
            
    isCursorVirtual:       (c=@mainCursor()) -> @numLines() and c[1] < @numLines() and c[0] > @line(c[1]).length
    isCursorAtEndOfLine:   (c=@mainCursor()) -> @numLines() and c[1] < @numLines() and c[0] >= @line(c[1]).length
    isCursorAtStartOfLine: (c=@mainCursor()) -> c[0] == 0
    isCursorInIndent:      (c=@mainCursor()) -> @numLines() and @line(c[1]).slice(0, c[0]).trim().length == 0
    isCursorInLastLine:    (c=@mainCursor()) -> c[1] == @numLines()-1
    isCursorInFirstLine:   (c=@mainCursor()) -> c[1] == 0
    isCursorInRange:       (r,c=@mainCursor()) -> @isPosInRange c, r

    # 000   000   0000000   00000000   0000000  
    # 000 0 000  000   000  000   000  000   000
    # 000000000  000   000  0000000    000   000
    # 000   000  000   000  000   000  000   000
    # 00     00   0000000   000   000  0000000  

    wordAtCursor: (c=@mainCursor(), opt) -> @textInRange @rangeForWordAtPos c, opt
    wordsAtCursors: (cs=@cursors(), opt) -> (@textInRange @rangeForWordAtPos(c, opt) for c in cs)

    selectionTextOrWordAtCursor: () ->
        if @numSelections() == 1 
            @textInRange @selection 0
        else
            @wordAtCursor()
    
    rangeForWordAtPos: (pos, opt) ->
        p = @clampPos pos
        wr = @wordRangesInLineAtIndex p[1], opt
        r = @rangeAtPosInRanges p, wr
        r

    endOfWordAtCursor: (c=@mainCursor()) =>
        r = @rangeForWordAtPos c
        if @isCursorAtEndOfLine c
            return c if @isCursorInLastLine c
            r = @rangeForWordAtPos [0, c[1]+1]
        [r[1][1], r[0]]

    startOfWordAtCursor: (c=@mainCursor()) =>
        if @isCursorAtStartOfLine c
            return c if @isCursorInFirstLine c
            r = @rangeForWordAtPos [@line(c[1]-1).length, c[1]-1]
        else 
            r = @rangeForWordAtPos c
            if r[1][0] == c[0]
                r = @rangeForWordAtPos [c[0]-1, c[1]]
        [r[1][0], r[0]]
        
    wordRangesInLineAtIndex: (li, opt={regExp:@wordRegExp}) ->
        opt.regExp = new RegExp "(\\s+|[\\w#{opt.include}]+|[^\\s])", 'g' if opt?.include?.length
        r = []
        while (mtch = opt.regExp.exec(@line(li))) != null
            r.push [li, [mtch.index, opt.regExp.lastIndex]]
        r.length and r or [[li, [0,0]]]

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
        @highlights().filter (s) -> s[0] >= lineIndexRange[0] and s[0] <= lineIndexRange[1]

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
        @selections().filter (s) -> s[0] >= lineIndexRange[0] and s[0] <= lineIndexRange[1]
        
    selectedLineIndices: -> _.uniq (s[0] for s in @selections())
    cursorLineIndices:   -> _.uniq (c[1] for c in @cursors())

    selectedAndCursorLineIndices: ->
        _.uniq @selectedLineIndices().concat @cursorLineIndices()
                
    continuousCursorAndSelectedLineIndexRanges: ->
        il = @selectedAndCursorLineIndices()
        csr = []
        if il.length
            for li in il
                if csr.length and _.last(csr)[1] == li-1
                    _.last(csr)[1] = li
                else
                    csr.push [li,li]
        csr
                        
    isSelectedLineAtIndex: (li) ->
        il = @selectedLineIndices()
        if li in il
            s = @selection(il.indexOf li)
            if s[1][0] == 0 and s[1][1] == @line(li).length
                return true
        false
                
    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    text:            -> @state.text()
    textInRange: (r) -> @line(r[0]).slice? r[1][0], r[1][1]
    textsInRanges: (rgs) -> (@textInRange(r) for r in rgs)
    textInRanges:  (rgs) -> @textsInRanges(rgs).join '\n'
    textOfSelection:     -> @textInRanges @selections()
            
    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   
        
    indentationAtLineIndex: (li) ->
        s = 0
        return s if li >= @numLines()
        l = @line(li).trimRight()
        while l[s] == ' '
            s += 1
        s
            
    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    lastPos: () -> 
        lli = @numLines()-1
        [@line(lli).length, lli]

    cursorPos: -> @clampPos @mainCursor()
        
    clampPos: (p) ->        
        if not @numLines() then return [0,-1]
        l = clamp 0, @numLines()-1,  p[1]
        c = clamp 0, @line(l).length, p[0]
        [ c, l ]
        
    wordStartPosAfterPos: (p=@cursorPos()) ->
        return p if p[0] < @line(p[1]).length and @line(p[1])[p[0]] != ' '
        while p[0] < @line(p[1]).length-1
            return [p[0]+1, p[1]] if @line(p[1])[p[0]+1] != ' '
            p[0] += 1
        if p[1] < @numLines()-1
            @wordStartPosAfterPos [0, p[1]+1]
        else
            null
          
    # 00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  0000  000  000        000     
    # 0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000  0000  000   000  000     
    # 000   000  000   000  000   000   0000000   00000000

    rangeForLineAtIndex: (i) -> 
        return error "Buffer.rangeForLineAtIndex -- index #{i} >= #{@numLines()}" if i >= @numLines()
        [i, [0, @line(i).length]] 
        
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
        
    rangesForCursorLines: (cs=@cursors()) -> (@rangeForLineAtIndex c[1] for c in cs)  
    rangesForAllLines: -> @rangesForLinesFromTopToBot 0, @numLines()

    rangesBetweenPositions: (a, b, extend=false) ->
        r = []
        [a,b] = sortPositions [a,b]
        if a[1] == b[1]
            r.push [a[1], [a[0], b[0]]]
        else
            r.push [a[1], [a[0], @line(a[1]).length]]
            if b[1] - a[1] > 1
                for i in [a[1]+1...b[1]]
                    r.push [i, [0,@line(i).length]]
            r.push [b[1], [0, extend and b[0] == 0 and @line(b[1]).length or b[0]]]
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
        for li in [0...@numLines()]
            r = r.concat @rangesForTextInLineAtIndex t, li, opt
            break if r.length >= (opt?.max ? 999)
        r        
      
    rangesForTextInLineAtIndex: (t, i, opt) ->
        r = []
        type = opt?.type ? 'str'
        switch type
            when 'fuzzy'
                re = new RegExp "\\w+", 'g'            
                while (mtch = re.exec(@line(i))) != null
                    r.push [i, [mtch.index, re.lastIndex]] if fuzzy.test t, @line(i).slice mtch.index, re.lastIndex
            else
                t = _.escapeRegExp t if type in ['str', 'Str', 'glob']
                switch type
                    when 'str', 'reg', 'glob' then s = 'gi'
                    when 'Str', 'Reg'         then s = 'g'
                if type is 'glob'
                    t = t.replace new RegExp("\\*", 'g'), "\w*"
                    return r if not t.length
                re = new RegExp t, s            
                while (mtch = re.exec(@line(i))) != null
                    r.push [i, [mtch.index, re.lastIndex]]
        r
                    
    rangesOfStringsInLineAtIndex: (li) -> # todo: handle #{}
        t = @line(li)
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
                                                                           
module.exports = Buffer

# 0000000    000   000  00000000  00000000  00000000  00000000 
# 000   000  000   000  000       000       000       000   000
# 0000000    000   000  000000    000000    0000000   0000000  
# 000   000  000   000  000       000       000       000   000
# 0000000     0000000   000       000       00000000  000   000

log       = require './tools/log'
tools     = require './tools/tools'
clamp     = tools.clamp

class Buffer
    
    constructor: () ->

        @cursor    = [0,0]
        @selection = null
        @lines     = [""]

    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
            
    selectionRanges: ->
        if @selection
            range = @selectedLineIndicesRange()
            rgs = ([i, @selectedCharacterRangeForLineAtIndex(i)] for i in [range[0]..range[1]])
        else
            []

    selectionStart: ->
        if @selection?  
            return [@selection[0], @selection[1]] if @selection[1] < @cursor[1]
            return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]] if @selection[1] > @cursor[1]
            return [Math.min(@selection[0], @cursor[0]), @cursor[1]]
        return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]]

    selectedLineIndices: ->
        range = @selectedLineIndicesRange()
        (i for i in [range[0]..range[1]])
                
    selectedLineIndicesRange: ->
        if @selection
            [Math.min(@cursor[1], @selection[1]), Math.max(@cursor[1], @selection[1])]

    selectedLines: ->
        s = []
        for i in @selectedLineIndices()
            s.push @selectedTextForLineAtIndex i
            i += 1
        s
    
    selectedTextForLineAtIndex: (i) ->
        r = @selectedCharacterRangeForLineAtIndex i
        if r?
            return @lines[i].substr r[0], r[1]-r[0]
        return ''
                
    selectedCharacterRangeForLineAtIndex: (i) ->
        return if not @selection
        lines = @selectedLineIndicesRange()
        return if i < lines[0] or i > lines[1]                      # outside selection
        return [0, @lines[i].length] if lines[0] < i < lines[1]     # inside selection
        curPos = @cursorPos()
        if lines[0] == lines[1]                                     # only one line in selection
            return [Math.min(curPos[0], @selection[0]), 
                    Math.max(curPos[0], @selection[0])]
        if i == @cursor[1]                                          # on cursor line
            if @selection[1] > i                                        # at start of selection
                return [curPos[0], @lines[i].length]
            else                                                        # at end of selection
                return [0, Math.min(@lines[i].length, curPos[0])]
        else                                                        # on selection line
            if curPos[1] > i                                            # at start of selection
                return [@selection[0], @lines[i].length]
            else                                                        # at end of selection
                return [0, Math.min(@lines[i].length, @selection[0])]

    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000

    cursorAtEndOfLine:   -> @cursor[0] == @lines[@cursor[1]].length
    cursorAtStartOfLine: -> @cursor[0] == 0
    cursorInLastLine:    -> @cursor[1] == @lines.length-1
    cursorInFirstLine:   -> @cursor[1] == 0

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    text:         -> @lines.join '\n'
    selectedText: -> @selectedLines().join '\n'
            
    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    lastPos: () -> 
        lli = @lines.length-1
        [@lines[lli].length, lli]
    
    cursorPos: ->
        l = clamp 0, @lines.length-1, @cursor[1]
        c = clamp 0, @lines[l].length, @cursor[0]
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
    
    rangeForLineAtIndex: (i) -> [0, @lines[i].length]
    rangesForCursorLine:     -> [[0, @cursor[1]], [@lines[@cursor[1]].length, @cursor[1]]]
    
    rangeForWordAtPos: (pos) ->
        p = @clampPos pos
        l = @lines[p[1]]
        r = [p[0], p[0]]
        c = l[r[0]]
        while r[0] > 0
            n = l[r[0]-1]
            if (c == ' ') and (n != ' ') or (c != ' ') and (n == ' ')
                break
            r[0] -= 1
        while r[1] < l.length-1
            n = l[r[1]+1]
            if (c == ' ') and (n != ' ') or (c != ' ') and (n == ' ')
                break
            r[1] += 1
        [[r[0], p[1]], [r[1]+1, p[1]]]

module.exports = Buffer
# 0000000    00000000  000             0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
# 000   000  000       000            000       000       000      000       000          000     000  000   000  0000  000
# 000   000  0000000   000            0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
# 000   000  000       000                 000  000       000      000       000          000     000  000   000  000  0000
# 0000000    00000000  0000000        0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

{ log, _
} = require 'kxk' 

module.exports =
    
    deleteSelectionOrCursorLines: ->
        @do.start()
        if not @do.numSelections()
            @selectMoreLines()
        @deleteSelection()
        @do.end()

    deleteSelection: (opt = deleteLines:true) ->
        @startSelectionCursors = null
        @do.start()
        
        if not @do.numSelections()
            return @do.end()
            
        newCursors = @do.cursors()
        oldSelections = @do.selections()
        joinLines = []
        
        for c in @do.cursors().reverse()
            if opt.deleteLines
                csel = @continuousSelectionAtPosInRanges c, oldSelections
            else
                rg = rangeAtPosInRanges c, oldSelections
                if rg?
                    csel = [rangeStartPos(rg), rangeEndPos(rg)]
                    # log 'csel', csel
            if csel?
                [sp, ep] = csel
                # log 'sp,ep', sp,ep, c
                for nc in positionsBetweenPosAndPosInPositions sp, ep, newCursors
                    cursorSet nc, sp
                if sp[1] < ep[1] and sp[0] > 0 and ep[0] < @do.line(ep[1]).length 
                    # selection spans multiple lines and first and last line are cut
                    joinLines.push sp[1]
                    for nc in positionsInLineAfterColInPositions ep[1], ep[0], newCursors
                        # set cursors after selection in last joined line
                        cursorSet nc, sp[0]+nc[0]-ep[0], sp[1]
                        
        for s in @do.selections().reverse()
            continue if s[0] >= @do.numLines()
            lineSelected = s[1][0] == 0 and s[1][1] == @do.line(s[0]).length
            if lineSelected and opt.deleteLines and @do.numLines() > 1
                @do.delete s[0]
                for nc in positionsBelowLineIndexInPositions s[0], newCursors
                    cursorDelta nc, 0, -1 # move cursors below deleted line up
            else
                continue if s[0] >= @do.numLines()
                @do.change s[0], @do.line(s[0]).splice s[1][0], s[1][1]-s[1][0]
                for nc in positionsInLineAfterColInPositions s[0], s[1][1], newCursors
                    cursorDelta nc, -(s[1][1]-s[1][0]) # move cursors after deletion in same line left

            if s[0] in joinLines
                @do.change s[0], @do.line(s[0]) + @do.line(s[0]+1)
                @do.delete s[0]+1
                for nc in positionsBelowLineIndexInPositions s[0], newCursors
                    cursorDelta nc, 0, -1 # move cursors below deleted line up
                _.pull joinLines, s[0]
        
        @do.select []
        @do.setCursors newCursors
        @checkSalterMode()
        @do.end()

    #  0000000   0000000   000   000  000000000  000  000   000  000   000   0000000   000   000   0000000  
    # 000       000   000  0000  000     000     000  0000  000  000   000  000   000  000   000  000       
    # 000       000   000  000 0 000     000     000  000 0 000  000   000  000   000  000   000  0000000   
    # 000       000   000  000  0000     000     000  000  0000  000   000  000   000  000   000       000  
    #  0000000   0000000   000   000     000     000  000   000   0000000    0000000    0000000   0000000   
    #
    # returns start and end positions of ranges that have either no characters or just a single newline between them

    continuousSelectionAtPosInRanges: (p, sel) -> 
        r = rangeAtPosInRanges p, sel
        if r and lengthOfRange r
            sp = rangeStartPos r
            while (sp[0] == 0) and (sp[1] > 0)
                plr = @rangeForLineAtIndex sp[1]-1
                sil = rangesForLineIndexInRanges sp[1]-1, sel
                if sil.length == 1 and isSameRange sil[0], plr
                    sp = rangeStartPos plr
                else if sil.length and _.last(sil)[1][1] == plr[1][1]
                    sp = rangeStartPos _.last sil
                else
                    break
            ep = rangeEndPos r
            while (ep[0] == @line(ep[1]).length) and (ep[1] < @numLines()-1)
                nlr = @rangeForLineAtIndex ep[1]+1
                sil = rangesForLineIndexInRanges ep[1]+1, sel
                if sil.length == 1 and isSameRange sil[0], nlr
                    ep = rangeEndPos nlr
                else if sil.length and _.first(sil)[1][0] == 0
                    ep = rangeEndPos _.first sil
                else
                    break                    
            [sp, ep]

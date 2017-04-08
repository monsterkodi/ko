# 0000000    00000000  000             0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
# 000   000  000       000            000       000       000      000       000          000     000  000   000  0000  000
# 000   000  0000000   000            0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
# 000   000  000       000                 000  000       000      000       000          000     000  000   000  000  0000
# 0000000    00000000  0000000        0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
{
log
} = require 'kxk' 
_ = require 'lodash'

module.exports =
    
    deleteSelectionOrCursorLines: ->
        @do.start()
        if not @do.numSelections()
            @selectMoreLines()
        @deleteSelection()
        @do.end()

    deleteSelection: (opt = deleteLines:true) ->
        return if not @numSelections()
        log 'deleteSelection selections:', @selections()
        @do.start()
        newCursors = @do.cursors()
        joinLines = []
        for c in @do.cursors().reversed()
            csel = @continuousSelectionAtPos c
            if csel?
                [sp, ep] = csel
                for nc in @positionsBetweenPosAndPosInPositions sp, ep, newCursors
                    @cursorSet nc, sp[0], sp[1]
                if sp[1] < ep[1] and sp[0] > 0 and ep[0] < @do.line(ep[1]).length 
                    # selection spans multiple lines and first and last line are cut
                    joinLines.push sp[1] 
                    for nc in @positionsAfterLineColInPositions ep[1], ep[0], newCursors
                        # set cursors after selection in last joined line
                        @cursorSet nc, sp[0]+nc[0]-ep[0], sp[1]
        log 'deleteSelection', joinLines.length, @do.selections()
        for s in @do.selections().reversed()
            continue if s[0] >= @do.numLines()
            lineSelected = s[1][0] == 0 and s[1][1] == @do.line(s[0]).length
            if lineSelected and opt.deleteLines and @do.numLines() > 1
                log 'deleteSelection del line', s[0], lineSelected, s[1][0], s[1][1]
                @do.delete s[0]
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    @cursorDelta nc, 0, -1 # move cursors below deleted line up
            else
                continue if s[0] >= @do.numLines()
                @do.change s[0], @do.line(s[0]).splice s[1][0], s[1][1]-s[1][0]
                for nc in @positionsAfterLineColInPositions s[0], s[1][1], newCursors
                    @cursorDelta nc, -(s[1][1]-s[1][0]) # move cursors after deletion in same line left

            if s[0] in joinLines
                @do.change s[0], @do.line(s[0]) + @do.line(s[0]+1)
                @do.delete s[0]+1
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    @cursorDelta nc, 0, -1 # move cursors below deleted line up
                _.pull joinLines, s[0]
        
        @do.select []
        @do.setCursors newCursors
        @checkSalterMode()
        @do.end()

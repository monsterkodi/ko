# 00000000    0000000    0000000  000000000  00000000
# 000   000  000   000  000          000     000     
# 00000000   000000000  0000000      000     0000000 
# 000        000   000       000     000     000     
# 000        000   000  0000000      000     00000000

_ = require 'lodash'
electron = require 'electron'
clipboard = electron.clipboard
        
module.exports = 

    actions:
        cut:
            name: 'cut'
            combo: 'command+x'
        copy:
            name: 'copy'
            combo: 'command+c'
        paste:
            name: 'paste'
            combo: 'command+v'
    
    cut: ->
        @do.start()
        @copy()
        @deleteSelectionOrCursorLines()
        @do.end()

    copy: -> clipboard?.writeText @textOfSelectionForClipboard()
        
    paste: -> @pasteText clipboard?.readText()
        
    pasteText: (text) ->
        
        @deleteSelection()
        @do.start()        
        @clampCursorOrFillVirtualSpaces()
        
        newCursors = @do.cursors()

        l = text.split '\n'
        if newCursors.length > 1 and l.length == 1
            l = (l[0] for c in newCursors)
                    
        if newCursors.length > 1 or l.length == 1 and (newCursors[0] > 0 or not text.endsWith '\n')
            for ci in [newCursors.length-1..0]
                c = newCursors[ci]
                insert = l[ci % l.length]
                @do.change c[1], @do.line(c[1]).splice c[0], 0, insert
                for c in positionsInLineAfterColInPositions c[1], c[0]-1, newCursors
                    cursorDelta c, insert.length # move cursors after insertion
        else
            cp = newCursors[0]
            li = cp[1]
            newSelections = []
            newCursors = null
            if cp[0] > 0
                [before, after] = @splitStateLineAtPos @do, cp
                after = after.trimLeft()
                
                indt   = _.padStart "", indentationInLine @do.line cp[1]
                if before.trim().length
                    @do.change li, before
                    li += 1
                    if (indt + after).trim().length
                        l.push indt + after
                        newCursors = [[0,li+l.length-1]]
                    else
                        newCursors = null
            else 
                newCursors = null
            for line in l
                @do.insert li, line
                newSelections.push [li, [0,line.length]]
                li += 1
            newCursors = [[0, li]] if not newCursors? or _.isEmpty newCursors
            @do.select newSelections if newSelections.length > 1
                
        @do.setCursors newCursors
        @do.end()

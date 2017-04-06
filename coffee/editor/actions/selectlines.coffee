
#  0000000  00000000  000      00000000   0000000  000000000        000      000  000   000  00000000   0000000  
# 000       000       000      000       000          000           000      000  0000  000  000       000       
# 0000000   0000000   000      0000000   000          000           000      000  000 0 000  0000000   0000000   
#      000  000       000      000       000          000           000      000  000  0000  000            000  
# 0000000   00000000  0000000  00000000   0000000     000           0000000  000  000   000  00000000  0000000   

module.exports =

    infos: 
        
        selectMoreLines:
            name:  'select more lines'
            combo: 'command+l'
            text:  'selects line at cursor or next line if cursor line is selected already'
            
        selectLessLines:
            name: 'select less lines'
            combo: 'command+shift+l'
            text:  'removes a line from each block of selected lines'

    selectMoreLines: ->
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        selectCursorLineAtIndex = (c,i) =>
            range = [i, [0, @do.line(i).length]] 
            newSelections.push range
            @cursorSet c, @rangeEndPos range
            
        start = false
        for c in newCursors
            if not @isSelectedLineAtIndex c[1]
                selectCursorLineAtIndex c, c[1]
                start = true
                
        if not start
            for c in newCursors
                selectCursorLineAtIndex c, c[1]+1 if c[1] < @numLines()-1
                
        @do.select newSelections
        @do.cursor newCursors
        @do.end()       

    selectLessLines: -> 
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        for c in newCursors.reversed()
            thisSel = @selectionsInLineAtIndex(c[1])
            if thisSel.length
                if @isSelectedLineAtIndex c[1]-1
                    s = @selectionsInLineAtIndex(c[1]-1)[0]
                    @cursorSet c, s[1][1], s[0]
                newSelections.splice @indexOfSelection(thisSel[0]), 1

        @do.select newSelections
        @do.cursor newCursors
        @do.end()  


# 000000000   0000000    0000000    0000000   000      00000000         00  00    00  00    00  00   
#    000     000   000  000        000        000      000             00000000  00000000  00000000  
#    000     000   000  000  0000  000  0000  000      0000000          00  00    00  00    00  00   
#    000     000   000  000   000  000   000  000      000             00000000  00000000  00000000  
#    000      0000000    0000000    0000000   0000000  00000000         00  00    00  00    00  00   

{ log, _ } = require 'kxk'

module.exports =
    
    actions:
        menu: 'Line'
        
        toggleComment:
            name:  'Toggle Comment'
            combo: 'CmdOrCtrl+/'
            
        toggleHeader:
            name:  'Toggle Header'
            combo: 'CmdOrCtrl+alt+/'

    # 000   000  00000000   0000000   0000000    00000000  00000000   
    # 000   000  000       000   000  000   000  000       000   000  
    # 000000000  0000000   000000000  000   000  0000000   0000000    
    # 000   000  000       000   000  000   000  000       000   000  
    # 000   000  00000000  000   000  0000000    00000000  000   000  
    
    toggleHeader: ->
        
        rgs = @salterRangesAtPos @cursorPos()
        return if not rgs
        il     = _.min (@indentationAtLineIndex r[0] for r in rgs)
        indent = _.padStart "", il
        @do.start()
        if not @do.line(rgs[0][0]).slice(il).startsWith @lineComment
            # convert to line comments
            for r in rgs
                @do.change r[0], @do.line(r[0]).splice il, 0, @lineComment + ' '
            @do.delete _.first(rgs)[0]-1
            @do.delete _.last(rgs)[0]
            @moveCursorsUp()
            @moveCursorsRight false, @lineComment.length+1            
        else if @multiComment
            # convert to multi comment
            for r in rgs
                @do.change r[0], @do.line(r[0]).splice il, @lineComment.length+1
            @do.insert _.last( rgs)[0]+1, indent + @multiComment.close
            @do.insert _.first(rgs)[0],   indent + @multiComment.open
            @moveCursorsDown()
            @moveCursorsLeft false, @lineComment.length+1
        @do.end()
            
    #  0000000   0000000   00     00  00     00  00000000  000   000  000000000  
    # 000       000   000  000   000  000   000  000       0000  000     000     
    # 000       000   000  000000000  000000000  0000000   000 0 000     000     
    # 000       000   000  000 0 000  000 0 000  000       000  0000     000     
    #  0000000   0000000   000   000  000   000  00000000  000   000     000     
    
    toggleComment: ->
        
        @do.start()
        newCursors    = @do.cursors()
        newSelections = @do.selections()
        
        moveInLine = (i, d) -> 
            for s in rangesAtLineIndexInRanges i, newSelections
                s[1][0] += d
                s[1][1] += d
            for c in positionsAtLineIndexInPositions i, newCursors
                cursorDelta c, d
                
        mainCursorLine = @do.line @mainCursor()[1]
        cs = mainCursorLine.indexOf @lineComment
        uncomment = cs >= 0 and mainCursorLine.substr(0,cs).trim().length == 0
        
        for i in @selectedAndCursorLineIndices()
            cs = @do.line(i).indexOf @lineComment
            if uncomment 
                if cs >= 0 and @do.line(i).substr(0,cs).trim().length == 0
                    # remove comment
                    @do.change i, @do.line(i).splice cs, @lineComment.length
                    moveInLine i, -@lineComment.length
                    si = indentationInLine @do.line(i)
                    if si % @indentString.length == 1 # remove space after indent
                        @do.change i, @do.line(i).splice si-1, 1
                        moveInLine i, -1
            else # insert comment
                si = indentationInLine @do.line(i)
                if @do.line(i).length > si
                    l = (@lineComment + " ").length
                    @do.change i, @do.line(i).splice si, 0, @lineComment + " "
                    moveInLine i, l
        @do.select newSelections
        @do.setCursors newCursors
        @do.end()

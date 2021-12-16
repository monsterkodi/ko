
# 000  000   000   0000000  00000000  00000000   000000000
# 000  0000  000  000       000       000   000     000   
# 000  000 0 000  0000000   0000000   0000000       000   
# 000  000  0000       000  000       000   000     000   
# 000  000   000  0000000   00000000  000   000     000   

{ _, clamp, reversed } = require 'kxk'

module.exports =
    
    insertCharacter: (ch) ->
        
        return @newline() if ch == '\n'
        return if @salterMode and @insertSalterCharacter ch
        
        @do.start()
        @clampCursorOrFillVirtualSpaces()
        
        if ch in @surroundCharacters
            if @insertSurroundCharacter ch
                @do.end()
                return
    
        @deleteSelection()

        newCursors = @do.cursors()
        
        for cc in newCursors
            cline = @do.line cc[1]
            sline = @twiggleSubstitute line:cline, cursor:cc, char:ch
            if sline
                @do.change cc[1], sline
            else
                @do.change cc[1], cline.splice cc[0], 0, ch
                for nc in positionsAtLineIndexInPositions cc[1], newCursors
                    if nc[0] >= cc[0]
                        nc[0] += 1
        
        @do.setCursors newCursors
        @do.end()
        @emitEdit 'insert'

    twiggleSubstitute: (line:,cursor:,char:) ->
        
        if cursor[0] and line[cursor[0]-1] == '~'
            substitute = switch char
                when '>' then '▸'
                when '<' then '◂'
                when '^' then '▴'
                when 'v' then '▾'
                when 'd' then '◆'
                when 'c' then '●'
                when 'o' then '○'
                when 's' then '▪'
                when 'S' then '■'
                when 't' then '➜'
            if substitute
                return line.splice cursor[0]-1, 1, substitute
    
    clampCursorOrFillVirtualSpaces: ->
        
        @do.start()
        if @do.numCursors() == 1
            cursor = @do.cursor 0
            y = clamp 0, @do.numLines()-1, cursor[1]
            lineLength = @do.numLines() and @do.line(cursor[1]).length or 0
            x = clamp 0, lineLength, cursor[0]
            @do.setCursors [[x,y]]
        else 
            @fillVirtualSpaces()
        @do.end()

    fillVirtualSpaces: -> # fill spaces between line ends and cursors
                
        @do.start() 
        for c in reversed @do.cursors()
            if c[0] > @do.line(c[1]).length
                @do.change c[1], @do.line(c[1]).splice c[0], 0, _.padStart '', c[0]-@do.line(c[1]).length
        @do.end()
        
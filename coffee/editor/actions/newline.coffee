# 000   000  00000000  000   000  000      000  000   000  00000000
# 0000  000  000       000 0 000  000      000  0000  000  000     
# 000 0 000  0000000   000000000  000      000  000 0 000  0000000 
# 000  0000  000       000   000  000      000  000  0000  000     
# 000   000  00000000  00     00  0000000  000  000   000  00000000
{
log} = require 'kxk'    
_    = require 'lodash'

module.exports = 
    
    actions:
        newline:
            name: 'insert newline'
            combo: 'enter'
            
        newlineAtEnd:
            name:  'insert newline at line end'
            combo: 'command+enter'

    newlineAtEnd: (key, info) ->
        @moveCursorsToLineBoundary 'right'  
        @newline indent: true

    newline: (key, info) ->

        if not info? and _.isObject key
            info = key

        if @salterMode 
            @endSalter()
            @singleCursorAtPos _.last @cursors()
            @newlineAtEnd()
            return
        
        doIndent = info?.indent ? not @isCursorInIndent()
                    
        @surroundStack = []
        @deleteSelection()
        @do.start()
        
        if @salterMode
            newCursors = [rangeEndPos @rangeForLineAtIndex @mainCursor()[1]]
            @setSalterMode false
        else
            newCursors = @do.cursors()
        
        for c in @do.cursors().reversed()
        
            after  = @do.line(c[1]).substr c[0]
            after  = after.trimLeft() if doIndent
            before = @do.line(c[1]).substr 0, c[0]
        
            if doIndent
                line = before.trimRight()
                il = 0
                thisIndent = indentationInLine @do.line(c[1])
                indentLength = @indentString.length
                
                if @indentNewLineMore?
                    if @indentNewLineMore.lineEndsWith?.length
                        for e in @indentNewLineMore.lineEndsWith
                            if line.endsWith e
                                il = thisIndent + indentLength
                                break
                    if il == 0
                        if @indentNewLineMore.beforeRegExp? and @indentNewLineMore.beforeRegExp.test before
                            il = thisIndent + indentLength
                        else if @indentNewLineMore.lineRegExp? and @indentNewLineMore.lineRegExp.test line
                            il = thisIndent + indentLength
                            
                if il == 0
                    il = thisIndent
                                
                if il >= indentLength and @indentNewLineLess?
                    if @indentNewLineLess.beforeRegExp? and @indentNewLineLess.beforeRegExp.test before
                        il = -indentLength
                    else if @indentNewLineLess.afterRegExp? and @indentNewLineLess.afterRegExp.test after
                        il = -indentLength
                                
                if @fileType == 'coffee' 
                    if /(when|if)/.test before 
                        if after.startsWith 'then '
                            after = after.slice(4).trimLeft() # remove then
                        else if before.trim().endsWith 'then'
                            before = before.trimRight()
                            before = before.slice 0, before.length-4 # remove then                            
                
                il = Math.max il, indentationInLine @do.line c[1]+1
                indent = _.padStart "", il
            # else if opt?.keepIndent
                # indent = _.padStart "", indentationInLine @do.line c[1] # keep indentation
            else
                if c[0] <= indentationInLine @do.line c[1]
                    indent = @do.line(c[1]).slice 0,c[0]
                else
                    indent = ''

            bl = c[0]
            
            if c[0] >= @do.line(c[1]).length # cursor at end of line
                @do.insert c[1]+1, indent
            else
                @do.insert c[1]+1, indent + after
                if @insertIndentedEmptyLineBetween? and
                    before.trimRight().endsWith @insertIndentedEmptyLineBetween[0] and
                        after.trimLeft().startsWith @insertIndentedEmptyLineBetween[1]
                            indent += @indentString
                            @do.insert c[1]+1, indent
                @do.change c[1], before

            # move cursors in and below inserted line down
            for nc in positionsFromPosInPositions c, newCursors
                cursorDelta nc, nc[1] == c[1] and indent.length - bl or 0, 1
        
        @do.setCursors newCursors
        @do.end()

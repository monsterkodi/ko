#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

tools  = require './tools/tools'
log    = require './tools/log'
encode = require('html-entities').XmlEntities.encode

class Editor
    @cursor = [0,0]
    @lines = [""]
    @cursorSpan = ""

    @cursorAtEndOfLine:   => @cursor[0] == @lines[@cursor[1]].length
    @cursorAtStartOfLine: => @cursor[0] == 0
    @cursorInLastLine:    => @cursor[1] == @lines.length-1
    @cursorInFirstLine:   => @cursor[1] == 0

    @moveCursorToEndOfLine: =>
        @cursor[0] = @lines[@cursor[1]].length
        
    @moveCursorToStartOfLine: =>
        @cursor[0] = 0

    @moveCursorUp: =>
        if @cursorInFirstLine()
            @moveCursorToStartOfLine()
        else
            @cursor[1] -= 1

    @moveCursorDown: =>
        if @cursorInLastLine()
            @moveCursorToEndOfLine()
        else
            @cursor[1] += 1

    @moveCursorRight: =>
        if @cursorAtEndOfLine() 
            if not @cursorInLastLine()
                @moveCursorDown()
                @moveCursorToStartOfLine()
        else
            @cursor[0] += 1
    
    @moveCursorLeft: =>
        @cursor[0] = Math.min @lines[@cursor[1]].length, @cursor[0]
        if @cursorAtStartOfLine()
            if not @cursorInFirstLine()
                @moveCursorUp()
                @moveCursorToEndOfLine()
        else
            @cursor[0] -= 1
    
    @moveCursor: (direction) =>
        switch direction
            when 'left'  then @moveCursorLeft()
            when 'right' then @moveCursorRight()
            when 'up'    then @moveCursorUp()
            when 'down'  then @moveCursorDown()
    
    @insertCharacter: (c) =>
        @lines[@cursor[1]] = @lines[@cursor[1]].splice @cursor[0], 0, c
        @cursor[0] += 1

    @joinLine: =>
        @lines[@cursor[1]] += @lines[@cursor[1]+1]
        @lines.splice @cursor[1]+1, 1

    @deleteForward: =>
        if @cursorAtEndOfLine()
            if not @cursorInLastLine()
                @joinLine()
        else
            @lines[@cursor[1]] = @lines[@cursor[1]].splice @cursor[0], 1
    
    @deleteBackward: =>
        return if @cursorInFirstLine() and @cursorAtStartOfLine()
        @moveCursorLeft()
        @deleteForward()
    
    @insertNewline: =>
        if @cursorAtEndOfLine()
            @lines.splice @cursor[1]+1, 0, ""
        else
            @lines.splice @cursor[1]+1, 0, @lines[@cursor[1]].substr @cursor[0]
            @lines[@cursor[1]] = @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight()
    
    @addLine: => @lines.push ""
        
    @encodeHtml: (l) =>
        r = encode l
        r = r.replace /\s/g, '&nbsp;'
        r
        
    @html: =>
        h = []
        for i in [0...@lines.length]
            l = @lines[i]
            if i == @cursor[1]
                left  = l.substr  0, @cursor[0]
                right = l.substr  @cursor[0]
                h.push @encodeHtml(left) + @cursorSpan + @encodeHtml(right)
            else
                h.push @encodeHtml(l)
        # log h
        h.join '<br>'

module.exports = Editor
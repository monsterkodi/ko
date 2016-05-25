#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

tools  = require './tools/tools'
log    = require './tools/log'
encode = require './tools/encode'
$ = (id) -> document.getElementById id

class Editor
    @charSize   = [0,0]
    @cursor     = [0,0]
    @selection  = null
    @lines      = [""]
    @cursorSpan = ""
    @id         = ""

    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    @selectionStart: =>
        if @selection? 
            return [@selection[0], @selection[1]] if @selection[1] < @cursor[1]
            return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]] if @selection[1] > @cursor[1]
            return [Math.min(@selection[0], @cursor[0]), @cursor[1]]
        return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]]

    @selectRange: (range) =>
        log 'range', range
        @selection = range[0]
        @cursor    = range[1]

    @selectAll: => @selectRange [[0,0], @lastPos()]

    @startSelection: (active) =>
        if active and not @selection?
            @selection = [Math.min(@cursor[0], @lines[@cursor[1]].length),@cursor[1]]
            # log "start", @selection

    @endSelection: (active) =>
        if @selection? and not active
            @selection = null
            # log "end"
            
    @selectedLineRange: =>
        if @selection
            [Math.min(@cursor[1], @selection[1]), Math.max(@cursor[1], @selection[1])]
            
    @selectedCharacterRangeForLineAtIndex: (i) =>
        return if not @selection
        lines = @selectedLineRange()
        return if i < lines[0] or i > lines[1]
        return [0, @lines[i].length] if lines[0] < i < lines[1]
        if lines[0] == lines[1]
            return [Math.min(@cursor[0], @selection[0]), Math.max(@cursor[0], @selection[0])]
        if i == @cursor[1]
            if @selection[1] > i
                return [@cursor[0], @lines[i].length]
            else
                return [0, Math.min(@lines[i].length, @cursor[0])]
        else
            if @cursor[1] > i
                return [@selection[0], @lines[i].length]
            else
                return [0, Math.min(@lines[i].length, @selection[0])]

    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000

    @cursorAtEndOfLine:   => @cursor[0] == @lines[@cursor[1]].length
    @cursorAtStartOfLine: => @cursor[0] == 0
    @cursorInLastLine:    => @cursor[1] == @lines.length-1
    @cursorInFirstLine:   => @cursor[1] == 0

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000
    
    @moveCursorToEndOfLine: =>
        @cursor[0] = @lines[@cursor[1]].length
        
    @moveCursorToStartOfLine: =>
        @cursor[0] = 0

    @moveCursorToLineChar: (l,c=0) =>
        @cursor[1] = Math.min l, @lines.length-1
        @cursor[0] = Math.min c, @lines[@cursor[1]].length
        
    @moveCursorToPos: (pos) =>
        @cursor[1] = Math.min pos[1], @lines.length-1
        @cursor[0] = Math.min pos[0], @lines[@cursor[1]].length        

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
            
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    @insertCharacter: (c) =>
        @deleteSelection() if @selection?
        @lines[@cursor[1]] = @lines[@cursor[1]].splice @cursor[0], 0, c
        @cursor[0] += 1

    @insertNewline: =>
        @deleteSelection() if @selection?
        if @cursorAtEndOfLine()
            @lines.splice @cursor[1]+1, 0, ""
        else
            @lines.splice @cursor[1]+1, 0, @lines[@cursor[1]].substr @cursor[0]
            @lines[@cursor[1]] = @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight()
        
    @insertText: (text) =>
        @deleteSelection() if @selection?
        for c in text
            if c == '\n'
                @insertNewline()
            else
                @insertCharacter c
    
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    @joinLine: =>
        if not @cursorInLastLine()
            @lines[@cursor[1]] += @lines[@cursor[1]+1]
            @lines.splice @cursor[1]+1, 1
            
    @deleteLineAtIndex: (i) =>
        @lines.splice i, 1
        
    @deleteCharacterRangeInLineAtIndex: (r, i) =>
        @lines[i] = @lines[i].splice r[0], r[1]-r[0]
            
    @deleteSelection: =>
        lineRange = @selectedLineRange()
        return if not lineRange?
        @deleteCharacterRangeInLineAtIndex @selectedCharacterRangeForLineAtIndex(lineRange[1]), lineRange[1]
        if lineRange[1] > lineRange[0]
            for i in [(lineRange[1]-1)...lineRange[0]]
                @deleteLineAtIndex i
            @deleteCharacterRangeInLineAtIndex @selectedCharacterRangeForLineAtIndex(lineRange[0]), lineRange[0]
        @cursor = @selectionStart()
        if lineRange[1] > lineRange[0]
            @joinLine()

    @deleteForward: =>
        if @selection?
            @deleteSelection()
            return
        if @cursorAtEndOfLine()
            @joinLine()
        else
            @lines[@cursor[1]] = @lines[@cursor[1]].splice @cursor[0], 1
    
    @deleteBackward: =>
        if @selection?
            @deleteSelection()
            return
        return if @cursorInFirstLine() and @cursorAtStartOfLine()
        @moveCursorLeft()
        @deleteForward()

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    @text: => return @lines.join '\n'
            
    # 000   000  000000000  00     00  000    
    # 000   000     000     000   000  000    
    # 000000000     000     000000000  000    
    # 000   000     000     000 0 000  000    
    # 000   000     000     000   000  0000000
                
    @html: =>
        h = []
        lineRange = @selectedLineRange()
        for i in [0...@lines.length]
            l = @lines[i]
            if lineRange and (lineRange[0] <= i <= lineRange[1])
                range = @selectedCharacterRangeForLineAtIndex i
            else
                range = null
            if range
                selEnd = "</span>"
                left  = l.substr  0, range[0]
                mid   = l.substr  range[0], range[1]-range[0] 
                right = l.substr  range[1]
                border = ""
                if i == lineRange[0]
                    border += " tl tr"
                else # if i > lineRange[0]
                    prevRange = @selectedCharacterRangeForLineAtIndex i-1
                    if range[1] > prevRange[1] or range[1] <= prevRange[0]
                        border += " tr"
                    if range[0] < prevRange[0] or range[0] >= prevRange[1]
                        border += " tl"
                    
                if i == lineRange[1]
                    border += " bl br"
                else # if i < lineRange[1]
                    nextRange = @selectedCharacterRangeForLineAtIndex i+1
                    if range[1] > nextRange[1]
                        border += " br"
                    if range[0] < nextRange[0] or range[0] >= nextRange[1]
                        border += " bl"
                selStart = "<span class=\"selection#{border}\">"
                if i == @cursor[1]
                    if @cursor[0] == range[0]
                        h.push encode(left) + @cursorSpan + selStart + encode(mid) + selEnd + encode(right)
                    else
                        h.push encode(left) + selStart + encode(mid) + selEnd + @cursorSpan + encode(right)
                else
                    h.push encode(left) + selStart + encode(mid) + selEnd + encode(right)
            else if i == @cursor[1]
                left  = l.substr  0, @cursor[0]
                right = l.substr  @cursor[0]
                h.push encode(left) + @cursorSpan + encode(right)
            else
                h.push encode(l)
        h.join '<br>'

    # 000  000   000  0000000    00000000  000   000
    # 000  0000  000  000   000  000        000 000 
    # 000  000 0 000  000   000  0000000     00000  
    # 000  000  0000  000   000  000        000 000 
    # 000  000   000  0000000    00000000  000   000
    
    @lastLineIndex: => @lines.length-1

    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    @lastPos: () => 
        lli = @lastLineIndex()
        [@lines[lli].length, lli]
    
    @posForEvent: (event) =>
        sl = $(@id).scrollLeft
        st = $(@id).scrollTop
        [parseInt(Math.floor((Math.max(0, sl + event.offsetX-10))/@charSize[0])),
         parseInt(Math.floor((Math.max(0, st + event.offsetY-10))/@charSize[1]))]

    # 00000000    0000000   000   000   0000000   00000000   0000000
    # 000   000  000   000  0000  000  000        000       000     
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000   000  000   000  000  0000  000   000  000            000
    # 000   000  000   000  000   000   0000000   00000000  0000000 
    
    @rangeForWordAtPos: (pos) =>
        l = @lines[pos[1]]
        r = [pos[0], pos[0]]
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
        [[r[0], pos[1]], [r[1]+1, pos[1]]]

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    @update: =>
        # log $(@id), @html(), @selection, @cursor
        $(@id).innerHTML = @html()

    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    @init: (className) =>
        @id = className
        o = document.createElement 'div'
        o.className = className
        o.innerHTML = 'XXXXXXXXXX'
        o.style = 
          float:      'left'
          visibility: 'hidden'
        document.body.appendChild o
        @charSize = [o.clientWidth/o.innerHTML.length, o.clientHeight]
        o.remove()
        @cursorSpan = "<span id=\"cursor\" style=\"height: #{@charSize[1]}px\"></span>"
        $(className).innerHTML = @cursorSpan

module.exports = Editor
#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

undo      = require './undo'
html      = require './html'
log       = require './tools/log'
tools     = require './tools/tools'
keyinfo   = require './tools/keyinfo'
clipboard = require('electron').clipboard
clamp     = tools.clamp
$         = tools.$

class Editor
    
    constructor: (elem, className) ->
        @do         = new undo @done
        @cursor     = [0,0]
        @selection  = null
        @lines      = [""]
        @elem       = elem
        @clss       = className
        @initCharSize()
        @elem.onkeydown = @onKeyDown
        @elem.innerHTML = html.cursorSpan @charSize

    done: () =>
        # log 'done'
        setTimeout @update, 0

    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    initCharSize: () =>
        o = document.createElement 'div'
        o.className = @clss
        o.innerHTML = 'XXXXXXXXXX'
        o.style = 
          float:      'left'
          visibility: 'hidden'
        document.body.appendChild o
        @charSize = [o.clientWidth/o.innerHTML.length, o.clientHeight]
        o.remove()

    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    selectNone:         => @selection = @do.selection @selection, null
    setSelection: (c,l) => @selection = @do.selection @selection, [c,l]

    selectRange: (range) =>
        # @do.start()
        @setSelection range[0][0], range[0][1]
        @setCursor    range[1][0], range[1][1]
        # @do.end()

    selectAll: => @selectRange [[0,0], @lastPos()]
    
    startSelection: (active) =>
        if active and not @selection?
            @selectRange [[Math.min(@cursor[0], @lines[@cursor[1]].length),@cursor[1]], @cursor]

    endSelection: (active) =>
        if @selection? and not active
            @selectNone()
        else
            @update()
        
    selectionRanges: () =>
        if @selection
            range = @selectedLineRange()
            ([i, @selectedCharacterRangeForLineAtIndex(i)] for i in [range[0]..range[1]])
        else
            []

    selectionStart: =>
        if @selection?  
            return [@selection[0], @selection[1]] if @selection[1] < @cursor[1]
            return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]] if @selection[1] > @cursor[1]
            return [Math.min(@selection[0], @cursor[0]), @cursor[1]]
        return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]]

    selectedLineIndices: =>
        range = @selectedLineRange()
        (i for i in [range[0]..range[1]])
                
    selectedLineRange: =>
        if @selection
            [Math.min(@cursor[1], @selection[1]), Math.max(@cursor[1], @selection[1])]

    selectedLines: =>
        s = []
        for i in @selectedLineIndices()
            s.push @selectedTextForLineAtIndex i
            i += 1
        s
    
    selectedTextForLineAtIndex: (i) =>
        r = @selectedCharacterRangeForLineAtIndex i
        if r?
            return @lines[i].substr r[0], r[1]-r[0]
        return ''
                
    selectedCharacterRangeForLineAtIndex: (i) =>
        return if not @selection
        lines = @selectedLineRange()
        return if i < lines[0] or i > lines[1]                      # outside selection
        return [0, @lines[i].length] if lines[0] < i < lines[1]     # inside selection
        if lines[0] == lines[1]                                     # only one line in selection
            return [Math.min(@cursor[0], @selection[0]), 
                    Math.max(@cursor[0], @selection[0])]
        if i == @cursor[1]                                          # on cursor line
            if @selection[1] > i                                        # at start of selection
                return [@cursor[0], @lines[i].length]
            else                                                        # at end of selection
                return [0, Math.min(@lines[i].length, @cursor[0])]
        else                                                        # on selection line
            if @cursor[1] > i                                           # at start of selection
                return [@selection[0], @lines[i].length]
            else                                                        # at end of selection
                return [0, Math.min(@lines[i].length, @selection[0])]

    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000

    cursorAtEndOfLine:   => @cursor[0] == @lines[@cursor[1]].length
    cursorAtStartOfLine: => @cursor[0] == 0
    cursorInLastLine:    => @cursor[1] == @lines.length-1
    cursorInFirstLine:   => @cursor[1] == 0

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000
    
    setCursor: (c,l) => 
        l = Math.min l, @lines.length-1
        c = Math.min c, @lines[l].length        
        @do.cursor @cursor, [c,l]

    moveCursorToPos: (pos)   => @setCursor pos[0], pos[1]
    moveCursorToEndOfLine:   => @setCursor @lines[@cursor[1]].length, @cursor[1]
    moveCursorToStartOfLine: => @setCursor 0, @cursor[1]
        
    moveCursorUp: =>
        if @cursorInFirstLine()
            @moveCursorToStartOfLine()
        else
            @do.cursor @cursor, [@cursor[0], @cursor[1] - 1] # don't adjust x

    moveCursorDown: =>
        if @cursorInLastLine()
            @moveCursorToEndOfLine()
        else
            @do.cursor @cursor, [@cursor[0], @cursor[1] + 1] # don't adjust x

    moveCursorRight: =>
        if @cursorAtEndOfLine() 
            if not @cursorInLastLine()
                @moveCursorDown()
                @moveCursorToStartOfLine()
        else
            @setCursor @cursor[0] + 1, @cursor[1]
    
    moveCursorLeft: =>
        # @cursor[0] = Math.min @lines[@cursor[1]].length, @cursor[0]
        @setCursor @cursor[0], @cursor[1]
        if @cursorAtStartOfLine()
            if not @cursorInFirstLine()
                @moveCursorUp()
                @moveCursorToEndOfLine()
        else
            @setCursor @cursor[0] - 1, @cursor[1]
    
    moveCursor: (direction) =>
        switch direction
            when 'left'  then @moveCursorLeft()
            when 'right' then @moveCursorRight()
            when 'up'    then @moveCursorUp()
            when 'down'  then @moveCursorDown()
        
    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   

    indentString: => '    '
    
    indentLineAtIndex: (i) =>
        @do.start()
        indent = @indentString()
        @do.change @lines, i, indent + @lines[i]
        if (@cursor[1] == i) and @cursor[0] > 0
            @setCursor @cursor[0] + indent.length, @cursor[1]
        if (@selection?[1] == i) and @selection[0] > 0
            @setSelection @selection[0] + indent.length, @selection[1]
        @do.end()
    
    deIndentLineAtIndex: (i) =>
        @do.start()
        indent = @indentString()        
        if @lines[i].startsWith indent
            @do.change @lines, i, @lines[i].substr indent.length
            if (@cursor[1] == i) and @cursor[0] > 0
                @setCursor Math.max 0, @cursor[0] - indent.length, @cursor[1]
            if (@selection?[1] == i) and @selection[0] > 0
                @setSelection Math.max 0, @selection[0] - indent.length, @selection[1]
        @do.end()
    
    deIndent: => 
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @deIndentLineAtIndex i
        else
            @deIndentLineAtIndex @cursor[1]    
        @do.end()
            
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertCharacter: (c) =>
        @do.start()
        @deleteSelection()
        @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 0, c
        @setCursor @cursor[0] + 1, @cursor[1]
        @do.end()
        
    insertTab: =>
        @do.start()
        if @selection?
            for i in @selectedLineIndices()
                @indentLineAtIndex i
        else
            il = @indentString().length
            for i in [0...(4-(@cursor[0]%il))]
                @insertCharacter ' '
        @do.end()
        
    insertNewline: =>
        @do.start()
        @deleteSelection()
        if @cursorAtEndOfLine()
            @do.change @lines.splice @cursor[1]+1, 0, ""
        else
            @do.insert @lines, @cursor[1]+1, @lines[@cursor[1]].substr @cursor[0]
            @do.change @lines, @cursor[1],   @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight()
        @do.end()
        
    insertText: (text) =>
        @do.start()
        @deleteSelection()
        for c in text
            if c == '\n'
                @insertNewline()
            else
                @insertCharacter c
        @do.end()
    
    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLine: =>
        if not @cursorInLastLine()
            @do.start()
            @do.change @lines, @cursor[1], @lines[@cursor[1]] + @lines[@cursor[1]+1]
            @do.delete @lines, @cursor[1]+1
            @do.end()
            
    deleteLineAtIndex: (i) =>
        @do.delete @lines, i
        
    deleteCharacterRangeInLineAtIndex: (r, i) =>
        @do.change @lines, i, @lines[i].splice r[0], r[1]-r[0]
            
    deleteSelection: =>
        return if not @selection?
        lineRange = @selectedLineRange()
        return if not lineRange?
        @do.start()
        @deleteCharacterRangeInLineAtIndex @selectedCharacterRangeForLineAtIndex(lineRange[1]), lineRange[1]
        if lineRange[1] > lineRange[0]
            for i in [(lineRange[1]-1)...lineRange[0]]
                @deleteLineAtIndex i
            @deleteCharacterRangeInLineAtIndex @selectedCharacterRangeForLineAtIndex(lineRange[0]), lineRange[0]
        selStart = @selectionStart()
        @setCursor selStart[0], selStart[1]
        if lineRange[1] > lineRange[0]
            @joinLine()
        @do.end()

    deleteForward: =>
        if @selection?
            @deleteSelection()
            return
        if @cursorAtEndOfLine()
            @joinLine()
        else
            @do.change @lines, @cursor[1], @lines[@cursor[1]].splice @cursor[0], 1
    
    deleteBackward: =>
        if @selection?
            @deleteSelection()
        else
            if @cursorInFirstLine() and @cursorAtStartOfLine()
                return
            cursorIndex = Math.min @lines[@cursor[1]].length-1, @cursor[0]
            strToCursor = @lines[@cursor[1]].substr 0, cursorIndex
            if strToCursor.trim() == '' # only spaces between line start and cursor
                il = @indentString().length
                rc = cursorIndex%il or il
                for i in [0...rc]
                    @moveCursorLeft()
                    @deleteForward()
            else
                @moveCursorLeft()
                @deleteForward()

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    text: => @lines.join '\n'
    selectedText: => @selectedLines().join '\n'
            
    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    lastPos: () => 
        lli = @lines.length-1
        [@lines[lli].length, lli]
    
    posForEvent: (event) =>
        sl = @elem.scrollLeft
        st = @elem.scrollTop
        br = @elem.getBoundingClientRect()
        lx = clamp 0, @elem.clientWidth,  event.clientX - br.left
        ly = clamp 0, @elem.clientHeight, event.clientY - br.top
        [parseInt(Math.floor((Math.max(0, sl + lx-10))/@charSize[0])),
         parseInt(Math.floor((Math.max(0, st + ly-10))/@charSize[1]))]
        
    clampPos: (p) =>
        l = clamp 0, @lines.length-1, p[1]
        c = clamp 0, @lines[l].length-1, p[0]
        [ c, l ]

    # 00000000    0000000   000   000   0000000   00000000   0000000
    # 000   000  000   000  0000  000  000        000       000     
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000   000  000   000  000  0000  000   000  000            000
    # 000   000  000   000  000   000   0000000   00000000  0000000 
    
    rangeForWordAtPos: (pos) =>
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

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    update: => @elem.innerHTML = html.render @lines, @cursor, @selectionRanges(), @charSize

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event
        # log "editor key:", key, "mod:", mod, "combo:", combo
        return if not combo
        switch key
            when 'right click'                       then return
            when 'down', 'right', 'up', 'left' 
                @startSelection event.shiftKey
                if event.metaKey
                    if key == 'left'
                        @moveCursorToStartOfLine()
                    else if key == 'right'
                        @moveCursorToEndOfLine()
                else
                    @moveCursor key
            else
                switch combo
                    when 'enter'                     then @insertNewline()
                    when 'tab', 'command+]'          then return @insertTab() + event.preventDefault() 
                    when 'shift+tab', 'command+['    then return @deIndent()  + event.preventDefault()
                    when 'delete', 'ctrl+backspace'  then @deleteForward()     
                    when 'backspace'                 then @deleteBackward()     
                    when 'command+j'                 then @joinLine()
                    when 'ctrl+a'                    then @moveCursorToStartOfLine()
                    when 'ctrl+e'                    then @moveCursorToEndOfLine()
                    when 'command+d'                 then return @selectNone()
                    when 'command+a'                 then return @selectAll()
                    when 'command+c'                 then return clipboard.writeText @selectedText()
                    when 'command+v'                 then @insertText clipboard.readText()
                    when 'command+x'                 
                        clipboard.writeText @selectedText()
                        @deleteSelection()
                    when 'command+z'             
                        @do.undo @
                        @update()
                        return
                    when 'command+shift+z'             
                        @do.redo @
                        @update()
                        return
                    when 'ctrl+shift+a'
                        @startSelection true
                        @moveCursorToStartOfLine()
                    when 'ctrl+shift+e'
                        @startSelection true
                        @moveCursorToEndOfLine()
                    else
                        ansiKeycode = require 'ansi-keycode'
                        if ansiKeycode(event)?.length == 1
                        # if mod == 'shift' and combo != 'shift' or combo.length == 1
                            @insertCharacter ansiKeycode event
                        else
                            log "ignoring", combo
        @endSelection event.shiftKey
        $('cursor')?.scrollIntoViewIfNeeded()

module.exports = Editor
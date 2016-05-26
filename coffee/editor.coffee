#00000000  0000000    000  000000000   0000000   00000000 
#000       000   000  000     000     000   000  000   000
#0000000   000   000  000     000     000   000  0000000  
#000       000   000  000     000     000   000  000   000
#00000000  0000000    000     000      0000000   000   000

html      = require './html'
log       = require './tools/log'
tools     = require './tools/tools'
keyinfo   = require './tools/keyinfo'
clipboard = require('electron').clipboard
clamp     = tools.clamp
$         = tools.$

class Editor
    
    constructor: (elem, className) ->
        @cursor     = [0,0]
        @selection  = null
        @lines      = [""]
        @elem       = elem
        @clss       = className
        @initCharSize()
        @elem.onkeydown = @onKeyDown
        @elem.innerHTML = html.cursorSpan @charSize

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

    selectionStart: =>
        if @selection?  
            return [@selection[0], @selection[1]] if @selection[1] < @cursor[1]
            return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]] if @selection[1] > @cursor[1]
            return [Math.min(@selection[0], @cursor[0]), @cursor[1]]
        return [Math.min(@cursor[0], @lines[@cursor[1]].length), @cursor[1]]

    selectRange: (range) =>
        @selection = range[0]
        @cursor    = range[1]

    selectAll:  => @selectRange [[0,0], @lastPos()]
    selectNone: => @selection = null
    
    startSelection: (active) =>
        if active and not @selection?
            @selection = [Math.min(@cursor[0], @lines[@cursor[1]].length),@cursor[1]]

    endSelection: (active) =>
        if @selection? and not active
            @selection = null
        
    selectionRanges: () =>
        if @selection
            range = @selectedLineRange()
            ([i, @selectedCharacterRangeForLineAtIndex(i)] for i in [range[0]..range[1]])
        else
            []

    selectedLineIndices: =>
        range = @selectedLineRange()
        (i for i in [range[0]..range[1]])
                
    selectedLineRange: =>
        if @selection
            [Math.min(@cursor[1], @selection[1]), Math.max(@cursor[1], @selection[1])]
            
    selectedCharacterRangeForLineAtIndex: (i) =>
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

    cursorAtEndOfLine:   => @cursor[0] == @lines[@cursor[1]].length
    cursorAtStartOfLine: => @cursor[0] == 0
    cursorInLastLine:    => @cursor[1] == @lines.length-1
    cursorInFirstLine:   => @cursor[1] == 0

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000
    
    moveCursorToEndOfLine: =>
        @cursor[0] = @lines[@cursor[1]].length
        
    moveCursorToStartOfLine: =>
        @cursor[0] = 0

    moveCursorToLineChar: (l,c=0) =>
        @cursor[1] = Math.min l, @lines.length-1
        @cursor[0] = Math.min c, @lines[@cursor[1]].length
        
    moveCursorToPos: (pos) =>
        @cursor[1] = Math.min pos[1], @lines.length-1
        @cursor[0] = Math.min pos[0], @lines[@cursor[1]].length        

    moveCursorUp: =>
        if @cursorInFirstLine()
            @moveCursorToStartOfLine()
        else
            @cursor[1] -= 1

    moveCursorDown: =>
        if @cursorInLastLine()
            @moveCursorToEndOfLine()
        else
            @cursor[1] += 1

    moveCursorRight: =>
        if @cursorAtEndOfLine() 
            if not @cursorInLastLine()
                @moveCursorDown()
                @moveCursorToStartOfLine()
        else
            @cursor[0] += 1
    
    moveCursorLeft: =>
        @cursor[0] = Math.min @lines[@cursor[1]].length, @cursor[0]
        if @cursorAtStartOfLine()
            if not @cursorInFirstLine()
                @moveCursorUp()
                @moveCursorToEndOfLine()
        else
            @cursor[0] -= 1
    
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
        indent = @indentString()
        @lines[i] = indent + @lines[i]
        if (@cursor[1] == i) and @cursor[0] > 0
            @cursor[0] += indent.length
        if (@selection?[1] == i) and @selection[0] > 0
            @selection[0] += indent.length
    
    deIndentLineAtIndex: (i) =>
        indent = @indentString()        
        if @lines[i].startsWith indent
            @lines[i] = @lines[i].substr indent.length
            if (@cursor[1] == i) and @cursor[0] > 0
                @cursor[0] = Math.max 0, @cursor[0] - indent.length
            if (@selection?[1] == i) and @selection[0] > 0
                @selection[0] = Math.max 0, @selection[0] - indent.length
    
    deIndent: => 
        if @selection?
            for i in @selectedLineIndices()
                @deIndentLineAtIndex i
        else
            @deIndentLineAtIndex @cursor[1]    
            
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertCharacter: (c) =>
        @deleteSelection() if @selection?
        @lines[@cursor[1]] = @lines[@cursor[1]].splice @cursor[0], 0, c
        @cursor[0] += 1
        
    insertTab: =>
        if @selection?
            for i in @selectedLineIndices()
                @indentLineAtIndex i
        else
            il = @indentString().length
            for i in [0...(4-(@cursor[0]%il))]
                @insertCharacter ' '
        
    insertNewline: =>
        @deleteSelection() if @selection?
        if @cursorAtEndOfLine()
            @lines.splice @cursor[1]+1, 0, ""
        else
            @lines.splice @cursor[1]+1, 0, @lines[@cursor[1]].substr @cursor[0]
            @lines[@cursor[1]] = @lines[@cursor[1]].substr 0, @cursor[0]
        @moveCursorRight()
        
    insertText: (text) =>
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
    
    joinLine: =>
        if not @cursorInLastLine()
            @lines[@cursor[1]] += @lines[@cursor[1]+1]
            @lines.splice @cursor[1]+1, 1
            
    deleteLineAtIndex: (i) =>
        @lines.splice i, 1
        
    deleteCharacterRangeInLineAtIndex: (r, i) =>
        @lines[i] = @lines[i].splice r[0], r[1]-r[0]
            
    deleteSelection: =>
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

    deleteForward: =>
        if @selection?
            @deleteSelection()
            return
        if @cursorAtEndOfLine()
            @joinLine()
        else
            @lines[@cursor[1]] = @lines[@cursor[1]].splice @cursor[0], 1
    
    deleteBackward: =>
        if @selection?
            @deleteSelection()
        else
            if @cursorInFirstLine() and @cursorAtStartOfLine()
                return
            cursorIndex = Math.min @lines[@cursor[1]].length-1, @cursor[0]
            strToCursor = @lines[@cursor[1]].substr 0, cursorIndex
            log 'strToCursor', strToCursor, "<"
            if strToCursor.trim() == '' # only spaces between line start and cursor

                il = @indentString().length
                rc = cursorIndex%il or il
                log il, cursorIndex, rc
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

    text: => return @lines.join '\n'
            
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
        pos = [ parseInt(Math.floor((Math.max(0, sl + lx-10))/@charSize[0])),
                parseInt(Math.floor((Math.max(0, st + ly-10))/@charSize[1]))]

    # 00000000    0000000   000   000   0000000   00000000   0000000
    # 000   000  000   000  0000  000  000        000       000     
    # 0000000    000000000  000 0 000  000  0000  0000000   0000000 
    # 000   000  000   000  000  0000  000   000  000            000
    # 000   000  000   000  000   000   0000000   00000000  0000000 
    
    rangeForWordAtPos: (pos) =>
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
                    when 'tab', 'command+]'          then return @insertTab() + @update() + event.preventDefault() 
                    when 'shift+tab', 'command+['    then return @deIndent()  + @update() + event.preventDefault()
                    when 'delete', 'ctrl+backspace'  then @deleteForward()     
                    when 'backspace'                 then @deleteBackward()     
                    when 'command+j'                 then @joinLine()
                    when 'command+v'                 then @insertText clipboard.readText()
                    when 'ctrl+a'                    then @moveCursorToStartOfLine()
                    when 'ctrl+e'                    then @moveCursorToEndOfLine()
                    when 'command+d'                 then @selectNone()
                    when 'command+a'                
                        @selectAll() 
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
        @update()
        $('cursor')?.scrollIntoViewIfNeeded()

module.exports = Editor
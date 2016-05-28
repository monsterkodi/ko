# 000   000  000000000  00     00  000      00000000  0000000    000  000000000   0000000   00000000 
# 000   000     000     000   000  000      000       000   000  000     000     000   000  000   000
# 000000000     000     000000000  000      0000000   000   000  000     000     000   000  0000000  
# 000   000     000     000 0 000  000      000       000   000  000     000     000   000  000   000
# 000   000     000     000   000  0000000  00000000  0000000    000     000      0000000   000   000

Editor    = require './editor'
html      = require './html'
log       = require './tools/log'
keyinfo   = require './tools/keyinfo'
{clamp,$} = require './tools/tools'
clipboard = require('electron').clipboard

class HtmlEditor extends Editor

    constructor: (elem, className) ->
        super
        log 'HtmlEditor'
        @elem = elem
        @clss = className

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

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    update: => @elem.innerHTML = html.render @lines, @cursor, @selectionRanges(), @charSize

    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    posForEvent: (event) =>
        sl = @elem.scrollLeft
        st = @elem.scrollTop
        br = @elem.getBoundingClientRect()
        lx = clamp 0, @elem.clientWidth,  event.clientX - br.left
        ly = clamp 0, @elem.clientHeight, event.clientY - br.top
        [parseInt(Math.floor((Math.max(0, sl + lx-10))/@charSize[0])),
         parseInt(Math.floor((Math.max(0, st + ly-10))/@charSize[1]))]
            
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event
        # log "editor key:", key, "mod:", mod, "combo:", combo
        return if not combo
        scroll = false
        switch key
            when 'right click' then return
            when 'down', 'right', 'up', 'left' 
                @startSelection event.shiftKey
                if event.metaKey
                    if key == 'left'
                        @moveCursorToStartOfLine()
                    else if key == 'right'
                        @moveCursorToEndOfLine()
                else if event.altKey
                    if key == 'left'
                        @moveCursorToStartOfWord()
                    else if key == 'right'
                        @moveCursorToEndOfWord()                    
                else
                    @moveCursor key
                    scroll = true
                    
                event.preventDefault()
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
                    when 'command+k'                 then return @selectAll() + @deleteSelection()
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
                        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
                        # if mod == 'shift' and combo != 'shift' or combo.length == 1
                            @insertCharacter ansiKeycode event
                        else
                            log "ignoring", combo
        @endSelection event.shiftKey
        if scroll
            $('cursor')?.scrollIntoViewIfNeeded()

module.exports = HtmlEditor
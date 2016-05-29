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

        @elem = elem
        @clss = className
        @divs = []
        
        @topIndex = 0
        @botIndex = 0
        @scroll   = 0
    
        @initCharSize()
        @scrollChanged()
        
        @elem.onkeydown = @onKeyDown
        @elem.innerHTML = html.cursorSpan @charSize        
        @elem.addEventListener 'wheel',   @onWheel

    setText: (text) ->
        @lines = text.split '\n'
        @displayLines 0, @numVisibleLines()-1

    displayLines: (top, bot) ->
        @topIndex = top
        @botIndex = bot
        @update()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    # update: => @elem.innerHTML = html.render @lines, @cursor, @selectionRanges(), @charSize
    update: =>
        log "update", @topIndex, "...", @botIndex
        @divs = []
        i = @topIndex
        while i <= @botIndex
            @divs.push html.renderLine i, @lines, @cursor, @selectionRanges(), @charSize
            i += 1
        @elem.innerHTML = @divs.join '\n'

    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    posForEvent: (event) ->
        sl = @elem.scrollLeft
        st = @elem.scrollTop
        br = @elem.getBoundingClientRect()
        lx = clamp 0, @elem.clientWidth,  event.clientX - br.left
        ly = clamp 0, @elem.clientHeight, event.clientY - br.top
        [parseInt(Math.floor((Math.max(0, sl + lx-10))/@charSize[0])),
         parseInt(Math.floor((Math.max(0, st + ly-10))/@charSize[1]))]

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    viewHeight:      -> @elem.offsetHeight
    numViewLines:    -> Math.ceil(@viewHeight() / @lineHeight)
    numFullLines:    -> Math.floor(@viewHeight() / @lineHeight)
    numVisibleLines: -> @lines.length

    ###
     0000000   0000000  00000000    0000000   000      000    
    000       000       000   000  000   000  000      000    
    0000000   000       0000000    000   000  000      000    
         000  000       000   000  000   000  000      000    
    0000000    0000000  000   000   0000000   0000000  0000000
    ###
        
    # updateScroll: ->
    #     vh           = Math.min @linesHeight, @viewHeight()
    #     scrollTop    = parseInt (@scroll / @treeHeight) * vh
    #     scrollTop    = Math.max 0, scrollTop
    #     scrollHeight = parseInt (@linesHeight / @treeHeight) * vh
    #     scrollHeight = Math.max scrollHeight, parseInt @lineHeight/4
    #     scrollTop    = Math.min scrollTop, @numFullLines()*@lineHeight-scrollHeight-1
    #     
    #     @scrollRight.classList.toggle 'flashy', (scrollHeight < @lineHeight)
    #     @scrollRight.style.top    = "#{scrollTop}.px"
    #     @scrollRight.style.height = "#{scrollHeight}.px"

    resized: -> @scrollBy 0
                
    scrollLines: (lineDelta) -> @scrollBy lineDelta * @lineHeight

    scrollFactor: (event) ->
        f  = 1 
        f *= 1 + 9 * event.metaKey
        f *= 1 + 99 * event.altKey        
        f *= 1 + 999 * event.ctrlKey

    onWheel: (event) => 
        @scrollBy event.deltaY * @scrollFactor event
    
    scrollBy: (delta) -> 

        numLines  = @numVisibleLines()
        viewLines = @numViewLines()
                
        @treeHeight  = numLines * @lineHeight
        @linesHeight = viewLines * @lineHeight
        @scrollMax   = @treeHeight - @linesHeight + @lineHeight
        
        @scroll += delta
        @scroll = Math.min @scroll, @scrollMax
        @scroll = Math.max @scroll, 0
        
        # log 'treeHeight', @treeHeight, 'scrollMax', @scrollMax
        # log 'delta', delta, "viewLines", viewLines, "numLines", numLines, "@scroll", @scroll, "@scrollMax", @scrollMax
        
        top = parseInt @scroll / @lineHeight
        bot = Math.min(@topIndex + viewLines - 1, numLines - 1)

        if @topIndex != top or @botIndex != bot
            # log "scrollChanged!", top, @topIndex, bot, @botIndex
            @displayLines  top, bot
            
    scrollChanged: ->
        
        numLines  = @numVisibleLines()
        viewLines = @numViewLines()
        
        @treeHeight = numLines * @lineHeight
        @linesHeight = viewLines * @lineHeight

        @topIndex = parseInt @scroll / @lineHeight    
        @botIndex = Math.min(@topIndex + viewLines - 1, numLines-1)
        
        # log "viewLines", viewLines, "@scroll", @scroll, "topIndex", @topIndex , "botIndex", @botIndex 
        
    #  0000000  000   000   0000000   00000000    0000000  000  0000000  00000000
    # 000       000   000  000   000  000   000  000       000     000   000     
    # 000       000000000  000000000  0000000    0000000   000    000    0000000 
    # 000       000   000  000   000  000   000       000  000   000     000     
    #  0000000  000   000  000   000  000   000  0000000   000  0000000  00000000

    initCharSize: () ->
        o = document.createElement 'div'
        o.className = @clss
        o.innerHTML = 'XXXXXXXXXX'
        o.style = 
          float:      'left'
          visibility: 'hidden'
        document.body.appendChild o
        @charSize = [o.clientWidth/o.innerHTML.length, o.clientHeight]
        @lineHeight = @charSize[1]
        o.remove()
            
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
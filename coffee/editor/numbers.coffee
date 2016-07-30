# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 
{
first,
last,
$}    = require '../tools/tools'
log   = require '../tools/log'
str   = require '../tools/str'
_     = require 'lodash'
event = require 'events'

class Numbers extends event

    constructor: (@editor) ->
        @opacity = 0.5
        @elem = $(".numbers", @editor.view)
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineDeleted',      @onLineDeleted
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'lineVanishedTop',  @onLineVanishedTop
        @editor.on 'linesExposed',     @onLinesExposed
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        @editor.on 'highlight',        @updateColors
        @editor.on 'changed',          @onChanged
        @onFontSizeChange()

    onChanged: (changeInfo) =>
        if changeInfo.cursors?.length
            for c in changeInfo.cursors
                @updateColors c, c
        if changeInfo.selection?.length
            for s in changeInfo.selection
                for li in [s[0]..s[1]]
                    @updateColors li, li
    
    setOpacity: (o) -> @elem.style.background = "rgba(0,0,0,#{o})"
    
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    updateColors: (top=@editor.scroll.exposeTop, bot=@editor.scroll.exposeBot) =>
        si = (s[0] for s in @editor.rangesFromTopToBotInRanges top, bot, @editor.selections)
        hi = (s[0] for s in @editor.rangesFromTopToBotInRanges top, bot, @editor.highlights)
        ci = (s[0] for s in @editor.rangesFromTopToBotInRanges top, bot, @editor.rangesForCursors())
        li = top
        for li in [top..bot]
            child = @elem.children[li-@editor.scroll.exposeTop]
            break if not child?
            cls = ''
            if li in ci
                cls += ' cursored'
            if li == @editor.mainCursor[1]
                cls += ' main'
            if li in si
                cls += ' selected'
            if li in hi
                cls += ' highligd'            
            child.className = 'linenumber ' + cls
            li += 1
       
    # 00000000   0000000   000   000  000000000   0000000  000  0000000  00000000
    # 000       000   000  0000  000     000     000       000     000   000     
    # 000000    000   000  000 0 000     000     0000000   000    000    0000000 
    # 000       000   000  000  0000     000          000  000   000     000     
    # 000        0000000   000   000     000     0000000   000  0000000  00000000
        
    onFontSizeChange: => 
        @elem.style.lineHeight = "#{@editor.size.lineHeight}px"        
        if @editor.size.fontSize < 13
            @elem.style.fontSize = "#{@editor.size.fontSize}px"
    
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    onLineExposed: (e) =>
        @elem.appendChild @addLine e.lineIndex
        @updateColors e.lineIndex, e.lineIndex

    onLinesExposed: (e) => 
        for li in [e.top..e.bot]
            @elem.appendChild @divForLine li
    
    # 0000000    00000000  000      00000000  000000000  00000000  0000000  
    # 000   000  000       000      000          000     000       000   000
    # 000   000  0000000   000      0000000      000     0000000   000   000
    # 000   000  000       000      000          000     000       000   000
    # 0000000    00000000  0000000  00000000     000     00000000  0000000  
        
    onLineDeleted: (li) =>
        top = @editor.scroll.exposeTop
        bot = @editor.scroll.exposeBot
        if top <= li <= bot
            for i in [li..bot]
                div = @elem.children[li-top]
                div.firstChild.textContent = "#{li+1}"
                @emit 'numberChanged', 
                    numberDiv:  div
                    numberSpan: div.firstChild
                    lineIndex:  i
                @updateColors i
            @elem.lastChild?.remove()
        
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    onLineVanished:    (e) => @elem.lastChild?.remove()
    onLineVanishedTop: (e) => @elem.firstChild?.remove()
    onClearLines:          => @elem.innerHTML = ""
    
    #  0000000   0000000    0000000    000      000  000   000  00000000
    # 000   000  000   000  000   000  000      000  0000  000  000     
    # 000000000  000   000  000   000  000      000  000 0 000  0000000 
    # 000   000  000   000  000   000  000      000  000  0000  000     
    # 000   000  0000000    0000000    0000000  000  000   000  00000000
    
    divForLine: (li) ->
        div = document.createElement "div"
        div.className = "linenumber"
        pre = document.createElement "span"
        pre.textContent = "#{li+1}"
        div.appendChild pre
        div        
    
    addLine: (li) ->
        div = @divForLine li
        @emit 'numberAdded', 
            numberDiv:  div 
            numberSpan: div.firstChild
            lineIndex:  li
        div
        
    log: -> 
        if @editor.name == 'logview'
            console.log (str(s) for s in [].slice.call arguments, 0).join " "
        else
            log (str(s) for s in [].slice.call arguments, 0).join " "

module.exports = Numbers

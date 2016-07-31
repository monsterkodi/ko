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
        @editor.on 'lineInserted',     @onLineInserted
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        @editor.on 'highlight',        @onHighlight
        @editor.on 'changed',          @onChanged
        @onFontSizeChange()

    onHighlight: => @updateColor h[0] for h in @editor.highlights
    
    onChanged: (changeInfo) =>
        if changeInfo.cursors?.length
            for c in changeInfo.cursors
                @updateColor c
        if changeInfo.selection?.length
            for s in changeInfo.selection
                for li in [s[0]..s[1]]
                    @updateColor li
    
    setOpacity: (o) -> @elem.style.background = "rgba(0,0,0,#{o})"
    
    #  0000000   0000000   000       0000000   00000000 
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000  
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000
    
    updateColor: (li) =>
        si = (s[0] for s in @editor.rangesFromTopToBotInRanges li, li, @editor.selections)
        hi = (s[0] for s in @editor.rangesFromTopToBotInRanges li, li, @editor.highlights)
        ci = (s[0] for s in @editor.rangesFromTopToBotInRanges li, li, @editor.rangesForCursors())
        child = @elem.children[li-@editor.scroll.exposeTop]
        return if not child?
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
       
    # 00000000   0000000   000   000  000000000
    # 000       000   000  0000  000     000   
    # 000000    000   000  000 0 000     000   
    # 000       000   000  000  0000     000   
    # 000        0000000   000   000     000   
        
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
        if e.lineIndex < @elem.firstChild?.lineIndex
            @elem.insertBefore @addLine(e.lineIndex), @elem.firstChild
        else if e.lineIndex > @elem.lastChild?.lineIndex
            @elem.appendChild @addLine e.lineIndex
        else
            @elem.appendChild @addLine e.lineIndex
        @updateColor e.lineIndex

    onLineInserted: (li) =>
        top = @editor.scroll.exposeTop
        bot = @editor.scroll.exposeBot
        if top <= li <= bot
            for i in [li...bot]
                div = @elem.children[li-top]
                div.firstChild.textContent = "#{li+1}"
                @emit 'numberChanged', 
                    numberDiv:  div
                    numberSpan: div.firstChild
                    lineIndex:  i
                @updateColor i
            @onLineExposed lineIndex: bot
                    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    onClearLines: => @elem.innerHTML = ""
        
    onLineVanished: (e) => 
        
        if @elem.firstChild?.lineIndex == e.lineIndex
            @elem.firstChild.remove()
        else if @elem.lastChild?.lineIndex >= e.lineIndex
            @elem.lastChild.remove()
        # else
            # log "vanish? #{@editor.name} #{e.lineIndex} #{@elem.firstChild.lineIndex} #{@elem.lastChild.lineIndex}" if @editor.name != 'logview'
    
    onLineDeleted: (li) =>
        top = @editor.scroll.exposeTop
        bot = @editor.scroll.exposeBot
        if top <= li <= bot
            for i in [li..bot]
                div = @elem.children[i-top]
                div.firstChild.textContent = "#{i+1}"
                @updateColor i
                @emit 'numberChanged', 
                    numberDiv:  div
                    numberSpan: div.firstChild
                    lineIndex:  i
        @elem.lastChild?.remove()
        
    #  0000000   0000000    0000000    000      000  000   000  00000000
    # 000   000  000   000  000   000  000      000  0000  000  000     
    # 000000000  000   000  000   000  000      000  000 0 000  0000000 
    # 000   000  000   000  000   000  000      000  000  0000  000     
    # 000   000  0000000    0000000    0000000  000  000   000  00000000
    
    divForLine: (li) ->
        div = document.createElement "div"
        div.className = "linenumber"        
        div.lineIndex = li
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
        
module.exports = Numbers

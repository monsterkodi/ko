# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 
{
setStyle,
first,
last,
$}    = require '../tools/tools'
log   = require '../tools/log'
str   = require '../tools/str'
_     = require 'lodash'
event = require 'events'

class Numbers extends event

    constructor: (@editor) ->
        
        @elem = $(".numbers", @editor.view)
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineDeleted',      @onLineDeleted
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'lineExposedTop',   @onLineExposedTop
        @editor.on 'lineVanishedTop',  @onLineVanishedTop
        @editor.on 'exposeTopChanged', @renumber
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        @editor.on 'highlight',        @updateColors
        @editor.on 'selection',        @updateColors
        @editor.on 'cursor',           @updateColors
        @onFontSizeChange()
    
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    updateColors: (top=@editor.scroll.exposeTop, bot=@editor.scroll.exposeBot) =>
        sr = @editor.rangesFromTopToBotInRanges top, bot, @editor.selections
        hr = @editor.rangesFromTopToBotInRanges top, bot, @editor.highlights        
        cr = @editor.rangesFromTopToBotInRanges top, bot, @editor.rangesForCursors()
        hi = @editor.sortedLineIndicesInRanges hr
        si = @editor.sortedLineIndicesInRanges sr
        ci = @editor.sortedLineIndicesInRanges cr
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
        
    onLineExposedTop: (e) =>
        @elem.insertBefore @addLine(e.lineIndex), @elem.firstChild
        @updateColors e.lineIndex, e.lineIndex
        
    # 0000000    00000000  000      00000000  000000000  00000000  0000000  
    # 000   000  000       000      000          000     000       000   000
    # 000   000  0000000   000      0000000      000     0000000   000   000
    # 000   000  000       000      000          000     000       000   000
    # 0000000    00000000  0000000  00000000     000     00000000  0000000  
        
    onLineDeleted: (li) =>
        top = @editor.scroll.exposeTop
        bot = @editor.scroll.exposeBot
        if top <= li <= bot+1
            @elem.lastChild?.remove()
            @renumberFromLineIndex top
    
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
    
    addLine: (li) ->
        div = document.createElement "div"
        div.className = "linenumber"
        pre = document.createElement "span"
        pre.textContent = "#{li+1}"
        div.appendChild pre
        @emit 'numberAdded', 
            numberDiv:  div 
            numberSpan: pre
            lineIndex:  li
        div
        
    # 00000000   00000000  000   000  000   000  00     00  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000   000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  000000000  0000000    0000000   0000000  
    # 000   000  000       000  0000  000   000  000 0 000  000   000  000       000   000
    # 000   000  00000000  000   000   0000000   000   000  0000000    00000000  000   000
        
    renumber: (e) =>
        @renumberFromLineIndex e.new

    renumberFromLineIndex: (li) ->
        for div in @elem.children
            div.firstChild.textContent = "#{li+1}"
            @emit 'numberChanged', 
                numberDiv:  div
                numberSpan: div.firstChild
                lineIndex:  li
            li += 1
        @updateColors()

    log: -> 
        if @editor.name == 'logview'
            console.log (str(s) for s in [].slice.call arguments, 0).join " "
        else
            log (str(s) for s in [].slice.call arguments, 0).join " "

module.exports = Numbers

# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 
{
str,
error,
log,
$}    = require 'kxk'
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
        @editor.on 'highlight',        @updateColors
        @editor.on 'changed',          @updateColors
        @editor.on 'linesSet',         @updateColors
        @onFontSizeChange()

    setOpacity: (o) -> @elem.style.background = "rgba(0,0,0,#{o})"
    
    #  0000000   0000000   000       0000000   00000000 
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000  
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000
    
    updateColor: (li) =>
        # log "Numbers.updateColor li:#{li}" if @editor.name == 'editor'
        si = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.selections)
        hi = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.highlights)
        ci = (s[0] for s in rangesFromTopToBotInRanges li, li, rangesFromPositions @editor.state.cursors())
        child = @elem.children[li-@editor.scroll.exposeTop]
        return if not child?
        cls = ''
        if li in ci
            cls += ' cursored'
        if li == @editor.mainCursor()[1]
            cls += ' main'
        if li in si
            cls += ' selected'
        if li in hi
            cls += ' highligd'            
        child.className = 'linenumber ' + cls
       
    updateColors: =>
        if @editor.scroll.exposeBot > @editor.scroll.exposeTop
            for li in [@editor.scroll.exposeTop..@editor.scroll.exposeBot]
                @updateColor li
    
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
        # log "numbers.onLineExposed #{e.lineIndex}" if @editor.name == 'editor'
        if e.lineIndex < @elem.firstChild?.lineIndex
            @elem.insertBefore @addLine(e.lineIndex), @elem.firstChild
        else if e.lineIndex > @elem.lastChild?.lineIndex or not @elem.lastChild?
            @elem.appendChild @addLine e.lineIndex
        else
            # log "skip expose #{e.lineIndex}" if @editor.name == 'editor'
            return
        @updateColor e.lineIndex

    onLineInserted: (li, oi) =>
        # log "numbers.onLineInserted #{li}" if @editor.name == 'editor'
        top = @editor.scroll.exposeTop
        if top <= oi
            for i in [oi-top...@elem.children.length]
                div = @elem.children[i]
                if not div?.firstChild?
                    return error "Numbers.onLineInserted -- no div child? #{li} #{i} #{li-top} #{@elem.children.length}"
                div.firstChild.textContent = "#{top+i+1}"
                @emit 'numberChanged', 
                    numberDiv:  div
                    numberSpan: div.firstChild
                    lineIndex:  top+i
                @updateColor top+i
            i = top+@elem.children.length
            @elem.appendChild @addLine i
            @updateColor i
                    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000
    
    onClearLines: =>  @elem.innerHTML = ""
        
    onLineVanished: (e) => 
        if @elem.firstChild?.lineIndex == e.lineIndex
            @elem.firstChild.remove()
        else if @elem.lastChild?.lineIndex >= e.lineIndex
            @elem.lastChild.remove()
        # else
            # log "vanish? #{@editor.name} #{e.lineIndex} #{@elem.firstChild.lineIndex} #{@elem.lastChild.lineIndex}" if @editor.name != 'logview'
    
    onLineDeleted: (li) =>
        top = @editor.scroll.exposeTop
        if top <= li
            for i in [li-top...@elem.children.length]
                div = @elem.children[i]
                div.firstChild.textContent = "#{top+i+1}"
                @updateColor top+i
                @emit 'numberChanged', 
                    numberDiv:  div
                    numberSpan: div.firstChild
                    lineIndex:  top+i
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

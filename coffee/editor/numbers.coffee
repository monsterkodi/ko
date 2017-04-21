# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 

{ str, elem, error, log, $, _
}     = require 'kxk'
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
        if e.lineIndex < @elem.firstChild?.lineIndex
            @elem.insertBefore @addLine(e.lineIndex), @elem.firstChild
        else if e.lineIndex > @elem.lastChild?.lineIndex or not @elem.lastChild?
            @elem.appendChild @addLine e.lineIndex
        else
            return
        @updateColor e.lineIndex

    onLineInserted: (li, oi) =>
        top = @editor.scroll.exposeTop
        bot = @editor.scroll.exposeBot
        if top <= oi <= bot
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
        div = elem class: "linenumber", child: elem "span", text: "#{li+1}"
        div.lineIndex = li
        div
        
    addLine: (li) ->
        div = @divForLine li
        @emit 'numberAdded', 
            numberDiv:  div 
            numberSpan: div.firstChild
            lineIndex:  li
        div
        
module.exports = Numbers

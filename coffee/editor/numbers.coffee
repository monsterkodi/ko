
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
        
        @lineDivs = {}
        
        @opacity = 0.5
        @elem = $(".numbers", @editor.view)
        
        @editor.on 'clearLines',       @onClearLines
        
        @editor.on 'linesShown',       @onLinesShown
        @editor.on 'linesShifted',     @onLinesShifted
        
        @editor.on 'lineDeleted',      @onLineDeleted
        @editor.on 'lineInserted',     @onLineInserted
        
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        @editor.on 'highlight',        @updateColors
        @editor.on 'changed',          @updateColors
        @editor.on 'linesSet',         @updateColors
        
        @onFontSizeChange()
               
    #  0000000  000   000   0000000   000   000  000   000  
    # 000       000   000  000   000  000 0 000  0000  000  
    # 0000000   000000000  000   000  000000000  000 0 000  
    #      000  000   000  000   000  000   000  000  0000  
    # 0000000   000   000   0000000   00     00  000   000  
    
    onLinesShown: (top, bot, num) =>
        
        @elem.innerHTML = ''
        @lineDivs = {}
        
        for li in [top..bot]

            div = elem class: "linenumber", child: elem "span", text: "#{li+1}"
            @elem.appendChild div
            @lineDivs[li] = div
            
            @emit 'numberAdded', 
                numberDiv:  div
                numberSpan: div.firstChild
                lineIndex:  li
                
            @updateColor li
            
        @updateLinePositions()

    #  0000000  000   000  000  00000000  000000000  00000000  0000000    
    # 000       000   000  000  000          000     000       000   000  
    # 0000000   000000000  000  000000       000     0000000   000   000  
    #      000  000   000  000  000          000     000       000   000  
    # 0000000   000   000  000  000          000     00000000  0000000    
    
    onLinesShifted: (top, bot, num) =>
                
        oldTop = top - num
        oldBot = bot - num

        log 'onLinesShifted', oldTop, top, 'bot', oldBot, bot, num
                
        divInto = (li,lo) =>
            @lineDivs[li] = @lineDivs[lo]
            delete @lineDivs[lo]
            @lineDivs[li].firstChild.textContent = li+1
        
        if num > 0
            while oldBot < bot
                oldBot += 1
                divInto oldBot, oldTop
                oldTop += 1
        else
            while oldTop > top
                oldTop -= 1
                divInto oldTop, oldBot
                oldBot -= 1
       
        @updateLinePositions()

    # 000      000  000   000  00000000     00000000    0000000    0000000  
    # 000      000  0000  000  000          000   000  000   000  000       
    # 000      000  000 0 000  0000000      00000000   000   000  0000000   
    # 000      000  000  0000  000          000        000   000       000  
    # 0000000  000  000   000  00000000     000         0000000   0000000   
    
    updateLinePositions: ->

        for li, div in @lineDivs
            y = @editor.size.lineHeight * (li - @editor.scroll2.top)
            div.style.transform = "translate3d(0, #{y}px, 0)"
        
    # 000  000   000   0000000  00000000  00000000   000000000  00000000  0000000    
    # 000  0000  000  000       000       000   000     000     000       000   000  
    # 000  000 0 000  0000000   0000000   0000000       000     0000000   000   000  
    # 000  000  0000       000  000       000   000     000     000       000   000  
    # 000  000   000  0000000   00000000  000   000     000     00000000  0000000    
    
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
                    
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    onClearLines: =>  @elem.innerHTML = ""
            
    # 0000000    00000000  000      00000000  000000000  00000000  0000000    
    # 000   000  000       000      000          000     000       000   000  
    # 000   000  0000000   000      0000000      000     0000000   000   000  
    # 000   000  000       000      000          000     000       000   000  
    # 0000000    00000000  0000000  00000000     000     00000000  0000000    
    
    onLineDeleted: (li) =>
        
        top = @editor.scroll.exposeTop
        if top <= li
            for i in [li-top...@elem.children.length]
                div = @elem.children[i]
                if not div?
                    error "no div for lineIndex #{li}? top: #{top} children:#{@elem.children.length}" 
                    continue
                div.firstChild.textContent = "#{top+i+1}"
                @updateColor top+i
                @emit 'numberChanged', 
                    numberDiv:  div
                    numberSpan: div.firstChild
                    lineIndex:  top+i
        @elem.lastChild?.remove()
                
    # 00000000   0000000   000   000  000000000
    # 000       000   000  0000  000     000   
    # 000000    000   000  000 0 000     000   
    # 000       000   000  000  0000     000   
    # 000        0000000   000   000     000   
        
    onFontSizeChange: => 
        @elem.style.lineHeight = "#{@editor.size.lineHeight}px"        
        if @editor.size.fontSize < 13
            @elem.style.fontSize = "#{@editor.size.fontSize}px"

    #  0000000   0000000   000       0000000   00000000    0000000  
    # 000       000   000  000      000   000  000   000  000       
    # 000       000   000  000      000   000  0000000    0000000   
    # 000       000   000  000      000   000  000   000       000  
    #  0000000   0000000   0000000   0000000   000   000  0000000   
    
    updateColors: =>
        
        if @editor.scroll.exposeBot > @editor.scroll.exposeTop
            for li in [@editor.scroll.exposeTop..@editor.scroll.exposeBot]
                @updateColor li

    updateColor: (li) =>
        
        top = @elem.firstChild?.lineIndex ? @editor.scroll.exposeTop
        # log "Numbers.updateColor li:#{li}" if @editor.name == 'editor'
        si = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.selections())
        hi = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.highlights())
        ci = (s[0] for s in rangesFromTopToBotInRanges li, li, rangesFromPositions @editor.cursors())
        child = @elem.children[li-top]
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
                
module.exports = Numbers

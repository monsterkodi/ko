
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
        
        @elem =$ ".numbers", @editor.view
        
        @editor.on 'clearLines',       @onClearLines
        
        @editor.on 'linesShown',       @onLinesShown
        @editor.on 'linesShifted',     @onLinesShifted

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
            
            div = @addLine li
            
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

        # log 'onLinesShifted', oldTop, top, 'bot', oldBot, bot, num
                
        divInto = (li,lo) =>
            return error "no number div? top #{top} bot #{bot} num #{num} lo #{lo} li #{li}" if not @lineDivs[lo]
            @lineDivs[li] = @lineDivs[lo]
            delete @lineDivs[lo]
            @lineDivs[li].firstChild.textContent = li+1
            @updateColor li
        
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

        for li, div of @lineDivs
            y = @editor.size.lineHeight * (li - @editor.scroll.top)
            div.style.transform = "translate3d(0, #{y}px, 0)"
        
    # 000  000   000   0000000  00000000  00000000   000000000  00000000  0000000    
    # 000  0000  000  000       000       000   000     000     000       000   000  
    # 000  000 0 000  0000000   0000000   0000000       000     0000000   000   000  
    # 000  000  0000       000  000       000   000     000     000       000   000  
    # 000  000   000  0000000   00000000  000   000     000     00000000  0000000    
    
    # onLineInserted: (li, oi) =>
#         
        # top = @editor.scroll.top
        # bot = @editor.scroll.bot
#         
        # if top <= oi <= bot
#             
            # for i in [oi..bot]
#                 
                # @updateColor i
                   
                # div.firstChild.textContent = "#{top+i+1}"
                # @emit 'numberChanged', 
                    # numberDiv:  div
                    # numberSpan: div.firstChild
                    # lineIndex:  top+i
#                 
            # i = top+@elem.children.length
#             
            # @elem.appendChild @addLine i
            # @updateColor i

    addLine: (li) ->
        
        div = elem class: "linenumber", child: elem "span", text: "#{li+1}"
        div.style.height = "#{@editor.size.lineHeight}px"
        @lineDivs[li] = div
        @elem.appendChild div
        div
            
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    onClearLines: =>  
        
        @lineDivs = {}
        @elem.innerHTML = ""
            
    # 0000000    00000000  000      00000000  000000000  00000000  0000000    
    # 000   000  000       000      000          000     000       000   000  
    # 000   000  0000000   000      0000000      000     0000000   000   000  
    # 000   000  000       000      000          000     000       000   000  
    # 0000000    00000000  0000000  00000000     000     00000000  0000000    
    
    # onLineDeleted: (li) =>
#         
        # top = @editor.scroll.top
        # if li >= top
            # for i in [li..@editor.scroll.bot]
                # @updateColor li
                # @emit 'numberChanged', 
                    # numberDiv:  div
                    # numberSpan: div.firstChild
                    # lineIndex:  top+i
        # @elem.lastChild?.remove()
                
    # 00000000   0000000   000   000  000000000
    # 000       000   000  0000  000     000   
    # 000000    000   000  000 0 000     000   
    # 000       000   000  000  0000     000   
    # 000        0000000   000   000     000   
        
    onFontSizeChange: =>
        
        if @editor.size.fontSize < 13
            @elem.style.fontSize = "#{@editor.size.fontSize}px"

    #  0000000   0000000   000       0000000   00000000    0000000  
    # 000       000   000  000      000   000  000   000  000       
    # 000       000   000  000      000   000  0000000    0000000   
    # 000       000   000  000      000   000  000   000       000  
    #  0000000   0000000   0000000   0000000   000   000  0000000   
    
    updateColors: =>
        
        if @editor.scroll.bot > @editor.scroll.top
            for li in [@editor.scroll.top..@editor.scroll.bot]
                @updateColor li

    updateColor: (li) =>
        
        si = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.selections())
        hi = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.highlights())
        ci = (s[0] for s in rangesFromTopToBotInRanges li, li, rangesFromPositions @editor.cursors())
            
        return error "updateColor no number div? #{li}" if not @lineDivs[li]?
        cls = ''
        if li in ci
            cls += ' cursored'
        if li == @editor.mainCursor()[1]
            cls += ' main'
        if li in si
            cls += ' selected'
        if li in hi
            cls += ' highligd'            
            
        # console.log "updateColor #{li}", cls, @lineDivs[li].firstChild.textContent
#         
        @lineDivs[li].className = 'linenumber' + cls
                
module.exports = Numbers

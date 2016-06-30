# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 
{
setStyle,
first,
last,
$}  = require '../tools/tools'
log = require '../tools/log'
str = require '../tools/str'
_   = require 'lodash'

class Numbers

    constructor: (@editor) ->
        
        @elem = $(".numbers", @editor.view)
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineInserted',     @onLineInserted
        @editor.on 'lineDeleted',      @onLineDeleted
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'lineExposedTop',   @onLineExposedTop
        @editor.on 'lineVanishedTop',  @onLineVanishedTop
        @editor.on 'exposeTopChanged', @renumber
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        @editor.on 'highlight',        => @updateColors()
        @editor.on 'selection',        => @updateColors()
        @editor.on 'cursors',          => @updateColors()
        @onFontSizeChange()
    
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    updateColors: (top=@editor.scroll.exposeTop, bot=@editor.scroll.exposeBot) =>
        # @log "numbers.updateColors #{top} #{bot}" if @editor.name == 'editor'
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
            # @log "@editor.size.fontSize", @editor.size.fontSize
            @elem.style.fontSize = "#{@editor.size.fontSize}px"
    
    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    onLineExposed: (e) =>
        # @log "numbers.onLineExposed #{@editor.name} #{e.lineIndex}" if @editor.name == 'editor'
        @elem.appendChild @addLine e.lineIndex
        @updateColors e.lineIndex, e.lineIndex
        
    onLineExposedTop: (e) =>
        # @log "numbers.onLineExposedTop #{@editor.name} #{e.lineIndex}" if @editor.name == 'editor'
        @elem.insertBefore @addLine(e.lineIndex), @elem.firstChild
        @updateColors e.lineIndex, e.lineIndex
        
    # 000  000   000   0000000  00000000  00000000   000000000  00000000  0000000  
    # 000  0000  000  000       000       000   000     000     000       000   000
    # 000  000 0 000  0000000   0000000   0000000       000     0000000   000   000
    # 000  000  0000       000  000       000   000     000     000       000   000
    # 000  000   000  0000000   00000000  000   000     000     00000000  0000000  
        
    onLineInserted: (li) => @elem.appendChild @addLine @elem.children.length - @editor.scroll.exposeTop
        
    # 0000000    00000000  000      00000000  000000000  00000000  0000000  
    # 000   000  000       000      000          000     000       000   000
    # 000   000  0000000   000      0000000      000     0000000   000   000
    # 000   000  000       000      000          000     000       000   000
    # 0000000    00000000  0000000  00000000     000     00000000  0000000  
        
    onLineDeleted: (li) =>
        top = @editor.scroll.exposeTop
        bot = @editor.scroll.exposeBot
        if top <= li <= bot+1
            @elem.lastChild.remove()
    
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
        # @log "numbers.addLine #{@editor.name} #{li}" if @editor.name == 'logview'
        div = document.createElement "div"
        div.className = "linenumber"
        pre = document.createElement "span"
        pre.textContent = "#{li+1}"
        div.appendChild pre
        div
        
    # 00000000   00000000  000   000  000   000  00     00  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000   000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  000000000  0000000    0000000   0000000  
    # 000   000  000       000  0000  000   000  000 0 000  000   000  000       000   000
    # 000   000  00000000  000   000   0000000   000   000  0000000    00000000  000   000
        
    renumber: (e) =>
        # @log "numbers.renumber #{@editor.name} from #{e.new} to #{e.new+@elem.children.length-1}" if @editor.name == 'editor'
        li = e.new+1
        for e in @elem.children
            e.firstChild.textContent = "#{li}"
            li += 1
        @updateColors()

    log: -> 
        if @editor.name == 'logview'
            console.log (str(s) for s in [].slice.call arguments, 0).join " "
        else
            log (str(s) for s in [].slice.call arguments, 0).join " "

module.exports = Numbers

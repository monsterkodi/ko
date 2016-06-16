# 000   000  000   000  00     00  0000000    00000000  00000000    0000000
# 0000  000  000   000  000   000  000   000  000       000   000  000     
# 000 0 000  000   000  000000000  0000000    0000000   0000000    0000000 
# 000  0000  000   000  000 0 000  000   000  000       000   000       000
# 000   000   0000000   000   000  0000000    00000000  000   000  0000000 
{
setStyle,
first,
last,
$
}        = require '../tools/tools'
log      = require '../tools/log'

class Numbers

    constructor: (@editor) ->
        
        @elem = $(".numbers")
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'lineExposedTop',   @onLineExposedTop
        @editor.on 'lineVanishedTop',  @onLineVanishedTop
        @editor.on 'exposeTopChanged', @renumber
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        @onFontSizeChange()
        
    onFontSizeChange: => 
        @elem.style.lineHeight = "#{@editor.size.lineHeight}px"        
        if @editor.size.fontSize < 13
            log "@editor.size.fontSize", @editor.size.fontSize
            setStyle '.numbers', 'font-size', "#{@editor.size.fontSize}px"
    
    # 000      000  000   000  00000000  00000000  000   000  00000000    0000000    0000000  00000000  0000000  
    # 000      000  0000  000  000       000        000 000   000   000  000   000  000       000       000   000
    # 000      000  000 0 000  0000000   0000000     00000    00000000   000   000  0000000   0000000   000   000
    # 000      000  000  0000  000       000        000 000   000        000   000       000  000       000   000
    # 0000000  000  000   000  00000000  00000000  000   000  000         0000000   0000000   00000000  0000000  
        
    onLineExposed: (e) =>
        @elem.appendChild @addLine e.lineIndex
        
    onLineExposedTop: (e) =>
        @elem.insertBefore @addLine(e.lineIndex), @elem.firstChild
    
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
        # log 'numbers.addLine', li
        div = document.createElement "div"
        div.className = "linenumber"
        pre = document.createElement "span"
        pre.innerHTML = "#{li}"
        div.appendChild pre
        div
        
    # 00000000   00000000  000   000  000   000  00     00  0000000    00000000  00000000 
    # 000   000  000       0000  000  000   000  000   000  000   000  000       000   000
    # 0000000    0000000   000 0 000  000   000  000000000  0000000    0000000   0000000  
    # 000   000  000       000  0000  000   000  000 0 000  000   000  000       000   000
    # 000   000  00000000  000   000   0000000   000   000  0000000    00000000  000   000
        
    renumber: (e) =>
        li = e.new # +1
        for e in @elem.children
            e.firstChild.innerHTML = "#{li}"
            li += 1

module.exports = Numbers

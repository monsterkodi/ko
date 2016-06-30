# 00     00  00000000  000000000   0000000 
# 000   000  000          000     000   000
# 000000000  0000000      000     000000000
# 000 0 000  000          000     000   000
# 000   000  00000000     000     000   000
{
setStyle,
first,
last,
$}  = require '../tools/tools'
log = require '../tools/log'
str = require '../tools/str'
_   = require 'lodash'

class Meta
    
    constructor: (@editor) ->
        
        @metas = [] # [lineIndex, [start, end], {href: ...}]
        @elem = $(".meta", @editor.view)
        @editor.on 'lineAppended',     @onLineAppended
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineInserted',     @onLineInserted
        @editor.on 'willDeleteLine',   @onWillDeleteLine
        @editor.on 'lineDeleted',      @onLineDeleted
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'lineExposedTop',   @onLineExposedTop
        @editor.on 'lineVanishedTop',  @onLineVanishedTop
        @editor.on 'exposeTopChanged', @onExposeTopChanged
        @editor.on 'fontSizeChanged',  @onFontSizeChange

    # 0000000    000  000   000
    # 000   000  000  000   000
    # 000   000  000   000 000 
    # 000   000  000     000   
    # 0000000    000      0    

    addDiv: (meta) ->
        size = @editor.size
        sw = size.charWidth * (meta[1][1]-meta[1][0])
        tx = size.charWidth *  meta[1][0] + size.offsetX
        ty = size.lineHeight * (meta[0] - @editor.scroll.exposeTop)
        lh = size.lineHeight
        
        div = document.createElement 'div'
        div.className = "meta"
        div.style.transform = "translate(#{tx}px,#{ty}px)"
        div.style.width = "#{sw}px"
        div.style.height = "#{lh}px"
        if meta[2].href?
            log "meta[2].href #{meta[2].href}"
            div.setAttribute 'onclick', "window.loadFile('#{meta[2].href}');" 
            div.classList.add 'href'
        @elem.appendChild div
        if meta.div? # todo remove
            log "meta.addDiv wtf? li #{meta[0]}"
            meta.div.remove()
        meta.div = div
        
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
    
    append: (meta) -> @metas.push [@editor.lines.length, [0, 0], meta]
    
    #  0000000   00000000   00000000   00000000  000   000  0000000    00000000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000  000       000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000  0000000   000   000
    # 000   000  000        000        000       000  0000  000   000  000       000   000
    # 000   000  000        000        00000000  000   000  0000000    00000000  0000000  
        
    onLineAppended: (e) =>        
        for meta in @metasAtLineIndex e.lineIndex
            meta[1][1] = e.text.length if meta[1][1] is 0
                
    metasAtLineIndex: (li) -> @editor.rangesForLineIndexInRanges li, @metas

    # 00000000   0000000   000   000  000000000   0000000  000  0000000  00000000
    # 000       000   000  0000  000     000     000       000     000   000     
    # 000000    000   000  000 0 000     000     0000000   000    000    0000000 
    # 000       000   000  000  0000     000          000  000   000     000     
    # 000        0000000   000   000     000     0000000   000  0000000  00000000
        
    onFontSizeChange: => log "meta.onFontSizeChange"

    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    onLineExposed: (e) =>
        for meta in @metasAtLineIndex e.lineIndex
            @addDiv meta
        
    onLineExposedTop: (e) => @onLineExposed e
    
    onExposeTopChanged: (e) => @updatePositionsBelowLineIndex e.new
        
    updatePositionsBelowLineIndex: (li) ->      
        size = @editor.size
        for meta in @editor.rangesFromTopToBotInRanges li, @editor.scroll.exposeBot, @metas
            tx = size.charWidth *  meta[1][0] + size.offsetX
            ty = size.lineHeight * (meta[0] - @editor.scroll.exposeTop)
            meta.div?.style.transform = "translate(#{tx}px,#{ty}px)"        
        
    # 000  000   000   0000000  00000000  00000000   000000000  00000000  0000000  
    # 000  0000  000  000       000       000   000     000     000       000   000
    # 000  000 0 000  0000000   0000000   0000000       000     0000000   000   000
    # 000  000  0000       000  000       000   000     000     000       000   000
    # 000  000   000  0000000   00000000  000   000     000     00000000  0000000  
        
    onLineInserted: (li) => 
        for meta in @editor.rangesFromTopToBotInRanges li+1, @editor.lines.length, @metas
            meta[0] += 1
        @updatePositionsBelowLineIndex li
        
    # 0000000    00000000  000      00000000  000000000  00000000  0000000  
    # 000   000  000       000      000          000     000       000   000
    # 000   000  0000000   000      0000000      000     0000000   000   000
    # 000   000  000       000      000          000     000       000   000
    # 0000000    00000000  0000000  00000000     000     00000000  0000000  
    
    onWillDeleteLine: (li) => log "meta.onWillDeleteLine li #{li}"    
    onLineDeleted: (li) => 
        @onLineVanished lineIndex: li
        _.pullAll @metas, @metasAtLineIndex li
        for meta in @editor.rangesFromTopToBotInRanges li+1, @editor.lines.length, @metas
            meta[0] -= 1
        @updatePositionsBelowLineIndex li
    
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000

    onLineVanishedTop: (e) => 
        @onLineVanished e
        @updatePositionsBelowLineIndex e.lineIndex
        
    onLineVanished:    (e) => 
        for meta in @metasAtLineIndex e.lineIndex
            meta.div?.remove()
            meta.div = null        
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
            
    onClearLines: => 
        @elem.innerHTML = ""
        for meta in @metas
            meta.div = null
    
module.exports = Meta

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
        @editor.on 'changed',          @onChanged
        @editor.on 'lineAppended',     @onLineAppended
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineInserted',     @onLineInserted
        @editor.on 'lineDeleted',      @onLineDeleted
        @editor.on 'lineExposed',      @onLineExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'lineExposedTop',   @onLineExposedTop
        @editor.on 'lineVanishedTop',  @onLineVanishedTop
        @editor.on 'exposeTopChanged', @onExposeTopChanged
        @editor.on 'fontSizeChanged',  @onFontSizeChange
        
        @editor.numbers.on 'numberAdded',   @onNumber
        @editor.numbers.on 'numberChanged', @onNumber

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    onChanged: (changeInfo, action) =>
        # log "meta.onChanged", action
        return if not changeInfo.sorted.length
        return if not action.lines.length
        for change in action.lines
            for meta in @metasAtLineIndex change.index
                if meta[2].clss == "searchResult"
                    [file, line] = meta[2].href.split(':')
                    line -= 1
                    lineChange = _.clone change
                    lineChange.index = line
                    @editor.emit 'fileLineChange', file, lineChange

    # 000   000  000   000  00     00  0000000    00000000  00000000 
    # 0000  000  000   000  000   000  000   000  000       000   000
    # 000 0 000  000   000  000000000  0000000    0000000   0000000  
    # 000  0000  000   000  000 0 000  000   000  000       000   000
    # 000   000   0000000   000   000  0000000    00000000  000   000
    
    onNumber: (e) =>
        metas = @metasAtLineIndex e.lineIndex
        # log "meta.onNumber li #{e.lineIndex} num metas #{metas.length}" if metas.length
        for meta in metas
            # log "meta.onNumber", meta[2].clss
            switch meta[2].clss
                # when 'salt', 'spacer' then e.numberSpan.innerHTML = '&nbsp;'
                when 'searchResult'
                    e.numberSpan.textContent = meta[2].href.split(':')[1]
                else
                    e.numberSpan.innerHTML = '&nbsp;'

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
        div.className = "meta #{meta[2].clss ? ''}"
        div.style.transform = "translate(#{tx}px,#{ty}px)"
        div.style.width = "#{sw}px"
        div.style.height = "#{lh}px"
        if meta[2].href?
            div.setAttribute 'onclick', "window.loadFile('#{meta[2].href}');" 
            div.classList.add 'href'
        @elem.appendChild div
        if meta[2].div? # todo remove
            log "meta.addDiv wtf? li #{meta[0]}"
            meta[2].div.remove()
        meta[2].div = div
        
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
    hrefAtLineIndex:  (li) -> 
        for meta in @metasAtLineIndex li
            return meta[2].href if meta[2].href?

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
            meta[2].div?.style.transform = "translate(#{tx}px,#{ty}px)"        
        
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
    
    # onWillDeleteLine: (li) => #log "meta.onWillDeleteLine li #{li}"    
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
            meta[2].div?.remove()
            meta[2].div = null        
    
    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000
          
    clear: => 
        @elem.innerHTML = ""
        @metas = []
        
    onClearLines: => 
        @elem.innerHTML = ""
        for meta in @metas
            meta[2].div = null
    
module.exports = Meta

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
fs  = require 'fs'

class Meta 
    
    constructor: (@editor) ->
        
        @metas = [] # [lineIndex, [start, end], {href: ...}]
        @elem = $(".meta", @editor.view)
        @editor.on 'changed',          @onChanged
        @editor.on 'lineAppended',     @onLineAppended
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineInserted',     @onLineInserted
        @editor.on 'willDeleteLine',   @onWillDeleteLine
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
        return if not changeInfo.changed.length
        for li in changeInfo.changed
            for meta in @metasAtLineIndex li
                if meta[2].clss == "searchResult"
                    [file, line] = meta[2].href.split(':')
                    line -= 1
                    change = (a for a in action.lines when a.index == li)[0]
                    lineChange = 
                        before: change.before
                        after: change.after
                        index: line
                    @editor.emit 'fileLineChange', file, lineChange
                    meta[2].state = 'unsaved'
                    if meta[2].span?
                        button = @saveButton li
                        if not meta[2].span.innerHTML.startsWith "<span"
                            meta[2].span.innerHTML = button
                    else 
                        log "no span?"
         
    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000
         
    saveFileLineMetas: (file, lineMetas) ->
        # log "Meta.saveFileLineMetas file:#{file} lineMetas:", lineMetas
        log "Meta.saveFileLineMetas file:#{file}"
        fs.readFile file, encoding: 'utf8', (err, data) =>
            if err?
                log "Meta.saveFileLineMetas readFile err:#{err}"
                return
            lines = data.split /\r?\n/
            log "Meta.saveFileLineMetas 1 lines:", lines
            for lineMeta in lineMetas
                lines[lineMeta[0]] = lineMeta[1]
            log "Meta.saveFileLineMetas 2 lines:", lines
            data = lines.join '\n'
            fs.writeFile file, data, encoding: 'utf8', (err) =>
                if err?
                    log "Meta.saveFileLineMetas writeFile err:#{err}"
                    return
                for lineMeta in lineMetas
                    meta = lineMeta[2]
                    delete meta[2].state
                    meta[2].span.innerHTML = lineMeta[0]+1
                    
    saveLine: (li) -> 
        for meta in @metasAtLineIndex li
            if meta[2].state == 'unsaved'
                [file, line] = meta[2].href.split(':')
                @saveFileLineMetas file, [[line-1, @editor.lines[meta[0]], meta]]

    saveChanges: ->
        fileLineMetas = {}
        for meta in @metas
            if meta[2].state == 'unsaved'
                [file, line] = meta[2].href.split(':')
                fileLineMetas[file] = [] if not fileLineMetas[file]?
                fileLineMetas[file].push [line-1, @editor.lines[meta[0]], meta]

        for file, lineMetas of fileLineMetas
            @saveFileLineMetas file, lineMetas
        
        fileLineMetas.length
        
    saveButton: (li) ->
        "<span class=\"saveButton\" onclick=\"window.terminal.meta.saveLine(#{li});\">&#128190;</span>"
                    
    # 000   000  000   000  00     00  0000000    00000000  00000000 
    # 0000  000  000   000  000   000  000   000  000       000   000
    # 000 0 000  000   000  000000000  0000000    0000000   0000000  
    # 000  0000  000   000  000 0 000  000   000  000       000   000
    # 000   000   0000000   000   000  0000000    00000000  000   000
    
    onNumber: (e) =>
        metas = @metasAtLineIndex e.lineIndex
        for meta in metas
            meta[2].span = e.numberSpan
            switch meta[2].clss
                when 'searchResult', 'termCommand', 'termResult', 'coffeeCommand', 'coffeeResult'
                    num = meta[2].state == 'unsaved' and @saveButton(meta[0]) 
                    num = meta[2].line? and meta[2].line if not num
                    num = meta[2].href?.split(':')[1] if not num
                    num = '?' if not num 
                    e.numberSpan.innerHTML = num
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
            div.addEventListener 'mousedown', @onClick
            div.href = meta[2].href
            div.classList.add 'href'
        else if meta[2].cmmd?
            div.addEventListener 'mousedown', @onClick
            div.cmmd = meta[2].cmmd
            div.classList.add 'cmmd'
        @elem.appendChild div
        meta[2].div = div
    
    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000 
    # 000       000      000  000       0000000  
    # 000       000      000  000       000  000 
    #  0000000  0000000  000   0000000  000   000
    
    onClick: (event) =>
        if not event.altKey
            if event.target.href?
                log "event.target.href:#{event.target.href}"
                split = event.target.href.split(':')
                if split.length == 1 or _.isFinite split[1]
                    window.loadFile event.target.href
                else
                    if window.commandline.commands[split[0]]?
                        command = window.commandline.commands[split[0]]
                        window.commandline.startCommand split[0], command.shortcuts[0]
                        window.commandline.setText split[1]
                        command.execute split[1]
            else if event.target.cmmd?
                window.commandline.commands.term.execute event.target.cmmd
        
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
    
    onWillDeleteLine: (li) => 
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

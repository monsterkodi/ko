# 00     00  00000000  000000000   0000000 
# 000   000  000          000     000   000
# 000000000  0000000      000     000000000
# 000 0 000  000          000     000   000
# 000   000  00000000     000     000   000

{ error, log, elem, post, fs, $, _
}      = require 'kxk'
ranges = require '../tools/ranges'

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
        @editor.on 'linesExposed',     @onLinesExposed
        @editor.on 'lineVanished',     @onLineVanished
        @editor.on 'exposeTopChanged', @onExposeTopChanged
        
        @editor.numbers.on 'numberAdded',   @onNumber
        @editor.numbers.on 'numberChanged', @onNumber

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    onChanged: (changeInfo) =>
        
        for change in changeInfo.changes
            li = change.oldIndex            
            continue if change.change == 'deleted'
            for meta in @metasAtLineIndex li
                if meta[2].clss == "searchResult" and meta[2].href?
                    [file, line] = meta[2].href.split ':' 
                    line -= 1
                    localChange = _.cloneDeep change
                    localChange.oldIndex = line
                    localChange.newIndex = line
                    localChange.doIndex  = line
                    localChange.after    = @editor.line(meta[0])
                    @editor.emit 'fileLineChange', file, localChange
                    meta[2].state = 'unsaved'
                    if meta[2].span?
                        button = @saveButton li
                        if not meta[2].span.innerHTML.startsWith "<span"
                            meta[2].span.innerHTML = button
         
    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000     
    # 0000000   000000000   000 000   0000000 
    #      000  000   000     000     000     
    # 0000000   000   000      0      00000000
         
    saveFileLineMetas: (file, lineMetas) ->
        
        fs.readFile file, encoding: 'utf8', (err, data) ->
            if err? then return error "Meta.saveFileLineMetas -- readFile err:#{err}"
            lines = data.split /\r?\n/
            for lineMeta in lineMetas
                lines[lineMeta[0]] = lineMeta[1]
            data = lines.join '\n'
            fs.writeFile file, data, encoding: 'utf8', (err) ->
                if err? then return error "Meta.saveFileLineMetas -- writeFile err:#{err}"
                for lineMeta in lineMetas
                    meta = lineMeta[2]
                    delete meta[2].state
                    meta[2].span.innerHTML = lineMeta[0]+1
                post.emit 'search-saved', file
                    
    saveLine: (li) -> 
        
        for meta in @metasAtLineIndex li
            if meta[2].state == 'unsaved'
                [file, line] = meta[2].href.split(':')
                @saveFileLineMetas file, [[line-1, @editor.line(meta[0]), meta]]

    saveChanges: ->
        
        fileLineMetas = {}
        for meta in @metas
            if meta[2].state == 'unsaved'
                [file, line] = meta[2].href.split(':')
                fileLineMetas[file] = [] if not fileLineMetas[file]?
                fileLineMetas[file].push [line-1, @editor.line(meta[0]), meta]

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
                    
    setMetaPos: (meta, tx, ty) ->
        if meta[2].diff
            meta[2].div?.style.transform = "translateY(#{ty}px)"        
        else
            meta[2].div?.style.transform = "translate(#{tx}px,#{ty}px)"        

    # 0000000    000  000   000
    # 000   000  000  000   000
    # 000   000  000   000 000 
    # 000   000  000     000   
    # 0000000    000      0    

    addDiv: (meta) ->
        # console.log 'addDiv', meta
        size = @editor.size
        sw = size.charWidth * (meta[1][1]-meta[1][0])
        tx = size.charWidth *  meta[1][0] + size.offsetX
        ty = size.lineHeight * (meta[0] - @editor.scroll.exposeTop)
        lh = size.lineHeight
        
        div = elem class: "meta #{meta[2].clss ? ''}"
        meta[2].div = div
        div.style.height = "#{lh}px"  
        
        @setMetaPos meta, tx, ty

        if not meta[2].diff
            div.style.width = "#{sw}px"
            if meta[2].href?
                div.addEventListener 'mousedown', @onClick
                div.href = meta[2].href
                div.classList.add 'href'
            else if meta[2].cmmd?
                div.addEventListener 'mousedown', @onClick
                div.cmmd = meta[2].cmmd
                div.classList.add 'cmmd'
            else if meta[2].list?
                div.addEventListener 'mousedown', @onClick
                div.list = meta[2].list
                div.classList.add 'cmmd'
            
        @elem.appendChild div
    
    # 0000000    000  00000000  00000000  
    # 000   000  000  000       000       
    # 000   000  000  000000    000000    
    # 000   000  000  000       000       
    # 0000000    000  000       000       
    
    addDiffMeta: (meta) ->
        meta.diff = true
        lineMeta = [meta.line, [0, 0], meta]
        @metas.push lineMeta
        @addDiv lineMeta

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000 
    # 000       000      000  000       0000000  
    # 000       000      000  000       000  000 
    #  0000000  0000000  000   0000000  000   000
    
    onClick: (event) ->
        
        if not event.altKey
            if event.target.href?
                split = event.target.href.split ':'
                if split.length == 1 or _.isFinite parseInt split[1]
                    window.loadFile event.target.href
                else
                    if window.commandline.commands[split[0]]?
                        command = window.commandline.commands[split[0]]
                        window.commandline.startCommand split[0], command.shortcuts[0]
                        window.commandline.setText split[1]
                        command.execute split[1]
            else if event.target.cmmd?
                window.commandline.commands.term.execute event.target.cmmd
            else if event.target.list?
                window.commandline.command.listClick event.target.list
        
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
    
    append: (meta) -> @metas.push [@editor.numLines(), [0, 0], meta]
    
    onLineAppended: (e) =>  
        for meta in @metasAtLineIndex e.lineIndex
            meta[1][1] = e.text.length if meta[1][1] is 0
                
    metasAtLineIndex: (li) -> rangesForLineIndexInRanges li, @metas
    hrefAtLineIndex:  (li) -> 
        for meta in @metasAtLineIndex li
            return meta[2].href if meta[2].href?

    # 00000000  000   000  00000000    0000000    0000000  00000000
    # 000        000 000   000   000  000   000  000       000     
    # 0000000     00000    00000000   000   000  0000000   0000000 
    # 000        000 000   000        000   000       000  000     
    # 00000000  000   000  000         0000000   0000000   00000000
        
    onLineExposed: (e) =>
        for meta in @metasAtLineIndex e.lineIndex
            @addDiv meta
        
    onLinesExposed: (e) => 
        @updatePositionsBelowLineIndex e.top
        
    onExposeTopChanged: (e) => @updatePositionsBelowLineIndex e.new
        
    updatePositionsBelowLineIndex: (li) ->   
        
        size = @editor.size
        for meta in rangesFromTopToBotInRanges li, @editor.scroll.exposeBot, @metas
            tx = size.charWidth *  meta[1][0] + size.offsetX
            ty = size.lineHeight * (meta[0] - @editor.scroll.exposeTop)
            @setMetaPos meta, tx, ty
        
    onLineInserted: (li) => 
        
        for meta in rangesFromTopToBotInRanges li+1, @editor.numLines(), @metas
            meta[0] += 1
        @updatePositionsBelowLineIndex li
        
    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000

    onWillDeleteLine: (li) => 
        
        for meta in @metasAtLineIndex li
            meta[2].div?.remove()
            meta[2].div = null
        
        _.pullAll @metas, @metasAtLineIndex li
        
        for meta in rangesFromTopToBotInRanges li+1, @editor.numLines(), @metas
            meta[0] -= 1
            
        @updatePositionsBelowLineIndex li
    
    onLineVanished: (e) => 
        
        for meta in @metasAtLineIndex e.lineIndex
            meta[2].div?.remove()
            meta[2].div = null
        @updatePositionsBelowLineIndex e.lineIndex
    
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

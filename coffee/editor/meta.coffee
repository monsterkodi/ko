###
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
###

{ post, stopEvent, slash, empty, elem, fs, sw, kerror, $, _ } = require 'kxk'

ranges = require '../tools/ranges'
File   = require '../tools/file'

class Meta

    @: (@editor) ->

        @metas     = [] # [ [lineIndex, [start, end], {href: ...}], ... ]
        @lineMetas = {} # { lineIndex: [ lineMeta, ... ], ... }

        @elem =$ ".meta" @editor.view

        @editor.on 'changed'          @onChanged
        @editor.on 'lineAppended'     @onLineAppended
        @editor.on 'clearLines'       @onClearLines
        @editor.on 'lineInserted'     @onLineInserted
        @editor.on 'lineDeleted'      @onLineDeleted

        @editor.on 'linesShown'       @onLinesShown
        @editor.on 'linesShifted'     @onLinesShifted

        if @editor.numbers?
            @editor.numbers.on 'numberAdded'   @onNumber
            @editor.numbers.on 'numberChanged' @onNumber

        @elem.addEventListener 'mousedown' @onMouseDown

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
                    [file, line] = slash.splitFileLine meta[2].href
                    line -= 1
                    localChange = _.cloneDeep change
                    localChange.oldIndex = line
                    localChange.newIndex = line
                    localChange.doIndex  = line
                    localChange.after    = @editor.line(meta[0])
                    @editor.emit 'fileSearchResultChange', file, localChange
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
            if err? then return kerror "Meta.saveFileLineMetas -- readFile err:#{err}"
            lines = data.split /\r?\n/
            for lineMeta in lineMetas
                lines[lineMeta[0]] = lineMeta[1]
            data = lines.join '\n'
            
            File.save file, data, (err, file) ->
                if err? then return kerror "Meta.saveFileLineMetas -- writeFile err:#{err}"
                for lineMeta in lineMetas
                    meta = lineMeta[2]
                    delete meta[2].state
                    meta[2].span?.innerHTML = lineMeta[0]+1
                post.emit 'search-saved', file

    saveLine: (li) ->
        
        for meta in @metasAtLineIndex li
            if meta[2].state == 'unsaved'
                [file, line] = slash.splitFileLine meta[2].href
                break
                
        if file
            fileLineMetas = {}
            for meta in @metas
                if meta[2].state == 'unsaved'
                    [mfile, line] = slash.splitFileLine meta[2].href
                    if mfile == file
                        fileLineMetas[mfile] ?= []
                        fileLineMetas[mfile].push [line-1, @editor.line(meta[0]), meta]
               
            for file, lineMetas of fileLineMetas
                @saveFileLineMetas file, lineMetas

    saveChanges: ->

        fileLineMetas = {}
        for meta in @metas
            if meta[2].state == 'unsaved'
                [file, line] = slash.splitFileLine meta[2].href
                fileLineMetas[file] ?= []
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
            e.numberSpan.className = ''
            e.numberSpan.parentNode.className = 'linenumber'
            switch meta[2].clss
                when 'searchResult' 'termCommand' 'termResult' 'coffeeCommand' 'coffeeResult' 'commandlistItem' 'gitInfoFile'
                    num = meta[2].state == 'unsaved' and @saveButton(meta[0])
                    num = meta[2].line? and meta[2].line if not num
                    num = slash.splitFileLine(meta[2].href)[1] if not num
                    num = '?' if not num
                    e.numberSpan.parentNode.className = 'linenumber ' + meta[2].lineClss if meta[2].lineClss?
                    e.numberSpan.className = meta[2].lineClss if meta[2].lineClss?
                    e.numberSpan.innerHTML = num
                when 'spacer'
                    e.numberSpan.innerHTML = '&nbsp;'

    #  0000000  00000000  000000000        00000000    0000000    0000000
    # 000       000          000           000   000  000   000  000
    # 0000000   0000000      000           00000000   000   000  0000000
    #      000  000          000           000        000   000       000
    # 0000000   00000000     000           000         0000000   0000000

    setMetaPos: (meta, tx, ty) ->

        if meta[2].no_x
            meta[2].div?.style.transform = "translateY(#{ty}px)"
        else
            meta[2].div?.style.transform = "translate(#{tx}px,#{ty}px)"

    updatePos: (meta) ->
        
        size = @editor.size
        tx = size.charWidth *  meta[1][0] + size.offsetX + (meta[2].xOffset ? 0)
        ty = size.lineHeight * (meta[0] - @editor.scroll.top) + (meta[2].yOffset ? 0)
        @setMetaPos meta, tx, ty
            
    #  0000000   0000000    0000000          0000000    000  000   000
    # 000   000  000   000  000   000        000   000  000  000   000
    # 000000000  000   000  000   000        000   000  000   000 000
    # 000   000  000   000  000   000        000   000  000     000
    # 000   000  0000000    0000000          0000000    000      0

    addDiv: (meta) ->

        size = @editor.size
        sw = size.charWidth * (meta[1][1]-meta[1][0])
        lh = size.lineHeight

        div = elem class: "meta #{meta[2].clss ? ''}"
        div.innerHTML = meta[2].html if meta[2].html?

        meta[2].div = div
        div.meta = meta

        div.classList.add 'toggled' if meta[2].toggled # git change toggled
        
        if not meta[2].no_h
            div.style.height = "#{lh}px"

        if meta[2].style?
            for k,v of meta[2].style
                div.style[k] = v

        if not meta[2].no_x
            div.style.width = "#{sw}px"

        @elem.appendChild div

        @updatePos meta

    # 0000000    00000000  000           0000000    000  000   000
    # 000   000  000       000           000   000  000  000   000
    # 000   000  0000000   000           000   000  000   000 000
    # 000   000  000       000           000   000  000     000
    # 0000000    00000000  0000000       0000000    000      0

    delDiv: (meta) ->

        return kerror 'no line meta?' meta if not meta?[2]?
        meta[2].div?.remove()
        meta[2].div = null

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000
    #    000     0000000     00000       000
    #    000     000        000 000      000
    #    000     00000000  000   000     000

    add: (meta) ->

        lineMeta = @addLineMeta [meta.line, [meta.start, meta.end], meta]

        if @editor.scroll.top <= meta.line <= @editor.scroll.bot
            @addDiv lineMeta

    # 0000000    000  00000000  00000000
    # 000   000  000  000       000
    # 000   000  000  000000    000000
    # 000   000  000  000       000
    # 0000000    000  000       000

    addDiffMeta: (meta) ->

        meta.diff = true
        @addNumberMeta meta

    addNumberMeta: (meta) ->

        meta.no_x = true
        lineMeta = @addLineMeta [meta.line, [0, 0], meta]

        if @editor.scroll.top <= meta.line <= @editor.scroll.bot
            @addDiv lineMeta

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    onMouseDown: (event) ->
        
        if event.target.meta?[2].click?
            result = event.target.meta?[2].click event.target.meta, event
            stopEvent event if result != 'unhandled'

    #  0000000   00000000   00000000   00000000  000   000  0000000
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000

    append: (meta) ->
        
        lineMeta = @addLineMeta [@editor.numLines(), [0, 0], meta]
        lineMeta

    addLineMeta: (lineMeta) ->
        
        return kerror 'invalid line meta?', lineMeta if not lineMeta?[2]?
        
        @lineMetas[lineMeta[0]] ?= []
        @lineMetas[lineMeta[0]].push lineMeta
        @metas.push lineMeta
        lineMeta

    moveLineMeta: (lineMeta, d) ->

        return kerror 'invalid move?', lineMeta, d if not lineMeta? or d == 0
        
        _.pull @lineMetas[lineMeta[0]], lineMeta
        delete @lineMetas[lineMeta[0]] if empty @lineMetas[lineMeta[0]]
        lineMeta[0] += d
        @lineMetas[lineMeta[0]] ?= []
        @lineMetas[lineMeta[0]].push lineMeta
        @updatePos lineMeta
        
    onLineAppended: (e) =>

        for meta in @metasAtLineIndex e.lineIndex
            meta[1][1] = e.text.length if meta[1][1] is 0

    metasAtLineIndex: (li) -> @lineMetas[li] ? []
        
    hrefAtLineIndex:  (li) ->

        for meta in @metasAtLineIndex li
            return meta[2].href if meta[2].href?

    #  0000000  000   000   0000000   000   000  000   000
    # 000       000   000  000   000  000 0 000  0000  000
    # 0000000   000000000  000   000  000000000  000 0 000
    #      000  000   000  000   000  000   000  000  0000
    # 0000000   000   000   0000000   00     00  000   000

    onLinesShown: (top, bot, num) =>
        
        for meta in @metas
            @delDiv meta
            if top <= meta[0] <= bot
                @addDiv meta

    #  0000000  000   000  000  00000000  000000000  00000000  0000000
    # 000       000   000  000  000          000     000       000   000
    # 0000000   000000000  000  000000       000     0000000   000   000
    #      000  000   000  000  000          000     000       000   000
    # 0000000   000   000  000  000          000     00000000  0000000

    onLinesShifted: (top, bot, num) =>

        if num > 0
            for meta in rangesFromTopToBotInRanges top-num, top-1, @metas
                @delDiv meta

            for meta in rangesFromTopToBotInRanges bot-num+1, bot, @metas
                @addDiv meta
        else

            for meta in rangesFromTopToBotInRanges bot+1, bot-num, @metas
                @delDiv meta

            for meta in rangesFromTopToBotInRanges top, top-num-1, @metas
                @addDiv meta

        @updatePositionsBelowLineIndex top

    updatePositionsBelowLineIndex: (li) ->

        size = @editor.size
        for meta in rangesFromTopToBotInRanges li, @editor.scroll.bot, @metas
            @updatePos meta

    onLineInserted: (li) =>

        for meta in rangesFromTopToBotInRanges li, @editor.numLines(), @metas
            @moveLineMeta meta, 1

        @updatePositionsBelowLineIndex li

    # 0000000    00000000  000      00000000  000000000  00000000  0000000    
    # 000   000  000       000      000          000     000       000   000  
    # 000   000  0000000   000      0000000      000     0000000   000   000  
    # 000   000  000       000      000          000     000       000   000  
    # 0000000    00000000  0000000  00000000     000     00000000  0000000    
    
    onLineDeleted: (li) =>

        while meta = _.last @metasAtLineIndex li
            @delMeta meta

        for meta in rangesFromTopToBotInRanges li, @editor.numLines(), @metas
            @moveLineMeta meta, -1

        @updatePositionsBelowLineIndex li

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    onClearLines: =>

        for meta in @metas
            @delDiv meta
        @metas     = []
        @lineMetas = {}
        @elem.innerHTML = ""

    clear: =>

        @elem.innerHTML = ""
        @metas = []
        @lineMetas = {}

    delMeta: (meta) ->
        if not meta?
            return kerror 'del no meta?'
        _.pull @lineMetas[meta[0]], meta
        _.pull @metas, meta
        @delDiv meta

    delClass: (clss) ->

        for meta in _.clone @metas
            clsss = meta?[2]?.clss?.split ' '
            if not empty(clsss) and clss in clsss
                @delMeta meta

module.exports = Meta

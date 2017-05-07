
# 0000000    000  00000000  00000000  0000000     0000000   00000000
# 000   000  000  000       000       000   000  000   000  000   000
# 000   000  000  000000    000000    0000000    000000000  0000000
# 000   000  000  000       000       000   000  000   000  000   000
# 0000000    000  000       000       0000000    000   000  000   000

{ packagePath, fileExists, elem, str, empty, post, path, fs, log, error,
} = require 'kxk'
gitWatch = require '../tools/gitwatch'
lineDiff = require '../tools/linediff'
forkfunc = require 'fork-func'

class Diffbar

    constructor: (@editor) ->

        @elem = elem 'canvas', class: 'diffbar'
        @elem.style.position = 'absolute'
        @elem.style.left = '0'
        @elem.style.top  = '0'
        @editor.view.appendChild @elem
        @editor.on 'file', @onEditorFile

        gitWatch.watch @editor.currentFile
        post.on 'gitRefChanged', @update

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    onMetaClick: (meta, event) =>

        return 'unhandled' if event.metaKey

        if event.ctrlKey
            @editor.singleCursorAtPos rangeStartPos meta
            @editor.toggleGitChangesInLines [meta[0]]
        else
            blockIndices = @lineIndicesForBlockAtLine meta[0]
            @editor.do.start()
            @editor.do.setCursors blockIndices.map (i) -> [0,i]
            @editor.do.end()
            @editor.toggleGitChangesInLines blockIndices

    gitMetasAtLineIndex: (li) ->

        @editor.meta.metasAtLineIndex(li).filter (m) -> m[2].clss.startsWith 'git'

    # 000  000   000  0000000    000   0000000  00000000   0000000
    # 000  0000  000  000   000  000  000       000       000
    # 000  000 0 000  000   000  000  000       0000000   0000000
    # 000  000  0000  000   000  000  000       000            000
    # 000  000   000  0000000    000   0000000  00000000  0000000

    lineIndicesForBlockAtLine: (li) ->

        lines = []
        if not empty metas = @gitMetasAtLineIndex li

            toggled = metas[0][2].toggled
            lines.push li

            bi = li-1
            while not empty metas = @gitMetasAtLineIndex bi
                break if metas[0][2].toggled != toggled
                lines.unshift bi
                bi--

            ai = li+1
            while not empty metas = @gitMetasAtLineIndex ai
                break if metas[0][2].toggled != toggled
                lines.push ai
                ai++
        lines

    # 00     00  00000000  000000000   0000000    0000000
    # 000   000  000          000     000   000  000
    # 000000000  0000000      000     000000000  0000000
    # 000 0 000  000          000     000   000       000
    # 000   000  00000000     000     000   000  0000000

    updateMetas: ->

        @clearMetas()

        return if not @changes

        for change in @changes.changes

            li = change.line-1

            if change.mod?

                for mod in change.mod
                    meta =
                        line: li
                        clss: 'git mod' + (@isBoring(change) and ' boring' or '')
                        change: mod
                        click: @onMetaClick
                    @editor.meta.addDiffMeta meta
                    li++

            if change.add?

                for add in change.add
                    meta =
                        line: li
                        clss: 'git add' + (@isBoring(change) and ' boring' or '')
                        change: add
                        click: @onMetaClick

                    @editor.meta.addDiffMeta meta
                    li++

            else if change.del?

                meta =
                    line: li
                    clss: 'git del' + (@isBoring(change) and ' boring' or '')
                    change: change.del
                    click: @onMetaClick
                @editor.meta.addDiffMeta meta

    # 0000000     0000000   00000000   000  000   000   0000000
    # 000   000  000   000  000   000  000  0000  000  000
    # 0000000    000   000  0000000    000  000 0 000  000  0000
    # 000   000  000   000  000   000  000  000  0000  000   000
    # 0000000     0000000   000   000  000  000   000   0000000

    isBoring: (change) ->

        if change.mod?
            for c in change.mod
                return false if not lineDiff.isBoring c.old, c.new

        if change.add?
            for c in change.add
                return false if not empty c.new.trim()

        if change.del?
            for c in change.del
                return false if not empty c.old.trim()

        log 'isBoring', JSON.stringify change
        true

    # 00000000  000  000      00000000
    # 000       000  000      000
    # 000000    000  000      0000000
    # 000       000  000      000
    # 000       000  0000000  00000000

    onEditorFile: =>

        gitWatch.watch @editor.currentFile
        @update()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: =>

        if @editor.currentFile

            forkfunc '../tools/gitdiff', @editor.currentFile, (err, changes) =>
                if not empty err
                    @changes = null
                    return
                if changes.file == @editor.currentFile
                    @changes = changes
                    log 'update changes:', changes
                    @paint()

        else
            @changes = null
            @paint()

    # 00000000    0000000   000  000   000  000000000
    # 000   000  000   000  000  0000  000     000
    # 00000000   000000000  000  000 0 000     000
    # 000        000   000  000  000  0000     000
    # 000        000   000  000  000   000     000

    paint: =>

        @updateMetas()

        w  = 2
        h  = Math.min @editor.scroll.fullHeight, @editor.view.clientHeight
        lh = h / @editor.numLines()

        ctx = @elem.getContext '2d'
        @elem.width  = w
        @elem.height = h

        alpha = (o) -> 0.5 + Math.max 0, (16-o*lh)*(0.5/16)

        if @changes

            for change in @changes.changes

                li = change.line - 1

                if change.mod?
                    o = change.mod.length
                    ctx.fillStyle = @isBoring(change) and "rgba(50,50,50,#{alpha o})" or "rgba(0,255,0,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh
                    li += o

                if change.del?
                    o = 1
                    ctx.fillStyle = @isBoring(change) and "rgba(50,50,50,#{alpha o})" or "rgba(255,0,0,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh

                if change.add?
                    o = change.add.length
                    ctx.fillStyle = @isBoring(change) and "rgba(50,50,50,#{alpha o})" or "rgba(160,160,255,#{alpha o})"
                    ctx.fillRect 0, li * lh, w, o * lh

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    clear: ->

        @clearMetas()
        @elem.width = 2

    clearMetas: -> @editor.meta.delClass 'git'

module.exports = Diffbar


# 000000000   0000000    0000000    0000000   000      00000000         0000000   000  000000000
#    000     000   000  000        000        000      000             000        000     000
#    000     000   000  000  0000  000  0000  000      0000000         000  0000  000     000
#    000     000   000  000   000  000   000  000      000             000   000  000     000
#    000      0000000    0000000    0000000   0000000  00000000         0000000   000     000

{ reversed, empty, log, _
} = require 'kxk'

module.exports =

    actions:

        toggleGitChange:
            name:  'Toggle Git Changes at Cursors'
            combo: 'command+u'

    toggleGitChange: (key, info) ->

        @toggleGitChangesInLines @selectedAndCursorLineIndices()

    toggleGitChangesInLines: (lineIndices) ->

        @dumpMetas "before toggle #{lineIndices.join ', '}"
        
        metas = []
        untoggled = false

        for li in lineIndices

            for lineMeta in @meta.metasAtLineIndex(li)

                if lineMeta[2].clss.startsWith 'git'
                    lineMeta[2].li = li

                    if not lineMeta[2].toggled
                        untoggled = true

                    metas.push lineMeta

        for lineMeta in metas

            if untoggled
                if not lineMeta[2].toggled
                    @reverseGitChange lineMeta
            else
                if lineMeta[2].toggled
                    @applyGitChange lineMeta
                else
                    @reverseGitChange lineMeta

            if lineMeta[2].li != lineMeta[0]
                offset = lineMeta[2].li - lineMeta[0]
                if offset < 0
                    if lineMeta[2].git == 'del'
                        log 'offset move del', lineMeta[2].li, lineMeta[0], offset
                        @meta.moveLineMeta lineMeta, offset
                    else if lineMeta in @meta.metas
                        log 'offset move ins/mod', lineMeta[2].li, lineMeta[0], offset, -1
                        @meta.moveLineMeta lineMeta, -1
                    else
                        log 'deleted offset', lineMeta[2].li, lineMeta[0], offset, lineMeta[2].toggled, lineMeta[2].git
                        # lineMeta[0] += offset
                else
                    log 'offset ??', lineMeta[2].li, lineMeta[0], offset

        for lineMeta in metas
            
            if lineMeta not in @meta.metas
                log 'reinsert', lineMeta
                @meta.addLineMeta lineMeta
                @meta.addDiv lineMeta

            delete lineMeta[2].li

        @dumpMetas 'after toggle'
        
    dumpMetas: (title) ->
        @log title
        for k,v of @meta.lineMetas
            @log k, ([m[0], m[2].clss, m[2].change, (m[2].toggled and 'toggled' or '')] for m in v)

    # 00000000   00000000  000   000  00000000  00000000    0000000  00000000
    # 000   000  000       000   000  000       000   000  000       000
    # 0000000    0000000    000 000   0000000   0000000    0000000   0000000
    # 000   000  000          000     000       000   000       000  000
    # 000   000  00000000      0      00000000  000   000  0000000   00000000

    reverseGitChange: (lineMeta) ->

        meta = lineMeta[2]
        li   = lineMeta[0]

        log "togglegit.reverseGitChange", li, meta.clss

        @do.start()
        cursors    = @do.cursors()
        selections = @do.selections()

        meta.toggled = true
        meta.div?.classList.add 'toggled'

        switch meta.clss

            when 'git mod', 'git mod boring'
                @do.change li, meta.change.old

            when 'git add', 'git add boring'
                if not empty lc = positionsAtLineIndexInPositions li, cursors
                    meta.cursors = lc
                
                log "reverseGitChange delete", li, @do.line(li)
                log "\n"+ @do.text()
                @do.delete li
                log "\n"+ @do.text()
                for nc in positionsBelowLineIndexInPositions li, cursors
                    cursorDelta nc, 0, -1

            when 'git del'

                for line in reversed meta.change
                    log "reverseGitChange insert", li, line.old
                    log "\n"+ @do.text()
                    @do.insert li, line.old
                    log "\n"+ @do.text()
                    for nc in positionsBelowLineIndexInPositions li, cursors
                        cursorDelta nc, 0, +1

        @do.setCursors cursors, main:'closest'
        @do.select selections
        @do.end()

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000
    # 000000000  00000000   00000000   000        00000
    # 000   000  000        000        000         000
    # 000   000  000        000        0000000     000

    applyGitChange: (lineMeta) ->

        meta = lineMeta[2]
        li   = lineMeta[0]

        log "togglegit.applyGitChange", li, meta.clss

        @do.start()
        cursors = @do.cursors()
        selections = @do.selections()

        delete meta.toggled
        meta.div?.classList.remove 'toggled'

        switch meta.clss

            when 'git mod', 'git mod boring'

                @do.change li, meta.change.new

            when 'git add', 'git add boring'

                log 'applyGitChange insert', li, meta.change.new
                log "\n"+ @do.text()
                @do.insert li, meta.change.new
                log "\n"+ @do.text()
                
                for nc in positionsBelowLineIndexInPositions li, cursors
                    cursorDelta nc, 0, +1
                if meta.cursors
                    cursors = cursors.concat meta.cursors.map (c) -> [c[0], li]
                    delete meta.cursors

            when 'git del'

                for line in reversed meta.change
                    log 'applyGitChange delete', li, @do.line li
                    log "\n"+ @do.text()
                    @do.delete li
                    log "\n"+ @do.text()
                    for nc in positionsBelowLineIndexInPositions li, cursors
                        cursorDelta nc, 0, -1

        @do.setCursors cursors, main:'closest'
        @do.select selections
        @do.end()

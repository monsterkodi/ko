
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
                lineMeta[2].applyOffset = lineMeta[2].li - lineMeta[0]
                # log 'apply offset', lineMeta[2].li, lineMeta[0], lineMeta[2].applyOffset

            if lineMeta not in @meta.metas
                log 'dafuk?'

            delete lineMeta[2].li

        # for k,v of @meta.lineMetas
            # @log k, ([m[0], m[2].clss, m[2].applyOffset, (m[2].toggled and 'toggled' or '')] for m in v)

    # 00000000   00000000  000   000  00000000  00000000    0000000  00000000
    # 000   000  000       000   000  000       000   000  000       000
    # 0000000    0000000    000 000   0000000   0000000    0000000   0000000
    # 000   000  000          000     000       000   000       000  000
    # 000   000  00000000      0      00000000  000   000  0000000   00000000

    reverseGitChange: (lineMeta) ->

        meta = lineMeta[2]
        li   = lineMeta[0]

        # log "togglegit.reverseGitChange", li, meta.clss

        @do.start()
        cursors    = @do.cursors()
        selections = @do.selections()

        meta.toggled = true
        meta.div?.classList.add 'toggled'

        switch meta.clss

            when 'git mod', 'git mod boring'
                @do.change li, meta.change.old

            when 'git add', 'git add boring'
                @meta.moveLineMeta lineMeta, -1
                if not empty lc = positionsAtLineIndexInPositions li, cursors
                    meta.cursors = lc
                @do.delete li
                for nc in positionsBelowLineIndexInPositions li, cursors
                    cursorDelta nc, 0, -1

            when 'git del'
                li += 1
                for line in reversed meta.change
                    @do.insert li, line.old
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

        # log "togglegit.applyGitChange", li, meta.clss, meta.applyOffset

        @do.start()
        cursors = @do.cursors()
        selections = @do.selections()

        delete meta.toggled
        meta.div?.classList.remove 'toggled'

        switch meta.clss

            when 'git mod', 'git mod boring'

                @do.change li, meta.change.new

            when 'git add', 'git add boring'

                if meta.applyOffset?
                    li += meta.applyOffset
                # log 'insert', li, meta.change.new
                @do.insert li, meta.change.new
                for nc in positionsBelowLineIndexInPositions li, cursors
                    cursorDelta nc, 0, +1
                if meta.cursors
                    cursors = cursors.concat meta.cursors.map (c) -> [c[0], li]
                    delete meta.cursors

            when 'git del'

                li += 1
                for line in reversed meta.change
                    @do.delete li
                    for nc in positionsBelowLineIndexInPositions li, cursors
                        cursorDelta nc, 0, -1

        @do.setCursors cursors, main:'closest'
        @do.select selections
        @do.end()

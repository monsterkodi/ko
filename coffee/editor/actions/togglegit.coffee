
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
            combo: 'CmdOrCtrl+u'

    toggleGitChange: (key, info) ->

        @toggleGitChangesInLines @selectedAndCursorLineIndices()

    toggleGitChangesInLines: (lineIndices) ->

        metas = []
        untoggled = false

        @do.start()
        @do.setCursors [@mainCursor()]
        @do.select []
        @do.end()
        
        for li in lineIndices

            for lineMeta in @meta.metasAtLineIndex(li)

                if lineMeta[2].clss.startsWith 'git'

                    if not lineMeta[2].toggled
                        untoggled = true

                    metas.push lineMeta

        for lineMeta in metas

            oi = lineMeta[0]
            
            if untoggled
                if not lineMeta[2].toggled
                    @reverseGitChange lineMeta
            else
                if lineMeta[2].toggled
                    @applyGitChange lineMeta
                else
                    @reverseGitChange lineMeta

            if oi != lineMeta[0]
                offset = oi - lineMeta[0]
                if offset < 0
                    @meta.moveLineMeta lineMeta, offset
        
        cursors = []
        for lineMeta in metas
            cursors.push [0,lineMeta[0]]
            if lineMeta not in @meta.metas
                @meta.addLineMeta lineMeta
                @meta.addDiv lineMeta

        @do.start()
        @do.setCursors cursors, main:'closest'
        @do.select []
        @do.end()
        
    # 0000000    000   000  00     00  00000000   
    # 000   000  000   000  000   000  000   000  
    # 000   000  000   000  000000000  00000000   
    # 000   000  000   000  000 0 000  000        
    # 0000000     0000000   000   000  000        
    
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

        @do.start()

        meta.toggled = true
        meta.div?.classList.add 'toggled'

        switch meta.clss

            when 'git mod', 'git mod boring'
                @do.change li, meta.change.old

            when 'git add', 'git add boring'                
                @do.delete li

            when 'git del'

                for line in reversed meta.change
                    @do.insert li, line.old

        @do.end()

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000
    # 000000000  00000000   00000000   000        00000
    # 000   000  000        000        000         000
    # 000   000  000        000        0000000     000

    applyGitChange: (lineMeta) ->

        meta = lineMeta[2]
        li   = lineMeta[0]

        @do.start()

        delete meta.toggled
        meta.div?.classList.remove 'toggled'

        switch meta.clss

            when 'git mod', 'git mod boring'

                @do.change li, meta.change.new

            when 'git add', 'git add boring'

                @do.insert li, meta.change.new
                
            when 'git del'

                for line in reversed meta.change
                    @do.delete li

        @do.end()

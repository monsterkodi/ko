
# 00000000   00000000  000   000  00000000  00000000    0000000  00000000  
# 000   000  000       000   000  000       000   000  000       000       
# 0000000    0000000    000 000   0000000   0000000    0000000   0000000   
# 000   000  000          000     000       000   000       000  000       
# 000   000  00000000      0      00000000  000   000  0000000   00000000  

{ reversed, log, _
} = require 'kxk'

module.exports = 
    
    actions:
        reverse:
            name:  'toggle git changes at cursors'
            combo: 'command+u'

    reverse: (key, info) ->
        
        metas = []
        
        for li in @cursorLineIndices().reverse()
            for lineMeta in @meta.metasAtLineIndex(li).reverse()
                lineMeta[2].li = li
                lineMeta[0] = 0 # -1?
                metas.push lineMeta
                
        for lineMeta in metas    
            @toggleGitChange lineMeta
            lineMeta[0] = lineMeta[2].li
            @meta.moveMeta lineMeta, 0
            delete lineMeta[2].li
       
    toggleGitChange: (lineMeta) ->
        
        if lineMeta[2].toggled
            @applyGitChange lineMeta
        else
            @reverseGitChange lineMeta

    reverseGitChange: (lineMeta) ->
        
        meta = lineMeta[2]
        li   = meta.li
        
        if meta.clss == 'git mod'
            @do.start()
            @do.change li, meta.change.old
            @do.end()
        
        if meta.clss == 'git add'
            @do.start()
            @do.delete li
            @do.end()

        if meta.clss == 'git del'
            @do.start()
            for line in reversed meta.change
                @do.insert li+1, line.old
            @do.end()
            
        meta.div?.classList.add 'toggled'
        meta.toggled = true
            
    applyGitChange: (lineMeta) ->
        
        meta = lineMeta[2]
        li   = meta.li
        
        if meta.clss == 'git mod'
            @do.start()
            @do.change li, meta.change.new
            @do.end()
        
        if meta.clss == 'git add'
            @do.start()
            @do.insert li, meta.change.new
            @do.end()

        if meta.clss == 'git del'
            @do.start()
            for line in reversed meta.change
                @do.delete li+1 
            @do.end()
            
        meta.div?.classList.remove 'toggled'
        delete meta.toggled
            
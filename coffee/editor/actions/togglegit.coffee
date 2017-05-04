
# 000000000   0000000    0000000    0000000   000      00000000         0000000   000  000000000    
#    000     000   000  000        000        000      000             000        000     000       
#    000     000   000  000  0000  000  0000  000      0000000         000  0000  000     000       
#    000     000   000  000   000  000   000  000      000             000   000  000     000       
#    000      0000000    0000000    0000000   0000000  00000000         0000000   000     000       

{ reversed, log, _
} = require 'kxk'

module.exports = 
    
    actions:
        toggleGitChange:
            name:  'toggle git changes at cursors'
            combo: 'command+u'

    toggleGitChange: (key, info) ->
        
        metas = []
        
        untoggled = false
        for li in @selectedAndCursorLineIndices().reverse()
            for lineMeta in @meta.metasAtLineIndex(li).reverse()
                lineMeta[2].li = li
                lineMeta[0] = -1
                if lineMeta[2].clss.startsWith('git') and not lineMeta[2].toggled
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
            
            lineMeta[0] = lineMeta[2].li
            @meta.moveMeta lineMeta, 0
            delete lineMeta[2].li
       
    # 00000000   00000000  000   000  00000000  00000000    0000000  00000000  
    # 000   000  000       000   000  000       000   000  000       000       
    # 0000000    0000000    000 000   0000000   0000000    0000000   0000000   
    # 000   000  000          000     000       000   000       000  000       
    # 000   000  00000000      0      00000000  000   000  0000000   00000000  
    
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
            
    #  0000000   00000000   00000000   000      000   000  
    # 000   000  000   000  000   000  000       000 000   
    # 000000000  00000000   00000000   000        00000    
    # 000   000  000        000        000         000     
    # 000   000  000        000        0000000     000     
    
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
            
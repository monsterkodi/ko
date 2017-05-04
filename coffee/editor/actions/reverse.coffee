
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
        
        @do.start()
        
        for li in @cursorLineIndices().reverse()
            for lineMeta in @meta.metasAtLineIndex li
                @toggleGitChange lineMeta      
        @do.end()
       
    toggleGitChange: (lineMeta) ->
        
        if lineMeta[2].toggled
            @applyGitChange lineMeta
        else
            @reverseGitChange lineMeta

    applyGitChange: (lineMeta) ->
        
        meta = lineMeta[2]
        li   = lineMeta[0]
        
        if meta.clss == 'git mod'
            @do.change li, meta.change.new
        
        if meta.clss == 'git add'
            @do.insert li, meta.change.new

        if meta.clss == 'git del'
            for line in reversed meta.change
                @do.delete li 
        
        delete meta.toggled
            
    reverseGitChange: (lineMeta) ->
        
        meta = lineMeta[2]
        li   = lineMeta[0]
        
        if meta.clss == 'git mod'
            @do.change li, meta.change.old
        
        if meta.clss == 'git add'
            @do.delete li 

        if meta.clss == 'git del'
            for line in reversed meta.change
                @do.insert li+1, line.old
        
        meta.toggled = true

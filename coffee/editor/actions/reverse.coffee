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
            name:  'reverse git chunk lines at cursors'
            combo: 'command+u'

    reverse: (key, info) ->
        
        @do.start()
        
        for li in @cursorLineIndices().reverse()
            for lineMeta in @meta.metasAtLineIndex li
                meta = lineMeta[2]
                if meta.clss == 'git mod'
                    if @do.line(li) == meta.change.old
                        @do.change li, meta.change.new
                    else
                        @do.change li, meta.change.old
                
                if meta.clss == 'git add'
                    @do.delete li 

                if meta.clss == 'git del'
                    for line in reversed meta.change
                        @do.insert li+1, line.old
                        
                if meta.clss in ['git mod', 'git del', 'git add']
                    meta.div?.remove()
                    _.pull @meta.metas, lineMeta
        
        @do.end()
        
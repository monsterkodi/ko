
#       000  000   000  00     00  00000000   000000000   0000000   000   000   0000000   00000000   0000000    
#       000  000   000  000   000  000   000     000     000   000  000 0 000  000   000  000   000  000   000  
#       000  000   000  000000000  00000000      000     000   000  000000000  000   000  0000000    000   000  
# 000   000  000   000  000 0 000  000           000     000   000  000   000  000   000  000   000  000   000  
#  0000000    0000000   000   000  000           000      0000000   00     00   0000000   000   000  0000000    
        
{ splitFilePos, fileExists, resolve, post, log
} = require 'kxk'
matchr = require '../../tools/matchr'

module.exports =
    
    actions:
        jumpToWord:
            name:  'jump to word'
            text:  'jump to word at cursor'
            combo: 'alt+enter'
    
    jumpToWord: (p = @cursorPos()) ->
        
        text = @line p[1]
        
        rgx = /([\~\/\w\.]+\/[\w\.]+\w[:\d]*)/ # look for files in line
        if rgx.test text
            ranges = matchr.ranges rgx, text
            diss   = matchr.dissect ranges, join:false
            for d in diss
                if d.start <= p[0] <= d.start+d.match.length
                    [file, pos] = splitFilePos d.match
                    if fileExists resolve file
                        post.emit 'jumpTo', file:file, line:pos[1], col:pos[0]
                        return
                        
        word = @wordAtPos p
        range = @rangeForWordAtPos p
        opt = {}
        line = @line range[0] 

        if range[1][0] > 0 
            if line[range[1][0]-1] == '.'
                opt.type = 'func'
                
        if not opt.type and range[1][1] < line.length
            rest = line.slice range[1][1]
            index = rest.search /\S/ 
            if index >= 0
                nextChar = rest[index]
                # log "next: #{nextChar}"
                type = switch nextChar 
                    when '.'      then 'class' 
                    when '('      then 'func'
                    when ':', '=' then 'word'
                opt.type = type if type?
                
        post.emit 'jumpTo', word, opt

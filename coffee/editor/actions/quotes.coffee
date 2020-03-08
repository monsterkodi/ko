###
 0000000   000   000   0000000   000000000  00000000   0000000    
000   000  000   000  000   000     000     000       000         
000 00 00  000   000  000   000     000     0000000   0000000     
000 0000   000   000  000   000     000     000            000    
 00000 00   0000000    0000000      000     00000000  0000000     
###

{ klog } = require 'kxk'

module.exports =
    
    actions:
        menu: 'Quotes'
        
        singleQuotes:
            name:  'Single'
            combo: "alt+command+'"
            accel: "alt+ctrl+'"

        doubleQuotes:
            name:  'Double'
            combo: "alt+command+shift+'"
            accel: "alt+ctrl+shift+'"
        
    singleQuotes: -> @swapQuotes "'"
    doubleQuotes: -> @swapQuotes '"'
            
    swapQuotes: (quote) ->
        
        @do.start()
        cursors = @do.cursors()
        
        @selectSurround()
        @deleteSelection()
        
        tmpCursors = @do.cursors() 
        for cc in tmpCursors
            cline = @do.line cc[1]
            @do.change cc[1], cline.splice cc[0], 0, quote
            for nc in positionsAtLineIndexInPositions cc[1], tmpCursors
                if nc[0] >= cc[0]
                    nc[0] += 1
        
        @do.setCursors cursors
        @do.end()
                
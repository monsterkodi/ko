# 00000000   00000000  000   000  0000000    00000000  00000000 
# 000   000  000       0000  000  000   000  000       000   000
# 0000000    0000000   000 0 000  000   000  0000000   0000000  
# 000   000  000       000  0000  000   000  000       000   000
# 000   000  00000000  000   000  0000000    00000000  000   000

encode    = require '../tools/encode'
log       = require '../tools/log'
highlight = require './highlight'

class render 
            
    # 000      000  000   000  00000000
    # 000      000  0000  000  000     
    # 000      000  000 0 000  0000000 
    # 000      000  000  0000  000     
    # 0000000  000  000   000  00000000
    
    @line: (line) =>
        
        highlight.line line
        
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
    
    @cursors: (cursors, size) => # cursors: [ [charIndex, lineIndex] ... ]  (lineIndex relative to view)
        
        h = ""
        i = 0
        cw = size.charWidth
        lh = size.lineHeight
        for c in cursors
            tx = c[0] * cw
            ty = c[1] * lh
            h += "<span class=\"cursor-#{i} cursor\" style=\"transform: translate(#{tx}px,#{ty}px); height:#{lh}px\"></span>"
            i += 1
        h
                
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
                
    @selection: (selections, size) => # selections: [ [lineIndex, [startIndex, endIndex]], ... ]  (lineIndex relative to view)
        
        h = ""
        p = null
        n = null
        for si in [0...selections.length]
            s = selections[si]
            n = (si < selections.length-1) and selections[si+1] or null
            log 'si', si, 'p', p, 's', s, 'n', n
            h += @selectionSpan p, s, n, size
            p = s
        h
        
    @selectionSpan: (prev, sel, next, size) =>
                                                                
        # 0000000     0000000   00000000   0000000    00000000  00000000 
        # 000   000  000   000  000   000  000   000  000       000   000
        # 0000000    000   000  0000000    000   000  0000000   0000000  
        # 000   000  000   000  000   000  000   000  000       000   000
        # 0000000     0000000   000   000  0000000    00000000  000   000
                
        border = ""
        if not prev
            border += " tl tr"
        else
            if (sel[1][0] < prev[1][0]) or (sel[1][0] > prev[1][1])
                border += " tl"
            if (sel[1][1] > prev[1][1]) or (sel[1][1] < prev[1][0])
                border += " tr"
            
        if not next
            border += " bl br"
        else
            if sel[1][1] > next[1][1]
                border += " br"
            if (sel[1][0] < next[1][0]) or (sel[1][0] > next[1][1])
                border += " bl"
            
        if sel[1][0] == 0
            border += " start" # wider offset at start of line
                                                
        sw = size.charWidth * (sel[1][1]-sel[1][0])
        tx = size.charWidth *  sel[1][0]
        ty = size.lineHeight * sel[0]
        lh = size.lineHeight
    
        empty = sel[1][0] == sel[1][1] and " empty" or ""
        
        "<span class=\"selection#{border}#{empty}\" style=\"transform: translate(#{tx}px,#{ty}px); width: #{sw}px; height: #{lh}px\"></span>"
                                                
module.exports = render
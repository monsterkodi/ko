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
    
    @cursors: (cursors, size) =>
        
        h = ""
        i = 0
        cw = size.charWidth
        lh = size.lineHeight
        ot = size.offsetTop
        for c in cursors
            tx = c[0] * cw
            ty = c[1] * lh - ot
            h += "<div class=\"cursor-#{i} cursor\" style=\"transform: translate(#{tx}px,#{ty}px); height:#{lh}px\"></div>"
            i += 1
        h
                
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
                
    @selection: (selections, size) => # selections [ [lineIndex, [startIndex, endIndex]], ... ]
        
        h = ""
        p = null
        n = null
        for si in [0...selections.length]
            s = selections[si]
            n = selections[si+1] if si
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
        if not prev?
            border += " tl tr"
        else
            if (sel[1][0] < prev[1][0]) or (sel[1][0] > prev[1][1])
                border += " tl"
            if (sel[1][1] > prev[1][1]) or (sel[1][1] < prev[1][0])
                border += " tr"
            
        if not next?
            border += " bl br"
        else
            if sel[1] > next[1][1]
                border += " br"
            if (sel[0] < next[1][0]) or (sel[0] > next[1][1])
                border += " bl"
            
        if sel[1][0] == 0
            border += " start" # wider offset at start of line
                        
        x = size.charWidth * sel[1][0]
        w = size.charWidth * sel[1][1]-sel[1][0]
        y = size.lineHeight * sel[0]
        h = size.lineHeight
    
        empty = sel[1][0] == sel[1][1] and "empty" or ""
        
        "<span class=\"selection#{border}#{empty}\" style=\"transform: translate(#{x}px,#{y}px); width: #{w}px; height: #{h}px\"></span>"
                                                
module.exports = render
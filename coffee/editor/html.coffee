# 000   000  000000000  00     00  000    
# 000   000     000     000   000  000    
# 000000000     000     000000000  000    
# 000   000     000     000 0 000  000    
# 000   000     000     000   000  0000000

encode    = require '../tools/encode'
log       = require '../tools/log'
highlight = require './highlight'

class html 
            
    # 000      000  000   000  00000000
    # 000      000  0000  000  000     
    # 000      000  000 0 000  0000000 
    # 000      000  000  0000  000     
    # 0000000  000  000   000  00000000
    
    @renderLine: (index, lines, cursor, selectionRanges, size) =>
        
        h = ""
        i = index
        l = lines[index]        
        
        if selectionRanges.length
            selRange = [selectionRanges[0][0], selectionRanges[selectionRanges.length-1][0]]
            
        selectedCharacters = (i) -> 
            r = selectionRanges[i-selectionRanges[0][0]][1]
            [r[0], r[1]]
                    
        insert = []
                    
        if selRange and selRange[0] <= i <= selRange[1]
            
            range = selectedCharacters i                
            
            # 0000000     0000000   00000000   0000000    00000000  00000000 
            # 000   000  000   000  000   000  000   000  000       000   000
            # 0000000    000   000  0000000    000   000  0000000   0000000  
            # 000   000  000   000  000   000  000   000  000       000   000
            # 0000000     0000000   000   000  0000000    00000000  000   000
            
            border = ""
            if i == selRange[0]
                border += " tl tr"
            else
                prevRange = selectedCharacters i-1
                if (range[0] < prevRange[0]) or (range[0] > prevRange[1])
                    border += " tl"
                if (range[1] > prevRange[1]) or (range[1] < prevRange[0])
                    border += " tr"
                
            if i == selRange[1]
                border += " bl br"
            else
                nextRange = selectedCharacters i+1
                if range[1] > nextRange[1]
                    border += " br"
                if (range[0] < nextRange[0]) or (range[0] > nextRange[1])
                    border += " bl"
                
            curX = Math.min cursor[0], l.length
            if ((range[0] == curX) or (range[1] == curX)) and i == cursor[1]
                border += " cursor" # smaller border radius around cursor
                
            if range[0] == 0
                border += " start" # wider offset at start of line
                    
            #  0000000  00000000  000      00000000   0000000  000000000
            # 000       000       000      000       000          000   
            # 0000000   0000000   000      0000000   000          000   
            #      000  000       000      000       000          000   
            # 0000000   00000000  0000000  00000000   0000000     000   
            
            selStart = "<span class=\"selection#{border}\">"
            selEnd   = '</span>'

            if range[0] == range[1]
                selStart += '<span class="empty"></span>'
                
            insert = [[range[0], selStart], [range[1], selEnd]]
                
        h = highlight.line l, insert
    
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
    
    @renderCursors: (cursors, size) =>
        
        h = ""
        i = 0
        cw = size.charWidth
        lh = size.lineHeight
        ot = size.offsetTop
        for c in cursors
            tx = c[0] * cw
            ty = c[1] * lh - ot
            log 'cursor', c[0], c[1], tx, ty
            h += "<div class=\"cursor-#{i} cursor\" style=\"transform: translate(#{tx}px,#{ty}px); height:#{lh}px\"></div>"
            i += 1
        h
                        
module.exports = html
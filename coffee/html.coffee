# 000   000  000000000  00     00  000    
# 000   000     000     000   000  000    
# 000000000     000     000000000  000    
# 000   000     000     000 0 000  000    
# 000   000     000     000   000  0000000

encode    = require './tools/encode'
log       = require './tools/log'
highlight = require './highlight'

class html 
    
    @cursorSpan: (charSize) => "<span id=\"cursor\" style=\"height: #{charSize[1]}px\"></span>"
    
    # 00000000   00000000  000   000  0000000    00000000  00000000         000      000  000   000  00000000
    # 000   000  000       0000  000  000   000  000       000   000        000      000  0000  000  000     
    # 0000000    0000000   000 0 000  000   000  0000000   0000000          000      000  000 0 000  0000000 
    # 000   000  000       000  0000  000   000  000       000   000        000      000  000  0000  000     
    # 000   000  00000000  000   000  0000000    00000000  000   000        0000000  000  000   000  00000000
    
    @renderLine: (index, lines, cursor, selectionRanges, charSize) =>
        
        i = index
        l = lines[index]        
        l = " " if l.length == 0
        h = ""
        
        if selectionRanges.length
            selRange = [selectionRanges[0][0], selectionRanges[selectionRanges.length-1][0]]
            
        selectedCharacters = (i) -> 
            r = selectionRanges[i-selectionRanges[0][0]][1]
            [r[0], r[1]]
                    
        insert = []
                    
        if selRange and selRange[0] <= i <= selRange[1]
            
            range  = selectedCharacters i                
            
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
                    
            #  0000000  00000000  000      00000000   0000000  000000000
            # 000       000       000      000       000          000   
            # 0000000   0000000   000      0000000   000          000   
            #      000  000       000      000       000          000   
            # 0000000   00000000  0000000  00000000   0000000     000   
            
            selStart = "<span class=\"selection#{border}\">"
            selEnd   = '</span>'
            # if range[0] == range[1] == 0 == l.length
            #     selEnd = '&nbsp;' + selEnd
            if i == cursor[1]
                if cursor[0] == range[0]
                    selStart = @cursorSpan(charSize)+selStart
                else
                    selEnd = selEnd+@cursorSpan(charSize)
                
            insert = [[range[0], selStart], [range[1], selEnd]]
                
        else if i == cursor[1]
            
            insert = [[cursor[0], @cursorSpan(charSize)]]
                        
        h = highlight.line l, insert
                        
        "<div id=\"line-#{index}\" class=\"line\">" + h + "</div>"

module.exports = html
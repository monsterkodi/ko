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
    
    @render: (lines, cursor, selectionRanges, charSize) =>
        
        colorized = highlight.lines lines, cursor, selectionRanges
        log 'colorized', colorized
        
        h = []
        if selectionRanges.length
            selRange = [selectionRanges[0][0], selectionRanges[selectionRanges.length-1][0]]
        selectedCharacters = (i) -> 
            r = selectionRanges[i-selectionRanges[0][0]][1]
            [r[0], r[1]]
        curSpan = @cursorSpan charSize
        
        for i in [0...lines.length]
            
            l = lines[i]
            
            if selRange and selRange[0] <= i <= selRange[1]
                
                range  = selectedCharacters i                
                left   = l.substr  0, range[0]
                mid    = l.substr  range[0], range[1]-range[0] 
                right  = l.substr  range[1]
                
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
                selEnd   = "</span>"
                if i == cursor[1]
                    if cursor[0] == range[0]
                        h.push encode(left) + curSpan + selStart + encode(mid) + selEnd + encode(right)
                    else
                        h.push encode(left) + selStart + encode(mid) + selEnd + curSpan + encode(right)
                else
                    h.push encode(left) + selStart + encode(mid) + selEnd + encode(right)
                    
            else if i == cursor[1]
                
                left  = l.substr  0, cursor[0]
                right = l.substr  cursor[0]
                h.push encode(left) + curSpan + encode(right)
                
            else
                h.push colorized[i]
                # h.push encode(l)
        h.join '<br>'

module.exports = html
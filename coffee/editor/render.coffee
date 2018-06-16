###
00000000   00000000  000   000  0000000    00000000  00000000 
000   000  000       0000  000  000   000  000       000   000
0000000    0000000   000 0 000  000   000  0000000   0000000  
000   000  000       000  0000  000   000  000       000   000
000   000  00000000  000   000  0000000    00000000  000   000
###

{ str, elem, log, } = require 'kxk'

class Render
                
    # 000      000  000   000  00000000
    # 000      000  0000  000  000     
    # 000      000  000 0 000  0000000 
    # 000      000  000  0000  000     
    # 0000000  000  000   000  00000000
    
    @line: (diss, size={charWidth:0}) ->
        l = ""
        if diss?.length
            for di in [diss.length-1..0]
                d = diss[di]
                tx = d.start * size.charWidth
                clss = d.clss? and " class=\"#{d.clss}\"" or ''
                clrzd = "<span style=\"transform:translatex(#{tx}px);#{d.styl ? ''}\"#{clss}>#{str.encode d.match}</span>"
                l = clrzd + l
        l
        
    @lineSpan: (diss, size) ->

        div = elem class: 'linespans'

        if diss?.length
            for d in diss
                span = elem 'span'
                span.style.transform = "translatex(#{d.start * size.charWidth}px)"
                span.className = d.clss if d.clss?
                span.textContent = d.match
                if d.styl?
                    for st in d.styl.split ';'
                        ss = st.split ':'
                        span.style[ss[0]] = ss[1]
                div.appendChild span
        div
        
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
    
    @cursors: (cs, size) -> # cs: [ [charIndex, lineIndex] ... ]  (lineIndex relative to view)
        
        i = 0
        h = ""
        cw = size.charWidth
        lh = size.lineHeight
        for c in cs
            tx  = c[0] * cw + size.offsetX
            ty  = c[1] * lh
            cls = ""
            cls = c[2] if c.length > 2
            zi  = cls != 'virtual' and c[1]+1000 or 0
            h += "<span class=\"cursor #{cls}\" style=\"z-index:#{zi};transform:translate3d(#{tx}px,#{ty}px,0); height:#{lh}px\"></span>"
            i += 1
        h
                
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
                
    @selection: (ss, size, clss='selection') => # ss: [ [lineIndex, [startIndex, endIndex]], ... ]  (lineIndex relative to view)
        
        h = ""
        p = null      
        n = null
        for si in [0...ss.length]
            s = ss[si]
            n = (si < ss.length-1) and (ss[si+1][0] == s[0]+1) and ss[si+1] or null # next line selection
            b = p?[0] == s[0]-1 and p or null # selection in line before
            h += @selectionSpan b, s, n, size, s[2]?.clss ? s[2] ? clss
            p = s
        h
        
    @selectionSpan: (prev, sel, next, size, clss) ->
                                                                
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
            if sel[1][1] > next[1][1] or (sel[1][1] < next[1][0])
                border += " br"
            if (sel[1][0] < next[1][0]) or (sel[1][0] > next[1][1])
                border += " bl"
            
        if sel[1][0] == 0 and not size.centerText
            border += " start" # wider offset at start of line
                                                
        sw = size.charWidth * (sel[1][1]-sel[1][0])
        tx = size.charWidth *  sel[1][0] + size.offsetX
        ty = size.lineHeight * sel[0]
        lh = size.lineHeight

        if clss.startsWith 'stringmatch'
            lh /= 2 if clss.endsWith 'single'
            lh /= 2 if clss.endsWith 'double'
            if clss.endsWith 'bold'
                ty += lh/4 
                lh /= 2 
    
        empty = sel[1][0] == sel[1][1] and "empty" or ""
        
        "<span class=\"#{clss}#{border}#{empty}\" style=\"transform: translate(#{tx}px,#{ty}px); width: #{sw}px; height: #{lh}px\"></span>"
                                                
module.exports = Render

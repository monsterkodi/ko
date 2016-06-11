# 00000000   00000000  000   000  0000000    00000000  00000000 
# 000   000  000       0000  000  000   000  000       000   000
# 0000000    0000000   000 0 000  000   000  0000000   0000000  
# 000   000  000       000  0000  000   000  000       000   000
# 000   000  00000000  000   000  0000000    00000000  000   000

matchr = require '../tools/matchr'
encode = require '../tools/encode'
enspce = require '../tools/enspce'
log    = require '../tools/log'
noon   = require 'noon'
path   = require 'path'
fs     = require 'fs'

class render 
                
    @matchrConfigs = {}
    @syntaxNames = []
    
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   

    @init: =>
        syntaxDir = "#{__dirname}/../../syntax/"
        for syntaxFile in fs.readdirSync syntaxDir
            syntaxName = path.basename syntaxFile, '.noon'
            @syntaxNames.push syntaxName
            patterns = noon.load path.join syntaxDir, syntaxFile
            @matchrConfigs[syntaxName] = matchr.config patterns

    #  0000000   0000000   000       0000000   00000000   000  0000000  00000000
    # 000       000   000  000      000   000  000   000  000     000   000     
    # 000       000   000  000      000   000  0000000    000    000    0000000 
    # 000       000   000  000      000   000  000   000  000   000     000     
    #  0000000   0000000   0000000   0000000   000   000  000  0000000  00000000
    
    @colorize: (str, stack) =>
        try
            smp = stack.map (s) -> String(s).split '.'
            chk = {}
            spl = []
            for s in smp
                if not chk[s[0]]?
                    chk[s[0]] = s.slice 1
                    spl.push s
            spl = _.flatten spl
            str = "<span class=\"#{spl.join ' '}\">#{encode str}</span>"
                    
        catch err
            error err
        str

    # 000      000  000   000  00000000
    # 000      000  0000  000  000     
    # 000      000  000 0 000  0000000 
    # 000      000  000  0000  000     
    # 0000000  000  000   000  00000000
    
    @line: (line, syntaxName) =>
                
        rngs = matchr.ranges @matchrConfigs[syntaxName], line
        diss = matchr.dissect rngs 
        if diss.length
            for di in [diss.length-1..0]
                d = diss[di]
                clrzd = @colorize d.match, d.stack.reverse()
                line = line.slice(0, d.start) + clrzd + line.slice(d.start+d.match.length)

        enspce line
        
    #  0000000  000   000  00000000    0000000   0000000   00000000    0000000
    # 000       000   000  000   000  000       000   000  000   000  000     
    # 000       000   000  0000000    0000000   000   000  0000000    0000000 
    # 000       000   000  000   000       000  000   000  000   000       000
    #  0000000   0000000   000   000  0000000    0000000   000   000  0000000 
    
    @cursors: (cs, size) => # cs: [ [charIndex, lineIndex] ... ]  (lineIndex relative to view)
        
        h = ""
        i = 0
        cw = size.charWidth
        lh = size.lineHeight
        for c in cs
            tx = c[0] * cw + size.offsetX
            ty = c[1] * lh
            cls = ""
            cls = c[2] if c.length > 2
            h += "<span class=\"cursor-#{i} cursor #{cls}\" style=\"transform: translate(#{tx}px,#{ty}px); height:#{lh}px\"></span>"
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
            n = (si < ss.length-1) and ss[si+1] or null
            h += @selectionSpan p, s, n, size, clss
            p = s
        h
        
    @selectionSpan: (prev, sel, next, size, clss) =>
                                                                
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
        tx = size.charWidth *  sel[1][0] + size.offsetX
        ty = size.lineHeight * sel[0]
        lh = size.lineHeight
    
        empty = sel[1][0] == sel[1][1] and " empty" or ""
        
        "<span class=\"#{clss}#{border}#{empty}\" style=\"transform: translate(#{tx}px,#{ty}px); width: #{sw}px; height: #{lh}px\"></span>"
    
render.init()
                                            
module.exports = render
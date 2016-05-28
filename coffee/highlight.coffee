# 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000
# 000   000  000  000        000   000  000      000  000        000   000     000   
# 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000   
# 000   000  000  000   000  000   000  000      000  000   000  000   000     000   
# 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000   

matchr = require './tools/matchr'
encode = require './tools/encode'
enspce = require './tools/enspce'
log    = require './tools/log'
noon   = require 'noon'
_      = require 'lodash'

class highlight
    
    @matchrConfig = null

    @init: =>
        # patterns = @expand noon.load "#{__dirname}/../syntax/coffee.noon"
        patterns = noon.load "#{__dirname}/../syntax/coffee.noon"
        log 'highlight.patterns', patterns
        @matchrConfig = matchr.config patterns

    #  0000000   0000000   000       0000000   00000000   000  0000000  00000000
    # 000       000   000  000      000   000  000   000  000     000   000     
    # 000       000   000  000      000   000  0000000    000    000    0000000 
    # 000       000   000  000      000   000  000   000  000   000     000     
    #  0000000   0000000   0000000   0000000   000   000  000  0000000  00000000
    
    @colorize: (str, stack) =>
        try
            spl = stack.map (s) -> 
                String(s).split '.'
            spl = _.flatten spl
            spl.reverse()
            str = "<span class=\"#{spl.join ' '}\">#{encode str}</span>"
                    
        catch err
            error err
        str

    # 00000000    0000000   000000000  000000000  00000000  00000000   000   000
    # 000   000  000   000     000        000     000       000   000  0000  000
    # 00000000   000000000     000        000     0000000   0000000    000 0 000
    # 000        000   000     000        000     000       000   000  000  0000
    # 000        000   000     000        000     00000000  000   000  000   000
    
    @pattern: (chunk) =>
        rngs = matchr.ranges @matchrConfig, chunk
        diss = matchr.dissect rngs
        
        if diss.length
            for di in [diss.length-1..0]
                d = diss[di]
                clrzd = @colorize d.match, d.stack.reverse()
                chunk = chunk.slice(0, d.start) + clrzd + chunk.slice(d.start+d.match.length)
        enspce chunk

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    @lines: (lines, cursor, selectionRanges) =>
        # log 'highlight', lines
        colorized = []
        for l in lines
            p = @pattern l
            colorized.push p
        colorized
                
highlight.init()

module.exports = highlight

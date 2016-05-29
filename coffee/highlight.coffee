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
        patterns = noon.load "#{__dirname}/../syntax/coffee.noon"
        @matchrConfig = matchr.config patterns

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
    
    @line: (line, inserts=[]) =>
        rngs = matchr.ranges @matchrConfig, line
        diss = matchr.dissect rngs 
        for ins in inserts.reverse()
            if diss.length
                for di in [diss.length-1..0]
                    
                    d = diss[di]
                    continue if not d.match? # jump over inserts
                    
                    if d.start+d.match.length > ins[0] # span end is behind insert start
                        if d.start < ins[0] # insert overlaps with span
                            ll = ins[0]-d.start
                            lr = d.match.length - ll
                            dr = Object.assign {}, d
                            dr.start = ins[0]
                            dr.match = d.match.substr ll 
                            d.match = d.match.substr 0, ll
                            diss.splice di+1, 0, dr                                
                            diss.splice di+1, 0,
                                start: ins[0]
                                insert: ins[1] 
                            break                           
                    else # insert is behind span
                        diss.splice di+1, 0,
                            start: ins[0]
                            insert: ins[1]
                        break
                if di < 0 # insert before all spans
                    diss.splice 0, 0,
                        start: ins[0]
                        insert: ins[1]
            else
                diss.push
                    start: ins[0]
                    insert: ins[1]
        if diss.length
            for di in [diss.length-1..0]
                d = diss[di]
                if d.insert?
                    line = line.slice(0, d.start) + d.insert + line.slice(d.start)
                else
                    clrzd = @colorize d.match, d.stack.reverse()
                    line = line.slice(0, d.start) + clrzd + line.slice(d.start+d.match.length)
        enspce line
                
highlight.init()

module.exports = highlight

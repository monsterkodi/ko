#  0000000  000   000  000   000  000000000   0000000   000   000
# 000        000 000   0000  000     000     000   000   000 000 
# 0000000     00000    000 0 000     000     000000000    00000  
#      000     000     000  0000     000     000   000   000 000 
# 0000000      000     000   000     000     000   000  000   000

{log, $, fs, noon, path, _
}      = require 'kxk'
encode = require '../tools/encode'
matchr = require '../tools/matchr'

class Syntax
    
    @matchrConfigs = {}
    @syntaxNames = []
    
    @spanForText: (text) -> @spanForTextAndSyntax text, 'ko'
    @spanForTextAndSyntax: (text, n) -> 
        
        l = ""
        diss = @dissForTextAndSyntax text, n
        if diss?.length
            last = 0
            for di in [0...diss.length]
                d = diss[di]
                style = d.styl? and d.styl.length and " style=\"#{d.styl}\"" or ''
                spc = ''
                for sp in [last...d.start]
                    spc += '&nbsp;'
                last  = d.start + d.match.length
                clss  = d.clss? and d.clss.length and " class=\"#{d.clss}\"" or ''
                clrzd = "<span#{style}#{clss}>#{spc}#{encode d.match}</span>"
                l += clrzd
        l

    @rangesForTextAndSyntax: (line, n) ->
        matchr.ranges Syntax.matchrConfigs[n], line

    @dissForTextAndSyntax: (line, n, opt) ->
        matchr.dissect matchr.ranges(Syntax.matchrConfigs[n], line), opt

    @lineForDiss: (dss) -> 
        l = ""
        for d in dss
            l = _.padEnd l, d.start
            l += d.match
        l

    constructor: (@editor) ->
        @name ='txt'
        @diss = []
        @colors = {}

    #  0000000  000      00000000   0000000   00000000 
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000  
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    clear: -> @diss = []

    # 0000000    000   0000000   0000000
    # 000   000  000  000       000     
    # 000   000  000  0000000   0000000 
    # 000   000  000       000       000
    # 0000000    000  0000000   0000000 

    dissForLineIndex: (lineIndex) -> 
        Syntax.dissForTextAndSyntax @editor.line(lineIndex), @name

    getDiss: (li, opt) ->
        if not @diss[li]?
            rgs = matchr.ranges Syntax.matchrConfigs[@name], @editor.line(li)
            diss = matchr.dissect rgs, opt
            @diss[li] = diss
        @diss[li]
    
    setDiss: (li, dss) ->
        @diss[li] = dss
        @diss[li]
            
    #  0000000   0000000   000       0000000   00000000 
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000  
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000
    
    colorForClassnames: (clss) ->
        if not @colors[clss]?
            div = document.createElement 'div'
            div.className = clss
            document.body.appendChild div
            @colors[clss] = window.getComputedStyle(div).color
            div.remove()
        return @colors[clss]

    colorForStyle: (styl) ->
        if not @colors[styl]?
            div = document.createElement 'div'
            div.style = styl
            document.body.appendChild div
            @colors[styl] = window.getComputedStyle(div).color
            div.remove()
        return @colors[styl]

    #  0000000  000   000  00000000  0000000     0000000   000   000   0000000 
    # 000       000   000  000       000   000  000   000  0000  000  000      
    # 0000000   000000000  0000000   0000000    000000000  000 0 000  000  0000
    #      000  000   000  000       000   000  000   000  000  0000  000   000
    # 0000000   000   000  00000000  0000000    000   000  000   000   0000000 
    
    @shebang: (line) ->
        if line.startsWith "#!"
            lastWord = _.last line.split /[\s\/]/
            switch lastWord
                when 'python' then return 'py'
                when 'node'   then return 'js'
                when 'bash'   then return 'sh'
                else 
                    if lastWord in @syntaxNames
                        return lastWord
        'txt'
    
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   
    
    @init: ->
        syntaxDir = "#{__dirname}/../../syntax/"
        for syntaxFile in fs.readdirSync syntaxDir
            syntaxName = path.basename syntaxFile, '.noon'
            patterns = noon.load path.join syntaxDir, syntaxFile
            if patterns.ko?.extnames?
                extnames = patterns.ko.extnames
                delete patterns.ko
                config = matchr.config patterns
                for syntaxName in extnames
                    @syntaxNames.push syntaxName
                    @matchrConfigs[syntaxName] = config
            else
                @syntaxNames.push syntaxName
                @matchrConfigs[syntaxName] = matchr.config patterns

Syntax.init()
module.exports = Syntax

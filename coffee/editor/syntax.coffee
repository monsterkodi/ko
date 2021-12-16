###
 0000000  000   000  000   000  000000000   0000000   000   000
000        000 000   0000  000     000     000   000   000 000
0000000     00000    000 0 000     000     000000000    00000
     000     000     000  0000     000     000   000   000 000
0000000      000     000   000     000     000   000  000   000
###

kxk = require 'kxk'
{ _, elem, fs, kerror, kstr, last, matchr, noon, slash } = kxk

klor = require 'klor'

class Syntax
    
    @: (@name, @getLine, @getLines) ->

        log 'Syntax' @name
        @diss   = []
        @colors = {}

    # 0000000    000   0000000   0000000
    # 000   000  000  000       000
    # 000   000  000  0000000   0000000
    # 000   000  000       000       000
    # 0000000    000  0000000   0000000

    newDiss: (li) ->
        
        klor.dissect([@getLine li], @name)[0]

    getDiss: (li) ->

        @diss[li] ?= @newDiss li

    setDiss: (li, dss) ->

        @diss[li] = dss

    #  0000000  00000000  000000000  000      000  000   000  00000000   0000000  
    # 000       000          000     000      000  0000  000  000       000       
    # 0000000   0000000      000     000      000  000 0 000  0000000   0000000   
    #      000  000          000     000      000  000  0000  000            000  
    # 0000000   00000000     000     0000000  000  000   000  00000000  0000000   
    
    setLines: (lines) ->
        
        @diss = klor.dissect lines, @name
            
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) ->

        for change in changeInfo.changes

            [di,li,ch] = [change.doIndex, change.newIndex, change.change]

            switch ch
                when 'changed'  then @diss[di] = @newDiss di
                when 'deleted'  then @diss.splice di, 1
                when 'inserted' then @diss.splice di, 0, @newDiss di

    #  0000000   0000000   000       0000000   00000000
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000

    colorForClassnames: (clss) ->

        if not @colors[clss]?

            div = elem class: clss
            document.body.appendChild div
            computedStyle = window.getComputedStyle div
            color = computedStyle.color
            opacity = computedStyle.opacity
            if opacity != '1'
                color = 'rgba(' + color.slice(4, color.length-2) + ', ' + opacity + ')'
            @colors[clss] = color
            div.remove()

        return @colors[clss]

    colorForStyle: (styl) ->

        if not @colors[styl]?
            div = elem 'div'
            div.style = styl
            document.body.appendChild div
            @colors[styl] = window.getComputedStyle(div).color
            div.remove()
            
        return @colors[styl]

    schemeChanged: -> @colors = {}

    ###
     0000000  000000000   0000000   000000000  000   0000000
    000          000     000   000     000     000  000
    0000000      000     000000000     000     000  000
         000     000     000   000     000     000  000
    0000000      000     000   000     000     000   0000000
    ###

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
                clrzd = "<span#{style}#{clss}>#{spc}#{kstr.encode d.match}</span>"
                l += clrzd
        l

    @rangesForTextAndSyntax: (line, n) ->

        matchr.ranges Syntax.matchrConfigs[n], line

    @dissForTextAndSyntax: (text, n) ->

        if n not in ['browser' 'ko' 'commandline' 'macro' 'term' 'test']
            result = klor.ranges text, n
        else
            if not n? or not Syntax.matchrConfigs[n]?
                return kerror "no syntax? #{n}"
            result = matchr.dissect matchr.ranges Syntax.matchrConfigs[n], text
        result

    @lineForDiss: (dss) ->

        l = ""
        for d in dss
            l = _.padEnd l, d.start
            l += d.match
        l

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

            syntaxName = slash.basename syntaxFile, '.noon'
            patterns = noon.load slash.join syntaxDir, syntaxFile

            patterns['\\w+']       = 'text'   # this ensures that all ...
            patterns['[^\\w\\s]+'] = 'syntax' # non-space characters match

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

        # klor.init()
        @syntaxNames = @syntaxNames.concat klor.exts

Syntax.init()
module.exports = Syntax

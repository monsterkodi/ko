#  0000000  000   000  000   000  000000000   0000000   000   000
# 000        000 000   0000  000     000     000   000   000 000 
# 0000000     00000    000 0 000     000     000000000    00000  
#      000     000     000  0000     000     000   000   000 000 
# 0000000      000     000   000     000     000   000  000   000
{
$}     = require '../tools/tools'
matchr = require '../tools/matchr'
log    = require '../tools/log'
_      = require 'lodash'
path   = require 'path'
noon   = require 'noon'
fs     = require 'fs'

class Syntax
    
    @matchrConfigs = {}
    @syntaxNames = []

    constructor: (@editor) ->
        @name ='txt'
        @diss = []
        @colors = {}

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  
    
    changed: (changeInfo, action) ->
        if changeInfo.sorted.length
            for [li, ch, oi] in changeInfo.sorted
                switch ch
                    when 'deleted'  then @diss.splice oi, 1
                    when 'inserted' then @diss.splice oi, 0, @dissForLineIndex li
                    when 'changed'  then @diss[oi] = @dissForLineIndex li

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
        Syntax.dissForTextAndSyntax @editor.lines[lineIndex], @name

    @rangesForTextAndSyntax: (line, n) ->
        matchr.ranges Syntax.matchrConfigs[n], line

    @dissForTextAndSyntax: (line, n, opt) ->
        matchr.dissect matchr.ranges(Syntax.matchrConfigs[n], line), opt

    getDiss: (li, opt) ->
        # log "?? #{@diss.length} #{li}" if @editor.name is 'terminal'
        if not @diss[li]?
            # log "++ #{li} #{@diss[li]}" if @editor.name is 'terminal'
            rgs = matchr.ranges Syntax.matchrConfigs[@name], @editor.lines[li]
            diss = matchr.dissect rgs, opt
            @diss[li] = diss
            
        # log "#{li}", @diss[li] if @editor.name is 'terminal' and @diss[li]?.length
        @diss[li]
    
    setDiss: (li, dss) ->
        @diss[li] = dss
        @diss[li]
    
    @lineForDiss: (dss) -> 
        l = ""
        for d in dss
            l = _.padEnd l, d.start
            l += d.match
        l
    
    @nameForFile: (file) ->
        extn = path.extname(file).slice(1)
        if extn in @syntaxNames
            return extn
        return 'txt' # todo: look at shebang
    
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

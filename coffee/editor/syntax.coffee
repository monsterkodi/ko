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

class syntax
    
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
    
    changed: (changeInfo) ->
        if changeInfo.sorted.length
            # log "syntax.sorted diss[0..5] before", @diss.slice 0,5 if @editor.name is 'editor'
            for [li, ch, oi] in changeInfo.sorted                
                switch ch
                    when 'deleted'  then @diss.splice oi, 1
                    when 'inserted' then @diss.splice oi, 0, @dissForLineIndex li
                    when 'changed'  then @diss[oi] = @dissForLineIndex li
            # log "syntax.sorted diss[0..5] after", @diss.slice 0,5 if @editor.name is 'editor'
                
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
        syntax.dissForTextAndSyntax @editor.lines[lineIndex], @name

    @rangesForTextAndSyntax: (line, n) ->
        matchr.ranges syntax.matchrConfigs[n], line

    @dissForTextAndSyntax: (line, n, opt) ->
        matchr.dissect matchr.ranges(syntax.matchrConfigs[n], line), opt

    getDiss: (li, opt) ->
        # log "?? #{@diss.length} #{li}" if @editor.name is 'terminal'
        if not @diss[li]?
            # log "++ #{li} #{@diss[li]}" if @editor.name is 'terminal'
            rgs = matchr.ranges syntax.matchrConfigs[@name], @editor.lines[li]
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
    
    #  0000000   0000000   000       0000000   00000000 
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000  
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000
    
    colorForClassnames: (clss) ->
        if not @colors[clss]?
            div = document.createElement 'div'
            div.className = clss
            $('main').appendChild div
            @colors[clss] = window.getComputedStyle(div).color
            div.remove()
        return @colors[clss]
        
    # 000  000   000  000  000000000
    # 000  0000  000  000     000   
    # 000  000 0 000  000     000   
    # 000  000  0000  000     000   
    # 000  000   000  000     000   
    
    @init: ->
        syntaxDir = "#{__dirname}/../../syntax/"
        for syntaxFile in fs.readdirSync syntaxDir
            syntaxName = path.basename syntaxFile, '.noon'
            @syntaxNames.push syntaxName
            patterns = noon.load path.join syntaxDir, syntaxFile
            @matchrConfigs[syntaxName] = matchr.config patterns

syntax.init()
module.exports = syntax
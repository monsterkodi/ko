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
        if changeInfo.deleted.length or changeInfo.inserted.length or changeInfo.changed.length
            # log 'syntax.sorted', changeInfo.sorted if @editor.name is 'terminal'
            for [li, change] in changeInfo.sorted
                switch change
                    when 'deleted'  then @diss.splice li, 1
                    when 'inserted' then @diss.splice li, 0, @dissForLineIndex li
                    when 'changed'  then @diss[li] = @dissForLineIndex li
                
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

    @dissForTextAndSyntax: (line, n) ->
        matchr.dissect matchr.ranges syntax.matchrConfigs[n], line

    getDiss: (li) ->
        # log "?? #{@diss.length} #{li}" if @editor.name is 'terminal'
        if not @diss[li]?
            # log "++ #{li} #{@diss[li]}" if @editor.name is 'terminal'
            diss = matchr.dissect matchr.ranges syntax.matchrConfigs[@name], @editor.lines[li]
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
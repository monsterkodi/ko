
#  0000000  000   000  000   000  000000000   0000000   000   000
# 000        000 000   0000  000     000     000   000   000 000
# 0000000     00000    000 0 000     000     000000000    00000
#      000     000     000  0000     000     000   000   000 000
# 0000000      000     000   000     000     000   000  000   000

{ error, log, str, post, elem, empty, fs, noon, path, _
}          = require 'kxk'
encode     = require '../tools/encode'
matchr     = require '../tools/matchr'
stringDiss = require '../tools/stringdiss'

class Syntax

    constructor: (@editor) ->

        @name       = @editor.syntaxName ? 'txt'
        @diss       = []
        @colors     = {}
        @unbalanced = []

        post.on 'schemeChanged', @onSchemeChanged

    del: -> post.removeListener 'schemeChanged', @onSchemeChanged

    # 0000000    000   0000000   0000000
    # 000   000  000  000       000
    # 000   000  000  0000000   0000000
    # 000   000  000       000       000
    # 0000000    000  0000000   0000000

    newDiss: (li) ->
        
        text = @editor.line li

        if not text?
            return error "#{@editor.name} no line at index #{li}? #{@editor.numLines()}"

        unbalanced = @unbalancedForLine li
                
        diss = Syntax.dissForTextAndSyntax text, @name, unbalanced: unbalanced
                    
        @setUnbalanced li, unbalanced.stack
            
        diss

    getDiss: (li) ->

        if not @diss[li]?
            @diss[li] = @newDiss li
                
        @diss[li]

    setDiss: (li, dss) ->

        @diss[li] = dss
        dss

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) ->

        for change in changeInfo.changes
            
            [di,li,ch] = [change.doIndex, change.newIndex, change.change]
            
            switch change.change
                
                when 'changed'  
                    
                    @diss[di] = @newDiss di
                        
                when 'deleted'  
                    
                    @deleteUnbalanced di
                    @diss.splice di, 1
                    
                when 'inserted' 
                    
                    @insertUnbalanced di
                    @diss.splice di, 0, @newDiss di
                    
    # 000   000  000   000  0000000     0000000   000       0000000   000   000   0000000  00000000  0000000    
    # 000   000  0000  000  000   000  000   000  000      000   000  0000  000  000       000       000   000  
    # 000   000  000 0 000  0000000    000000000  000      000000000  000 0 000  000       0000000   000   000  
    # 000   000  000  0000  000   000  000   000  000      000   000  000  0000  000       000       000   000  
    #  0000000   000   000  0000000    000   000  0000000  000   000  000   000   0000000  00000000  0000000    
    
    unbalancedForLine: (li) ->
        open = null
        for u in @unbalanced
            if u.line < li
                if open
                    open = null
                else
                    open = u
            if u.line >= li
                if open
                    console.log "unbalanced #{li} open", str(open.stack[0])
                    return open: open.stack[0]
                break
        if open?
            console.log "unbalanced #{li} open", str(open.stack[0])
            open: open.stack[0]
        else
            {}
    
    setUnbalanced: (li, stack) ->
        _.remove @unbalanced, (u) -> u.line == li
        if stack?
            @unbalanced.push line:li, stack:stack 
            @unbalanced.sort (a,b) -> a.line - b.line
            
        @dumpUnbalanced()
            
    deleteUnbalanced: (li) ->
        
        _.remove @unbalanced, (u) -> u.line == li
        _.each @unbalanced, (u) -> u.line -= 1 if u.line >= li
        @dumpUnbalanced()
        
    insertUnbalanced: (li) ->
        
        _.each @unbalanced, (u) -> u.line += 1 if u.line >= li
        @dumpUnbalanced()
        
    dumpUnbalanced: (li) ->
        
        # console.log str @unbalanced if not empty @unbalanced
            
    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    clear: -> 
        @diss = []
        @unbalanced = []

    #  0000000   0000000   000       0000000   00000000
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000

    colorForClassnames: (clss) ->

        if not @colors[clss]?

            div = elem class: clss
            document.body.appendChild div
            color = window.getComputedStyle(div).color
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

    onSchemeChanged: => @colors = {}

    #  0000000  000000000   0000000   000000000  000   0000000
    # 000          000     000   000     000     000  000
    # 0000000      000     000000000     000     000  000
    #      000     000     000   000     000     000  000
    # 0000000      000     000   000     000     000   0000000

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

    @dissForTextAndSyntax: (text, n, opt) ->
        
        return error "no syntax? #{n}" if not n? or not Syntax.matchrConfigs[n]?
        diss = matchr.dissect matchr.ranges(Syntax.matchrConfigs[n], text), opt
        if opt?.unbalanced?.open or /[\'\"]/.test text
            diss = stringDiss diss, opt?.unbalanced ? {}
        diss

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

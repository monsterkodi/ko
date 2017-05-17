
#  0000000  000   000  000   000  000000000   0000000   000   000
# 000        000 000   0000  000     000     000   000   000 000
# 0000000     00000    000 0 000     000     000000000    00000
#      000     000     000  0000     000     000   000   000 000
# 0000000      000     000   000     000     000   000  000   000

{ error, log, str, post, elem, fs, noon, path, _
}      = require 'kxk'
encode = require '../tools/encode'
matchr = require '../tools/matchr'

class Syntax

    constructor: (@editor) ->

        @name = @editor.syntaxName ? 'txt'
        @diss = []
        @colors = {}

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

        Syntax.dissForTextAndSyntax text, @name

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
                when 'changed'  then @diss[change.doIndex] = @newDiss li
                when 'deleted'  then @diss.splice change.doIndex, 1
                when 'inserted' then @diss.splice change.doIndex, 0, @newDiss li
        
    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    clear: -> @diss = []

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

        diss = matchr.dissect matchr.ranges(Syntax.matchrConfigs[n], text), opt
        if 0 <= text.indexOf '"'
            diss = Syntax.stringDiss text, diss
        diss

    @lineForDiss: (dss) ->

        l = ""
        for d in dss
            l = _.padEnd l, d.start
            l += d.match
        l

    #  0000000  000000000  00000000   000  000   000   0000000   
    # 000          000     000   000  000  0000  000  000        
    # 0000000      000     0000000    000  000 0 000  000  0000  
    #      000     000     000   000  000  000  0000  000   000  
    # 0000000      000     000   000  000  000   000   0000000   
    
    @stringDiss: (text, dss) ->
        
        console.log 'stringDiss ---- ', text,  str dss        
        stack = []
        for d in dss
            
            if d.clss == 'syntax string marker double' and d.match == '"""'
                d.cls.pop()
                d.cls.push 'triple'
                d.clss = d.cls.join ' '
            
            switch d.clss
                
                when 'syntax string marker triple', 'syntax string marker double', 'syntax string marker single'
                    
                    console.log d.match, ' -- ', d.clss
                    if not stack.length
                        
                        stack.push diss:d, inner:[]
                        console.log 'pushed', str stack
                        continue
                        
                    else if _.first(stack).diss.clss == d.clss
                        
                        dissInner = stack.pop()
                        for inner in dissInner.inner
                            inner.cls = ['text', 'string'].concat [_.last dissInner.diss.cls]
                            inner.clss = inner.cls.join ' '
                        console.log 'popped', str dissInner
                        continue
                            
            if stack.length
                _.first(stack).inner.push d
                console.log 'inner', str stack
            
        console.log "result diss ---- '#{text}'", str dss
        "1#{2}3"
        dss
        
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

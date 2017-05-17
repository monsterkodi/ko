
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
        console.log text, n
        diss = matchr.dissect matchr.ranges(Syntax.matchrConfigs[n], text), opt
        if /[\'\"]/.test text
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
        result = []

        addString = (strDiss) ->
            
            console.log 'addString', str strDiss
            last = _.last result
            if ('marker' not in end.cls) and last.start + last.match.length == strDiss.start
                last.match += strDiss.match
            else
                strDiss.cls = ['text', 'string'].concat [_.last last.cls]
                strDiss.clss = strDiss.cls.join ' '
                result.push strDiss
            console.log 'add string result:', str result

        addInterpolation = (interDiss) ->
            
            console.log 'addInterpolation', str interDiss
            result.push interDiss
            console.log 'add interpolation result:', str result
            
        while d = dss.shift()

            top = _.last stack
            end = _.last result
            
            if d.clss == 'syntax string marker double' and d.match == '"""'
                d.cls.pop()
                d.cls.push 'triple'
                d.clss = d.cls.join ' '
                # console.log 'triple convert'

            if 'interpolation' in d.cls # interpolation start
                console.log 'interpolation!', str d

                if top?
                    if 'interpolation' in top.cls
                        if 'open' in d.cls
                            top.clss = 'syntax string interpolation open'
                            top.cls = d.clss.split ' '
                            top.match += d.match
                            result.push top
                            console.log 'joined open interpolation', str result
                            continue
                        else
                            console.log 'dafuk?'
                            
                # push half open interpolation to stack
                
                stack.push d
                console.log 'pushed interpolation stack:', str stack
                continue

            if top? and 'interpolation' in top.cls # interpolation end
                if d.clss.endsWith 'bracket close'
                    console.log 'pop interpolation!', str d
                    stack.pop()
                    d.clss = 'syntax string interpolation close'
                    d.cls = d.clss.split ' '
                    result.push d
                    continue
                
            switch d.clss

                when 'syntax string marker triple', 'syntax string marker double', 'syntax string marker single'

                    if d.clss != 'syntax string marker triple'
                        if d.match.length > 1 # split multiple string markers
                            console.log 'splice non triple'
                            dss.unshift
                                match: d.match.slice 1
                                start: d.start + 1
                                clss:  d.clss
                                cls:   _.clone d.cls
                                cid:   d.cid # needed?
                            d.match = d.match.slice 0, 1

                    if end? # escaped string markers ...
                        if end.match.endsWith '\\'
                            if numberOfCharsAtEnd(end.match, '\\') % 2
                                if end.start + end.match.length == d.start
                                    console.log 'escaped top:', str top
                                    if top? and 'interpolation' not in top.cls
                                        console.log 'inside escaped', d.match
                                        end.match += d.match
                                    else
                                        console.log 'outside escaped', d.match
                                        result.push d
                                    console.log 'escaped result:', str result
                                    continue

                    if top? and top.clss == d.clss # pop matching string marker
                        
                        stack.pop()
                        result.push d
                        
                    else if top? and 'interpolation' not in top.cls
                        
                        addString d

                    else 
                    
                        # push string marker onto stack
                        
                        result.push d
                        stack.push d
                        console.log 'pushed string stack:', str stack
                        console.log 'pushed string result:', str result
                        
                    continue
                    
            if top? 
                if 'interpolation' in top.cls
                    addInterpolation d
                else 
                    addString d
            else
                console.log 'push stray', str d
                result.push d
                console.log 'pushed stray result:', str result         

        while stack.length
            console.log 'unbalanced!', str stack
            stack.pop()

        console.log "text -- #{text} -- result:", str result

        result

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

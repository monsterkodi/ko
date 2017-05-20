###
  0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
  000   000  000   000  000      000   000  0000  000  000       000       000   000
  0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
  000   000  000   000  000      000   000  000  0000  000       000       000   000
  0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
###
{ empty, str, log, _
}      = require 'kxk'
matchr = require '../tools/matchr'

class Balancer

    constructor: (@syntax) ->

        @editor = @syntax.editor
        @unbalanced = []
        @regions =
            # regexp:        clss: 'regexp',         open: '/',   close: '/'
            singleString:  clss: 'string single',  open: "'",   close: "'"
            doubleString:  clss: 'string double',  open: '"',   close: '"'
            lineComment:   clss: 'comment',        open: "#",   close: null
            multiString:   clss: 'string triple',  open: '"""', close: '"""', multi: true
            multiComment:  clss: 'comment triple', open: '###', close: '###', multi: true
            interpolation: clss: 'interpolation',  open: '#{',  close: '}',   multi: true

    dissForLine: (li) ->

        text = @editor.line li

        if not text?
            return error "#{@editor.name} no line at index #{li}? #{@editor.numLines()}"

        @mergeRegions @parse(text, li), text, li

    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000
    # 000000000  0000000   0000000    000  0000  0000000
    # 000 0 000  000       000   000  000   000  000
    # 000   000  00000000  000   000   0000000   00000000

    mergeRegions: (regions, text, li) ->
        # console.log str regions
        
        if u = @getUnbalanced li
            unbalanced = u.clss
            console.log "mergeRegions #{li}", unbalanced
        
        merged = []
        p = 0

        addDiss = (start, end) =>
            slice = text.slice start, end
            Syntax = require './syntax'
            if unbalanced?
                diss = @dissForClass slice, 0, unbalanced
            else
                diss = Syntax.dissForTextAndSyntax slice, @syntax.name
            if start
                _.each diss, (d) -> d.start += start
            merged = merged.concat diss

        while region = regions.shift()

            if region.start > p
                addDiss p, region.start
            if region.clss == 'interpolation'
                addDiss region.start, region.start+region.match.length
            else
                merged.push region
            p = region.start + region.match.length

        if p < text.length
            addDiss p, text.length

        merged

    # 0000000    000   0000000   0000000
    # 000   000  000  000       000     
    # 000   000  000  0000000   0000000 
    # 000   000  000       000       000
    # 0000000    000  0000000   0000000 
    
    dissForClass: (text, start, clss) ->

        if /^(\s*\#\s*)?(\s*0[0\s]+)$/.test text
            clss += ' header'
        
        diss = []
        m = ''
        p = s = start
        while p < text.length

            c = text[p++]

            if c != ' '
                s = p-1 if m == ''
                m += c
                continue if p < text.length

            if m != ''
                diss.push
                    start: s
                    match: m
                    clss:  clss
                m = ''
        diss
        
    ###
    00000000    0000000   00000000    0000000  00000000
    000   000  000   000  000   000  000       000
    00000000   000000000  0000000    0000000   0000000
    000        000   000  000   000       000  000
    000        000   000  000   000  0000000   00000000
    ###
    
    parse: (text, li) ->

        p       = 0
        escapes = 0
        
        stack   = []
        result  = []

        unbalanced     = null
        keepUnbalanced = null
        
        if unbalanced = @getUnbalanced li            
            console.log "parse #{li}", str unbalanced
            stack.push 
                start:  0
                region: unbalanced
                fake:   true
        
        #  0000000   0000000   00     00  00     00  00000000  000   000  000000000
        # 000       000   000  000   000  000   000  000       0000  000     000
        # 000       000   000  000000000  000000000  0000000   000 0 000     000
        # 000       000   000  000 0 000  000 0 000  000       000  0000     000
        #  0000000   0000000   000   000  000   000  00000000  000   000     000

        pushComment = (comment) =>

            start = p-1+comment.open.length

            result.push
                start: p-1
                match: comment.open
                clss:  comment.clss + ' marker'

            commentText = text.slice start
            if commentText.length
                result = result.concat @dissForClass text, start, comment.clss
                    
        # 00000000   000   000   0000000  000   000     000000000   0000000   00000000
        # 000   000  000   000  000       000   000        000     000   000  000   000
        # 00000000   000   000  0000000   000000000        000     000   000  00000000
        # 000        000   000       000  000   000        000     000   000  000
        # 000         0000000   0000000   000   000        000      0000000   000

        pushTop = ->

            if  top = _.last stack
                lr  = _.last result
                le  = lr? and lr.start + lr.match.length or 0

                if p-1 - le > 0 and le < text.length-1

                    top = _.cloneDeep top
                    top.start = le
                    top.match = text.slice le, p-1
                    top.clss  = top.region.clss
                    delete top.region

                    while top.match.length and top.match[0] == ' '
                        top.match = top.match.slice 1
                        top.start += 1

                    if top.match.length
                        result.push top

        # 00000000   00000000   0000000   000   0000000   000   000
        # 000   000  000       000        000  000   000  0000  000
        # 0000000    0000000   000  0000  000  000   000  000 0 000
        # 000   000  000       000   000  000  000   000  000  0000
        # 000   000  00000000   0000000   000   0000000   000   000

        pushRegion = (region) ->

            pushTop()

            result.push
                start: p-1
                match: region.open
                clss:  region.clss + ' marker'

            stack.push
                start:  p-1+region.open.length
                region: region

        # 00000000    0000000   00000000
        # 000   000  000   000  000   000
        # 00000000   000   000  00000000
        # 000        000   000  000
        # 000         0000000   000

        popRegion = (rest) ->

            top = _.last stack

            if top? and rest.startsWith top.region.close

                pushTop()
                popped = stack.pop()
                if popped.fake
                    keepUnbalanced = 
                        start:  p-1
                        region: top.region

                result.push
                    start: p-1
                    clss:  top.region.clss + ' marker'
                    match: top.region.close

                p += top.region.close.length-1
                return top
            false

        # 000       0000000    0000000   00000000
        # 000      000   000  000   000  000   000
        # 000      000   000  000   000  00000000
        # 000      000   000  000   000  000
        # 0000000   0000000    0000000   000

        while p < text.length

            ch = text[p++]
            if escapes and ch != '\\'
                if escapes > 0 and escapes % 2
                    escapes = 0
                    continue
                escapes = 0
            if ch == ' ' then continue

            top  = _.last stack
            rest = text.slice p-1

            if not top or top.region.clss == 'interpolation'

                if popRegion rest
                    continue

                if rest.startsWith @regions.multiComment.open
                    pushRegion @regions.multiComment
                    continue

                else if rest.startsWith @regions.multiString.open
                    pushRegion @regions.multiString
                    continue

                else if not top and rest.startsWith @regions.lineComment.open
                    pushComment @regions.lineComment
                    return result

                if ch == @regions.regexp?.open
                    pushRegion @regions.regexp
                    continue
                if ch == @regions.singleString.open
                    pushRegion @regions.singleString
                    continue
                if ch == @regions.doubleString.open
                    pushRegion @regions.doubleString
                    continue

            else # string or regexp

                if ch == '\\' then escapes++

                if top.region.clss in ['string double', 'string triple']
                    if rest.startsWith @regions.interpolation.open
                        pushRegion @regions.interpolation
                        continue

                if popRegion rest
                    continue
             
        stack.pop() if _.last(stack)?.fake
        
        if stack.length
            # console.log "unbalanced? #{li}", str stack
            @setUnbalanced li, _.last stack
        else if keepUnbalanced
            @setUnbalanced li, keepUnbalanced
            
        result

    # 000   000  000   000  0000000     0000000   000       0000000   000   000   0000000  00000000  0000000
    # 000   000  0000  000  000   000  000   000  000      000   000  0000  000  000       000       000   000
    # 000   000  000 0 000  0000000    000000000  000      000000000  000 0 000  000       0000000   000   000
    # 000   000  000  0000  000   000  000   000  000      000   000  000  0000  000       000       000   000
    #  0000000   000   000  0000000    000   000  0000000  000   000  000   000   0000000  00000000  0000000

    getUnbalanced: (li) ->
        
        open = null
        for u in @unbalanced
            if u.line < li
                if open
                    open = null
                else
                    open = u
            if u.line >= li
                if open
                    # console.log "unbalanced #{li} region", str(open.region)
                    return open.region
                break
                
        if open?
            # console.log "unbalanced #{li} open", str(open.region)
            return open.region
            
        null

    setUnbalanced: (li, startRegion) ->
        
        _.remove @unbalanced, (u) -> u.line == li
        if startRegion?
            @unbalanced.push 
                line:  li
                start: startRegion.start
                region:startRegion.region
            @unbalanced.sort (a,b) -> a.line - b.line
            @dumpUnbalanced()

    deleteLine: (li) ->

        _.remove @unbalanced, (u) -> u.line == li
        _.each @unbalanced, (u) -> u.line -= 1 if u.line >= li
        @dumpUnbalanced()

    insertLine: (li) ->

        _.each @unbalanced, (u) -> u.line += 1 if u.line >= li
        @dumpUnbalanced()

    dumpUnbalanced: ->

        console.log '@unbalanced:', str @unbalanced if not empty @unbalanced

    clear: ->

        @unbalanced = []

module.exports = Balancer

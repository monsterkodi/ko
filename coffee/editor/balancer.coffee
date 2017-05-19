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
            regexp:        clss: 'regexp',         open: '/',   close: '/'
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

        @mergeRegions @parseText(text), text

    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000
    # 000000000  0000000   0000000    000  0000  0000000
    # 000 0 000  000       000   000  000   000  000
    # 000   000  00000000  000   000   0000000   00000000

    mergeRegions: (regions, text) ->
        console.log str regions
        merged = []
        p = 0

        addDiss = (start, end) =>
            slice = text.slice start, end
            Syntax = require './syntax'
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
        
    ###
    00000000    0000000   00000000    0000000  00000000
    000   000  000   000  000   000  000       000
    00000000   000000000  0000000    0000000   0000000
    000        000   000  000   000       000  000
    000        000   000  000   000  0000000   00000000
    ###
    
    parseText: (text, stack=[]) ->

        p = 0
        result = []
        escapeCount = 0

        #  0000000   0000000   00     00  00     00  00000000  000   000  000000000
        # 000       000   000  000   000  000   000  000       0000  000     000
        # 000       000   000  000000000  000000000  0000000   000 0 000     000
        # 000       000   000  000 0 000  000 0 000  000       000  0000     000
        #  0000000   0000000   000   000  000   000  00000000  000   000     000

        pushComment = (comment) ->

            start = p-1+comment.open.length

            result.push
                start: p-1
                match: comment.open
                clss:  comment.clss + ' marker'

            commentText = text.slice start
            if commentText.length

                if /^(\s*0[0\s]+)$/.test commentText
                    clss = comment.clss + ' header'
                else
                    clss = comment.clss

                m = ''
                p = s = start
                while p < text.length

                    c = text[p++]

                    if c != ' '
                        s = p-1 if m == ''
                        m += c
                        continue if p < text.length

                    if m != ''
                        result.push
                            start: s
                            match: m
                            clss:  clss
                        m = ''

        # 00000000   000   000   0000000  000   000     000000000   0000000   00000000
        # 000   000  000   000  000       000   000        000     000   000  000   000
        # 00000000   000   000  0000000   000000000        000     000   000  00000000
        # 000        000   000       000  000   000        000     000   000  000
        # 000         0000000   0000000   000   000        000      0000000   000

        pushTop = ->

            if  top = _.last stack
                lr  = _.last result
                le  = lr.start + lr.match.length

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
                stack.pop()

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
            if escapeCount and ch != '\\'
                if escapeCount > 0 and escapeCount % 2
                    escapeCount = 0
                    continue
                escapeCount = 0
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

                if ch == @regions.regexp.open
                    pushRegion @regions.regexp
                    continue
                if ch == @regions.singleString.open
                    pushRegion @regions.singleString
                    continue
                if ch == @regions.doubleString.open
                    pushRegion @regions.doubleString
                    continue

            else # string or regexp

                if ch == '\\' then escapeCount++

                if top.region.clss in ['string double', 'string triple']
                    if rest.startsWith @regions.interpolation.open
                        pushRegion @regions.interpolation
                        continue

                if popRegion rest
                    continue

        # log "parse #{text} -- result:", result if not empty result
        result

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
                    # console.log "unbalanced #{li} open", str(open.stack[0])
                    return open: open.stack[0]
                break
        if open?
            # console.log "unbalanced #{li} open", str(open.stack[0])
            open: open.stack[0]
        else
            {}

    setUnbalanced: (li, stack) ->
        _.remove @unbalanced, (u) -> u.line == li
        if stack?
            @unbalanced.push line:li, stack:stack
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

        # console.log str @unbalanced if not empty @unbalanced

    clear: ->

        @unbalanced = []

module.exports = Balancer

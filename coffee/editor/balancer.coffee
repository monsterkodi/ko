###
0000000     0000000   000       0000000   000   000   0000000  00000000  00000000
000   000  000   000  000      000   000  0000  000  000       000       000   000
0000000    000000000  000      000000000  000 0 000  000       0000000   0000000
000   000  000   000  000      000   000  000  0000  000       000       000   000
0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000
###
{ valid, empty, str, log, error, _ } = require 'kxk'

matchr = require '../tools/matchr'

class Balancer

    constructor: (@syntax, @getLine) ->

        @unbalanced = []
        
    # 00000000  000  000      00000000  000000000  000   000  00000000   00000000  
    # 000       000  000      000          000      000 000   000   000  000       
    # 000000    000  000      0000000      000       00000    00000000   0000000   
    # 000       000  000      000          000        000     000        000       
    # 000       000  0000000  00000000     000        000     000        00000000  
    
    setFileType: (fileType) ->

        lineComment = switch fileType
            when 'cpp', 'cc', 'hpp', 'h', 'styl', 'pug', 'md', 'rs' then '//'
            else '#'

        multiComment = switch fileType
            when 'cpp', 'cc', 'hpp', 'h', 'styl', 'pug', 'rs' then open: '/*',   close: '*/'
            when 'html', 'md'                                 then open: '<!--', close: '-->'
            else                                                   open: '###',  close: '###'
        
        @regions =
            # regexp:        clss: 'regexp',         open: '/',   close: '/'
            singleString:  clss: 'string single',  open: "'",   close: "'"
            doubleString:  clss: 'string double',  open: '"',   close: '"'
            lineComment:   clss: 'comment',        open: lineComment, close: null, force: true

        @regions.multiComment = 
            clss:  'comment triple'
            open:  multiComment.open
            close: multiComment.close
            multi: true

        @headerRegExp = new RegExp("^(\\s*#{_.escapeRegExp @regions.lineComment.open}\\s*)?(\\s*0[0\\s]+)$")
            
        switch fileType
            
            when 'coffee'
                @regions.multiString   = clss: 'string triple',  open: '"""', close: '"""', multi: true
                @regions.interpolation = clss: 'interpolation',  open: '#{',  close: '}',   multi: true
                
            when 'noon'
                @regions.lineComment.solo = true # only spaces before comments allowed
                
            when 'md'
                @regions.header5 = clss: 'markdown h5', open: '#####', close: null, solo: true                     
                @regions.header4 = clss: 'markdown h4', open: '####', close: null, solo: true 
                @regions.header3 = clss: 'markdown h3', open: '###', close: null, solo: true 
                @regions.header2 = clss: 'markdown h2', open: '##', close: null, solo: true 
                @regions.header1 = clss: 'markdown h1', open: '#', close: null, solo: true 
                
                # @regions.listitem1 = clss: 'markdown li1', open: '-', close: null, solo: true,         maxX:0
                # @regions.listitem2 = clss: 'markdown li2', open: '-', close: null, solo: true, minX:1, maxX:4 
                # @regions.listitem3 = clss: 'markdown li3', open: '-', close: null, solo: true, minX:5

        @openRegions = _.filter @regions, (r) -> r.close == null
                
    # 0000000    000   0000000   0000000
    # 000   000  000  000       000     
    # 000   000  000  0000000   0000000 
    # 000   000  000       000       000
    # 0000000    000  0000000   0000000 

    dissForLine: (li) ->
        
        text = @getLine li

        if not text?
            return error "dissForLine -- no line at index #{li}?"

        diss = @mergeRegions @parse(text, li), text, li                
        console.log 'dissForLine', li, text, diss
        diss
      
    dissForLineAndRanges: (line, rgs) ->
        
        regions = @mergeRegions @parse(line, 0), line, 0
        diss = matchr.merge regions, matchr.dissect rgs
        console.log 'dissForLine', line, rgs, diss
        diss
        
    # 00     00  00000000  00000000    0000000   00000000
    # 000   000  000       000   000  000        000
    # 000000000  0000000   0000000    000  0000  0000000
    # 000 0 000  000       000   000  000   000  000
    # 000   000  00000000  000   000   0000000   00000000

    mergeRegions: (regions, text, li) ->
        
        unbalanced = @getUnbalanced li
        
        merged = []
        p = 0
        
        addDiss = (start, end, force) =>
            
            slice = text.slice start, end
            if not force and unbalanced? and _.last(unbalanced).region.clss != 'interpolation'
                diss = @dissForClass slice, 0, _.last(unbalanced).region.clss
            else
                if end < text.length-1
                    slice += ' x' # little hack to get function call detection to work
                    diss = @syntax.constructor.dissForTextAndSyntax slice, @syntax.name
                    diss.pop()
                else
                    diss = @syntax.constructor.dissForTextAndSyntax slice, @syntax.name
            if start
                _.each diss, (d) -> d.start += start
            merged = merged.concat diss

        while region = regions.shift()

            if region.start > p
                addDiss p, region.start
            if region.clss == 'interpolation'
                addDiss region.start, region.start+region.match.length, true
            else
                merged.push region
            p = region.start + region.match.length

        if p < text.length
            addDiss p, text.length

        merged
    
    dissForClass: (text, start, clss) ->

        if @headerRegExp.test text
            clss += ' header'
        
        diss = []
        m = ''
        p = s = start
        while p < text.length

            c = text[p]
            p += 1
            
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
        keepUnbalanced = []
        
        if unbalanced = @getUnbalanced li            
            for lineStartRegion in unbalanced
                stack.push 
                    start:  0
                    region: lineStartRegion.region
                    fake:   true
        
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

        # 00000000   0000000   00000000    0000000  00000000  
        # 000       000   000  000   000  000       000       
        # 000000    000   000  0000000    000       0000000   
        # 000       000   000  000   000  000       000       
        # 000        0000000   000   000   0000000  00000000  

        pushForceRegion = (region) =>

            start = p-1+region.open.length

            result.push
                start: p-1
                match: region.open
                clss:  region.clss + ' marker'

            if start < text.length-1
                result = result.concat @dissForClass text, start, region.clss
                    
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

            if top?.region.close? and rest.startsWith top.region.close

                pushTop()
                stack.pop()
                if top.fake
                    keepUnbalanced.unshift
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

            ch = text[p]
            p += 1
            
            top = _.last stack
            
            if ch == '\\' then escapes++
            else
                if ch == ' ' then continue
                
                if escapes
                    if escapes % 2 and (ch != "#" or top and top.region.clss != 'interpolation')
                        escapes = 0 # character is escaped, 
                        continue    # just continue to next
                    escapes = 0
                    
                if ch == ':' 
                    if @syntax.name == 'json' # highlight json dictionary keys
                        if _.last(result).clss == 'string double marker'
                            if result.length > 1 and result[result.length-2].clss == 'string double'
                                result[result.length-2].clss = 'string dictionary key'
                                result.push
                                    start: p-1
                                    match: ch
                                    clss:  'dictionary marker'
                                continue
                    
            rest = text.slice p-1

            if not top or top.region.clss == 'interpolation'

                if popRegion rest
                    continue

                if  @regions.multiComment and rest.startsWith @regions.multiComment.open
                    pushRegion @regions.multiComment
                    continue

                else if @regions.multiString and rest.startsWith @regions.multiString.open
                    pushRegion @regions.multiString
                    continue

                else if not top
                    forced = false
                    pushed = false
                    for openRegion in @openRegions
                        if rest.startsWith openRegion.open
                            if openRegion.minX? and p-1 < openRegion.minX then continue
                            if openRegion.maxX? and p-1 > openRegion.maxX then continue
                            if not openRegion.solo or empty text.slice(0, p-1).trim()
                                if openRegion.force
                                    pushForceRegion openRegion
                                    forced = true
                                else
                                    pushRegion openRegion
                                    pushed = true
                                break
                    break if forced
                    continue if pushed

                if @regions.regexp and ch == @regions.regexp.open
                    pushRegion @regions.regexp
                    continue
                if ch == @regions.singleString.open
                    pushRegion @regions.singleString
                    continue
                if ch == @regions.doubleString.open
                    pushRegion @regions.doubleString
                    continue

            else # string or regexp

                if top.region.clss in ['string double', 'string triple']
                    if @regions.interpolation and rest.startsWith @regions.interpolation.open
                        pushRegion @regions.interpolation
                        continue

                if popRegion rest
                    continue
             
        realStack = stack.filter (s) -> not s.fake and s.region.close != null and s.region.multi
        
        closeStackItem = (stackItem) =>
            result = result.concat @dissForClass text, _.last(result).start + _.last(result).match.length, stackItem.region.clss
            
        if realStack.length
            # console.log "unbalanced #{li} stack:", str(realStack), '\nresult:', str(result)                
            @setUnbalanced li, realStack
            closeStackItem _.last realStack 
        else if keepUnbalanced.length
            # console.log "keeper #{li} keepUnbalanced:", str(keepUnbalanced), '\nresult:', str(result)                
            @setUnbalanced li, keepUnbalanced
            if stack.length
                closeStackItem _.last stack 
        else
            if stack.length and _.last(stack).region.close == null
                closeStackItem _.last stack 
            # console.log "balanced #{li}", text
            @setUnbalanced li
           
        console.log 'parse result', result if valid result
        result

    # 000   000  000   000  0000000     0000000   000       0000000   000   000   0000000  00000000  0000000
    # 000   000  0000  000  000   000  000   000  000      000   000  0000  000  000       000       000   000
    # 000   000  000 0 000  0000000    000000000  000      000000000  000 0 000  000       0000000   000   000
    # 000   000  000  0000  000   000  000   000  000      000   000  000  0000  000       000       000   000
    #  0000000   000   000  0000000    000   000  0000000  000   000  000   000   0000000  00000000  0000000

    getUnbalanced: (li) ->
        
        stack = []
        for u in @unbalanced
            if u.line < li
                if stack.length and _.last(stack).region.clss == u.region.clss
                    stack.pop()
                else
                    stack.push u
            if u.line >= li
                break
                
        if stack.length
            # console.log "unbalanced #{li} stack", str(stack)
            return stack
            
        null

    setUnbalanced: (li, stack) ->
        
        # console.log "setUnbalanced #{li} stack:", str(stack)
        _.remove @unbalanced, (u) -> u.line == li
        if stack?
            _.each stack, (s) -> s.line = li
            @unbalanced = @unbalanced.concat stack
            @unbalanced.sort (a,b) ->
                if a.line == b.line
                    a.start - b.start
                else
                    a.line - b.line
            @dumpUnbalanced()

    deleteLine: (li) ->

        _.remove @unbalanced, (u) -> u.line == li
        _.each @unbalanced, (u) -> u.line -= 1 if u.line >= li
        @dumpUnbalanced()

    insertLine: (li) ->

        _.each @unbalanced, (u) -> u.line += 1 if u.line >= li
        @dumpUnbalanced()

    dumpUnbalanced: ->

        # console.log '@unbalanced:', str @unbalanced if not empty @unbalanced

    clear: ->

        @unbalanced = []

module.exports = Balancer

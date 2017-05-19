
# 0000000     0000000   000       0000000   000   000   0000000  00000000  00000000 
# 000   000  000   000  000      000   000  0000  000  000       000       000   000
# 0000000    000000000  000      000000000  000 0 000  000       0000000   0000000  
# 000   000  000   000  000      000   000  000  0000  000       000       000   000
# 0000000    000   000  0000000  000   000  000   000   0000000  00000000  000   000

{ empty, str, log, _
}      = require 'kxk'
matchr = require '../tools/matchr'

class Balancer

    constructor: (@syntax) ->
        
        @editor = @syntax.editor
        @unbalanced = []
        @regions = 
            singleString:  clss: 'string single',  open: "'",   close: "'"
            doubleString:  clss: 'string double',  open: '"',   close: '"'
            lineComment:   clss: 'comment',        open: "#",   close: null
            regexp:        clss: 'regexp',         open: '/',   close: '/'
            multiString:   clss: 'string triple',  open: '"""', close: '"""', multi: true
            multiComment:  clss: 'comment triple', open: '###', close: '###', multi: true
            interpolation: clss: 'interpolation',  open: '#{',  close: '}',   multi: true
        
    dissForLine: (li) ->

        text = @editor.line li

        if not text?
            return error "#{@editor.name} no line at index #{li}? #{@editor.numLines()}" 
        
        if @editor.name == 'editor'
            sections = @parseText text
            if not empty sections
                log 'sections:', sections
                # merged = @mergeSections sections
                # log 'merged:', merged
            
        unbalanced = @unbalancedForLine li        
        
        Syntax = require './syntax'
        diss = Syntax.dissForTextAndSyntax text, @syntax.name, unbalanced: unbalanced
        
        @setUnbalanced li, unbalanced.stack
        
        diss

    # 00     00  00000000  00000000    0000000   00000000  
    # 000   000  000       000   000  000        000       
    # 000000000  0000000   0000000    000  0000  0000000   
    # 000 0 000  000       000   000  000   000  000       
    # 000   000  00000000  000   000   0000000   00000000  
    
    mergeSections: (sections) ->
        
        sections.sort (a,b) -> a.start - b.start
        
        merged = []
        stack  = []
        
        for i in [0...sections.length]
            sect = sections[i]
            if i < sections.length-1
                next = sections[i+1] 
            else next = null
            ss = sect.start
            sl = sect.match.length
            se = ss + sl
            ns = next?.start ? se
           
            if ns >= se
                merged.push sect
            else
                slice = _.cloneDeep sect
                slice.match = sect.match.slice 0, ns - ss
                merged.push slice
                stack.push sect
                continue if stack.length == 1
                
            while top = _.last stack
                te = top.start + top.match.length
                if te < ss
                    pop = stack.pop()
                    lm = _.last merged
                    le = lm.start + lm.match.length
                    pop.match = pop.match.slice le - pop.start
                    pop.start = le
                    merged.push pop
                else 
                    if te > ns
                        ts = top.start
                        slice = _.cloneDeep top
                        slice.match = top.match.slice se - ts, ns - ts
                        slice.start = se
                        merged.push slice
                    break
        merged
        
    # 00000000    0000000   00000000    0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 00000000   000000000  0000000    0000000   0000000   
    # 000        000   000  000   000       000  000       
    # 000        000   000  000   000  0000000   00000000  
    
    parseText: (text, stack=[]) ->
 
        escapeCount = 0
        result = []
        p = 0

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
                    result.push top
        
        pushRegion = (region) ->
            
            pushTop()
                
            result.push
                start: p-1
                match: region.open
                clss:  region.clss + ' marker'
                
            stack.push 
                start:  p-1+region.open.length
                region: region
        
        popRegion = (rest) ->
            
            top = _.last stack
            
            if rest.startsWith top?.region.close
                
                pushTop()
                stack.pop()
                
                result.push
                    start: p-1
                    clss:  top.region.clss + ' marker'
                    match: top.region.close
                    
                p += top.region.close.length-1
                return top
            false
                
        while p < text.length
            
            ch = text[p++]
            if escapeCount and ch != '\\' then escapeCount = 0
            if ch == ' ' then continue
            
            top  = _.last stack
            rest = text.slice p-1 
            
            if not top or top.clss == 'interpolation'

                if popRegion rest
                    continue
                
                if rest.startsWith @regions.multiComment.open
                    pushRegion @regions.multiComment
                    continue
                    
                else if not top and rest.startsWith @regions.lineComment.open
                    start = p-1+@regions.lineComment.open.length

                    result.push
                        start: p-1
                        match: @regions.lineComment.open
                        clss:  @regions.lineComment.clss + ' marker'

                    result.push
                        start: start
                        match: text.slice start
                        clss:  @regions.lineComment.clss
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
                    
            else # string interpolation or regexp
                
                if ch == '\\' then escapeCount++
                else if escapeCount > 0 and escapeCount % 2
                    continue

                if top.region.open == '"' and rest.startsWith @regions.interpolation.open
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

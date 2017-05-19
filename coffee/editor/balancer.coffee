
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
        @info = 
            stringChars:   ['"', "'"]
            lineComment:   "#"
            regexp:        '/'
            multiString:   open: '"""', close: '"""'
            multiComment:  open: '###', close: '###'
            interpolation: open: '#{',  close: '}'
        
    dissForLine: (li) ->

        text = @editor.line li

        if not text?
            return error "#{@editor.name} no line at index #{li}? #{@editor.numLines()}"  
        
        if @editor.name == 'editor'
            sections = @parseText text
            if not empty sections
                merged = @mergeSections sections
                log 'merged:', merged
            
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
            next = sections[i+1] if i < sections.length-1
            ss   = sect.start
            sl   = sect.match.length
            se   = ss + sl
            ns   = next?.start ? se
           
            if ns >= se
                merged.push sect
            else
                slice = _.cloneDeep sect
                slice.match = sect.match.slice 0, ns - ss
                merged.push slice
                stack.push sect
                
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
                        slice.match = sect.match.slice se - ts, ns - ts
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
        
        pushSingle = (ch) ->
            
            if ch == @info.regexp
                clss = 'regexp'
            else
                clss = 'string ' + (ch == "'" and 'single' or 'double')
            
            stack.push 
                start: p
                char:  ch
                clss:  clss
                
        popSingle = (ch) ->
            
            top = _.last stack
            if top?.char == ch
                pop = stack.pop()
                pop.match = text.slice pop.start, p-1
                delete pop.char
                result.push pop
                return pop
            false
        
        pushMulti = (multi, type) ->
            
            stack.push
                start: p-1+multi.open.length
                multi: multi
                clss:  type

        popMulti = (rest) ->
            
            top = _.last stack
            if top?.multi?.open? and rest.startsWith top.multi.close
                pop = stack.pop()
                pop.match = text.slice pop.start, p-1
                delete pop.multi
                result.push pop
                return pop
            false
                
        while p < text.length
            
            ch = text[p++]
            if escapeCount and ch != '\\' then escapeCount = 0
            if ch == ' ' then continue
            
            top  = _.last stack
            rest = text.slice p-1 
            
            if not top or top.clss == 'interpolation'

                if popMulti rest
                    continue
                
                if rest.startsWith @info.multiComment.open
                    pushMulti @info.multiComment, 'comment'
                    continue
                    
                else if not top and rest.startsWith @info.lineComment
                    start = p-1+@info.lineComment.length
                    result.push 
                        start: start
                        match: text.slice start
                        clss:  'comment'
                    # log 'comment to end of line', result
                    return result
                    
                if ch == @info.regexp or ch in @info.stringChars
                    pushSingle ch
                    continue
                    
            else # string interpolation or regexp
                
                if ch == '\\' then escapeCount++
                else if escapeCount > 0 and escapeCount % 2
                    continue

                if popMulti rest
                    continue
                    
                if top.char == '"' and rest.startsWith @info.interpolation.open
                    pushMulti @info.interpolation, 'interpolation'
                    continue
                    
                if ch == @info.regexp or ch in @info.stringChars
                    if popSingle ch
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
